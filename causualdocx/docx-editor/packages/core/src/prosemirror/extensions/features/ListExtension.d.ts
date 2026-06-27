/**
 * List Extension — list commands + keymaps
 *
 * No schema contribution — lists use paragraph attrs (numPr).
 * Provides: toggle bullet/number, indent/outdent, enter/backspace handling.
 */
import type { EditorState } from 'prosemirror-state';
export declare function isInList(state: EditorState): boolean;
export declare function getListInfo(state: EditorState): {
    numId: number;
    ilvl: number;
} | null;
export declare const ListExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=ListExtension.d.ts.map