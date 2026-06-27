/**
 * Server-backed version history — host `/history` revision chain.
 *
 * The local IndexedDB store (`store.ts`) keeps per-device PM-doc
 * snapshots. When the editor is backed by a host that retains
 * per-revision `.docx` bytes (the Go gateway's `host.RevisionStore`),
 * this module surfaces those revisions in the same `VersionSnapshot`
 * shape so the panel renders them unchanged, and downloads a chosen
 * revision's bytes for restore.
 *
 * Opt-in: only used when a `ServerVersionBackend` is passed to
 * `<DocxEditor versionBackend=… />`. Absent it, nothing here runs and
 * the local path is untouched.
 */
import type { VersionSnapshot } from './store';
export interface ServerVersionBackend {
    /** REST base of the host, e.g. `http://localhost:8080`. */
    baseUrl: string;
    /** Host document id (the share-link / room docId). */
    docId: string;
}
/** List the host's revision chain as `VersionSnapshot[]`, newest-first
 *  (matching the local list's display order). Throws on a non-OK
 *  response so the caller can fall back / surface an error. */
export declare function fetchServerVersions(b: ServerVersionBackend, signal?: AbortSignal): Promise<VersionSnapshot[]>;
/** Download one revision's `.docx` bytes for restore. */
export declare function downloadServerVersion(b: ServerVersionBackend, version: number): Promise<ArrayBuffer>;
//# sourceMappingURL=server-source.d.ts.map