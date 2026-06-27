/**
 * PersonalFileSource — the FileSource implementation for Mode 3
 * (Standalone). Talks to the collab server over cookie-authenticated
 * REST (CasualOffice/collab `files/personal-files-routes.ts`).
 *
 * Wire shape — keep these in sync with the collab route handlers:
 *
 *   GET    /files            → { files: FileSummaryWire[] }
 *   POST   /files            → { file } (201) — multipart (`file` part)
 *   GET    /files/{id}        → .docx bytes + `etag` header
 *   POST   /files/{id}        → { file } — raw bytes + `If-Match` header
 *   PATCH  /files/{id}        → 204 — body { name }
 *   DELETE /files/{id}        → 204
 *   GET    /auth/profile      → { user, profile }
 *   PATCH  /auth/profile      → { profile }
 *
 * The session cookie (`cs_session`) is set by /auth/signup or
 * /auth/login and rides along via `credentials: 'include'`. The
 * PersonalAuthGate shows a login modal when /auth/me returns 401; this
 * class is constructed only after that gate resolves.
 */
import type { FileEntry, FileSource } from './types';
import type { ProfilePatchWire, ProfileWire, UserWire } from './wire';
export interface PersonalFileSourceOptions {
    /**
     * Origin of the collab server. Defaults to "" (same-origin) which is
     * the production deploy shape — editor SPA + collab served from one
     * image. Local dev with Vite on :5173 points at the collab origin.
     */
    baseUrl?: string;
    /**
     * The authenticated user. Used only to build the local-prefs scope
     * key so two users on the same browser don't share recent-files
     * state. The personal source does not re-issue /auth/me on every
     * call — that's the gate's job.
     */
    user: Pick<UserWire, 'id' | 'username'>;
    /**
     * Override for fetch. Tests inject a mock here; production passes
     * nothing and the global fetch is used.
     */
    fetchImpl?: typeof fetch;
}
/**
 * Error raised when a server response isn't 2xx. Carries the parsed
 * { code, message } envelope when the body matched the gateway's
 * errorResp shape, otherwise a synthesized one.
 */
export declare class PersonalFileSourceError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
export declare class PersonalFileSource implements FileSource {
    readonly kind: "personal";
    readonly label: string;
    private readonly baseUrl;
    private readonly fetchImpl;
    private readonly scope;
    private readonly recent;
    constructor(opts: PersonalFileSourceOptions);
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
    rename(id: string, newName: string): Promise<void>;
    delete(id: string): Promise<void>;
    watchRecent(cb: (recent: FileEntry[]) => void): () => void;
    rememberLastOpened(id: string | null): Promise<void>;
    lastOpened(): Promise<string | null>;
    /**
     * Fetch the user's merged profile (identity + extended fields).
     * Personal-mode only — not on the FileSource interface, so callers
     * must narrow on `kind === 'personal'` before invoking.
     */
    getProfile(): Promise<ProfileWire>;
    /**
     * Update the user's profile. Fields omitted from the patch are
     * left unchanged; explicit empty strings clear the field. Returns
     * the freshly-merged view so the caller doesn't need a separate
     * GET round-trip.
     */
    updateProfile(patch: ProfilePatchWire): Promise<ProfileWire>;
    private req;
    private bumpRecent;
}
//# sourceMappingURL=personal.d.ts.map