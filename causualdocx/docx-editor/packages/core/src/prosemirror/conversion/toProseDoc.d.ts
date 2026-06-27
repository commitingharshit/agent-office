/**
 * Document to ProseMirror Conversion
 *
 * Converts our Document type (from DOCX parsing) to a ProseMirror document.
 * Preserves all formatting attributes for round-trip fidelity.
 *
 * Style Resolution:
 * When styles are provided, paragraph properties are resolved from the style chain:
 * - Document defaults (docDefaults)
 * - Normal style (if no explicit styleId)
 * - Style chain (basedOn inheritance)
 * - Inline properties (highest priority)
 */
import type { Node as PMNode } from 'prosemirror-model';
import type { Document, Paragraph, StyleDefinitions, Table } from '../../types/document';
import type { Theme } from '../../types/document';
/**
 * Options for document conversion
 */
export interface ToProseDocOptions {
    /** Style definitions for resolving paragraph styles */
    styles?: StyleDefinitions;
}
/**
 * Convert a Document to a ProseMirror document
 *
 * @param document - The Document to convert
 * @param options - Conversion options including style definitions
 */
export declare function toProseDoc(document: Document, options?: ToProseDocOptions): PMNode;
/**
 * Convert HeaderFooter content (array of Paragraph/Table blocks) to a ProseMirror document.
 * Used for editing headers/footers in their own ProseMirror editor and for the
 * unified header/footer render pipeline. `theme` must be threaded for themeColor
 * resolution in cell shading (`<w:shd w:themeFill=...>`) — without it, themed
 * fills in HF tables fall back to the unresolved theme key.
 */
export declare function headerFooterToProseDoc(content: Array<Paragraph | Table>, options?: ToProseDocOptions & {
    theme?: Theme | null;
}): PMNode;
/**
 * Convert footnote/endnote content (array of Paragraph/Table blocks) to a
 * ProseMirror document. Mirrors `headerFooterToProseDoc` so footnotes flow
 * through the same body pipeline (toFlowBlocks → measureBlocks →
 * renderFragment) and inherit its block support — paragraph + table + image
 * + textBox + fields. Pre-PR, footnoteLayout's `convertFootnoteToContent`
 * re-implemented run/paragraph conversion by hand and silently dropped
 * tables, images, and fields nested inside a footnote.
 */
export declare function footnoteToProseDoc(content: Array<Paragraph | Table>, options?: ToProseDocOptions & {
    theme?: Theme | null;
}): PMNode;
/**
 * Create an empty ProseMirror document
 */
export declare function createEmptyDoc(): PMNode;
//# sourceMappingURL=toProseDoc.d.ts.map