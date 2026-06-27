var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PersonalAuthGate — Mode 3 (Standalone) auth modal.
 *
 * Wraps the editor tree and renders a modal until the user signs in
 * via GET /auth/me. Once authenticated, the modal disappears and
 * children render unchanged.
 *
 * UX shape (matches Google Docs login modal conventions):
 *
 *   - Single dialog, no dismiss (no backdrop click, no Esc) — Mode 3
 *     requires auth before anything else renders.
 *   - Username + password fields, autocomplete hints set so password
 *     managers can fill cleanly. (collab authenticates by username; the
 *     display name is set later via the profile dialog.)
 *   - Login ↔ Signup toggle below the form.
 *   - Inline error rendering — collab's `{ error }` envelope becomes a
 *     human-readable string above the submit button.
 *   - Submit on Enter via standard <form> behavior.
 *
 * The gate constructs its own AuthClient by default; tests or
 * embedded apps that need to inject a mock pass `authClient`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from 'react';
import { Dialog } from '../components/ui/Dialog';
import { AuthClient } from './auth-client';
import { PersonalFileSourceError } from './personal';
export function usePersonalAuth(opts = {}) {
    // Capture the (potentially-changing) onAuthenticated callback via
    // a ref so the effect can read the LATEST callback without us
    // having to put it in the dep array. Same trick a stable
    // `useEvent` would give us; reffing manually keeps us off any
    // experimental API.
    const onAuthRef = useRef(opts.onAuthenticated);
    useEffect(() => {
        onAuthRef.current = opts.onAuthenticated;
    }, [opts.onAuthenticated]);
    // The client is stable across renders so the effect below only
    // fires once for the lifetime of the hook (unless the caller
    // swaps clients, which is fine).
    const client = useMemo(() => { var _a; return (_a = opts.authClient) !== null && _a !== void 0 ? _a : new AuthClient({ baseUrl: opts.baseUrl }); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.authClient, opts.baseUrl]);
    const [state, setState] = useState({ status: 'loading' });
    // Probe on mount. The 401 path is the common one (no session →
    // show the modal); any other error keeps the user in loading
    // until they retry, which the network-error UX handles too.
    //
    // Effect depends ONLY on `client` — the onAuthenticated callback
    // is read through onAuthRef so a parent re-render with a fresh
    // arrow doesn't restart the probe.
    useEffect(() => {
        let cancelled = false;
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const user = yield client.me();
                if (cancelled)
                    return;
                if (user) {
                    setState({ status: 'authed', user });
                    (_a = onAuthRef.current) === null || _a === void 0 ? void 0 : _a.call(onAuthRef, user);
                }
                else {
                    setState({ status: 'unauthed', error: null });
                }
            }
            catch (err) {
                if (cancelled)
                    return;
                setState({
                    status: 'unauthed',
                    error: err instanceof PersonalFileSourceError ? err : null,
                });
            }
        }))();
        return () => {
            cancelled = true;
        };
    }, [client]);
    const login = useCallback((username, password) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const user = yield client.login({ username, password });
            setState({ status: 'authed', user });
            (_a = onAuthRef.current) === null || _a === void 0 ? void 0 : _a.call(onAuthRef, user);
        }
        catch (err) {
            const e = err instanceof PersonalFileSourceError ? err : null;
            setState({ status: 'unauthed', error: e });
            throw err;
        }
    }), [client]);
    const signup = useCallback((username, password) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const user = yield client.signup({ username, password });
            setState({ status: 'authed', user });
            (_a = onAuthRef.current) === null || _a === void 0 ? void 0 : _a.call(onAuthRef, user);
        }
        catch (err) {
            const e = err instanceof PersonalFileSourceError ? err : null;
            setState({ status: 'unauthed', error: e });
            throw err;
        }
    }), [client]);
    const logout = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        yield client.logout();
        setState({ status: 'unauthed', error: null });
    }), [client]);
    return { state, login, signup, logout };
}
const AuthContext = createContext(null);
/**
 * Returns the authed user + logout handler. Must be called from a
 * descendant of <PersonalAuthGate>; throws otherwise so the bug
 * shows up at the misplacement site rather than a downstream
 * null-deref.
 */
export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (ctx === null) {
        throw new Error('useAuthContext() called outside <PersonalAuthGate>. Either render the consumer inside the gate, or wrap a fragment of your tree with <PersonalAuthGate>.');
    }
    return ctx;
}
export function PersonalAuthGate({ children, authClient, baseUrl, onAuthenticated, heading = 'Sign in to Casual Editor', initialMode = 'login', }) {
    const { state, login, signup, logout } = usePersonalAuth({
        authClient,
        baseUrl,
        onAuthenticated,
    });
    // Memoise the context value so re-renders of children don't fire
    // just because the gate re-rendered with the same auth state.
    const ctxValue = useMemo(() => (state.status === 'authed' ? { user: state.user, logout } : null), [state, logout]);
    if (state.status === 'authed') {
        return _jsx(AuthContext.Provider, { value: ctxValue, children: children });
    }
    return (_jsx(PersonalAuthGateModal, { isOpen: true, heading: heading, initialMode: initialMode, onSubmit: (mode, creds) => __awaiter(this, void 0, void 0, function* () {
            if (mode === 'login') {
                yield login(creds.username, creds.password);
            }
            else {
                yield signup(creds.username, creds.password);
            }
        }), submitError: state.status === 'unauthed' ? state.error : null, loading: state.status === 'loading' }));
}
export function PersonalAuthGateModal({ isOpen, heading, initialMode, onSubmit, submitError, loading, }) {
    const [mode, setMode] = useState(initialMode);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (submitting || loading)
            return;
        setSubmitting(true);
        try {
            yield onSubmit(mode, {
                username: username.trim(),
                password,
            });
        }
        catch (_a) {
            // Error rendered via submitError prop; no extra handling here.
        }
        finally {
            setSubmitting(false);
        }
    });
    return (_jsx(Dialog, { isOpen: isOpen, onClose: () => {
            /* no-op: Mode 3 requires auth before render */
        }, title: heading, width: 420, dismissOnBackdrop: false, dismissOnEscape: false, hideCloseButton: true, testId: "personal-auth-gate", footer: _jsx("button", { type: "submit", form: "personal-auth-form", disabled: submitting || loading || !username || !password, "data-testid": "personal-auth-submit", style: primaryButtonStyle(submitting || loading || !username || !password), children: submitting
                ? mode === 'login'
                    ? 'Signing in…'
                    : 'Creating account…'
                : mode === 'login'
                    ? 'Sign in'
                    : 'Create account' }), helper: _jsx("button", { type: "button", onClick: () => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setForgotOpen(false);
            }, "data-testid": "personal-auth-toggle", style: toggleButtonStyle, children: mode === 'login' ? 'Create an account' : 'I already have an account' }), children: _jsxs("form", { id: "personal-auth-form", onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsxs("label", { style: labelStyle, children: [_jsx("span", { style: labelTextStyle, children: "Username" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), autoComplete: "username", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoFocus: true, required: true, "data-testid": "personal-auth-username", style: inputStyle })] }), _jsxs("label", { style: labelStyle, children: [_jsx("span", { style: labelTextStyle, children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: mode === 'login' ? 'current-password' : 'new-password', required: true, minLength: 8, "data-testid": "personal-auth-password", style: inputStyle })] }), mode === 'login' && (_jsxs("div", { style: forgotWrapStyle, children: [_jsx("button", { type: "button", onClick: () => setForgotOpen((o) => !o), "aria-expanded": forgotOpen, "data-testid": "personal-auth-forgot-toggle", style: forgotLinkStyle, children: "Forgot password?" }), forgotOpen && (_jsxs("div", { role: "note", "data-testid": "personal-auth-forgot-panel", style: forgotPanelStyle, children: ["Mode 3 doesn\u2019t do email recovery \u2014 there\u2019s no SMTP server on a single-node deploy. Ask the operator to ssh into the container and run:", _jsxs("pre", { style: forgotCodeStyle, children: ["casual-docs reset-password ", username || '<your-username>'] }), "They\u2019ll set a new password for you to sign in with."] }))] })), submitError && (_jsx("div", { "data-testid": "personal-auth-error", style: errorStyle, children: humanReadable(submitError) }))] }) }));
}
// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function humanReadable(err) {
    // Codes mirror collab's `{ error }` envelope (auth/personal-routes.ts +
    // the createUser / verifyLogin reasons in auth/personal.ts).
    switch (err.code) {
        case 'invalid-credentials':
            return 'That username and password don’t match an account.';
        case 'username-taken':
            return 'That username is already taken. Try signing in.';
        case 'invalid-username':
            return 'That username isn’t allowed. Use letters, numbers, dot, dash or underscore.';
        case 'weak-password':
            return 'Password must be at least 8 characters.';
        case 'signup-closed':
            return 'Sign-ups are closed on this server. Ask the operator for an account.';
        case 'personal-mode-disabled':
        case 'mode-disabled':
            return 'Accounts aren’t enabled on this server.';
        case 'bad-body':
            return 'Please enter a username and password.';
        default:
            return err.message || 'Something went wrong. Please try again.';
    }
}
const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};
const labelTextStyle = {
    fontSize: 13,
    color: 'var(--doc-text-muted, #475569)',
    fontWeight: 500,
};
const inputStyle = {
    padding: '8px 10px',
    border: '1px solid var(--doc-border, #cbd5e1)',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
    background: 'var(--doc-surface, #fff)',
    color: 'var(--doc-text, #0f172a)',
};
const errorStyle = {
    padding: '8px 10px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.28)',
    borderRadius: 6,
    fontSize: 13,
    color: 'rgb(153, 27, 27)',
};
function primaryButtonStyle(disabled) {
    return {
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid transparent',
        background: disabled ? 'var(--doc-border, #cbd5e1)' : 'var(--doc-accent, #2563eb)',
        color: disabled ? 'var(--doc-text-muted, #64748b)' : '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
    };
}
const toggleButtonStyle = {
    padding: '6px 0',
    background: 'transparent',
    border: 'none',
    color: 'var(--doc-accent, #2563eb)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'underline',
};
const forgotWrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const forgotLinkStyle = {
    alignSelf: 'flex-start',
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: 'var(--doc-text-muted, #475569)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'underline',
};
const forgotPanelStyle = {
    padding: '10px 12px',
    background: 'var(--doc-surface-2, #f1f5f9)',
    border: '1px solid var(--doc-border-light, #e2e8f0)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--doc-text-muted, #475569)',
    lineHeight: 1.5,
};
const forgotCodeStyle = {
    margin: '8px 0 4px',
    padding: '6px 8px',
    background: 'var(--doc-surface, #fff)',
    border: '1px solid var(--doc-border, #cbd5e1)',
    borderRadius: 4,
    fontSize: 11.5,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    color: 'var(--doc-text, #0f172a)',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
};
//# sourceMappingURL=PersonalAuthGate.js.map