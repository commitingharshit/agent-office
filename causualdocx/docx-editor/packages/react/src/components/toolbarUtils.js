/**
 * Toolbar Utility Functions
 *
 * Pure utility functions for formatting state extraction and action application.
 * Extracted from Toolbar.tsx to reduce file size.
 */
import { resolveColorToHex } from '@eigenpal/docx-core/utils';
import { pointsToHalfPoints } from './ui/FontSizePicker';
import { createDefaultListState } from './ui/ListButtons';
// ============================================================================
// HIGHLIGHT COLOR MAPPING
// ============================================================================
/**
 * Map hex color to OOXML highlight color name
 * OOXML uses named colors for highlights (yellow, green, cyan, etc.)
 */
const HIGHLIGHT_HEX_TO_NAME = {
    FFFF00: 'yellow',
    '00FF00': 'green',
    '00FFFF': 'cyan',
    FF00FF: 'magenta',
    '0000FF': 'blue',
    FF0000: 'red',
    '00008B': 'darkBlue',
    '008080': 'darkCyan',
    '008000': 'darkGreen',
    '800080': 'darkMagenta',
    '8B0000': 'darkRed',
    '808000': 'darkYellow',
    '808080': 'darkGray',
    C0C0C0: 'lightGray',
    '000000': 'black',
    FFFFFF: 'white',
};
export function mapHexToHighlightName(hex) {
    const normalized = hex.replace(/^#/, '').toUpperCase();
    return HIGHLIGHT_HEX_TO_NAME[normalized] || null;
}
// ============================================================================
// FORMATTING STATE EXTRACTION
// ============================================================================
/**
 * Extract formatting state from TextFormatting and ParagraphFormatting objects
 */
export function getSelectionFormatting(formatting, paragraphFormatting, theme) {
    var _a, _b, _c, _d;
    const result = {};
    if (formatting) {
        result.bold = formatting.bold;
        result.italic = formatting.italic;
        result.underline =
            ((_a = formatting.underline) === null || _a === void 0 ? void 0 : _a.style) !== 'none' && ((_b = formatting.underline) === null || _b === void 0 ? void 0 : _b.style) !== undefined;
        result.strike = formatting.strike;
        result.superscript = formatting.vertAlign === 'superscript';
        result.subscript = formatting.vertAlign === 'subscript';
        result.fontFamily = ((_c = formatting.fontFamily) === null || _c === void 0 ? void 0 : _c.ascii) || ((_d = formatting.fontFamily) === null || _d === void 0 ? void 0 : _d.hAnsi);
        result.fontSize = formatting.fontSize;
        const colorHex = resolveColorToHex(formatting.color, theme);
        result.color = colorHex ? `#${colorHex}` : undefined;
        result.highlight = formatting.highlight !== 'none' ? formatting.highlight : undefined;
    }
    if (paragraphFormatting) {
        result.alignment = paragraphFormatting.alignment;
        if (paragraphFormatting.lineSpacing !== undefined) {
            result.lineSpacing = paragraphFormatting.lineSpacing;
        }
        if (paragraphFormatting.styleId) {
            result.styleId = paragraphFormatting.styleId;
        }
        if (paragraphFormatting.numPr) {
            const { numId, ilvl } = paragraphFormatting.numPr;
            const isBullet = numId === 1;
            result.listState = {
                type: isBullet ? 'bullet' : 'numbered',
                level: ilvl !== null && ilvl !== void 0 ? ilvl : 0,
                isInList: true,
                numId,
            };
        }
        else {
            result.listState = createDefaultListState();
        }
    }
    return result;
}
// ============================================================================
// FORMATTING ACTION APPLICATION
// ============================================================================
/**
 * Apply a formatting action to existing formatting, returning new formatting
 */
export function applyFormattingAction(currentFormatting, action) {
    var _a;
    const newFormatting = Object.assign({}, currentFormatting);
    if (typeof action === 'object') {
        switch (action.type) {
            case 'fontFamily':
                newFormatting.fontFamily = Object.assign(Object.assign({}, currentFormatting.fontFamily), { ascii: action.value, hAnsi: action.value });
                return newFormatting;
            case 'fontSize':
                newFormatting.fontSize = pointsToHalfPoints(action.value);
                return newFormatting;
            case 'textColor': {
                const val = action.value;
                if (typeof val === 'string') {
                    newFormatting.color = { rgb: val.replace(/^#/, '').toUpperCase() };
                }
                else if (val.auto) {
                    newFormatting.color = undefined;
                }
                else {
                    newFormatting.color = val;
                }
                return newFormatting;
            }
            case 'highlightColor':
                if (action.value === '' || action.value === 'none') {
                    newFormatting.highlight = 'none';
                }
                else {
                    newFormatting.highlight = (mapHexToHighlightName(action.value) ||
                        'yellow');
                }
                return newFormatting;
        }
    }
    switch (action) {
        case 'bold':
            newFormatting.bold = !currentFormatting.bold;
            break;
        case 'italic':
            newFormatting.italic = !currentFormatting.italic;
            break;
        case 'underline':
            if (((_a = currentFormatting.underline) === null || _a === void 0 ? void 0 : _a.style) && currentFormatting.underline.style !== 'none') {
                newFormatting.underline = undefined;
            }
            else {
                newFormatting.underline = { style: 'single' };
            }
            break;
        case 'strikethrough':
            newFormatting.strike = !currentFormatting.strike;
            break;
        case 'superscript':
            newFormatting.vertAlign =
                currentFormatting.vertAlign === 'superscript' ? 'baseline' : 'superscript';
            break;
        case 'subscript':
            newFormatting.vertAlign =
                currentFormatting.vertAlign === 'subscript' ? 'baseline' : 'subscript';
            break;
        case 'clearFormatting':
            return {};
    }
    return newFormatting;
}
/**
 * Check if formatting has any active styles
 */
export function hasActiveFormatting(formatting) {
    if (!formatting)
        return false;
    return !!(formatting.bold ||
        formatting.italic ||
        formatting.underline ||
        formatting.strike ||
        formatting.superscript ||
        formatting.subscript);
}
//# sourceMappingURL=toolbarUtils.js.map