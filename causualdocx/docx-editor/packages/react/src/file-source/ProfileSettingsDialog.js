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
 * ProfileSettingsDialog — edit the signed-in user's extended profile.
 *
 * Loads the current profile from GET /auth/profile on open, lets the
 * user edit displayName + timezone + language, posts the changes via
 * PATCH /auth/profile, closes on success. Cancel discards.
 *
 * collab stores `displayName` / `email` / `timezone` as first-class
 * profile columns and everything else (here: `locale`) in the
 * free-form `preferences` JSON blob. The dialog reads/writes
 * `preferences.locale` and merges it back so other preference keys
 * are preserved.
 *
 * Reuses the editor's Dialog shell so visual + motion language match
 * every other modal.
 */
import { useEffect, useState } from 'react';
import { Dialog } from '../components/ui/Dialog';
import { AuthClient } from './auth-client';
import { PersonalFileSourceError } from './personal';
export function ProfileSettingsDialog({ isOpen, onClose, authClient, onSaved, testId = 'profile-settings', }) {
    var _a, _b;
    const [client] = useState(() => authClient !== null && authClient !== void 0 ? authClient : new AuthClient());
    const [load, setLoad] = useState({ status: 'loading' });
    const [displayName, setDisplayName] = useState('');
    const [timezone, setTimezone] = useState('');
    const [locale, setLocale] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    // Reset + fetch when the dialog opens. Closing leaves stale state
    // around so a re-open snaps back into the right shape immediately
    // (and so we don't fight a race against the close animation).
    useEffect(() => {
        if (!isOpen)
            return;
        let cancelled = false;
        setLoad({ status: 'loading' });
        setSaveError(null);
        (() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const profile = yield client.getProfile();
                if (cancelled)
                    return;
                setLoad({ status: 'loaded', profile });
                setDisplayName((_a = profile.displayName) !== null && _a !== void 0 ? _a : '');
                setTimezone((_b = profile.timezone) !== null && _b !== void 0 ? _b : '');
                setLocale(localeOf(profile));
            }
            catch (err) {
                if (cancelled)
                    return;
                setLoad({
                    status: 'error',
                    error: err instanceof PersonalFileSourceError ? err : null,
                });
            }
        }))();
        return () => {
            cancelled = true;
        };
    }, [isOpen, client]);
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setSaveError(null);
        try {
            // Merge locale into the existing preferences blob so we don't
            // clobber any other keys collab is round-tripping for us.
            const basePrefs = load.status === 'loaded' ? load.profile.preferences : {};
            const next = yield client.updateProfile({
                displayName: displayName.trim(),
                timezone: timezone.trim(),
                preferences: Object.assign(Object.assign({}, basePrefs), { locale: locale.trim() }),
            });
            onSaved === null || onSaved === void 0 ? void 0 : onSaved(next);
            onClose();
        }
        catch (err) {
            setSaveError(err instanceof PersonalFileSourceError ? err : null);
        }
        finally {
            setSaving(false);
        }
    });
    return (_jsxs(Dialog, { isOpen: isOpen, onClose: onClose, title: "Profile settings", width: 460, dismissOnBackdrop: !saving, dismissOnEscape: !saving, testId: testId, footer: _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "button", onClick: onClose, disabled: saving, "data-testid": `${testId}-cancel`, style: secondaryButtonStyle(saving), children: "Cancel" }), _jsx("button", { type: "submit", form: `${testId}-form`, disabled: saving || load.status !== 'loaded' || displayName.trim() === '', "data-testid": `${testId}-save`, style: primaryButtonStyle(saving || load.status !== 'loaded' || displayName.trim() === ''), children: saving ? 'Saving…' : 'Save' })] }), children: [load.status === 'loading' && (_jsx("div", { "data-testid": `${testId}-loading`, style: loadingStyle, children: "Loading profile\u2026" })), load.status === 'error' && (_jsx("div", { "data-testid": `${testId}-load-error`, style: errorStyle, children: (_b = (_a = load.error) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : 'Could not load your profile. Try closing and reopening.' })), load.status === 'loaded' && (_jsxs("form", { id: `${testId}-form`, onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsxs("label", { style: labelStyle, children: [_jsx("span", { style: labelTextStyle, children: "Display name" }), _jsx("input", { type: "text", value: displayName, onChange: (e) => setDisplayName(e.target.value), required: true, maxLength: 120, autoFocus: true, "data-testid": `${testId}-displayname`, style: inputStyle })] }), _jsxs("label", { style: labelStyle, children: [_jsx("span", { style: labelTextStyle, children: "Timezone" }), _jsx("input", { type: "text", value: timezone, onChange: (e) => setTimezone(e.target.value), placeholder: "America/Los_Angeles", autoComplete: "off", "data-testid": `${testId}-timezone`, style: inputStyle }), _jsx("span", { style: hintStyle, children: "IANA tz string (leave blank to use the browser default)" })] }), _jsxs("label", { style: labelStyle, children: [_jsx("span", { style: labelTextStyle, children: "Language" }), _jsx("input", { type: "text", value: locale, onChange: (e) => setLocale(e.target.value), placeholder: "en-US", autoComplete: "off", "data-testid": `${testId}-locale`, style: inputStyle }), _jsx("span", { style: hintStyle, children: "BCP-47 tag (leave blank to match the browser)" })] }), saveError && (_jsx("div", { "data-testid": `${testId}-save-error`, style: errorStyle, children: humanReadable(saveError) }))] }))] }));
}
// ---------------------------------------------------------------
// Helpers + styles
// ---------------------------------------------------------------
/** Reads the BCP-47 language tag out of collab's free-form preferences. */
function localeOf(profile) {
    var _a;
    const v = (_a = profile.preferences) === null || _a === void 0 ? void 0 : _a.locale;
    return typeof v === 'string' ? v : '';
}
function humanReadable(err) {
    // collab PATCH /auth/profile → 409 'conflict-or-invalid', 401
    // 'unauthenticated'.
    switch (err.code) {
        case 'conflict-or-invalid':
            return 'That display name or email is invalid or already in use.';
        case 'unauthenticated':
            return 'Your session has expired. Sign in again.';
        default:
            return err.message || 'Could not save. Please try again.';
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
const hintStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted, #94a3b8)',
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
const loadingStyle = {
    padding: '24px 0',
    fontSize: 13,
    color: 'var(--doc-text-muted, #64748b)',
    textAlign: 'center',
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
        fontFamily: 'inherit',
    };
}
function secondaryButtonStyle(disabled) {
    return {
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid var(--doc-border, #cbd5e1)',
        background: 'transparent',
        color: 'var(--doc-text, #0f172a)',
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
    };
}
//# sourceMappingURL=ProfileSettingsDialog.js.map