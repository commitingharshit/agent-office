/**
 * Paragraph Extension — paragraph node with alignment, spacing, indent, style commands
 *
 * Moves:
 * - NodeSpec from nodes.ts (paragraph, ParagraphAttrs, paragraphAttrsToDOMStyle, getListClass helpers)
 * - Commands from paragraph.ts (alignment, spacing, indent, style)
 */
import type { Command, EditorState } from 'prosemirror-state';
import type { ParagraphAlignment, ParagraphFormatting, TextFormatting, TabStop } from '../../../types/document';
import type { ParagraphAttrs } from '../../schema/nodes';
/**
 * Extract paragraph-level attributes from a pasted HTML <p> element's inline styles.
 * Used by parseDOM to preserve formatting from external apps (Google Docs, Word Online, etc.).
 *
 * @internal — exported for unit tests in `__tests__/paste-paragraph-styles.test.ts`.
 */
export declare function extractParagraphAttrsFromStyle(element: HTMLElement): Partial<ParagraphAttrs>;
export declare function setParagraphAttrsCmd(attrs: Record<string, unknown>): Command;
export interface ResolvedStyleAttrs {
    paragraphFormatting?: ParagraphFormatting;
    runFormatting?: TextFormatting;
}
export declare function getParagraphAlignment(state: EditorState): ParagraphAlignment | null;
export declare function getParagraphTabs(state: EditorState): TabStop[] | null;
export declare function getStyleId(state: EditorState): string | null;
export declare function getParagraphBidi(state: EditorState): boolean;
export declare const ParagraphExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
//# sourceMappingURL=ParagraphExtension.d.ts.map