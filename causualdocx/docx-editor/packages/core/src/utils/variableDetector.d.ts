/**
 * Variable Detector Utility
 *
 * Scans a DOCX document for template variables in the format {variable_name}
 * (standard docxtemplater syntax).
 * Returns a unique, sorted list of variable names found in the document.
 */
import type { Document, DocumentBody, Paragraph, Table, TableCell, Run, Hyperlink, SimpleField, ComplexField, BlockContent, HeaderFooter, Footnote, Endnote, TextBox } from '../types/document';
/**
 * Result of variable detection
 */
export interface VariableDetectionResult {
    /** Unique variable names sorted alphabetically */
    variables: string[];
    /** Total count of variable occurrences */
    totalOccurrences: number;
    /** Variables by location */
    byLocation: {
        body: string[];
        headers: string[];
        footers: string[];
        footnotes: string[];
        endnotes: string[];
        textBoxes: string[];
    };
    /** Variable occurrences with positions */
    occurrences: VariableOccurrence[];
}
/**
 * A single variable occurrence with location info
 */
export interface VariableOccurrence {
    /** Variable name (without braces) */
    name: string;
    /** Location type */
    location: 'body' | 'header' | 'footer' | 'footnote' | 'endnote' | 'textBox';
    /** Paragraph index within location */
    paragraphIndex?: number;
    /** Section index (for headers/footers) */
    sectionIndex?: number;
}
/**
 * Detect all template variables in a document
 *
 * @param doc - The parsed document
 * @returns Array of unique variable names sorted alphabetically
 */
export declare function detectVariables(doc: Document): string[];
/**
 * Detect variables with detailed information
 *
 * @param doc - The parsed document
 * @returns Detailed detection result
 */
export declare function detectVariablesDetailed(doc: Document): VariableDetectionResult;
/**
 * Detect variables in document body
 */
export declare function detectVariablesInBody(body: DocumentBody): string[];
/**
 * Detect variables in block content (paragraphs and tables)
 */
export declare function detectVariablesInBlockContent(content: BlockContent[]): string[];
/**
 * Detect variables in a paragraph
 */
export declare function detectVariablesInParagraph(paragraph: Paragraph): string[];
/**
 * Detect variables in a text run
 */
export declare function detectVariablesInRun(run: Run): string[];
/**
 * Detect variables in a hyperlink
 */
export declare function detectVariablesInHyperlink(hyperlink: Hyperlink): string[];
/**
 * Detect variables in a simple field
 */
export declare function detectVariablesInSimpleField(field: SimpleField): string[];
/**
 * Detect variables in a complex field
 */
export declare function detectVariablesInComplexField(field: ComplexField): string[];
/**
 * Detect variables in a table
 */
export declare function detectVariablesInTable(table: Table): string[];
/**
 * Detect variables in a table cell
 */
export declare function detectVariablesInCell(cell: TableCell): string[];
/**
 * Detect variables in footnotes/endnotes
 */
export declare function detectVariablesInNotes(notes: (Footnote | Endnote)[]): string[];
/**
 * Detect variables in headers/footers
 */
export declare function detectVariablesInHeaderFooter(hf: HeaderFooter): string[];
/**
 * Detect variables in a text box
 */
export declare function detectVariablesInTextBox(textBox: TextBox): string[];
/**
 * Extract variable names from text
 *
 * @param text - The text to search
 * @returns Array of variable names (without braces)
 */
export declare function extractVariablesFromText(text: string): string[];
/**
 * Extract all variables from text (relaxed matching)
 * Allows any content between { and }
 */
export declare function extractVariablesFromTextRelaxed(text: string): string[];
/**
 * Check if text contains template variables
 */
export declare function hasTemplateVariables(text: string): boolean;
/**
 * Count template variables in text
 */
export declare function countVariables(text: string): number;
/**
 * Get unique variable names from text
 */
export declare function getUniqueVariables(text: string): string[];
/**
 * Check if a variable name is valid
 */
export declare function isValidVariableName(name: string): boolean;
/**
 * Sanitize a variable name
 */
export declare function sanitizeVariableName(name: string): string;
/**
 * Format a variable name with braces (standard docxtemplater syntax)
 */
export declare function formatVariable(name: string): string;
/**
 * Parse a variable string to get the name
 */
export declare function parseVariable(variable: string): string | null;
/**
 * Replace variables in text with values
 *
 * @param text - The text containing variables
 * @param values - Map of variable name to replacement value
 * @returns Text with variables replaced
 */
export declare function replaceVariables(text: string, values: Record<string, string>): string;
/**
 * Replace all variables in text with a placeholder
 *
 * @param text - The text containing variables
 * @param placeholder - Placeholder to use (default: empty string)
 * @returns Text with variables replaced
 */
export declare function removeVariables(text: string, placeholder?: string): string;
/**
 * Highlight variables in text for display
 *
 * @param text - The text containing variables
 * @param wrapper - Function to wrap variable text
 * @returns Array of text segments
 */
export declare function highlightVariables(text: string, wrapper?: (varName: string) => string): string;
/**
 * Get total variable count in document (including duplicates)
 */
export declare function getVariableCount(doc: Document): number;
/**
 * Get unique variable count in document
 */
export declare function getUniqueVariableCount(doc: Document): number;
/**
 * Check if document has any template variables
 */
export declare function documentHasVariables(doc: Document): boolean;
/**
 * Get variables grouped by first letter for large lists
 */
export declare function groupVariablesByLetter(variables: string[]): Record<string, string[]>;
export default detectVariables;
//# sourceMappingURL=variableDetector.d.ts.map