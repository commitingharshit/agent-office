import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * EquationDialog — Insert → Equation.
 *
 * The user types LaTeX (the lingua franca for math, what Word/OnlyOffice
 * accept natively), sees a live MathML preview, and inserts. The equation
 * is stored as a math node carrying its LaTeX source + the rendered MathML;
 * on save the MathML is converted to native OMML so it round-trips into the
 * .docx as real math (never an image).
 *
 * Rendering uses Temml (MIT) — LaTeX → MathML — and the browser's native
 * MathML, the same path the painter uses, so the preview matches the page.
 */
import { useMemo, useState, useEffect } from 'react';
import katex from 'katex';
import { Dialog } from './ui/Dialog';
/** A rough plain-text fallback from LaTeX — used only when MathML can't
 *  render. Strips commands/braces so it stays readable. */
function latexToPlainText(latex) {
    return latex
        .replace(/\\[a-zA-Z]+/g, (m) => m.slice(1))
        .replace(/[{}\\$]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
const QUICK_INSERTS = [
    { label: 'x²', latex: 'x^{2}' },
    { label: 'a⁄b', latex: '\\frac{a}{b}' },
    { label: '√', latex: '\\sqrt{x}' },
    { label: '∑', latex: '\\sum_{i=1}^{n}' },
    { label: '∫', latex: '\\int_{a}^{b}' },
    { label: 'α', latex: '\\alpha' },
    { label: '≤', latex: '\\leq' },
    { label: '×', latex: '\\times' },
];
export function EquationDialog({ isOpen, onClose, onInsert, initialLatex = '', initialDisplay = 'inline', }) {
    const [latex, setLatex] = useState(initialLatex);
    const [display, setDisplay] = useState(initialDisplay);
    // Reset to the initial values each time the dialog opens.
    useEffect(() => {
        if (isOpen) {
            setLatex(initialLatex);
            setDisplay(initialDisplay);
        }
    }, [isOpen, initialLatex, initialDisplay]);
    // LaTeX → MathML via KaTeX. Returns the bare <math> markup or an error.
    const rendered = useMemo(() => {
        const src = latex.trim();
        if (!src)
            return { mathml: '', error: null };
        try {
            const html = katex.renderToString(src, {
                output: 'mathml',
                throwOnError: true,
                displayMode: display === 'block',
            });
            // KaTeX wraps the MathML in <span class="katex">…</span>; keep just
            // the <math> element for the node + the preview.
            const m = html.match(/<math[\s\S]*?<\/math>/);
            let mathml = m ? m[0] : '';
            if (mathml && display === 'block' && !/\bdisplay="block"/.test(mathml)) {
                mathml = mathml.replace(/<math\b/, '<math display="block"');
            }
            return { mathml, error: mathml ? null : 'Could not render equation' };
        }
        catch (err) {
            return { mathml: '', error: err instanceof Error ? err.message : 'Invalid LaTeX' };
        }
    }, [latex, display]);
    const canInsert = latex.trim().length > 0 && !!rendered.mathml && !rendered.error;
    const handleInsert = () => {
        if (!canInsert)
            return;
        onInsert({
            latex: latex.trim(),
            mathml: rendered.mathml,
            plainText: latexToPlainText(latex) || latex.trim(),
            display,
        });
        onClose();
    };
    return (_jsx(Dialog, { isOpen: isOpen, onClose: onClose, title: "Insert equation", width: 560, testId: "equation-dialog", helper: "LaTeX \u2014 e.g. \\frac{a}{b}, x^2, \\sqrt{x}, \\sum, \\int", footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: onClose, style: secondaryBtn, children: "Cancel" }), _jsx("button", { type: "button", onClick: handleInsert, disabled: !canInsert, style: Object.assign(Object.assign({}, primaryBtn), { opacity: canInsert ? 1 : 0.5 }), "data-testid": "equation-insert", children: "Insert" })] }), children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 }, children: QUICK_INSERTS.map((q) => (_jsx("button", { type: "button", onClick: () => setLatex((v) => v + (v && !v.endsWith(' ') ? ' ' : '') + q.latex), style: chipBtn, title: q.latex, children: q.label }, q.latex))) }), _jsx("textarea", { value: latex, onChange: (e) => setLatex(e.target.value), onKeyDown: (e) => {
                        // Ctrl/Cmd+Enter inserts.
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleInsert();
                        }
                    }, placeholder: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", rows: 3, autoFocus: true, spellCheck: false, "data-testid": "equation-latex-input", style: textareaStyle }), _jsxs("label", { style: toggleRow, children: [_jsx("input", { type: "checkbox", checked: display === 'block', onChange: (e) => setDisplay(e.target.checked ? 'block' : 'inline'), "data-testid": "equation-display-toggle" }), "Display equation (centered on its own line)"] }), _jsx("div", { style: previewLabel, children: "Preview" }), _jsx("div", { style: previewBox, "data-testid": "equation-preview", children: rendered.error ? (_jsx("span", { style: { color: 'var(--doc-danger, #c62828)', fontSize: 13 }, children: rendered.error })) : rendered.mathml ? (_jsx("span", { style: { fontSize: display === 'block' ? 22 : 18 }, 
                        // Native MathML — the same render path as the page.
                        dangerouslySetInnerHTML: { __html: rendered.mathml } })) : (_jsx("span", { style: { color: 'var(--doc-text-muted)', fontSize: 13 }, children: "Type LaTeX above to preview." })) })] }) }));
}
const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--doc-border, #d0d0d0)',
    background: 'var(--doc-surface-sunken, #f8f9fa)',
    color: 'var(--doc-text)',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.5,
    resize: 'vertical',
    boxSizing: 'border-box',
};
const previewLabel = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--doc-text-muted)',
};
const previewBox = {
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid var(--doc-border-light, #eaecef)',
    background: 'var(--doc-surface, #fff)',
};
const toggleRow = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--doc-text)',
    cursor: 'pointer',
};
const chipBtn = {
    minWidth: 32,
    height: 30,
    padding: '0 8px',
    borderRadius: 6,
    border: '1px solid var(--doc-border, #d0d0d0)',
    background: 'var(--doc-surface, #fff)',
    color: 'var(--doc-text)',
    fontSize: 14,
    cursor: 'pointer',
};
const secondaryBtn = {
    padding: '8px 14px',
    borderRadius: 6,
    border: '1px solid var(--doc-border, #d0d0d0)',
    background: 'transparent',
    color: 'var(--doc-text)',
    fontSize: 13,
    cursor: 'pointer',
};
const primaryBtn = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--doc-primary, #1a73e8)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
};
//# sourceMappingURL=EquationDialog.js.map