/**
 * Table Renderer
 *
 * Renders table fragments to DOM. Handles:
 * - Multi-row tables split across pages
 * - Cell content (paragraphs within cells)
 * - Column widths and cell spans
 * - Basic cell styling (borders, backgrounds)
 */
import { isFloatingImageRun, emuToPixels, floatingImageWrapsText, floatingImageIsBehindDoc, renderFloatingImagesLayer, } from './renderPage';
import { renderParagraphFragment } from './renderParagraph';
import { measureParagraph } from '../layout-bridge/measuring';
/**
 * CSS class names for table elements
 */
export const TABLE_CLASS_NAMES = {
    table: 'layout-table',
    row: 'layout-table-row',
    cell: 'layout-table-cell',
    cellContent: 'layout-table-cell-content',
    resizeHandle: 'layout-table-resize-handle',
    rowResizeHandle: 'layout-table-row-resize-handle',
    tableEdgeHandleBottom: 'layout-table-edge-handle-bottom',
    tableEdgeHandleRight: 'layout-table-edge-handle-right',
};
/**
 * Extract floating images from cell paragraphs and compute their positions
 * relative to the cell content area.
 *
 * NOTE: The horizontal/vertical position logic here mirrors
 * extractFloatingImagesFromParagraph() in renderPage.ts. Kept separate
 * because the coordinate systems differ (cell-relative vs page-relative).
 */
function extractCellFloatingImages(cell, cellMeasure, contentWidth) {
    var _a, _b, _c, _d, _e;
    const result = [];
    let paragraphY = 0;
    for (let blockIndex = 0; blockIndex < cell.blocks.length; blockIndex++) {
        const block = cell.blocks[blockIndex];
        if ((block === null || block === void 0 ? void 0 : block.kind) !== 'paragraph') {
            // Use actual measured height for Y tracking
            const blockMeasure = cellMeasure.blocks[blockIndex];
            if (blockMeasure && blockMeasure.kind === 'table') {
                paragraphY += (_a = blockMeasure.totalHeight) !== null && _a !== void 0 ? _a : 0;
            }
            continue;
        }
        const pBlock = block;
        for (const run of pBlock.runs) {
            if (run.kind !== 'image')
                continue;
            const imgRun = run;
            if (!isFloatingImageRun(imgRun))
                continue;
            const position = imgRun.position;
            const distTop = (_b = imgRun.distTop) !== null && _b !== void 0 ? _b : 0;
            const distBottom = (_c = imgRun.distBottom) !== null && _c !== void 0 ? _c : 0;
            const distLeft = (_d = imgRun.distLeft) !== null && _d !== void 0 ? _d : 12;
            const distRight = (_e = imgRun.distRight) !== null && _e !== void 0 ? _e : 12;
            // Horizontal position within cell
            let side = 'left';
            let x = 0;
            if (position === null || position === void 0 ? void 0 : position.horizontal) {
                const h = position.horizontal;
                if (h.align === 'right') {
                    side = 'right';
                    x = contentWidth - imgRun.width;
                }
                else if (h.align === 'left') {
                    x = 0;
                }
                else if (h.align === 'center') {
                    x = (contentWidth - imgRun.width) / 2;
                }
                else if (h.posOffset !== undefined) {
                    x = emuToPixels(h.posOffset);
                    side = x > contentWidth / 2 ? 'right' : 'left';
                }
            }
            else if (imgRun.cssFloat === 'right') {
                side = 'right';
                x = contentWidth - imgRun.width;
            }
            // Vertical position within cell
            let y = paragraphY;
            if (position === null || position === void 0 ? void 0 : position.vertical) {
                const v = position.vertical;
                if (v.posOffset !== undefined) {
                    y = paragraphY + emuToPixels(v.posOffset);
                }
                else if (v.align === 'top') {
                    y = 0;
                }
            }
            // Clamp within cell bounds — both axes. The y-clamp was missing
            // pre-fix, so floating images positioned with a v.posOffset larger
            // than the cell height rendered past the cell's bottom edge into
            // the next row. Word treats cell-anchored floats as logically
            // bound to the cell.
            x = Math.max(0, Math.min(x, contentWidth - imgRun.width));
            y = Math.max(0, Math.min(y, cellMeasure.height - imgRun.height));
            // Derive wrapText from cssFloat (same pattern as page-level):
            // cssFloat='left' → image floats left → text on right → wrapText='right'
            // cssFloat='right' → image floats right → text on left → wrapText='left'
            let wrapText = 'bothSides';
            if (imgRun.cssFloat === 'left') {
                wrapText = 'right';
            }
            else if (imgRun.cssFloat === 'right') {
                wrapText = 'left';
            }
            result.push({
                src: imgRun.src,
                width: imgRun.width,
                height: imgRun.height,
                alt: imgRun.alt,
                transform: imgRun.transform,
                x,
                y,
                side,
                distTop,
                distBottom,
                distLeft,
                distRight,
                wrapText,
                wrapType: imgRun.wrapType,
                pmStart: imgRun.pmStart,
                pmEnd: imgRun.pmEnd,
            });
        }
        // Use actual measured height for Y tracking
        const blockMeasure = cellMeasure.blocks[blockIndex];
        if (blockMeasure && blockMeasure.kind === 'paragraph') {
            paragraphY += blockMeasure.totalHeight;
        }
    }
    return result;
}
/**
 * Render cell content (paragraphs and nested tables)
 */
function renderCellContent(cell, cellMeasure, context, doc) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const contentEl = doc.createElement('div');
    contentEl.className = TABLE_CLASS_NAMES.cellContent;
    contentEl.style.position = 'relative';
    // Cell uses border-box sizing, so content width must subtract padding.
    const padLeft = (_b = (_a = cell.padding) === null || _a === void 0 ? void 0 : _a.left) !== null && _b !== void 0 ? _b : 7;
    const padRight = (_d = (_c = cell.padding) === null || _c === void 0 ? void 0 : _c.right) !== null && _d !== void 0 ? _d : 7;
    const contentWidth = Math.max(0, cellMeasure.width - padLeft - padRight);
    contentEl.style.width = `${contentWidth}px`;
    // Extract floating images from cell paragraphs
    const cellFloatingImages = extractCellFloatingImages(cell, cellMeasure, contentWidth);
    // Build floating zones for measurement and render floating layer
    let floatingZones;
    if (cellFloatingImages.length > 0) {
        floatingZones = cellFloatingImages.filter(floatingImageWrapsText).map((img) => {
            var _a;
            const rectRight = img.x + img.width + img.distRight;
            const rectTop = img.y - img.distTop;
            const rectBottom = img.y + img.height + img.distBottom;
            let leftMargin = 0;
            let rightMargin = 0;
            // Use wrapText to determine which side text flows on (same as rectsToFloatingZones in renderPage.ts)
            const wt = (_a = img.wrapText) !== null && _a !== void 0 ? _a : 'bothSides';
            if (wt === 'right') {
                // Text flows on RIGHT only -> image blocks the left side
                leftMargin = rectRight;
            }
            else if (wt === 'left') {
                // Text flows on LEFT only -> image blocks the right side
                rightMargin = contentWidth - (img.x - img.distLeft);
            }
            else {
                // bothSides / largest: use image position to determine which side it blocks
                if (img.side === 'left') {
                    leftMargin = rectRight;
                }
                else {
                    rightMargin = contentWidth - (img.x - img.distLeft);
                }
            }
            return { leftMargin, rightMargin, topY: rectTop, bottomY: rectBottom };
        });
        const behindFloatingImages = cellFloatingImages.filter(floatingImageIsBehindDoc);
        if (behindFloatingImages.length > 0) {
            contentEl.appendChild(renderFloatingImagesLayer(behindFloatingImages, doc, {
                layerClass: 'layout-cell-floating-images-layer',
                itemClass: 'layout-cell-floating-image',
                sizing: 'fullSize',
                layerMode: 'behind',
            }));
        }
    }
    let cumulativeY = 0;
    let previousParagraphAfter = 0;
    for (let i = 0; i < cell.blocks.length; i++) {
        const block = cell.blocks[i];
        const measure = cellMeasure.blocks[i];
        if ((block === null || block === void 0 ? void 0 : block.kind) === 'paragraph' && (measure === null || measure === void 0 ? void 0 : measure.kind) === 'paragraph') {
            const paragraphBlock = block;
            let paragraphMeasure = measure;
            const spacing = (_e = paragraphBlock.attrs) === null || _e === void 0 ? void 0 : _e.spacing;
            // Match body paginator: max-collapse adjacent paragraph spacing.
            const effectiveSpaceBefore = Math.max(previousParagraphAfter, (_f = spacing === null || spacing === void 0 ? void 0 : spacing.before) !== null && _f !== void 0 ? _f : 0);
            cumulativeY += effectiveSpaceBefore;
            // Re-measure with floating zones if floating images exist in this cell
            if (floatingZones && floatingZones.length > 0) {
                paragraphMeasure = measureParagraph(paragraphBlock, contentWidth, {
                    floatingZones,
                    paragraphYOffset: cumulativeY,
                });
            }
            // Create synthetic fragment for the paragraph
            const syntheticFragment = {
                kind: 'paragraph',
                blockId: paragraphBlock.id,
                x: 0,
                y: 0,
                width: contentWidth,
                height: paragraphMeasure.totalHeight,
                fromLine: 0,
                toLine: paragraphMeasure.lines.length,
                pmStart: paragraphBlock.pmStart,
                pmEnd: paragraphBlock.pmEnd,
            };
            const cellContext = Object.assign(Object.assign({}, context), { insideTableCell: true });
            const fragEl = renderParagraphFragment(syntheticFragment, paragraphBlock, paragraphMeasure, cellContext, { document: doc });
            fragEl.style.position = 'relative';
            if (effectiveSpaceBefore > 0) {
                fragEl.style.marginTop = `${effectiveSpaceBefore}px`;
            }
            contentEl.appendChild(fragEl);
            cumulativeY += paragraphMeasure.totalHeight;
            previousParagraphAfter = (_g = spacing === null || spacing === void 0 ? void 0 : spacing.after) !== null && _g !== void 0 ? _g : 0;
        }
        else if ((block === null || block === void 0 ? void 0 : block.kind) === 'table' && (measure === null || measure === void 0 ? void 0 : measure.kind) === 'table') {
            // Nested table - render in normal document flow.
            // Avoid cumulative marginTop offsets here: cell content already flows vertically,
            // and compounding offsets can produce enormous heights on deeply nested tables.
            const tableBlock = block;
            const tableMeasure = measure;
            const effectiveSpaceBefore = previousParagraphAfter;
            const nestedTableEl = renderNestedTable(tableBlock, tableMeasure, context, doc);
            nestedTableEl.style.position = 'relative';
            if (effectiveSpaceBefore > 0) {
                nestedTableEl.style.marginTop = `${effectiveSpaceBefore}px`;
            }
            contentEl.appendChild(nestedTableEl);
            cumulativeY += effectiveSpaceBefore + ((_h = measure.totalHeight) !== null && _h !== void 0 ? _h : 0);
            previousParagraphAfter = 0;
        }
    }
    if (previousParagraphAfter > 0) {
        contentEl.style.paddingBottom = `${previousParagraphAfter}px`;
    }
    const frontFloatingImages = cellFloatingImages.filter((img) => !floatingImageIsBehindDoc(img));
    if (frontFloatingImages.length > 0) {
        contentEl.appendChild(renderFloatingImagesLayer(frontFloatingImages, doc, {
            layerClass: 'layout-cell-floating-images-layer',
            itemClass: 'layout-cell-floating-image',
            sizing: 'fullSize',
            layerMode: 'front',
        }));
    }
    return contentEl;
}
/**
 * Render a nested table (within a cell)
 */
function renderNestedTable(block, measure, context, doc) {
    var _a, _b;
    const tableEl = doc.createElement('div');
    tableEl.className = `${TABLE_CLASS_NAMES.table} layout-nested-table`;
    // Positioning (relative, not absolute)
    tableEl.style.position = 'relative';
    tableEl.style.width = `${measure.totalWidth}px`;
    tableEl.style.display = 'block';
    if (block.justification === 'center') {
        tableEl.style.marginLeft = 'auto';
        tableEl.style.marginRight = 'auto';
    }
    else if (block.justification === 'right') {
        tableEl.style.marginLeft = 'auto';
    }
    else if (block.indent) {
        tableEl.style.marginLeft = `${block.indent}px`;
    }
    // Store metadata
    tableEl.dataset.blockId = String(block.id);
    if (block.pmStart !== undefined) {
        tableEl.dataset.pmStart = String(block.pmStart);
    }
    if (block.pmEnd !== undefined) {
        tableEl.dataset.pmEnd = String(block.pmEnd);
    }
    // Build row Y positions for rowSpan height calculation
    const rowYPositions = [];
    let yPos = 0;
    for (let i = 0; i < measure.rows.length; i++) {
        rowYPositions.push(yPos);
        yPos += (_b = (_a = measure.rows[i]) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
    }
    rowYPositions.push(yPos);
    // Track spanning cells across rows
    const spanningCells = new Map();
    // Word-compat (#395): same heuristic as top-level tables — only fires on
    // last body row + bottom undefined + non-empty firstRow border.
    const wordCompatClosingBorders = context.wordCompat
        ? computeWordCompatClosingBorders(block, measure.columnWidths.length)
        : undefined;
    // Render all rows
    let y = 0;
    for (let rowIndex = 0; rowIndex < block.rows.length; rowIndex++) {
        const row = block.rows[rowIndex];
        const rowMeasure = measure.rows[rowIndex];
        if (!row || !rowMeasure)
            continue;
        const rowEl = renderTableRow(row, rowMeasure, rowIndex, y, measure.columnWidths, block.rows.length, context, doc, spanningCells, rowYPositions, undefined, wordCompatClosingBorders);
        tableEl.appendChild(rowEl);
        y += rowMeasure.height;
    }
    tableEl.style.height = `${y}px`;
    return tableEl;
}
/**
 * Word-compat (#395): build the firstRow's bottom border for each column,
 * to be applied under the last body row when that row has no bottom of its
 * own. `cell.borders?.bottom === undefined` at the apply site implies no
 * tblBorders, no lastRow style, and no explicit nil — exactly the cases
 * Word draws an extra closing line on.
 *
 * Returns undefined when no first row exists.
 */
function computeWordCompatClosingBorders(block, columnCount) {
    var _a, _b;
    const firstRow = block.rows[0];
    if (!firstRow)
        return undefined;
    const out = new Array(columnCount).fill(undefined);
    let columnIndex = 0;
    for (const cell of firstRow.cells) {
        const colSpan = (_a = cell.colSpan) !== null && _a !== void 0 ? _a : 1;
        for (let c = 0; c < colSpan && columnIndex + c < columnCount; c++) {
            out[columnIndex + c] = (_b = cell.borders) === null || _b === void 0 ? void 0 : _b.bottom;
        }
        columnIndex += colSpan;
    }
    // If no column has a firstRow bottom border, the heuristic can't add anything.
    if (out.every((b) => b === undefined))
        return undefined;
    return out;
}
/**
 * Apply a single border to an element.
 */
function applyBorder(el, side, border) {
    var _a, _b, _c;
    const styleProp = `border${side.charAt(0).toUpperCase() + side.slice(1)}`;
    if (!border || border.style === 'none' || border.style === 'nil' || border.width === 0) {
        el.style[styleProp] = 'none';
    }
    else {
        const width = (_a = border.width) !== null && _a !== void 0 ? _a : 1;
        const color = (_b = border.color) !== null && _b !== void 0 ? _b : '#000000';
        const style = (_c = border.style) !== null && _c !== void 0 ? _c : 'solid';
        el.style[styleProp] = `${width}px ${style} ${color}`;
    }
}
/**
 * Render a single table cell
 */
function renderTableCell(cell, cellMeasure, x, rowHeight, borderFlags, context, doc, 
/**
 * Word-compat (#395) closing border for this column. Applied below the
 * last body row when wordCompat is on AND the cell has no bottom of its
 * own (i.e. no tblBorders, no lastRow style, no explicit nil).
 */
wordCompatClosingBorder) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const cellEl = doc.createElement('div');
    cellEl.className = TABLE_CLASS_NAMES.cell;
    // Positioning
    cellEl.style.position = 'absolute';
    cellEl.style.left = `${x}px`;
    cellEl.style.top = '0';
    cellEl.style.width = `${cellMeasure.width}px`;
    cellEl.style.height = `${rowHeight}px`;
    cellEl.style.overflow = 'hidden';
    cellEl.style.boxSizing = 'border-box';
    // Use per-cell padding from DOCX margins, default to Word's visual rendering
    const padTop = (_b = (_a = cell.padding) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 1;
    const padRight = (_d = (_c = cell.padding) === null || _c === void 0 ? void 0 : _c.right) !== null && _d !== void 0 ? _d : 7;
    const padBottom = (_f = (_e = cell.padding) === null || _e === void 0 ? void 0 : _e.bottom) !== null && _f !== void 0 ? _f : 1;
    const padLeft = (_h = (_g = cell.padding) === null || _g === void 0 ? void 0 : _g.left) !== null && _h !== void 0 ? _h : 7;
    cellEl.style.padding = `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`;
    // Apply borders - use cell borders if available, otherwise no border
    if (cell.borders) {
        // Collapse shared borders to avoid double-thick lines.
        // Strategy: "bottom wins" for rows, "right wins" for columns.
        // Each cell's bottom border represents the shared edge with the row below.
        // Each cell's right border represents the shared edge with the column to its right.
        // Only the first row draws its top border (table's top edge).
        // Only the first column draws its left border (table's left edge).
        if (borderFlags.isFirstRow) {
            applyBorder(cellEl, 'top', cell.borders.top);
        }
        applyBorder(cellEl, 'right', cell.borders.right);
        applyBorder(cellEl, 'bottom', cell.borders.bottom);
        if (borderFlags.isFirstCol)
            applyBorder(cellEl, 'left', cell.borders.left);
    }
    // No default border - cells without explicit borders should be borderless
    // Word-compat (#395): if the last row has no bottom border of its own
    // and the renderer was told to mirror Word's closing-line behavior,
    // draw the firstRow's bottom border under this cell. cell.borders?.bottom
    // === undefined excludes both `tblBorders` (would set every cell's bottom)
    // and explicit `<w:bottom w:val="nil"/>` (would set bottom to a 'nil' spec).
    // Treat `undefined`, `width=0`, and `style='none'/'nil'` as "no explicit
    // bottom border" — the layout-bridge synthesizes a zero/none stub when
    // `<w:tblBorders>` has neither `bottom` nor `insideH`, so the original
    // `=== undefined` check missed every realistic parsed table. The
    // heuristic still skips cells with a real `<w:bottom>` of their own
    // (any positive width with style != none/nil) per the GH #395 spec.
    const cellBottom = (_j = cell.borders) === null || _j === void 0 ? void 0 : _j.bottom;
    const cellBottomIsEmpty = cellBottom == null ||
        ((_k = cellBottom.width) !== null && _k !== void 0 ? _k : 0) === 0 ||
        cellBottom.style === 'none' ||
        cellBottom.style === 'nil';
    if (context.wordCompat &&
        borderFlags.isLastRow &&
        cellBottomIsEmpty &&
        wordCompatClosingBorder !== undefined) {
        applyBorder(cellEl, 'bottom', wordCompatClosingBorder);
    }
    // Background color
    if (cell.background) {
        cellEl.style.backgroundColor = cell.background;
    }
    // `w:noWrap` (§17.4.30): forbid soft-wrapping inside the cell. We apply
    // it on the cell box so descendants pick it up by inheritance — paragraph
    // lines remain a single visual line that may grow the cell's effective
    // content width past its measured size.
    if (cell.noWrap) {
        cellEl.style.whiteSpace = 'nowrap';
    }
    // Vertical alignment
    if (cell.verticalAlign) {
        cellEl.style.display = 'flex';
        cellEl.style.flexDirection = 'column';
        switch (cell.verticalAlign) {
            case 'top':
                cellEl.style.justifyContent = 'flex-start';
                break;
            case 'center':
                cellEl.style.justifyContent = 'center';
                break;
            case 'bottom':
                cellEl.style.justifyContent = 'flex-end';
                break;
        }
    }
    // Render cell content
    const contentEl = renderCellContent(cell, cellMeasure, context, doc);
    cellEl.appendChild(contentEl);
    // Store PM positions for selection
    if (cell.blocks.length > 0) {
        const firstBlock = cell.blocks[0];
        const lastBlock = cell.blocks[cell.blocks.length - 1];
        if (firstBlock && 'pmStart' in firstBlock && firstBlock.pmStart !== undefined) {
            cellEl.dataset.pmStart = String(firstBlock.pmStart);
        }
        if (lastBlock && 'pmEnd' in lastBlock && lastBlock.pmEnd !== undefined) {
            cellEl.dataset.pmEnd = String(lastBlock.pmEnd);
        }
    }
    return cellEl;
}
/**
 * Render a table row with rowSpan support
 */
function renderTableRow(row, rowMeasure, rowIndex, y, columnWidths, totalRows, context, doc, spanningCells, rowYPositions, isFirstRowInFragment, wordCompatClosingBorders) {
    var _a, _b, _c, _d, _e, _f, _g;
    const rowEl = doc.createElement('div');
    rowEl.className = TABLE_CLASS_NAMES.row;
    // Positioning
    rowEl.style.position = 'absolute';
    rowEl.style.left = '0';
    rowEl.style.top = `${y}px`;
    rowEl.style.width = '100%';
    rowEl.style.height = `${rowMeasure.height}px`;
    // Data attributes
    rowEl.dataset.rowIndex = String(rowIndex);
    // Build set of columns occupied by spanning cells from previous rows
    const occupiedColumns = new Set();
    if (spanningCells) {
        for (const [, spanCell] of spanningCells) {
            // Check if this spanning cell covers the current row
            if (spanCell.startRow < rowIndex && spanCell.startRow + spanCell.rowSpan > rowIndex) {
                for (let c = 0; c < spanCell.colSpan; c++) {
                    occupiedColumns.add(spanCell.columnIndex + c);
                }
            }
        }
    }
    // Render cells
    // Track actual column index separately from cell index
    // because cells with colSpan > 1 span multiple columns
    let x = 0;
    let columnIndex = 0;
    // Skip columns occupied by spanning cells
    while (occupiedColumns.has(columnIndex)) {
        x += (_a = columnWidths[columnIndex]) !== null && _a !== void 0 ? _a : 0;
        columnIndex++;
    }
    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
        const cell = row.cells[cellIndex];
        const cellMeasure = rowMeasure.cells[cellIndex];
        if (!cell || !cellMeasure)
            continue;
        const colSpan = (_b = cell.colSpan) !== null && _b !== void 0 ? _b : 1;
        const rowSpan = (_c = cell.rowSpan) !== null && _c !== void 0 ? _c : 1;
        // Calculate cell height - for spanning cells, use total height of spanned rows
        let cellHeight = rowMeasure.height;
        if (rowSpan > 1 && rowYPositions) {
            cellHeight = 0;
            for (let r = rowIndex; r < rowIndex + rowSpan && r < rowYPositions.length - 1; r++) {
                cellHeight += ((_d = rowYPositions[r + 1]) !== null && _d !== void 0 ? _d : 0) - ((_e = rowYPositions[r]) !== null && _e !== void 0 ? _e : 0);
            }
            // Fallback if rowYPositions doesn't have enough entries
            if (cellHeight === 0) {
                cellHeight = rowMeasure.height * rowSpan;
            }
        }
        const isFirstRow = rowIndex === 0 || isFirstRowInFragment === true;
        const isLastRow = rowIndex + rowSpan >= totalRows;
        const isFirstCol = columnIndex === 0;
        const isLastCol = columnIndex + colSpan >= columnWidths.length;
        const cellEl = renderTableCell(cell, cellMeasure, x, cellHeight, { isFirstRow, isLastRow, isFirstCol, isLastCol }, context, doc, wordCompatClosingBorders === null || wordCompatClosingBorders === void 0 ? void 0 : wordCompatClosingBorders[columnIndex]);
        cellEl.dataset.cellIndex = String(cellIndex);
        cellEl.dataset.columnIndex = String(columnIndex);
        // Store rowSpan info for styling
        if (rowSpan > 1) {
            cellEl.dataset.rowSpan = String(rowSpan);
        }
        rowEl.appendChild(cellEl);
        // Track this cell as spanning if it spans multiple rows
        if (rowSpan > 1 && spanningCells) {
            const key = `${rowIndex}-${columnIndex}`;
            spanningCells.set(key, {
                cell,
                cellMeasure,
                columnIndex,
                startRow: rowIndex,
                rowSpan,
                colSpan,
                x,
                totalHeight: cellHeight,
            });
        }
        // Move x by the width of columns this cell spans
        for (let c = 0; c < colSpan && columnIndex + c < columnWidths.length; c++) {
            x += (_f = columnWidths[columnIndex + c]) !== null && _f !== void 0 ? _f : 0;
        }
        // Advance column index by colSpan
        columnIndex += colSpan;
        // Skip columns occupied by spanning cells
        while (occupiedColumns.has(columnIndex)) {
            x += (_g = columnWidths[columnIndex]) !== null && _g !== void 0 ? _g : 0;
            columnIndex++;
        }
    }
    return rowEl;
}
/**
 * Render a table fragment to DOM
 *
 * @param fragment - The table fragment to render
 * @param block - The full table block
 * @param measure - The full table measure
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The table DOM element
 */
export function renderTableFragment(fragment, block, measure, context, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const doc = (_a = options.document) !== null && _a !== void 0 ? _a : document;
    const tableEl = doc.createElement('div');
    tableEl.className = TABLE_CLASS_NAMES.table;
    // Outer positioning: body's per-page layout uses `absolute` (caller sets
    // x/y via applyFragmentStyles); HF / textbox flow blocks vertically and
    // pass `positioning: 'flow'` so the table participates in normal document
    // flow instead. Pre-PR (#379) those callers had to overwrite the inline
    // style after the renderer call.
    tableEl.style.position = context.positioning === 'flow' ? 'relative' : 'absolute';
    tableEl.style.width = `${fragment.width}px`;
    tableEl.style.height = `${fragment.height}px`;
    tableEl.style.overflow = 'hidden';
    // Store metadata
    tableEl.dataset.blockId = String(fragment.blockId);
    tableEl.dataset.fromRow = String(fragment.fromRow);
    tableEl.dataset.toRow = String(fragment.toRow);
    if (fragment.pmStart !== undefined) {
        tableEl.dataset.pmStart = String(fragment.pmStart);
    }
    if (fragment.pmEnd !== undefined) {
        tableEl.dataset.pmEnd = String(fragment.pmEnd);
    }
    // Add column resize handles at each column boundary
    let handleX = 0;
    for (let col = 0; col < measure.columnWidths.length - 1; col++) {
        handleX += (_b = measure.columnWidths[col]) !== null && _b !== void 0 ? _b : 0;
        const handle = doc.createElement('div');
        handle.className = TABLE_CLASS_NAMES.resizeHandle;
        handle.style.position = 'absolute';
        handle.style.left = `${handleX - 3}px`;
        handle.style.top = '0';
        handle.style.width = '6px';
        handle.style.height = '100%';
        handle.style.cursor = 'col-resize';
        handle.style.zIndex = '10';
        handle.dataset.columnIndex = String(col);
        handle.dataset.tableBlockId = String(fragment.blockId);
        if (fragment.pmStart !== undefined) {
            handle.dataset.tablePmStart = String(fragment.pmStart);
        }
        tableEl.appendChild(handle);
    }
    // Build row Y positions for rowSpan height calculation
    const rowYPositions = [];
    let yPos = 0;
    for (let i = 0; i < measure.rows.length; i++) {
        rowYPositions.push(yPos);
        yPos += (_d = (_c = measure.rows[i]) === null || _c === void 0 ? void 0 : _c.height) !== null && _d !== void 0 ? _d : 0;
    }
    rowYPositions.push(yPos); // Add final position for height calculation
    // Track spanning cells across rows
    const spanningCells = new Map();
    // Word-compat (#395): precompute the firstRow's bottom border per column,
    // off unless context.wordCompat is set. Apply happens in renderTableCell
    // when the cell is in the last body row and has no bottom of its own.
    const wordCompatClosingBorders = context.wordCompat
        ? computeWordCompatClosingBorders(block, measure.columnWidths.length)
        : undefined;
    // Render repeated header rows for continuation fragments
    const headerRowCount = (_e = fragment.headerRowCount) !== null && _e !== void 0 ? _e : 0;
    let y = 0;
    if (headerRowCount > 0 && fragment.continuesFromPrev) {
        for (let hdrIdx = 0; hdrIdx < headerRowCount; hdrIdx++) {
            const hdrRow = block.rows[hdrIdx];
            const hdrRowMeasure = measure.rows[hdrIdx];
            if (!hdrRow || !hdrRowMeasure)
                continue;
            const rowEl = renderTableRow(hdrRow, hdrRowMeasure, hdrIdx, y, measure.columnWidths, block.rows.length, context, doc, spanningCells, rowYPositions, hdrIdx === 0, // first header row draws top border
            wordCompatClosingBorders);
            rowEl.dataset.repeatedHeader = 'true';
            tableEl.appendChild(rowEl);
            y += hdrRowMeasure.height;
        }
    }
    // Render content rows from fragment.fromRow to fragment.toRow
    for (let rowIndex = fragment.fromRow; rowIndex < fragment.toRow; rowIndex++) {
        const row = block.rows[rowIndex];
        const rowMeasure = measure.rows[rowIndex];
        if (!row || !rowMeasure)
            continue;
        // First content row in a continuation fragment with headers should draw top border
        const isFirstRowInFragment = headerRowCount > 0 && fragment.continuesFromPrev
            ? false // header rows already drawn, content rows are not "first"
            : fragment.continuesFromPrev && rowIndex === fragment.fromRow;
        const rowEl = renderTableRow(row, rowMeasure, rowIndex, y, measure.columnWidths, block.rows.length, context, doc, spanningCells, rowYPositions, isFirstRowInFragment, wordCompatClosingBorders);
        tableEl.appendChild(rowEl);
        y += rowMeasure.height;
    }
    // Add row resize handles at each row boundary (between consecutive rows)
    let handleY = 0;
    for (let rowIdx = fragment.fromRow; rowIdx < fragment.toRow; rowIdx++) {
        handleY += (_g = (_f = measure.rows[rowIdx]) === null || _f === void 0 ? void 0 : _f.height) !== null && _g !== void 0 ? _g : 0;
        // Don't add a handle after the last row in this fragment (unless it's the table's last row — that's the bottom edge)
        if (rowIdx < fragment.toRow - 1) {
            const rowHandle = doc.createElement('div');
            rowHandle.className = TABLE_CLASS_NAMES.rowResizeHandle;
            rowHandle.style.position = 'absolute';
            rowHandle.style.left = '0';
            rowHandle.style.top = `${handleY - 3}px`;
            rowHandle.style.width = '100%';
            rowHandle.style.height = '6px';
            rowHandle.style.cursor = 'row-resize';
            rowHandle.style.zIndex = '10';
            rowHandle.dataset.rowIndex = String(rowIdx);
            rowHandle.dataset.tableBlockId = String(fragment.blockId);
            if (fragment.pmStart !== undefined) {
                rowHandle.dataset.tablePmStart = String(fragment.pmStart);
            }
            tableEl.appendChild(rowHandle);
        }
    }
    // Bottom edge handle (only on fragments containing the last row)
    if (fragment.toRow === block.rows.length) {
        const bottomHandle = doc.createElement('div');
        bottomHandle.className = TABLE_CLASS_NAMES.tableEdgeHandleBottom;
        bottomHandle.style.position = 'absolute';
        bottomHandle.style.left = '0';
        bottomHandle.style.top = `${handleY - 3}px`;
        bottomHandle.style.width = '100%';
        bottomHandle.style.height = '6px';
        bottomHandle.style.cursor = 'row-resize';
        bottomHandle.style.zIndex = '10';
        bottomHandle.dataset.rowIndex = String(block.rows.length - 1);
        bottomHandle.dataset.tableBlockId = String(fragment.blockId);
        bottomHandle.dataset.isEdge = 'bottom';
        if (fragment.pmStart !== undefined) {
            bottomHandle.dataset.tablePmStart = String(fragment.pmStart);
        }
        tableEl.appendChild(bottomHandle);
    }
    // Right edge handle (only on fragments containing the last row)
    if (fragment.toRow === block.rows.length) {
        const totalWidth = measure.columnWidths.reduce((w, cw) => w + cw, 0);
        const rightHandle = doc.createElement('div');
        rightHandle.className = TABLE_CLASS_NAMES.tableEdgeHandleRight;
        rightHandle.style.position = 'absolute';
        rightHandle.style.left = `${totalWidth - 3}px`;
        rightHandle.style.top = '0';
        rightHandle.style.width = '6px';
        rightHandle.style.height = '100%';
        rightHandle.style.cursor = 'col-resize';
        rightHandle.style.zIndex = '10';
        rightHandle.dataset.columnIndex = String(measure.columnWidths.length - 1);
        rightHandle.dataset.tableBlockId = String(fragment.blockId);
        rightHandle.dataset.isEdge = 'right';
        if (fragment.pmStart !== undefined) {
            rightHandle.dataset.tablePmStart = String(fragment.pmStart);
        }
        tableEl.appendChild(rightHandle);
    }
    return tableEl;
}
//# sourceMappingURL=renderTable.js.map