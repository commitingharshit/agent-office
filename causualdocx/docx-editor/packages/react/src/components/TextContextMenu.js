import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Text Context Menu Component
 *
 * Right-click context menu for text editing operations.
 * Shows Cut, Copy, Paste, and other text editing options.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from '../i18n';
import defaultLocale from '../../i18n/en.json';
import { Z_INDEX } from '../styles/zIndex';
const DEFAULT_MENU_ITEM_DEFS = [
    { action: 'cut', labelKey: 'contextMenu.cut', shortcutKey: 'contextMenu.cutShortcut' },
    { action: 'copy', labelKey: 'contextMenu.copy', shortcutKey: 'contextMenu.copyShortcut' },
    { action: 'paste', labelKey: 'contextMenu.paste', shortcutKey: 'contextMenu.pasteShortcut' },
    {
        action: 'pasteAsPlainText',
        labelKey: 'contextMenu.pastePlainText',
        shortcutKey: 'contextMenu.pastePlainTextShortcut',
        dividerAfter: true,
    },
    {
        action: 'delete',
        labelKey: 'contextMenu.delete',
        shortcutKey: 'contextMenu.deleteShortcut',
        dividerAfter: true,
    },
    {
        action: 'selectAll',
        labelKey: 'contextMenu.selectAll',
        shortcutKey: 'contextMenu.selectAllShortcut',
    },
];
// ============================================================================
// ICONS
// ============================================================================
const CutIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("circle", { cx: "4", cy: "12", r: "2", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("circle", { cx: "12", cy: "12", r: "2", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M5.5 10.5L10.5 3M10.5 10.5L5.5 3", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const CopyIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "5", y: "5", width: "8", height: "9", rx: "1", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M11 5V3a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1h2", stroke: "currentColor", strokeWidth: "1.5" })] }));
const PasteIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "3", y: "3", width: "10", height: "11", rx: "1", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M6 3V2a1 1 0 011-1h2a1 1 0 011 1v1", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M6 8h4M6 11h4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const DeleteIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }));
const SelectAllIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "2", width: "12", height: "12", rx: "1", stroke: "currentColor", strokeWidth: "1.5", strokeDasharray: "2 2" }), _jsx("rect", { x: "4", y: "4", width: "8", height: "8", fill: "currentColor", opacity: "0.3" })] }));
const AddRowAboveIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "6", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "2", y: "10", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M8 1v3M6.5 2.5h3", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }));
const AddRowBelowIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "2", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "2", y: "6", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M8 12v3M6.5 13.5h3", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }));
const DeleteRowIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "2", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "2", y: "6", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2", opacity: "0.3" }), _jsx("rect", { x: "2", y: "10", width: "12", height: "4", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M5 8h6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const AddColumnLeftIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "6", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "10", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M3 8H0.5M1.75 6.5v3", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }));
const AddColumnRightIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "6", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M13 8h2.5M14.25 6.5v3", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }));
const DeleteColumnIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "6", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2", opacity: "0.3" }), _jsx("rect", { x: "10", y: "2", width: "4", height: "12", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M8 5v6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const MergeCellsIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "4", width: "4", height: "8", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("rect", { x: "10", y: "4", width: "4", height: "8", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M7 8h2", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("path", { d: "M8 7l1 1-1 1", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }));
const SplitCellIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "4", width: "12", height: "8", rx: "0.5", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M8 4v8", stroke: "currentColor", strokeWidth: "1.2", strokeDasharray: "2 1" }), _jsx("path", { d: "M6.5 8h-1M9.5 8h1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const SparkleIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M8 1.5L9 5.5L13 7L9 8.5L8 12.5L7 8.5L3 7L7 5.5L8 1.5Z", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" }), _jsx("path", { d: "M13 11.5L13.5 13L15 13.5L13.5 14L13 15.5L12.5 14L11 13.5L12.5 13L13 11.5Z", fill: "currentColor" })] }));
const TranslateIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M2 4h6M5 2v2M3 4c0 3 2 5 4 5M7 4c0 3-2 5-4 5", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }), _jsx("path", { d: "M8 14l2.5-6 2.5 6M9 12h3", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" })] }));
const CommentIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V4a1 1 0 011-1z", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M5 6h6M5 8.5h4", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }));
/**
 * Get icon for action
 */
function getActionIcon(action) {
    switch (action) {
        case 'cut':
            return _jsx(CutIcon, {});
        case 'copy':
            return _jsx(CopyIcon, {});
        case 'paste':
        case 'pasteAsPlainText':
            return _jsx(PasteIcon, {});
        case 'delete':
            return _jsx(DeleteIcon, {});
        case 'selectAll':
            return _jsx(SelectAllIcon, {});
        case 'addRowAbove':
            return _jsx(AddRowAboveIcon, {});
        case 'addRowBelow':
            return _jsx(AddRowBelowIcon, {});
        case 'deleteRow':
            return _jsx(DeleteRowIcon, {});
        case 'addColumnLeft':
            return _jsx(AddColumnLeftIcon, {});
        case 'addColumnRight':
            return _jsx(AddColumnRightIcon, {});
        case 'deleteColumn':
            return _jsx(DeleteColumnIcon, {});
        case 'deleteTable':
            // Re-use the generic delete glyph — Word, Notion, and Google
            // Docs all use a trash/delete icon for whole-table removal.
            return _jsx(DeleteIcon, {});
        case 'mergeCells':
            return _jsx(MergeCellsIcon, {});
        case 'splitCell':
            return _jsx(SplitCellIcon, {});
        case 'addComment':
            return _jsx(CommentIcon, {});
        case 'translateSelection':
        case 'translateQuickReplace':
            return _jsx(TranslateIcon, {});
        case 'aiRewrite':
        case 'aiSummarize':
        case 'aiAsk':
            return _jsx(SparkleIcon, {});
        default:
            return null;
    }
}
const MenuItemComponent = ({ item, onClick, isHighlighted, onMouseEnter, }) => {
    if (item.action === 'separator') {
        return (_jsx("div", { className: "docx-text-context-menu-separator", style: {
                height: '1px',
                backgroundColor: 'var(--doc-border)',
                margin: '4px 12px',
            } }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: `docx-text-context-menu-item ${isHighlighted ? 'docx-text-context-menu-item-highlighted' : ''} ${item.disabled ? 'docx-text-context-menu-item-disabled' : ''}`, onClick: onClick, onMouseEnter: onMouseEnter, disabled: item.disabled, role: "menuitem", "aria-disabled": item.disabled, style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: isHighlighted && !item.disabled ? 'var(--doc-primary-light)' : 'transparent',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    color: item.disabled ? 'var(--doc-text-subtle)' : 'var(--doc-text)',
                    textAlign: 'left',
                    opacity: item.disabled ? 0.6 : 1,
                }, children: [_jsx("span", { style: {
                            display: 'flex',
                            color: item.disabled ? 'var(--doc-border)' : 'var(--doc-text-muted)',
                        }, children: getActionIcon(item.action) }), _jsx("span", { style: { flex: 1 }, children: item.label }), item.shortcut && (_jsx("span", { style: {
                            fontSize: '11px',
                            color: 'var(--doc-text-subtle)',
                            fontFamily: 'monospace',
                        }, children: item.shortcut }))] }), item.dividerAfter && (_jsx("div", { className: "docx-text-context-menu-separator", style: {
                    height: '1px',
                    backgroundColor: 'var(--doc-border)',
                    margin: '4px 12px',
                } }))] }));
};
// ============================================================================
// TEXT CONTEXT MENU COMPONENT
// ============================================================================
export const TextContextMenu = ({ isOpen, position, hasSelection, isEditable, hasClipboardContent = true, onAction, onClose, items, className = '', }) => {
    const menuRef = useRef(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const { t } = useTranslation();
    // Translate default menu items from definitions
    const translatedDefaults = useMemo(() => DEFAULT_MENU_ITEM_DEFS.map((def) => ({
        action: def.action,
        label: t(def.labelKey),
        shortcut: def.shortcutKey ? t(def.shortcutKey) : undefined,
        dividerAfter: def.dividerAfter,
    })), [t]);
    // Build menu items with disabled states
    const menuItems = (items || translatedDefaults).map((item) => {
        const disabled = (() => {
            if (item.disabled !== undefined)
                return item.disabled;
            switch (item.action) {
                case 'cut':
                case 'copy':
                case 'delete':
                    return !hasSelection;
                case 'paste':
                case 'pasteAsPlainText':
                    return !isEditable || !hasClipboardContent;
                default:
                    return false;
            }
        })();
        return Object.assign(Object.assign({}, item), { disabled });
    });
    // Filter out separators for keyboard navigation
    const navigableItems = menuItems.filter((item) => item.action !== 'separator');
    // Handle click outside
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Use timeout to avoid immediately closing on right-click
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
                    setHighlightedIndex((prev) => {
                        var _a;
                        let next = (prev + 1) % navigableItems.length;
                        // Skip disabled items
                        while (((_a = navigableItems[next]) === null || _a === void 0 ? void 0 : _a.disabled) && next !== prev) {
                            next = (next + 1) % navigableItems.length;
                        }
                        return next;
                    });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex((prev) => {
                        var _a;
                        let next = (prev - 1 + navigableItems.length) % navigableItems.length;
                        // Skip disabled items
                        while (((_a = navigableItems[next]) === null || _a === void 0 ? void 0 : _a.disabled) && next !== prev) {
                            next = (next - 1 + navigableItems.length) % navigableItems.length;
                        }
                        return next;
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    const item = navigableItems[highlightedIndex];
                    if (item && !item.disabled) {
                        onAction(item.action);
                        onClose();
                    }
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, navigableItems, onAction, onClose]);
    // Reset highlighted index when menu opens
    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(0);
        }
    }, [isOpen]);
    // Measure the actual rendered size so the viewport clamp is exact — the
    // per-item estimate is wrong with separators/long items, which let the menu
    // spill below the window and gain an internal scrollbar. useLayoutEffect runs
    // before paint, so the corrected position lands without a flicker.
    const [measured, setMeasured] = useState(null);
    useLayoutEffect(() => {
        if (!isOpen) {
            setMeasured(null);
            return;
        }
        const el = menuRef.current;
        if (el) {
            const r = el.getBoundingClientRect();
            setMeasured((prev) => prev && Math.abs(prev.h - r.height) < 1 && Math.abs(prev.w - r.width) < 1
                ? prev
                : { w: r.width, h: r.height });
        }
    }, [isOpen, menuItems.length]);
    // Position menu to stay within the viewport, and never let it grow past the
    // window — a too-tall menu caps to the available height and scrolls internally
    // instead of spilling below the window edge.
    const getMenuStyle = useCallback(() => {
        var _a, _b;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
        const MARGIN = 10;
        const maxH = Math.max(120, vh - 2 * MARGIN);
        const menuWidth = (_a = measured === null || measured === void 0 ? void 0 : measured.w) !== null && _a !== void 0 ? _a : 220;
        const menuHeight = Math.min((_b = measured === null || measured === void 0 ? void 0 : measured.h) !== null && _b !== void 0 ? _b : menuItems.length * 36 + 16, maxH);
        let x = position.x;
        let y = position.y;
        if (x + menuWidth > vw)
            x = vw - menuWidth - MARGIN;
        if (y + menuHeight > vh)
            y = vh - menuHeight - MARGIN;
        if (x < MARGIN)
            x = MARGIN;
        if (y < MARGIN)
            y = MARGIN;
        return {
            position: 'fixed',
            top: y,
            left: x,
            minWidth: 220,
            maxHeight: maxH,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'var(--doc-surface, white)',
            color: 'var(--doc-text-on-surface, #1f2937)',
            border: '1px solid var(--doc-border-light)',
            borderRadius: '8px',
            boxShadow: 'var(--doc-shadow, 0 2px 10px rgba(0, 0, 0, 0.15))',
            zIndex: Z_INDEX.contextMenu,
            padding: '4px 0',
        };
    }, [position, menuItems.length, measured]);
    const handleItemClick = (item) => {
        if (item.disabled)
            return;
        onAction(item.action);
        onClose();
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { ref: menuRef, className: `docx-text-context-menu ${className}`, style: getMenuStyle(), role: "menu", "aria-label": t('contextMenu.textMenuAriaLabel'), children: menuItems.map((item, index) => {
            // Find the index in navigable items for highlighting
            const navigableIndex = navigableItems.findIndex((ni) => ni === item);
            return (_jsx(MenuItemComponent, { item: item, onClick: () => handleItemClick(item), isHighlighted: navigableIndex === highlightedIndex, onMouseEnter: () => {
                    if (navigableIndex >= 0 && !item.disabled) {
                        setHighlightedIndex(navigableIndex);
                    }
                } }, `${item.action}-${index}`));
        }) }));
};
// ============================================================================
// USE TEXT CONTEXT MENU HOOK
// ============================================================================
/**
 * Hook to manage text context menu state
 */
export function useTextContextMenu(options = {}) {
    const { enabled = true, isEditable: _isEditable = true, containerRef: _containerRef, onAction, } = options;
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasSelection, setHasSelection] = useState(false);
    /**
     * Check if there's a text selection
     */
    const checkSelection = useCallback(() => {
        const selection = window.getSelection();
        const hasText = selection && !selection.isCollapsed && selection.toString().length > 0;
        setHasSelection(!!hasText);
        return !!hasText;
    }, []);
    /**
     * Open the context menu
     */
    const openMenu = useCallback((event) => {
        if (!enabled)
            return;
        event.preventDefault();
        event.stopPropagation();
        // Update selection state
        checkSelection();
        setPosition({ x: event.clientX, y: event.clientY });
        setIsOpen(true);
    }, [enabled, checkSelection]);
    /**
     * Close the context menu
     */
    const closeMenu = useCallback(() => {
        setIsOpen(false);
    }, []);
    /**
     * Handle action selection
     */
    const handleAction = useCallback((action) => {
        var _a, _b;
        closeMenu();
        // Execute the action
        switch (action) {
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'pasteAsPlainText':
                // Trigger paste event with shift key simulation
                // Note: This may not work in all browsers due to security restrictions
                (_b = (_a = navigator.clipboard).readText) === null || _b === void 0 ? void 0 : _b.call(_a).then((text) => {
                    document.execCommand('insertText', false, text);
                }).catch(() => {
                    // Fallback - just try regular paste
                    document.execCommand('paste');
                });
                break;
            case 'delete':
                document.execCommand('delete');
                break;
            case 'selectAll':
                document.execCommand('selectAll');
                break;
        }
        onAction === null || onAction === void 0 ? void 0 : onAction(action);
    }, [closeMenu, onAction]);
    /**
     * Context menu event handler
     */
    const onContextMenu = useCallback((event) => {
        openMenu(event);
    }, [openMenu]);
    // Close menu when clicking elsewhere or pressing Escape
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeMenu]);
    return {
        isOpen,
        position,
        hasSelection,
        openMenu,
        closeMenu,
        handleAction,
        onContextMenu,
    };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get action label
 */
export function getTextActionLabel(action) {
    const labels = {
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        pasteAsPlainText: 'Paste as Plain Text',
        selectAll: 'Select All',
        delete: 'Delete',
        separator: '',
        addRowAbove: 'Insert row above',
        addRowBelow: 'Insert row below',
        deleteRow: 'Delete row',
        addColumnLeft: 'Insert column left',
        addColumnRight: 'Insert column right',
        deleteColumn: 'Delete column',
        deleteTable: 'Delete table',
        mergeCells: defaultLocale.table.mergeCells,
        splitCell: defaultLocale.table.splitCell,
        addComment: 'Comment',
        translateSelection: 'Translate selection…',
        translateQuickReplace: 'Translate selection',
        aiRewrite: 'Rewrite with AI',
        aiSummarize: 'Summarize with AI',
        aiAsk: 'Ask AI about this',
    };
    return labels[action];
}
/**
 * Get action shortcut
 */
export function getTextActionShortcut(action) {
    const shortcuts = {
        cut: 'Ctrl+X',
        copy: 'Ctrl+C',
        paste: 'Ctrl+V',
        pasteAsPlainText: 'Ctrl+Shift+V',
        selectAll: 'Ctrl+A',
        delete: 'Del',
        separator: '',
        addRowAbove: '',
        addRowBelow: '',
        deleteRow: '',
        addColumnLeft: '',
        addColumnRight: '',
        deleteColumn: '',
        deleteTable: '',
        mergeCells: '',
        splitCell: '',
        addComment: '',
        translateSelection: '',
        translateQuickReplace: '',
        aiRewrite: '',
        aiSummarize: '',
        aiAsk: '',
    };
    return shortcuts[action];
}
/**
 * Get default menu item definitions (untranslated, use translation keys)
 */
export function getDefaultTextContextMenuItems() {
    return DEFAULT_MENU_ITEM_DEFS.map((def) => ({
        action: def.action,
        label: def.labelKey,
        shortcut: def.shortcutKey,
        dividerAfter: def.dividerAfter,
    }));
}
/**
 * Check if action is available
 */
export function isTextActionAvailable(action, hasSelection, isEditable) {
    switch (action) {
        case 'cut':
        case 'copy':
        case 'delete':
            return hasSelection;
        case 'paste':
        case 'pasteAsPlainText':
            return isEditable;
        case 'addComment':
            return hasSelection;
        case 'translateSelection':
        case 'translateQuickReplace':
        case 'aiRewrite':
        case 'aiSummarize':
        case 'aiAsk':
            return hasSelection;
        case 'selectAll':
            return true;
        default:
            return true;
    }
}
// ============================================================================
// EXPORTS
// ============================================================================
export default TextContextMenu;
//# sourceMappingURL=TextContextMenu.js.map