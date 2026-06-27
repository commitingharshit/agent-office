/**
 * Hook for toolbar dropdowns that need position:fixed to escape overflow:auto/hidden ancestors.
 *
 * Returns refs and styles for a dropdown that positions itself below its trigger
 * using fixed coordinates (like MenuDropdown), so it isn't clipped by the toolbar's
 * overflow-x-auto container.
 */
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
export function useFixedDropdown({ isOpen, onClose, align = 'left', }) {
    var _a, _b;
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [pos, setPos] = useState(null);
    // Position the moment the dropdown mounts, BEFORE the browser paints
    // (useLayoutEffect), so it never flashes at the top-left origin. Right
    // alignment anchors the dropdown's right edge to the trigger's right
    // edge via the CSS `right` offset — no width measurement, so no second
    // frame / rAF is needed (the old rAF caused a one-frame (0,0) flash).
    useLayoutEffect(() => {
        if (!isOpen || !containerRef.current) {
            setPos(null);
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const top = rect.bottom + 4;
        if (align === 'right') {
            setPos({ top, right: Math.max(0, window.innerWidth - rect.right) });
        }
        else {
            setPos({ top, left: rect.left });
        }
    }, [isOpen, align]);
    // Close on outside click, escape, scroll
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (e) => {
            const target = e.target;
            if (containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        // Close when something *outside* the dropdown scrolls — the trigger
        // moves so the fixed-position dropdown desyncs. Scrolling *inside* the
        // dropdown (its own overflow:auto listbox, e.g. font-size 8…72) must
        // not close it; otherwise Playwright's "scroll the option into view
        // before click" detaches the option mid-click. Listen in capture so we
        // still see scrolls on overflow ancestors, but ignore events whose
        // target is the dropdown itself.
        //
        // We also ignore scrolls within a brief grace window after open
        // (the trigger's scrollIntoView, focus-driven scroll into the
        // table cell, and any PM-driven layout scroll happen synchronously
        // around the open click). Those scrolls would otherwise close the
        // dropdown the moment it appears — caught by tables.spec failing
        // with "element was detached from the DOM" mid-click on the menu
        // item in CI.
        const openedAt = Date.now();
        const SCROLL_GRACE_MS = 200;
        const handleScroll = (e) => {
            var _a;
            if (Date.now() - openedAt < SCROLL_GRACE_MS)
                return;
            const target = e.target;
            if (target && ((_a = dropdownRef.current) === null || _a === void 0 ? void 0 : _a.contains(target)))
                return;
            onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, onClose]);
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    const dropdownStyle = Object.assign(Object.assign({ position: 'fixed', top: (_a = pos === null || pos === void 0 ? void 0 : pos.top) !== null && _a !== void 0 ? _a : 0 }, ((pos === null || pos === void 0 ? void 0 : pos.right) != null ? { right: pos.right } : { left: (_b = pos === null || pos === void 0 ? void 0 : pos.left) !== null && _b !== void 0 ? _b : 0 })), { zIndex: 10000, 
        // Until positioned (first layout tick), keep it out of sight so it
        // never paints at the origin.
        visibility: pos ? 'visible' : 'hidden' });
    return { containerRef, dropdownRef, dropdownStyle, handleMouseDown };
}
//# sourceMappingURL=useFixedDropdown.js.map