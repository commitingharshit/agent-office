/**
 * Coarse-grained snapshot capture for the editor's version history.
 *
 * Distinct from `useEditHistory` (the fine-grained, in-memory feed
 * powering the Activity tab): this hook writes a small number of
 * deliberate snapshots into IDB so the user can roll back to "how
 * the doc looked an hour ago" across refreshes / crashes.
 *
 *   - **Idle interval** ~10 min while the doc is dirty since the
 *     last capture. Power users edit continuously; one snapshot per
 *     minute would balloon IDB without changing the user-visible
 *     story. Idle users get nothing — no point capturing identical
 *     state.
 *   - **Explicit save** via `saveNamedVersion(name)` exposed from
 *     this module. The File menu's "Save version…" calls it; manual
 *     snapshots are never auto-pruned.
 *
 * Skipped in co-edit mode — when Yjs/y-websocket lands, the server
 * owns the authoritative state and we'd just be duplicating local
 * copies. Wiring follows: callers pass `enabled: !roomId`.
 *
 * Ported from `services/sheet/apps/web/src/version-history/useVersionHistoryCapture.ts`
 * — adapted to a ProseMirror view (observe via a plugin instead of
 * Univer's command service) and to a per-doc `docId`.
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
import { useEffect, useRef } from 'react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { writeVersion } from './store';
import { getLiveVersionFeed } from './useLiveVersionList';
const DEFAULT_IDLE_INTERVAL_MS = 10 * 60 * 1000;
const CAPTURE_PLUGIN_KEY = new PluginKey('version-history-capture');
/** Imperative escape hatch outside React — the File menu can wire
 *  a no-hook button into this. The hook installs the latest
 *  implementation; if no hook is mounted, calls return `null`. */
let latestImperativeSave = null;
export function saveNamedVersion(name) {
    return latestImperativeSave ? latestImperativeSave(name) : Promise.resolve(null);
}
export function useVersionHistoryCapture(options) {
    const { docId, view, enabled = true, idleIntervalMs = DEFAULT_IDLE_INTERVAL_MS, sourceFormat = null, } = options;
    // Ensure the live feed exists before any subscriber mounts.
    getLiveVersionFeed();
    // Hold latest options + view in a ref so the capture closure reads
    // the current values on every call, not whatever was in scope when
    // `useRef` first ran (which would leave `view` stale at null).
    const optsRef = useRef({ docId, sourceFormat, view });
    optsRef.current = { docId, sourceFormat, view };
    // Module-scope dirty flag — set by the observe plugin, read by the
    // interval. A ref so re-renders don't reset it.
    const dirtyRef = useRef(false);
    const doCapture = useRef((kind, name) => __awaiter(this, void 0, void 0, function* () {
        const { view: liveView, docId: liveDocId, sourceFormat: liveFmt } = optsRef.current;
        if (!liveView || !liveDocId)
            return null;
        try {
            const data = liveView.state.doc.toJSON();
            const id = yield writeVersion({
                docId: liveDocId,
                kind,
                name,
                savedAt: Date.now(),
                sourceFormat: liveFmt,
                data,
            });
            return id;
        }
        catch (err) {
            console.warn('[version-history] capture failed', err);
            return null;
        }
    }));
    // Refresh the imperative save closure on every render so the most
    // recent `view` / `docId` are captured.
    useEffect(() => {
        latestImperativeSave = (name) => doCapture.current('manual', name.trim() || 'Untitled version');
        return () => {
            // Only clear if we're still the registered impl; another
            // mount may have taken over.
            if (latestImperativeSave)
                latestImperativeSave = null;
        };
    });
    // Attach the dirty-tracking plugin + spin up the idle interval.
    // Effect deps INTENTIONALLY ONLY `[view]` — re-reconfiguring the view
    // when docId / idleIntervalMs change while the same view is mounted
    // tears the plugin set mid-update, which surfaces as PM's
    // `updateOuterDeco` crash when a doc fixture is loading and
    // NodeViews are being reconciled. docId + sourceFormat are read
    // from optsRef at capture time so they stay live without re-running
    // the effect. enabled-flip-to-false is handled by the early return
    // (no plugin attached, no interval) — same for view going null.
    useEffect(() => {
        if (!enabled || !view)
            return;
        // Reset dirty on (re)attach so a fresh view doesn't inherit the
        // previous one's pending state.
        dirtyRef.current = false;
        const plugin = new Plugin({
            key: CAPTURE_PLUGIN_KEY,
            state: {
                init() {
                    return null;
                },
                apply(tr) {
                    if (tr.docChanged)
                        dirtyRef.current = true;
                    return null;
                },
            },
        });
        const nextState = view.state.reconfigure({
            plugins: [...view.state.plugins, plugin],
        });
        view.updateState(nextState);
        const tick = setInterval(() => {
            if (!dirtyRef.current)
                return;
            const liveDocId = optsRef.current.docId;
            if (!liveDocId)
                return;
            void doCapture.current('auto', deriveAutoLabel(liveDocId)).then((id) => {
                if (id != null)
                    dirtyRef.current = false;
            });
        }, idleIntervalMs);
        return () => {
            clearInterval(tick);
            try {
                const detached = view.state.reconfigure({
                    plugins: view.state.plugins.filter((p) => p !== plugin),
                });
                view.updateState(detached);
            }
            catch (_a) {
                // View may have been destroyed mid-cleanup; ignore.
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, view]);
    return {
        saveNamedVersion: (name) => doCapture.current('manual', name.trim() || 'Untitled version'),
    };
}
function deriveAutoLabel(docId) {
    // Short, scannable label — the panel already shows a relative
    // timestamp, so this just answers "what was this snapshot of?".
    const base = docId.replace(/\.docx$/i, '') || 'Document';
    return `${base} — auto`;
}
//# sourceMappingURL=useVersionHistoryCapture.js.map