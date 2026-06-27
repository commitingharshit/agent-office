/**
 * Selection Tracker Plugin
 *
 * Tracks selection changes and emits events for toolbar state updates.
 * Provides the current selection context including:
 * - Text formatting at cursor/selection
 * - Paragraph formatting
 * - Selection range information
 */
import { Plugin, PluginKey, type EditorState } from 'prosemirror-state';
import type { TextFormatting, ParagraphFormatting } from '../../types/document';
/**
 * Selection context for toolbar state
 */
export interface SelectionContext {
    /** Whether there's a non-collapsed selection */
    hasSelection: boolean;
    /** Whether selection spans multiple paragraphs */
    isMultiParagraph: boolean;
    /** Current text formatting at cursor/selection */
    textFormatting: TextFormatting;
    /** Current paragraph formatting */
    paragraphFormatting: ParagraphFormatting;
    /** Start paragraph index */
    startParagraphIndex: number;
    /** End paragraph index */
    endParagraphIndex: number;
    /** Whether cursor is in a list */
    inList: boolean;
    /** List type if in list */
    listType?: 'bullet' | 'numbered';
    /** List level (0-8) */
    listLevel?: number;
    /** Active comment IDs at cursor position */
    activeCommentIds: number[];
    /** Whether cursor is inside a tracked insertion */
    inInsertion: boolean;
    /** Whether cursor is inside a tracked deletion */
    inDeletion: boolean;
}
/**
 * Plugin key for accessing selection tracker state
 */
export declare const selectionTrackerKey: PluginKey<SelectionContext>;
/**
 * Callback type for selection changes
 */
export type SelectionChangeCallback = (context: SelectionContext) => void;
/**
 * Extract selection context from editor state
 */
export declare function extractSelectionContext(state: EditorState): SelectionContext;
/**
 * Create selection tracker plugin
 */
export declare function createSelectionTrackerPlugin(onSelectionChange?: SelectionChangeCallback): Plugin;
/**
 * Get current selection context from editor state
 */
export declare function getSelectionContext(state: EditorState): SelectionContext | null;
//# sourceMappingURL=selectionTracker.d.ts.map