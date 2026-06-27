/**
 * Section Breaks - Handle page layout changes at section boundaries
 *
 * Sections in DOCX can have different page sizes, margins, columns, and orientations.
 * This module manages the state transitions between sections during layout.
 */
/**
 * Default single-column layout.
 */
const DEFAULT_COLUMNS = { count: 1, gap: 0 };
/**
 * Create initial section state from default options.
 */
export function createInitialSectionState(margins, pageSize, columns) {
    return {
        activeTopMargin: margins.top,
        activeBottomMargin: margins.bottom,
        activeLeftMargin: margins.left,
        activeRightMargin: margins.right,
        pendingTopMargin: null,
        pendingBottomMargin: null,
        pendingLeftMargin: null,
        pendingRightMargin: null,
        activePageSize: Object.assign({}, pageSize),
        pendingPageSize: null,
        activeColumns: columns ? Object.assign({}, columns) : Object.assign({}, DEFAULT_COLUMNS),
        pendingColumns: null,
        activeOrientation: null,
        pendingOrientation: null,
        hasAnyPages: false,
    };
}
/**
 * Check if column configuration is changing.
 */
function isColumnsChanging(newColumns, activeColumns) {
    if (newColumns) {
        return newColumns.count !== activeColumns.count || newColumns.gap !== activeColumns.gap;
    }
    // No columns specified = reset to single column (DOCX default)
    // This is only a change if currently in multi-column layout
    return activeColumns.count > 1;
}
/**
 * Get column configuration, defaulting to single column if not specified.
 */
function getColumnConfig(columns) {
    return columns ? { count: columns.count, gap: columns.gap } : Object.assign({}, DEFAULT_COLUMNS);
}
/**
 * Schedule section break effects by analyzing the break type and updating state.
 *
 * This determines what layout changes should occur (page break, column changes)
 * and schedules the new section properties to be applied at the appropriate boundary.
 */
export function scheduleSectionBreak(block, state, _baseMargins) {
    var _a;
    const next = Object.assign({}, state);
    // Extract section break properties
    const sectionType = (_a = block.type) !== null && _a !== void 0 ? _a : 'continuous';
    const sectionMargins = block.margins;
    const sectionPageSize = block.pageSize;
    const sectionOrientation = block.orientation;
    // Schedule margin changes
    if (sectionMargins) {
        if (typeof sectionMargins.top === 'number') {
            next.pendingTopMargin = Math.max(0, sectionMargins.top);
        }
        if (typeof sectionMargins.bottom === 'number') {
            next.pendingBottomMargin = Math.max(0, sectionMargins.bottom);
        }
        if (typeof sectionMargins.left === 'number') {
            next.pendingLeftMargin = Math.max(0, sectionMargins.left);
        }
        if (typeof sectionMargins.right === 'number') {
            next.pendingRightMargin = Math.max(0, sectionMargins.right);
        }
    }
    // Schedule page size change
    if (sectionPageSize) {
        next.pendingPageSize = { w: sectionPageSize.w, h: sectionPageSize.h };
    }
    // Schedule orientation change
    if (sectionOrientation) {
        next.pendingOrientation = sectionOrientation;
    }
    // Detect column changes
    const columnsChanging = isColumnsChanging(block.margins ? undefined : undefined, // columns would come from block if we support them
    next.activeColumns);
    // Determine break decision based on section type
    switch (sectionType) {
        case 'nextPage':
            next.pendingColumns = getColumnConfig(undefined);
            return {
                decision: { forcePageBreak: true, forceMidPageRegion: false },
                state: next,
            };
        case 'evenPage':
            next.pendingColumns = getColumnConfig(undefined);
            return {
                decision: { forcePageBreak: true, forceMidPageRegion: false, requiredParity: 'even' },
                state: next,
            };
        case 'oddPage':
            next.pendingColumns = getColumnConfig(undefined);
            return {
                decision: { forcePageBreak: true, forceMidPageRegion: false, requiredParity: 'odd' },
                state: next,
            };
        case 'continuous':
        default:
            if (columnsChanging) {
                // Mid-page column layout change
                next.pendingColumns = getColumnConfig(undefined);
                return {
                    decision: { forcePageBreak: false, forceMidPageRegion: true },
                    state: next,
                };
            }
            // No changes needed
            return {
                decision: { forcePageBreak: false, forceMidPageRegion: false },
                state: next,
            };
    }
}
/**
 * Apply pending section state to active state at a page boundary.
 * Transfers all pending values to active and clears pending.
 */
export function applyPendingToActive(state) {
    const next = Object.assign({}, state);
    // Apply pending margins
    if (next.pendingTopMargin !== null) {
        next.activeTopMargin = next.pendingTopMargin;
        next.pendingTopMargin = null;
    }
    if (next.pendingBottomMargin !== null) {
        next.activeBottomMargin = next.pendingBottomMargin;
        next.pendingBottomMargin = null;
    }
    if (next.pendingLeftMargin !== null) {
        next.activeLeftMargin = next.pendingLeftMargin;
        next.pendingLeftMargin = null;
    }
    if (next.pendingRightMargin !== null) {
        next.activeRightMargin = next.pendingRightMargin;
        next.pendingRightMargin = null;
    }
    // Apply pending page size
    if (next.pendingPageSize !== null) {
        next.activePageSize = next.pendingPageSize;
        next.pendingPageSize = null;
    }
    // Apply pending columns
    if (next.pendingColumns !== null) {
        next.activeColumns = next.pendingColumns;
        next.pendingColumns = null;
    }
    // Apply pending orientation
    if (next.pendingOrientation !== null) {
        next.activeOrientation = next.pendingOrientation;
        next.pendingOrientation = null;
    }
    return next;
}
/**
 * Get the effective margins for the current section state.
 * Returns active margins, or pending if scheduled.
 */
export function getEffectiveMargins(state) {
    var _a, _b, _c, _d;
    return {
        top: (_a = state.pendingTopMargin) !== null && _a !== void 0 ? _a : state.activeTopMargin,
        bottom: (_b = state.pendingBottomMargin) !== null && _b !== void 0 ? _b : state.activeBottomMargin,
        left: (_c = state.pendingLeftMargin) !== null && _c !== void 0 ? _c : state.activeLeftMargin,
        right: (_d = state.pendingRightMargin) !== null && _d !== void 0 ? _d : state.activeRightMargin,
    };
}
/**
 * Get the effective page size for the current section state.
 */
export function getEffectivePageSize(state) {
    var _a;
    return (_a = state.pendingPageSize) !== null && _a !== void 0 ? _a : state.activePageSize;
}
/**
 * Get the effective columns for the current section state.
 */
export function getEffectiveColumns(state) {
    var _a;
    return (_a = state.pendingColumns) !== null && _a !== void 0 ? _a : state.activeColumns;
}
//# sourceMappingURL=section-breaks.js.map