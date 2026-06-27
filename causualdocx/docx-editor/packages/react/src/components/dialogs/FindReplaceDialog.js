import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Find and Replace Dialog Component
 *
 * Modal dialog for searching and replacing text in the document.
 * Supports find, find next/previous, replace, and replace all operations.
 *
 * Logic and utilities are in separate files:
 * - findReplaceUtils.ts — Pure search/replace functions and types
 * - useFindReplace.ts   — React hook for dialog state management
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../i18n';
export { createDefaultFindOptions, findAllMatches, escapeRegexString, createSearchPattern, replaceAllInContent, replaceFirstInContent, getMatchCountText, isEmptySearch, getDefaultHighlightOptions, findInDocument, findInParagraph, scrollToMatch, } from './findReplaceUtils';
export { useFindReplace } from './useFindReplace';
// ============================================================================
// STYLES
// ============================================================================
const DIALOG_OVERLAY_STYLE = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    zIndex: 10000,
    pointerEvents: 'none',
};
/* ============================================================
   FindReplaceDialog is a NON-MODAL floating panel — the editor
   stays interactive while it's open. Premium pass keeps that
   contract intact while bringing the chrome in line with the
   modal Dialog shell:
     - 12px corner radius (matches the modal shell's 14px family)
     - Three-layer shadow (ambient + edge + landing)
     - Hairline --doc-border-light outline
     - Soft scale-in motion (200ms, same curve as the modal shell)
     - Refined header typography (-0.005em letterspaced)
     - Close X is a stroked SVG (not a glyph)
   ============================================================ */
const DIALOG_CONTENT_STYLE = {
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: '12px',
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.08), 0 24px 64px rgba(15, 23, 42, 0.18)',
    border: '1px solid var(--doc-border-light)',
    minWidth: 'min(380px, calc(100vw - 32px))',
    maxWidth: '460px',
    width: '100%',
    margin: 'clamp(40px, 8vw, 60px) clamp(8px, 2.5vw, 20px) clamp(8px, 2.5vw, 20px) clamp(8px, 2.5vw, 20px)',
    pointerEvents: 'auto',
    animation: 'docFindReplaceIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
    overflow: 'hidden',
};
const DIALOG_HEADER_STYLE = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--doc-border-light)',
    backgroundColor: 'var(--doc-surface-muted)',
};
const DIALOG_TITLE_STYLE = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--doc-text)',
    letterSpacing: '-0.005em',
};
const CLOSE_BUTTON_STYLE = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    padding: 6,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginRight: -6,
    transition: 'background 80ms cubic-bezier(0.4, 0, 0.2, 1), color 80ms cubic-bezier(0.4, 0, 0.2, 1)',
};
const DIALOG_BODY_STYLE = {
    padding: '14px 16px 12px',
};
const ROW_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
};
const LABEL_STYLE = {
    width: '60px',
    fontSize: '13px',
    color: 'var(--doc-text)',
    flexShrink: 0,
};
const INPUT_STYLE = {
    flex: 1,
    padding: '7px 10px',
    border: '1px solid var(--doc-border)',
    borderRadius: '6px',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
    background: 'var(--doc-surface)',
    color: 'var(--doc-text)',
    transition: 'border-color 80ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 80ms cubic-bezier(0.4, 0, 0.2, 1)',
};
const INPUT_FOCUS_STYLE = Object.assign(Object.assign({}, INPUT_STYLE), { borderColor: 'var(--doc-primary)', boxShadow: '0 0 0 3px rgba(26, 115, 232, 0.16)' });
const BUTTON_CONTAINER_STYLE = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginLeft: '8px',
};
const BUTTON_BASE_STYLE = {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid var(--doc-border)',
    backgroundColor: 'var(--doc-surface)',
    color: 'var(--doc-text)',
    minWidth: '80px',
    textAlign: 'center',
    transition: 'background 80ms cubic-bezier(0.4, 0, 0.2, 1), border-color 80ms cubic-bezier(0.4, 0, 0.2, 1)',
};
const BUTTON_DISABLED_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-surface-muted)', color: 'var(--doc-text-subtle)', cursor: 'not-allowed' });
const NAV_BUTTON_STYLE = {
    padding: '6px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid var(--doc-border)',
    backgroundColor: 'var(--doc-surface)',
    color: 'var(--doc-text-muted)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 80ms cubic-bezier(0.4, 0, 0.2, 1), color 80ms cubic-bezier(0.4, 0, 0.2, 1)',
};
const NAV_BUTTON_DISABLED_STYLE = Object.assign(Object.assign({}, NAV_BUTTON_STYLE), { color: 'var(--doc-text-subtle)', cursor: 'not-allowed' });
const OPTIONS_CONTAINER_STYLE = {
    display: 'flex',
    gap: '16px',
    marginTop: '4px',
    marginLeft: '68px',
};
const CHECKBOX_LABEL_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--doc-text-muted)',
    cursor: 'pointer',
};
const CHECKBOX_STYLE = {
    width: '14px',
    height: '14px',
    cursor: 'pointer',
};
const STATUS_STYLE = {
    marginLeft: '68px',
    fontSize: '12px',
    color: 'var(--doc-text-muted)',
    marginBottom: '8px',
};
const NO_RESULTS_STYLE = Object.assign(Object.assign({}, STATUS_STYLE), { color: 'var(--doc-error)' });
// ============================================================================
// ICONS
// ============================================================================
const ChevronUpIcon = ({ style }) => (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: style, children: _jsx("polyline", { points: "18 15 12 9 6 15" }) }));
const ChevronDownIcon = ({ style }) => (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: style, children: _jsx("polyline", { points: "6 9 12 15 18 9" }) }));
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * FindReplaceDialog component - Modal for finding and replacing text
 */
export function FindReplaceDialog({ isOpen, onClose, onFind, onFindNext, onFindPrevious, onReplace, onReplaceAll, onHighlightMatches, onClearHighlights, initialSearchText = '', replaceMode = false, currentResult, className, style, }) {
    const { t } = useTranslation();
    // State
    const [searchText, setSearchText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [showReplace, setShowReplace] = useState(replaceMode);
    const [matchCase, setMatchCase] = useState(false);
    const [matchWholeWord, setMatchWholeWord] = useState(false);
    // Phase 1.5 U7 — exposes the existing `useRegex` flag in
    // `FindOptions` (already handled by findReplaceUtils.ts:93-103).
    // Matches Word's "Use wildcards" and VS Code's "Use Regular
    // Expression" checkboxes.
    const [useRegex, setUseRegex] = useState(false);
    const [result, setResult] = useState(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const [replaceFocused, setReplaceFocused] = useState(false);
    // Refs
    const searchInputRef = useRef(null);
    const replaceInputRef = useRef(null);
    // Sync with external result if provided
    useEffect(() => {
        if (currentResult !== undefined) {
            setResult(currentResult);
        }
    }, [currentResult]);
    // Initialize when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSearchText(initialSearchText);
            setReplaceText('');
            setShowReplace(replaceMode);
            setResult(null);
            setTimeout(() => {
                var _a, _b;
                (_a = searchInputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                (_b = searchInputRef.current) === null || _b === void 0 ? void 0 : _b.select();
            }, 100);
            if (initialSearchText) {
                const searchResult = onFind(initialSearchText, {
                    matchCase,
                    matchWholeWord,
                    useRegex,
                });
                setResult(searchResult);
                if ((searchResult === null || searchResult === void 0 ? void 0 : searchResult.matches) && onHighlightMatches) {
                    onHighlightMatches(searchResult.matches);
                }
            }
        }
        else {
            if (onClearHighlights) {
                onClearHighlights();
            }
        }
    }, [isOpen, initialSearchText, replaceMode]);
    const performSearch = useCallback(() => {
        if (!searchText.trim()) {
            setResult(null);
            if (onClearHighlights) {
                onClearHighlights();
            }
            return;
        }
        const searchResult = onFind(searchText, { matchCase, matchWholeWord, useRegex });
        setResult(searchResult);
        if ((searchResult === null || searchResult === void 0 ? void 0 : searchResult.matches) && onHighlightMatches) {
            onHighlightMatches(searchResult.matches);
        }
        else if (onClearHighlights) {
            onClearHighlights();
        }
    }, [
        searchText,
        matchCase,
        matchWholeWord,
        useRegex,
        onFind,
        onHighlightMatches,
        onClearHighlights,
    ]);
    useEffect(() => {
        if (isOpen && searchText.trim()) {
            performSearch();
        }
    }, [matchCase, matchWholeWord, useRegex]);
    const handleSearchChange = useCallback((e) => {
        setSearchText(e.target.value);
    }, []);
    const handleSearchKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handleFindPrevious();
            }
            else {
                if (!result) {
                    performSearch();
                }
                else {
                    handleFindNext();
                }
            }
        }
        else if (e.key === 'Escape') {
            onClose();
        }
    }, [result, performSearch, onClose]);
    const handleReplaceKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleReplace();
        }
        else if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);
    const handleFindNext = useCallback(() => {
        if (!searchText.trim()) {
            performSearch();
            return;
        }
        if (!result) {
            performSearch();
            return;
        }
        const match = onFindNext();
        if (match && result) {
            const newIndex = (result.currentIndex + 1) % result.totalCount;
            setResult(Object.assign(Object.assign({}, result), { currentIndex: newIndex }));
        }
    }, [searchText, result, performSearch, onFindNext]);
    const handleFindPrevious = useCallback(() => {
        if (!searchText.trim()) {
            performSearch();
            return;
        }
        if (!result) {
            performSearch();
            return;
        }
        const match = onFindPrevious();
        if (match && result) {
            const newIndex = result.currentIndex === 0 ? result.totalCount - 1 : result.currentIndex - 1;
            setResult(Object.assign(Object.assign({}, result), { currentIndex: newIndex }));
        }
    }, [searchText, result, performSearch, onFindPrevious]);
    const handleReplace = useCallback(() => {
        if (!result || result.totalCount === 0)
            return;
        const success = onReplace(replaceText);
        if (success) {
            const newResult = onFind(searchText, { matchCase, matchWholeWord, useRegex });
            setResult(newResult);
            if ((newResult === null || newResult === void 0 ? void 0 : newResult.matches) && onHighlightMatches) {
                onHighlightMatches(newResult.matches);
            }
        }
    }, [
        result,
        replaceText,
        searchText,
        matchCase,
        matchWholeWord,
        useRegex,
        onReplace,
        onFind,
        onHighlightMatches,
    ]);
    const handleReplaceAll = useCallback(() => {
        if (!searchText.trim())
            return;
        const count = onReplaceAll(searchText, replaceText, { matchCase, matchWholeWord, useRegex });
        if (count > 0) {
            setResult({
                matches: [],
                totalCount: 0,
                currentIndex: -1,
            });
            if (onClearHighlights) {
                onClearHighlights();
            }
        }
    }, [
        searchText,
        replaceText,
        matchCase,
        matchWholeWord,
        useRegex,
        onReplaceAll,
        onClearHighlights,
    ]);
    const toggleReplaceMode = useCallback(() => {
        setShowReplace((prev) => {
            const newValue = !prev;
            if (newValue) {
                setTimeout(() => { var _a; return (_a = replaceInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100);
            }
            return newValue;
        });
    }, []);
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            // Don't close on overlay click - this is a non-modal dialog
        }
    }, []);
    const handleDialogKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);
    if (!isOpen) {
        return null;
    }
    const hasMatches = result && result.totalCount > 0;
    const noMatches = result && result.totalCount === 0 && searchText.trim();
    return (_jsx("div", { className: `docx-find-replace-dialog-overlay ${className || ''}`, style: Object.assign(Object.assign({}, DIALOG_OVERLAY_STYLE), style), onClick: handleOverlayClick, onKeyDown: handleDialogKeyDown, children: _jsxs("div", { className: "docx-find-replace-dialog", "data-testid": "find-replace-dialog", style: DIALOG_CONTENT_STYLE, role: "dialog", "aria-modal": "false", "aria-labelledby": "find-replace-dialog-title", children: [_jsx("style", { children: `
          @keyframes docFindReplaceIn {
            from { opacity: 0; transform: scale(0.96) translateY(-6px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        ` }), _jsxs("div", { className: "docx-find-replace-dialog-header", style: DIALOG_HEADER_STYLE, children: [_jsx("h2", { id: "find-replace-dialog-title", style: DIALOG_TITLE_STYLE, children: showReplace
                                ? t('dialogs.findReplace.titleFindReplace')
                                : t('dialogs.findReplace.titleFind') }), _jsx("button", { type: "button", className: "docx-find-replace-dialog-close", style: CLOSE_BUTTON_STYLE, onClick: onClose, "aria-label": t('common.closeDialog'), children: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M18 6L6 18" }), _jsx("path", { d: "M6 6l12 12" })] }) })] }), _jsxs("div", { className: "docx-find-replace-dialog-body", style: DIALOG_BODY_STYLE, children: [_jsxs("div", { className: "docx-find-replace-dialog-row", style: ROW_STYLE, children: [_jsx("label", { htmlFor: "find-text", style: LABEL_STYLE, children: t('dialogs.findReplace.findLabel') }), _jsx("input", { ref: searchInputRef, id: "find-text", "data-testid": "find-input", type: "text", className: "docx-find-replace-dialog-input", style: searchFocused ? INPUT_FOCUS_STYLE : INPUT_STYLE, value: searchText, onChange: handleSearchChange, onKeyDown: handleSearchKeyDown, onFocus: () => setSearchFocused(true), onBlur: () => {
                                        setSearchFocused(false);
                                        if (searchText.trim() && !result) {
                                            performSearch();
                                        }
                                    }, placeholder: t('dialogs.findReplace.findPlaceholder'), "aria-label": t('dialogs.findReplace.findAriaLabel') }), _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [_jsx("button", { type: "button", className: "docx-find-replace-dialog-nav", style: hasMatches ? NAV_BUTTON_STYLE : NAV_BUTTON_DISABLED_STYLE, onClick: handleFindPrevious, disabled: !hasMatches, "aria-label": t('dialogs.findReplace.findPrevious'), title: t('dialogs.findReplace.findPreviousTitle'), children: _jsx(ChevronUpIcon, {}) }), _jsx("button", { type: "button", className: "docx-find-replace-dialog-nav", style: hasMatches ? NAV_BUTTON_STYLE : NAV_BUTTON_DISABLED_STYLE, onClick: handleFindNext, disabled: !hasMatches, "aria-label": t('dialogs.findReplace.findNext'), title: t('dialogs.findReplace.findNextTitle'), children: _jsx(ChevronDownIcon, {}) })] })] }), hasMatches && (_jsx("div", { className: "docx-find-replace-dialog-status", style: STATUS_STYLE, children: t('dialogs.findReplace.matchCount', {
                                current: result.currentIndex + 1,
                                total: result.totalCount,
                            }) })), noMatches && (_jsx("div", { className: "docx-find-replace-dialog-status", style: NO_RESULTS_STYLE, children: t('dialogs.findReplace.noResults') })), showReplace && (_jsx(_Fragment, { children: _jsxs("div", { className: "docx-find-replace-dialog-row", style: ROW_STYLE, children: [_jsx("label", { htmlFor: "replace-text", style: LABEL_STYLE, children: t('dialogs.findReplace.replaceLabel') }), _jsx("input", { ref: replaceInputRef, id: "replace-text", type: "text", className: "docx-find-replace-dialog-input", style: replaceFocused ? INPUT_FOCUS_STYLE : INPUT_STYLE, value: replaceText, onChange: (e) => setReplaceText(e.target.value), onKeyDown: handleReplaceKeyDown, onFocus: () => setReplaceFocused(true), onBlur: () => setReplaceFocused(false), placeholder: t('dialogs.findReplace.replacePlaceholder'), "aria-label": t('dialogs.findReplace.replaceAriaLabel') }), _jsxs("div", { style: BUTTON_CONTAINER_STYLE, children: [_jsx("button", { type: "button", className: "docx-find-replace-dialog-button", style: hasMatches ? BUTTON_BASE_STYLE : BUTTON_DISABLED_STYLE, onClick: handleReplace, disabled: !hasMatches, title: t('dialogs.findReplace.replaceCurrentTitle'), children: t('dialogs.findReplace.replaceButton') }), _jsx("button", { type: "button", className: "docx-find-replace-dialog-button", style: hasMatches ? BUTTON_BASE_STYLE : BUTTON_DISABLED_STYLE, onClick: handleReplaceAll, disabled: !hasMatches, title: t('dialogs.findReplace.replaceAllTitle'), children: t('dialogs.findReplace.replaceAllButton') })] })] }) })), _jsxs("div", { className: "docx-find-replace-dialog-options", style: OPTIONS_CONTAINER_STYLE, children: [_jsxs("label", { className: "docx-find-replace-dialog-option", style: CHECKBOX_LABEL_STYLE, children: [_jsx("input", { type: "checkbox", style: CHECKBOX_STYLE, checked: matchCase, onChange: (e) => setMatchCase(e.target.checked) }), t('dialogs.findReplace.matchCase')] }), _jsxs("label", { className: "docx-find-replace-dialog-option", style: CHECKBOX_LABEL_STYLE, children: [_jsx("input", { type: "checkbox", style: CHECKBOX_STYLE, checked: matchWholeWord, onChange: (e) => setMatchWholeWord(e.target.checked) }), t('dialogs.findReplace.wholeWords')] }), _jsxs("label", { className: "docx-find-replace-dialog-option", style: CHECKBOX_LABEL_STYLE, "data-testid": "find-replace-use-regex-label", children: [_jsx("input", { type: "checkbox", style: CHECKBOX_STYLE, checked: useRegex, onChange: (e) => setUseRegex(e.target.checked), "data-testid": "find-replace-use-regex" }), t('dialogs.findReplace.useRegex')] }), !showReplace && (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, CHECKBOX_LABEL_STYLE), { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--doc-link)', padding: 0 }), onClick: toggleReplaceMode, children: t('dialogs.findReplace.toggleReplace') }))] })] })] }) }));
}
export default FindReplaceDialog;
//# sourceMappingURL=FindReplaceDialog.js.map