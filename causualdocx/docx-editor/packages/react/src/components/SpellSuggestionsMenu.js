import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * SpellSuggestionsMenu — right-click context menu shown when the user
 * right-clicks on a `.spellcheck-error` overlay. Matches the Google
 * Docs / Word pattern: a few bolded suggestions on top, then "Ignore"
 * and a divider, then a "Add to dictionary" placeholder (deferred to
 * the persisted-dictionary milestone).
 *
 * Closes on outside click + Escape. Keyboard nav (Up/Down/Enter) lets
 * power users tab through suggestions without a mouse.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Z_INDEX } from '../styles/zIndex';
const menuStyle = {
    position: 'fixed',
    minWidth: 220,
    background: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    border: '1px solid var(--doc-border-light, #e0e0e0)',
    borderRadius: 8,
    boxShadow: 'var(--doc-shadow, 0 2px 10px rgba(0, 0, 0, 0.15))',
    zIndex: Z_INDEX.contextMenu,
    padding: '6px 0',
    overflow: 'hidden',
};
const headerStyle = {
    padding: '4px 12px 6px',
    fontSize: 11,
    fontStyle: 'italic',
    color: 'var(--doc-text-subtle, #6b7280)',
    whiteSpace: 'nowrap',
};
const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '6px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--doc-text-on-surface, #1f2937)',
    textAlign: 'left',
};
const itemHoverStyle = Object.assign(Object.assign({}, itemStyle), { background: 'var(--doc-primary-light, #e8f0fe)' });
const dividerStyle = {
    height: 1,
    background: 'var(--doc-border, #e0e0e0)',
    margin: '4px 8px',
};
export function SpellSuggestionsMenu({ isOpen, position, word, suggestions, onPick, onIgnore, onClose, }) {
    const menuRef = useRef(null);
    const [hover, setHover] = useState(0);
    // `items` is the list of focusable rows in render order — suggestions
    // first, then "Ignore". Used by keyboard navigation.
    const items = [
        ...suggestions.map((s) => ({ kind: 'suggest', value: s })),
        {
            kind: 'ignore',
            value: word,
        },
    ];
    useEffect(() => {
        if (!isOpen)
            return;
        setHover(0);
    }, [isOpen]);
    const close = onClose;
    useEffect(() => {
        if (!isOpen)
            return;
        const onDown = (e) => {
            var _a;
            if (!((_a = menuRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)))
                close();
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHover((h) => (h + 1) % items.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHover((h) => (h - 1 + items.length) % items.length);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const it = items[hover];
                if (!it)
                    return;
                if (it.kind === 'suggest')
                    onPick(it.value);
                else
                    onIgnore();
                close();
            }
        };
        // setTimeout(0) — the contextmenu event that opened us would
        // otherwise close us immediately via mousedown.
        const timer = window.setTimeout(() => {
            window.addEventListener('mousedown', onDown);
        }, 0);
        window.addEventListener('keydown', onKey);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, close, hover, items, onPick, onIgnore]);
    const getStyle = useCallback(() => {
        const itemCount = items.length;
        const menuHeight = 28 + itemCount * 32 + 16;
        const menuWidth = 220;
        let x = position.x;
        let y = position.y;
        if (typeof window !== 'undefined') {
            if (x + menuWidth > window.innerWidth)
                x = window.innerWidth - menuWidth - 10;
            if (y + menuHeight > window.innerHeight)
                y = window.innerHeight - menuHeight - 10;
            if (x < 10)
                x = 10;
            if (y < 10)
                y = 10;
        }
        return Object.assign(Object.assign({}, menuStyle), { left: x, top: y });
    }, [position, items.length]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { ref: menuRef, role: "menu", "aria-label": "Spell-check suggestions", "data-testid": "spell-suggestions-menu", style: getStyle(), onContextMenu: (e) => e.preventDefault(), children: [_jsxs("div", { style: headerStyle, children: ["\u201C", word, "\u201D"] }), suggestions.length === 0 && (_jsx("div", { style: Object.assign(Object.assign({}, itemStyle), { color: 'var(--doc-text-subtle, #6b7280)' }), children: "No suggestions" })), suggestions.map((s, idx) => (_jsx("button", { type: "button", role: "menuitem", style: hover === idx ? itemHoverStyle : itemStyle, onMouseEnter: () => setHover(idx), onClick: () => {
                    onPick(s);
                    close();
                }, "data-testid": `spell-suggestion-${idx}`, children: _jsx("strong", { style: { fontWeight: 600 }, children: s }) }, s))), _jsx("div", { style: dividerStyle }), _jsx("button", { type: "button", role: "menuitem", style: hover === suggestions.length ? itemHoverStyle : itemStyle, onMouseEnter: () => setHover(suggestions.length), onClick: () => {
                    onIgnore();
                    close();
                }, "data-testid": "spell-ignore", children: "Ignore" })] }));
}
export default SpellSuggestionsMenu;
//# sourceMappingURL=SpellSuggestionsMenu.js.map