/**
 * DOCX Unzipper
 *
 * Extracts all files from a DOCX ZIP archive and organizes them
 * into a structured format for further processing.
 *
 * A DOCX file is a ZIP archive containing:
 * - [Content_Types].xml - Content type declarations
 * - word/document.xml - Main document content
 * - word/styles.xml - Style definitions
 * - word/theme/theme1.xml - Theme colors and fonts
 * - word/numbering.xml - List/numbering definitions
 * - word/fontTable.xml - Font declarations
 * - word/settings.xml - Document settings
 * - word/webSettings.xml - Web settings
 * - word/header*.xml - Header content
 * - word/footer*.xml - Footer content
 * - word/footnotes.xml - Footnotes
 * - word/endnotes.xml - Endnotes
 * - word/media/* - Embedded images and media
 * - word/_rels/document.xml.rels - Relationships
 * - _rels/.rels - Package relationships
 * - docProps/core.xml - Core properties
 * - docProps/app.xml - Application properties
 */
import JSZip from 'jszip';
/**
 * Raw extracted content from a DOCX file
 */
export interface RawDocxContent {
    documentXml: string | null;
    stylesXml: string | null;
    themeXml: string | null;
    numberingXml: string | null;
    fontTableXml: string | null;
    settingsXml: string | null;
    webSettingsXml: string | null;
    headers: Map<string, string>;
    footers: Map<string, string>;
    footnotesXml: string | null;
    endnotesXml: string | null;
    commentsXml: string | null;
    commentsExtensibleXml: string | null;
    commentsExtendedXml: string | null;
    documentRels: string | null;
    packageRels: string | null;
    contentTypesXml: string | null;
    corePropsXml: string | null;
    appPropsXml: string | null;
    customPropsXml: string | null;
    media: Map<string, ArrayBuffer>;
    fonts: Map<string, ArrayBuffer>;
    allXml: Map<string, string>;
    originalZip: JSZip;
    originalBuffer: ArrayBuffer;
}
export declare function unzipDocx(buffer: ArrayBuffer): Promise<RawDocxContent>;
/**
 * Get a list of all files in the DOCX
 *
 * @param content - Extracted DOCX content
 * @returns Array of file paths
 */
export declare function getFileList(content: RawDocxContent): string[];
/**
 * Get the MIME type for a media file based on extension
 *
 * @param path - File path
 * @returns MIME type string
 */
export declare function getMediaMimeType(path: string): string;
/**
 * Convert media file to data URL
 *
 * @param data - Binary data
 * @param mimeType - MIME type
 * @returns Data URL string
 */
export declare function mediaToDataUrl(data: ArrayBuffer, mimeType: string): string;
/**
 * Extract a specific file from the original ZIP
 *
 * @param content - Extracted DOCX content
 * @param path - File path within the ZIP
 * @returns File content as string or ArrayBuffer, or null if not found
 */
export declare function extractFile(content: RawDocxContent, path: string): Promise<string | ArrayBuffer | null>;
/**
 * Check if a file exists in the DOCX
 *
 * @param content - Extracted DOCX content
 * @param path - File path to check
 * @returns true if file exists
 */
export declare function hasFile(content: RawDocxContent, path: string): boolean;
/**
 * Get summary of DOCX content
 *
 * @param content - Extracted DOCX content
 * @returns Object with file counts and presence flags
 */
export declare function getContentSummary(content: RawDocxContent): {
    hasDocument: boolean;
    hasStyles: boolean;
    hasTheme: boolean;
    hasNumbering: boolean;
    hasFontTable: boolean;
    hasFootnotes: boolean;
    hasEndnotes: boolean;
    hasComments: boolean;
    headerCount: number;
    footerCount: number;
    mediaCount: number;
    fontCount: number;
    totalFiles: number;
};
//# sourceMappingURL=unzip.d.ts.map