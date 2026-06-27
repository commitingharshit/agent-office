/**
 * Hyperlink Parser - Parse hyperlinks (w:hyperlink) with URL resolution
 *
 * OOXML Reference:
 * - Hyperlink element: w:hyperlink
 * - Attributes:
 *   - r:id - Relationship ID for external link (resolves via .rels)
 *   - w:anchor - Internal bookmark name
 *   - w:tooltip - Tooltip/title text
 *   - w:tgtFrame - Target frame (_blank, _self, etc.)
 *   - w:history - Whether to add to history
 *   - w:docLocation - Location within a document
 *
 * External links use r:id to reference a relationship in document.xml.rels
 * Internal links use w:anchor to reference a bookmark in the same document
 */
import type { Hyperlink, Run, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import { type XmlElement } from './xmlParser';
/**
 * Parse a hyperlink element (w:hyperlink)
 *
 * Handles both external links (via r:id relationship) and internal
 * links (via w:anchor bookmark reference).
 *
 * @param node - The w:hyperlink XML element
 * @param rels - Relationship map to resolve r:id references
 * @param styles - Style map for resolving run styles
 * @param theme - Theme for resolving colors/fonts
 * @param media - Media files map for image data
 * @returns Parsed Hyperlink object
 */
export declare function parseHyperlink(node: XmlElement, rels: RelationshipMap | null, styles?: StyleMap | null, theme?: Theme | null, media?: Map<string, MediaFile> | null): Hyperlink;
/**
 * Get the display text of a hyperlink
 *
 * Concatenates text from all child runs.
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns Display text string
 */
export declare function getHyperlinkText(hyperlink: Hyperlink): string;
/**
 * Check if a hyperlink is an external link
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns true if this links to an external URL
 */
export declare function isExternalLink(hyperlink: Hyperlink): boolean;
/**
 * Check if a hyperlink is an internal bookmark link
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns true if this links to an internal bookmark
 */
export declare function isInternalLink(hyperlink: Hyperlink): boolean;
/**
 * Get the resolved URL of a hyperlink
 *
 * For external links, returns the full URL.
 * For internal links, returns the anchor prefixed with #.
 * Returns undefined if the link couldn't be resolved.
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns Resolved URL or undefined
 */
export declare function getHyperlinkUrl(hyperlink: Hyperlink): string | undefined;
/**
 * Check if a hyperlink has any content (runs)
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns true if hyperlink has child runs
 */
export declare function hasContent(hyperlink: Hyperlink): boolean;
/**
 * Get all runs from a hyperlink
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns Array of Run objects
 */
export declare function getHyperlinkRuns(hyperlink: Hyperlink): Run[];
/**
 * Resolve a hyperlink's rId to a URL using a relationship map
 *
 * This is useful when you have a hyperlink that was parsed without
 * relationship context and need to resolve it later.
 *
 * @param hyperlink - Parsed Hyperlink object (will be modified)
 * @param rels - Relationship map to resolve against
 * @returns The resolved URL or undefined
 */
export declare function resolveHyperlinkUrl(hyperlink: Hyperlink, rels: RelationshipMap): string | undefined;
/**
 * Create an internal hyperlink to a bookmark
 *
 * Utility function for creating hyperlinks programmatically.
 *
 * @param anchor - Bookmark name to link to
 * @param children - Child runs for display text
 * @param options - Optional properties (tooltip, etc.)
 * @returns New Hyperlink object
 */
export declare function createInternalHyperlink(anchor: string, children: Run[], options?: {
    tooltip?: string;
}): Hyperlink;
/**
 * Create an external hyperlink
 *
 * Utility function for creating hyperlinks programmatically.
 * Note: The rId would need to be assigned when serializing.
 *
 * @param url - External URL
 * @param children - Child runs for display text
 * @param options - Optional properties (tooltip, target, etc.)
 * @returns New Hyperlink object
 */
export declare function createExternalHyperlink(url: string, children: Run[], options?: {
    tooltip?: string;
    target?: string;
}): Hyperlink;
//# sourceMappingURL=hyperlinkParser.d.ts.map