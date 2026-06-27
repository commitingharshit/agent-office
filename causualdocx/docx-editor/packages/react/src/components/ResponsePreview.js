import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Response Preview Component
 *
 * Shows AI response preview with diff view before applying changes.
 * Allows user to accept, reject, or edit the response.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { getActionLabel } from '@eigenpal/docx-core/types/agentApi';
import { useTranslation } from '../i18n';
import { Tooltip } from './ui/Tooltip';
// ============================================================================
// ICONS
// ============================================================================
const CheckIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 8l4 4 6-8", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }));
const XIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }));
const RefreshIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M2 8a6 6 0 0111.318-2.828M14 8a6 6 0 01-11.318 2.828", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("path", { d: "M13 2v4h-4M3 14v-4h4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })] }));
const EditIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M11 2l3 3-9 9H2v-3l9-9z", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
const LoadingSpinner = () => (_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { animation: 'spin 1s linear infinite' }, children: [_jsx("circle", { cx: "10", cy: "10", r: "8", stroke: "var(--doc-border)", strokeWidth: "2", fill: "none" }), _jsx("path", { d: "M10 2a8 8 0 018 8", stroke: "var(--doc-primary)", strokeWidth: "2", strokeLinecap: "round", fill: "none" }), _jsx("style", { children: `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    ` })] }));
// ============================================================================
// DIFF CALCULATION
// ============================================================================
/**
 * Calculate simple word-level diff between two texts
 */
function calculateDiff(original, modified) {
    const segments = [];
    // Split into words while preserving whitespace
    const originalWords = original.split(/(\s+)/);
    const modifiedWords = modified.split(/(\s+)/);
    // Simple LCS-based diff (not optimal but sufficient for short texts)
    let i = 0;
    let j = 0;
    while (i < originalWords.length || j < modifiedWords.length) {
        if (i >= originalWords.length) {
            // Remaining words in modified are additions
            segments.push({ type: 'added', text: modifiedWords.slice(j).join('') });
            break;
        }
        if (j >= modifiedWords.length) {
            // Remaining words in original are removals
            segments.push({ type: 'removed', text: originalWords.slice(i).join('') });
            break;
        }
        if (originalWords[i] === modifiedWords[j]) {
            // Same word
            segments.push({ type: 'same', text: originalWords[i] });
            i++;
            j++;
        }
        else {
            // Find next matching word
            const nextMatchInModified = modifiedWords.indexOf(originalWords[i], j);
            const nextMatchInOriginal = originalWords.indexOf(modifiedWords[j], i);
            if (nextMatchInModified === -1 && nextMatchInOriginal === -1) {
                // No match found - treat as replacement
                segments.push({ type: 'removed', text: originalWords[i] });
                segments.push({ type: 'added', text: modifiedWords[j] });
                i++;
                j++;
            }
            else if (nextMatchInOriginal !== -1 &&
                (nextMatchInModified === -1 || nextMatchInOriginal - i <= nextMatchInModified - j)) {
                // Addition
                segments.push({ type: 'added', text: modifiedWords[j] });
                j++;
            }
            else {
                // Removal
                segments.push({ type: 'removed', text: originalWords[i] });
                i++;
            }
        }
    }
    // Merge consecutive segments of the same type
    const merged = [];
    for (const segment of segments) {
        if (merged.length > 0 && merged[merged.length - 1].type === segment.type) {
            merged[merged.length - 1].text += segment.text;
        }
        else {
            merged.push(segment);
        }
    }
    return merged;
}
const DiffView = ({ original, modified }) => {
    const segments = calculateDiff(original, modified);
    return (_jsx("div", { className: "docx-response-diff", style: { lineHeight: 1.6, fontSize: '14px' }, children: segments.map((segment, index) => {
            let style = {};
            switch (segment.type) {
                case 'removed':
                    style = {
                        textDecoration: 'line-through',
                        color: 'var(--doc-error)',
                        backgroundColor: 'var(--doc-error-bg)',
                    };
                    break;
                case 'added':
                    style = {
                        color: 'var(--doc-success)',
                        backgroundColor: 'var(--doc-success-bg)',
                    };
                    break;
                default:
                    break;
            }
            return (_jsx("span", { style: style, children: segment.text }, index));
        }) }));
};
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const ResponsePreview = ({ originalText, response, action, isLoading, error, onAccept, onReject, onRetry, allowEdit = true, showDiff = true, className = '', position, }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const textareaRef = useRef(null);
    const containerRef = useRef(null);
    // Get the new text from response
    const newText = (response === null || response === void 0 ? void 0 : response.newText) || '';
    // Initialize edited text when response changes
    useEffect(() => {
        if (newText) {
            setEditedText(newText);
        }
    }, [newText]);
    // Focus textarea when editing
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);
    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isEditing) {
                    setIsEditing(false);
                    setEditedText(newText);
                }
                else {
                    onReject();
                }
            }
            else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAccept();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, newText, onReject]);
    const handleAccept = useCallback(() => {
        const textToAccept = isEditing ? editedText : newText;
        onAccept(textToAccept);
    }, [isEditing, editedText, newText, onAccept]);
    const handleStartEdit = useCallback(() => {
        setIsEditing(true);
    }, []);
    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditedText(newText);
    }, [newText]);
    // Calculate container style
    const containerStyle = Object.assign(Object.assign({ position: position ? 'fixed' : 'relative' }, (position && {
        left: position.x,
        top: position.y,
    })), { width: '400px', maxWidth: '90vw', maxHeight: '80vh', background: 'var(--doc-surface, white)', border: '1px solid var(--doc-border-light)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', zIndex: 10000, overflow: 'hidden', display: 'flex', flexDirection: 'column' });
    // Loading state
    if (isLoading) {
        return (_jsx("div", { ref: containerRef, className: `docx-response-preview docx-response-preview-loading ${className}`, style: containerStyle, children: _jsxs("div", { style: {
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                }, children: [_jsx(LoadingSpinner, {}), _jsx("div", { style: { color: 'var(--doc-text-muted)', fontSize: '14px' }, children: t('responsePreview.loading', { action: getActionLabel(action) }) })] }) }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { ref: containerRef, className: `docx-response-preview docx-response-preview-error ${className}`, style: containerStyle, children: _jsxs("div", { style: { padding: '16px' }, children: [_jsx("div", { style: {
                            padding: '12px',
                            background: 'var(--doc-error-bg)',
                            borderRadius: '4px',
                            color: 'var(--doc-error)',
                            fontSize: '13px',
                            marginBottom: '16px',
                        }, children: error }), _jsxs("div", { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' }, children: [onRetry && (_jsxs("button", { type: "button", onClick: onRetry, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '8px 16px',
                                    border: '1px solid var(--doc-border-light)',
                                    borderRadius: '4px',
                                    background: 'var(--doc-surface, white)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                }, children: [_jsx(RefreshIcon, {}), t('common.retry')] })), _jsx("button", { type: "button", onClick: onReject, style: {
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: 'var(--doc-border)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                }, children: t('common.close') })] })] }) }));
    }
    // No response yet
    if (!response || !newText) {
        return null;
    }
    return (_jsxs("div", { ref: containerRef, className: `docx-response-preview ${className}`, style: containerStyle, children: [_jsxs("div", { style: {
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--doc-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsx("div", { style: { fontWeight: 500, fontSize: '14px', color: 'var(--doc-text)' }, children: t('responsePreview.result', { action: getActionLabel(action) }) }), _jsx(Tooltip, { content: t('responsePreview.closeEsc'), children: _jsx("button", { type: "button", onClick: onReject, "aria-label": t('responsePreview.closeEsc'), style: {
                                display: 'flex',
                                padding: '4px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--doc-text-muted)',
                            }, children: _jsx(XIcon, {}) }) })] }), _jsxs("div", { style: {
                    padding: '16px',
                    overflowY: 'auto',
                    flex: 1,
                }, children: [isEditing ? (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: '8px', fontSize: '12px', color: 'var(--doc-text-muted)' }, children: t('responsePreview.editPrompt') }), _jsx("textarea", { ref: textareaRef, value: editedText, onChange: (e) => setEditedText(e.target.value), style: {
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px',
                                    border: '1px solid var(--doc-primary)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    lineHeight: 1.6,
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                } })] })) : showDiff ? (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: '8px', fontSize: '12px', color: 'var(--doc-text-muted)' }, children: t('responsePreview.changes') }), _jsx(DiffView, { original: originalText, modified: newText })] })) : (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: '8px', fontSize: '12px', color: 'var(--doc-text-muted)' }, children: t('responsePreview.original') }), _jsx("div", { style: {
                                    padding: '8px 12px',
                                    background: 'var(--doc-bg-subtle)',
                                    borderRadius: '4px',
                                    marginBottom: '16px',
                                    textDecoration: 'line-through',
                                    color: 'var(--doc-text-placeholder)',
                                    fontSize: '13px',
                                }, children: originalText }), _jsx("div", { style: { marginBottom: '8px', fontSize: '12px', color: 'var(--doc-text-muted)' }, children: t('responsePreview.new') }), _jsx("div", { style: {
                                    padding: '8px 12px',
                                    background: 'var(--doc-success-bg)',
                                    borderRadius: '4px',
                                    color: 'var(--doc-success)',
                                    fontSize: '13px',
                                }, children: newText })] })), response.warnings && response.warnings.length > 0 && (_jsx("div", { style: {
                            marginTop: '16px',
                            padding: '8px 12px',
                            background: 'var(--doc-warning-bg)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: 'var(--doc-warning)',
                        }, children: response.warnings.map((warning, index) => (_jsx("div", { children: warning }, index))) }))] }), _jsxs("div", { style: {
                    padding: '12px 16px',
                    borderTop: '1px solid var(--doc-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsxs("div", { children: [allowEdit && !isEditing && (_jsxs("button", { type: "button", onClick: handleStartEdit, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    border: '1px solid var(--doc-border-light)',
                                    borderRadius: '4px',
                                    background: 'var(--doc-surface, white)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    color: 'var(--doc-text-muted)',
                                }, children: [_jsx(EditIcon, {}), t('common.edit')] })), isEditing && (_jsx("button", { type: "button", onClick: handleCancelEdit, style: {
                                    padding: '6px 12px',
                                    border: '1px solid var(--doc-border-light)',
                                    borderRadius: '4px',
                                    background: 'var(--doc-surface, white)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    color: 'var(--doc-text-muted)',
                                }, children: t('responsePreview.cancelEdit') }))] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsxs("button", { type: "button", onClick: onReject, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '8px 16px',
                                    border: '1px solid var(--doc-border-light)',
                                    borderRadius: '4px',
                                    background: 'var(--doc-surface, white)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--doc-text-muted)',
                                }, children: [_jsx(XIcon, {}), t('common.reject')] }), _jsxs("button", { type: "button", onClick: handleAccept, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: 'var(--doc-primary)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'white',
                                }, children: [_jsx(CheckIcon, {}), t('common.accept')] })] })] })] }));
};
/**
 * Hook to manage response preview state
 */
export function useResponsePreview() {
    const [state, setState] = useState({
        isVisible: false,
        originalText: '',
        response: null,
        action: 'rewrite',
        isLoading: false,
    });
    const showPreview = useCallback((originalText, action, position) => {
        setState({
            isVisible: true,
            originalText,
            response: null,
            action,
            isLoading: true,
            position,
        });
    }, []);
    const setResponse = useCallback((response) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { response, isLoading: false })));
    }, []);
    const setError = useCallback((error) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { error, isLoading: false })));
    }, []);
    const hidePreview = useCallback(() => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isVisible: false })));
    }, []);
    return {
        state,
        showPreview,
        setResponse,
        setError,
        hidePreview,
    };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create a mock response for testing
 */
export function createMockResponse(newText, warnings) {
    return {
        success: true,
        newText,
        warnings,
    };
}
/**
 * Create an error response
 */
export function createErrorResponse(error) {
    return {
        success: false,
        error,
    };
}
// ============================================================================
// EXPORTS
// ============================================================================
export default ResponsePreview;
//# sourceMappingURL=ResponsePreview.js.map