/**
 * Layout Bridge — measure, hit-test, and map between PM positions and pixels.
 *
 * @experimental Internal layer between the layout engine and rendering.
 * The named exports below are the public contract for adapter authors,
 * but the API is still evolving and may change in minor releases until
 * a third-party adapter validates it.
 */
export { toFlowBlocks, resolveListTemplate, resetBlockIdCounter, convertBorderSpecToLayout, } from './toFlowBlocks';
export type { ToFlowBlocksOptions } from './toFlowBlocks';
export { resolveTableWidthPx, countTableColumns, normalizeTableColumnWidths, } from './tableWidthUtils';
export * from './measuring';
export { hitTest, hitTestPage, hitTestFragment, hitTestImageFragment, hitTestTableCell, getPageTop, getPageIndexAtY, getTotalDocumentHeight, getScrollYForPage, getPageBounds, } from './hitTest';
export type { Point, PageHit, FragmentHit, TableCellHit, HitTestResult } from './hitTest';
export { clickToPosition, clickToPositionInParagraph, clickToPositionInTableCell, positionToX, getPositionRect, } from './clickToPosition';
export type { PositionResult } from './clickToPosition';
export { clickToPositionDom as mouseToPosition, clickToPositionDom, getSelectionRectsFromDom, getCaretPositionFromDom, } from './clickToPositionDom';
export type { DomSelectionRect, DomCaretPosition } from './clickToPositionDom';
export { selectionToRects, getCaretPosition, isMultiPageSelection, groupRectsByPage, } from './selectionRects';
export type { SelectionRect, CaretPosition } from './selectionRects';
export { collectFootnoteRefs, mapFootnotesToPages, calculateFootnoteReservedHeights, applyFootnotePresentation, convertFootnoteToContent, buildFootnoteContentMap, } from './footnoteLayout';
export type { MeasureBlocksFn, ConvertFootnoteOptions } from './footnoteLayout';
export { normalizeHeaderFooterMeasureBlocks, resolveHeaderFooterVisualTop, calculateHeaderFooterVisualBounds, convertHeaderFooterToContent, } from './headerFooterLayout';
export type { HeaderFooterMetrics, ConvertHeaderFooterOptions } from './headerFooterLayout';
export { detectTableInsertHover, TABLE_INSERT_EDGE_PROXIMITY, TABLE_INSERT_HIDE_DELAY_MS, } from './tableInsertHover';
export type { TableInsertHoverHit, TableInsertHoverInput } from './tableInsertHover';
export { findBodyPmSpans, findBodyEmptyRuns, findBodyPmAnchors, findBodyPmAnchor, findHeaderFooterPmAnchor, } from './findBodyPmSpans';
//# sourceMappingURL=index.d.ts.map