import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { MaterialSymbol } from '../ui/Icons';
import { Tooltip } from '../ui/Tooltip';
import { getCommentText, formatDate, getInitials, avatarStyle, ICON_BUTTON_STYLE, } from './cardUtils';
import { ReplyThread } from './ReplyThread';
import { ReplyInput } from './ReplyInput';
import { CARD_STYLE_COLLAPSED, CARD_STYLE_EXPANDED } from './cardStyles';
import { renderCommentText } from './mentionText';
import { useTranslation } from '../../i18n';
export function CommentCard({ comment, replies, isExpanded, onToggleExpand, measureRef, onReply, onResolve, onUnresolve, onDelete, knownAuthors = [], }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuTriggerRef = useRef(null);
    // Close the menu on Escape + auto-focus the first menu item on open
    // so keyboard users can act without reaching for the mouse. Also
    // click-outside-to-close so opening the menu doesn't trap focus.
    useEffect(() => {
        var _a;
        if (!menuOpen)
            return;
        // Auto-focus first menu item when the popup mounts.
        const first = (_a = menuRef.current) === null || _a === void 0 ? void 0 : _a.querySelector('button');
        first === null || first === void 0 ? void 0 : first.focus();
        const onKeyDown = (e) => {
            var _a;
            if (e.key === 'Escape') {
                e.stopPropagation();
                setMenuOpen(false);
                // Return focus to the trigger — standard menu pattern.
                (_a = menuTriggerRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            }
        };
        const onClickOutside = (e) => {
            var _a, _b;
            const target = e.target;
            if (!target)
                return;
            if ((_a = menuRef.current) === null || _a === void 0 ? void 0 : _a.contains(target))
                return;
            if ((_b = menuTriggerRef.current) === null || _b === void 0 ? void 0 : _b.contains(target))
                return;
            setMenuOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onClickOutside);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, [menuOpen]);
    const { t } = useTranslation();
    return (_jsxs("div", { ref: measureRef, "data-comment-id": comment.id, className: "docx-comment-card", onClick: onToggleExpand, onMouseDown: (e) => e.stopPropagation(), style: Object.assign({}, (isExpanded ? CARD_STYLE_EXPANDED : CARD_STYLE_COLLAPSED)), children: [comment.done && (_jsxs("div", { style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    marginBottom: 8,
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--doc-success)',
                    backgroundColor: 'var(--doc-success-bg)',
                    borderRadius: 10,
                }, children: [_jsx(MaterialSymbol, { name: "check", size: 12 }), t('comments.resolved')] })), _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("div", { style: avatarStyle(comment.author || 'U'), children: getInitials(comment.author || 'U') }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: 'var(--doc-text-on-surface, #1f2937)' }, children: comment.author || t('comments.unknown') }), _jsx("div", { style: { fontSize: 11, color: 'var(--doc-text-muted)' }, children: formatDate(comment.date) })] }), isExpanded && (_jsxs("div", { style: { display: 'flex', gap: 4, marginTop: 2, position: 'relative' }, children: [_jsx(Tooltip, { content: comment.done ? t('comments.reopen') : t('comments.resolve'), children: _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        if (comment.done) {
                                            onUnresolve === null || onUnresolve === void 0 ? void 0 : onUnresolve(comment.id);
                                        }
                                        else {
                                            onResolve === null || onResolve === void 0 ? void 0 : onResolve(comment.id);
                                        }
                                    }, "aria-label": comment.done ? t('comments.reopen') : t('comments.resolve'), style: ICON_BUTTON_STYLE, children: _jsx(MaterialSymbol, { name: comment.done ? 'undo' : 'check', size: 20 }) }) }), _jsx(Tooltip, { content: t('comments.moreOptions'), children: _jsx("button", { ref: menuTriggerRef, onClick: (e) => {
                                        e.stopPropagation();
                                        setMenuOpen(!menuOpen);
                                    }, "aria-label": t('comments.moreOptions'), "aria-haspopup": "menu", "aria-expanded": menuOpen, style: ICON_BUTTON_STYLE, children: _jsx(MaterialSymbol, { name: "more_vert", size: 20 }) }) }), menuOpen && (_jsx("div", { ref: menuRef, role: "menu", onClick: (e) => e.stopPropagation(), onMouseDown: (e) => e.stopPropagation(), style: {
                                    position: 'absolute',
                                    top: 32,
                                    right: 0,
                                    background: 'var(--doc-surface, white)',
                                    borderRadius: 8,
                                    boxShadow: '0 2px 6px rgba(60,64,67,0.3), 0 1px 2px rgba(60,64,67,0.15)',
                                    zIndex: 100,
                                    minWidth: 120,
                                    padding: '4px 0',
                                }, children: _jsx("button", { role: "menuitem", onClick: () => {
                                        setMenuOpen(false);
                                        onDelete === null || onDelete === void 0 ? void 0 : onDelete(comment.id);
                                    }, style: {
                                        display: 'block',
                                        width: '100%',
                                        padding: '8px 16px',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        fontSize: 14,
                                        color: 'var(--doc-text-on-surface, #1f2937)',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }, onMouseOver: (e) => {
                                        e.target.style.backgroundColor =
                                            'var(--doc-bg-hover, #f1f3f4)';
                                    }, onMouseOut: (e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }, children: t('common.delete') }) }))] }))] }), _jsx("div", { style: {
                    fontSize: 13,
                    color: 'var(--doc-text-on-surface, #1f2937)',
                    lineHeight: '20px',
                    marginTop: 6,
                }, children: renderCommentText(getCommentText(comment.content), knownAuthors) }), _jsx(ReplyThread, { replies: replies, isExpanded: isExpanded }), isExpanded && !comment.done && (_jsx(ReplyInput, { onSubmit: (text) => onReply === null || onReply === void 0 ? void 0 : onReply(comment.id, text) }))] }));
}
//# sourceMappingURL=CommentCard.js.map