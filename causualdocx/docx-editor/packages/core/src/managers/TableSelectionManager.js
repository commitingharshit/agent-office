/**
 * TableSelectionManager
 *
 * Framework-agnostic class for managing table cell selection state.
 * Extracted from the React `useTableSelection` hook.
 *
 * Handles:
 * - Cell selection via data-attribute queries on the DOM
 * - Table document operations (add/delete rows/columns, merge/split)
 */
import { Subscribable } from './Subscribable';
// ============================================================================
// CONSTANTS
// ============================================================================
/** Data attributes for table elements in the rendered DOM */
export const TABLE_DATA_ATTRIBUTES = {
    TABLE_INDEX: 'data-table-index',
    ROW_INDEX: 'data-row',
    COLUMN_INDEX: 'data-col',
    TABLE_CELL: 'data-table-cell',
};
// ============================================================================
// HELPER FUNCTIONS (framework-agnostic DOM queries)
// ============================================================================
/**
 * Find table cell coordinates from a click target by walking up the DOM
 * and reading data attributes.
 */
export function findTableFromClick(target, container) {
    if (!(target instanceof Element))
        return null;
    let current = target;
    while (current && current !== container) {
        if (current.tagName === 'TD' || current.tagName === 'TH') {
            const rowAttr = current.getAttribute(TABLE_DATA_ATTRIBUTES.ROW_INDEX);
            const colAttr = current.getAttribute(TABLE_DATA_ATTRIBUTES.COLUMN_INDEX);
            if (rowAttr !== null && colAttr !== null) {
                let tableElement = current;
                while (tableElement && tableElement !== container) {
                    if (tableElement.tagName === 'TABLE') {
                        const tableIndexAttr = tableElement.getAttribute(TABLE_DATA_ATTRIBUTES.TABLE_INDEX);
                        if (tableIndexAttr !== null) {
                            return {
                                tableIndex: parseInt(tableIndexAttr, 10),
                                rowIndex: parseInt(rowAttr, 10),
                                columnIndex: parseInt(colAttr, 10),
                            };
                        }
                        break;
                    }
                    tableElement = tableElement.parentElement;
                }
            }
            break;
        }
        current = current.parentElement;
    }
    return null;
}
/** Get a table from the document by index. */
export function getTableFromDocument(doc, tableIndex) {
    var _a, _b;
    if (!((_b = (_a = doc.package) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.content))
        return null;
    let currentTableIndex = 0;
    for (const block of doc.package.document.content) {
        if (block.type === 'table') {
            if (currentTableIndex === tableIndex) {
                return block;
            }
            currentTableIndex++;
        }
    }
    return null;
}
/** Update a table in the document immutably. */
export function updateTableInDocument(doc, tableIndex, newTable) {
    var _a, _b;
    if (!((_b = (_a = doc.package) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.content))
        return doc;
    let currentTableIndex = 0;
    const newContent = doc.package.document.content.map((block) => {
        if (block.type === 'table') {
            if (currentTableIndex === tableIndex) {
                currentTableIndex++;
                return newTable;
            }
            currentTableIndex++;
        }
        return block;
    });
    return Object.assign(Object.assign({}, doc), { package: Object.assign(Object.assign({}, doc.package), { document: Object.assign(Object.assign({}, doc.package.document), { content: newContent }) }) });
}
/** Delete a table from the document immutably. */
export function deleteTableFromDocument(doc, tableIndex) {
    var _a, _b;
    if (!((_b = (_a = doc.package) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.content))
        return doc;
    let currentTableIndex = 0;
    const newContent = doc.package.document.content.filter((block) => {
        if (block.type === 'table') {
            const shouldDelete = currentTableIndex === tableIndex;
            currentTableIndex++;
            return !shouldDelete;
        }
        return true;
    });
    return Object.assign(Object.assign({}, doc), { package: Object.assign(Object.assign({}, doc.package), { document: Object.assign(Object.assign({}, doc.package.document), { content: newContent }) }) });
}
// ============================================================================
// MANAGER
// ============================================================================
export class TableSelectionManager extends Subscribable {
    constructor() {
        super({ selectedCell: null });
    }
    /** Select a specific cell. */
    selectCell(coords) {
        this.setSnapshot({ selectedCell: coords });
    }
    /** Clear the current selection. */
    clearSelection() {
        this.setSnapshot({ selectedCell: null });
    }
    /** Check if a specific cell is selected. */
    isCellSelected(tableIndex, rowIndex, columnIndex) {
        const { selectedCell } = this.getSnapshot();
        if (!selectedCell)
            return false;
        return (selectedCell.tableIndex === tableIndex &&
            selectedCell.rowIndex === rowIndex &&
            selectedCell.columnIndex === columnIndex);
    }
    /** Get the currently selected cell coordinates, or null. */
    getSelectedCell() {
        return this.getSnapshot().selectedCell;
    }
}
//# sourceMappingURL=TableSelectionManager.js.map