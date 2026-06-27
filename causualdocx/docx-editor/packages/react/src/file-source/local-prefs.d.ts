/**
 * Per-source local preferences — the small slice of FileSource state
 * that's intentionally client-only: recent-files list, last-opened id.
 *
 * Why client-only:
 *   - Personal mode tracks "what did I last edit?" without a round
 *     trip; the server already knows what files exist (GET /files),
 *     it shouldn't also need to track UI focus state.
 *   - The recent list is allowed to skew across devices — a doc
 *     opened on the work laptop shouldn't necessarily show on the
 *     home laptop's recent strip.
 *
 * IndexedDB store: the editor's existing 'casual-docs' DB has an
 * autosave + recent-files + versions store. We add nothing new — both
 * preferences live in localStorage instead, because:
 *   - lastOpened is a single string scoped by source kind + user id
 *   - the recent list for FileSource is a derived view of the
 *     server-side list, not a separate persistent store
 *
 * This keeps the IDB schema fixed at v3 (see utils/idb.ts) and avoids
 * a migration just to hold a tiny string.
 */
import type { FileEntry } from './types';
/**
 * In-memory observer hub. We can't rely on IDB change events for
 * cross-tab fanout here, but a single-tab subscription model is what
 * the editor needs — watchRecent just wants to know when *this tab's*
 * personal source learned the file list changed.
 */
type Listener = (recent: FileEntry[]) => void;
export declare class RecentObserver {
    private listeners;
    private latest;
    watch(cb: Listener): () => void;
    set(entries: FileEntry[]): void;
    snapshot(): FileEntry[];
}
/** Read the last-opened doc id for the given scope. */
export declare function readLastOpened(scope: string): string | null;
/** Write the last-opened doc id (or clear with null). */
export declare function writeLastOpened(scope: string, id: string | null): void;
export {};
//# sourceMappingURL=local-prefs.d.ts.map