var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/utils';
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
function SelectTrigger(_a) {
    var { className, children, onMouseDown } = _a, props = __rest(_a, ["className", "children", "onMouseDown"]);
    return (_jsxs(SelectPrimitive.Trigger, Object.assign({ className: cn('flex h-8 items-center justify-between gap-1 rounded px-2 py-1', 'text-sm text-[color:var(--doc-text-on-surface,#1f2937)] bg-transparent', 'hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] focus:outline-none focus:bg-[color:var(--doc-bg-hover,#f1f3f4)]', 'disabled:cursor-not-allowed disabled:opacity-50', 'transition-colors duration-150', '[&>span]:truncate', className), onMouseDown: (e) => {
            e.preventDefault();
            onMouseDown === null || onMouseDown === void 0 ? void 0 : onMouseDown(e);
        } }, props, { children: [children, _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDownIcon, { className: "h-4 w-4 text-[color:var(--doc-text-on-surface-muted,#5f6368)] shrink-0" }) })] })));
}
function SelectContent(_a) {
    var { className, children, position = 'popper', onCloseAutoFocus } = _a, props = __rest(_a, ["className", "children", "position", "onCloseAutoFocus"]);
    return (_jsx(SelectPrimitive.Portal, { children: _jsx("div", { className: "ep-root", children: _jsx(SelectPrimitive.Content, Object.assign({ className: cn('relative z-50 max-h-72 min-w-[8rem] overflow-hidden', 'rounded-lg border border-[color:var(--doc-border,#e0e0e0)] bg-[color:var(--doc-surface,white)] shadow-lg', 'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', 'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2', position === 'popper' &&
                    'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1', className), position: position, onCloseAutoFocus: (e) => {
                    e.preventDefault();
                    onCloseAutoFocus === null || onCloseAutoFocus === void 0 ? void 0 : onCloseAutoFocus(e);
                } }, props, { children: _jsx(SelectPrimitive.Viewport, { className: cn('p-1', position === 'popper' &&
                        'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'), onMouseDown: (e) => e.preventDefault(), children: children }) })) }) }));
}
function SelectLabel(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx(SelectPrimitive.Label, Object.assign({ className: cn('px-2 py-1.5 text-xs font-medium text-[color:var(--doc-text-on-surface-muted,#5f6368)]', className) }, props)));
}
function SelectItem(_a) {
    var { className, children, onMouseDown } = _a, props = __rest(_a, ["className", "children", "onMouseDown"]);
    return (_jsxs(SelectPrimitive.Item, Object.assign({ className: cn('relative flex w-full cursor-pointer select-none items-center', 'rounded px-2 py-1.5 text-sm text-[color:var(--doc-text-on-surface,#1f2937)] outline-none', 'hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] focus:bg-[color:var(--doc-bg-hover,#f1f3f4)]', 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className), onMouseDown: (e) => {
            e.preventDefault();
            onMouseDown === null || onMouseDown === void 0 ? void 0 : onMouseDown(e);
        } }, props, { children: [_jsx(SelectPrimitive.ItemText, { children: children }), _jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(CheckIcon, { className: "h-4 w-4" }) }) })] })));
}
function SelectSeparator(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx(SelectPrimitive.Separator, Object.assign({ className: cn('-mx-1 my-1 h-px bg-[color:var(--doc-border-light,#e5e7eb)]', className) }, props)));
}
// Icons
function ChevronDownIcon({ className }) {
    return (_jsx("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z", clipRule: "evenodd" }) }));
}
function CheckIcon({ className }) {
    return (_jsx("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z", clipRule: "evenodd" }) }));
}
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, };
//# sourceMappingURL=Select.js.map