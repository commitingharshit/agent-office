/**
 * @internal Helpers for resolving DOCX table-width metadata into pixel widths.
 */
import type { TableBlock } from '../layout-engine';
/**
 * Resolve a DOCX width pair to pixels. `pct` values are 50ths of a percent
 * (ECMA-376 §17.18.111 — 5000 means 100%). `dxa` / `auto` / unset are twips.
 *
 * @internal
 */
export declare function resolveTableWidthPx(value: number | undefined, widthType: string | undefined, parentWidth: number): number | undefined;
/** Total grid columns, derived from the widest row's accumulated colSpans. */
export declare function countTableColumns(tableBlock: TableBlock): number;
/**
 * Make `columnWidths` exactly `colCount` long with every entry positive.
 * Missing trailing columns inherit the average of existing positives; zero
 * or negative entries split the leftover `targetWidth` evenly. Callers
 * scale down totals that exceed the target — this helper only fills gaps.
 */
export declare function normalizeTableColumnWidths(columnWidths: number[], colCount: number, targetWidth: number): number[];
//# sourceMappingURL=tableWidthUtils.d.ts.map