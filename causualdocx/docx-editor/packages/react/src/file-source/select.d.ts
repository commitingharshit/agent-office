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
import type { FileSource } from './types';
export interface ChooseFileSourceOptions {
    /**
     * Origin of the gateway. Defaults to "" (same-origin). Local dev
     * with Vite on :5173 should pass `http://localhost:8080`.
     */
    baseUrl?: string;
    /**
     * Override for fetch. Tests inject a mock here; production passes
     * nothing and the global fetch is used.
     */
    fetchImpl?: typeof fetch;
    /**
     * If your build doesn't have access to the `__GATEWAY_BUILD__`
     * compile-time flag, set this directly. Defaults to whatever the
     * flag evaluates to.
     */
    gatewayBuild?: boolean;
    /**
     * Override the WOPI URL probe. Mainly for tests that inject a
     * synthetic context; production should leave it unset and let
     * the probe scan window.location.
     */
    wopiContext?: WopiContext | null;
}
/**
 * WopiContext is the bundle of state the WOPI redirect lands in
 * the browser URL: docId (path component) + access_token (query
 * param). Extracted once at boot by `extractWopiContext()`.
 */
export interface WopiContext {
    docId: string;
    accessToken: string;
}
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
export declare function extractWopiContext(loc?: {
    pathname: string;
    search: string;
}): WopiContext | null;
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
export declare function chooseFileSource(opts?: ChooseFileSourceOptions): Promise<FileSource>;
//# sourceMappingURL=select.d.ts.map