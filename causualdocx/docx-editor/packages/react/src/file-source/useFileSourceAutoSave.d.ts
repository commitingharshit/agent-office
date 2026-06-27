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
import type { FileSource } from './types';
/**
 * Result of one auto-save tick. `skip` means "nothing changed worth
 * saving" (no ref attached, editor returned null bytes, or a prior
 * save is still in flight); `ok` carries the etag the FileSource
 * returned; `err` carries the throw.
 */
export type AutoSaveTickResult = {
    kind: 'skip';
    reason: 'no-ref' | 'no-bytes' | 'in-flight';
} | {
    kind: 'ok';
    etag: string;
    savedAt: Date;
} | {
    kind: 'err';
    err: unknown;
};
export interface PerformAutoSaveDeps {
    /** Returns the live editor ref (or null when the editor isn't mounted). */
    getRef: () => AutoSaveEditorRef | null;
    fileSource: FileSource;
    docId: string;
    name?: string;
}
/**
 * One-shot save round-trip. Pure with respect to React — takes its
 * dependencies as plain args + getRef, returns a discriminated
 * result. The React hook wraps this with in-flight bookkeeping and
 * state.
 */
export declare function performAutoSave(deps: PerformAutoSaveDeps): Promise<AutoSaveTickResult>;
/**
 * Minimal subset of DocxEditorRef the hook needs. Typed structurally
 * so the hook doesn't depend on the full editor surface — the host
 * passes a ref the editor populates; the hook only ever calls
 * `save()`.
 */
export interface AutoSaveEditorRef {
    save: (options?: {
        selective?: boolean;
    }) => Promise<ArrayBuffer | null>;
}
export interface UseFileSourceAutoSaveOptions {
    /** FileSource to push saved bytes into. */
    fileSource: FileSource;
    /** The doc id within `fileSource`. */
    docId: string;
    /**
     * React ref pointing at the editor instance. Must expose a
     * compatible `save()` shape — DocxEditorRef satisfies this.
     * Plain ref so the hook works with both `useRef<DocxEditorRef>()`
     * and any other ref shape.
     */
    editorRef: React.RefObject<AutoSaveEditorRef | null>;
    /**
     * Tick interval in ms. Default 30s — same cadence as the editor's
     * own localStorage auto-save.
     */
    interval?: number;
    /** Hard-off switch. Default true. */
    enabled?: boolean;
    /**
     * Optional file-name to attach on first-save (when docId is null
     * — see save() below). The hook doesn't watch this for changes;
     * the host should call FileSource.rename() for that.
     */
    name?: string;
    /**
     * Fires after every successful tick. Hosts can use this to update
     * a "Saved at HH:MM" indicator without subscribing to the hook's
     * status.
     */
    onSaved?: (when: Date, etag: string) => void;
    /**
     * Fires when a save tick throws. The hook keeps trying on
     * subsequent ticks; the host decides whether to surface a banner.
     */
    onError?: (err: unknown) => void;
}
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export interface UseFileSourceAutoSaveReturn {
    status: AutoSaveStatus;
    /** Last successful save time. null until the first save lands. */
    lastSavedAt: Date | null;
    /** Last error caught — kept for status='error' rendering. */
    lastError: unknown;
    /**
     * Force a save right now (bypassing the interval). Returns when
     * the save round-trip finishes. Useful for "Save & close" buttons
     * or beforeunload handlers the host owns.
     */
    flush: () => Promise<void>;
}
/**
 * Schedules periodic saves of the editor's current .docx bytes into
 * the configured FileSource. See module doc for scope notes.
 */
export declare function useFileSourceAutoSave(opts: UseFileSourceAutoSaveOptions): UseFileSourceAutoSaveReturn;
//# sourceMappingURL=useFileSourceAutoSave.d.ts.map