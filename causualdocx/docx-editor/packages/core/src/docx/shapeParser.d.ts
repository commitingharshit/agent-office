/**
 * Shape Parser - Parse shapes and drawings from wps:wsp elements
 *
 * DOCX shapes are contained in drawings with wps:wsp (Word Processing Shape) elements.
 * Shapes can be standalone or inside groups (wpg:wgp).
 *
 * OOXML Structure:
 * w:drawing
 *   └── wp:inline or wp:anchor
 *       └── a:graphic
 *           └── a:graphicData
 *               └── wps:wsp (shape)
 *                   ├── wps:cNvSpPr (non-visual properties)
 *                   ├── wps:spPr (shape properties)
 *                   │   ├── a:xfrm (transform: position, size, rotation)
 *                   │   ├── a:prstGeom (preset geometry/shape type)
 *                   │   ├── a:solidFill / a:noFill / a:gradFill (fill)
 *                   │   └── a:ln (line/outline properties)
 *                   ├── wps:style (style reference)
 *                   ├── wps:txbx (text box container)
 *                   │   └── w:txbxContent (text content)
 *                   └── wps:bodyPr (body/text properties)
 *
 * EMU (English Metric Units): 914400 EMU = 1 inch
 */
import type { Shape } from '../types/document';
import { type XmlElement } from './xmlParser';
export { emuToPixels } from '../utils/units';
/**
 * Parse a wps:wsp (Word Processing Shape) element
 *
 * @param node - The wps:wsp XML element
 * @returns Parsed Shape object
 */
export declare function parseShape(node: XmlElement): Shape;
/**
 * Parse shape from a w:drawing element that contains a shape (not an image)
 *
 * @param drawingEl - The w:drawing element
 * @returns Parsed Shape object or null if not a shape
 */
export declare function parseShapeFromDrawing(drawingEl: XmlElement): Shape | null;
/**
 * Check if a drawing element contains a shape (not an image)
 */
export declare function isShapeDrawing(drawingEl: XmlElement): boolean;
/**
 * Check if a shape is a line (connector)
 */
export declare function isLineShape(shape: Shape): boolean;
/**
 * Check if a shape is a text box
 */
export declare function isTextBoxShape(shape: Shape): boolean;
/**
 * Check if a shape has text content
 */
export declare function hasTextContent(shape: Shape): boolean;
/**
 * Get shape width in pixels
 */
export declare function getShapeWidthPx(shape: Shape): number;
/**
 * Get shape height in pixels
 */
export declare function getShapeHeightPx(shape: Shape): number;
/**
 * Get shape dimensions in pixels
 */
export declare function getShapeDimensionsPx(shape: Shape): {
    width: number;
    height: number;
};
/**
 * Check if shape is floating (anchored)
 */
export declare function isFloatingShape(shape: Shape): boolean;
/**
 * Check if shape has fill
 */
export declare function hasFill(shape: Shape): boolean;
/**
 * Check if shape has outline
 */
export declare function hasOutline(shape: Shape): boolean;
/**
 * Get outline width in pixels
 */
export declare function getOutlineWidthPx(shape: Shape): number;
/**
 * Resolve fill color to CSS color string
 */
export declare function resolveFillColor(shape: Shape): string | undefined;
/**
 * Resolve outline color to CSS color string
 */
export declare function resolveOutlineColor(shape: Shape): string | undefined;
//# sourceMappingURL=shapeParser.d.ts.map