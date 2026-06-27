import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * InlineHeaderFooterEditor — inline overlay editor for header/footer content
 *
 * Renders a ProseMirror EditorView positioned over the header/footer area
 * on the page, Google Docs style. The main body is dimmed and the toolbar
 * routes formatting commands to this editor while it's active.
 */
import { useRef, useEffect, useCallback, useMemo, useState, useImperativeHandle, useLayoutEffect, forwardRef, } from 'react';
import { EditorState } from 'prosemirror-state';
import { useTranslation } from '../i18n';
import { EditorView } from 'prosemirror-view';
import { undo, redo } from 'prosemirror-history';
import { schema } from '@eigenpal/docx-core/prosemirror';
import { headerFooterToProseDoc } from '@eigenpal/docx-core/prosemirror/conversion';
import { proseDocToBlocks } from '@eigenpal/docx-core/prosemirror/conversion';
import { Z_INDEX } from '../styles/zIndex';
import { extractSelectionState } from '@eigenpal/docx-core/prosemirror';
import { createStarterKit } from '@eigenpal/docx-core/prosemirror/extensions';
import { ExtensionManager } from '@eigenpal/docx-core/prosemirror/extensions';
import { createStyleResolver } from '@eigenpal/docx-core/prosemirror';
import 'prosemirror-view/style/prosemirror.css';
// ============================================================================
// STYLES
// ============================================================================
const separatorBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 0',
    fontSize: 11,
    color: 'var(--doc-primary)',
    userSelect: 'none',
};
const labelStyle = {
    fontWeight: 500,
    letterSpacing: 0.3,
};
const optionsButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--doc-primary)',
    cursor: 'pointer',
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
};
const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: '100%',
    background: 'var(--doc-surface, white)',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    zIndex: Z_INDEX.dropdown,
    minWidth: 160,
    padding: '4px 0',
};
const dropdownItemStyle = {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 12,
    color: 'var(--doc-text-on-surface)',
};
// ============================================================================
// COMPONENT
// ============================================================================
export const InlineHeaderFooterEditor = forwardRef(function InlineHeaderFooterEditor({ headerFooter, position, styles, targetElement, parentElement, onSave, onClose, onSelectionChange, onRemove, titlePg, evenAndOddHeaders, onToggleTitlePg, onToggleEvenAndOdd, }, ref) {
    const editorContainerRef = useRef(null);
    const viewRef = useRef(null);
    const [isDirty, setIsDirty] = useState(false);
    // Keep the latest `onSelectionChange` in a ref so `dispatchTransaction`
    // (closed over once when the HF EditorView is created) always calls the
    // current callback. Without this, the parent's `handleSelectionChange`
    // becomes stale as soon as its identity changes (e.g. when theme or
    // hfEditPosition flips), so HF selection events stop landing on the
    // up-to-date toolbar/state.
    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;
    // Resolve default font size from document styles so the PM editor's
    // line-height calculations use the correct base (not browser-default 16px)
    const defaultFontSizePt = useMemo(() => {
        var _a;
        if (!styles)
            return 11; // Word 2007+ default
        const resolver = createStyleResolver(styles);
        const resolved = resolver.resolveParagraphStyle(undefined);
        // fontSize in document model is in half-points
        return ((_a = resolved.runFormatting) === null || _a === void 0 ? void 0 : _a.fontSize) ? resolved.runFormatting.fontSize / 2 : 11;
    }, [styles]);
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);
    // Compute overlay position relative to the parent element
    const [overlayPos, setOverlayPos] = useState(null);
    useLayoutEffect(() => {
        const computePosition = () => {
            const parentRect = parentElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            setOverlayPos({
                top: targetRect.top - parentRect.top + parentElement.scrollTop,
                left: targetRect.left - parentRect.left + parentElement.scrollLeft,
                width: targetRect.width,
            });
        };
        computePosition();
        // Recompute on scroll/resize
        const scrollParent = parentElement.closest('[style*="overflow"]') || parentElement;
        scrollParent.addEventListener('scroll', computePosition);
        window.addEventListener('resize', computePosition);
        return () => {
            scrollParent.removeEventListener('scroll', computePosition);
            window.removeEventListener('resize', computePosition);
        };
    }, [targetElement, parentElement]);
    // Create ProseMirror editor when the container is available
    // (overlayPos starts null → first render returns null → container ref not set)
    useEffect(() => {
        if (!editorContainerRef.current || viewRef.current)
            return;
        // Convert header/footer content to PM document
        const pmDoc = headerFooterToProseDoc(headerFooter.content, {
            styles: styles || undefined,
        });
        // Create a fresh ExtensionManager to get independent plugin instances
        // (keyed plugins like history$ can't be shared across EditorViews)
        const hfMgr = new ExtensionManager(createStarterKit());
        hfMgr.buildSchema();
        hfMgr.initializeRuntime();
        const plugins = hfMgr.getPlugins();
        const state = EditorState.create({
            doc: pmDoc,
            schema,
            plugins,
        });
        const view = new EditorView(editorContainerRef.current, {
            state,
            dispatchTransaction(tr) {
                var _a;
                const newState = view.state.apply(tr);
                view.updateState(newState);
                if (tr.docChanged) {
                    setIsDirty(true);
                }
                // Report selection changes for toolbar sync
                if (tr.selectionSet || tr.docChanged) {
                    const selState = extractSelectionState(newState);
                    (_a = onSelectionChangeRef.current) === null || _a === void 0 ? void 0 : _a.call(onSelectionChangeRef, selState);
                }
            },
        });
        viewRef.current = view;
        // Auto-focus
        requestAnimationFrame(() => {
            var _a;
            view.focus();
            // Report initial selection state
            const selState = extractSelectionState(view.state);
            (_a = onSelectionChangeRef.current) === null || _a === void 0 ? void 0 : _a.call(onSelectionChangeRef, selState);
        });
        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlayPos]); // Re-run when position is computed (container becomes available)
    // Save current content
    const handleSave = useCallback(() => {
        if (!viewRef.current)
            return;
        const blocks = proseDocToBlocks(viewRef.current.state.doc);
        onSave(blocks);
    }, [onSave]);
    // Save + close
    const handleSaveAndClose = useCallback(() => {
        if (isDirty) {
            handleSave();
        }
        else {
            onClose();
        }
    }, [isDirty, handleSave, onClose]);
    // Handle Escape key — save + close
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                handleSaveAndClose();
            }
        }
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [handleSaveAndClose]);
    // Close options dropdown when clicking outside
    useEffect(() => {
        if (!showOptions)
            return;
        function handleClick(e) {
            if (optionsRef.current && !optionsRef.current.contains(e.target)) {
                setShowOptions(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showOptions]);
    // Expose ref
    useImperativeHandle(ref, () => ({
        getView: () => viewRef.current,
        focus: () => { var _a; return (_a = viewRef.current) === null || _a === void 0 ? void 0 : _a.focus(); },
        undo: () => {
            const view = viewRef.current;
            if (!view)
                return false;
            return undo(view.state, view.dispatch);
        },
        redo: () => {
            const view = viewRef.current;
            if (!view)
                return false;
            return redo(view.state, view.dispatch);
        },
    }));
    const { t } = useTranslation();
    const label = position === 'header' ? t('headerFooter.header') : t('headerFooter.footer');
    if (!overlayPos)
        return null;
    const containerStyle = {
        position: 'absolute',
        top: overlayPos.top,
        left: overlayPos.left,
        width: overlayPos.width,
        zIndex: Z_INDEX.hfInlineEditor,
    };
    return (_jsxs("div", { className: "hf-inline-editor", style: containerStyle, onMouseDown: (e) => {
            // Prevent clicks from bubbling to pages container / body click handler
            e.stopPropagation();
        }, children: [position === 'footer' && (_jsxs("div", { className: "hf-separator-bar", style: separatorBarStyle, children: [_jsx("span", { style: labelStyle, children: label }), _jsx(OptionsMenu, { label: label, showOptions: showOptions, setShowOptions: setShowOptions, optionsRef: optionsRef, onRemove: onRemove, onClose: handleSaveAndClose, viewRef: viewRef, titlePg: titlePg, evenAndOddHeaders: evenAndOddHeaders, onToggleTitlePg: onToggleTitlePg, onToggleEvenAndOdd: onToggleEvenAndOdd })] })), _jsx("div", { ref: editorContainerRef, className: "hf-editor-pm prosemirror-editor", style: {
                    minHeight: 40,
                    outline: 'none',
                    fontSize: `${defaultFontSizePt}pt`,
                    background: 'var(--doc-surface, #ffffff)',
                } }), position === 'header' && (_jsxs("div", { className: "hf-separator-bar", style: separatorBarStyle, children: [_jsx("span", { style: labelStyle, children: label }), _jsx(OptionsMenu, { label: label, showOptions: showOptions, setShowOptions: setShowOptions, optionsRef: optionsRef, onRemove: onRemove, onClose: handleSaveAndClose, viewRef: viewRef, titlePg: titlePg, evenAndOddHeaders: evenAndOddHeaders, onToggleTitlePg: onToggleTitlePg, onToggleEvenAndOdd: onToggleEvenAndOdd })] }))] }));
});
// ============================================================================
// OPTIONS MENU SUB-COMPONENT
// ============================================================================
function OptionsMenu({ label, showOptions, setShowOptions, optionsRef, onRemove, onClose, viewRef, titlePg, evenAndOddHeaders, onToggleTitlePg, onToggleEvenAndOdd, }) {
    const { t } = useTranslation();
    const insertField = (fieldType) => {
        const view = viewRef.current;
        if (!view)
            return;
        // Get marks at the current cursor position so the field inherits surrounding styling
        const { $from, from } = view.state.selection;
        const marks = view.state.storedMarks || $from.marks();
        const node = schema.nodes.field.create({
            fieldType,
            instruction: ` ${fieldType} \\* MERGEFORMAT `,
            fieldKind: 'simple',
            dirty: true,
        });
        const tr = view.state.tr.insert(from, node.mark(marks));
        view.dispatch(tr);
        view.focus();
    };
    return (_jsxs("div", { style: { position: 'relative' }, ref: optionsRef, children: [_jsxs("button", { type: "button", style: optionsButtonStyle, onClick: (e) => {
                    e.stopPropagation();
                    setShowOptions((prev) => !prev);
                }, onMouseDown: (e) => e.stopPropagation(), children: [t('headerFooter.options'), " \u25BE"] }), showOptions && (_jsxs("div", { style: dropdownStyle, children: [_jsx("button", { type: "button", style: dropdownItemStyle, onClick: () => {
                            setShowOptions(false);
                            insertField('PAGE');
                        }, onMouseOver: (e) => {
                            e.target.style.backgroundColor = 'var(--doc-bg-hover, #f1f3f4)';
                        }, onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }, children: t('headerFooter.insertPageNumber') }), _jsx("button", { type: "button", style: dropdownItemStyle, onClick: () => {
                            setShowOptions(false);
                            insertField('NUMPAGES');
                        }, onMouseOver: (e) => {
                            e.target.style.backgroundColor = 'var(--doc-bg-hover, #f1f3f4)';
                        }, onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }, children: t('headerFooter.insertTotalPages') }), _jsx("div", { style: { borderTop: '1px solid #e8eaed', margin: '4px 0' } }), onToggleTitlePg && (_jsxs("button", { type: "button", style: dropdownItemStyle, onClick: () => {
                            setShowOptions(false);
                            onToggleTitlePg(!titlePg);
                        }, "data-testid": "hf-toggle-titlepg", onMouseOver: (e) => {
                            e.target.style.backgroundColor = 'var(--doc-bg-hover, #f1f3f4)';
                        }, onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }, children: [titlePg ? '✓ ' : '', t('headerFooter.differentFirstPage')] })), onToggleEvenAndOdd && (_jsxs("button", { type: "button", style: dropdownItemStyle, onClick: () => {
                            setShowOptions(false);
                            onToggleEvenAndOdd(!evenAndOddHeaders);
                        }, "data-testid": "hf-toggle-evenodd", onMouseOver: (e) => {
                            e.target.style.backgroundColor = 'var(--doc-bg-hover, #f1f3f4)';
                        }, onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }, children: [evenAndOddHeaders ? '✓ ' : '', t('headerFooter.differentEvenOdd')] })), (onToggleTitlePg || onToggleEvenAndOdd) && (_jsx("div", { style: { borderTop: '1px solid #e8eaed', margin: '4px 0' } })), onRemove && (_jsx("button", { type: "button", style: dropdownItemStyle, onClick: () => {
                            setShowOptions(false);
                            onRemove();
                        }, onMouseOver: (e) => {
                            e.target.style.backgroundColor = 'var(--doc-bg-hover, #f1f3f4)';
                        }, onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }, children: t('headerFooter.remove', { label: label.toLowerCase() }) })), _jsx("button", { type: "button", style: dropdownItemStyle, onClick: () => {
                            setShowOptions(false);
                            onClose();
                        }, onMouseOver: (e) => {
                            e.target.style.backgroundColor = 'var(--doc-bg-hover, #f1f3f4)';
                        }, onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }, children: t('headerFooter.closeEditing', { label: label.toLowerCase() }) })] }))] }));
}
//# sourceMappingURL=InlineHeaderFooterEditor.js.map