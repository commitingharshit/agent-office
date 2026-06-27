/**
 * Click-to-Position Mapping
 *
 * Maps click coordinates within a layout to ProseMirror document positions.
 * Uses geometry-based calculation with canvas text measurement for accuracy.
 *
 * The main entry point `clickToPosition` takes fragment hit data and local
 * coordinates and returns the PM position at the click point.
 */
import type { ParagraphBlock, ParagraphMeasure } from '../layout-engine/types';
import type { FragmentHit, TableCellHit } from './hitTest';
/**
 * Result of click-to-position mapping.
 */
export type PositionResult = {
    /** ProseMirror document position. */
    pmPosition: number;
    /** Character offset within the line (for debugging). */
    charOffset: number;
    /** Line index within the paragraph. */
    lineIndex: number;
};
/**
 * Map a click within a paragraph fragment to a PM position.
 *
 * @param fragmentHit - The fragment hit result from hitTestFragment.
 * @returns Position result, or null if mapping fails.
 */
export declare function clickToPositionInParagraph(fragmentHit: FragmentHit): PositionResult | null;
/**
 * Map a click within a table cell to a PM position.
 *
 * @param tableCellHit - The table cell hit result from hitTestTableCell.
 * @returns PM position, or null if mapping fails.
 */
export declare function clickToPositionInTableCell(tableCellHit: TableCellHit): number | null;
/**
 * Main entry point: Map a click to a PM position.
 *
 * This function takes the result of hit testing and returns the PM position.
 *
 * @param fragmentHit - Fragment hit from hitTestFragment.
 * @param tableCellHit - Optional table cell hit from hitTestTableCell.
 * @returns PM position, or null if mapping fails.
 */
export declare function clickToPosition(fragmentHit: FragmentHit | null, tableCellHit?: TableCellHit | null): number | null;
/**
 * Map a PM position to X coordinates within a line (for caret positioning).
 *
 * @param block - The paragraph block.
 * @param measure - The paragraph measure.
 * @param pmPosition - The PM position to map.
 * @param fragmentWidth - Width of the fragment.
 * @returns X coordinate relative to fragment start, or null if not found.
 */
export declare function positionToX(block: ParagraphBlock, measure: ParagraphMeasure, pmPosition: number, _fragmentWidth: number): {
    x: number;
    lineIndex: number;
} | null;
/**
 * Get the bounding rect for a PM position (for caret rendering).
 */
export declare function getPositionRect(block: ParagraphBlock, measure: ParagraphMeasure, pmPosition: number, fragmentX: number, fragmentY: number, fragmentWidth: number, fromLine: number): {
    x: number;
    y: number;
    height: number;
} | null;
//# sourceMappingURL=clickToPosition.d.ts.map