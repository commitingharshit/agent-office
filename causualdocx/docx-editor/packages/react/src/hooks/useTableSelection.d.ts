/**
 * useTableSelection Hook
 *
 * Thin React wrapper around the framework-agnostic TableSelectionManager.
 * Provides table selection tracking and table operation dispatch.
 */
import type { Document, Table } from '@eigenpal/docx-core/types/document';
import type { TableContext, TableAction, TableSplitConfig } from '../components/ui/TableToolbar';
export { TABLE_DATA_ATTRIBUTES, findTableFromClick, getTableFromDocument, updateTableInDocument, deleteTableFromDocument, } from '@eigenpal/docx-core';
export type { CellCoordinates } from '@eigenpal/docx-core';
export interface TableSelectionState {
    context: TableContext | null;
    table: Table | null;
    tableIndex: number | null;
    rowIndex: number | null;
    columnIndex: number | null;
}
export interface UseTableSelectionReturn {
    state: TableSelectionState;
    handleCellClick: (tableIndex: number, rowIndex: number, columnIndex: number) => void;
    handleAction: (action: TableAction) => void;
    getSplitCellConfig: () => TableSplitConfig | null;
    applySplitCell: (rows: number, cols: number) => void;
    clearSelection: () => void;
    isCellSelected: (tableIndex: number, rowIndex: number, columnIndex: number) => boolean;
    tableContext: TableContext | null;
}
export interface UseTableSelectionOptions {
    document: Document | null;
    onChange?: (document: Document) => void;
    onSelectionChange?: (context: TableContext | null) => void;
}
export declare function useTableSelection({ document: doc, onChange, onSelectionChange, }: UseTableSelectionOptions): UseTableSelectionReturn;
export default useTableSelection;
//# sourceMappingURL=useTableSelection.d.ts.map