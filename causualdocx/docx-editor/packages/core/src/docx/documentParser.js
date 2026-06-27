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
import { parseXml, findChild, getChildElements, getAttribute } from './xmlParser';
import { parseParagraph, getParagraphText } from './paragraphParser';
import { parseTable } from './tableParser';
import { parseSectionProperties, getDefaultSectionProperties } from './sectionParser';
import { enrichParagraphTextBoxes } from './textBoxEnricher';
// ============================================================================
// LIST MARKER COMPUTATION
// ============================================================================
/**
 * Convert Symbol font bullet characters to Unicode equivalents
 *
 * DOCX often uses characters from Symbol, Wingdings, or Webdings fonts
 * that don't render correctly without the font. This maps them to
 * standard Unicode bullets that work with any font.
 */
export function convertBulletToUnicode(bulletChar) {
    // If empty or whitespace, use standard bullet
    if (!bulletChar || bulletChar.trim() === '') {
        return '•';
    }
    // Get the character code
    const charCode = bulletChar.charCodeAt(0);
    // Map common Symbol/Wingdings characters to Unicode
    // Symbol font mappings (often used for bullets)
    const symbolMap = {
        // Symbol font
        0x00b7: '•', // Middle dot → bullet
        0x006f: '○', // lowercase o → white circle (used in Symbol font)
        0x00a7: '■', // Section sign → black square (Symbol)
        0x00fc: '✓', // Checkmark in Symbol/Wingdings
        // Wingdings mappings (character codes when Wingdings not available)
        0x006e: '■', // Wingdings n → black square
        0x0071: '○', // Wingdings q → white circle
        0x0075: '◆', // Wingdings u → black diamond
        0x0076: '❖', // Wingdings v → diamond
        0x00a8: '✓', // Wingdings checkmark
        0x00fb: '✓', // Checkmark
        0x00fe: '✓', // Checkmark variant
        // Common control characters that might appear
        0xf0b7: '•', // Private use area bullet
        0xf06e: '■', // Private use area square
        0xf06f: '○', // Private use area circle
        0xf0a7: '■', // Private use area
        0xf0fc: '✓', // Private use area checkmark
        // Other common bullet-like characters
        0x2022: '•', // Already a bullet
        0x25cf: '●', // Black circle
        0x25cb: '○', // White circle
        0x25a0: '■', // Black square
        0x25a1: '□', // White square
        0x25c6: '◆', // Black diamond
        0x25c7: '◇', // White diamond
        0x2013: '–', // En dash
        0x2014: '—', // Em dash
        0x003e: '>', // Greater than (used as arrow)
        0x002d: '-', // Hyphen
    };
    // Check if we have a mapping for this character
    if (symbolMap[charCode]) {
        return symbolMap[charCode];
    }
    // If it's in the private use area (often Symbol/Wingdings), use bullet
    if (charCode >= 0xe000 && charCode <= 0xf8ff) {
        return '•';
    }
    // If it's a control character or non-printable, use bullet
    if (charCode < 32 || (charCode >= 127 && charCode < 160)) {
        return '•';
    }
    // Otherwise, use the character as-is (might be a valid Unicode bullet)
    return bulletChar;
}
/**
 * Convert bullet markers (raw lvlText, often a Symbol-font glyph) to Unicode.
 *
 * Numbered list resolution lives in `toFlowBlocks.computeListMarker` so that
 * body, table-cell, and text-box paragraphs share one counter map. Doing it
 * here for body-only would double-resolve and desync counters across
 * containers.
 */
function resolveBulletMarker(paragraph) {
    const listRendering = paragraph.listRendering;
    if (!listRendering)
        return;
    if (!listRendering.isBullet)
        return;
    listRendering.marker = convertBulletToUnicode(listRendering.marker || '');
}
// ============================================================================
// TEMPLATE VARIABLE DETECTION
// ============================================================================
/**
 * Regular expression to match template variables {{...}}
 */
const TEMPLATE_VARIABLE_REGEX = /\{([a-zA-Z_][a-zA-Z0-9_\-\.]*)\}/g;
/**
 * Extract template variables from text
 *
 * @param text - Text to search for variables
 * @returns Array of unique variable names (without braces)
 */
export function extractTemplateVariables(text) {
    const variables = [];
    let match;
    // Reset regex state
    TEMPLATE_VARIABLE_REGEX.lastIndex = 0;
    while ((match = TEMPLATE_VARIABLE_REGEX.exec(text)) !== null) {
        const varName = match[1].trim();
        if (varName && !variables.includes(varName)) {
            variables.push(varName);
        }
    }
    return variables;
}
/**
 * Extract all template variables from document content
 *
 * @param content - Array of paragraphs and tables
 * @returns Array of unique variable names
 */
export function extractAllTemplateVariables(content) {
    const variables = [];
    for (const block of content) {
        if (block.type === 'paragraph') {
            const text = getParagraphText(block);
            const vars = extractTemplateVariables(text);
            for (const v of vars) {
                if (!variables.includes(v)) {
                    variables.push(v);
                }
            }
        }
        else if (block.type === 'table') {
            // Recursively check table cells
            const tableVars = extractTableVariables(block);
            for (const v of tableVars) {
                if (!variables.includes(v)) {
                    variables.push(v);
                }
            }
        }
    }
    return variables;
}
/**
 * Extract template variables from a table
 */
function extractTableVariables(table) {
    const variables = [];
    for (const row of table.rows) {
        for (const cell of row.cells) {
            for (const cellContent of cell.content) {
                if (cellContent.type === 'paragraph') {
                    const text = getParagraphText(cellContent);
                    const vars = extractTemplateVariables(text);
                    for (const v of vars) {
                        if (!variables.includes(v)) {
                            variables.push(v);
                        }
                    }
                }
                else if (cellContent.type === 'table') {
                    // Nested table
                    const nestedVars = extractTableVariables(cellContent);
                    for (const v of nestedVars) {
                        if (!variables.includes(v)) {
                            variables.push(v);
                        }
                    }
                }
            }
        }
    }
    return variables;
}
// ============================================================================
// CONTENT PARSING
// ============================================================================
// (enrichParagraphTextBoxes was moved to ./textBoxEnricher so the
//  header/footer parser can reuse it without a circular dep — issue #318.)
/**
 * Parse block content from an element (body or SDT content)
 *
 * @param parent - Parent element containing content
 * @param styles - Style map
 * @param theme - Theme
 * @param numbering - Numbering definitions
 * @param rels - Relationships
 * @param media - Media files
 * @returns Array of block content (paragraphs, tables)
 */
function parseBlockContent(parent, styles, theme, numbering, rels, media) {
    var _a, _b;
    const content = [];
    const children = getChildElements(parent);
    for (const child of children) {
        const name = (_a = child.name) !== null && _a !== void 0 ? _a : '';
        // Paragraph (w:p)
        if (name === 'w:p' || name.endsWith(':p')) {
            const paragraph = parseParagraph(child, styles, theme, numbering, rels, media);
            // Enrich with text box content (parsed in a second pass to avoid circular deps)
            enrichParagraphTextBoxes(paragraph, child, styles, theme, numbering, rels, media);
            // Convert bullet glyphs (Symbol font → Unicode). Numbered marker
            // resolution happens later in toFlowBlocks where body, table, and
            // text-box paragraphs share one counter map.
            resolveBulletMarker(paragraph);
            content.push(paragraph);
        }
        // Table (w:tbl)
        else if (name === 'w:tbl' || name.endsWith(':tbl')) {
            const table = parseTable(child, styles, theme, numbering, rels, media);
            content.push(table);
        }
        // Structured Document Tag (w:sdt) - container for content
        else if (name === 'w:sdt' || name.endsWith(':sdt')) {
            // Find the content element inside SDT
            const sdtContent = ((_b = child.elements) !== null && _b !== void 0 ? _b : []).find((el) => { var _a; return el.type === 'element' && (el.name === 'w:sdtContent' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':sdtContent'))); });
            if (sdtContent) {
                // Recursively parse content inside SDT
                const sdtBlockContent = parseBlockContent(sdtContent, styles, theme, numbering, rels, media);
                content.push(...sdtBlockContent);
            }
        }
        // Section properties (w:sectPr) - handled separately at body level
        // Skip here as we handle it after content parsing
    }
    return content;
}
// ============================================================================
// SECTION BUILDING
// ============================================================================
/**
 * Build sections from content based on section properties in paragraphs
 *
 * In OOXML, sections are delimited by:
 * 1. w:pPr/w:sectPr within a paragraph (marks end of a section)
 * 2. w:body/w:sectPr (final section properties)
 *
 * @param content - All block content
 * @param finalSectPr - Final section properties from body
 * @returns Array of sections
 */
function buildSections(content, finalSectPr) {
    const sections = [];
    let currentSectionContent = [];
    for (const block of content) {
        currentSectionContent.push(block);
        // Check if this paragraph ends a section
        if (block.type === 'paragraph' && block.sectionProperties) {
            // This paragraph ends a section
            sections.push({
                properties: block.sectionProperties,
                content: currentSectionContent,
            });
            // Start new section
            currentSectionContent = [];
        }
    }
    // Add final section with remaining content
    if (currentSectionContent.length > 0 || sections.length === 0) {
        sections.push({
            properties: finalSectPr !== null && finalSectPr !== void 0 ? finalSectPr : getDefaultSectionProperties(),
            content: currentSectionContent,
        });
    }
    return sections;
}
// ============================================================================
// MAIN PARSER
// ============================================================================
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
export function parseDocumentBody(xml, styles = null, theme = null, numbering = null, rels = null, media = null) {
    var _a;
    const result = {
        content: [],
    };
    if (!xml) {
        return result;
    }
    // Parse XML
    const doc = parseXml(xml);
    if (!doc) {
        return result;
    }
    // Find root document element (w:document)
    const documentEl = ((_a = doc.elements) !== null && _a !== void 0 ? _a : []).find((el) => { var _a; return el.type === 'element' && (el.name === 'w:document' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':document'))); });
    if (!documentEl) {
        return result;
    }
    // Find body element (w:body)
    const bodyEl = findChild(documentEl, 'w', 'body');
    if (!bodyEl) {
        return result;
    }
    // Parse all block content (paragraphs, tables)
    result.content = parseBlockContent(bodyEl, styles, theme, numbering, rels, media);
    // Parse final section properties (w:body/w:sectPr)
    const finalSectPr = findChild(bodyEl, 'w', 'sectPr');
    if (finalSectPr) {
        result.finalSectionProperties = parseSectionProperties(finalSectPr, rels);
    }
    // Parse doc-level `<w:background>` (sibling of w:body, per OOXML
    // §17.2.1). This is Word's canonical "Page color" location — Google
    // Docs' Page color setting saves here too. The painter promotes
    // `body.background.color` to the rendered page background when the
    // host hasn't overridden `PainterOptions.pageBackground`.
    const backgroundEl = findChild(documentEl, 'w', 'background');
    if (backgroundEl) {
        const bg = {};
        const colorVal = getAttribute(backgroundEl, 'w', 'color');
        if (colorVal && colorVal !== 'auto') {
            bg.color = { rgb: colorVal };
        }
        const themeColor = getAttribute(backgroundEl, 'w', 'themeColor');
        if (themeColor)
            bg.themeColor = themeColor;
        const themeTint = getAttribute(backgroundEl, 'w', 'themeTint');
        if (themeTint)
            bg.themeTint = themeTint;
        const themeShade = getAttribute(backgroundEl, 'w', 'themeShade');
        if (themeShade)
            bg.themeShade = themeShade;
        // Even an empty-but-present element counts — preserves the slot
        // for round-trip and signals "background exists" downstream.
        result.background = bg;
    }
    // Build sections from content
    result.sections = buildSections(result.content, result.finalSectionProperties);
    return result;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get all paragraphs from document body (flattened)
 */
export function getAllParagraphs(body) {
    const paragraphs = [];
    for (const block of body.content) {
        if (block.type === 'paragraph') {
            paragraphs.push(block);
        }
        else if (block.type === 'table') {
            // Get paragraphs from table cells
            paragraphs.push(...getTableParagraphs(block));
        }
    }
    return paragraphs;
}
/**
 * Get all paragraphs from a table (recursively)
 */
function getTableParagraphs(table) {
    const paragraphs = [];
    for (const row of table.rows) {
        for (const cell of row.cells) {
            for (const content of cell.content) {
                if (content.type === 'paragraph') {
                    paragraphs.push(content);
                }
                else if (content.type === 'table') {
                    paragraphs.push(...getTableParagraphs(content));
                }
            }
        }
    }
    return paragraphs;
}
/**
 * Get all tables from document body
 */
export function getAllTables(body) {
    const tables = [];
    for (const block of body.content) {
        if (block.type === 'table') {
            tables.push(block);
            // Also get nested tables
            tables.push(...getNestedTables(block));
        }
    }
    return tables;
}
/**
 * Get nested tables from a table (recursively)
 */
function getNestedTables(table) {
    const tables = [];
    for (const row of table.rows) {
        for (const cell of row.cells) {
            for (const content of cell.content) {
                if (content.type === 'table') {
                    tables.push(content);
                    tables.push(...getNestedTables(content));
                }
            }
        }
    }
    return tables;
}
/**
 * Get plain text from entire document body
 */
export function getDocumentText(body) {
    const lines = [];
    for (const block of body.content) {
        if (block.type === 'paragraph') {
            lines.push(getParagraphText(block));
        }
        else if (block.type === 'table') {
            lines.push(getTableText(block));
        }
    }
    return lines.join('\n');
}
/**
 * Get plain text from a table
 */
function getTableText(table) {
    const lines = [];
    for (const row of table.rows) {
        const rowTexts = [];
        for (const cell of row.cells) {
            const cellTexts = [];
            for (const content of cell.content) {
                if (content.type === 'paragraph') {
                    cellTexts.push(getParagraphText(content));
                }
                else if (content.type === 'table') {
                    cellTexts.push(getTableText(content));
                }
            }
            rowTexts.push(cellTexts.join('\n'));
        }
        lines.push(rowTexts.join('\t'));
    }
    return lines.join('\n');
}
/**
 * Count total paragraphs in document
 */
export function getParagraphCount(body) {
    return getAllParagraphs(body).length;
}
/**
 * Count total words in document (approximate)
 */
export function getWordCount(body) {
    const text = getDocumentText(body);
    // Simple word counting - split by whitespace
    const words = text.trim().split(/\s+/);
    return words.length > 0 && words[0] !== '' ? words.length : 0;
}
/**
 * Count total characters in document
 */
export function getCharacterCount(body) {
    return getDocumentText(body).length;
}
/**
 * Get section count
 */
export function getSectionCount(body) {
    var _a, _b;
    return (_b = (_a = body.sections) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 1;
}
/**
 * Check if document has template variables
 */
export function hasTemplateVariables(body) {
    return extractAllTemplateVariables(body.content).length > 0;
}
/**
 * Get document outline (first N characters of each paragraph)
 *
 * @param body - Document body
 * @param maxCharsPerPara - Max characters per paragraph (default: 100)
 * @param maxParagraphs - Max paragraphs to include (default: 50)
 * @returns Array of paragraph previews
 */
export function getDocumentOutline(body, maxCharsPerPara = 100, maxParagraphs = 50) {
    const outline = [];
    const paragraphs = getAllParagraphs(body);
    for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
        const text = getParagraphText(paragraphs[i]).trim();
        if (text.length > 0) {
            outline.push(text.length > maxCharsPerPara ? text.substring(0, maxCharsPerPara) + '...' : text);
        }
    }
    return outline;
}
//# sourceMappingURL=documentParser.js.map