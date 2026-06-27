/**
 * ProseMirror Table Commands — thin re-exports from extension system
 *
 * Table context detection, insert/delete operations, borders, cell styling.
 * All implementations live in extensions/nodes/TableExtension.ts; this file
 * re-exports for backward compatibility.
 */
import { singletonManager } from '../schema';
export { getTableContext, isInTable } from '../extensions/nodes/TableExtension';
// ============================================================================
// COMMANDS — delegated to singleton extension manager
// ============================================================================
const cmds = singletonManager.getCommands();
// Table creation
export function insertTable(rows, cols) {
    return cmds.insertTable(rows, cols);
}
// Row operations
export function addRowAbove(state, dispatch) {
    return cmds.addRowAbove()(state, dispatch);
}
export function addRowBelow(state, dispatch) {
    return cmds.addRowBelow()(state, dispatch);
}
export function deleteRow(state, dispatch) {
    return cmds.deleteRow()(state, dispatch);
}
// Column operations
export function addColumnLeft(state, dispatch) {
    return cmds.addColumnLeft()(state, dispatch);
}
export function addColumnRight(state, dispatch) {
    return cmds.addColumnRight()(state, dispatch);
}
export function deleteColumn(state, dispatch) {
    return cmds.deleteColumn()(state, dispatch);
}
// Table deletion
export function deleteTable(state, dispatch) {
    return cmds.deleteTable()(state, dispatch);
}
// Table selection
export function selectTable(state, dispatch) {
    return cmds.selectTable()(state, dispatch);
}
export function selectRow(state, dispatch) {
    return cmds.selectRow()(state, dispatch);
}
export function selectColumn(state, dispatch) {
    return cmds.selectColumn()(state, dispatch);
}
// Merge/Split — delegated to prosemirror-tables via singleton extension manager
export function mergeCells(state, dispatch) {
    return cmds.mergeCells()(state, dispatch);
}
export function splitCell(state, dispatch) {
    return cmds.splitCell()(state, dispatch);
}
// Dialog-backed split — explicit row/column input
export { getSplitCellDialogConfig, splitActiveTableCell, } from './tableSplit';
// Per-cell border editing
export function setCellBorder(side, spec, clearOthers) {
    return cmds.setCellBorder(side, spec, clearOthers);
}
// Borders
export function setTableBorders(preset, borderSpec) {
    return cmds.setTableBorders(preset, borderSpec);
}
export function removeTableBorders(state, dispatch) {
    return cmds.removeTableBorders()(state, dispatch);
}
export function setAllTableBorders(state, dispatch, borderSpec) {
    return cmds.setAllTableBorders(borderSpec)(state, dispatch);
}
export function setOutsideTableBorders(state, dispatch, borderSpec) {
    return cmds.setOutsideTableBorders(borderSpec)(state, dispatch);
}
export function setInsideTableBorders(state, dispatch, borderSpec) {
    return cmds.setInsideTableBorders(borderSpec)(state, dispatch);
}
// Vertical alignment
export function setCellVerticalAlign(align) {
    return cmds.setCellVerticalAlign(align);
}
// Cell margins
export function setCellMargins(margins) {
    return cmds.setCellMargins(margins);
}
// Text direction
export function setCellTextDirection(direction) {
    return cmds.setCellTextDirection(direction);
}
// No-wrap toggle
export function toggleNoWrap() {
    return cmds.toggleNoWrap();
}
// Row height
export function setRowHeight(height, rule) {
    return cmds.setRowHeight(height, rule);
}
// Header row
export function toggleHeaderRow() {
    return cmds.toggleHeaderRow();
}
// Column distribution
export function distributeColumns() {
    return cmds.distributeColumns();
}
// Row distribution (mirrors distributeColumns; averages row heights
// or falls back to the 360-twip default when no row has an explicit
// height set yet).
export function distributeRows() {
    return cmds.distributeRows();
}
export function autoFitContents() {
    return cmds.autoFitContents();
}
// Force columns to equal width summing to the page content area (B9).
export function autoFitWindow() {
    return cmds.autoFitWindow();
}
// Sort the current table's data rows by the cursor column (header rows
// stay pinned). Reorder only — serializer untouched.
export function sortTable(direction) {
    return cmds.sortTable(direction);
}
// Table properties
export function setTableProperties(props) {
    return cmds.setTableProperties(props);
}
// Table style gallery
export function applyTableStyle(styleData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cmds.applyTableStyle(styleData);
}
// Cell styling
export function setCellFillColor(color) {
    return cmds.setCellFillColor(color);
}
export function setTableBorderColor(color) {
    return cmds.setTableBorderColor(color);
}
export function setTableBorderWidth(size) {
    return cmds.setTableBorderWidth(size);
}
//# sourceMappingURL=table.js.map