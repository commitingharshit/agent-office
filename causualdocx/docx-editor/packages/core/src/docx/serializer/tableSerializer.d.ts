/**
 * Table Serializer - Serialize tables to OOXML XML
 *
 * Converts Table objects back to <w:tbl> XML format for DOCX files.
 * Handles all table, row, and cell properties including merged cells.
 *
 * OOXML Reference:
 * - Table: w:tbl
 * - Table properties: w:tblPr
 * - Table grid: w:tblGrid
 * - Table row: w:tr
 * - Row properties: w:trPr
 * - Table cell: w:tc
 * - Cell properties: w:tcPr
 */
import type { Table, TableRow, TableCell, TableFormatting, TableRowFormatting, TableCellFormatting, TablePropertyChange, TableRowPropertyChange, TableCellPropertyChange, TableStructuralChangeInfo } from '../../types/document';
/**
 * Serialize table formatting properties (w:tblPr)
 */
export declare function serializeTableFormatting(formatting: TableFormatting | undefined, propertyChanges?: TablePropertyChange[]): string;
/**
 * Serialize table row formatting properties (w:trPr)
 */
export declare function serializeTableRowFormatting(formatting: TableRowFormatting | undefined, propertyChanges?: TableRowPropertyChange[], structuralChange?: TableStructuralChangeInfo): string;
/**
 * Serialize table cell formatting properties (w:tcPr)
 */
export declare function serializeTableCellFormatting(formatting: TableCellFormatting | undefined, propertyChanges?: TableCellPropertyChange[], structuralChange?: TableStructuralChangeInfo): string;
/**
 * Serialize a table cell (w:tc)
 */
export declare function serializeTableCell(cell: TableCell): string;
/**
 * Serialize a table row (w:tr)
 */
export declare function serializeTableRow(row: TableRow): string;
/**
 * Serialize a table to OOXML XML (w:tbl)
 *
 * @param table - The table to serialize
 * @returns XML string for the table
 */
export declare function serializeTable(table: Table): string;
/**
 * Serialize multiple tables to OOXML XML
 *
 * @param tables - The tables to serialize
 * @returns XML string for all tables
 */
export declare function serializeTables(tables: Table[]): string;
/**
 * Check if a table has any rows
 */
export declare function hasTableRows(table: Table): boolean;
/**
 * Check if a table has formatting
 */
export declare function hasTableFormatting(table: Table): boolean;
/**
 * Check if a row has any cells
 */
export declare function hasRowCells(row: TableRow): boolean;
/**
 * Check if a row has formatting
 */
export declare function hasRowFormatting(row: TableRow): boolean;
/**
 * Check if a cell has any content
 */
export declare function hasCellContent(cell: TableCell): boolean;
/**
 * Check if a cell has formatting
 */
export declare function hasCellFormatting(cell: TableCell): boolean;
/**
 * Get the number of columns in a table
 */
export declare function getTableColumnCount(table: Table): number;
/**
 * Get the number of rows in a table
 */
export declare function getTableRowCount(table: Table): number;
/**
 * Create an empty table
 */
export declare function createEmptyTable(rows?: number, cols?: number): Table;
/**
 * Create a table cell with text content
 */
export declare function createTextCell(text: string, formatting?: TableCellFormatting): TableCell;
export default serializeTable;
//# sourceMappingURL=tableSerializer.d.ts.map