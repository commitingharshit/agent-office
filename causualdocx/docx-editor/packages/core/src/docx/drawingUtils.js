/**
 * Shared DrawingML Parsing Utilities
 *
 * Common functions used by imageParser, textBoxParser, and shapeParser
 * for parsing DrawingML elements (positions, wrapping, colors, fills, outlines).
 */
import { getChildElements, getAttribute, getTextContent, parseNumericAttribute, findByFullName, } from './xmlParser';
// ============================================================================
// COLOR PARSING
// ============================================================================
/**
 * Map OOXML scheme names to standard theme color slots.
 * Used when parsing a:schemeClr elements in DrawingML.
 */
const SCHEME_TO_THEME_COLOR = {
    accent1: 'accent1',
    accent2: 'accent2',
    accent3: 'accent3',
    accent4: 'accent4',
    accent5: 'accent5',
    accent6: 'accent6',
    dk1: 'dk1',
    lt1: 'lt1',
    dk2: 'dk2',
    lt2: 'lt2',
    tx1: 'text1',
    tx2: 'text2',
    bg1: 'background1',
    bg2: 'background2',
    hlink: 'hlink',
    folHlink: 'folHlink',
};
/**
 * Common preset color names to RGB hex values.
 */
const PRESET_COLORS = {
    black: '000000',
    white: 'FFFFFF',
    red: 'FF0000',
    green: '00FF00',
    blue: '0000FF',
    yellow: 'FFFF00',
    cyan: '00FFFF',
    magenta: 'FF00FF',
};
/**
 * Apply color modifiers (shade, tint) from child elements of a color element.
 * Converts DrawingML 100000ths-scale values to hex (0-FF) for OOXML compatibility.
 */
function applyColorModifiers(color, element) {
    const children = getChildElements(element);
    const shade = children.find((el) => el.name === 'a:shade');
    if (shade) {
        const val = getAttribute(shade, null, 'val');
        if (val) {
            color.themeShade = Math.round((parseInt(val, 10) / 100000) * 255)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase();
        }
    }
    const tint = children.find((el) => el.name === 'a:tint');
    if (tint) {
        const val = getAttribute(tint, null, 'val');
        if (val) {
            color.themeTint = Math.round((parseInt(val, 10) / 100000) * 255)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase();
        }
    }
    // a:lumMod / a:lumOff — DrawingML luminance modulation/offset, expressed in
    // thousandths of a percent (e.g. val="85000" = 85%). Ubiquitous in modern
    // Office themes for subtle gray borders/fills/text (e.g. bg1 + lumMod 85% =
    // a light-gray rule). Stored as fractions 0-1 and applied in HSL space by
    // the color resolver.
    const lumMod = children.find((el) => el.name === 'a:lumMod');
    if (lumMod) {
        const val = getAttribute(lumMod, null, 'val');
        if (val)
            color.themeLumMod = parseInt(val, 10) / 100000;
    }
    const lumOff = children.find((el) => el.name === 'a:lumOff');
    if (lumOff) {
        const val = getAttribute(lumOff, null, 'val');
        if (val)
            color.themeLumOff = parseInt(val, 10) / 100000;
    }
    return color;
}
/**
 * Parse a color value from a DrawingML element.
 * Handles: a:srgbClr, a:schemeClr, a:sysClr, a:prstClr
 * Applies shade/tint modifiers when present.
 */
export function parseColorElement(element) {
    var _a;
    if (!element)
        return undefined;
    const children = getChildElements(element);
    // sRGB color: a:srgbClr[@val]
    const srgbClr = children.find((el) => el.name === 'a:srgbClr');
    if (srgbClr) {
        const val = getAttribute(srgbClr, null, 'val');
        if (val) {
            return applyColorModifiers({ rgb: val }, srgbClr);
        }
    }
    // Scheme color (theme): a:schemeClr[@val]
    const schemeClr = children.find((el) => el.name === 'a:schemeClr');
    if (schemeClr) {
        const val = getAttribute(schemeClr, null, 'val');
        if (val) {
            const color = {
                themeColor: (_a = SCHEME_TO_THEME_COLOR[val]) !== null && _a !== void 0 ? _a : 'dk1',
            };
            return applyColorModifiers(color, schemeClr);
        }
    }
    // System color: a:sysClr[@lastClr]
    const sysClr = children.find((el) => el.name === 'a:sysClr');
    if (sysClr) {
        const lastClr = getAttribute(sysClr, null, 'lastClr');
        return { rgb: lastClr !== null && lastClr !== void 0 ? lastClr : '000000' };
    }
    // Preset color: a:prstClr[@val]
    const prstClr = children.find((el) => el.name === 'a:prstClr');
    if (prstClr) {
        const val = getAttribute(prstClr, null, 'val');
        if (val && PRESET_COLORS[val]) {
            return { rgb: PRESET_COLORS[val] };
        }
    }
    return undefined;
}
// ============================================================================
// FILL & OUTLINE PARSING
// ============================================================================
/**
 * Parse fill from shape properties (a:solidFill, a:noFill, a:gradFill).
 */
export function parseFill(spPr) {
    if (!spPr)
        return undefined;
    const children = getChildElements(spPr);
    if (children.find((el) => el.name === 'a:noFill')) {
        return { type: 'none' };
    }
    const solidFill = children.find((el) => el.name === 'a:solidFill');
    if (solidFill) {
        return { type: 'solid', color: parseColorElement(solidFill) };
    }
    if (children.find((el) => el.name === 'a:gradFill')) {
        return { type: 'gradient' };
    }
    return undefined;
}
/**
 * Parse outline from shape properties (a:ln).
 */
export function parseOutline(spPr) {
    const ln = spPr ? findByFullName(spPr, 'a:ln') : null;
    if (!ln)
        return undefined;
    const children = getChildElements(ln);
    if (children.find((el) => el.name === 'a:noFill')) {
        return undefined;
    }
    const outline = {};
    const w = getAttribute(ln, null, 'w');
    if (w)
        outline.width = parseInt(w, 10);
    const solidFill = children.find((el) => el.name === 'a:solidFill');
    if (solidFill)
        outline.color = parseColorElement(solidFill);
    const prstDash = children.find((el) => el.name === 'a:prstDash');
    if (prstDash) {
        const val = getAttribute(prstDash, null, 'val');
        if (val)
            outline.style = val;
    }
    return outline;
}
// ============================================================================
// POSITION PARSING
// ============================================================================
/**
 * Parse horizontal position from wp:positionH element.
 */
export function parsePositionH(posH) {
    var _a;
    if (!posH)
        return undefined;
    const relativeTo = (_a = getAttribute(posH, null, 'relativeFrom')) !== null && _a !== void 0 ? _a : 'column';
    const alignEl = findByFullName(posH, 'wp:align');
    if (alignEl) {
        const text = getTextContent(alignEl);
        return {
            relativeTo: relativeTo,
            alignment: text,
        };
    }
    const posOffsetEl = findByFullName(posH, 'wp:posOffset');
    if (posOffsetEl) {
        const text = getTextContent(posOffsetEl);
        const posOffset = parseInt(text, 10);
        return {
            relativeTo: relativeTo,
            posOffset: isNaN(posOffset) ? 0 : posOffset,
        };
    }
    return {
        relativeTo: relativeTo,
    };
}
/**
 * Parse vertical position from wp:positionV element.
 */
export function parsePositionV(posV) {
    var _a;
    if (!posV)
        return undefined;
    const relativeTo = (_a = getAttribute(posV, null, 'relativeFrom')) !== null && _a !== void 0 ? _a : 'paragraph';
    const alignEl = findByFullName(posV, 'wp:align');
    if (alignEl) {
        const text = getTextContent(alignEl);
        return {
            relativeTo: relativeTo,
            alignment: text,
        };
    }
    const posOffsetEl = findByFullName(posV, 'wp:posOffset');
    if (posOffsetEl) {
        const text = getTextContent(posOffsetEl);
        const posOffset = parseInt(text, 10);
        return {
            relativeTo: relativeTo,
            posOffset: isNaN(posOffset) ? 0 : posOffset,
        };
    }
    return {
        relativeTo: relativeTo,
    };
}
/**
 * Parse position for anchored drawings (combines positionH + positionV).
 */
export function parseAnchorPosition(anchor) {
    var _a, _b;
    const positionH = findByFullName(anchor, 'wp:positionH');
    const positionV = findByFullName(anchor, 'wp:positionV');
    if (!positionH && !positionV)
        return undefined;
    return {
        horizontal: (_a = parsePositionH(positionH)) !== null && _a !== void 0 ? _a : { relativeTo: 'column' },
        vertical: (_b = parsePositionV(positionV)) !== null && _b !== void 0 ? _b : { relativeTo: 'paragraph' },
    };
}
// ============================================================================
// WRAP PARSING
// ============================================================================
/** Known wrap element names */
export const WRAP_ELEMENT_NAMES = [
    'wp:wrapNone',
    'wp:wrapSquare',
    'wp:wrapTight',
    'wp:wrapThrough',
    'wp:wrapTopAndBottom',
];
/**
 * Parse wrap settings from a wrap element.
 *
 * Distance attributes (distT/distB/distL/distR) can appear on both
 * the anchor element and the wrap child. Wrap child values take priority;
 * anchor-level values are used as fallbacks.
 */
export function parseWrapElement(wrapEl, behindDoc, anchorDistances) {
    var _a, _b, _c, _d;
    if (!wrapEl) {
        const wrap = { type: behindDoc ? 'behind' : 'inFront' };
        if ((anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distT) !== undefined)
            wrap.distT = anchorDistances.distT;
        if ((anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distB) !== undefined)
            wrap.distB = anchorDistances.distB;
        if ((anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distL) !== undefined)
            wrap.distL = anchorDistances.distL;
        if ((anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distR) !== undefined)
            wrap.distR = anchorDistances.distR;
        return wrap;
    }
    const wrapName = wrapEl.name || '';
    const wrapType = wrapName.replace('wp:', '');
    let type;
    switch (wrapType) {
        case 'wrapNone':
            type = behindDoc ? 'behind' : 'inFront';
            break;
        case 'wrapSquare':
            type = 'square';
            break;
        case 'wrapTight':
            type = 'tight';
            break;
        case 'wrapThrough':
            type = 'through';
            break;
        case 'wrapTopAndBottom':
            type = 'topAndBottom';
            break;
        default:
            type = 'square';
    }
    const wrap = { type };
    const wrapText = getAttribute(wrapEl, null, 'wrapText');
    if (wrapText)
        wrap.wrapText = wrapText;
    // Wrap child distances take priority, then anchor-level
    const distT = (_a = parseNumericAttribute(wrapEl, null, 'distT')) !== null && _a !== void 0 ? _a : anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distT;
    const distB = (_b = parseNumericAttribute(wrapEl, null, 'distB')) !== null && _b !== void 0 ? _b : anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distB;
    const distL = (_c = parseNumericAttribute(wrapEl, null, 'distL')) !== null && _c !== void 0 ? _c : anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distL;
    const distR = (_d = parseNumericAttribute(wrapEl, null, 'distR')) !== null && _d !== void 0 ? _d : anchorDistances === null || anchorDistances === void 0 ? void 0 : anchorDistances.distR;
    if (distT !== undefined)
        wrap.distT = distT;
    if (distB !== undefined)
        wrap.distB = distB;
    if (distL !== undefined)
        wrap.distL = distL;
    if (distR !== undefined)
        wrap.distR = distR;
    return wrap;
}
/**
 * Parse wrap from an anchor element (finds wrap child internally).
 */
export function parseAnchorWrap(anchor) {
    var _a, _b, _c, _d;
    const children = getChildElements(anchor);
    const behindDoc = getAttribute(anchor, null, 'behindDoc') === '1';
    const wrapEl = children.find((el) => { var _a; return WRAP_ELEMENT_NAMES.includes((_a = el.name) !== null && _a !== void 0 ? _a : ''); });
    // Read anchor-level distance fallbacks
    const anchorDistances = {
        distT: (_a = parseNumericAttribute(anchor, null, 'distT')) !== null && _a !== void 0 ? _a : undefined,
        distB: (_b = parseNumericAttribute(anchor, null, 'distB')) !== null && _b !== void 0 ? _b : undefined,
        distL: (_c = parseNumericAttribute(anchor, null, 'distL')) !== null && _c !== void 0 ? _c : undefined,
        distR: (_d = parseNumericAttribute(anchor, null, 'distR')) !== null && _d !== void 0 ? _d : undefined,
    };
    return parseWrapElement(wrapEl !== null && wrapEl !== void 0 ? wrapEl : null, behindDoc, anchorDistances);
}
// ============================================================================
// COLOR RESOLUTION (for shapes/text boxes without theme context)
// ============================================================================
/**
 * Default theme color fallbacks (Office 2016 defaults).
 * Used when resolving theme colors without a Theme object.
 */
const DEFAULT_THEME_COLOR_HEX = {
    accent1: '5B9BD5',
    accent2: 'ED7D31',
    accent3: 'A5A5A5',
    accent4: 'FFC000',
    accent5: '4472C4',
    accent6: '70AD47',
    dk1: '000000',
    lt1: 'FFFFFF',
    dk2: '1F497D',
    lt2: 'EEECE1',
    text1: '000000',
    text2: '1F497D',
    background1: 'FFFFFF',
    background2: 'EEECE1',
    hlink: '0563C1',
    folHlink: '954F72',
};
/**
 * Resolve a ColorValue to a CSS hex string using default theme colors.
 * For use when no Theme object is available (e.g., shape/text box parsing).
 */
export function resolveColorValueToHex(color) {
    var _a;
    if (!color)
        return undefined;
    if (color.rgb)
        return `#${color.rgb}`;
    if (color.themeColor) {
        return `#${(_a = DEFAULT_THEME_COLOR_HEX[color.themeColor]) !== null && _a !== void 0 ? _a : '000000'}`;
    }
    return undefined;
}
//# sourceMappingURL=drawingUtils.js.map