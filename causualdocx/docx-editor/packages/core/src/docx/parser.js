/**
 * Main Parser Orchestrator - Unified parseDocx function
 *
 * Coordinates all sub-parsers to produce a complete Document model.
 * Handles loading order, dependency resolution, and font preloading.
 *
 * Parsing order:
 * 1. Unzip DOCX package
 * 2. Parse relationships
 * 3. Parse theme (needed for style color/font resolution)
 * 4. Parse styles (depends on theme)
 * 5. Parse numbering
 * 6. Parse document body (depends on styles, theme, numbering, rels)
 * 7. Parse headers/footers (depends on styles, theme, numbering, rels)
 * 8. Parse footnotes/endnotes (depends on styles, theme, numbering, rels)
 * 9. Extract and load fonts
 * 10. Build media file map
 * 11. Assemble final Document
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
import { unzipDocx, getMediaMimeType } from './unzip';
import { parseRelationships, RELATIONSHIP_TYPES } from './relsParser';
import { parseTheme } from './themeParser';
import { parseStyles, parseStyleDefinitions } from './styleParser';
import { parseNumbering } from './numberingParser';
import { parseDocumentBody, extractAllTemplateVariables } from './documentParser';
import { parseHeader, parseFooter } from './headerFooterParser';
import { parseFootnotes, parseEndnotes } from './footnoteParser';
import { convertEmfWmfMediaFiles } from './emfWmfConverter';
import { parseComments } from './commentParser';
import { parseCoreProperties } from './corePropertiesParser';
import { loadFontsWithMapping } from '../utils/fontLoader';
import { toArrayBuffer } from '../utils/docxInput';
// ============================================================================
// MAIN PARSER
// ============================================================================
/**
 * Parse a DOCX file into a complete Document model
 *
 * @param input - DOCX file as ArrayBuffer, Uint8Array, Blob, or File
 * @param options - Parsing options
 * @returns Promise resolving to Document
 * @throws Error if parsing fails
 */
export function parseDocx(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, options = {}) {
        // Normalize any supported input type to ArrayBuffer
        const buffer = input instanceof ArrayBuffer ? input : yield toArrayBuffer(input);
        const { onProgress = () => { }, preloadFonts = true, parseHeadersFooters = true, parseNotes = true, detectVariables = true, } = options;
        const warnings = [];
        try {
            const parseStart = performance.now();
            const stageTimings = [];
            function timeStage(name, fn) {
                const start = performance.now();
                const result = fn();
                const elapsed = performance.now() - start;
                stageTimings.push({ stage: name, ms: elapsed });
                if (elapsed > 1000) {
                    console.warn(`[parseDocx] ${name} took ${Math.round(elapsed)}ms`);
                }
                return result;
            }
            function timeStageAsync(name, fn) {
                return __awaiter(this, void 0, void 0, function* () {
                    const start = performance.now();
                    const result = yield fn();
                    const elapsed = performance.now() - start;
                    stageTimings.push({ stage: name, ms: elapsed });
                    if (elapsed > 1000) {
                        console.warn(`[parseDocx] ${name} took ${Math.round(elapsed)}ms`);
                    }
                    return result;
                });
            }
            // ========================================================================
            // STAGE 1: Unzip DOCX package (0-10%)
            // ========================================================================
            onProgress('Extracting DOCX...', 0);
            const raw = yield timeStageAsync('unzip', () => unzipDocx(buffer));
            onProgress('Extracted DOCX', 10);
            // ========================================================================
            // STAGE 2: Parse relationships (10-15%)
            // ========================================================================
            onProgress('Parsing relationships...', 10);
            const rels = timeStage('relationships', () => raw.documentRels ? parseRelationships(raw.documentRels) : new Map());
            onProgress('Parsed relationships', 15);
            // ========================================================================
            // STAGE 3: Parse theme (15-20%)
            // ========================================================================
            onProgress('Parsing theme...', 15);
            const theme = timeStage('theme', () => parseTheme(raw.themeXml));
            onProgress('Parsed theme', 20);
            // ========================================================================
            // STAGE 4: Parse styles (20-30%)
            // ========================================================================
            onProgress('Parsing styles...', 20);
            let styles = null;
            let styleDefinitions;
            timeStage('styles', () => {
                if (raw.stylesXml) {
                    styles = parseStyles(raw.stylesXml, theme);
                    styleDefinitions = parseStyleDefinitions(raw.stylesXml, theme);
                }
            });
            onProgress('Parsed styles', 30);
            // ========================================================================
            // STAGE 5: Parse numbering (30-35%)
            // ========================================================================
            onProgress('Parsing numbering...', 30);
            const numbering = timeStage('numbering', () => parseNumbering(raw.numberingXml));
            onProgress('Parsed numbering', 35);
            // ========================================================================
            // STAGE 6: Build media file map (35-40%)
            // ========================================================================
            onProgress('Processing media files...', 35);
            const media = timeStage('media', () => buildMediaMap(raw, rels));
            // EMF / WMF are vector formats no browser renders in <img>. The
            // converter replays the metafile records onto a Canvas and replaces
            // the entry's `dataUrl` with a `data:image/png;base64,…` URL so the
            // painter can show the actual picture instead of the placeholder.
            // Tolerant of failure — leaves entries unchanged when the converter
            // throws or the host lacks canvas APIs (Bun, audit script).
            yield convertEmfWmfMediaFiles(media);
            onProgress('Processed media', 40);
            // ========================================================================
            // STAGE 7: Parse document body (40-55%)
            // ========================================================================
            onProgress('Parsing document body...', 40);
            let documentBody = { content: [] };
            timeStage('documentBody', () => {
                if (raw.documentXml) {
                    documentBody = parseDocumentBody(raw.documentXml, styles, theme, numbering, rels, media);
                }
                else {
                    warnings.push('No document.xml found in DOCX');
                }
            });
            onProgress('Parsed document body', 55);
            // ========================================================================
            // STAGE 8: Parse headers/footers (55-65%)
            // ========================================================================
            let headers;
            let footers;
            if (parseHeadersFooters) {
                onProgress('Parsing headers/footers...', 55);
                const hf = timeStage('headersFooters', () => parseHeadersAndFooters(raw, styles, theme, numbering, rels, media));
                headers = hf.headers;
                footers = hf.footers;
                onProgress('Parsed headers/footers', 65);
            }
            else {
                onProgress('Skipping headers/footers', 65);
            }
            // ========================================================================
            // STAGE 9: Parse footnotes/endnotes (65-75%)
            // ========================================================================
            let footnotes;
            let endnotes;
            if (parseNotes) {
                onProgress('Parsing footnotes/endnotes...', 65);
                const notes = timeStage('footnotesEndnotes', () => parseNotesContent(raw, styles, theme, numbering, rels, media));
                footnotes = notes.footnotes;
                endnotes = notes.endnotes;
                onProgress('Parsed footnotes/endnotes', 75);
            }
            else {
                onProgress('Skipping footnotes/endnotes', 75);
            }
            // ========================================================================
            // STAGE 9b: Parse comments (75-77%)
            // ========================================================================
            onProgress('Parsing comments...', 75);
            const comments = timeStage('comments', () => parseComments(raw.commentsXml, styles, theme, rels, media, raw.commentsExtensibleXml, raw.commentsExtendedXml));
            if (comments.length > 0) {
                documentBody.comments = comments;
            }
            // ========================================================================
            // STAGE 10: Detect template variables (77-80%)
            // ========================================================================
            let templateVariables;
            if (detectVariables) {
                onProgress('Detecting template variables...', 75);
                templateVariables = timeStage('variables', () => extractAllTemplateVariables(documentBody.content));
                onProgress('Detected variables', 80);
            }
            else {
                onProgress('Skipping variable detection', 80);
            }
            // ========================================================================
            // STAGE 11: Extract and load fonts (80-95%)
            // ========================================================================
            if (preloadFonts) {
                onProgress('Loading fonts...', 80);
                yield timeStageAsync('fonts', () => loadDocumentFonts(theme, styleDefinitions, documentBody));
                onProgress('Loaded fonts', 95);
            }
            else {
                onProgress('Skipping font loading', 95);
            }
            // ========================================================================
            // STAGE 12: Assemble final Document (95-100%)
            // ========================================================================
            onProgress('Assembling document...', 95);
            const properties = parseCoreProperties(raw.corePropsXml);
            const pkg = {
                document: documentBody,
                styles: styleDefinitions,
                theme,
                numbering: numbering.definitions,
                headers,
                footers,
                footnotes,
                endnotes,
                relationships: rels,
                media,
                properties,
            };
            const document = {
                package: pkg,
                originalBuffer: buffer,
                templateVariables,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
            const totalTime = performance.now() - parseStart;
            if (totalTime > 2000) {
                const breakdown = stageTimings
                    .filter((s) => s.ms > 100)
                    .map((s) => `${s.stage}: ${Math.round(s.ms)}ms`)
                    .join(', ');
                console.warn(`[parseDocx] Total: ${Math.round(totalTime)}ms` + (breakdown ? ` (${breakdown})` : ''));
            }
            onProgress('Complete', 100);
            return document;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[parseDocx] Failed to parse DOCX:', message, error);
            throw new Error(`Failed to parse DOCX: ${message}`);
        }
    });
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Build media file map from raw content and relationships
 */
function buildMediaMap(raw, _rels) {
    const media = new Map();
    // Process each media file
    for (const [path, data] of raw.media.entries()) {
        const filename = path.split('/').pop() || path;
        const mimeType = getMediaMimeType(path);
        // Create a data URL for the image
        const bytes = new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${mimeType};base64,${base64}`;
        const mediaFile = {
            path,
            filename,
            mimeType,
            data,
            dataUrl,
        };
        // Store by path and also by relationship target path
        media.set(path, mediaFile);
        // Also map normalized paths (without "word/" prefix)
        const normalizedPath = path.replace(/^word\//, '');
        if (normalizedPath !== path) {
            media.set(normalizedPath, mediaFile);
        }
    }
    return media;
}
/**
 * Parse headers and footers from raw content
 */
/**
 * Case-insensitive lookup in a Map
 * ZIP files may have inconsistent casing for paths/filenames
 */
function getMapCaseInsensitive(map, targetKey) {
    const lowerTarget = targetKey.toLowerCase();
    for (const [key, value] of map.entries()) {
        if (key.toLowerCase() === lowerTarget) {
            return value;
        }
    }
    return undefined;
}
function parseHeadersAndFooters(raw, styles, theme, numbering, rels, media) {
    const headers = new Map();
    const footers = new Map();
    // We need to map the relationship IDs to header/footer files
    // The relationships tell us which rId maps to which header/footer file
    // Find header/footer references in relationships
    for (const [rId, rel] of rels.entries()) {
        if (rel.type === RELATIONSHIP_TYPES.header && rel.target) {
            // Get the header XML for this relationship
            // Use case-insensitive lookup since ZIP files may have inconsistent casing
            const filename = rel.target.split('/').pop() || rel.target;
            const headerXml = getMapCaseInsensitive(raw.headers, filename);
            if (headerXml) {
                // Get header-specific relationships (e.g., word/_rels/header1.xml.rels)
                const headerRelsPath = `word/_rels/${filename}.rels`;
                const headerRelsXml = getMapCaseInsensitive(raw.allXml, headerRelsPath);
                const headerRels = headerRelsXml ? parseRelationships(headerRelsXml) : rels;
                const header = parseHeader(headerXml, 'default', // We'll update this based on sectPr references
                styles, theme, numbering, headerRels, media);
                headers.set(rId, header);
            }
        }
        else if (rel.type === RELATIONSHIP_TYPES.footer && rel.target) {
            // Use case-insensitive lookup since ZIP files may have inconsistent casing
            const filename = rel.target.split('/').pop() || rel.target;
            const footerXml = getMapCaseInsensitive(raw.footers, filename);
            if (footerXml) {
                // Get footer-specific relationships (e.g., word/_rels/footer1.xml.rels)
                const footerRelsPath = `word/_rels/${filename}.rels`;
                const footerRelsXml = getMapCaseInsensitive(raw.allXml, footerRelsPath);
                const footerRels = footerRelsXml ? parseRelationships(footerRelsXml) : rels;
                const footer = parseFooter(footerXml, 'default', styles, theme, numbering, footerRels, media);
                footers.set(rId, footer);
            }
        }
    }
    return { headers, footers };
}
/**
 * Parse footnotes and endnotes from raw content
 */
function parseNotesContent(raw, styles, theme, numbering, rels, media) {
    const footnoteMap = parseFootnotes(raw.footnotesXml, styles, theme, numbering, rels, media);
    const endnoteMap = parseEndnotes(raw.endnotesXml, styles, theme, numbering, rels, media);
    return {
        footnotes: footnoteMap.getNormalFootnotes(),
        endnotes: endnoteMap.getNormalEndnotes(),
    };
}
/**
 * Extract fonts from document and load them
 */
function loadDocumentFonts(theme, styleDefinitions, documentBody) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const docxFonts = new Set();
        // Extract fonts from theme
        if (theme === null || theme === void 0 ? void 0 : theme.fontScheme) {
            const { majorFont, minorFont } = theme.fontScheme;
            if (majorFont === null || majorFont === void 0 ? void 0 : majorFont.latin)
                docxFonts.add(majorFont.latin);
            if (minorFont === null || minorFont === void 0 ? void 0 : minorFont.latin)
                docxFonts.add(minorFont.latin);
        }
        // Extract fonts from style defaults
        if ((_c = (_b = (_a = styleDefinitions === null || styleDefinitions === void 0 ? void 0 : styleDefinitions.docDefaults) === null || _a === void 0 ? void 0 : _a.rPr) === null || _b === void 0 ? void 0 : _b.fontFamily) === null || _c === void 0 ? void 0 : _c.ascii) {
            docxFonts.add(styleDefinitions.docDefaults.rPr.fontFamily.ascii);
        }
        // Extract fonts from styles
        if (styleDefinitions === null || styleDefinitions === void 0 ? void 0 : styleDefinitions.styles) {
            for (const style of styleDefinitions.styles) {
                if ((_e = (_d = style.rPr) === null || _d === void 0 ? void 0 : _d.fontFamily) === null || _e === void 0 ? void 0 : _e.ascii) {
                    docxFonts.add(style.rPr.fontFamily.ascii);
                }
                if ((_g = (_f = style.rPr) === null || _f === void 0 ? void 0 : _f.fontFamily) === null || _g === void 0 ? void 0 : _g.hAnsi) {
                    docxFonts.add(style.rPr.fontFamily.hAnsi);
                }
            }
        }
        // Extract fonts from document content (inline run formatting)
        if (documentBody.content) {
            for (const block of documentBody.content) {
                if (block.type === 'paragraph') {
                    for (const item of block.content) {
                        if (item.type === 'run' && ((_h = item.formatting) === null || _h === void 0 ? void 0 : _h.fontFamily)) {
                            if (item.formatting.fontFamily.ascii) {
                                docxFonts.add(item.formatting.fontFamily.ascii);
                            }
                            if (item.formatting.fontFamily.hAnsi) {
                                docxFonts.add(item.formatting.fontFamily.hAnsi);
                            }
                        }
                    }
                }
            }
        }
        // Load fonts with mapping (creates aliases so original names work in CSS)
        if (docxFonts.size > 0) {
            try {
                yield loadFontsWithMapping(Array.from(docxFonts));
            }
            catch (error) {
                // Font loading is non-critical, continue without fonts
                console.warn('Failed to load some fonts:', error);
            }
        }
    });
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Quick parse - parse a DOCX without font loading
 * Useful for quick content extraction or when fonts aren't needed
 */
export function quickParseDocx(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        return parseDocx(buffer, {
            preloadFonts: false,
            parseHeadersFooters: false,
            parseNotes: false,
            detectVariables: true,
        });
    });
}
/**
 * Full parse - parse everything including fonts
 */
export function fullParseDocx(buffer, onProgress) {
    return __awaiter(this, void 0, void 0, function* () {
        return parseDocx(buffer, {
            onProgress,
            preloadFonts: true,
            parseHeadersFooters: true,
            parseNotes: true,
            detectVariables: true,
        });
    });
}
/**
 * Get template variables from a DOCX without full parsing
 * Faster than full parse when you only need variables
 */
export function getDocxVariables(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield unzipDocx(buffer);
        if (!raw.documentXml) {
            return [];
        }
        // Quick parse just the document body
        const documentBody = parseDocumentBody(raw.documentXml);
        return extractAllTemplateVariables(documentBody.content);
    });
}
/**
 * Get document summary without full parsing
 */
export function getDocxSummary(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield unzipDocx(buffer);
        const variables = raw.documentXml
            ? extractAllTemplateVariables(parseDocumentBody(raw.documentXml).content)
            : [];
        return {
            hasDocument: raw.documentXml !== null,
            hasStyles: raw.stylesXml !== null,
            hasTheme: raw.themeXml !== null,
            hasNumbering: raw.numberingXml !== null,
            headerCount: raw.headers.size,
            footerCount: raw.footers.size,
            mediaCount: raw.media.size,
            variableCount: variables.length,
        };
    });
}
//# sourceMappingURL=parser.js.map