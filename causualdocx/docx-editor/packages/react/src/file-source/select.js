/**
 * Boot-time probe — picks the right FileSource implementation for
 * the running deploy mode.
 *
 * Probe order (see chooseFileSource):
 *
 *   1. !__GATEWAY_BUILD__                           → BrowserFileSource
 *   2. URL matches /doc/{id}?access_token=          → WopiFileSource
 *   3. /auth/me returns 200                         → PersonalFileSource
 *   4. Else (gateway unreachable / 401)             → BrowserFileSource
 *
 * `__GATEWAY_BUILD__` is the build-time flag set by the Docker image's
 * Vite config; the static-Pages build leaves it `false`.
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
import { BrowserFileSource } from './browser';
import { PersonalFileSource } from './personal';
import { WopiFileSource } from './wopi';
/**
 * extractWopiContext scans a browser-Location-shaped object for the
 * WOPI redirect's URL fingerprint:
 *
 *     /doc/{base64url-docId}?access_token=<JWT>
 *
 * Returns null when the URL doesn't match (any other page on a
 * gateway-built editor — landing, personal-mode dashboard, etc.).
 * Exported so the host app can call it directly for its own routing.
 */
export function extractWopiContext(loc) {
    const l = loc !== null && loc !== void 0 ? loc : (typeof window !== 'undefined' ? window.location : null);
    if (!l)
        return null;
    const params = new URLSearchParams(l.search);
    const token = params.get('access_token');
    // Match /doc/<docId> where docId is base64url. We don't anchor the
    // tail strictly — a trailing slash + query is fine — because the
    // SPA router may rewrite the path slightly.
    const match = l.pathname.match(/^\/doc\/([A-Za-z0-9_-]+)\/?$/);
    if (!token || !match)
        return null;
    return { docId: match[1], accessToken: token };
}
/**
 * Runs the probe and returns the chosen source. Never throws — every
 * branch has a defined fallback so the editor always boots with
 * *some* FileSource.
 *
 * Probe order (highest priority first):
 *
 *   1. !gatewayBuild              → BrowserFileSource
 *   2. WOPI URL present           → WopiFileSource
 *   3. /auth/me responds 200      → PersonalFileSource
 *   4. else                       → BrowserFileSource (fallback)
 *
 * WOPI is checked before personal because a Mode-2 deploy may also
 * have personal auth mounted (it's the same gateway). The URL is the
 * deciding signal: a freshly-redirected WOPI user has the access_token
 * in their URL; a personal-mode user does not.
 */
export function chooseFileSource() {
    return __awaiter(this, arguments, void 0, function* (opts = {}) {
        var _a, _b, _c, _d;
        const isGatewayBuild = (_a = opts.gatewayBuild) !== null && _a !== void 0 ? _a : (typeof __GATEWAY_BUILD__ !== 'undefined' && __GATEWAY_BUILD__);
        if (!isGatewayBuild) {
            return new BrowserFileSource();
        }
        const baseUrl = (_b = opts.baseUrl) !== null && _b !== void 0 ? _b : '';
        // Wrap fetch in an arrow so it's not bound to `this` — see the
        // fetchImpl pattern in personal.ts / wopi.ts.
        const fetchImpl = (_c = opts.fetchImpl) !== null && _c !== void 0 ? _c : ((input, init) => fetch(input, init));
        // 1. WOPI probe — the URL alone is enough to pick this branch.
        //    The token's validity is collab's problem; if it's bad, the
        //    eventual /wopi/files/{id}/contents call will surface a
        //    403 / 401 and the editor's error boundary takes over.
        const wopi = (_d = opts.wopiContext) !== null && _d !== void 0 ? _d : extractWopiContext();
        if (wopi) {
            return new WopiFileSource({
                docId: wopi.docId,
                accessToken: wopi.accessToken,
                baseUrl,
                fetchImpl,
            });
        }
        // 2. Personal probe — /auth/me returning 200 means there's a live
        //    session cookie on this origin.
        try {
            const res = yield fetchImpl(baseUrl + '/auth/me', { credentials: 'include' });
            if (res.ok) {
                const body = (yield res.json());
                return new PersonalFileSource({
                    baseUrl,
                    user: { id: body.user.id, username: body.user.username },
                    fetchImpl,
                });
            }
        }
        catch (_e) {
            // Gateway unreachable from a Mode-3 build is the operator's bug,
            // not the user's. Fall through to BrowserFileSource so the editor
            // still loads (in degraded mode); the auth gate UI in the
            // embedding app will surface the real failure.
        }
        return new BrowserFileSource();
    });
}
//# sourceMappingURL=select.js.map