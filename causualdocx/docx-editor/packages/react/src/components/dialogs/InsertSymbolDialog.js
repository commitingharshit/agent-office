import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Insert Symbol Dialog Component
 *
 * Modal dialog for inserting special characters and symbols into the document.
 * Provides categorized symbol picker with search functionality.
 *
 * Features:
 * - Categorized symbol groups
 * - Recent symbols
 * - Search functionality
 * - Unicode character display
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
// ============================================================================
// STYLES
// ============================================================================
const DIALOG_OVERLAY_STYLE = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
};
const DIALOG_CONTENT_STYLE = {
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    minWidth: 'min(450px, calc(100vw - 32px))',
    maxWidth: '550px',
    width: '100%',
    margin: 'clamp(8px, 2.5vw, 20px)',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
};
const DIALOG_HEADER_STYLE = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--doc-border)',
};
const DIALOG_TITLE_STYLE = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--doc-text)',
};
const CLOSE_BUTTON_STYLE = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    padding: '4px 8px',
    lineHeight: 1,
};
const DIALOG_BODY_STYLE = {
    padding: '20px',
    flex: 1,
    overflow: 'auto',
};
const SEARCH_INPUT_STYLE = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--doc-border-input)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
    boxSizing: 'border-box',
};
const CATEGORY_TABS_STYLE = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '16px',
};
const CATEGORY_TAB_STYLE = {
    padding: '6px 12px',
    border: '1px solid var(--doc-border-input)',
    borderRadius: '4px',
    backgroundColor: 'var(--doc-surface, white)',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all var(--doc-anim-base)',
};
const CATEGORY_TAB_ACTIVE_STYLE = Object.assign(Object.assign({}, CATEGORY_TAB_STYLE), { backgroundColor: 'var(--doc-primary)', borderColor: 'var(--doc-primary)', color: 'white' });
const SYMBOLS_GRID_STYLE = {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: '4px',
    maxHeight: '250px',
    overflow: 'auto',
};
const SYMBOL_BUTTON_STYLE = {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--doc-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--doc-surface, white)',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all var(--doc-anim-base)',
};
const PREVIEW_SECTION_STYLE = {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'var(--doc-bg-subtle)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
};
const PREVIEW_SYMBOL_STYLE = {
    fontSize: '36px',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: '4px',
    border: '1px solid var(--doc-border)',
};
const PREVIEW_INFO_STYLE = {
    flex: 1,
};
const DIALOG_FOOTER_STYLE = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid var(--doc-border)',
};
const BUTTON_BASE_STYLE = {
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
};
const PRIMARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-primary)', color: 'white' });
const SECONDARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-bg-subtle)', color: 'var(--doc-text)', border: '1px solid var(--doc-border-input)' });
const DISABLED_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-border-input)', color: 'var(--doc-text-muted)', cursor: 'not-allowed' });
// ============================================================================
// SYMBOL DATA
// ============================================================================
/**
 * Default symbol categories
 */
export const SYMBOL_CATEGORIES = [
    {
        name: 'common',
        label: 'Common',
        symbols: [
            '©',
            '®',
            '™',
            '•',
            '…',
            '—',
            '–',
            '°',
            '±',
            '×',
            '÷',
            '≠',
            '≤',
            '≥',
            '∞',
            '√',
            '∑',
            '∏',
            '∫',
            'π',
            '€',
            '£',
            '¥',
            '¢',
            '§',
            '¶',
            '†',
            '‡',
            '‰',
            '№',
        ],
    },
    {
        name: 'arrows',
        label: 'Arrows',
        symbols: [
            '←',
            '↑',
            '→',
            '↓',
            '↔',
            '↕',
            '↖',
            '↗',
            '↘',
            '↙',
            '⇐',
            '⇑',
            '⇒',
            '⇓',
            '⇔',
            '⇕',
            '⟵',
            '⟶',
            '⟷',
            '➔',
            '➜',
            '➞',
            '➡',
            '➢',
            '➣',
            '➤',
            '➥',
            '➦',
            '➧',
            '➨',
        ],
    },
    {
        name: 'math',
        label: 'Math',
        symbols: [
            '+',
            '−',
            '×',
            '÷',
            '=',
            '≠',
            '<',
            '>',
            '≤',
            '≥',
            '±',
            '∓',
            '∞',
            '√',
            '∛',
            '∜',
            '∑',
            '∏',
            '∫',
            '∂',
            '∆',
            '∇',
            '∈',
            '∉',
            '∋',
            '∅',
            '∀',
            '∃',
            '∄',
            '⊂',
            '⊃',
            '⊆',
            '⊇',
            '∪',
            '∩',
            '⊕',
            '⊗',
            '⊥',
            '∠',
            '∟',
        ],
    },
    {
        name: 'greek',
        label: 'Greek',
        symbols: [
            'α',
            'β',
            'γ',
            'δ',
            'ε',
            'ζ',
            'η',
            'θ',
            'ι',
            'κ',
            'λ',
            'μ',
            'ν',
            'ξ',
            'ο',
            'π',
            'ρ',
            'σ',
            'τ',
            'υ',
            'φ',
            'χ',
            'ψ',
            'ω',
            'Α',
            'Β',
            'Γ',
            'Δ',
            'Ε',
            'Ζ',
            'Η',
            'Θ',
            'Ι',
            'Κ',
            'Λ',
            'Μ',
            'Ν',
            'Ξ',
            'Ο',
            'Π',
        ],
    },
    {
        name: 'shapes',
        label: 'Shapes',
        symbols: [
            '■',
            '□',
            '▪',
            '▫',
            '▬',
            '▭',
            '▮',
            '▯',
            '▰',
            '▱',
            '▲',
            '△',
            '▴',
            '▵',
            '▶',
            '▷',
            '▸',
            '▹',
            '►',
            '▻',
            '▼',
            '▽',
            '▾',
            '▿',
            '◀',
            '◁',
            '◂',
            '◃',
            '◄',
            '◅',
            '●',
            '○',
            '◎',
            '◉',
            '◌',
            '◍',
            '◐',
            '◑',
            '◒',
            '◓',
        ],
    },
    {
        name: 'punctuation',
        label: 'Punctuation',
        symbols: [
            '–',
            '—',
            '\u2018',
            '\u2019',
            '\u201C',
            '\u201D',
            '«',
            '»',
            '‹',
            '›',
            '…',
            '·',
            '•',
            '‣',
            '⁃',
            '‐',
            '‑',
            '‒',
            '―',
            '‖',
            '′',
            '″',
            '‴',
            '⁗',
            '‵',
            '‶',
            '‷',
            '※',
            '‽',
            '⁂',
        ],
    },
    {
        name: 'currency',
        label: 'Currency',
        symbols: [
            '$',
            '¢',
            '£',
            '¤',
            '¥',
            '₠',
            '₡',
            '₢',
            '₣',
            '₤',
            '₥',
            '₦',
            '₧',
            '₨',
            '₩',
            '₪',
            '₫',
            '€',
            '₭',
            '₮',
            '₯',
            '₰',
            '₱',
            '₲',
            '₳',
            '₴',
            '₵',
            '₶',
            '₷',
            '₸',
        ],
    },
    {
        name: 'music',
        label: 'Music',
        symbols: [
            '♩',
            '♪',
            '♫',
            '♬',
            '♭',
            '♮',
            '♯',
            '𝄞',
            '𝄢',
            '𝄪',
            '𝄫',
            '𝅗𝅥',
            '𝅘𝅥',
            '𝅘𝅥𝅮',
            '𝅘𝅥𝅯',
            '𝅘𝅥𝅰',
            '𝆒',
            '𝆓',
            '𝄐',
            '𝄑',
        ],
    },
    {
        name: 'emoji',
        label: 'Emoji',
        symbols: [
            '😀',
            '😃',
            '😄',
            '😁',
            '😆',
            '😅',
            '🤣',
            '😂',
            '🙂',
            '🙃',
            '😉',
            '😊',
            '😇',
            '🥰',
            '😍',
            '🤩',
            '😘',
            '😗',
            '☺',
            '😚',
            '❤',
            '🧡',
            '💛',
            '💚',
            '💙',
            '💜',
            '🖤',
            '🤍',
            '💔',
            '❣',
            '👍',
            '👎',
            '👌',
            '✌',
            '🤞',
            '🤟',
            '🤘',
            '👋',
            '🙏',
            '✅',
        ],
    },
];
/**
 * Get all symbols flattened
 */
function getAllSymbols() {
    return SYMBOL_CATEGORIES.flatMap((cat) => cat.symbols);
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * InsertSymbolDialog - Modal for inserting special characters
 */
export function InsertSymbolDialog({ isOpen, onClose, onInsert, recentSymbols = [], className, style, }) {
    const { t } = useTranslation();
    // State
    const [selectedCategory, setSelectedCategory] = useState('common');
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredSymbol, setHoveredSymbol] = useState(null);
    // Refs
    const searchInputRef = useRef(null);
    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedSymbol(null);
            setSearchQuery('');
            setHoveredSymbol(null);
            setTimeout(() => { var _a; return (_a = searchInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100);
        }
    }, [isOpen]);
    // Filter symbols based on search
    const filteredSymbols = useMemo(() => {
        if (!searchQuery.trim()) {
            if (selectedCategory === 'recent') {
                return recentSymbols;
            }
            const category = SYMBOL_CATEGORIES.find((c) => c.name === selectedCategory);
            return (category === null || category === void 0 ? void 0 : category.symbols) || [];
        }
        const query = searchQuery.toLowerCase();
        const allSymbols = getAllSymbols();
        // Search by character or Unicode code point
        return allSymbols.filter((symbol) => {
            var _a;
            const codePoint = ((_a = symbol.codePointAt(0)) === null || _a === void 0 ? void 0 : _a.toString(16).toUpperCase()) || '';
            return (symbol.includes(query) ||
                codePoint.includes(query.toUpperCase()) ||
                `U+${codePoint}`.toLowerCase().includes(query));
        });
    }, [searchQuery, selectedCategory, recentSymbols]);
    /**
     * Handle symbol click
     */
    const handleSymbolClick = useCallback((symbol) => {
        setSelectedSymbol(symbol);
    }, []);
    /**
     * Handle symbol double-click (insert immediately)
     */
    const handleSymbolDoubleClick = useCallback((symbol) => {
        onInsert(symbol);
    }, [onInsert]);
    /**
     * Handle insert
     */
    const handleInsert = useCallback(() => {
        if (selectedSymbol) {
            onInsert(selectedSymbol);
        }
    }, [selectedSymbol, onInsert]);
    /**
     * Handle keyboard events
     */
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        else if (e.key === 'Enter' && selectedSymbol) {
            e.preventDefault();
            handleInsert();
        }
    }, [onClose, selectedSymbol, handleInsert]);
    /**
     * Handle overlay click
     */
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);
    /**
     * Get symbol info
     */
    const getSymbolInfo = (symbol) => {
        if (!symbol)
            return null;
        const codePoint = symbol.codePointAt(0);
        return {
            character: symbol,
            codePoint: codePoint ? `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}` : '',
            decimal: codePoint || 0,
        };
    };
    // Don't render if not open
    if (!isOpen) {
        return null;
    }
    const displaySymbol = hoveredSymbol || selectedSymbol;
    const symbolInfo = getSymbolInfo(displaySymbol);
    const canInsert = selectedSymbol !== null;
    // Categories including recent
    const categoryLabelMap = {
        common: t('dialogs.insertSymbol.categories.common'),
        arrows: t('dialogs.insertSymbol.categories.arrows'),
        math: t('dialogs.insertSymbol.categories.math'),
        greek: t('dialogs.insertSymbol.categories.greek'),
        shapes: t('dialogs.insertSymbol.categories.shapes'),
        punctuation: t('dialogs.insertSymbol.categories.punctuation'),
        currency: t('dialogs.insertSymbol.categories.currency'),
        music: t('dialogs.insertSymbol.categories.music'),
        emoji: t('dialogs.insertSymbol.categories.emoji'),
    };
    const categories = [
        ...(recentSymbols.length > 0 ? [{ name: 'recent', label: 'Recent' }] : []),
        ...SYMBOL_CATEGORIES.map((c) => ({ name: c.name, label: categoryLabelMap[c.name] || c.label })),
    ];
    return (_jsx(FocusTrap, { children: _jsx("div", { className: `docx-insert-symbol-dialog-overlay ${className || ''}`, style: Object.assign(Object.assign({}, DIALOG_OVERLAY_STYLE), style), onClick: handleOverlayClick, onKeyDown: handleKeyDown, role: "dialog", "aria-modal": "true", "aria-labelledby": "insert-symbol-dialog-title", children: _jsxs("div", { className: "docx-insert-symbol-dialog", style: DIALOG_CONTENT_STYLE, children: [_jsxs("div", { className: "docx-insert-symbol-dialog-header", style: DIALOG_HEADER_STYLE, children: [_jsx("h2", { id: "insert-symbol-dialog-title", style: DIALOG_TITLE_STYLE, children: t('dialogs.insertSymbol.title') }), _jsx("button", { type: "button", className: "docx-insert-symbol-dialog-close", style: CLOSE_BUTTON_STYLE, onClick: onClose, "aria-label": t('common.closeDialog'), children: "\u00D7" })] }), _jsxs("div", { className: "docx-insert-symbol-dialog-body", style: DIALOG_BODY_STYLE, children: [_jsx("input", { ref: searchInputRef, type: "text", placeholder: t('dialogs.insertSymbol.searchPlaceholder'), value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: SEARCH_INPUT_STYLE }), !searchQuery && (_jsx("div", { className: "docx-insert-symbol-categories", style: CATEGORY_TABS_STYLE, children: categories.map((cat) => (_jsx("button", { type: "button", onClick: () => setSelectedCategory(cat.name), style: selectedCategory === cat.name ? CATEGORY_TAB_ACTIVE_STYLE : CATEGORY_TAB_STYLE, children: cat.label }, cat.name))) })), _jsx("div", { className: "docx-insert-symbol-grid", style: SYMBOLS_GRID_STYLE, children: filteredSymbols.map((symbol, index) => {
                                    var _a;
                                    return (_jsx("button", { type: "button", onClick: () => handleSymbolClick(symbol), onDoubleClick: () => handleSymbolDoubleClick(symbol), onMouseEnter: () => setHoveredSymbol(symbol), onMouseLeave: () => setHoveredSymbol(null), style: Object.assign(Object.assign({}, SYMBOL_BUTTON_STYLE), (selectedSymbol === symbol
                                            ? {
                                                backgroundColor: 'var(--doc-primary-light)',
                                                borderColor: 'var(--doc-primary)',
                                            }
                                            : {})), title: `${symbol} - U+${(_a = symbol.codePointAt(0)) === null || _a === void 0 ? void 0 : _a.toString(16).toUpperCase()}`, children: symbol }, `${symbol}-${index}`));
                                }) }), filteredSymbols.length === 0 && (_jsx("div", { style: { textAlign: 'center', padding: '20px', color: 'var(--doc-text-muted)' }, children: t('dialogs.insertSymbol.noResults', { query: searchQuery }) })), symbolInfo && (_jsxs("div", { className: "docx-insert-symbol-preview", style: PREVIEW_SECTION_STYLE, children: [_jsx("div", { style: PREVIEW_SYMBOL_STYLE, children: symbolInfo.character }), _jsxs("div", { style: PREVIEW_INFO_STYLE, children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500, marginBottom: '4px' }, children: symbolInfo.codePoint }), _jsx("div", { style: { fontSize: '12px', color: 'var(--doc-text-muted)' }, children: t('dialogs.insertSymbol.decimal', { value: symbolInfo.decimal }) })] })] }))] }), _jsxs("div", { className: "docx-insert-symbol-dialog-footer", style: DIALOG_FOOTER_STYLE, children: [_jsx("button", { type: "button", className: "docx-insert-symbol-dialog-cancel", style: SECONDARY_BUTTON_STYLE, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", className: "docx-insert-symbol-dialog-insert", style: canInsert ? PRIMARY_BUTTON_STYLE : DISABLED_BUTTON_STYLE, onClick: handleInsert, disabled: !canInsert, children: t('common.insert') })] })] }) }) }));
}
// ============================================================================
// HOOK
// ============================================================================
/**
 * Hook for managing Insert Symbol dialog state with recent symbols
 */
export function useInsertSymbolDialog(maxRecent = 20) {
    const [isOpen, setIsOpen] = useState(false);
    const [recentSymbols, setRecentSymbols] = useState([]);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    const addRecent = useCallback((symbol) => {
        setRecentSymbols((prev) => {
            // Remove if already exists, then add to front
            const filtered = prev.filter((s) => s !== symbol);
            return [symbol, ...filtered].slice(0, maxRecent);
        });
    }, [maxRecent]);
    return { isOpen, recentSymbols, open, close, toggle, addRecent };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get all symbol categories
 */
export function getSymbolCategories() {
    return SYMBOL_CATEGORIES;
}
/**
 * Get symbols by category name
 */
export function getSymbolsByCategory(categoryName) {
    const category = SYMBOL_CATEGORIES.find((c) => c.name === categoryName);
    return (category === null || category === void 0 ? void 0 : category.symbols) || [];
}
/**
 * Get symbol Unicode info
 */
export function getSymbolInfo(symbol) {
    const code = symbol.codePointAt(0) || 0;
    return {
        character: symbol,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        decimal: code,
        hex: code.toString(16).toUpperCase(),
    };
}
/**
 * Search symbols by query
 */
export function searchSymbols(query) {
    if (!query.trim())
        return [];
    const lowerQuery = query.toLowerCase();
    return getAllSymbols().filter((symbol) => {
        var _a;
        const code = ((_a = symbol.codePointAt(0)) === null || _a === void 0 ? void 0 : _a.toString(16).toUpperCase()) || '';
        return (symbol.includes(query) ||
            code.includes(lowerQuery.toUpperCase()) ||
            `U+${code}`.toLowerCase().includes(lowerQuery));
    });
}
/**
 * Get symbol from Unicode code point string
 */
export function symbolFromCodePoint(codePointStr) {
    // Handle formats: "U+0041", "0041", "41"
    const cleaned = codePointStr.replace(/^U\+/i, '').replace(/^0x/i, '');
    const code = parseInt(cleaned, 16);
    if (isNaN(code) || code < 0 || code > 0x10ffff) {
        return null;
    }
    return String.fromCodePoint(code);
}
// ============================================================================
// EXPORTS
// ============================================================================
export default InsertSymbolDialog;
//# sourceMappingURL=InsertSymbolDialog.js.map