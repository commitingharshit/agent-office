import { jsx as _jsx } from "react/jsx-runtime";
import { MaterialSymbol } from '../ui/Icons';
export function ResolvedCommentMarker({ comment, measureRef, onToggleExpand, }) {
    return (_jsx("div", { ref: measureRef, "data-comment-id": comment.id, "data-comment-resolved": "true", onClick: onToggleExpand, onMouseDown: (e) => e.stopPropagation(), style: {
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'var(--doc-text-muted)',
            padding: 2,
        }, onMouseOver: (e) => {
            e.currentTarget.style.opacity = '0.7';
        }, onMouseOut: (e) => {
            e.currentTarget.style.opacity = '1';
        }, children: _jsx(MaterialSymbol, { name: "chat_bubble_check", size: 20 }) }));
}
//# sourceMappingURL=ResolvedCommentMarker.js.map