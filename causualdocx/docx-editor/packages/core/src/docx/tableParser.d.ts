/**
 * Table Parser - Parse tables with full OOXML structure
 *
 * OOXML tables consist of:
 * - w:tbl - Table element
 * - w:tblPr - Table properties (width, borders, style)
 * - w:tblGrid - Column width definitions
 * - w:tr - Table rows
 * - w:trPr - Row properties (height, header)
 * - w:tc - Table cells
 * - w:tcPr - Cell properties (width, borders, merge)
 *
 * Cell merging:
 * - Horizontal: w:gridSpan (how many grid columns this cell spans)
 * - Vertical: w:vMerge (restart = start of merge, continue = continuation)
 *
 * OOXML Reference:
 * - w:tbl contains w:tblPr, w:tblGrid, and w:tr elements
 * - w:tr contains w:trPr and w:tc elements
 * - w:tc contains w:tcPr and content (paragraphs, tables)
 */
import type { Table, TableRow, TableCell, TableFormatting, TableRowFormatting, TableCellFormatting, TableMeasurement, TableBorders, TableLook, CellMargins, FloatingTableProperties, ConditionalFormatStyle, Theme, BorderSpec, ShadingProperties, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
import { type XmlElement } from './xmlParser';
/**
 * Parse a table measurement (width, height, etc.)
 *
 * @param element - Element with w:w and w:type attributes
 * @returns Parsed measurement or undefined
 */
export declare function parseTableMeasurement(element: XmlElement | null): TableMeasurement | undefined;
/**
 * Parse a single border specification
 *
 * @param element - Border element (w:top, w:bottom, etc.)
 * @returns Parsed border or undefined
 */
export declare function parseBorderSpec(element: XmlElement | null): BorderSpec | undefined;
/**
 * Parse table borders (w:tblBorders or w:tcBorders)
 *
 * @param bordersElement - The borders container element
 * @returns Parsed borders or undefined
 */
export declare function parseTableBorders(bordersElement: XmlElement | null): TableBorders | undefined;
/**
 * Parse cell margins (w:tblCellMar or w:tcMar)
 *
 * @param marginsElement - The margins container element
 * @returns Parsed margins or undefined
 */
export declare function parseCellMargins(marginsElement: XmlElement | null): CellMargins | undefined;
/**
 * Parse shading properties (w:shd)
 *
 * @param shdElement - The w:shd element
 * @returns Parsed shading or undefined
 */
export declare function parseShading(shdElement: XmlElement | null): ShadingProperties | undefined;
/**
 * Parse table look flags (w:tblLook)
 *
 * @param lookElement - The w:tblLook element
 * @returns Parsed table look or undefined
 */
export declare function parseTableLook(lookElement: XmlElement | null): TableLook | undefined;
/**
 * Parse floating table properties (w:tblpPr)
 *
 * @param tblpPrElement - The w:tblpPr element
 * @returns Parsed floating properties or undefined
 */
export declare function parseFloatingTableProperties(tblpPrElement: XmlElement | null): FloatingTableProperties | undefined;
/**
 * Parse table properties (w:tblPr)
 *
 * @param tblPrElement - The w:tblPr element
 * @returns Parsed table formatting
 */
export declare function parseTableProperties(tblPrElement: XmlElement | null): TableFormatting | undefined;
/**
 * Parse table row properties (w:trPr)
 *
 * @param trPrElement - The w:trPr element
 * @returns Parsed row formatting
 */
export declare function parseTableRowProperties(trPrElement: XmlElement | null): TableRowFormatting | undefined;
/**
 * Parse conditional format style (for table style conditional formatting)
 *
 * @param cnfElement - The w:cnfStyle element
 * @returns Parsed conditional format or undefined
 */
export declare function parseConditionalFormatStyle(cnfElement: XmlElement | null): ConditionalFormatStyle | undefined;
/**
 * Parse table cell properties (w:tcPr)
 *
 * @param tcPrElement - The w:tcPr element
 * @returns Parsed cell formatting
 */
export declare function parseTableCellProperties(tcPrElement: XmlElement | null): TableCellFormatting | undefined;
/**
 * Parse a table cell (w:tc)
 *
 * @param tcElement - The w:tc element
 * @param styles - Style definitions
 * @param theme - Theme for color/font resolution
 * @param numbering - Numbering definitions for lists
 * @param rels - Relationships for hyperlinks
 * @param media - Media files for images
 * @returns Parsed table cell
 */
export declare function parseTableCell(tcElement: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels: RelationshipMap | null, media: Map<string, MediaFile> | null, options?: {
    inHeaderFooter?: boolean;
}): TableCell;
/**
 * Parse a table row (w:tr)
 *
 * @param trElement - The w:tr element
 * @param styles - Style definitions
 * @param theme - Theme for color/font resolution
 * @param numbering - Numbering definitions for lists
 * @param rels - Relationships for hyperlinks
 * @param media - Media files for images
 * @returns Parsed table row
 */
export declare function parseTableRow(trElement: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels: RelationshipMap | null, media: Map<string, MediaFile> | null, options?: {
    inHeaderFooter?: boolean;
}): TableRow;
/**
 * Parse table grid (w:tblGrid) for column widths
 *
 * @param tblGridElement - The w:tblGrid element
 * @returns Array of column widths in twips
 */
export declare function parseTableGrid(tblGridElement: XmlElement | null): number[] | undefined;
/**
 * Parse a table element (w:tbl)
 *
 * @param tblElement - The w:tbl element
 * @param styles - Style definitions
 * @param theme - Theme for color/font resolution
 * @param numbering - Numbering definitions for lists
 * @param rels - Relationships for hyperlinks
 * @param media - Media files for images
 * @returns Parsed table
 */
export declare function parseTable(tblElement: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels: RelationshipMap | null, media: Map<string, MediaFile> | null, options?: {
    inHeaderFooter?: boolean;
}): Table;
/**
 * Get the number of columns in a table
 *
 * Uses the table grid if available, otherwise counts cells in first row.
 *
 * @param table - The table to measure
 * @returns Number of columns
 */
export declare function getTableColumnCount(table: Table): number;
/**
 * Get the number of rows in a table
 *
 * @param table - The table to measure
 * @returns Number of rows
 */
export declare function getTableRowCount(table: Table): number;
/**
 * Check if a cell is part of a vertical merge
 *
 * @param cell - The cell to check
 * @returns true if cell continues a vertical merge
 */
export declare function isCellMergeContinuation(cell: TableCell): boolean;
/**
 * Check if a cell starts a vertical merge
 *
 * @param cell - The cell to check
 * @returns true if cell starts a vertical merge
 */
export declare function isCellMergeStart(cell: TableCell): boolean;
/**
 * Check if a cell spans multiple columns
 *
 * @param cell - The cell to check
 * @returns true if cell spans multiple columns
 */
export declare function isCellHorizontallyMerged(cell: TableCell): boolean;
/**
 * Get the plain text content of a table
 *
 * @param table - The table to extract text from
 * @returns Plain text content
 */
export declare function getTableText(table: Table): string;
/**
 * Check if table has header row
 *
 * @param table - The table to check
 * @returns true if first row is marked as header
 */
export declare function hasHeaderRow(table: Table): boolean;
/**
 * Get all header rows from a table
 *
 * @param table - The table to search
 * @returns Array of header rows
 */
export declare function getHeaderRows(table: Table): TableRow[];
/**
 * Check if table is a floating table
 *
 * @param table - The table to check
 * @returns true if table has floating properties
 */
export declare function isFloatingTable(table: Table): boolean;
//# sourceMappingURL=tableParser.d.ts.map