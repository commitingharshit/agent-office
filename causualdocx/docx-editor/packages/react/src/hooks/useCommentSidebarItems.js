import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { CommentCard } from '../components/sidebar/CommentCard';
import { TrackedChangeCard } from '../components/sidebar/TrackedChangeCard';
import { AddCommentCard } from '../components/sidebar/AddCommentCard';
import { ResolvedCommentMarker } from '../components/sidebar/ResolvedCommentMarker';
export function useCommentSidebarItems({ comments, trackedChanges, callbacks, showResolved = false, isAddingComment = false, addCommentYPosition = null, currentAuthor, }) {
    // Distinct author names from every comment + tracked-change + the
    // current author. Drives the @-mention typeahead in AddCommentCard
    // and the chip rendering inside CommentCard. We don't have a live
    // presence-graph (single-user / loose collab), so the historical
    // authors list is the best signal we have.
    const knownAuthors = useMemo(() => {
        const seen = new Set();
        const out = [];
        const push = (name) => {
            if (!name)
                return;
            const key = name.toLowerCase();
            if (seen.has(key))
                return;
            seen.add(key);
            out.push(name);
        };
        push(currentAuthor);
        for (const c of comments)
            push(c.author);
        for (const tc of trackedChanges)
            push(tc.author);
        return out;
    }, [comments, trackedChanges, currentAuthor]);
    // Active comments always, resolved only when showResolved
    const visibleComments = useMemo(() => comments.filter((c) => {
        if (c.parentId != null)
            return false;
        if (c.done && !showResolved)
            return false;
        return true;
    }), [comments, showResolved]);
    // Pre-group replies by parentId
    const repliesByParent = useMemo(() => {
        const map = new Map();
        for (const c of comments) {
            if (c.parentId != null) {
                const arr = map.get(c.parentId);
                if (arr)
                    arr.push(c);
                else
                    map.set(c.parentId, [c]);
            }
        }
        return map;
    }, [comments]);
    return useMemo(() => {
        var _a;
        const items = [];
        // "Add comment" input (temporary item with pre-computed Y)
        if (isAddingComment && addCommentYPosition != null) {
            items.push({
                id: 'new-comment-input',
                anchorPos: 0,
                fixedY: addCommentYPosition,
                priority: -1000, // always first at its Y
                isTemporary: true,
                estimatedHeight: 120,
                render: (props) => (_jsx(AddCommentCard, Object.assign({}, props, { onSubmit: callbacks.onAddComment, onCancel: callbacks.onCancelAddComment, knownAuthors: knownAuthors }))),
            });
        }
        // Comment cards — resolved render as icon when collapsed, full card when expanded
        for (const comment of visibleComments) {
            const replies = (_a = repliesByParent.get(comment.id)) !== null && _a !== void 0 ? _a : [];
            items.push({
                id: `comment-${comment.id}`,
                anchorPos: 0,
                anchorKey: `comment-${comment.id}`,
                priority: 0,
                estimatedHeight: comment.done ? 28 : 80,
                render: (props) => comment.done && !props.isExpanded ? (_jsx(ResolvedCommentMarker, Object.assign({}, props, { comment: comment }))) : (_jsx(CommentCard, Object.assign({}, props, { comment: comment, replies: replies, onReply: callbacks.onCommentReply, onResolve: callbacks.onCommentResolve, onUnresolve: callbacks.onCommentUnresolve, onDelete: callbacks.onCommentDelete, knownAuthors: knownAuthors }))),
            });
        }
        // Tracked change cards
        trackedChanges.forEach((change, idx) => {
            var _a;
            const replies = (_a = repliesByParent.get(change.revisionId)) !== null && _a !== void 0 ? _a : [];
            items.push({
                id: `tc-${change.revisionId}-${idx}`,
                anchorPos: change.from,
                anchorKey: `revision-${change.revisionId}`,
                priority: 1,
                estimatedHeight: 80,
                render: (props) => (_jsx(TrackedChangeCard, Object.assign({}, props, { change: change, replies: replies, onAccept: callbacks.onAcceptChange, onReject: callbacks.onRejectChange, onReply: callbacks.onTrackedChangeReply }))),
            });
        });
        return items;
    }, [
        visibleComments,
        trackedChanges,
        repliesByParent,
        callbacks,
        isAddingComment,
        addCommentYPosition,
        knownAuthors,
    ]);
}
//# sourceMappingURL=useCommentSidebarItems.js.map