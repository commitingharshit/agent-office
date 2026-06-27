import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Responsive Toolbar Component
 *
 * A responsive toolbar wrapper that collapses items into an overflow menu
 * when the screen is narrow.
 *
 * Features:
 * - Automatically measures available space
 * - Moves items to overflow menu when they don't fit
 * - Priority-based item ordering
 * - Configurable breakpoints
 * - ResizeObserver for dynamic resizing
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_ITEM_GAP = 4;
const DEFAULT_OVERFLOW_BUTTON_WIDTH = 36;
const DEFAULT_ITEM_MIN_WIDTH = 32;
// ============================================================================
// ICONS
// ============================================================================
const MoreIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("circle", { cx: "3", cy: "8", r: "1.5", fill: "currentColor" }), _jsx("circle", { cx: "8", cy: "8", r: "1.5", fill: "currentColor" }), _jsx("circle", { cx: "13", cy: "8", r: "1.5", fill: "currentColor" })] }));
// ============================================================================
// USE RESPONSIVE TOOLBAR HOOK
// ============================================================================
/**
 * Hook to calculate which items fit in the toolbar
 */
export function useResponsiveToolbar(options) {
    const { containerRef, items, itemGap = DEFAULT_ITEM_GAP, overflowButtonWidth = DEFAULT_OVERFLOW_BUTTON_WIDTH, } = options;
    const [visibleCount, setVisibleCount] = useState(items.length);
    const itemWidthsRef = useRef(new Map());
    /**
     * Calculate which items fit
     */
    const calculateVisibleItems = useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            setVisibleCount(items.length);
            return;
        }
        const containerWidth = container.offsetWidth;
        if (containerWidth === 0) {
            return;
        }
        // Sort items by priority (always visible first, then by priority number)
        const sortedItems = [...items].sort((a, b) => {
            if (a.alwaysVisible && !b.alwaysVisible)
                return -1;
            if (!a.alwaysVisible && b.alwaysVisible)
                return 1;
            return (a.priority || 3) - (b.priority || 3);
        });
        // Calculate how many items fit
        let usedWidth = 0;
        let count = 0;
        for (const item of sortedItems) {
            const itemWidth = item.minWidth || itemWidthsRef.current.get(item.id) || DEFAULT_ITEM_MIN_WIDTH;
            const widthWithGap = itemWidth + (count > 0 ? itemGap : 0);
            // Reserve space for overflow button if not all items will fit
            const reservedWidth = count < items.length - 1 ? overflowButtonWidth + itemGap : 0;
            if (usedWidth + widthWithGap + reservedWidth <= containerWidth) {
                usedWidth += widthWithGap;
                count++;
            }
            else if (item.alwaysVisible) {
                // Force include always visible items
                usedWidth += widthWithGap;
                count++;
            }
            else {
                break;
            }
        }
        setVisibleCount(Math.max(0, count));
    }, [containerRef, items, itemGap, overflowButtonWidth]);
    /**
     * Set up ResizeObserver
     */
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        // Initial calculation
        calculateVisibleItems();
        // Set up observer
        const resizeObserver = new ResizeObserver(() => {
            calculateVisibleItems();
        });
        resizeObserver.observe(container);
        return () => {
            resizeObserver.disconnect();
        };
    }, [containerRef, calculateVisibleItems]);
    // Recalculate when items change
    useEffect(() => {
        calculateVisibleItems();
    }, [items, calculateVisibleItems]);
    // Split items into visible and overflow
    const { visibleItems, overflowItems } = useMemo(() => {
        // Sort by priority for display
        const sortedItems = [...items].sort((a, b) => {
            if (a.alwaysVisible && !b.alwaysVisible)
                return -1;
            if (!a.alwaysVisible && b.alwaysVisible)
                return 1;
            return (a.priority || 3) - (b.priority || 3);
        });
        return {
            visibleItems: sortedItems.slice(0, visibleCount),
            overflowItems: sortedItems.slice(visibleCount),
        };
    }, [items, visibleCount]);
    return {
        visibleItems,
        overflowItems,
        hasOverflow: overflowItems.length > 0,
        recalculate: calculateVisibleItems,
    };
}
const OverflowMenu = ({ items, isOpen, onClose, anchorRef }) => {
    const menuRef = useRef(null);
    // Close on click outside
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (e) => {
            if (menuRef.current &&
                !menuRef.current.contains(e.target) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorRef]);
    // Close on Escape
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen || items.length === 0)
        return null;
    return (_jsx("div", { ref: menuRef, className: "docx-responsive-toolbar-overflow-menu", style: {
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: 'var(--doc-surface, white)',
            border: '1px solid var(--doc-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '8px',
            zIndex: 1000,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            maxWidth: '300px',
        }, role: "menu", children: items.map((item) => (_jsx("div", { className: "docx-responsive-toolbar-overflow-item", role: "menuitem", children: item.content }, item.id))) }));
};
// ============================================================================
// RESPONSIVE TOOLBAR COMPONENT
// ============================================================================
export const ResponsiveToolbar = ({ items, overflowItems: additionalOverflowItems = [], alwaysShowOverflow = false, renderOverflowButton, renderOverflowMenu, itemGap = DEFAULT_ITEM_GAP, padding = '8px 12px', overflowButtonWidth = DEFAULT_OVERFLOW_BUTTON_WIDTH, className = '', style, height = 44, backgroundColor = 'var(--doc-toolbar-bg)', borderBottom = '1px solid var(--doc-border)', }) => {
    const containerRef = useRef(null);
    const overflowButtonRef = useRef(null);
    const [isOverflowOpen, setIsOverflowOpen] = useState(false);
    const { visibleItems, overflowItems, hasOverflow } = useResponsiveToolbar({
        containerRef,
        items,
        itemGap,
        overflowButtonWidth,
    });
    // Combine overflow items with additional items
    const allOverflowItems = [...overflowItems, ...additionalOverflowItems];
    const showOverflow = hasOverflow || alwaysShowOverflow || additionalOverflowItems.length > 0;
    const toggleOverflow = useCallback(() => {
        setIsOverflowOpen((prev) => !prev);
    }, []);
    const closeOverflow = useCallback(() => {
        setIsOverflowOpen(false);
    }, []);
    // Default overflow button
    const defaultOverflowButton = (_jsx("button", { ref: overflowButtonRef, type: "button", className: "docx-responsive-toolbar-overflow-button", onClick: toggleOverflow, "aria-label": `Show ${allOverflowItems.length} more options`, "aria-expanded": isOverflowOpen, "aria-haspopup": "menu", style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${overflowButtonWidth}px`,
            height: '32px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: isOverflowOpen ? 'var(--doc-primary-light)' : 'transparent',
            color: 'var(--doc-text-muted)',
            cursor: 'pointer',
            transition: 'background-color var(--doc-anim-base)',
        }, children: _jsx(MoreIcon, {}) }));
    return (_jsxs("div", { ref: containerRef, className: `docx-responsive-toolbar ${className}`, style: Object.assign({ display: 'flex', alignItems: 'center', gap: `${itemGap}px`, height: typeof height === 'number' ? `${height}px` : height, padding,
            backgroundColor,
            borderBottom, position: 'relative' }, style), children: [visibleItems.map((item) => (_jsxs(React.Fragment, { children: [_jsx("div", { className: "docx-responsive-toolbar-item", "data-item-id": item.id, style: { flexShrink: 0 }, children: item.content }), item.separatorAfter && (_jsx("div", { className: "docx-responsive-toolbar-separator", style: {
                            width: '1px',
                            height: '24px',
                            backgroundColor: 'var(--doc-border)',
                            margin: '0 4px',
                        } }))] }, item.id))), showOverflow && _jsx("div", { style: { flex: 1, minWidth: 0 } }), showOverflow && (_jsxs("div", { style: { position: 'relative', flexShrink: 0 }, children: [renderOverflowButton
                        ? renderOverflowButton(allOverflowItems.length, isOverflowOpen, toggleOverflow)
                        : defaultOverflowButton, renderOverflowMenu ? (isOverflowOpen && renderOverflowMenu(allOverflowItems, closeOverflow)) : (_jsx(OverflowMenu, { items: allOverflowItems, isOpen: isOverflowOpen, onClose: closeOverflow, anchorRef: overflowButtonRef }))] }))] }));
};
export const ToolbarGroup = ({ children, gap = 2, separatorAfter = false, className = '', style, }) => {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `docx-toolbar-group ${className}`, style: Object.assign({ display: 'flex', alignItems: 'center', gap: `${gap}px` }, style), children: children }), separatorAfter && (_jsx("div", { className: "docx-toolbar-group-separator", style: {
                    width: '1px',
                    height: '24px',
                    backgroundColor: 'var(--doc-border)',
                    margin: '0 4px',
                } }))] }));
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create a toolbar item
 */
export function createToolbarItem(id, content, options) {
    return Object.assign({ id,
        content, priority: 3 }, options);
}
/**
 * Create toolbar items from an array of configs
 */
export function createToolbarItems(configs) {
    return configs.map((config) => (Object.assign(Object.assign({}, config), { priority: config.priority || 3 })));
}
/**
 * Get recommended priority for common toolbar items
 */
export function getRecommendedPriority(itemType) {
    const priorities = {
        undo: 1,
        redo: 1,
        bold: 1,
        italic: 1,
        underline: 2,
        fontFamily: 2,
        fontSize: 2,
        textColor: 3,
        highlightColor: 3,
        alignment: 3,
        lists: 4,
        indent: 4,
        lineSpacing: 5,
        styles: 5,
    };
    return priorities[itemType] || 3;
}
// ============================================================================
// EXPORTS
// ============================================================================
export default ResponsiveToolbar;
//# sourceMappingURL=ResponsiveToolbar.js.map