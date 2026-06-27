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
 * UserMenu — the authenticated-user surface for Mode 3.
 *
 * Renders a pill-shaped button showing the signed-in user's display
 * name; click opens a small dropdown with the email and a Sign out
 * action. UX shape matches Google Docs / Microsoft 365 — top-right
 * placement is typical, but the component is unstyled-positioned so
 * the host app drops it wherever its title bar lives.
 *
 * Consumes the AuthContext provided by PersonalAuthGate, so a
 * misplacement (rendering outside the gate) throws at the
 * useAuthContext() call site rather than a quieter null-deref later.
 */
import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from './PersonalAuthGate';
import { ProfileSettingsDialog } from './ProfileSettingsDialog';
export function UserMenu({ className, onLogout, authClient, testId = 'user-menu' }) {
    const { user, logout } = useAuthContext();
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    // Locally-overridden displayName so the trigger updates the moment
    // the profile dialog saves. The context user only carries the
    // username (collab's PublicUser has no displayName); the friendly
    // name lives in the profile and is only known once the dialog loads
    // or saves it. Until then we fall back to the username.
    const [displayNameOverride, setDisplayNameOverride] = useState(null);
    const rootRef = useRef(null);
    const effectiveDisplayName = displayNameOverride || user.username;
    // Show the @handle as a secondary line only when a friendly display
    // name is set — otherwise the primary line already IS the username.
    const secondaryHandle = displayNameOverride && displayNameOverride !== user.username ? `@${user.username}` : null;
    // Close on outside click — mousedown so the dropdown closes before
    // any other click handler fires.
    useEffect(() => {
        if (!open)
            return;
        const onDocMouseDown = (e) => {
            if (!rootRef.current)
                return;
            if (!rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);
    // Close on Esc when open — matches the rest of the editor's
    // dismissable-popover convention.
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);
    const handleSignOut = () => __awaiter(this, void 0, void 0, function* () {
        if (signingOut)
            return;
        setSigningOut(true);
        try {
            yield logout();
            setOpen(false);
            onLogout === null || onLogout === void 0 ? void 0 : onLogout();
        }
        finally {
            // The gate re-renders the modal on logout success, so this
            // setSigningOut(false) only matters when logout throws — in
            // which case the user can retry.
            setSigningOut(false);
        }
    });
    const initials = displayInitials(effectiveDisplayName);
    const handleOpenProfile = () => {
        setOpen(false);
        setProfileOpen(true);
    };
    const handleProfileSaved = (profile) => {
        var _a;
        setDisplayNameOverride((_a = profile.displayName) !== null && _a !== void 0 ? _a : null);
    };
    return (_jsxs("div", { ref: rootRef, style: rootStyle, children: [_jsxs("button", { type: "button", className: className, onClick: () => setOpen((o) => !o), "aria-haspopup": "menu", "aria-expanded": open, "data-testid": testId, style: triggerStyle(open), children: [_jsx("span", { style: initialsStyle, "aria-hidden": "true", children: initials }), _jsx("span", { style: triggerLabelStyle, children: effectiveDisplayName }), _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: _jsx("path", { d: "M6 9l6 6 6-6" }) })] }), open && (_jsxs("div", { role: "menu", style: dropdownStyle, "data-testid": `${testId}-dropdown`, children: [_jsxs("div", { style: dropdownHeaderStyle, children: [_jsx("div", { style: dropdownNameStyle, children: effectiveDisplayName }), secondaryHandle && _jsx("div", { style: dropdownEmailStyle, children: secondaryHandle })] }), _jsx("div", { style: dropdownDividerStyle }), _jsx("button", { type: "button", role: "menuitem", onClick: handleOpenProfile, "data-testid": `${testId}-profile`, style: menuItemStyle(false), children: "Profile settings" }), _jsx("button", { type: "button", role: "menuitem", onClick: handleSignOut, disabled: signingOut, "data-testid": `${testId}-signout`, style: menuItemStyle(signingOut), children: signingOut ? 'Signing out…' : 'Sign out' })] })), _jsx(ProfileSettingsDialog, { isOpen: profileOpen, onClose: () => setProfileOpen(false), authClient: authClient, onSaved: handleProfileSaved })] }));
}
// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
/**
 * Two-letter initials from a name or email. Mirrors the Google Docs
 * avatar fallback: first letter of each whitespace-separated word,
 * capped at two; falls back to the email prefix's first two chars
 * when the name is empty / single-word.
 */
function displayInitials(s) {
    if (!s)
        return '?';
    const trimmed = s.trim();
    if (trimmed.includes('@')) {
        // Email — take the first two chars of the local part.
        return trimmed.split('@')[0].slice(0, 2).toUpperCase();
    }
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
}
const rootStyle = {
    position: 'relative',
    display: 'inline-block',
};
function triggerStyle(open) {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 6px',
        border: '1px solid var(--doc-border, #cbd5e1)',
        borderRadius: 999,
        background: open ? 'var(--doc-surface-2, #f1f5f9)' : 'var(--doc-surface, #fff)',
        color: 'var(--doc-text, #0f172a)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
    };
}
const initialsStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'var(--doc-accent, #2563eb)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
};
const triggerLabelStyle = {
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};
const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: 220,
    background: 'var(--doc-surface, #fff)',
    border: '1px solid var(--doc-border, #cbd5e1)',
    borderRadius: 10,
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.08)',
    padding: '6px 0',
    zIndex: 50,
};
const dropdownHeaderStyle = {
    padding: '8px 14px 10px',
};
const dropdownNameStyle = {
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--doc-text, #0f172a)',
};
const dropdownEmailStyle = {
    marginTop: 2,
    fontSize: 12,
    color: 'var(--doc-text-muted, #64748b)',
};
const dropdownDividerStyle = {
    height: 1,
    background: 'var(--doc-border-light, #e2e8f0)',
    margin: '4px 0',
};
function menuItemStyle(disabled) {
    return {
        display: 'block',
        width: '100%',
        padding: '8px 14px',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        color: 'var(--doc-text, #0f172a)',
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
    };
}
//# sourceMappingURL=UserMenu.js.map