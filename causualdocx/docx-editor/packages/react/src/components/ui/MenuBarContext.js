import { jsx as _jsx } from "react/jsx-runtime";
/**
 * MenuBarContext — shared open-state for a horizontal menu bar so
 * adjacent <MenuDropdown/> components can switch in a single click
 * (Word / Google Docs convention).
 *
 * Without this context, each MenuDropdown owns its own isOpen state
 * and they don't know about each other — switching menus took two
 * clicks (one to close the current, one to open the next), and
 * hovering an adjacent trigger while one was open didn't switch.
 *
 * Wrap a row of MenuDropdowns in <MenuBarProvider> to opt in. Outside
 * a provider, MenuDropdown falls back to its own local state and keeps
 * its existing isolated behavior.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
const MenuBarContext = createContext(null);
export function useMenuBar() {
    return useContext(MenuBarContext);
}
export function MenuBarProvider({ children }) {
    const [openId, setOpenIdState] = useState(null);
    const triggersRef = useRef(new Map());
    const setOpenId = useCallback((id) => {
        setOpenIdState(id);
    }, []);
    const hoverTrigger = useCallback((id) => {
        // Only switch on hover when a different menu is already open.
        setOpenIdState((curr) => (curr !== null && curr !== id ? id : curr));
    }, []);
    const registerTrigger = useCallback((id, el) => {
        if (el)
            triggersRef.current.set(id, el);
        else
            triggersRef.current.delete(id);
    }, []);
    const moveFocus = useCallback((fromId, direction) => {
        const ids = Array.from(triggersRef.current.keys());
        const fromIdx = ids.indexOf(fromId);
        if (fromIdx < 0 || ids.length === 0)
            return;
        let nextIdx = fromIdx + direction;
        if (nextIdx < 0)
            nextIdx = ids.length - 1;
        if (nextIdx >= ids.length)
            nextIdx = 0;
        const targetId = ids[nextIdx];
        const el = triggersRef.current.get(targetId);
        el === null || el === void 0 ? void 0 : el.focus();
        // If a menu was open, switch the open menu along with focus.
        setOpenIdState((curr) => (curr !== null ? targetId : curr));
    }, []);
    const value = useMemo(() => ({ openId, setOpenId, hoverTrigger, moveFocus, registerTrigger }), [openId, setOpenId, hoverTrigger, moveFocus, registerTrigger]);
    return _jsx(MenuBarContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=MenuBarContext.js.map