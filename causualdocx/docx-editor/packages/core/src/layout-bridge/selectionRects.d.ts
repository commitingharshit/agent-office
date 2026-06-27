/**
 * Selection Rectangles
 *
 * Converts ProseMirror selection ranges into screen rectangles for rendering
 * selection highlights and the caret cursor.
 *
 * The main function `selectionToRects` takes a PM range and returns an array
 * of rectangles that cover the selected text across all pages and fragments.
 */
import type { Layout, FlowBlock, Measure } from '../layout-engine/types';
/**
 * A rectangle representing part of a selection.
 */
export type SelectionRect = {
    /** X coordinate in container space. */
    x: number;
    /** Y coordinate in container space. */
    y: number;
    /** Width of the rectangle. */
    width: number;
    /** Height of the rectangle (typically line height). */
    height: number;
    /** Page index (0-based). */
    pageIndex: number;
};
/**
 * Caret position for collapsed selection.
 */
export type CaretPosition = {
    /** X coordinate in container space. */
    x: number;
    /** Y coordinate in container space. */
    y: number;
    /** Height of the caret (line height). */
    height: number;
    /** Page index (0-based). */
    pageIndex: number;
};
/**
 * Convert a ProseMirror selection range to screen rectangles.
 *
 * @param layout - The document layout.
 * @param blocks - All flow blocks.
 * @param measures - All measurements.
 * @param from - Start PM position.
 * @param to - End PM position.
 * @returns Array of rectangles covering the selection.
 */
export declare function selectionToRects(layout: Layout, blocks: FlowBlock[], measures: Measure[], from: number, to: number): SelectionRect[];
/**
 * Get caret position for a collapsed selection.
 *
 * @param layout - The document layout.
 * @param blocks - All flow blocks.
 * @param measures - All measurements.
 * @param pmPosition - The PM position.
 * @returns Caret position, or null if not found.
 */
export declare function getCaretPosition(layout: Layout, blocks: FlowBlock[], measures: Measure[], pmPosition: number): CaretPosition | null;
/**
 * Check if a selection spans multiple pages.
 *
 * @param rects - Selection rectangles.
 * @returns True if selection spans multiple pages.
 */
export declare function isMultiPageSelection(rects: SelectionRect[]): boolean;
/**
 * Get selection rectangles grouped by page.
 *
 * @param rects - Selection rectangles.
 * @returns Map of page index to rectangles on that page.
 */
export declare function groupRectsByPage(rects: SelectionRect[]): Map<number, SelectionRect[]>;
//# sourceMappingURL=selectionRects.d.ts.map