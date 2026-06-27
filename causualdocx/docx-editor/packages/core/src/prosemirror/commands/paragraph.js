/**
 * Paragraph Formatting Commands — thin re-exports from extension system
 *
 * Alignment, line spacing, indentation, lists, paragraph styles.
 * All implementations live in extensions/; this file re-exports
 * for backward compatibility.
 */
import { singletonManager } from '../schema';
export { getParagraphAlignment, getStyleId, getParagraphTabs, getParagraphBidi, setParagraphAttrsCmd as setParagraphAttrs, } from '../extensions/core/ParagraphExtension';
export { isInList, getListInfo } from '../extensions/features/ListExtension';
// ============================================================================
// COMMANDS — delegated to singleton extension manager
// ============================================================================
const cmds = singletonManager.getCommands();
// Alignment
export function setAlignment(alignment) {
    return cmds.setAlignment(alignment);
}
export const alignLeft = cmds.alignLeft();
export const alignCenter = cmds.alignCenter();
export const alignRight = cmds.alignRight();
export const alignJustify = cmds.alignJustify();
// Line spacing
export function setLineSpacing(value, rule = 'auto') {
    return cmds.setLineSpacing(value, rule);
}
export const singleSpacing = cmds.singleSpacing();
export const oneAndHalfSpacing = cmds.oneAndHalfSpacing();
export const doubleSpacing = cmds.doubleSpacing();
// Indentation
export function increaseIndent(amount = 720) {
    return cmds.increaseIndent(amount);
}
export function decreaseIndent(amount = 720) {
    return cmds.decreaseIndent(amount);
}
export function setIndentLeft(twips) {
    return cmds.setIndentLeft(twips);
}
export function setIndentRight(twips) {
    return cmds.setIndentRight(twips);
}
export function setIndentFirstLine(twips, hanging) {
    return cmds.setIndentFirstLine(twips, hanging);
}
// Lists
export const toggleBulletList = cmds.toggleBulletList();
export const toggleNumberedList = cmds.toggleNumberedList();
export const increaseListLevel = cmds.increaseListLevel();
export const decreaseListLevel = cmds.decreaseListLevel();
export const removeList = cmds.removeList();
// Spacing
export function setSpaceBefore(twips) {
    return cmds.setSpaceBefore(twips);
}
export function setSpaceAfter(twips) {
    return cmds.setSpaceAfter(twips);
}
// Paragraph styles
export function applyStyle(styleId, resolvedAttrs) {
    return cmds.applyStyle(styleId, resolvedAttrs);
}
export const clearStyle = cmds.clearStyle();
// Section breaks
export function insertSectionBreak(breakType) {
    return cmds.insertSectionBreak(breakType);
}
export const removeSectionBreak = cmds.removeSectionBreak();
// Footnote / endnote refs
export function insertFootnote(id) {
    return cmds.insertFootnote(id);
}
export function insertEndnote(id) {
    return cmds.insertEndnote(id);
}
// Horizontal rule — replaceSelectionWith a horizontalRule node.
export const insertHorizontalRule = (state, dispatch) => {
    const nodeType = state.schema.nodes['horizontalRule'];
    if (!nodeType)
        return false;
    if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(nodeType.create()).scrollIntoView());
    }
    return true;
};
// Tab stops
export function addTabStop(position, alignment = 'left', leader = 'none') {
    return cmds.addTabStop(position, alignment, leader);
}
export function removeTabStop(position) {
    return cmds.removeTabStop(position);
}
// Text direction
export const setRtl = cmds.setRtl();
export const setLtr = cmds.setLtr();
// Table of Contents
export const generateTOC = cmds.generateTOC();
//# sourceMappingURL=paragraph.js.map