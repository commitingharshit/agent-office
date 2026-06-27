/**
 * Shared mark utility functions
 *
 * setMark, removeMark, isMarkActive, getMarkAttr, marksToTextFormatting, textFormattingToMarks, clearFormatting
 */
import type { Command, EditorState } from 'prosemirror-state';
import type { MarkType, Mark, Schema } from 'prosemirror-model';
import type { TextFormatting } from '../../../types/document';
type MarkAttrs = Record<string, unknown>;
export declare function setMark(markType: MarkType, attrs: MarkAttrs): Command;
export declare function removeMark(markType: MarkType): Command;
/**
 * Toggle a mark with empty-paragraph defaultTextFormatting persistence.
 *
 * For non-collapsed selections this delegates to the standard
 * addMark/removeMark behaviour. For collapsed cursors it routes through
 * `setMark` / `removeMark` so the paragraph's `defaultTextFormatting`
 * attr stays in sync — the toolbar relies on that attr to light up bold/
 * italic/etc. after the user navigates away from an empty paragraph and
 * comes back.
 */
export declare function toggleMark(markType: MarkType, attrs?: MarkAttrs): Command;
/**
 * Check if a mark is active in the current selection
 */
export declare function isMarkActive(state: EditorState, markType: MarkType, attrs?: Record<string, unknown>): boolean;
/**
 * Get the current value of a mark attribute
 */
export declare function getMarkAttr(state: EditorState, markType: MarkType, attr: string): unknown | null;
/**
 * Convert TextFormatting to marks array (used to restore formatting on empty paragraphs)
 */
export declare function textFormattingToMarks(formatting: TextFormatting, schema: Schema): Mark[];
/**
 * Clear all text formatting (remove all marks)
 */
export declare const clearFormatting: Command;
/**
 * Create a command that sets a mark on the selection
 */
export declare function createSetMarkCommand(markType: MarkType, attrs?: Record<string, unknown>): Command;
/**
 * Create a command that removes a mark from the selection
 */
export declare function createRemoveMarkCommand(markType: MarkType): Command;
export {};
//# sourceMappingURL=markUtils.d.ts.map