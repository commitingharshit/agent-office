/**
 * Agent Context Builder
 *
 * Generates context objects for AI/LLM consumption from DOCX documents.
 * The context provides a structured summary of the document that can be
 * used by AI agents to understand the document structure and content.
 *
 * All outputs are JSON serializable for easy transmission to AI backends.
 */
import type { Document, DocumentBody, Paragraph, Run } from '../types/document';
import type { AgentContext, SelectionContext, Range } from '../types/agentApi';
/**
 * Options for building agent context
 */
export interface AgentContextOptions {
    /** Maximum characters per paragraph in outline (default: 100) */
    outlineMaxChars?: number;
    /** Maximum paragraphs to include in outline (default: 50) */
    maxOutlineParagraphs?: number;
    /** Include table content in context (default: false) */
    includeTableContent?: boolean;
    /** Include detailed formatting info (default: false) */
    includeFormatting?: boolean;
}
/**
 * Options for building selection context
 */
export interface SelectionContextOptions {
    /** Characters of context before/after selection (default: 200) */
    contextChars?: number;
    /** Include suggested actions (default: true) */
    includeSuggestions?: boolean;
}
/**
 * Build agent context from a document
 *
 * @param doc - The parsed document
 * @param options - Context building options
 * @returns AgentContext object (JSON serializable)
 */
export declare function getAgentContext(doc: Document, options?: AgentContextOptions): AgentContext;
/**
 * Build selection context for AI operations
 *
 * @param doc - The parsed document
 * @param range - The selected range
 * @param options - Selection context options
 * @returns SelectionContext object (JSON serializable)
 */
export declare function buildSelectionContext(doc: Document, range: Range, options?: SelectionContextOptions): SelectionContext;
/**
 * Get a simple document summary for quick context
 *
 * @param doc - The parsed document
 * @returns Summary string
 */
export declare function getDocumentSummary(doc: Document): string;
/**
 * Calculate word count for document body
 */
declare function calculateWordCount(body: DocumentBody): number;
/**
 * Count words in text
 */
declare function countWords(text: string): number;
/**
 * Calculate character count for document body
 */
declare function calculateCharacterCount(body: DocumentBody): number;
/**
 * Get plain text from paragraph
 */
declare function getParagraphText(paragraph: Paragraph): string;
/**
 * Get plain text from run
 */
declare function getRunText(run: Run): string;
export { getAgentContext as default, getParagraphText, getRunText, calculateWordCount, calculateCharacterCount, countWords, };
//# sourceMappingURL=context.d.ts.map