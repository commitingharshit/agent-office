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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { RecentObserver, readLastOpened, writeLastOpened } from './local-prefs';
const OCTET_STREAM = 'application/octet-stream';
/**
 * Error raised when a server response isn't 2xx. Carries the parsed
 * { code, message } envelope when the body matched the gateway's
 * errorResp shape, otherwise a synthesized one.
 */
export class PersonalFileSourceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.name = 'PersonalFileSourceError';
        this.status = status;
        this.code = code;
    }
}
export class PersonalFileSource {
    constructor(opts) {
        var _a, _b;
        this.kind = 'personal';
        this.recent = new RecentObserver();
        this.baseUrl = (_a = opts.baseUrl) !== null && _a !== void 0 ? _a : '';
        // Wrap fetch in an arrow so it's not bound to `this` — browsers
        // throw "Illegal invocation" when fetch is called with anything
        // but window / undefined as the receiver.
        this.fetchImpl = (_b = opts.fetchImpl) !== null && _b !== void 0 ? _b : ((input, init) => fetch(input, init));
        this.label = opts.user.username || 'My files';
        // Scoped per (kind, userId) so the recent-files cache survives
        // user-switching on the same browser without leaking.
        this.scope = `personal.${opts.user.id}`;
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const res = yield this.req('/files');
            const body = (yield res.json());
            const entries = ((_a = body.files) !== null && _a !== void 0 ? _a : []).map(summaryToEntry);
            this.recent.set(entries);
            return entries;
        });
    }
    open(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const res = yield this.req(`/files/${encodeURIComponent(id)}`);
            const bytes = yield res.arrayBuffer();
            const etag = (_a = res.headers.get('ETag')) !== null && _a !== void 0 ? _a : undefined;
            // The server's Content-Disposition carries the canonical name.
            // We could parse it, but the recent list already has the name —
            // and read order across implementations is "client knows the
            // name before opening". Falling back to id keeps this robust if
            // open() is called without list() first.
            const name = (_b = parseFilenameFromContentDisposition(res.headers.get('Content-Disposition'))) !== null && _b !== void 0 ? _b : id;
            return { bytes, name, etag };
        });
    }
    save(id, bytes, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // First save mints an id via a multipart POST /files (the `file`
            // part carries the bytes + filename). Subsequent saves overwrite
            // via POST /files/{id} with the raw bytes and an `If-Match` header
            // carrying the etag we hold, so a concurrent host-side change
            // surfaces as a 412 rather than silently clobbering.
            let res;
            if (id === null) {
                const form = new FormData();
                const blob = new Blob([bytes], { type: OCTET_STREAM });
                form.append('file', blob, (opts === null || opts === void 0 ? void 0 : opts.name) || 'document.docx');
                if (opts === null || opts === void 0 ? void 0 : opts.name)
                    form.append('name', opts.name);
                res = yield this.req('/files', { method: 'POST', body: form });
            }
            else {
                const headers = { 'Content-Type': OCTET_STREAM };
                if (opts === null || opts === void 0 ? void 0 : opts.etag)
                    headers['If-Match'] = opts.etag;
                res = yield this.req(`/files/${encodeURIComponent(id)}`, {
                    method: 'POST',
                    headers,
                    body: bytes,
                });
            }
            const body = (yield res.json());
            const summary = body.file;
            // Refresh the recent observer optimistically — callers can rely
            // on watchRecent firing without an explicit list().
            this.bumpRecent(summary);
            return { id: summary.id, etag: summary.etag };
        });
    }
    rename(id, newName) {
        return __awaiter(this, void 0, void 0, function* () {
            // collab returns 204 (no body) on a successful rename.
            yield this.req(`/files/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
            // Mirror the rename into the recent observer.
            const next = this.recent.snapshot().map((e) => (e.id === id ? Object.assign(Object.assign({}, e), { name: newName }) : e));
            this.recent.set(next);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.req(`/files/${encodeURIComponent(id)}`, { method: 'DELETE' });
            const next = this.recent.snapshot().filter((e) => e.id !== id);
            this.recent.set(next);
        });
    }
    watchRecent(cb) {
        return this.recent.watch(cb);
    }
    rememberLastOpened(id) {
        return __awaiter(this, void 0, void 0, function* () {
            writeLastOpened(this.scope, id);
        });
    }
    lastOpened() {
        return __awaiter(this, void 0, void 0, function* () {
            return readLastOpened(this.scope);
        });
    }
    /**
     * Fetch the user's merged profile (identity + extended fields).
     * Personal-mode only — not on the FileSource interface, so callers
     * must narrow on `kind === 'personal'` before invoking.
     */
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.req('/auth/profile');
            const body = (yield res.json());
            return body.profile;
        });
    }
    /**
     * Update the user's profile. Fields omitted from the patch are
     * left unchanged; explicit empty strings clear the field. Returns
     * the freshly-merged view so the caller doesn't need a separate
     * GET round-trip.
     */
    updateProfile(patch) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.req('/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const body = (yield res.json());
            return body.profile;
        });
    }
    // ---------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------
    req(path, init) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.fetchImpl(this.baseUrl + path, Object.assign(Object.assign({}, init), { credentials: 'include' }));
            if (!res.ok) {
                // Try to parse collab's { error } envelope. If the body isn't
                // JSON (e.g. an upstream proxy returned a plain HTML 502), fall
                // back to a synthesized error.
                let code = 'http_' + res.status;
                let message = res.statusText;
                try {
                    const body = (yield res.clone().json());
                    if (body === null || body === void 0 ? void 0 : body.error) {
                        code = body.error;
                        message = body.error;
                    }
                }
                catch (_a) {
                    // Non-JSON error body — keep the synthesized envelope.
                }
                throw new PersonalFileSourceError(res.status, code, message);
            }
            return res;
        });
    }
    bumpRecent(summary) {
        const entry = summaryToEntry(summary);
        const without = this.recent.snapshot().filter((e) => e.id !== entry.id);
        this.recent.set([entry, ...without]);
    }
}
function summaryToEntry(s) {
    return {
        id: s.id,
        name: s.name,
        size: s.size,
        // collab returns modifiedAt as ms-since-epoch already.
        modifiedAt: s.modifiedAt || 0,
        source: 'personal',
        meta: { version: s.etag },
    };
}
/**
 * Pulls the filename out of a Content-Disposition header. Handles both
 * the RFC 5987 `filename*=UTF-8''…` form and collab's
 * `filename="<percent-encoded>"` form.
 */
function parseFilenameFromContentDisposition(cd) {
    if (!cd)
        return null;
    const star = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    if (star) {
        try {
            return decodeURIComponent(star[1]);
        }
        catch (_a) {
            return null;
        }
    }
    const plain = /filename="([^"]+)"/i.exec(cd);
    if (!plain)
        return null;
    // collab percent-encodes the name into the quoted form; decode it.
    try {
        return decodeURIComponent(plain[1]);
    }
    catch (_b) {
        return plain[1];
    }
}
//# sourceMappingURL=personal.js.map