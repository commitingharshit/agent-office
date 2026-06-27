import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Dialog } from '../ui/Dialog';
/* Body content styles only — the shell owns the rest. */
const bodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};
const rowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '12px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background var(--doc-anim-fast)',
};
const labelTextStyle = {
    fontSize: 14,
    color: 'var(--doc-text)',
    fontWeight: 500,
    letterSpacing: '-0.003em',
};
const hintStyle = {
    fontSize: 12.5,
    color: 'var(--doc-text-muted)',
    marginTop: 3,
    lineHeight: 1.45,
};
/* Custom switch — Mac-style toggle pill. The native checkbox is
   hidden but stays keyboard-focusable via its label so the row
   click + Space key still toggle correctly. */
const switchWrapStyle = {
    position: 'relative',
    flexShrink: 0,
    marginTop: 2,
    display: 'inline-block',
    width: 32,
    height: 18,
};
// Native checkbox sits OVER the switch pill, transparent, but
// clickable. That way the visual is our switch, but Playwright /
// keyboard / assistive tech can still target the real input.
const overlayCheckStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
};
const switchPillStyle = (on) => ({
    width: 32,
    height: 18,
    borderRadius: 999,
    background: on ? 'var(--doc-primary)' : 'var(--doc-border)',
    position: 'relative',
    transition: 'background var(--doc-anim-base), box-shadow var(--doc-anim-base)',
    boxShadow: 'inset 0 0 0 1px rgba(15, 23, 42, 0.06)',
});
const switchKnobStyle = (on) => ({
    position: 'absolute',
    top: 2,
    left: on ? 16 : 2,
    width: 14,
    height: 14,
    borderRadius: 999,
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.18), 0 1px 1px rgba(0, 0, 0, 0.08)',
    transition: 'left var(--doc-anim-base)',
});
const codeStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11.5,
    padding: '1px 5px',
    borderRadius: 4,
    background: 'var(--doc-surface-sunken)',
    border: '1px solid var(--doc-border-light)',
};
const primaryBtnStyle = {
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid var(--doc-primary)',
    background: 'var(--doc-primary)',
    color: 'white',
    borderRadius: 6,
    cursor: 'pointer',
};
function ToggleRow({ checked, onChange, testId, title, description, }) {
    return (_jsxs("label", { style: rowStyle, onMouseEnter: (e) => {
            e.currentTarget.style.background = 'var(--doc-bg-hover)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.background = 'transparent';
        }, children: [_jsxs("span", { style: switchWrapStyle, children: [_jsx("span", { style: switchPillStyle(checked), "aria-hidden": "true", children: _jsx("span", { style: switchKnobStyle(checked) }) }), _jsx("input", { type: "checkbox", checked: checked, onChange: (e) => onChange(e.target.checked), "data-testid": testId, style: overlayCheckStyle })] }), _jsxs("span", { style: { flex: 1 }, children: [_jsx("div", { style: labelTextStyle, children: title }), _jsx("div", { style: hintStyle, children: description })] })] }));
}
export function PreferencesDialog({ isOpen, onClose, preferences, onChange, }) {
    return (_jsx(Dialog, { isOpen: isOpen, onClose: onClose, title: "Preferences", width: 520, testId: "preferences-dialog", footer: _jsx("button", { type: "button", style: primaryBtnStyle, onClick: onClose, children: "Done" }), children: _jsxs("div", { style: bodyStyle, children: [_jsx(ToggleRow, { checked: preferences.smartQuotes, onChange: (v) => onChange('smartQuotes', v), testId: "pref-smartquotes", title: "Use smart quotes", description: _jsxs(_Fragment, { children: ["Replace straight quotes, dashes, and ellipses as you type (", _jsx("code", { style: codeStyle, children: "\" \u2192 \u201C" }), ", ", _jsx("code", { style: codeStyle, children: "-- \u2192 \u2014" }), ",", ' ', _jsx("code", { style: codeStyle, children: "... \u2192 \u2026" }), ")."] }) }), _jsx(ToggleRow, { checked: preferences.autocorrect, onChange: (v) => onChange('autocorrect', v), testId: "pref-autocorrect", title: "Autocorrect", description: _jsxs(_Fragment, { children: ["Symbol sequences (", _jsx("code", { style: codeStyle, children: "(c) \u2192 \u00A9" }), ") and common-typo fixes (", _jsx("code", { style: codeStyle, children: "teh \u2192 the" }), ")."] }) })] }) }));
}
export default PreferencesDialog;
//# sourceMappingURL=PreferencesDialog.js.map