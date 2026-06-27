/**
 * Image Parser - Parse embedded images from w:drawing elements
 *
 * DOCX images are contained in <w:drawing> elements with either:
 * - wp:inline - Inline images that flow with text
 * - wp:anchor - Floating/anchored images with text wrapping
 *
 * OOXML Structure:
 * w:drawing
 *   ├── wp:inline or wp:anchor
 *   │   ├── wp:extent (size: cx, cy in EMUs)
 *   │   ├── wp:effectExtent (effect margins)
 *   │   ├── wp:docPr (document properties: id, name, descr, title)
 *   │   ├── wp:positionH / wp:positionV (for anchor only)
 *   │   ├── wp:wrap* (wrapping mode for anchor: wrapNone, wrapSquare, etc.)
 *   │   └── a:graphic
 *   │       └── a:graphicData
 *   │           └── pic:pic
 *   │               ├── pic:nvPicPr (non-visual properties)
 *   │               ├── pic:blipFill
 *   │               │   └── a:blip (r:embed = rId)
 *   │               └── pic:spPr
 *   │                   └── a:xfrm (transform: rotation, flip)
 *
 * EMU (English Metric Units): 914400 EMU = 1 inch
 * Conversion: pixels = (emu * 96) / 914400
 */
import type { Image, RelationshipMap, MediaFile } from '../types/document';
import { type XmlElement } from './xmlParser';
export { emuToPixels, pixelsToEmu } from '../utils/units';
/**
 * Resolve image data from relationships and media map
 *
 * @param rId - Relationship ID (e.g., "rId1")
 * @param rels - Relationship map
 * @param media - Media files map
 * @returns Object with src (data URL or blob), mimeType, and filename
 */
export declare function resolveImageData(rId: string, rels: RelationshipMap | undefined, media: Map<string, MediaFile> | undefined): {
    src?: string;
    mimeType?: string;
    filename?: string;
};
/**
 * Parse a w:drawing element
 *
 * The drawing element contains either wp:inline or wp:anchor.
 *
 * @param drawingEl - The w:drawing element
 * @param rels - Relationship map for resolving rId
 * @param media - Media files map
 * @returns Parsed Image object or null if not an image
 */
export declare function parseDrawing(drawingEl: XmlElement, rels: RelationshipMap | undefined, media: Map<string, MediaFile> | undefined): Image | null;
/**
 * Parse an image from a w:drawing element
 *
 * This is the main entry point for image parsing.
 *
 * @param node - The w:drawing XML element
 * @param rels - Relationship map for resolving rId
 * @param media - Media files map
 * @returns Parsed Image object or null if parsing fails
 */
export declare function parseImage(node: XmlElement, rels: RelationshipMap | undefined, media: Map<string, MediaFile> | undefined): Image | null;
/**
 * Check if an image is inline (not floating)
 */
export declare function isInlineImage(image: Image): boolean;
/**
 * Check if an image is floating (anchored)
 */
export declare function isFloatingImage(image: Image): boolean;
/**
 * Check if an image is behind text
 */
export declare function isBehindText(image: Image): boolean;
/**
 * Check if an image is in front of text
 */
export declare function isInFrontOfText(image: Image): boolean;
/**
 * Get image width in pixels
 */
export declare function getImageWidthPx(image: Image): number;
/**
 * Get image height in pixels
 */
export declare function getImageHeightPx(image: Image): number;
/**
 * Get image dimensions in pixels
 */
export declare function getImageDimensionsPx(image: Image): {
    width: number;
    height: number;
};
/**
 * Check if image has alt text (for accessibility)
 */
export declare function hasAltText(image: Image): boolean;
/**
 * Check if image is decorative (should be ignored by screen readers)
 */
export declare function isDecorativeImage(image: Image): boolean;
/**
 * Get wrap distances in pixels
 */
export declare function getWrapDistancesPx(image: Image): {
    top: number;
    bottom: number;
    left: number;
    right: number;
};
/**
 * Check if image needs text wrapping
 */
export declare function needsTextWrapping(image: Image): boolean;
//# sourceMappingURL=imageParser.d.ts.map