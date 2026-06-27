import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MaterialSymbol } from './ui/Icons';
import { Tooltip } from './ui/Tooltip';
import { formatShortcut } from '../lib/platform';
import { useTranslation } from '../i18n';
// Floating rounded card pinned to the top-right of the canvas area (not
// edge-docked). Positioned absolutely within the editor's below-toolbar row
// (which is position:relative), so it overlays the grey desk margin without
// taking flex space or scrolling with the document.
const railStyle = {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 30,
    width: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
    padding: 4,
    background: 'var(--doc-surface)',
    border: '1px solid var(--doc-border-light)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-2)',
};
const btnStyle = (active) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 32,
    margin: '0 auto',
    border: 0,
    borderRadius: 4,
    background: active ? 'var(--doc-primary-light, #e8f0fe)' : 'transparent',
    color: active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-text-on-surface-muted, #5f6368)',
    cursor: 'pointer',
    transition: 'background var(--doc-anim-fast), color var(--doc-anim-fast)',
});
const markerStyle = {
    content: '""',
    position: 'absolute',
    left: -2,
    top: 6,
    bottom: 6,
    width: 2,
    background: 'var(--doc-primary, #1a73e8)',
    borderRadius: '0 2px 2px 0',
};
function RailButton({ testId, label, icon, active, onClick, }) {
    return (_jsx(Tooltip, { content: label, side: "left", children: _jsxs("button", { type: "button", className: "ep-focus-ring", style: btnStyle(active), onClick: onClick, onMouseDown: (e) => e.preventDefault(), "aria-pressed": active, "aria-label": label, "data-testid": testId, children: [active && _jsx("span", { "aria-hidden": "true", style: markerStyle }), _jsx(MaterialSymbol, { name: icon, size: 18 })] }) }));
}
export function PanelRail({ outlineVisible, commentsVisible, historyVisible, onToggleOutline, onToggleComments, onToggleHistory, propertiesVisible, onToggleProperties, writerVisible, onToggleWriter, chatVisible, onToggleChat, }) {
    const { t } = useTranslation();
    // No-op if nothing to toggle (host wired no panels) — render nothing
    // rather than an empty bar.
    if (!onToggleOutline &&
        !onToggleComments &&
        !onToggleHistory &&
        !onToggleProperties &&
        !onToggleWriter &&
        !onToggleChat)
        return null;
    const outlineShortcut = formatShortcut('Ctrl+Shift+H');
    return (_jsxs("aside", { style: railStyle, "aria-label": "Panels", "data-testid": "panel-rail", children: [onToggleOutline && (_jsx(RailButton, { testId: "rail-outline", label: `${t('editor.showDocumentOutline')} (${outlineShortcut})`, icon: "format_list_bulleted", active: !!outlineVisible, onClick: onToggleOutline })), onToggleComments && (_jsx(RailButton, { testId: "rail-comments", label: commentsVisible ? 'Hide comments' : 'Comments', icon: "comment", active: !!commentsVisible, onClick: onToggleComments })), onToggleHistory && (_jsx(RailButton, { testId: "rail-history", label: historyVisible ? 'Hide version history' : 'Version history', icon: "history", active: !!historyVisible, onClick: onToggleHistory })), onToggleProperties && (_jsx(RailButton, { testId: "rail-properties", label: propertiesVisible ? 'Hide format panel' : 'Format', icon: "tune", active: !!propertiesVisible, onClick: onToggleProperties })), onToggleWriter && (_jsx(RailButton, { testId: "rail-writer", label: writerVisible ? 'Hide Writing Assistant' : 'Writing Assistant', icon: "auto_awesome", active: !!writerVisible, onClick: onToggleWriter })), onToggleChat && (_jsx(RailButton, { testId: "rail-chat", label: chatVisible ? 'Hide chat' : 'Ask AI', icon: "chat_bubble_outline", active: !!chatVisible, onClick: onToggleChat }))] }));
}
export default PanelRail;
//# sourceMappingURL=PanelRail.js.map