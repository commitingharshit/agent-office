/**
 * useFileSourceAutoSave — periodic auto-save from a DocxEditor into
 * a FileSource.
 *
 * Bridges the existing editor surface (`DocxEditorRef.save()` →
 * `.docx` ArrayBuffer) with the existing storage surface
 * (`FileSource.save(id, bytes)`) so a Mode 3 / Mode 2 user's edits
 * land in the gateway's host backend without anyone wiring it by
 * hand.
 *
 * Why this lives at the host-app layer and not inside DocxEditor:
 *
 *   - DocxEditor is the eigenpal-upstream surface; FileSource is
 *     casual-editor's storage abstraction. Mixing them inside the
 *     editor would force every embedder to take a FileSource shape
 *     they may not want.
 *   - Auto-save policy (interval, dirty-detection, beforeunload
 *     behaviour) is application-level. Keeping it as a hook leaves
 *     it composable.
 *
 * Scope notes
 *
 *   - "Snapshot on room drain" (the design intent in CLAUDE.md) is
 *     genuinely the WS gateway's responsibility — but the gateway
 *     can't decode Y.Doc state without a Bun worker pool. Auto-save
 *     on the CLIENT covers most of the same need: as long as the
 *     editor pushes its serialized .docx every N seconds, a sudden
 *     disconnect loses at most one tick's worth of edits. The
 *     remaining gap (room-drain snapshot) is left as a follow-up.
 *
 *   - Etag conflict handling is not implemented. Last-write-wins is
 *     fine for single-user Mode 3; multi-user co-edit through a
 *     single FileSource is a separate design problem.
 *
 *   - One save in flight at a time. A tick that lands while the
 *     previous save is still resolving is skipped — the next tick
 *     picks up the latest state.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
/**
 * One-shot save round-trip. Pure with respect to React — takes its
 * dependencies as plain args + getRef, returns a discriminated
 * result. The React hook wraps this with in-flight bookkeeping and
 * state.
 */
export function performAutoSave(deps) {
    return __awaiter(this, void 0, void 0, function* () {
        const ref = deps.getRef();
        if (!ref)
            return { kind: 'skip', reason: 'no-ref' };
        try {
            const bytes = yield ref.save({ selective: true });
            if (!bytes)
                return { kind: 'skip', reason: 'no-bytes' };
            const result = yield deps.fileSource.save(deps.docId, bytes, { name: deps.name });
            return { kind: 'ok', etag: result.etag, savedAt: new Date() };
        }
        catch (err) {
            return { kind: 'err', err };
        }
    });
}
/**
 * Schedules periodic saves of the editor's current .docx bytes into
 * the configured FileSource. See module doc for scope notes.
 */
export function useFileSourceAutoSave(opts) {
    const { fileSource, docId, editorRef, interval = 30000, enabled = true, name, onSaved, onError, } = opts;
    const [status, setStatus] = useState('idle');
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [lastError, setLastError] = useState(null);
    // Ref for "is a save currently in flight" — guarding setState
    // doesn't help because React batches updates; a plain mutable ref
    // gives us reliable in-flight detection.
    const inFlightRef = useRef(false);
    // Callbacks captured via ref so the tick effect doesn't restart
    // when the host passes a fresh arrow on every render. Same trick
    // PersonalAuthGate uses for onAuthenticated.
    const onSavedRef = useRef(onSaved);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onSavedRef.current = onSaved;
        onErrorRef.current = onError;
    }, [onSaved, onError]);
    // Snapshot of the host-controlled deps inside a ref so the timing
    // effect can read fresh values without re-firing on every change.
    const cfgRef = useRef({ fileSource, docId, editorRef, name });
    useEffect(() => {
        cfgRef.current = { fileSource, docId, editorRef, name };
    }, [fileSource, docId, editorRef, name]);
    /**
     * Performs one save round-trip. Returns the etag on success.
     * Sets status / lastSavedAt / lastError as a side effect.
     */
    const runSave = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (inFlightRef.current)
            return;
        const cfg = cfgRef.current;
        inFlightRef.current = true;
        setStatus('saving');
        try {
            const result = yield performAutoSave({
                getRef: () => cfg.editorRef.current,
                fileSource: cfg.fileSource,
                docId: cfg.docId,
                name: cfg.name,
            });
            switch (result.kind) {
                case 'ok':
                    setLastSavedAt(result.savedAt);
                    setStatus('saved');
                    setLastError(null);
                    (_a = onSavedRef.current) === null || _a === void 0 ? void 0 : _a.call(onSavedRef, result.savedAt, result.etag);
                    break;
                case 'err':
                    setStatus('error');
                    setLastError(result.err);
                    (_b = onErrorRef.current) === null || _b === void 0 ? void 0 : _b.call(onErrorRef, result.err);
                    break;
                case 'skip':
                    // Idle if there was nothing to save; preserve any prior
                    // 'saved' status when the skip was just "no edits since
                    // last tick" so the host's "Saved at HH:MM" sticks.
                    if (result.reason === 'no-ref')
                        setStatus('idle');
                    else
                        setStatus((s) => (s === 'saving' ? 'idle' : s));
                    break;
            }
        }
        finally {
            inFlightRef.current = false;
        }
    }), []);
    // Interval ticker. Re-arms when `enabled` or `interval` change;
    // every other dep is read via ref so the timer survives parent
    // re-renders.
    useEffect(() => {
        if (!enabled || interval <= 0)
            return;
        const id = setInterval(() => {
            void runSave();
        }, interval);
        return () => clearInterval(id);
    }, [enabled, interval, runSave]);
    // Flush the final interval of edits when the page is being hidden or
    // unloaded, so closing the tab between ticks doesn't lose up to one
    // interval's worth of edits (Phase 2 / audit doc 17 — "Option A").
    //
    // `visibilitychange` → 'hidden' is the reliable primary signal: it
    // fires on tab switch, app switch, and close, while the page is usually
    // still alive enough to complete an async save. `pagehide` backs it up
    // for the real unload / bfcache path. We deliberately avoid
    // `beforeunload` — browsers don't honour its async work and registering
    // it disables the back/forward cache. Best-effort, not a safety net for
    // crash / network-drop (that's the deferred server-side snapshot,
    // "Option C" in doc 18); it closes the common tab-close case.
    useEffect(() => {
        if (!enabled)
            return;
        const flushOnHide = () => {
            // Don't await — the page may be going away.
            void runSave();
        };
        const onVisibility = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                flushOnHide();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', flushOnHide);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', flushOnHide);
        };
    }, [enabled, runSave]);
    // Stable object identity so hosts can pass the return value into
    // dependency arrays without churn.
    return useMemo(() => ({
        status,
        lastSavedAt,
        lastError,
        flush: runSave,
    }), [status, lastSavedAt, lastError, runSave]);
}
//# sourceMappingURL=useFileSourceAutoSave.js.map