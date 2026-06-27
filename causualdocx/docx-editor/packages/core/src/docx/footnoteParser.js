/**
 * Footnote/Endnote Parser - Parse footnotes.xml and endnotes.xml
 *
 * Footnotes and endnotes are stored in separate XML files within the DOCX package:
 * - word/footnotes.xml - Contains all footnote definitions
 * - word/endnotes.xml - Contains all endnote definitions
 *
 * Each note contains:
 * - An ID that matches references in document.xml (w:footnoteReference, w:endnoteReference)
 * - A type (normal, separator, continuationSeparator, continuationNotice)
 * - Content (paragraphs)
 *
 * The references in the document body are parsed by runParser as NoteReferenceContent.
 *
 * OOXML Reference:
 * - Footnote: w:footnote[@w:id][@w:type]
 * - Endnote: w:endnote[@w:id][@w:type]
 * - Content: w:p (paragraphs)
 */
import { parseXml, findChild, findChildren, getAttribute, getChildElements, parseNumericAttribute, } from './xmlParser';
import { parseParagraph } from './paragraphParser';
import { parseTable } from './tableParser';
// ============================================================================
// NOTE TYPE PARSING
// ============================================================================
/**
 * Parse note type attribute
 */
function parseNoteType(typeAttr) {
    switch (typeAttr) {
        case 'separator':
            return 'separator';
        case 'continuationSeparator':
            return 'continuationSeparator';
        case 'continuationNotice':
            return 'continuationNotice';
        default:
            return 'normal';
    }
}
// ============================================================================
// FOOTNOTE PARSING
// ============================================================================
/**
 * Walk a footnote/endnote element's direct children in document order and
 * collect block content (paragraphs + tables). Per ECMA-376 §17.11.10 a
 * footnote can hold the same blocks as the body; preserving document order
 * matters when a footnote interleaves text with a table.
 */
function parseNoteBlockContent(element, styles, theme, numbering, rels, media) {
    var _a;
    const blocks = [];
    for (const child of getChildElements(element)) {
        const name = (_a = child.name) !== null && _a !== void 0 ? _a : '';
        if (name === 'w:p') {
            blocks.push(parseParagraph(child, styles, theme, numbering, rels));
        }
        else if (name === 'w:tbl') {
            blocks.push(parseTable(child, styles, theme, numbering, rels, media));
        }
    }
    return blocks;
}
/**
 * Parse a single footnote element (w:footnote)
 */
function parseFootnote(element, styles, theme, numbering, rels, media) {
    var _a;
    const id = (_a = parseNumericAttribute(element, 'w', 'id')) !== null && _a !== void 0 ? _a : 0;
    const typeAttr = getAttribute(element, 'w', 'type');
    const noteType = parseNoteType(typeAttr);
    const content = parseNoteBlockContent(element, styles, theme, numbering, rels, media);
    return {
        type: 'footnote',
        id,
        noteType,
        content,
    };
}
/**
 * Parse footnotes.xml
 *
 * @param footnotesXml - The raw XML content of word/footnotes.xml
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks
 * @param media - Media files for images
 * @returns FootnoteMap with all footnotes
 */
export function parseFootnotes(footnotesXml, styles = null, theme = null, numbering = null, rels = null, media = null) {
    var _a;
    const byId = new Map();
    const footnotes = [];
    if (!footnotesXml) {
        return createFootnoteMap(byId, footnotes);
    }
    const doc = parseXml(footnotesXml);
    if (!doc) {
        return createFootnoteMap(byId, footnotes);
    }
    // Find the root footnotes element
    const rootElement = (_a = doc.elements) === null || _a === void 0 ? void 0 : _a.find((el) => { var _a; return el.type === 'element' && (el.name === 'w:footnotes' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':footnotes'))); });
    if (!rootElement) {
        return createFootnoteMap(byId, footnotes);
    }
    // Parse all footnote elements
    const footnoteElements = findChildren(rootElement, 'w', 'footnote');
    for (const fnEl of footnoteElements) {
        const footnote = parseFootnote(fnEl, styles, theme, numbering, rels, media);
        byId.set(footnote.id, footnote);
        footnotes.push(footnote);
    }
    return createFootnoteMap(byId, footnotes);
}
/**
 * Create FootnoteMap object with helper methods
 */
function createFootnoteMap(byId, footnotes) {
    return {
        byId,
        footnotes,
        getFootnote(id) {
            return byId.get(id);
        },
        hasFootnote(id) {
            return byId.has(id);
        },
        getNormalFootnotes() {
            return footnotes.filter((fn) => fn.noteType === 'normal');
        },
        getSeparator() {
            return footnotes.find((fn) => fn.noteType === 'separator');
        },
        getContinuationSeparator() {
            return footnotes.find((fn) => fn.noteType === 'continuationSeparator');
        },
    };
}
// ============================================================================
// ENDNOTE PARSING
// ============================================================================
/**
 * Parse a single endnote element (w:endnote)
 */
function parseEndnote(element, styles, theme, numbering, rels, media) {
    var _a;
    const id = (_a = parseNumericAttribute(element, 'w', 'id')) !== null && _a !== void 0 ? _a : 0;
    const typeAttr = getAttribute(element, 'w', 'type');
    const noteType = parseNoteType(typeAttr);
    const content = parseNoteBlockContent(element, styles, theme, numbering, rels, media);
    return {
        type: 'endnote',
        id,
        noteType,
        content,
    };
}
/**
 * Parse endnotes.xml
 *
 * @param endnotesXml - The raw XML content of word/endnotes.xml
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks
 * @param media - Media files for images
 * @returns EndnoteMap with all endnotes
 */
export function parseEndnotes(endnotesXml, styles = null, theme = null, numbering = null, rels = null, media = null) {
    var _a;
    const byId = new Map();
    const endnotes = [];
    if (!endnotesXml) {
        return createEndnoteMap(byId, endnotes);
    }
    const doc = parseXml(endnotesXml);
    if (!doc) {
        return createEndnoteMap(byId, endnotes);
    }
    // Find the root endnotes element
    const rootElement = (_a = doc.elements) === null || _a === void 0 ? void 0 : _a.find((el) => { var _a; return el.type === 'element' && (el.name === 'w:endnotes' || ((_a = el.name) === null || _a === void 0 ? void 0 : _a.endsWith(':endnotes'))); });
    if (!rootElement) {
        return createEndnoteMap(byId, endnotes);
    }
    // Parse all endnote elements
    const endnoteElements = findChildren(rootElement, 'w', 'endnote');
    for (const enEl of endnoteElements) {
        const endnote = parseEndnote(enEl, styles, theme, numbering, rels, media);
        byId.set(endnote.id, endnote);
        endnotes.push(endnote);
    }
    return createEndnoteMap(byId, endnotes);
}
/**
 * Create EndnoteMap object with helper methods
 */
function createEndnoteMap(byId, endnotes) {
    return {
        byId,
        endnotes,
        getEndnote(id) {
            return byId.get(id);
        },
        hasEndnote(id) {
            return byId.has(id);
        },
        getNormalEndnotes() {
            return endnotes.filter((en) => en.noteType === 'normal');
        },
        getSeparator() {
            return endnotes.find((en) => en.noteType === 'separator');
        },
        getContinuationSeparator() {
            return endnotes.find((en) => en.noteType === 'continuationSeparator');
        },
    };
}
// ============================================================================
// FOOTNOTE/ENDNOTE PROPERTIES PARSING
// ============================================================================
/**
 * Parse number format from w:numFmt element
 */
function parseNumberFormat(numFmtAttr) {
    if (!numFmtAttr)
        return undefined;
    // Map OOXML numFmt values to our NumberFormat type
    const formatMap = {
        decimal: 'decimal',
        upperRoman: 'upperRoman',
        lowerRoman: 'lowerRoman',
        upperLetter: 'upperLetter',
        lowerLetter: 'lowerLetter',
        ordinal: 'ordinal',
        cardinalText: 'cardinalText',
        ordinalText: 'ordinalText',
        bullet: 'bullet',
        chicago: 'chicago',
        none: 'none',
    };
    return formatMap[numFmtAttr];
}
/**
 * Parse footnote position
 */
function parseFootnotePosition(posAttr) {
    switch (posAttr) {
        case 'pageBottom':
            return 'pageBottom';
        case 'beneathText':
            return 'beneathText';
        case 'sectEnd':
            return 'sectEnd';
        case 'docEnd':
            return 'docEnd';
        default:
            return undefined;
    }
}
/**
 * Parse endnote position
 */
function parseEndnotePosition(posAttr) {
    switch (posAttr) {
        case 'sectEnd':
            return 'sectEnd';
        case 'docEnd':
            return 'docEnd';
        default:
            return undefined;
    }
}
/**
 * Parse number restart type
 */
function parseNumberRestart(restartAttr) {
    switch (restartAttr) {
        case 'continuous':
            return 'continuous';
        case 'eachSect':
            return 'eachSect';
        case 'eachPage':
            return 'eachPage';
        default:
            return undefined;
    }
}
/**
 * Parse footnote properties from w:footnotePr element
 * (Can appear in w:sectPr or w:settings)
 */
export function parseFootnoteProperties(element) {
    var _a;
    const props = {};
    if (!element)
        return props;
    // Position (w:pos)
    const posEl = findChild(element, 'w', 'pos');
    if (posEl) {
        const posAttr = getAttribute(posEl, 'w', 'val');
        props.position = parseFootnotePosition(posAttr);
    }
    // Number format (w:numFmt)
    const numFmtEl = findChild(element, 'w', 'numFmt');
    if (numFmtEl) {
        const fmtAttr = getAttribute(numFmtEl, 'w', 'val');
        props.numFmt = parseNumberFormat(fmtAttr);
    }
    // Start number (w:numStart)
    const numStartEl = findChild(element, 'w', 'numStart');
    if (numStartEl) {
        props.numStart = (_a = parseNumericAttribute(numStartEl, 'w', 'val')) !== null && _a !== void 0 ? _a : undefined;
    }
    // Number restart (w:numRestart)
    const numRestartEl = findChild(element, 'w', 'numRestart');
    if (numRestartEl) {
        const restartAttr = getAttribute(numRestartEl, 'w', 'val');
        props.numRestart = parseNumberRestart(restartAttr);
    }
    return props;
}
/**
 * Parse endnote properties from w:endnotePr element
 * (Can appear in w:sectPr or w:settings)
 */
export function parseEndnoteProperties(element) {
    var _a;
    const props = {};
    if (!element)
        return props;
    // Position (w:pos)
    const posEl = findChild(element, 'w', 'pos');
    if (posEl) {
        const posAttr = getAttribute(posEl, 'w', 'val');
        props.position = parseEndnotePosition(posAttr);
    }
    // Number format (w:numFmt)
    const numFmtEl = findChild(element, 'w', 'numFmt');
    if (numFmtEl) {
        const fmtAttr = getAttribute(numFmtEl, 'w', 'val');
        props.numFmt = parseNumberFormat(fmtAttr);
    }
    // Start number (w:numStart)
    const numStartEl = findChild(element, 'w', 'numStart');
    if (numStartEl) {
        props.numStart = (_a = parseNumericAttribute(numStartEl, 'w', 'val')) !== null && _a !== void 0 ? _a : undefined;
    }
    // Number restart (w:numRestart)
    const numRestartEl = findChild(element, 'w', 'numRestart');
    if (numRestartEl) {
        const restartAttr = getAttribute(numRestartEl, 'w', 'val');
        props.numRestart = parseNumberRestart(restartAttr);
    }
    return props;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get plain text content of a footnote
 */
export function getFootnoteText(footnote) {
    // Now that footnote.content can include tables (per ECMA-376 §17.11.10),
    // skip non-paragraph blocks for the plain-text representation. Tables are
    // still rendered visually via the body pipeline; they just don't
    // contribute to this textual summary.
    const texts = [];
    for (const block of footnote.content) {
        if (block.type !== 'paragraph')
            continue;
        const paraTexts = [];
        for (const content of block.content) {
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
    return texts.join('\n');
}
/**
 * Get plain text content of an endnote
 */
export function getEndnoteText(endnote) {
    // Same as getFootnoteText — skip non-paragraph blocks for the textual
    // summary; tables still render visually downstream.
    const texts = [];
    for (const block of endnote.content) {
        if (block.type !== 'paragraph')
            continue;
        const paraTexts = [];
        for (const content of block.content) {
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
    return texts.join('\n');
}
/**
 * Check if a footnote is a separator (not regular content)
 */
export function isSeparatorFootnote(footnote) {
    return (footnote.noteType === 'separator' ||
        footnote.noteType === 'continuationSeparator' ||
        footnote.noteType === 'continuationNotice');
}
/**
 * Check if an endnote is a separator (not regular content)
 */
export function isSeparatorEndnote(endnote) {
    return (endnote.noteType === 'separator' ||
        endnote.noteType === 'continuationSeparator' ||
        endnote.noteType === 'continuationNotice');
}
/**
 * Get footnote number for display (excluding separators)
 * @param footnote - The footnote to get the number for
 * @param footnoteMap - The footnote map
 * @param startNumber - Starting number (default 1)
 * @returns The display number, or null for separator footnotes
 */
export function getFootnoteDisplayNumber(footnote, footnoteMap, startNumber = 1) {
    if (isSeparatorFootnote(footnote)) {
        return null;
    }
    const normalFootnotes = footnoteMap.getNormalFootnotes();
    const index = normalFootnotes.findIndex((fn) => fn.id === footnote.id);
    if (index === -1) {
        return null;
    }
    return startNumber + index;
}
/**
 * Get endnote number for display (excluding separators)
 * @param endnote - The endnote to get the number for
 * @param endnoteMap - The endnote map
 * @param startNumber - Starting number (default 1)
 * @returns The display number, or null for separator endnotes
 */
export function getEndnoteDisplayNumber(endnote, endnoteMap, startNumber = 1) {
    if (isSeparatorEndnote(endnote)) {
        return null;
    }
    const normalEndnotes = endnoteMap.getNormalEndnotes();
    const index = normalEndnotes.findIndex((en) => en.id === endnote.id);
    if (index === -1) {
        return null;
    }
    return startNumber + index;
}
/**
 * Create an empty footnote map
 */
export function createEmptyFootnoteMap() {
    return createFootnoteMap(new Map(), []);
}
/**
 * Create an empty endnote map
 */
export function createEmptyEndnoteMap() {
    return createEndnoteMap(new Map(), []);
}
/**
 * Merge multiple footnote maps (e.g., from different documents)
 */
export function mergeFootnoteMaps(...maps) {
    const byId = new Map();
    const footnotes = [];
    for (const map of maps) {
        for (const fn of map.footnotes) {
            if (!byId.has(fn.id)) {
                byId.set(fn.id, fn);
                footnotes.push(fn);
            }
        }
    }
    return createFootnoteMap(byId, footnotes);
}
/**
 * Merge multiple endnote maps (e.g., from different documents)
 */
export function mergeEndnoteMaps(...maps) {
    const byId = new Map();
    const endnotes = [];
    for (const map of maps) {
        for (const en of map.endnotes) {
            if (!byId.has(en.id)) {
                byId.set(en.id, en);
                endnotes.push(en);
            }
        }
    }
    return createEndnoteMap(byId, endnotes);
}
//# sourceMappingURL=footnoteParser.js.map