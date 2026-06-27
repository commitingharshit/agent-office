import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
export function Tooltip({ content, children, side = 'bottom', delayMs = 400 }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const triggerRef = React.useRef(null);
    const timeoutRef = React.useRef(null);
    // Stable per-instance id linking the trigger's aria-describedby to
    // the tooltip's id, so assistive tech can resolve the tooltip text
    // from the trigger node. React 18+ ships useId; we fall back to a
    // ref-cached random string for older test setups that mock React.
    const reactUseId = React.useId;
    const generatedId = reactUseId ? reactUseId() : null;
    const idRef = React.useRef(generatedId !== null && generatedId !== void 0 ? generatedId : `tooltip-${Math.random().toString(36).slice(2)}`);
    const tooltipId = generatedId !== null && generatedId !== void 0 ? generatedId : idRef.current;
    const computeAnchor = React.useCallback(() => {
        if (!triggerRef.current)
            return null;
        const rect = triggerRef.current.getBoundingClientRect();
        switch (side) {
            case 'top':
                return { x: rect.left + rect.width / 2, y: rect.top - 8 };
            case 'left':
                return { x: rect.left - 8, y: rect.top + rect.height / 2 };
            case 'right':
                return { x: rect.right + 8, y: rect.top + rect.height / 2 };
            case 'bottom':
            default:
                return { x: rect.left + rect.width / 2, y: rect.bottom + 8 };
        }
    }, [side]);
    const show = React.useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            const a = computeAnchor();
            if (a)
                setPosition(a);
            setIsOpen(true);
        }, delayMs);
    }, [delayMs, computeAnchor]);
    const hide = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsOpen(false);
    }, []);
    // Focus shows the tooltip with no delay — the keyboard user has
    // already committed by tabbing here, so making them wait 400 ms
    // for a description is hostile. WAI-ARIA Authoring Practices
    // recommends instant-on for focus + delay only for hover.
    const showOnFocus = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        const a = computeAnchor();
        if (a)
            setPosition(a);
        setIsOpen(true);
    }, [computeAnchor]);
    // Dismiss on Escape — WAI-ARIA tooltip pattern. Keeps the
    // keyboard user in control when a tooltip obscures something
    // they were trying to read.
    React.useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                hide();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, hide]);
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    const childProps = children.props;
    const mergedDescribedBy = [childProps['aria-describedby'], tooltipId].filter(Boolean).join(' ');
    const child = React.cloneElement(children, {
        ref: triggerRef,
        'aria-describedby': mergedDescribedBy,
        onMouseEnter: (e) => {
            var _a;
            show();
            (_a = childProps.onMouseEnter) === null || _a === void 0 ? void 0 : _a.call(childProps, e);
        },
        onMouseLeave: (e) => {
            var _a;
            hide();
            (_a = childProps.onMouseLeave) === null || _a === void 0 ? void 0 : _a.call(childProps, e);
        },
        onFocus: (e) => {
            var _a;
            showOnFocus();
            (_a = childProps.onFocus) === null || _a === void 0 ? void 0 : _a.call(childProps, e);
        },
        onBlur: (e) => {
            var _a;
            hide();
            (_a = childProps.onBlur) === null || _a === void 0 ? void 0 : _a.call(childProps, e);
        },
    });
    return (_jsxs(_Fragment, { children: [child, isOpen && (_jsx("div", { id: tooltipId, role: "tooltip", 
                // Surface-following tooltip — white card in light mode, dark
                // card in dark mode. Dark-grey-always (the previous version)
                // and theme-inverted (the version before that) both read as
                // out-of-place chrome against a light theme. A subtle border
                // + shadow keeps it readable above the editor surface in
                // both modes.
                className: "fixed z-50 px-2 py-1 text-xs font-medium text-[color:var(--doc-text-on-surface,#1f2937)] bg-[color:var(--doc-surface,#ffffff)] border border-[color:var(--doc-border,#dadce0)] rounded-md shadow-lg", style: {
                    left: position.x,
                    top: position.y,
                    transform: side === 'top'
                        ? 'translate(-50%, -100%)'
                        : side === 'left'
                            ? 'translate(-100%, -50%)'
                            : side === 'right'
                                ? 'translate(0, -50%)'
                                : 'translate(-50%, 0)',
                    // Prevent the tooltip from intercepting the very mouse
                    // event the trigger needs to keep its hover state.
                    pointerEvents: 'none',
                }, children: content }))] }));
}
//# sourceMappingURL=Tooltip.js.map