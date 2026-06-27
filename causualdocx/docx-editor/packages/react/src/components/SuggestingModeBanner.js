import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from '../i18n';
import { formatShortcut } from '../lib/platform';
const ROOT_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 16px',
    background: '#fef7e0', // Google Docs-style soft yellow
    color: '#3c4043',
    borderBottom: '1px solid #fde293',
    fontSize: 13,
    lineHeight: 1.4,
};
const MESSAGE_STYLE = {
    flex: 1,
    minWidth: 0,
};
const STRONG_STYLE = {
    fontWeight: 600,
    marginRight: 6,
};
const ACTION_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    fontSize: 12,
    border: '1px solid #c9a227',
    background: 'transparent',
    color: '#3c4043',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
    flexShrink: 0,
};
const CHIP_STYLE = {
    fontSize: 11,
    color: '#8d6a00',
    fontWeight: 400,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
};
export function SuggestingModeBanner({ onSwitchToEditing }) {
    const { t } = useTranslation();
    // The mode-cycle shortcut walks Editing → Suggesting → Viewing →
    // Editing, so the same key flips us back. Surface the chip on the
    // button so users learn the shortcut.
    const shortcut = formatShortcut('Ctrl+Shift+E');
    return (_jsxs("div", { role: "status", "aria-live": "polite", "data-testid": "suggesting-mode-banner", style: ROOT_STYLE, children: [_jsxs("div", { style: MESSAGE_STYLE, children: [_jsx("span", { style: STRONG_STYLE, children: t('suggestingBanner.title') }), _jsx("span", { children: t('suggestingBanner.body') })] }), _jsxs("button", { type: "button", style: ACTION_STYLE, "data-testid": "suggesting-banner-switch", onClick: onSwitchToEditing, title: `${t('suggestingBanner.switchToEditing')} (${shortcut})`, children: [t('suggestingBanner.switchToEditing'), _jsx("span", { style: CHIP_STYLE, "aria-hidden": "true", children: shortcut })] })] }));
}
export default SuggestingModeBanner;
//# sourceMappingURL=SuggestingModeBanner.js.map