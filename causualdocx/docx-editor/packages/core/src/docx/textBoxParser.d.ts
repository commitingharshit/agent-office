/**
 * Text Box Parser - Parse floating text box containers
 *
 * Text boxes in DOCX are implemented as shapes (wps:wsp) with text body content (wps:txbx).
 * The text body contains w:txbxContent which holds paragraphs and tables like the main document.
 *
 * OOXML Structure:
 * w:drawing
 *   └── wp:inline or wp:anchor
 *       └── a:graphic
 *           └── a:graphicData
 *               └── wps:wsp (shape)
 *                   ├── wps:cNvSpPr (non-visual properties)
 *                   ├── wps:spPr (shape properties)
 *                   │   ├── a:xfrm (transform: position, size)
 *                   │   ├── a:prstGeom (preset geometry - typically "rect" for text boxes)
 *                   │   ├── a:solidFill / a:noFill (fill)
 *                   │   └── a:ln (outline)
 *                   ├── wps:txbx (text box container)
 *                   │   └── w:txbxContent (text content)
 *                   │       ├── w:p (paragraphs)
 *                   │       └── w:tbl (tables)
 *                   └── wps:bodyPr (body properties - margins, text direction, etc.)
 *
 * EMU (English Metric Units): 914400 EMU = 1 inch
 */
import type { TextBox, Paragraph, Table, ImageSize, ImagePosition, ImageWrap, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
import { type XmlElement } from './xmlParser';
export { emuToPixels } from '../utils/units';
/**
 * Extract raw paragraph elements from w:txbxContent
 * Actual parsing happens via document parser to avoid circular dependencies
 */
export declare function extractTextBoxContentElements(txbxContent: XmlElement | null): {
    paragraphElements: XmlElement[];
    tableElements: XmlElement[];
};
/**
 * Type for the paragraph parser function to avoid circular imports
 */
export type ParagraphParserFn = (node: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels?: RelationshipMap | null) => Paragraph;
/**
 * Type for the table parser function to avoid circular imports
 */
export type TableParserFn = (node: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile>) => Table;
/**
 * Parse text box content with provided parser functions
 * This avoids circular dependencies by accepting parser functions as parameters
 */
export declare function parseTextBoxContent(txbxContent: XmlElement | null, parseParagraph: ParagraphParserFn, parseTable: TableParserFn | null, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels?: RelationshipMap | null, _media?: Map<string, MediaFile>): Paragraph[];
/**
 * Check if a drawing element contains a text box
 * Text boxes are shapes with wps:txbx content
 */
export declare function isTextBoxDrawing(drawingEl: XmlElement): boolean;
/**
 * Check if a wps:wsp element is a text box
 */
export declare function isShapeTextBox(wsp: XmlElement): boolean;
/**
 * Decorative DrawingML shapes — `<wps:wsp>` with `<wps:spPr>` (geometry,
 * fill, outline) but no `<wps:txbx>`. Word's "Insert → Shapes" output:
 * rectangles, ellipses, arrows, callouts, etc. used as visual elements
 * without text.
 *
 * Returns true when the drawing carries a shape but no text frame; the
 * paired `parseDecorativeDrawing` then extracts the visual properties.
 * Distinct from `isTextBoxDrawing`, which gates on `<wps:txbx>` being
 * present.
 */
export declare function isDecorativeShapeDrawing(drawingEl: XmlElement): boolean;
/**
 * Parse a decorative DrawingML shape (rectangle/ellipse/arrow/etc.) to
 * a `TextBox`-shaped record. Empty `content` — the painter draws just
 * the fill + outline + position from the shape's `<wps:spPr>`. The
 * caller wraps the result back into a `Shape` with `textBody` so it
 * rides the existing TextBox pipeline (toProseDoc → renderTextBox).
 *
 * Distinct from `parseTextBox`, which requires a `<wps:txbx>`. Returns
 * null when the drawing doesn't carry a shape OR carries a text frame
 * (caller should use `parseTextBox` for those).
 */
export declare function parseDecorativeDrawing(drawingEl: XmlElement): TextBox | null;
/**
 * Parse a text box from a w:drawing element
 *
 * This creates a TextBox object with placeholder content.
 * The actual content parsing requires paragraph/table parsers which
 * creates a circular dependency. The document parser should call
 * parseTextBoxContent() separately with the required parsers.
 *
 * @param drawingEl - The w:drawing XML element
 * @returns TextBox object with placeholder content, or null if not a text box
 */
export declare function parseTextBox(drawingEl: XmlElement): TextBox | null;
/**
 * Parse text box content XML element
 * @param wsp - The wps:wsp element containing the text box
 * @returns The w:txbxContent element or null
 */
export declare function getTextBoxContentElement(wsp: XmlElement): XmlElement | null;
/**
 * Parse text box from a wps:wsp element directly
 * Useful when you already have the shape element
 */
export declare function parseTextBoxFromShape(wsp: XmlElement, size: ImageSize, position?: ImagePosition, wrap?: ImageWrap): TextBox | null;
/**
 * Get text box width in pixels
 */
export declare function getTextBoxWidthPx(textBox: TextBox): number;
/**
 * Get text box height in pixels
 */
export declare function getTextBoxHeightPx(textBox: TextBox): number;
/**
 * Get text box dimensions in pixels
 */
export declare function getTextBoxDimensionsPx(textBox: TextBox): {
    width: number;
    height: number;
};
/**
 * Get text box margins in pixels
 */
export declare function getTextBoxMarginsPx(textBox: TextBox): {
    top: number;
    bottom: number;
    left: number;
    right: number;
};
/**
 * Check if text box is floating (anchored)
 */
export declare function isFloatingTextBox(textBox: TextBox): boolean;
/**
 * Check if text box has fill
 */
export declare function hasTextBoxFill(textBox: TextBox): boolean;
/**
 * Check if text box has outline
 */
export declare function hasTextBoxOutline(textBox: TextBox): boolean;
/**
 * Check if text box has content
 */
export declare function hasTextBoxContent(textBox: TextBox): boolean;
/**
 * Get plain text from text box (helper for search/indexing)
 */
export declare function getTextBoxText(textBox: TextBox): string;
/**
 * Resolve fill color to CSS color string
 */
export declare function resolveTextBoxFillColor(textBox: TextBox): string | undefined;
/**
 * Resolve outline color to CSS color string
 */
export declare function resolveTextBoxOutlineColor(textBox: TextBox): string | undefined;
/**
 * Get outline width in pixels
 */
export declare function getTextBoxOutlineWidthPx(textBox: TextBox): number;
//# sourceMappingURL=textBoxParser.d.ts.map