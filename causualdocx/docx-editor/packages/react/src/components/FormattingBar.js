import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FormattingBar Component
 *
 * Extracted icon-based formatting toolbar (everything except File/Format/Insert menus).
 * Can be used standalone with props or within EditorToolbar (reads from context).
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { resolveColorToHex } from '@eigenpal/docx-core/utils';
import { FontPicker } from './ui/FontPicker';
import { normalizeFontFamilies } from './ui/normalizeFontFamilies';
import { FontSizePicker, halfPointsToPoints } from './ui/FontSizePicker';
import { ColorPicker } from './ui/ColorPicker';
import { AlignmentButtons } from './ui/AlignmentButtons';
import { ListButtons, createDefaultListState } from './ui/ListButtons';
import { LineSpacingPicker } from './ui/LineSpacingPicker';
import { StylePicker } from './ui/StylePicker';
import { MaterialSymbol } from './ui/MaterialSymbol';
import { ZoomControl } from './ui/ZoomControl';
import { TableBorderPicker } from './ui/TableBorderPicker';
import { TableBorderColorPicker } from './ui/TableBorderColorPicker';
import { TableBorderWidthPicker } from './ui/TableBorderWidthPicker';
import { TableCellFillPicker } from './ui/TableCellFillPicker';
import { TableMoreDropdown } from './ui/TableMoreDropdown';
import { TableStyleGallery } from './ui/TableStyleGallery';
import { ImageWrapDropdown } from './ui/ImageWrapDropdown';
import { ImageTransformDropdown } from './ui/ImageTransformDropdown';
import { cn } from '../lib/utils';
import { ToolbarButton, ToolbarGroup } from './Toolbar';
import { EditorToolbarContext } from './EditorToolbarContext';
const ICON_SIZE = 18;
/**
 * Resolves props: if explicit props are provided, use them; otherwise fall back to context.
 */
function useFormattingBarProps(props) {
    const ctx = React.useContext(EditorToolbarContext);
    // If we have context, merge: explicit props override context
    if (ctx) {
        return Object.assign(Object.assign({}, ctx), stripUndefined(props));
    }
    return props;
}
function stripUndefined(obj) {
    const result = {};
    for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Icon-based formatting toolbar — undo/redo, zoom, styles, fonts,
 * bold/italic/underline, colors, alignment, lists, table/image context, clear formatting.
 */
export function FormattingBar(explicitProps) {
    var _a, _b;
    const { t } = useTranslation();
    const props = useFormattingBarProps(explicitProps);
    const { currentFormatting = {}, onFormat, onUndo, onRedo, canUndo = false, canRedo = false, disabled = false, className, style, enableShortcuts = true, editorRef, children, showFontPicker = true, fontFamilies, showFontSizePicker = true, showTextColorPicker = true, showHighlightColorPicker = true, showAlignmentButtons = true, showListButtons = true, showLineSpacingPicker = true, showStylePicker = true, documentStyles, theme, showZoomControl = true, zoom, onZoomChange, onRefocusEditor, imageContext, onImageWrapType, onImageTransform, onOpenImageProperties, tableContext, onTableAction, onInsertImage, onOpenParagraphDialog, onAddComment, onPaintFormat, paintFormatArmed, inline = false, } = props;
    const barRef = useRef(null);
    // ── Handlers ──────────────────────────────────────────────────────────
    const handleFormat = useCallback((action) => {
        if (!disabled && onFormat) {
            onFormat(action);
        }
    }, [disabled, onFormat]);
    const handleUndo = useCallback(() => {
        if (!disabled && canUndo && onUndo) {
            onUndo();
        }
    }, [disabled, canUndo, onUndo]);
    const handleRedo = useCallback(() => {
        if (!disabled && canRedo && onRedo) {
            onRedo();
        }
    }, [disabled, canRedo, onRedo]);
    const handleFontFamilyChange = useCallback((fontFamily) => {
        if (!disabled && onFormat) {
            onFormat({ type: 'fontFamily', value: fontFamily });
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onFormat, onRefocusEditor]);
    const normalizedFonts = React.useMemo(() => normalizeFontFamilies(fontFamilies), [fontFamilies]);
    const handleFontSizeChange = useCallback((sizeInPoints) => {
        if (!disabled && onFormat) {
            onFormat({ type: 'fontSize', value: sizeInPoints });
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onFormat, onRefocusEditor]);
    const handleTextColorChange = useCallback((color) => {
        if (!disabled && onFormat) {
            onFormat({ type: 'textColor', value: color });
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onFormat, onRefocusEditor]);
    const handleHighlightColorChange = useCallback((color) => {
        if (!disabled && onFormat) {
            const highlightValue = typeof color === 'string' ? color : '';
            onFormat({ type: 'highlightColor', value: highlightValue });
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onFormat, onRefocusEditor]);
    const handleAlignmentChange = useCallback((alignment) => {
        if (!disabled && onFormat) {
            onFormat({ type: 'alignment', value: alignment });
        }
    }, [disabled, onFormat]);
    const handleBulletList = useCallback(() => {
        if (!disabled && onFormat) {
            onFormat('bulletList');
        }
    }, [disabled, onFormat]);
    const handleNumberedList = useCallback(() => {
        if (!disabled && onFormat) {
            onFormat('numberedList');
        }
    }, [disabled, onFormat]);
    const handleIndent = useCallback(() => {
        if (!disabled && onFormat) {
            onFormat('indent');
        }
    }, [disabled, onFormat]);
    const handleOutdent = useCallback(() => {
        if (!disabled && onFormat) {
            onFormat('outdent');
        }
    }, [disabled, onFormat]);
    const handleLineSpacingChange = useCallback((twipsValue) => {
        if (!disabled && onFormat) {
            onFormat({ type: 'lineSpacing', value: twipsValue });
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onFormat, onRefocusEditor]);
    const handleStyleChange = useCallback((styleId) => {
        if (!disabled && onFormat) {
            onFormat({ type: 'applyStyle', value: styleId });
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onFormat, onRefocusEditor]);
    const handleTableAction = useCallback((action) => {
        if (!disabled && onTableAction) {
            onTableAction(action);
            requestAnimationFrame(() => onRefocusEditor === null || onRefocusEditor === void 0 ? void 0 : onRefocusEditor());
        }
    }, [disabled, onTableAction, onRefocusEditor]);
    // ── Keyboard shortcuts ────────────────────────────────────────────────
    useEffect(() => {
        if (!enableShortcuts)
            return;
        const handleKeyDown = (event) => {
            const target = event.target;
            const editorContainer = editorRef === null || editorRef === void 0 ? void 0 : editorRef.current;
            const barContainer = barRef.current;
            const isInEditor = editorContainer === null || editorContainer === void 0 ? void 0 : editorContainer.contains(target);
            const isInBar = barContainer === null || barContainer === void 0 ? void 0 : barContainer.contains(target);
            if (!isInEditor && !isInBar)
                return;
            const isCtrl = event.ctrlKey || event.metaKey;
            if (isCtrl && !event.altKey) {
                switch (event.key.toLowerCase()) {
                    case 'b':
                        event.preventDefault();
                        handleFormat('bold');
                        break;
                    case 'i':
                        event.preventDefault();
                        handleFormat('italic');
                        break;
                    case 'u':
                        event.preventDefault();
                        handleFormat('underline');
                        break;
                    case '=':
                        if (event.shiftKey) {
                            event.preventDefault();
                            handleFormat('superscript');
                        }
                        else {
                            event.preventDefault();
                            handleFormat('subscript');
                        }
                        break;
                    case 'l':
                        event.preventDefault();
                        handleAlignmentChange('left');
                        break;
                    case 'e':
                        event.preventDefault();
                        handleAlignmentChange('center');
                        break;
                    case 'r':
                        event.preventDefault();
                        handleAlignmentChange('right');
                        break;
                    case 'j':
                        event.preventDefault();
                        handleAlignmentChange('both');
                        break;
                    case 'k':
                        event.preventDefault();
                        handleFormat('insertLink');
                        break;
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enableShortcuts, handleFormat, handleAlignmentChange, editorRef]);
    // ── Focus management ──────────────────────────────────────────────────
    const handleBarMouseDown = useCallback((e) => {
        const target = e.target;
        const isInteractive = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.tagName === 'OPTION';
        if (!isInteractive) {
            e.preventDefault();
        }
    }, []);
    const handleBarMouseUp = useCallback((e) => {
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
    // ── Render ────────────────────────────────────────────────────────────
    return (_jsxs("div", { ref: barRef, className: cn(!inline &&
            'flex items-center px-2 py-1 bg-[color:var(--doc-bg-subtle,#f1f5f9)] text-[color:var(--doc-text-on-surface,#1f2937)] rounded-full min-h-[36px] overflow-x-auto mx-2 mb-1', className), style: inline ? Object.assign({ display: 'contents' }, style) : style, role: inline ? undefined : 'toolbar', "aria-label": inline ? undefined : t('toolbar.ariaLabel'), "data-testid": inline ? undefined : 'formatting-bar', onMouseDown: inline ? undefined : handleBarMouseDown, onMouseUp: inline ? undefined : handleBarMouseUp, children: [_jsxs(ToolbarGroup, { label: t('formattingBar.groups.history'), children: [_jsx(ToolbarButton, { onClick: handleUndo, disabled: disabled || !canUndo, title: t('formattingBar.undo'), shortcut: "\u2318Z", ariaLabel: t('formattingBar.undo'), children: _jsx(MaterialSymbol, { name: "undo", size: ICON_SIZE }) }), _jsx(ToolbarButton, { onClick: handleRedo, disabled: disabled || !canRedo, title: t('formattingBar.redo'), shortcut: "\u2318Y", ariaLabel: t('formattingBar.redo'), children: _jsx(MaterialSymbol, { name: "redo", size: ICON_SIZE }) }), onPaintFormat && !(tableContext === null || tableContext === void 0 ? void 0 : tableContext.isInTable) && (_jsx(ToolbarButton, { onClick: onPaintFormat, disabled: disabled, title: t('formattingBar.paintFormat'), ariaLabel: t('formattingBar.paintFormat'), active: !!paintFormatArmed, children: _jsx(MaterialSymbol, { name: "format_paint", size: ICON_SIZE }) }))] }), showZoomControl && (_jsx(ToolbarGroup, { label: t('formattingBar.groups.zoom'), children: _jsx(ZoomControl, { value: zoom, onChange: onZoomChange, minZoom: 0.5, maxZoom: 2, disabled: disabled, compact: true, showButtons: false }) })), showStylePicker && (_jsx(ToolbarGroup, { label: t('formattingBar.groups.styles'), children: _jsx(StylePicker, { value: currentFormatting.styleId || 'Normal', onChange: handleStyleChange, styles: documentStyles, theme: theme, disabled: disabled, width: 120 }) })), (showFontPicker || showFontSizePicker) && (_jsxs(ToolbarGroup, { label: t('formattingBar.groups.font'), children: [showFontPicker && (_jsx(FontPicker, { value: currentFormatting.fontFamily || 'Arial', onChange: handleFontFamilyChange, fonts: normalizedFonts, disabled: disabled, width: 60, placeholder: "Arial" })), showFontSizePicker && (_jsx(FontSizePicker, { value: currentFormatting.fontSize !== undefined
                            ? halfPointsToPoints(currentFormatting.fontSize)
                            : 11, onChange: handleFontSizeChange, disabled: disabled, width: 42, placeholder: "11" }))] })), _jsxs(ToolbarGroup, { label: t('formattingBar.groups.textFormatting'), children: [_jsx(ToolbarButton, { onClick: () => handleFormat('bold'), active: currentFormatting.bold, disabled: disabled, title: t('formattingBar.bold'), shortcut: "\u2318B", ariaLabel: t('formattingBar.bold'), children: _jsx(MaterialSymbol, { name: "format_bold", size: ICON_SIZE }) }), _jsx(ToolbarButton, { onClick: () => handleFormat('italic'), active: currentFormatting.italic, disabled: disabled, title: t('formattingBar.italic'), shortcut: "\u2318I", ariaLabel: t('formattingBar.italic'), children: _jsx(MaterialSymbol, { name: "format_italic", size: ICON_SIZE }) }), _jsx(ToolbarButton, { onClick: () => handleFormat('underline'), active: currentFormatting.underline, disabled: disabled, title: t('formattingBar.underline'), shortcut: "\u2318U", ariaLabel: t('formattingBar.underline'), children: _jsx(MaterialSymbol, { name: "format_underlined", size: ICON_SIZE }) }), _jsx(ToolbarButton, { onClick: () => handleFormat('strikethrough'), active: currentFormatting.strike, disabled: disabled, title: t('formattingBar.strikethrough'), shortcut: "\u2318\u21E7X", ariaLabel: t('formattingBar.strikethrough'), children: _jsx(MaterialSymbol, { name: "strikethrough_s", size: ICON_SIZE }) }), _jsx(ToolbarButton, { onClick: () => handleFormat('toggleSmallCaps'), active: currentFormatting.smallCaps, disabled: disabled, title: t('formattingBar.smallCaps'), ariaLabel: t('formattingBar.smallCaps'), children: _jsxs("span", { "aria-hidden": true, style: {
                                fontWeight: 600,
                                fontFamily: 'inherit',
                                fontSize: ICON_SIZE - 2,
                                lineHeight: 1,
                                letterSpacing: 0.5,
                            }, children: ["A", _jsx("span", { style: { fontSize: ICON_SIZE - 6 }, children: "a" })] }) }), _jsx(ToolbarButton, { onClick: () => handleFormat('toggleAllCaps'), active: currentFormatting.allCaps, disabled: disabled, title: t('formattingBar.allCaps'), ariaLabel: t('formattingBar.allCaps'), children: _jsx("span", { "aria-hidden": true, style: {
                                fontWeight: 600,
                                fontFamily: 'inherit',
                                fontSize: ICON_SIZE - 2,
                                lineHeight: 1,
                                letterSpacing: 0.5,
                            }, children: "AA" }) }), showTextColorPicker && (_jsx(ColorPicker, { mode: "text", value: (_a = currentFormatting.color) === null || _a === void 0 ? void 0 : _a.replace(/^#/, ''), onChange: handleTextColorChange, theme: theme, disabled: disabled, title: t('formattingBar.fontColor') })), showHighlightColorPicker && (_jsx(ColorPicker, { mode: "highlight", value: currentFormatting.highlight, onChange: handleHighlightColorChange, theme: theme, disabled: disabled, title: t('formattingBar.highlightColor') })), _jsx(ToolbarButton, { onClick: () => handleFormat('insertLink'), disabled: disabled, title: t('formattingBar.insertLink'), shortcut: "\u2318K", ariaLabel: t('formattingBar.insertLink'), children: _jsx(MaterialSymbol, { name: "link", size: ICON_SIZE }) }), onInsertImage && (_jsx(ToolbarButton, { onClick: onInsertImage, disabled: disabled, title: t('toolbar.image'), ariaLabel: t('toolbar.image'), children: _jsx(MaterialSymbol, { name: "image", size: ICON_SIZE }) })), onAddComment && (_jsx(ToolbarButton, { onClick: onAddComment, disabled: disabled, title: t('formattingBar.addComment'), ariaLabel: t('formattingBar.addComment'), children: _jsx(MaterialSymbol, { name: "add_comment", size: ICON_SIZE }) }))] }), _jsxs(ToolbarGroup, { label: t('formattingBar.groups.script'), children: [_jsx(ToolbarButton, { onClick: () => handleFormat('superscript'), active: currentFormatting.superscript, disabled: disabled, title: t('formattingBar.superscript'), shortcut: "\u2318.", ariaLabel: t('formattingBar.superscript'), children: _jsx(MaterialSymbol, { name: "superscript", size: ICON_SIZE }) }), _jsx(ToolbarButton, { onClick: () => handleFormat('subscript'), active: currentFormatting.subscript, disabled: disabled, title: t('formattingBar.subscript'), shortcut: "\u2318,", ariaLabel: t('formattingBar.subscript'), children: _jsx(MaterialSymbol, { name: "subscript", size: ICON_SIZE }) })] }), showAlignmentButtons && (_jsx(ToolbarGroup, { label: t('formattingBar.groups.alignment'), children: _jsx(AlignmentButtons, { value: currentFormatting.alignment || 'left', onChange: handleAlignmentChange, disabled: disabled }) })), (showListButtons || showLineSpacingPicker) && (_jsxs(ToolbarGroup, { label: t('formattingBar.groups.listFormatting'), children: [showListButtons && (_jsx(ListButtons, { listState: currentFormatting.listState || createDefaultListState(), onBulletList: handleBulletList, onNumberedList: handleNumberedList, onIndent: handleIndent, onOutdent: handleOutdent, disabled: disabled, showIndentButtons: true, compact: true, hasIndent: ((_b = currentFormatting.indentLeft) !== null && _b !== void 0 ? _b : 0) > 0 })), showLineSpacingPicker && (_jsx(LineSpacingPicker, { value: currentFormatting.lineSpacing, onChange: handleLineSpacingChange, disabled: disabled, spaceBefore: currentFormatting.spaceBefore, spaceAfter: currentFormatting.spaceAfter, onSpaceBeforeChange: (twips) => onFormat === null || onFormat === void 0 ? void 0 : onFormat({ type: 'spaceBefore', value: twips }), onSpaceAfterChange: (twips) => onFormat === null || onFormat === void 0 ? void 0 : onFormat({ type: 'spaceAfter', value: twips }), onOpenCustomSpacing: onOpenParagraphDialog, keepNext: currentFormatting.keepNext, keepLines: currentFormatting.keepLines, pageBreakBefore: currentFormatting.pageBreakBefore, widowControl: currentFormatting.widowControl, onTogglePagination: (key) => {
                            const current = currentFormatting[key];
                            onFormat === null || onFormat === void 0 ? void 0 : onFormat({
                                type: key,
                                value: !current,
                            });
                        } }))] })), imageContext && onImageWrapType && (_jsxs(ToolbarGroup, { label: t('formattingBar.groups.image'), children: [_jsx(ImageWrapDropdown, { imageContext: imageContext, onChange: onImageWrapType, disabled: disabled }), onImageTransform && (_jsx(ImageTransformDropdown, { onTransform: onImageTransform, disabled: disabled })), onOpenImageProperties && (_jsx(ToolbarButton, { onClick: onOpenImageProperties, disabled: disabled, title: t('formattingBar.imagePropertiesShortcut'), ariaLabel: t('formattingBar.imageProperties'), children: _jsx(MaterialSymbol, { name: "tune", size: ICON_SIZE }) }))] })), (tableContext === null || tableContext === void 0 ? void 0 : tableContext.isInTable) && onTableAction && (_jsxs(ToolbarGroup, { label: t('formattingBar.groups.table'), children: [_jsx(TableBorderPicker, { onAction: handleTableAction, disabled: disabled }), _jsx(TableBorderColorPicker, { onAction: handleTableAction, disabled: disabled, theme: theme, value: resolveColorToHex(tableContext === null || tableContext === void 0 ? void 0 : tableContext.cellBorderColor, theme) }), _jsx(TableBorderWidthPicker, { onAction: handleTableAction, disabled: disabled }), _jsx(TableCellFillPicker, { onAction: handleTableAction, disabled: disabled, theme: theme, value: tableContext === null || tableContext === void 0 ? void 0 : tableContext.cellBackgroundColor }), _jsx(TableStyleGallery, { documentStyles: documentStyles, onAction: handleTableAction }), _jsx(TableMoreDropdown, { onAction: handleTableAction, disabled: disabled, tableContext: tableContext })] })), _jsx(ToolbarButton, { onClick: () => handleFormat('clearFormatting'), disabled: disabled, title: t('formattingBar.clearFormatting'), shortcut: '⌘\\', ariaLabel: t('formattingBar.clearFormatting'), children: _jsx(MaterialSymbol, { name: "format_clear", size: ICON_SIZE }) }), children] }));
}
//# sourceMappingURL=FormattingBar.js.map