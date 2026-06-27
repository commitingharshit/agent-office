/**
 * DocumentAgent - High-level fluent API for programmatic document manipulation
 *
 * Provides a convenient interface for:
 * - Reading document content and metadata
 * - Editing text with formatting
 * - Inserting tables, images, and hyperlinks
 * - Managing template variables
 * - Exporting to DOCX buffer
 *
 * All operations are immutable - they return a new DocumentAgent instance
 * or don't modify the underlying document.
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
import { executeCommand, executeCommands } from './executor';
import { repackDocx, createDocx } from '../docx/rezip';
import { attemptSelectiveSave } from '../docx/selectiveSave';
import { detectVariables } from '../utils/variableDetector';
import { parseDocx } from '../docx/parser';
// ============================================================================
// DOCUMENT AGENT CLASS
// ============================================================================
/**
 * DocumentAgent provides a fluent API for document manipulation
 *
 * @example
 * ```ts
 * const agent = new DocumentAgent(buffer);
 *
 * // Read operations
 * const text = agent.getText();
 * const wordCount = agent.getWordCount();
 * const variables = agent.getVariables();
 *
 * // Write operations (returns new agent)
 * const newAgent = agent
 *   .insertText({ paragraphIndex: 0, offset: 0 }, 'Hello ', { formatting: { bold: true } })
 *   .applyStyle({ paragraphIndex: 0, offset: 0 }, { paragraphIndex: 0, offset: 5 }, 'Heading1');
 *
 * // Export
 * const newBuffer = await newAgent.toBuffer();
 * ```
 */
export class DocumentAgent {
    /**
     * Create a new DocumentAgent
     *
     * @param source - Document object or ArrayBuffer to parse
     */
    constructor(source) {
        if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
            // Will be loaded asynchronously - store buffer for now
            this._document = {
                package: {
                    document: { content: [] },
                },
                originalBuffer: source instanceof ArrayBuffer ? source : source.buffer,
            };
        }
        else {
            this._document = source;
        }
        this._pendingVariables = {};
    }
    /**
     * Create a DocumentAgent from a DOCX buffer (async)
     *
     * @param buffer - DOCX file as ArrayBuffer, Uint8Array, Blob, or File
     * @returns Promise resolving to DocumentAgent
     */
    static fromBuffer(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const document = yield parseDocx(buffer);
            return new DocumentAgent(document);
        });
    }
    /**
     * Create a DocumentAgent from a Document object
     *
     * @param document - Parsed Document
     * @returns DocumentAgent
     */
    static fromDocument(document) {
        return new DocumentAgent(document);
    }
    // ==========================================================================
    // READING METHODS
    // ==========================================================================
    /**
     * Get the underlying document
     */
    getDocument() {
        return this._document;
    }
    /**
     * Get plain text content of the document
     *
     * @returns All document text concatenated
     */
    getText() {
        const body = this._document.package.document;
        return this._getBodyText(body);
    }
    /**
     * Get formatted text segments
     *
     * @returns Array of text segments with formatting info
     */
    getFormattedText() {
        const segments = [];
        const body = this._document.package.document;
        for (const block of body.content) {
            if (block.type === 'paragraph') {
                this._extractParagraphSegments(block, segments);
            }
        }
        return segments;
    }
    /**
     * Get detected template variables
     *
     * @returns Array of variable names (without braces)
     */
    getVariables() {
        return detectVariables(this._document);
    }
    /**
     * Get available styles from the document
     *
     * @returns Array of style info
     */
    getStyles() {
        const styleDefinitions = this._document.package.styles;
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
     * Get approximate page count
     *
     * Note: This is an estimate based on content length.
     * Actual page count requires full layout computation.
     *
     * @returns Estimated page count
     */
    getPageCount() {
        // Estimate: ~500 words per page
        const wordCount = this.getWordCount();
        return Math.max(1, Math.ceil(wordCount / 500));
    }
    /**
     * Get word count
     *
     * @returns Number of words in the document
     */
    getWordCount() {
        const text = this.getText();
        // Split by whitespace and filter empty strings
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        return words.length;
    }
    /**
     * Get character count
     *
     * @param includeSpaces - Whether to include whitespace
     * @returns Number of characters
     */
    getCharacterCount(includeSpaces = true) {
        const text = this.getText();
        if (includeSpaces) {
            return text.length;
        }
        return text.replace(/\s/g, '').length;
    }
    /**
     * Get paragraph count
     *
     * @returns Number of paragraphs
     */
    getParagraphCount() {
        return this._document.package.document.content.filter((block) => block.type === 'paragraph')
            .length;
    }
    /**
     * Get table count
     *
     * @returns Number of tables
     */
    getTableCount() {
        return this._document.package.document.content.filter((block) => block.type === 'table').length;
    }
    /**
     * Get document context for AI agents
     *
     * @param outlineMaxChars - Max characters per paragraph in outline
     * @returns Agent context
     */
    getAgentContext(outlineMaxChars = 100) {
        const body = this._document.package.document;
        const paragraphs = body.content.filter((b) => b.type === 'paragraph');
        const outline = paragraphs.map((para, index) => {
            var _a;
            const text = this._getParagraphText(para);
            const styleId = (_a = para.formatting) === null || _a === void 0 ? void 0 : _a.styleId;
            return {
                index,
                preview: text.slice(0, outlineMaxChars),
                style: styleId,
                isHeading: (styleId === null || styleId === void 0 ? void 0 : styleId.toLowerCase().includes('heading')) || false,
                headingLevel: this._parseHeadingLevel(styleId),
                isListItem: !!para.listRendering,
                isEmpty: text.trim().length === 0,
            };
        });
        const sections = (body.sections || []).map((section, index) => {
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
        return {
            paragraphCount: paragraphs.length,
            wordCount: this.getWordCount(),
            characterCount: this.getCharacterCount(),
            variables: this.getVariables(),
            variableCount: this.getVariables().length,
            availableStyles: this.getStyles(),
            outline,
            sections,
            hasTables: this.getTableCount() > 0,
            hasImages: this._hasImages(),
            hasHyperlinks: this._hasHyperlinks(),
        };
    }
    // ==========================================================================
    // WRITING METHODS
    // ==========================================================================
    /**
     * Insert text at a position
     *
     * @param position - Where to insert
     * @param text - Text to insert
     * @param options - Insert options
     * @returns New DocumentAgent with text inserted
     */
    insertText(position, text, options = {}) {
        const command = {
            type: 'insertText',
            position,
            text,
            formatting: options.formatting,
        };
        return this._executeCommand(command);
    }
    /**
     * Replace text in a range
     *
     * @param range - Range to replace
     * @param text - Replacement text
     * @param options - Replace options
     * @returns New DocumentAgent with text replaced
     */
    replaceRange(range, text, options = {}) {
        const command = {
            type: 'replaceText',
            range,
            text,
            formatting: options.formatting,
        };
        return this._executeCommand(command);
    }
    /**
     * Delete text in a range
     *
     * @param range - Range to delete
     * @returns New DocumentAgent with text deleted
     */
    deleteRange(range) {
        const command = {
            type: 'deleteText',
            range,
        };
        return this._executeCommand(command);
    }
    /**
     * Apply text formatting to a range
     *
     * @param range - Range to format
     * @param formatting - Formatting to apply
     * @returns New DocumentAgent with formatting applied
     */
    applyFormatting(range, formatting) {
        const command = {
            type: 'formatText',
            range,
            formatting,
        };
        return this._executeCommand(command);
    }
    /**
     * Apply a named style to a paragraph
     *
     * @param paragraphIndex - Index of the paragraph
     * @param styleId - Style ID to apply
     * @returns New DocumentAgent with style applied
     */
    applyStyle(paragraphIndex, styleId) {
        const command = {
            type: 'applyStyle',
            paragraphIndex,
            styleId,
        };
        return this._executeCommand(command);
    }
    /**
     * Apply paragraph formatting
     *
     * @param paragraphIndex - Index of the paragraph
     * @param formatting - Formatting to apply
     * @returns New DocumentAgent with formatting applied
     */
    applyParagraphFormatting(paragraphIndex, formatting) {
        const command = {
            type: 'formatParagraph',
            paragraphIndex,
            formatting,
        };
        return this._executeCommand(command);
    }
    // ==========================================================================
    // COMPLEX OPERATIONS
    // ==========================================================================
    /**
     * Insert a table at a position
     *
     * @param position - Where to insert the table
     * @param rows - Number of rows
     * @param cols - Number of columns
     * @param options - Table options
     * @returns New DocumentAgent with table inserted
     */
    insertTable(position, rows, cols, options = {}) {
        const command = {
            type: 'insertTable',
            position,
            rows,
            columns: cols,
            data: options.data,
            hasHeader: options.hasHeader,
        };
        return this._executeCommand(command);
    }
    /**
     * Insert an image at a position
     *
     * @param position - Where to insert the image
     * @param src - Image source (base64 data URL or URL)
     * @param options - Image options
     * @returns New DocumentAgent with image inserted
     */
    insertImage(position, src, options = {}) {
        const command = {
            type: 'insertImage',
            position,
            src,
            width: options.width,
            height: options.height,
            alt: options.alt,
        };
        return this._executeCommand(command);
    }
    /**
     * Insert a hyperlink
     *
     * @param range - Range to make into a hyperlink
     * @param url - URL of the hyperlink
     * @param options - Hyperlink options
     * @returns New DocumentAgent with hyperlink inserted
     */
    insertHyperlink(range, url, options = {}) {
        const command = {
            type: 'insertHyperlink',
            range,
            url,
            displayText: options.displayText,
            tooltip: options.tooltip,
        };
        return this._executeCommand(command);
    }
    /**
     * Remove a hyperlink but keep the text
     *
     * @param range - Range containing the hyperlink
     * @returns New DocumentAgent with hyperlink removed
     */
    removeHyperlink(range) {
        const command = {
            type: 'removeHyperlink',
            range,
        };
        return this._executeCommand(command);
    }
    /**
     * Insert a paragraph break
     *
     * @param position - Where to break the paragraph
     * @returns New DocumentAgent with paragraph broken
     */
    insertParagraphBreak(position) {
        const command = {
            type: 'insertParagraphBreak',
            position,
        };
        return this._executeCommand(command);
    }
    /**
     * Merge consecutive paragraphs
     *
     * @param startParagraphIndex - First paragraph index
     * @param count - Number of paragraphs to merge with the first
     * @returns New DocumentAgent with paragraphs merged
     */
    mergeParagraphs(startParagraphIndex, count) {
        const command = {
            type: 'mergeParagraphs',
            paragraphIndex: startParagraphIndex,
            count,
        };
        return this._executeCommand(command);
    }
    // ==========================================================================
    // TEMPLATE VARIABLE METHODS
    // ==========================================================================
    /**
     * Set a template variable value
     *
     * Note: Variables are not applied until `applyVariables()` is called
     *
     * @param name - Variable name (without braces)
     * @param value - Variable value
     * @returns This DocumentAgent (for chaining)
     */
    setVariable(name, value) {
        this._pendingVariables[name] = value;
        return this;
    }
    /**
     * Set multiple template variables
     *
     * @param variables - Map of variable names to values
     * @returns This DocumentAgent (for chaining)
     */
    setVariables(variables) {
        for (const [name, value] of Object.entries(variables)) {
            this._pendingVariables[name] = value;
        }
        return this;
    }
    /**
     * Get pending variable values
     *
     * @returns Map of pending variable values
     */
    getPendingVariables() {
        return Object.assign({}, this._pendingVariables);
    }
    /**
     * Clear pending variables
     *
     * @returns This DocumentAgent (for chaining)
     */
    clearPendingVariables() {
        this._pendingVariables = {};
        return this;
    }
    /**
     * Apply all pending template variables
     *
     * Uses docxtemplater to substitute variables while preserving formatting.
     *
     * @param variables - Optional additional variables (merged with pending)
     * @returns New DocumentAgent with variables applied
     */
    applyVariables(variables) {
        return __awaiter(this, void 0, void 0, function* () {
            const allVariables = Object.assign(Object.assign({}, this._pendingVariables), variables);
            if (Object.keys(allVariables).length === 0) {
                // No variables to apply
                return this;
            }
            // Get the original buffer
            const buffer = this._document.originalBuffer;
            if (!buffer) {
                throw new Error('Cannot apply variables: no original buffer for processing');
            }
            // Process template using docxtemplater (dynamic import to keep it off critical path)
            const { processTemplate } = yield import('../utils/processTemplate');
            const processedBuffer = processTemplate(buffer, allVariables);
            // Parse the processed document
            const processedDoc = yield parseDocx(processedBuffer);
            // Create new agent with processed document
            const newAgent = new DocumentAgent(processedDoc);
            newAgent._pendingVariables = {};
            return newAgent;
        });
    }
    // ==========================================================================
    // EXPORT METHODS
    // ==========================================================================
    /**
     * Export document to DOCX ArrayBuffer
     *
     * @returns Promise resolving to DOCX file as ArrayBuffer
     */
    toBuffer(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._document.originalBuffer) {
                // Try selective save if options provided
                if (options === null || options === void 0 ? void 0 : options.selective) {
                    const result = yield attemptSelectiveSave(this._document, this._document.originalBuffer, options.selective);
                    if (result) {
                        // Update originalBuffer so subsequent saves patch against the latest state
                        this._document.originalBuffer = result;
                        return result;
                    }
                }
                // Fall back to full repack
                const repacked = yield repackDocx(this._document);
                this._document.originalBuffer = repacked;
                return repacked;
            }
            return createDocx(this._document);
        });
    }
    /**
     * Export document to Blob
     *
     * @param mimeType - MIME type for the blob
     * @returns Promise resolving to DOCX file as Blob
     */
    toBlob() {
        return __awaiter(this, arguments, void 0, function* (mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const buffer = yield this.toBuffer();
            return new Blob([buffer], { type: mimeType });
        });
    }
    /**
     * Execute multiple commands in sequence
     *
     * @param commands - Commands to execute
     * @returns New DocumentAgent with all commands applied
     */
    executeCommands(commands) {
        return new DocumentAgent(executeCommands(this._document, commands));
    }
    // ==========================================================================
    // PRIVATE HELPERS
    // ==========================================================================
    /**
     * Execute a single command and return new agent
     */
    _executeCommand(command) {
        const newAgent = new DocumentAgent(executeCommand(this._document, command));
        newAgent._pendingVariables = Object.assign({}, this._pendingVariables);
        return newAgent;
    }
    /**
     * Get plain text from document body
     */
    _getBodyText(body) {
        const texts = [];
        for (const block of body.content) {
            if (block.type === 'paragraph') {
                texts.push(this._getParagraphText(block));
            }
            else if (block.type === 'table') {
                texts.push(this._getTableText(block));
            }
        }
        return texts.join('\n');
    }
    /**
     * Get plain text from a paragraph
     */
    _getParagraphText(paragraph) {
        const texts = [];
        for (const item of paragraph.content) {
            if (item.type === 'run') {
                texts.push(this._getRunText(item));
            }
            else if (item.type === 'hyperlink') {
                texts.push(this._getHyperlinkText(item));
            }
        }
        return texts.join('');
    }
    /**
     * Get plain text from a run
     */
    _getRunText(run) {
        return run.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('');
    }
    /**
     * Get plain text from a hyperlink
     */
    _getHyperlinkText(hyperlink) {
        const texts = [];
        for (const child of hyperlink.children) {
            if (child.type === 'run') {
                texts.push(this._getRunText(child));
            }
        }
        return texts.join('');
    }
    /**
     * Get plain text from a table
     */
    _getTableText(table) {
        const texts = [];
        for (const row of table.rows) {
            for (const cell of row.cells) {
                for (const block of cell.content) {
                    if (block.type === 'paragraph') {
                        texts.push(this._getParagraphText(block));
                    }
                }
            }
        }
        return texts.join('\t');
    }
    /**
     * Extract formatted text segments from a paragraph
     */
    _extractParagraphSegments(paragraph, segments) {
        for (const item of paragraph.content) {
            if (item.type === 'run') {
                const text = this._getRunText(item);
                if (text) {
                    segments.push({
                        text,
                        formatting: item.formatting,
                    });
                }
            }
            else if (item.type === 'hyperlink') {
                const url = item.href || '';
                for (const child of item.children) {
                    if (child.type === 'run') {
                        const text = this._getRunText(child);
                        if (text) {
                            segments.push({
                                text,
                                formatting: child.formatting,
                                isHyperlink: true,
                                hyperlinkUrl: url,
                            });
                        }
                    }
                }
            }
        }
    }
    /**
     * Parse heading level from style ID
     */
    _parseHeadingLevel(styleId) {
        if (!styleId)
            return undefined;
        const match = styleId.match(/heading\s*(\d)/i);
        if (match) {
            return parseInt(match[1], 10);
        }
        return undefined;
    }
    /**
     * Check if document has images
     */
    _hasImages() {
        const body = this._document.package.document;
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
    _hasHyperlinks() {
        const body = this._document.package.document;
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
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Create a DocumentAgent from a DOCX buffer
 *
 * @param buffer - DOCX file as ArrayBuffer
 * @returns Promise resolving to DocumentAgent
 */
export function createAgent(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        return DocumentAgent.fromBuffer(buffer);
    });
}
/**
 * Create a DocumentAgent from a parsed Document
 *
 * @param document - Parsed Document
 * @returns DocumentAgent
 */
export function createAgentFromDocument(document) {
    return DocumentAgent.fromDocument(document);
}
// ============================================================================
// EXPORTS
// ============================================================================
export default DocumentAgent;
//# sourceMappingURL=DocumentAgent.js.map