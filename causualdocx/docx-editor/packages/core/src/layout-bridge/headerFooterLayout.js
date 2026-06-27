/**
 * Header / Footer Layout Utilities
 *
 * The header/footer rendering pipeline lives here so any rendering adapter
 * (React, Vue, etc.) can share the conversion logic and just supply its
 * platform-specific {@link MeasureBlocksFn}. Mirrors the footnote pipeline
 * in `footnoteLayout.ts`.
 *
 * Pipeline:
 *   HF.content → headerFooterToProseDoc → toFlowBlocks
 *     → measureBlocks (caller-supplied, Canvas-aware)
 *     → HeaderFooterContent (blocks, measures, height, visualTop/Bottom)
 *
 * The render side uses the normalized block list so paint and measurement stay
 * in lockstep. Visual-bounds calculation still inspects the original block
 * list because floating images can paint above/below the nominal flow box even
 * when they do not contribute to flow height.
 */
import { headerFooterToProseDoc } from '../prosemirror/conversion/toProseDoc';
import { emuToPixels } from '../utils/units';
import { toFlowBlocks } from './toFlowBlocks';
// ============================================================================
// 2. Measurement-time block normalization
// ============================================================================
//
// Two transforms are applied to the FlowBlock list before measurement/render:
//
// 1. **Strip style-inherited paragraph spacing** (#380) — Word visibly
//    does NOT honor inherited `spaceBefore` / `spaceAfter` (e.g. Normal's
//    default 8pt-after) inside the HF text frame. Inline `<w:spacing>`
//    set explicitly on the HF paragraph IS honored. The parser flags
//    inline spacing via `spacingExplicit.before` / `.after`; anything
//    not flagged was inherited from the style chain and is zeroed for
//    both measurement and painting.
//
// 2. **Zero trailing empty paragraph after a table** (#381) — OOXML
//    requires a trailing block-level element after the last `<w:tbl>`
//    in any block container, including `<w:hdr>` / `<w:ftr>`. Word
//    renders that empty paragraph as a zero-height anchor (just the
//    paragraph mark glyph) when it has no runs AND no authored visual
//    content (no paragraph borders, no explicit spacing). We mark its
//    measure with `suppressEmptyParagraphHeight` so the BLOCK survives
//    (click-to-position into the empty space below the table places
//    the cursor in the trailing paragraph, matching Word) but the
//    measure returns zero height. Empty paragraphs with authored
//    `pBdr` (e.g. a horizontal rule under the header) or
//    `spacingExplicit` are NOT suppressed — they exist for their
//    visual side effect, not just as a structural anchor.
function hasAuthoredVisualContent(block) {
    var _a, _b, _c, _d;
    if (block.kind !== 'paragraph')
        return false;
    const attrs = block.attrs;
    if (!attrs)
        return false;
    if (((_a = attrs.borders) === null || _a === void 0 ? void 0 : _a.top) || ((_b = attrs.borders) === null || _b === void 0 ? void 0 : _b.bottom))
        return true;
    if (((_c = attrs.spacingExplicit) === null || _c === void 0 ? void 0 : _c.before) || ((_d = attrs.spacingExplicit) === null || _d === void 0 ? void 0 : _d.after))
        return true;
    return false;
}
export function normalizeHeaderFooterMeasureBlocks(blocks) {
    return normalizeFlowBlockArray(blocks);
}
function normalizeFlowBlockArray(blocks) {
    const trailingEmptyAfterTable = new Set();
    for (let i = 1; i < blocks.length; i++) {
        const prev = blocks[i - 1];
        const cur = blocks[i];
        if (prev.kind !== 'table')
            continue;
        if (cur.kind !== 'paragraph')
            continue;
        if (cur.runs.length > 0)
            continue;
        if (hasAuthoredVisualContent(cur))
            continue;
        trailingEmptyAfterTable.add(i);
    }
    return blocks.map((block, index) => {
        var _a, _b, _c, _d, _e;
        if (block.kind === 'table') {
            return normalizeTableBlock(block);
        }
        if (block.kind !== 'paragraph')
            return block;
        const isTrailingEmpty = trailingEmptyAfterTable.has(index);
        const explicit = (_a = block.attrs) === null || _a === void 0 ? void 0 : _a.spacingExplicit;
        const hasResolvedBefore = ((_c = (_b = block.attrs) === null || _b === void 0 ? void 0 : _b.spacing) === null || _c === void 0 ? void 0 : _c.before) != null;
        const hasResolvedAfter = ((_e = (_d = block.attrs) === null || _d === void 0 ? void 0 : _d.spacing) === null || _e === void 0 ? void 0 : _e.after) != null;
        const beforeIsInherited = hasResolvedBefore && !(explicit === null || explicit === void 0 ? void 0 : explicit.before);
        const afterIsInherited = hasResolvedAfter && !(explicit === null || explicit === void 0 ? void 0 : explicit.after);
        const stripsSpacing = beforeIsInherited || afterIsInherited;
        if (!stripsSpacing && !isTrailingEmpty)
            return block;
        let attrs = block.attrs;
        if (stripsSpacing && (attrs === null || attrs === void 0 ? void 0 : attrs.spacing)) {
            attrs = Object.assign(Object.assign({}, attrs), { spacing: Object.assign(Object.assign({}, attrs.spacing), { before: (explicit === null || explicit === void 0 ? void 0 : explicit.before) ? attrs.spacing.before : undefined, after: (explicit === null || explicit === void 0 ? void 0 : explicit.after) ? attrs.spacing.after : undefined }) });
        }
        if (isTrailingEmpty) {
            attrs = Object.assign(Object.assign({}, (attrs !== null && attrs !== void 0 ? attrs : {})), { suppressEmptyParagraphHeight: true });
        }
        return Object.assign(Object.assign({}, block), { attrs });
    });
}
function normalizeTableBlock(block) {
    let changed = false;
    const rows = block.rows.map((row) => {
        let rowChanged = false;
        const cells = row.cells.map((cell) => {
            const normalizedBlocks = normalizeFlowBlockArray(cell.blocks);
            const cellChanged = normalizedBlocks.some((normalizedBlock, idx) => normalizedBlock !== cell.blocks[idx]);
            if (!cellChanged)
                return cell;
            rowChanged = true;
            return Object.assign(Object.assign({}, cell), { blocks: normalizedBlocks });
        });
        if (!rowChanged)
            return row;
        changed = true;
        return Object.assign(Object.assign({}, row), { cells });
    });
    return changed ? Object.assign(Object.assign({}, block), { rows }) : block;
}
function getPositionAlignment(axis) {
    var _a;
    return (_a = axis === null || axis === void 0 ? void 0 : axis.align) !== null && _a !== void 0 ? _a : axis === null || axis === void 0 ? void 0 : axis.alignment;
}
export function resolveHeaderFooterVisualTop(run, paragraphY, flowHeight, metrics) {
    var _a, _b, _c;
    const flowTop = metrics.section === 'header'
        ? ((_a = metrics.margins.header) !== null && _a !== void 0 ? _a : 48)
        : metrics.pageSize.h - ((_b = metrics.margins.footer) !== null && _b !== void 0 ? _b : 48) - flowHeight;
    const vertical = (_c = run.position) === null || _c === void 0 ? void 0 : _c.vertical;
    if (!vertical) {
        return paragraphY;
    }
    const align = getPositionAlignment(vertical);
    const offsetPx = vertical.posOffset !== undefined ? emuToPixels(vertical.posOffset) : undefined;
    if (vertical.relativeTo === 'page') {
        if (offsetPx !== undefined)
            return offsetPx - flowTop;
        if (align === 'top')
            return -flowTop;
        if (align === 'bottom')
            return metrics.pageSize.h - run.height - flowTop;
        if (align === 'center')
            return (metrics.pageSize.h - run.height) / 2 - flowTop;
    }
    if (vertical.relativeTo === 'margin') {
        const marginTop = metrics.margins.top;
        const marginHeight = metrics.pageSize.h - metrics.margins.top - metrics.margins.bottom;
        if (offsetPx !== undefined)
            return marginTop + offsetPx - flowTop;
        if (align === 'top')
            return marginTop - flowTop;
        if (align === 'bottom')
            return marginTop + marginHeight - run.height - flowTop;
        if (align === 'center')
            return marginTop + (marginHeight - run.height) / 2 - flowTop;
    }
    if (offsetPx !== undefined) {
        return paragraphY + offsetPx;
    }
    return paragraphY;
}
/** True when a header/footer textbox is floated by an anchor (don't stack it). */
function isAnchoredTextBox(block) {
    const a = block.anchor;
    return (!!a && (a.offsetH != null || a.offsetV != null || a.relFromH != null || a.relFromV != null));
}
/**
 * Header/footer flow-Y of an anchored textbox's top, mirroring
 * `resolveHeaderFooterVisualTop` for images. Anchor offsets are already pixels.
 */
export function resolveHeaderFooterTextBoxTop(anchor, flowHeight, metrics) {
    var _a, _b;
    const flowTop = metrics.section === 'header'
        ? ((_a = metrics.margins.header) !== null && _a !== void 0 ? _a : 48)
        : metrics.pageSize.h - ((_b = metrics.margins.footer) !== null && _b !== void 0 ? _b : 48) - flowHeight;
    const offsetPx = anchor.offsetV;
    if (anchor.relFromV === 'page' && offsetPx != null)
        return offsetPx - flowTop;
    if (anchor.relFromV === 'margin' && offsetPx != null)
        return metrics.margins.top + offsetPx - flowTop;
    return offsetPx !== null && offsetPx !== void 0 ? offsetPx : 0;
}
/** Header/footer flow-X (content-area-relative) of an anchored textbox. */
export function resolveHeaderFooterTextBoxLeft(anchor, metrics) {
    const offsetPx = anchor.offsetH;
    if (offsetPx == null)
        return 0;
    // Header content box is inset by margins.left, so a page-relative offset
    // becomes content-relative by subtracting the left margin; margin/column
    // relative offsets are already content-relative.
    if (anchor.relFromH === 'page')
        return offsetPx - metrics.margins.left;
    return offsetPx;
}
export function calculateHeaderFooterVisualBounds(blocks, measures, flowHeight, metrics) {
    let visualTop = 0;
    let visualBottom = flowHeight;
    let cursorY = 0;
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const measure = measures[i];
        if (!block || !measure)
            continue;
        if (block.kind === 'paragraph' && measure.kind === 'paragraph') {
            const paragraphStartY = cursorY;
            const paragraphBottomY = paragraphStartY + measure.totalHeight;
            visualTop = Math.min(visualTop, paragraphStartY);
            visualBottom = Math.max(visualBottom, paragraphBottomY);
            for (const run of block.runs) {
                if (run.kind !== 'image' || !run.position)
                    continue;
                const runTop = resolveHeaderFooterVisualTop(run, paragraphStartY, flowHeight, metrics);
                visualTop = Math.min(visualTop, runTop);
                visualBottom = Math.max(visualBottom, runTop + run.height);
            }
            cursorY = paragraphBottomY;
        }
        else if (block.kind === 'table' && measure.kind === 'table') {
            const blockBottomY = cursorY + measure.totalHeight;
            visualTop = Math.min(visualTop, cursorY);
            visualBottom = Math.max(visualBottom, blockBottomY);
            cursorY = blockBottomY;
        }
        else if (block.kind === 'image' && measure.kind === 'image') {
            const blockBottomY = cursorY + measure.height;
            visualTop = Math.min(visualTop, cursorY);
            visualBottom = Math.max(visualBottom, blockBottomY);
            cursorY = blockBottomY;
        }
        else if (block.kind === 'textBox' && measure.kind === 'textBox') {
            if (isAnchoredTextBox(block)) {
                // Floated (anchored) — contributes its ABSOLUTE extent to the bounds
                // but does NOT take flow space. Stacking these (the old behavior) summed
                // all heights, inflating the header so the top margin expanded and the
                // body was pushed onto extra pages.
                const top = resolveHeaderFooterTextBoxTop(block.anchor, flowHeight, metrics);
                visualTop = Math.min(visualTop, top);
                visualBottom = Math.max(visualBottom, top + measure.height);
            }
            else {
                const blockBottomY = cursorY + measure.height;
                visualTop = Math.min(visualTop, cursorY);
                visualBottom = Math.max(visualBottom, blockBottomY);
                cursorY = blockBottomY;
            }
        }
    }
    return { visualTop, visualBottom };
}
/**
 * Convert HeaderFooter (document type) to HeaderFooterContent (render type).
 *
 * Routes through the same pipeline as the body: HF.content →
 * headerFooterToProseDoc → toFlowBlocks → measureBlocks. The inline editor
 * uses the same conversion chain, so block support (paragraph, table, image,
 * textBox, fields) and the inline editor's content stay in lockstep.
 */
export function convertHeaderFooterToContent(headerFooter, contentWidth, metrics, options) {
    var _a, _b, _c;
    if (!headerFooter || !headerFooter.content || headerFooter.content.length === 0) {
        return undefined;
    }
    const pmDoc = headerFooterToProseDoc(headerFooter.content, {
        styles: (_a = options.styles) !== null && _a !== void 0 ? _a : undefined,
        theme: (_b = options.theme) !== null && _b !== void 0 ? _b : null,
    });
    const blocks = toFlowBlocks(pmDoc, { theme: (_c = options.theme) !== null && _c !== void 0 ? _c : undefined });
    if (blocks.length === 0)
        return undefined;
    const blocksForMeasure = normalizeHeaderFooterMeasureBlocks(blocks);
    const measures = options.measureBlocks(blocksForMeasure, contentWidth);
    const totalHeight = measures.reduce((h, m) => {
        if (m.kind === 'paragraph')
            return h + m.totalHeight;
        if (m.kind === 'table')
            return h + m.totalHeight;
        if (m.kind === 'image')
            return h + m.height;
        if (m.kind === 'textBox')
            return h + m.height;
        return h;
    }, 0);
    const { visualTop, visualBottom } = calculateHeaderFooterVisualBounds(blocks, measures, totalHeight, metrics);
    return {
        blocks: blocksForMeasure,
        measures,
        height: totalHeight,
        visualTop,
        visualBottom,
    };
}
//# sourceMappingURL=headerFooterLayout.js.map