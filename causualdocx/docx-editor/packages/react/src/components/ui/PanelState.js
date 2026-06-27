import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MaterialSymbol } from './MaterialSymbol';
const ROOT_STYLE = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '24px 18px',
    textAlign: 'center',
    color: 'var(--doc-text-muted, #6b7280)',
};
const MESSAGE_STYLE = {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const HINT_STYLE = {
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--doc-text-muted, #6b7280)',
    maxWidth: 260,
};
const RETRY_STYLE = {
    marginTop: 6,
    padding: '4px 12px',
    fontSize: 12,
    border: '1px solid var(--doc-primary, #1a73e8)',
    background: 'transparent',
    color: 'var(--doc-primary, #1a73e8)',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const SPINNER_STYLE = {
    width: 20,
    height: 20,
    border: '2px solid var(--doc-border, #e5e7eb)',
    borderTopColor: 'var(--doc-primary, #1a73e8)',
    borderRadius: '50%',
    animation: 'ep-spin 800ms linear infinite',
};
export function PanelState({ kind, message, hint, onRetry, icon, style }) {
    return (_jsxs("div", { role: kind === 'error' ? 'alert' : 'status', "aria-live": kind === 'loading' ? 'polite' : undefined, "data-testid": `panel-state-${kind}`, style: Object.assign(Object.assign({}, ROOT_STYLE), style), children: [kind === 'loading' ? (_jsx("div", { "aria-hidden": "true", style: SPINNER_STYLE })) : (icon && _jsx(MaterialSymbol, { name: icon, size: 28 })), _jsx("div", { style: MESSAGE_STYLE, children: message }), hint && _jsx("div", { style: HINT_STYLE, children: hint }), kind === 'error' && onRetry && (_jsx("button", { type: "button", style: RETRY_STYLE, onClick: onRetry, "data-testid": "panel-state-retry", children: "Retry" }))] }));
}
export default PanelState;
//# sourceMappingURL=PanelState.js.map