/**
 * Template Processing Utility
 *
 * Uses docxtemplater to substitute template variables in DOCX documents:
 * - Processes {variable_name} patterns (docxtemplater default syntax)
 * - Preserves all formatting (fonts, styles, colors, tables)
 * - Error handling with useful messages
 */
/**
 * Options for template processing
 */
export interface ProcessTemplateOptions {
    /** How to handle undefined variables */
    nullGetter?: 'keep' | 'empty' | 'error';
    /** Custom parser for variable names */
    parser?: (tag: string) => {
        get: (scope: Record<string, unknown>) => unknown;
    };
    /** Line breaks: keep raw \n or convert to w:br */
    linebreaks?: boolean;
    /** Delimiter settings */
    delimiters?: {
        start?: string;
        end?: string;
    };
}
/**
 * Result of template processing
 */
export interface ProcessTemplateResult {
    /** The processed document buffer */
    buffer: ArrayBuffer;
    /** Variables that were found and replaced */
    replacedVariables: string[];
    /** Variables that were not replaced (no value provided) */
    unreplacedVariables: string[];
    /** Any warnings during processing */
    warnings: string[];
}
/**
 * Error details from template processing
 */
export interface TemplateError {
    /** Error message */
    message: string;
    /** Variable name that caused the error (if applicable) */
    variable?: string;
    /** Error type */
    type: 'parse' | 'render' | 'undefined' | 'unknown';
    /** Original error */
    originalError?: Error;
}
/**
 * Process a DOCX template with variable substitution
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @param variables - Map of variable names to values
 * @param options - Processing options
 * @returns Processed DOCX as ArrayBuffer
 */
export declare function processTemplate(buffer: ArrayBuffer, variables: Record<string, string>, options?: ProcessTemplateOptions): ArrayBuffer;
/**
 * Process template with detailed result
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @param variables - Map of variable names to values
 * @param options - Processing options
 * @returns Detailed processing result
 */
export declare function processTemplateDetailed(buffer: ArrayBuffer, variables: Record<string, string>, options?: ProcessTemplateOptions): ProcessTemplateResult;
/**
 * Process template and return as Blob
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @param variables - Map of variable names to values
 * @param options - Processing options
 * @returns Processed DOCX as Blob
 */
export declare function processTemplateAsBlob(buffer: ArrayBuffer, variables: Record<string, string>, options?: ProcessTemplateOptions): Blob;
/**
 * Process template and trigger download
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @param variables - Map of variable names to values
 * @param filename - Output filename (without extension)
 * @param options - Processing options
 */
export declare function processTemplateAndDownload(buffer: ArrayBuffer, variables: Record<string, string>, filename?: string, options?: ProcessTemplateOptions): void;
/**
 * Get all template tags in a document without processing
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @returns List of tag names found
 */
export declare function getTemplateTags(buffer: ArrayBuffer): string[];
/**
 * Validate that a document is a valid docxtemplater template
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @returns Validation result
 */
export declare function validateTemplate(buffer: ArrayBuffer): {
    valid: boolean;
    errors: TemplateError[];
    tags: string[];
};
/**
 * Check if all required variables have values
 *
 * @param tags - List of template tags
 * @param variables - Provided variable values
 * @returns Missing variable names
 */
export declare function getMissingVariables(tags: string[], variables: Record<string, string>): string[];
/**
 * Preview what the document will look like after processing
 * Returns the document text with variables replaced (for preview purposes)
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @param variables - Map of variable names to values
 * @returns Preview text
 */
export declare function previewTemplate(buffer: ArrayBuffer, variables: Record<string, string>): string;
/**
 * Process template with conditional sections
 * Supports #if, #unless, #each loops
 *
 * @param buffer - The DOCX file as ArrayBuffer
 * @param data - Full data object (can include arrays, nested objects)
 * @param options - Processing options
 * @returns Processed DOCX as ArrayBuffer
 */
export declare function processTemplateAdvanced(buffer: ArrayBuffer, data: Record<string, unknown>, options?: ProcessTemplateOptions): ArrayBuffer;
/**
 * Create a template processor with preset options
 */
export declare function createTemplateProcessor(defaultOptions?: ProcessTemplateOptions): (buffer: ArrayBuffer, variables: Record<string, string>) => ArrayBuffer;
export default processTemplate;
//# sourceMappingURL=processTemplate.d.ts.map