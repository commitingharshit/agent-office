/**
 * Clipboard utilities for copy/paste with formatting
 *
 * Handles:
 * - Copy: puts formatted HTML and plain text on clipboard
 * - Paste: reads HTML clipboard, converts to runs with formatting
 * - Handles paste from Word (cleans up Word HTML)
 * - Ctrl+C, Ctrl+V, Ctrl+X keyboard shortcuts
 */
import type { Run, Paragraph, Theme } from '../types/document';
/**
 * Clipboard content format
 */
export interface ClipboardContent {
    /** Plain text representation */
    plainText: string;
    /** HTML representation */
    html: string;
    /** Internal format (JSON) for preserving full formatting */
    internal?: string;
}
/**
 * Parsed clipboard content
 */
export interface ParsedClipboardContent {
    /** Runs parsed from clipboard */
    runs: Run[];
    /** Whether content came from Word */
    fromWord: boolean;
    /** Whether content came from our editor */
    fromEditor: boolean;
    /** Original plain text */
    plainText: string;
}
/**
 * Options for clipboard operations
 */
export interface ClipboardOptions {
    /** Whether to include formatting in copy */
    includeFormatting?: boolean;
    /** Whether to clean Word-specific formatting */
    cleanWordFormatting?: boolean;
    /** Callback for handling errors */
    onError?: (error: Error) => void;
    /** Document theme — required to resolve themed text/shading colors in HTML. */
    theme?: Theme | null;
}
/**
 * Custom MIME type for internal clipboard format
 */
export declare const INTERNAL_CLIPBOARD_TYPE = "application/x-docx-editor";
/**
 * Standard clipboard MIME types
 */
export declare const CLIPBOARD_TYPES: {
    readonly HTML: "text/html";
    readonly PLAIN: "text/plain";
};
/**
 * Extract image files from clipboard data (if present).
 */
export declare function getClipboardImageFiles(clipboardData: DataTransfer | null): File[];
/**
 * Copy runs to clipboard with formatting
 */
export declare function copyRuns(runs: Run[], options?: ClipboardOptions): Promise<boolean>;
/**
 * Copy paragraphs to clipboard with formatting
 */
export declare function copyParagraphs(paragraphs: Paragraph[], options?: ClipboardOptions): Promise<boolean>;
/**
 * Convert runs to clipboard content (HTML and plain text).
 *
 * @param theme - Optional document theme. Pass it so themed text color and
 *   shading resolve correctly in the HTML payload (matters when pasting into
 *   Gmail/Word/etc.). Omit for rgb-only content.
 */
export declare function runsToClipboardContent(runs: Run[], includeFormatting?: boolean, theme?: Theme | null): ClipboardContent;
/**
 * Convert paragraphs to clipboard content.
 *
 * @param theme - See {@link runsToClipboardContent}.
 */
export declare function paragraphsToClipboardContent(paragraphs: Paragraph[], includeFormatting?: boolean, theme?: Theme | null): ClipboardContent;
/**
 * Write content to clipboard
 */
export declare function writeToClipboard(content: ClipboardContent): Promise<boolean>;
/**
 * Read content from clipboard
 */
export declare function readFromClipboard(options?: ClipboardOptions): Promise<ParsedClipboardContent | null>;
/**
 * Handle paste event
 */
export declare function handlePasteEvent(event: ClipboardEvent, options?: ClipboardOptions): ParsedClipboardContent | null;
/**
 * Parse HTML from clipboard
 */
export declare function parseClipboardHtml(html: string, plainText: string, cleanWordFormatting?: boolean): ParsedClipboardContent;
/**
 * Check if HTML is from Microsoft Word
 */
export declare function isWordHtml(html: string): boolean;
/**
 * Check if HTML is from our editor
 */
export declare function isEditorHtml(html: string): boolean;
/**
 * Clean Microsoft Word HTML
 */
export declare function cleanWordHtml(html: string): string;
/**
 * Convert HTML to runs
 */
export declare function htmlToRuns(html: string, plainTextFallback: string): Run[];
/**
 * Create clipboard keyboard handlers for an editor
 */
export declare function createClipboardHandlers(options: {
    onCopy?: () => {
        runs: Run[];
    } | null;
    onCut?: () => {
        runs: Run[];
    } | null;
    onPaste?: (content: ParsedClipboardContent) => void;
    clipboardOptions?: ClipboardOptions;
}): {
    handleCopy: (event: ClipboardEvent) => Promise<void>;
    handleCut: (event: ClipboardEvent) => Promise<void>;
    handlePaste: (event: ClipboardEvent) => void;
    handleKeyDown: (event: KeyboardEvent) => Promise<void>;
};
declare const _default: {
    copyRuns: typeof copyRuns;
    copyParagraphs: typeof copyParagraphs;
    readFromClipboard: typeof readFromClipboard;
    handlePasteEvent: typeof handlePasteEvent;
    htmlToRuns: typeof htmlToRuns;
    cleanWordHtml: typeof cleanWordHtml;
    isWordHtml: typeof isWordHtml;
    isEditorHtml: typeof isEditorHtml;
    createClipboardHandlers: typeof createClipboardHandlers;
};
export default _default;
//# sourceMappingURL=clipboard.d.ts.map