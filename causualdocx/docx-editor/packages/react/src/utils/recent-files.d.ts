/**
 * IndexedDB-backed "recent files" list. Captures the user's last N
 * opened documents so the Home screen can let them reopen with one
 * click. Distinct from autosave (single-slot crash recovery) and
 * version history (per-doc timeline) — this is "what docs have I been
 * working with lately, across sessions".
 *
 * Retention: capped at MAX_ENTRIES, oldest evicted first. Entries
 * older than STALE_AFTER_MS are silently dropped on list.
 *
 * Mirrors `services/sheet/apps/web/src/recent-files/store.ts` — same
 * keyspace, same auto-increment + indexed model, same prune-on-record
 * design.
 */
export interface RecentFile {
    /** IDB auto-increment key. Optional at insert time. */
    id?: number;
    name: string;
    /** The full `.docx` buffer — clicking the card replays this through `loadBuffer`. */
    buffer: ArrayBuffer;
    /** Byte size for the human-readable hint on the card. */
    size: number;
    /** ms-since-epoch at last open. Determines sort + freshness. */
    openedAt: number;
}
/**
 * Record (or refresh) a doc in the recent-files list. If an entry with
 * the same name already exists, it's updated in place (same id, new
 * openedAt + buffer); otherwise a new entry is appended. Triggers a
 * prune pass to enforce the cap.
 */
export declare function recordRecentFile(rec: Omit<RecentFile, 'id'>): Promise<void>;
export declare function listRecentFiles(): Promise<RecentFile[]>;
export declare function deleteRecentFile(id: number): Promise<void>;
/** Human-readable size — "23 KB", "1.4 MB". */
export declare function formatSize(bytes: number): string;
//# sourceMappingURL=recent-files.d.ts.map