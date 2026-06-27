import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * MenuDropdown — a reusable dropdown menu with text label trigger
 *
 * Uses position:fixed so dropdowns escape overflow:auto/hidden ancestors.
 * Supports submenu panels that appear to the right on hover (Google Docs style).
 */
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { useMenuBar } from './MenuBarContext';
import { Z_INDEX } from '../../styles/zIndex';
import { formatShortcut } from '../../lib/platform';
function isSeparator(entry) {
    return 'type' in entry && entry.type === 'separator';
}
const triggerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 8px',
    border: 'none',
    background: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 400,
    color: 'var(--doc-text, #374151)',
    whiteSpace: 'nowrap',
    height: 28,
    lineHeight: '28px',
};
const triggerOpenStyle = Object.assign(Object.assign({}, triggerStyle), { background: 'var(--doc-hover, #f3f4f6)' });
const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--doc-text, #374151)',
    width: '100%',
    textAlign: 'left',
    whiteSpace: 'nowrap',
};
const menuItemDisabledStyle = Object.assign(Object.assign({}, menuItemStyle), { opacity: 0.4, cursor: 'default' });
const separatorStyle = {
    height: 1,
    backgroundColor: 'var(--doc-border, #e5e7eb)',
    margin: '4px 0',
};
const shortcutStyle = {
    marginLeft: 'auto',
    fontSize: 12,
    color: 'var(--doc-text-muted, #9ca3af)',
};
const submenuPanelStyle = {
    position: 'absolute',
    left: '100%',
    top: -4,
    marginLeft: 2,
    backgroundColor: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 6,
    boxShadow: 'var(--doc-shadow, 0 4px 12px rgba(0, 0, 0, 0.12))',
    padding: 8,
    zIndex: 1001,
};
/**
 * Submenu item — matches the parent menu's normal item styling so
 * submenu rows don't look bigger/different. Use from inside a
 * `submenuContent` callback.
 */
export function SubMenuItem({ label, onClick, closeMenu, }) {
    return (_jsx("button", { type: "button", role: "menuitem", style: menuItemStyle, onMouseDown: (e) => {
            e.preventDefault();
            onClick();
            closeMenu();
        }, onMouseOver: (e) => {
            e.currentTarget.style.backgroundColor = 'var(--doc-hover, #f3f4f6)';
        }, onMouseOut: (e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
        }, children: _jsx("span", { children: label }) }));
}
export function MenuDropdown({ label, items, disabled, id }) {
    // When inside a <MenuBarProvider>, isOpen is driven by the shared
    // openId so adjacent menus can hover-to-switch and one click swaps
    // between them. Outside a provider, this falls back to a local
    // boolean and the component keeps its old isolated behavior.
    const bar = useMenuBar();
    const menuId = id !== null && id !== void 0 ? id : label;
    const [localOpen, setLocalOpen] = useState(false);
    const isOpen = bar ? bar.openId === menuId : localOpen;
    const setIsOpen = useCallback((next) => {
        if (bar)
            bar.setOpenId(next ? menuId : null);
        else
            setLocalOpen(next);
    }, [bar, menuId]);
    const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({
        top: 0,
        left: 0,
    });
    // Register this trigger with the menu bar so it can move keyboard
    // focus between menus (ArrowLeft / ArrowRight on a trigger).
    useEffect(() => {
        if (!bar)
            return;
        bar.registerTrigger(menuId, triggerRef.current);
        return () => bar.registerTrigger(menuId, null);
    }, [bar, menuId]);
    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setHoveredSubmenu(null);
    }, [setIsOpen]);
    // Calculate position when opening. useLayoutEffect (not useEffect) so the
    // position is corrected synchronously before the browser paints the open
    // dropdown — otherwise there's a one-frame flash at the initial {0,0}
    // (top-left of the page) before the effect runs. Visible to Playwright
    // screenshots and occasionally to real users on slow machines.
    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current)
            return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 2, left: rect.left });
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        function handleClickOutside(e) {
            const target = e.target;
            if (triggerRef.current &&
                !triggerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)) {
                closeMenu();
            }
        }
        function handleEscape(e) {
            var _a;
            if (e.key === 'Escape') {
                closeMenu();
                // Return focus to the trigger so keyboard users don't lose their place.
                (_a = triggerRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }
        // Arrow keys cycle through interactive menu items. Home/End jump to ends.
        function handleArrows(e) {
            var _a;
            if (!dropdownRef.current)
                return;
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End')
                return;
            const buttons = Array.from(dropdownRef.current.querySelectorAll('button:not([disabled])'));
            if (buttons.length === 0)
                return;
            const active = document.activeElement;
            const idx = active ? buttons.indexOf(active) : -1;
            e.preventDefault();
            let next;
            if (e.key === 'Home')
                next = 0;
            else if (e.key === 'End')
                next = buttons.length - 1;
            else if (e.key === 'ArrowDown')
                next = idx < 0 ? 0 : (idx + 1) % buttons.length;
            else
                next = idx <= 0 ? buttons.length - 1 : idx - 1;
            (_a = buttons[next]) === null || _a === void 0 ? void 0 : _a.focus();
        }
        // Close on scroll of any ancestor (dropdown position would be stale)
        function handleScroll() {
            closeMenu();
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        document.addEventListener('keydown', handleArrows);
        window.addEventListener('scroll', handleScroll, true);
        // Intentionally NOT auto-focusing the first menu item on open.
        // Word and Google Docs don't paint a focus ring on the first item
        // when a menu is opened via mouse click — it only appears once the
        // user starts navigating with the keyboard. The first ArrowDown
        // press inside handleArrows() above focuses item 0 from its `idx <
        // 0` branch, so keyboard accessibility is preserved.
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleArrows);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, closeMenu]);
    const handleItemClick = (item) => {
        if (item.disabled || item.submenuContent)
            return;
        if (!item.onClick)
            return;
        item.onClick();
        closeMenu();
    };
    return (
    // The wrapper needs position:relative so the submenu panel can
    // position itself with `left: 100%`. We DO NOT set zIndex on the
    // wrapper because that would create a stacking context and trap
    // the trigger button's high zIndex inside it (the trigger needs
    // to escape to the root stacking context so it sits above the
    // open menu's full-viewport backdrop — without that, clicking an
    // adjacent menu trigger requires two clicks: first to dismiss the
    // backdrop, then to open the new menu).
    _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("button", { ref: triggerRef, type: "button", "aria-haspopup": "menu", "aria-expanded": isOpen, onClick: () => !disabled && setIsOpen(!isOpen), onMouseEnter: () => {
                    if (disabled || !bar)
                        return;
                    bar.hoverTrigger(menuId);
                }, onKeyDown: (e) => {
                    if (!bar)
                        return;
                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        bar.moveFocus(menuId, 1);
                    }
                    else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        bar.moveFocus(menuId, -1);
                    }
                }, onMouseDown: (e) => e.preventDefault(), disabled: disabled, style: Object.assign(Object.assign({}, (isOpen ? triggerOpenStyle : triggerStyle)), { position: 'relative', 
                    // Above the backdrop so clicks on adjacent triggers reach
                    // them in one go instead of being eaten by the open menu's
                    // backdrop. See `styles/zIndex.ts` for the stacking order.
                    zIndex: Z_INDEX.menubarTrigger }), children: [label, _jsx("span", { style: {
                            display: 'inline-flex',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform var(--doc-anim-base)',
                        }, children: _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 16 }) })] }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": "true", onMouseDown: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, onMouseUp: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            closeMenu();
                        }, style: {
                            position: 'fixed',
                            inset: 0,
                            zIndex: Z_INDEX.menubarBackdrop,
                            background: 'transparent',
                            pointerEvents: 'auto',
                        } }), _jsx("div", { ref: dropdownRef, 
                        // WAI-ARIA menubar pattern: the panel itself is the
                        // "menu," aria-label gives it a name screen readers can
                        // announce when focus enters.
                        role: "menu", "aria-label": label, style: {
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            backgroundColor: 'var(--doc-surface, white)',
                            color: 'var(--doc-text-on-surface, #1f2937)',
                            border: '1px solid var(--doc-border, #d1d5db)',
                            borderRadius: 6,
                            boxShadow: 'var(--doc-shadow, 0 4px 12px rgba(0, 0, 0, 0.12))',
                            padding: '4px 0',
                            zIndex: Z_INDEX.menubarPanel,
                            minWidth: 200,
                        }, onMouseDown: (e) => e.preventDefault(), children: items.map((entry, i) => {
                            if (isSeparator(entry)) {
                                return _jsx("div", { role: "separator", style: separatorStyle }, `sep-${i}`);
                            }
                            const item = entry;
                            if (item.customContent) {
                                return (_jsx("div", { onMouseDown: (e) => e.preventDefault(), children: item.customContent }, item.label));
                            }
                            const hasSubmenu = !!item.submenuContent;
                            const isSubmenuOpen = hoveredSubmenu === item.label;
                            return (_jsxs("div", { style: { position: 'relative' }, onMouseEnter: () => hasSubmenu && setHoveredSubmenu(item.label), onMouseLeave: () => hasSubmenu && setHoveredSubmenu(null), children: [_jsxs("button", { type: "button", role: "menuitem", "aria-haspopup": hasSubmenu ? 'menu' : undefined, "aria-expanded": hasSubmenu ? isSubmenuOpen : undefined, "aria-disabled": item.disabled || undefined, style: item.disabled ? menuItemDisabledStyle : menuItemStyle, onClick: () => handleItemClick(item), onMouseDown: (e) => e.preventDefault(), onMouseOver: (e) => {
                                            if (!item.disabled) {
                                                e.currentTarget.style.backgroundColor =
                                                    'var(--doc-hover, #f3f4f6)';
                                            }
                                        }, onMouseOut: (e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }, disabled: item.disabled, children: [item.icon && _jsx(MaterialSymbol, { name: item.icon, size: 18 }), _jsx("span", { children: item.label }), item.shortcut && (_jsx("span", { style: shortcutStyle, children: formatShortcut(item.shortcut) })), hasSubmenu && (_jsx("span", { style: { marginLeft: 'auto' }, children: _jsx(MaterialSymbol, { name: "keyboard_arrow_right", size: 16 }) }))] }), hasSubmenu && isSubmenuOpen && (_jsx("div", { role: "menu", "aria-label": item.label, style: submenuPanelStyle, onMouseDown: (e) => e.preventDefault(), children: item.submenuContent(closeMenu) }))] }, item.label));
                        }) })] }))] }));
}
//# sourceMappingURL=MenuDropdown.js.map