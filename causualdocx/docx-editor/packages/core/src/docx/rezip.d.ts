/**
 * DOCX Repacker - Repack modified document into valid DOCX
 *
 * Takes a Document with modified content and creates a new DOCX file
 * by updating document.xml while preserving all other files from
 * the original ZIP archive.
 *
 * This ensures round-trip fidelity:
 * - styles.xml, theme1.xml, fontTable.xml remain untouched
 * - Media files preserved
 * - Relationships preserved
 * - Only document.xml is updated with new content
 *
 * OOXML Package Structure:
 * - [Content_Types].xml - Content type declarations
 * - _rels/.rels - Package relationships
 * - word/document.xml - Main document (modified)
 * - word/styles.xml - Styles (preserved)
 * - word/theme/theme1.xml - Theme (preserved)
 * - word/numbering.xml - Numbering (preserved)
 * - word/fontTable.xml - Font table (preserved)
 * - word/settings.xml - Settings (preserved)
 * - word/header*.xml - Headers (preserved)
 * - word/footer*.xml - Footers (preserved)
 * - word/footnotes.xml - Footnotes (preserved)
 * - word/endnotes.xml - Endnotes (preserved)
 * - word/media/* - Media files (preserved)
 * - word/_rels/document.xml.rels - Document relationships (preserved)
 * - docProps/* - Document properties (preserved)
 */
import JSZip from 'jszip';
import type { Document } from '../types/document';
import { type RawDocxContent } from './unzip';
/**
 * Find the highest rId number in a relationships XML string.
 */
export declare function findMaxRId(relsXml: string): number;
/**
 * Options for repacking DOCX
 */
export interface RepackOptions {
    /** Compression level (0-9, default: 6) */
    compressionLevel?: number;
    /** Whether to update modification date in docProps/core.xml */
    updateModifiedDate?: boolean;
    /** Custom modifier name for lastModifiedBy */
    modifiedBy?: string;
}
/**
 * Repack a Document into a valid DOCX file
 *
 * @param doc - Document with modified content
 * @param options - Optional repack options
 * @returns Promise resolving to DOCX as ArrayBuffer
 * @throws Error if document has no original buffer for round-trip
 */
export declare function repackDocx(doc: Document, options?: RepackOptions): Promise<ArrayBuffer>;
/**
 * Repack a Document using raw content for more control
 *
 * @param doc - Document with modified content
 * @param rawContent - Original raw content from unzipDocx
 * @param options - Optional repack options
 * @returns Promise resolving to DOCX as ArrayBuffer
 */
export declare function repackDocxFromRaw(doc: Document, rawContent: RawDocxContent, options?: RepackOptions): Promise<ArrayBuffer>;
export declare const COMMENTS_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml";
export declare const COMMENTS_EXTENDED_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsExtended+xml";
export declare const COMMENTS_IDS_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsIds+xml";
export declare const COMMENTS_EXTENSIBLE_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsExtensible+xml";
/**
 * Update only document.xml in a DOCX buffer (minimal changes)
 *
 * @param originalBuffer - Original DOCX as ArrayBuffer
 * @param newDocumentXml - New document.xml content
 * @param options - Optional repack options
 * @returns Promise resolving to DOCX as ArrayBuffer
 */
export declare function updateDocumentXml(originalBuffer: ArrayBuffer, newDocumentXml: string, options?: RepackOptions): Promise<ArrayBuffer>;
/**
 * Update a specific XML file in a DOCX buffer
 *
 * @param originalBuffer - Original DOCX as ArrayBuffer
 * @param path - Path within the ZIP (e.g., "word/styles.xml")
 * @param content - New XML content
 * @param options - Optional repack options
 * @returns Promise resolving to DOCX as ArrayBuffer
 */
export declare function updateXmlFile(originalBuffer: ArrayBuffer, path: string, content: string, options?: RepackOptions): Promise<ArrayBuffer>;
/**
 * Update multiple files in a DOCX buffer
 *
 * @param originalBuffer - Original DOCX as ArrayBuffer
 * @param updates - Map of path -> content for files to update
 * @param options - Optional repack options
 * @returns Promise resolving to DOCX as ArrayBuffer
 */
export declare function updateMultipleFiles(originalBuffer: ArrayBuffer, updates: Map<string, string | ArrayBuffer>, options?: RepackOptions): Promise<ArrayBuffer>;
/**
 * Apply file updates to an already-loaded JSZip instance and generate the output.
 * Use this when the zip is already loaded to avoid a redundant decompression pass.
 */
export declare function applyUpdatesToZip(zip: JSZip, updates: Map<string, string | ArrayBuffer>, options?: RepackOptions): Promise<ArrayBuffer>;
/**
 * Add a new relationship to document.xml.rels
 *
 * @param originalBuffer - Original DOCX as ArrayBuffer
 * @param relationship - New relationship to add
 * @returns Promise resolving to { buffer: ArrayBuffer, rId: string }
 */
export declare function addRelationship(originalBuffer: ArrayBuffer, relationship: {
    type: string;
    target: string;
    targetMode?: 'External' | 'Internal';
}): Promise<{
    buffer: ArrayBuffer;
    rId: string;
}>;
/**
 * Add a media file to the DOCX
 *
 * @param originalBuffer - Original DOCX as ArrayBuffer
 * @param filename - Filename for the media (e.g., "image1.png")
 * @param data - Binary data for the media file
 * @param mimeType - MIME type (e.g., "image/png")
 * @returns Promise resolving to { buffer: ArrayBuffer, rId: string, path: string }
 */
export declare function addMedia(originalBuffer: ArrayBuffer, filename: string, data: ArrayBuffer, mimeType: string): Promise<{
    buffer: ArrayBuffer;
    rId: string;
    path: string;
}>;
/**
 * Collect serialized header/footer XML updates from the document model.
 * Uses the relationship map to resolve rId → filename.
 */
export declare function collectHeaderFooterUpdates(doc: Document): Map<string, string>;
/**
 * Update core properties XML with new modification date
 */
export declare function updateCoreProperties(corePropsXml: string, options: {
    updateModifiedDate?: boolean;
    modifiedBy?: string;
}): string;
/**
 * Validate that a buffer is a valid DOCX file
 *
 * @param buffer - Buffer to validate
 * @returns Promise resolving to validation result
 */
export declare function validateDocx(buffer: ArrayBuffer): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}>;
/**
 * Check if buffer looks like a DOCX file (quick check)
 *
 * @param buffer - Buffer to check
 * @returns true if buffer starts with ZIP signature
 */
export declare function isDocxBuffer(buffer: ArrayBuffer): boolean;
/**
 * Create a new empty DOCX file
 *
 * @returns Promise resolving to minimal DOCX as ArrayBuffer
 */
export declare function createEmptyDocx(): Promise<ArrayBuffer>;
/**
 * Create a new DOCX from a Document (without requiring original buffer)
 *
 * @param doc - Document to serialize
 * @returns Promise resolving to DOCX as ArrayBuffer
 */
export declare function createDocx(doc: Document): Promise<ArrayBuffer>;
export default repackDocx;
//# sourceMappingURL=rezip.d.ts.map