/**
 * Bookmark Parser - Parse bookmark markers (w:bookmarkStart, w:bookmarkEnd)
 *
 * Bookmarks are named locations in a document that can be targeted by internal
 * hyperlinks. They consist of a start and end marker with matching IDs.
 *
 * OOXML Reference:
 * - Bookmark start: w:bookmarkStart (id, name, colFirst?, colLast?)
 * - Bookmark end: w:bookmarkEnd (id)
 * - Internal hyperlinks reference bookmarks by name via w:anchor attribute
 *
 * Bookmark Structure:
 * - Each bookmark has a unique numeric ID within the document
 * - The name is used for hyperlink references
 * - Start and end markers can span multiple paragraphs or be point bookmarks
 * - Table column bookmarks have colFirst/colLast for column ranges
 */
import type { BookmarkStart, BookmarkEnd } from '../types/document';
import { type XmlElement } from './xmlParser';
/**
 * Parse a bookmark start element (w:bookmarkStart)
 *
 * Extracts:
 * - id: Numeric identifier (required, matches with bookmarkEnd)
 * - name: Bookmark name (required, used by hyperlinks)
 * - colFirst: First column for table bookmarks (optional)
 * - colLast: Last column for table bookmarks (optional)
 *
 * @param node - The w:bookmarkStart XML element
 * @returns Parsed BookmarkStart object
 */
export declare function parseBookmarkStart(node: XmlElement): BookmarkStart;
/**
 * Parse a bookmark end element (w:bookmarkEnd)
 *
 * Bookmark ends only contain an ID that matches the corresponding start marker.
 *
 * @param node - The w:bookmarkEnd XML element
 * @returns Parsed BookmarkEnd object
 */
export declare function parseBookmarkEnd(node: XmlElement): BookmarkEnd;
/**
 * Bookmark map for quick lookup by ID or name
 */
export interface BookmarkMap {
    /** Lookup bookmark start by ID */
    byId: Map<number, BookmarkStart>;
    /** Lookup bookmark start by name (for hyperlink resolution) */
    byName: Map<string, BookmarkStart>;
    /** All bookmark starts in document order */
    bookmarks: BookmarkStart[];
}
/**
 * Create an empty bookmark map
 */
export declare function createBookmarkMap(): BookmarkMap;
/**
 * Add a bookmark to the map
 *
 * @param map - The bookmark map to update
 * @param bookmark - The bookmark start to add
 */
export declare function addBookmark(map: BookmarkMap, bookmark: BookmarkStart): void;
/**
 * Get a bookmark by name (for resolving internal hyperlinks)
 *
 * @param map - The bookmark map to search
 * @param name - Bookmark name to find
 * @returns The BookmarkStart or undefined if not found
 */
export declare function getBookmarkByName(map: BookmarkMap, name: string): BookmarkStart | undefined;
/**
 * Get a bookmark by ID (for matching start/end pairs)
 *
 * @param map - The bookmark map to search
 * @param id - Bookmark ID to find
 * @returns The BookmarkStart or undefined if not found
 */
export declare function getBookmarkById(map: BookmarkMap, id: number): BookmarkStart | undefined;
/**
 * Check if a bookmark exists by name
 *
 * @param map - The bookmark map to search
 * @param name - Bookmark name to check
 * @returns true if bookmark exists
 */
export declare function hasBookmark(map: BookmarkMap, name: string): boolean;
/**
 * Get all bookmark names in the document
 *
 * @param map - The bookmark map
 * @returns Array of bookmark names
 */
export declare function getAllBookmarkNames(map: BookmarkMap): string[];
/**
 * Check if a bookmark is a point bookmark (start and end at same location)
 *
 * Point bookmarks have no content between start and end markers.
 * This is commonly used for insertion points.
 *
 * @param start - The bookmark start
 * @param end - The bookmark end
 * @param contents - Content between them
 * @returns true if this is a point bookmark
 */
export declare function isPointBookmark(start: BookmarkStart, end: BookmarkEnd, contents: unknown[]): boolean;
/**
 * Check if a bookmark is a table column bookmark
 *
 * Table bookmarks have colFirst and colLast attributes indicating
 * they span specific table columns.
 *
 * @param bookmark - The bookmark to check
 * @returns true if bookmark has column range info
 */
export declare function isTableBookmark(bookmark: BookmarkStart): boolean;
/**
 * Generate an internal hyperlink href from a bookmark name
 *
 * Internal hyperlinks use #anchor format.
 *
 * @param bookmarkName - The bookmark name to link to
 * @returns Href string (e.g., "#BookmarkName")
 */
export declare function bookmarkToHref(bookmarkName: string): string;
/**
 * Extract bookmark name from an internal hyperlink href
 *
 * @param href - The href string
 * @returns Bookmark name or null if not an internal link
 */
export declare function hrefToBookmarkName(href: string): string | null;
/**
 * Check if a bookmark is a built-in Word bookmark
 *
 * Word uses certain reserved bookmark names for special purposes:
 * - _GoBack: Last editing position
 * - _Toc*: Table of contents entries
 * - _Ref*: Cross-reference anchors
 * - _Hlt*: Highlight ranges
 *
 * @param name - Bookmark name to check
 * @returns true if this is a built-in bookmark
 */
export declare function isBuiltInBookmark(name: string): boolean;
/**
 * Check if a bookmark is a TOC entry bookmark
 *
 * @param name - Bookmark name to check
 * @returns true if bookmark is for TOC
 */
export declare function isTocBookmark(name: string): boolean;
/**
 * Check if a bookmark is a cross-reference anchor
 *
 * @param name - Bookmark name to check
 * @returns true if bookmark is for cross-reference
 */
export declare function isRefBookmark(name: string): boolean;
/**
 * Get bookmark type category
 *
 * @param name - Bookmark name
 * @returns Bookmark type
 */
export declare function getBookmarkType(name: string): 'user' | 'toc' | 'ref' | 'goBack' | 'internal';
/**
 * Validate that all bookmark starts have matching ends
 *
 * @param starts - Array of bookmark starts
 * @param ends - Array of bookmark ends
 * @returns Object with validation results
 */
export declare function validateBookmarkPairs(starts: BookmarkStart[], ends: BookmarkEnd[]): {
    valid: boolean;
    unmatchedStarts: BookmarkStart[];
    unmatchedEnds: BookmarkEnd[];
};
/**
 * Validate a bookmark name (for creating new bookmarks)
 *
 * Valid bookmark names:
 * - Cannot be empty
 * - Must start with a letter or underscore
 * - Can contain letters, digits, and underscores
 * - Cannot exceed 40 characters
 *
 * @param name - Name to validate
 * @returns Object with validation result and error message if invalid
 */
export declare function validateBookmarkName(name: string): {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=bookmarkParser.d.ts.map