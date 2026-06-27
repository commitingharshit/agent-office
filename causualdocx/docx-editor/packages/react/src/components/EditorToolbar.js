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
import { jsx as _jsx } from "react/jsx-runtime";
import { EditorToolbarContext } from './EditorToolbarContext';
import { TitleBar, Logo, DocumentName, MenuBar, TitleBarRight } from './TitleBar';
import { FormattingBar } from './FormattingBar';
import { cn } from '../lib/utils';
function EditorToolbarBase(_a) {
    var { children, className, style } = _a, toolbarProps = __rest(_a, ["children", "className", "style"]);
    return (_jsx(EditorToolbarContext.Provider, { value: toolbarProps, children: _jsx("div", { className: cn('flex flex-col flex-shrink-0 bg-[color:var(--doc-chrome,#eef1f5)] text-[color:var(--doc-text-on-surface,#1f2937)]', className), style: style, "data-testid": "editor-toolbar", children: children }) }));
}
// Attach sub-components as static properties
const EditorToolbar = EditorToolbarBase;
EditorToolbar.TitleBar = TitleBar;
EditorToolbar.Logo = Logo;
EditorToolbar.DocumentName = DocumentName;
EditorToolbar.MenuBar = MenuBar;
EditorToolbar.TitleBarRight = TitleBarRight;
EditorToolbar.FormattingBar = FormattingBar;
export { EditorToolbar };
//# sourceMappingURL=EditorToolbar.js.map