/**
 * Agent Context Builder
 *
 * Generates context objects for AI/LLM consumption from DOCX documents.
 * The context provides a structured summary of the document that can be
 * used by AI agents to understand the document structure and content.
 *
 * All outputs are JSON serializable for easy transmission to AI backends.
 */
import { detectVariables } from '../utils/variableDetector';
// ============================================================================
// MAIN FUNCTIONS
// ============================================================================
/**
 * Build agent context from a document
 *
 * @param doc - The parsed document
 * @param options - Context building options
 * @returns AgentContext object (JSON serializable)
 */
export function getAgentContext(doc, options = {}) {
    const { outlineMaxChars = 100, maxOutlineParagraphs = 50 } = options;
    const body = doc.package.document;
    // Get paragraphs
    const paragraphs = body.content.filter((block) => block.type === 'paragraph');
    // Build outline
    const outline = buildOutline(paragraphs, outlineMaxChars, maxOutlineParagraphs);
    // Get variables
    const variables = detectVariables(doc);
    // Get styles
    const availableStyles = getStylesFromDoc(doc);
    // Get sections
    const sections = getSectionsInfo(body);
    // Calculate counts
    const wordCount = calculateWordCount(body);
    const characterCount = calculateCharacterCount(body);
    // Check for features
    const hasTables = body.content.some((b) => b.type === 'table');
    const hasImages = hasDocImages(body);
    const hasHyperlinks = hasDocHyperlinks(body);
    return {
        paragraphCount: paragraphs.length,
        wordCount,
        characterCount,
        variables,
        variableCount: variables.length,
        availableStyles,
        outline,
        sections,
        hasTables,
        hasImages,
        hasHyperlinks,
    };
}
/**
 * Build selection context for AI operations
 *
 * @param doc - The parsed document
 * @param range - The selected range
 * @param options - Selection context options
 * @returns SelectionContext object (JSON serializable)
 */
export function buildSelectionContext(doc, range, options = {}) {
    var _a;
    const { contextChars = 200, includeSuggestions = true } = options;
    const body = doc.package.document;
    const paragraphs = body.content.filter((block) => block.type === 'paragraph');
    // Get the paragraph at the start of the selection
    const paragraph = paragraphs[range.start.paragraphIndex];
    if (!paragraph) {
        throw new Error(`Paragraph not found at index ${range.start.paragraphIndex}`);
    }
    // Get paragraph text
    const paragraphText = getParagraphText(paragraph);
    // Extract selected text
    let selectedText = '';
    if (range.start.paragraphIndex === range.end.paragraphIndex) {
        selectedText = paragraphText.slice(range.start.offset, range.end.offset);
    }
    else {
        // Multi-paragraph selection
        const texts = [];
        for (let i = range.start.paragraphIndex; i <= range.end.paragraphIndex; i++) {
            const para = paragraphs[i];
            if (!para)
                continue;
            const text = getParagraphText(para);
            if (i === range.start.paragraphIndex) {
                texts.push(text.slice(range.start.offset));
            }
            else if (i === range.end.paragraphIndex) {
                texts.push(text.slice(0, range.end.offset));
            }
            else {
                texts.push(text);
            }
        }
        selectedText = texts.join('\n');
    }
    // Get context before and after selection
    const textBefore = getTextBefore(paragraphs, range.start.paragraphIndex, range.start.offset, contextChars);
    const textAfter = getTextAfter(paragraphs, range.end.paragraphIndex, range.end.offset, contextChars);
    // Get formatting from first run in selection
    const formatting = getFormattingAtPosition(paragraph, range.start.offset);
    const paragraphFormatting = paragraph.formatting || {};
    // Build paragraph context
    const paragraphContext = {
        index: range.start.paragraphIndex,
        fullText: paragraphText,
        style: (_a = paragraph.formatting) === null || _a === void 0 ? void 0 : _a.styleId,
        wordCount: countWords(paragraphText),
    };
    // Check if in table or hyperlink.
    //
    // `inTable` is always false by design: `paragraphs` above filters
    // `body.content` to top-level paragraph blocks only — table cells
    // contain their own paragraphs that are never reachable through
    // `range.start.paragraphIndex` in the current addressing scheme.
    // Extending the agent to address paragraphs inside tables requires
    // either (a) a flattened-paragraph walker that recurses into
    // table / row / cell content, or (b) a separate `tableCell` range
    // type. Both are out of scope until the agent gets table-editing
    // actions.
    const inTable = false;
    const inHyperlink = isInHyperlink(paragraph, range.start.offset);
    // Build suggested actions
    const suggestedActions = includeSuggestions
        ? getSuggestedActions(selectedText, formatting, paragraphContext)
        : [];
    return {
        selectedText,
        range,
        formatting,
        paragraphFormatting,
        textBefore,
        textAfter,
        paragraph: paragraphContext,
        inTable,
        inHyperlink,
        suggestedActions,
    };
}
/**
 * Get a simple document summary for quick context
 *
 * @param doc - The parsed document
 * @returns Summary string
 */
export function getDocumentSummary(doc) {
    const context = getAgentContext(doc, {
        outlineMaxChars: 50,
        maxOutlineParagraphs: 10,
    });
    const parts = [
        `Document with ${context.paragraphCount} paragraphs, ${context.wordCount} words.`,
    ];
    if (context.hasTables) {
        parts.push('Contains tables.');
    }
    if (context.hasImages) {
        parts.push('Contains images.');
    }
    if (context.hasHyperlinks) {
        parts.push('Contains hyperlinks.');
    }
    if (context.variableCount > 0) {
        parts.push(`Has ${context.variableCount} template variables: ${context.variables.join(', ')}`);
    }
    // Add headings outline
    const headings = context.outline.filter((p) => p.isHeading);
    if (headings.length > 0) {
        parts.push('\nHeadings:');
        for (const heading of headings.slice(0, 5)) {
            const level = heading.headingLevel || 1;
            parts.push(`${'  '.repeat(level - 1)}- ${heading.preview}`);
        }
        if (headings.length > 5) {
            parts.push(`  ... and ${headings.length - 5} more headings`);
        }
    }
    return parts.join(' ');
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Build document outline
 */
function buildOutline(paragraphs, maxChars, maxParagraphs) {
    var _a;
    const outline = [];
    for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
        const para = paragraphs[i];
        const text = getParagraphText(para);
        const styleId = (_a = para.formatting) === null || _a === void 0 ? void 0 : _a.styleId;
        outline.push({
            index: i,
            preview: text.slice(0, maxChars),
            style: styleId,
            isHeading: isHeadingStyle(styleId),
            headingLevel: parseHeadingLevel(styleId),
            isListItem: !!para.listRendering,
            isEmpty: text.trim().length === 0,
        });
    }
    return outline;
}
/**
 * Get styles from document
 */
function getStylesFromDoc(doc) {
    const styleDefinitions = doc.package.styles;
    if (!(styleDefinitions === null || styleDefinitions === void 0 ? void 0 : styleDefinitions.styles)) {
        return [];
    }
    const styleInfos = [];
    for (const [styleId, style] of Object.entries(styleDefinitions.styles)) {
        if (typeof style === 'object' && style !== null) {
            const styleObj = style;
            styleInfos.push({
                id: styleId,
                name: styleObj.name || styleId,
                type: styleObj.type === 'numbering' ? 'paragraph' : styleObj.type || 'paragraph',
                builtIn: styleObj.default, // Use default property as proxy for built-in
            });
        }
    }
    return styleInfos;
}
/**
 * Get sections info
 */
function getSectionsInfo(body) {
    if (!body.sections) {
        return [];
    }
    return body.sections.map((section, index) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return ({
            index,
            paragraphCount: ((_a = section.content) === null || _a === void 0 ? void 0 : _a.length) || 0,
            pageSize: ((_b = section.properties) === null || _b === void 0 ? void 0 : _b.pageWidth) && ((_c = section.properties) === null || _c === void 0 ? void 0 : _c.pageHeight)
                ? {
                    width: section.properties.pageWidth,
                    height: section.properties.pageHeight,
                }
                : undefined,
            isLandscape: ((_d = section.properties) === null || _d === void 0 ? void 0 : _d.orientation) === 'landscape',
            hasHeader: !!((_f = (_e = section.properties) === null || _e === void 0 ? void 0 : _e.headerReferences) === null || _f === void 0 ? void 0 : _f.length),
            hasFooter: !!((_h = (_g = section.properties) === null || _g === void 0 ? void 0 : _g.footerReferences) === null || _h === void 0 ? void 0 : _h.length),
        });
    });
}
/**
 * Calculate word count for document body
 */
function calculateWordCount(body) {
    let count = 0;
    for (const block of body.content) {
        if (block.type === 'paragraph') {
            const text = getParagraphText(block);
            count += countWords(text);
        }
        else if (block.type === 'table') {
            count += getTableWordCount(block);
        }
    }
    return count;
}
/**
 * Count words in text
 */
function countWords(text) {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    return words.length;
}
/**
 * Calculate character count for document body
 */
function calculateCharacterCount(body) {
    let count = 0;
    for (const block of body.content) {
        if (block.type === 'paragraph') {
            const text = getParagraphText(block);
            count += text.length;
        }
        else if (block.type === 'table') {
            count += getTableCharacterCount(block);
        }
    }
    return count;
}
/**
 * Get word count from table
 */
function getTableWordCount(table) {
    let count = 0;
    for (const row of table.rows) {
        for (const cell of row.cells) {
            for (const block of cell.content) {
                if (block.type === 'paragraph') {
                    const text = getParagraphText(block);
                    count += countWords(text);
                }
            }
        }
    }
    return count;
}
/**
 * Get character count from table
 */
function getTableCharacterCount(table) {
    let count = 0;
    for (const row of table.rows) {
        for (const cell of row.cells) {
            for (const block of cell.content) {
                if (block.type === 'paragraph') {
                    const text = getParagraphText(block);
                    count += text.length;
                }
            }
        }
    }
    return count;
}
/**
 * Get plain text from paragraph
 */
function getParagraphText(paragraph) {
    const texts = [];
    for (const item of paragraph.content) {
        if (item.type === 'run') {
            texts.push(getRunText(item));
        }
        else if (item.type === 'hyperlink') {
            texts.push(getHyperlinkText(item));
        }
    }
    return texts.join('');
}
/**
 * Get plain text from run
 */
function getRunText(run) {
    return run.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');
}
/**
 * Get plain text from hyperlink
 */
function getHyperlinkText(hyperlink) {
    const texts = [];
    for (const child of hyperlink.children) {
        if (child.type === 'run') {
            texts.push(getRunText(child));
        }
    }
    return texts.join('');
}
/**
 * Check if document has images
 */
function hasDocImages(body) {
    for (const block of body.content) {
        if (block.type === 'paragraph') {
            for (const item of block.content) {
                if (item.type === 'run') {
                    for (const content of item.content) {
                        if (content.type === 'drawing') {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}
/**
 * Check if document has hyperlinks
 */
function hasDocHyperlinks(body) {
    for (const block of body.content) {
        if (block.type === 'paragraph') {
            for (const item of block.content) {
                if (item.type === 'hyperlink') {
                    return true;
                }
            }
        }
    }
    return false;
}
/**
 * Check if style is a heading
 */
function isHeadingStyle(styleId) {
    if (!styleId)
        return false;
    return styleId.toLowerCase().includes('heading');
}
/**
 * Parse heading level from style ID
 */
function parseHeadingLevel(styleId) {
    if (!styleId)
        return undefined;
    const match = styleId.match(/heading\s*(\d)/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return undefined;
}
/**
 * Get text before a position
 */
function getTextBefore(paragraphs, paragraphIndex, offset, maxChars) {
    const texts = [];
    let totalChars = 0;
    // Get text before offset in current paragraph
    const currentPara = paragraphs[paragraphIndex];
    if (currentPara) {
        const text = getParagraphText(currentPara);
        const beforeText = text.slice(0, offset);
        texts.unshift(beforeText);
        totalChars += beforeText.length;
    }
    // Get text from previous paragraphs if needed
    for (let i = paragraphIndex - 1; i >= 0 && totalChars < maxChars; i--) {
        const para = paragraphs[i];
        if (!para)
            continue;
        const text = getParagraphText(para);
        texts.unshift(text);
        totalChars += text.length;
    }
    const combined = texts.join('\n');
    if (combined.length > maxChars) {
        return '...' + combined.slice(-maxChars);
    }
    return combined;
}
/**
 * Get text after a position
 */
function getTextAfter(paragraphs, paragraphIndex, offset, maxChars) {
    const texts = [];
    let totalChars = 0;
    // Get text after offset in current paragraph
    const currentPara = paragraphs[paragraphIndex];
    if (currentPara) {
        const text = getParagraphText(currentPara);
        const afterText = text.slice(offset);
        texts.push(afterText);
        totalChars += afterText.length;
    }
    // Get text from following paragraphs if needed
    for (let i = paragraphIndex + 1; i < paragraphs.length && totalChars < maxChars; i++) {
        const para = paragraphs[i];
        if (!para)
            continue;
        const text = getParagraphText(para);
        texts.push(text);
        totalChars += text.length;
    }
    const combined = texts.join('\n');
    if (combined.length > maxChars) {
        return combined.slice(0, maxChars) + '...';
    }
    return combined;
}
/**
 * Get formatting at a specific position in a paragraph
 */
function getFormattingAtPosition(paragraph, offset) {
    let currentOffset = 0;
    for (const item of paragraph.content) {
        if (item.type === 'run') {
            const text = getRunText(item);
            const runStart = currentOffset;
            const runEnd = currentOffset + text.length;
            if (offset >= runStart && offset < runEnd) {
                return item.formatting || {};
            }
            currentOffset = runEnd;
        }
        else if (item.type === 'hyperlink') {
            const text = getHyperlinkText(item);
            const linkStart = currentOffset;
            const linkEnd = currentOffset + text.length;
            if (offset >= linkStart && offset < linkEnd) {
                // Return formatting from first child run
                for (const child of item.children) {
                    if (child.type === 'run') {
                        return child.formatting || {};
                    }
                }
            }
            currentOffset = linkEnd;
        }
    }
    return {};
}
/**
 * Check if position is within a hyperlink
 */
function isInHyperlink(paragraph, offset) {
    let currentOffset = 0;
    for (const item of paragraph.content) {
        if (item.type === 'run') {
            const text = getRunText(item);
            currentOffset += text.length;
        }
        else if (item.type === 'hyperlink') {
            const text = getHyperlinkText(item);
            const linkStart = currentOffset;
            const linkEnd = currentOffset + text.length;
            if (offset >= linkStart && offset < linkEnd) {
                return true;
            }
            currentOffset = linkEnd;
        }
    }
    return false;
}
/**
 * Get suggested actions for selection
 */
function getSuggestedActions(selectedText, _formatting, _paragraphContext) {
    const actions = [];
    // Basic actions for any text
    if (selectedText.length > 0) {
        actions.push({ id: 'rewrite', label: 'Rewrite', description: 'Rewrite this text', priority: 10 }, { id: 'summarize', label: 'Summarize', description: 'Summarize this text', priority: 9 });
        // Long text suggestions
        if (selectedText.length > 200) {
            actions.push({
                id: 'summarize',
                label: 'Summarize',
                description: 'Create a shorter version',
                priority: 8,
            });
        }
        // Short text suggestions
        if (selectedText.length < 50 && selectedText.split(/\s+/).length < 10) {
            actions.push({
                id: 'expand',
                label: 'Expand',
                description: 'Add more details',
                priority: 8,
            });
        }
        // Grammar fix is always useful
        actions.push({
            id: 'fixGrammar',
            label: 'Fix Grammar',
            description: 'Fix grammar and spelling',
            priority: 7,
        });
        // Translate
        actions.push({
            id: 'translate',
            label: 'Translate',
            description: 'Translate to another language',
            priority: 6,
        });
        // Tone adjustments
        actions.push({ id: 'makeFormal', label: 'Make Formal', description: 'Use formal tone', priority: 5 }, { id: 'makeCasual', label: 'Make Casual', description: 'Use casual tone', priority: 4 });
    }
    // Sort by priority (descending)
    actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return actions;
}
// ============================================================================
// EXPORTS
// ============================================================================
export { getAgentContext as default, getParagraphText, getRunText, calculateWordCount, calculateCharacterCount, countWords, };
//# sourceMappingURL=context.js.map