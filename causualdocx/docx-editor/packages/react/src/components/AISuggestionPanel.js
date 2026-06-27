import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AISuggestionPanel — right-docked task pane (Copilot-in-Word /
 * Gemini-in-Docs pattern) showing an AI rewrite or summary
 * alongside its source so the user can compare, iterate on tone,
 * and choose Replace / Insert / Reject without the result floating
 * over the doc body.
 *
 * Sister component of `WritingAssistantSheet` — same 360 px width,
 * same docking behaviour. Mounts/unmounts as a sibling of the
 * editor's scroll container so it reserves real horizontal space
 * (the page reflows) instead of overlaying.
 */
import { useEffect } from 'react';
import { MaterialSymbol } from './ui/Icons';
import { RightDockPanel } from './RightDockPanel';
// Layout (root container + header + close button) lives in
// `RightDockPanel`. Only the surfaces below are panel-specific.
const bodyStyle = {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
};
const sectionHeadingStyle = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    color: 'var(--doc-text-muted, #6b7280)',
    margin: '0 0 6px',
};
const sourceCardStyle = {
    padding: '8px 10px',
    border: '1px solid var(--doc-border, #e0e0e0)',
    borderRadius: 6,
    background: 'var(--doc-surface-sunken, #f8fafc)',
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--doc-text-on-surface-muted, #4b5563)',
    whiteSpace: 'pre-wrap',
    maxHeight: 200,
    overflow: 'auto',
};
const suggestionCardStyle = {
    padding: '10px 12px',
    border: '1px solid var(--doc-primary, #1a73e8)',
    borderRadius: 6,
    background: 'var(--doc-primary-light, #e8f0fe)',
    fontSize: 13,
    lineHeight: 1.55,
    color: 'var(--doc-text-on-surface, #1f2937)',
    whiteSpace: 'pre-wrap',
    minHeight: 80,
    maxHeight: 320,
    overflow: 'auto',
};
const errorCardStyle = Object.assign(Object.assign({}, suggestionCardStyle), { border: '1px solid var(--doc-error-border, #f9c0bd)', background: 'var(--doc-error-bg, #fce8e6)', color: 'var(--doc-error, #c5221f)' });
const toneRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
};
const toneChipStyle = (active, disabled) => ({
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 99,
    border: `1px solid ${active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-border, #d1d5db)'}`,
    background: active ? 'var(--doc-primary-light, #e8f0fe)' : 'transparent',
    color: active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-text-on-surface, #1f2937)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
});
const statusRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: 'var(--doc-text-muted, #6b7280)',
};
const spinnerStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    border: '2px solid var(--doc-border, #d1d5db)',
    borderTopColor: 'var(--doc-primary, #1a73e8)',
    animation: 'docx-spin 0.7s linear infinite',
};
const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderTop: '1px solid var(--doc-border, #e0e0e0)',
    flexShrink: 0,
};
const btnBase = {
    padding: '6px 12px',
    fontSize: 13,
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const secondaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-border, #d1d5db)', background: 'transparent', color: 'var(--doc-text-on-surface, #1f2937)' });
const primaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-primary, #1a73e8)', background: 'var(--doc-primary, #1a73e8)', color: 'white' });
const hintBtnStyle = Object.assign(Object.assign({}, secondaryBtnStyle), { marginRight: 'auto' });
export function AISuggestionPanel({ mode, original, suggestion, inferenceMs, onAccept, onReject, onRetry, tones, onTone, busy, error, }) {
    // Esc closes; ⌘/Ctrl+Enter accepts when there's a suggestion.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onReject();
                return;
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && suggestion && !busy) {
                e.preventDefault();
                onAccept();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onAccept, onReject, suggestion, busy]);
    const title = mode === 'rewrite' ? 'Rewrite with AI' : 'Summary with AI';
    // Accept stages the change as a tracked suggestion (deletion +
    // insertion marks) — the doc body shows it with the standard
    // red-strike / green-underline UI so the user can Accept / Reject
    // it permanently through the existing tracked-change controls.
    const acceptLabel = mode === 'rewrite' ? 'Suggest replacement' : 'Suggest insert';
    const footer = (_jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: hintBtnStyle, onClick: onRetry, disabled: busy, "data-testid": "ai-suggestion-retry", children: "Retry" }), _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onReject, "data-testid": "ai-suggestion-reject", children: "Reject" }), _jsx("button", { type: "button", style: primaryBtnStyle, onClick: onAccept, disabled: !suggestion || busy, "data-testid": "ai-suggestion-accept", children: acceptLabel })] }));
    return (_jsx(RightDockPanel, { title: title, icon: _jsx(MaterialSymbol, { name: "auto_awesome", size: 16 }), onClose: onReject, testId: "ai-suggestion-panel", ariaLabel: title, footer: footer, children: _jsxs("div", { style: bodyStyle, children: [_jsxs("section", { children: [_jsx("p", { style: sectionHeadingStyle, children: "Source" }), _jsx("div", { style: sourceCardStyle, "data-testid": "ai-original-pane", children: original || _jsx("em", { children: "(empty selection)" }) })] }), mode === 'rewrite' && tones && tones.length > 0 && (_jsxs("section", { children: [_jsx("p", { style: sectionHeadingStyle, children: "Tone" }), _jsx("div", { style: toneRowStyle, children: tones.map((t) => (_jsx("button", { type: "button", style: toneChipStyle(!!t.active, busy), onClick: () => !busy && (onTone === null || onTone === void 0 ? void 0 : onTone(t.id)), disabled: busy, "data-testid": `ai-tone-${t.id}`, children: t.label }, t.id))) })] })), _jsxs("section", { children: [_jsx("p", { style: sectionHeadingStyle, children: mode === 'rewrite' ? 'Suggested' : 'Summary' }), error ? (_jsx("div", { style: errorCardStyle, "data-testid": "ai-suggestion-pane", children: error })) : (_jsx("div", { style: suggestionCardStyle, "data-testid": "ai-suggestion-pane", children: suggestion !== null && suggestion !== void 0 ? suggestion : (busy ? '' : 'Waiting…') })), _jsxs("div", { style: Object.assign(Object.assign({}, statusRowStyle), { marginTop: 6 }), children: [busy && _jsx("span", { style: spinnerStyle, "aria-hidden": "true" }), _jsx("span", { children: busy
                                        ? 'Running on-device…'
                                        : inferenceMs !== null
                                            ? `${inferenceMs} ms · on-device`
                                            : 'On-device' })] })] })] }) }));
}
export default AISuggestionPanel;
//# sourceMappingURL=AISuggestionPanel.js.map