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
import type { CellCoordinates, TableSelectionSnapshot } from './types';
import type { Document, Table } from '../types/document';
/** Data attributes for table elements in the rendered DOM */
export declare const TABLE_DATA_ATTRIBUTES: {
    readonly TABLE_INDEX: "data-table-index";
    readonly ROW_INDEX: "data-row";
    readonly COLUMN_INDEX: "data-col";
    readonly TABLE_CELL: "data-table-cell";
};
/**
 * Find table cell coordinates from a click target by walking up the DOM
 * and reading data attributes.
 */
export declare function findTableFromClick(target: EventTarget | null, container?: HTMLElement | null): CellCoordinates | null;
/** Get a table from the document by index. */
export declare function getTableFromDocument(doc: Document, tableIndex: number): Table | null;
/** Update a table in the document immutably. */
export declare function updateTableInDocument(doc: Document, tableIndex: number, newTable: Table): Document;
/** Delete a table from the document immutably. */
export declare function deleteTableFromDocument(doc: Document, tableIndex: number): Document;
export declare class TableSelectionManager extends Subscribable<TableSelectionSnapshot> {
    constructor();
    /** Select a specific cell. */
    selectCell(coords: CellCoordinates): void;
    /** Clear the current selection. */
    clearSelection(): void;
    /** Check if a specific cell is selected. */
    isCellSelected(tableIndex: number, rowIndex: number, columnIndex: number): boolean;
    /** Get the currently selected cell coordinates, or null. */
    getSelectedCell(): CellCoordinates | null;
}
//# sourceMappingURL=TableSelectionManager.d.ts.map