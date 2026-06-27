import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PagedEditor Component
 *
 * Main paginated editing component that integrates:
 * - HiddenProseMirror: off-screen editor for keyboard input
 * - Layout engine: computes page layout from PM state
 * - DOM painter: renders pages to visible DOM
 * - Selection overlay: renders caret and selection highlights
 *
 * Architecture:
 * 1. User clicks on visible pages → hit test → update PM selection
 * 2. User types → hidden PM receives input → PM transaction
 * 3. PM transaction → convert to blocks → measure → layout → paint
 * 4. Selection changes → compute rects → update overlay
 */
import { useRef, useState, useCallback, useEffect, useLayoutEffect, useMemo, forwardRef, useImperativeHandle, memo, } from 'react';
import { NodeSelection, TextSelection } from 'prosemirror-state';
// Internal components
import { HiddenProseMirror } from './HiddenProseMirror';
import { SelectionOverlay } from './SelectionOverlay';
import { MobileFormatBar } from '../components/ui/MobileFormatBar';
import { usePinchZoom } from '../components/hooks/usePinchZoom';
import { ImageSelectionOverlay } from './ImageSelectionOverlay';
import { EndnoteSection } from './EndnoteSection';
import { DecorationLayer } from './DecorationLayer';
import { spellcheckPluginKey } from '@eigenpal/docx-core/prosemirror/extensions';
import { getTableContext } from '@eigenpal/docx-core/prosemirror';
// Layout engine
import { layoutDocument, findPageIndexContainingPmPos, collectSectionConfigs, } from '@eigenpal/docx-core/layout-engine';
import { DEFAULT_TEXTBOX_MARGINS, DEFAULT_TEXTBOX_WIDTH } from '@eigenpal/docx-core/layout-engine';
// Table commands (for quick-action insert buttons)
import { addRowBelow, addColumnRight, findStartPosForParaId, } from '@eigenpal/docx-core/prosemirror';
// Layout bridge
import { toFlowBlocks } from '@eigenpal/docx-core/layout-bridge';
import { hitTestImage, captureInlinePositionEmu } from '@eigenpal/docx-core/layout-painter';
import { measureParagraph, resetCanvasContext, clearAllCaches, getCachedParagraphMeasure, setCachedParagraphMeasure, resolveTableWidthPx, countTableColumns, normalizeTableColumnWidths, } from '@eigenpal/docx-core/layout-bridge';
import { hitTestFragment, hitTestTableCell, getPageTop } from '@eigenpal/docx-core/layout-bridge';
import { clickToPosition } from '@eigenpal/docx-core/layout-bridge';
import { clickToPositionDom } from '@eigenpal/docx-core/layout-bridge';
import { findBodyEmptyRuns, findBodyPmAnchor, findBodyPmAnchors, findBodyPmSpans, findHeaderFooterPmAnchor, } from '@eigenpal/docx-core/layout-bridge';
import { selectionToRects, getCaretPosition, } from '@eigenpal/docx-core/layout-bridge';
import { findWordBoundaries } from '@eigenpal/docx-core/utils';
import { emuToPixels, pixelsToEmu } from '@eigenpal/docx-core/utils';
// Layout painter
import { LayoutPainter } from '@eigenpal/docx-core/layout-painter';
import { renderPages, isTextWrappingFloatingImageRun, } from '@eigenpal/docx-core/layout-painter';
// Selection sync
import { LayoutSelectionGate } from './LayoutSelectionGate';
// Visual line navigation hook
import { useVisualLineNavigation } from './useVisualLineNavigation';
import { useDragAutoScroll } from './useDragAutoScroll';
// Sidebar constants
import { SIDEBAR_DOCUMENT_SHIFT } from '../components/sidebar/constants';
import { getFootnoteText } from '@eigenpal/docx-core/docx';
import { collectFootnoteRefs, mapFootnotesToPages, calculateFootnoteReservedHeights, buildFootnoteContentMap, convertHeaderFooterToContent, detectTableInsertHover, TABLE_INSERT_HIDE_DELAY_MS as TABLE_INSERT_HIDE_DELAY, } from '@eigenpal/docx-core/layout-bridge';
import { createRenderedDomContext } from '../plugin-api/RenderedDomContext';
import { findVerticalScrollParentOrRoot } from './findVerticalScrollParent';
/**
 * Vertically scroll `container` so `el`'s center aligns with the container's visible center.
 * Avoids `element.scrollIntoView()` — it misbehaves when content sits under CSS `transform`
 * (e.g. zoom viewport); see `useVisualLineNavigation` scrollIntoViewIfNeeded comment.
 */
function scrollElementCenterIntoContainer(el, container, behavior) {
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const elCenter = eRect.top + eRect.height / 2;
    const cCenter = cRect.top + cRect.height / 2;
    const delta = elCenter - cCenter;
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const targetTop = Math.max(0, Math.min(maxScroll, container.scrollTop + delta));
    if (behavior === 'smooth') {
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
    else {
        container.scrollTop = targetTop;
    }
}
/**
 * Run `fn` after layout/paint has settled (3 nested rAFs). Aborts if `signal`
 * fires before any of the frames runs, and tracks rAF ids so they can be
 * cancelled by the caller. Used for the virtualized-paint settle path in
 * scrollToPositionImpl / scrollToParaIdImpl.
 */
function runAfterPaint(fn, signal) {
    if (signal.aborted)
        return;
    const id1 = requestAnimationFrame(() => {
        if (signal.aborted)
            return;
        const id2 = requestAnimationFrame(() => {
            if (signal.aborted)
                return;
            const id3 = requestAnimationFrame(() => {
                if (signal.aborted)
                    return;
                fn();
            });
            signal.addEventListener('abort', () => cancelAnimationFrame(id3), { once: true });
        });
        signal.addEventListener('abort', () => cancelAnimationFrame(id2), { once: true });
    });
    signal.addEventListener('abort', () => cancelAnimationFrame(id1), { once: true });
}
/**
 * Largest painted body `[data-pm-start]` value ≤ `pmPos`. Used to anchor scroll
 * restore when `renderPages` rebuilds the DOM. Header/footer anchors are skipped
 * because their PM positions live in a separate document and would mis-resolve.
 */
function findPaintedPmStartAtOrBefore(pages, pmPos) {
    let best = null;
    const list = findBodyPmAnchors(pages);
    for (let i = 0; i < list.length; i++) {
        const raw = list[i].dataset.pmStart;
        if (raw == null)
            continue;
        const p = Number(raw);
        if (Number.isNaN(p))
            continue;
        if (p <= pmPos && (best === null || p > best))
            best = p;
    }
    return best;
}
/** Min-height of the zoom/viewport wrapper (padding + page stack). Must match JSX `totalHeight`. */
function viewportMinHeightPx(layout, pageGap) {
    const n = layout.pages.length;
    const pagesHeight = layout.pages.reduce((sum, page) => sum + page.size.h, 0);
    return pagesHeight + Math.max(0, n - 1) * pageGap + VIEWPORT_PADDING_TOP + 24;
}
// =============================================================================
// CONSTANTS
// =============================================================================
// Default page size (US Letter at 96 DPI)
export const DEFAULT_PAGE_WIDTH = 816;
const DEFAULT_PAGE_HEIGHT = 1056;
// Default margins (1 inch at 96 DPI)
const DEFAULT_MARGINS = {
    top: 96,
    right: 96,
    bottom: 96,
    left: 96,
};
const DEFAULT_PAGE_GAP = 24;
// Table-insert hover constants live in core (`@eigenpal/docx-core/layout-
// bridge`) so React + Vue share the same hit-test parameters.
// Stable empty array to avoid re-creating on each render
const EMPTY_PLUGINS = [];
// =============================================================================
// STYLES
// =============================================================================
const containerStyles = {
    position: 'relative',
    width: '100%',
    minHeight: '100%',
    overflow: 'visible',
    backgroundColor: 'var(--doc-bg, #f8f9fa)',
};
/** Padding above page content in the viewport div. */
const VIEWPORT_PADDING_TOP = 24;
const viewportStyles = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: VIEWPORT_PADDING_TOP,
    paddingBottom: 24,
    overflowAnchor: 'none',
};
const pagesContainerStyles = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowAnchor: 'none',
};
const pluginOverlaysStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: 8,
};
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Compute anchor Y positions for comments/tracked-changes sidebar.
 * Uses getCaretPosition for paragraphs/images; for table content, finds
 * the containing fragment and drills into rows for exact Y offset.
 * Returns a Map of "comment-{id}" / "revision-{revisionId}" → scroll-container Y.
 */
function computeAnchorPositions(pmView, layout, blocks, measures, renderedPageGap) {
    const positions = new Map();
    if (!(pmView === null || pmView === void 0 ? void 0 : pmView.state))
        return positions;
    const { doc: pmDoc, schema } = pmView.state;
    const commentType = schema.marks.comment;
    const insertionType = schema.marks.insertion;
    const deletionType = schema.marks.deletion;
    if (!commentType && !insertionType && !deletionType)
        return positions;
    const seen = new Set();
    // Offset from layout coords to scroll-container coords:
    // viewport paddingTop + pages container padding (CSS padding = pageGap)
    const contentOffset = VIEWPORT_PADDING_TOP + renderedPageGap;
    pmDoc.descendants((node, pos) => {
        var _a, _b;
        if (!node.isText)
            return;
        for (const mark of node.marks) {
            let key = null;
            if (commentType && mark.type === commentType) {
                key = `comment-${mark.attrs.commentId}`;
            }
            else if ((insertionType && mark.type === insertionType) ||
                (deletionType && mark.type === deletionType)) {
                key = `revision-${mark.attrs.revisionId}`;
            }
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            // Try exact position (paragraphs/images)
            const caret = getCaretPosition(layout, blocks, measures, pos);
            if (caret) {
                positions.set(key, caret.y + contentOffset);
                continue;
            }
            // Fallback: find containing fragment (tables, etc.) by PM position
            for (let pi = 0; pi < layout.pages.length; pi++) {
                const page = layout.pages[pi];
                let found = false;
                for (const frag of page.fragments) {
                    const fStart = (_a = frag.pmStart) !== null && _a !== void 0 ? _a : 0;
                    const fEnd = (_b = frag.pmEnd) !== null && _b !== void 0 ? _b : fStart;
                    if (pos < fStart || pos > fEnd)
                        continue;
                    const rowOffsetY = frag.kind === 'table' ? getTableRowOffset(blocks, measures, frag, pos) : 0;
                    positions.set(key, frag.y + rowOffsetY + getPageTop(layout, pi) + contentOffset);
                    found = true;
                    break;
                }
                if (found)
                    break;
            }
        }
    });
    return positions;
}
/**
 * Find the Y offset within a table fragment to the row containing a PM position.
 * Sums row heights until finding the row that contains the given position.
 */
function getTableRowOffset(blocks, measures, frag, pmPos) {
    var _a, _b;
    const blockIdx = blocks.findIndex((b) => b.id === frag.blockId);
    if (blockIdx === -1)
        return 0;
    const tBlock = blocks[blockIdx];
    const tMeasure = measures[blockIdx];
    if (tBlock.kind !== 'table' || tMeasure.kind !== 'table')
        return 0;
    let offsetY = 0;
    for (let ri = frag.fromRow; ri < frag.toRow; ri++) {
        const row = tBlock.rows[ri];
        if (!row)
            break;
        const posInRow = row.cells.some((cell) => cell.blocks.some((b) => {
            var _a, _b;
            const s = (_a = b.pmStart) !== null && _a !== void 0 ? _a : 0;
            const e = (_b = b.pmEnd) !== null && _b !== void 0 ? _b : s;
            return pmPos >= s && pmPos <= e;
        }));
        if (posInRow)
            break;
        offsetY += (_b = (_a = tMeasure.rows[ri]) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
    }
    return offsetY;
}
/**
 * Convert twips to pixels (1 twip = 1/20 point, 96 pixels per inch).
 */
function twipsToPixels(twips) {
    return Math.round((twips / 1440) * 96);
}
/**
 * Extract page size from section properties or use defaults.
 */
function getPageSize(sectionProps) {
    return {
        w: (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.pageWidth) ? twipsToPixels(sectionProps.pageWidth) : DEFAULT_PAGE_WIDTH,
        h: (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.pageHeight) ? twipsToPixels(sectionProps.pageHeight) : DEFAULT_PAGE_HEIGHT,
    };
}
/**
 * Extract margins from section properties or use defaults.
 */
function getMargins(sectionProps) {
    const top = (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginTop) ? twipsToPixels(sectionProps.marginTop) : DEFAULT_MARGINS.top;
    const bottom = (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginBottom)
        ? twipsToPixels(sectionProps.marginBottom)
        : DEFAULT_MARGINS.bottom;
    return {
        top,
        right: (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginRight)
            ? twipsToPixels(sectionProps.marginRight)
            : DEFAULT_MARGINS.right,
        bottom,
        left: (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginLeft) ? twipsToPixels(sectionProps.marginLeft) : DEFAULT_MARGINS.left,
        // Header/footer distances - where the header/footer content starts
        // Default to 0.5 inch (48px at 96 DPI) if not specified
        header: (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.headerDistance) ? twipsToPixels(sectionProps.headerDistance) : 48,
        footer: (sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.footerDistance) ? twipsToPixels(sectionProps.footerDistance) : 48,
    };
}
/**
 * Extract column layout from section properties.
 * Returns undefined for single-column (default) to avoid unnecessary paginator overhead.
 */
function getColumns(sectionProps) {
    var _a, _b, _c;
    const count = (_a = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.columnCount) !== null && _a !== void 0 ? _a : 1;
    if (count <= 1)
        return undefined;
    // Default column spacing: 720 twips (0.5 inch) per OOXML spec
    const gap = twipsToPixels((_b = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.columnSpace) !== null && _b !== void 0 ? _b : 720);
    const cols = {
        count,
        gap,
        equalWidth: (_c = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.equalWidth) !== null && _c !== void 0 ? _c : true,
        separator: sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.separator,
    };
    // Unequal columns: carry explicit per-column widths so measurement uses the
    // true (wider) value-column width instead of an even split. Mirrors the
    // inner-section path in toFlowBlocks.
    const colDefs = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.columns;
    if ((sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.equalWidth) === false &&
        colDefs &&
        colDefs.length === count &&
        colDefs.every((c) => typeof c.width === 'number' && c.width > 0)) {
        cols.columnWidths = colDefs.map((c) => {
            var _a;
            return ({
                width: twipsToPixels(c.width),
                space: twipsToPixels((_a = c.space) !== null && _a !== void 0 ? _a : 0),
            });
        });
    }
    return cols;
}
/**
 * Body width for column index `colIndex` of a section. With explicit unequal
 * columns (`w:equalWidth="0"`) returns that column's true width; otherwise the
 * even split. Single-column sections return full content width.
 */
function columnWidthForSection(config, colIndex = 0) {
    var _a;
    const contentWidth = config.pageSize.w - config.margins.left - config.margins.right;
    const cols = config.columns;
    if (!cols || cols.count <= 1)
        return contentWidth;
    if (cols.columnWidths && cols.columnWidths.length === cols.count) {
        const w = (_a = cols.columnWidths[Math.min(colIndex, cols.count - 1)]) === null || _a === void 0 ? void 0 : _a.width;
        if (typeof w === 'number' && w > 0)
            return Math.floor(w);
    }
    return Math.floor((contentWidth - (cols.count - 1) * cols.gap) / cols.count);
}
/**
 * Compute per-block measurement widths by scanning for section breaks.
 * Blocks must be measured with the page width/margins/columns of their own
 * section so that the layout engine can paginate them against the right
 * geometry without remeasuring.
 */
function computePerBlockWidths(blocks, initialConfig, finalConfig) {
    var _a, _b, _c;
    const { configs: sectionConfigs, breakIndices } = collectSectionConfigs(blocks, initialConfig, finalConfig);
    let sectionIdx = 0;
    // Column index within the current section, advanced by explicit column
    // breaks so unequal columns measure each block at its own column's width.
    let colIndex = 0;
    const widths = [];
    for (let i = 0; i < blocks.length; i++) {
        const cfg = (_a = sectionConfigs[sectionIdx]) !== null && _a !== void 0 ? _a : initialConfig;
        widths.push(columnWidthForSection(cfg, colIndex));
        const block = blocks[i];
        if (block.kind === 'columnBreak') {
            const count = (_c = (_b = cfg.columns) === null || _b === void 0 ? void 0 : _b.count) !== null && _c !== void 0 ? _c : 1;
            if (colIndex < count - 1)
                colIndex += 1;
        }
        if (sectionIdx < breakIndices.length && i === breakIndices[sectionIdx]) {
            sectionIdx++;
            colIndex = 0; // new section restarts at column 0
        }
    }
    return widths;
}
// `isTextWrappingFloatingImageRun` and `emuToPixels` are imported from core. Local
// duplicates were drifting from the canonical implementations; sharing
// keeps them in lockstep across React + Vue adapters.
/**
 * Top body margin (px) once the header content has been accounted for.
 *
 * When header content is taller than the gap between the page top and the
 * header distance, Word pushes body content down to clear it. The body top is
 * normally `headerDistance + headerContentHeight`, with the authored top margin
 * (`marginTop`) acting as a floor.
 *
 * The negative-top-margin case is the subtle one. `w:pgMar w:top` can be
 * negative (e.g. medical-incident-form's `w:top="-270"` = −13.5pt). Word reads
 * that as permission for the header to OVERLAP the body rather than fully
 * displace it: the negative margin pulls body content up under the header by
 * |marginTop|. So the clear position is reduced by the negative margin and
 * clamped to the page edge (never above 0).
 *
 * For every positive-top document `Math.min(marginTop, 0)` is 0, so this
 * reduces to the original `headerDistance + headerContentHeight` push — the
 * function is provably a no-op for positive-margin docs.
 */
export function computeExtendedTopMargin(marginTop, headerDistance, headerContentHeight) {
    const headerOverlapPull = Math.min(marginTop, 0);
    const clearTop = Math.max(0, headerDistance + headerContentHeight + headerOverlapPull);
    return Math.max(marginTop, clearTop);
}
export function measureTableCellBlockVisualHeight(block, blockMeasure) {
    var _a, _b, _c, _d, _e, _f;
    if (block.kind !== 'paragraph' || blockMeasure.kind !== 'paragraph') {
        if ('totalHeight' in blockMeasure)
            return blockMeasure.totalHeight;
        if ('height' in blockMeasure)
            return blockMeasure.height;
        return 0;
    }
    const paragraphBlock = block;
    const paragraphMeasure = blockMeasure;
    const nonEmptyRuns = paragraphBlock.runs.filter((run) => run.kind !== 'text' || run.text.length > 0);
    const imageOnlySingleLine = paragraphMeasure.lines.length === 1 &&
        nonEmptyRuns.length > 0 &&
        nonEmptyRuns.every((run) => run.kind === 'image');
    if (!imageOnlySingleLine) {
        return paragraphMeasure.totalHeight;
    }
    const maxImageHeight = nonEmptyRuns.reduce((maxHeight, run) => {
        return run.kind === 'image' ? Math.max(maxHeight, run.height) : maxHeight;
    }, 0);
    const spacingBefore = (_c = (_b = (_a = paragraphBlock.attrs) === null || _a === void 0 ? void 0 : _a.spacing) === null || _b === void 0 ? void 0 : _b.before) !== null && _c !== void 0 ? _c : 0;
    const spacingAfter = (_f = (_e = (_d = paragraphBlock.attrs) === null || _d === void 0 ? void 0 : _d.spacing) === null || _e === void 0 ? void 0 : _e.after) !== null && _f !== void 0 ? _f : 0;
    return spacingBefore + maxImageHeight + spacingAfter;
}
function getTableCellVerticalBorderHeight(cell) {
    var _a, _b, _c, _d, _e, _f;
    const top = (_c = (_b = (_a = cell === null || cell === void 0 ? void 0 : cell.borders) === null || _a === void 0 ? void 0 : _a.top) === null || _b === void 0 ? void 0 : _b.width) !== null && _c !== void 0 ? _c : 0;
    const bottom = (_f = (_e = (_d = cell === null || cell === void 0 ? void 0 : cell.borders) === null || _d === void 0 ? void 0 : _d.bottom) === null || _e === void 0 ? void 0 : _e.width) !== null && _f !== void 0 ? _f : 0;
    return top + bottom;
}
export function measureTableBlock(tableBlock, contentWidth) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const DEFAULT_CELL_PADDING_X = 7; // Word default: 108 twips ≈ 7px
    const DEFAULT_CELL_PADDING_Y = 0; // OOXML/TableNormal default: top=0, bottom=0
    // columnWidths are already in pixels (converted in toFlowBlocks)
    let columnWidths = (_a = tableBlock.columnWidths) !== null && _a !== void 0 ? _a : [];
    const explicitWidthPx = resolveTableWidthPx(tableBlock.width, tableBlock.widthType, contentWidth);
    const colCount = countTableColumns(tableBlock);
    const targetWidth = explicitWidthPx !== null && explicitWidthPx !== void 0 ? explicitWidthPx : contentWidth;
    if (tableBlock.rows.length > 0) {
        columnWidths = normalizeTableColumnWidths(columnWidths, colCount, targetWidth);
    }
    if (columnWidths.length > 0 && explicitWidthPx) {
        const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
        if (totalWidth > 0 && Math.abs(totalWidth - explicitWidthPx) > 1) {
            const scale = explicitWidthPx / totalWidth;
            columnWidths = columnWidths.map((w) => w * scale);
        }
    }
    // Build a map of columns occupied by spanning cells from previous rows.
    // Without this, cells in rows with vertical merges get the wrong column width.
    const occupiedColumnsPerRow = new Map();
    for (let rowIdx = 0; rowIdx < tableBlock.rows.length; rowIdx++) {
        const row = tableBlock.rows[rowIdx];
        if (!row)
            continue;
        let colIdx = 0;
        const occupied = (_b = occupiedColumnsPerRow.get(rowIdx)) !== null && _b !== void 0 ? _b : new Set();
        while (occupied.has(colIdx))
            colIdx++;
        for (const cell of row.cells) {
            const colSpan = (_c = cell.colSpan) !== null && _c !== void 0 ? _c : 1;
            const rowSpan = (_d = cell.rowSpan) !== null && _d !== void 0 ? _d : 1;
            if (rowSpan > 1) {
                for (let r = rowIdx + 1; r < rowIdx + rowSpan; r++) {
                    if (!occupiedColumnsPerRow.has(r))
                        occupiedColumnsPerRow.set(r, new Set());
                    const occSet = occupiedColumnsPerRow.get(r);
                    for (let c = 0; c < colSpan; c++) {
                        occSet.add(colIdx + c);
                    }
                }
            }
            colIdx += colSpan;
            while (occupied.has(colIdx))
                colIdx++;
        }
    }
    // Calculate cell widths based on colSpan and columnWidths,
    // skipping columns occupied by spanning cells from previous rows.
    const rows = tableBlock.rows.map((row, rowIdx) => {
        var _a;
        let columnIndex = 0;
        const occupied = (_a = occupiedColumnsPerRow.get(rowIdx)) !== null && _a !== void 0 ? _a : new Set();
        while (occupied.has(columnIndex))
            columnIndex++;
        return {
            cells: row.cells.map((cell) => {
                var _a, _b, _c, _d, _e, _f, _g;
                const colSpan = (_a = cell.colSpan) !== null && _a !== void 0 ? _a : 1;
                // Calculate cell width as sum of spanned columns
                let cellWidth = 0;
                for (let c = 0; c < colSpan && columnIndex + c < columnWidths.length; c++) {
                    cellWidth += (_b = columnWidths[columnIndex + c]) !== null && _b !== void 0 ? _b : 0;
                }
                // Fallback to cell.width or default if columnWidths not available
                if (cellWidth === 0) {
                    cellWidth =
                        (_c = (cell.width && cell.width > 0
                            ? cell.width
                            : resolveTableWidthPx(cell.widthValue, cell.widthType, targetWidth))) !== null && _c !== void 0 ? _c : 100;
                }
                columnIndex += colSpan;
                while (occupied.has(columnIndex))
                    columnIndex++;
                const padLeft = (_e = (_d = cell.padding) === null || _d === void 0 ? void 0 : _d.left) !== null && _e !== void 0 ? _e : DEFAULT_CELL_PADDING_X;
                const padRight = (_g = (_f = cell.padding) === null || _f === void 0 ? void 0 : _f.right) !== null && _g !== void 0 ? _g : DEFAULT_CELL_PADDING_X;
                const cellContentWidth = Math.max(1, cellWidth - padLeft - padRight);
                return {
                    blocks: cell.blocks.map((b) => measureBlock(b, cellContentWidth)),
                    width: cellWidth,
                    height: 0, // Calculated below
                    colSpan: cell.colSpan,
                    rowSpan: cell.rowSpan,
                };
            }),
            height: 0,
        };
    });
    // Calculate cell heights, respecting explicit row height rules
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const sourceRowCells = (_e = tableBlock.rows[rowIdx]) === null || _e === void 0 ? void 0 : _e.cells;
        let maxHeight = 0;
        let maxVerticalBorderHeight = 0;
        for (let cellIdx = 0; cellIdx < row.cells.length; cellIdx++) {
            const cell = row.cells[cellIdx];
            const sourceCell = sourceRowCells === null || sourceRowCells === void 0 ? void 0 : sourceRowCells[cellIdx];
            // `paragraphMeasure.totalHeight` already includes spacing.before /
            // spacing.after; just sum the block heights. Adjacent-paragraph
            // collapse rules don't apply across the cell-content boundary, so this
            // matches Word's per-cell layout.
            let contentHeight = 0;
            for (let blockIdx = 0; blockIdx < cell.blocks.length; blockIdx++) {
                const sourceBlock = sourceCell === null || sourceCell === void 0 ? void 0 : sourceCell.blocks[blockIdx];
                const blockMeasure = cell.blocks[blockIdx];
                if (!sourceBlock || !blockMeasure)
                    continue;
                contentHeight += measureTableCellBlockVisualHeight(sourceBlock, blockMeasure);
            }
            cell.height = contentHeight;
            const padTop = (_g = (_f = sourceCell === null || sourceCell === void 0 ? void 0 : sourceCell.padding) === null || _f === void 0 ? void 0 : _f.top) !== null && _g !== void 0 ? _g : DEFAULT_CELL_PADDING_Y;
            const padBottom = (_j = (_h = sourceCell === null || sourceCell === void 0 ? void 0 : sourceCell.padding) === null || _h === void 0 ? void 0 : _h.bottom) !== null && _j !== void 0 ? _j : DEFAULT_CELL_PADDING_Y;
            cell.height += padTop + padBottom;
            maxHeight = Math.max(maxHeight, cell.height);
            maxVerticalBorderHeight = Math.max(maxVerticalBorderHeight, getTableCellVerticalBorderHeight(sourceCell));
        }
        // Apply heightRule from the source row
        const sourceRow = tableBlock.rows[rowIdx];
        const explicitHeight = sourceRow === null || sourceRow === void 0 ? void 0 : sourceRow.height;
        const heightRule = sourceRow === null || sourceRow === void 0 ? void 0 : sourceRow.heightRule;
        if (explicitHeight && heightRule === 'exact') {
            row.height = explicitHeight;
        }
        else if (explicitHeight) {
            // Both 'atLeast' and 'auto' (OOXML default) treat the value as minimum height.
            // ECMA-376 §17.4.81: when hRule is absent or "auto", val is the minimum row height.
            row.height = Math.max(maxHeight + maxVerticalBorderHeight, explicitHeight);
        }
        else {
            // No explicit height — use content height directly.
            row.height = maxHeight + maxVerticalBorderHeight;
        }
    }
    const totalHeight = rows.reduce((h, r) => h + r.height, 0);
    const totalWidth = columnWidths.reduce((w, cw) => w + cw, 0) || explicitWidthPx || contentWidth;
    return {
        kind: 'table',
        rows,
        columnWidths,
        totalWidth,
        totalHeight,
    };
}
function extractFloatingZones(blocks, contentWidth) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const zones = [];
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex];
        if (block.kind !== 'paragraph')
            continue;
        const paragraphBlock = block;
        for (const run of paragraphBlock.runs) {
            if (run.kind !== 'image')
                continue;
            const imgRun = run;
            if (!isTextWrappingFloatingImageRun(imgRun))
                continue;
            // Calculate Y position based on vertical alignment
            let topY = 0;
            const position = imgRun.position;
            const distTop = (_a = imgRun.distTop) !== null && _a !== void 0 ? _a : 0;
            const distBottom = (_b = imgRun.distBottom) !== null && _b !== void 0 ? _b : 0;
            const distLeft = (_c = imgRun.distLeft) !== null && _c !== void 0 ? _c : 12;
            const distRight = (_d = imgRun.distRight) !== null && _d !== void 0 ? _d : 12;
            if (position === null || position === void 0 ? void 0 : position.vertical) {
                const v = position.vertical;
                if (v.align === 'top' && v.relativeTo === 'margin') {
                    // Image at top of content area
                    topY = 0;
                }
                else if (v.posOffset !== undefined) {
                    topY = emuToPixels(v.posOffset);
                }
                // Other cases (paragraph-relative) are harder to handle without knowing paragraph positions
            }
            const bottomY = topY + imgRun.height;
            // Calculate margins based on horizontal position
            let leftMargin = 0;
            let rightMargin = 0;
            if (position === null || position === void 0 ? void 0 : position.horizontal) {
                const h = position.horizontal;
                if (h.align === 'left') {
                    // Image on left - text needs left margin
                    leftMargin = imgRun.width + distRight;
                }
                else if (h.align === 'right') {
                    // Image on right - text needs right margin
                    rightMargin = imgRun.width + distLeft;
                }
                else if (h.posOffset !== undefined) {
                    const x = emuToPixels(h.posOffset);
                    if (x < contentWidth / 2) {
                        leftMargin = x + imgRun.width + distRight;
                    }
                    else {
                        rightMargin = contentWidth - x + distLeft;
                    }
                }
            }
            else if (imgRun.cssFloat === 'left') {
                leftMargin = imgRun.width + distRight;
            }
            else if (imgRun.cssFloat === 'right') {
                rightMargin = imgRun.width + distLeft;
            }
            if (leftMargin > 0 || rightMargin > 0) {
                // Images positioned relative to margin/page apply globally (before their anchor paragraph)
                const isMarginRelative = ((_e = position === null || position === void 0 ? void 0 : position.vertical) === null || _e === void 0 ? void 0 : _e.relativeTo) === 'margin' || ((_f = position === null || position === void 0 ? void 0 : position.vertical) === null || _f === void 0 ? void 0 : _f.relativeTo) === 'page';
                zones.push({
                    leftMargin,
                    rightMargin,
                    topY: topY - distTop,
                    bottomY: bottomY + distBottom,
                    anchorBlockIndex: blockIndex,
                    isMarginRelative,
                });
            }
        }
    }
    // Floating tables (block-level) - treat them as exclusion zones for subsequent text
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex];
        if (block.kind !== 'table')
            continue;
        const tableBlock = block;
        const floating = tableBlock.floating;
        if (!floating)
            continue;
        const tableMeasure = measureTableBlock(tableBlock, contentWidth);
        const tableWidth = tableMeasure.totalWidth;
        const tableHeight = tableMeasure.totalHeight;
        const distLeft = (_g = floating.leftFromText) !== null && _g !== void 0 ? _g : 12;
        const distRight = (_h = floating.rightFromText) !== null && _h !== void 0 ? _h : 12;
        const distTop = (_j = floating.topFromText) !== null && _j !== void 0 ? _j : 0;
        const distBottom = (_k = floating.bottomFromText) !== null && _k !== void 0 ? _k : 0;
        let leftMargin = 0;
        let rightMargin = 0;
        // Determine horizontal position relative to content area
        let x = 0;
        if (floating.tblpX !== undefined) {
            x = floating.tblpX;
        }
        else if (floating.tblpXSpec) {
            if (floating.tblpXSpec === 'left' || floating.tblpXSpec === 'inside') {
                x = 0;
            }
            else if (floating.tblpXSpec === 'right' || floating.tblpXSpec === 'outside') {
                x = contentWidth - tableWidth;
            }
            else if (floating.tblpXSpec === 'center') {
                x = (contentWidth - tableWidth) / 2;
            }
        }
        else if (tableBlock.justification === 'center') {
            x = (contentWidth - tableWidth) / 2;
        }
        else if (tableBlock.justification === 'right') {
            x = contentWidth - tableWidth;
        }
        if (x < contentWidth / 2) {
            leftMargin = x + tableWidth + distRight;
        }
        else {
            rightMargin = contentWidth - x + distLeft;
        }
        const topY = (_l = floating.tblpY) !== null && _l !== void 0 ? _l : 0;
        const bottomY = topY + tableHeight;
        zones.push({
            leftMargin,
            rightMargin,
            topY: topY - distTop,
            bottomY: bottomY + distBottom,
            anchorBlockIndex: blockIndex,
        });
    }
    return zones;
}
/**
 * Measure a block based on its type.
 */
function measureBlock(block, contentWidth, floatingZones, cumulativeY) {
    var _a, _b, _c, _d, _e, _f, _g;
    switch (block.kind) {
        case 'paragraph': {
            const pBlock = block;
            // Cache paragraph measurements when no floating zones affect this block.
            // Safe because without floating zones the result depends only on content
            // and contentWidth (both captured in the cache key). When floating zones
            // ARE present, we always measure fresh since zones depend on inter-block
            // layout context (cumulative Y, neighboring floating tables/images).
            if (!floatingZones || floatingZones.length === 0) {
                const cached = getCachedParagraphMeasure(pBlock, contentWidth);
                if (cached)
                    return cached;
            }
            const result = measureParagraph(pBlock, contentWidth, {
                floatingZones,
                paragraphYOffset: cumulativeY !== null && cumulativeY !== void 0 ? cumulativeY : 0,
            });
            if (!floatingZones || floatingZones.length === 0) {
                setCachedParagraphMeasure(pBlock, contentWidth, result);
            }
            return result;
        }
        case 'table': {
            return measureTableBlock(block, contentWidth);
        }
        case 'image': {
            const imageBlock = block;
            return {
                kind: 'image',
                width: (_a = imageBlock.width) !== null && _a !== void 0 ? _a : 100,
                height: (_b = imageBlock.height) !== null && _b !== void 0 ? _b : 100,
            };
        }
        case 'textBox': {
            const tb = block;
            const margins = (_c = tb.margins) !== null && _c !== void 0 ? _c : DEFAULT_TEXTBOX_MARGINS;
            const innerWidth = ((_d = tb.width) !== null && _d !== void 0 ? _d : DEFAULT_TEXTBOX_WIDTH) - margins.left - margins.right;
            const innerMeasures = tb.content.map((p) => measureParagraph(p, innerWidth));
            const contentHeight = innerMeasures.reduce((sum, m) => sum + m.totalHeight, 0);
            const intrinsicHeight = contentHeight + margins.top + margins.bottom;
            // With a:spAutoFit, Word's saved ext.cy is treated as a *minimum* —
            // grow the box if our font metrics produce taller content, otherwise
            // text clips against `overflow: hidden` in renderTextBox.
            const totalHeight = tb.autoFit === 'spAutoFit'
                ? Math.max((_e = tb.height) !== null && _e !== void 0 ? _e : 0, intrinsicHeight)
                : ((_f = tb.height) !== null && _f !== void 0 ? _f : intrinsicHeight);
            return {
                kind: 'textBox',
                width: (_g = tb.width) !== null && _g !== void 0 ? _g : DEFAULT_TEXTBOX_WIDTH,
                height: totalHeight,
                innerMeasures,
            };
        }
        case 'pageBreak':
            return { kind: 'pageBreak' };
        case 'columnBreak':
            return { kind: 'columnBreak' };
        case 'sectionBreak':
            return { kind: 'sectionBreak' };
        default:
            // Unknown block type - return empty paragraph measure
            return {
                kind: 'paragraph',
                lines: [],
                totalHeight: 0,
            };
    }
}
/**
 * Measure all blocks with floating image support.
 *
 * Pre-scans all blocks to find floating images and creates exclusion zones.
 * Then measures each block, passing the zones so paragraphs can calculate
 * per-line widths based on vertical overlap with floating images.
 */
function measureBlocks(blocks, contentWidth) {
    var _a, _b, _c;
    const defaultWidth = Array.isArray(contentWidth) ? ((_a = contentWidth[0]) !== null && _a !== void 0 ? _a : 0) : contentWidth;
    // Pre-extract floating image exclusion zones with anchor block indices
    const floatingZonesWithAnchors = extractFloatingZones(blocks, defaultWidth);
    // Margin-relative zones (positioned relative to page/margin) on the same vertical
    // position are likely on the same page. Group them and activate all from the earliest
    // anchor so text wraps around ALL images from the first paragraph onward.
    // e.g. left-aligned and right-aligned images at margin top should both affect text
    // starting from the first anchor paragraph, not just the one containing each image.
    const marginRelative = floatingZonesWithAnchors.filter((z) => z.isMarginRelative);
    const paragraphRelative = floatingZonesWithAnchors.filter((z) => !z.isMarginRelative);
    // Group margin-relative zones by topY and move all to earliest anchor in group
    const marginByTopY = new Map();
    for (const z of marginRelative) {
        const group = (_b = marginByTopY.get(z.topY)) !== null && _b !== void 0 ? _b : [];
        group.push(z);
        marginByTopY.set(z.topY, group);
    }
    const adjustedZones = [...paragraphRelative];
    for (const group of marginByTopY.values()) {
        const minAnchor = Math.min(...group.map((z) => z.anchorBlockIndex));
        for (const z of group) {
            adjustedZones.push(Object.assign(Object.assign({}, z), { anchorBlockIndex: minAnchor }));
        }
    }
    // Group zones by effective anchor block index
    const zonesByAnchor = new Map();
    for (const z of adjustedZones) {
        const existing = (_c = zonesByAnchor.get(z.anchorBlockIndex)) !== null && _c !== void 0 ? _c : [];
        existing.push({
            leftMargin: z.leftMargin,
            rightMargin: z.rightMargin,
            topY: z.topY,
            bottomY: z.bottomY,
        });
        zonesByAnchor.set(z.anchorBlockIndex, existing);
    }
    const anchorIndices = new Set(adjustedZones.map((z) => z.anchorBlockIndex));
    // Track cumulative Y position for floating zone overlap calculation
    // Resets when we reach a block with floating images (establishing local page coords)
    let cumulativeY = 0;
    let activeZones = [];
    return blocks.map((block, blockIndex) => {
        var _a, _b;
        // Check if this block is an anchor for floating images
        // If so, reset cumulative Y and replace active zones (old zones from previous
        // anchors are invalid after the Y reset since their topY/bottomY are in the old
        // coordinate system)
        if (anchorIndices.has(blockIndex)) {
            cumulativeY = 0;
            activeZones = (_a = zonesByAnchor.get(blockIndex)) !== null && _a !== void 0 ? _a : [];
        }
        const zones = activeZones.length > 0 ? activeZones : undefined;
        try {
            const blockStart = performance.now();
            const blockWidth = Array.isArray(contentWidth)
                ? ((_b = contentWidth[blockIndex]) !== null && _b !== void 0 ? _b : defaultWidth)
                : contentWidth;
            const measure = measureBlock(block, blockWidth, zones, cumulativeY);
            const blockTime = performance.now() - blockStart;
            if (blockTime > 500) {
                console.warn(`[measureBlocks] Block ${blockIndex} (${block.kind}) took ${Math.round(blockTime)}ms`);
            }
            // Update cumulative Y for next block
            if ('totalHeight' in measure) {
                if (!(block.kind === 'table' && block.floating)) {
                    cumulativeY += measure.totalHeight;
                }
            }
            return measure;
        }
        catch (error) {
            console.error(`[measureBlocks] Error measuring block ${blockIndex} (${block.kind}):`, error);
            // Return a minimal measure so we don't crash the entire layout
            return { totalHeight: 20 };
        }
    });
}
// HF metrics, visual-bounds helpers, normalizeHeaderFooterMeasureBlocks,
// and convertHeaderFooterToContent live in
// `@eigenpal/docx-core/layout-bridge` (headerFooterLayout.ts). This adapter
// just hands its `measureBlocks` callback into the core helper so the core
// pipeline runs without dragging in Canvas/font-metric dependencies.
// =============================================================================
// FOOTNOTE HELPERS
// =============================================================================
//
// Footnote conversion logic now lives in core (`@eigenpal/docx-core/layout-
// bridge`). This adapter just hands its `measureBlocks` callback over so the
// core pipeline can run without dragging in Canvas/font-metric dependencies.
/**
 * Build per-page footnote render items from page footnote mapping.
 */
function buildFootnoteRenderItems(pageFootnoteMap, footnoteContentMap, doc) {
    var _a, _b;
    const result = new Map();
    if (!((_a = doc === null || doc === void 0 ? void 0 : doc.package) === null || _a === void 0 ? void 0 : _a.footnotes))
        return result;
    // Build lookup for footnote text
    const fnLookup = new Map();
    for (const fn of doc.package.footnotes) {
        if (fn.noteType && fn.noteType !== 'normal')
            continue;
        fnLookup.set(fn.id, fn);
    }
    for (const [pageNumber, footnoteIds] of pageFootnoteMap) {
        const items = [];
        for (const fnId of footnoteIds) {
            const fn = fnLookup.get(fnId);
            if (!fn)
                continue;
            const content = footnoteContentMap.get(fnId);
            const displayNum = (_b = content === null || content === void 0 ? void 0 : content.displayNumber) !== null && _b !== void 0 ? _b : 0;
            const text = getFootnoteText(fn);
            items.push({
                displayNumber: String(displayNum),
                text,
                id: fn.id,
            });
        }
        if (items.length > 0) {
            result.set(pageNumber, items);
        }
    }
    return result;
}
// =============================================================================
// COMPONENT
// =============================================================================
/**
 * Clicks / focus that originate inside a sidebar panel (comment textareas,
 * tracked-change cards, the unified sidebar) must NOT be yanked back to the
 * off-screen document editor — otherwise the user could never type in them.
 * Centralised so every focus-recapture path applies the same exclusion.
 */
function isWithinSidebar(target) {
    const el = target;
    return !!((el === null || el === void 0 ? void 0 : el.closest('.docx-comments-sidebar')) || (el === null || el === void 0 ? void 0 : el.closest('.docx-unified-sidebar')));
}
/**
 * PagedEditor - Main paginated editing component.
 */
const PagedEditorComponent = forwardRef(function PagedEditor(props, ref) {
    var _a, _b;
    const { document, styles, theme: _theme, sectionProperties, finalSectionProperties, headerContent, footerContent, firstPageHeaderContent, firstPageFooterContent, readOnly = false, pageGap = DEFAULT_PAGE_GAP, zoom = 1, wordCompat = false, showFormattingMarks = false, onDocumentChange, onSelectionChange, externalPlugins = EMPTY_PLUGINS, extensionManager, contentLabel, onReady, onRenderedDomContextReady, pluginOverlays, onHeaderFooterDoubleClick, hfEditMode, onBodyClick, className, style, selectionFormatting, onFormat, onZoomChange, marginDraggingRef, commentsSidebarOpen = false, sidebarOverlay, scrollContainerRef: scrollContainerRefProp, onHyperlinkClick, onContextMenu, onOpenProperties, onResizeTextBox, onEditFootnote, onEditEquation, onEditEndnote, onAnchorPositionsChange, onTotalPagesChange, resolvedCommentIds, } = props;
    // Resolve the scroll container: prefer parent-provided ref, fallback to own container
    const getScrollContainer = useCallback(() => {
        if (scrollContainerRefProp && typeof scrollContainerRefProp === 'object') {
            return scrollContainerRefProp.current;
        }
        return containerRef.current;
    }, [scrollContainerRefProp]);
    // Refs
    const containerRef = useRef(null);
    const pagesContainerRef = useRef(null);
    // Phone-only: two-finger pinch on the editor area updates zoom.
    // The hook self-gates via matchMedia('(max-width: 720px)'); on
    // desktop nothing is attached. Commits the new zoom on touchend.
    usePinchZoom({
        target: containerRef.current,
        zoom: zoom,
        onZoomChange: onZoomChange !== null && onZoomChange !== void 0 ? onZoomChange : (() => undefined),
        disabled: !onZoomChange,
    });
    /** Viewport wrapper: sync minHeight/marginBottom in layout pipeline before scroll restore. */
    const viewportLayoutRef = useRef(null);
    const pendingScrollRestoreRef = useRef(null);
    const pendingIncrementalScrollSnapshotWrittenAtRef = useRef(0);
    const hiddenPMRef = useRef(null);
    const painterRef = useRef(null);
    // Visual line navigation (ArrowUp/ArrowDown with sticky X)
    const { handlePMKeyDown } = useVisualLineNavigation({ pagesContainerRef });
    // Stable ref for drag-extend callback (avoids circular deps with getPositionFromMouse)
    const dragExtendRef = useRef(() => { });
    // Store callbacks in refs to avoid infinite re-render loops
    // when parent passes unstable callback references
    const onSelectionChangeRef = useRef(onSelectionChange);
    const onDocumentChangeRef = useRef(onDocumentChange);
    const onReadyRef = useRef(onReady);
    const onRenderedDomContextReadyRef = useRef(onRenderedDomContextReady);
    // Always-current document, read by async layout passes (font-load / rAF
    // relayout) for doc-level overlays. Without this they close over a stale
    // `document` and a late relayout can clobber freshly-applied state — e.g.
    // applying a watermark then a font-triggered relayout dropping it.
    const documentRef = useRef(document);
    // Last PM state we invoked onSelectionChange for. updateSelectionOverlay
    // runs from ResizeObserver / layout / font-load paths too, not only on real
    // state changes — firing the callback in those cases caused the sidebar
    // expand→resize→re-fire→collapse feedback loop (regression #268). PM states
    // are immutable so reference equality is the canonical "nothing changed"
    // signal (covers selection, doc, and stored-marks changes alike).
    const lastNotifiedStateRef = useRef(null);
    // Keep refs in sync with latest props
    onSelectionChangeRef.current = onSelectionChange;
    onDocumentChangeRef.current = onDocumentChange;
    onReadyRef.current = onReady;
    onRenderedDomContextReadyRef.current = onRenderedDomContextReady;
    documentRef.current = document;
    const onEditFootnoteRef = useRef(onEditFootnote);
    onEditFootnoteRef.current = onEditFootnote;
    const onEditEquationRef = useRef(onEditEquation);
    onEditEquationRef.current = onEditEquation;
    // Double-click a painted footnote at page bottom → open its text editor.
    // Double-click a painted equation → re-open the equation editor.
    useEffect(() => {
        const el = pagesContainerRef.current;
        if (!el)
            return;
        const onDbl = (e) => {
            var _a, _b;
            const target = e.target;
            const fnEl = target === null || target === void 0 ? void 0 : target.closest('.layout-footnote[data-footnote-id]');
            if (fnEl) {
                const id = Number(fnEl.dataset.footnoteId);
                if (!Number.isNaN(id)) {
                    e.preventDefault();
                    e.stopPropagation();
                    (_a = onEditFootnoteRef.current) === null || _a === void 0 ? void 0 : _a.call(onEditFootnoteRef, id);
                }
                return;
            }
            const mathEl = target === null || target === void 0 ? void 0 : target.closest('.docx-math[data-pm-start]');
            if (mathEl) {
                const pos = Number(mathEl.dataset.pmStart);
                if (!Number.isNaN(pos)) {
                    e.preventDefault();
                    e.stopPropagation();
                    (_b = onEditEquationRef.current) === null || _b === void 0 ? void 0 : _b.call(onEditEquationRef, pos);
                }
            }
        };
        el.addEventListener('dblclick', onDbl);
        return () => el.removeEventListener('dblclick', onDbl);
    }, []);
    // State
    const [layout, setLayout] = useState(null);
    const lastTotalPagesRef = useRef(0);
    const onTotalPagesChangeRef = useRef(onTotalPagesChange);
    onTotalPagesChangeRef.current = onTotalPagesChange;
    useEffect(() => {
        var _a, _b;
        // Fires on every page-count change including N → 0 (e.g. doc cleared),
        // so consumers don't get stuck showing the previous count. ref=0 init
        // matches `layout?.pages.length ?? 0` so we don't fire on initial mount.
        const total = (_a = layout === null || layout === void 0 ? void 0 : layout.pages.length) !== null && _a !== void 0 ? _a : 0;
        if (total === lastTotalPagesRef.current)
            return;
        lastTotalPagesRef.current = total;
        (_b = onTotalPagesChangeRef.current) === null || _b === void 0 ? void 0 : _b.call(onTotalPagesChangeRef, total);
    }, [layout]);
    const [blocks, setBlocks] = useState([]);
    const [measures, setMeasures] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const [selectionRects, setSelectionRects] = useState([]);
    const [caretPosition, setCaretPosition] = useState(null);
    // Image selection state
    const [selectedImageInfo, setSelectedImageInfo] = useState(null);
    const isImageInteractingRef = useRef(false);
    // Table "Format" chip — overlay-relative {x,y} of the top-right corner of
    // the table containing the caret, or null when the caret isn't in a table.
    // Mirrors the image chip; opens the same Format panel via onOpenProperties.
    const [tableChipPos, setTableChipPos] = useState(null);
    // Text box "Format" chip — overlay-relative {x,y} of the top-right corner
    // of the text box whose content range contains the caret, else null. The
    // painted `.layout-textbox` carries data-pm-start/end so detection is a
    // pure DOM range test (no PM walk needed here).
    const [textBoxChipPos, setTextBoxChipPos] = useState(null);
    // Live drag preview rect during a textbox resize (viewport-relative px).
    const [textBoxResize, setTextBoxResize] = useState(null);
    /** Build ImageSelectionInfo from a DOM element with data-pm-start */
    const buildImageSelectionInfo = useCallback((el, pmPos) => {
        const imgTag = el.tagName === 'IMG' ? el : el.querySelector('img');
        const rect = (imgTag !== null && imgTag !== void 0 ? imgTag : el).getBoundingClientRect();
        return {
            element: (imgTag !== null && imgTag !== void 0 ? imgTag : el),
            pmPos,
            width: Math.round(rect.width / zoom),
            height: Math.round(rect.height / zoom),
        };
    }, [zoom]);
    // Drag selection state
    const isDraggingRef = useRef(false);
    const dragAnchorRef = useRef(null);
    // Column resize state
    const isResizingColumnRef = useRef(false);
    const resizeStartXRef = useRef(0);
    const resizeColumnIndexRef = useRef(0);
    const resizeTablePmStartRef = useRef(0);
    const resizeOrigWidthsRef = useRef({ left: 0, right: 0 });
    const resizeHandleRef = useRef(null);
    // Row resize state
    const isResizingRowRef = useRef(false);
    const resizeStartYRef = useRef(0);
    const resizeRowIndexRef = useRef(0);
    const resizeRowTablePmStartRef = useRef(0);
    const resizeRowOrigHeightRef = useRef(0); // twips
    const resizeRowHandleRef = useRef(null);
    const resizeRowIsEdgeRef = useRef(false);
    // Right edge resize state (grows last column only)
    const isResizingRightEdgeRef = useRef(false);
    const resizeRightEdgeStartXRef = useRef(0);
    const resizeRightEdgeColIndexRef = useRef(0);
    const resizeRightEdgePmStartRef = useRef(0);
    const resizeRightEdgeOrigWidthRef = useRef(0); // twips
    const resizeRightEdgeHandleRef = useRef(null);
    // Cell selection drag state
    const isCellDraggingRef = useRef(false);
    const cellDragAnchorPosRef = useRef(null);
    const cellDragLastPmPosRef = useRef(null);
    const cellDragOverflowXRef = useRef(null);
    const CELL_SELECT_OVERFLOW_PX = 5; // px of continued drag after text selection maxes out
    const [tableInsertButton, setTableInsertButton] = useState(null);
    const tableInsertHideTimerRef = useRef(null);
    const clearTableInsertTimer = useCallback(() => {
        if (tableInsertHideTimerRef.current) {
            clearTimeout(tableInsertHideTimerRef.current);
            tableInsertHideTimerRef.current = null;
        }
    }, []);
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (tableInsertHideTimerRef.current)
                clearTimeout(tableInsertHideTimerRef.current);
        };
    }, []);
    // Selection gate - ensures selection renders only when layout is current
    const syncCoordinator = useMemo(() => new LayoutSelectionGate(), []);
    // Bumps on every PM transaction (doc, selection, meta-only). Drives the
    // DecorationLayer's resync so plugins like yCursorPlugin (which update
    // decorations on awareness pings — non-doc transactions) propagate.
    const [transactionVersion, setTransactionVersion] = useState(0);
    // Bumped when the page viewport reflows (e.g. the Format panel opens and
    // shifts the page) so the image selection overlay re-anchors to its <img>.
    const [overlayReanchorTick, setOverlayReanchorTick] = useState(0);
    // Compute page size and margins
    const pageSize = useMemo(() => getPageSize(sectionProperties), [sectionProperties]);
    const margins = useMemo(() => getMargins(sectionProperties), [sectionProperties]);
    const columns = useMemo(() => getColumns(sectionProperties), [sectionProperties]);
    const { finalPageSize, finalMargins, finalColumns } = useMemo(() => {
        const props = finalSectionProperties !== null && finalSectionProperties !== void 0 ? finalSectionProperties : sectionProperties;
        return {
            finalPageSize: getPageSize(props),
            finalMargins: getMargins(props),
            finalColumns: getColumns(props),
        };
    }, [finalSectionProperties, sectionProperties]);
    const contentWidth = pageSize.w - margins.left - margins.right;
    // Initialize painter using useMemo to ensure it's ready before first render callbacks
    const painter = useMemo(() => {
        return new LayoutPainter({
            pageGap,
            showShadow: true,
            pageBackground: '#fff',
        });
    }, [pageGap]);
    // Keep ref in sync with memoized painter
    painterRef.current = painter;
    // =========================================================================
    // Layout Pipeline
    // =========================================================================
    /**
     * Run the full layout pipeline:
     * 1. Convert PM doc to blocks
     * 2. Measure blocks
     * 3. Layout blocks onto pages
     * 4. Paint pages to DOM
     */
    const runLayoutPipeline = useCallback((state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const pipelineStart = performance.now();
        // Capture current state sequence for this layout run
        const currentEpoch = syncCoordinator.getStateSeq();
        // Signal layout is starting
        syncCoordinator.onLayoutStart();
        /** Re-clamp scroll when a second layout pass runs before useLayoutEffect consumes pending. */
        const applyPendingIncrementalScrollSnapshot = (onlyIfSnapshotJustWritten) => {
            var _a;
            const pend = pendingScrollRestoreRef.current;
            if ((pend === null || pend === void 0 ? void 0 : pend.renderKind) !== 'incremental' || pend.scrollTopSnapshot == null)
                return;
            if (onlyIfSnapshotJustWritten) {
                const age = performance.now() - pendingIncrementalScrollSnapshotWrittenAtRef.current;
                if (age > 32)
                    return;
            }
            const pe0 = pagesContainerRef.current;
            const sp0 = pe0 ? ((_a = getScrollContainer()) !== null && _a !== void 0 ? _a : findVerticalScrollParentOrRoot(pe0)) : null;
            if (!(sp0 === null || sp0 === void 0 ? void 0 : sp0.isConnected))
                return;
            const max0 = Math.max(1, sp0.scrollHeight - sp0.clientHeight);
            const target = Math.min(Math.max(0, pend.scrollTopSnapshot), max0);
            if (Math.abs(sp0.scrollTop - target) > 0.5) {
                sp0.scrollTop = target;
            }
        };
        applyPendingIncrementalScrollSnapshot(true);
        try {
            // Step 1: Convert PM doc to flow blocks
            let stepStart = performance.now();
            const pageContentHeight = pageSize.h - margins.top - margins.bottom;
            const newBlocks = toFlowBlocks(state.doc, { theme: _theme, pageContentHeight });
            let stepTime = performance.now() - stepStart;
            if (stepTime > 500) {
                console.warn(`[PagedEditor] toFlowBlocks took ${Math.round(stepTime)}ms (${newBlocks.length} blocks)`);
            }
            setBlocks(newBlocks);
            // Step 2: Measure all blocks.
            // Must use full measureBlocks() because measurements depend on
            // inter-block context (floating zones, cumulative Y). Individual
            // block measurements cannot be cached by PM node identity since
            // floating tables/images create exclusion zones that affect
            // neighboring paragraphs' line widths.
            stepStart = performance.now();
            // Compute per-block widths accounting for section breaks with different column configs
            const blockWidths = computePerBlockWidths(newBlocks, { pageSize, margins, columns }, { pageSize: finalPageSize, margins: finalMargins, columns: finalColumns });
            const newMeasures = measureBlocks(newBlocks, blockWidths);
            stepTime = performance.now() - stepStart;
            if (stepTime > 1000) {
                console.warn(`[PagedEditor] measureBlocks took ${Math.round(stepTime)}ms (${newBlocks.length} blocks)`);
            }
            setMeasures(newMeasures);
            // Step 2.5: Collect footnote references from blocks
            const footnoteRefs = collectFootnoteRefs(newBlocks);
            const hasFootnotes = footnoteRefs.length > 0 && ((_a = document === null || document === void 0 ? void 0 : document.package) === null || _a === void 0 ? void 0 : _a.footnotes);
            // Step 2.75: Prepare header/footer content for rendering (needed before layout
            // to compute effective margins when header content exceeds available space)
            const hfMetricsHeader = { section: 'header', pageSize, margins };
            const hfMetricsFooter = { section: 'footer', pageSize, margins };
            const hfOptions = { styles, theme: _theme, measureBlocks };
            const headerContentForRender = convertHeaderFooterToContent(headerContent, contentWidth, hfMetricsHeader, hfOptions);
            const footerContentForRender = convertHeaderFooterToContent(footerContent, contentWidth, hfMetricsFooter, hfOptions);
            const hasTitlePg = (sectionProperties === null || sectionProperties === void 0 ? void 0 : sectionProperties.titlePg) === true;
            const firstPageHeaderForRender = hasTitlePg
                ? convertHeaderFooterToContent(firstPageHeaderContent, contentWidth, hfMetricsHeader, hfOptions)
                : undefined;
            const firstPageFooterForRender = hasTitlePg
                ? convertHeaderFooterToContent(firstPageFooterContent, contentWidth, hfMetricsFooter, hfOptions)
                : undefined;
            // Adjust margins if header/footer content exceeds available space
            // (Word and Google Docs push body content down when header grows)
            // Use the tallest header/footer across all variants for margin computation
            const headerDistance = (_b = margins.header) !== null && _b !== void 0 ? _b : 48;
            const footerDistance = (_c = margins.footer) !== null && _c !== void 0 ? _c : 48;
            const availableHeaderSpace = margins.top - headerDistance;
            const availableFooterSpace = margins.bottom - footerDistance;
            const hfHeight = (hf) => { var _a; return hf ? ((_a = hf.visualBottom) !== null && _a !== void 0 ? _a : hf.height) : 0; };
            const hfFooterHeight = (hf) => { var _a, _b; return hf ? Math.max(((_a = hf.visualBottom) !== null && _a !== void 0 ? _a : hf.height) - ((_b = hf.visualTop) !== null && _b !== void 0 ? _b : 0), hf.height) : 0; };
            const headerContentHeight = Math.max(hfHeight(headerContentForRender), hfHeight(firstPageHeaderForRender));
            const footerContentHeight = Math.max(hfFooterHeight(footerContentForRender), hfFooterHeight(firstPageFooterForRender));
            // When header/footer content exceeds the authored margin space,
            // extend the margins so body content gets pushed clear of the
            // header and footer. Apply to:
            //   1. `margins` (body-level fallback used when a section break
            //      doesn't carry its own margins)
            //   2. `finalMargins` (used by the trailing section)
            //   3. Every `sb.margins` carried on `sectionBreak` blocks — the
            //      layout engine prefers these over the body-level fallback,
            //      so without this they keep the unextended OOXML values and
            //      the body still overlaps header/footer.
            const extendHeader = headerContentHeight > availableHeaderSpace;
            const extendFooter = footerContentHeight > availableFooterSpace;
            let effectiveMargins = margins;
            let effectiveFinalMargins = finalMargins;
            if (extendHeader || extendFooter) {
                const extend = (m) => {
                    const out = Object.assign({}, m);
                    if (extendHeader) {
                        // Negative-top-margin docs let the header overlap the body
                        // instead of fully displacing it; see computeExtendedTopMargin.
                        // Positive-top docs are unaffected (no-op).
                        out.top = computeExtendedTopMargin(m.top, headerDistance, headerContentHeight);
                    }
                    if (extendFooter) {
                        out.bottom = Math.max(m.bottom, footerDistance + footerContentHeight);
                    }
                    return out;
                };
                effectiveMargins = extend(margins);
                effectiveFinalMargins = extend(finalMargins);
                for (const block of newBlocks) {
                    if (block.kind !== 'sectionBreak')
                        continue;
                    const sb = block;
                    if (sb.margins)
                        sb.margins = extend(sb.margins);
                }
            }
            // Step 3: Layout blocks onto pages (two-pass if footnotes exist)
            stepStart = performance.now();
            let newLayout;
            let pageFootnoteMap = new Map();
            let footnoteContentMap = new Map();
            // Common layout options for all passes
            const bodyBreakType = finalSectionProperties === null || finalSectionProperties === void 0 ? void 0 : finalSectionProperties.sectionStart;
            const layoutOpts = {
                pageSize,
                margins: effectiveMargins,
                finalPageSize,
                finalMargins: effectiveFinalMargins,
                columns: finalColumns,
                bodyBreakType,
                pageGap,
            };
            if (hasFootnotes) {
                // Pass 1: Layout without footnote space to determine page assignments
                const pass1Layout = layoutDocument(newBlocks, newMeasures, layoutOpts);
                // Map footnote refs to pages
                pageFootnoteMap = mapFootnotesToPages(pass1Layout.pages, footnoteRefs);
                // Build footnote content via the core pipeline. Styles + theme
                // thread through so footnotes containing themed shading or
                // styled tables resolve their colors / fonts the same way the
                // body does. The adapter supplies its `measureBlocks` so core
                // stays Canvas-free.
                footnoteContentMap = buildFootnoteContentMap(document.package.footnotes, footnoteRefs, contentWidth, {
                    styles: styles !== null && styles !== void 0 ? styles : undefined,
                    theme: _theme !== null && _theme !== void 0 ? _theme : null,
                    measureBlocks,
                });
                // Calculate per-page reserved heights
                const footnoteReservedHeights = calculateFootnoteReservedHeights(pageFootnoteMap, footnoteContentMap);
                // Pass 2: Layout with reserved heights
                if (footnoteReservedHeights.size > 0) {
                    newLayout = layoutDocument(newBlocks, newMeasures, Object.assign(Object.assign({}, layoutOpts), { footnoteReservedHeights }));
                    // Re-map footnotes to pages (assignments may have shifted)
                    pageFootnoteMap = mapFootnotesToPages(newLayout.pages, footnoteRefs);
                    // Store footnoteIds on each page for rendering
                    for (const [pageNum, fnIds] of pageFootnoteMap) {
                        const page = newLayout.pages.find((p) => p.number === pageNum);
                        if (page) {
                            page.footnoteIds = fnIds;
                        }
                    }
                }
                else {
                    newLayout = pass1Layout;
                }
            }
            else {
                // No footnotes — single pass
                newLayout = layoutDocument(newBlocks, newMeasures, layoutOpts);
            }
            stepTime = performance.now() - stepStart;
            if (stepTime > 500) {
                console.warn(`[PagedEditor] layoutDocument took ${Math.round(stepTime)}ms (${newLayout.pages.length} pages)`);
            }
            setLayout(newLayout);
            // Step 4: Paint to DOM
            if (pagesContainerRef.current && painterRef.current) {
                stepStart = performance.now();
                pendingScrollRestoreRef.current = null;
                pendingIncrementalScrollSnapshotWrittenAtRef.current = 0;
                const pagesEl = pagesContainerRef.current;
                const scrollParent = (_d = getScrollContainer()) !== null && _d !== void 0 ? _d : findVerticalScrollParentOrRoot(pagesEl);
                let scrollRestoreRatioPre = 0;
                let domAnchorPmStart = null;
                let domAnchorOffsetInScroller = 0;
                if (scrollParent === null || scrollParent === void 0 ? void 0 : scrollParent.isConnected) {
                    if (!scrollParent.style.overflowAnchor) {
                        scrollParent.style.setProperty('overflow-anchor', 'none');
                    }
                    const maxBefore = Math.max(1, scrollParent.scrollHeight - scrollParent.clientHeight);
                    scrollRestoreRatioPre = scrollParent.scrollTop / maxBefore;
                    const head = state.selection.head;
                    domAnchorPmStart = findPaintedPmStartAtOrBefore(pagesEl, head);
                    if (domAnchorPmStart != null) {
                        const anchorEl = findBodyPmAnchor(pagesEl, domAnchorPmStart);
                        if (anchorEl) {
                            const ar = anchorEl.getBoundingClientRect();
                            const sr = scrollParent.getBoundingClientRect();
                            domAnchorOffsetInScroller = ar.top - sr.top;
                        }
                        else {
                            domAnchorPmStart = null;
                        }
                    }
                }
                // Build block lookup
                const blockLookup = new Map();
                for (let i = 0; i < newBlocks.length; i++) {
                    const block = newBlocks[i];
                    const measure = newMeasures[i];
                    if (block && measure) {
                        blockLookup.set(String(block.id), { block, measure });
                    }
                }
                painterRef.current.setBlockLookup(blockLookup);
                // Build per-page footnote render items
                const footnotesByPage = hasFootnotes
                    ? buildFootnoteRenderItems(pageFootnoteMap, footnoteContentMap, document)
                    : undefined;
                // Honor the doc-level `<w:background>` (OOXML §17.2.1)
                // — Word + Google Docs surface this as "Page color". The
                // host can still override via its own `pageBackground`
                // prop; falls back to white when neither is set. The
                // painter's `applyPageStyles` reads `backgroundColor`
                // (not `pageBackground`), so we set both keys to keep
                // `LayoutPainter`'s own `pageBackground` option happy too.
                // Read doc-level overlays from the ref so a late/async relayout
                // (font-load, rAF) uses the current document, not a stale closure.
                const currentDoc = documentRef.current;
                const docBgColor = (_g = (_f = (_e = currentDoc === null || currentDoc === void 0 ? void 0 : currentDoc.package.document.background) === null || _e === void 0 ? void 0 : _e.color) === null || _f === void 0 ? void 0 : _f.rgb) !== null && _g !== void 0 ? _g : undefined;
                const pageBackground = docBgColor ? `#${docBgColor}` : '#fff';
                // Document-level text watermark (C5). Painter draws it as a
                // rotated overlay behind the content on every page.
                const watermark = currentDoc === null || currentDoc === void 0 ? void 0 : currentDoc.package.document.watermark;
                // Render pages to container
                const renderPagesKind = renderPages(newLayout.pages, pagesContainerRef.current, {
                    pageGap,
                    showShadow: true,
                    pageBackground,
                    backgroundColor: pageBackground,
                    watermark,
                    blockLookup,
                    headerContent: headerContentForRender,
                    footerContent: footerContentForRender,
                    firstPageHeaderContent: firstPageHeaderForRender,
                    firstPageFooterContent: firstPageFooterForRender,
                    titlePg: hasTitlePg,
                    headerDistance: (sectionProperties === null || sectionProperties === void 0 ? void 0 : sectionProperties.headerDistance)
                        ? twipsToPixels(sectionProperties.headerDistance)
                        : undefined,
                    footerDistance: (sectionProperties === null || sectionProperties === void 0 ? void 0 : sectionProperties.footerDistance)
                        ? twipsToPixels(sectionProperties.footerDistance)
                        : undefined,
                    pageBorders: sectionProperties === null || sectionProperties === void 0 ? void 0 : sectionProperties.pageBorders,
                    lineNumbers: sectionProperties === null || sectionProperties === void 0 ? void 0 : sectionProperties.lineNumbers,
                    theme: _theme,
                    footnotesByPage: (footnotesByPage === null || footnotesByPage === void 0 ? void 0 : footnotesByPage.size) ? footnotesByPage : undefined,
                    resolvedCommentIds,
                    wordCompat,
                });
                const vp = viewportLayoutRef.current;
                if (vp) {
                    const mh = viewportMinHeightPx(newLayout, pageGap);
                    vp.style.minHeight = `${mh}px`;
                    if (zoom !== 1) {
                        vp.style.marginBottom = `${mh * (zoom - 1)}px`;
                    }
                    else {
                        vp.style.marginBottom = '';
                    }
                }
                if (scrollParent === null || scrollParent === void 0 ? void 0 : scrollParent.isConnected) {
                    // While a ruler margin marker is being dragged, freeze the exact
                    // pre-reflow scroll position. The margin change reflows the whole
                    // page; the ratio/DOM-anchor restore would chase the moved content
                    // and scroll the viewport out from under the marker.
                    const freeze = (marginDraggingRef === null || marginDraggingRef === void 0 ? void 0 : marginDraggingRef.current) === true;
                    let ratioForRestore = scrollRestoreRatioPre;
                    if (renderPagesKind === 'incremental') {
                        const maxPost = Math.max(1, scrollParent.scrollHeight - scrollParent.clientHeight);
                        ratioForRestore = scrollParent.scrollTop / maxPost;
                    }
                    const scrollTopSnapshot = renderPagesKind === 'incremental' || freeze ? scrollParent.scrollTop : null;
                    pendingScrollRestoreRef.current = {
                        renderKind: renderPagesKind,
                        ratio: ratioForRestore,
                        scrollTopSnapshot,
                        domAnchorPmStart,
                        domAnchorOffsetInScroller,
                        freeze,
                    };
                    if (renderPagesKind === 'incremental' && scrollTopSnapshot != null) {
                        pendingIncrementalScrollSnapshotWrittenAtRef.current = performance.now();
                    }
                }
                stepTime = performance.now() - stepStart;
                if (stepTime > 500) {
                    console.warn(`[PagedEditor] renderPages took ${Math.round(stepTime)}ms`);
                }
                // Create and expose RenderedDomContext after DOM is painted
                if (onRenderedDomContextReady) {
                    const domContext = createRenderedDomContext(pagesContainerRef.current, zoom);
                    onRenderedDomContextReady(domContext);
                }
            }
            else {
                pendingScrollRestoreRef.current = null;
                pendingIncrementalScrollSnapshotWrittenAtRef.current = 0;
            }
            // Compute anchor Y positions for comments sidebar (works without DOM queries).
            // Only runs when the sidebar callback is registered.
            if (onAnchorPositionsChange) {
                const positions = computeAnchorPositions((_j = (_h = hiddenPMRef.current) === null || _h === void 0 ? void 0 : _h.getView()) !== null && _j !== void 0 ? _j : null, newLayout, newBlocks, newMeasures, pageGap);
                onAnchorPositionsChange(positions);
            }
            applyPendingIncrementalScrollSnapshot(false);
            const totalTime = performance.now() - pipelineStart;
            if (totalTime > 2000) {
                console.warn(`[PagedEditor] Layout pipeline took ${Math.round(totalTime)}ms total ` +
                    `(${newBlocks.length} blocks, ${newMeasures.length} measures)`);
            }
        }
        catch (error) {
            console.error('[PagedEditor] Layout pipeline error:', error);
        }
        // Signal layout is complete for this sequence
        syncCoordinator.onLayoutComplete(currentEpoch);
        applyPendingIncrementalScrollSnapshot(false);
    }, [
        contentWidth,
        columns,
        pageSize,
        margins,
        finalPageSize,
        finalMargins,
        finalColumns,
        pageGap,
        zoom,
        syncCoordinator,
        headerContent,
        footerContent,
        firstPageHeaderContent,
        firstPageFooterContent,
        sectionProperties,
        finalSectionProperties,
        onRenderedDomContextReady,
        document,
        resolvedCommentIds,
        getScrollContainer,
    ]);
    // After `setLayout`, React still commits `totalHeight` / margin on the viewport wrapper.
    // Restoring scroll here (plus one rAF) matches the committed DOM scrollHeight.
    useLayoutEffect(() => {
        var _a;
        const pending = pendingScrollRestoreRef.current;
        if (!pending)
            return;
        pendingScrollRestoreRef.current = null;
        pendingIncrementalScrollSnapshotWrittenAtRef.current = 0;
        const pagesEl = pagesContainerRef.current;
        const scrollParent = (_a = getScrollContainer()) !== null && _a !== void 0 ? _a : (pagesEl ? findVerticalScrollParentOrRoot(pagesEl) : null);
        if (!pagesEl || !(scrollParent === null || scrollParent === void 0 ? void 0 : scrollParent.isConnected))
            return;
        const { renderKind, ratio, scrollTopSnapshot, domAnchorPmStart, domAnchorOffsetInScroller, freeze, } = pending;
        const applyRatio = () => {
            const maxAfter = Math.max(1, scrollParent.scrollHeight - scrollParent.clientHeight);
            scrollParent.scrollTop = ratio * maxAfter;
        };
        const applyIncrementalSnapshot = () => {
            // `freeze` (ruler drag) restores the exact scrollTop regardless of
            // renderKind so the page holds still under the dragged marker.
            if ((renderKind !== 'incremental' && !freeze) || scrollTopSnapshot == null)
                return false;
            const maxAfter = Math.max(1, scrollParent.scrollHeight - scrollParent.clientHeight);
            scrollParent.scrollTop = Math.min(Math.max(0, scrollTopSnapshot), maxAfter);
            return true;
        };
        const applyScrollRestore = () => {
            if (applyIncrementalSnapshot())
                return;
            if (renderKind !== 'incremental' && domAnchorPmStart != null) {
                const el2 = findBodyPmAnchor(pagesEl, domAnchorPmStart);
                if (el2) {
                    const sr = scrollParent.getBoundingClientRect();
                    const newOffset = el2.getBoundingClientRect().top - sr.top;
                    scrollParent.scrollTop += domAnchorOffsetInScroller - newOffset;
                    return;
                }
            }
            applyRatio();
        };
        applyScrollRestore();
        const rafId = requestAnimationFrame(() => {
            // After unmount or another layout commit, scrollParent may be detached
            // — writing scrollTop on a detached element silently no-ops, but is
            // still a leaked frame's worth of work.
            if (!scrollParent.isConnected)
                return;
            applyScrollRestore();
        });
        return () => cancelAnimationFrame(rafId);
    }, [layout, getScrollContainer]);
    // =========================================================================
    // Coalesced Layout (rAF throttle)
    // =========================================================================
    /**
     * Ref holding a pending requestAnimationFrame ID and the latest state.
     * Multiple rapid transactions (e.g. typing "hello") within the same frame
     * are coalesced so only the final state triggers a full layout pass.
     */
    const pendingLayoutRef = useRef(null);
    /**
     * Schedule a layout pipeline run for the next animation frame.
     * If a run is already scheduled, the pending state is replaced so only
     * the most recent document state gets laid out.
     */
    const scheduleLayout = useCallback((state) => {
        if (pendingLayoutRef.current) {
            // Already scheduled — just update the state to the latest
            pendingLayoutRef.current.state = state;
            return;
        }
        const rafId = requestAnimationFrame(() => {
            const pending = pendingLayoutRef.current;
            pendingLayoutRef.current = null;
            if (pending) {
                runLayoutPipeline(pending.state);
            }
        });
        pendingLayoutRef.current = { rafId, state };
    }, [runLayoutPipeline]);
    // Clean up pending rAF on unmount
    useEffect(() => {
        return () => {
            if (pendingLayoutRef.current) {
                cancelAnimationFrame(pendingLayoutRef.current.rafId);
                pendingLayoutRef.current = null;
            }
        };
    }, []);
    /**
     * Get caret position using DOM-based measurement.
     * This uses the browser's text rendering to get precise pixel positions.
     */
    const getCaretFromDom = useCallback((pmPos, currentZoom = 1) => {
        var _a, _b;
        if (!pagesContainerRef.current)
            return null;
        const overlay = (_a = pagesContainerRef.current.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('[data-testid="selection-overlay"]');
        if (!overlay)
            return null;
        const overlayRect = overlay.getBoundingClientRect();
        const spans = findBodyPmSpans(pagesContainerRef.current);
        for (const spanEl of spans) {
            const pmStart = Number(spanEl.dataset.pmStart);
            const pmEnd = Number(spanEl.dataset.pmEnd);
            // Special handling for tab spans - use exclusive end to avoid boundary conflicts
            // Tab at [5,6) means position 6 belongs to the next run, not the tab
            if (spanEl.classList.contains('layout-run-tab')) {
                if (pmPos >= pmStart && pmPos < pmEnd) {
                    const spanRect = spanEl.getBoundingClientRect();
                    const pageEl = spanEl.closest('.layout-page');
                    const pageIndex = pageEl ? Number(pageEl.dataset.pageNumber) - 1 : 0;
                    const lineEl = spanEl.closest('.layout-line');
                    const lineHeight = lineEl ? lineEl.offsetHeight : 16;
                    return {
                        x: (spanRect.left - overlayRect.left) / currentZoom,
                        y: (spanRect.top - overlayRect.top) / currentZoom,
                        height: lineHeight,
                        pageIndex,
                    };
                }
                continue; // Skip to next span
            }
            // For text runs, use inclusive range
            if (pmPos >= pmStart &&
                pmPos <= pmEnd &&
                ((_b = spanEl.firstChild) === null || _b === void 0 ? void 0 : _b.nodeType) === Node.TEXT_NODE) {
                const textNode = spanEl.firstChild;
                const charIndex = Math.min(pmPos - pmStart, textNode.length);
                // Create a range at the exact character position
                const ownerDoc = spanEl.ownerDocument;
                if (!ownerDoc)
                    continue;
                const range = ownerDoc.createRange();
                range.setStart(textNode, charIndex);
                range.setEnd(textNode, charIndex);
                const rangeRect = range.getBoundingClientRect();
                // Find which page this span is on
                const pageEl = spanEl.closest('.layout-page');
                const pageIndex = pageEl ? Number(pageEl.dataset.pageNumber) - 1 : 0;
                // Get line height from the line element or use default
                const lineEl = spanEl.closest('.layout-line');
                const lineHeight = lineEl ? lineEl.offsetHeight : 16;
                return {
                    x: (rangeRect.left - overlayRect.left) / currentZoom,
                    y: (rangeRect.top - overlayRect.top) / currentZoom,
                    height: lineHeight,
                    pageIndex,
                };
            }
        }
        // Fallback: try to find position in empty paragraphs (they have empty runs).
        const emptyRuns = findBodyEmptyRuns(pagesContainerRef.current);
        for (const emptyRun of emptyRuns) {
            const paragraph = emptyRun.closest('.layout-paragraph');
            if (!paragraph)
                continue;
            const pmStart = Number(paragraph.dataset.pmStart);
            const pmEnd = Number(paragraph.dataset.pmEnd);
            if (pmPos >= pmStart && pmPos <= pmEnd) {
                const runRect = emptyRun.getBoundingClientRect();
                const pageEl = paragraph.closest('.layout-page');
                const pageIndex = pageEl ? Number(pageEl.dataset.pageNumber) - 1 : 0;
                const lineEl = emptyRun.closest('.layout-line');
                const lineHeight = lineEl ? lineEl.offsetHeight : 16;
                return {
                    x: (runRect.left - overlayRect.left) / currentZoom,
                    y: (runRect.top - overlayRect.top) / currentZoom,
                    height: lineHeight,
                    pageIndex,
                };
            }
        }
        return null;
    }, []);
    /**
     * Update selection overlay from PM selection.
     */
    const updateSelectionOverlay = useCallback((state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const { from, to } = state.selection;
        // Notify consumers only when PM state actually changed. Overlay may
        // still need redraw for DOM geometry reasons (resize, layout, font
        // load) — that happens below — but the public callback should only
        // fire for real selection / doc / stored-marks changes. See
        // lastNotifiedStateRef comment; regression #268.
        if (lastNotifiedStateRef.current !== state) {
            lastNotifiedStateRef.current = state;
            (_a = onSelectionChangeRef.current) === null || _a === void 0 ? void 0 : _a.call(onSelectionChangeRef, from, to);
        }
        // Update visual cell selection highlighting on visible layout table cells
        if (pagesContainerRef.current) {
            // Clear previous cell highlighting
            const prevSelected = pagesContainerRef.current.querySelectorAll('.layout-table-cell-selected');
            for (const el of Array.from(prevSelected)) {
                el.classList.remove('layout-table-cell-selected');
            }
            // If CellSelection, highlight the corresponding visible cells
            // Use duck-typing ($anchorCell) instead of instanceof to avoid bundling issues
            const sel = state.selection;
            const isCellSel = '$anchorCell' in sel && typeof sel.forEachCell === 'function';
            if (isCellSel) {
                // Collect ranges [cellStart, cellEnd) for each selected cell
                const selectedRanges = [];
                sel.forEachCell((node, pos) => {
                    selectedRanges.push([pos, pos + node.nodeSize]);
                });
                // Find visible layout cells whose pmStart falls inside a selected cell range
                const allCells = pagesContainerRef.current.querySelectorAll('.layout-table-cell');
                for (const cellEl of Array.from(allCells)) {
                    const htmlEl = cellEl;
                    const pmStartAttr = htmlEl.dataset.pmStart;
                    if (pmStartAttr !== undefined) {
                        const pmPos = Number(pmStartAttr);
                        for (const [start, end] of selectedRanges) {
                            if (pmPos >= start && pmPos < end) {
                                htmlEl.classList.add('layout-table-cell-selected');
                                break;
                            }
                        }
                    }
                }
            }
        }
        // Table "Format" chip — anchor to the painted table containing the
        // caret (top-right corner), mirroring the image chip. Cleared when the
        // caret leaves any table. getTableContext is the authoritative
        // in-table test; the DOM lookup only locates the painted box.
        {
            const pagesEl = pagesContainerRef.current;
            const viewportEl = pagesEl === null || pagesEl === void 0 ? void 0 : pagesEl.parentElement;
            let nextChip = null;
            if (pagesEl && viewportEl) {
                let inTable = false;
                try {
                    inTable = getTableContext(state).isInTable;
                }
                catch (_k) {
                    inTable = false;
                }
                if (inTable) {
                    // Painted cell enclosing the caret = greatest data-pm-start <= from.
                    const cells = pagesEl.querySelectorAll('.layout-table-cell[data-pm-start]');
                    let bestCell = null;
                    let bestStart = -1;
                    for (const c of Array.from(cells)) {
                        const s = Number(c.dataset.pmStart);
                        if (!Number.isNaN(s) && s <= from && s > bestStart) {
                            bestStart = s;
                            bestCell = c;
                        }
                    }
                    const tableEl = bestCell === null || bestCell === void 0 ? void 0 : bestCell.closest('.layout-table');
                    if (tableEl) {
                        const tRect = tableEl.getBoundingClientRect();
                        const vRect = viewportEl.getBoundingClientRect();
                        // Both rects are post-`scale(zoom)` screen boxes, but this chip
                        // is a child of the scaled viewport, so the browser re-scales by
                        // zoom on paint. Divide the screen-space delta by zoom (same as
                        // the selection-overlay math) or the chip double-scales and
                        // drifts away from the table proportional to (zoom − 1).
                        nextChip = {
                            x: (tRect.right - vRect.left) / zoom,
                            y: (tRect.top - vRect.top) / zoom,
                        };
                    }
                }
            }
            setTableChipPos((prev) => {
                if (prev === nextChip)
                    return prev;
                if (prev && nextChip && prev.x === nextChip.x && prev.y === nextChip.y)
                    return prev;
                return nextChip;
            });
        }
        // Text box "Format" chip — anchor to the painted text box whose
        // [data-pm-start, data-pm-end) range contains the caret.
        {
            const pagesEl = pagesContainerRef.current;
            const viewportEl = pagesEl === null || pagesEl === void 0 ? void 0 : pagesEl.parentElement;
            let nextTb = null;
            if (pagesEl && viewportEl) {
                const boxes = pagesEl.querySelectorAll('.layout-textbox[data-pm-start]');
                for (const el of Array.from(boxes)) {
                    const htmlEl = el;
                    const s = Number(htmlEl.dataset.pmStart);
                    const e = Number(htmlEl.dataset.pmEnd);
                    if (!Number.isNaN(s) && !Number.isNaN(e) && from >= s && from < e) {
                        const r = htmlEl.getBoundingClientRect();
                        const v = viewportEl.getBoundingClientRect();
                        // Divide screen-space deltas + dims by zoom: this box is a child
                        // of the scaled viewport, so the browser re-scales on paint.
                        // Without it the chip + resize handles double-scale and drift
                        // off the text box proportional to (zoom − 1).
                        nextTb = {
                            x: (r.right - v.left) / zoom,
                            y: (r.top - v.top) / zoom,
                            left: (r.left - v.left) / zoom,
                            top: (r.top - v.top) / zoom,
                            width: r.width / zoom,
                            height: r.height / zoom,
                        };
                        break;
                    }
                }
            }
            setTextBoxChipPos((prev) => {
                if (prev === nextTb)
                    return prev;
                if (prev &&
                    nextTb &&
                    prev.left === nextTb.left &&
                    prev.top === nextTb.top &&
                    prev.width === nextTb.width &&
                    prev.height === nextTb.height)
                    return prev;
                return nextTb;
            });
        }
        if (!layout || blocks.length === 0)
            return;
        // Collapsed selection - show caret
        if (from === to) {
            // Use DOM-based caret positioning for accuracy
            const domCaret = getCaretFromDom(from, zoom);
            if (domCaret) {
                setCaretPosition(domCaret);
            }
            else {
                // Fallback to layout-based calculation if DOM not ready
                const overlay = (_c = (_b = pagesContainerRef.current) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.querySelector('[data-testid="selection-overlay"]');
                const firstPage = (_d = pagesContainerRef.current) === null || _d === void 0 ? void 0 : _d.querySelector('.layout-page');
                if (overlay && firstPage) {
                    const overlayRect = overlay.getBoundingClientRect();
                    const pageRect = firstPage.getBoundingClientRect();
                    const caret = getCaretPosition(layout, blocks, measures, from);
                    if (caret) {
                        setCaretPosition(Object.assign(Object.assign({}, caret), { x: caret.x + (pageRect.left - overlayRect.left) / zoom, y: caret.y + (pageRect.top - overlayRect.top) / zoom }));
                    }
                    else {
                        setCaretPosition(null);
                    }
                }
                else {
                    setCaretPosition(null);
                }
            }
            setSelectionRects([]);
        }
        else {
            // Range selection - show highlight rectangles using DOM-based approach
            const overlay = (_f = (_e = pagesContainerRef.current) === null || _e === void 0 ? void 0 : _e.parentElement) === null || _f === void 0 ? void 0 : _f.querySelector('[data-testid="selection-overlay"]');
            if (overlay && pagesContainerRef.current) {
                const overlayRect = overlay.getBoundingClientRect();
                const domRects = [];
                const spans = findBodyPmSpans(pagesContainerRef.current);
                for (const spanEl of spans) {
                    const pmStart = Number(spanEl.dataset.pmStart);
                    const pmEnd = Number(spanEl.dataset.pmEnd);
                    // Check if this span overlaps with selection
                    if (pmEnd > from && pmStart < to) {
                        // Special handling for tab spans - highlight the full visual width
                        if (spanEl.classList.contains('layout-run-tab')) {
                            const spanRect = spanEl.getBoundingClientRect();
                            const pageEl = spanEl.closest('.layout-page');
                            const pageIndex = pageEl
                                ? Number(pageEl.dataset.pageNumber) - 1
                                : 0;
                            domRects.push({
                                x: (spanRect.left - overlayRect.left) / zoom,
                                y: (spanRect.top - overlayRect.top) / zoom,
                                width: spanRect.width / zoom,
                                height: spanRect.height / zoom,
                                pageIndex,
                            });
                            continue;
                        }
                        // Find the text node — may be a direct child or inside an <a> for hyperlinks
                        let textNode = null;
                        if (((_g = spanEl.firstChild) === null || _g === void 0 ? void 0 : _g.nodeType) === Node.TEXT_NODE) {
                            textNode = spanEl.firstChild;
                        }
                        else if (((_h = spanEl.firstChild) === null || _h === void 0 ? void 0 : _h.nodeType) === Node.ELEMENT_NODE &&
                            spanEl.firstChild.tagName === 'A' &&
                            ((_j = spanEl.firstChild.firstChild) === null || _j === void 0 ? void 0 : _j.nodeType) === Node.TEXT_NODE) {
                            textNode = spanEl.firstChild.firstChild;
                        }
                        if (!textNode)
                            continue;
                        const ownerDoc = spanEl.ownerDocument;
                        if (!ownerDoc)
                            continue;
                        // Calculate the character range within this span
                        const startChar = Math.max(0, from - pmStart);
                        const endChar = Math.min(textNode.length, to - pmStart);
                        if (startChar < endChar) {
                            const range = ownerDoc.createRange();
                            range.setStart(textNode, startChar);
                            range.setEnd(textNode, endChar);
                            // Get all client rects for this range (handles line wraps)
                            const clientRects = range.getClientRects();
                            for (const rect of Array.from(clientRects)) {
                                const pageEl = spanEl.closest('.layout-page');
                                const pageIndex = pageEl
                                    ? Number(pageEl.dataset.pageNumber) - 1
                                    : 0;
                                domRects.push({
                                    x: (rect.left - overlayRect.left) / zoom,
                                    y: (rect.top - overlayRect.top) / zoom,
                                    width: rect.width / zoom,
                                    height: rect.height / zoom,
                                    pageIndex,
                                });
                            }
                        }
                    }
                }
                if (domRects.length > 0) {
                    setSelectionRects(domRects);
                }
                else {
                    // Fallback to layout-based calculation
                    const firstPage = pagesContainerRef.current.querySelector('.layout-page');
                    if (firstPage) {
                        const pageRect = firstPage.getBoundingClientRect();
                        const pageOffsetX = (pageRect.left - overlayRect.left) / zoom;
                        const pageOffsetY = (pageRect.top - overlayRect.top) / zoom;
                        const rects = selectionToRects(layout, blocks, measures, from, to);
                        const adjustedRects = rects.map((rect) => (Object.assign(Object.assign({}, rect), { x: rect.x + pageOffsetX, y: rect.y + pageOffsetY })));
                        setSelectionRects(adjustedRects);
                    }
                    else {
                        setSelectionRects([]);
                    }
                }
            }
            else {
                setSelectionRects([]);
            }
            setCaretPosition(null);
        }
    }, [layout, blocks, measures, getCaretFromDom, zoom]
    // NOTE: onSelectionChange removed from dependencies - accessed via ref to prevent infinite loops
    );
    // Re-anchor on-canvas selection chrome (the text-box "Format" chip + blue
    // box + resize handles) when the page reflows WITHOUT a PM transaction —
    // most notably when the Format panel opens as a flex sibling and shrinks the
    // page column. `updateSelectionOverlay` only re-runs on PM selection/doc
    // changes, so without this the text-box box stayed at the old coordinates
    // and the user had to close + reopen the panel to realign it. A
    // ResizeObserver on the pages viewport (the coordinate frame the chip is
    // measured against) catches the reflow and recomputes. (Images self-heal via
    // ImageSelectionOverlay's own ResizeObserver.)
    useEffect(() => {
        var _a;
        const viewportEl = (_a = pagesContainerRef.current) === null || _a === void 0 ? void 0 : _a.parentElement;
        if (!viewportEl || typeof ResizeObserver === 'undefined')
            return;
        let raf = 0;
        const ro = new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                var _a;
                const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (view)
                    updateSelectionOverlay(view.state);
                // The reflow re-renders the painted pages, REPLACING the <img> node —
                // so the image overlay's stored element ref is now detached (its
                // getBoundingClientRect() returns 0 and the box jumps off-screen).
                // Re-find the live image for the selection's PM position and rebuild
                // the selection info so the overlay tracks the new node. Then bump the
                // tick so the overlay recomputes against it.
                setSelectedImageInfo((prev) => {
                    var _a;
                    if (!prev || prev.element.isConnected)
                        return prev;
                    const root = pagesContainerRef.current;
                    if (!root)
                        return prev;
                    const holder = root.querySelector(`[data-pm-start="${prev.pmPos}"]`);
                    const live = ((holder === null || holder === void 0 ? void 0 : holder.tagName) === 'IMG' ? holder : ((_a = holder === null || holder === void 0 ? void 0 : holder.querySelector('img')) !== null && _a !== void 0 ? _a : holder));
                    return live ? buildImageSelectionInfo(live, prev.pmPos) : prev;
                });
                setOverlayReanchorTick((t) => t + 1);
            });
        });
        ro.observe(viewportEl);
        return () => {
            ro.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [updateSelectionOverlay, buildImageSelectionInfo]);
    // =========================================================================
    // Event Handlers
    // =========================================================================
    /**
     * Handle PM transaction - re-layout on content/selection change.
     */
    const handleTransaction = useCallback((transaction, newState) => {
        var _a, _b;
        // Bump on every transaction (including selection-only and meta-only
        // ones) so DecorationLayer re-syncs — yCursorPlugin awareness updates
        // arrive as meta transactions with no doc change.
        setTransactionVersion((v) => v + 1);
        if (transaction.docChanged) {
            // Increment state sequence to signal document changed
            syncCoordinator.incrementStateSeq();
            // Content changed - schedule layout (coalesced via rAF)
            scheduleLayout(newState);
            // Notify document change - use ref to avoid infinite loops
            const newDoc = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getDocument();
            if (newDoc) {
                (_b = onDocumentChangeRef.current) === null || _b === void 0 ? void 0 : _b.call(onDocumentChangeRef, newDoc);
            }
        }
        // Request selection update (will only execute when layout is current)
        syncCoordinator.requestRender();
        // Only update selection overlay immediately for non-doc-changing transactions
        // (e.g. arrow keys, clicks). For doc changes, the overlay will be updated
        // after layout completes via the useEffect([layout]) hook, avoiding cursor
        // flicker from stale DOM positions.
        if (!transaction.docChanged) {
            updateSelectionOverlay(newState);
        }
    }, [scheduleLayout, updateSelectionOverlay, syncCoordinator]
    // NOTE: onDocumentChange removed from dependencies - accessed via ref to prevent infinite loops
    );
    /**
     * Handle selection change from PM.
     */
    const handleSelectionChange = useCallback((state) => {
        // Check if this is an image node selection - suppress text overlay if so
        const { selection } = state;
        if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
            // Suppress text selection overlay for image selections
            setSelectionRects([]);
            setCaretPosition(null);
        }
        else if (syncCoordinator.isSafeToRender()) {
            // Only update overlay when layout is current. When doc changed,
            // layout is pending and DOM hasn't been updated yet — updating the
            // overlay now would position the cursor against stale geometry,
            // causing it to visibly jump. The overlay will be updated after
            // layout completes via the useEffect([layout]) hook.
            updateSelectionOverlay(state);
        }
        // Defer image selection check until after layout update
        requestAnimationFrame(() => {
            var _a;
            const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (!view) {
                setSelectedImageInfo(null);
                return;
            }
            const { selection: sel } = view.state;
            if (sel instanceof NodeSelection && sel.node.type.name === 'image') {
                const pmPos = sel.from;
                // Header/footer images live in a SEPARATE ProseMirror
                // document, painted into `.layout-page-header` or
                // `.layout-page-footer` — the body-scoped lookup misses
                // them entirely and we'd silently drop the selection
                // info → no resize handles on HF images (GH #266).
                // Route through the HF-scoped helper when hfEditMode is
                // active so handles attach to the correct DOM element.
                const imgEl = pagesContainerRef.current
                    ? hfEditMode
                        ? findHeaderFooterPmAnchor(pagesContainerRef.current, pmPos, hfEditMode)
                        : findBodyPmAnchor(pagesContainerRef.current, pmPos)
                    : null;
                if (imgEl) {
                    setSelectedImageInfo(buildImageSelectionInfo(imgEl, pmPos));
                    return;
                }
            }
            if (!isImageInteractingRef.current) {
                setSelectedImageInfo(null);
            }
        });
    }, [updateSelectionOverlay, zoom, buildImageSelectionInfo, syncCoordinator, hfEditMode]);
    /**
     * Get PM position from mouse coordinates using DOM-based detection.
     * Falls back to geometry-based calculation if DOM mapping fails.
     */
    const getPositionFromMouse = useCallback((clientX, clientY) => {
        if (!pagesContainerRef.current || !layout)
            return null;
        // Try DOM-based click mapping first (most accurate)
        const domPos = clickToPositionDom(pagesContainerRef.current, clientX, clientY, zoom);
        if (domPos !== null) {
            return domPos;
        }
        // Fallback to geometry-based mapping
        const pageElements = pagesContainerRef.current.querySelectorAll('.layout-page');
        let clickedPageIndex = -1;
        let pageRect = null;
        for (let i = 0; i < pageElements.length; i++) {
            const pageEl = pageElements[i];
            const rect = pageEl.getBoundingClientRect();
            if (clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom) {
                clickedPageIndex = i;
                pageRect = rect;
                break;
            }
        }
        if (clickedPageIndex < 0 || !pageRect) {
            return null;
        }
        const pageX = (clientX - pageRect.left) / zoom;
        const pageY = (clientY - pageRect.top) / zoom;
        const page = layout.pages[clickedPageIndex];
        if (!page)
            return null;
        const pageHit = {
            pageIndex: clickedPageIndex,
            page,
            pageY,
        };
        const fragmentHit = hitTestFragment(pageHit, blocks, measures, {
            x: pageX,
            y: pageY,
        });
        if (!fragmentHit)
            return null;
        // For table fragments, do cell-level hit testing
        if (fragmentHit.fragment.kind === 'table') {
            const tableCellHit = hitTestTableCell(pageHit, blocks, measures, {
                x: pageX,
                y: pageY,
            });
            return clickToPosition(fragmentHit, tableCellHit);
        }
        return clickToPosition(fragmentHit);
    }, [layout, blocks, measures, zoom]);
    /**
     * Find the table cell position in ProseMirror doc for a given PM position.
     * Returns the position just inside the cell node, suitable for CellSelection.create().
     */
    const findCellPosFromPmPos = useCallback((pmPos) => {
        var _a;
        const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return null;
        try {
            const $pos = view.state.doc.resolve(pmPos);
            for (let d = $pos.depth; d > 0; d--) {
                const node = $pos.node(d);
                if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                    // Return position of the cell node itself (before(d)).
                    // CellSelection.create will resolve this and use cellAround() internally.
                    return $pos.before(d);
                }
            }
        }
        catch (_b) {
            // Position resolution failed
        }
        return null;
    }, []);
    /**
     * Find the closest image element from a click target.
     * Returns the element with data-pm-start if it's an image, or null.
     */
    const findImageElement = useCallback((target) => {
        const IMAGE_CONTAINER_CLASSES = [
            'layout-block-image',
            'layout-image',
            'layout-page-floating-image',
            // Floating images anchored inside a table cell paint via the same
            // renderFloatingImagesLayer helper (so they carry data-pm-start), but
            // were missing here — clicking one fell through and couldn't select it.
            'layout-cell-floating-image',
        ];
        const isImageContainer = (el) => !!el.dataset.pmStart && IMAGE_CONTAINER_CLASSES.some((c) => el.classList.contains(c));
        // Inline images: <img class="layout-run layout-run-image" data-pm-start="X">
        if (target.tagName === 'IMG' && target.classList.contains('layout-run-image')) {
            return target;
        }
        // Click on <img> inside a container div, or directly on the container
        if (target.tagName === 'IMG' &&
            target.parentElement &&
            isImageContainer(target.parentElement)) {
            return target.parentElement;
        }
        if (isImageContainer(target)) {
            return target;
        }
        return null;
    }, []);
    /**
     * AbortController shared by every in-flight scroll's rAF chain. Aborted
     * on unmount or whenever a new scroll request supersedes the previous
     * one. Prevents writing scrollTop on a detached scroller, and prevents
     * a stale paint-settle from clobbering a fresh user-initiated scroll.
     */
    const scrollAbortRef = useRef(null);
    useEffect(() => {
        return () => {
            var _a;
            (_a = scrollAbortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
            scrollAbortRef.current = null;
        };
    }, []);
    /**
     * Scroll pages to a ProseMirror position (handles virtualization via page shells).
     * @param forParaIdScroll — when true, use manual container scroll (reliable under CSS
     *   transform / zoom). Otherwise use `scrollIntoView` (legacy behavior for outline,
     *   bookmarks, etc.).
     */
    const scrollToPositionImpl = useCallback((pmPos, forParaIdScroll = false) => {
        var _a, _b;
        // Reject malformed input — pmPos must be a non-negative integer.
        // Without this, a string or float would be interpolated into the
        // [data-pm-start="..."] selector below and either crash with a
        // SyntaxError or escape the attribute (selector injection).
        if (!Number.isInteger(pmPos) || pmPos < 0)
            return;
        const pages = pagesContainerRef.current;
        if (!pages)
            return;
        // Abort any in-flight scroll's rAF chain — its paint-settle would
        // otherwise stomp on this fresh scroll target a few frames later.
        (_a = scrollAbortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        const ac = new AbortController();
        scrollAbortRef.current = ac;
        const { signal } = ac;
        const queryPaintedStartEl = () => findBodyPmAnchor(pages, pmPos);
        if (!forParaIdScroll) {
            // Smooth scroll preserves the legacy UX for outline / bookmark /
            // hyperlink / find-replace navigation. The paraId path uses an
            // instant manual scroll instead because smooth fights the layout
            // restore that runs during virtualized paint.
            const smoothScroll = {
                block: 'center',
                inline: 'nearest',
                behavior: 'smooth',
            };
            const targetEl = queryPaintedStartEl();
            if (targetEl) {
                targetEl.scrollIntoView(smoothScroll);
                return;
            }
            const lay = layout;
            const blk = blocks;
            const meas = measures;
            if (!lay || blk.length === 0 || meas.length !== blk.length)
                return;
            let pageIndex = null;
            const caret = getCaretPosition(lay, blk, meas, pmPos);
            if (caret) {
                pageIndex = caret.pageIndex;
            }
            else {
                pageIndex = findPageIndexContainingPmPos(lay, pmPos);
            }
            if (pageIndex == null)
                return;
            const pageShells = pages.querySelectorAll('.layout-page');
            const shell = pageShells[pageIndex];
            if (!shell)
                return;
            shell.scrollIntoView(smoothScroll);
            runAfterPaint(() => {
                if (!pages.isConnected)
                    return;
                const painted = queryPaintedStartEl();
                if (painted)
                    painted.scrollIntoView(smoothScroll);
            }, signal);
            return;
        }
        const scroller = (_b = getScrollContainer()) !== null && _b !== void 0 ? _b : findVerticalScrollParentOrRoot(pages);
        const scrollPaintedTargetInstant = () => {
            const targetEl = queryPaintedStartEl();
            if (!targetEl)
                return false;
            scrollElementCenterIntoContainer(targetEl, scroller, 'instant');
            return true;
        };
        if (scrollPaintedTargetInstant())
            return;
        const lay = layout;
        const blk = blocks;
        const meas = measures;
        if (!lay || blk.length === 0 || meas.length !== blk.length)
            return;
        let pageIndex = null;
        const caret = getCaretPosition(lay, blk, meas, pmPos);
        if (caret) {
            pageIndex = caret.pageIndex;
        }
        else {
            pageIndex = findPageIndexContainingPmPos(lay, pmPos);
        }
        if (pageIndex == null)
            return;
        const pageShells = pages.querySelectorAll('.layout-page');
        const shell = pageShells[pageIndex];
        if (!shell)
            return;
        // Long jump / virtualization: instant only — smooth fights layout/scroll restore.
        scrollElementCenterIntoContainer(shell, scroller, 'instant');
        runAfterPaint(() => {
            if (!pages.isConnected)
                return;
            const painted = queryPaintedStartEl();
            if (painted) {
                scrollElementCenterIntoContainer(painted, scroller, 'instant');
            }
            else {
                scrollPaintedTargetInstant();
            }
        }, signal);
    }, [layout, blocks, measures, getScrollContainer]);
    // 1-indexed pageNumber. Prefers scrolling to the page's first PM-anchored
    // fragment so virtualization is handled by scrollToPositionImpl. Falls
    // back to the page shell directly when no fragment carries pmStart
    // (e.g. a page containing only a continuation of a long paragraph or a
    // floating image without a PM anchor).
    const scrollToPageImpl = useCallback((pageNumber) => {
        var _a;
        if (!Number.isInteger(pageNumber) || pageNumber < 1)
            return;
        if (!layout || pageNumber > layout.pages.length)
            return;
        const page = layout.pages[pageNumber - 1];
        for (const frag of page.fragments) {
            if (typeof frag.pmStart === 'number') {
                scrollToPositionImpl(frag.pmStart, true);
                return;
            }
        }
        const shell = (_a = pagesContainerRef.current) === null || _a === void 0 ? void 0 : _a.querySelectorAll('.layout-page')[pageNumber - 1];
        shell === null || shell === void 0 ? void 0 : shell.scrollIntoView({ block: 'center', inline: 'nearest' });
    }, [layout, scrollToPositionImpl]);
    const scrollToParaIdImpl = useCallback((paraId) => {
        var _a, _b;
        const state = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState();
        if (!state)
            return false;
        const startPos = findStartPosForParaId(state.doc, paraId);
        if (startPos == null || startPos < 0)
            return false;
        scrollToPositionImpl(startPos, true);
        // Defer selection/focus until after the scroll's paint-settle rAF
        // chain runs. Setting selection synchronously on a virtualized
        // (unpainted) target triggers a layout/scroll-restore cycle that
        // fights the in-flight scroll. Reuses the same AbortController so
        // a superseding scroll cancels this too.
        const signal = (_b = scrollAbortRef.current) === null || _b === void 0 ? void 0 : _b.signal;
        if (!signal)
            return true;
        const targetNode = state.doc.nodeAt(startPos);
        const inner = (targetNode === null || targetNode === void 0 ? void 0 : targetNode.isTextblock) === true
            ? Math.min(startPos + 1 + targetNode.content.size, state.doc.content.size)
            : Math.min(startPos + 1, state.doc.content.size);
        runAfterPaint(() => {
            if (!hiddenPMRef.current)
                return;
            hiddenPMRef.current.setSelection(inner);
            hiddenPMRef.current.focus();
        }, signal);
        return true;
    }, [scrollToPositionImpl]);
    /**
     * Handle mousedown on pages - start selection or drag.
     */
    const handlePagesMouseDown = useCallback((e) => {
        var _a, _b, _c, _d, _e, _f;
        if (!hiddenPMRef.current)
            return;
        // Right-click: prevent default to stop Firefox from resetting selection,
        // but don't process our selection logic
        if (e.button === 2) {
            e.preventDefault();
            return;
        }
        if (e.button !== 0)
            return; // Only handle left click
        // Hide table insert button on any mousedown
        setTableInsertButton(null);
        clearTableInsertTimer();
        // Prevent default browser navigation for hyperlink clicks,
        // but let the rest of the handler run for cursor placement and drag selection.
        // The popup is shown in handlePagesClick (on mouseup) instead.
        const anchorEl = e.target.closest('a[href]');
        if (anchorEl) {
            e.preventDefault(); // Prevent navigation only
        }
        if (readOnly)
            return;
        // When in HF edit mode, clicks outside header/footer area close the HF editor
        if (hfEditMode && onBodyClick) {
            const target = e.target;
            const isInHfArea = target.closest('.layout-page-header') ||
                target.closest('.layout-page-footer') ||
                target.closest('.hf-inline-editor');
            if (!isInHfArea) {
                e.preventDefault();
                e.stopPropagation();
                onBodyClick();
                return;
            }
        }
        // In normal mode, clicks in header/footer area should place cursor at
        // start of body content, not inside header/footer (matches Word/Google Docs)
        if (!hfEditMode) {
            const target = e.target;
            const isInHfArea = target.closest('.layout-page-header') || target.closest('.layout-page-footer');
            if (isInHfArea) {
                e.preventDefault();
                // Place cursor at start of body content
                if (hiddenPMRef.current) {
                    hiddenPMRef.current.setSelection(0);
                    hiddenPMRef.current.focus();
                    setIsFocused(true);
                }
                return;
            }
        }
        // Column resize: intercept clicks on resize handles
        const target = e.target;
        if (target.classList.contains('layout-table-resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            isResizingColumnRef.current = true;
            resizeStartXRef.current = e.clientX;
            resizeHandleRef.current = target;
            target.classList.add('dragging');
            const colIndex = parseInt((_a = target.dataset.columnIndex) !== null && _a !== void 0 ? _a : '0', 10);
            resizeColumnIndexRef.current = colIndex;
            resizeTablePmStartRef.current = parseInt((_b = target.dataset.tablePmStart) !== null && _b !== void 0 ? _b : '0', 10);
            // Get current column widths from the ProseMirror doc
            const view = hiddenPMRef.current.getView();
            if (view) {
                const $pos = view.state.doc.resolve(resizeTablePmStartRef.current + 1);
                for (let d = $pos.depth; d >= 0; d--) {
                    const node = $pos.node(d);
                    if (node.type.name === 'table') {
                        const widths = node.attrs.columnWidths;
                        if (widths &&
                            widths[colIndex] !== undefined &&
                            widths[colIndex + 1] !== undefined) {
                            resizeOrigWidthsRef.current = {
                                left: widths[colIndex],
                                right: widths[colIndex + 1],
                            };
                        }
                        break;
                    }
                }
            }
            return;
        }
        // Row resize: intercept clicks on row resize handles or bottom edge handle
        if (target.classList.contains('layout-table-row-resize-handle') ||
            target.classList.contains('layout-table-edge-handle-bottom')) {
            e.preventDefault();
            e.stopPropagation();
            isResizingRowRef.current = true;
            resizeStartYRef.current = e.clientY;
            resizeRowHandleRef.current = target;
            resizeRowIsEdgeRef.current = target.dataset.isEdge === 'bottom';
            target.classList.add('dragging');
            const rowIndex = parseInt((_c = target.dataset.rowIndex) !== null && _c !== void 0 ? _c : '0', 10);
            resizeRowIndexRef.current = rowIndex;
            resizeRowTablePmStartRef.current = parseInt((_d = target.dataset.tablePmStart) !== null && _d !== void 0 ? _d : '0', 10);
            // Get current row height from ProseMirror doc
            const view = hiddenPMRef.current.getView();
            if (view) {
                const $pos = view.state.doc.resolve(resizeRowTablePmStartRef.current + 1);
                for (let d = $pos.depth; d >= 0; d--) {
                    const node = $pos.node(d);
                    if (node.type.name === 'table') {
                        let rowNode = null;
                        let idx = 0;
                        node.forEach((child) => {
                            if (idx === rowIndex)
                                rowNode = child;
                            idx++;
                        });
                        if (rowNode) {
                            const height = rowNode.attrs.height;
                            if (height) {
                                resizeRowOrigHeightRef.current = height;
                            }
                            else {
                                // Estimate from rendered height: find the row element
                                const tableEl = target.closest('.layout-table');
                                const rowEl = tableEl === null || tableEl === void 0 ? void 0 : tableEl.querySelector(`[data-row-index="${rowIndex}"]`);
                                const renderedHeight = rowEl
                                    ? rowEl.getBoundingClientRect().height
                                    : 30;
                                resizeRowOrigHeightRef.current = Math.round(renderedHeight * 15);
                            }
                        }
                        break;
                    }
                }
            }
            return;
        }
        // Right edge resize: intercept clicks on right edge handle
        if (target.classList.contains('layout-table-edge-handle-right')) {
            e.preventDefault();
            e.stopPropagation();
            isResizingRightEdgeRef.current = true;
            resizeRightEdgeStartXRef.current = e.clientX;
            resizeRightEdgeHandleRef.current = target;
            target.classList.add('dragging');
            const colIndex = parseInt((_e = target.dataset.columnIndex) !== null && _e !== void 0 ? _e : '0', 10);
            resizeRightEdgeColIndexRef.current = colIndex;
            resizeRightEdgePmStartRef.current = parseInt((_f = target.dataset.tablePmStart) !== null && _f !== void 0 ? _f : '0', 10);
            // Get current last column width from ProseMirror doc
            const view = hiddenPMRef.current.getView();
            if (view) {
                const $pos = view.state.doc.resolve(resizeRightEdgePmStartRef.current + 1);
                for (let d = $pos.depth; d >= 0; d--) {
                    const node = $pos.node(d);
                    if (node.type.name === 'table') {
                        const widths = node.attrs.columnWidths;
                        if (widths && widths[colIndex] !== undefined) {
                            resizeRightEdgeOrigWidthRef.current = widths[colIndex];
                        }
                        break;
                    }
                }
            }
            return;
        }
        // Check if the click target is an image element
        const imageEl = findImageElement(target);
        if (imageEl) {
            e.preventDefault();
            e.stopPropagation();
            const pmStart = imageEl.dataset.pmStart;
            if (pmStart !== undefined) {
                const pos = parseInt(pmStart, 10);
                hiddenPMRef.current.setNodeSelection(pos);
                setSelectedImageInfo(buildImageSelectionInfo(imageEl, pos));
                setSelectionRects([]);
                setCaretPosition(null);
            }
            hiddenPMRef.current.focus();
            setIsFocused(true);
            return;
        }
        // Clicking outside an image clears image selection
        setSelectedImageInfo(null);
        e.preventDefault(); // Prevent native text selection
        const pmPos = getPositionFromMouse(e.clientX, e.clientY);
        if (pmPos !== null) {
            // Check if click is inside a table cell - track for potential cell drag selection
            const cellPos = findCellPosFromPmPos(pmPos);
            cellDragAnchorPosRef.current = cellPos;
            isCellDraggingRef.current = false;
            cellDragLastPmPosRef.current = null;
            cellDragOverflowXRef.current = null;
            // Start dragging
            isDraggingRef.current = true;
            dragAnchorRef.current = pmPos;
            // Set initial selection (collapsed)
            hiddenPMRef.current.setSelection(pmPos);
        }
        else {
            // Clicked outside content - move to end
            cellDragAnchorPosRef.current = null;
            isCellDraggingRef.current = false;
            const view = hiddenPMRef.current.getView();
            if (view) {
                const endPos = Math.max(0, view.state.doc.content.size - 1);
                hiddenPMRef.current.setSelection(endPos);
                dragAnchorRef.current = endPos;
                isDraggingRef.current = true;
            }
        }
        // Focus the hidden editor
        hiddenPMRef.current.focus();
        setIsFocused(true);
    }, [
        getPositionFromMouse,
        findCellPosFromPmPos,
        readOnly,
        hfEditMode,
        onBodyClick,
        zoom,
        onHyperlinkClick,
        clearTableInsertTimer,
    ]);
    // Drag auto-scroll: scrolls when dragging near viewport edges
    const dragAutoScrollCallbackRef = useCallback((cx, cy) => {
        dragExtendRef.current(cx, cy);
    }, []);
    const { updateMousePosition: updateDragScroll, stopAutoScroll: stopDragAutoScroll } = useDragAutoScroll({
        pagesContainerRef,
        onScrollExtendSelection: dragAutoScrollCallbackRef,
    });
    // Wire up the drag-extend callback after getPositionFromMouse is available
    dragExtendRef.current = (cx, cy) => {
        if (!isDraggingRef.current || dragAnchorRef.current === null)
            return;
        if (!hiddenPMRef.current)
            return;
        const pmPos = getPositionFromMouse(cx, cy);
        if (pmPos === null)
            return;
        hiddenPMRef.current.setSelection(dragAnchorRef.current, pmPos);
    };
    /**
     * Handle mousemove - extend selection during drag.
     */
    const handleMouseMove = useCallback((e) => {
        // Column resize drag
        if (isResizingColumnRef.current) {
            e.preventDefault();
            const delta = e.clientX - resizeStartXRef.current;
            // Move the handle visually
            if (resizeHandleRef.current) {
                const origLeft = parseFloat(resizeHandleRef.current.style.left);
                resizeHandleRef.current.style.left = `${origLeft + delta}px`;
                resizeStartXRef.current = e.clientX;
                // Update stored widths (convert pixel delta to twips: 1px ≈ 15 twips at 96dpi)
                const deltaTwips = Math.round(delta * 15);
                const minWidth = 300; // ~0.2 inches minimum
                const newLeft = resizeOrigWidthsRef.current.left + deltaTwips;
                const newRight = resizeOrigWidthsRef.current.right - deltaTwips;
                if (newLeft >= minWidth && newRight >= minWidth) {
                    resizeOrigWidthsRef.current = { left: newLeft, right: newRight };
                }
            }
            return;
        }
        // Row resize drag
        if (isResizingRowRef.current) {
            e.preventDefault();
            const delta = e.clientY - resizeStartYRef.current;
            if (resizeRowHandleRef.current) {
                const origTop = parseFloat(resizeRowHandleRef.current.style.top);
                resizeRowHandleRef.current.style.top = `${origTop + delta}px`;
                resizeStartYRef.current = e.clientY;
                // Update stored height (convert pixel delta to twips)
                const deltaTwips = Math.round(delta * 15);
                const minHeight = 200; // ~0.14 inches minimum
                const newHeight = resizeRowOrigHeightRef.current + deltaTwips;
                if (newHeight >= minHeight) {
                    resizeRowOrigHeightRef.current = newHeight;
                }
            }
            return;
        }
        // Right edge resize drag
        if (isResizingRightEdgeRef.current) {
            e.preventDefault();
            const delta = e.clientX - resizeRightEdgeStartXRef.current;
            if (resizeRightEdgeHandleRef.current) {
                const origLeft = parseFloat(resizeRightEdgeHandleRef.current.style.left);
                resizeRightEdgeHandleRef.current.style.left = `${origLeft + delta}px`;
                resizeRightEdgeStartXRef.current = e.clientX;
                // Update stored width (convert pixel delta to twips)
                const deltaTwips = Math.round(delta * 15);
                const minWidth = 300; // ~0.2 inches minimum
                const newWidth = resizeRightEdgeOrigWidthRef.current + deltaTwips;
                if (newWidth >= minWidth) {
                    resizeRightEdgeOrigWidthRef.current = newWidth;
                }
            }
            return;
        }
        if (!isDraggingRef.current || dragAnchorRef.current === null)
            return;
        if (!hiddenPMRef.current || !pagesContainerRef.current)
            return;
        // Auto-scroll when dragging near viewport edges
        updateDragScroll(e.clientX, e.clientY);
        const pmPos = getPositionFromMouse(e.clientX, e.clientY);
        if (pmPos === null)
            return;
        // Dragging in table cells: text selection first, cell selection when crossing boundary
        if (cellDragAnchorPosRef.current !== null) {
            // If already in cell-drag mode, continue updating cell selection
            if (isCellDraggingRef.current) {
                const currentCellPos = findCellPosFromPmPos(pmPos);
                if (currentCellPos !== null) {
                    hiddenPMRef.current.setCellSelection(cellDragAnchorPosRef.current, currentCellPos);
                    return;
                }
            }
            // Switch to cell selection when drag crosses into a different cell
            const currentCellPos = findCellPosFromPmPos(pmPos);
            if (currentCellPos !== null && currentCellPos !== cellDragAnchorPosRef.current) {
                isCellDraggingRef.current = true;
                hiddenPMRef.current.setCellSelection(cellDragAnchorPosRef.current, currentCellPos);
                cellDragOverflowXRef.current = null;
                return;
            }
            // Detect when text selection has maxed out within the cell:
            // If pmPos stops changing but mouse keeps moving, user has dragged past text content
            if (cellDragLastPmPosRef.current !== null && pmPos === cellDragLastPmPosRef.current) {
                if (cellDragOverflowXRef.current === null) {
                    cellDragOverflowXRef.current = e.clientX;
                }
                else if (Math.abs(e.clientX - cellDragOverflowXRef.current) >= CELL_SELECT_OVERFLOW_PX) {
                    // Overflow threshold reached — select the entire cell
                    isCellDraggingRef.current = true;
                    hiddenPMRef.current.setCellSelection(cellDragAnchorPosRef.current, cellDragAnchorPosRef.current);
                    cellDragOverflowXRef.current = null;
                    return;
                }
            }
            else {
                // Position is still advancing — reset overflow tracking
                cellDragOverflowXRef.current = null;
                cellDragLastPmPosRef.current = pmPos;
            }
        }
        // Regular text selection drag (within cell or outside tables)
        const anchor = dragAnchorRef.current;
        hiddenPMRef.current.setSelection(anchor, pmPos);
    }, [getPositionFromMouse, findCellPosFromPmPos, updateDragScroll]);
    /**
     * Handle mouseup - end drag selection.
     */
    const handleMouseUp = useCallback(() => {
        var _a, _b, _c;
        // Commit column resize
        if (isResizingColumnRef.current) {
            isResizingColumnRef.current = false;
            if (resizeHandleRef.current) {
                resizeHandleRef.current.classList.remove('dragging');
                resizeHandleRef.current = null;
            }
            // Update ProseMirror document with new column widths
            const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view) {
                const pmStart = resizeTablePmStartRef.current;
                const colIdx = resizeColumnIndexRef.current;
                const { left: newLeft, right: newRight } = resizeOrigWidthsRef.current;
                // Find the table node and update columnWidths + cell widths
                const $pos = view.state.doc.resolve(pmStart + 1);
                for (let d = $pos.depth; d >= 0; d--) {
                    const node = $pos.node(d);
                    if (node.type.name === 'table') {
                        const tablePos = $pos.before(d);
                        const tr = view.state.tr;
                        const widths = [...node.attrs.columnWidths];
                        widths[colIdx] = newLeft;
                        widths[colIdx + 1] = newRight;
                        // Update table columnWidths attr
                        tr.setNodeMarkup(tablePos, undefined, Object.assign(Object.assign({}, node.attrs), { columnWidths: widths }));
                        // Update cell width attrs in each row
                        let rowOffset = tablePos + 1;
                        node.forEach((row) => {
                            let cellOffset = rowOffset + 1;
                            let cellColIdx = 0;
                            row.forEach((cell) => {
                                const colspan = cell.attrs.colspan || 1;
                                if (cellColIdx === colIdx || cellColIdx === colIdx + 1) {
                                    const newWidth = cellColIdx === colIdx ? newLeft : newRight;
                                    tr.setNodeMarkup(tr.mapping.map(cellOffset), undefined, Object.assign(Object.assign({}, cell.attrs), { width: newWidth, widthType: 'dxa', colwidth: null }));
                                }
                                cellOffset += cell.nodeSize;
                                cellColIdx += colspan;
                            });
                            rowOffset += row.nodeSize;
                        });
                        view.dispatch(tr);
                        break;
                    }
                }
            }
            return;
        }
        // Commit row resize
        if (isResizingRowRef.current) {
            isResizingRowRef.current = false;
            if (resizeRowHandleRef.current) {
                resizeRowHandleRef.current.classList.remove('dragging');
                resizeRowHandleRef.current = null;
            }
            const view = (_b = hiddenPMRef.current) === null || _b === void 0 ? void 0 : _b.getView();
            if (view) {
                const pmStart = resizeRowTablePmStartRef.current;
                const rowIdx = resizeRowIndexRef.current;
                const newHeight = resizeRowOrigHeightRef.current;
                const $pos = view.state.doc.resolve(pmStart + 1);
                for (let d = $pos.depth; d >= 0; d--) {
                    const node = $pos.node(d);
                    if (node.type.name === 'table') {
                        const tablePos = $pos.before(d);
                        const tr = view.state.tr;
                        // Walk to the target row
                        let rowOffset = tablePos + 1;
                        let idx = 0;
                        node.forEach((row) => {
                            if (idx === rowIdx) {
                                tr.setNodeMarkup(tr.mapping.map(rowOffset), undefined, Object.assign(Object.assign({}, row.attrs), { height: newHeight, heightRule: 'atLeast' }));
                            }
                            rowOffset += row.nodeSize;
                            idx++;
                        });
                        view.dispatch(tr);
                        break;
                    }
                }
            }
            return;
        }
        // Commit right edge resize
        if (isResizingRightEdgeRef.current) {
            isResizingRightEdgeRef.current = false;
            if (resizeRightEdgeHandleRef.current) {
                resizeRightEdgeHandleRef.current.classList.remove('dragging');
                resizeRightEdgeHandleRef.current = null;
            }
            const view = (_c = hiddenPMRef.current) === null || _c === void 0 ? void 0 : _c.getView();
            if (view) {
                const pmStart = resizeRightEdgePmStartRef.current;
                const colIdx = resizeRightEdgeColIndexRef.current;
                const newWidth = resizeRightEdgeOrigWidthRef.current;
                const $pos = view.state.doc.resolve(pmStart + 1);
                for (let d = $pos.depth; d >= 0; d--) {
                    const node = $pos.node(d);
                    if (node.type.name === 'table') {
                        const tablePos = $pos.before(d);
                        const tr = view.state.tr;
                        // Update columnWidths — only change last column
                        const widths = [...node.attrs.columnWidths];
                        widths[colIdx] = newWidth;
                        tr.setNodeMarkup(tablePos, undefined, Object.assign(Object.assign({}, node.attrs), { columnWidths: widths }));
                        // Update cell width attrs in the last column of each row
                        let rowOffset = tablePos + 1;
                        node.forEach((row) => {
                            let cellOffset = rowOffset + 1;
                            let cellColIdx = 0;
                            row.forEach((cell) => {
                                const colspan = cell.attrs.colspan || 1;
                                if (cellColIdx === colIdx) {
                                    tr.setNodeMarkup(tr.mapping.map(cellOffset), undefined, Object.assign(Object.assign({}, cell.attrs), { width: newWidth, widthType: 'dxa', colwidth: null }));
                                }
                                cellOffset += cell.nodeSize;
                                cellColIdx += colspan;
                            });
                            rowOffset += row.nodeSize;
                        });
                        view.dispatch(tr);
                        break;
                    }
                }
            }
            return;
        }
        isDraggingRef.current = false;
        isCellDraggingRef.current = false;
        cellDragLastPmPosRef.current = null;
        cellDragOverflowXRef.current = null;
        stopDragAutoScroll();
        // Keep dragAnchorRef for potential shift-click extension
    }, [stopDragAutoScroll]);
    // Add global mouse event listeners for drag selection
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);
    /**
     * Handle mousemove on pages to show table row/column insert buttons.
     * Detects proximity to table row/column boundaries and shows a floating "+" button.
     */
    const handlePagesMouseMove = useCallback((e) => {
        // Skip during drags / resizes
        if (readOnly ||
            isDraggingRef.current ||
            isResizingColumnRef.current ||
            isResizingRowRef.current ||
            isResizingRightEdgeRef.current ||
            isCellDraggingRef.current)
            return;
        const pagesEl = pagesContainerRef.current;
        if (!pagesEl)
            return;
        const hit = detectTableInsertHover({
            mouseX: e.clientX,
            mouseY: e.clientY,
            pagesContainer: pagesEl,
            target: e.target,
            hfEditMode: hfEditMode !== null && hfEditMode !== void 0 ? hfEditMode : null,
        });
        if (!hit) {
            // Schedule a delayed hide so brief moves between cells don't flicker
            // the button. The hit-test returns null for both "no nearby table"
            // and "near table but not over a row/column"; both want the same
            // delayed-hide UX.
            if (!tableInsertHideTimerRef.current) {
                tableInsertHideTimerRef.current = setTimeout(() => {
                    setTableInsertButton(null);
                    tableInsertHideTimerRef.current = null;
                }, TABLE_INSERT_HIDE_DELAY);
            }
            return;
        }
        const viewportEl = pagesEl.parentElement;
        if (!viewportEl)
            return;
        const viewportRect = viewportEl.getBoundingClientRect();
        setTableInsertButton({
            type: hit.type,
            x: hit.clientX - viewportRect.left,
            y: hit.clientY - viewportRect.top,
            cellPmPos: hit.cellPmPos,
        });
        clearTableInsertTimer();
    }, [readOnly, clearTableInsertTimer, hfEditMode]);
    /**
     * Handle table insert button click — set selection to target cell, then insert.
     */
    const handleTableInsertClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!tableInsertButton || !hiddenPMRef.current)
            return;
        const view = hiddenPMRef.current.getView();
        if (!view)
            return;
        const { type, cellPmPos } = tableInsertButton;
        // Set selection inside the target cell
        const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, cellPmPos + 1));
        view.dispatch(tr);
        // Dispatch the appropriate insert command
        if (type === 'row') {
            addRowBelow(view.state, view.dispatch);
        }
        else {
            addColumnRight(view.state, view.dispatch);
        }
        setTableInsertButton(null);
        hiddenPMRef.current.focus();
    }, [tableInsertButton]);
    /**
     * Handle click on pages container (for double-click word selection).
     */
    const handlePagesClick = useCallback((e) => {
        var _a;
        // Handle hyperlink clicks (single-click only, not drag-to-select)
        const anchorEl = e.target.closest('a[href]');
        if (anchorEl) {
            e.preventDefault();
            const href = anchorEl.getAttribute('href') || '';
            if (href.startsWith('#')) {
                // Internal bookmark — navigate within document
                const bookmarkName = href.substring(1);
                if (bookmarkName && hiddenPMRef.current) {
                    const view = hiddenPMRef.current.getView();
                    if (view) {
                        let targetPos = null;
                        view.state.doc.descendants((node, pos) => {
                            if (targetPos !== null)
                                return false;
                            if (node.type.name === 'paragraph') {
                                const bookmarks = node.attrs.bookmarks;
                                if (bookmarks === null || bookmarks === void 0 ? void 0 : bookmarks.some((b) => b.name === bookmarkName)) {
                                    targetPos = pos;
                                    return false;
                                }
                            }
                        });
                        if (targetPos !== null) {
                            scrollToPositionImpl(targetPos);
                            hiddenPMRef.current.setSelection(targetPos + 1);
                        }
                    }
                }
            }
            else if (onHyperlinkClick) {
                // External hyperlink — show popup only if not a drag-to-select
                const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                const hasRangeSelection = view && view.state.selection.from !== view.state.selection.to;
                if (!hasRangeSelection) {
                    const displayText = anchorEl.textContent || '';
                    const tooltip = anchorEl.getAttribute('title') || undefined;
                    const anchorRect = anchorEl.getBoundingClientRect();
                    onHyperlinkClick({ href, displayText, tooltip, anchorRect });
                }
            }
            // External links: already handled by mousedown, just prevent default
            return;
        }
        // Double-click on header/footer area triggers editing mode
        if (e.detail === 2 && onHeaderFooterDoubleClick) {
            const target = e.target;
            const headerEl = target.closest('.layout-page-header');
            const footerEl = target.closest('.layout-page-footer');
            if (headerEl || footerEl) {
                const pageEl = target.closest('[data-page-number]');
                const pageNum = pageEl ? Number(pageEl.dataset.pageNumber) : 1;
                if (headerEl) {
                    e.preventDefault();
                    e.stopPropagation();
                    onHeaderFooterDoubleClick('header', pageNum);
                    return;
                }
                if (footerEl) {
                    e.preventDefault();
                    e.stopPropagation();
                    onHeaderFooterDoubleClick('footer', pageNum);
                    return;
                }
            }
        }
        // Double-click: select entire cell (CellSelection) if in table, otherwise word selection
        if (e.detail === 2 && hiddenPMRef.current) {
            const pmPos = getPositionFromMouse(e.clientX, e.clientY);
            if (pmPos !== null) {
                // If inside a table cell, select the entire cell
                const cellPos = findCellPosFromPmPos(pmPos);
                if (cellPos !== null) {
                    e.preventDefault();
                    e.stopPropagation();
                    hiddenPMRef.current.setCellSelection(cellPos, cellPos);
                    return;
                }
                const view = hiddenPMRef.current.getView();
                if (view) {
                    const { doc } = view.state;
                    const $pos = doc.resolve(pmPos);
                    const parent = $pos.parent;
                    // Find word boundaries
                    if (parent.isTextblock) {
                        const text = parent.textContent;
                        const offset = $pos.parentOffset;
                        const [start, end] = findWordBoundaries(text, offset);
                        // Convert to absolute positions
                        const absStart = $pos.start() + start;
                        const absEnd = $pos.start() + end;
                        if (absStart < absEnd) {
                            hiddenPMRef.current.setSelection(absStart, absEnd);
                        }
                    }
                }
            }
        }
        // Triple-click for paragraph selection
        if (e.detail === 3 && hiddenPMRef.current) {
            const pmPos = getPositionFromMouse(e.clientX, e.clientY);
            if (pmPos !== null) {
                const view = hiddenPMRef.current.getView();
                if (view) {
                    const { doc } = view.state;
                    const $pos = doc.resolve(pmPos);
                    // Find paragraph start and end
                    const paragraphStart = $pos.start($pos.depth);
                    const paragraphEnd = $pos.end($pos.depth);
                    hiddenPMRef.current.setSelection(paragraphStart, paragraphEnd);
                }
            }
        }
    }, [getPositionFromMouse, onHeaderFooterDoubleClick, onHyperlinkClick]);
    /**
     * Handle right-click on pages — set/preserve selection and show context menu.
     *
     * If the right-click target resolves to an image node (any of the three
     * rendering paths — page-floating layer, block image container, or inline
     * `<img>`), look up the underlying PM image node and pass its position +
     * current wrap type to the host so an image-specific menu can take over.
     */
    const handlePagesContextMenu = useCallback((e) => {
        var _a, _b, _c, _d, _e;
        if (!onContextMenu)
            return; // No handler, let browser default
        e.preventDefault();
        const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const readImageNodeAt = (pos) => {
            var _a;
            const node = view.state.doc.nodeAt(pos);
            if (!node || node.type.name !== 'image')
                return null;
            const wrapType = (_a = node.attrs.wrapType) !== null && _a !== void 0 ? _a : 'inline';
            const cssFloat = node.attrs.cssFloat;
            return { pos, wrapType, cssFloat };
        };
        let imageInfo = null;
        const hit = hitTestImage(e.target);
        if (hit) {
            imageInfo = readImageNodeAt(hit.pos);
            if (imageInfo) {
                imageInfo.inlinePositionEmu = captureInlinePositionEmu(hit.imageEl, zoom);
            }
        }
        if (!imageInfo) {
            const sel = view.state.selection;
            if (sel instanceof NodeSelection && sel.node.type.name === 'image') {
                imageInfo = readImageNodeAt(sel.from);
                if (imageInfo) {
                    const inlineEl = (_b = pagesContainerRef.current) === null || _b === void 0 ? void 0 : _b.querySelector(`.layout-run-image[data-pm-start="${sel.from}"]`);
                    if (inlineEl) {
                        imageInfo.inlinePositionEmu = captureInlinePositionEmu(inlineEl, zoom);
                    }
                }
            }
        }
        const { from, to } = view.state.selection;
        const pmPos = getPositionFromMouse(e.clientX, e.clientY);
        // If the right-click is within the existing selection, keep it
        // Otherwise, move cursor to the right-click position
        if (pmPos !== null && (from === to || pmPos < from || pmPos > to)) {
            (_c = hiddenPMRef.current) === null || _c === void 0 ? void 0 : _c.setSelection(pmPos);
            (_d = hiddenPMRef.current) === null || _d === void 0 ? void 0 : _d.focus();
            setIsFocused(true);
        }
        // Read updated selection state after potential change
        const updatedState = (_e = hiddenPMRef.current) === null || _e === void 0 ? void 0 : _e.getState();
        const hasSelection = updatedState
            ? updatedState.selection.from !== updatedState.selection.to
            : false;
        // Spell-check hit: ask PM directly. `pmPos` is the document
        // position at the click coords; if the spellcheck plugin has a
        // decoration covering that position, the user right-clicked a
        // misspelled word and we surface it to the host so the spell
        // suggestions menu can open instead of the standard text menu.
        let spellcheckInfo = null;
        if (pmPos !== null) {
            const sst = spellcheckPluginKey.getState(view.state);
            if (sst) {
                const hits = sst.decos.find(pmPos, pmPos);
                if (hits.length > 0) {
                    const d = hits[0];
                    const word = view.state.doc.textBetween(d.from, d.to, '', '');
                    if (word) {
                        spellcheckInfo = { from: d.from, to: d.to, word };
                    }
                }
            }
        }
        onContextMenu({
            x: e.clientX,
            y: e.clientY,
            hasSelection,
            image: imageInfo,
            spellcheck: spellcheckInfo,
        });
    }, 
    // `zoom` is read inside `captureInlinePositionEmu` to convert post-
    // transform px deltas back to authored space. Listing it explicitly
    // even though `getPositionFromMouse` already invalidates on zoom — the
    // dep is direct, not transitive, so it survives a refactor of the
    // sibling closure.
    [onContextMenu, getPositionFromMouse, zoom]);
    /**
     * Handle focus on container - redirect to hidden PM.
     */
    /**
     * Single place that claims keyboard focus for the editor: moves DOM focus to
     * the off-screen ProseMirror (only if it isn't already there, to avoid focus
     * thrashing) and marks the editor focused so the caret blink, mobile format
     * chip and image handles all light up. Previously this `focus()` +
     * `setIsFocused(true)` pair was copy-pasted across every click/key handler,
     * which made it easy to update one path and desync the others.
     */
    const claimEditorFocus = useCallback(() => {
        var _a, _b;
        if (readOnly)
            return;
        if (!((_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.isFocused())) {
            (_b = hiddenPMRef.current) === null || _b === void 0 ? void 0 : _b.focus();
        }
        setIsFocused(true);
    }, [readOnly]);
    const handleContainerFocus = useCallback((e) => {
        // Don't steal focus from sidebar inputs (textareas, inputs, buttons)
        if (isWithinSidebar(e.target))
            return;
        claimEditorFocus();
    }, [claimEditorFocus]);
    /**
     * Handle blur from container.
     */
    const handleContainerBlur = useCallback((e) => {
        var _a;
        // Check if focus is moving to hidden PM or staying within container
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && ((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.contains(relatedTarget))) {
            return; // Focus staying within editor
        }
        // Keep selection visible when focus moves to toolbar or dropdown portals
        if (relatedTarget === null || relatedTarget === void 0 ? void 0 : relatedTarget.closest('[role="toolbar"], [data-radix-popper-content-wrapper], [data-radix-select-content], .docx-table-options-dropdown')) {
            return;
        }
        setIsFocused(false);
    }, []);
    /**
     * Handle image resize from the overlay.
     */
    const handleImageResize = useCallback((pmPos, newWidth, newHeight) => {
        var _a, _b;
        const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        try {
            const node = view.state.doc.nodeAt(pmPos);
            if (!node || node.type.name !== 'image')
                return;
            const tr = view.state.tr.setNodeMarkup(pmPos, undefined, Object.assign(Object.assign({}, node.attrs), { width: newWidth, height: newHeight }));
            view.dispatch(tr);
            // Re-select the image after resize
            (_b = hiddenPMRef.current) === null || _b === void 0 ? void 0 : _b.setNodeSelection(pmPos);
        }
        catch (_c) {
            // Position may have changed during resize
        }
    }, []);
    /**
     * Handle image resize start - prevent text selection during resize.
     */
    const handleImageResizeStart = useCallback(() => {
        isImageInteractingRef.current = true;
    }, []);
    /**
     * Handle image resize end.
     */
    const handleImageResizeEnd = useCallback(() => {
        isImageInteractingRef.current = false;
    }, []);
    /**
     * Handle image drag-to-move: move image node from its current position
     * to the drop position determined by mouse coordinates.
     */
    const handleImageDragMove = useCallback((pmPos, clientX, clientY, grabOffsetX = 0, grabOffsetY = 0) => {
        var _a, _b, _c, _d, _e;
        const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        try {
            const node = view.state.doc.nodeAt(pmPos);
            if (!node || node.type.name !== 'image')
                return;
            const isFloating = node.attrs.displayMode === 'float' ||
                (node.attrs.wrapType &&
                    ['square', 'tight', 'through'].includes(node.attrs.wrapType));
            if (isFloating) {
                // For floating images: update position attributes so the image
                // moves to the drop point while staying floating.
                // Find the page under the drop point
                const pages = (_b = pagesContainerRef.current) === null || _b === void 0 ? void 0 : _b.querySelectorAll('.layout-page');
                if (!pages || pages.length === 0)
                    return;
                let contentEl = null;
                for (const page of pages) {
                    const rect = page.getBoundingClientRect();
                    if (clientY >= rect.top && clientY <= rect.bottom) {
                        contentEl = page.querySelector('.layout-page-content');
                        break;
                    }
                }
                if (!contentEl) {
                    // Fallback to last page if below all pages
                    contentEl = pages[pages.length - 1].querySelector('.layout-page-content');
                }
                if (!contentEl)
                    return;
                const contentRect = contentEl.getBoundingClientRect();
                // Convert the image's NEW top-left to content-area-relative pixels.
                // Subtract the grab offset so the image tracks the pointer instead
                // of snapping its top-left corner to the cursor (the grabbed point
                // stays under the cursor, matching the drag ghost and Google Docs).
                const dropX = (clientX - grabOffsetX - contentRect.left) / zoom;
                const dropY = (clientY - grabOffsetY - contentRect.top) / zoom;
                const hOffsetEmu = pixelsToEmu(dropX);
                const vOffsetEmu = pixelsToEmu(dropY);
                const newPosition = {
                    horizontal: { posOffset: hOffsetEmu, relativeTo: 'margin' },
                    vertical: { posOffset: vOffsetEmu, relativeTo: 'margin' },
                };
                const tr = view.state.tr.setNodeMarkup(pmPos, undefined, Object.assign(Object.assign({}, node.attrs), { position: newPosition }));
                view.dispatch(tr);
                (_c = hiddenPMRef.current) === null || _c === void 0 ? void 0 : _c.setNodeSelection(pmPos);
            }
            else {
                // For inline images: move to the drop text position
                const dropPos = getPositionFromMouse(clientX, clientY);
                if (dropPos === null)
                    return;
                if (dropPos === pmPos || dropPos === pmPos + 1)
                    return;
                let tr = view.state.tr;
                if (dropPos <= pmPos) {
                    tr = tr.delete(pmPos, pmPos + node.nodeSize);
                    tr = tr.insert(dropPos, node);
                    (_d = hiddenPMRef.current) === null || _d === void 0 ? void 0 : _d.setNodeSelection(dropPos);
                }
                else {
                    tr = tr.delete(pmPos, pmPos + node.nodeSize);
                    const adjusted = dropPos - node.nodeSize;
                    tr = tr.insert(Math.min(adjusted, tr.doc.content.size), node);
                    (_e = hiddenPMRef.current) === null || _e === void 0 ? void 0 : _e.setNodeSelection(Math.min(adjusted, tr.doc.content.size - 1));
                }
                view.dispatch(tr);
            }
        }
        catch (_f) {
            // Position may be invalid
        }
    }, [getPositionFromMouse, zoom]);
    const handleImageDragStart = useCallback(() => {
        isImageInteractingRef.current = true;
    }, []);
    const handleImageDragEnd = useCallback(() => {
        isImageInteractingRef.current = false;
    }, []);
    /**
     * Handle keyboard events on container.
     * Most keyboard handling is done by ProseMirror, but we intercept
     * specific keys for navigation and ensure focus stays on hidden PM.
     */
    const handleKeyDown = useCallback((e) => {
        var _a;
        if (readOnly)
            return;
        // Ensure hidden PM is focused if user types
        claimEditorFocus();
        // Prevent space from scrolling the container - let PM handle it as text input.
        // During IME composition, let the browser handle space natively to avoid
        // duplicating the final composed character (e.g., Korean Hangul).
        if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view) {
                // Route through handleTextInput so plugins (suggestion mode) can intercept
                const { from, to } = view.state.selection;
                const handled = view.someProp('handleTextInput', (f) => f(view, from, to, ' '));
                if (!handled) {
                    view.dispatch(view.state.tr.insertText(' '));
                }
            }
            return;
        }
        // PageUp/PageDown - let container handle scrolling
        if (['PageUp', 'PageDown'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
            // Let PM handle the cursor movement first
            // If PM doesn't handle it (at bounds), the container will scroll
        }
        // Cmd/Ctrl+Home - scroll to top and move cursor to start
        if (e.key === 'Home' && (e.metaKey || e.ctrlKey)) {
            const sc = getScrollContainer();
            if (sc)
                sc.scrollTop = 0;
        }
        // Cmd/Ctrl+End - scroll to bottom and move cursor to end
        if (e.key === 'End' && (e.metaKey || e.ctrlKey)) {
            const sc = getScrollContainer();
            if (sc)
                sc.scrollTop = sc.scrollHeight;
        }
    }, [readOnly, getScrollContainer, claimEditorFocus]);
    /**
     * Handle mousedown on container (outside pages).
     */
    const handleContainerMouseDown = useCallback((e) => {
        // Don't steal focus from sidebar inputs
        if (isWithinSidebar(e.target))
            return;
        // Focus hidden PM if clicking outside pages area
        claimEditorFocus();
    }, [claimEditorFocus]);
    // =========================================================================
    // Initial Layout
    // =========================================================================
    /**
     * Run initial layout when document or view changes.
     */
    const handleEditorViewReady = useCallback((view) => {
        runLayoutPipeline(view.state);
        updateSelectionOverlay(view.state);
        // IME caret sync. The hidden ProseMirror lives off-screen
        // (HIDDEN_HOST_STYLES, left:-9999px), so during CJK/JA/KO composition the
        // OS candidate window — which tracks the contenteditable caret — appears
        // off-screen and the user can't see what they're composing. During
        // composition, translate the (opacity:0) hidden host so its caret aligns
        // with the painted/visual caret, putting the candidate window in the
        // right place; clear the translate when composition ends. The host stays
        // opacity:0 so nothing extra becomes visible, and these listeners fire
        // ONLY during composition — Latin typing is completely unaffected.
        const imeHost = view.dom.closest('.paged-editor__hidden-pm');
        const syncImeCaret = () => {
            if (!imeHost)
                return;
            // Measure in un-translated space first so repeated compositionupdate
            // events don't compound the offset.
            imeHost.style.transform = '';
            // NB: `document` is shadowed by the OOXML Document prop in this
            // component — use the view's owner document for DOM queries.
            const caretEl = view.dom.ownerDocument.querySelector('[data-testid="caret"]');
            if (!caretEl)
                return;
            const vr = caretEl.getBoundingClientRect();
            let hc;
            try {
                hc = view.coordsAtPos(view.state.selection.head);
            }
            catch (_a) {
                return;
            }
            imeHost.style.transform = `translate(${vr.left - hc.left}px, ${vr.top - hc.top}px)`;
        };
        const clearImeCaret = () => {
            if (imeHost)
                imeHost.style.transform = '';
        };
        view.dom.addEventListener('compositionstart', syncImeCaret);
        view.dom.addEventListener('compositionupdate', syncImeCaret);
        view.dom.addEventListener('compositionend', clearImeCaret);
        // Auto-focus the editor so the user can start typing immediately
        if (!readOnly) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                view.focus();
                setIsFocused(true);
            });
        }
    }, [runLayoutPipeline, updateSelectionOverlay, readOnly]);
    // Re-layout when web fonts finish loading to fix measurements that were
    // computed against fallback fonts during initial render.
    // Uses FontFaceSet.onloadingdone to detect when new fonts complete loading.
    useEffect(() => {
        const handleFontsLoaded = () => {
            var _a;
            const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view) {
                // Clear all cached measurements — font metrics have changed
                resetCanvasContext();
                clearAllCaches();
                runLayoutPipeline(view.state);
                updateSelectionOverlay(view.state);
            }
        };
        // Listen for font loading completion events
        window.document.fonts.addEventListener('loadingdone', handleFontsLoaded);
        return () => {
            window.document.fonts.removeEventListener('loadingdone', handleFontsLoaded);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Re-layout when header/footer content changes (e.g., after HF editor save).
    // runLayoutPipeline includes headerContent/footerContent in its deps, but it
    // only runs when explicitly called — this effect triggers it.
    const headerFooterEpochRef = useRef(0);
    useEffect(() => {
        var _a;
        // Skip the initial render — handleEditorViewReady already does the first layout
        if (headerFooterEpochRef.current === 0) {
            headerFooterEpochRef.current = 1;
            return;
        }
        const view = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (view) {
            runLayoutPipeline(view.state);
        }
    }, [
        headerContent,
        footerContent,
        firstPageHeaderContent,
        firstPageFooterContent,
        runLayoutPipeline,
    ]);
    // Re-compute selection overlay when the container resizes.
    // Page elements shift during window resize (centering, scrollbar changes),
    // causing caret/selection coordinates to become stale.
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        const observer = new ResizeObserver(() => {
            var _a;
            const state = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState();
            if (state) {
                updateSelectionOverlay(state);
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [updateSelectionOverlay]);
    // =========================================================================
    // Imperative Handle
    // =========================================================================
    useImperativeHandle(ref, () => ({
        getDocument() {
            var _a, _b;
            return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : null;
        },
        getState() {
            var _a, _b;
            return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState()) !== null && _b !== void 0 ? _b : null;
        },
        getView() {
            var _a, _b;
            return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView()) !== null && _b !== void 0 ? _b : null;
        },
        focus() {
            var _a;
            (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            setIsFocused(true);
        },
        blur() {
            var _a;
            (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.blur();
            setIsFocused(false);
        },
        isFocused() {
            var _a, _b;
            return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.isFocused()) !== null && _b !== void 0 ? _b : false;
        },
        dispatch(tr) {
            var _a;
            (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.dispatch(tr);
        },
        undo() {
            var _a, _b;
            return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.undo()) !== null && _b !== void 0 ? _b : false;
        },
        redo() {
            var _a, _b;
            return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.redo()) !== null && _b !== void 0 ? _b : false;
        },
        setSelection(anchor, head) {
            var _a;
            (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.setSelection(anchor, head);
        },
        getLayout() {
            return layout;
        },
        relayout() {
            var _a;
            const state = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState();
            if (state) {
                runLayoutPipeline(state);
            }
        },
        scrollToPosition: scrollToPositionImpl,
        scrollToParaId: scrollToParaIdImpl,
        scrollToPage: scrollToPageImpl,
    }), [layout, runLayoutPipeline, scrollToPositionImpl, scrollToParaIdImpl, scrollToPageImpl]);
    // Update selection overlay when layout changes
    // This is needed because handleEditorViewReady calls runLayoutPipeline which
    // sets layout asynchronously, so updateSelectionOverlay would return early
    // if layout is still null. This effect ensures we update once layout is ready.
    useEffect(() => {
        var _a;
        const state = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState();
        if (layout && state) {
            updateSelectionOverlay(state);
        }
    }, [layout, updateSelectionOverlay]);
    // Notify when ready
    // Notify when ready - use ref for callback to prevent infinite loops
    useEffect(() => {
        if (onReadyRef.current && hiddenPMRef.current) {
            onReadyRef.current({
                getDocument: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : null; },
                getState: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState()) !== null && _b !== void 0 ? _b : null; },
                getView: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView()) !== null && _b !== void 0 ? _b : null; },
                focus: () => {
                    var _a;
                    (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                    setIsFocused(true);
                },
                blur: () => {
                    var _a;
                    (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.blur();
                    setIsFocused(false);
                },
                isFocused: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.isFocused()) !== null && _b !== void 0 ? _b : false; },
                dispatch: (tr) => { var _a; return (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.dispatch(tr); },
                undo: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.undo()) !== null && _b !== void 0 ? _b : false; },
                redo: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.redo()) !== null && _b !== void 0 ? _b : false; },
                setSelection: (anchor, head) => { var _a; return (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.setSelection(anchor, head); },
                getLayout: () => layout,
                relayout: () => {
                    var _a;
                    const state = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getState();
                    if (state) {
                        runLayoutPipeline(state);
                    }
                },
                scrollToPosition: scrollToPositionImpl,
                scrollToParaId: scrollToParaIdImpl,
                scrollToPage: scrollToPageImpl,
            });
        }
    }, [layout, runLayoutPipeline, scrollToParaIdImpl, scrollToPageImpl]);
    // NOTE: onReady removed from dependencies - accessed via ref to prevent infinite loops
    // =========================================================================
    // Render
    // =========================================================================
    // Calculate total height for scroll
    const totalHeight = useMemo(() => {
        if (!layout)
            return DEFAULT_PAGE_HEIGHT + 48;
        const numPages = layout.pages.length;
        const pagesHeight = layout.pages.reduce((sum, page) => sum + page.size.h, 0);
        return pagesHeight + (numPages - 1) * pageGap + 48;
    }, [layout, pageGap]);
    return (_jsxs("div", { ref: containerRef, className: `ep-root paged-editor ${className !== null && className !== void 0 ? className : ''}`, style: Object.assign(Object.assign({}, containerStyles), style), tabIndex: 0, onFocus: handleContainerFocus, onBlur: handleContainerBlur, onKeyDown: handleKeyDown, onMouseDown: handleContainerMouseDown, children: [_jsx(HiddenProseMirror, { ref: hiddenPMRef, document: document, styles: styles, widthPx: contentWidth, readOnly: readOnly, onTransaction: handleTransaction, onSelectionChange: handleSelectionChange, externalPlugins: externalPlugins, extensionManager: extensionManager, ariaLabel: contentLabel, onEditorViewReady: handleEditorViewReady, onKeyDown: handlePMKeyDown }), _jsxs("div", { ref: viewportLayoutRef, onContextMenu: (e) => {
                    // Catch right-clicks on overlays that sit OUTSIDE
                    // `.paged-editor__pages` (DecorationLayer, decoration spans
                    // like `.spellcheck-error`). The inner pages-container
                    // handler already preventDefaulted these for clicks on the
                    // pages themselves — that branch returns early via the
                    // `defaultPrevented` guard so we don't double-fire.
                    if (e.defaultPrevented)
                        return;
                    const target = e.target;
                    if (target === null || target === void 0 ? void 0 : target.closest('.paged-editor__pages'))
                        return;
                    handlePagesContextMenu(e);
                }, style: Object.assign(Object.assign({}, viewportStyles), { minHeight: totalHeight, 
                    // Negative margin at zoom<1 shrinks scroll area to match visual height;
                    // positive margin at zoom>1 grows it so content isn't clipped.
                    marginBottom: zoom !== 1 ? totalHeight * (zoom - 1) : undefined, transform: (() => {
                        const parts = [];
                        if (commentsSidebarOpen) {
                            // Center page + sidebar as a unit within the container
                            parts.push(`translateX(-${SIDEBAR_DOCUMENT_SHIFT}px)`);
                        }
                        if (zoom !== 1)
                            parts.push(`scale(${zoom})`);
                        return parts.length > 0 ? parts.join(' ') : undefined;
                    })(), transformOrigin: 'top center' }), children: [_jsx("div", { ref: pagesContainerRef, className: `paged-editor__pages${readOnly ? ' paged-editor--readonly' : ''}${hfEditMode ? ` paged-editor--hf-editing paged-editor--editing-${hfEditMode}` : ''}${showFormattingMarks ? ' paged-editor--show-marks' : ''}`, style: pagesContainerStyles, onMouseDown: handlePagesMouseDown, onMouseMove: handlePagesMouseMove, onClick: handlePagesClick, onContextMenu: handlePagesContextMenu, "aria-hidden": "true" // Visual only, PM provides semantic content
                     }), ((_a = document === null || document === void 0 ? void 0 : document.package) === null || _a === void 0 ? void 0 : _a.endnotes) && document.package.endnotes.length > 0 && (_jsx(EndnoteSection, { endnotes: document.package.endnotes, width: (_b = layout === null || layout === void 0 ? void 0 : layout.pages[0]) === null || _b === void 0 ? void 0 : _b.size.w, onEditEndnote: onEditEndnote })), _jsx(SelectionOverlay, { selectionRects: selectionRects, caretPosition: caretPosition, isFocused: isFocused, pageGap: pageGap, readOnly: readOnly }), !readOnly && selectionFormatting && onFormat && (_jsxs(_Fragment, { children: [_jsx(MobileFormatBar, { rects: selectionRects, formatting: selectionFormatting, onFormat: onFormat, visible: isFocused && selectionRects.length > 0, zoom: zoom, variant: "mobile" }), _jsx(MobileFormatBar, { rects: selectionRects, formatting: selectionFormatting, onFormat: onFormat, visible: isFocused && selectionRects.length > 0, zoom: zoom, variant: "desktop" })] })), _jsx(ImageSelectionOverlay, { imageInfo: selectedImageInfo, zoom: zoom, panelOpen: commentsSidebarOpen, reanchorTick: overlayReanchorTick, isFocused: isFocused, onResize: handleImageResize, onResizeStart: handleImageResizeStart, onResizeEnd: handleImageResizeEnd, onDragMove: handleImageDragMove, onDragStart: handleImageDragStart, onDragEnd: handleImageDragEnd, onContextMenu: handlePagesContextMenu, onOpenProperties: onOpenProperties }), onOpenProperties && tableChipPos && isFocused && (_jsxs("button", { type: "button", "data-testid": "table-format-chip", "aria-label": "Format table", title: "Format", onMouseDown: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenProperties();
                        }, style: {
                            position: 'absolute',
                            left: tableChipPos.x,
                            top: tableChipPos.y - 14,
                            transform: 'translateX(-100%)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            height: 26,
                            padding: '0 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: '26px',
                            color: '#fff',
                            background: '#2563eb',
                            border: 'none',
                            borderRadius: 13,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            zIndex: 201,
                            whiteSpace: 'nowrap',
                        }, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" }) }), "Format"] })), onOpenProperties && textBoxChipPos && isFocused && (_jsxs("button", { type: "button", "data-testid": "textbox-format-chip", "aria-label": "Format text box", title: "Format", onMouseDown: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenProperties();
                        }, style: {
                            position: 'absolute',
                            left: textBoxChipPos.x,
                            top: textBoxChipPos.y - 14,
                            transform: 'translateX(-100%)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            height: 26,
                            padding: '0 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: '26px',
                            color: '#fff',
                            background: '#2563eb',
                            border: 'none',
                            borderRadius: 13,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            zIndex: 201,
                            whiteSpace: 'nowrap',
                        }, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" }) }), "Format"] })), onResizeTextBox &&
                        textBoxChipPos &&
                        isFocused &&
                        (() => {
                            const box = textBoxResize
                                ? Object.assign(Object.assign({}, textBoxChipPos), { width: textBoxResize.w, height: textBoxResize.h }) : textBoxChipPos;
                            const startResize = (corner, e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const sx = e.clientX;
                                const sy = e.clientY;
                                const sw = textBoxChipPos.width;
                                const sh = textBoxChipPos.height;
                                const signX = corner.includes('w') ? -1 : 1;
                                const signY = corner.includes('n') ? -1 : 1;
                                let fw = sw;
                                let fh = sh;
                                const move = (me) => {
                                    fw = Math.max(40, sw + (me.clientX - sx) * signX);
                                    fh = Math.max(24, sh + (me.clientY - sy) * signY);
                                    setTextBoxResize({ w: fw, h: fh });
                                };
                                const up = () => {
                                    window.removeEventListener('mousemove', move);
                                    window.removeEventListener('mouseup', up);
                                    setTextBoxResize(null);
                                    // screen px -> node px via zoom
                                    onResizeTextBox(Math.round(fw / zoom), Math.round(fh / zoom));
                                };
                                window.addEventListener('mousemove', move);
                                window.addEventListener('mouseup', up);
                            };
                            const HS = 9;
                            const corners = [
                                ['nw', box.left, box.top, 'nwse-resize'],
                                ['ne', box.left + box.width, box.top, 'nesw-resize'],
                                ['se', box.left + box.width, box.top + box.height, 'nwse-resize'],
                                ['sw', box.left, box.top + box.height, 'nesw-resize'],
                            ];
                            return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                            position: 'absolute',
                                            left: box.left,
                                            top: box.top,
                                            width: box.width,
                                            height: box.height,
                                            // Subtle while editing text inside; the corner grips carry
                                            // the resize affordance without a heavy frame.
                                            border: textBoxResize
                                                ? '1.5px solid #2563eb'
                                                : '1px dashed rgba(37,99,235,0.45)',
                                            pointerEvents: 'none',
                                            zIndex: 199,
                                            boxSizing: 'border-box',
                                        } }), corners.map(([c, cx, cy, cursor]) => (_jsx("div", { "data-testid": `textbox-resize-${c}`, onMouseDown: (e) => startResize(c, e), style: {
                                            position: 'absolute',
                                            left: cx - HS / 2,
                                            top: cy - HS / 2,
                                            width: HS,
                                            height: HS,
                                            background: '#fff',
                                            border: '1.5px solid #2563eb',
                                            borderRadius: 2,
                                            cursor,
                                            pointerEvents: 'auto',
                                            zIndex: 200,
                                        } }, c)))] }));
                        })(), tableInsertButton && (_jsx("button", { type: "button", className: "ep-focus-ring", onMouseDown: handleTableInsertClick, onMouseEnter: clearTableInsertTimer, onMouseLeave: () => setTableInsertButton(null), style: {
                            position: 'absolute',
                            left: tableInsertButton.x,
                            top: tableInsertButton.y,
                            width: 20,
                            height: 20,
                            borderRadius: '4px',
                            border: '1px solid var(--doc-border, #dadce0)',
                            backgroundColor: 'var(--doc-surface)',
                            color: 'var(--doc-text-on-surface-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 200,
                            padding: 0,
                            boxShadow: 'none',
                        }, title: tableInsertButton.type === 'row' ? 'Insert row below' : 'Insert column to the right', "aria-label": tableInsertButton.type === 'row' ? 'Insert row below' : 'Insert column to the right', children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: _jsx("path", { d: "M6 1v10M1 6h10", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })), pluginOverlays && (_jsx("div", { className: "paged-editor__plugin-overlays", style: pluginOverlaysStyles, children: pluginOverlays })), _jsx(DecorationLayer, { getView: () => { var _a, _b; return (_b = (_a = hiddenPMRef.current) === null || _a === void 0 ? void 0 : _a.getView()) !== null && _b !== void 0 ? _b : null; }, getPagesContainer: () => pagesContainerRef.current, zoom: zoom, transactionVersion: transactionVersion, syncCoordinator: syncCoordinator })] }), sidebarOverlay && (_jsx("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: totalHeight * zoom,
                    pointerEvents: 'none',
                    overflow: 'visible',
                }, children: _jsx("div", { style: { pointerEvents: 'auto' }, children: sidebarOverlay }) }))] }));
});
export const PagedEditor = memo(PagedEditorComponent);
export default PagedEditor;
//# sourceMappingURL=PagedEditor.js.map