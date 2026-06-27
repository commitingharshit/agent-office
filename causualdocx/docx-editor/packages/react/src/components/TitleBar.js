var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TitleBar and sub-components for the Google Docs-style 2-level toolbar.
 *
 * - TitleBar: two-row layout (row 1: logo + doc name + right actions, row 2: menu bar)
 * - Logo: renders custom logo content left-aligned
 * - DocumentName: editable document name input
 * - MenuBar: File/Format/Insert menus (auto-wired from EditorToolbarContext)
 * - TitleBarRight: right-aligned actions slot
 */
import { useCallback, useState, Children, isValidElement } from 'react';
import { MenuDropdown, SubMenuItem } from './ui/MenuDropdown';
import { MenuBarProvider } from './ui/MenuBarContext';
import { MaterialSymbol } from './ui/Icons';
import { Tooltip } from './ui/Tooltip';
import { TableGridInline } from './ui/TableGridInline';
import { WriterStatusPill } from './WriterStatusPill';
import { useEditorToolbar } from './EditorToolbarContext';
import { useTranslation } from '../i18n';
import { openReportIssue } from './reportIssue';
// ============================================================================
// Default Doc Icon (shown when no Logo is provided)
// ============================================================================
// Casual Editor brand mark — same shape and palette as the About dialog
// logo so the title-bar icon and the About icon are visually identical.
function DefaultDocIcon() {
    return (_jsxs("svg", { width: "32", height: "40", viewBox: "0 0 32 40", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M2 0C0.9 0 0 0.9 0 2V38C0 39.1 0.9 40 2 40H30C31.1 40 32 39.1 32 38V10L22 0H2Z", fill: "#1a73e8" }), _jsx("path", { d: "M22 0L32 10H24C22.9 10 22 9.1 22 8V0Z", fill: "#1557b0" }), _jsx("rect", { x: "7", y: "18", width: "18", height: "2", rx: "1", fill: "#fff" }), _jsx("rect", { x: "7", y: "23", width: "18", height: "2", rx: "1", fill: "#fff" }), _jsx("rect", { x: "7", y: "28", width: "12", height: "2", rx: "1", fill: "#fff" })] }));
}
export function Logo({ children }) {
    return _jsx("div", { className: "flex items-center flex-shrink-0", children: children });
}
function stripExtension(name) {
    return name.replace(/\.docx$/i, '');
}
export function DocumentName({ value, onChange, placeholder, editable = true }) {
    var _a;
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder !== null && placeholder !== void 0 ? placeholder : t('titleBar.untitled');
    const displayName = (_a = stripExtension(value)) !== null && _a !== void 0 ? _a : '';
    const [focused, setFocused] = useState(false);
    if (!editable) {
        return (_jsx("span", { className: "text-base font-normal text-[color:var(--doc-text-on-surface,#1f2937)] px-2 py-0 min-w-[100px] max-w-[360px] truncate leading-tight", children: displayName || resolvedPlaceholder }));
    }
    // Google Docs-style auto-sizing title field. An invisible sizer mirrors the
    // text so the field hugs short names and grows up to the max width for long
    // ones; past the cap the input scrolls horizontally. The ellipsis ("…") is a
    // CSS affordance only when the field is *not* focused — while editing or
    // renaming, the full name is always shown (and remains the real value), so a
    // truncated display never gets mistaken for a truncated name.
    const sizerText = displayName || resolvedPlaceholder;
    return (_jsxs("span", { className: "relative inline-flex items-center min-w-[100px] max-w-[360px] leading-tight", children: [_jsx("span", { "aria-hidden": true, className: "invisible whitespace-pre px-2 text-base font-normal", children: sizerText || ' ' }), _jsx("input", { type: "text", value: displayName, onChange: (e) => {
                    const raw = e.target.value;
                    onChange === null || onChange === void 0 ? void 0 : onChange(raw.endsWith('.docx') ? raw : raw + '.docx');
                }, onFocus: () => setFocused(true), onBlur: () => setFocused(false), placeholder: resolvedPlaceholder, className: `absolute inset-0 w-full text-base font-normal text-[color:var(--doc-text-on-surface,#1f2937)] bg-transparent border-0 outline-none px-2 py-0 rounded hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] focus:bg-[color:var(--doc-surface,white)] focus:ring-1 focus:ring-slate-300 leading-tight ${focused ? '' : 'truncate'}`, "aria-label": t('titleBar.documentNameAriaLabel') })] }));
}
export function TitleBarRight({ children }) {
    return (_jsxs("div", { className: "flex items-center gap-2 ml-auto flex-shrink-0", children: [_jsx(WriterStatusPillSlot, {}), _jsx(SaveStatusIndicator, {}), _jsx(ThemeToggleButton, {}), children] }));
}
// ============================================================================
// WriterStatusPillSlot — bridges the Writing Assistant controller into
// the title bar. Renders nothing when the assistant has no enabled
// features (avoids visual clutter for users who haven't opted in);
// otherwise shows a click-to-open pill that surfaces the current
// load / busy / ready state across every screen, not just inside the
// Writing Assistant sheet.
// ============================================================================
function WriterStatusPillSlot() {
    const ctx = useEditorToolbar();
    const { onOpenWritingAssistant } = ctx;
    if (!onOpenWritingAssistant)
        return null;
    return _jsx(WriterStatusPill, { onClick: onOpenWritingAssistant });
}
// ============================================================================
// SaveStatusIndicator — shows "Saving…" while a save is in flight, then
// a "•" dot when there are unsaved edits, then nothing when clean.
// Wired from the host through ToolbarProps.isDirty / isSaving via the
// EditorToolbar context.
// ============================================================================
function SaveStatusIndicator() {
    const ctx = useEditorToolbar();
    const { isDirty, isSaving } = ctx;
    if (isSaving) {
        return (_jsxs("span", { className: "text-xs text-[color:var(--doc-text-on-surface-muted,#5f6368)] flex items-center gap-1", "aria-live": "polite", children: [_jsx("span", { "aria-hidden": "true", style: {
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: '1.5px solid currentColor',
                        borderTopColor: 'transparent',
                        animation: 'docx-spin 0.7s linear infinite',
                        display: 'inline-block',
                    } }), "Saving\u2026"] }));
    }
    if (isDirty) {
        return (_jsx("span", { className: "text-xs text-[color:var(--doc-text-on-surface-muted,#5f6368)]", title: "Unsaved changes", "aria-label": "Unsaved changes", children: "Unsaved changes" }));
    }
    return (_jsx("span", { className: "text-xs text-[color:var(--doc-text-on-surface-muted,#5f6368)]", "aria-live": "polite", children: "All changes saved" }));
}
// ============================================================================
// ThemeToggleButton — sun/moon/auto icon in the top-right that cycles
// through auto → light → dark. Hidden when the host doesn't wire
// onSetColorTheme. Renders inside TitleBarRight so it's always visible
// in the same spot as Share / status indicators.
// ============================================================================
function ThemeToggleButton() {
    const ctx = useEditorToolbar();
    const { onSetColorTheme, colorTheme } = ctx;
    if (!onSetColorTheme)
        return null;
    const current = colorTheme !== null && colorTheme !== void 0 ? colorTheme : 'auto';
    const next = current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
    const icon = current === 'dark' ? 'dark_mode' : current === 'light' ? 'light_mode' : 'contrast';
    const title = current === 'auto'
        ? 'Theme: match system (click for light)'
        : current === 'light'
            ? 'Theme: light (click for dark)'
            : 'Theme: dark (click for auto)';
    return (_jsx(Tooltip, { content: title, children: _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => onSetColorTheme(next), "aria-label": title, className: "flex items-center justify-center w-8 h-8 rounded hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] text-[color:var(--doc-text-on-surface,#1f2937)]", children: _jsx(MaterialSymbol, { name: icon, size: 18 }) }) }));
}
// ============================================================================
// MenuBar
// ============================================================================
export function MenuBar() {
    const { t } = useTranslation();
    const ctx = useEditorToolbar();
    const { disabled = false, onFormat, onPrint, showPrintButton = true, onNew, onOpen, onSave, onMakeCopy, onEmailAsAttachment, onPageSetup, onFileProperties, onExportPdf, onExportOdt, onExportMd, onExportTxt, onReportBug, onShowAbout, onOpenCommandPalette, onOpenKeyboardShortcuts, onOpenPreferences, onOpenWatermark, onOpenAccessibility, onOpenBuildingBlocks, onConvertSelectionToTable, onConvertTableToText, onOpenDictionary, onOpenTranslate, onTranslateDocument, onToggleSpellcheck, spellcheckEnabled, onOpenWritingAssistant, onOpenExplore, onOpenCitations, onInsertShape, onInsertTextBox, onSetColorTheme, colorTheme, zoom, onZoomChange, onUndo, onRedo, canUndo, canRedo, onOpenFind, onOpenFindReplace, onOpenWordCount, onToggleVoiceTyping, voiceTypingActive, onToggleSpellCheck, spellCheckEnabled, currentFormatting, onInsertImage, onInsertTable, showTableInsert = true, onInsertPageBreak, onInsertSectionBreak, onInsertField, onInsertTOC, onOpenBookmarks, onOpenParagraphDialog, onOpenBordersShading, onInsertHorizontalRule, onOpenInsertSymbol, onInsertFootnote, onToggleShowRuler, rulerVisible, onToggleShowFormattingMarks, showFormattingMarks, onToggleOutline, outlineVisible, onRefocusEditor, } = ctx;
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
    const hasPrintOrPageSetup = (showPrintButton && onPrint) || onPageSetup;
    const hasExport = onExportPdf || onExportOdt || onExportMd || onExportTxt;
    const hasFileMenu = hasPrintOrPageSetup ||
        onNew ||
        onOpen ||
        onSave ||
        onMakeCopy ||
        onEmailAsAttachment ||
        onFileProperties ||
        hasExport;
    return (_jsx(MenuBarProvider, { children: _jsxs("div", { className: "flex items-center overflow-x-auto whitespace-nowrap min-w-0", style: { scrollbarWidth: 'none' }, 
            // role="toolbar" (not "menubar"): a menubar's required children are
            // menuitems, but these triggers are native <button>s (kept so they
            // expose role="button" to AT + tests). A toolbar permits button
            // children and carries no required-children rule, clearing the
            // aria-required-children violation while staying a labeled group.
            role: "toolbar", "aria-label": t('titleBar.menuBarAriaLabel'), children: [hasFileMenu && (_jsx(MenuDropdown, { label: t('toolbar.file'), disabled: disabled, items: [
                        ...(onNew
                            ? [
                                {
                                    icon: 'note_add',
                                    label: 'New',
                                    shortcut: 'Ctrl+N',
                                    onClick: onNew,
                                },
                            ]
                            : []),
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
                        ...(onMakeCopy
                            ? [
                                {
                                    icon: 'content_copy',
                                    label: t('toolbar.makeCopy'),
                                    onClick: onMakeCopy,
                                },
                            ]
                            : []),
                        ...(onEmailAsAttachment
                            ? [
                                {
                                    label: t('toolbar.emailAsAttachment'),
                                    onClick: onEmailAsAttachment,
                                },
                            ]
                            : []),
                        ...((onOpen || onSave || onMakeCopy || onEmailAsAttachment) &&
                            (hasPrintOrPageSetup || onFileProperties || hasExport)
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
                    ] })), _jsx(MenuDropdown, { label: "Edit", disabled: disabled, items: [
                        {
                            icon: 'undo',
                            label: 'Undo',
                            shortcut: 'Ctrl+Z',
                            onClick: onUndo !== null && onUndo !== void 0 ? onUndo : (() => { }),
                            disabled: !canUndo,
                        },
                        {
                            icon: 'redo',
                            label: 'Redo',
                            shortcut: 'Ctrl+Y',
                            onClick: onRedo !== null && onRedo !== void 0 ? onRedo : (() => { }),
                            disabled: !canRedo,
                        },
                        { type: 'separator' },
                        // Clipboard ops — execCommand only works while the editor has focus,
                        // so refocus first. Modern browsers block JS-initiated paste; the
                        // shortcut label educates users to fall back to ⌘V.
                        {
                            icon: 'content_cut',
                            label: 'Cut',
                            shortcut: 'Ctrl+X',
                            onClick: () => {
                                onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor();
                                document.execCommand('cut');
                            },
                        },
                        {
                            icon: 'content_copy',
                            label: 'Copy',
                            shortcut: 'Ctrl+C',
                            onClick: () => {
                                onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor();
                                document.execCommand('copy');
                            },
                        },
                        {
                            icon: 'content_paste',
                            label: 'Paste',
                            shortcut: 'Ctrl+V',
                            onClick: () => {
                                onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor();
                                document.execCommand('paste');
                            },
                        },
                        {
                            icon: 'content_paste_go',
                            label: 'Paste without formatting',
                            shortcut: 'Ctrl+Shift+V',
                            onClick: () => __awaiter(this, void 0, void 0, function* () {
                                onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor();
                                try {
                                    const text = yield navigator.clipboard.readText();
                                    if (text)
                                        document.execCommand('insertText', false, text);
                                }
                                catch (_a) {
                                    // Browser blocked the read; user can fall back to ⌘⇧V.
                                }
                            }),
                        },
                        { type: 'separator' },
                        ...(onOpenFind
                            ? [
                                {
                                    icon: 'search',
                                    label: 'Find…',
                                    shortcut: 'Ctrl+F',
                                    onClick: onOpenFind,
                                },
                            ]
                            : []),
                        ...(onOpenFindReplace
                            ? [
                                {
                                    icon: 'find_replace',
                                    label: 'Find and replace…',
                                    shortcut: 'Ctrl+H',
                                    onClick: onOpenFindReplace,
                                },
                            ]
                            : []),
                        ...(onOpenFind || onOpenFindReplace
                            ? [{ type: 'separator' }]
                            : []),
                        {
                            icon: 'select_all',
                            label: 'Select all',
                            shortcut: 'Ctrl+A',
                            onClick: () => handleFormat('selectAll'),
                        },
                        // Word count lives in Tools → Word count (Google Docs
                        // convention). Removed from Edit on the Phase-4 menu pass
                        // — duplication confused users about which entry the
                        // Ctrl+Shift+C shortcut targeted.
                        ...(onToggleVoiceTyping
                            ? [
                                {
                                    icon: 'mic',
                                    label: voiceTypingActive ? '✓ Voice typing' : 'Voice typing',
                                    onClick: onToggleVoiceTyping,
                                },
                            ]
                            : []),
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
                            shortcut: 'Ctrl+B',
                            onClick: () => handleFormat('bold'),
                        },
                        {
                            label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.italic) ? '✓ ' : ''}Italic`,
                            shortcut: 'Ctrl+I',
                            onClick: () => handleFormat('italic'),
                        },
                        {
                            label: `${(currentFormatting === null || currentFormatting === void 0 ? void 0 : currentFormatting.underline) ? '✓ ' : ''}Underline`,
                            shortcut: 'Ctrl+U',
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
                        { type: 'separator' },
                        {
                            icon: 'format_line_spacing',
                            label: t('toolbar.customSpacing'),
                            onClick: onOpenParagraphDialog,
                            disabled: !onOpenParagraphDialog,
                        },
                        {
                            icon: 'border_outer',
                            label: t('toolbar.bordersAndShading'),
                            onClick: onOpenBordersShading,
                            disabled: !onOpenBordersShading,
                        },
                        { type: 'separator' },
                        {
                            icon: 'format_clear',
                            label: 'Clear formatting',
                            shortcut: 'Ctrl+\\',
                            onClick: () => handleFormat('clearFormatting'),
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
                    ] }), (onZoomChange ||
                    onSetColorTheme ||
                    onToggleShowRuler ||
                    onToggleShowFormattingMarks ||
                    onToggleOutline) && (_jsx(MenuDropdown, { label: "View", disabled: disabled, items: [
                        ...(onZoomChange
                            ? [
                                {
                                    icon: 'add',
                                    label: 'Zoom in',
                                    shortcut: 'Ctrl+=',
                                    onClick: () => onZoomChange(Math.min((zoom !== null && zoom !== void 0 ? zoom : 1) * 1.1, 4)),
                                },
                                {
                                    icon: 'remove',
                                    label: 'Zoom out',
                                    shortcut: 'Ctrl+-',
                                    onClick: () => onZoomChange(Math.max((zoom !== null && zoom !== void 0 ? zoom : 1) / 1.1, 0.25)),
                                },
                                {
                                    icon: 'restart_alt',
                                    label: 'Reset zoom (100%)',
                                    shortcut: 'Ctrl+0',
                                    onClick: () => onZoomChange(1),
                                },
                            ]
                            : []),
                        ...(onZoomChange && onToggleShowRuler
                            ? [{ type: 'separator' }]
                            : []),
                        ...(onToggleShowRuler
                            ? [
                                {
                                    icon: 'straighten',
                                    label: `${rulerVisible ? '✓ ' : ''}Show ruler`,
                                    onClick: onToggleShowRuler,
                                },
                            ]
                            : []),
                        ...(onToggleShowFormattingMarks
                            ? [
                                {
                                    label: `${showFormattingMarks ? '✓ ' : ''}${t('toolbar.showFormattingMarks')}`,
                                    onClick: onToggleShowFormattingMarks,
                                },
                            ]
                            : []),
                        ...(onToggleOutline
                            ? [
                                {
                                    label: `${outlineVisible ? '✓ ' : ''}${t('toolbar.showOutline')}`,
                                    shortcut: 'Ctrl+Shift+H',
                                    onClick: onToggleOutline,
                                },
                            ]
                            : []),
                        ...((onZoomChange || onToggleShowRuler) && onSetColorTheme
                            ? [{ type: 'separator' }]
                            : []),
                        ...(onSetColorTheme
                            ? [
                                {
                                    icon: 'contrast',
                                    label: `${colorTheme === 'auto' || !colorTheme ? '✓ ' : ''}Theme: match system`,
                                    onClick: () => onSetColorTheme('auto'),
                                },
                                {
                                    icon: 'light_mode',
                                    label: `${colorTheme === 'light' ? '✓ ' : ''}Theme: light`,
                                    onClick: () => onSetColorTheme('light'),
                                },
                                {
                                    icon: 'dark_mode',
                                    label: `${colorTheme === 'dark' ? '✓ ' : ''}Theme: dark`,
                                    onClick: () => onSetColorTheme('dark'),
                                },
                            ]
                            : []),
                    ] })), _jsx(MenuDropdown, { label: t('toolbar.insert'), disabled: disabled, items: [
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
                            shortcut: 'Ctrl+Enter',
                            onClick: onInsertPageBreak,
                            disabled: !onInsertPageBreak,
                        },
                        {
                            icon: 'horizontal_rule',
                            label: t('toolbar.horizontalLine'),
                            onClick: onInsertHorizontalRule,
                            disabled: !onInsertHorizontalRule,
                        },
                        {
                            icon: 'horizontal_rule',
                            label: t('toolbar.sectionBreak'),
                            disabled: !onInsertSectionBreak,
                            submenuContent: (closeMenu) => (_jsx(_Fragment, { children: [
                                    { label: t('toolbar.sectionBreakNextPage'), type: 'nextPage' },
                                    { label: t('toolbar.sectionBreakContinuous'), type: 'continuous' },
                                    { label: t('toolbar.sectionBreakEvenPage'), type: 'evenPage' },
                                    { label: t('toolbar.sectionBreakOddPage'), type: 'oddPage' },
                                ].map((item) => (_jsx(SubMenuItem, { label: item.label, onClick: () => onInsertSectionBreak === null || onInsertSectionBreak === void 0 ? void 0 : onInsertSectionBreak(item.type), closeMenu: closeMenu }, item.type))) })),
                        },
                        ...(onInsertShape
                            ? [
                                {
                                    icon: 'shapes',
                                    label: t('toolbar.shape'),
                                    submenuContent: (closeMenu) => (_jsx(_Fragment, { children: [
                                            { label: t('toolbar.shapeRectangle'), type: 'rectangle' },
                                            { label: t('toolbar.shapeEllipse'), type: 'ellipse' },
                                            { label: t('toolbar.shapeLine'), type: 'line' },
                                            { label: t('toolbar.shapeArrow'), type: 'arrow' },
                                        ].map((item) => (_jsx(SubMenuItem, { label: item.label, onClick: () => onInsertShape(item.type), closeMenu: closeMenu }, item.type))) })),
                                },
                            ]
                            : []),
                        ...(onInsertTextBox
                            ? [
                                {
                                    icon: 'edit_note',
                                    label: 'Text box',
                                    onClick: () => onInsertTextBox('plain'),
                                },
                                {
                                    icon: 'chat_bubble_outline',
                                    label: 'Callout',
                                    onClick: () => onInsertTextBox('callout'),
                                },
                            ]
                            : []),
                        {
                            icon: 'tag',
                            label: t('toolbar.insertField'),
                            disabled: !onInsertField,
                            submenuContent: (closeMenu) => (_jsx(_Fragment, { children: [
                                    { label: t('toolbar.fieldPage'), type: 'PAGE' },
                                    { label: t('toolbar.fieldNumPages'), type: 'NUMPAGES' },
                                    { label: t('toolbar.fieldDate'), type: 'DATE' },
                                    { label: t('toolbar.fieldTime'), type: 'TIME' },
                                    { label: t('toolbar.fieldCreateDate'), type: 'CREATEDATE' },
                                    { label: t('toolbar.fieldSaveDate'), type: 'SAVEDATE' },
                                    { label: t('toolbar.fieldAuthor'), type: 'AUTHOR' },
                                    { label: t('toolbar.fieldFileName'), type: 'FILENAME' },
                                ].map((item) => (_jsx(SubMenuItem, { label: item.label, onClick: () => onInsertField === null || onInsertField === void 0 ? void 0 : onInsertField(item.type), closeMenu: closeMenu }, item.type))) })),
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
                        {
                            icon: 'note_add',
                            label: t('toolbar.footnote'),
                            onClick: onInsertFootnote,
                            disabled: !onInsertFootnote,
                        },
                        { type: 'separator' },
                        {
                            icon: 'emoji_symbols',
                            label: t('toolbar.specialCharacters'),
                            onClick: onOpenInsertSymbol,
                            disabled: !onOpenInsertSymbol,
                        },
                        ...(onOpenBuildingBlocks
                            ? [
                                {
                                    label: t('toolbar.buildingBlocks'),
                                    onClick: onOpenBuildingBlocks,
                                },
                            ]
                            : []),
                        ...(onConvertSelectionToTable
                            ? [
                                {
                                    label: t('toolbar.convertToTable'),
                                    onClick: onConvertSelectionToTable,
                                },
                            ]
                            : []),
                        ...(onConvertTableToText
                            ? [
                                {
                                    label: t('toolbar.convertToText'),
                                    onClick: onConvertTableToText,
                                },
                            ]
                            : []),
                        ...(onOpenWatermark
                            ? [
                                { type: 'separator' },
                                {
                                    label: t('toolbar.watermark'),
                                    onClick: onOpenWatermark,
                                },
                            ]
                            : []),
                    ] }), (onOpenPreferences ||
                    onOpenAccessibility ||
                    onOpenWordCount ||
                    onOpenDictionary ||
                    onOpenTranslate ||
                    onTranslateDocument ||
                    onToggleSpellcheck ||
                    onOpenWritingAssistant ||
                    onOpenExplore ||
                    onOpenCitations) && (_jsx(MenuDropdown, { label: t('toolbar.tools'), disabled: disabled, items: [
                        // Word count first — matches Google Docs' Tools → Word count
                        // placement. (Edit menu still has it too for users who learned
                        // the older location.)
                        ...(onOpenWordCount
                            ? [
                                {
                                    icon: 'format_list_numbered',
                                    label: t('toolbar.wordCount'),
                                    shortcut: 'Ctrl+Shift+C',
                                    onClick: onOpenWordCount,
                                },
                                { type: 'separator' },
                            ]
                            : []),
                        ...(onOpenDictionary
                            ? [
                                {
                                    label: t('toolbar.dictionary'),
                                    shortcut: 'Ctrl+Shift+Y',
                                    onClick: onOpenDictionary,
                                },
                            ]
                            : []),
                        ...(onOpenTranslate
                            ? [
                                {
                                    icon: 'translate',
                                    label: t('toolbar.translate'),
                                    onClick: onOpenTranslate,
                                },
                            ]
                            : []),
                        ...(onTranslateDocument
                            ? [
                                {
                                    icon: 'description',
                                    label: 'Translate document…',
                                    onClick: onTranslateDocument,
                                },
                            ]
                            : []),
                        ...(onToggleSpellcheck
                            ? [
                                {
                                    icon: 'spellcheck',
                                    label: spellcheckEnabled ? '✓ Spell check' : 'Spell check',
                                    onClick: onToggleSpellcheck,
                                },
                            ]
                            : []),
                        ...(onOpenWritingAssistant
                            ? [
                                {
                                    icon: 'auto_awesome',
                                    label: 'Writing assistant…',
                                    onClick: onOpenWritingAssistant,
                                },
                            ]
                            : []),
                        ...(onOpenExplore
                            ? [
                                {
                                    icon: 'explore',
                                    label: t('toolbar.explore'),
                                    onClick: onOpenExplore,
                                },
                            ]
                            : []),
                        ...(onOpenCitations
                            ? [
                                {
                                    icon: 'format_quote',
                                    label: t('toolbar.citations'),
                                    onClick: onOpenCitations,
                                },
                            ]
                            : []),
                        ...(onOpenPreferences
                            ? [
                                {
                                    icon: 'tune',
                                    label: t('toolbar.preferences'),
                                    onClick: onOpenPreferences,
                                },
                            ]
                            : []),
                        ...(onOpenAccessibility
                            ? [
                                {
                                    icon: 'accessibility',
                                    label: t('toolbar.accessibility'),
                                    onClick: onOpenAccessibility,
                                },
                            ]
                            : []),
                    ] })), _jsx(MenuDropdown, { label: t('toolbar.help'), disabled: disabled, items: [
                        ...(onOpenCommandPalette
                            ? [
                                {
                                    label: t('toolbar.searchMenus'),
                                    onClick: onOpenCommandPalette,
                                },
                                { type: 'separator' },
                            ]
                            : []),
                        {
                            icon: 'bug_report',
                            label: t('toolbar.reportIssue'),
                            onClick: () => (onReportBug ? onReportBug() : openReportIssue()),
                        },
                        ...(onShowAbout
                            ? [
                                { type: 'separator' },
                                {
                                    icon: 'info',
                                    label: 'About Casual Editor',
                                    onClick: onShowAbout,
                                },
                            ]
                            : []),
                        ...(onOpenKeyboardShortcuts
                            ? [
                                { type: 'separator' },
                                {
                                    label: t('toolbar.keyboardShortcuts'),
                                    onClick: onOpenKeyboardShortcuts,
                                },
                            ]
                            : []),
                    ] })] }) }));
}
/**
 * TitleBar layout (Google Docs style):
 *
 *   ┌──────────┬────────────────────────────┬──────────────────┐
 *   │          │ Document Name              │                  │
 *   │  Logo    │                            │  Right Actions   │
 *   │          │ File  Format  Insert       │                  │
 *   └──────────┴────────────────────────────┴──────────────────┘
 *
 * Logo and TitleBarRight span full height. DocumentName + MenuBar
 * stack vertically in the center column.
 */
export function TitleBar({ children }) {
    let logoItem = null;
    let rightItem = null;
    const middleTopItems = [];
    const menuBarItems = [];
    Children.forEach(children, (child) => {
        if (!isValidElement(child))
            return;
        if (child.type === Logo) {
            logoItem = child;
        }
        else if (child.type === TitleBarRight) {
            rightItem = child;
        }
        else if (child.type === MenuBar) {
            menuBarItems.push(child);
        }
        else {
            middleTopItems.push(child);
        }
    });
    const handleMouseDown = useCallback((e) => {
        const target = e.target;
        const isInteractive = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.tagName === 'OPTION';
        if (!isInteractive) {
            e.preventDefault();
        }
    }, []);
    return (_jsxs("div", { className: "flex items-stretch bg-[color:var(--doc-chrome,#eef1f5)] text-[color:var(--doc-text-on-surface,#1f2937)] pt-2 pb-1", onMouseDown: handleMouseDown, "data-testid": "title-bar", children: [_jsx("div", { className: "flex items-center flex-shrink-0 pl-3 pr-1", children: logoItem || _jsx(DefaultDocIcon, {}) }), _jsxs("div", { className: "flex flex-col justify-center flex-1 min-w-0 py-1 overflow-hidden", children: [middleTopItems.length > 0 && (_jsx("div", { className: "flex items-center gap-2 px-1 min-w-0", children: middleTopItems })), menuBarItems.length > 0 && (_jsx("div", { className: "flex items-center px-1 min-w-0 overflow-x-auto", style: { scrollbarWidth: 'none' }, children: menuBarItems }))] }), rightItem && _jsx("div", { className: "flex items-center flex-shrink-0 px-3", children: rightItem })] }));
}
//# sourceMappingURL=TitleBar.js.map