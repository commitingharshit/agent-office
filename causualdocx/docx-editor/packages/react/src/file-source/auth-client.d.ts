/**
 * AuthClient — the thin HTTP shim PersonalAuthGate consumes for
 * signup / login / logout / `/auth/me`. Kept separate from
 * PersonalFileSource because the gate runs BEFORE the file source
 * is constructed: the file source is only valid once `/auth/me`
 * returns 200.
 *
 * Wire shape mirrors CasualOffice/collab `auth/personal-routes.ts`:
 *
 *   POST /auth/signup  → 201 { user }, sets cs_session cookie
 *   POST /auth/login   → 200 { user }, sets cs_session cookie
 *   POST /auth/logout  → 204
 *   GET  /auth/me      → 200 { user } | 401 | 503 (personal mode off)
 *
 * All requests use `credentials: 'include'` so the cookie set by
 * signup/login rides along on subsequent calls.
 */
import type { ProfilePatchWire, ProfileWire, UserWire } from './wire';
export interface AuthClientOptions {
    /**
     * Origin of the gateway. Defaults to "" (same-origin) which is the
     * production deploy shape. Local-dev with Vite on :5173 should
     * pass `http://localhost:8080`.
     */
    baseUrl?: string;
    /**
     * Override for fetch. Tests inject a mock here; production passes
     * nothing and the global fetch is used.
     */
    fetchImpl?: typeof fetch;
}
/**
 * Credentials passed into login / signup. collab authenticates by
 * `username` (not email — email is an optional profile field set
 * later). The display name is edited post-signup via the profile
 * dialog, so there's no signup-time displayName.
 */
export interface AuthCredentials {
    username: string;
    password: string;
}
export declare class AuthClient {
    private readonly baseUrl;
    private readonly fetchImpl;
    constructor(opts?: AuthClientOptions);
    /**
     * Returns the currently-authenticated user, or null when no
     * session is active (401). Other errors (network, 5xx) throw a
     * PersonalFileSourceError so the caller can distinguish "not
     * signed in" from "couldn't reach the gateway".
     */
    me(): Promise<UserWire | null>;
    /**
     * POST /auth/login. Backend sets the session cookie on success;
     * the resolved User is returned for the gate to seed its initial
     * "label" surface.
     */
    login(creds: AuthCredentials): Promise<UserWire>;
    /**
     * POST /auth/signup. Creates the account AND signs the user in
     * (same cookie shape as login).
     */
    signup(creds: AuthCredentials): Promise<UserWire>;
    /**
     * GET /auth/profile. Returns the merged identity + extended
     * profile view (timezone, locale, avatarUrl, prefs). Throws on
     * non-2xx — the gate guarantees a live session at the call site
     * so 401 here means a session expired mid-flight (rare; treat
     * as a transient error and re-probe).
     */
    getProfile(): Promise<ProfileWire>;
    /**
     * PATCH /auth/profile. Fields omitted from `patch` are left
     * unchanged; null clears displayName / email. Returns the freshly
     * merged profile so the caller can render the post-update state
     * without a follow-up GET.
     */
    updateProfile(patch: ProfilePatchWire): Promise<ProfileWire>;
    /**
     * POST /auth/logout. Clears the session cookie. 204 is success;
     * other statuses are silently swallowed because there's no
     * useful action a UI can take in response — the session is
     * already in an unknown state.
     */
    logout(): Promise<void>;
    private postCredentials;
    /**
     * Parses collab's `{ error }` envelope into a PersonalFileSourceError.
     * Falls back to a synthesized envelope when the response body isn't
     * the expected JSON shape (e.g. a 502 from an upstream proxy).
     */
    private errorFrom;
}
//# sourceMappingURL=auth-client.d.ts.map