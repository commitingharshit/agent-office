/**
 * Text Formatting Commands — thin re-exports from extension system
 *
 * Toggle marks, set marks, clear formatting, hyperlinks.
 * All implementations live in extensions/marks/; this file re-exports
 * for backward compatibility.
 */
import { singletonManager, schema } from '../schema';
// Utility re-exports from markUtils (used by toolbar, conversion, etc.)
export { isMarkActive, getMarkAttr, clearFormatting, createSetMarkCommand, createRemoveMarkCommand, } from '../extensions/marks/markUtils';
// Hyperlink query helpers (used by toolbar)
export { isHyperlinkActive, getHyperlinkAttrs, getSelectedText, } from '../extensions/marks/HyperlinkExtension';
// ============================================================================
// PARAGRAPH DEFAULT FORMATTING HELPERS
// ============================================================================
/**
 * textFormattingToMarks — wraps markUtils version to use singleton schema
 */
import { textFormattingToMarks as _textFormattingToMarks } from '../extensions/marks/markUtils';
export function textFormattingToMarks(formatting) {
    return _textFormattingToMarks(formatting, schema);
}
// ============================================================================
// COMMANDS — delegated to singleton extension manager
// ============================================================================
const cmds = singletonManager.getCommands();
// Toggle marks (simple on/off)
export const toggleBold = cmds.toggleBold();
export const toggleItalic = cmds.toggleItalic();
export const toggleUnderline = cmds.toggleUnderline();
export const toggleStrike = cmds.toggleStrike();
export const toggleSuperscript = cmds.toggleSuperscript();
export const toggleSubscript = cmds.toggleSubscript();
// Set marks (with attributes)
export function setTextColor(attrs) {
    return cmds.setTextColor(attrs);
}
export const clearTextColor = cmds.clearTextColor();
export function setHighlight(color) {
    return cmds.setHighlight(color);
}
export const clearHighlight = cmds.clearHighlight();
export function setFontSize(size) {
    return cmds.setFontSize(size);
}
export const clearFontSize = cmds.clearFontSize();
export function setFontFamily(fontName) {
    return cmds.setFontFamily(fontName);
}
export const clearFontFamily = cmds.clearFontFamily();
export function setUnderlineStyle(style, color) {
    return cmds.setUnderlineStyle(style, color);
}
// Character styling — smallCaps, allCaps, characterSpacing
// These marks have no dedicated commands in the extension yet; drive them via
// the generic toggleMark / createSetMarkCommand / createRemoveMarkCommand helpers.
import { toggleMark, createSetMarkCommand, createRemoveMarkCommand, } from '../extensions/marks/markUtils';
export const toggleSmallCaps = (state, dispatch, view) => {
    const markType = state.schema.marks['smallCaps'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
export const toggleAllCaps = (state, dispatch, view) => {
    const markType = state.schema.marks['allCaps'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
/**
 * Toggle the `hidden` mark (w:vanish in OOXML) on the selection.
 * Hidden text remains in the document — visible in the editor as
 * dimmed + dotted-underline per HiddenExtension.toDOM — but is
 * conditionally suppressed by Word on print/export.
 */
export const toggleHidden = (state, dispatch, view) => {
    const markType = state.schema.marks['hidden'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
// Text effects — emboss / imprint / textShadow / textOutline. Each
// wraps the matching schema mark provided by TextEffectsExtensions.ts.
// The visual effect is CSS-driven (text-shadow, text-stroke); OOXML
// round-trip is handled by the existing parser/serializer pair.
export const toggleEmboss = (state, dispatch, view) => {
    const markType = state.schema.marks['emboss'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
export const toggleImprint = (state, dispatch, view) => {
    const markType = state.schema.marks['imprint'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
export const toggleTextShadow = (state, dispatch, view) => {
    const markType = state.schema.marks['textShadow'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
export const toggleTextOutline = (state, dispatch, view) => {
    const markType = state.schema.marks['textOutline'];
    if (!markType)
        return false;
    return toggleMark(markType)(state, dispatch, view);
};
/** Set character spacing (letter-spacing) in twips. Pass 0 to remove. */
export function setCharacterSpacing(spacingTwips) {
    return (state, dispatch, view) => {
        const markType = state.schema.marks['characterSpacing'];
        if (!markType)
            return false;
        if (spacingTwips === 0) {
            return createRemoveMarkCommand(markType)(state, dispatch, view);
        }
        return createSetMarkCommand(markType, { spacing: spacingTwips })(state, dispatch, view);
    };
}
export function setCharacterAttrs(attrs) {
    return (state, dispatch, view) => {
        const markType = state.schema.marks['characterSpacing'];
        if (!markType)
            return false;
        const allEmpty = attrs.spacing == null &&
            attrs.position == null &&
            attrs.scale == null &&
            attrs.kerning == null;
        if (allEmpty) {
            return createRemoveMarkCommand(markType)(state, dispatch, view);
        }
        return createSetMarkCommand(markType, attrs)(state, dispatch, view);
    };
}
// Hyperlink commands
export function setHyperlink(href, tooltip) {
    return cmds.setHyperlink(href, tooltip);
}
export const removeHyperlink = cmds.removeHyperlink();
export function insertHyperlink(text, href, tooltip) {
    return cmds.insertHyperlink(text, href, tooltip);
}
//# sourceMappingURL=formatting.js.map