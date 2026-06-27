/**
 * ClipboardManager
 *
 * Framework-agnostic class for clipboard operations in the editor.
 * Extracted from the React `useClipboard` hook.
 *
 * Handles:
 * - DOM selection traversal and run extraction
 * - Formatting extraction from computed styles
 * - Clipboard read/write operations
 */
import type { Run } from '../types/document';
/** Selection data for clipboard operations */
export interface ClipboardSelection {
    text: string;
    runs: Run[];
    startParagraphIndex: number;
    startRunIndex: number;
    startOffset: number;
    endParagraphIndex: number;
    endRunIndex: number;
    endOffset: number;
    isMultiParagraph: boolean;
}
/**
 * Convert a CSS color string (rgb/rgba/hex) to a 6-char uppercase hex string.
 *
 * NOTE: This differs from `colorResolver.rgbToHex(r, g, b)` which takes
 * numeric components. This function parses CSS color strings.
 */
export declare function cssColorToHex(color: string): string | null;
/** Extract formatting from an HTML element's computed styles. */
export declare function extractFormattingFromElement(element: HTMLElement): Run['formatting'];
/** Get selected runs from the current DOM selection. */
export declare function getSelectionRuns(): Run[];
/** Create a ClipboardSelection from the current DOM selection. */
export declare function createSelectionFromDOM(): ClipboardSelection | null;
export declare const rgbToHex: typeof cssColorToHex;
//# sourceMappingURL=ClipboardManager.d.ts.map