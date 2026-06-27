import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog } from '../ui/Dialog';
const bodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const emptyStateStyle = {
    padding: '24px 0',
    fontSize: 14,
    color: 'var(--doc-text-muted)',
    textAlign: 'center',
    fontStyle: 'italic',
};
const rowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid var(--doc-border-light)',
    background: 'var(--doc-surface)',
    transition: 'border-color var(--doc-anim-fast)',
};
const rowTitleStyle = {
    fontSize: 13.5,
    fontWeight: 500,
    color: 'var(--doc-text)',
    letterSpacing: '-0.003em',
};
const rowHintStyle = {
    fontSize: 12.5,
    color: 'var(--doc-text-muted)',
    marginTop: 4,
    lineHeight: 1.45,
};
const primaryBtnStyle = {
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid var(--doc-primary)',
    background: 'var(--doc-primary)',
    color: 'white',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background var(--doc-anim-fast)',
};
const gotoBtnStyle = {
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid var(--doc-border)',
    background: 'transparent',
    color: 'var(--doc-primary)',
    borderRadius: 6,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background var(--doc-anim-fast), border-color var(--doc-anim-fast)',
};
function describe(issue) {
    if (issue.kind === 'missing-alt') {
        return {
            title: 'Image missing alt text',
            hint: 'Screen readers describe images via their alt text. Add a short description in the image properties.',
        };
    }
    // heading-jump
    const missing = issue.level - issue.previousLevel - 1;
    return {
        title: `Heading ${issue.level} follows Heading ${issue.previousLevel}`,
        hint: missing === 1
            ? `Add a Heading ${issue.previousLevel + 1} between them so the outline doesn't skip a level. (“${issue.text}”)`
            : `${missing} heading levels are skipped. (“${issue.text}”)`,
    };
}
export function AccessibilityDialog({ isOpen, onClose, issues, onGoto }) {
    const summary = issues.length === 0 ? null : `${issues.length} issue${issues.length === 1 ? '' : 's'}`;
    return (_jsx(Dialog, { isOpen: isOpen, onClose: onClose, title: "Accessibility check", width: 560, testId: "accessibility-dialog", helper: summary, footer: _jsx("button", { type: "button", style: primaryBtnStyle, onClick: onClose, children: "Done" }), children: _jsx("div", { style: bodyStyle, children: issues.length === 0 ? (_jsx("div", { style: emptyStateStyle, "data-testid": "accessibility-empty", children: "No accessibility issues found." })) : (issues.map((issue, i) => {
                const { title, hint } = describe(issue);
                return (_jsxs("div", { style: rowStyle, children: [_jsxs("div", { children: [_jsx("div", { style: rowTitleStyle, children: title }), _jsx("div", { style: rowHintStyle, children: hint })] }), _jsx("button", { type: "button", style: gotoBtnStyle, "data-testid": `a11y-goto-${i}`, onClick: () => {
                                onGoto(issue.pmPos);
                                onClose();
                            }, children: "Go to" })] }, `${issue.kind}-${issue.pmPos}-${i}`));
            })) }) }));
}
export default AccessibilityDialog;
//# sourceMappingURL=AccessibilityDialog.js.map