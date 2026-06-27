/**
 * Hit Testing Utilities
 *
 * Maps click coordinates to pages, fragments, and document positions.
 * Used by the paged editor to translate user clicks into PM positions.
 */
import { getHeaderRowsHeight } from '../layout-engine/index';
// =============================================================================
// PAGE HIT TESTING
// =============================================================================
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
export function hitTestPage(layout, point) {
    var _a, _b, _c, _d, _e;
    if (layout.pages.length === 0) {
        return null;
    }
    const pageGap = (_a = layout.pageGap) !== null && _a !== void 0 ? _a : 0;
    let cursorY = 0;
    // Track nearest page for gap hits
    let nearestPageIndex = null;
    let nearestDistance = Infinity;
    for (let pageIndex = 0; pageIndex < layout.pages.length; pageIndex++) {
        const page = layout.pages[pageIndex];
        const pageHeight = (_c = (_b = page.size) === null || _b === void 0 ? void 0 : _b.h) !== null && _c !== void 0 ? _c : layout.pageSize.h;
        const pageTop = cursorY;
        const pageBottom = pageTop + pageHeight;
        // Check if point is within this page
        if (point.y >= pageTop && point.y < pageBottom) {
            return {
                pageIndex,
                page,
                pageY: point.y - pageTop,
            };
        }
        // Track nearest page by distance to page center
        const pageCenter = pageTop + pageHeight / 2;
        const distance = Math.abs(point.y - pageCenter);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPageIndex = pageIndex;
        }
        // Move to next page (add gap after)
        cursorY = pageBottom + pageGap;
    }
    // If point is in a gap or outside, return nearest page
    if (nearestPageIndex !== null) {
        const page = layout.pages[nearestPageIndex];
        const pageTop = getPageTop(layout, nearestPageIndex);
        return {
            pageIndex: nearestPageIndex,
            page,
            pageY: Math.max(0, Math.min(point.y - pageTop, (_e = (_d = page.size) === null || _d === void 0 ? void 0 : _d.h) !== null && _e !== void 0 ? _e : layout.pageSize.h)),
        };
    }
    return null;
}
/**
 * Calculate the Y offset of a page from the top of the document.
 */
export function getPageTop(layout, pageIndex) {
    var _a, _b, _c;
    const pageGap = (_a = layout.pageGap) !== null && _a !== void 0 ? _a : 0;
    let y = 0;
    for (let i = 0; i < pageIndex && i < layout.pages.length; i++) {
        const page = layout.pages[i];
        const pageHeight = (_c = (_b = page.size) === null || _b === void 0 ? void 0 : _b.h) !== null && _c !== void 0 ? _c : layout.pageSize.h;
        y += pageHeight + pageGap;
    }
    return y;
}
/**
 * Get the page index at a specific Y coordinate.
 * Returns null if the coordinate is outside all pages.
 */
export function getPageIndexAtY(layout, y) {
    var _a;
    const hit = hitTestPage(layout, { x: 0, y });
    return (_a = hit === null || hit === void 0 ? void 0 : hit.pageIndex) !== null && _a !== void 0 ? _a : null;
}
// =============================================================================
// FRAGMENT HIT TESTING
// =============================================================================
/**
 * Find a block by its ID in the blocks array.
 */
function findBlockIndexById(blocks, blockId) {
    return blocks.findIndex((block) => block.id === blockId);
}
/**
 * Calculate the actual height of a paragraph fragment from its lines.
 */
function calculateParagraphFragmentHeight(fragment, measure) {
    let height = 0;
    for (let i = fragment.fromLine; i < fragment.toLine && i < measure.lines.length; i++) {
        height += measure.lines[i].lineHeight;
    }
    return height;
}
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
export function hitTestFragment(pageHit, blocks, measures, pagePoint) {
    // Sort fragments by Y, then X for consistent hit testing
    const sortedFragments = [...pageHit.page.fragments].sort((a, b) => {
        const dy = a.y - b.y;
        if (Math.abs(dy) > 0.5)
            return dy;
        return a.x - b.x;
    });
    for (const fragment of sortedFragments) {
        const blockIndex = findBlockIndexById(blocks, fragment.blockId);
        if (blockIndex === -1)
            continue;
        const block = blocks[blockIndex];
        const measure = measures[blockIndex];
        if (!block || !measure)
            continue;
        // Calculate fragment bounds based on type
        let fragmentHeight;
        if (fragment.kind === 'paragraph') {
            if (block.kind !== 'paragraph' || measure.kind !== 'paragraph')
                continue;
            fragmentHeight = calculateParagraphFragmentHeight(fragment, measure);
        }
        else if (fragment.kind === 'table') {
            fragmentHeight = fragment.height;
        }
        else if (fragment.kind === 'image') {
            fragmentHeight = fragment.height;
        }
        else {
            continue;
        }
        // Check if point is within fragment bounds
        const withinX = pagePoint.x >= fragment.x && pagePoint.x <= fragment.x + fragment.width;
        const withinY = pagePoint.y >= fragment.y && pagePoint.y <= fragment.y + fragmentHeight;
        if (withinX && withinY) {
            return {
                fragment,
                block,
                measure,
                pageIndex: pageHit.pageIndex,
                localX: pagePoint.x - fragment.x,
                localY: pagePoint.y - fragment.y,
            };
        }
    }
    return null;
}
/**
 * Hit-test to find image fragments (they may overlap other content).
 */
export function hitTestImageFragment(pageHit, blocks, measures, pagePoint) {
    for (const fragment of pageHit.page.fragments) {
        if (fragment.kind !== 'image')
            continue;
        const blockIndex = findBlockIndexById(blocks, fragment.blockId);
        if (blockIndex === -1)
            continue;
        const block = blocks[blockIndex];
        const measure = measures[blockIndex];
        if (!block || !measure)
            continue;
        const withinX = pagePoint.x >= fragment.x && pagePoint.x <= fragment.x + fragment.width;
        const withinY = pagePoint.y >= fragment.y && pagePoint.y <= fragment.y + fragment.height;
        if (withinX && withinY) {
            return {
                fragment,
                block,
                measure,
                pageIndex: pageHit.pageIndex,
                localX: pagePoint.x - fragment.x,
                localY: pagePoint.y - fragment.y,
            };
        }
    }
    return null;
}
// =============================================================================
// TABLE CELL HIT TESTING
// =============================================================================
/**
 * Hit-test within a table fragment to find the specific cell.
 *
 * @param pageHit - The page hit result.
 * @param blocks - All flow blocks.
 * @param measures - All measurements.
 * @param pagePoint - Point in page-relative coordinates.
 * @returns TableCellHit if a table cell was found, null otherwise.
 */
export function hitTestTableCell(pageHit, blocks, measures, pagePoint) {
    var _a, _b, _c, _d, _e, _f, _g;
    for (const fragment of pageHit.page.fragments) {
        if (fragment.kind !== 'table')
            continue;
        const tableFragment = fragment;
        // Check if point is within table bounds
        const withinX = pagePoint.x >= tableFragment.x && pagePoint.x <= tableFragment.x + tableFragment.width;
        const withinY = pagePoint.y >= tableFragment.y && pagePoint.y <= tableFragment.y + tableFragment.height;
        if (!withinX || !withinY)
            continue;
        const blockIndex = findBlockIndexById(blocks, tableFragment.blockId);
        if (blockIndex === -1)
            continue;
        const block = blocks[blockIndex];
        const measure = measures[blockIndex];
        if (!block || block.kind !== 'table' || !measure || measure.kind !== 'table')
            continue;
        const tableBlock = block;
        const tableMeasure = measure;
        // Calculate local position within table
        const localX = pagePoint.x - tableFragment.x;
        const localY = pagePoint.y - tableFragment.y;
        // Account for repeated header rows in continuation fragments
        const headerRowCount = (_a = tableFragment.headerRowCount) !== null && _a !== void 0 ? _a : 0;
        const headerHeight = headerRowCount > 0 && tableFragment.continuesFromPrev
            ? getHeaderRowsHeight(tableMeasure, headerRowCount)
            : 0;
        // Find row at localY
        let rowY = 0;
        let rowIndex = -1;
        if (tableMeasure.rows.length === 0 || tableBlock.rows.length === 0)
            continue;
        // If click is within the repeated header area, map to the original header rows
        if (headerHeight > 0 && localY < headerHeight) {
            let hdrY = 0;
            for (let h = 0; h < headerRowCount && h < tableMeasure.rows.length; h++) {
                const hdrRowMeasure = tableMeasure.rows[h];
                if (localY >= hdrY && localY < hdrY + hdrRowMeasure.height) {
                    rowIndex = h;
                    break;
                }
                hdrY += hdrRowMeasure.height;
            }
            if (rowIndex === -1)
                rowIndex = 0;
        }
        else {
            // Adjust localY to skip past repeated header rows
            const adjustedLocalY = localY - headerHeight;
            for (let r = tableFragment.fromRow; r < tableFragment.toRow && r < tableMeasure.rows.length; r++) {
                const rowMeasure = tableMeasure.rows[r];
                if (adjustedLocalY >= rowY && adjustedLocalY < rowY + rowMeasure.height) {
                    rowIndex = r;
                    break;
                }
                rowY += rowMeasure.height;
            }
        }
        // If no row found, use last row
        if (rowIndex === -1) {
            rowIndex = Math.min(tableFragment.toRow - 1, tableMeasure.rows.length - 1);
            if (rowIndex < tableFragment.fromRow)
                continue;
        }
        const rowMeasure = tableMeasure.rows[rowIndex];
        const row = tableBlock.rows[rowIndex];
        if (!rowMeasure || !row)
            continue;
        // Find column at localX
        let colX = 0;
        let colIndex = -1;
        if (rowMeasure.cells.length === 0 || row.cells.length === 0)
            continue;
        for (let c = 0; c < rowMeasure.cells.length; c++) {
            const cellMeasure = rowMeasure.cells[c];
            if (localX >= colX && localX < colX + cellMeasure.width) {
                colIndex = c;
                break;
            }
            colX += cellMeasure.width;
        }
        // If no column found, use last column
        if (colIndex === -1) {
            colIndex = rowMeasure.cells.length - 1;
            if (colIndex < 0)
                continue;
        }
        const cellMeasure = rowMeasure.cells[colIndex];
        const cell = row.cells[colIndex];
        if (!cellMeasure || !cell)
            continue;
        // Find the cumulative row Y for the found row
        // If the click is on a content row (not a repeated header), account for header offset
        let rowTop = 0;
        const isClickOnHeader = headerHeight > 0 && rowIndex < headerRowCount;
        if (isClickOnHeader) {
            // Click on a repeated header row — rowTop is within the header area
            for (let r = 0; r < rowIndex; r++) {
                rowTop += (_c = (_b = tableMeasure.rows[r]) === null || _b === void 0 ? void 0 : _b.height) !== null && _c !== void 0 ? _c : 0;
            }
        }
        else {
            // Click on a content row — add header offset, then accumulate from fromRow
            rowTop = headerHeight;
            for (let r = tableFragment.fromRow; r < rowIndex; r++) {
                rowTop += (_e = (_d = tableMeasure.rows[r]) === null || _d === void 0 ? void 0 : _d.height) !== null && _e !== void 0 ? _e : 0;
            }
        }
        // Find the cumulative column X for the found column
        let colLeft = 0;
        for (let c = 0; c < colIndex; c++) {
            colLeft += (_g = (_f = rowMeasure.cells[c]) === null || _f === void 0 ? void 0 : _f.width) !== null && _g !== void 0 ? _g : 0;
        }
        // Get first paragraph in cell
        let cellBlock;
        let cellBlockMeasure;
        if (cell.blocks && cell.blocks.length > 0) {
            const firstBlock = cell.blocks[0];
            const firstMeasure = cellMeasure.blocks[0];
            if (firstBlock.kind === 'paragraph' && (firstMeasure === null || firstMeasure === void 0 ? void 0 : firstMeasure.kind) === 'paragraph') {
                cellBlock = firstBlock;
                cellBlockMeasure = firstMeasure;
            }
        }
        // Calculate position within cell (rough - doesn't account for padding)
        const cellLocalX = localX - colLeft;
        const cellLocalY = localY - rowTop;
        return {
            fragment: tableFragment,
            block: tableBlock,
            measure: tableMeasure,
            pageIndex: pageHit.pageIndex,
            rowIndex,
            colIndex,
            cellBlock,
            cellMeasure: cellBlockMeasure,
            cellLocalX: Math.max(0, cellLocalX),
            cellLocalY: Math.max(0, cellLocalY),
        };
    }
    return null;
}
/**
 * Perform complete hit testing from document coordinates to the most specific element.
 *
 * @param layout - The layout containing pages.
 * @param blocks - All flow blocks.
 * @param measures - All measurements.
 * @param point - Point in document coordinates (Y is cumulative from document top).
 * @returns Complete hit test result.
 */
export function hitTest(layout, blocks, measures, point) {
    var _a;
    const result = {
        pageHit: null,
        fragmentHit: null,
        tableCellHit: null,
    };
    // First, find the page
    result.pageHit = hitTestPage(layout, point);
    if (!result.pageHit) {
        return result;
    }
    // Convert to page-relative coordinates
    const pageTop = getPageTop(layout, result.pageHit.pageIndex);
    const pagePoint = {
        x: point.x,
        y: point.y - pageTop,
    };
    // Find the fragment
    result.fragmentHit = hitTestFragment(result.pageHit, blocks, measures, pagePoint);
    // If fragment is a table, find the cell
    if (((_a = result.fragmentHit) === null || _a === void 0 ? void 0 : _a.fragment.kind) === 'table') {
        result.tableCellHit = hitTestTableCell(result.pageHit, blocks, measures, pagePoint);
    }
    return result;
}
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Get the total document height (all pages + gaps).
 */
export function getTotalDocumentHeight(layout) {
    var _a, _b, _c;
    if (layout.pages.length === 0)
        return 0;
    const pageGap = (_a = layout.pageGap) !== null && _a !== void 0 ? _a : 0;
    let height = 0;
    for (let i = 0; i < layout.pages.length; i++) {
        const page = layout.pages[i];
        height += (_c = (_b = page.size) === null || _b === void 0 ? void 0 : _b.h) !== null && _c !== void 0 ? _c : layout.pageSize.h;
        if (i < layout.pages.length - 1) {
            height += pageGap;
        }
    }
    return height;
}
/**
 * Get Y coordinate to scroll to for a specific page.
 */
export function getScrollYForPage(layout, pageIndex) {
    return getPageTop(layout, pageIndex);
}
/**
 * Get page bounds (top and bottom Y coordinates).
 */
export function getPageBounds(layout, pageIndex) {
    var _a, _b;
    if (pageIndex < 0 || pageIndex >= layout.pages.length) {
        return null;
    }
    const top = getPageTop(layout, pageIndex);
    const page = layout.pages[pageIndex];
    const height = (_b = (_a = page.size) === null || _a === void 0 ? void 0 : _a.h) !== null && _b !== void 0 ? _b : layout.pageSize.h;
    return {
        top,
        bottom: top + height,
    };
}
/**
 * Check if a point is within the content area of a page (inside margins).
 */
export function isPointInContentArea(_layout, pageHit, pagePoint) {
    const page = pageHit.page;
    const margins = page.margins;
    const contentLeft = margins.left;
    const contentRight = page.size.w - margins.right;
    const contentTop = margins.top;
    const contentBottom = page.size.h - margins.bottom;
    return (pagePoint.x >= contentLeft &&
        pagePoint.x <= contentRight &&
        pagePoint.y >= contentTop &&
        pagePoint.y <= contentBottom);
}
/**
 * Find the nearest fragment to a point on a page.
 * Useful when the click is in whitespace.
 */
export function findNearestFragment(pageHit, blocks, measures, pagePoint) {
    let nearestHit = null;
    let nearestDistance = Infinity;
    for (const fragment of pageHit.page.fragments) {
        const blockIndex = findBlockIndexById(blocks, fragment.blockId);
        if (blockIndex === -1)
            continue;
        const block = blocks[blockIndex];
        const measure = measures[blockIndex];
        if (!block || !measure)
            continue;
        // Calculate fragment height
        let height;
        if (fragment.kind === 'paragraph' && measure.kind === 'paragraph') {
            height = calculateParagraphFragmentHeight(fragment, measure);
        }
        else if (fragment.kind === 'table' || fragment.kind === 'image') {
            height = fragment.height;
        }
        else {
            continue;
        }
        // Calculate distance to fragment center
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + height / 2;
        const distance = Math.sqrt(Math.pow(pagePoint.x - centerX, 2) + Math.pow(pagePoint.y - centerY, 2));
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestHit = {
                fragment,
                block,
                measure,
                pageIndex: pageHit.pageIndex,
                localX: Math.max(0, Math.min(pagePoint.x - fragment.x, fragment.width)),
                localY: Math.max(0, Math.min(pagePoint.y - fragment.y, height)),
            };
        }
    }
    return nearestHit;
}
//# sourceMappingURL=hitTest.js.map