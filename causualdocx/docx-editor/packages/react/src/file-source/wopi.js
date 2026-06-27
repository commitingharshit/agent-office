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
/**
 * Thrown by operations WOPI mode doesn't support. Surfaces in
 * console / error boundary so a stray call site shows up loudly
 * rather than silently no-op'ing.
 */
export class WopiNotSupportedError extends Error {
    constructor(op) {
        super(`WopiFileSource: ${op} is not supported in WOPI mode`);
        this.name = 'WopiNotSupportedError';
    }
}
/**
 * Thrown when PutFile is rejected because the host's item version no
 * longer matches the one we opened (collab returns 409 with the
 * expected / actual versions). The host app can catch this to show a
 * "the document changed elsewhere" conflict prompt.
 */
export class WopiSaveConflictError extends Error {
    constructor(expected, actual) {
        super('WopiFileSource: save rejected — item version mismatch');
        this.name = 'WopiSaveConflictError';
        this.expected = expected;
        this.actual = actual;
    }
}
export class WopiFileSource {
    constructor(opts) {
        var _a, _b;
        this.kind = 'wopi';
        this.recent = new RecentObserver();
        this.docId = opts.docId;
        this.accessToken = opts.accessToken;
        this.fileName = opts.fileName || opts.docId;
        this.baseUrl = (_a = opts.baseUrl) !== null && _a !== void 0 ? _a : '';
        // Wrap fetch in an arrow so it's not bound to `this` — browsers
        // throw "Illegal invocation" when fetch is called with anything
        // but window / undefined as the receiver.
        this.fetchImpl = (_b = opts.fetchImpl) !== null && _b !== void 0 ? _b : ((input, init) => fetch(input, init));
        this.label = opts.fileName || 'Embedded document';
        // Scope keyed by docID so two embeds open in two tabs don't
        // share recent-files state.
        this.scope = `wopi.${opts.docId}`;
        // Seed the recent observer with the single doc the embed
        // surfaces, so a subscriber that registers before list() fires
        // still sees the right initial state.
        this.recent.set([this.singleEntry()]);
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            // CheckFileInfo gives us the authoritative name + size. Best-effort:
            // a failure (e.g. a read-scoped token that still opens fine) must
            // not break the single-entry list the embed needs.
            const info = yield this.checkFileInfo().catch(() => null);
            if (info === null || info === void 0 ? void 0 : info.BaseFileName)
                this.fileName = info.BaseFileName;
            if (info === null || info === void 0 ? void 0 : info.Version)
                this.version = info.Version;
            const entry = this.singleEntry(info === null || info === void 0 ? void 0 : info.Size);
            this.recent.set([entry]);
            return [entry];
        });
    }
    open(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // The WOPI embed only ever opens THIS doc. A caller passing a
            // different id is asking for a doc that doesn't exist in this
            // editor's context.
            if (id !== this.docId) {
                throw new WopiNotSupportedError(`open(${id}) — only the embed's docId is reachable`);
            }
            const res = yield this.fetchImpl(this.urlFor(`/wopi/files/${encodeURIComponent(id)}/contents`));
            if (!res.ok) {
                throw new Error(`WopiFileSource: GetFile failed (${res.status})`);
            }
            const bytes = yield res.arrayBuffer();
            // collab stamps the item version on GetFile; retain it so the next
            // save can send it as the If-Match guard.
            const version = (_a = res.headers.get('X-WOPI-ItemVersion')) !== null && _a !== void 0 ? _a : undefined;
            if (version)
                this.version = version;
            return { bytes, name: this.fileName, etag: version };
        });
    }
    save(id, bytes, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            // WOPI never mints ids client-side — the host owns the file id, so
            // a first-save (id === null) is meaningless here.
            if (id !== null && id !== this.docId) {
                throw new WopiNotSupportedError(`save(${id}) — only the embed's docId is writable`);
            }
            const headers = {
                'Content-Type': 'application/octet-stream',
            };
            // Optimistic-write guard: prefer the caller's etag, else the version
            // we last saw. Omitted on the very first save if we never opened.
            const ifMatch = (_a = opts === null || opts === void 0 ? void 0 : opts.etag) !== null && _a !== void 0 ? _a : this.version;
            if (ifMatch)
                headers['X-WOPI-ItemVersion'] = ifMatch;
            const res = yield this.fetchImpl(this.urlFor(`/wopi/files/${encodeURIComponent(this.docId)}/contents`), { method: 'POST', headers, body: bytes });
            if (res.status === 409) {
                const body = (yield res.json().catch(() => ({})));
                throw new WopiSaveConflictError(body.expected, body.actual);
            }
            if (!res.ok) {
                throw new Error(`WopiFileSource: PutFile failed (${res.status})`);
            }
            const body = (yield res.json().catch(() => ({})));
            // collab returns the new version in the body and the header; trust
            // the body, fall back to the header, then to whatever we had.
            const next = (_d = (_c = (_b = body.version) !== null && _b !== void 0 ? _b : res.headers.get('X-WOPI-ItemVersion')) !== null && _c !== void 0 ? _c : this.version) !== null && _d !== void 0 ? _d : '';
            this.version = next || undefined;
            return { id: this.docId, etag: next };
        });
    }
    rename() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new WopiNotSupportedError('rename');
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new WopiNotSupportedError('delete');
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
    /** CheckFileInfo round-trip — JSON metadata for the embedded file. */
    checkFileInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.fetchImpl(this.urlFor(`/wopi/files/${encodeURIComponent(this.docId)}`));
            if (!res.ok)
                return null;
            return (yield res.json());
        });
    }
    /**
     * Builds an absolute URL on the collab server with the access_token
     * query param attached. Preserves any existing query the path
     * already carries (none today, but cheap to handle).
     */
    urlFor(path) {
        const sep = path.includes('?') ? '&' : '?';
        return `${this.baseUrl}${path}${sep}access_token=${encodeURIComponent(this.accessToken)}`;
    }
    singleEntry(size = 0) {
        return {
            id: this.docId,
            name: this.fileName,
            size,
            modifiedAt: Date.now(),
            source: 'wopi',
        };
    }
}
//# sourceMappingURL=wopi.js.map