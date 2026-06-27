/**
 * Style Parser - Parse styles.xml with full inheritance resolution
 *
 * Parses all style types (paragraph, character, table, list) with
 * complete basedOn inheritance chain resolution.
 *
 * OOXML Reference:
 * - Style file is at: word/styles.xml
 * - Uses WordprocessingML namespace (w:)
 *
 * Style Cascade (lowest to highest priority):
 * 1. Document defaults (w:docDefaults)
 * 2. Parent style properties (w:basedOn chain)
 * 3. Current style properties
 * 4. Direct formatting in document
 */
import { parseXmlDocument, findChild, findChildren, getAttribute, parseBooleanElement, parseNumericAttribute, } from './xmlParser';
import { resolveThemeFontRef } from './themeParser';
import { mergeTextFormatting } from '../utils/textFormattingMerge';
/**
 * Parse text formatting properties (w:rPr)
 */
function parseRunProperties(rPr, theme) {
    var _a, _b, _c, _d;
    if (!rPr)
        return undefined;
    const formatting = {};
    // Bold
    const b = findChild(rPr, 'w', 'b');
    if (b)
        formatting.bold = parseBooleanElement(b);
    const bCs = findChild(rPr, 'w', 'bCs');
    if (bCs)
        formatting.boldCs = parseBooleanElement(bCs);
    // Italic
    const i = findChild(rPr, 'w', 'i');
    if (i)
        formatting.italic = parseBooleanElement(i);
    const iCs = findChild(rPr, 'w', 'iCs');
    if (iCs)
        formatting.italicCs = parseBooleanElement(iCs);
    // Underline
    const u = findChild(rPr, 'w', 'u');
    if (u) {
        const style = getAttribute(u, 'w', 'val');
        if (style) {
            formatting.underline = { style };
            const colorVal = getAttribute(u, 'w', 'color');
            const themeColor = getAttribute(u, 'w', 'themeColor');
            if (colorVal || themeColor) {
                formatting.underline.color = parseColorValue(colorVal, themeColor, getAttribute(u, 'w', 'themeTint'), getAttribute(u, 'w', 'themeShade'));
            }
        }
    }
    // Strikethrough
    const strike = findChild(rPr, 'w', 'strike');
    if (strike)
        formatting.strike = parseBooleanElement(strike);
    const dstrike = findChild(rPr, 'w', 'dstrike');
    if (dstrike)
        formatting.doubleStrike = parseBooleanElement(dstrike);
    // Vertical alignment (superscript/subscript)
    const vertAlign = findChild(rPr, 'w', 'vertAlign');
    if (vertAlign) {
        const val = getAttribute(vertAlign, 'w', 'val');
        if (val === 'superscript' || val === 'subscript' || val === 'baseline') {
            formatting.vertAlign = val;
        }
    }
    // Capitalization
    const smallCaps = findChild(rPr, 'w', 'smallCaps');
    if (smallCaps)
        formatting.smallCaps = parseBooleanElement(smallCaps);
    const caps = findChild(rPr, 'w', 'caps');
    if (caps)
        formatting.allCaps = parseBooleanElement(caps);
    // Hidden
    const vanish = findChild(rPr, 'w', 'vanish');
    if (vanish)
        formatting.hidden = parseBooleanElement(vanish);
    // Color
    const color = findChild(rPr, 'w', 'color');
    if (color) {
        formatting.color = parseColorValue(getAttribute(color, 'w', 'val'), getAttribute(color, 'w', 'themeColor'), getAttribute(color, 'w', 'themeTint'), getAttribute(color, 'w', 'themeShade'));
    }
    // Highlight
    const highlight = findChild(rPr, 'w', 'highlight');
    if (highlight) {
        const val = getAttribute(highlight, 'w', 'val');
        if (val) {
            formatting.highlight = val;
        }
    }
    // Character shading
    const shd = findChild(rPr, 'w', 'shd');
    if (shd) {
        formatting.shading = parseShadingProperties(shd);
    }
    // Font size (in half-points)
    const sz = findChild(rPr, 'w', 'sz');
    if (sz) {
        const val = parseNumericAttribute(sz, 'w', 'val');
        if (val !== undefined)
            formatting.fontSize = val;
    }
    const szCs = findChild(rPr, 'w', 'szCs');
    if (szCs) {
        const val = parseNumericAttribute(szCs, 'w', 'val');
        if (val !== undefined)
            formatting.fontSizeCs = val;
    }
    // Font family
    const rFonts = findChild(rPr, 'w', 'rFonts');
    if (rFonts) {
        formatting.fontFamily = {
            ascii: (_a = getAttribute(rFonts, 'w', 'ascii')) !== null && _a !== void 0 ? _a : undefined,
            hAnsi: (_b = getAttribute(rFonts, 'w', 'hAnsi')) !== null && _b !== void 0 ? _b : undefined,
            eastAsia: (_c = getAttribute(rFonts, 'w', 'eastAsia')) !== null && _c !== void 0 ? _c : undefined,
            cs: (_d = getAttribute(rFonts, 'w', 'cs')) !== null && _d !== void 0 ? _d : undefined,
        };
        // Theme font references - resolve to actual font names
        const asciiTheme = getAttribute(rFonts, 'w', 'asciiTheme');
        if (asciiTheme) {
            formatting.fontFamily.asciiTheme = asciiTheme;
            // Also resolve the actual font name for convenience
            if (theme && !formatting.fontFamily.ascii) {
                formatting.fontFamily.ascii = resolveThemeFontRef(theme, asciiTheme);
            }
        }
        const hAnsiTheme = getAttribute(rFonts, 'w', 'hAnsiTheme');
        if (hAnsiTheme) {
            formatting.fontFamily.hAnsiTheme = hAnsiTheme;
            if (theme && !formatting.fontFamily.hAnsi) {
                formatting.fontFamily.hAnsi = resolveThemeFontRef(theme, hAnsiTheme);
            }
        }
        const eastAsiaTheme = getAttribute(rFonts, 'w', 'eastAsiaTheme');
        if (eastAsiaTheme) {
            formatting.fontFamily.eastAsiaTheme = eastAsiaTheme;
            if (theme && !formatting.fontFamily.eastAsia) {
                formatting.fontFamily.eastAsia = resolveThemeFontRef(theme, eastAsiaTheme);
            }
        }
        const csTheme = getAttribute(rFonts, 'w', 'cstheme');
        if (csTheme) {
            formatting.fontFamily.csTheme = csTheme;
            if (theme && !formatting.fontFamily.cs) {
                formatting.fontFamily.cs = resolveThemeFontRef(theme, csTheme);
            }
        }
    }
    // Character spacing (in twips)
    const spacing = findChild(rPr, 'w', 'spacing');
    if (spacing) {
        const val = parseNumericAttribute(spacing, 'w', 'val');
        if (val !== undefined)
            formatting.spacing = val;
    }
    // Position (raised/lowered in half-points)
    const position = findChild(rPr, 'w', 'position');
    if (position) {
        const val = parseNumericAttribute(position, 'w', 'val');
        if (val !== undefined)
            formatting.position = val;
    }
    // Scale (horizontal text scale percentage)
    const w = findChild(rPr, 'w', 'w');
    if (w) {
        const val = parseNumericAttribute(w, 'w', 'val');
        if (val !== undefined)
            formatting.scale = val;
    }
    // Kerning
    const kern = findChild(rPr, 'w', 'kern');
    if (kern) {
        const val = parseNumericAttribute(kern, 'w', 'val');
        if (val !== undefined)
            formatting.kerning = val;
    }
    // Text effects
    const effect = findChild(rPr, 'w', 'effect');
    if (effect) {
        const val = getAttribute(effect, 'w', 'val');
        if (val)
            formatting.effect = val;
    }
    // Emphasis mark
    const em = findChild(rPr, 'w', 'em');
    if (em) {
        const val = getAttribute(em, 'w', 'val');
        if (val)
            formatting.emphasisMark = val;
    }
    // Other effects
    const emboss = findChild(rPr, 'w', 'emboss');
    if (emboss)
        formatting.emboss = parseBooleanElement(emboss);
    const imprint = findChild(rPr, 'w', 'imprint');
    if (imprint)
        formatting.imprint = parseBooleanElement(imprint);
    const outline = findChild(rPr, 'w', 'outline');
    if (outline)
        formatting.outline = parseBooleanElement(outline);
    const shadow = findChild(rPr, 'w', 'shadow');
    if (shadow)
        formatting.shadow = parseBooleanElement(shadow);
    // RTL and complex script
    const rtl = findChild(rPr, 'w', 'rtl');
    if (rtl)
        formatting.rtl = parseBooleanElement(rtl);
    const cs = findChild(rPr, 'w', 'cs');
    if (cs)
        formatting.cs = parseBooleanElement(cs);
    // Character style reference
    const rStyle = findChild(rPr, 'w', 'rStyle');
    if (rStyle) {
        const val = getAttribute(rStyle, 'w', 'val');
        if (val)
            formatting.styleId = val;
    }
    return Object.keys(formatting).length > 0 ? formatting : undefined;
}
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
 * Parse border specification
 */
function parseBorderSpec(border) {
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
 * Parse paragraph formatting properties (w:pPr)
 */
function parseParagraphProperties(pPr, theme) {
    if (!pPr)
        return undefined;
    const formatting = {};
    // Alignment
    const jc = findChild(pPr, 'w', 'jc');
    if (jc) {
        const val = getAttribute(jc, 'w', 'val');
        if (val)
            formatting.alignment = val;
    }
    // Bidi
    const bidi = findChild(pPr, 'w', 'bidi');
    if (bidi)
        formatting.bidi = parseBooleanElement(bidi);
    // Spacing
    const spacing = findChild(pPr, 'w', 'spacing');
    if (spacing) {
        const before = parseNumericAttribute(spacing, 'w', 'before');
        if (before !== undefined)
            formatting.spaceBefore = before;
        const after = parseNumericAttribute(spacing, 'w', 'after');
        if (after !== undefined)
            formatting.spaceAfter = after;
        const line = parseNumericAttribute(spacing, 'w', 'line');
        if (line !== undefined)
            formatting.lineSpacing = line;
        const lineRule = getAttribute(spacing, 'w', 'lineRule');
        if (lineRule)
            formatting.lineSpacingRule = lineRule;
        const beforeAuto = getAttribute(spacing, 'w', 'beforeAutospacing');
        if (beforeAuto)
            formatting.beforeAutospacing = beforeAuto === '1' || beforeAuto === 'true';
        const afterAuto = getAttribute(spacing, 'w', 'afterAutospacing');
        if (afterAuto)
            formatting.afterAutospacing = afterAuto === '1' || afterAuto === 'true';
    }
    // Indentation
    const ind = findChild(pPr, 'w', 'ind');
    if (ind) {
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
            formatting.indentFirstLine = -hanging;
            formatting.hangingIndent = true;
        }
    }
    // Borders
    const pBdr = findChild(pPr, 'w', 'pBdr');
    if (pBdr) {
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
    // Shading
    const shd = findChild(pPr, 'w', 'shd');
    if (shd) {
        formatting.shading = parseShadingProperties(shd);
    }
    // Tab stops
    const tabs = findChild(pPr, 'w', 'tabs');
    if (tabs) {
        formatting.tabs = parseTabStops(tabs);
    }
    // Page break control
    const keepNext = findChild(pPr, 'w', 'keepNext');
    if (keepNext)
        formatting.keepNext = parseBooleanElement(keepNext);
    const keepLines = findChild(pPr, 'w', 'keepLines');
    if (keepLines)
        formatting.keepLines = parseBooleanElement(keepLines);
    const widowControl = findChild(pPr, 'w', 'widowControl');
    if (widowControl)
        formatting.widowControl = parseBooleanElement(widowControl);
    const pageBreakBefore = findChild(pPr, 'w', 'pageBreakBefore');
    if (pageBreakBefore)
        formatting.pageBreakBefore = parseBooleanElement(pageBreakBefore);
    const contextualSpacing = findChild(pPr, 'w', 'contextualSpacing');
    if (contextualSpacing)
        formatting.contextualSpacing = parseBooleanElement(contextualSpacing);
    // Numbering properties
    const numPr = findChild(pPr, 'w', 'numPr');
    if (numPr) {
        const numId = findChild(numPr, 'w', 'numId');
        const ilvl = findChild(numPr, 'w', 'ilvl');
        if (numId || ilvl) {
            formatting.numPr = {};
            if (numId) {
                const val = parseNumericAttribute(numId, 'w', 'val');
                if (val !== undefined)
                    formatting.numPr.numId = val;
            }
            if (ilvl) {
                const val = parseNumericAttribute(ilvl, 'w', 'val');
                if (val !== undefined)
                    formatting.numPr.ilvl = val;
            }
        }
    }
    // Outline level
    const outlineLvl = findChild(pPr, 'w', 'outlineLvl');
    if (outlineLvl) {
        const val = parseNumericAttribute(outlineLvl, 'w', 'val');
        if (val !== undefined)
            formatting.outlineLevel = val;
    }
    // Style reference
    const pStyle = findChild(pPr, 'w', 'pStyle');
    if (pStyle) {
        const val = getAttribute(pStyle, 'w', 'val');
        if (val)
            formatting.styleId = val;
    }
    // Suppress line numbers
    const suppressLineNumbers = findChild(pPr, 'w', 'suppressLineNumbers');
    if (suppressLineNumbers)
        formatting.suppressLineNumbers = parseBooleanElement(suppressLineNumbers);
    // Suppress auto hyphens
    const suppressAutoHyphens = findChild(pPr, 'w', 'suppressAutoHyphens');
    if (suppressAutoHyphens)
        formatting.suppressAutoHyphens = parseBooleanElement(suppressAutoHyphens);
    // Run properties for this paragraph (default run formatting)
    const rPr = findChild(pPr, 'w', 'rPr');
    if (rPr) {
        formatting.runProperties = parseRunProperties(rPr, theme);
    }
    return Object.keys(formatting).length > 0 ? formatting : undefined;
}
/**
 * Parse table measurement (width/height with type)
 */
function parseTableMeasurement(element) {
    if (!element)
        return undefined;
    const w = parseNumericAttribute(element, 'w', 'w');
    const type = getAttribute(element, 'w', 'type');
    if (w !== undefined && type) {
        return {
            value: w,
            type: type,
        };
    }
    return undefined;
}
/**
 * Parse table borders
 */
function parseTableBorders(tblBorders) {
    if (!tblBorders)
        return undefined;
    const borders = {};
    const top = parseBorderSpec(findChild(tblBorders, 'w', 'top'));
    if (top)
        borders.top = top;
    const bottom = parseBorderSpec(findChild(tblBorders, 'w', 'bottom'));
    if (bottom)
        borders.bottom = bottom;
    const left = parseBorderSpec(findChild(tblBorders, 'w', 'left'));
    if (left)
        borders.left = left;
    const right = parseBorderSpec(findChild(tblBorders, 'w', 'right'));
    if (right)
        borders.right = right;
    const insideH = parseBorderSpec(findChild(tblBorders, 'w', 'insideH'));
    if (insideH)
        borders.insideH = insideH;
    const insideV = parseBorderSpec(findChild(tblBorders, 'w', 'insideV'));
    if (insideV)
        borders.insideV = insideV;
    return Object.keys(borders).length > 0 ? borders : undefined;
}
/**
 * Parse cell margins
 */
function parseCellMargins(tblCellMar) {
    if (!tblCellMar)
        return undefined;
    const margins = {};
    const top = parseTableMeasurement(findChild(tblCellMar, 'w', 'top'));
    if (top)
        margins.top = top;
    const bottom = parseTableMeasurement(findChild(tblCellMar, 'w', 'bottom'));
    if (bottom)
        margins.bottom = bottom;
    const left = parseTableMeasurement(findChild(tblCellMar, 'w', 'left'));
    if (left)
        margins.left = left;
    const right = parseTableMeasurement(findChild(tblCellMar, 'w', 'right'));
    if (right)
        margins.right = right;
    return Object.keys(margins).length > 0 ? margins : undefined;
}
/**
 * Parse table look flags
 */
function parseTableLook(tblLook) {
    if (!tblLook)
        return undefined;
    const look = {};
    // Can be specified as individual attributes or a single val attribute
    const val = getAttribute(tblLook, 'w', 'val');
    if (val) {
        // val is a hex bitmap: bit 0=firstRow, 1=lastRow, 2=firstCol, 3=lastCol, 4=noHBand, 5=noVBand
        const num = parseInt(val, 16);
        if (!isNaN(num)) {
            look.firstRow = (num & 0x0020) !== 0;
            look.lastRow = (num & 0x0040) !== 0;
            look.firstColumn = (num & 0x0080) !== 0;
            look.lastColumn = (num & 0x0100) !== 0;
            look.noHBand = (num & 0x0200) !== 0;
            look.noVBand = (num & 0x0400) !== 0;
        }
    }
    // Individual attributes override
    const firstColumn = getAttribute(tblLook, 'w', 'firstColumn');
    if (firstColumn)
        look.firstColumn = firstColumn === '1';
    const firstRow = getAttribute(tblLook, 'w', 'firstRow');
    if (firstRow)
        look.firstRow = firstRow === '1';
    const lastColumn = getAttribute(tblLook, 'w', 'lastColumn');
    if (lastColumn)
        look.lastColumn = lastColumn === '1';
    const lastRow = getAttribute(tblLook, 'w', 'lastRow');
    if (lastRow)
        look.lastRow = lastRow === '1';
    const noHBand = getAttribute(tblLook, 'w', 'noHBand');
    if (noHBand)
        look.noHBand = noHBand === '1';
    const noVBand = getAttribute(tblLook, 'w', 'noVBand');
    if (noVBand)
        look.noVBand = noVBand === '1';
    return Object.keys(look).length > 0 ? look : undefined;
}
/**
 * Parse table formatting properties (w:tblPr)
 */
function parseTableProperties(tblPr, _theme) {
    if (!tblPr)
        return undefined;
    const formatting = {};
    // Table width
    const tblW = findChild(tblPr, 'w', 'tblW');
    if (tblW) {
        formatting.width = parseTableMeasurement(tblW);
    }
    // Table alignment/justification
    const jc = findChild(tblPr, 'w', 'jc');
    if (jc) {
        const val = getAttribute(jc, 'w', 'val');
        if (val === 'left' || val === 'center' || val === 'right') {
            formatting.justification = val;
        }
    }
    // Cell spacing
    const tblCellSpacing = findChild(tblPr, 'w', 'tblCellSpacing');
    if (tblCellSpacing) {
        formatting.cellSpacing = parseTableMeasurement(tblCellSpacing);
    }
    // Table indent
    const tblInd = findChild(tblPr, 'w', 'tblInd');
    if (tblInd) {
        formatting.indent = parseTableMeasurement(tblInd);
    }
    // Table borders
    const tblBorders = findChild(tblPr, 'w', 'tblBorders');
    if (tblBorders) {
        formatting.borders = parseTableBorders(tblBorders);
    }
    // Cell margins
    const tblCellMar = findChild(tblPr, 'w', 'tblCellMar');
    if (tblCellMar) {
        formatting.cellMargins = parseCellMargins(tblCellMar);
    }
    // Table layout
    const tblLayout = findChild(tblPr, 'w', 'tblLayout');
    if (tblLayout) {
        const val = getAttribute(tblLayout, 'w', 'type');
        if (val === 'fixed' || val === 'autofit') {
            formatting.layout = val;
        }
    }
    // Table style
    const tblStyle = findChild(tblPr, 'w', 'tblStyle');
    if (tblStyle) {
        const val = getAttribute(tblStyle, 'w', 'val');
        if (val)
            formatting.styleId = val;
    }
    // Table look
    const tblLook = findChild(tblPr, 'w', 'tblLook');
    if (tblLook) {
        formatting.look = parseTableLook(tblLook);
    }
    // Shading
    const shd = findChild(tblPr, 'w', 'shd');
    if (shd) {
        formatting.shading = parseShadingProperties(shd);
    }
    // Bidi
    const bidiVisual = findChild(tblPr, 'w', 'bidiVisual');
    if (bidiVisual)
        formatting.bidi = parseBooleanElement(bidiVisual);
    return Object.keys(formatting).length > 0 ? formatting : undefined;
}
/**
 * Parse table row formatting properties (w:trPr)
 */
function parseTableRowProperties(trPr) {
    if (!trPr)
        return undefined;
    const formatting = {};
    // Row height
    const trHeight = findChild(trPr, 'w', 'trHeight');
    if (trHeight) {
        formatting.height = parseTableMeasurement(trHeight);
        const hRule = getAttribute(trHeight, 'w', 'hRule');
        if (hRule) {
            formatting.heightRule = hRule;
        }
    }
    // Header row
    const tblHeader = findChild(trPr, 'w', 'tblHeader');
    if (tblHeader)
        formatting.header = parseBooleanElement(tblHeader);
    // Can't split
    const cantSplit = findChild(trPr, 'w', 'cantSplit');
    if (cantSplit)
        formatting.cantSplit = parseBooleanElement(cantSplit);
    // Row justification
    const jc = findChild(trPr, 'w', 'jc');
    if (jc) {
        const val = getAttribute(jc, 'w', 'val');
        if (val === 'left' || val === 'center' || val === 'right') {
            formatting.justification = val;
        }
    }
    // Hidden
    const hidden = findChild(trPr, 'w', 'hidden');
    if (hidden)
        formatting.hidden = parseBooleanElement(hidden);
    return Object.keys(formatting).length > 0 ? formatting : undefined;
}
/**
 * Parse table cell formatting properties (w:tcPr)
 */
function parseTableCellProperties(tcPr, _theme) {
    if (!tcPr)
        return undefined;
    const formatting = {};
    // Cell width
    const tcW = findChild(tcPr, 'w', 'tcW');
    if (tcW) {
        formatting.width = parseTableMeasurement(tcW);
    }
    // Cell borders
    const tcBorders = findChild(tcPr, 'w', 'tcBorders');
    if (tcBorders) {
        formatting.borders = parseTableBorders(tcBorders);
    }
    // Cell margins
    const tcMar = findChild(tcPr, 'w', 'tcMar');
    if (tcMar) {
        formatting.margins = parseCellMargins(tcMar);
    }
    // Shading
    const shd = findChild(tcPr, 'w', 'shd');
    if (shd) {
        formatting.shading = parseShadingProperties(shd);
    }
    // Vertical alignment
    const vAlign = findChild(tcPr, 'w', 'vAlign');
    if (vAlign) {
        const val = getAttribute(vAlign, 'w', 'val');
        if (val === 'top' || val === 'center' || val === 'bottom') {
            formatting.verticalAlign = val;
        }
    }
    // Text direction
    const textDirection = findChild(tcPr, 'w', 'textDirection');
    if (textDirection) {
        const val = getAttribute(textDirection, 'w', 'val');
        if (val)
            formatting.textDirection = val;
    }
    // Grid span (horizontal merge)
    const gridSpan = findChild(tcPr, 'w', 'gridSpan');
    if (gridSpan) {
        const val = parseNumericAttribute(gridSpan, 'w', 'val');
        if (val !== undefined)
            formatting.gridSpan = val;
    }
    // Vertical merge
    const vMerge = findChild(tcPr, 'w', 'vMerge');
    if (vMerge) {
        const val = getAttribute(vMerge, 'w', 'val');
        formatting.vMerge = val === 'restart' ? 'restart' : 'continue';
    }
    // Fit text
    const tcFitText = findChild(tcPr, 'w', 'tcFitText');
    if (tcFitText)
        formatting.fitText = parseBooleanElement(tcFitText);
    // No wrap
    const noWrap = findChild(tcPr, 'w', 'noWrap');
    if (noWrap)
        formatting.noWrap = parseBooleanElement(noWrap);
    // Hide mark
    const hideMark = findChild(tcPr, 'w', 'hideMark');
    if (hideMark)
        formatting.hideMark = parseBooleanElement(hideMark);
    return Object.keys(formatting).length > 0 ? formatting : undefined;
}
/**
 * Parse a single style element (w:style)
 */
function parseStyle(styleEl, theme) {
    var _a, _b, _c, _d, _e, _f;
    const style = {
        styleId: (_a = getAttribute(styleEl, 'w', 'styleId')) !== null && _a !== void 0 ? _a : '',
        type: (_b = getAttribute(styleEl, 'w', 'type')) !== null && _b !== void 0 ? _b : 'paragraph',
    };
    // Default flag
    const defaultAttr = getAttribute(styleEl, 'w', 'default');
    if (defaultAttr)
        style.default = defaultAttr === '1' || defaultAttr === 'true';
    // Name
    const nameEl = findChild(styleEl, 'w', 'name');
    if (nameEl) {
        style.name = (_c = getAttribute(nameEl, 'w', 'val')) !== null && _c !== void 0 ? _c : undefined;
    }
    // Based on (inheritance)
    const basedOn = findChild(styleEl, 'w', 'basedOn');
    if (basedOn) {
        style.basedOn = (_d = getAttribute(basedOn, 'w', 'val')) !== null && _d !== void 0 ? _d : undefined;
    }
    // Next style
    const next = findChild(styleEl, 'w', 'next');
    if (next) {
        style.next = (_e = getAttribute(next, 'w', 'val')) !== null && _e !== void 0 ? _e : undefined;
    }
    // Linked style
    const link = findChild(styleEl, 'w', 'link');
    if (link) {
        style.link = (_f = getAttribute(link, 'w', 'val')) !== null && _f !== void 0 ? _f : undefined;
    }
    // UI Priority
    const uiPriority = findChild(styleEl, 'w', 'uiPriority');
    if (uiPriority) {
        const val = parseNumericAttribute(uiPriority, 'w', 'val');
        if (val !== undefined)
            style.uiPriority = val;
    }
    // Hidden/Semi-hidden
    const hidden = findChild(styleEl, 'w', 'hidden');
    if (hidden)
        style.hidden = parseBooleanElement(hidden);
    const semiHidden = findChild(styleEl, 'w', 'semiHidden');
    if (semiHidden)
        style.semiHidden = parseBooleanElement(semiHidden);
    // Unhide when used
    const unhideWhenUsed = findChild(styleEl, 'w', 'unhideWhenUsed');
    if (unhideWhenUsed)
        style.unhideWhenUsed = parseBooleanElement(unhideWhenUsed);
    // Quick format
    const qFormat = findChild(styleEl, 'w', 'qFormat');
    if (qFormat)
        style.qFormat = parseBooleanElement(qFormat);
    // Personal/custom style
    const personal = findChild(styleEl, 'w', 'personal');
    if (personal)
        style.personal = parseBooleanElement(personal);
    // Paragraph properties
    const pPr = findChild(styleEl, 'w', 'pPr');
    if (pPr) {
        style.pPr = parseParagraphProperties(pPr, theme);
    }
    // Run properties
    const rPr = findChild(styleEl, 'w', 'rPr');
    if (rPr) {
        style.rPr = parseRunProperties(rPr, theme);
    }
    // Table properties (for table styles)
    const tblPr = findChild(styleEl, 'w', 'tblPr');
    if (tblPr) {
        style.tblPr = parseTableProperties(tblPr, theme);
    }
    // Table row properties
    const trPr = findChild(styleEl, 'w', 'trPr');
    if (trPr) {
        style.trPr = parseTableRowProperties(trPr);
    }
    // Table cell properties
    const tcPr = findChild(styleEl, 'w', 'tcPr');
    if (tcPr) {
        style.tcPr = parseTableCellProperties(tcPr, theme);
    }
    // Table style conditional formatting (tblStylePr)
    const tblStylePrs = findChildren(styleEl, 'w', 'tblStylePr');
    if (tblStylePrs.length > 0) {
        style.tblStylePr = [];
        for (const tblStylePr of tblStylePrs) {
            const typeAttr = getAttribute(tblStylePr, 'w', 'type');
            if (typeAttr) {
                const conditionalStyle = {
                    type: typeAttr,
                };
                const condPPr = findChild(tblStylePr, 'w', 'pPr');
                if (condPPr)
                    conditionalStyle.pPr = parseParagraphProperties(condPPr, theme);
                const condRPr = findChild(tblStylePr, 'w', 'rPr');
                if (condRPr)
                    conditionalStyle.rPr = parseRunProperties(condRPr, theme);
                const condTblPr = findChild(tblStylePr, 'w', 'tblPr');
                if (condTblPr)
                    conditionalStyle.tblPr = parseTableProperties(condTblPr, theme);
                const condTrPr = findChild(tblStylePr, 'w', 'trPr');
                if (condTrPr)
                    conditionalStyle.trPr = parseTableRowProperties(condTrPr);
                const condTcPr = findChild(tblStylePr, 'w', 'tcPr');
                if (condTcPr)
                    conditionalStyle.tcPr = parseTableCellProperties(condTcPr, theme);
                style.tblStylePr.push(conditionalStyle);
            }
        }
    }
    return style;
}
/**
 * Parse document defaults (w:docDefaults)
 */
function parseDocDefaults(docDefaults, theme) {
    if (!docDefaults)
        return undefined;
    const result = {};
    // Default run properties
    const rPrDefault = findChild(docDefaults, 'w', 'rPrDefault');
    if (rPrDefault) {
        const rPr = findChild(rPrDefault, 'w', 'rPr');
        if (rPr) {
            result.rPr = parseRunProperties(rPr, theme);
        }
    }
    // Default paragraph properties
    const pPrDefault = findChild(docDefaults, 'w', 'pPrDefault');
    if (pPrDefault) {
        const pPr = findChild(pPrDefault, 'w', 'pPr');
        if (pPr) {
            result.pPr = parseParagraphProperties(pPr, theme);
        }
    }
    return result.rPr || result.pPr ? result : undefined;
}
/**
 * Deep merge paragraph formatting (source overrides target)
 */
function mergeParagraphFormatting(target, source) {
    if (!source)
        return target;
    if (!target)
        return source ? Object.assign({}, source) : undefined;
    const result = Object.assign({}, target);
    for (const key of Object.keys(source)) {
        const value = source[key];
        if (value !== undefined) {
            if (key === 'runProperties') {
                result.runProperties = mergeTextFormatting(result.runProperties, source.runProperties);
            }
            else if (key === 'borders' || key === 'numPr' || key === 'frame') {
                const baseValue = result[key];
                const sourceValue = value;
                result[key] = Object.assign(Object.assign({}, (baseValue || {})), (sourceValue || {}));
            }
            else if (key === 'tabs' && Array.isArray(value)) {
                result.tabs = [...value];
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
/**
 * Resolve style inheritance chain
 */
function resolveStyleInheritance(style, styleMap, theme, visited = new Set()) {
    // Prevent circular inheritance
    if (visited.has(style.styleId)) {
        return style;
    }
    visited.add(style.styleId);
    // If no basedOn, return as-is
    if (!style.basedOn) {
        return style;
    }
    // Get parent style
    const parentStyle = styleMap.get(style.basedOn);
    if (!parentStyle) {
        return style;
    }
    // Recursively resolve parent
    const resolvedParent = resolveStyleInheritance(parentStyle, styleMap, theme, visited);
    // Merge parent into this style (this style overrides parent)
    const resolved = Object.assign(Object.assign({}, style), { pPr: mergeParagraphFormatting(resolvedParent.pPr, style.pPr), rPr: mergeTextFormatting(resolvedParent.rPr, style.rPr) });
    // Merge table properties if this is a table style
    if (style.type === 'table') {
        if (resolvedParent.tblPr || style.tblPr) {
            resolved.tblPr = Object.assign(Object.assign({}, (resolvedParent.tblPr || {})), (style.tblPr || {}));
        }
        if (resolvedParent.trPr || style.trPr) {
            resolved.trPr = Object.assign(Object.assign({}, (resolvedParent.trPr || {})), (style.trPr || {}));
        }
        if (resolvedParent.tcPr || style.tcPr) {
            resolved.tcPr = Object.assign(Object.assign({}, (resolvedParent.tcPr || {})), (style.tcPr || {}));
        }
    }
    return resolved;
}
/**
 * Parse styles.xml content
 *
 * @param stylesXml - XML content of styles.xml
 * @param theme - Parsed theme for resolving theme references
 * @returns StyleMap with resolved inheritance
 */
export function parseStyles(stylesXml, theme) {
    const styleMap = new Map();
    try {
        const doc = parseXmlDocument(stylesXml);
        if (!doc) {
            return styleMap;
        }
        // First pass: parse all styles without inheritance resolution
        const styleElements = findChildren(doc, 'w', 'style');
        for (const styleEl of styleElements) {
            const style = parseStyle(styleEl, theme);
            if (style.styleId) {
                styleMap.set(style.styleId, style);
            }
        }
        // Second pass: resolve inheritance
        for (const [styleId, style] of styleMap) {
            const resolved = resolveStyleInheritance(style, styleMap, theme);
            styleMap.set(styleId, resolved);
        }
    }
    catch (error) {
        console.warn('Failed to parse styles:', error);
    }
    return styleMap;
}
/**
 * Parse complete style definitions including docDefaults
 *
 * @param stylesXml - XML content of styles.xml
 * @param theme - Parsed theme for resolving theme references
 * @returns StyleDefinitions with docDefaults and resolved styles
 */
export function parseStyleDefinitions(stylesXml, theme) {
    const result = {
        styles: [],
    };
    try {
        const doc = parseXmlDocument(stylesXml);
        if (!doc) {
            return result;
        }
        // Parse document defaults
        const docDefaultsEl = findChild(doc, 'w', 'docDefaults');
        result.docDefaults = parseDocDefaults(docDefaultsEl, theme);
        // Parse latent styles
        const latentStylesEl = findChild(doc, 'w', 'latentStyles');
        if (latentStylesEl) {
            result.latentStyles = {
                defLockedState: getAttribute(latentStylesEl, 'w', 'defLockedState') === '1',
                defUIPriority: parseNumericAttribute(latentStylesEl, 'w', 'defUIPriority'),
                defSemiHidden: getAttribute(latentStylesEl, 'w', 'defSemiHidden') === '1',
                defUnhideWhenUsed: getAttribute(latentStylesEl, 'w', 'defUnhideWhenUsed') === '1',
                defQFormat: getAttribute(latentStylesEl, 'w', 'defQFormat') === '1',
                count: parseNumericAttribute(latentStylesEl, 'w', 'count'),
            };
        }
        // Parse styles with full inheritance resolution
        const styleMap = parseStyles(stylesXml, theme);
        result.styles = Array.from(styleMap.values());
    }
    catch (error) {
        console.warn('Failed to parse style definitions:', error);
    }
    return result;
}
/**
 * Get the resolved properties for a style
 *
 * @param styleId - Style ID to look up
 * @param styleMap - Style map from parseStyles
 * @returns Resolved style or undefined
 */
export function getResolvedStyle(styleId, styleMap) {
    return styleMap.get(styleId);
}
/**
 * Get the default paragraph style
 */
export function getDefaultParagraphStyle(styleMap) {
    for (const style of styleMap.values()) {
        if (style.type === 'paragraph' && style.default) {
            return style;
        }
    }
    // Fallback to "Normal" style
    return styleMap.get('Normal');
}
/**
 * Get the default character style
 */
export function getDefaultCharacterStyle(styleMap) {
    for (const style of styleMap.values()) {
        if (style.type === 'character' && style.default) {
            return style;
        }
    }
    return undefined;
}
/**
 * Get the default table style.
 *
 * Per ECMA-376 §17.7.4.18 (`<w:default>`), exactly one style of each type may
 * be marked default; tables that do not specify a `w:tblStyle` inherit from
 * that style. The styleId varies by document language ("Normal Table",
 * "TableNormal", "Tabelanormal", etc.) — find it by the parsed `default` flag,
 * not by name.
 */
export function getDefaultTableStyle(styleMap) {
    for (const style of styleMap.values()) {
        if (style.type === 'table' && style.default) {
            return style;
        }
    }
    return undefined;
}
/**
 * Get all styles of a specific type
 */
export function getStylesByType(styleMap, type) {
    const result = [];
    for (const style of styleMap.values()) {
        if (style.type === type) {
            result.push(style);
        }
    }
    return result;
}
//# sourceMappingURL=styleParser.js.map