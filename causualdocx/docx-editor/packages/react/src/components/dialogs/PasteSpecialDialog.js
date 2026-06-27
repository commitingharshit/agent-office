var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Paste Special Dialog Component
 *
 * Provides paste options for pasting content with or without formatting.
 * Features:
 * - Paste with formatting (default)
 * - Paste as plain text (unformatted)
 * - Keyboard shortcut: Ctrl+Shift+V opens dialog
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { readFromClipboard } from '@eigenpal/docx-core/utils';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
// ============================================================================
// CONSTANTS
// ============================================================================
/**
 * Available paste options (using translation keys)
 */
const PASTE_OPTION_DEFS = [
    {
        id: 'formatted',
        labelKey: 'dialogs.pasteSpecial.keepFormatting',
        descriptionKey: 'dialogs.pasteSpecial.keepFormattingDescription',
        shortcutKey: 'dialogs.pasteSpecial.keepFormattingShortcut',
    },
    {
        id: 'plainText',
        labelKey: 'dialogs.pasteSpecial.plainText',
        descriptionKey: 'dialogs.pasteSpecial.plainTextDescription',
        shortcutKey: 'dialogs.pasteSpecial.plainTextShortcut',
    },
];
// ============================================================================
// ICONS
// ============================================================================
const FormattedIcon = () => (_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M4 4h12v2H4V4zM4 8h8v2H4V8zM4 12h10v2H4v-2zM4 16h6v2H4v-2z", fill: "currentColor" }), _jsx("path", { d: "M14 10l3 3-3 3v-2h-2v-2h2v-2z", fill: "currentColor", opacity: "0.6" })] }));
const PlainTextIcon = () => (_jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 4h12v1H4V4zM4 7h12v1H4V7zM4 10h12v1H4v-1zM4 13h12v1H4v-1zM4 16h8v1H4v-1z", fill: "currentColor" }) }));
/**
 * Get icon for paste option
 */
function getPasteOptionIcon(option) {
    switch (option) {
        case 'formatted':
            return _jsx(FormattedIcon, {});
        case 'plainText':
            return _jsx(PlainTextIcon, {});
        default:
            return null;
    }
}
const PasteOptionButton = ({ option, isSelected, onClick, onMouseEnter, }) => {
    return (_jsxs("button", { type: "button", className: `docx-paste-special-option ${isSelected ? 'docx-paste-special-option-selected' : ''}`, onClick: onClick, onMouseEnter: onMouseEnter, role: "menuitem", "aria-selected": isSelected, style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: isSelected ? 'var(--doc-primary-light)' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '4px',
            transition: 'background-color var(--doc-anim-base)',
        }, children: [_jsx("span", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    background: isSelected ? 'var(--doc-primary)' : 'var(--doc-bg-hover)',
                    color: isSelected ? 'white' : 'var(--doc-text-muted)',
                }, children: getPasteOptionIcon(option.id) }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: {
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--doc-text)',
                            marginBottom: '2px',
                        }, children: option.label }), _jsx("div", { style: {
                            fontSize: '12px',
                            color: 'var(--doc-text-muted)',
                        }, children: option.description })] }), _jsx("span", { style: {
                    fontSize: '11px',
                    color: 'var(--doc-text-subtle)',
                    fontFamily: 'monospace',
                }, children: option.shortcut })] }));
};
// ============================================================================
// PASTE SPECIAL DIALOG COMPONENT
// ============================================================================
export const PasteSpecialDialog = ({ isOpen, onClose, onPaste, position, className = '', }) => {
    const { t } = useTranslation();
    const dialogRef = useRef(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [clipboardContent, setClipboardContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Translate paste options at render time
    const pasteOptions = PASTE_OPTION_DEFS.map((def) => ({
        id: def.id,
        label: t(def.labelKey),
        description: t(def.descriptionKey),
        shortcut: t(def.shortcutKey),
    }));
    // Read clipboard content when dialog opens
    useEffect(() => {
        if (!isOpen) {
            setClipboardContent(null);
            setError(null);
            setSelectedIndex(0);
            return;
        }
        const loadClipboard = () => __awaiter(void 0, void 0, void 0, function* () {
            setIsLoading(true);
            setError(null);
            try {
                const content = yield readFromClipboard({ cleanWordFormatting: true });
                setClipboardContent(content);
                if (!content) {
                    setError(t('dialogs.pasteSpecial.noContent'));
                }
            }
            catch (_a) {
                setError(t('dialogs.pasteSpecial.clipboardError'));
            }
            finally {
                setIsLoading(false);
            }
        });
        loadClipboard();
    }, [isOpen]);
    // Handle click outside to close
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (e) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);
    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % PASTE_OPTION_DEFS.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + PASTE_OPTION_DEFS.length) % PASTE_OPTION_DEFS.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    handlePaste(PASTE_OPTION_DEFS[selectedIndex].id);
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, onClose]);
    const handlePaste = useCallback((option) => {
        if (!clipboardContent) {
            setError(t('dialogs.pasteSpecial.noContent'));
            return;
        }
        const asPlainText = option === 'plainText';
        onPaste(clipboardContent, asPlainText);
        onClose();
    }, [clipboardContent, onPaste, onClose]);
    // Calculate dialog position
    const getDialogStyle = useCallback(() => {
        var _a, _b;
        const dialogWidth = 320;
        const dialogHeight = 200;
        let x = (_a = position === null || position === void 0 ? void 0 : position.x) !== null && _a !== void 0 ? _a : (typeof window !== 'undefined' ? window.innerWidth / 2 - dialogWidth / 2 : 100);
        let y = (_b = position === null || position === void 0 ? void 0 : position.y) !== null && _b !== void 0 ? _b : (typeof window !== 'undefined' ? window.innerHeight / 2 - dialogHeight / 2 : 100);
        // Adjust for viewport boundaries
        if (typeof window !== 'undefined') {
            if (x + dialogWidth > window.innerWidth) {
                x = window.innerWidth - dialogWidth - 10;
            }
            if (y + dialogHeight > window.innerHeight) {
                y = window.innerHeight - dialogHeight - 10;
            }
            if (x < 10)
                x = 10;
            if (y < 10)
                y = 10;
        }
        return {
            position: 'fixed',
            top: y,
            left: x,
            width: dialogWidth,
            background: 'var(--doc-surface, white)',
            border: '1px solid var(--doc-border-light)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 10001,
            overflow: 'hidden',
        };
    }, [position]);
    if (!isOpen)
        return null;
    return (_jsx(FocusTrap, { children: _jsxs("div", { ref: dialogRef, className: `docx-paste-special-dialog ${className}`, style: getDialogStyle(), role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.pasteSpecial.title'), children: [_jsxs("div", { style: {
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--doc-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }, children: [_jsx("span", { style: {
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'var(--doc-text)',
                            }, children: t('dialogs.pasteSpecial.title') }), _jsx("button", { type: "button", onClick: onClose, "aria-label": t('common.closeDialog'), style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                color: 'var(--doc-text-muted)',
                            }, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }), _jsx("div", { style: { padding: '8px' }, children: isLoading ? (_jsx("div", { style: {
                            padding: '20px',
                            textAlign: 'center',
                            color: 'var(--doc-text-muted)',
                            fontSize: '13px',
                        }, children: t('dialogs.pasteSpecial.readingClipboard') })) : error ? (_jsx("div", { style: {
                            padding: '20px',
                            textAlign: 'center',
                            color: 'var(--doc-error)',
                            fontSize: '13px',
                        }, children: error })) : (_jsx("div", { role: "menu", children: pasteOptions.map((option, index) => (_jsx(PasteOptionButton, { option: option, isSelected: index === selectedIndex, onClick: () => handlePaste(option.id), onMouseEnter: () => setSelectedIndex(index) }, option.id))) })) }), clipboardContent && !isLoading && !error && (_jsxs("div", { style: {
                        padding: '8px 16px 12px',
                        borderTop: '1px solid var(--doc-border)',
                    }, children: [_jsx("div", { style: {
                                fontSize: '11px',
                                color: 'var(--doc-text-muted)',
                                marginBottom: '4px',
                            }, children: t('dialogs.pasteSpecial.preview') }), _jsxs("div", { style: {
                                fontSize: '12px',
                                color: 'var(--doc-text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                padding: '6px 8px',
                                background: 'var(--doc-surface-sunken)',
                                borderRadius: '4px',
                            }, children: ["\"", clipboardContent.plainText.slice(0, 50), clipboardContent.plainText.length > 50 ? '...' : '', "\""] })] }))] }) }));
};
// ============================================================================
// HOOK FOR PASTE SPECIAL
// ============================================================================
/**
 * Hook to manage paste special dialog
 */
export function usePasteSpecial(options = {}) {
    const { onPaste, enabled = true } = options;
    const [isOpen, setIsOpen] = useState(false);
    const openDialog = useCallback(() => {
        if (enabled) {
            setIsOpen(true);
        }
    }, [enabled]);
    const closeDialog = useCallback(() => {
        setIsOpen(false);
    }, []);
    /**
     * Paste as plain text directly (without dialog)
     */
    const pasteAsPlainText = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        if (!enabled || !onPaste)
            return;
        try {
            const content = yield readFromClipboard({ cleanWordFormatting: true });
            if (content) {
                onPaste(content, true);
            }
        }
        catch (error) {
            console.error('Failed to paste as plain text:', error);
        }
    }), [enabled, onPaste]);
    /**
     * Handle keyboard shortcuts
     * Returns true if the event was handled
     */
    const handleKeyDown = useCallback((event) => {
        if (!enabled)
            return false;
        const isCtrlOrMeta = event.ctrlKey || event.metaKey;
        // Ctrl+Shift+V - Open paste special dialog OR paste as plain text
        if (isCtrlOrMeta && event.shiftKey && event.key.toLowerCase() === 'v') {
            event.preventDefault();
            openDialog();
            return true;
        }
        return false;
    }, [enabled, openDialog]);
    return {
        isOpen,
        openDialog,
        closeDialog,
        handleKeyDown,
        pasteAsPlainText,
    };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get paste option definition by id
 */
export function getPasteOption(id) {
    return PASTE_OPTION_DEFS.find((option) => option.id === id);
}
/**
 * Get all paste option definitions
 */
export function getAllPasteOptions() {
    return [...PASTE_OPTION_DEFS];
}
/**
 * Get default paste option
 */
export function getDefaultPasteOption() {
    return 'formatted';
}
/**
 * Check if paste special shortcut
 */
export function isPasteSpecialShortcut(event) {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey;
    return isCtrlOrMeta && event.shiftKey && event.key.toLowerCase() === 'v';
}
// ============================================================================
// EXPORTS
// ============================================================================
export default PasteSpecialDialog;
//# sourceMappingURL=PasteSpecialDialog.js.map