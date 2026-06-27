import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getCommentText, formatDate, getInitials, avatarStyle } from './cardUtils';
import { useTranslation } from '../../i18n';
export function ReplyThread({ replies, isExpanded }) {
    const { t } = useTranslation();
    if (replies.length === 0)
        return null;
    const visibleReplies = isExpanded ? replies : replies.slice(-1);
    const hiddenCount = isExpanded ? 0 : replies.length - 1;
    return (_jsxs("div", { style: { marginTop: 8 }, children: [hiddenCount > 0 && (_jsx("div", { style: {
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--doc-primary)',
                    paddingTop: 6,
                    paddingBottom: 6,
                    borderTop: '1px solid #e8eaed',
                }, children: t('comments.replyCount', { count: hiddenCount }) })), visibleReplies.map((reply) => (_jsxs("div", { style: {
                    marginBottom: isExpanded ? 8 : 0,
                    paddingTop: 8,
                    borderTop: '1px solid #e8eaed',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("div", { style: avatarStyle(reply.author || 'U', 28), children: getInitials(reply.author || 'U') }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'var(--doc-text-on-surface, #1f2937)',
                                        }, children: reply.author || t('comments.unknown') }), _jsx("div", { style: { fontSize: 11, color: 'var(--doc-text-muted)' }, children: formatDate(reply.date) })] })] }), _jsx("div", { style: Object.assign({ fontSize: 13, color: 'var(--doc-text-on-surface, #1f2937)', 
                            // Unitless line-height scales with font-size, so the
                            // 2-line clamp stays consistent across system fonts /
                            // OS scaling (was 'lineHeight: 20px' which forced a
                            // fixed leading that didn't match the actual line
                            // height under different fonts, producing 1.5 / 2.5
                            // visible lines instead of exactly 2).
                            lineHeight: 1.4, marginTop: 4 }, (!isExpanded
                            ? {
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }
                            : {})), children: getCommentText(reply.content) })] }, reply.id)))] }));
}
//# sourceMappingURL=ReplyThread.js.map