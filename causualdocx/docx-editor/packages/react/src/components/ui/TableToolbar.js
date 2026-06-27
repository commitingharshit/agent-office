import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TableToolbar Component
 *
 * Provides controls for editing tables:
 * - Add row above/below
 * - Add column left/right
 * - Delete row/column
 * - Merge cells
 * - Split cell
 *
 * Shows when cursor is in a table.
 */
import React from 'react';
import { computeSplitLayout, computeSplitDialogDefaults, redistributeColumnWidths, buildAnchorMaps, } from '@eigenpal/docx-core/utils';
import { MaterialSymbol } from './MaterialSymbol';
import { useTranslation } from '../../i18n';
// ============================================================================
// ICONS - Using Material Symbols
// ============================================================================
const ICON_SIZE = 16;
export function AddRowAboveIcon() {
    return _jsx(MaterialSymbol, { name: "table_rows", size: ICON_SIZE, style: { transform: 'scaleY(-1)' } });
}
export function AddRowBelowIcon() {
    return _jsx(MaterialSymbol, { name: "table_rows", size: ICON_SIZE });
}
export function AddColumnLeftIcon() {
    return _jsx(MaterialSymbol, { name: "view_column", size: ICON_SIZE, style: { transform: 'scaleX(-1)' } });
}
export function AddColumnRightIcon() {
    return _jsx(MaterialSymbol, { name: "view_column", size: ICON_SIZE });
}
export function DeleteRowIcon() {
    return _jsx(MaterialSymbol, { name: "delete_sweep", size: ICON_SIZE });
}
export function DeleteColumnIcon() {
    return (_jsx(MaterialSymbol, { name: "delete_sweep", size: ICON_SIZE, style: { transform: 'rotate(90deg)' } }));
}
export function MergeCellsIcon() {
    return _jsx(MaterialSymbol, { name: "call_merge", size: ICON_SIZE });
}
export function SplitCellIcon() {
    return _jsx(MaterialSymbol, { name: "call_split", size: ICON_SIZE });
}
export function DeleteTableIcon() {
    return _jsx(MaterialSymbol, { name: "delete", size: ICON_SIZE, className: "text-red-600" });
}
// ============================================================================
// STYLES
// ============================================================================
const TOOLBAR_STYLES = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: 'var(--doc-bg-subtle)',
        borderRadius: '4px',
        border: '1px solid var(--doc-border)',
        fontSize: '12px',
    },
    containerCompact: {
        padding: '2px 4px',
        gap: '2px',
    },
    containerFloating: {
        position: 'absolute',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    group: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
    },
    separator: {
        width: '1px',
        height: '20px',
        backgroundColor: 'var(--doc-border-dark)',
        margin: '0 4px',
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '4px 8px',
        border: 'none',
        borderRadius: '3px',
        backgroundColor: 'transparent',
        color: 'var(--doc-text)',
        cursor: 'pointer',
        fontSize: '12px',
        lineHeight: '1',
        transition: 'background-color var(--doc-anim-base), color var(--doc-anim-base)',
    },
    buttonCompact: {
        padding: '3px 5px',
    },
    buttonHover: {
        backgroundColor: 'var(--doc-border)',
    },
    buttonDisabled: {
        color: 'var(--doc-text-subtle)',
        cursor: 'not-allowed',
    },
    buttonDelete: {
        color: 'var(--doc-error)',
    },
    label: {
        fontSize: '11px',
        fontWeight: 500,
        color: 'var(--doc-text-muted)',
        marginRight: '8px',
        whiteSpace: 'nowrap',
    },
    hidden: {
        display: 'none',
    },
};
// ============================================================================
// COMPONENTS
// ============================================================================
/**
 * Individual toolbar button
 */
export function TableToolbarButton({ action, label, icon, disabled = false, onClick, showLabel = false, compact = false, shortcut, }) {
    const [isHovered, setIsHovered] = React.useState(false);
    const isDeleteAction = typeof action === 'string' && action.startsWith('delete');
    const buttonStyle = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, TOOLBAR_STYLES.button), (compact ? TOOLBAR_STYLES.buttonCompact : {})), (isHovered && !disabled ? TOOLBAR_STYLES.buttonHover : {})), (disabled ? TOOLBAR_STYLES.buttonDisabled : {})), (isDeleteAction && !disabled ? TOOLBAR_STYLES.buttonDelete : {}));
    const title = shortcut ? `${label} (${shortcut})` : label;
    return (_jsxs("button", { type: "button", className: `docx-table-toolbar-button docx-table-toolbar-${typeof action === 'string' ? action : action.type}`, style: buttonStyle, disabled: disabled, onClick: onClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), title: title, "aria-label": label, children: [icon, showLabel && _jsx("span", { children: label })] }));
}
/**
 * Button group with separator
 */
function ToolbarGroup({ children, showSeparator = true, }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: TOOLBAR_STYLES.group, children: children }), showSeparator && _jsx("div", { style: TOOLBAR_STYLES.separator })] }));
}
/**
 * TableToolbar - Shows table manipulation controls when cursor is in a table
 */
export function TableToolbar({ context, onAction, disabled = false, className, style, showLabels = false, compact = false, position = 'top', children, }) {
    const { t } = useTranslation();
    // Don't render if not in a table
    if (!context) {
        return null;
    }
    const handleAction = (action) => {
        if (!disabled && onAction && context) {
            onAction(action, context);
        }
    };
    // Check if actions are available
    const canDeleteRow = context.rowCount > 1;
    const canDeleteColumn = context.columnCount > 1;
    const canMerge = context.hasMultiCellSelection;
    const canSplit = context.canSplitCell;
    const containerStyle = Object.assign(Object.assign(Object.assign(Object.assign({}, TOOLBAR_STYLES.container), (compact ? TOOLBAR_STYLES.containerCompact : {})), (position === 'floating' ? TOOLBAR_STYLES.containerFloating : {})), style);
    const classNames = ['docx-table-toolbar'];
    if (className) {
        classNames.push(className);
    }
    if (compact) {
        classNames.push('docx-table-toolbar-compact');
    }
    if (position === 'floating') {
        classNames.push('docx-table-toolbar-floating');
    }
    return (_jsxs("div", { className: classNames.join(' '), style: containerStyle, role: "toolbar", "aria-label": t('table.editingTools'), children: [_jsx("span", { style: TOOLBAR_STYLES.label, children: t('table.label') }), _jsxs(ToolbarGroup, { children: [_jsx(TableToolbarButton, { action: "addRowAbove", label: t('table.insertRowAbove'), icon: _jsx(AddRowAboveIcon, {}), disabled: disabled, onClick: () => handleAction('addRowAbove'), showLabel: showLabels, compact: compact }), _jsx(TableToolbarButton, { action: "addRowBelow", label: t('table.insertRowBelow'), icon: _jsx(AddRowBelowIcon, {}), disabled: disabled, onClick: () => handleAction('addRowBelow'), showLabel: showLabels, compact: compact }), _jsx(TableToolbarButton, { action: "deleteRow", label: t('table.deleteRow'), icon: _jsx(DeleteRowIcon, {}), disabled: disabled || !canDeleteRow, onClick: () => handleAction('deleteRow'), showLabel: showLabels, compact: compact })] }), _jsxs(ToolbarGroup, { children: [_jsx(TableToolbarButton, { action: "addColumnLeft", label: t('table.insertColumnLeft'), icon: _jsx(AddColumnLeftIcon, {}), disabled: disabled, onClick: () => handleAction('addColumnLeft'), showLabel: showLabels, compact: compact }), _jsx(TableToolbarButton, { action: "addColumnRight", label: t('table.insertColumnRight'), icon: _jsx(AddColumnRightIcon, {}), disabled: disabled, onClick: () => handleAction('addColumnRight'), showLabel: showLabels, compact: compact }), _jsx(TableToolbarButton, { action: "deleteColumn", label: t('table.deleteColumn'), icon: _jsx(DeleteColumnIcon, {}), disabled: disabled || !canDeleteColumn, onClick: () => handleAction('deleteColumn'), showLabel: showLabels, compact: compact })] }), _jsxs(ToolbarGroup, { showSeparator: false, children: [_jsx(TableToolbarButton, { action: "mergeCells", label: t('table.mergeCells'), icon: _jsx(MergeCellsIcon, {}), disabled: disabled || !canMerge, onClick: () => handleAction('mergeCells'), showLabel: showLabels, compact: compact }), _jsx(TableToolbarButton, { action: "splitCell", label: t('table.splitCell'), icon: _jsx(SplitCellIcon, {}), disabled: disabled || !canSplit, onClick: () => handleAction('splitCell'), showLabel: showLabels, compact: compact }), _jsx(TableToolbarButton, { action: "deleteTable", label: t('table.deleteTable'), icon: _jsx(DeleteTableIcon, {}), disabled: disabled, onClick: () => handleAction('deleteTable'), showLabel: showLabels, compact: compact })] }), children] }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create a table context from a table and selection
 */
export function createTableContext(table, selection) {
    const rowCount = table.rows.length;
    const columnCount = getColumnCount(table);
    // Check if multi-cell selection
    const hasMultiCellSelection = !!(selection.selectedCells &&
        (selection.selectedCells.startRow !== selection.selectedCells.endRow ||
            selection.selectedCells.startCol !== selection.selectedCells.endCol));
    const currentCell = getCellAt(table, selection.rowIndex, selection.columnIndex);
    // Split is available for a single active cell. The UI opens a dialog and
    // applies the requested row/column split explicitly.
    const canSplitCell = !!currentCell && !hasMultiCellSelection;
    return {
        table,
        selection,
        hasMultiCellSelection,
        canSplitCell,
        rowCount,
        columnCount,
    };
}
/**
 * Get column count from a table
 */
export function getColumnCount(table) {
    var _a, _b;
    if (!table.rows.length)
        return 0;
    let maxCols = 0;
    for (const row of table.rows) {
        let colCount = 0;
        for (const cell of row.cells) {
            colCount += (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
        }
        maxCols = Math.max(maxCols, colCount);
    }
    return maxCols;
}
/**
 * Get cell at specific row and column index
 */
export function getCellAt(table, rowIndex, columnIndex) {
    var _a, _b;
    const row = table.rows[rowIndex];
    if (!row)
        return null;
    let currentCol = 0;
    for (const cell of row.cells) {
        const colspan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
        if (columnIndex >= currentCol && columnIndex < currentCol + colspan) {
            return cell;
        }
        currentCol += colspan;
    }
    return null;
}
/**
 * Check if a selection spans multiple cells
 */
export function isMultiCellSelection(selection) {
    if (!selection.selectedCells)
        return false;
    const { startRow, startCol, endRow, endCol } = selection.selectedCells;
    return startRow !== endRow || startCol !== endCol;
}
/**
 * Get the bounds of a selection
 */
export function getSelectionBounds(selection) {
    if (selection.selectedCells) {
        return selection.selectedCells;
    }
    return {
        startRow: selection.rowIndex,
        startCol: selection.columnIndex,
        endRow: selection.rowIndex,
        endCol: selection.columnIndex,
    };
}
/**
 * Check if a cell is within a selection
 */
export function isCellInSelection(rowIndex, colIndex, selection) {
    const bounds = getSelectionBounds(selection);
    return (rowIndex >= bounds.startRow &&
        rowIndex <= bounds.endRow &&
        colIndex >= bounds.startCol &&
        colIndex <= bounds.endCol);
}
/**
 * Create an empty row with the same structure as an existing row
 */
export function createEmptyRow(templateRow, columnCount) {
    var _a, _b;
    const cells = [];
    // Create cells matching the column structure
    let colIndex = 0;
    for (const templateCell of templateRow.cells) {
        const colspan = (_b = (_a = templateCell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
        cells.push({
            type: 'tableCell',
            content: [
                {
                    type: 'paragraph',
                    content: [],
                    formatting: {},
                },
            ],
            formatting: Object.assign(Object.assign({}, templateCell.formatting), { vMerge: undefined }),
        });
        colIndex += colspan;
    }
    // If template row has fewer columns, add more cells
    while (colIndex < columnCount) {
        cells.push({
            type: 'tableCell',
            content: [
                {
                    type: 'paragraph',
                    content: [],
                    formatting: {},
                },
            ],
            formatting: {},
        });
        colIndex++;
    }
    return {
        type: 'tableRow',
        cells,
        formatting: Object.assign(Object.assign({}, templateRow.formatting), { header: false }),
    };
}
/**
 * Create an empty cell
 */
export function createEmptyCell() {
    return {
        type: 'tableCell',
        content: [
            {
                type: 'paragraph',
                content: [],
                formatting: {},
            },
        ],
        formatting: {},
    };
}
// ---------------------------------------------------------------------------
// Document-model table anchor collection
// ---------------------------------------------------------------------------
function getRowCellStartingAt(row, targetCol) {
    var _a, _b;
    let currentCol = 0;
    for (const cell of row.cells) {
        const colspan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
        if (currentCol === targetCol) {
            return cell;
        }
        currentCol += colspan;
    }
    return null;
}
function collectDocumentTableAnchors(table) {
    var _a, _b, _c, _d, _e;
    const anchors = [];
    let totalCols = 0;
    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
        const row = table.rows[rowIndex];
        let colIndex = 0;
        for (const cell of row.cells) {
            const colspan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
            if (((_c = cell.formatting) === null || _c === void 0 ? void 0 : _c.vMerge) !== 'continue') {
                let rowspan = 1;
                if (((_d = cell.formatting) === null || _d === void 0 ? void 0 : _d.vMerge) === 'restart') {
                    for (let nextRow = rowIndex + 1; nextRow < table.rows.length; nextRow++) {
                        const continuation = getRowCellStartingAt(table.rows[nextRow], colIndex);
                        if (!continuation || ((_e = continuation.formatting) === null || _e === void 0 ? void 0 : _e.vMerge) !== 'continue')
                            break;
                        rowspan += 1;
                    }
                }
                anchors.push({ data: cell, row: rowIndex, col: colIndex, rowspan, colspan });
            }
            colIndex += colspan;
            totalCols = Math.max(totalCols, colIndex);
        }
    }
    return { anchors, totalCols };
}
// ---------------------------------------------------------------------------
// Document-model cell formatting helpers
// ---------------------------------------------------------------------------
function toAnchorCellFormatting(cell, colspan, rowspan) {
    var _a;
    const formatting = Object.assign({}, ((_a = cell.formatting) !== null && _a !== void 0 ? _a : {}));
    if (colspan > 1)
        formatting.gridSpan = colspan;
    else
        delete formatting.gridSpan;
    if (rowspan > 1)
        formatting.vMerge = 'restart';
    else
        delete formatting.vMerge;
    return Object.keys(formatting).length ? formatting : undefined;
}
function toContinuationFormatting(cell, colspan) {
    var _a;
    const formatting = Object.assign({}, ((_a = cell.formatting) !== null && _a !== void 0 ? _a : {}));
    if (colspan > 1)
        formatting.gridSpan = colspan;
    else
        delete formatting.gridSpan;
    formatting.vMerge = 'continue';
    return formatting;
}
// ---------------------------------------------------------------------------
// Dialog config + split — delegates to shared algorithm
// ---------------------------------------------------------------------------
export function getTableSplitCellDialogConfig(table, rowIndex, columnIndex) {
    const { anchors } = collectDocumentTableAnchors(table);
    const anchor = anchors.find((a) => rowIndex >= a.row &&
        rowIndex < a.row + a.rowspan &&
        columnIndex >= a.col &&
        columnIndex < a.col + a.colspan);
    if (!anchor)
        return null;
    return computeSplitDialogDefaults(anchor.rowspan, anchor.colspan);
}
export function splitTableCell(table, rowIndex, columnIndex, rows, cols) {
    if (rows < 1 || cols < 1)
        return table;
    const { anchors, totalCols } = collectDocumentTableAnchors(table);
    const target = anchors.find((a) => rowIndex >= a.row &&
        rowIndex < a.row + a.rowspan &&
        columnIndex >= a.col &&
        columnIndex < a.col + a.colspan);
    if (!target)
        return table;
    if (rows < target.rowspan || cols < target.colspan)
        return table;
    if (rows === 1 && cols === 1)
        return table;
    const existing = table.columnWidths && table.columnWidths.length > 0
        ? [...table.columnWidths]
        : Array.from({ length: totalCols }, () => 1440);
    const newColumnWidths = redistributeColumnWidths(existing, target.col, target.colspan, cols);
    const layout = computeSplitLayout(anchors, target, rows, cols, table.rows.length, (isOriginal) => {
        if (isOriginal) {
            return Object.assign(Object.assign({}, target.data), { formatting: toAnchorCellFormatting(target.data, 1, 1) });
        }
        return {
            type: 'tableCell',
            content: [{ type: 'paragraph', content: [], formatting: {} }],
            formatting: toAnchorCellFormatting(target.data, 1, 1),
        };
    });
    const { byStart, byCoveredSlot } = buildAnchorMaps(layout.anchors);
    const targetRowEnd = target.row + target.rowspan;
    const newColCount = totalCols + layout.deltaCols;
    const newRows = [];
    for (let row = 0; row < layout.newRowCount; row++) {
        const sourceRow = row < targetRowEnd
            ? table.rows[row]
            : row < target.row + rows
                ? table.rows[targetRowEnd - 1]
                : table.rows[row - layout.deltaRows];
        const cells = [];
        for (let col = 0; col < newColCount;) {
            const anchor = byStart.get(`${row}-${col}`);
            if (anchor) {
                cells.push(Object.assign(Object.assign({}, anchor.data), { formatting: toAnchorCellFormatting(anchor.data, anchor.colspan, anchor.rowspan) }));
                col += anchor.colspan;
                continue;
            }
            const coveringAnchor = byCoveredSlot.get(`${row}-${col}`);
            if (!coveringAnchor) {
                col += 1;
                continue;
            }
            cells.push(Object.assign(Object.assign({}, coveringAnchor.data), { content: [], formatting: toContinuationFormatting(coveringAnchor.data, coveringAnchor.colspan) }));
            col += coveringAnchor.colspan;
        }
        newRows.push({
            type: 'tableRow',
            formatting: (sourceRow === null || sourceRow === void 0 ? void 0 : sourceRow.formatting) ? Object.assign({}, sourceRow.formatting) : undefined,
            cells,
        });
    }
    return Object.assign(Object.assign({}, table), { rows: newRows, columnWidths: newColumnWidths });
}
/**
 * Add a row to a table at the specified index
 */
export function addRow(table, atIndex, position = 'after') {
    const newRows = [...table.rows];
    const insertIndex = position === 'before' ? atIndex : atIndex + 1;
    const templateRow = table.rows[atIndex] || table.rows[0];
    const columnCount = getColumnCount(table);
    const newRow = createEmptyRow(templateRow, columnCount);
    newRows.splice(insertIndex, 0, newRow);
    return Object.assign(Object.assign({}, table), { rows: newRows });
}
/**
 * Delete a row from a table
 */
export function deleteRow(table, rowIndex) {
    if (table.rows.length <= 1) {
        return table; // Don't delete the last row
    }
    const newRows = table.rows.filter((_, index) => index !== rowIndex);
    return Object.assign(Object.assign({}, table), { rows: newRows });
}
/**
 * Add a column to a table at the specified index
 */
export function addColumn(table, atIndex, position = 'after') {
    const insertIndex = position === 'before' ? atIndex : atIndex + 1;
    const newRows = table.rows.map((row) => {
        var _a, _b;
        const newCells = [...row.cells];
        // Find the cell at the column index and insert a new cell
        let currentCol = 0;
        let insertCellIndex = 0;
        for (let i = 0; i < row.cells.length; i++) {
            const cell = row.cells[i];
            const colspan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
            if (insertIndex <= currentCol + colspan) {
                insertCellIndex = position === 'before' ? i : i + 1;
                break;
            }
            currentCol += colspan;
            insertCellIndex = i + 1;
        }
        newCells.splice(insertCellIndex, 0, createEmptyCell());
        return Object.assign(Object.assign({}, row), { cells: newCells });
    });
    // Update column widths if present
    let newColumnWidths = table.columnWidths;
    if (table.columnWidths && table.columnWidths.length > 0) {
        newColumnWidths = [...table.columnWidths];
        const templateWidth = table.columnWidths[atIndex] || table.columnWidths[0] || 1440; // Default 1 inch
        newColumnWidths.splice(insertIndex, 0, templateWidth);
    }
    return Object.assign(Object.assign({}, table), { rows: newRows, columnWidths: newColumnWidths });
}
/**
 * Delete a column from a table
 */
export function deleteColumn(table, columnIndex) {
    const columnCount = getColumnCount(table);
    if (columnCount <= 1) {
        return table; // Don't delete the last column
    }
    const newRows = table.rows.map((row) => {
        var _a, _b;
        let currentCol = 0;
        const newCells = [];
        for (const cell of row.cells) {
            const colspan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
            // Check if this cell spans the column to delete
            if (columnIndex >= currentCol && columnIndex < currentCol + colspan) {
                if (colspan > 1) {
                    // Reduce gridSpan by 1
                    newCells.push(Object.assign(Object.assign({}, cell), { formatting: Object.assign(Object.assign({}, cell.formatting), { gridSpan: colspan - 1 }) }));
                }
                // If colspan is 1, skip this cell (delete it)
            }
            else {
                newCells.push(cell);
            }
            currentCol += colspan;
        }
        return Object.assign(Object.assign({}, row), { cells: newCells });
    });
    // Update column widths if present
    let newColumnWidths = table.columnWidths;
    if (table.columnWidths && table.columnWidths.length > columnIndex) {
        newColumnWidths = table.columnWidths.filter((_, i) => i !== columnIndex);
    }
    return Object.assign(Object.assign({}, table), { rows: newRows, columnWidths: newColumnWidths });
}
/**
 * Merge cells in a selection
 */
export function mergeCells(table, selection) {
    if (!selection.selectedCells) {
        return table;
    }
    const { startRow, startCol, endRow, endCol } = selection.selectedCells;
    const rowSpan = endRow - startRow + 1;
    const colSpan = endCol - startCol + 1;
    // Create new rows with merged cell
    const newRows = table.rows.map((row, rowIndex) => {
        var _a, _b;
        if (rowIndex < startRow || rowIndex > endRow) {
            return row;
        }
        const newCells = [];
        let currentCol = 0;
        for (const cell of row.cells) {
            const cellColSpan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
            const cellEndCol = currentCol + cellColSpan - 1;
            // Check if this cell is in the selection
            const inSelection = currentCol <= endCol && cellEndCol >= startCol;
            if (!inSelection) {
                newCells.push(cell);
            }
            else if (rowIndex === startRow && currentCol === startCol) {
                // This is the top-left cell - it becomes the merged cell
                newCells.push(Object.assign(Object.assign({}, cell), { formatting: Object.assign(Object.assign({}, cell.formatting), { gridSpan: colSpan, vMerge: rowSpan > 1 ? 'restart' : undefined }) }));
            }
            else if (rowIndex > startRow && currentCol === startCol) {
                // Cells below the first row in merge area
                newCells.push(Object.assign(Object.assign({}, cell), { formatting: Object.assign(Object.assign({}, cell.formatting), { gridSpan: colSpan, vMerge: 'continue' }) }));
            }
            // Skip other cells in the selection
            currentCol += cellColSpan;
        }
        return Object.assign(Object.assign({}, row), { cells: newCells });
    });
    return Object.assign(Object.assign({}, table), { rows: newRows });
}
/**
 * Backward-compatible helper for callers that still use the older merged-cell
 * split behavior directly.
 *
 * User-facing Split cell is now dialog-driven. For document-model tables, use
 * `getTableSplitCellDialogConfig()` and `splitTableCell()` instead.
 */
export function splitCell(table, rowIndex, columnIndex) {
    var _a, _b, _c;
    const cell = getCellAt(table, rowIndex, columnIndex);
    if (!cell)
        return table;
    const gridSpan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
    const isVMergeStart = ((_c = cell.formatting) === null || _c === void 0 ? void 0 : _c.vMerge) === 'restart';
    if (gridSpan <= 1 && !isVMergeStart) {
        return table; // Nothing to split
    }
    const newRows = table.rows.map((row, rIndex) => {
        var _a, _b, _c;
        if (rIndex !== rowIndex && !isVMergeStart) {
            return row;
        }
        const newCells = [];
        let currentCol = 0;
        for (const rowCell of row.cells) {
            const cellColSpan = (_b = (_a = rowCell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
            if (currentCol === columnIndex ||
                (currentCol <= columnIndex && columnIndex < currentCol + cellColSpan)) {
                // This is the cell to split
                if (gridSpan > 1) {
                    // Split horizontally
                    for (let i = 0; i < gridSpan; i++) {
                        newCells.push({
                            type: 'tableCell',
                            content: i === 0
                                ? rowCell.content
                                : [{ type: 'paragraph', content: [], formatting: {} }],
                            formatting: Object.assign(Object.assign({}, rowCell.formatting), { gridSpan: undefined, vMerge: undefined }),
                        });
                    }
                }
                else if (isVMergeStart && rIndex === rowIndex) {
                    // Remove vMerge from this cell
                    newCells.push(Object.assign(Object.assign({}, rowCell), { formatting: Object.assign(Object.assign({}, rowCell.formatting), { vMerge: undefined }) }));
                }
                else if (((_c = rowCell.formatting) === null || _c === void 0 ? void 0 : _c.vMerge) === 'continue') {
                    // This row was part of vMerge - restore as regular cell
                    newCells.push({
                        type: 'tableCell',
                        content: [{ type: 'paragraph', content: [], formatting: {} }],
                        formatting: Object.assign(Object.assign({}, rowCell.formatting), { vMerge: undefined }),
                    });
                }
                else {
                    newCells.push(rowCell);
                }
            }
            else {
                newCells.push(rowCell);
            }
            currentCol += cellColSpan;
        }
        return Object.assign(Object.assign({}, row), { cells: newCells });
    });
    return Object.assign(Object.assign({}, table), { rows: newRows });
}
/**
 * Get action label for display
 */
export function getActionLabel(action) {
    if (typeof action === 'object') {
        if (action.type === 'cellFillColor')
            return 'Cell Fill Color';
        if (action.type === 'borderColor')
            return 'Border Color';
        return 'Unknown Action';
    }
    const labels = {
        addRowAbove: 'Insert Row Above',
        addRowBelow: 'Insert Row Below',
        addColumnLeft: 'Insert Column Left',
        addColumnRight: 'Insert Column Right',
        deleteRow: 'Delete Row',
        deleteColumn: 'Delete Column',
        mergeCells: 'Merge Cells',
        splitCell: 'Split Cell',
        deleteTable: 'Delete Table',
        selectTable: 'Select Table',
        selectRow: 'Select Row',
        selectColumn: 'Select Column',
        borderAll: 'All Borders',
        borderOutside: 'Outside Borders',
        borderInside: 'Inside Borders',
        borderNone: 'No Borders',
        borderTop: 'Top Border',
        borderBottom: 'Bottom Border',
        borderLeft: 'Left Border',
        borderRight: 'Right Border',
    };
    return labels[action];
}
/**
 * Check if an action is a delete action
 */
export function isDeleteAction(action) {
    return (typeof action === 'string' &&
        (action === 'deleteRow' || action === 'deleteColumn' || action === 'deleteTable'));
}
/**
 * Handle keyboard shortcuts for table actions
 */
export function handleTableShortcut(_event, context) {
    if (!context)
        return null;
    // No default keyboard shortcuts defined for table operations
    // This function can be extended to add shortcuts like:
    // - Ctrl+Shift+R for add row
    // - Ctrl+Shift+C for add column
    // etc.
    return null;
}
export default TableToolbar;
//# sourceMappingURL=TableToolbar.js.map