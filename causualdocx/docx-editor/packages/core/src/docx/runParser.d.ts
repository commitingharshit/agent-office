/**
 * Run Parser - Parse text runs (w:r) with complete formatting
 *
 * A run is a contiguous region of text with the same character formatting.
 * Runs can contain:
 * - Text (w:t)
 * - Tabs (w:tab)
 * - Line breaks (w:br)
 * - Symbols (w:sym)
 * - Footnote/endnote references
 * - Field characters
 * - Drawings/images (w:drawing)
 * - And more...
 *
 * OOXML Reference:
 * - Run: w:r
 * - Run properties: w:rPr
 * - Text content: w:t
 */
import type { Run, TextFormatting, Theme, Image, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import { type XmlElement } from './xmlParser';
/**
 * Parse run formatting properties (w:rPr)
 *
 * Handles ALL rPr properties:
 * - w:b (bold), w:i (italic), w:u (underline with style)
 * - w:strike (strikethrough), w:dstrike (double strike)
 * - w:vertAlign (superscript/subscript)
 * - w:smallCaps, w:caps (capitalization)
 * - w:highlight (text highlight color)
 * - w:shd (character shading)
 * - w:color (text color with theme resolution)
 * - w:sz (font size in half-points)
 * - w:rFonts (font family with theme resolution)
 * - w:spacing (character spacing)
 * - w:effect (text effects)
 * - And more...
 */
export declare function parseRunProperties(rPr: XmlElement | null, theme: Theme | null, _styles?: StyleMap): TextFormatting | undefined;
/**
 * Parse a run element (w:r)
 *
 * @param node - The w:r XML element
 * @param styles - Style map for resolving style references
 * @param theme - Theme for resolving theme colors/fonts
 * @param rels - Relationship map for resolving image references
 * @param media - Media files map for image data
 * @returns Parsed Run object
 */
export declare function parseRun(node: XmlElement, styles: StyleMap | null, theme: Theme | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): Run;
/**
 * Get plain text from a run
 *
 * @param run - Parsed Run object
 * @returns Concatenated text content
 */
export declare function getRunText(run: Run): string;
/**
 * Check if a run contains any actual content
 *
 * @param run - Parsed Run object
 * @returns true if run has visible content
 */
export declare function hasContent(run: Run): boolean;
/**
 * Check if a run contains a drawing/image
 *
 * @param run - Parsed Run object
 * @returns true if run contains an image
 */
export declare function hasImage(run: Run): boolean;
/**
 * Get all images from a run
 *
 * @param run - Parsed Run object
 * @returns Array of Image objects
 */
export declare function getImages(run: Run): Image[];
/**
 * Check if a run is part of a complex field
 *
 * @param run - Parsed Run object
 * @returns true if run contains field characters
 */
export declare function hasFieldChar(run: Run): boolean;
/**
 * Get field character type if present
 *
 * @param run - Parsed Run object
 * @returns Field character type or null
 */
export declare function getFieldCharType(run: Run): 'begin' | 'separate' | 'end' | null;
//# sourceMappingURL=runParser.d.ts.map