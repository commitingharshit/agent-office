/**
 * useClipboard Hook
 *
 * Thin React wrapper around the framework-agnostic ClipboardManager.
 * Handles clipboard operations with formatting preservation.
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
import { useCallback, useRef } from 'react';
import { copyRuns, handlePasteEvent, parseClipboardHtml, runsToClipboardContent, } from '@eigenpal/docx-core/utils';
import { getSelectionRuns, createSelectionFromDOM } from '@eigenpal/docx-core';
// ============================================================================
// RE-EXPORTS (backwards compat)
// ============================================================================
export { getSelectionRuns, createSelectionFromDOM };
// ============================================================================
// HOOK
// ============================================================================
export function useClipboard(options = {}) {
    const { onCopy, onCut, onPaste, cleanWordFormatting = true, editable = true, onError, theme, } = options;
    const isProcessingRef = useRef(false);
    const lastPastedContentRef = useRef(null);
    const copy = useCallback((selection) => __awaiter(this, void 0, void 0, function* () {
        if (isProcessingRef.current)
            return false;
        isProcessingRef.current = true;
        try {
            const success = yield copyRuns(selection.runs, { onError, theme });
            if (success) {
                onCopy === null || onCopy === void 0 ? void 0 : onCopy(selection);
            }
            return success;
        }
        finally {
            isProcessingRef.current = false;
        }
    }), [onCopy, onError, theme]);
    const cut = useCallback((selection) => __awaiter(this, void 0, void 0, function* () {
        if (isProcessingRef.current || !editable)
            return false;
        isProcessingRef.current = true;
        try {
            const success = yield copyRuns(selection.runs, { onError, theme });
            if (success) {
                onCut === null || onCut === void 0 ? void 0 : onCut(selection);
            }
            return success;
        }
        finally {
            isProcessingRef.current = false;
        }
    }), [onCut, editable, onError, theme]);
    const paste = useCallback((...args_1) => __awaiter(this, [...args_1], void 0, function* (asPlainText = false) {
        if (isProcessingRef.current || !editable)
            return null;
        isProcessingRef.current = true;
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const items = yield navigator.clipboard.read();
                let html = '';
                let plainText = '';
                for (const item of items) {
                    if (item.types.includes('text/html')) {
                        const blob = yield item.getType('text/html');
                        html = yield blob.text();
                    }
                    if (item.types.includes('text/plain')) {
                        const blob = yield item.getType('text/plain');
                        plainText = yield blob.text();
                    }
                }
                if (asPlainText) {
                    html = '';
                }
                const content = parseClipboardHtml(html, plainText, cleanWordFormatting);
                lastPastedContentRef.current = content;
                onPaste === null || onPaste === void 0 ? void 0 : onPaste(content, asPlainText);
                return content;
            }
            return null;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error);
            return null;
        }
        finally {
            isProcessingRef.current = false;
        }
    }), [editable, cleanWordFormatting, onPaste, onError]);
    const handleCopy = useCallback((event) => {
        const selection = createSelectionFromDOM();
        if (!selection)
            return;
        event.preventDefault();
        const content = runsToClipboardContent(selection.runs, true, theme);
        if (event.clipboardData) {
            event.clipboardData.setData('text/plain', content.plainText);
            event.clipboardData.setData('text/html', content.html);
            if (content.internal) {
                event.clipboardData.setData('application/x-docx-editor', content.internal);
            }
        }
        onCopy === null || onCopy === void 0 ? void 0 : onCopy(selection);
    }, [onCopy, theme]);
    const handleCut = useCallback((event) => {
        if (!editable)
            return;
        const selection = createSelectionFromDOM();
        if (!selection)
            return;
        event.preventDefault();
        const content = runsToClipboardContent(selection.runs, true, theme);
        if (event.clipboardData) {
            event.clipboardData.setData('text/plain', content.plainText);
            event.clipboardData.setData('text/html', content.html);
            if (content.internal) {
                event.clipboardData.setData('application/x-docx-editor', content.internal);
            }
        }
        onCut === null || onCut === void 0 ? void 0 : onCut(selection);
    }, [editable, onCut, theme]);
    const handlePaste = useCallback((event) => {
        var _a;
        if (!editable)
            return;
        event.preventDefault();
        const content = handlePasteEvent(event, { cleanWordFormatting });
        if (content) {
            lastPastedContentRef.current = content;
            const asPlainText = (_a = event.shiftKey) !== null && _a !== void 0 ? _a : false;
            onPaste === null || onPaste === void 0 ? void 0 : onPaste(content, asPlainText);
        }
    }, [editable, cleanWordFormatting, onPaste]);
    const handleKeyDown = useCallback((_event) => {
        // Let native copy/cut/paste events handle clipboard operations
    }, []);
    return {
        copy,
        cut,
        paste,
        handleCopy,
        handleCut,
        handlePaste,
        handleKeyDown,
        isProcessing: isProcessingRef.current,
        lastPastedContent: lastPastedContentRef.current,
    };
}
export default useClipboard;
//# sourceMappingURL=useClipboard.js.map