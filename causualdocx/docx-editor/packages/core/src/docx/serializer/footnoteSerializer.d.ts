/**
 * Footnote text editing — surgically replaces ONLY the visible `<w:t>` text of
 * an edited footnote inside the original `word/footnotes.xml`, leaving all
 * markup byte-identical: the `<w:footnoteRef/>` number marker, paragraph/run
 * properties, separators, namespaces, `w:footnotePr`, and every untouched
 * footnote.
 *
 * Why text-only (not model regeneration): the parser drops the def-side
 * `<w:footnoteRef/>` element (it keeps only the FootnoteReference run style),
 * so regenerating a footnote block from the model would lose the painted
 * footnote number. Editing the original XML's text in place preserves it.
 *
 * This is opt-in: callers only run `replaceFootnotesInXml` for footnotes that
 * were actually edited. Untouched documents keep footnotes.xml verbatim, so
 * the round-trip-fidelity guarantee is preserved.
 */
import type { Endnote, Footnote } from '../../types/content';
/**
 * Surgically replace each edited footnote's text inside the original XML.
 * Footnotes don't nest, so a non-greedy match to the next `</w:footnote>` is
 * exact. The new text is the footnote model's current plain text.
 */
export declare function replaceFootnotesInXml(originalXml: string, edited: Footnote[]): string;
/** Endnote sibling of {@link replaceFootnotesInXml} (operates on `<w:endnote>`). */
export declare function replaceEndnotesInXml(originalXml: string, edited: Endnote[]): string;
/**
 * Replace a footnote's plain text in the MODEL (so the rendered footnote area
 * re-paints immediately). Mirrors what `setBodyText` will write on save: the
 * marker run is kept, the body collapses to a single text run.
 */
export declare function setFootnotePlainText(fn: Footnote, text: string): void;
/** Endnote sibling of {@link setFootnotePlainText}. */
export declare function setEndnotePlainText(en: Endnote, text: string): void;
//# sourceMappingURL=footnoteSerializer.d.ts.map