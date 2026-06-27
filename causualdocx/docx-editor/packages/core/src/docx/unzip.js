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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import JSZip from 'jszip';
/**
 * Extract all content from a DOCX file
 *
 * @param buffer - DOCX file as ArrayBuffer
 * @returns Promise resolving to extracted content
 */
/**
 * Sniff the first few bytes of `buffer` to detect common
 * mis-recognised-as-docx file shapes. Returns a friendly Error when the
 * input is clearly *not* a docx archive, or null when the bytes look
 * plausibly zip-shaped and we should hand off to JSZip.
 *
 * The check matters because users rename `.doc` → `.docx` and expect it
 * to open; JSZip's actual failure message ("Can't find end of central
 * directory") is opaque and looks like editor breakage.
 */
function classifyNonDocxInput(buffer) {
    if (buffer.byteLength < 8) {
        return new Error('Not a .docx file: input is empty or too small to be a valid archive.');
    }
    const head = new Uint8Array(buffer, 0, 8);
    // CFB / OLE Compound File header — legacy `.doc` (Word 97-2003), `.xls`,
    // `.ppt`, all share this signature.
    if (head[0] === 0xd0 &&
        head[1] === 0xcf &&
        head[2] === 0x11 &&
        head[3] === 0xe0 &&
        head[4] === 0xa1 &&
        head[5] === 0xb1 &&
        head[6] === 0x1a &&
        head[7] === 0xe1) {
        return new Error('This file is a legacy Word `.doc` (binary) document, not a `.docx` ' +
            '(OOXML) archive. Casual Editor does not open `.doc`; save it as ' +
            '`.docx` in Microsoft Word, LibreOffice, or Pages first.');
    }
    // RTF
    if (head[0] === 0x7b && head[1] === 0x5c && head[2] === 0x72 && head[3] === 0x74) {
        return new Error('This file is RTF, not a `.docx` archive.');
    }
    // ODT (and any zip in general) starts with PK (0x50 0x4B). ODT-specific
    // content (mimetype "application/vnd.oasis.opendocument.text") is
    // checked later by content-types inspection; here we just accept PK
    // archives and let JSZip + the content-type probe handle the rest.
    // Anything else with non-PK magic is rejected.
    if (head[0] !== 0x50 || head[1] !== 0x4b) {
        const hex = Array.from(head)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(' ');
        return new Error(`Not a .docx file: unexpected magic bytes ${hex}`);
    }
    return null;
}
export function unzipDocx(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const preflight = classifyNonDocxInput(buffer);
        if (preflight)
            throw preflight;
        let zip;
        try {
            zip = yield JSZip.loadAsync(buffer);
        }
        catch (e) {
            // The pre-flight catches the common cases; if we still got here with
            // PK magic but JSZip couldn't load it, the archive is truncated or
            // corrupt. Surface that rather than the raw library message.
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`Failed to read .docx archive — the file looks like a ZIP (PK header) but is corrupt or truncated: ${msg}`);
        }
        const content = {
            documentXml: null,
            stylesXml: null,
            themeXml: null,
            numberingXml: null,
            fontTableXml: null,
            settingsXml: null,
            webSettingsXml: null,
            headers: new Map(),
            footers: new Map(),
            footnotesXml: null,
            endnotesXml: null,
            commentsXml: null,
            commentsExtensibleXml: null,
            commentsExtendedXml: null,
            documentRels: null,
            packageRels: null,
            contentTypesXml: null,
            corePropsXml: null,
            appPropsXml: null,
            customPropsXml: null,
            media: new Map(),
            fonts: new Map(),
            allXml: new Map(),
            originalZip: zip,
            originalBuffer: buffer,
        };
        // Process each file in the ZIP
        for (const [path, file] of Object.entries(zip.files)) {
            // Skip directories
            if (file.dir)
                continue;
            const lowerPath = path.toLowerCase();
            // Determine file type and extract
            if (lowerPath.endsWith('.xml') || lowerPath.endsWith('.rels')) {
                const xmlContent = yield file.async('text');
                content.allXml.set(path, xmlContent);
                // Categorize known XML files
                if (lowerPath === 'word/document.xml') {
                    content.documentXml = xmlContent;
                }
                else if (lowerPath === 'word/styles.xml') {
                    content.stylesXml = xmlContent;
                }
                else if (lowerPath === 'word/theme/theme1.xml') {
                    content.themeXml = xmlContent;
                }
                else if (lowerPath === 'word/numbering.xml') {
                    content.numberingXml = xmlContent;
                }
                else if (lowerPath === 'word/fonttable.xml') {
                    content.fontTableXml = xmlContent;
                }
                else if (lowerPath === 'word/settings.xml') {
                    content.settingsXml = xmlContent;
                }
                else if (lowerPath === 'word/websettings.xml') {
                    content.webSettingsXml = xmlContent;
                }
                else if (lowerPath === 'word/footnotes.xml') {
                    content.footnotesXml = xmlContent;
                }
                else if (lowerPath === 'word/endnotes.xml') {
                    content.endnotesXml = xmlContent;
                }
                else if (lowerPath === 'word/comments.xml') {
                    content.commentsXml = xmlContent;
                }
                else if (lowerPath === 'word/commentsextensible.xml') {
                    content.commentsExtensibleXml = xmlContent;
                }
                else if (lowerPath === 'word/commentsextended.xml') {
                    content.commentsExtendedXml = xmlContent;
                }
                else if (lowerPath === 'word/_rels/document.xml.rels') {
                    content.documentRels = xmlContent;
                }
                else if (lowerPath === '_rels/.rels') {
                    content.packageRels = xmlContent;
                }
                else if (lowerPath === '[content_types].xml') {
                    content.contentTypesXml = xmlContent;
                }
                else if (lowerPath === 'docprops/core.xml') {
                    content.corePropsXml = xmlContent;
                }
                else if (lowerPath === 'docprops/app.xml') {
                    content.appPropsXml = xmlContent;
                }
                else if (lowerPath === 'docprops/custom.xml') {
                    content.customPropsXml = xmlContent;
                }
                else if (lowerPath.match(/^word\/header\d+\.xml$/)) {
                    const filename = path.split('/').pop() || path;
                    content.headers.set(filename, xmlContent);
                }
                else if (lowerPath.match(/^word\/footer\d+\.xml$/)) {
                    const filename = path.split('/').pop() || path;
                    content.footers.set(filename, xmlContent);
                }
            }
            else if (lowerPath.startsWith('word/media/')) {
                // Media files (images, etc.)
                const binaryContent = yield file.async('arraybuffer');
                content.media.set(path, binaryContent);
            }
            else if (lowerPath.startsWith('word/fonts/')) {
                // Embedded fonts
                const binaryContent = yield file.async('arraybuffer');
                content.fonts.set(path, binaryContent);
            }
        }
        return content;
    });
}
/**
 * Get a list of all files in the DOCX
 *
 * @param content - Extracted DOCX content
 * @returns Array of file paths
 */
export function getFileList(content) {
    const files = [];
    for (const path of Object.keys(content.originalZip.files)) {
        if (!content.originalZip.files[path].dir) {
            files.push(path);
        }
    }
    return files.sort();
}
/**
 * Get the MIME type for a media file based on extension
 *
 * @param path - File path
 * @returns MIME type string
 */
export function getMediaMimeType(path) {
    const ext = path.toLowerCase().split('.').pop();
    switch (ext) {
        case 'png':
            return 'image/png';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'gif':
            return 'image/gif';
        case 'bmp':
            return 'image/bmp';
        case 'tif':
        case 'tiff':
            return 'image/tiff';
        case 'wmf':
            return 'image/x-wmf';
        case 'emf':
            return 'image/x-emf';
        case 'svg':
            return 'image/svg+xml';
        case 'webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}
/**
 * Convert media file to data URL
 *
 * @param data - Binary data
 * @param mimeType - MIME type
 * @returns Data URL string
 */
export function mediaToDataUrl(data, mimeType) {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
}
/**
 * Extract a specific file from the original ZIP
 *
 * @param content - Extracted DOCX content
 * @param path - File path within the ZIP
 * @returns File content as string or ArrayBuffer, or null if not found
 */
export function extractFile(content, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = content.originalZip.file(path);
        if (!file)
            return null;
        const lowerPath = path.toLowerCase();
        if (lowerPath.endsWith('.xml') || lowerPath.endsWith('.rels')) {
            return file.async('text');
        }
        else {
            return file.async('arraybuffer');
        }
    });
}
/**
 * Check if a file exists in the DOCX
 *
 * @param content - Extracted DOCX content
 * @param path - File path to check
 * @returns true if file exists
 */
export function hasFile(content, path) {
    return content.originalZip.file(path) !== null;
}
/**
 * Get summary of DOCX content
 *
 * @param content - Extracted DOCX content
 * @returns Object with file counts and presence flags
 */
export function getContentSummary(content) {
    return {
        hasDocument: content.documentXml !== null,
        hasStyles: content.stylesXml !== null,
        hasTheme: content.themeXml !== null,
        hasNumbering: content.numberingXml !== null,
        hasFontTable: content.fontTableXml !== null,
        hasFootnotes: content.footnotesXml !== null,
        hasEndnotes: content.endnotesXml !== null,
        hasComments: content.commentsXml !== null,
        headerCount: content.headers.size,
        footerCount: content.footers.size,
        mediaCount: content.media.size,
        fontCount: content.fonts.size,
        totalFiles: Object.keys(content.originalZip.files).filter((p) => !content.originalZip.files[p].dir).length,
    };
}
//# sourceMappingURL=unzip.js.map