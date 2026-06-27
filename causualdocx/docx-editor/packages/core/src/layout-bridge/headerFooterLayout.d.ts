/**
 * Header / Footer Layout Utilities
 *
 * The header/footer rendering pipeline lives here so any rendering adapter
 * (React, Vue, etc.) can share the conversion logic and just supply its
 * platform-specific {@link MeasureBlocksFn}. Mirrors the footnote pipeline
 * in `footnoteLayout.ts`.
 *
 * Pipeline:
 *   HF.content → headerFooterToProseDoc → toFlowBlocks
 *     → measureBlocks (caller-supplied, Canvas-aware)
 *     → HeaderFooterContent (blocks, measures, height, visualTop/Bottom)
 *
 * The render side uses the normalized block list so paint and measurement stay
 * in lockstep. Visual-bounds calculation still inspects the original block
 * list because floating images can paint above/below the nominal flow box even
 * when they do not contribute to flow height.
 */
import type { FlowBlock, ImageRun, Measure, PageMargins, TextBoxBlock } from '../layout-engine/types';
import type { HeaderFooter, StyleDefinitions, Theme } from '../types/document';
import type { HeaderFooterContent } from '../layout-painter/renderPage';
import type { MeasureBlocksFn } from './footnoteLayout';
export type HeaderFooterMetrics = {
    section: 'header' | 'footer';
    pageSize: {
        w: number;
        h: number;
    };
    margins: PageMargins;
};
export declare function normalizeHeaderFooterMeasureBlocks(blocks: FlowBlock[]): FlowBlock[];
export declare function resolveHeaderFooterVisualTop(run: ImageRun, paragraphY: number, flowHeight: number, metrics: HeaderFooterMetrics): number;
/**
 * Header/footer flow-Y of an anchored textbox's top, mirroring
 * `resolveHeaderFooterVisualTop` for images. Anchor offsets are already pixels.
 */
export declare function resolveHeaderFooterTextBoxTop(anchor: NonNullable<TextBoxBlock['anchor']>, flowHeight: number, metrics: HeaderFooterMetrics): number;
/** Header/footer flow-X (content-area-relative) of an anchored textbox. */
export declare function resolveHeaderFooterTextBoxLeft(anchor: NonNullable<TextBoxBlock['anchor']>, metrics: HeaderFooterMetrics): number;
export declare function calculateHeaderFooterVisualBounds(blocks: FlowBlock[], measures: Measure[], flowHeight: number, metrics: HeaderFooterMetrics): {
    visualTop: number;
    visualBottom: number;
};
export type ConvertHeaderFooterOptions = {
    styles?: StyleDefinitions | null;
    theme?: Theme | null;
    measureBlocks: MeasureBlocksFn;
};
/**
 * Convert HeaderFooter (document type) to HeaderFooterContent (render type).
 *
 * Routes through the same pipeline as the body: HF.content →
 * headerFooterToProseDoc → toFlowBlocks → measureBlocks. The inline editor
 * uses the same conversion chain, so block support (paragraph, table, image,
 * textBox, fields) and the inline editor's content stay in lockstep.
 */
export declare function convertHeaderFooterToContent(headerFooter: HeaderFooter | null | undefined, contentWidth: number, metrics: HeaderFooterMetrics, options: ConvertHeaderFooterOptions): HeaderFooterContent | undefined;
//# sourceMappingURL=headerFooterLayout.d.ts.map