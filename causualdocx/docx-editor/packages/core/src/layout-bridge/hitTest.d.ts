/**
 * Hit Testing Utilities
 *
 * Maps click coordinates to pages, fragments, and document positions.
 * Used by the paged editor to translate user clicks into PM positions.
 */
import type { Layout, Page, Fragment, TableFragment, FlowBlock, Measure, ParagraphBlock, ParagraphMeasure, TableBlock, TableMeasure } from '../layout-engine/types';
/**
 * A 2D point in page coordinate space.
 */
export type Point = {
    x: number;
    y: number;
};
/**
 * Result of hit-testing to find which page contains a point.
 */
export type PageHit = {
    /** Index of the page (0-based). */
    pageIndex: number;
    /** The page that was hit. */
    page: Page;
    /** Y position relative to the page top. */
    pageY: number;
};
/**
 * Result of hit-testing to find which fragment contains a point.
 */
export type FragmentHit = {
    /** The fragment that was hit. */
    fragment: Fragment;
    /** The corresponding flow block. */
    block: FlowBlock;
    /** The corresponding measurement. */
    measure: Measure;
    /** Page index (0-based). */
    pageIndex: number;
    /** Y position relative to the fragment top. */
    localY: number;
    /** X position relative to the fragment left. */
    localX: number;
};
/**
 * Result of hit-testing a table to find the cell.
 */
export type TableCellHit = {
    /** The table fragment. */
    fragment: TableFragment;
    /** The table block. */
    block: TableBlock;
    /** The table measure. */
    measure: TableMeasure;
    /** Page index (0-based). */
    pageIndex: number;
    /** Row index (0-based). */
    rowIndex: number;
    /** Column index (0-based). */
    colIndex: number;
    /** Paragraph block within the cell (first one). */
    cellBlock?: ParagraphBlock;
    /** Paragraph measure within the cell. */
    cellMeasure?: ParagraphMeasure;
    /** X position relative to cell content area. */
    cellLocalX: number;
    /** Y position relative to cell content area. */
    cellLocalY: number;
};
/**
 * Hit-test pages to find which page contains a given Y coordinate.
 *
 * Pages are stacked vertically with optional gaps between them.
 * If the point is in a gap, returns the nearest page.
 *
 * @param layout - The layout containing pages.
 * @param point - The point to test (only Y is used for page lookup).
 * @returns PageHit if a page was found, null otherwise.
 */
export declare function hitTestPage(layout: Layout, point: Point): PageHit | null;
/**
 * Calculate the Y offset of a page from the top of the document.
 */
export declare function getPageTop(layout: Layout, pageIndex: number): number;
/**
 * Get the page index at a specific Y coordinate.
 * Returns null if the coordinate is outside all pages.
 */
export declare function getPageIndexAtY(layout: Layout, y: number): number | null;
/**
 * Hit-test fragments on a page to find which fragment contains a point.
 *
 * Fragments are checked in visual order (sorted by Y then X).
 * Only considers paragraph and table fragments (not images for now).
 *
 * @param pageHit - The page hit result from hitTestPage.
 * @param blocks - All flow blocks in the document.
 * @param measures - All measurements corresponding to blocks.
 * @param pagePoint - Point in page-relative coordinates.
 * @returns FragmentHit if a fragment was found, null otherwise.
 */
export declare function hitTestFragment(pageHit: PageHit, blocks: FlowBlock[], measures: Measure[], pagePoint: Point): FragmentHit | null;
/**
 * Hit-test to find image fragments (they may overlap other content).
 */
export declare function hitTestImageFragment(pageHit: PageHit, blocks: FlowBlock[], measures: Measure[], pagePoint: Point): FragmentHit | null;
/**
 * Hit-test within a table fragment to find the specific cell.
 *
 * @param pageHit - The page hit result.
 * @param blocks - All flow blocks.
 * @param measures - All measurements.
 * @param pagePoint - Point in page-relative coordinates.
 * @returns TableCellHit if a table cell was found, null otherwise.
 */
export declare function hitTestTableCell(pageHit: PageHit, blocks: FlowBlock[], measures: Measure[], pagePoint: Point): TableCellHit | null;
/**
 * Combined result of all hit testing.
 */
export type HitTestResult = {
    /** Page that was hit. */
    pageHit: PageHit | null;
    /** Fragment that was hit (if any). */
    fragmentHit: FragmentHit | null;
    /** Table cell that was hit (if fragment is a table). */
    tableCellHit: TableCellHit | null;
};
/**
 * Perform complete hit testing from document coordinates to the most specific element.
 *
 * @param layout - The layout containing pages.
 * @param blocks - All flow blocks.
 * @param measures - All measurements.
 * @param point - Point in document coordinates (Y is cumulative from document top).
 * @returns Complete hit test result.
 */
export declare function hitTest(layout: Layout, blocks: FlowBlock[], measures: Measure[], point: Point): HitTestResult;
/**
 * Get the total document height (all pages + gaps).
 */
export declare function getTotalDocumentHeight(layout: Layout): number;
/**
 * Get Y coordinate to scroll to for a specific page.
 */
export declare function getScrollYForPage(layout: Layout, pageIndex: number): number;
/**
 * Get page bounds (top and bottom Y coordinates).
 */
export declare function getPageBounds(layout: Layout, pageIndex: number): {
    top: number;
    bottom: number;
} | null;
/**
 * Check if a point is within the content area of a page (inside margins).
 */
export declare function isPointInContentArea(_layout: Layout, pageHit: PageHit, pagePoint: Point): boolean;
/**
 * Find the nearest fragment to a point on a page.
 * Useful when the click is in whitespace.
 */
export declare function findNearestFragment(pageHit: PageHit, blocks: FlowBlock[], measures: Measure[], pagePoint: Point): FragmentHit | null;
//# sourceMappingURL=hitTest.d.ts.map