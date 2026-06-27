/**
 * VML Text Box Parser
 *
 * Legacy Vector Markup Language (VML) shape format used by older Word
 * versions (and some current Word saves) for text frames:
 *
 *   <w:r>
 *     <w:pict>
 *       <v:group>?           [optional grouping element]
 *         <v:shape type="#_x0000_t202" ...>
 *           <v:textbox inset="...">
 *             <w:txbxContent>
 *               <w:p>...</w:p>
 *             </w:txbxContent>
 *           </v:textbox>
 *         </v:shape>
 *       </v:group>?
 *     </w:pict>
 *   </w:r>
 *
 * The shape type `#_x0000_t202` is Microsoft's well-known shape id for
 * text frames. Decorative VML shapes (lines, ovals, paths) carry other
 * type ids or no type at all and are not treated as text frames.
 *
 * The modern DrawingML equivalent (`<wps:wsp>` / `<wps:txbx>`) is parsed
 * by `textBoxParser.ts`. This module exists separately so the legacy
 * code path can be skipped quickly when only DrawingML is present.
 */
import type { TextBox } from '../types/content';
import { type XmlElement } from './xmlParser';
import type { ParagraphParserFn } from './textBoxParser';
/**
 * Does this `<w:pict>` element contain a VML text frame we can parse?
 * Walks direct children + one level of grouping (`<v:group>`).
 */
export declare function isVmlTextBoxPict(pictEl: XmlElement): boolean;
/**
 * Parse a `<w:pict>` element to a TextBox structure.
 * Size is derived best-effort from the `<v:shape>`'s `style` attribute
 * (CSS-like declarations using `pt`, `px`, or unit-less twips).
 * Returns null if no text-frame shape or `<w:txbxContent>` is found.
 */
export declare function parseVmlTextBox(pictEl: XmlElement, parseParagraph: ParagraphParserFn): TextBox | null;
/** Does this `<w:pict>` contain a decorative VML shape we can render? */
export declare function isVmlDecorativeShapePict(pictEl: XmlElement): boolean;
/**
 * Parse a `<w:pict>` element containing one VML decorative shape to a
 * `TextBox`-shaped record. Returns `null` if no decorative shape was
 * found. The caller decides whether to wrap it back into a `Shape` /
 * `ShapeContent` for injection into the document tree (same as the
 * text-frame path).
 */
export declare function parseVmlDecorativeShape(pictEl: XmlElement): TextBox | null;
/**
 * Parse a `<w:pict>` into ALL the VML shapes it carries, expanding any
 * `<v:group>` into its individual children with the group's coordinate
 * transform applied. Text-frame shapes (`#_x0000_t202`) get their inner
 * `<w:txbxContent>` parsed; decorative `<v:rect>` / `<v:oval>` / `<v:line>`
 * become styled rectangles.
 *
 * This is the multi-shape entry point the enricher uses; the older
 * single-shape `parseVmlTextBox` / `parseVmlDecorativeShape` remain for
 * callers that only need the first shape (and the `isVml*Pict` probes).
 */
export declare function parseVmlShapes(pictEl: XmlElement, parseParagraph: ParagraphParserFn): TextBox[];
//# sourceMappingURL=vmlTextBoxParser.d.ts.map