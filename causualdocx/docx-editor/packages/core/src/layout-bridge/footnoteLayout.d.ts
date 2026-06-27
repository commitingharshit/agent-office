/**
 * Footnote Layout Utilities
 *
 * Footnote/endnote rendering pipeline plus page-mapping helpers:
 * - scanning FlowBlocks for footnote references and their PM positions
 * - mapping references to the page that ends up containing them
 * - converting a Footnote → FootnoteContent via the body pipeline
 *   (footnoteToProseDoc → toFlowBlocks → caller-supplied measureBlocks)
 * - reserving per-page footnote area heights for layout
 *
 * Everything that's pure OOXML / FlowBlock semantics lives here so the
 * React, Vue, and any future adapters can share the conversion logic
 * and just supply their own measurement function (which depends on
 * platform-specific Canvas/font metrics).
 */
import type { FlowBlock, Measure, Page, FootnoteContent } from '../layout-engine/types';
import type { Footnote, StyleDefinitions, Theme } from '../types/document';
/**
 * Scan FlowBlocks for runs with footnoteRefId set.
 * Returns a list of { footnoteId, pmPos } in document order.
 */
export declare function collectFootnoteRefs(blocks: FlowBlock[]): Array<{
    footnoteId: number;
    pmPos: number;
}>;
/**
 * After layout, determine which footnotes appear on which pages.
 * Checks each page's fragments to see if any footnoteRef PM positions fall within.
 *
 * Returns Map<pageNumber, footnoteId[]> in document order.
 */
export declare function mapFootnotesToPages(pages: Page[], footnoteRefs: Array<{
    footnoteId: number;
    pmPos: number;
}>): Map<number, number[]>;
/**
 * Footnote-specific block normalization. Mirrors the spirit of
 * `normalizeHeaderFooterMeasureBlocks`: post-process the body-pipeline
 * output for a single footnote so it carries the correct visual prefix
 * (its display number, rendered as a superscript) and a default 8pt font
 * for any run that didn't specify a size.
 *
 * The displayNumber is prepended onto the FIRST paragraph as a fresh
 * superscript text run — visually matches Word's footnote numbering
 * without disturbing the authored runs.
 *
 * Exported for callers that want to compose their own conversion
 * pipeline; `convertFootnoteToContent` calls it as part of its flow.
 */
export declare function applyFootnotePresentation(blocks: FlowBlock[], displayNumber: number, defaultFontSizePt?: number): FlowBlock[];
/**
 * Adapter-supplied block measurement function. The caller (React /
 * Vue / etc.) supplies its platform's measure routine — at minimum
 * paragraph + table + image + textBox — so this core helper stays
 * Canvas-free.
 */
export type MeasureBlocksFn = (blocks: FlowBlock[], contentWidth: number) => Measure[];
/**
 * Options for {@link convertFootnoteToContent}.
 */
export type ConvertFootnoteOptions = {
    /** The document's parsed style definitions, threaded into the body pipeline. */
    styles?: StyleDefinitions | null;
    /** Theme for resolving themed fills / fonts inside the footnote. */
    theme?: Theme | null;
    /** Measure callback supplied by the rendering adapter. */
    measureBlocks: MeasureBlocksFn;
};
/**
 * Convert a Footnote to renderable FootnoteContent via the body pipeline:
 * `footnoteToProseDoc → toFlowBlocks → applyFootnotePresentation →
 * measureBlocks`. Pre-PR (#378) this lived in a hand-rolled shadow stack
 * that silently dropped non-paragraph content; routing through the body
 * pipeline gives footnotes full block-kind support — paragraph + table
 * + image + textBox + fields.
 */
export declare function convertFootnoteToContent(footnote: Footnote, displayNumber: number, contentWidth: number, options: ConvertFootnoteOptions): FootnoteContent;
/**
 * Build footnote content for all footnotes referenced in the document.
 * Display numbers are assigned by first-appearance order (the same way
 * Word renders them).
 */
export declare function buildFootnoteContentMap(footnotes: Footnote[], footnoteRefs: Array<{
    footnoteId: number;
}>, contentWidth: number, options: ConvertFootnoteOptions): Map<number, FootnoteContent>;
/**
 * Calculate per-page footnote reserved heights.
 * Returns Map<pageNumber, reservedHeight>.
 */
export declare function calculateFootnoteReservedHeights(pageFootnoteMap: Map<number, number[]>, footnoteContentMap: Map<number, {
    height: number;
}>): Map<number, number>;
//# sourceMappingURL=footnoteLayout.d.ts.map