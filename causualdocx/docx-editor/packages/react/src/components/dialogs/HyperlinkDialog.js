import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Hyperlink Dialog Component
 *
 * Modal dialog for inserting and editing hyperlinks in the document.
 * Supports both external URLs and internal bookmark links.
 *
 * Migrated onto the shared <Dialog> shell in Phase 7 — the shell
 * handles backdrop / blur / scale-in motion / close X / focus trap /
 * Esc dismissal. This file only describes the body form (URL/bookmark
 * tabs, display text, tooltip) + footer action row.
 *
 * Features:
 * - Input for URL (http, https, mailto, tel, etc.)
 * - Input for display text
 * - Edit existing hyperlinks
 * - Remove hyperlink option
 * - Internal bookmark selection
 * - Validation and error handling
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../i18n';
import { Dialog } from '../ui/Dialog';
// ============================================================================
// STYLES — body / form only. Shell chrome lives in <Dialog>.
// ============================================================================
const FORM_GROUP_STYLE = {
    marginBottom: '16px',
};
const LABEL_STYLE = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--doc-text)',
    letterSpacing: '-0.003em',
};
const INPUT_STYLE = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--doc-border)',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    background: 'var(--doc-surface)',
    color: 'var(--doc-text)',
    transition: 'border-color var(--doc-anim-fast), box-shadow var(--doc-anim-fast)',
};
const INPUT_ERROR_STYLE = Object.assign(Object.assign({}, INPUT_STYLE), { borderColor: 'var(--doc-error)' });
const SELECT_STYLE = Object.assign(Object.assign({}, INPUT_STYLE), { cursor: 'pointer' });
const ERROR_TEXT_STYLE = {
    color: 'var(--doc-error)',
    fontSize: '12px',
    marginTop: '6px',
};
const HINT_TEXT_STYLE = {
    color: 'var(--doc-text-muted)',
    fontSize: '12px',
    marginTop: '6px',
};
const TAB_CONTAINER_STYLE = {
    display: 'flex',
    borderBottom: '1px solid var(--doc-border-light)',
    marginBottom: '16px',
    gap: 4,
};
const TAB_BUTTON_STYLE = {
    padding: '8px 14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--doc-text-muted)',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    transition: 'color var(--doc-anim-fast)',
};
const TAB_BUTTON_ACTIVE_STYLE = Object.assign(Object.assign({}, TAB_BUTTON_STYLE), { color: 'var(--doc-primary)', borderBottomColor: 'var(--doc-primary)', fontWeight: 600 });
const BUTTON_BASE_STYLE = {
    padding: '7px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'background var(--doc-anim-fast)',
};
const PRIMARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-primary)', borderColor: 'var(--doc-primary)', color: 'white' });
const SECONDARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-surface)', color: 'var(--doc-text)', borderColor: 'var(--doc-border)' });
const DANGER_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'transparent', color: 'var(--doc-error)', borderColor: 'var(--doc-border)' });
const DISABLED_BUTTON_STYLE = Object.assign(Object.assign({}, PRIMARY_BUTTON_STYLE), { opacity: 0.5, cursor: 'not-allowed' });
// ============================================================================
// URL VALIDATION
// ============================================================================
/**
 * Validate URL format. Accepts http, https, mailto, tel, ftp, sftp,
 * file. Returns true when the input looks like a URL we can normalise
 * into a real link.
 */
export function isValidUrl(url) {
    const trimmed = url.trim();
    if (!trimmed)
        return false;
    if (/^(https?|ftp|sftp|file|mailto|tel|sms):/i.test(trimmed)) {
        try {
            // mailto: and tel: don't parse via URL() in all engines.
            if (/^(mailto|tel|sms):/i.test(trimmed))
                return true;
            // eslint-disable-next-line no-new
            new URL(trimmed);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    // Allow bare domain forms — normalize will prefix https://
    return /^[^\s]+\.[^\s]+$/.test(trimmed);
}
/**
 * Normalize a URL into a canonical form for storage.
 */
export function normalizeUrl(url) {
    const trimmed = url.trim();
    if (/^(https?|ftp|sftp|file|mailto|tel|sms):/i.test(trimmed)) {
        return trimmed;
    }
    // Email-ish patterns become mailto:
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return `mailto:${trimmed}`;
    }
    // Phone-ish patterns become tel:
    if (/^\+?[\d\s\-().]{7,}$/.test(trimmed)) {
        return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
    }
    return `https://${trimmed}`;
}
/**
 * Classify a URL for downstream handling. Currently informational —
 * exposed for tests + future per-type UI hints.
 */
export function getUrlType(url) {
    if (/^mailto:/i.test(url))
        return 'email';
    if (/^tel:/i.test(url))
        return 'phone';
    if (/^(ftp|sftp):/i.test(url))
        return 'ftp';
    if (/^https?:/i.test(url))
        return 'web';
    return 'unknown';
}
export function HyperlinkDialog({ isOpen, onClose, onSubmit, onRemove, initialData, selectedText = '', isEditing = false, bookmarks = [], }) {
    const { t } = useTranslation();
    const [linkType, setLinkType] = useState('url');
    const [url, setUrl] = useState('');
    const [displayText, setDisplayText] = useState('');
    const [bookmark, setBookmark] = useState('');
    const [tooltip, setTooltip] = useState('');
    const [urlError, setUrlError] = useState('');
    const [touched, setTouched] = useState(false);
    const urlInputRef = useRef(null);
    const bookmarkSelectRef = useRef(null);
    // Initialize form with initial data or selected text
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                if (initialData.bookmark) {
                    setLinkType('bookmark');
                    setBookmark(initialData.bookmark);
                }
                else {
                    setLinkType('url');
                    setUrl(initialData.url || '');
                }
                setDisplayText(initialData.displayText || '');
                setTooltip(initialData.tooltip || '');
            }
            else {
                setLinkType('url');
                setUrl('');
                setDisplayText(selectedText);
                setBookmark('');
                setTooltip('');
            }
            setUrlError('');
            setTouched(false);
        }
    }, [isOpen, initialData, selectedText]);
    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                var _a, _b;
                if (linkType === 'url') {
                    (_a = urlInputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                }
                else {
                    (_b = bookmarkSelectRef.current) === null || _b === void 0 ? void 0 : _b.focus();
                }
            }, 100);
        }
    }, [isOpen, linkType]);
    const validateUrl = useCallback(() => {
        if (linkType === 'url' && url.trim()) {
            if (!isValidUrl(url)) {
                setUrlError(t('dialogs.hyperlink.invalidUrl'));
            }
            else {
                setUrlError('');
            }
        }
        else {
            setUrlError('');
        }
    }, [linkType, url, t]);
    const handleSubmit = useCallback((e) => {
        e === null || e === void 0 ? void 0 : e.preventDefault();
        if (linkType === 'url') {
            if (!url.trim()) {
                setUrlError(t('dialogs.hyperlink.urlRequired'));
                setTouched(true);
                return;
            }
            if (!isValidUrl(url)) {
                setUrlError(t('dialogs.hyperlink.invalidUrl'));
                setTouched(true);
                return;
            }
        }
        else if (linkType === 'bookmark') {
            if (!bookmark)
                return;
        }
        const data = {
            displayText: displayText.trim() || undefined,
            tooltip: tooltip.trim() || undefined,
        };
        if (linkType === 'url') {
            data.url = normalizeUrl(url);
        }
        else {
            data.bookmark = bookmark;
        }
        onSubmit(data);
    }, [linkType, url, bookmark, displayText, tooltip, onSubmit, t]);
    const hasBookmarks = bookmarks.length > 0;
    const canSubmit = (linkType === 'url' && url.trim() && !urlError) || (linkType === 'bookmark' && bookmark);
    return (_jsx(Dialog, { isOpen: isOpen, onClose: onClose, title: _jsx("span", { id: "hyperlink-dialog-title", children: isEditing ? t('dialogs.hyperlink.titleEdit') : t('dialogs.hyperlink.titleInsert') }), width: 520, testId: "hyperlink-dialog", footer: _jsxs(_Fragment, { children: [isEditing && onRemove && (_jsx("button", { type: "button", className: "docx-hyperlink-dialog-remove", style: Object.assign(Object.assign({}, DANGER_BUTTON_STYLE), { marginRight: 'auto' }), onClick: onRemove, children: t('dialogs.hyperlink.removeLink') })), _jsx("button", { type: "button", className: "docx-hyperlink-dialog-cancel", style: SECONDARY_BUTTON_STYLE, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "submit", className: "docx-hyperlink-dialog-submit", style: canSubmit ? PRIMARY_BUTTON_STYLE : DISABLED_BUTTON_STYLE, onClick: handleSubmit, disabled: !canSubmit, children: isEditing ? t('common.update') : t('common.insert') })] }), children: _jsxs("form", { 
            // Legacy classes kept for backwards-compat with the
            // hyperlinks.spec.ts e2e selectors that pre-date the Phase 7
            // <Dialog> migration. `docx-hyperlink-dialog` is the wrapper
            // they look for; `docx-hyperlink-dialog-body` was the form's
            // original class.
            className: "docx-hyperlink-dialog docx-hyperlink-dialog-body", onSubmit: handleSubmit, children: [hasBookmarks && (_jsxs("div", { className: "docx-hyperlink-dialog-tabs", style: TAB_CONTAINER_STYLE, role: "tablist", children: [_jsx("button", { type: "button", role: "tab", className: `docx-hyperlink-dialog-tab ${linkType === 'url' ? 'active' : ''}`, style: linkType === 'url' ? TAB_BUTTON_ACTIVE_STYLE : TAB_BUTTON_STYLE, onClick: () => setLinkType('url'), "aria-selected": linkType === 'url', children: t('dialogs.hyperlink.tabWebAddress') }), _jsx("button", { type: "button", role: "tab", className: `docx-hyperlink-dialog-tab ${linkType === 'bookmark' ? 'active' : ''}`, style: linkType === 'bookmark' ? TAB_BUTTON_ACTIVE_STYLE : TAB_BUTTON_STYLE, onClick: () => setLinkType('bookmark'), "aria-selected": linkType === 'bookmark', children: t('dialogs.hyperlink.tabBookmark') })] })), linkType === 'url' && (_jsxs("div", { className: "docx-hyperlink-dialog-field", style: FORM_GROUP_STYLE, children: [_jsx("label", { htmlFor: "hyperlink-url", style: LABEL_STYLE, children: t('dialogs.hyperlink.urlLabel') }), _jsx("input", { ref: urlInputRef, id: "hyperlink-url", type: "text", className: "docx-hyperlink-dialog-input", style: urlError && touched ? INPUT_ERROR_STYLE : INPUT_STYLE, value: url, onChange: (e) => {
                                setUrl(e.target.value);
                                if (touched)
                                    setUrlError('');
                            }, onBlur: () => {
                                setTouched(true);
                                validateUrl();
                            }, placeholder: t('dialogs.hyperlink.urlPlaceholder'), "aria-invalid": !!urlError, "aria-describedby": urlError ? 'url-error' : 'url-hint' }), urlError && touched && (_jsx("div", { id: "url-error", style: ERROR_TEXT_STYLE, children: urlError })), !urlError && (_jsx("div", { id: "url-hint", style: HINT_TEXT_STYLE, children: t('dialogs.hyperlink.urlHint') }))] })), linkType === 'bookmark' && (_jsxs("div", { className: "docx-hyperlink-dialog-field", style: FORM_GROUP_STYLE, children: [_jsx("label", { htmlFor: "hyperlink-bookmark", style: LABEL_STYLE, children: t('dialogs.hyperlink.bookmarkLabel') }), _jsxs("select", { ref: bookmarkSelectRef, id: "hyperlink-bookmark", className: "docx-hyperlink-dialog-select", style: SELECT_STYLE, value: bookmark, onChange: (e) => setBookmark(e.target.value), children: [_jsx("option", { value: "", children: t('dialogs.hyperlink.bookmarkPlaceholder') }), bookmarks.map((bm) => (_jsx("option", { value: bm.name, children: bm.label || bm.name }, bm.name)))] })] })), _jsxs("div", { className: "docx-hyperlink-dialog-field", style: FORM_GROUP_STYLE, children: [_jsx("label", { htmlFor: "hyperlink-display-text", style: LABEL_STYLE, children: t('dialogs.hyperlink.displayTextLabel') }), _jsx("input", { id: "hyperlink-display-text", type: "text", className: "docx-hyperlink-dialog-input", style: INPUT_STYLE, value: displayText, onChange: (e) => setDisplayText(e.target.value), placeholder: t('dialogs.hyperlink.displayTextPlaceholder') }), _jsx("div", { style: HINT_TEXT_STYLE, children: t('dialogs.hyperlink.displayTextHint') })] }), _jsxs("div", { className: "docx-hyperlink-dialog-field", style: FORM_GROUP_STYLE, children: [_jsx("label", { htmlFor: "hyperlink-tooltip", style: LABEL_STYLE, children: t('dialogs.hyperlink.tooltipLabel') }), _jsx("input", { id: "hyperlink-tooltip", type: "text", className: "docx-hyperlink-dialog-input", style: INPUT_STYLE, value: tooltip, onChange: (e) => setTooltip(e.target.value), placeholder: t('dialogs.hyperlink.tooltipPlaceholder') })] })] }) }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create HyperlinkData from a URL string
 */
export function createHyperlinkData(url, displayText) {
    return {
        url: normalizeUrl(url),
        displayText,
    };
}
/**
 * Create HyperlinkData for an internal bookmark
 */
export function createBookmarkLinkData(bookmark, displayText) {
    return {
        bookmark,
        displayText,
    };
}
/**
 * Check if HyperlinkData is for an external URL
 */
export function isExternalHyperlinkData(data) {
    return !!data.url && !data.bookmark;
}
/**
 * Check if HyperlinkData is for an internal bookmark
 */
export function isBookmarkHyperlinkData(data) {
    return !!data.bookmark;
}
/**
 * Get display text from HyperlinkData, falling back to URL/bookmark
 */
export function getDisplayText(data) {
    if (data.displayText)
        return data.displayText;
    if (data.url)
        return data.url.replace(/^https?:\/\//, '');
    if (data.bookmark)
        return data.bookmark;
    return '';
}
/**
 * Convert email address to mailto: link
 */
export function emailToMailto(email) {
    if (email.startsWith('mailto:'))
        return email;
    return `mailto:${email}`;
}
/**
 * Convert phone number to tel: link
 */
export function phoneToTel(phone) {
    if (phone.startsWith('tel:'))
        return phone;
    const cleaned = phone.replace(/[\s\-().]/g, '');
    return `tel:${cleaned}`;
}
/**
 * Extract bookmarks from document for the dialog
 */
export function extractBookmarksForDialog(bookmarks) {
    return bookmarks
        .filter((bm) => !bm.name.startsWith('_'))
        .map((bm) => ({ name: bm.name, label: bm.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
// ============================================================================
// HOOK — moved to `./useHyperlinkDialog.ts`. Re-exported below.
// ============================================================================
export { useHyperlinkDialog, } from './useHyperlinkDialog';
export default HyperlinkDialog;
//# sourceMappingURL=HyperlinkDialog.js.map