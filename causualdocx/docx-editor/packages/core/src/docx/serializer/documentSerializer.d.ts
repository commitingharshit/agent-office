/**
 * Document Serializer - Serialize complete document.xml
 *
 * Converts Document objects back to valid document.xml OOXML format.
 * Combines all content (paragraphs, tables) with section properties
 * and proper namespace declarations.
 *
 * OOXML Reference:
 * - Document root: w:document
 * - Document body: w:body
 * - Section properties: w:sectPr
 */
import type { Document, DocumentBody, SectionProperties, BorderSpec } from '../../types/document';
/**
 * Serialize a border element
 */
export declare function serializeBorder(border: BorderSpec | undefined, elementName: string): string;
/**
 * Serialize section properties (w:sectPr)
 */
export declare function serializeSectionProperties(props: SectionProperties | undefined): string;
/**
 * Serialize a DocumentBody to document.xml body content
 *
 * @param body - The document body to serialize
 * @returns XML string for the body element (without body tags)
 */
export declare function serializeDocumentBody(body: DocumentBody): string;
/**
 * Serialize a complete Document to valid document.xml
 *
 * @param doc - The document to serialize
 * @returns Complete XML string for document.xml
 */
export declare function serializeDocument(doc: Document): string;
/**
 * Serialize just the document body (useful for partial updates)
 *
 * @param body - The document body to serialize
 * @returns XML string for the w:body element
 */
export declare function serializeDocumentBodyElement(body: DocumentBody): string;
/**
 * Check if document has any content
 */
export declare function hasDocumentContent(doc: Document): boolean;
/**
 * Check if document has sections
 */
export declare function hasDocumentSections(doc: Document): boolean;
/**
 * Check if document has section properties
 */
export declare function hasSectionProperties(doc: Document): boolean;
/**
 * Get document content count (paragraphs + tables)
 */
export declare function getDocumentContentCount(doc: Document): number;
/**
 * Get paragraph count in document
 */
export declare function getDocumentParagraphCount(doc: Document): number;
/**
 * Get table count in document
 */
export declare function getDocumentTableCount(doc: Document): number;
/**
 * Get plain text from document (for comparison/debugging)
 */
export declare function getDocumentPlainText(doc: Document): string;
/**
 * Create an empty document
 */
export declare function createEmptyDocument(): Document;
/**
 * Create a simple document with text content
 */
export declare function createSimpleDocument(paragraphs: Array<{
    text: string;
    styleId?: string;
}>): Document;
export default serializeDocument;
//# sourceMappingURL=documentSerializer.d.ts.map