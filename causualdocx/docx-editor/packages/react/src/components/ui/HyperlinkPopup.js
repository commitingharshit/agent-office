import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * HyperlinkPopup Component
 *
 * Google Docs-style floating popup that appears when clicking on a hyperlink.
 * View mode: shows URL, copy, edit, and unlink buttons.
 * Edit mode: shows text + URL inputs with Apply button.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '../../i18n';
import { Tooltip } from './Tooltip';
// ============================================================================
// STYLES
// ============================================================================
const BASE_POPUP_STYLE = {
    position: 'fixed',
    zIndex: 10000,
    background: 'var(--doc-surface, white)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid var(--doc-border, #dadce0)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
};
const POPUP_STYLE = Object.assign(Object.assign({}, BASE_POPUP_STYLE), { padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '400px' });
const EDIT_POPUP_STYLE = Object.assign(Object.assign({}, BASE_POPUP_STYLE), { padding: '12px', width: '320px' });
const ICON_STYLE = {
    width: '20px',
    height: '20px',
    flexShrink: 0,
    color: 'var(--doc-text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
const URL_LINK_STYLE = {
    color: 'var(--doc-primary)',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '220px',
    fontSize: '14px',
    lineHeight: '20px',
    cursor: 'pointer',
};
const ICON_BUTTON_STYLE = {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    padding: 0,
    flexShrink: 0,
};
const SEPARATOR_STYLE = {
    width: '1px',
    height: '20px',
    background: 'var(--doc-border)',
    flexShrink: 0,
};
const EDIT_ROW_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
};
const EDIT_INPUT_STYLE = {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--doc-border, #dadce0)',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    lineHeight: '20px',
};
const APPLY_BUTTON_STYLE = {
    color: 'var(--doc-primary)',
    fontWeight: 600,
    fontSize: '14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '4px',
    flexShrink: 0,
};
// ============================================================================
// SVG ICONS
// ============================================================================
const SVG_PROPS = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};
function GlobeIcon() {
    return (_jsxs("svg", Object.assign({}, SVG_PROPS, { children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M2 12h20" }), _jsx("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })] })));
}
function CopyIcon() {
    return (_jsxs("svg", Object.assign({}, SVG_PROPS, { children: [_jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), _jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })] })));
}
function EditIcon() {
    return (_jsx("svg", Object.assign({}, SVG_PROPS, { children: _jsx("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" }) })));
}
function UnlinkIcon() {
    return (_jsxs("svg", Object.assign({}, SVG_PROPS, { children: [_jsx("path", { d: "M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }), _jsx("path", { d: "M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "5" }), _jsx("line", { x1: "2", y1: "8", x2: "5", y2: "8" }), _jsx("line", { x1: "16", y1: "19", x2: "16", y2: "22" }), _jsx("line", { x1: "19", y1: "16", x2: "22", y2: "16" })] })));
}
function TextIcon() {
    return (_jsxs("svg", Object.assign({}, SVG_PROPS, { children: [_jsx("line", { x1: "4", y1: "9", x2: "20", y2: "9" }), _jsx("line", { x1: "4", y1: "15", x2: "20", y2: "15" }), _jsx("line", { x1: "10", y1: "3", x2: "8", y2: "21" }), _jsx("line", { x1: "16", y1: "3", x2: "14", y2: "21" })] })));
}
function LinkIcon() {
    return (_jsxs("svg", Object.assign({}, SVG_PROPS, { children: [_jsx("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), _jsx("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })] })));
}
// ============================================================================
// ICON BUTTON HELPER
// ============================================================================
function PopupIconButton({ title, onClick, children, }) {
    return (_jsx(Tooltip, { content: title, children: _jsx("button", { type: "button", className: "ep-hyperlink-popup__icon-btn", style: ICON_BUTTON_STYLE, "aria-label": title, onClick: onClick, children: children }) }));
}
// ============================================================================
// COMPONENT
// ============================================================================
export function HyperlinkPopup({ data, onNavigate, onCopy, onEdit, onRemove, onClose, readOnly, }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState('view');
    const [editText, setEditText] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const popupRef = useRef(null);
    const textInputRef = useRef(null);
    // Reset state when data changes
    useEffect(() => {
        if (data) {
            setMode('view');
            setEditText(data.displayText);
            setEditUrl(data.href);
        }
    }, [data]);
    // Focus text input when entering edit mode
    useEffect(() => {
        if (mode === 'edit') {
            requestAnimationFrame(() => {
                var _a, _b;
                (_a = textInputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                (_b = textInputRef.current) === null || _b === void 0 ? void 0 : _b.select();
            });
        }
    }, [mode]);
    // Close on outside click
    useEffect(() => {
        if (!data)
            return;
        let aborted = false;
        const handleMouseDown = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Defer so the click that opened the popup doesn't immediately close it
        const timer = setTimeout(() => {
            if (!aborted)
                document.addEventListener('mousedown', handleMouseDown);
        }, 0);
        return () => {
            aborted = true;
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [data, onClose]);
    // Close on Escape
    useEffect(() => {
        if (!data)
            return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (mode === 'edit') {
                    setMode('view');
                }
                else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [data, mode, onClose]);
    const handleCopy = useCallback(() => {
        if (!data)
            return;
        onCopy(data.href);
        toast('Link copied to clipboard');
    }, [data, onCopy]);
    const handleEditClick = useCallback(() => {
        if (!data)
            return;
        // Reset fields in case user previously edited and pressed Escape
        setEditText(data.displayText);
        setEditUrl(data.href);
        setMode('edit');
    }, [data]);
    const handleApply = useCallback(() => {
        const trimmedUrl = editUrl.trim();
        if (!trimmedUrl)
            return;
        onEdit(editText.trim() || trimmedUrl, trimmedUrl);
    }, [editText, editUrl, onEdit]);
    const handleEditKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    }, [handleApply]);
    if (!data)
        return null;
    // Calculate position: below the anchor element
    const { anchorRect } = data;
    const popupTop = anchorRect.bottom + 4;
    const popupLeft = anchorRect.left;
    if (mode === 'edit') {
        return (_jsxs("div", { ref: popupRef, className: "ep-hyperlink-popup ep-hyperlink-popup--edit", style: Object.assign(Object.assign({}, EDIT_POPUP_STYLE), { top: popupTop, left: popupLeft }), onMouseDown: (e) => e.stopPropagation(), children: [_jsxs("div", { style: EDIT_ROW_STYLE, children: [_jsx("span", { style: ICON_STYLE, children: _jsx(TextIcon, {}) }), _jsx("input", { ref: textInputRef, type: "text", style: EDIT_INPUT_STYLE, value: editText, onChange: (e) => setEditText(e.target.value), onKeyDown: handleEditKeyDown, placeholder: t('hyperlinkPopup.displayTextPlaceholder'), onFocus: (e) => (e.target.style.borderColor = 'var(--doc-primary)'), onBlur: (e) => (e.target.style.borderColor = '#dadce0') })] }), _jsxs("div", { style: Object.assign(Object.assign({}, EDIT_ROW_STYLE), { marginBottom: 0 }), children: [_jsx("span", { style: ICON_STYLE, children: _jsx(LinkIcon, {}) }), _jsx("input", { type: "text", style: EDIT_INPUT_STYLE, value: editUrl, onChange: (e) => setEditUrl(e.target.value), onKeyDown: handleEditKeyDown, placeholder: t('hyperlinkPopup.urlPlaceholder'), onFocus: (e) => (e.target.style.borderColor = 'var(--doc-primary)'), onBlur: (e) => (e.target.style.borderColor = '#dadce0') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, APPLY_BUTTON_STYLE), { opacity: editUrl.trim() ? 1 : 0.5, cursor: editUrl.trim() ? 'pointer' : 'default' }), onClick: handleApply, disabled: !editUrl.trim(), children: t('common.apply') })] })] }));
    }
    // View mode
    return (_jsxs("div", { ref: popupRef, className: "ep-hyperlink-popup", style: Object.assign(Object.assign({}, POPUP_STYLE), { top: popupTop, left: popupLeft }), onMouseDown: (e) => e.stopPropagation(), children: [_jsx("span", { style: ICON_STYLE, children: _jsx(GlobeIcon, {}) }), _jsx("a", { href: data.href, style: URL_LINK_STYLE, title: data.href, target: "_blank", rel: "noopener noreferrer", onClick: (e) => {
                    e.preventDefault();
                    onNavigate(data.href);
                }, children: data.href }), _jsx("span", { style: SEPARATOR_STYLE }), _jsx(PopupIconButton, { title: t('hyperlinkPopup.copyLink'), onClick: handleCopy, children: _jsx(CopyIcon, {}) }), !readOnly && (_jsxs(_Fragment, { children: [_jsx(PopupIconButton, { title: t('hyperlinkPopup.editLink'), onClick: handleEditClick, children: _jsx(EditIcon, {}) }), _jsx(PopupIconButton, { title: t('hyperlinkPopup.removeLink'), onClick: onRemove, children: _jsx(UnlinkIcon, {}) })] }))] }));
}
export default HyperlinkPopup;
//# sourceMappingURL=HyperlinkPopup.js.map