/**
 * Shared DrawingML Parsing Utilities
 *
 * Common functions used by imageParser, textBoxParser, and shapeParser
 * for parsing DrawingML elements (positions, wrapping, colors, fills, outlines).
 */
import type { ImagePosition, ImageWrap, ShapeFill, ShapeOutline, ColorValue } from '../types/document';
import { type XmlElement } from './xmlParser';
/**
 * Parse a color value from a DrawingML element.
 * Handles: a:srgbClr, a:schemeClr, a:sysClr, a:prstClr
 * Applies shade/tint modifiers when present.
 */
export declare function parseColorElement(element: XmlElement | null): ColorValue | undefined;
/**
 * Parse fill from shape properties (a:solidFill, a:noFill, a:gradFill).
 */
export declare function parseFill(spPr: XmlElement | null): ShapeFill | undefined;
/**
 * Parse outline from shape properties (a:ln).
 */
export declare function parseOutline(spPr: XmlElement | null): ShapeOutline | undefined;
/**
 * Parse horizontal position from wp:positionH element.
 */
export declare function parsePositionH(posH: XmlElement | null): ImagePosition['horizontal'] | undefined;
/**
 * Parse vertical position from wp:positionV element.
 */
export declare function parsePositionV(posV: XmlElement | null): ImagePosition['vertical'] | undefined;
/**
 * Parse position for anchored drawings (combines positionH + positionV).
 */
export declare function parseAnchorPosition(anchor: XmlElement): ImagePosition | undefined;
/** Known wrap element names */
export declare const WRAP_ELEMENT_NAMES: string[];
/**
 * Parse wrap settings from a wrap element.
 *
 * Distance attributes (distT/distB/distL/distR) can appear on both
 * the anchor element and the wrap child. Wrap child values take priority;
 * anchor-level values are used as fallbacks.
 */
export declare function parseWrapElement(wrapEl: XmlElement | null, behindDoc: boolean, anchorDistances?: {
    distT?: number;
    distB?: number;
    distL?: number;
    distR?: number;
}): ImageWrap;
/**
 * Parse wrap from an anchor element (finds wrap child internally).
 */
export declare function parseAnchorWrap(anchor: XmlElement): ImageWrap | undefined;
/**
 * Resolve a ColorValue to a CSS hex string using default theme colors.
 * For use when no Theme object is available (e.g., shape/text box parsing).
 */
export declare function resolveColorValueToHex(color: ColorValue | undefined): string | undefined;
//# sourceMappingURL=drawingUtils.d.ts.map