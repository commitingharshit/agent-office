/**
 * Table Renderer
 *
 * Renders table fragments to DOM. Handles:
 * - Multi-row tables split across pages
 * - Cell content (paragraphs within cells)
 * - Column widths and cell spans
 * - Basic cell styling (borders, backgrounds)
 */
import type { TableFragment, TableBlock, TableMeasure } from '../layout-engine/types';
import type { RenderContext } from './renderPage';
/**
 * CSS class names for table elements
 */
export declare const TABLE_CLASS_NAMES: {
    table: string;
    row: string;
    cell: string;
    cellContent: string;
    resizeHandle: string;
    rowResizeHandle: string;
    tableEdgeHandleBottom: string;
    tableEdgeHandleRight: string;
};
/**
 * Options for rendering a table fragment
 */
export interface RenderTableFragmentOptions {
    document?: Document;
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
export declare function renderTableFragment(fragment: TableFragment, block: TableBlock, measure: TableMeasure, context: RenderContext, options?: RenderTableFragmentOptions): HTMLElement;
//# sourceMappingURL=renderTable.d.ts.map