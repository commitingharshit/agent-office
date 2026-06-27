/**
 * Comment Serializer
 *
 * Serializes Comment[] to OOXML comments.xml and commentsExtended.xml.
 *
 * comments.xml: the main comment content (w:comment elements)
 * commentsExtended.xml: reply threading via w15:commentEx with paraId/paraIdParent
 *
 * Each comment paragraph gets a w14:paraId. The last paragraph's paraId is used
 * in commentsExtended.xml to link replies to parents via w15:paraIdParent.
 */
import type { Comment } from '../../types/content';
interface CommentParaInfo {
    commentId: number;
    lastParaId: string;
    durableId: string;
    parentId?: number;
    done?: boolean;
}
/**
 * Serialize comments array to comments.xml content.
 * Also returns para info needed for commentsExtended.xml.
 */
export declare function serializeCommentsWithInfo(comments: Comment[]): {
    xml: string;
    paraInfos: CommentParaInfo[];
};
/**
 * Serialize comments array to comments.xml content (backwards-compatible wrapper)
 */
export declare function serializeComments(comments: Comment[]): string;
/**
 * Serialize commentsExtended.xml (w15:commentsEx) for reply threading.
 *
 * This file tells Word/Google Docs which comments are replies (via paraIdParent)
 * and which are resolved (via done). Without it, replies show as separate comments.
 */
export declare function serializeCommentsExtended(paraInfos: CommentParaInfo[]): string;
/**
 * Serialize commentsIds.xml (w16cid:commentsIds) for stable comment IDs.
 *
 * Word Online needs this to associate replies with parent comments.
 * Each comment gets a durableId derived from its paraId.
 */
export declare function serializeCommentsIds(paraInfos: CommentParaInfo[]): string;
/**
 * Serialize commentsExtensible.xml (w16cex:commentsExtensible) with UTC dates.
 *
 * Word Online and Pages use this for precise timestamps on comments.
 * Each entry links a durableId to a UTC date.
 */
export declare function serializeCommentsExtensible(paraInfos: CommentParaInfo[], comments: Comment[]): string;
export {};
//# sourceMappingURL=commentSerializer.d.ts.map