/**
 * Accessibility checker — read-only analyzer over a ProseMirror document.
 *
 * Surfaces two classes of issue that screen readers + assistive tech care
 * about and that the user can fix in the editor:
 *
 *   - `missing-alt`: an `image` node whose `alt` attr is empty/null.
 *   - `heading-jump`: heading levels that skip a level in document order
 *     (e.g. H1 → H3 with no H2 between). Outline order matters for
 *     navigation.
 *
 * No schema changes; this is purely a walk over the current PM doc. The
 * dialog calls it on open and renders the results.
 */
import type { Node as PMNode } from 'prosemirror-model';
export type AccessibilityIssue = {
    kind: 'missing-alt';
    /** PM position of the image node — used to jump the caret to it. */
    pmPos: number;
} | {
    kind: 'heading-jump';
    /** PM position of the heading paragraph that jumps. */
    pmPos: number;
    /** The previous heading's level, 1-indexed (e.g. 1 for H1). */
    previousLevel: number;
    /** This heading's level, 1-indexed (e.g. 3 for H3). */
    level: number;
    /** Text of the heading, for display in the issue list. */
    text: string;
};
export declare function checkAccessibility(doc: PMNode): AccessibilityIssue[];
//# sourceMappingURL=accessibilityCheck.d.ts.map