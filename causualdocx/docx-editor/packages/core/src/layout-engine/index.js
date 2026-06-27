/**
 * Layout Engine - Main Entry Point
 *
 * Converts blocks + measures into positioned fragments on pages.
 *
 * @experimental Stable enough for the first-party React adapter, but the
 * API may change in minor releases until a third-party adapter validates
 * it. Pin a version range if you depend on this directly.
 */
import { createPaginator } from './paginator';
import { computeKeepNextChains, calculateChainHeight, getMidChainIndices, hasPageBreakBefore, } from './keep-together';
import { resolveAnchorX, resolveAnchorY } from './anchorGeometry';
import { pixelsToEmu } from '../utils/units';
// Default page size (US Letter in pixels at 96 DPI)
const DEFAULT_PAGE_SIZE = { w: 816, h: 1056 };
// Default margins (1 inch = 96 pixels)
const DEFAULT_MARGINS = {
    top: 96,
    right: 96,
    bottom: 96,
    left: 96,
};
const DEFAULT_COLUMNS = { count: 1, gap: 0 };
/**
 * Walk `blocks` once and collect per-section geometry. `configs` has one
 * entry per section break plus a trailing `finalConfig`. `breakIndices` is
 * 1-to-1 with the inner break entries (same length as `configs.length - 1`).
 * Callers that need the break `type` can read it from
 * `(blocks[breakIndices[i]] as SectionBreakBlock).type`.
 *
 * @internal
 */
export function collectSectionConfigs(blocks, initialConfig, finalConfig) {
    var _a, _b;
    const configs = [];
    const breakIndices = [];
    let previousConfig = initialConfig;
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].kind !== 'sectionBreak')
            continue;
        const sb = blocks[i];
        const config = {
            pageSize: (_a = sb.pageSize) !== null && _a !== void 0 ? _a : previousConfig.pageSize,
            margins: (_b = sb.margins) !== null && _b !== void 0 ? _b : previousConfig.margins,
            columns: sb.columns,
        };
        configs.push(config);
        breakIndices.push(i);
        previousConfig = config;
    }
    configs.push(finalConfig);
    return { configs, breakIndices };
}
/**
 * Measured height a single block contributes to a column's running height.
 * Mirrors what the per-kind layout helpers consume from the cursor (paragraph
 * line stack, image/table/text-box box height); breaks and section markers add
 * nothing.
 */
function blockFlowHeight(block, measure) {
    switch (measure.kind) {
        case 'paragraph':
            return measure.totalHeight;
        case 'image':
            return measure.height;
        case 'table':
            return measure.totalHeight;
        case 'textBox':
            // Anchored text boxes float and don't consume column height; inline ones do.
            return block.anchor ? 0 : measure.height;
        default:
            return 0;
    }
}
/**
 * Estimate the height of the multi-column region beginning at the section break
 * `startIdx` (its tallest column), walking to the next section break.
 *
 * Distributes blocks across `columnCount` columns the way the paginator does:
 * accumulate into the current column, jump to the next column on an explicit
 * `columnBreak`, collapse adjacent paragraph spacing to the larger side. The
 * region's height is the deepest column. Used only to decide whether a short
 * region should be pushed whole to the next page (see
 * `paginator.ensureColumnRegionFits`); it is an estimate, so it caps the column
 * index at the last column and ignores in-column overflow (the paginator still
 * owns real pagination).
 */
function computeColumnRegionHeight(blocks, measures, startIdx, columnCount) {
    const colHeights = new Array(columnCount).fill(0);
    const colTrailing = new Array(columnCount).fill(0);
    let col = 0;
    for (let i = startIdx + 1; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.kind === 'sectionBreak')
            break;
        if (block.kind === 'pageBreak')
            break; // a hard page break ends the region's single-page extent
        if (block.kind === 'columnBreak') {
            if (col < columnCount - 1)
                col += 1;
            continue;
        }
        const height = blockFlowHeight(block, measures[i]);
        if (height <= 0)
            continue;
        let spaceBefore = 0;
        let spaceAfter = 0;
        if (block.kind === 'paragraph') {
            spaceBefore = getSpacingBefore(block);
            spaceAfter = getSpacingAfter(block);
        }
        // Sum prev-after + this-before (Word/LibreOffice behavior), matching the
        // paginator's addFragment — see the note there. Must stay in sync or the
        // region-height estimate disagrees with the painted layout.
        const effectiveBefore = spaceBefore + colTrailing[col];
        colHeights[col] += effectiveBefore + height;
        colTrailing[col] = spaceAfter;
    }
    return Math.max(0, ...colHeights);
}
/**
 * Empty paragraphs keep their inherited before/after spacing — Word and
 * LibreOffice both render an empty separator paragraph at full height
 * (line + before + after). Previously we zeroed style-inherited spacing on
 * empty paragraphs, which compressed every empty-line separator by its
 * inherited spacing (e.g. the 6 blank lines in a business letter each lost
 * 6pt, ~1 line of drift). The narrow "trailing empty paragraph after a
 * table is zero-height" case (#381) is handled separately in the
 * header/footer normalization path, not here.
 */
function getSpacingBefore(block) {
    var _a, _b, _c;
    return (_c = (_b = (_a = block.attrs) === null || _a === void 0 ? void 0 : _a.spacing) === null || _b === void 0 ? void 0 : _b.before) !== null && _c !== void 0 ? _c : 0;
}
function getSpacingAfter(block) {
    var _a, _b, _c;
    return (_c = (_b = (_a = block.attrs) === null || _a === void 0 ? void 0 : _a.spacing) === null || _b === void 0 ? void 0 : _b.after) !== null && _c !== void 0 ? _c : 0;
}
/**
 * Apply contextual spacing suppression (OOXML §17.3.1.9).
 *
 * When two consecutive paragraph blocks both have `contextualSpacing: true`
 * and share the same `styleId`, the spaceAfter of the first paragraph and
 * the spaceBefore of the second paragraph are suppressed (set to 0).
 *
 * This mutates the block attrs in-place before layout runs.
 */
function applyContextualSpacing(blocks) {
    for (let i = 0; i < blocks.length - 1; i++) {
        const curr = blocks[i];
        const next = blocks[i + 1];
        if (curr.kind !== 'paragraph' || next.kind !== 'paragraph')
            continue;
        const currAttrs = curr.attrs;
        const nextAttrs = next.attrs;
        if ((currAttrs === null || currAttrs === void 0 ? void 0 : currAttrs.contextualSpacing) &&
            (nextAttrs === null || nextAttrs === void 0 ? void 0 : nextAttrs.contextualSpacing) &&
            currAttrs.styleId &&
            currAttrs.styleId === nextAttrs.styleId) {
            // Suppress spaceAfter on current paragraph
            if (currAttrs.spacing) {
                currAttrs.spacing = Object.assign(Object.assign({}, currAttrs.spacing), { after: 0 });
            }
            // Suppress spaceBefore on next paragraph
            if (nextAttrs.spacing) {
                nextAttrs.spacing = Object.assign(Object.assign({}, nextAttrs.spacing), { before: 0 });
            }
        }
    }
}
/**
 * Layout a document: convert blocks + measures into pages with positioned fragments.
 *
 * Algorithm:
 * 1. Walk blocks in order with their corresponding measures
 * 2. For each block, create appropriate fragment(s)
 * 3. Use paginator to manage page/column state
 * 4. Handle page breaks, section breaks, and keepNext chains
 */
export function layoutDocument(blocks, measures, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    // Validate input
    if (blocks.length !== measures.length) {
        throw new Error(`layoutDocument: expected one measure per block (blocks=${blocks.length}, measures=${measures.length})`);
    }
    // Set up options with defaults
    const pageSize = (_a = options.pageSize) !== null && _a !== void 0 ? _a : DEFAULT_PAGE_SIZE;
    const baseMargins = {
        top: (_c = (_b = options.margins) === null || _b === void 0 ? void 0 : _b.top) !== null && _c !== void 0 ? _c : DEFAULT_MARGINS.top,
        right: (_e = (_d = options.margins) === null || _d === void 0 ? void 0 : _d.right) !== null && _e !== void 0 ? _e : DEFAULT_MARGINS.right,
        bottom: (_g = (_f = options.margins) === null || _f === void 0 ? void 0 : _f.bottom) !== null && _g !== void 0 ? _g : DEFAULT_MARGINS.bottom,
        left: (_j = (_h = options.margins) === null || _h === void 0 ? void 0 : _h.left) !== null && _j !== void 0 ? _j : DEFAULT_MARGINS.left,
        header: (_o = (_l = (_k = options.margins) === null || _k === void 0 ? void 0 : _k.header) !== null && _l !== void 0 ? _l : (_m = options.margins) === null || _m === void 0 ? void 0 : _m.top) !== null && _o !== void 0 ? _o : DEFAULT_MARGINS.top,
        footer: (_s = (_q = (_p = options.margins) === null || _p === void 0 ? void 0 : _p.footer) !== null && _q !== void 0 ? _q : (_r = options.margins) === null || _r === void 0 ? void 0 : _r.bottom) !== null && _s !== void 0 ? _s : DEFAULT_MARGINS.bottom,
    };
    // Use document margins directly for WYSIWYG fidelity
    // Word uses fixed margins from the document - body content always starts at marginTop
    // If header content extends below marginTop, it overlaps (this matches Word behavior)
    // Note: headerContentHeights are still available for future use (e.g., warnings)
    void options.headerContentHeights;
    void options.footerContentHeights;
    void options.titlePage;
    void options.evenAndOddHeaders;
    const margins = Object.assign({}, baseMargins);
    const finalPageSize = (_t = options.finalPageSize) !== null && _t !== void 0 ? _t : pageSize;
    const finalMargins = (_u = options.finalMargins) !== null && _u !== void 0 ? _u : margins;
    // Calculate content width
    const contentWidth = pageSize.w - margins.left - margins.right;
    if (contentWidth <= 0) {
        throw new Error('layoutDocument: page size and margins yield no content area');
    }
    // ECMA-376 §17.6.22: each section break carries the CURRENT section's
    // properties; `w:type` describes how that section starts relative to the
    // previous one.
    const bodyConfig = { pageSize, margins, columns: options.columns };
    const finalConfig = {
        pageSize: finalPageSize,
        margins: finalMargins,
        columns: options.columns,
    };
    const { configs: sectionConfigs, breakIndices } = collectSectionConfigs(blocks, bodyConfig, finalConfig);
    const sectionBreakTypes = [
        ...breakIndices.map((i) => blocks[i].type),
        options.bodyBreakType,
    ];
    const initialConfig = (_v = sectionConfigs[0]) !== null && _v !== void 0 ? _v : bodyConfig;
    // Create paginator with first section geometry
    const paginator = createPaginator({
        pageSize: initialConfig.pageSize,
        margins: initialConfig.margins,
        columns: (_w = initialConfig.columns) !== null && _w !== void 0 ? _w : DEFAULT_COLUMNS,
        footnoteReservedHeights: options.footnoteReservedHeights,
    });
    // Apply contextual spacing: suppress spaceBefore/spaceAfter between
    // consecutive paragraphs that both have contextualSpacing=true and share
    // the same styleId (OOXML spec 17.3.1.9 / ECMA-376 §17.3.1.9).
    applyContextualSpacing(blocks);
    // Pre-compute keepNext chains for pagination decisions
    const keepNextChains = computeKeepNextChains(blocks);
    const midChainIndices = getMidChainIndices(keepNextChains);
    // Process each block, tracking section break index with a counter (O(1) per break)
    let sectionIdx = 0;
    // Top Y (page-absolute) of the most recently laid-out paragraph's first
    // fragment. A `relFromV="paragraph"`/`"line"` anchored textbox (e.g. the
    // letterhead "Powered by:" box, extracted by `convertParagraphWithTextBoxes`
    // into a sibling block immediately after its source paragraph) must anchor to
    // that paragraph's TOP — exactly like the float-image path uses the anchor
    // paragraph's `fragment.y`. Using the post-paragraph `cursorY` instead placed
    // the box a paragraph-height too low, flipping it below a sibling image that
    // correctly anchored to the paragraph top. Undefined until the first
    // paragraph lays out.
    let lastParagraphTopY;
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const measure = measures[i];
        // Handle pageBreakBefore on paragraphs
        if (hasPageBreakBefore(block)) {
            paginator.forcePageBreak();
        }
        // Handle keepNext chains - if this is a chain start, check if chain fits
        const chain = keepNextChains.get(i);
        if (chain && !midChainIndices.has(i)) {
            const chainHeight = calculateChainHeight(chain, blocks, measures);
            const state = paginator.getCurrentState();
            const availableHeight = paginator.getAvailableHeight();
            const pageContentHeight = state.contentBottom - state.topMargin;
            // Only move to new page if:
            // 1. Chain fits on a blank page (avoid infinite loop for oversized chains)
            // 2. Chain doesn't fit in current available space
            // 3. Current page already has content
            if (chainHeight <= pageContentHeight &&
                chainHeight > availableHeight &&
                state.page.fragments.length > 0) {
                paginator.forcePageBreak();
            }
        }
        switch (block.kind) {
            case 'paragraph': {
                const fragsBefore = paginator.getCurrentState().page.fragments.length;
                layoutParagraph(block, measure, paginator, paginator.getCurrentColumnContentWidth());
                // Record the paragraph's first-fragment top so a following
                // paragraph-relative anchored textbox can share the same anchor base
                // as the float-image path (which reads `fragment.y`).
                const fragsAfter = paginator.getCurrentState().page.fragments;
                if (fragsAfter.length > fragsBefore) {
                    lastParagraphTopY = fragsAfter[fragsBefore].y;
                }
                break;
            }
            case 'table':
                if (block.floating) {
                    layoutFloatingTable(block, measure, paginator, paginator.getContentWidth());
                }
                else {
                    layoutTable(block, measure, paginator);
                }
                break;
            case 'image':
                layoutImage(block, measure, paginator);
                break;
            case 'textBox': {
                const tb = block;
                // A textBox carries an `anchor` only when it came from a genuinely
                // positioned source (DrawingML `wp:anchor` or VML `position:absolute`)
                // — those float and must NOT reserve in-flow space (Word flows text
                // independently). Inline textboxes (no anchor) keep the in-flow
                // reservation, which is the d8b85d1 regression guard.
                if (tb.anchor) {
                    // A behind-doc shape anchored relative to a PARAGRAPH (not the page —
                    // page-relative behind-doc is a watermark and must never reserve)
                    // occupies a vertical band the flow must leave empty, even though the
                    // box paints behind the text. A VML `<v:group>` expands into several
                    // sibling anchored textboxes (the SDS hazard box = border + label +
                    // value + statement), so reserve ONCE for the whole consecutive
                    // cluster — the band from the shallowest child top to the deepest
                    // child bottom — rather than per child (which would over-reserve).
                    if (reservesBehindDocBand(tb)) {
                        const cluster = collectBehindDocCluster(blocks, i);
                        for (let k = i; k <= cluster.endIndex; k++) {
                            layoutAnchoredTextBox(blocks[k], measures[k], paginator, lastParagraphTopY);
                        }
                        paginator.reserveSpace(cluster.bandHeight);
                        i = cluster.endIndex; // for-loop ++ advances past the cluster
                        break;
                    }
                    layoutAnchoredTextBox(tb, measure, paginator, lastParagraphTopY);
                }
                else {
                    layoutTextBox(tb, measure, paginator);
                }
                break;
            }
            case 'pageBreak':
                paginator.forcePageBreak();
                break;
            case 'columnBreak':
                paginator.forceColumnBreak();
                break;
            case 'sectionBreak': {
                // Use the NEXT section's columns; for break type, prefer next section's
                // type but fall back to current break's type (preserves explicit 'continuous')
                const nextType = (_x = sectionBreakTypes[sectionIdx + 1]) !== null && _x !== void 0 ? _x : sectionBreakTypes[sectionIdx];
                const nextConfig = (_y = sectionConfigs[sectionIdx + 1]) !== null && _y !== void 0 ? _y : initialConfig;
                handleSectionBreak(block, paginator, nextConfig, nextType);
                // A continuous break that enters a multi-column region: keep the whole
                // short region together rather than letting one column's overflow
                // spill as a stray narrow strip onto the next page (the SDS
                // label/value sections). handleSectionBreak has already set the
                // region's start Y via updateColumns; measure the region now (we have
                // the blocks + measures here) and push it whole if it won't fit.
                const nextCols = nextConfig.columns;
                if (nextType === 'continuous' && nextCols && nextCols.count > 1) {
                    const regionHeight = computeColumnRegionHeight(blocks, measures, i, nextCols.count);
                    paginator.ensureColumnRegionFits(regionHeight);
                }
                sectionIdx++;
                break;
            }
        }
    }
    // Ensure at least one page exists
    if (paginator.pages.length === 0) {
        paginator.getCurrentState();
    }
    return {
        pageSize,
        pages: paginator.pages,
        columns: options.columns,
        pageGap: options.pageGap,
    };
}
/**
 * Layout a paragraph block onto pages.
 */
function layoutParagraph(block, measure, paginator, contentWidth) {
    if (measure.kind !== 'paragraph') {
        throw new Error(`layoutParagraph: expected paragraph measure`);
    }
    const lines = measure.lines;
    if (lines.length === 0) {
        // Empty paragraph - still takes up space based on spacing
        const spaceBefore = getSpacingBefore(block);
        const spaceAfter = getSpacingAfter(block);
        const state = paginator.getCurrentState();
        // Create minimal fragment
        const fragment = {
            kind: 'paragraph',
            blockId: block.id,
            x: paginator.getColumnX(state.columnIndex),
            y: state.cursorY + spaceBefore,
            width: contentWidth,
            height: 0,
            fromLine: 0,
            toLine: 0,
            pmStart: block.pmStart,
            pmEnd: block.pmEnd,
        };
        paginator.addFragment(fragment, 0, spaceBefore, spaceAfter);
        return;
    }
    const spaceBefore = getSpacingBefore(block);
    const spaceAfter = getSpacingAfter(block);
    // Try to fit all lines on current page/column
    let currentLineIndex = 0;
    while (currentLineIndex < lines.length) {
        const state = paginator.getCurrentState();
        const availableHeight = paginator.getAvailableHeight();
        // Calculate how many lines fit
        let linesHeight = 0;
        let fittingLines = 0;
        for (let j = currentLineIndex; j < lines.length; j++) {
            const lineHeight = lines[j].lineHeight;
            const totalWithLine = linesHeight + lineHeight;
            // Add space before only for first fragment
            const withSpacing = currentLineIndex === 0 && j === currentLineIndex
                ? totalWithLine + spaceBefore
                : totalWithLine;
            if (withSpacing <= availableHeight || fittingLines === 0) {
                linesHeight = totalWithLine;
                fittingLines++;
            }
            else {
                break;
            }
        }
        // Widow/orphan control (OOXML §17.3.1.44 `w:widowControl`, Word default ON):
        // keep at least two lines of a paragraph together on each side of a
        // page/column break. Applied by default — the rare explicit `w:widowControl
        // w:val="0"` opt-out isn't yet plumbed to the layout block.
        if (lines.length >= 2 && fittingLines > 0) {
            const remainingAfter = lines.length - currentLineIndex - fittingLines;
            const st = paginator.getCurrentState();
            const atRegionTop = st.cursorY <= st.topMargin + 0.5;
            if (remainingAfter > 0 && currentLineIndex === 0 && fittingLines < 2 && !atRegionTop) {
                // Orphan: fewer than two opening lines would sit before the break.
                // Push the whole paragraph to the next page/column.
                paginator.forcePageBreak();
                continue;
            }
            if (remainingAfter === 1) {
                // Widow: exactly one line would be stranded after the break.
                const minThisSide = currentLineIndex === 0 ? 2 : 1;
                if (fittingLines - 1 >= minThisSide) {
                    // Pull one line down so two travel together.
                    fittingLines -= 1;
                    linesHeight = 0;
                    for (let j = currentLineIndex; j < currentLineIndex + fittingLines; j++) {
                        linesHeight += lines[j].lineHeight;
                    }
                }
                else if (!atRegionTop) {
                    // Reducing would orphan the opening — move the whole paragraph.
                    paginator.forcePageBreak();
                    continue;
                }
                // else: at region top and unsatisfiable (paragraph taller than the
                // page) — accept rather than loop forever.
            }
        }
        // Create fragment for these lines
        const isFirstFragment = currentLineIndex === 0;
        const isLastFragment = currentLineIndex + fittingLines >= lines.length;
        const effectiveSpaceBefore = isFirstFragment ? spaceBefore : 0;
        const effectiveSpaceAfter = isLastFragment ? spaceAfter : 0;
        const fragment = {
            kind: 'paragraph',
            blockId: block.id,
            x: paginator.getColumnX(state.columnIndex),
            y: 0, // Will be set by addFragment
            width: contentWidth,
            height: linesHeight,
            fromLine: currentLineIndex,
            toLine: currentLineIndex + fittingLines,
            pmStart: block.pmStart,
            pmEnd: block.pmEnd,
            continuesFromPrev: !isFirstFragment,
            continuesOnNext: !isLastFragment,
        };
        const result = paginator.addFragment(fragment, linesHeight, effectiveSpaceBefore, effectiveSpaceAfter);
        fragment.y = result.y;
        currentLineIndex += fittingLines;
        // If more lines remain, advance to next column/page
        if (currentLineIndex < lines.length) {
            paginator.ensureFits(lines[currentLineIndex].lineHeight);
        }
    }
}
/**
 * Count consecutive header rows at the start of a table.
 * Header rows are marked with isHeader: true in the block data.
 */
function countHeaderRows(block) {
    let count = 0;
    for (const row of block.rows) {
        if (row.isHeader) {
            count++;
        }
        else {
            break;
        }
    }
    return count;
}
/**
 * Calculate total height of header rows from their measures.
 */
export function getHeaderRowsHeight(measure, headerRowCount) {
    let height = 0;
    for (let i = 0; i < headerRowCount && i < measure.rows.length; i++) {
        height += measure.rows[i].height;
    }
    return height;
}
/**
 * Layout a table block onto pages.
 */
function layoutTable(block, measure, paginator) {
    if (measure.kind !== 'table') {
        throw new Error(`layoutTable: expected table measure`);
    }
    const rows = measure.rows;
    if (rows.length === 0) {
        return;
    }
    // Detect header rows (consecutive rows at start with isHeader: true)
    const headerRowCount = countHeaderRows(block);
    const headerRowsHeight = getHeaderRowsHeight(measure, headerRowCount);
    let currentRowIndex = 0;
    while (currentRowIndex < rows.length) {
        const state = paginator.getCurrentState();
        const rawAvailableHeight = paginator.getAvailableHeight();
        const isFirstFragment = currentRowIndex === 0;
        // Account for trailing spacing from the previous block that addFragment
        // will consume. We pass spaceBefore=0 for tables, so the overhead is just
        // trailingSpacing (paginator does max(spaceBefore, trailingSpacing)).
        const pendingSpacing = isFirstFragment ? state.trailingSpacing : 0;
        const availableHeight = rawAvailableHeight - pendingSpacing;
        // For continuation fragments, we need space for header rows + at least one content row
        const headerOverhead = !isFirstFragment && headerRowCount > 0 ? headerRowsHeight : 0;
        // Calculate how many rows fit (excluding header rows which are prepended separately)
        let rowsHeight = 0;
        let fittingRows = 0;
        for (let j = currentRowIndex; j < rows.length; j++) {
            const rowHeight = rows[j].height;
            const totalWithRow = rowsHeight + rowHeight + headerOverhead;
            if (totalWithRow <= availableHeight || fittingRows === 0) {
                rowsHeight += rowHeight;
                fittingRows++;
            }
            else {
                break;
            }
        }
        // Total fragment height includes header rows for continuation fragments
        const fragmentHeight = rowsHeight + headerOverhead;
        // Create fragment for these rows
        const isLastFragment = currentRowIndex + fittingRows >= rows.length;
        // Calculate x position based on table justification and indent
        let desiredX = paginator.getColumnX(state.columnIndex);
        if (block.justification === 'center') {
            desiredX = desiredX + (paginator.columnWidth - measure.totalWidth) / 2;
        }
        else if (block.justification === 'right') {
            desiredX = desiredX + paginator.columnWidth - measure.totalWidth;
        }
        else if (block.indent) {
            desiredX += block.indent;
        }
        const fragment = {
            kind: 'table',
            blockId: block.id,
            x: desiredX,
            y: 0, // Will be set by addFragment
            width: measure.totalWidth,
            height: fragmentHeight,
            fromRow: currentRowIndex,
            toRow: currentRowIndex + fittingRows,
            pmStart: block.pmStart,
            pmEnd: block.pmEnd,
            continuesFromPrev: !isFirstFragment,
            continuesOnNext: !isLastFragment,
            headerRowCount: !isFirstFragment && headerRowCount > 0 ? headerRowCount : undefined,
        };
        const result = paginator.addFragment(fragment, fragmentHeight, 0, 0);
        fragment.y = result.y;
        fragment.x = desiredX;
        currentRowIndex += fittingRows;
        // If more rows remain, advance to next column/page
        if (currentRowIndex < rows.length) {
            // Need space for at least one content row plus repeated header rows
            const nextRowHeight = rows[currentRowIndex].height + (headerRowCount > 0 ? headerRowsHeight : 0);
            paginator.ensureFits(nextRowHeight);
        }
    }
}
/**
 * Layout a floating table (anchored) without advancing the cursor.
 */
function layoutFloatingTable(block, measure, paginator, contentWidth) {
    if (measure.kind !== 'table') {
        throw new Error(`layoutFloatingTable: expected table measure`);
    }
    const state = paginator.getCurrentState();
    const floating = block.floating;
    const page = state.page;
    const margins = page.margins;
    const tableWidth = measure.totalWidth;
    const tableHeight = measure.totalHeight;
    const contentHeight = page.size.h - margins.top - margins.bottom;
    // Default anchor base (content area)
    let baseX = margins.left;
    let baseY = margins.top;
    if ((floating === null || floating === void 0 ? void 0 : floating.horzAnchor) === 'page')
        baseX = 0;
    if ((floating === null || floating === void 0 ? void 0 : floating.vertAnchor) === 'page')
        baseY = 0;
    // Determine X position
    let x = paginator.getColumnX(state.columnIndex);
    if ((floating === null || floating === void 0 ? void 0 : floating.tblpX) !== undefined) {
        x = baseX + floating.tblpX;
    }
    else if (floating === null || floating === void 0 ? void 0 : floating.tblpXSpec) {
        const spec = floating.tblpXSpec;
        if (spec === 'left' || spec === 'inside') {
            x = baseX;
        }
        else if (spec === 'right' || spec === 'outside') {
            x = baseX + contentWidth - tableWidth;
        }
        else if (spec === 'center') {
            x = baseX + (contentWidth - tableWidth) / 2;
        }
    }
    else if (block.justification === 'center') {
        x = baseX + (contentWidth - tableWidth) / 2;
    }
    else if (block.justification === 'right') {
        x = baseX + contentWidth - tableWidth;
    }
    // Determine Y position
    let y = state.cursorY;
    let usedExplicitY = false;
    if ((floating === null || floating === void 0 ? void 0 : floating.tblpY) !== undefined) {
        y = baseY + floating.tblpY;
        usedExplicitY = true;
    }
    else if (floating === null || floating === void 0 ? void 0 : floating.tblpYSpec) {
        usedExplicitY = true;
        const spec = floating.tblpYSpec;
        if (spec === 'top') {
            y = baseY;
        }
        else if (spec === 'bottom') {
            y = baseY + contentHeight - tableHeight;
        }
        else if (spec === 'center') {
            y = baseY + (contentHeight - tableHeight) / 2;
        }
    }
    // If not explicitly positioned, ensure it fits on the current page
    if (!usedExplicitY) {
        const fitState = paginator.ensureFits(tableHeight);
        y = fitState.cursorY;
    }
    // Clamp within content area to avoid negative positions
    const minX = margins.left;
    const maxX = margins.left + contentWidth - tableWidth;
    if (Number.isFinite(maxX)) {
        x = Math.max(minX, Math.min(x, maxX));
    }
    const fragment = {
        kind: 'table',
        blockId: block.id,
        x,
        y,
        width: tableWidth,
        height: tableHeight,
        fromRow: 0,
        toRow: block.rows.length,
        pmStart: block.pmStart,
        pmEnd: block.pmEnd,
        isFloating: true,
    };
    // Add directly without advancing cursor
    state.page.fragments.push(fragment);
}
/**
 * Layout an image block onto pages.
 */
function layoutImage(block, measure, paginator) {
    var _a;
    if (measure.kind !== 'image') {
        throw new Error(`layoutImage: expected image measure`);
    }
    // Handle anchored images differently
    if ((_a = block.anchor) === null || _a === void 0 ? void 0 : _a.isAnchored) {
        layoutAnchoredImage(block, measure, paginator);
        return;
    }
    // Inline image - ensure it fits
    const state = paginator.ensureFits(measure.height);
    const fragment = {
        kind: 'image',
        blockId: block.id,
        x: paginator.getColumnX(state.columnIndex),
        y: 0, // Will be set by addFragment
        width: measure.width,
        height: measure.height,
        pmStart: block.pmStart,
        pmEnd: block.pmEnd,
    };
    const result = paginator.addFragment(fragment, measure.height, 0, 0);
    fragment.y = result.y;
}
/**
 * Layout an anchored (floating) image.
 */
function layoutAnchoredImage(block, measure, paginator) {
    var _a, _b;
    const state = paginator.getCurrentState();
    const anchor = block.anchor;
    // Position based on anchor offsets
    const x = (_a = anchor.offsetH) !== null && _a !== void 0 ? _a : paginator.getColumnX(state.columnIndex);
    const y = (_b = anchor.offsetV) !== null && _b !== void 0 ? _b : state.cursorY;
    const fragment = {
        kind: 'image',
        blockId: block.id,
        x,
        y,
        width: measure.width,
        height: measure.height,
        pmStart: block.pmStart,
        pmEnd: block.pmEnd,
        isAnchored: true,
        zIndex: anchor.behindDoc ? -1 : 1,
    };
    // Add directly to page without affecting cursor
    state.page.fragments.push(fragment);
}
/**
 * Layout a text box block onto pages.
 */
function layoutTextBox(block, measure, paginator) {
    if (measure.kind !== 'textBox') {
        throw new Error(`layoutTextBox: expected textBox measure`);
    }
    const state = paginator.ensureFits(measure.height);
    const fragment = {
        kind: 'textBox',
        blockId: block.id,
        x: paginator.getColumnX(state.columnIndex),
        y: 0,
        width: measure.width,
        height: measure.height,
        pmStart: block.pmStart,
        pmEnd: block.pmEnd,
    };
    const result = paginator.addFragment(fragment, measure.height, 0, 0);
    fragment.y = result.y;
}
/**
 * Does this anchored textbox reserve a vertical band in the flow?
 *
 * True only for behind-doc shapes anchored relative to a PARAGRAPH. The
 * paragraph-relative gate is the watermark guard: a page-relative behind-doc
 * shape (`relFromV === 'page'`) is a watermark / page-background and must NOT
 * push flow content. In-front floats also don't reserve (Word flows text
 * independently). See docs/internal/20 (B2).
 */
function reservesBehindDocBand(block) {
    const a = block.anchor;
    return !!a && a.behindDoc === true && a.relFromV === 'paragraph';
}
/**
 * Walk forward from `startIndex` over the run of CONSECUTIVE behind-doc,
 * paragraph-anchored textbox blocks (the expanded children of one VML
 * `<v:group>`). Returns the last index in the run and the height to reserve so
 * the flow resumes BELOW the cluster: the deepest child bottom,
 * `max(offsetV + height)`.
 *
 * Decorative hairline dividers (also behind-doc paragraph-anchored, but a lone
 * `height≈1` rect that merely overlays an existing border) must NOT push flow,
 * so a cluster whose tallest child is at or below a hairline threshold reserves
 * nothing. The SDS hazard group has real text children (heights 48/50/31) and
 * reserves ≈124px; an SDS divider (height 1) reserves 0.
 */
const HAIRLINE_RESERVE_FLOOR_PX = 4;
function collectBehindDocCluster(blocks, startIndex) {
    var _a, _b, _c;
    let bottom = 0;
    let maxChildHeight = 0;
    let endIndex = startIndex;
    for (let k = startIndex; k < blocks.length; k++) {
        const b = blocks[k];
        if (b.kind !== 'textBox' || !reservesBehindDocBand(b))
            break;
        const tb = b;
        const offsetV = (_b = (_a = tb.anchor) === null || _a === void 0 ? void 0 : _a.offsetV) !== null && _b !== void 0 ? _b : 0;
        const height = (_c = tb.height) !== null && _c !== void 0 ? _c : 0;
        bottom = Math.max(bottom, offsetV + height);
        maxChildHeight = Math.max(maxChildHeight, height);
        endIndex = k;
    }
    const bandHeight = maxChildHeight > HAIRLINE_RESERVE_FLOOR_PX ? bottom : 0;
    return { endIndex, bandHeight };
}
/**
 * Layout an anchored (floating) text box: position absolutely from its
 * page/margin/column anchor and push WITHOUT advancing the cursor, so body
 * text flows independently (matching Word's wrap=none / behind-text shapes).
 * Mirrors `layoutAnchoredImage` but resolves the full `relativeFrom` band math.
 */
function layoutAnchoredTextBox(block, measure, paginator, anchorParagraphTop) {
    if (measure.kind !== 'textBox') {
        throw new Error(`layoutAnchoredTextBox: expected textBox measure`);
    }
    const state = paginator.getCurrentState();
    const page = state.page;
    const margins = page.margins;
    const anchor = block.anchor;
    const contentWidth = page.size.w - margins.left - margins.right;
    const geom = {
        pageWidth: page.size.w,
        pageHeight: page.size.h,
        marginLeft: margins.left,
        marginTop: margins.top,
        contentWidth,
        contentHeight: page.size.h - margins.top - margins.bottom,
        // Content-relative column origin (single-column ≈ 0).
        columnX: paginator.getColumnX(state.columnIndex) - margins.left,
        columnWidth: contentWidth,
    };
    // Block anchor offsets are PIXELS (converted in toProseDoc); resolveAnchor*
    // expects EMU (it converts internally), so round-trip back to EMU.
    const toEmu = (px) => (px != null ? pixelsToEmu(px) : undefined);
    const hSpec = {
        relativeTo: anchor.relFromH,
        align: anchor.alignH,
        posOffset: toEmu(anchor.offsetH),
    };
    const vSpec = {
        relativeTo: anchor.relFromV,
        align: anchor.alignV,
        posOffset: toEmu(anchor.offsetV),
    };
    // resolveAnchor* work in content-area coordinates; cursorY is page-absolute.
    // For a paragraph/line-relative anchor, the OOXML base is the TOP of the
    // anchoring paragraph (the run the drawing lives in), NOT the flow cursor —
    // which by now sits at that paragraph's BOTTOM. Use the recorded top of the
    // paragraph laid out immediately before this textbox (its source paragraph,
    // per `convertParagraphWithTextBoxes`) when available and on this page, so the
    // box shares the float-image path's anchor base. Other anchor frames
    // (page/margin) ignore the base, so the fallback is harmless for them.
    const isParaRelative = anchor.relFromV === 'paragraph' || anchor.relFromV === 'line';
    const paraTopOnThisPage = anchorParagraphTop !== undefined &&
        anchorParagraphTop >= margins.top &&
        anchorParagraphTop <= state.cursorY;
    const baseY = isParaRelative && paraTopOnThisPage ? anchorParagraphTop : state.cursorY;
    const contentBaseY = baseY - margins.top;
    const { x: cx } = resolveAnchorX(hSpec, measure.width, geom);
    const cy = resolveAnchorY(vSpec, measure.height, contentBaseY, geom);
    const fragment = {
        kind: 'textBox',
        blockId: block.id,
        // applyFragmentStyles subtracts margins, so emit page-absolute coords.
        x: margins.left + cx,
        y: margins.top + cy,
        width: measure.width,
        height: measure.height,
        pmStart: block.pmStart,
        pmEnd: block.pmEnd,
        isAnchored: true,
        zIndex: anchor.behindDoc ? -1 : undefined,
    };
    page.fragments.push(fragment);
}
/**
 * Handle a section break block.
 * @param block - The section break block (current section's properties)
 * @param paginator - The paginator instance
 * @param nextSectionConfig - Page layout for the NEXT section
 * @param nextSectionType - Break type of the NEXT section (how it starts relative to current)
 */
function handleSectionBreak(_block, paginator, nextSectionConfig, nextSectionType) {
    var _a;
    // ECMA-376 §17.6.22: w:type specifies how the NEXT section starts relative to this one.
    // Default is 'nextPage' when w:type is absent.
    const breakType = nextSectionType !== null && nextSectionType !== void 0 ? nextSectionType : 'nextPage';
    switch (breakType) {
        case 'nextPage':
            paginator.updatePageLayout(nextSectionConfig.pageSize, nextSectionConfig.margins);
            paginator.forcePageBreak();
            break;
        case 'evenPage': {
            paginator.updatePageLayout(nextSectionConfig.pageSize, nextSectionConfig.margins);
            const state = paginator.forcePageBreak();
            // If landed on odd page, add another page
            if (state.page.number % 2 !== 0) {
                paginator.forcePageBreak();
            }
            break;
        }
        case 'oddPage': {
            paginator.updatePageLayout(nextSectionConfig.pageSize, nextSectionConfig.margins);
            const state = paginator.forcePageBreak();
            // If landed on even page, add another page
            if (state.page.number % 2 === 0) {
                paginator.forcePageBreak();
            }
            break;
        }
        case 'continuous':
            // ECMA-376 §17.6.22: keep current page geometry; defer new size/margins
            // until the next natural page break. Columns apply immediately below.
            paginator.updatePageLayout(nextSectionConfig.pageSize, nextSectionConfig.margins, 
            /* applyImmediately */ false);
            break;
    }
    // Update column layout for the next section
    paginator.updateColumns((_a = nextSectionConfig.columns) !== null && _a !== void 0 ? _a : DEFAULT_COLUMNS);
}
// Re-export types
export * from './types';
export { createPaginator } from './paginator';
export { computeKeepNextChains, calculateChainHeight, getMidChainIndices, hasKeepLines, hasPageBreakBefore, } from './keep-together';
export { scheduleSectionBreak, applyPendingToActive, createInitialSectionState, getEffectiveMargins, getEffectivePageSize, getEffectiveColumns, } from './section-breaks';
export { findPageIndexContainingPmPos } from './findPageIndexContainingPmPos';
//# sourceMappingURL=index.js.map