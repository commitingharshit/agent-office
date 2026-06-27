/**
 * Comment Parser - Parse comments.xml and commentsExtensible.xml
 *
 * Parses OOXML comments (w:comment) from comments.xml file.
 * Cross-references with commentsExtensible.xml (or commentsExtended.xml)
 * to obtain reliable UTC timestamps via w16cex:dateUtc.
 *
 * Note: Microsoft Word stores w:date as local time WITHOUT timezone offset,
 * which is ambiguous. The reliable UTC timestamp lives in the separate
 * commentsExtensible.xml part (Word 2016+).
 *
 * OOXML Reference:
 * - Comments: w:comments
 * - Comment: w:comment (w:id, w:author, w:date, w:initials)
 * - Comment content: child w:p elements
 */
import type { Comment, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
/**
 * Parse comments.xml into an array of Comment objects.
 *
 * If commentsExtensibleXml is provided, UTC timestamps are cross-referenced
 * via paraId and preferred over the ambiguous w:date local time.
 *
 * If commentsExtendedXml is provided, reply threading (paraIdParent) and
 * resolved state (done) are cross-referenced via paraId.
 */
export declare function parseComments(commentsXml: string | null, styles: StyleMap | null, theme: Theme | null, rels: RelationshipMap, media: Map<string, MediaFile>, commentsExtensibleXml?: string | null, commentsExtendedXml?: string | null): Comment[];
//# sourceMappingURL=commentParser.d.ts.map