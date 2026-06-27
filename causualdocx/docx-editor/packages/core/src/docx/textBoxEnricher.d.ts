/**
 * Text Box Enrichment
 *
 * During initial paragraph parsing, `w:drawing` elements that contain a
 * text box (`wps:wsp` with `wps:txbx`) are skipped because the image
 * parser returns `null` for non-image drawings. This module does a
 * second pass over the raw XML of a parsed paragraph, finds those text
 * box drawings, parses them with their inner content, and injects them
 * back into the parsed paragraph as `ShapeContent` on the matching run.
 *
 * Used by:
 * - `documentParser.parseBlockContent` for the document body.
 * - `headerFooterParser.parseHeaderFooterContent` for headers/footers
 *   (issue #318 — without this call, textboxes inside headers/footers
 *   silently disappear).
 *
 * Also handles:
 * - `<mc:AlternateContent>` envelopes — descends into `<mc:Choice>`
 *   (preferred) or `<mc:Fallback>` to find nested `<w:drawing>` /
 *   `<w:pict>`. Word wraps modern wps shapes in this envelope so older
 *   clients can fall back to a VML representation.
 * - `<wpg:wgp>` groups inside a drawing — Word's "Group" command.
 *   Each inner `<wps:wsp>` is extracted as its own shape so the group's
 *   children (logos, taglines, decorative bars assembled into one
 *   moveable unit) all surface in the painted output instead of just
 *   the first one. The group's outer `<wp:anchor>` position is
 *   inherited by each child (precise per-child placement within the
 *   group's coordinate space is a deeper layout problem; this gets the
 *   content visible at the right place on the page).
 */
import type { Paragraph, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
import { type XmlElement } from './xmlParser';
/**
 * Enrich a parsed paragraph with text-box content from its raw XML.
 */
export declare function enrichParagraphTextBoxes(paragraph: Paragraph, paraXml: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels: RelationshipMap | null, media: Map<string, MediaFile> | null): void;
//# sourceMappingURL=textBoxEnricher.d.ts.map