/**
 * WopiFileSource — the FileSource implementation for Mode 2 (WOPI).
 *
 * In Mode 2 the editor is embedded by a host that owns the file's
 * lifecycle. The user arrives with two pieces of state in the URL
 * (parsed by `extractWopiContext()` in select.ts):
 *
 *   docId        — the host file id (the WOPI `:id` path segment)
 *   accessToken  — JWT issued by the host / collab admin
 *
 * This source talks DIRECTLY to the collab server's WOPI host
 * endpoints (the same contract Casual Sheets uses):
 *
 *   GET  /wopi/files/:id             → CheckFileInfo (JSON metadata)
 *   GET  /wopi/files/:id/contents    → GetFile (raw bytes)
 *   POST /wopi/files/:id/contents    → PutFile (raw bytes; X-WOPI-ItemVersion)
 *
 * The JWT rides as `?access_token=…` on every call; collab verifies the
 * signature, that the token's `file_id` claim equals `:id`, and the
 * per-route permission (read for GET, write for PutFile).
 *
 * What this source supports:
 *
 *   - `kind` + `label` for UI branching.
 *   - `open(docId)` — GetFile; the item version comes back in the
 *     `X-WOPI-ItemVersion` header and is retained for optimistic-write
 *     protection on the next save.
 *   - `save(docId, bytes)` — PutFile, sending the retained version as
 *     `X-WOPI-ItemVersion` (If-Match). A 409 from collab means the host
 *     copy moved underneath us; surfaced as `WopiSaveConflictError`.
 *   - `list()` — a single entry for the embedded doc (the host owns
 *     file discovery), enriched with CheckFileInfo name + size.
 *   - `watchRecent` / `rememberLastOpened` / `lastOpened` — same
 *     localStorage-backed prefs as BrowserFileSource.
 *
 * What it does NOT support:
 *
 *   - `rename()` / `delete()` — the host owns the file's lifecycle.
 *     WOPI's core contents endpoints don't expose either, so calling
 *     here throws rather than silently no-op'ing.
 */
import type { FileEntry, FileSource } from './types';
export interface WopiFileSourceOptions {
    /**
     * The host file id — the `:id` path segment on the collab WOPI
     * routes. Passed through verbatim; the embedding host decides its
     * shape (and the JWT's `file_id` claim must match it).
     */
    docId: string;
    /**
     * The JWT the host issued. Attached as `?access_token=…` on every
     * call so collab can verify it and scope access to this file.
     */
    accessToken: string;
    /**
     * Filename for the embedded doc, if the embed surface knew it at
     * boot. Optional — when missing, list()/open() fall back to the
     * CheckFileInfo `BaseFileName`, then to the docId.
     */
    fileName?: string;
    /**
     * Origin of the collab server. Defaults to "" (same-origin) — the
     * production shape where the editor SPA is served from the collab
     * image. Local dev with Vite on :5173 points at the collab origin.
     */
    baseUrl?: string;
    /**
     * Override for fetch. Tests inject a mock; production passes
     * nothing and the global fetch is used.
     */
    fetchImpl?: typeof fetch;
}
/**
 * Thrown by operations WOPI mode doesn't support. Surfaces in
 * console / error boundary so a stray call site shows up loudly
 * rather than silently no-op'ing.
 */
export declare class WopiNotSupportedError extends Error {
    constructor(op: string);
}
/**
 * Thrown when PutFile is rejected because the host's item version no
 * longer matches the one we opened (collab returns 409 with the
 * expected / actual versions). The host app can catch this to show a
 * "the document changed elsewhere" conflict prompt.
 */
export declare class WopiSaveConflictError extends Error {
    readonly expected?: string;
    readonly actual?: string;
    constructor(expected?: string, actual?: string);
}
export declare class WopiFileSource implements FileSource {
    readonly kind: "wopi";
    readonly label: string;
    private readonly docId;
    private readonly accessToken;
    private fileName;
    private readonly baseUrl;
    private readonly fetchImpl;
    private readonly recent;
    private readonly scope;
    /** Latest item version, retained from open()/save() for If-Match. */
    private version;
    constructor(opts: WopiFileSourceOptions);
    list(): Promise<FileEntry[]>;
    open(id: string): Promise<{
        bytes: ArrayBuffer;
        name: string;
        etag?: string;
    }>;
    save(id: string | null, bytes: ArrayBuffer, opts?: {
        etag?: string;
        name?: string;
    }): Promise<{
        id: string;
        etag: string;
    }>;
    rename(): Promise<void>;
    delete(): Promise<void>;
    watchRecent(cb: (recent: FileEntry[]) => void): () => void;
    rememberLastOpened(id: string | null): Promise<void>;
    lastOpened(): Promise<string | null>;
    /** CheckFileInfo round-trip — JSON metadata for the embedded file. */
    private checkFileInfo;
    /**
     * Builds an absolute URL on the collab server with the access_token
     * query param attached. Preserves any existing query the path
     * already carries (none today, but cheap to handle).
     */
    private urlFor;
    private singleEntry;
}
//# sourceMappingURL=wopi.d.ts.map