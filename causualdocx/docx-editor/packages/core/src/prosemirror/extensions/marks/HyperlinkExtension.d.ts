/**
 * Hyperlink Mark Extension
 */
import type { EditorState } from 'prosemirror-state';
export declare function isHyperlinkActive(state: EditorState): boolean;
export declare function getHyperlinkAttrs(state: EditorState): {
    href: string;
    tooltip?: string;
} | null;
export declare function getSelectedText(state: EditorState): string;
export declare const HyperlinkExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
//# sourceMappingURL=HyperlinkExtension.d.ts.map