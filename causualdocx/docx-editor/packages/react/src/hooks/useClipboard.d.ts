/**
 * useClipboard Hook
 *
 * Thin React wrapper around the framework-agnostic ClipboardManager.
 * Handles clipboard operations with formatting preservation.
 */
import { type ParsedClipboardContent } from '@eigenpal/docx-core/utils';
import { getSelectionRuns, createSelectionFromDOM } from '@eigenpal/docx-core';
import type { ClipboardSelection, Theme } from '@eigenpal/docx-core';
export { getSelectionRuns, createSelectionFromDOM };
export type { ClipboardSelection };
export interface UseClipboardOptions {
    onCopy?: (selection: ClipboardSelection) => void;
    onCut?: (selection: ClipboardSelection) => void;
    onPaste?: (content: ParsedClipboardContent, asPlainText: boolean) => void;
    cleanWordFormatting?: boolean;
    editable?: boolean;
    onError?: (error: Error) => void;
    /** Document theme — used to resolve themed colors in the HTML clipboard payload. */
    theme?: Theme | null;
}
export interface UseClipboardReturn {
    copy: (selection: ClipboardSelection) => Promise<boolean>;
    cut: (selection: ClipboardSelection) => Promise<boolean>;
    paste: (asPlainText?: boolean) => Promise<ParsedClipboardContent | null>;
    handleCopy: (event: ClipboardEvent) => void;
    handleCut: (event: ClipboardEvent) => void;
    handlePaste: (event: ClipboardEvent) => void;
    handleKeyDown: (event: KeyboardEvent) => void;
    isProcessing: boolean;
    lastPastedContent: ParsedClipboardContent | null;
}
export declare function useClipboard(options?: UseClipboardOptions): UseClipboardReturn;
export default useClipboard;
//# sourceMappingURL=useClipboard.d.ts.map