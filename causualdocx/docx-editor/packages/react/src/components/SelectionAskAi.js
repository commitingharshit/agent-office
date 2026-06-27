import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SelectionAskAi — selection-anchored AI prompt surface.
 *
 * Pattern from the AI editor research (`docs/internal/11-ai-editor-research.md`):
 * the canonical user flow across Google Docs, Word Rewrite, and Notion
 * is "select text → invoke AI on that selection → preview output".
 * Until this component the only AI entry from a selection was the
 * right-click menu (Rewrite / Summarize); the user couldn't write a
 * free-form transform prompt ("convert these bullets to a table",
 * "rewrite as a cover letter", "format this").
 *
 * Two visible states, both anchored above the selection's start:
 *
 *   1. Resting button — a compact sparkle pill labelled "Ask AI".
 *      Click to expand.
 *   2. Expanded input — a docked text field with Send / Esc-to-cancel.
 *      The selection is included automatically; the user types the
 *      transformation instruction.
 *
 * Submit hands the prompt to `onSubmit(prompt)`; the host runs the
 * writer pipeline with the selection as context and routes the
 * resulting proposal to the inline preview popover. This component
 * never touches the PM doc itself.
 *
 * Visibility: only renders while there is a non-empty plain-text
 * selection in the active editor view AND the controller's LLM tier
 * is ready. The host decides when both conditions hold and toggles
 * `isOpen`.
 */
import { useEffect, useRef, useState } from 'react';
import { usableRightEdge } from '../lib/anchorViewport';
import { MaterialSymbol } from './ui/Icons';
// Vertical gap above OR below the selection. The pill prefers
// above-selection; falls through to below when above would overlap
// the toolbar / above the viewport.
const PILL_GAP_PX = 6;
const PILL_HEIGHT_PX = 28;
// Toolbar / titlebar takes the top ~110 px on the demo + most
// integrations. Below this row the pill always has a clear anchor.
const TOOLBAR_BOTTOM_PX = 110;
const VIEWPORT_PAD = 12;
const PILL_WIDTH = 96;
const PANEL_WIDTH = 360;
const pillStyle = {
    position: 'fixed',
    zIndex: 9400,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 999,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'var(--doc-surface, #ffffff)',
    color: 'var(--doc-primary, #1a73e8)',
    boxShadow: '0 4px 12px -4px rgba(15,23,42,0.18)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
};
const panelStyle = {
    position: 'fixed',
    zIndex: 9400,
    width: PANEL_WIDTH,
    background: 'var(--doc-surface, #ffffff)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 10,
    boxShadow: '0 12px 28px -8px rgba(15,23,42,0.22), 0 4px 10px -2px rgba(15,23,42,0.08)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const inputRowStyle = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 8,
};
const textareaStyle = {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 1.4,
    padding: '8px 10px',
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 6,
    outline: 'none',
    resize: 'none',
    background: 'var(--doc-surface, #ffffff)',
    color: 'inherit',
    font: 'inherit',
};
const sendBtnStyle = {
    padding: '0 14px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    border: '1px solid var(--doc-primary, #1a73e8)',
    background: 'var(--doc-primary, #1a73e8)',
    color: 'white',
    cursor: 'pointer',
};
const hintRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
};
const hintChipStyle = {
    fontSize: 11,
    padding: '2px 8px',
    border: '1px solid var(--doc-border, #e0e0e0)',
    borderRadius: 999,
    background: 'transparent',
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    cursor: 'pointer',
};
const closeBtnStyle = {
    border: 'none',
    background: 'transparent',
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 4,
    marginLeft: 'auto',
};
const spinnerStyle = {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid var(--doc-primary, #1a73e8)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'docx-spin 0.8s linear infinite',
};
const QUICK_PROMPTS = [
    'Transform this into a table',
    'Rewrite this concisely',
    'Make this more formal',
    'Translate to Spanish',
    'Summarize this',
];
function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}
export function SelectionAskAi({ isOpen, getView, onSubmit, onDismiss, busy = false, }) {
    const [expanded, setExpanded] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [anchor, setAnchor] = useState(null);
    // Snapshot of the selected text taken when the pill opens. Without
    // this, the textarea steals focus, the PM selection visually
    // collapses, and `getSelectionText()` later returns "" — the user
    // gets a context-free reply. Captured selection text is sent to the
    // host along with the prompt.
    const capturedSelectionRef = useRef('');
    const textareaRef = useRef(null);
    // Recompute anchor when selection / window changes.
    useEffect(() => {
        if (!isOpen) {
            setAnchor(null);
            return;
        }
        const place = () => {
            const view = getView();
            if (!view) {
                setAnchor(null);
                return;
            }
            const { from, to, empty } = view.state.selection;
            if (empty) {
                setAnchor(null);
                return;
            }
            // Anchor at the SELECTION'S BOTTOM by default (`coordsAtPos(to)`
            // returns the end-of-last-line rect). Above-selection placement
            // is a fallback only when there's enough room above the
            // selection AND we're below the toolbar.
            let startRect;
            let endRect;
            try {
                startRect = view.coordsAtPos(from);
                endRect = view.coordsAtPos(to);
            }
            catch (_a) {
                setAnchor(null);
                return;
            }
            const widthFor = expanded ? PANEL_WIDTH : PILL_WIDTH;
            const vh = window.innerHeight;
            // Right edge accounting for chat panel / writer sheet / version
            // history / AI suggestion / panel rail so the pill can never
            // anchor behind a docked surface. Shared with the inline
            // preview popover.
            const rightEdge = usableRightEdge(VIEWPORT_PAD);
            // Try BELOW the selection first — Notion's pattern. This always
            // has room until the user is on the very last line. Pill +
            // expanded panel both fit.
            const requiredHeight = expanded ? 140 : PILL_HEIGHT_PX;
            const belowTop = endRect.bottom + PILL_GAP_PX;
            const aboveTop = startRect.top - PILL_GAP_PX - requiredHeight;
            const fitsBelow = belowTop + requiredHeight <= vh - VIEWPORT_PAD;
            const fitsAbove = aboveTop >= TOOLBAR_BOTTOM_PX;
            const top = fitsBelow ? belowTop : fitsAbove ? aboveTop : TOOLBAR_BOTTOM_PX + VIEWPORT_PAD;
            const left = clamp(startRect.left, VIEWPORT_PAD, rightEdge - widthFor);
            setAnchor({ top, left });
        };
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [isOpen, expanded, getView]);
    // Collapse on Escape.
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key !== 'Escape')
                return;
            if (expanded) {
                e.preventDefault();
                setExpanded(false);
                setPrompt('');
                return;
            }
            onDismiss();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, expanded, onDismiss]);
    // Focus the input the moment it expands.
    useEffect(() => {
        if (expanded) {
            const id = setTimeout(() => { var _a; return (_a = textareaRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 0);
            return () => clearTimeout(id);
        }
        return undefined;
    }, [expanded]);
    if (!isOpen || !anchor)
        return null;
    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const v = prompt.trim();
            if (!v || busy)
                return;
            onSubmit(v, capturedSelectionRef.current);
            setExpanded(false);
            setPrompt('');
            capturedSelectionRef.current = '';
        }
    };
    if (!expanded) {
        return (_jsxs("button", { type: "button", style: Object.assign(Object.assign({}, pillStyle), { top: anchor.top, left: anchor.left, 
                // While busy, the pill stays put as the user's loading
                // affordance — anchored to the same selection they were
                // working with, so they don't have to look at the chat
                // panel to know something's happening.
                cursor: busy ? 'progress' : 'pointer', opacity: busy ? 0.8 : 1 }), disabled: busy, onClick: () => {
                if (busy)
                    return;
                // Snapshot the current selection text BEFORE focus moves
                // to the textarea. Stays valid through the entire prompt
                // flow even after the editor's selection visually fades.
                const view = getView();
                if (view) {
                    const { from, to } = view.state.selection;
                    if (from !== to) {
                        capturedSelectionRef.current = view.state.doc.textBetween(from, to, '\n', ' ');
                    }
                }
                setExpanded(true);
            }, "data-testid": "selection-ask-ai-pill", "aria-label": busy ? 'AI is processing your request' : 'Ask AI about the selection', children: [busy ? (_jsx("span", { style: spinnerStyle, "aria-hidden": "true" })) : (_jsx(MaterialSymbol, { name: "auto_awesome", size: 14 })), _jsx("span", { children: busy ? 'Thinking…' : 'Ask AI' })] }));
    }
    return (_jsxs("div", { role: "dialog", "aria-label": "Ask AI about the selection", "data-testid": "selection-ask-ai-panel", style: Object.assign(Object.assign({}, panelStyle), { top: anchor.top, left: anchor.left }), children: [_jsxs("div", { style: inputRowStyle, children: [_jsx("textarea", { ref: textareaRef, value: prompt, onChange: (e) => setPrompt(e.target.value), onKeyDown: onKeyDown, placeholder: "Transform the selection\u2026 (Enter to send)", rows: 2, style: textareaStyle, disabled: busy, "data-testid": "selection-ask-ai-input" }), _jsx("button", { type: "button", style: sendBtnStyle, onClick: () => {
                            const v = prompt.trim();
                            if (!v || busy)
                                return;
                            onSubmit(v, capturedSelectionRef.current);
                            setExpanded(false);
                            setPrompt('');
                            capturedSelectionRef.current = '';
                        }, disabled: busy || !prompt.trim(), "data-testid": "selection-ask-ai-send", children: "Send" }), _jsx("button", { type: "button", style: closeBtnStyle, onClick: () => {
                            setExpanded(false);
                            setPrompt('');
                        }, "aria-label": "Cancel", children: "\u2715" })] }), _jsx("div", { style: hintRowStyle, children: QUICK_PROMPTS.map((q) => (_jsx("button", { type: "button", style: hintChipStyle, onClick: () => setPrompt(q), disabled: busy, "data-testid": `selection-ask-ai-hint-${q.slice(0, 12).replace(/\s/g, '-')}`, children: q }, q))) })] }));
}
export default SelectionAskAi;
//# sourceMappingURL=SelectionAskAi.js.map