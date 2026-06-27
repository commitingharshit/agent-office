/**
 * Section Breaks - Handle page layout changes at section boundaries
 *
 * Sections in DOCX can have different page sizes, margins, columns, and orientations.
 * This module manages the state transitions between sections during layout.
 */
import type { SectionBreakBlock, PageMargins, ColumnLayout } from './types';
/**
 * State tracking for sections during layout.
 * Uses active/pending pattern to schedule changes at page boundaries.
 */
export type SectionState = {
    /** Currently active top margin. */
    activeTopMargin: number;
    /** Currently active bottom margin. */
    activeBottomMargin: number;
    /** Currently active left margin. */
    activeLeftMargin: number;
    /** Currently active right margin. */
    activeRightMargin: number;
    /** Scheduled top margin for next page. */
    pendingTopMargin: number | null;
    /** Scheduled bottom margin for next page. */
    pendingBottomMargin: number | null;
    /** Scheduled left margin for next page. */
    pendingLeftMargin: number | null;
    /** Scheduled right margin for next page. */
    pendingRightMargin: number | null;
    /** Currently active page size. */
    activePageSize: {
        w: number;
        h: number;
    };
    /** Scheduled page size for next page. */
    pendingPageSize: {
        w: number;
        h: number;
    } | null;
    /** Currently active column layout. */
    activeColumns: ColumnLayout;
    /** Scheduled column layout for next page. */
    pendingColumns: ColumnLayout | null;
    /** Currently active orientation. */
    activeOrientation: 'portrait' | 'landscape' | null;
    /** Scheduled orientation for next page. */
    pendingOrientation: 'portrait' | 'landscape' | null;
    /** Whether any pages have been created yet. */
    hasAnyPages: boolean;
};
/**
 * Decision about what happens at a section break.
 */
export type BreakDecision = {
    /** Force a page break. */
    forcePageBreak: boolean;
    /** Force a mid-page region change (for column layout changes). */
    forceMidPageRegion: boolean;
    /** Required page parity (even or odd). */
    requiredParity?: 'even' | 'odd';
};
/**
 * Create initial section state from default options.
 */
export declare function createInitialSectionState(margins: PageMargins, pageSize: {
    w: number;
    h: number;
}, columns?: ColumnLayout): SectionState;
/**
 * Schedule section break effects by analyzing the break type and updating state.
 *
 * This determines what layout changes should occur (page break, column changes)
 * and schedules the new section properties to be applied at the appropriate boundary.
 */
export declare function scheduleSectionBreak(block: SectionBreakBlock, state: SectionState, _baseMargins: PageMargins): {
    decision: BreakDecision;
    state: SectionState;
};
/**
 * Apply pending section state to active state at a page boundary.
 * Transfers all pending values to active and clears pending.
 */
export declare function applyPendingToActive(state: SectionState): SectionState;
/**
 * Get the effective margins for the current section state.
 * Returns active margins, or pending if scheduled.
 */
export declare function getEffectiveMargins(state: SectionState): PageMargins;
/**
 * Get the effective page size for the current section state.
 */
export declare function getEffectivePageSize(state: SectionState): {
    w: number;
    h: number;
};
/**
 * Get the effective columns for the current section state.
 */
export declare function getEffectiveColumns(state: SectionState): ColumnLayout;
//# sourceMappingURL=section-breaks.d.ts.map