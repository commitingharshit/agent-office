import { jsx as _jsx } from "react/jsx-runtime";
import { MaterialSymbol } from './ui/Icons';
import { useTranslation } from '../i18n';
export function CommentMarginMarkers({ comments, anchorPositions, zoom, pageWidth, sidebarOpen, resolvedCommentIds, onMarkerClick, }) {
    const { t } = useTranslation();
    const rootComments = comments.filter((c) => c.parentId == null);
    const markers = rootComments
        .map((comment) => {
        const isResolved = resolvedCommentIds.has(comment.id);
        // Active: hide when sidebar is open (card visible in sidebar)
        if (!isResolved && sidebarOpen)
            return null;
        // Resolved: hide when sidebar is open (expanded resolved card visible in sidebar)
        if (isResolved && sidebarOpen)
            return null;
        const y = anchorPositions.get(`comment-${comment.id}`);
        if (y == null)
            return null;
        return { comment, isResolved, y };
    })
        .filter(Boolean);
    if (markers.length === 0)
        return null;
    return (_jsx("div", { className: "docx-comment-margin-markers", style: {
            position: 'absolute',
            top: 0,
            // Position just past the page right edge
            left: `calc(50% + ${(pageWidth * zoom) / 2 + 6}px)`,
            zIndex: 30,
            pointerEvents: 'none',
        }, onMouseDown: (e) => e.stopPropagation(), children: markers.map(({ comment, isResolved, y }) => (_jsx("button", { onClick: () => onMarkerClick(comment.id), title: isResolved ? t('commentMarkers.resolvedComment') : t('commentMarkers.comment'), style: {
                position: 'absolute',
                top: y * zoom,
                left: 0,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                cursor: 'pointer',
                pointerEvents: 'auto',
                color: 'var(--doc-text-muted)',
                padding: 0,
                fontFamily: 'inherit',
            }, onMouseOver: (e) => {
                e.currentTarget.style.opacity = '0.7';
            }, onMouseOut: (e) => {
                e.currentTarget.style.opacity = '1';
            }, children: _jsx(MaterialSymbol, { name: isResolved ? 'chat_bubble_check' : 'chat_bubble_outline', size: 18 }) }, comment.id))) }));
}
//# sourceMappingURL=CommentMarginMarkers.js.map