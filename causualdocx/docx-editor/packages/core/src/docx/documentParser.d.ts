/**
 * Document Body Parser - Parse document.xml body content
 *
 * Parses the main document body (w:body) containing paragraphs, tables,
 * and section properties. Also detects template variables {{...}}.
 *
 * OOXML Reference:
 * - Root: w:document
 * - Body: w:body
 * - Content: w:p (paragraphs), w:tbl (tables), w:sdt (structured document tags)
 * - Final section properties: w:body/w:sectPr
 */
import type { DocumentBody, BlockContent, Paragraph, Table, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
/**
 * Convert Symbol font bullet characters to Unicode equivalents
 *
 * DOCX often uses characters from Symbol, Wingdings, or Webdings fonts
 * that don't render correctly without the font. This maps them to
 * standard Unicode bullets that work with any font.
 */
export declare function convertBulletToUnicode(bulletChar: string): string;
/**
 * Extract template variables from text
 *
 * @param text - Text to search for variables
 * @returns Array of unique variable names (without braces)
 */
export declare function extractTemplateVariables(text: string): string[];
/**
 * Extract all template variables from document content
 *
 * @param content - Array of paragraphs and tables
 * @returns Array of unique variable names
 */
export declare function extractAllTemplateVariables(content: BlockContent[]): string[];
/**
 * Parse document.xml body content
 *
 * @param xml - Raw XML content of document.xml
 * @param styles - Parsed style map
 * @param theme - Parsed theme
 * @param numbering - Parsed numbering definitions
 * @param rels - Document relationships
 * @param media - Media files
 * @returns DocumentBody with content, sections, and template variables
 */
export declare function parseDocumentBody(xml: string, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): DocumentBody;
/**
 * Get all paragraphs from document body (flattened)
 */
export declare function getAllParagraphs(body: DocumentBody): Paragraph[];
/**
 * Get all tables from document body
 */
export declare function getAllTables(body: DocumentBody): Table[];
/**
 * Get plain text from entire document body
 */
export declare function getDocumentText(body: DocumentBody): string;
/**
 * Count total paragraphs in document
 */
export declare function getParagraphCount(body: DocumentBody): number;
/**
 * Count total words in document (approximate)
 */
export declare function getWordCount(body: DocumentBody): number;
/**
 * Count total characters in document
 */
export declare function getCharacterCount(body: DocumentBody): number;
/**
 * Get section count
 */
export declare function getSectionCount(body: DocumentBody): number;
/**
 * Check if document has template variables
 */
export declare function hasTemplateVariables(body: DocumentBody): boolean;
/**
 * Get document outline (first N characters of each paragraph)
 *
 * @param body - Document body
 * @param maxCharsPerPara - Max characters per paragraph (default: 100)
 * @param maxParagraphs - Max paragraphs to include (default: 50)
 * @returns Array of paragraph previews
 */
export declare function getDocumentOutline(body: DocumentBody, maxCharsPerPara?: number, maxParagraphs?: number): string[];
//# sourceMappingURL=documentParser.d.ts.map