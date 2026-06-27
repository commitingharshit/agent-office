/**
 * Paragraph Parser - Parse paragraphs (w:p) with complete formatting
 *
 * A paragraph is the fundamental block-level element containing text runs,
 * hyperlinks, bookmarks, and fields.
 *
 * OOXML Reference:
 * - Paragraph: w:p
 * - Paragraph properties: w:pPr
 * - Content: runs, hyperlinks, bookmarks, fields
 */
import { findChild, findChildren, getAttribute, getChildElements, parseBooleanElement, parseNumericAttribute, elementToXml, } from './xmlParser';
import { parseRun, parseRunProperties } from './runParser';
import { parseHyperlink as parseHyperlinkFromModule } from './hyperlinkParser';
import { parseBookmarkStart as parseBookmarkStartFromModule, parseBookmarkEnd as parseBookmarkEndFromModule, } from './bookmarkParser';
import { parseSectionProperties } from './sectionParser';
import { consolidateParagraphContent } from './runConsolidator';
// ============================================================================
// SDT PROPERTIES PARSER
// ============================================================================
/**
 * Parse SDT properties (w:sdtPr) element
 */
function parseSdtProperties(sdtPr) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const props = { sdtType: 'richText' };
    if (!sdtPr || !sdtPr.elements)
        return props;
    for (const el of sdtPr.elements) {
        if (el.type !== 'element')
            continue;
        // SDT children come from three namespaces — strip whichever prefix
        // is in front so we match on the local name regardless of vintage.
        const name = (_b = (_a = el.name) === null || _a === void 0 ? void 0 : _a.replace(/^(w14|w15|w):/, '')) !== null && _b !== void 0 ? _b : '';
        switch (name) {
            case 'alias':
                props.alias = (_c = getAttribute(el, 'w', 'val')) !== null && _c !== void 0 ? _c : undefined;
                break;
            case 'tag':
                props.tag = (_d = getAttribute(el, 'w', 'val')) !== null && _d !== void 0 ? _d : undefined;
                break;
            case 'lock':
                props.lock = ((_e = getAttribute(el, 'w', 'val')) !== null && _e !== void 0 ? _e : 'unlocked');
                break;
            case 'id': {
                const raw = getAttribute(el, 'w', 'val');
                if (raw) {
                    const n = parseInt(raw, 10);
                    if (Number.isFinite(n))
                        props.sdtId = n;
                }
                break;
            }
            case 'color': {
                // Only when this is `<w15:color>` (the review-author hint),
                // not `<w:color>` — which here would be the legacy run color
                // and isn't an sdtPr child anyway.
                const val = (_f = getAttribute(el, 'w15', 'val')) !== null && _f !== void 0 ? _f : getAttribute(el, 'w', 'val');
                if (val)
                    props.reviewColor = val;
                break;
            }
            case 'placeholder': {
                const docPart = findChild(el, 'w', 'docPart');
                if (docPart) {
                    const valEl = findChild(docPart, 'w', 'val');
                    props.placeholder = valEl ? ((_g = getAttribute(valEl, 'w', 'val')) !== null && _g !== void 0 ? _g : undefined) : undefined;
                }
                break;
            }
            case 'showingPlcHdr':
                props.showingPlaceholder = true;
                break;
            case 'text':
                props.sdtType = 'plainText';
                break;
            case 'date':
                props.sdtType = 'date';
                props.dateFormat = (_h = getAttribute(el, 'w', 'fullDate')) !== null && _h !== void 0 ? _h : undefined;
                break;
            case 'dropDownList':
                props.sdtType = 'dropdown';
                props.listItems = parseListItems(el);
                break;
            case 'comboBox':
                props.sdtType = 'comboBox';
                props.listItems = parseListItems(el);
                break;
            case 'checkbox': {
                props.sdtType = 'checkbox';
                const checked = (_j = findChild(el, 'w14', 'checked')) !== null && _j !== void 0 ? _j : findChild(el, 'w', 'checked');
                props.checked = checked
                    ? getAttribute(checked, 'w14', 'val') === '1' || getAttribute(checked, 'w', 'val') === '1'
                    : false;
                // Optional glyph pair — preserved so round-trip can re-emit the
                // exact <w14:checkedState> / <w14:uncheckedState> declared in
                // the source.
                const cs = findChild(el, 'w14', 'checkedState');
                if (cs) {
                    const csVal = getAttribute(cs, 'w14', 'val');
                    const csFont = getAttribute(cs, 'w14', 'font');
                    if (csVal && csFont)
                        props.checkedState = { val: csVal, font: csFont };
                }
                const us = findChild(el, 'w14', 'uncheckedState');
                if (us) {
                    const usVal = getAttribute(us, 'w14', 'val');
                    const usFont = getAttribute(us, 'w14', 'font');
                    if (usVal && usFont)
                        props.uncheckedState = { val: usVal, font: usFont };
                }
                break;
            }
            case 'picture':
                props.sdtType = 'picture';
                break;
            case 'docPartObj':
                props.sdtType = 'buildingBlockGallery';
                break;
            case 'group':
                props.sdtType = 'group';
                break;
        }
    }
    return props;
}
function parseListItems(el) {
    var _a, _b, _c, _d;
    const items = [];
    for (const child of (_a = el.elements) !== null && _a !== void 0 ? _a : []) {
        if (child.type === 'element' &&
            (child.name === 'w:listItem' || ((_b = child.name) === null || _b === void 0 ? void 0 : _b.endsWith(':listItem')))) {
            items.push({
                displayText: (_c = getAttribute(child, 'w', 'displayText')) !== null && _c !== void 0 ? _c : '',
                value: (_d = getAttribute(child, 'w', 'value')) !== null && _d !== void 0 ? _d : '',
            });
        }
    }
    return items;
}
/**
 * Extract plain text from a math element (recursive text content extraction)
 */
function extractMathText(el) {
    var _a, _b;
    let text = '';
    if (el.type === 'text' && typeof el.text === 'string') {
        return el.text;
    }
    if (el.elements) {
        for (const child of el.elements) {
            // m:t elements contain the actual math text
            const childName = (_b = (_a = child.name) === null || _a === void 0 ? void 0 : _a.replace(/^.*:/, '')) !== null && _b !== void 0 ? _b : '';
            if (childName === 't' && child.elements) {
                for (const t of child.elements) {
                    if (t.type === 'text' && typeof t.text === 'string') {
                        text += t.text;
                    }
                }
            }
            else {
                text += extractMathText(child);
            }
        }
    }
    return text;
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Parse color value from attributes
 */
function parseColorValue(rgb, themeColor, themeTint, themeShade) {
    const color = {};
    if (rgb && rgb !== 'auto') {
        color.rgb = rgb;
    }
    else if (rgb === 'auto') {
        color.auto = true;
    }
    if (themeColor) {
        color.themeColor = themeColor;
    }
    if (themeTint) {
        color.themeTint = themeTint;
    }
    if (themeShade) {
        color.themeShade = themeShade;
    }
    return color;
}
/**
 * Parse shading properties (w:shd)
 */
function parseShadingProperties(shd) {
    if (!shd)
        return undefined;
    const props = {};
    const color = getAttribute(shd, 'w', 'color');
    if (color && color !== 'auto') {
        props.color = { rgb: color };
    }
    const fill = getAttribute(shd, 'w', 'fill');
    if (fill && fill !== 'auto') {
        props.fill = { rgb: fill };
    }
    const themeFill = getAttribute(shd, 'w', 'themeFill');
    if (themeFill) {
        props.fill = props.fill || {};
        props.fill.themeColor = themeFill;
    }
    const themeFillTint = getAttribute(shd, 'w', 'themeFillTint');
    if (themeFillTint && props.fill) {
        props.fill.themeTint = themeFillTint;
    }
    const themeFillShade = getAttribute(shd, 'w', 'themeFillShade');
    if (themeFillShade && props.fill) {
        props.fill.themeShade = themeFillShade;
    }
    const pattern = getAttribute(shd, 'w', 'val');
    if (pattern) {
        props.pattern = pattern;
    }
    return Object.keys(props).length > 0 ? props : undefined;
}
/**
 * Parse border specification (w:top, w:bottom, w:left, w:right, etc.)
 */
export function parseBorderSpec(border) {
    if (!border)
        return undefined;
    const style = getAttribute(border, 'w', 'val');
    if (!style)
        return undefined;
    const spec = {
        style: style,
    };
    const colorVal = getAttribute(border, 'w', 'color');
    const themeColor = getAttribute(border, 'w', 'themeColor');
    if (colorVal || themeColor) {
        spec.color = parseColorValue(colorVal, themeColor, getAttribute(border, 'w', 'themeTint'), getAttribute(border, 'w', 'themeShade'));
    }
    const sz = parseNumericAttribute(border, 'w', 'sz');
    if (sz !== undefined)
        spec.size = sz;
    const space = parseNumericAttribute(border, 'w', 'space');
    if (space !== undefined)
        spec.space = space;
    const shadowAttr = getAttribute(border, 'w', 'shadow');
    if (shadowAttr)
        spec.shadow = shadowAttr === '1' || shadowAttr === 'true';
    const frame = getAttribute(border, 'w', 'frame');
    if (frame)
        spec.frame = frame === '1' || frame === 'true';
    return spec;
}
/**
 * Parse tab stops (w:tabs)
 */
function parseTabStops(tabs) {
    if (!tabs)
        return undefined;
    const tabElements = findChildren(tabs, 'w', 'tab');
    if (tabElements.length === 0)
        return undefined;
    const result = [];
    for (const tab of tabElements) {
        const pos = parseNumericAttribute(tab, 'w', 'pos');
        const val = getAttribute(tab, 'w', 'val');
        if (pos !== undefined && val) {
            const tabStop = {
                position: pos,
                alignment: val,
            };
            const leader = getAttribute(tab, 'w', 'leader');
            if (leader) {
                tabStop.leader = leader;
            }
            result.push(tabStop);
        }
    }
    return result.length > 0 ? result : undefined;
}
/**
 * Parse frame properties (w:framePr)
 */
function parseFrameProperties(framePr) {
    if (!framePr)
        return undefined;
    const frame = {};
    const w = parseNumericAttribute(framePr, 'w', 'w');
    if (w !== undefined)
        frame.width = w;
    const h = parseNumericAttribute(framePr, 'w', 'h');
    if (h !== undefined)
        frame.height = h;
    const hAnchor = getAttribute(framePr, 'w', 'hAnchor');
    if (hAnchor === 'text' || hAnchor === 'margin' || hAnchor === 'page') {
        frame.hAnchor = hAnchor;
    }
    const vAnchor = getAttribute(framePr, 'w', 'vAnchor');
    if (vAnchor === 'text' || vAnchor === 'margin' || vAnchor === 'page') {
        frame.vAnchor = vAnchor;
    }
    const x = parseNumericAttribute(framePr, 'w', 'x');
    if (x !== undefined)
        frame.x = x;
    const y = parseNumericAttribute(framePr, 'w', 'y');
    if (y !== undefined)
        frame.y = y;
    const xAlign = getAttribute(framePr, 'w', 'xAlign');
    if (xAlign) {
        frame.xAlign = xAlign;
    }
    const yAlign = getAttribute(framePr, 'w', 'yAlign');
    if (yAlign) {
        frame.yAlign = yAlign;
    }
    const wrap = getAttribute(framePr, 'w', 'wrap');
    if (wrap) {
        frame.wrap = wrap;
    }
    return Object.keys(frame).length > 0 ? frame : undefined;
}
// ============================================================================
// PARAGRAPH PROPERTIES PARSER
// ============================================================================
/**
 * Parse paragraph formatting properties (w:pPr)
 *
 * Handles ALL pPr properties:
 * - w:jc (alignment: left, center, right, both/justify)
 * - w:spacing (before, after, line, lineRule)
 * - w:ind (left, right, firstLine, hanging)
 * - w:pBdr (paragraph borders: top, bottom, left, right, between)
 * - w:shd (paragraph shading/background)
 * - w:tabs (tab stops with positions and types)
 * - w:keepNext, w:keepLines, w:widowControl, w:pageBreakBefore
 * - w:bidi (right-to-left)
 * - w:numPr (list info)
 * - w:pStyle (style reference)
 * - w:outlineLvl (outline level)
 * - w:framePr (frame properties)
 * - w:rPr (default run properties)
 */
export function parseParagraphProperties(pPr, theme, styles) {
    var _a, _b, _c, _d;
    if (!pPr)
        return undefined;
    const formatting = {};
    // === Alignment ===
    const jc = findChild(pPr, 'w', 'jc');
    if (jc) {
        const val = getAttribute(jc, 'w', 'val');
        if (val) {
            formatting.alignment = val;
        }
    }
    // === Bidi (right-to-left) ===
    const bidi = findChild(pPr, 'w', 'bidi');
    if (bidi) {
        formatting.bidi = parseBooleanElement(bidi);
    }
    // === Spacing ===
    const spacing = findChild(pPr, 'w', 'spacing');
    if (spacing) {
        // Empty <w:spacing/> overrides the inherited style chain. Record
        // the marker so the serializer re-emits the self-closing form.
        if (isEmptyXmlElement(spacing)) {
            formatting.presentEmpty = Object.assign(Object.assign({}, ((_a = formatting.presentEmpty) !== null && _a !== void 0 ? _a : {})), { spacing: true });
        }
        const before = parseNumericAttribute(spacing, 'w', 'before');
        if (before !== undefined)
            formatting.spaceBefore = before;
        const after = parseNumericAttribute(spacing, 'w', 'after');
        if (after !== undefined)
            formatting.spaceAfter = after;
        const line = parseNumericAttribute(spacing, 'w', 'line');
        if (line !== undefined)
            formatting.lineSpacing = line;
        // See ParagraphFormatting.spacingExplicit.
        const explicit = {};
        if (before !== undefined)
            explicit.before = true;
        if (after !== undefined)
            explicit.after = true;
        if (explicit.before || explicit.after) {
            formatting.spacingExplicit = explicit;
        }
        const lineRule = getAttribute(spacing, 'w', 'lineRule');
        if (lineRule) {
            formatting.lineSpacingRule = lineRule;
        }
        const beforeAuto = getAttribute(spacing, 'w', 'beforeAutospacing');
        if (beforeAuto) {
            formatting.beforeAutospacing = beforeAuto === '1' || beforeAuto === 'true';
        }
        const afterAuto = getAttribute(spacing, 'w', 'afterAutospacing');
        if (afterAuto) {
            formatting.afterAutospacing = afterAuto === '1' || afterAuto === 'true';
        }
    }
    // === Indentation ===
    const ind = findChild(pPr, 'w', 'ind');
    if (ind) {
        if (isEmptyXmlElement(ind)) {
            formatting.presentEmpty = Object.assign(Object.assign({}, ((_b = formatting.presentEmpty) !== null && _b !== void 0 ? _b : {})), { ind: true });
        }
        const left = parseNumericAttribute(ind, 'w', 'left');
        if (left !== undefined)
            formatting.indentLeft = left;
        const right = parseNumericAttribute(ind, 'w', 'right');
        if (right !== undefined)
            formatting.indentRight = right;
        const firstLine = parseNumericAttribute(ind, 'w', 'firstLine');
        if (firstLine !== undefined)
            formatting.indentFirstLine = firstLine;
        const hanging = parseNumericAttribute(ind, 'w', 'hanging');
        if (hanging !== undefined) {
            // Hanging indent is stored as negative first line indent
            formatting.indentFirstLine = -hanging;
            formatting.hangingIndent = true;
        }
        // Also check for w:start and w:end (alternative attributes)
        const start = parseNumericAttribute(ind, 'w', 'start');
        if (start !== undefined && formatting.indentLeft === undefined) {
            formatting.indentLeft = start;
        }
        const end = parseNumericAttribute(ind, 'w', 'end');
        if (end !== undefined && formatting.indentRight === undefined) {
            formatting.indentRight = end;
        }
    }
    // === Borders ===
    const pBdr = findChild(pPr, 'w', 'pBdr');
    if (pBdr) {
        if (isEmptyXmlElement(pBdr)) {
            formatting.presentEmpty = Object.assign(Object.assign({}, ((_c = formatting.presentEmpty) !== null && _c !== void 0 ? _c : {})), { pBdr: true });
        }
        const borders = {};
        const top = parseBorderSpec(findChild(pBdr, 'w', 'top'));
        if (top)
            borders.top = top;
        const bottom = parseBorderSpec(findChild(pBdr, 'w', 'bottom'));
        if (bottom)
            borders.bottom = bottom;
        const left = parseBorderSpec(findChild(pBdr, 'w', 'left'));
        if (left)
            borders.left = left;
        const right = parseBorderSpec(findChild(pBdr, 'w', 'right'));
        if (right)
            borders.right = right;
        const between = parseBorderSpec(findChild(pBdr, 'w', 'between'));
        if (between)
            borders.between = between;
        const bar = parseBorderSpec(findChild(pBdr, 'w', 'bar'));
        if (bar)
            borders.bar = bar;
        if (Object.keys(borders).length > 0) {
            formatting.borders = borders;
        }
    }
    // === Shading ===
    const shd = findChild(pPr, 'w', 'shd');
    if (shd) {
        formatting.shading = parseShadingProperties(shd);
    }
    // === Tab Stops ===
    const tabs = findChild(pPr, 'w', 'tabs');
    if (tabs) {
        formatting.tabs = parseTabStops(tabs);
    }
    // === Page Break Control ===
    const keepNext = findChild(pPr, 'w', 'keepNext');
    if (keepNext) {
        formatting.keepNext = parseBooleanElement(keepNext);
    }
    const keepLines = findChild(pPr, 'w', 'keepLines');
    if (keepLines) {
        formatting.keepLines = parseBooleanElement(keepLines);
    }
    const widowControl = findChild(pPr, 'w', 'widowControl');
    if (widowControl) {
        formatting.widowControl = parseBooleanElement(widowControl);
    }
    const pageBreakBefore = findChild(pPr, 'w', 'pageBreakBefore');
    if (pageBreakBefore) {
        formatting.pageBreakBefore = parseBooleanElement(pageBreakBefore);
    }
    const contextualSpacing = findChild(pPr, 'w', 'contextualSpacing');
    if (contextualSpacing) {
        formatting.contextualSpacing = parseBooleanElement(contextualSpacing);
    }
    // === Numbering Properties (List Info) ===
    const numPr = findChild(pPr, 'w', 'numPr');
    if (numPr) {
        const numIdEl = findChild(numPr, 'w', 'numId');
        const ilvlEl = findChild(numPr, 'w', 'ilvl');
        if (numIdEl || ilvlEl) {
            formatting.numPr = {};
            if (numIdEl) {
                const val = parseNumericAttribute(numIdEl, 'w', 'val');
                if (val !== undefined)
                    formatting.numPr.numId = val;
            }
            if (ilvlEl) {
                const val = parseNumericAttribute(ilvlEl, 'w', 'val');
                if (val !== undefined)
                    formatting.numPr.ilvl = val;
            }
        }
    }
    // === Outline Level ===
    const outlineLvl = findChild(pPr, 'w', 'outlineLvl');
    if (outlineLvl) {
        const val = parseNumericAttribute(outlineLvl, 'w', 'val');
        if (val !== undefined)
            formatting.outlineLevel = val;
    }
    // === Style Reference ===
    const pStyle = findChild(pPr, 'w', 'pStyle');
    if (pStyle) {
        const val = getAttribute(pStyle, 'w', 'val');
        if (val)
            formatting.styleId = val;
    }
    // === Frame Properties ===
    const framePr = findChild(pPr, 'w', 'framePr');
    if (framePr) {
        formatting.frame = parseFrameProperties(framePr);
    }
    // === Suppress Line Numbers ===
    const suppressLineNumbers = findChild(pPr, 'w', 'suppressLineNumbers');
    if (suppressLineNumbers) {
        formatting.suppressLineNumbers = parseBooleanElement(suppressLineNumbers);
    }
    // === Suppress Auto Hyphens ===
    const suppressAutoHyphens = findChild(pPr, 'w', 'suppressAutoHyphens');
    if (suppressAutoHyphens) {
        formatting.suppressAutoHyphens = parseBooleanElement(suppressAutoHyphens);
    }
    // === East-Asian + table spacing flags ===
    // Defaults are true; explicit `<w:val="0"/>` is what shows up in
    // source XML when the author disables them. Preserve verbatim so
    // round-trip doesn't silently re-enable EA auto-spacing.
    const autoSpaceDE = findChild(pPr, 'w', 'autoSpaceDE');
    if (autoSpaceDE) {
        formatting.autoSpaceDE = parseBooleanElement(autoSpaceDE);
    }
    const autoSpaceDN = findChild(pPr, 'w', 'autoSpaceDN');
    if (autoSpaceDN) {
        formatting.autoSpaceDN = parseBooleanElement(autoSpaceDN);
    }
    const adjustRightInd = findChild(pPr, 'w', 'adjustRightInd');
    if (adjustRightInd) {
        formatting.adjustRightInd = parseBooleanElement(adjustRightInd);
    }
    const textAlignmentEl = findChild(pPr, 'w', 'textAlignment');
    if (textAlignmentEl) {
        const val = getAttribute(textAlignmentEl, 'w', 'val');
        if (val === 'top' ||
            val === 'center' ||
            val === 'baseline' ||
            val === 'bottom' ||
            val === 'auto') {
            formatting.textAlignment = val;
        }
    }
    const overflowPunct = findChild(pPr, 'w', 'overflowPunct');
    if (overflowPunct) {
        formatting.overflowPunct = parseBooleanElement(overflowPunct);
    }
    // === Default Run Properties ===
    const rPr = findChild(pPr, 'w', 'rPr');
    if (rPr) {
        if (isEmptyXmlElement(rPr)) {
            formatting.presentEmpty = Object.assign(Object.assign({}, ((_d = formatting.presentEmpty) !== null && _d !== void 0 ? _d : {})), { rPr: true });
        }
        formatting.runProperties = parseRunProperties(rPr, theme, styles);
    }
    return Object.keys(formatting).length > 0 ? formatting : undefined;
}
/**
 * True when an XML element has neither attributes nor child elements
 * — i.e. it was emitted in the source XML as `<w:foo/>`. Used by
 * paragraph property parsing to preserve semantically-meaningful
 * empty self-closing forms across round-trip.
 */
function isEmptyXmlElement(el) {
    const hasAttrs = el.attributes != null && Object.keys(el.attributes).length > 0;
    const hasChildren = Array.isArray(el.elements) && el.elements.length > 0;
    return !hasAttrs && !hasChildren;
}
// ============================================================================
// PARAGRAPH CONTENT PARSERS
// ============================================================================
/**
 * Get the local name of an element (without namespace prefix)
 */
function getLocalName(name) {
    if (!name)
        return '';
    const colonIndex = name.indexOf(':');
    return colonIndex >= 0 ? name.substring(colonIndex + 1) : name;
}
/**
 * Walks a paragraph (and recurses through inline wrappers like hyperlink,
 * smartTag, sdt, fldSimple, ins, del) looking for the first piece of visible
 * run content. Returns true when a `<w:lastRenderedPageBreak/>` precedes
 * that visible content — i.e. Word recorded a page break before this
 * paragraph. Also returns true on a leading hard `<w:br w:type="page"/>`
 * placed before any visible content.
 */
function paragraphStartsWithRenderedPageBreak(node) {
    // Wrappers that just contain runs at this layer; recurse into them.
    const inlineWrappers = new Set([
        'hyperlink',
        'smartTag',
        'sdt',
        'sdtContent',
        'fldSimple',
        'customXml',
        'ins',
        'del',
        'moveFrom',
        'moveTo',
    ]);
    // Sub-paragraph markers that don't carry visible content; skip past them.
    const nonContentMarkers = new Set([
        'pPr',
        'proofErr',
        'bookmarkStart',
        'bookmarkEnd',
        'commentRangeStart',
        'commentRangeEnd',
        'commentReference',
        'permStart',
        'permEnd',
        'rsidR',
    ]);
    // Run children that count as visible content (cursor renders something).
    const visibleRunContent = new Set([
        't',
        'tab',
        'br',
        'cr',
        'sym',
        'drawing',
        'pict',
        'object',
        'softHyphen',
        'noBreakHyphen',
        'fldChar',
        'instrText',
        'pgNum',
        'separator',
        'continuationSeparator',
        'footnoteRef',
        'endnoteRef',
        'footnoteReference',
        'endnoteReference',
        'ptab',
        'monthShort',
        'monthLong',
        'yearShort',
        'yearLong',
        'dayShort',
        'dayLong',
    ]);
    let sawRenderedPageBreak = false;
    function visit(el) {
        for (const child of getChildElements(el)) {
            const childName = getLocalName(child.name);
            if (nonContentMarkers.has(childName))
                continue;
            if (childName === 'lastRenderedPageBreak') {
                sawRenderedPageBreak = true;
                continue;
            }
            if (childName === 'r') {
                for (const runChild of getChildElements(child)) {
                    const runChildName = getLocalName(runChild.name);
                    if (runChildName === 'rPr')
                        continue;
                    if (runChildName === 'lastRenderedPageBreak') {
                        sawRenderedPageBreak = true;
                        continue;
                    }
                    if (runChildName === 'br' && getAttribute(runChild, 'w', 'type') === 'page') {
                        // A hard page break is itself a forced break — mark unconditionally.
                        return 'forced';
                    }
                    if (visibleRunContent.has(runChildName)) {
                        return 'visible';
                    }
                }
                // Empty run (only rPr or skipped markers) — keep scanning siblings.
                continue;
            }
            if (inlineWrappers.has(childName)) {
                const r = visit(child);
                if (r !== 'continue')
                    return r;
                continue;
            }
            // Anything else (an unexpected sub-element) is treated as a stop —
            // we can't know whether to count it as visible content.
            return 'continue';
        }
        return 'continue';
    }
    const outcome = visit(node);
    if (outcome === 'forced')
        return true;
    if (outcome === 'visible')
        return sawRenderedPageBreak;
    return false;
}
function replaceLocalName(name, localName) {
    if (!name) {
        return `w:${localName}`;
    }
    const colonIndex = name.indexOf(':');
    if (colonIndex < 0) {
        return localName;
    }
    return `${name.substring(0, colonIndex + 1)}${localName}`;
}
function normalizeDeletionContentElement(node) {
    var _a;
    if (node.type !== 'element') {
        return node;
    }
    const localName = getLocalName(node.name);
    let mappedName = node.name;
    if (localName === 'delText') {
        mappedName = replaceLocalName(node.name, 't');
    }
    else if (localName === 'delInstrText') {
        mappedName = replaceLocalName(node.name, 'instrText');
    }
    return Object.assign(Object.assign({}, node), { name: mappedName, elements: (_a = node.elements) === null || _a === void 0 ? void 0 : _a.map(normalizeDeletionContentElement) });
}
function parseTrackedChangeInfo(node) {
    var _a, _b;
    const rawId = getAttribute(node, 'w', 'id');
    const parsedId = rawId ? parseInt(rawId, 10) : 0;
    const rawAuthor = getAttribute(node, 'w', 'author');
    const rawDate = getAttribute(node, 'w', 'date');
    const author = (_a = rawAuthor === null || rawAuthor === void 0 ? void 0 : rawAuthor.trim()) !== null && _a !== void 0 ? _a : '';
    const date = (_b = rawDate === null || rawDate === void 0 ? void 0 : rawDate.trim()) !== null && _b !== void 0 ? _b : '';
    return {
        id: Number.isInteger(parsedId) && parsedId >= 0 ? parsedId : 0,
        author: author.length > 0 ? author : 'Unknown',
        date: date.length > 0 ? date : undefined,
    };
}
function parsePropertyChangeInfo(node) {
    var _a;
    const base = parseTrackedChangeInfo(node);
    const rsid = ((_a = getAttribute(node, 'w', 'rsid')) !== null && _a !== void 0 ? _a : '').trim();
    return rsid.length > 0 ? Object.assign(Object.assign({}, base), { rsid }) : base;
}
function parseParagraphPropertyChanges(pPr, theme, styles, currentFormatting) {
    if (!pPr)
        return undefined;
    const changes = findChildren(pPr, 'w', 'pPrChange')
        .map((changeElement) => {
        const previousPPr = findChild(changeElement, 'w', 'pPr');
        return {
            type: 'paragraphPropertyChange',
            info: parsePropertyChangeInfo(changeElement),
            previousFormatting: parseParagraphProperties(previousPPr, theme, styles !== null && styles !== void 0 ? styles : undefined),
            currentFormatting,
        };
    })
        .filter((change) => change.previousFormatting || change.currentFormatting);
    return changes.length > 0 ? changes : undefined;
}
/**
 * Parse hyperlink element (w:hyperlink)
 *
 * Delegates to hyperlinkParser module which resolves URLs via relationships.
 */
function parseHyperlink(node, rels, styles, theme, media) {
    return parseHyperlinkFromModule(node, rels, styles, theme, media);
}
/**
 * Parse bookmark start (w:bookmarkStart)
 * Delegates to bookmarkParser module.
 */
function parseBookmarkStart(node) {
    return parseBookmarkStartFromModule(node);
}
/**
 * Parse bookmark end (w:bookmarkEnd)
 * Delegates to bookmarkParser module.
 */
function parseBookmarkEnd(node) {
    return parseBookmarkEndFromModule(node);
}
/**
 * Parse field type from instruction string
 */
function parseFieldType(instruction) {
    // Extract the field name (first word)
    const match = instruction.trim().match(/^\\?([A-Z]+)/i);
    if (!match)
        return 'UNKNOWN';
    const fieldName = match[1].toUpperCase();
    const knownFields = [
        'PAGE',
        'NUMPAGES',
        'NUMWORDS',
        'NUMCHARS',
        'DATE',
        'TIME',
        'CREATEDATE',
        'SAVEDATE',
        'PRINTDATE',
        'AUTHOR',
        'TITLE',
        'SUBJECT',
        'KEYWORDS',
        'COMMENTS',
        'FILENAME',
        'FILESIZE',
        'TEMPLATE',
        'DOCPROPERTY',
        'DOCVARIABLE',
        'REF',
        'PAGEREF',
        'NOTEREF',
        'HYPERLINK',
        'TOC',
        'TOA',
        'INDEX',
        'SEQ',
        'STYLEREF',
        'AUTONUM',
        'AUTONUMLGL',
        'AUTONUMOUT',
        'IF',
        'MERGEFIELD',
        'NEXT',
        'NEXTIF',
        'ASK',
        'SET',
        'QUOTE',
        'INCLUDETEXT',
        'INCLUDEPICTURE',
        'SYMBOL',
        'ADVANCE',
        'EDITTIME',
        'REVNUM',
        'SECTION',
        'SECTIONPAGES',
        'USERADDRESS',
        'USERNAME',
        'USERINITIALS',
    ];
    if (knownFields.includes(fieldName)) {
        return fieldName;
    }
    return 'UNKNOWN';
}
/**
 * Parse simple field (w:fldSimple)
 */
function parseSimpleField(node, styles, theme, rels, media) {
    var _a;
    const instruction = (_a = getAttribute(node, 'w', 'instr')) !== null && _a !== void 0 ? _a : '';
    const fieldType = parseFieldType(instruction);
    const field = {
        type: 'simpleField',
        instruction,
        fieldType,
        content: [],
    };
    // Check for fldLock
    const fldLock = getAttribute(node, 'w', 'fldLock');
    if (fldLock === '1' || fldLock === 'true') {
        field.fldLock = true;
    }
    // Check for dirty
    const dirty = getAttribute(node, 'w', 'dirty');
    if (dirty === '1' || dirty === 'true') {
        field.dirty = true;
    }
    // Parse child runs (the display value)
    const children = getChildElements(node);
    for (const child of children) {
        const localName = getLocalName(child.name);
        if (localName === 'r') {
            field.content.push(parseRun(child, styles, theme, rels, media));
        }
    }
    return field;
}
/**
 * Parse all content within a paragraph
 *
 * Returns the parsed content and any complex fields that span multiple runs
 */
function parseParagraphContents(paraElement, styles, theme, _numbering, rels, media, trackedContext = 'default') {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const contents = [];
    const children = getChildElements(paraElement);
    // State for tracking complex fields
    let inComplexField = false;
    let complexFieldInstr = '';
    let complexFieldCodeRuns = [];
    let complexFieldResultRuns = [];
    let afterSeparator = false;
    let complexFieldLock = false;
    let complexFieldDirty = false;
    for (const child of children) {
        const localName = getLocalName(child.name);
        switch (localName) {
            case 'r': {
                // Check for field characters in this run
                const runElement = trackedContext === 'deletion' ? normalizeDeletionContentElement(child) : child;
                const run = parseRun(runElement, styles, theme, rels, media);
                // Inside <w:del> or <w:ins>, keep runs raw — including fldChar /
                // instrText ones. Coalescing them into ComplexField would lose
                // them at the surrounding Insertion / Deletion's Run|Hyperlink
                // filter; the run serializer already rewrites delText /
                // delInstrText inside del.
                if (trackedContext === 'deletion' || trackedContext === 'insertion') {
                    contents.push(run);
                    break;
                }
                // Look for field characters
                let hasFieldBegin = false;
                let hasFieldSeparate = false;
                let hasFieldEnd = false;
                let instrText = '';
                for (const content of run.content) {
                    if (content.type === 'fieldChar') {
                        if (content.charType === 'begin') {
                            hasFieldBegin = true;
                            if (content.fldLock)
                                complexFieldLock = true;
                            if (content.dirty)
                                complexFieldDirty = true;
                        }
                        else if (content.charType === 'separate') {
                            hasFieldSeparate = true;
                        }
                        else if (content.charType === 'end') {
                            hasFieldEnd = true;
                        }
                    }
                    else if (content.type === 'instrText') {
                        instrText += content.text;
                    }
                }
                if (hasFieldBegin) {
                    // Starting a new complex field
                    inComplexField = true;
                    afterSeparator = false;
                    complexFieldInstr = '';
                    complexFieldCodeRuns = [];
                    complexFieldResultRuns = [];
                    complexFieldLock = false;
                    complexFieldDirty = false;
                }
                if (inComplexField) {
                    if (instrText) {
                        complexFieldInstr += instrText;
                    }
                    if (hasFieldSeparate) {
                        afterSeparator = true;
                    }
                    if (afterSeparator && !hasFieldEnd) {
                        // Add to result runs (excluding the separator run itself)
                        if (!hasFieldSeparate) {
                            complexFieldResultRuns.push(run);
                        }
                    }
                    else if (!afterSeparator && !hasFieldBegin) {
                        // Add to code runs
                        complexFieldCodeRuns.push(run);
                    }
                    if (hasFieldEnd) {
                        // Close the complex field
                        const complexField = {
                            type: 'complexField',
                            instruction: complexFieldInstr.trim(),
                            fieldType: parseFieldType(complexFieldInstr),
                            fieldCode: complexFieldCodeRuns,
                            fieldResult: complexFieldResultRuns,
                        };
                        if (complexFieldLock)
                            complexField.fldLock = true;
                        if (complexFieldDirty)
                            complexField.dirty = true;
                        contents.push(complexField);
                        inComplexField = false;
                    }
                }
                else {
                    // Regular run, not part of a field
                    contents.push(run);
                }
                break;
            }
            case 'hyperlink':
                contents.push(parseHyperlink(child, rels, styles, theme, media));
                break;
            case 'bookmarkStart':
                contents.push(parseBookmarkStart(child));
                break;
            case 'bookmarkEnd':
                contents.push(parseBookmarkEnd(child));
                break;
            case 'fldSimple':
                contents.push(parseSimpleField(child, styles, theme, rels, media));
                break;
            case 'pPr':
                // Already handled separately
                break;
            case 'proofErr': {
                // Preserve <w:proofErr w:type="..."/> markers — editor-internal
                // spell/grammar checkpoints that don't drive any rendering but
                // get regenerated by Word on each open if missing (audit cleanup
                // only).
                const errorType = getAttribute(child, 'w', 'type');
                if (errorType === 'spellStart' ||
                    errorType === 'spellEnd' ||
                    errorType === 'gramStart' ||
                    errorType === 'gramEnd') {
                    contents.push({ type: 'proofErr', errorType });
                }
                break;
            }
            case 'permStart':
            case 'permEnd':
            case 'customXml':
                // Skip these elements
                break;
            case 'sdt': {
                // Structured document tag - extract properties and content
                const sdtPr = ((_a = child.elements) !== null && _a !== void 0 ? _a : []).find((el) => { var _a; return el.type === 'element' && (el.name === 'w:sdtPr' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':sdtPr'))); });
                const sdtContentEl = ((_b = child.elements) !== null && _b !== void 0 ? _b : []).find((el) => {
                    var _a;
                    return el.type === 'element' &&
                        (el.name === 'w:sdtContent' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':sdtContent')));
                });
                if (sdtContentEl) {
                    const sdtParsed = parseParagraphContents(sdtContentEl, styles, theme, null, rels, media, trackedContext);
                    const properties = parseSdtProperties(sdtPr !== null && sdtPr !== void 0 ? sdtPr : null);
                    const inlineSdt = {
                        type: 'inlineSdt',
                        properties,
                        content: sdtParsed.filter((c) => c.type === 'run' || c.type === 'hyperlink'),
                    };
                    contents.push(inlineSdt);
                }
                break;
            }
            case 'ins': {
                // Track change: insertion — parse content and wrap
                const insInfo = parseTrackedChangeInfo(child);
                const insContent = parseParagraphContents(child, styles, theme, null, rels, media, 'insertion');
                const insertion = {
                    type: 'insertion',
                    info: insInfo,
                    content: insContent.filter((c) => c.type === 'run' || c.type === 'hyperlink'),
                };
                contents.push(insertion);
                break;
            }
            case 'del': {
                // Track change: deletion — parse content and wrap
                const delInfo = parseTrackedChangeInfo(child);
                const delContent = parseParagraphContents(child, styles, theme, null, rels, media, 'deletion');
                const deletion = {
                    type: 'deletion',
                    info: delInfo,
                    content: delContent.filter((c) => c.type === 'run' || c.type === 'hyperlink'),
                };
                contents.push(deletion);
                break;
            }
            case 'moveFrom': {
                const moveFromInfo = parseTrackedChangeInfo(child);
                const moveFromContent = parseParagraphContents(child, styles, theme, null, rels, media, 'deletion');
                const moveFrom = {
                    type: 'moveFrom',
                    info: moveFromInfo,
                    content: moveFromContent.filter((c) => c.type === 'run' || c.type === 'hyperlink'),
                };
                contents.push(moveFrom);
                break;
            }
            case 'moveTo': {
                const moveToInfo = parseTrackedChangeInfo(child);
                const moveToContent = parseParagraphContents(child, styles, theme, null, rels, media);
                const moveTo = {
                    type: 'moveTo',
                    info: moveToInfo,
                    content: moveToContent.filter((c) => c.type === 'run' || c.type === 'hyperlink'),
                };
                contents.push(moveTo);
                break;
            }
            case 'smartTag':
                break;
            case 'moveFromRangeStart': {
                const id = parseInt((_c = getAttribute(child, 'w', 'id')) !== null && _c !== void 0 ? _c : '0', 10);
                const name = (_d = getAttribute(child, 'w', 'name')) !== null && _d !== void 0 ? _d : '';
                contents.push({ type: 'moveFromRangeStart', id, name });
                break;
            }
            case 'moveFromRangeEnd': {
                const id = parseInt((_e = getAttribute(child, 'w', 'id')) !== null && _e !== void 0 ? _e : '0', 10);
                contents.push({ type: 'moveFromRangeEnd', id });
                break;
            }
            case 'moveToRangeStart': {
                const id = parseInt((_f = getAttribute(child, 'w', 'id')) !== null && _f !== void 0 ? _f : '0', 10);
                const name = (_g = getAttribute(child, 'w', 'name')) !== null && _g !== void 0 ? _g : '';
                contents.push({ type: 'moveToRangeStart', id, name });
                break;
            }
            case 'moveToRangeEnd': {
                const id = parseInt((_h = getAttribute(child, 'w', 'id')) !== null && _h !== void 0 ? _h : '0', 10);
                contents.push({ type: 'moveToRangeEnd', id });
                break;
            }
            case 'commentRangeStart': {
                const commentId = parseInt((_j = getAttribute(child, 'w', 'id')) !== null && _j !== void 0 ? _j : '0', 10);
                contents.push({ type: 'commentRangeStart', id: commentId });
                break;
            }
            case 'commentRangeEnd': {
                const commentId = parseInt((_k = getAttribute(child, 'w', 'id')) !== null && _k !== void 0 ? _k : '0', 10);
                contents.push({ type: 'commentRangeEnd', id: commentId });
                break;
            }
            case 'oMath':
            case 'oMathPara': {
                // Math equations — store raw OMML XML and extract text fallback
                const isBlock = localName === 'oMathPara';
                const ommlXml = elementToXml(child);
                const plainText = extractMathText(child);
                const mathEq = {
                    type: 'mathEquation',
                    display: isBlock ? 'block' : 'inline',
                    ommlXml,
                    plainText: plainText || undefined,
                };
                contents.push(mathEq);
                break;
            }
            default:
                // Unknown element - skip
                break;
        }
    }
    return contents;
}
// ============================================================================
// MAIN PARAGRAPH PARSER
// ============================================================================
/**
 * Parse a paragraph element (w:p)
 *
 * @param node - The w:p XML element
 * @param styles - Style map for resolving style references
 * @param theme - Theme for resolving theme colors/fonts
 * @param numbering - Numbering definitions for list info
 * @param rels - Relationship map for resolving hyperlink URLs
 * @param media - Media files map for image data
 * @param options - `inHeaderFooter` skips `<w:lastRenderedPageBreak/>`
 *   detection since headers and footers reflow per page.
 * @returns Parsed Paragraph object
 */
export function parseParagraph(node, styles, theme, numbering, rels = null, media = null, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const paragraph = {
        type: 'paragraph',
        content: [],
    };
    // Get paragraph ID attributes (Word 2010+ uses these for collaboration)
    const paraId = (_a = getAttribute(node, 'w14', 'paraId')) !== null && _a !== void 0 ? _a : getAttribute(node, 'w', 'paraId');
    if (paraId) {
        paragraph.paraId = paraId;
    }
    const textId = (_b = getAttribute(node, 'w14', 'textId')) !== null && _b !== void 0 ? _b : getAttribute(node, 'w', 'textId');
    if (textId) {
        paragraph.textId = textId;
    }
    // `<w:lastRenderedPageBreak/>` only makes sense in body flow; headers and
    // footers reflow per page, so detection is skipped there.
    if (!(options === null || options === void 0 ? void 0 : options.inHeaderFooter) && paragraphStartsWithRenderedPageBreak(node)) {
        paragraph.renderedPageBreakBefore = true;
    }
    // Parse paragraph properties (w:pPr)
    const pPr = findChild(node, 'w', 'pPr');
    if (pPr) {
        paragraph.formatting = parseParagraphProperties(pPr, theme, styles !== null && styles !== void 0 ? styles : undefined);
        paragraph.propertyChanges = parseParagraphPropertyChanges(pPr, theme, styles, paragraph.formatting);
        // Check for section properties within paragraph (marks end of a section)
        const sectPr = findChild(pPr, 'w', 'sectPr');
        if (sectPr) {
            paragraph.sectionProperties = parseSectionProperties(sectPr, rels);
        }
    }
    // Parse paragraph contents (runs, hyperlinks, bookmarks, fields)
    const rawContent = parseParagraphContents(node, styles, theme, numbering, rels, media);
    // Consolidate consecutive runs with identical formatting
    // This reduces fragmentation (e.g., 252 tiny runs → a few larger runs)
    paragraph.content = consolidateParagraphContent(rawContent);
    // Compute list rendering if this is a list item.
    // numPr can come from inline pPr or from the referenced paragraph style.
    let effectiveNumPr = (_c = paragraph.formatting) === null || _c === void 0 ? void 0 : _c.numPr;
    if (!effectiveNumPr && ((_d = paragraph.formatting) === null || _d === void 0 ? void 0 : _d.styleId) && styles) {
        const style = styles.get(paragraph.formatting.styleId);
        if ((_e = style === null || style === void 0 ? void 0 : style.pPr) === null || _e === void 0 ? void 0 : _e.numPr) {
            effectiveNumPr = style.pPr.numPr;
            // Store it on the paragraph formatting so downstream code sees it
            if (!paragraph.formatting)
                paragraph.formatting = {};
            paragraph.formatting.numPr = effectiveNumPr;
        }
    }
    if (effectiveNumPr && numbering) {
        const { numId, ilvl = 0 } = effectiveNumPr;
        if (numId !== undefined && numId !== 0) {
            const level = numbering.getLevel(numId, ilvl);
            if (level) {
                // Collect numFmts for levels 0..ilvl so multi-level templates like
                // "%1.%2." can resolve each %N with its own format (e.g., upperRoman
                // parent + decimal child).
                const levelNumFmts = [];
                for (let i = 0; i <= ilvl; i += 1) {
                    const parent = numbering.getLevel(numId, i);
                    levelNumFmts.push((_f = parent === null || parent === void 0 ? void 0 : parent.numFmt) !== null && _f !== void 0 ? _f : 'decimal');
                }
                const instance = numbering.getInstance(numId);
                const overrideForLevel = (_g = instance === null || instance === void 0 ? void 0 : instance.levelOverrides) === null || _g === void 0 ? void 0 : _g.find((o) => o.ilvl === ilvl);
                paragraph.listRendering = {
                    level: ilvl,
                    numId,
                    marker: level.lvlText,
                    isBullet: level.numFmt === 'bullet',
                    numFmt: level.numFmt,
                    markerHidden: ((_h = level.rPr) === null || _h === void 0 ? void 0 : _h.hidden) || undefined,
                    markerFontFamily: ((_k = (_j = level.rPr) === null || _j === void 0 ? void 0 : _j.fontFamily) === null || _k === void 0 ? void 0 : _k.ascii) || ((_m = (_l = level.rPr) === null || _l === void 0 ? void 0 : _l.fontFamily) === null || _m === void 0 ? void 0 : _m.hAnsi) || undefined,
                    // w:sz is in half-points; convert to points for downstream use
                    markerFontSize: ((_o = level.rPr) === null || _o === void 0 ? void 0 : _o.fontSize) ? level.rPr.fontSize / 2 : undefined,
                    levelNumFmts,
                    abstractNumId: instance === null || instance === void 0 ? void 0 : instance.abstractNumId,
                    startOverride: overrideForLevel === null || overrideForLevel === void 0 ? void 0 : overrideForLevel.startOverride,
                };
                // Apply level's paragraph properties (indentation) as defaults.
                // Per OOXML spec, direct w:ind on the paragraph overrides numbering
                // level indent — only use numbering indent as fallback.
                if (level.pPr) {
                    if (!paragraph.formatting) {
                        paragraph.formatting = {};
                    }
                    const directInd = pPr ? findChild(pPr, 'w', 'ind') : null;
                    const hasDirectLeft = directInd != null &&
                        (getAttribute(directInd, 'w', 'left') !== null ||
                            getAttribute(directInd, 'w', 'start') !== null);
                    const hasDirectFirstLineOrHanging = directInd != null &&
                        (getAttribute(directInd, 'w', 'firstLine') !== null ||
                            getAttribute(directInd, 'w', 'hanging') !== null);
                    if (!hasDirectLeft && level.pPr.indentLeft !== undefined) {
                        paragraph.formatting.indentLeft = level.pPr.indentLeft;
                    }
                    if (!hasDirectFirstLineOrHanging) {
                        if (level.pPr.indentFirstLine !== undefined) {
                            paragraph.formatting.indentFirstLine = level.pPr.indentFirstLine;
                        }
                        if (level.pPr.hangingIndent !== undefined) {
                            paragraph.formatting.hangingIndent = level.pPr.hangingIndent;
                        }
                    }
                }
            }
        }
    }
    return paragraph;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get plain text from a paragraph
 *
 * @param paragraph - Parsed Paragraph object
 * @returns Concatenated text content
 */
export function getParagraphText(paragraph) {
    let text = '';
    for (const content of paragraph.content) {
        if (content.type === 'run') {
            for (const runContent of content.content) {
                if (runContent.type === 'text') {
                    text += runContent.text;
                }
                else if (runContent.type === 'tab') {
                    text += '\t';
                }
                else if (runContent.type === 'break') {
                    if (runContent.breakType === 'page') {
                        text += '\f';
                    }
                    else {
                        text += '\n';
                    }
                }
            }
        }
        else if (content.type === 'hyperlink') {
            for (const child of content.children) {
                if (child.type === 'run') {
                    for (const runContent of child.content) {
                        if (runContent.type === 'text') {
                            text += runContent.text;
                        }
                    }
                }
            }
        }
        else if (content.type === 'simpleField') {
            for (const child of content.content) {
                if (child.type === 'run') {
                    for (const runContent of child.content) {
                        if (runContent.type === 'text') {
                            text += runContent.text;
                        }
                    }
                }
            }
        }
        else if (content.type === 'complexField') {
            for (const run of content.fieldResult) {
                for (const runContent of run.content) {
                    if (runContent.type === 'text') {
                        text += runContent.text;
                    }
                }
            }
        }
    }
    return text;
}
/**
 * Check if a paragraph is empty (no visible content)
 *
 * @param paragraph - Parsed Paragraph object
 * @returns true if paragraph has no visible content
 */
export function isEmptyParagraph(paragraph) {
    return (getParagraphText(paragraph).trim() === '' &&
        !paragraph.content.some((c) => c.type === 'run' && c.content.some((rc) => rc.type === 'drawing' || rc.type === 'shape')));
}
/**
 * Check if a paragraph is a list item
 *
 * @param paragraph - Parsed Paragraph object
 * @returns true if paragraph has numbering properties
 */
export function isListItem(paragraph) {
    var _a;
    return (((_a = paragraph.formatting) === null || _a === void 0 ? void 0 : _a.numPr) !== undefined &&
        paragraph.formatting.numPr.numId !== undefined &&
        paragraph.formatting.numPr.numId !== 0);
}
/**
 * Get the list level of a paragraph (0-8)
 *
 * @param paragraph - Parsed Paragraph object
 * @returns List level or undefined if not a list item
 */
export function getListLevel(paragraph) {
    var _a, _b, _c;
    if (!isListItem(paragraph))
        return undefined;
    return (_c = (_b = (_a = paragraph.formatting) === null || _a === void 0 ? void 0 : _a.numPr) === null || _b === void 0 ? void 0 : _b.ilvl) !== null && _c !== void 0 ? _c : 0;
}
/**
 * Check if paragraph has a specific style
 *
 * @param paragraph - Parsed Paragraph object
 * @param styleId - Style ID to check for
 * @returns true if paragraph has the specified style
 */
export function hasStyle(paragraph, styleId) {
    var _a;
    return ((_a = paragraph.formatting) === null || _a === void 0 ? void 0 : _a.styleId) === styleId;
}
/**
 * Check if paragraph starts with a template variable {{...}}
 *
 * @param paragraph - Parsed Paragraph object
 * @returns The variable name or null
 */
export function getTemplateVariable(paragraph) {
    const text = getParagraphText(paragraph);
    const match = text.match(/\{\{([^}]+)\}\}/);
    return match ? match[1] : null;
}
//# sourceMappingURL=paragraphParser.js.map