/**
 * Header/Footer Parser - Parse header*.xml and footer*.xml files
 *
 * Headers and footers are stored in separate XML files within the DOCX package:
 * - word/header1.xml, word/header2.xml, etc.
 * - word/footer1.xml, word/footer2.xml, etc.
 *
 * Each header/footer is referenced from document.xml via:
 * - w:sectPr > w:headerReference (type="default|first|even", r:id="rIdX")
 * - w:sectPr > w:footerReference (type="default|first|even", r:id="rIdX")
 *
 * Header/footer types:
 * - default: Used for all pages unless first/even specified
 * - first: Used only for the first page of a section
 * - even: Used for even-numbered pages (when different odd/even enabled)
 *
 * Content structure:
 * - w:hdr or w:ftr root element
 * - Contains w:p (paragraphs) and w:tbl (tables)
 * - Can contain images, shapes, page numbers, etc.
 *
 * OOXML Reference:
 * - Root: w:hdr (header) or w:ftr (footer)
 * - Content: w:p, w:tbl
 */
import { parseXml, findChildren, getAttribute } from './xmlParser';
import { parseParagraph } from './paragraphParser';
import { parseTable } from './tableParser';
import { enrichParagraphTextBoxes } from './textBoxEnricher';
// ============================================================================
// HEADER/FOOTER REFERENCE PARSING
// ============================================================================
/**
 * Parse header type attribute
 */
function parseHeaderFooterType(typeAttr) {
    switch (typeAttr) {
        case 'first':
            return 'first';
        case 'even':
            return 'even';
        case 'default':
        default:
            return 'default';
    }
}
/**
 * Parse a header reference from sectPr (w:headerReference)
 *
 * @param element - The w:headerReference element
 * @returns HeaderReference with type and rId
 */
export function parseHeaderReference(element) {
    var _a;
    const typeAttr = getAttribute(element, 'w', 'type');
    const rId = (_a = getAttribute(element, 'r', 'id')) !== null && _a !== void 0 ? _a : '';
    return {
        type: parseHeaderFooterType(typeAttr),
        rId,
    };
}
/**
 * Parse a footer reference from sectPr (w:footerReference)
 *
 * @param element - The w:footerReference element
 * @returns FooterReference with type and rId
 */
export function parseFooterReference(element) {
    var _a;
    const typeAttr = getAttribute(element, 'w', 'type');
    const rId = (_a = getAttribute(element, 'r', 'id')) !== null && _a !== void 0 ? _a : '';
    return {
        type: parseHeaderFooterType(typeAttr),
        rId,
    };
}
/**
 * Parse all header references from a sectPr element
 *
 * @param sectPr - The w:sectPr element
 * @returns Array of HeaderReference objects
 */
export function parseHeaderReferences(sectPr) {
    const refs = [];
    const headerRefElements = findChildren(sectPr, 'w', 'headerReference');
    for (const el of headerRefElements) {
        refs.push(parseHeaderReference(el));
    }
    return refs;
}
/**
 * Parse all footer references from a sectPr element
 *
 * @param sectPr - The w:sectPr element
 * @returns Array of FooterReference objects
 */
export function parseFooterReferences(sectPr) {
    const refs = [];
    const footerRefElements = findChildren(sectPr, 'w', 'footerReference');
    for (const el of footerRefElements) {
        refs.push(parseFooterReference(el));
    }
    return refs;
}
// ============================================================================
// HEADER/FOOTER CONTENT PARSING
// ============================================================================
/**
 * Parse header/footer content (paragraphs and tables)
 *
 * @param root - Root element (w:hdr or w:ftr)
 * @param styles - Style map for applying styles
 * @param theme - Theme for color resolution
 * @param numbering - Numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks/images
 * @param media - Media files for images
 * @returns Array of content elements (Paragraph | Table)
 */
function parseHeaderFooterContent(root, styles, theme, numbering, rels, media) {
    var _a, _b, _c;
    const content = [];
    // Get all child elements
    const elements = (_a = root.elements) !== null && _a !== void 0 ? _a : [];
    // Headers and footers reflow per page, so the body-flow concept of a
    // rendered-page-break marker has no meaning. The flag propagates through
    // parseTable → parseTableCell → parseParagraph so even nested cell
    // paragraphs skip the detection.
    const opts = { inHeaderFooter: true };
    for (const el of elements) {
        if (el.type !== 'element')
            continue;
        const name = (_b = el.name) !== null && _b !== void 0 ? _b : '';
        // Parse paragraphs
        if (name === 'w:p' || name.endsWith(':p')) {
            const paragraph = parseParagraph(el, styles, theme, numbering, rels, media, opts);
            // Second pass: enrich with text boxes parsed from raw drawing XML.
            // Without this, w:drawing -> wps:wsp -> wps:txbx content inside a
            // header/footer silently disappears (issue #318, header sub-case).
            enrichParagraphTextBoxes(paragraph, el, styles, theme, numbering, rels, media);
            content.push(paragraph);
        }
        // Parse tables
        else if (name === 'w:tbl' || name.endsWith(':tbl')) {
            const table = parseTable(el, styles, theme, numbering, rels, media, opts);
            content.push(table);
        }
        // SDT (structured document tags) can contain paragraphs/tables
        else if (name === 'w:sdt' || name.endsWith(':sdt')) {
            // Find sdtContent
            const sdtContentEl = ((_c = el.elements) !== null && _c !== void 0 ? _c : []).find((child) => {
                var _a;
                return child.type === 'element' &&
                    (child.name === 'w:sdtContent' || ((_a = child.name) === null || _a === void 0 ? void 0 : _a.endsWith(':sdtContent')));
            });
            if (sdtContentEl) {
                // Recursively parse content inside SDT
                const sdtContent = parseHeaderFooterContent(sdtContentEl, styles, theme, numbering, rels, media);
                content.push(...sdtContent);
            }
        }
    }
    return content;
}
/**
 * Parse a header XML file (word/header*.xml)
 *
 * @param headerXml - The raw XML content of the header file
 * @param hdrFtrType - The type of header (default, first, even)
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks/images
 * @param media - Media files for images
 * @returns HeaderFooter object
 */
export function parseHeader(headerXml, hdrFtrType = 'default', styles = null, theme = null, numbering = null, rels = null, media = null) {
    var _a;
    const result = {
        type: 'header',
        hdrFtrType,
        content: [],
    };
    if (!headerXml) {
        return result;
    }
    const doc = parseXml(headerXml);
    if (!doc) {
        return result;
    }
    // Find the root header element (w:hdr)
    const rootElement = (_a = doc.elements) === null || _a === void 0 ? void 0 : _a.find((el) => { var _a; return el.type === 'element' && (el.name === 'w:hdr' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':hdr'))); });
    if (!rootElement) {
        return result;
    }
    // Parse content
    result.content = parseHeaderFooterContent(rootElement, styles, theme, numbering, rels, media);
    return result;
}
/**
 * Parse a footer XML file (word/footer*.xml)
 *
 * @param footerXml - The raw XML content of the footer file
 * @param hdrFtrType - The type of footer (default, first, even)
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks/images
 * @param media - Media files for images
 * @returns HeaderFooter object
 */
export function parseFooter(footerXml, hdrFtrType = 'default', styles = null, theme = null, numbering = null, rels = null, media = null) {
    var _a;
    const result = {
        type: 'footer',
        hdrFtrType,
        content: [],
    };
    if (!footerXml) {
        return result;
    }
    const doc = parseXml(footerXml);
    if (!doc) {
        return result;
    }
    // Find the root footer element (w:ftr)
    const rootElement = (_a = doc.elements) === null || _a === void 0 ? void 0 : _a.find((el) => { var _a; return el.type === 'element' && (el.name === 'w:ftr' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':ftr'))); });
    if (!rootElement) {
        return result;
    }
    // Parse content
    result.content = parseHeaderFooterContent(rootElement, styles, theme, numbering, rels, media);
    return result;
}
/**
 * Generic function to parse either header or footer
 *
 * @param xml - Raw XML content
 * @param isHeader - true for header, false for footer
 * @param hdrFtrType - The type (default, first, even)
 * @param styles - Style map
 * @param theme - Theme
 * @param numbering - Numbering definitions
 * @param rels - Relationships
 * @param media - Media files
 * @returns HeaderFooter object
 */
export function parseHeaderFooter(xml, isHeader, hdrFtrType = 'default', styles = null, theme = null, numbering = null, rels = null, media = null) {
    if (isHeader) {
        return parseHeader(xml, hdrFtrType, styles, theme, numbering, rels, media);
    }
    else {
        return parseFooter(xml, hdrFtrType, styles, theme, numbering, rels, media);
    }
}
// ============================================================================
// HEADER/FOOTER MAP CREATION
// ============================================================================
/**
 * Create a HeaderFooterMap from parsed headers/footers
 */
function createHeaderFooterMap(byId) {
    return {
        byId,
        get(rId) {
            return byId.get(rId);
        },
        has(rId) {
            return byId.has(rId);
        },
        getAll() {
            return Array.from(byId.values());
        },
        getByType(type) {
            for (const hf of byId.values()) {
                if (hf.hdrFtrType === type) {
                    return hf;
                }
            }
            return undefined;
        },
    };
}
/**
 * Create an empty HeaderFooterMap
 */
export function createEmptyHeaderFooterMap() {
    return createHeaderFooterMap(new Map());
}
/**
 * Build a HeaderFooterMap from references and XML content
 *
 * @param references - Header or footer references from sectPr
 * @param xmlContents - Map of rId to XML content
 * @param isHeader - true for headers, false for footers
 * @param styles - Style map
 * @param theme - Theme
 * @param numbering - Numbering definitions
 * @param rels - Relationships
 * @param media - Media files
 * @returns HeaderFooterMap with all parsed headers/footers
 */
export function buildHeaderFooterMap(references, xmlContents, isHeader, styles = null, theme = null, numbering = null, rels = null, media = null) {
    const byId = new Map();
    for (const ref of references) {
        const xml = xmlContents.get(ref.rId);
        if (xml) {
            const hf = parseHeaderFooter(xml, isHeader, ref.type, styles, theme, numbering, rels, media);
            byId.set(ref.rId, hf);
        }
    }
    return createHeaderFooterMap(byId);
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get plain text content of a header/footer
 */
export function getHeaderFooterText(hf) {
    const texts = [];
    for (const item of hf.content) {
        if (item.type === 'paragraph') {
            const paraTexts = [];
            for (const content of item.content) {
                if (content.type === 'run') {
                    for (const runContent of content.content) {
                        if (runContent.type === 'text') {
                            paraTexts.push(runContent.text);
                        }
                    }
                }
            }
            texts.push(paraTexts.join(''));
        }
        else if (item.type === 'table') {
            // Extract text from table cells
            for (const row of item.rows) {
                for (const cell of row.cells) {
                    for (const cellContent of cell.content) {
                        if (cellContent.type === 'paragraph') {
                            const paraTexts = [];
                            for (const content of cellContent.content) {
                                if (content.type === 'run') {
                                    for (const runContent of content.content) {
                                        if (runContent.type === 'text') {
                                            paraTexts.push(runContent.text);
                                        }
                                    }
                                }
                            }
                            texts.push(paraTexts.join(''));
                        }
                    }
                }
            }
        }
    }
    return texts.join('\n');
}
/**
 * Check if header/footer is empty (no content)
 */
export function isEmptyHeaderFooter(hf) {
    if (hf.content.length === 0)
        return true;
    // Check if all content is empty paragraphs
    for (const item of hf.content) {
        if (item.type === 'table')
            return false;
        if (item.type === 'paragraph' && item.content.length > 0) {
            // Check if paragraph has any actual content
            for (const content of item.content) {
                if (content.type !== 'run')
                    return false;
                for (const rc of content.content) {
                    if (rc.type === 'text' && rc.text.length > 0)
                        return false;
                    if (rc.type !== 'text')
                        return false; // Has image, field, etc.
                }
            }
        }
    }
    return true;
}
/**
 * Check if header/footer has page number field
 */
export function hasPageNumberField(hf) {
    for (const item of hf.content) {
        if (item.type === 'paragraph') {
            for (const content of item.content) {
                if (content.type === 'simpleField' || content.type === 'complexField') {
                    if (content.fieldType === 'PAGE' || content.fieldType === 'NUMPAGES') {
                        return true;
                    }
                }
                if (content.type === 'run') {
                    for (const rc of content.content) {
                        if (rc.type === 'fieldChar' && rc.charType === 'begin') {
                            // Part of a complex field - would need to check instruction
                            // For simplicity, we'll check the field content in the paragraph
                            continue;
                        }
                    }
                }
            }
        }
    }
    return false;
}
/**
 * Get the header for a given page considering type rules
 *
 * @param headers - Map of type to HeaderFooter
 * @param pageNumber - 1-based page number
 * @param isFirstPage - Whether this is the first page of the section
 * @param hasDifferentFirstPage - Whether different first page is enabled
 * @param hasDifferentOddEven - Whether different odd/even pages is enabled
 * @returns The appropriate HeaderFooter or undefined
 */
export function getHeaderForPage(headers, pageNumber, isFirstPage, hasDifferentFirstPage, hasDifferentOddEven) {
    // First page header takes priority if enabled
    if (isFirstPage && hasDifferentFirstPage) {
        const firstHeader = headers.get('first');
        if (firstHeader)
            return firstHeader;
    }
    // Even page header if enabled and page is even
    if (hasDifferentOddEven && pageNumber % 2 === 0) {
        const evenHeader = headers.get('even');
        if (evenHeader)
            return evenHeader;
    }
    // Default header for everything else
    return headers.get('default');
}
/**
 * Get the footer for a given page considering type rules
 * (Same logic as getHeaderForPage)
 */
export function getFooterForPage(footers, pageNumber, isFirstPage, hasDifferentFirstPage, hasDifferentOddEven) {
    if (isFirstPage && hasDifferentFirstPage) {
        const firstFooter = footers.get('first');
        if (firstFooter)
            return firstFooter;
    }
    if (hasDifferentOddEven && pageNumber % 2 === 0) {
        const evenFooter = footers.get('even');
        if (evenFooter)
            return evenFooter;
    }
    return footers.get('default');
}
/**
 * Convert HeaderFooterMap to type-indexed Map
 *
 * @param map - HeaderFooterMap
 * @returns Map indexed by HeaderFooterType
 */
export function headerFooterMapToTypeMap(map) {
    const result = new Map();
    for (const hf of map.getAll()) {
        // If there are multiple with same type, later ones overwrite
        result.set(hf.hdrFtrType, hf);
    }
    return result;
}
/**
 * Check if a HeaderFooter contains any images
 */
export function hasImages(hf) {
    for (const item of hf.content) {
        if (item.type === 'paragraph') {
            for (const content of item.content) {
                if (content.type === 'run') {
                    for (const rc of content.content) {
                        if (rc.type === 'drawing')
                            return true;
                    }
                }
            }
        }
    }
    return false;
}
/**
 * Check if a HeaderFooter contains any tables
 */
export function hasTables(hf) {
    for (const item of hf.content) {
        if (item.type === 'table')
            return true;
    }
    return false;
}
//# sourceMappingURL=headerFooterParser.js.map