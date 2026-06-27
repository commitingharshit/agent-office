/**
 * IDB-backed version-history snapshot store. Separate object store
 * from the single-slot autosave (`utils/idb.ts` STORE_AUTOSAVE) — the
 * two solve different problems:
 *
 *   - **Autosave**: one slot, overwritten on every change. "I crashed
 *     mid-edit — recover the doc." Lifetime: until explicit save / discard.
 *   - **Version history**: many slots, captured at coarse-grained
 *     moments (every ~10 min while dirty, or on explicit "Save version").
 *     "I want to roll back to how it looked an hour ago." Lifetime:
 *     kept until pruned or hand-deleted.
 *
 * The fine-grained live edit feed (`useEditHistory`) is a third layer
 * and stays in-memory — it would balloon IDB with full-doc JSON per
 * coalesced edit, which isn't what users actually want for "roll back
 * a version" anyway.
 *
 * Retention rules (mirrors sheets):
 *   - Manual snapshots are NEVER auto-pruned — the user asked for them.
 *   - Auto snapshots are kept by count: `AUTO_RETENTION_PER_DOC` newest
 *     auto entries per `docId` survive each write.
 *
 * Storage cost: each snapshot is a full ProseMirror doc JSON. A typical
 * 5-page doc is ~30-80 KB; a 100-page report a few MB. With 30 auto +
 * N manual snapshots per doc, a power user crosses tens of MB of IDB
 * use. Future: lz-string compression on write would cut that ~4×.
 *
 * Ported from sheets' `apps/web/src/version-history/store.ts` —
 * adapted to scope by `docId` (sheets is single-active-workbook;
 * the editor switches docs without unmount).
 */
import type { LiveVersionFeed } from './live-feed';
export type VersionKind = 'auto' | 'manual';
export interface VersionSnapshot {
    /** IDB auto-increment key, assigned on first persist. Optional for
     *  the in-memory `VersionDraft` shape the capture hook hands in. */
    id?: number;
    /** Document the snapshot belongs to. Lets multiple docs share the
     *  single object store without their histories bleeding together. */
    docId: string;
    kind: VersionKind;
    /** User-supplied label for manual versions; derived (e.g. "Untitled
     *  — auto") for auto versions — kept on the record so list rendering
     *  doesn't have to branch. */
    name: string;
    /** Wall-clock ms at capture. Used for time grouping in the panel. */
    savedAt: number;
    /** Source format at capture, for round-trip on later "Save as" from
     *  a preview. Currently always `'docx'`; here as a forward hook. */
    sourceFormat: string | null;
    /** Full ProseMirror doc JSON — `view.state.doc.toJSON()` output.
     *  Undefined for server-backed entries (their bytes are fetched on
     *  restore, not held in the list). */
    data: unknown;
    /** Approximate JSON byte size, set on persist for UI display. */
    size?: number;
    /** Set for server-backed revisions (host `/history`): the host's
     *  monotonic version number. When present the panel restores by
     *  downloading that revision's `.docx` instead of reading `data`. */
    serverVersion?: number;
}
export type VersionDraft = Omit<VersionSnapshot, 'id'>;
/**
 * Persist a draft snapshot. Returns the assigned id. Triggers a prune
 * pass that drops the oldest `auto` entries for `draft.docId` past
 * `AUTO_RETENTION_PER_DOC`.
 */
export declare function writeVersion(draft: VersionDraft): Promise<number>;
export declare function listVersions(docId: string): Promise<VersionSnapshot[]>;
export declare function readVersion(id: number): Promise<VersionSnapshot | null>;
export declare function renameVersion(id: number, name: string): Promise<void>;
export declare function deleteVersion(id: number): Promise<void>;
/** Drop every snapshot for `docId`. Used by the panel's "Clear
 *  version history" action (yet-to-be-added) + tests. */
export declare function clearVersionsFor(docId: string): Promise<void>;
export declare function setLiveFeed(f: LiveVersionFeed | null): void;
//# sourceMappingURL=store.d.ts.map