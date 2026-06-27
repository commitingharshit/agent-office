import type { Node as PMNode } from 'prosemirror-model';
/**
 * Information about a heading found in the document.
 */
export interface HeadingInfo {
    /** The text content of the heading */
    text: string;
    /** Outline level (0 = Heading 1, 1 = Heading 2, etc.) */
    level: number;
    /** ProseMirror document position of the paragraph node */
    pmPos: number;
}
/**
 * Collect all headings from a ProseMirror document.
 *
 * Detection logic:
 * 1. Check `outlineLevel` attr (set by OOXML parsing or style resolution)
 * 2. Fallback to `styleId` matching /^[Hh]eading(\d)$/
 */
export declare function collectHeadings(doc: PMNode): HeadingInfo[];
//# sourceMappingURL=headingCollector.d.ts.map