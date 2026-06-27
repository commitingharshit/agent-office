/**
 * Paginator - manages page state during layout
 *
 * Tracks the current page, cursor position, and available space.
 * Creates new pages when content doesn't fit.
 */
import type { Page, PageMargins, Fragment, ColumnLayout } from './types';
/**
 * Current state of a page being laid out.
 */
export type PageState = {
    /** The page being built. */
    page: Page;
    /** Current Y position (cursor) from page top. */
    cursorY: number;
    /** Current column index (0-based). */
    columnIndex: number;
    /** Top margin of content area. */
    topMargin: number;
    /** Bottom boundary of content area (page height - bottom margin). */
    contentBottom: number;
    /** Accumulated trailing spacing (space after previous block). */
    trailingSpacing: number;
};
/**
 * Options for creating a paginator.
 */
export type PaginatorOptions = {
    /** Page size (width, height). */
    pageSize: {
        w: number;
        h: number;
    };
    /** Page margins. */
    margins: PageMargins;
    /** Column configuration (optional). */
    columns?: ColumnLayout;
    /** Per-page footnote reserved heights (pageNumber → height in pixels). */
    footnoteReservedHeights?: Map<number, number>;
    /** Callback when a new page is created. */
    onNewPage?: (state: PageState) => void;
};
/**
 * Creates a paginator for managing page layout state.
 */
export declare function createPaginator(options: PaginatorOptions): {
    /** All pages created so far. */
    pages: Page[];
    /** All page states. */
    states: PageState[];
    /** Column width in pixels (use getColumnWidth() for current value after updates). */
    readonly columnWidth: number;
    /** Get current column layout (returns copy to prevent external mutation). */
    readonly columns: {
        count: number;
        gap: number;
        equalWidth?: boolean;
        separator?: boolean;
        columnWidths?: Array<{
            width: number;
            space: number;
        }>;
    };
    /** Get current state. */
    getCurrentState: () => PageState;
    /** Get available height in current column. */
    getAvailableHeight: () => number;
    /** Get content width for the active section. */
    getContentWidth: () => number;
    /**
     * Width a paragraph fragment should occupy in the CURRENT column.
     *
     * For unequal multi-column regions (`w:equalWidth="0"`) this is the active
     * column's explicit width, so right/justified alignment and the fragment
     * box match the column the text was measured against. For single-column
     * and equal-column sections it returns the full content width — preserving
     * the long-standing behavior (equal columns position via `getColumnX` and
     * rely on pre-wrapped measure lines), so no existing fixture shifts.
     */
    getCurrentColumnContentWidth(): number;
    /** Check if height fits in current column. */
    fits: (height: number) => boolean;
    /** Ensure height fits, advancing if needed. */
    ensureFits: (height: number) => PageState;
    /** Add a fragment to current page. */
    addFragment: (fragment: Fragment, height: number, spaceBefore?: number, spaceAfter?: number) => {
        state: PageState;
        x: number;
        y: number;
    };
    /**
     * Reserve vertical flow space WITHOUT painting a fragment. Advances the
     * cursor by `height` so subsequent in-flow blocks start below the reserved
     * band. Used for behind-text anchored objects (e.g. the SDS hazard box)
     * that occupy a vertical band the flow must leave empty even though the
     * object paints behind the text. No-op for non-positive heights.
     */
    reserveSpace(height: number): void;
    /** Force a page break. */
    forcePageBreak: () => PageState;
    /** Force a column break. */
    forceColumnBreak: () => PageState;
    /** Get X position for column. */
    getColumnX: (columnIndex: number) => number;
    /** Update column layout (for section breaks). */
    updateColumns: (newColumns: ColumnLayout) => void;
    /** Keep a short multi-column region together (push it whole if it won't fit). */
    ensureColumnRegionFits: (regionHeight: number) => void;
    /** Update page size/margins for subsequent pages. */
    updatePageLayout: (newPageSize?: {
        w: number;
        h: number;
    }, newMargins?: PageMargins, applyImmediately?: boolean) => void;
};
export type Paginator = ReturnType<typeof createPaginator>;
//# sourceMappingURL=paginator.d.ts.map