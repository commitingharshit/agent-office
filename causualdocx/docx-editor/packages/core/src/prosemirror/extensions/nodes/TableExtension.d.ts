/**
 * Table Extension — 4 node specs + plugins + commands
 *
 * Uses separate NodeExtension instances for each table node type,
 * plus an Extension for plugins and commands.
 */
import type { Node as PMNode } from 'prosemirror-model';
import { type EditorState } from 'prosemirror-state';
import { type Command } from 'prosemirror-state';
import type { AnyExtension } from '../types';
import type { ColorValue } from '../../../types/colors';
export interface TableContextInfo {
    isInTable: boolean;
    table?: PMNode;
    tablePos?: number;
    rowIndex?: number;
    columnIndex?: number;
    rowCount?: number;
    columnCount?: number;
    hasMultiCellSelection?: boolean;
    canSplitCell?: boolean;
    /** Current cell's dominant border color, if any */
    cellBorderColor?: ColorValue;
    /** Current cell's background/fill color (RGB hex without #), if any */
    cellBackgroundColor?: string;
    /** Current row's isHeader attr — true when the row is pinned to
     * repeat on page breaks (serializes to <w:tblHeader/>). Lets the
     * toolbar show an active/checked state on the "Pin header row"
     * menu item. */
    currentRowIsHeader?: boolean;
}
declare function getTableContext(state: EditorState): TableContextInfo;
declare function isInTableCell(state: EditorState): boolean;
declare function goToNextCell(): Command;
declare function goToPrevCell(): Command;
export declare const TableNodeExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
export declare const TableRowExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
export declare const TableCellExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
export declare const TableHeaderExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
export type BorderPreset = 'all' | 'outside' | 'inside' | 'none';
export declare const TablePluginExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
export declare function createTableExtensions(): AnyExtension[];
export { getTableContext, isInTableCell as isInTable, goToNextCell, goToPrevCell };
//# sourceMappingURL=TableExtension.d.ts.map