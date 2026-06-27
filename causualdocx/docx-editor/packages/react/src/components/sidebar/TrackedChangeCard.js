import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MaterialSymbol } from '../ui/Icons';
import { Tooltip } from '../ui/Tooltip';
import { formatDate, getInitials, avatarStyle, ICON_BUTTON_STYLE, truncateText } from './cardUtils';
import { ReplyThread } from './ReplyThread';
import { ReplyInput } from './ReplyInput';
import { CARD_STYLE_COLLAPSED, CARD_STYLE_EXPANDED } from './cardStyles';
import { useTranslation } from '../../i18n';
export function TrackedChangeCard({ change, replies, isExpanded, onToggleExpand, measureRef, onAccept, onReject, onReply, }) {
    const { t } = useTranslation();
    const authorName = change.author || t('trackedChanges.unknown');
    return (_jsxs("div", { ref: measureRef, className: "docx-tracked-change-card", onClick: () => onToggleExpand(), onMouseDown: (e) => e.stopPropagation(), style: isExpanded ? CARD_STYLE_EXPANDED : CARD_STYLE_COLLAPSED, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("div", { style: avatarStyle(authorName), children: getInitials(authorName) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: 'var(--doc-text-on-surface, #1f2937)' }, children: authorName }), change.date && (_jsx("div", { style: { fontSize: 11, color: 'var(--doc-text-muted)' }, children: formatDate(change.date) }))] }), isExpanded && (_jsxs("div", { style: { display: 'flex', gap: 4, marginTop: 2 }, children: [_jsx(Tooltip, { content: t('common.accept'), children: _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        onAccept === null || onAccept === void 0 ? void 0 : onAccept(change.from, change.to);
                                    }, "aria-label": t('common.accept'), style: ICON_BUTTON_STYLE, children: _jsx(MaterialSymbol, { name: "check", size: 20 }) }) }), _jsx(Tooltip, { content: t('common.reject'), children: _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        onReject === null || onReject === void 0 ? void 0 : onReject(change.from, change.to);
                                    }, "aria-label": t('common.reject'), style: ICON_BUTTON_STYLE, children: _jsx(MaterialSymbol, { name: "close", size: 20 }) }) })] }))] }), _jsx("div", { style: {
                    fontSize: 13,
                    lineHeight: '20px',
                    color: 'var(--doc-text-on-surface, #1f2937)',
                    marginTop: 6,
                }, children: change.type === 'replacement' ? (_jsxs(_Fragment, { children: [t('trackedChanges.replaced'), ' ', _jsxs("span", { style: { color: 'var(--doc-error)', fontWeight: 500 }, children: ["\"", truncateText(change.deletedText || ''), "\""] }), ' ', t('trackedChanges.with'), ' ', _jsxs("span", { style: { color: 'var(--doc-success)', fontWeight: 500 }, children: ["\"", truncateText(change.text), "\""] })] })) : (_jsxs(_Fragment, { children: [change.type === 'insertion' ? t('trackedChanges.added') : t('trackedChanges.deleted'), ' ', _jsxs("span", { style: {
                                color: change.type === 'insertion' ? 'var(--doc-success)' : 'var(--doc-error)',
                                fontWeight: 500,
                            }, children: ["\"", truncateText(change.text), "\""] })] })) }), _jsx(ReplyThread, { replies: replies, isExpanded: isExpanded }), isExpanded && _jsx(ReplyInput, { onSubmit: (text) => onReply === null || onReply === void 0 ? void 0 : onReply(change.revisionId, text) })] }));
}
//# sourceMappingURL=TrackedChangeCard.js.map