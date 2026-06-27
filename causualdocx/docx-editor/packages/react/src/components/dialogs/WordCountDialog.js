import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog } from '../ui/Dialog';
import { useTranslation } from '../../i18n';
const bodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};
const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    fontSize: 14,
    padding: '8px 0',
    borderBottom: '1px solid var(--doc-border-light)',
};
const lastRowStyle = Object.assign(Object.assign({}, rowStyle), { borderBottom: 'none' });
const labelStyle = {
    color: 'var(--doc-text-muted)',
    fontWeight: 400,
};
const valueStyle = {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 500,
    color: 'var(--doc-text)',
    letterSpacing: '-0.005em',
};
const closeBtnStyle = {
    padding: '7px 16px',
    borderRadius: 6,
    border: '1px solid var(--doc-border)',
    background: 'var(--doc-surface)',
    color: 'var(--doc-text)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 80ms cubic-bezier(0.4, 0, 0.2, 1), border-color 80ms cubic-bezier(0.4, 0, 0.2, 1)',
};
export function WordCountDialog({ isOpen, onClose, stats, }) {
    const { t } = useTranslation();
    // Rows are built declaratively so the last row can drop its bottom
    // border (visual rhythm — hairline divider between every row except
    // the final one).
    const rows = [];
    if (stats.pages !== undefined) {
        rows.push({ label: t('dialogs.wordCount.pages'), value: stats.pages });
    }
    rows.push({ label: t('dialogs.wordCount.words'), value: stats.words });
    rows.push({ label: t('dialogs.wordCount.characters'), value: stats.characters });
    rows.push({
        label: t('dialogs.wordCount.charactersNoSpaces'),
        value: stats.charactersNoSpaces,
    });
    rows.push({ label: t('dialogs.wordCount.paragraphs'), value: stats.paragraphs });
    if (stats.words > 0) {
        // 200 wpm baseline — same convention as the status-bar estimate.
        // Rounded up so users over-budget rather than under.
        const minutes = Math.max(1, Math.ceil(stats.words / 200));
        rows.push({ label: t('dialogs.wordCount.readingTime'), value: `~${minutes} min` });
    }
    return (_jsx(Dialog, { isOpen: isOpen, onClose: onClose, title: t('dialogs.wordCount.title'), width: 400, testId: "word-count-dialog", footer: _jsx("button", { type: "button", onClick: onClose, style: closeBtnStyle, "data-testid": "word-count-dialog-close", children: t('common.close') }), children: _jsx("div", { style: bodyStyle, children: rows.map((r, i) => (_jsx(Row, { label: r.label, value: r.value, isLast: i === rows.length - 1 }, r.label))) }) }));
}
function Row({ label, value, isLast, }) {
    return (_jsxs("div", { style: isLast ? lastRowStyle : rowStyle, children: [_jsx("span", { style: labelStyle, children: label }), _jsx("span", { style: valueStyle, children: typeof value === 'number' ? value.toLocaleString() : value })] }));
}
export default WordCountDialog;
//# sourceMappingURL=WordCountDialog.js.map