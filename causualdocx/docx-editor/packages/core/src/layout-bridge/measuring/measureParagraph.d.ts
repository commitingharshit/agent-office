/**
 * Paragraph measurement module
 *
 * Measures paragraph blocks and computes line breaking.
 * Converts runs into measured lines with typography metrics.
 */
import type { ParagraphBlock, ParagraphMeasure, TextRun } from '../../layout-engine/types';
/**
 * Floating image exclusion zone - describes an area where text cannot flow.
 * Used to calculate reduced line widths for text wrapping around floating images.
 */
export interface FloatingImageZone {
    /** Left margin reduction (pixels from left edge) */
    leftMargin: number;
    /** Right margin reduction (pixels from right edge) */
    rightMargin: number;
    /** Top Y coordinate of the exclusion zone (pixels from paragraph start) */
    topY: number;
    /** Bottom Y coordinate of the exclusion zone (pixels from paragraph start) */
    bottomY: number;
}
/**
 * Options for paragraph measurement
 */
export interface MeasureParagraphOptions {
    /** Floating image exclusion zones that affect line widths */
    floatingZones?: FloatingImageZone[];
    /** Y offset of this paragraph relative to the exclusion zones (default: 0) */
    paragraphYOffset?: number;
}
/**
 * Measure a paragraph block and compute line breaks
 *
 * @param block - The paragraph block to measure
 * @param maxWidth - Maximum available width for the paragraph
 * @param options - Optional measurement options (floating zones, Y offset)
 * @returns ParagraphMeasure with lines and total height
 */
export declare function measureParagraph(block: ParagraphBlock, maxWidth: number, options?: MeasureParagraphOptions): ParagraphMeasure;
/**
 * Measure multiple paragraph blocks
 *
 * @param blocks - Array of paragraph blocks to measure
 * @param maxWidth - Maximum available width
 * @returns Array of ParagraphMeasure results
 */
export declare function measureParagraphs(blocks: ParagraphBlock[], maxWidth: number): ParagraphMeasure[];
/**
 * Get per-character widths for a text run (for click positioning)
 *
 * @param run - The text run to measure
 * @returns Array of character widths
 */
export declare function getRunCharWidths(run: TextRun): number[];
//# sourceMappingURL=measureParagraph.d.ts.map