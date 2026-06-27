/**
 * Layout Engine - Main Entry Point
 *
 * Converts blocks + measures into positioned fragments on pages.
 *
 * @experimental Stable enough for the first-party React adapter, but the
 * API may change in minor releases until a third-party adapter validates
 * it. Pin a version range if you depend on this directly.
 */
import type { FlowBlock, Measure, Layout, LayoutOptions, PageMargins, ColumnLayout, TableMeasure } from './types';
/**
 * Page-flow geometry resolved from a single section's properties.
 * Exported so the React paged editor can reuse the same shape when
 * measuring blocks per section width — keeping pagination and
 * measurement consistent.
 */
export type SectionLayoutConfig = {
    pageSize: {
        w: number;
        h: number;
    };
    margins: PageMargins;
    /** Optional. Sections without explicit columns inherit `{ count: 1 }`. */
    columns?: ColumnLayout;
};
/**
 * Walk `blocks` once and collect per-section geometry. `configs` has one
 * entry per section break plus a trailing `finalConfig`. `breakIndices` is
 * 1-to-1 with the inner break entries (same length as `configs.length - 1`).
 * Callers that need the break `type` can read it from
 * `(blocks[breakIndices[i]] as SectionBreakBlock).type`.
 *
 * @internal
 */
export declare function collectSectionConfigs(blocks: FlowBlock[], initialConfig: SectionLayoutConfig, finalConfig: SectionLayoutConfig): {
    configs: SectionLayoutConfig[];
    breakIndices: number[];
};
/**
 * Layout a document: convert blocks + measures into pages with positioned fragments.
 *
 * Algorithm:
 * 1. Walk blocks in order with their corresponding measures
 * 2. For each block, create appropriate fragment(s)
 * 3. Use paginator to manage page/column state
 * 4. Handle page breaks, section breaks, and keepNext chains
 */
export declare function layoutDocument(blocks: FlowBlock[], measures: Measure[], options?: LayoutOptions): Layout;
/**
 * Calculate total height of header rows from their measures.
 */
export declare function getHeaderRowsHeight(measure: TableMeasure, headerRowCount: number): number;
export * from './types';
export { createPaginator } from './paginator';
export type { PageState, PaginatorOptions, Paginator } from './paginator';
export { computeKeepNextChains, calculateChainHeight, getMidChainIndices, hasKeepLines, hasPageBreakBefore, } from './keep-together';
export type { KeepNextChain } from './keep-together';
export { scheduleSectionBreak, applyPendingToActive, createInitialSectionState, getEffectiveMargins, getEffectivePageSize, getEffectiveColumns, } from './section-breaks';
export type { SectionState, BreakDecision } from './section-breaks';
export type { FootnoteContent } from './types';
export { findPageIndexContainingPmPos } from './findPageIndexContainingPmPos';
//# sourceMappingURL=index.d.ts.map