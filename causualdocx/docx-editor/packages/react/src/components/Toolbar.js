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
/**
 * Formatting Toolbar Component
 *
 * A toolbar with formatting controls for the DOCX editor:
 * - Font family picker
 * - Bold (Ctrl+B), Italic (Ctrl+I), Underline (Ctrl+U), Strikethrough
 * - Superscript, Subscript buttons
 * - Shows active state for current selection formatting
 * - Applies formatting to selection
 *
 * Classic single-row layout: menus (File, Format, Insert) + formatting icons.
 * Uses FormattingBar internally for the icon toolbar.
 */
import { useCallback, useRef } from 'react';
import { useTranslation } from '../i18n';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { MenuDropdown } from './ui/MenuDropdown';
import { TableGridInline } from './ui/TableGridInline';
import { cn } from '../lib/utils';
import { formatShortcut } from '../lib/platform';
import { FormattingBar } from './FormattingBar';
// ============================================================================
// SUBCOMPONENTS
// ============================================================================
/**
 * Individual toolbar button with shadcn styling
 */
export function ToolbarButton({ active = false, disabled = false, title, shortcut, onClick, children, className, ariaLabel, }) {
    const testId = (ariaLabel === null || ariaLabel === void 0 ? void 0 : ariaLabel.toLowerCase().replace(/\s+/g, '-')) ||
        (title === null || title === void 0 ? void 0 : title.toLowerCase().replace(/\s+/g, '-').replace(/\([^)]*\)/g, '').trim());
    const handleMouseDown = (e) => {
        e.preventDefault();
    };
    const button = (_jsx(Button, { variant: "ghost", size: "icon-sm", className: cn(
        // Base colors follow the token system. transition-colors gives a
        // smooth 80ms ease on hover so the bg flip reads as polished
        // motion instead of a hard snap.
        'text-[color:var(--doc-text-muted,#5f6368)] hover:text-[color:var(--doc-text,#202124)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', 'rounded-md transition-colors duration-100 ease-out', 
        // Active = blue-tinted background + primary blue icon, matching
        // Google Docs and our own dropdowns. Bumped corner radius via
        // rounded-md so the active pill reads as a refined chip rather
        // than the prior 2px square.
        active &&
            'bg-[color:var(--doc-primary-light,#e8f0fe)] text-[color:var(--doc-primary,#1a73e8)] hover:bg-[color:var(--doc-primary-light,#e8f0fe)] hover:text-[color:var(--doc-primary,#1a73e8)]', disabled && 'opacity-30 cursor-not-allowed', className), onMouseDown: handleMouseDown, onClick: disabled ? undefined : onClick, disabled: disabled, "aria-pressed": active, "aria-label": ariaLabel || title, "data-testid": testId ? `toolbar-${testId}` : undefined, children: children }));
    if (title) {
        const tooltipContent = shortcut ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { children: title }), _jsx("kbd", { className: "inline-flex items-center rounded border border-white/30 px-1 py-[1px] text-[10px] font-mono opacity-80", style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }, children: shortcut })] })) : (title);
        return _jsx(Tooltip, { content: tooltipContent, children: button });
    }
    return button;
}
/**
 * Toolbar button group with modern styling
 */
export function ToolbarGroup({ label, children, className }) {
    return (_jsx("div", { className: cn(
        // Visual rhythm: gap-0.5 between buttons (2 px) gives quiet
        // breathing room without spreading the bar; px-2 around the
        // group + a soft --doc-border-light divider on the right makes
        // each group read as its own unit. The first group has no
        // left padding so it sits flush with the bar's leading edge,
        // and the last group drops its divider so the bar doesn't end
        // with a phantom line.
        'flex items-center gap-0.5 px-2 border-r border-[color:var(--doc-border-light)] last:border-r-0 first:pl-0', className), role: "group", "aria-label": label, children: children }));
}
/**
 * Toolbar separator
 */
export function ToolbarSeparator() {
    return _jsx("div", { className: "w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1.5", role: "separator" });
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * Classic single-row formatting toolbar: menus + formatting icons.
 * Uses FormattingBar internally with inline mode so everything stays in one flex row.
 */
export function Toolbar(_a) {
    var _b, _c;
    var { children, className, style, disabled = false, onFormat, onUndo, onRedo, canUndo, canRedo, onOpenFind, onOpenFindReplace, onToggleSpellCheck, spellCheckEnabled, onPrint, showPrintButton = true, onOpen, onSave, onPageSetup, onFileProperties, onExportPdf, onExportOdt, onExportMd, onExportTxt, onReportBug, onShowAbout, onInsertImage, onInsertTable, showTableInsert = true, onInsertPageBreak, onInsertSectionBreak, onInsertField, onInsertTOC, onOpenBookmarks, onRefocusEditor, currentFormatting } = _a, restProps = __rest(_a, ["children", "className", "style", "disabled", "onFormat", "onUndo", "onRedo", "canUndo", "canRedo", "onOpenFind", "onOpenFindReplace", "onToggleSpellCheck", "spellCheckEnabled", "onPrint", "showPrintButton", "onOpen", "onSave", "onPageSetup", "onFileProperties", "onExportPdf", "onExportOdt", "onExportMd", "onExportTxt", "onReportBug", "onShowAbout", "onInsertImage", "onInsertTable", "showTableInsert", "onInsertPageBreak", "onInsertSectionBreak", "onInsertField", "onInsertTOC", "onOpenBookmarks", "onRefocusEditor", "currentFormatting"]);
    const { t } = useTranslation();
    const toolbarRef = useRef(null);
    const handleFormat = useCallback((action) => {
        if (!disabled && onFormat) {
            onFormat(action);
        }
    }, [disabled, onFormat]);
    const handleTableInsert = useCallback((rows, columns) => {
        if (!disabled && onInsertTable) {
            onInsertTable(rows, columns);
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onInsertTable, onRefocusEditor]);
    const handleToolbarMouseDown = useCallback((e) => {
        const target = e.target;
        const isInteractive = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.tagName === 'OPTION';
        if (!isInteractive) {
            e.preventDefault();
        }
    }, []);
    const handleToolbarMouseUp = useCallback((e) => {
        const target = e.target;
        const activeEl = document.activeElement;
        const isSelectActive = target.tagName === 'SELECT' ||
            target.tagName === 'OPTION' ||
            (activeEl === null || activeEl === void 0 ? void 0 : activeEl.tagName) === 'SELECT';
        if (isSelectActive)
            return;
        requestAnimationFrame(() => {
            onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor();
        });
    }, [onRefocusEditor]);
    return (_jsxs("div", { ref: toolbarRef, className: cn('flex items-center px-1 py-1 bg-[color:var(--doc-surface,white)] border-b border-[color:var(--doc-border-light,#dadce0)] min-h-[36px] overflow-x-auto', className), style: style, role: "toolbar", "aria-label": t('toolbar.ariaLabel'), "data-testid": "toolbar", onMouseDown: handleToolbarMouseDown, onMouseUp: handleToolbarMouseUp, children: [(() => {
                const hasPrintOrPageSetup = (showPrintButton && onPrint) || onPageSetup;
                const hasFileMenu = hasPrintOrPageSetup || onOpen || onSave || onFileProperties || onExportPdf;
                if (!hasFileMenu)
                    return null;
                return (_jsx(MenuDropdown, { label: t('toolbar.file'), disabled: disabled, items: [
                        ...(onOpen
                            ? [
                                {
                                    icon: 'file_upload',
                                    label: t('toolbar.open'),
                                    shortcut: t('toolbar.openShortcut'),
                                    onClick: onOpen,
                                },
                            ]
                            : []),
                        ...(onSave
                            ? [
                                {
                                    icon: 'file_download',
                                    label: t('toolbar.save'),
                                    shortcut: t('toolbar.saveShortcut'),
                                    onClick: onSave,
                                },
                            ]
                            : []),
                        ...((onOpen || onSave) && (hasPrintOrPageSetup || onFileProperties || onExportPdf)
                            ? [{ type: 'separator' }]
                            : []),
                        ...(showPrintButton && onPrint
                            ? [
                                {
                                    icon: 'print',
                                    label: t('toolbar.print'),
                                    shortcut: t('toolbar.printShortcut'),
                                    onClick: onPrint,
                                },
                            ]
                            : []),
                        ...(onExportPdf
                            ? [
                                {
                                    icon: 'file_download',
                                    label: 'Export as PDF',
                                    onClick: onExportPdf,
                                },
                            ]
                            : []),
                        ...(onExportOdt
                            ? [
                                {
                                    icon: 'file_download',
                                    label: 'Export as ODT',
                                    onClick: onExportOdt,
                                },
                            ]
                            : []),
                        ...(onExportMd
                            ? [
                                {
                                    icon: 'file_download',
                                    label: 'Export as Markdown',
                                    onClick: onExportMd,
                                },
                            ]
                            : []),
                        ...(onExportTxt
                            ? [
                                {
                                    icon: 'file_download',
                                    label: 'Export as Plain Text',
                                    onClick: onExportTxt,
                                },
                            ]
                            : []),
                        ...(onPageSetup
                            ? [
                                {
                                    icon: 'settings',
                                    label: t('toolbar.pageSetup'),
                                    onClick: onPageSetup,
                                },
                            ]
                            : []),
                        ...(onFileProperties
                            ? [
                                {
                                    icon: 'tune',
                                    label: 'Properties',
                                    onClick: onFileProperties,
                                },
                            ]
                            : []),
                    ] }));
            })(), _jsx(MenuDropdown, { label: "Edit", disabled: disabled, items: [
                    {
                        icon: 'undo',
                        label: 'Undo',
                        shortcut: formatShortcut('Ctrl+Z'),
                        // Disable when no handler is wired — previous fallback ran
                        // `handleFormat('bold')`, which silently bolded the selection
                        // when a host forgot to pass onUndo. Refuse to act instead.
                        onClick: onUndo !== null && onUndo !== void 0 ? onUndo : (() => undefined),
                        disabled: !canUndo || !onUndo,
                    },
                    {
                        icon: 'redo',
                        label: 'Redo',
                        shortcut: formatShortcut('Ctrl+Y'),
                        onClick: onRedo !== null && onRedo !== void 0 ? onRedo : (() => undefined),
                        disabled: !canRedo || !onRedo,
                    },
                    { type: 'separator' },
                    ...(onOpenFind
                        ? [
                            {
                                icon: 'search',
                                label: 'Find',
                                shortcut: formatShortcut('Ctrl+F'),
                                onClick: onOpenFind,
                            },
                        ]
                        : []),
                    ...(onOpenFindReplace
                        ? [
                            {
                                icon: 'find_replace',
                                label: 'Find and Replace',
                                shortcut: formatShortcut('Ctrl+H'),
                                onClick: onOpenFindReplace,
                            },
                        ]
                        : []),
                    ...(onOpenFind || onOpenFindReplace ? [{ type: 'separator' }] : []),
                    {
                        icon: 'select_all',
                        label: 'Select All',
                        shortcut: formatShortcut('Ctrl+A'),
                        onClick: () => handleFormat('selectAll'),
                    },
                    ...(onToggleSpellCheck
                        ? [
                            { type: 'separator' },
                            {
                                icon: 'spellcheck',
                                label: spellCheckEnabled ? '✓ Spelling' : 'Spelling',
                                onClick: onToggleSpellCheck,
                            },
                        ]
                        : []),
                ] }), _jsx(MenuDropdown, { label: t('toolbar.format'), disabled: disabled, items: [
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.bold) ? '✓ ' : ''}Bold`,
                        shortcut: formatShortcut('Ctrl+B'),
                        onClick: () => handleFormat('bold'),
                    },
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.italic) ? '✓ ' : ''}Italic`,
                        shortcut: formatShortcut('Ctrl+I'),
                        onClick: () => handleFormat('italic'),
                    },
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.underline) ? '✓ ' : ''}Underline`,
                        shortcut: formatShortcut('Ctrl+U'),
                        onClick: () => handleFormat('underline'),
                    },
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.strike) ? '✓ ' : ''}Strikethrough`,
                        onClick: () => handleFormat('strikethrough'),
                    },
                    { type: 'separator' },
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.smallCaps) ? '✓ ' : ''}Small Caps`,
                        onClick: () => handleFormat('toggleSmallCaps'),
                    },
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.allCaps) ? '✓ ' : ''}All Caps`,
                        onClick: () => handleFormat('toggleAllCaps'),
                    },
                    {
                        label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.hidden) ? '✓ ' : ''}Hidden`,
                        onClick: () => handleFormat('toggleHidden'),
                    },
                    {
                        // Text effects submenu — emboss / imprint / outline /
                        // shadow, all CSS-driven and round-trip-clean through the
                        // existing OOXML parser+serializer. The active state
                        // checkmark per row reflects the mark on the selection.
                        label: 'Text effects',
                        submenuContent: (closeMenu) => (_jsx("div", { className: "py-1 min-w-[180px]", children: [
                                {
                                    label: 'Emboss',
                                    action: 'toggleEmboss',
                                    active: !!(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.emboss),
                                },
                                {
                                    label: 'Imprint',
                                    action: 'toggleImprint',
                                    active: !!(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.imprint),
                                },
                                {
                                    label: 'Outline',
                                    action: 'toggleTextOutline',
                                    active: !!(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.outline),
                                },
                                {
                                    label: 'Shadow',
                                    action: 'toggleTextShadow',
                                    active: !!(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.shadow),
                                },
                            ].map((item) => (_jsxs("button", { role: "menuitem", className: "w-full text-left px-4 py-1.5 text-sm hover:bg-[color:var(--doc-bg-hover)]", onMouseDown: (e) => {
                                    e.preventDefault();
                                    handleFormat(item.action);
                                    closeMenu();
                                }, children: [item.active ? '✓ ' : '', item.label] }, item.action))) })),
                    },
                    { type: 'separator' },
                    {
                        label: 'Character spacing',
                        submenuContent: (closeMenu) => (_jsx("div", { className: "py-1 min-w-[180px]", children: [
                                { label: 'Normal', value: 0 },
                                { label: 'Expanded (+1pt)', value: 20 },
                                { label: 'Expanded (+2pt)', value: 40 },
                                { label: 'Condensed (−1pt)', value: -20 },
                                { label: 'Condensed (−2pt)', value: -40 },
                            ].map((item) => (_jsx("button", { role: "menuitem", className: "w-full text-left px-4 py-1.5 text-sm hover:bg-[color:var(--doc-bg-hover)]", onMouseDown: (e) => {
                                    e.preventDefault();
                                    handleFormat({ type: 'charSpacing', value: item.value });
                                    closeMenu();
                                }, children: item.label }, item.value))) })),
                    },
                    { type: 'separator' },
                    {
                        icon: 'format_textdirection_l_to_r',
                        label: t('toolbar.leftToRight'),
                        onClick: () => handleFormat('setLtr'),
                    },
                    {
                        icon: 'format_textdirection_r_to_l',
                        label: t('toolbar.rightToLeft'),
                        onClick: () => handleFormat('setRtl'),
                    },
                    { type: 'separator' },
                    // List numbering control. Disabled when the cursor isn't
                    // in a list paragraph — the command itself early-returns
                    // false in that case, but disabling the menu row gives a
                    // clearer affordance. listState carries the in-list signal
                    // from selectionState.
                    {
                        icon: 'restart_alt',
                        label: t('toolbar.restartListNumbering'),
                        onClick: () => handleFormat('restartListNumbering'),
                        disabled: !((_b = currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.listState) === null || _b === void 0 ? void 0 : _b.isInList),
                    },
                    {
                        icon: 'arrow_downward',
                        label: t('toolbar.continueListNumbering'),
                        onClick: () => handleFormat('continueListNumbering'),
                        disabled: !((_c = currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.listState) === null || _c === void 0 ? void 0 : _c.isInList),
                    },
                ] }), _jsx(MenuDropdown, { label: t('toolbar.insert'), disabled: disabled, items: [
                    ...(onInsertImage
                        ? [{ icon: 'image', label: t('toolbar.image'), onClick: onInsertImage }]
                        : []),
                    ...(showTableInsert && onInsertTable
                        ? [
                            {
                                icon: 'grid_on',
                                label: t('toolbar.table'),
                                submenuContent: (closeMenu) => (_jsx(TableGridInline, { onInsert: (rows, cols) => {
                                        handleTableInsert(rows, cols);
                                        closeMenu();
                                    } })),
                            },
                        ]
                        : []),
                    ...(onInsertImage || (showTableInsert && onInsertTable)
                        ? [{ type: 'separator' }]
                        : []),
                    {
                        icon: 'page_break',
                        label: t('toolbar.pageBreak'),
                        onClick: onInsertPageBreak,
                        disabled: !onInsertPageBreak,
                    },
                    // Section break submenu. The four entries map to OOXML
                    // `w:type`: `nextPage` is the Word default (new page); the
                    // other three are common section-control gestures. Disabled
                    // when no callback is wired so the consumer can hide the
                    // feature entirely by withholding `onInsertSectionBreak`.
                    {
                        icon: 'horizontal_rule',
                        label: t('toolbar.sectionBreak'),
                        disabled: !onInsertSectionBreak,
                        submenuContent: (closeMenu) => (_jsx("div", { className: "py-1 min-w-[200px]", children: [
                                { label: t('toolbar.sectionBreakNextPage'), type: 'nextPage' },
                                { label: t('toolbar.sectionBreakContinuous'), type: 'continuous' },
                                { label: t('toolbar.sectionBreakEvenPage'), type: 'evenPage' },
                                { label: t('toolbar.sectionBreakOddPage'), type: 'oddPage' },
                            ].map((item) => (_jsx("button", { role: "menuitem", className: "w-full text-left px-4 py-1.5 text-sm hover:bg-[color:var(--doc-bg-hover)]", onMouseDown: (e) => {
                                    e.preventDefault();
                                    onInsertSectionBreak === null || onInsertSectionBreak === void 0 ? void 0 : onInsertSectionBreak(item.type);
                                    closeMenu();
                                }, children: item.label }, item.type))) })),
                    },
                    // Field insert submenu — PAGE / NUMPAGES are the headline
                    // entries (header/footer page-numbering); DATE / TIME /
                    // CREATEDATE / SAVEDATE / AUTHOR / FILENAME round out the
                    // common set. Round-trip locked in by
                    // __tests__/footer-field-roundtrip.test.ts.
                    {
                        icon: 'tag',
                        label: t('toolbar.insertField'),
                        disabled: !onInsertField,
                        submenuContent: (closeMenu) => (_jsx("div", { className: "py-1 min-w-[200px]", children: [
                                { label: t('toolbar.fieldPage'), type: 'PAGE' },
                                { label: t('toolbar.fieldNumPages'), type: 'NUMPAGES' },
                                { label: t('toolbar.fieldDate'), type: 'DATE' },
                                { label: t('toolbar.fieldTime'), type: 'TIME' },
                                { label: t('toolbar.fieldCreateDate'), type: 'CREATEDATE' },
                                { label: t('toolbar.fieldSaveDate'), type: 'SAVEDATE' },
                                { label: t('toolbar.fieldAuthor'), type: 'AUTHOR' },
                                { label: t('toolbar.fieldFileName'), type: 'FILENAME' },
                            ].map((item) => (_jsx("button", { role: "menuitem", className: "w-full text-left px-4 py-1.5 text-sm hover:bg-[color:var(--doc-bg-hover)]", onMouseDown: (e) => {
                                    e.preventDefault();
                                    onInsertField === null || onInsertField === void 0 ? void 0 : onInsertField(item.type);
                                    closeMenu();
                                }, children: item.label }, item.type))) })),
                    },
                    {
                        icon: 'format_list_numbered',
                        label: t('toolbar.tableOfContents'),
                        onClick: onInsertTOC,
                        disabled: !onInsertTOC,
                    },
                    {
                        icon: 'bookmark',
                        label: t('toolbar.bookmarks'),
                        onClick: onOpenBookmarks,
                        disabled: !onOpenBookmarks,
                    },
                ] }), (onReportBug || onShowAbout) && (_jsx(MenuDropdown, { label: t('toolbar.help'), disabled: disabled, items: [
                    ...(onReportBug
                        ? [
                            {
                                icon: 'bug_report',
                                label: t('toolbar.reportIssue'),
                                onClick: onReportBug,
                            },
                        ]
                        : []),
                    ...(onReportBug && onShowAbout ? [{ type: 'separator' }] : []),
                    ...(onShowAbout
                        ? [
                            {
                                icon: 'info',
                                label: 'About Casual Editor',
                                onClick: onShowAbout,
                            },
                        ]
                        : []),
                ] })), _jsx(FormattingBar, Object.assign({}, restProps, { disabled: disabled, onFormat: onFormat, onRefocusEditor: onRefocusEditor, onInsertTable: onInsertTable, showTableInsert: showTableInsert, onInsertImage: onInsertImage, onInsertPageBreak: onInsertPageBreak, onInsertTOC: onInsertTOC, onPrint: onPrint, showPrintButton: showPrintButton, onPageSetup: onPageSetup, inline: true, children: children }))] }));
}
// ============================================================================
// RE-EXPORTED UTILITIES (from toolbarUtils.ts)
// ============================================================================
export { getSelectionFormatting, applyFormattingAction, hasActiveFormatting, mapHexToHighlightName, } from './toolbarUtils';
export default Toolbar;
//# sourceMappingURL=Toolbar.js.map