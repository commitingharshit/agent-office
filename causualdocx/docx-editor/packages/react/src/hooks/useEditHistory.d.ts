import type { EditorView } from 'prosemirror-view';
export interface EditHistoryEntry {
    /** Stable id within this session — used as React key + ARIA. */
    id: string;
    /** Time the entry FIRST opened (ms epoch). Coalesced extensions
     *  don't update this — sortable + human-readable timestamp. */
    time: number;
    /** Last time a transaction landed on this entry. */
    lastTouched: number;
    /** Display name of the author. "You" for solo; presence name in collab. */
    author: string;
    /** Short summary derived from transaction metadata + step count. */
    summary: string;
    /** Number of transactions coalesced into this entry. */
    txCount: number;
    /**
     * Doc JSON BEFORE the first transaction in this entry — what revert
     * restores. Captured once when the entry opens; not updated on
     * coalesce. May be large for big docs — we trade memory for revert
     * fidelity.
     */
    before: unknown;
}
export interface UseEditHistoryOptions {
    /** Display name shown for entries this client originates. */
    author?: string;
    /** Max entries to hold; older drop off. Default 500. */
    cap?: number;
    /** Coalesce window in ms — successive transactions within this
     *  window merge into the latest entry. Default 2000. */
    coalesceMs?: number;
}
export interface UseEditHistoryReturn {
    /** Newest-last entry list. Sort in the panel if you prefer
     *  newest-first display. */
    entries: EditHistoryEntry[];
    /** Replace the active document with the captured `before` state of
     *  the entry at `entry.id`. Wraps the change in a single transaction
     *  so it can itself be undone with Ctrl+Z. */
    revert: (entryId: string) => void;
    /** Drop all entries. Useful after explicit save / room rejoin. */
    clear: () => void;
    /**
     * Attach the capture plugin to an EditorView's state. Returns a
     * cleanup function the caller invokes on unmount. Most callers pass
     * an EditorView ref to `useEffect`:
     *
     *   useEffect(() => attach(view), [view]);
     */
    attach: (view: EditorView) => () => void;
    /**
     * Snapshot the live document as plain text — used by the diff view
     * to compute "after" for the latest entry (next-newer entry's
     * `before` provides "after" for older entries). Returns an empty
     * string when no view is attached.
     */
    getCurrentText: () => string;
    /**
     * Revert a SINGLE diff segment on the live document. Used by the
     * per-change accept/reject UI in the version-history panel.
     *
     * - `op: 'add'` — the segment's `text` was inserted in this entry;
     *   reverting deletes it from the live doc.
     * - `op: 'remove'` — the segment's `text` was removed in this
     *   entry; reverting puts it back at the matching context.
     *
     * `context` is the immediately-preceding kept text (last ~30 chars
     * of the kept run just before this segment). It disambiguates
     * identical substrings; without it, "hello" appearing in two
     * paragraphs would always revert the first occurrence.
     *
     * Returns `true` on success. Failures (text no longer found in the
     * live doc, view detached) return `false` — the panel surfaces a
     * toast in that case.
     */
    revertHunk: (op: 'add' | 'remove', text: string, context: string) => boolean;
}
export declare function useEditHistory(options?: UseEditHistoryOptions): UseEditHistoryReturn;
//# sourceMappingURL=useEditHistory.d.ts.map