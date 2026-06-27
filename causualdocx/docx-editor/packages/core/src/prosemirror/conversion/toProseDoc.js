/**
 * Document to ProseMirror Conversion
 *
 * Converts our Document type (from DOCX parsing) to a ProseMirror document.
 * Preserves all formatting attributes for round-trip fidelity.
 *
 * Style Resolution:
 * When styles are provided, paragraph properties are resolved from the style chain:
 * - Document defaults (docDefaults)
 * - Normal style (if no explicit styleId)
 * - Style chain (basedOn inheritance)
 * - Inline properties (highest priority)
 */
import { schema } from '../schema';
import { emuToPixels } from '../../docx/imageParser';
import { isWrapNone } from '../../docx/wrapTypes';
import { createStyleResolver } from '../styles';
import { resolveColor, resolveColorToHex } from '../../utils/colorResolver';
/**
 * Resolve a DrawingML shape/textbox fill or outline ColorValue to a CSS hex.
 * Reading `.rgb` directly (as the old code did) dropped THEME colors (e.g.
 * `schemeClr bg1 + lumMod 85%` = light-gray border) entirely, since they carry
 * no `.rgb`. `resolveColor` honours themeColor + tint/shade + lumMod/lumOff
 * (default theme is fine for the base slots these borders use). Returns
 * undefined for absent / `noFill` / auto colors so we don't paint a stray
 * black border. (theme threading through convertRunContent is avoided here.)
 */
function resolveShapeColor(color) {
    if (!color || color.auto || (!color.rgb && !color.themeColor))
        return undefined;
    return resolveColor(color, undefined);
}
import { mergeTextFormatting } from '../../utils/textFormattingMerge';
/**
 * Translate an OOXML `<a:prstDash w:val="...">` value to a CSS
 * `border-style` keyword. CSS only knows `solid` / `dotted` / `dashed`
 * (and a couple of stylistic ones); OOXML has 11 named variants.
 * Without this mapping a value like `"dashDot"` lands directly in a
 * CSS `border` rule and the browser falls back to `none`, so the
 * outline disappears entirely.
 */
function ooxmlDashToCssBorderStyle(prstDashVal) {
    var _a;
    if (!prstDashVal)
        return 'solid';
    const map = {
        solid: 'solid',
        dot: 'dotted',
        sysDot: 'dotted',
        dash: 'dashed',
        lgDash: 'dashed',
        sysDash: 'dashed',
        dashDot: 'dashed',
        sysDashDot: 'dashed',
        lgDashDot: 'dashed',
        sysDashDotDot: 'dashed',
        lgDashDotDot: 'dashed',
    };
    return (_a = map[prstDashVal]) !== null && _a !== void 0 ? _a : 'solid';
}
/**
 * Convert a Document to a ProseMirror document
 *
 * @param document - The Document to convert
 * @param options - Conversion options including style definitions
 */
export function toProseDoc(document, options) {
    var _a;
    const paragraphs = document.package.document.content;
    const nodes = [];
    const theme = (_a = document.package.theme) !== null && _a !== void 0 ? _a : null;
    // Create style resolver if styles are provided
    const styleResolver = (options === null || options === void 0 ? void 0 : options.styles) ? createStyleResolver(options.styles) : null;
    for (const block of paragraphs) {
        if (block.type === 'paragraph') {
            // Convert paragraph and extract text boxes as sibling nodes
            nodes.push(...convertParagraphWithTextBoxes(block, styleResolver));
            // If any run in this paragraph contains a forced page/column break, emit
            // a pageBreak node after. Column breaks (§17.3.3.1 `w:type="column"`) are
            // carried via the node's `breakType` attr so they aren't silently
            // collapsed into page breaks.
            const forcedBreak = paragraphForcedBreakType(block);
            if (forcedBreak) {
                nodes.push(schema.node('pageBreak', { breakType: forcedBreak }));
            }
        }
        else if (block.type === 'table') {
            const pmTable = convertTable(block, styleResolver, theme);
            nodes.push(pmTable);
        }
    }
    // Ensure we have at least one paragraph
    if (nodes.length === 0) {
        nodes.push(schema.node('paragraph', {}, []));
    }
    return schema.node('doc', null, nodes);
}
/**
 * Convert a Paragraph to a ProseMirror paragraph node
 *
 * Resolves style-based text formatting and passes it to runs so that
 * paragraph styles (like Heading1) apply their font size, color, etc.
 */
function convertParagraph(paragraph, styleResolver, activeCommentIds, extraRunFormatting) {
    var _a;
    const attrs = paragraphFormattingToAttrs(paragraph, styleResolver);
    const inlineNodes = [];
    let bookmarksArr;
    // Track active comment ranges for this paragraph
    const commentIds = activeCommentIds !== null && activeCommentIds !== void 0 ? activeCommentIds : new Set();
    // Get style-based text formatting (font size, bold, color, etc.)
    let styleRunFormatting;
    if (styleResolver) {
        const resolved = styleResolver.resolveParagraphStyle((_a = paragraph.formatting) === null || _a === void 0 ? void 0 : _a.styleId);
        styleRunFormatting = resolved.runFormatting;
    }
    // NOTE: paragraph.formatting?.runProperties is the paragraph mark formatting (pPr/rPr).
    // Per ECMA-376, this only applies to the paragraph mark glyph (¶), NOT to text runs.
    // Style-level rPr (from styleResolver) already provides default run formatting.
    // Merge in extra formatting (e.g., table style conditional rPr)
    const mergedStyleRunFormatting = mergeTextFormatting(styleRunFormatting, extraRunFormatting);
    for (const content of paragraph.content) {
        if (content.type === 'commentRangeStart') {
            commentIds.add(content.id);
        }
        else if (content.type === 'commentRangeEnd') {
            commentIds.delete(content.id);
        }
        else if (content.type === 'run') {
            let runNodes = convertRun(content, mergedStyleRunFormatting, styleResolver);
            if (commentIds.size > 0) {
                runNodes = applyCommentMarks(runNodes, commentIds);
            }
            inlineNodes.push(...runNodes);
        }
        else if (content.type === 'hyperlink') {
            const linkNodes = convertHyperlink(content, mergedStyleRunFormatting, styleResolver);
            inlineNodes.push(...linkNodes);
        }
        else if (content.type === 'simpleField' || content.type === 'complexField') {
            const fieldNode = convertField(content, mergedStyleRunFormatting);
            if (fieldNode)
                inlineNodes.push(fieldNode);
        }
        else if (content.type === 'inlineSdt') {
            const sdtNode = convertInlineSdt(content, mergedStyleRunFormatting, styleResolver);
            if (sdtNode)
                inlineNodes.push(sdtNode);
        }
        else if (content.type === 'insertion') {
            let insNodes = convertTrackedChange(content, 'insertion', mergedStyleRunFormatting, styleResolver);
            if (commentIds.size > 0) {
                insNodes = applyCommentMarks(insNodes, commentIds);
            }
            inlineNodes.push(...insNodes);
        }
        else if (content.type === 'deletion') {
            let delNodes = convertTrackedChange(content, 'deletion', mergedStyleRunFormatting, styleResolver);
            if (commentIds.size > 0) {
                delNodes = applyCommentMarks(delNodes, commentIds);
            }
            inlineNodes.push(...delNodes);
        }
        else if (content.type === 'moveFrom') {
            let moveFromNodes = convertTrackedChange(content, 'deletion', mergedStyleRunFormatting, styleResolver);
            if (commentIds.size > 0) {
                moveFromNodes = applyCommentMarks(moveFromNodes, commentIds);
            }
            inlineNodes.push(...moveFromNodes);
        }
        else if (content.type === 'moveTo') {
            let moveToNodes = convertTrackedChange(content, 'insertion', mergedStyleRunFormatting, styleResolver);
            if (commentIds.size > 0) {
                moveToNodes = applyCommentMarks(moveToNodes, commentIds);
            }
            inlineNodes.push(...moveToNodes);
        }
        else if (content.type === 'mathEquation') {
            const mathNode = convertMathEquation(content);
            if (mathNode)
                inlineNodes.push(mathNode);
        }
        // Collect bookmarkStart entries for round-trip
        if (content.type === 'bookmarkStart') {
            if (!bookmarksArr)
                bookmarksArr = [];
            bookmarksArr.push({ id: content.id, name: content.name });
        }
    }
    if (bookmarksArr) {
        attrs.bookmarks = bookmarksArr;
    }
    return schema.node('paragraph', attrs, inlineNodes);
}
/**
 * Apply comment marks to PM nodes within a comment range.
 * Only the first active comment ID is used (comments don't overlap visually).
 */
function applyCommentMarks(nodes, commentIds) {
    if (commentIds.size === 0)
        return nodes;
    const commentId = [...commentIds][0]; // Use first active comment
    const commentMark = schema.marks.comment.create({ commentId });
    return nodes.map((node) => {
        if (node.isText) {
            return node.mark(commentMark.addToSet(node.marks));
        }
        return node;
    });
}
/**
 * Convert tracked change (insertion or deletion) content to PM nodes with
 * an insertion/deletion mark applied.
 */
function convertTrackedChange(change, markType, styleRunFormatting, styleResolver) {
    var _a;
    const nodes = [];
    for (const item of change.content) {
        if (item.type === 'run') {
            nodes.push(...convertRun(item, styleRunFormatting, styleResolver));
        }
        else if (item.type === 'hyperlink') {
            nodes.push(...convertHyperlink(item, styleRunFormatting, styleResolver));
        }
    }
    const mark = schema.marks[markType].create({
        revisionId: change.info.id,
        author: change.info.author,
        date: (_a = change.info.date) !== null && _a !== void 0 ? _a : null,
    });
    return nodes.map((node) => {
        if (node.isText) {
            return node.mark(mark.addToSet(node.marks));
        }
        return node;
    });
}
/**
 * Convert ParagraphFormatting to ProseMirror paragraph attrs
 *
 * If a styleResolver is provided, resolves style-based formatting and merges
 * with inline formatting. Inline formatting takes precedence.
 */
function paragraphFormattingToAttrs(paragraph, styleResolver) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
    const formatting = paragraph.formatting;
    const styleId = formatting === null || formatting === void 0 ? void 0 : formatting.styleId;
    // Start with base attrs
    const attrs = {
        paraId: (_a = paragraph.paraId) !== null && _a !== void 0 ? _a : undefined,
        textId: (_b = paragraph.textId) !== null && _b !== void 0 ? _b : undefined,
        styleId: styleId,
        numPr: formatting === null || formatting === void 0 ? void 0 : formatting.numPr,
        // List rendering info from parsed numbering definitions
        listNumFmt: (_c = paragraph.listRendering) === null || _c === void 0 ? void 0 : _c.numFmt,
        listIsBullet: (_d = paragraph.listRendering) === null || _d === void 0 ? void 0 : _d.isBullet,
        listMarker: (_e = paragraph.listRendering) === null || _e === void 0 ? void 0 : _e.marker,
        listMarkerHidden: ((_f = paragraph.listRendering) === null || _f === void 0 ? void 0 : _f.markerHidden) || undefined,
        listMarkerFontFamily: ((_g = paragraph.listRendering) === null || _g === void 0 ? void 0 : _g.markerFontFamily) || undefined,
        listMarkerFontSize: ((_h = paragraph.listRendering) === null || _h === void 0 ? void 0 : _h.markerFontSize) || undefined,
        listLevelNumFmts: ((_j = paragraph.listRendering) === null || _j === void 0 ? void 0 : _j.levelNumFmts) || undefined,
        listAbstractNumId: (_k = paragraph.listRendering) === null || _k === void 0 ? void 0 : _k.abstractNumId,
        listStartOverride: (_l = paragraph.listRendering) === null || _l === void 0 ? void 0 : _l.startOverride,
        // Store original inline formatting for lossless serialization round-trip
        _originalFormatting: formatting || undefined,
    };
    // If we have a style resolver, resolve the style and get base properties
    if (styleResolver) {
        const resolved = styleResolver.resolveParagraphStyle(styleId);
        const stylePpr = resolved.paragraphFormatting;
        const styleRpr = resolved.runFormatting;
        // Apply style-based values as defaults (inline overrides)
        attrs.alignment = (_m = formatting === null || formatting === void 0 ? void 0 : formatting.alignment) !== null && _m !== void 0 ? _m : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.alignment;
        attrs.spaceBefore = (_o = formatting === null || formatting === void 0 ? void 0 : formatting.spaceBefore) !== null && _o !== void 0 ? _o : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.spaceBefore;
        attrs.spaceAfter = (_p = formatting === null || formatting === void 0 ? void 0 : formatting.spaceAfter) !== null && _p !== void 0 ? _p : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.spaceAfter;
        attrs.lineSpacing = (_q = formatting === null || formatting === void 0 ? void 0 : formatting.lineSpacing) !== null && _q !== void 0 ? _q : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.lineSpacing;
        attrs.lineSpacingRule = (_r = formatting === null || formatting === void 0 ? void 0 : formatting.lineSpacingRule) !== null && _r !== void 0 ? _r : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.lineSpacingRule;
        // Carry through only the inline-explicit flags (never style-resolved).
        if (formatting === null || formatting === void 0 ? void 0 : formatting.spacingExplicit)
            attrs.spacingExplicit = formatting.spacingExplicit;
        attrs.indentLeft = (_s = formatting === null || formatting === void 0 ? void 0 : formatting.indentLeft) !== null && _s !== void 0 ? _s : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.indentLeft;
        attrs.indentRight = (_t = formatting === null || formatting === void 0 ? void 0 : formatting.indentRight) !== null && _t !== void 0 ? _t : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.indentRight;
        attrs.indentFirstLine = (_u = formatting === null || formatting === void 0 ? void 0 : formatting.indentFirstLine) !== null && _u !== void 0 ? _u : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.indentFirstLine;
        attrs.hangingIndent = (_v = formatting === null || formatting === void 0 ? void 0 : formatting.hangingIndent) !== null && _v !== void 0 ? _v : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.hangingIndent;
        attrs.borders = (_w = formatting === null || formatting === void 0 ? void 0 : formatting.borders) !== null && _w !== void 0 ? _w : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.borders;
        attrs.shading = (_x = formatting === null || formatting === void 0 ? void 0 : formatting.shading) !== null && _x !== void 0 ? _x : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.shading;
        attrs.tabs = (_y = formatting === null || formatting === void 0 ? void 0 : formatting.tabs) !== null && _y !== void 0 ? _y : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.tabs;
        // Page break control
        attrs.pageBreakBefore = (_z = formatting === null || formatting === void 0 ? void 0 : formatting.pageBreakBefore) !== null && _z !== void 0 ? _z : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.pageBreakBefore;
        attrs.keepNext = (_0 = formatting === null || formatting === void 0 ? void 0 : formatting.keepNext) !== null && _0 !== void 0 ? _0 : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.keepNext;
        attrs.keepLines = (_1 = formatting === null || formatting === void 0 ? void 0 : formatting.keepLines) !== null && _1 !== void 0 ? _1 : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.keepLines;
        attrs.contextualSpacing = (_2 = formatting === null || formatting === void 0 ? void 0 : formatting.contextualSpacing) !== null && _2 !== void 0 ? _2 : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.contextualSpacing;
        // Outline level (for TOC)
        attrs.outlineLevel = (_3 = formatting === null || formatting === void 0 ? void 0 : formatting.outlineLevel) !== null && _3 !== void 0 ? _3 : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.outlineLevel;
        // Text direction
        attrs.bidi = (_4 = formatting === null || formatting === void 0 ? void 0 : formatting.bidi) !== null && _4 !== void 0 ? _4 : stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.bidi;
        // Default run properties for runs in this paragraph that don't carry
        // explicit marks. ECMA-376 §17.7.4.18 + §17.3.2 cascade for run
        // formatting:
        //   1. docDefaults.rPr            (already in styleRpr)
        //   2. paragraph style's rPr      (already in styleRpr — basedOn flattened)
        //   3. default character style    (the style marked w:default="1")
        //   4. paragraph-level rPr        (from <w:pPr><w:rPr>)
        // The character-style step on the run itself (w:rStyle) applies later in
        // the per-run conversion. Without merging the default character style
        // here, runs without an explicit <w:rStyle> never see properties set on
        // it (e.g. "Default Paragraph Font" / "FontePadrao" font overrides).
        const defaultCharStyleRpr = (_5 = styleResolver.getDefaultCharacterStyle()) === null || _5 === void 0 ? void 0 : _5.rPr;
        const styleRprWithDefaultChar = defaultCharStyleRpr
            ? mergeTextFormatting(styleRpr, defaultCharStyleRpr)
            : styleRpr;
        const resolvedRunProps = resolveTextFormatting(formatting === null || formatting === void 0 ? void 0 : formatting.runProperties, styleResolver);
        attrs.defaultTextFormatting = mergeTextFormatting(styleRprWithDefaultChar, resolvedRunProps);
        // If style defines numPr but inline doesn't, use style's numPr
        // numId === 0 means "no numbering" per OOXML spec — skip it
        if (!(formatting === null || formatting === void 0 ? void 0 : formatting.numPr) && (stylePpr === null || stylePpr === void 0 ? void 0 : stylePpr.numPr) && stylePpr.numPr.numId !== 0) {
            attrs.numPr = stylePpr.numPr;
        }
    }
    else {
        // No style resolver - use inline formatting only
        attrs.alignment = formatting === null || formatting === void 0 ? void 0 : formatting.alignment;
        attrs.spaceBefore = formatting === null || formatting === void 0 ? void 0 : formatting.spaceBefore;
        attrs.spaceAfter = formatting === null || formatting === void 0 ? void 0 : formatting.spaceAfter;
        attrs.lineSpacing = formatting === null || formatting === void 0 ? void 0 : formatting.lineSpacing;
        attrs.lineSpacingRule = formatting === null || formatting === void 0 ? void 0 : formatting.lineSpacingRule;
        if (formatting === null || formatting === void 0 ? void 0 : formatting.spacingExplicit)
            attrs.spacingExplicit = formatting.spacingExplicit;
        attrs.indentLeft = formatting === null || formatting === void 0 ? void 0 : formatting.indentLeft;
        attrs.indentRight = formatting === null || formatting === void 0 ? void 0 : formatting.indentRight;
        attrs.indentFirstLine = formatting === null || formatting === void 0 ? void 0 : formatting.indentFirstLine;
        attrs.hangingIndent = formatting === null || formatting === void 0 ? void 0 : formatting.hangingIndent;
        attrs.borders = formatting === null || formatting === void 0 ? void 0 : formatting.borders;
        attrs.shading = formatting === null || formatting === void 0 ? void 0 : formatting.shading;
        attrs.tabs = formatting === null || formatting === void 0 ? void 0 : formatting.tabs;
        // Page break control
        attrs.pageBreakBefore = formatting === null || formatting === void 0 ? void 0 : formatting.pageBreakBefore;
        attrs.keepNext = formatting === null || formatting === void 0 ? void 0 : formatting.keepNext;
        attrs.keepLines = formatting === null || formatting === void 0 ? void 0 : formatting.keepLines;
        // Outline level
        attrs.outlineLevel = formatting === null || formatting === void 0 ? void 0 : formatting.outlineLevel;
        // Text direction
        attrs.bidi = formatting === null || formatting === void 0 ? void 0 : formatting.bidi;
        // Default run properties (pPr/rPr)
        attrs.defaultTextFormatting = resolveTextFormatting(formatting === null || formatting === void 0 ? void 0 : formatting.runProperties, styleResolver);
    }
    // Section break type and full section properties for layout + round-trip
    if (paragraph.sectionProperties) {
        attrs._sectionProperties = paragraph.sectionProperties;
        const st = paragraph.sectionProperties.sectionStart;
        if (st === 'nextPage' || st === 'continuous' || st === 'oddPage' || st === 'evenPage') {
            attrs.sectionBreakType = st;
        }
    }
    if (paragraph.renderedPageBreakBefore) {
        attrs.renderedPageBreakBefore = true;
    }
    return attrs;
}
// ============================================================================
// TABLE CONVERSION
// ============================================================================
/**
 * Resolve table style conditional formatting
 */
function resolveTableStyleConditional(styleResolver, tableStyleId, conditionType) {
    var _a;
    if (!styleResolver || !tableStyleId)
        return undefined;
    const style = styleResolver.getStyle(tableStyleId);
    if (!(style === null || style === void 0 ? void 0 : style.tblStylePr))
        return undefined;
    const conditional = style.tblStylePr.find((p) => p.type === conditionType);
    if (!conditional)
        return undefined;
    const runPropsFromPpr = resolveTextFormatting((_a = conditional.pPr) === null || _a === void 0 ? void 0 : _a.runProperties, styleResolver);
    const resolvedRpr = resolveTextFormatting(conditional.rPr, styleResolver);
    const mergedRunProps = mergeTextFormatting(runPropsFromPpr, resolvedRpr);
    return {
        tcPr: conditional.tcPr,
        rPr: mergedRunProps,
    };
}
function mergeConditionalStyles(base, override) {
    var _a, _b, _c, _d, _e, _f;
    if (!base && !override)
        return undefined;
    if (!base)
        return override;
    if (!override)
        return base;
    const merged = {};
    const baseTcPr = base.tcPr;
    const overrideTcPr = override.tcPr;
    if (baseTcPr || overrideTcPr) {
        const tcPr = Object.assign(Object.assign({}, (baseTcPr !== null && baseTcPr !== void 0 ? baseTcPr : {})), (overrideTcPr !== null && overrideTcPr !== void 0 ? overrideTcPr : {}));
        if ((baseTcPr === null || baseTcPr === void 0 ? void 0 : baseTcPr.borders) || (overrideTcPr === null || overrideTcPr === void 0 ? void 0 : overrideTcPr.borders)) {
            tcPr.borders = Object.assign(Object.assign({}, ((_a = baseTcPr === null || baseTcPr === void 0 ? void 0 : baseTcPr.borders) !== null && _a !== void 0 ? _a : {})), ((_b = overrideTcPr === null || overrideTcPr === void 0 ? void 0 : overrideTcPr.borders) !== null && _b !== void 0 ? _b : {}));
        }
        if ((baseTcPr === null || baseTcPr === void 0 ? void 0 : baseTcPr.shading) || (overrideTcPr === null || overrideTcPr === void 0 ? void 0 : overrideTcPr.shading)) {
            tcPr.shading = Object.assign(Object.assign({}, ((_c = baseTcPr === null || baseTcPr === void 0 ? void 0 : baseTcPr.shading) !== null && _c !== void 0 ? _c : {})), ((_d = overrideTcPr === null || overrideTcPr === void 0 ? void 0 : overrideTcPr.shading) !== null && _d !== void 0 ? _d : {}));
        }
        if ((baseTcPr === null || baseTcPr === void 0 ? void 0 : baseTcPr.margins) || (overrideTcPr === null || overrideTcPr === void 0 ? void 0 : overrideTcPr.margins)) {
            tcPr.margins = Object.assign(Object.assign({}, ((_e = baseTcPr === null || baseTcPr === void 0 ? void 0 : baseTcPr.margins) !== null && _e !== void 0 ? _e : {})), ((_f = overrideTcPr === null || overrideTcPr === void 0 ? void 0 : overrideTcPr.margins) !== null && _f !== void 0 ? _f : {}));
        }
        merged.tcPr = tcPr;
    }
    merged.rPr = mergeTextFormatting(base.rPr, override.rPr);
    return merged;
}
function resolveTextFormatting(formatting, styleResolver) {
    if (!formatting)
        return undefined;
    if (!styleResolver)
        return formatting;
    // Even when the run has no explicit <w:rStyle>, OOXML §17.7.4.18 says it
    // still inherits from the default character style. resolveRunStyle(undef)
    // returns docDefaults.rPr merged with the default character style's rPr —
    // pre-PR we skipped this path entirely for runs without a styleId, losing
    // any property the default character style sets.
    const styleFormatting = styleResolver.resolveRunStyle(formatting.styleId);
    if (!styleFormatting)
        return formatting;
    return mergeTextFormatting(styleFormatting, formatting);
}
/**
 * Convert a Table to a ProseMirror table node
 *
 * Handles column widths from w:tblGrid - if cell widths aren't specified,
 * we use the grid column widths to set cell widths. This ensures tables
 * preserve their layout when opened from DOCX files.
 */
/**
 * Calculate rowSpan values from vMerge attributes.
 * OOXML uses vMerge="restart" to start a vertical merge and vMerge="continue" for cells that should be merged.
 * This function converts that to rowSpan values and marks which cells should be skipped.
 */
function calculateRowSpans(table) {
    var _a, _b, _c;
    const result = new Map();
    const numRows = table.rows.length;
    // Track active vertical merges per column (stores the row index where merge started)
    const activeMerges = new Map();
    // Process each row
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        const row = table.rows[rowIndex];
        let colIndex = 0;
        for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
            const cell = row.cells[cellIndex];
            const colspan = (_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1;
            const vMerge = (_c = cell.formatting) === null || _c === void 0 ? void 0 : _c.vMerge;
            const key = `${rowIndex}-${colIndex}`;
            if (vMerge === 'restart') {
                // Start of a new vertical merge
                activeMerges.set(colIndex, rowIndex);
                result.set(key, { rowSpan: 1, skip: false });
            }
            else if (vMerge === 'continue') {
                // Continuation of a merge - this cell should be skipped
                const startRow = activeMerges.get(colIndex);
                if (startRow !== undefined) {
                    // Increment rowSpan of the starting cell
                    const startKey = `${startRow}-${colIndex}`;
                    const startCell = result.get(startKey);
                    if (startCell) {
                        startCell.rowSpan++;
                    }
                }
                result.set(key, { rowSpan: 1, skip: true });
            }
            else {
                // No vMerge - clear any active merge for this column
                activeMerges.delete(colIndex);
                result.set(key, { rowSpan: 1, skip: false });
            }
            colIndex += colspan;
        }
    }
    return result;
}
function convertTable(table, styleResolver, theme) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
    // Calculate rowSpan values from vMerge
    const rowSpanMap = calculateRowSpans(table);
    // Get column widths from table grid
    const columnWidths = table.columnWidths;
    // Calculate total width from columnWidths if available (for percentage calculation)
    const totalWidth = (_a = columnWidths === null || columnWidths === void 0 ? void 0 : columnWidths.reduce((sum, w) => sum + w, 0)) !== null && _a !== void 0 ? _a : 0;
    // Get the table style's conditional formatting
    const tableStyleId = (_b = table.formatting) === null || _b === void 0 ? void 0 : _b.styleId;
    const look = (_c = table.formatting) === null || _c === void 0 ? void 0 : _c.look;
    // Resolve table borders via the OOXML cascade (§17.4.41 + §17.7.4.18):
    //   1. inline w:tblBorders on the table
    //   2. table style's tblPr.borders (basedOn chain already flattened)
    //   3. default table style's tblPr.borders (the style marked w:default="1")
    // Pre-PR, when no tblStyle was set we hardcoded a lookup of styleId
    // "TableGrid" — fragile for non-Word generators (which may not ship that
    // style) and incorrect for docs whose default table style differs from
    // TableGrid. Walking through the parsed default flag matches spec and
    // works for any document language ("Normal Table", "TableNormal", etc.).
    const tableStyle = tableStyleId ? styleResolver === null || styleResolver === void 0 ? void 0 : styleResolver.getStyle(tableStyleId) : undefined;
    const defaultTableStyle = styleResolver === null || styleResolver === void 0 ? void 0 : styleResolver.getDefaultTableStyle();
    const resolvedTableBorders = (_g = (_e = (_d = table.formatting) === null || _d === void 0 ? void 0 : _d.borders) !== null && _e !== void 0 ? _e : (_f = tableStyle === null || tableStyle === void 0 ? void 0 : tableStyle.tblPr) === null || _f === void 0 ? void 0 : _f.borders) !== null && _g !== void 0 ? _g : (_h = defaultTableStyle === null || defaultTableStyle === void 0 ? void 0 : defaultTableStyle.tblPr) === null || _h === void 0 ? void 0 : _h.borders;
    // Resolve default cell margins via the same cascade as borders. Tables
    // that don't carry a tblStyle reference still inherit cellMargins from the
    // default table style per §17.4.41 + §17.7.4.18; pre-PR such tables had
    // no cellMargins at all and the layout-bridge fell back to a hardcoded
    // 7 px. `defaultTableStyle` is shared with the borders cascade above.
    const tableCellMargins = (_p = (_m = (_k = (_j = table.formatting) === null || _j === void 0 ? void 0 : _j.cellMargins) !== null && _k !== void 0 ? _k : (_l = tableStyle === null || tableStyle === void 0 ? void 0 : tableStyle.tblPr) === null || _l === void 0 ? void 0 : _l.cellMargins) !== null && _m !== void 0 ? _m : (_o = defaultTableStyle === null || defaultTableStyle === void 0 ? void 0 : defaultTableStyle.tblPr) === null || _o === void 0 ? void 0 : _o.cellMargins) !== null && _p !== void 0 ? _p : undefined;
    const cellMarginsAttr = tableCellMargins
        ? {
            top: (_q = tableCellMargins.top) === null || _q === void 0 ? void 0 : _q.value,
            bottom: (_r = tableCellMargins.bottom) === null || _r === void 0 ? void 0 : _r.value,
            left: (_s = tableCellMargins.left) === null || _s === void 0 ? void 0 : _s.value,
            right: (_t = tableCellMargins.right) === null || _t === void 0 ? void 0 : _t.value,
        }
        : undefined;
    // Render-only resolved margins. The `cellMargins` attr above stays the
    // verbatim inline <w:tblCellMar> so round-trip serialization re-emits
    // exactly what the source had. But the cascade is PER-SIDE for LAYOUT:
    // a table whose inline tblCellMar specifies only top/bottom (a common
    // authoring pattern, e.g. medical-incident-form) must still inherit
    // left/right from the table style / default table style — Word does NOT
    // treat the unspecified sides as zero. We resolve each side independently
    // here and stash it in a non-serialized attr the layout bridge prefers;
    // this is what keeps the label column's left text inset (~108 twips)
    // matching LibreOffice instead of letting text run to the cell edge
    // (wider text area → drifted wrap points → taller rows → page drift).
    const cellMarginSources = [
        (_u = table.formatting) === null || _u === void 0 ? void 0 : _u.cellMargins,
        (_v = tableStyle === null || tableStyle === void 0 ? void 0 : tableStyle.tblPr) === null || _v === void 0 ? void 0 : _v.cellMargins,
        (_w = defaultTableStyle === null || defaultTableStyle === void 0 ? void 0 : defaultTableStyle.tblPr) === null || _w === void 0 ? void 0 : _w.cellMargins,
    ];
    const resolveCellMarginSide = (side) => {
        for (const source of cellMarginSources) {
            const measurement = source === null || source === void 0 ? void 0 : source[side];
            if ((measurement === null || measurement === void 0 ? void 0 : measurement.value) != null)
                return measurement.value;
        }
        return undefined;
    };
    const resolvedCellMarginsAttr = cellMarginSources.some((source) => source != null)
        ? {
            top: resolveCellMarginSide('top'),
            bottom: resolveCellMarginSide('bottom'),
            left: resolveCellMarginSide('left'),
            right: resolveCellMarginSide('right'),
        }
        : undefined;
    const attrs = {
        styleId: (_x = table.formatting) === null || _x === void 0 ? void 0 : _x.styleId,
        width: (_z = (_y = table.formatting) === null || _y === void 0 ? void 0 : _y.width) === null || _z === void 0 ? void 0 : _z.value,
        widthType: (_1 = (_0 = table.formatting) === null || _0 === void 0 ? void 0 : _0.width) === null || _1 === void 0 ? void 0 : _1.type,
        justification: (_2 = table.formatting) === null || _2 === void 0 ? void 0 : _2.justification,
        columnWidths: columnWidths,
        floating: (_3 = table.formatting) === null || _3 === void 0 ? void 0 : _3.floating,
        cellMargins: cellMarginsAttr,
        resolvedCellMargins: resolvedCellMarginsAttr,
        look: (_4 = table.formatting) === null || _4 === void 0 ? void 0 : _4.look,
        _originalFormatting: table.formatting || undefined,
    };
    const conditionalStyles = {
        wholeTable: resolveTableStyleConditional(styleResolver, tableStyleId, 'wholeTable'),
        firstRow: resolveTableStyleConditional(styleResolver, tableStyleId, 'firstRow'),
        lastRow: resolveTableStyleConditional(styleResolver, tableStyleId, 'lastRow'),
        firstCol: resolveTableStyleConditional(styleResolver, tableStyleId, 'firstCol'),
        lastCol: resolveTableStyleConditional(styleResolver, tableStyleId, 'lastCol'),
        band1Horz: resolveTableStyleConditional(styleResolver, tableStyleId, 'band1Horz'),
        band2Horz: resolveTableStyleConditional(styleResolver, tableStyleId, 'band2Horz'),
        band1Vert: resolveTableStyleConditional(styleResolver, tableStyleId, 'band1Vert'),
        band2Vert: resolveTableStyleConditional(styleResolver, tableStyleId, 'band2Vert'),
        nwCell: resolveTableStyleConditional(styleResolver, tableStyleId, 'nwCell'),
        neCell: resolveTableStyleConditional(styleResolver, tableStyleId, 'neCell'),
        swCell: resolveTableStyleConditional(styleResolver, tableStyleId, 'swCell'),
        seCell: resolveTableStyleConditional(styleResolver, tableStyleId, 'seCell'),
    };
    const bandingEnabledH = (look === null || look === void 0 ? void 0 : look.noHBand) !== true;
    const bandingEnabledV = (look === null || look === void 0 ? void 0 : look.noVBand) !== true;
    // Track data row index (excluding header rows) for banding
    let dataRowIndex = 0;
    const totalRows = table.rows.length;
    const totalColumns = (_5 = columnWidths === null || columnWidths === void 0 ? void 0 : columnWidths.length) !== null && _5 !== void 0 ? _5 : Math.max(0, ...table.rows.map((row) => row.cells.reduce((sum, cell) => { var _a, _b; return sum + ((_b = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.gridSpan) !== null && _b !== void 0 ? _b : 1); }, 0)));
    const rows = table.rows.map((row, rowIndex) => {
        // Conditional formatting flag: firstRow in tblLook means "apply first-row styling"
        const isFirstRowStyled = rowIndex === 0 && !!(look === null || look === void 0 ? void 0 : look.firstRow);
        const isLastRow = rowIndex === totalRows - 1 && !!(look === null || look === void 0 ? void 0 : look.lastRow);
        const rowBandStyle = bandingEnabledH && !isFirstRowStyled && !isLastRow
            ? dataRowIndex % 2 === 0
                ? conditionalStyles.band1Horz
                : conditionalStyles.band2Horz
            : undefined;
        if (bandingEnabledH && !isFirstRowStyled && !isLastRow) {
            dataRowIndex++;
        }
        return convertTableRow(row, styleResolver, isFirstRowStyled, columnWidths, totalWidth, conditionalStyles, rowBandStyle, bandingEnabledV, look, resolvedTableBorders, // Pass resolved table borders (own or from style)
        rowIndex, totalRows, totalColumns, rowSpanMap, cellMarginsAttr, theme);
    });
    return schema.node('table', attrs, rows);
}
/**
 * Convert a TableRow to a ProseMirror table row node
 */
function convertTableRow(row, styleResolver, isHeaderRow, columnWidths, totalWidth, conditionalStyles, rowBandStyle, bandingEnabledV, tableLook, tableBorders, rowIndex, totalRows, totalColumns, rowSpanMap, defaultCellMargins, theme) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const attrs = {
        height: (_b = (_a = row.formatting) === null || _a === void 0 ? void 0 : _a.height) === null || _b === void 0 ? void 0 : _b.value,
        heightRule: (_c = row.formatting) === null || _c === void 0 ? void 0 : _c.heightRule,
        // isHeader controls header row REPETITION on page breaks.
        // Only w:tblHeader (row.formatting.header) should trigger this — NOT tblLook/firstRow
        // which is purely a conditional formatting flag (ECMA-376 §17.7.6.1).
        isHeader: !!((_d = row.formatting) === null || _d === void 0 ? void 0 : _d.header),
        _originalFormatting: row.formatting || undefined,
    };
    const numCells = row.cells.length;
    const isFirstRow = rowIndex === 0;
    const isLastRow = rowIndex === (totalRows !== null && totalRows !== void 0 ? totalRows : 1) - 1;
    const rowCnf = (_e = row.formatting) === null || _e === void 0 ? void 0 : _e.conditionalFormat;
    const rowIsFirstRow = (_f = rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstRow) !== null && _f !== void 0 ? _f : isFirstRow;
    const rowIsLastRow = (_g = rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastRow) !== null && _g !== void 0 ? _g : isLastRow;
    const totalCols = totalColumns !== null && totalColumns !== void 0 ? totalColumns : numCells;
    // Track column index for mapping to columnWidths (accounting for colspan)
    let colIndex = 0;
    const cells = [];
    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
        const cell = row.cells[cellIndex];
        const colspan = (_j = (_h = cell.formatting) === null || _h === void 0 ? void 0 : _h.gridSpan) !== null && _j !== void 0 ? _j : 1;
        // Check if this cell should be skipped (it's a vMerge continue cell)
        const rowSpanKey = `${rowIndex !== null && rowIndex !== void 0 ? rowIndex : 0}-${colIndex}`;
        const rowSpanInfo = rowSpanMap === null || rowSpanMap === void 0 ? void 0 : rowSpanMap.get(rowSpanKey);
        const shouldSkip = (_k = rowSpanInfo === null || rowSpanInfo === void 0 ? void 0 : rowSpanInfo.skip) !== null && _k !== void 0 ? _k : false;
        const calculatedRowSpan = (_l = rowSpanInfo === null || rowSpanInfo === void 0 ? void 0 : rowSpanInfo.rowSpan) !== null && _l !== void 0 ? _l : 1;
        // Calculate the width for this cell from columnWidths if cell doesn't have own width
        let gridWidth;
        if (columnWidths && totalWidth && totalWidth > 0) {
            // Sum widths for all columns this cell spans
            let cellWidthTwips = 0;
            for (let i = 0; i < colspan && colIndex + i < columnWidths.length; i++) {
                cellWidthTwips += columnWidths[colIndex + i];
            }
            // Convert to percentage of total table width
            gridWidth = Math.round((cellWidthTwips / totalWidth) * 100);
        }
        colIndex += colspan;
        // Skip cells that are part of a vertical merge (vMerge="continue")
        if (shouldSkip) {
            continue;
        }
        // Determine cell position for table border application
        const isFirstCol = colIndex - colspan === 0;
        const isLastCol = colIndex === totalCols;
        const cellCnf = (_m = cell.formatting) === null || _m === void 0 ? void 0 : _m.conditionalFormat;
        const cellIsFirstRow = (_o = cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstRow) !== null && _o !== void 0 ? _o : rowIsFirstRow;
        const cellIsLastRow = (_p = cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastRow) !== null && _p !== void 0 ? _p : rowIsLastRow;
        const cellIsFirstCol = (_q = cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstColumn) !== null && _q !== void 0 ? _q : isFirstCol;
        const cellIsLastCol = (_r = cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastColumn) !== null && _r !== void 0 ? _r : isLastCol;
        // Determine vertical banding style based on column index
        let vertBandStyle;
        if (bandingEnabledV) {
            const firstColOffset = (tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstColumn) ? 1 : 0;
            const bandColIndex = colIndex - colspan - firstColOffset;
            const isEligible = bandColIndex >= 0 &&
                !((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastColumn) && cellIsLastCol) &&
                !((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstColumn) && cellIsFirstCol);
            if (isEligible) {
                vertBandStyle =
                    bandColIndex % 2 === 0 ? conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band1Vert : conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band2Vert;
            }
        }
        if (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.oddVBand) {
            vertBandStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band1Vert;
        }
        else if (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.evenVBand) {
            vertBandStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band2Vert;
        }
        let effectiveRowBandStyle = rowBandStyle;
        if (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.oddHBand) {
            effectiveRowBandStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band1Horz;
        }
        else if (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.evenHBand) {
            effectiveRowBandStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band2Horz;
        }
        if (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.oddHBand) {
            effectiveRowBandStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band1Horz;
        }
        else if (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.evenHBand) {
            effectiveRowBandStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.band2Horz;
        }
        // Build conditional style precedence (wholeTable -> banding -> row/col -> corners)
        let cellConditionalStyle = conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.wholeTable;
        cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, effectiveRowBandStyle);
        cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, vertBandStyle);
        if (cellIsFirstRow && ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstRow) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstRow) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstRow))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.firstRow);
        }
        if (cellIsLastRow && ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastRow) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastRow) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastRow))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.lastRow);
        }
        if (cellIsFirstCol && ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstColumn) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstColumn) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstColumn))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.firstCol);
        }
        if (cellIsLastCol && ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastColumn) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastColumn) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastColumn))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.lastCol);
        }
        if (cellIsFirstRow &&
            cellIsFirstCol &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstRow) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstRow) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstRow)) &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstColumn) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstColumn) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstColumn))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.nwCell);
        }
        if (cellIsFirstRow &&
            cellIsLastCol &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstRow) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstRow) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstRow)) &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastColumn) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastColumn) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastColumn))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.neCell);
        }
        if (cellIsLastRow &&
            cellIsFirstCol &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastRow) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastRow) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastRow)) &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.firstColumn) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.firstColumn) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.firstColumn))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.swCell);
        }
        if (cellIsLastRow &&
            cellIsLastCol &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastRow) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastRow) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastRow)) &&
            ((tableLook === null || tableLook === void 0 ? void 0 : tableLook.lastColumn) || (rowCnf === null || rowCnf === void 0 ? void 0 : rowCnf.lastColumn) || (cellCnf === null || cellCnf === void 0 ? void 0 : cellCnf.lastColumn))) {
            cellConditionalStyle = mergeConditionalStyles(cellConditionalStyle, conditionalStyles === null || conditionalStyles === void 0 ? void 0 : conditionalStyles.seCell);
        }
        cells.push(convertTableCell(cell, styleResolver, isHeaderRow, gridWidth, cellConditionalStyle, tableBorders, isFirstRow, isLastRow, isFirstCol, isLastCol, calculatedRowSpan, defaultCellMargins, theme));
    }
    return schema.node('tableRow', attrs, cells);
}
const CELL_BORDER_SIDES = ['top', 'bottom', 'left', 'right', 'insideH', 'insideV'];
/**
 * Bake themed border colors to RGB up front: the cell schema's `toDOM` has no
 * theme access, so a `themeColor` border would otherwise hit the default Office
 * palette there. Mirrors how cell shading resolves into `backgroundColor`.
 * `auto`, plain-RGB, and unresolvable-themed colors pass through unchanged
 * (`resolveColor` defaults the last case downstream).
 */
function resolveBorderColors(borders, theme) {
    var _a;
    if (!borders)
        return borders;
    let resolved;
    for (const side of CELL_BORDER_SIDES) {
        const border = borders[side];
        if (!((_a = border === null || border === void 0 ? void 0 : border.color) === null || _a === void 0 ? void 0 : _a.themeColor) || border.color.auto)
            continue;
        const hex = resolveColorToHex(border.color, theme);
        if (!hex)
            continue;
        resolved !== null && resolved !== void 0 ? resolved : (resolved = Object.assign({}, borders));
        resolved[side] = Object.assign(Object.assign({}, border), { color: { rgb: hex } });
    }
    return resolved !== null && resolved !== void 0 ? resolved : borders;
}
/**
 * Convert a TableCell to a ProseMirror table cell node
 */
function convertTableCell(cell, styleResolver, isHeader, gridWidthPercent, conditionalStyle, tableBorders, isFirstRow, isLastRow, isFirstCol, isLastCol, calculatedRowSpan, defaultCellMargins, theme) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const formatting = cell.formatting;
    // Use the pre-calculated rowSpan from vMerge analysis
    const rowspan = calculatedRowSpan !== null && calculatedRowSpan !== void 0 ? calculatedRowSpan : 1;
    // Determine width: prefer cell's own width, fall back to grid width.
    // Non-positive values fall through; resolveTableWidthPx maps them to undefined.
    let width = (_a = formatting === null || formatting === void 0 ? void 0 : formatting.width) === null || _a === void 0 ? void 0 : _a.value;
    let widthType = (_b = formatting === null || formatting === void 0 ? void 0 : formatting.width) === null || _b === void 0 ? void 0 : _b.type;
    // If cell doesn't have its own width, use the grid-calculated percentage
    if (width === undefined && gridWidthPercent !== undefined) {
        width = gridWidthPercent;
        widthType = 'pct';
    }
    // Cell's own shading wins; fall back to the table style's conditional row/col shading.
    const backgroundColor = resolveColorToHex((_d = (_c = formatting === null || formatting === void 0 ? void 0 : formatting.shading) === null || _c === void 0 ? void 0 : _c.fill) !== null && _d !== void 0 ? _d : (_f = (_e = conditionalStyle === null || conditionalStyle === void 0 ? void 0 : conditionalStyle.tcPr) === null || _e === void 0 ? void 0 : _e.shading) === null || _f === void 0 ? void 0 : _f.fill, theme);
    // Convert borders — preserve full BorderSpec per side
    // Priority: cell borders > conditional style borders > table borders
    const baseBorders = tableBorders
        ? {
            top: isFirstRow ? tableBorders.top : tableBorders.insideH,
            bottom: isLastRow ? tableBorders.bottom : tableBorders.insideH,
            left: isFirstCol ? tableBorders.left : tableBorders.insideV,
            right: isLastCol ? tableBorders.right : tableBorders.insideV,
        }
        : undefined;
    const conditionalBorders = (_g = conditionalStyle === null || conditionalStyle === void 0 ? void 0 : conditionalStyle.tcPr) === null || _g === void 0 ? void 0 : _g.borders;
    const cellBorders = formatting === null || formatting === void 0 ? void 0 : formatting.borders;
    const borders = resolveBorderColors(baseBorders || conditionalBorders || cellBorders
        ? Object.assign(Object.assign(Object.assign({}, (baseBorders !== null && baseBorders !== void 0 ? baseBorders : {})), (conditionalBorders !== null && conditionalBorders !== void 0 ? conditionalBorders : {})), (cellBorders !== null && cellBorders !== void 0 ? cellBorders : {})) : undefined, theme);
    const attrs = {
        colspan: (_h = formatting === null || formatting === void 0 ? void 0 : formatting.gridSpan) !== null && _h !== void 0 ? _h : 1,
        rowspan: rowspan,
        width: width,
        widthType: widthType,
        verticalAlign: formatting === null || formatting === void 0 ? void 0 : formatting.verticalAlign,
        backgroundColor: backgroundColor,
        textDirection: formatting === null || formatting === void 0 ? void 0 : formatting.textDirection,
        noWrap: formatting === null || formatting === void 0 ? void 0 : formatting.noWrap,
        borders: borders,
        margins: (formatting === null || formatting === void 0 ? void 0 : formatting.margins)
            ? {
                top: (_j = formatting.margins.top) === null || _j === void 0 ? void 0 : _j.value,
                bottom: (_k = formatting.margins.bottom) === null || _k === void 0 ? void 0 : _k.value,
                left: (_l = formatting.margins.left) === null || _l === void 0 ? void 0 : _l.value,
                right: (_m = formatting.margins.right) === null || _m === void 0 ? void 0 : _m.value,
            }
            : ((_o = conditionalStyle === null || conditionalStyle === void 0 ? void 0 : conditionalStyle.tcPr) === null || _o === void 0 ? void 0 : _o.margins)
                ? {
                    top: (_p = conditionalStyle.tcPr.margins.top) === null || _p === void 0 ? void 0 : _p.value,
                    bottom: (_q = conditionalStyle.tcPr.margins.bottom) === null || _q === void 0 ? void 0 : _q.value,
                    left: (_r = conditionalStyle.tcPr.margins.left) === null || _r === void 0 ? void 0 : _r.value,
                    right: (_s = conditionalStyle.tcPr.margins.right) === null || _s === void 0 ? void 0 : _s.value,
                }
                : defaultCellMargins,
        _originalFormatting: formatting || undefined,
        _originalResolvedFill: backgroundColor,
    };
    // Convert cell content (paragraphs and nested tables)
    const contentNodes = [];
    for (const content of cell.content) {
        if (content.type === 'paragraph') {
            contentNodes.push(convertParagraph(content, styleResolver, undefined, conditionalStyle === null || conditionalStyle === void 0 ? void 0 : conditionalStyle.rPr));
        }
        else if (content.type === 'table') {
            // Nested tables - recursively convert
            contentNodes.push(convertTable(content, styleResolver));
        }
    }
    // Ensure cell has at least one paragraph
    if (contentNodes.length === 0) {
        contentNodes.push(schema.node('paragraph', {}, []));
    }
    // Use tableHeader for header cells, tableCell otherwise
    const nodeType = isHeader ? 'tableHeader' : 'tableCell';
    return schema.node(nodeType, attrs, contentNodes);
}
/**
 * Convert a SimpleField or ComplexField to a ProseMirror field node.
 * Preserves run formatting (bold, fontSize, color, etc.) as PM marks.
 * Accepts styleFormatting so fields inherit paragraph-level formatting
 * (same as convertRun does for regular text runs).
 */
function convertField(field, styleFormatting) {
    var _a, _b;
    // Extract display text and formatting from field content/result
    let displayText = '';
    let fieldFormatting;
    const runs = field.type === 'simpleField' ? field.content : field.fieldResult;
    if (runs) {
        for (const r of runs) {
            if (r.type === 'run') {
                for (const c of r.content) {
                    if (c.type === 'text')
                        displayText += c.text;
                }
                // Use formatting from the first run that has it
                if (!fieldFormatting && r.formatting) {
                    fieldFormatting = r.formatting;
                }
            }
        }
    }
    // Merge style formatting with field run formatting (inline takes precedence)
    const mergedFormatting = mergeTextFormatting(styleFormatting, fieldFormatting);
    const marks = textFormattingToMarks(mergedFormatting);
    return schema.node('field', {
        fieldType: field.fieldType,
        instruction: field.instruction,
        displayText,
        fieldKind: field.type === 'simpleField' ? 'simple' : 'complex',
        fldLock: (_a = field.fldLock) !== null && _a !== void 0 ? _a : false,
        dirty: (_b = field.dirty) !== null && _b !== void 0 ? _b : false,
    }, undefined, marks);
}
/**
 * Convert a MathEquation to a ProseMirror math node.
 */
function convertMathEquation(math) {
    return schema.node('math', {
        display: math.display,
        ommlXml: math.ommlXml,
        plainText: math.plainText || '',
    });
}
/**
 * Convert an InlineSdt to a ProseMirror sdt node with inline content.
 */
function convertInlineSdt(sdt, styleRunFormatting, styleResolver) {
    var _a, _b, _c, _d, _e, _f, _g;
    const props = sdt.properties;
    const inlineNodes = [];
    for (const content of sdt.content) {
        if (content.type === 'run') {
            const runNodes = convertRun(content, styleRunFormatting, styleResolver);
            inlineNodes.push(...runNodes);
        }
        else if (content.type === 'hyperlink') {
            const linkNodes = convertHyperlink(content, styleRunFormatting, styleResolver);
            inlineNodes.push(...linkNodes);
        }
    }
    return schema.node('sdt', {
        sdtType: props.sdtType,
        alias: (_a = props.alias) !== null && _a !== void 0 ? _a : null,
        tag: (_b = props.tag) !== null && _b !== void 0 ? _b : null,
        lock: (_c = props.lock) !== null && _c !== void 0 ? _c : null,
        placeholder: (_d = props.placeholder) !== null && _d !== void 0 ? _d : null,
        showingPlaceholder: (_e = props.showingPlaceholder) !== null && _e !== void 0 ? _e : false,
        dateFormat: (_f = props.dateFormat) !== null && _f !== void 0 ? _f : null,
        listItems: props.listItems ? JSON.stringify(props.listItems) : null,
        checked: (_g = props.checked) !== null && _g !== void 0 ? _g : null,
    }, inlineNodes.length > 0 ? inlineNodes : undefined);
}
/**
 * Convert a Run to ProseMirror text nodes with marks
 *
 * @param run - The run to convert
 * @param styleFormatting - Text formatting from the paragraph's style (e.g., Heading1's font size/color)
 */
function convertRun(run, styleFormatting, styleResolver) {
    var _a;
    const nodes = [];
    // Merge style formatting with run's inline formatting
    // Inline formatting takes precedence over style formatting
    //
    // Use getRunStyleOwnProperties (not resolveRunStyle) to avoid docDefaults
    // from the character style overriding paragraph style properties.
    // The styleFormatting parameter already includes docDefaults from paragraph
    // style resolution, so we only need the character style's own properties.
    const runStyleFormatting = ((_a = run.formatting) === null || _a === void 0 ? void 0 : _a.styleId)
        ? styleResolver === null || styleResolver === void 0 ? void 0 : styleResolver.getRunStyleOwnProperties(run.formatting.styleId)
        : undefined;
    const mergedFormatting = mergeTextFormatting(mergeTextFormatting(styleFormatting, runStyleFormatting), run.formatting);
    const marks = textFormattingToMarks(mergedFormatting);
    for (const content of run.content) {
        const contentNodes = convertRunContent(content, marks);
        nodes.push(...contentNodes);
    }
    return nodes;
}
/**
 * Convert RunContent to ProseMirror nodes
 */
function convertRunContent(content, marks) {
    switch (content.type) {
        case 'text':
            if (content.text) {
                return [schema.text(content.text, marks)];
            }
            return [];
        case 'break':
            if (content.breakType === 'textWrapping' || !content.breakType) {
                return [schema.node('hardBreak')];
            }
            // Page/column breaks are not inline content; they are re-extracted to a
            // block-level pageBreak node (see paragraphForcedBreakType in toProseDoc).
            return [];
        case 'tab':
            // Convert to tab node for proper rendering
            return [schema.node('tab')];
        case 'drawing':
            if (content.image) {
                return [convertImage(content.image)];
            }
            return [];
        case 'shape': {
            // Shapes with text body are handled as text boxes at block level
            // Other shapes render as inline SVG
            const shp = content.shape;
            if (shp.textBody && shp.textBody.content.length > 0) {
                // Skip - handled by extractTextBoxesFromParagraph
                return [];
            }
            return [convertShape(shp)];
        }
        case 'symbol': {
            // OOXML §17.3.3.30 `<w:sym w:font="..." w:char="HHHH">` is a single
            // character from a non-default font (often Wingdings / Symbol /
            // Webdings). Pre-fix, `convertRunContent` had no case for symbols
            // and they fell into `default → []`, silently dropping every
            // checkbox glyph and bullet character. We try a Unicode
            // translation first so the glyph renders even on browsers that
            // don't have the source font installed; otherwise we emit the
            // literal character with the original font applied as a
            // fontFamily mark so a host that does have the font renders it
            // natively.
            const ch = symbolToUnicodeChar(content.font, content.char);
            if (!ch)
                return [];
            // Only attach a fontFamily mark when we DIDN'T translate to a
            // safe Unicode character — substitution chars (☐ ☒ ➤ etc.) are
            // universally available so forcing a specific font would hurt
            // rather than help.
            //
            // Exception: tall dingbat fonts (Wingdings/Webdings). Their glyphs have
            // a much taller ink box than a normal font, so a line set in them gets a
            // large line height in Word/LibreOffice. We still render the substituted
            // Unicode glyph (browsers fall back per-glyph), but we KEEP the dingbat
            // font name so the measurer applies its hardcoded line metrics — without
            // it, form checkbox rows collapse to ~half height (#11).
            if (isTranslatedUnicode(ch, content.font, content.char) && !isTallSymbolFont(content.font)) {
                return [schema.text(ch, marks)];
            }
            const fontMark = schema.mark('fontFamily', {
                ascii: content.font,
                hAnsi: content.font,
            });
            return [schema.text(ch, [...marks, fontMark])];
        }
        case 'footnoteRef':
            // Footnote reference - render as superscript number with footnoteRef mark
            const footnoteMark = schema.mark('footnoteRef', {
                id: content.id.toString(),
                noteType: 'footnote',
            });
            return [schema.text(content.id.toString(), [...marks, footnoteMark])];
        case 'endnoteRef':
            // Endnote reference - render as superscript number with footnoteRef mark
            const endnoteMark = schema.mark('footnoteRef', {
                id: content.id.toString(),
                noteType: 'endnote',
            });
            return [schema.text(content.id.toString(), [...marks, endnoteMark])];
        default:
            return [];
    }
}
/**
 * Translate a `<w:sym w:font="..." w:char="HHHH">` to a Unicode display
 * character. The most common case in real Word docs is form checkboxes
 * (Wingdings 2 ☐ / ☒) and bullet glyphs (Wingdings ●). The lookup
 * covers those plus a handful of frequent decorative chars; anything
 * we can't translate falls through to its raw codepoint with the
 * original font set as a mark so a host that has the font installed
 * still renders it correctly.
 *
 * Map sources: Adobe / ECMA-376 Annex L, plus
 * https://www.alanwood.net/demos/wingdings.html (cross-checked).
 */
/**
 * Tall dingbat fonts whose glyphs (checkboxes, dingbats) occupy a much taller
 * ink box than normal text, so lines set in them get an inflated line height in
 * Word/LibreOffice. Mirrors the calibrated entries in `fontResolver`'s
 * FONT_MAPPINGS. `Symbol` (Greek/math) is excluded — it has normal metrics.
 */
function isTallSymbolFont(font) {
    const f = (font || '').toLowerCase().trim();
    return f === 'wingdings' || f === 'wingdings 2' || f === 'wingdings 3' || f === 'webdings';
}
function symbolToUnicodeChar(font, char) {
    if (!char)
        return null;
    // OOXML stores `w:char` as a hex string. Word also sometimes emits
    // codepoints in the Private Use Area (0xF000+) for legacy fonts; we
    // strip that high bit so a "F0A3" matches the same glyph as "00A3".
    const code = parseInt(char, 16);
    if (!Number.isFinite(code))
        return null;
    const cp = code >= 0xf000 ? code - 0xf000 : code;
    const fontKey = (font || '').toLowerCase().trim();
    const wingdings2 = {
        0xa3: '☐', // ☐ empty checkbox
        0x52: '☑', // ☑ checked checkbox (boxed tick)
        0x53: '☒', // ☒ x-marked checkbox
        0xa8: '☐', // ☐ alt empty
        0xfb: '☒', // ☒ alt x
        0xfc: '☑', // ☑ alt check
    };
    const wingdings = {
        0x6c: '○', // ○ open circle
        0x6d: '●', // ● solid circle
        0xa7: '■', // ■ solid square
        0xa8: '□', // □ open square
        0xfc: '✓', // ✓ check
        0xfd: '✔', // ✔ heavy check
        0xfe: '✗', // ✗ ballot x
        0xff: '✘', // ✘ heavy x
    };
    const symbol = {
        0xb7: '·', // · middle dot
        0xa1: 'ϒ', // ϒ
        0xb6: '∂', // ∂
    };
    const table = fontKey === 'wingdings 2'
        ? wingdings2
        : fontKey === 'wingdings'
            ? wingdings
            : fontKey === 'symbol'
                ? symbol
                : null;
    if (table && table[cp])
        return table[cp];
    // Unknown — return the raw codepoint so the caller can attach the
    // original font as a fallback and at least something renders.
    return String.fromCodePoint(cp);
}
/**
 * Whether `symbolToUnicodeChar` translated the symbol to a universal
 * Unicode glyph (rather than returning the raw codepoint). Used to
 * decide whether to attach the original font as a mark.
 */
function isTranslatedUnicode(out, _font, char) {
    if (!out)
        return false;
    const code = parseInt(char, 16);
    if (!Number.isFinite(code))
        return false;
    const cp = code >= 0xf000 ? code - 0xf000 : code;
    // If the output codepoint differs from the source codepoint, we
    // translated it — output is universal Unicode.
    return out.codePointAt(0) !== cp || isStandardUnicode(out);
}
function isStandardUnicode(s) {
    var _a;
    // Treat characters in the BMP outside the Private Use Area as
    // "universally renderable enough" to not need a font fallback.
    const cp = (_a = s.codePointAt(0)) !== null && _a !== void 0 ? _a : 0;
    return cp >= 0x20 && cp < 0xe000;
}
/**
 * Convert an Image to a ProseMirror image node
 *
 * DOCX images have size in EMUs (English Metric Units), which must be
 * converted to pixels for proper HTML rendering.
 * 914400 EMU = 1 inch = 96 CSS pixels
 *
 * Image types in DOCX:
 * 1. Inline (wp:inline) - flows with text like a character
 * 2. Floating/Anchored (wp:anchor) with wrap types:
 *    - Square/Tight/Through: text wraps around image
 *      - wrapText='left' → text on LEFT, image floats RIGHT
 *      - wrapText='right' → text on RIGHT, image floats LEFT
 *      - wrapText='bothSides' → depends on horizontal alignment
 *    - TopAndBottom: image on its own line, text above/below only
 *    - None/Behind/InFront: positioned image, no text wrap
 */
function convertImage(image) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    // Convert EMU to pixels for proper sizing
    const widthPx = ((_a = image.size) === null || _a === void 0 ? void 0 : _a.width) ? emuToPixels(image.size.width) : undefined;
    const heightPx = ((_b = image.size) === null || _b === void 0 ? void 0 : _b.height) ? emuToPixels(image.size.height) : undefined;
    // Determine wrap type and float direction
    const wrapType = image.wrap.type;
    const wrapText = image.wrap.wrapText;
    const hAlign = (_d = (_c = image.position) === null || _c === void 0 ? void 0 : _c.horizontal) === null || _d === void 0 ? void 0 : _d.alignment;
    // Determine CSS float based on wrap settings
    // In DOCX: wrapText='left' means "text flows on the left" → image is on right → float: right
    //          wrapText='right' means "text flows on the right" → image is on left → float: left
    let cssFloat;
    if (wrapType === 'inline') {
        cssFloat = 'none'; // Inline images don't float
    }
    else if (wrapType === 'topAndBottom') {
        cssFloat = 'none'; // Block images don't float
    }
    else if (wrapType === 'square' || wrapType === 'tight' || wrapType === 'through') {
        // These wrap types support text wrapping around the image
        if (wrapText === 'left') {
            cssFloat = 'right'; // Text on left → image floats right
        }
        else if (wrapText === 'right') {
            cssFloat = 'left'; // Text on right → image floats left
        }
        else if (wrapText === 'bothSides' || wrapText === 'largest') {
            // Use horizontal alignment to determine float
            if (hAlign === 'left') {
                cssFloat = 'left';
            }
            else if (hAlign === 'right') {
                cssFloat = 'right';
            }
            else {
                cssFloat = 'none'; // Center or no alignment → block
            }
        }
        else {
            // Default: use horizontal alignment
            if (hAlign === 'left') {
                cssFloat = 'left';
            }
            else if (hAlign === 'right') {
                cssFloat = 'right';
            }
            else {
                cssFloat = 'none';
            }
        }
    }
    else {
        // Behind, inFront, etc. - positioned images, no float
        cssFloat = 'none';
    }
    // Determine display mode for CSS
    let displayMode = 'inline';
    if (wrapType === 'inline') {
        displayMode = 'inline';
    }
    else if (wrapType === 'topAndBottom') {
        displayMode = 'block';
    }
    else if (isWrapNone(wrapType)) {
        // wrapNone (behind / inFront): positioned float, painted out of paragraph flow.
        displayMode = 'float';
    }
    else if (cssFloat && cssFloat !== 'none') {
        displayMode = 'float';
    }
    else {
        // Centered square/tight/through images without a wrapping side fall back to block.
        displayMode = 'block';
    }
    // Build transform string if needed (rotation, flip)
    let transform;
    if (image.transform) {
        const transforms = [];
        if (image.transform.rotation) {
            transforms.push(`rotate(${image.transform.rotation}deg)`);
        }
        if (image.transform.flipH) {
            transforms.push('scaleX(-1)');
        }
        if (image.transform.flipV) {
            transforms.push('scaleY(-1)');
        }
        if (transforms.length > 0) {
            transform = transforms.join(' ');
        }
    }
    // Convert wrap distances from EMU to pixels for margins
    const distTop = image.wrap.distT ? emuToPixels(image.wrap.distT) : undefined;
    const distBottom = image.wrap.distB ? emuToPixels(image.wrap.distB) : undefined;
    const distLeft = image.wrap.distL ? emuToPixels(image.wrap.distL) : undefined;
    const distRight = image.wrap.distR ? emuToPixels(image.wrap.distR) : undefined;
    // Build position data for floating images
    let position;
    if (image.position) {
        position = {
            horizontal: image.position.horizontal
                ? {
                    relativeTo: image.position.horizontal.relativeTo,
                    posOffset: image.position.horizontal.posOffset,
                    align: image.position.horizontal.alignment,
                }
                : undefined,
            vertical: image.position.vertical
                ? {
                    relativeTo: image.position.vertical.relativeTo,
                    posOffset: image.position.vertical.posOffset,
                    align: image.position.vertical.alignment,
                }
                : undefined,
        };
    }
    // Convert outline to border attrs
    let borderWidth;
    let borderColor;
    let borderStyle;
    if (image.outline && image.outline.width) {
        // Convert EMU to pixels (1 EMU = 1/914400 inch, 1 inch = 96 px)
        borderWidth = Math.round((image.outline.width / 914400) * 96 * 100) / 100;
        if ((_e = image.outline.color) === null || _e === void 0 ? void 0 : _e.rgb) {
            borderColor = `#${image.outline.color.rgb}`;
        }
        borderStyle = ooxmlDashToCssBorderStyle(image.outline.style);
    }
    // Effect extent (shadow/glow padding) is parsed in EMU; convert to px so
    // the renderer can apply it as outer margin.
    const effectExtentTop = ((_f = image.padding) === null || _f === void 0 ? void 0 : _f.top) ? emuToPixels(image.padding.top) : undefined;
    const effectExtentBottom = ((_g = image.padding) === null || _g === void 0 ? void 0 : _g.bottom) ? emuToPixels(image.padding.bottom) : undefined;
    const effectExtentLeft = ((_h = image.padding) === null || _h === void 0 ? void 0 : _h.left) ? emuToPixels(image.padding.left) : undefined;
    const effectExtentRight = ((_j = image.padding) === null || _j === void 0 ? void 0 : _j.right) ? emuToPixels(image.padding.right) : undefined;
    return schema.node('image', {
        src: image.src || '',
        alt: image.alt,
        title: image.title,
        width: widthPx,
        height: heightPx,
        rId: image.rId,
        wrapType: wrapType,
        displayMode: displayMode,
        cssFloat: cssFloat,
        transform: transform,
        distTop: distTop,
        distBottom: distBottom,
        distLeft: distLeft,
        distRight: distRight,
        position: position,
        borderWidth: borderWidth,
        borderColor: borderColor,
        borderStyle: borderStyle,
        wrapText: wrapText,
        hlinkHref: image.hlinkHref,
        cropTop: (_k = image.crop) === null || _k === void 0 ? void 0 : _k.top,
        cropRight: (_l = image.crop) === null || _l === void 0 ? void 0 : _l.right,
        cropBottom: (_m = image.crop) === null || _m === void 0 ? void 0 : _m.bottom,
        cropLeft: (_o = image.crop) === null || _o === void 0 ? void 0 : _o.left,
        opacity: image.opacity,
        effectExtentTop,
        effectExtentBottom,
        effectExtentLeft,
        effectExtentRight,
        layoutInCell: image.layoutInCell,
        allowOverlap: image.allowOverlap,
    });
}
/**
 * Convert a Hyperlink to ProseMirror nodes with link mark
 *
 * @param hyperlink - The hyperlink to convert
 * @param styleFormatting - Text formatting from the paragraph's style
 */
function convertHyperlink(hyperlink, styleFormatting, styleResolver) {
    var _a;
    const nodes = [];
    // Create link mark — internal anchors use #bookmarkName format
    const href = hyperlink.href || (hyperlink.anchor ? `#${hyperlink.anchor}` : '');
    const linkMark = schema.mark('hyperlink', {
        href,
        tooltip: hyperlink.tooltip,
        rId: hyperlink.rId,
    });
    for (const child of hyperlink.children) {
        if (child.type === 'run') {
            // Merge style formatting with run's inline formatting
            const runStyleFormatting = ((_a = child.formatting) === null || _a === void 0 ? void 0 : _a.styleId)
                ? styleResolver === null || styleResolver === void 0 ? void 0 : styleResolver.resolveRunStyle(child.formatting.styleId)
                : undefined;
            const mergedFormatting = mergeTextFormatting(mergeTextFormatting(styleFormatting, runStyleFormatting), child.formatting);
            const runMarks = textFormattingToMarks(mergedFormatting);
            // Add link mark to run marks
            const allMarks = [...runMarks, linkMark];
            for (const content of child.content) {
                if (content.type === 'text' && content.text) {
                    nodes.push(schema.text(content.text, allMarks));
                }
            }
        }
    }
    return nodes;
}
/**
 * Convert TextFormatting to ProseMirror marks
 */
function textFormattingToMarks(formatting) {
    var _a, _b, _c, _d;
    if (!formatting)
        return [];
    const marks = [];
    // Bold
    if (formatting.bold) {
        marks.push(schema.mark('bold'));
    }
    // Italic
    if (formatting.italic) {
        marks.push(schema.mark('italic'));
    }
    // Underline
    if (formatting.underline && formatting.underline.style !== 'none') {
        marks.push(schema.mark('underline', {
            style: formatting.underline.style,
            color: formatting.underline.color,
        }));
    }
    // Strikethrough
    if (formatting.strike || formatting.doubleStrike) {
        marks.push(schema.mark('strike', {
            double: formatting.doubleStrike || false,
        }));
    }
    // Text color
    // `auto` alone (no theme slot) maps to the contextual default and
    // doesn't need a mark, but `auto + themeColor` carries Word's
    // theme-resolved intent and must round-trip — see
    // `theme-color-roundtrip.test.ts`.
    if (formatting.color && (!formatting.color.auto || formatting.color.themeColor)) {
        marks.push(schema.mark('textColor', {
            rgb: formatting.color.rgb,
            themeColor: formatting.color.themeColor,
            themeTint: formatting.color.themeTint,
            themeShade: formatting.color.themeShade,
            auto: formatting.color.auto || null,
        }));
    }
    // Highlight
    if (formatting.highlight && formatting.highlight !== 'none') {
        marks.push(schema.mark('highlight', {
            color: formatting.highlight,
        }));
    }
    // Character shading. This is intentionally separate from highlight:
    // LibreOffice/Word documents commonly use <w:shd> for run-level shading that
    // should round-trip but should not light up as user text-highlight.
    if (formatting.shading) {
        marks.push(schema.mark('runShading', {
            shading: formatting.shading,
        }));
    }
    // Font size
    if (formatting.fontSize) {
        marks.push(schema.mark('fontSize', {
            size: formatting.fontSize,
        }));
    }
    // Font family
    if (formatting.fontFamily) {
        marks.push(schema.mark('fontFamily', {
            ascii: formatting.fontFamily.ascii,
            hAnsi: formatting.fontFamily.hAnsi,
            eastAsia: formatting.fontFamily.eastAsia,
            cs: formatting.fontFamily.cs,
            asciiTheme: formatting.fontFamily.asciiTheme,
            hAnsiTheme: formatting.fontFamily.hAnsiTheme,
            eastAsiaTheme: formatting.fontFamily.eastAsiaTheme,
            csTheme: formatting.fontFamily.csTheme,
        }));
    }
    // Superscript/Subscript
    if (formatting.vertAlign === 'superscript') {
        marks.push(schema.mark('superscript'));
    }
    else if (formatting.vertAlign === 'subscript') {
        marks.push(schema.mark('subscript'));
    }
    // All caps (w:caps)
    if (formatting.allCaps) {
        marks.push(schema.mark('allCaps'));
    }
    // Small caps (w:smallCaps)
    if (formatting.smallCaps) {
        marks.push(schema.mark('smallCaps'));
    }
    // Character spacing (spacing, position, scale, kerning)
    if (formatting.spacing != null ||
        formatting.position != null ||
        formatting.scale != null ||
        formatting.kerning != null) {
        marks.push(schema.mark('characterSpacing', {
            spacing: (_a = formatting.spacing) !== null && _a !== void 0 ? _a : null,
            position: (_b = formatting.position) !== null && _b !== void 0 ? _b : null,
            scale: (_c = formatting.scale) !== null && _c !== void 0 ? _c : null,
            kerning: (_d = formatting.kerning) !== null && _d !== void 0 ? _d : null,
        }));
    }
    // Emboss (w:emboss)
    if (formatting.emboss) {
        marks.push(schema.mark('emboss'));
    }
    // Imprint/Engrave (w:imprint)
    if (formatting.imprint) {
        marks.push(schema.mark('imprint'));
    }
    // Text shadow (w:shadow)
    if (formatting.shadow) {
        marks.push(schema.mark('textShadow'));
    }
    // Emphasis mark (w:em)
    if (formatting.emphasisMark && formatting.emphasisMark !== 'none') {
        marks.push(schema.mark('emphasisMark', { type: formatting.emphasisMark }));
    }
    // Text outline (w:outline)
    if (formatting.outline) {
        marks.push(schema.mark('textOutline'));
    }
    // Hidden text (w:vanish)
    if (formatting.hidden) {
        marks.push(schema.mark('hidden'));
    }
    // Per-run RTL (w:rtl) — independent of paragraph direction
    if (formatting.rtl) {
        marks.push(schema.mark('rtl'));
    }
    // Text effect animations (w:effect)
    if (formatting.effect && formatting.effect !== 'none') {
        marks.push(schema.mark('textEffect', { effect: formatting.effect }));
    }
    return marks;
}
// ============================================================================
// SHAPE CONVERSION
// ============================================================================
/**
 * Convert a Shape to a ProseMirror shape node (inline SVG)
 */
function convertShape(shape) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const widthPx = ((_a = shape.size) === null || _a === void 0 ? void 0 : _a.width) ? emuToPixels(shape.size.width) : 100;
    const heightPx = ((_b = shape.size) === null || _b === void 0 ? void 0 : _b.height) ? emuToPixels(shape.size.height) : 80;
    let fillColor;
    let fillType = 'solid';
    let gradientType;
    let gradientAngle;
    let gradientStops;
    if (shape.fill) {
        fillType = shape.fill.type;
        fillColor = (_c = resolveShapeColor(shape.fill.color)) !== null && _c !== void 0 ? _c : fillColor;
        // Extract gradient data
        if (shape.fill.type === 'gradient' && shape.fill.gradient) {
            const g = shape.fill.gradient;
            gradientType = g.type;
            gradientAngle = g.angle;
            // Convert stops to serializable format with CSS colors
            gradientStops = JSON.stringify(g.stops.map((s) => ({
                position: s.position,
                color: s.color.rgb ? `#${s.color.rgb}` : '#000000',
            })));
        }
    }
    let outlineWidth;
    let outlineColor;
    let outlineStyle;
    if (shape.outline) {
        if (shape.outline.width) {
            outlineWidth = Math.round((shape.outline.width / 914400) * 96 * 100) / 100;
        }
        outlineColor = resolveShapeColor(shape.outline.color);
        outlineStyle = ooxmlDashToCssBorderStyle(shape.outline.style);
    }
    let transform;
    if (shape.transform) {
        const transforms = [];
        if (shape.transform.rotation) {
            transforms.push(`rotate(${shape.transform.rotation}deg)`);
        }
        if (shape.transform.flipH) {
            transforms.push('scaleX(-1)');
        }
        if (shape.transform.flipV) {
            transforms.push('scaleY(-1)');
        }
        if (transforms.length > 0) {
            transform = transforms.join(' ');
        }
    }
    // Surface the parsed anchor position and wrap on the PM node so a floating
    // shape round-trips through save without losing where it's anchored. Mirrors
    // the textBox node (convertTextBox above): the layout engine doesn't honor
    // these yet, but carrying the data is safe and unblocks future float work
    // instead of silently dropping the anchor on the next save.
    const posH = (_d = shape.position) === null || _d === void 0 ? void 0 : _d.horizontal;
    const posV = (_e = shape.position) === null || _e === void 0 ? void 0 : _e.vertical;
    const posOffsetH = (posH === null || posH === void 0 ? void 0 : posH.posOffset) != null ? emuToPixels(posH.posOffset) : null;
    const posOffsetV = (posV === null || posV === void 0 ? void 0 : posV.posOffset) != null ? emuToPixels(posV.posOffset) : null;
    return schema.node('shape', {
        shapeType: shape.shapeType || 'rect',
        shapeId: shape.id,
        width: widthPx,
        height: heightPx,
        fillColor,
        fillType,
        gradientType,
        gradientAngle,
        gradientStops,
        outlineWidth,
        outlineColor,
        outlineStyle,
        transform,
        wrapType: (_g = (_f = shape.wrap) === null || _f === void 0 ? void 0 : _f.type) !== null && _g !== void 0 ? _g : 'inline',
        posOffsetH,
        posOffsetV,
        posRelFromH: (_h = posH === null || posH === void 0 ? void 0 : posH.relativeTo) !== null && _h !== void 0 ? _h : null,
        posRelFromV: (_j = posV === null || posV === void 0 ? void 0 : posV.relativeTo) !== null && _j !== void 0 ? _j : null,
        posAlignH: (_k = posH === null || posH === void 0 ? void 0 : posH.alignment) !== null && _k !== void 0 ? _k : null,
        posAlignV: (_l = posV === null || posV === void 0 ? void 0 : posV.alignment) !== null && _l !== void 0 ? _l : null,
        // Carry the original OOXML envelope so a from-PM rebuild (structural edit,
        // collab peer, server snapshot) re-emits the drawing verbatim rather than
        // dropping it. Survives Yjs intact (verified).
        rawXml: (_m = shape.rawXml) !== null && _m !== void 0 ? _m : null,
        envelopeKey: (_o = shape.envelopeKey) !== null && _o !== void 0 ? _o : null,
    });
}
// ============================================================================
// TEXT BOX CONVERSION
// ============================================================================
/**
 * Convert a paragraph block to PM nodes, extracting text boxes as sibling nodes.
 * Skips ghost empty paragraphs that only contained text box drawings.
 */
function convertParagraphWithTextBoxes(block, styleResolver) {
    const textBoxes = extractTextBoxesFromParagraph(block);
    const pmParagraph = convertParagraph(block, styleResolver);
    const nodes = [];
    const isEmptyAfterExtraction = textBoxes.length > 0 && pmParagraph.content.size === 0;
    if (!isEmptyAfterExtraction) {
        nodes.push(pmParagraph);
    }
    for (const tb of textBoxes) {
        nodes.push(convertTextBox(tb, styleResolver));
    }
    return nodes;
}
/**
 * Extract text boxes from paragraph runs.
 * Text boxes appear as ShapeContent where the shape has textBody,
 * or as DrawingContent that contains a text box instead of an image.
 */
function extractTextBoxesFromParagraph(paragraph) {
    const textBoxes = [];
    for (const content of paragraph.content) {
        if (content.type === 'run') {
            for (const rc of content.content) {
                if (rc.type === 'shape' && 'shape' in rc) {
                    const shape = rc.shape;
                    // Convert any shape with a textBody — including decorative
                    // VML rectangles where the inner content is just a single
                    // empty paragraph. The painter renders the box's
                    // fill/outline regardless of whether the inner content has
                    // text; gating this on non-empty content silently dropped
                    // every decorative `<v:rect>` (SDS-style page dividers).
                    if (shape.textBody) {
                        textBoxes.push({
                            type: 'textBox',
                            id: shape.id,
                            size: shape.size,
                            position: shape.position,
                            wrap: shape.wrap,
                            fill: shape.fill,
                            outline: shape.outline,
                            content: shape.textBody.content.length > 0
                                ? shape.textBody.content
                                : [{ type: 'paragraph', content: [] }],
                            margins: shape.textBody.margins,
                            // Carry the original OOXML envelope so a from-PM rebuild re-emits
                            // this drawing verbatim instead of dropping it (collab/snapshot).
                            rawXml: shape.rawXml,
                            envelopeKey: shape.envelopeKey,
                        });
                    }
                }
            }
        }
    }
    return textBoxes;
}
/**
 * Convert a TextBox to a ProseMirror textBox node
 */
function convertTextBox(textBox, styleResolver) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const widthPx = ((_a = textBox.size) === null || _a === void 0 ? void 0 : _a.width) ? emuToPixels(textBox.size.width) : 200;
    const heightPx = ((_b = textBox.size) === null || _b === void 0 ? void 0 : _b.height) ? emuToPixels(textBox.size.height) : undefined;
    // Convert fill color
    const fillColor = resolveShapeColor((_c = textBox.fill) === null || _c === void 0 ? void 0 : _c.color);
    // Convert outline. Render when the line carries EITHER a width or a
    // resolvable color — a `<a:ln>` with a fill but no explicit `w` is a
    // hairline (default ~0.75pt ≈ 1px), and its theme-color fill (e.g.
    // bg1 + lumMod) must not be dropped.
    let outlineWidth;
    let outlineColor;
    let outlineStyle;
    if (textBox.outline && (textBox.outline.width || resolveShapeColor(textBox.outline.color))) {
        outlineWidth = textBox.outline.width
            ? Math.round((textBox.outline.width / 914400) * 96 * 100) / 100
            : 1;
        outlineColor = resolveShapeColor(textBox.outline.color);
        outlineStyle = ooxmlDashToCssBorderStyle(textBox.outline.style);
    }
    // Convert margins from EMU to pixels
    const marginTop = ((_d = textBox.margins) === null || _d === void 0 ? void 0 : _d.top) != null ? emuToPixels(textBox.margins.top) : 4;
    const marginBottom = ((_e = textBox.margins) === null || _e === void 0 ? void 0 : _e.bottom) != null ? emuToPixels(textBox.margins.bottom) : 4;
    const marginLeft = ((_f = textBox.margins) === null || _f === void 0 ? void 0 : _f.left) != null ? emuToPixels(textBox.margins.left) : 7;
    const marginRight = ((_g = textBox.margins) === null || _g === void 0 ? void 0 : _g.right) != null ? emuToPixels(textBox.margins.right) : 7;
    // Convert text box content (paragraphs) to PM nodes
    const contentNodes = [];
    for (const para of textBox.content) {
        contentNodes.push(convertParagraph(para, styleResolver));
    }
    // Ensure at least one paragraph
    if (contentNodes.length === 0) {
        contentNodes.push(schema.node('paragraph', {}, []));
    }
    // Surface the parsed anchor position on the PM node so it round-trips
    // through save AND is honored at layout time: `layoutAnchoredTextBox`
    // resolves the full relativeFrom band math via `resolveAnchorX/Y`.
    // (The naive first attempt that floated every shape was reverted; the
    // dedicated anchored path only floats genuinely-anchored boxes.)
    const posH = (_h = textBox.position) === null || _h === void 0 ? void 0 : _h.horizontal;
    const posV = (_j = textBox.position) === null || _j === void 0 ? void 0 : _j.vertical;
    const posOffsetH = (posH === null || posH === void 0 ? void 0 : posH.posOffset) != null ? emuToPixels(posH.posOffset) : null;
    const posOffsetV = (posV === null || posV === void 0 ? void 0 : posV.posOffset) != null ? emuToPixels(posV.posOffset) : null;
    return schema.node('textBox', {
        width: widthPx,
        height: heightPx,
        textBoxId: textBox.id,
        fillColor,
        outlineWidth,
        outlineColor,
        outlineStyle,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        autoFit: textBox.autoFit,
        // Behind-text wrap (VML z-index<0) — carried so the layout engine can
        // both paint the box behind body text AND reserve its band in the flow
        // (the SDS hazard box). 'inline' is the schema default for non-anchored
        // boxes; only emit a non-default when the source said so.
        wrapType: (_l = (_k = textBox.wrap) === null || _k === void 0 ? void 0 : _k.type) !== null && _l !== void 0 ? _l : 'inline',
        posOffsetH,
        posOffsetV,
        posRelFromH: (_m = posH === null || posH === void 0 ? void 0 : posH.relativeTo) !== null && _m !== void 0 ? _m : null,
        posRelFromV: (_o = posV === null || posV === void 0 ? void 0 : posV.relativeTo) !== null && _o !== void 0 ? _o : null,
        posAlignH: (_p = posH === null || posH === void 0 ? void 0 : posH.alignment) !== null && _p !== void 0 ? _p : null,
        posAlignV: (_q = posV === null || posV === void 0 ? void 0 : posV.alignment) !== null && _q !== void 0 ? _q : null,
        // Original OOXML envelope — re-emitted verbatim on a from-PM rebuild so
        // the drawing survives structural edits / collab peers / server snapshots.
        rawXml: (_r = textBox.rawXml) !== null && _r !== void 0 ? _r : null,
        envelopeKey: (_s = textBox.envelopeKey) !== null && _s !== void 0 ? _s : null,
    }, contentNodes);
}
/**
 * Convert HeaderFooter content (array of Paragraph/Table blocks) to a ProseMirror document.
 * Used for editing headers/footers in their own ProseMirror editor and for the
 * unified header/footer render pipeline. `theme` must be threaded for themeColor
 * resolution in cell shading (`<w:shd w:themeFill=...>`) — without it, themed
 * fills in HF tables fall back to the unresolved theme key.
 */
export function headerFooterToProseDoc(content, options) {
    var _a;
    const nodes = [];
    const styleResolver = (options === null || options === void 0 ? void 0 : options.styles) ? createStyleResolver(options.styles) : null;
    const theme = (_a = options === null || options === void 0 ? void 0 : options.theme) !== null && _a !== void 0 ? _a : null;
    for (const block of content) {
        if (block.type === 'paragraph') {
            nodes.push(...convertParagraphWithTextBoxes(block, styleResolver));
        }
        else if (block.type === 'table') {
            nodes.push(convertTable(block, styleResolver, theme));
        }
    }
    if (nodes.length === 0) {
        nodes.push(schema.node('paragraph', {}, []));
    }
    return schema.node('doc', null, nodes);
}
/**
 * Convert footnote/endnote content (array of Paragraph/Table blocks) to a
 * ProseMirror document. Mirrors `headerFooterToProseDoc` so footnotes flow
 * through the same body pipeline (toFlowBlocks → measureBlocks →
 * renderFragment) and inherit its block support — paragraph + table + image
 * + textBox + fields. Pre-PR, footnoteLayout's `convertFootnoteToContent`
 * re-implemented run/paragraph conversion by hand and silently dropped
 * tables, images, and fields nested inside a footnote.
 */
export function footnoteToProseDoc(content, options) {
    return headerFooterToProseDoc(content, options);
}
/**
 * Returns the forced break type (`'page'` or `'column'`) when a
 * `<w:br w:type="page"/>` or `<w:br w:type="column"/>` appears anywhere in a
 * paragraph, or `null` when there is none.
 *
 * A hard page break is always a forced break per ECMA-376 §17.3.3.1. We used
 * to require visible content before the break (and rely on
 * `renderedPageBreakBefore` for leading breaks), but that attr is informational
 * only and not honored at layout, so a break-only paragraph (empty paragraph
 * containing just `<w:r><w:br w:type="page"/></w:r>`) silently dropped its
 * forced break — Word renders such paragraphs with the next paragraph on a
 * fresh page.
 */
function paragraphForcedBreakType(paragraph) {
    function breakTypeOf(content) {
        if (content.type !== 'break')
            return null;
        if (content.breakType === 'page')
            return 'page';
        if (content.breakType === 'column')
            return 'column';
        return null;
    }
    function visit(item) {
        if (item.type === 'run') {
            for (const c of item.content) {
                const bt = breakTypeOf(c);
                if (bt)
                    return bt;
            }
            return null;
        }
        if (item.type === 'hyperlink') {
            for (const r of item.children) {
                if (r.type === 'run') {
                    const bt = visit(r);
                    if (bt)
                        return bt;
                }
            }
            return null;
        }
        if (item.type === 'insertion' || item.type === 'deletion') {
            // Tracked-change wrappers can themselves contain a forced break.
            // Descend so a break inside <w:ins> or <w:del> still emits a
            // pageBreak node downstream.
            const tc = item;
            for (const inner of tc.content) {
                const bt = visit(inner);
                if (bt)
                    return bt;
            }
            return null;
        }
        return null;
    }
    for (const item of paragraph.content) {
        const bt = visit(item);
        if (bt)
            return bt;
    }
    return null;
}
/**
 * Create an empty ProseMirror document
 */
export function createEmptyDoc() {
    return schema.node('doc', null, [schema.node('paragraph', {}, [])]);
}
//# sourceMappingURL=toProseDoc.js.map