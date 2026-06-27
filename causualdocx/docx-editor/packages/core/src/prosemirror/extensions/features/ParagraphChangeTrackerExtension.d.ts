/**
 * Paragraph Change Tracker Extension
 *
 * Watches ProseMirror transactions and records which paragraph IDs (paraId)
 * were modified. Also detects structural changes (paragraphs added/deleted).
 * Used by the selective save system to patch only changed paragraphs in document.xml.
 */
import { PluginKey, type EditorState, type Transaction } from 'prosemirror-state';
export declare const paragraphChangeTrackerKey: PluginKey<ParagraphChangeTrackerState>;
export interface ParagraphChangeTrackerState {
    /** Set of paraIds that were modified since last clear */
    changedParaIds: Set<string>;
    /** Whether paragraphs were added or deleted (structural change) */
    structuralChange: boolean;
    /** Whether any edited paragraph lacked a paraId */
    hasUntrackedChanges: boolean;
    /** Cached paragraph count to avoid full doc traversal on every transaction */
    paragraphCount: number;
    /**
     * Block-level node-type names that changed in this transaction sequence,
     * excluding `paragraph` (which goes through `changedParaIds`). Captures
     * `textBox`, `image`, `shape`, `table`, etc. so consumers that key
     * selective-save / autosave on `changedParaIds` know a drawing was
     * touched and force a full re-serialise. Without this, a transaction
     * that only inserts/moves an image lands with an empty `changedParaIds`
     * set and the .docx round-trip silently drops the new node.
     */
    changedBlockTypes: Set<string>;
}
/**
 * Get the change tracker state from an EditorState
 */
export declare function getChangeTrackerState(state: EditorState): ParagraphChangeTrackerState | undefined;
/**
 * Get the set of changed paragraph IDs from an EditorState
 */
export declare function getChangedParagraphIds(state: EditorState): Set<string>;
/**
 * Check if structural changes (paragraph add/delete) occurred
 */
export declare function hasStructuralChanges(state: EditorState): boolean;
/**
 * Check if any changes affected paragraphs without paraId
 */
export declare function hasUntrackedChanges(state: EditorState): boolean;
/**
 * Get the set of non-paragraph block-level node types that changed.
 * Returns names like `textBox`, `image`, `shape`, `table`, etc.
 *
 * Selective save / autosave pipelines that previously keyed only on
 * `changedParaIds` were silently dropping drawing edits — a transaction
 * that inserts an image touches no paragraphs and produced an empty
 * paraId set. Use this getter (or `hasNonParagraphBlockChanges`) to
 * force a full re-serialise when a drawing changed.
 */
export declare function getChangedBlockTypes(state: EditorState): Set<string>;
/**
 * True if any block-level node other than a paragraph changed in the
 * tracked window. Drawings (textBox, image, shape), tables, page-breaks,
 * structured document tags, math nodes, etc. all surface here.
 *
 * Recommended use: combine with `getChangedParagraphIds` to decide
 * "selective save (only paragraphs)" vs "full save (drawings touched)".
 */
export declare function hasNonParagraphBlockChanges(state: EditorState): boolean;
/**
 * Create a transaction that clears the change tracker
 */
export declare function clearTrackedChanges(state: EditorState): Transaction;
export declare const ParagraphChangeTrackerExtension: (options?: Partial<{}> | undefined) => import("../types").Extension;
//# sourceMappingURL=ParagraphChangeTrackerExtension.d.ts.map