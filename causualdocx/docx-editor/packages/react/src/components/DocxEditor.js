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
 * DocxEditor Component
 *
 * Main component integrating all editor features:
 * - Toolbar for formatting
 * - ProseMirror-based editor for content editing
 * - Zoom control
 * - Error boundary
 * - Loading states
 */
import { useRef, useCallback, useState, useEffect, useMemo, forwardRef, useImperativeHandle, lazy, Suspense, } from 'react';
import defaultLocale from '../../i18n/en.json';
import { ToolbarButton, ToolbarSeparator, } from './Toolbar';
import { EditorToolbar } from './EditorToolbar';
import { StatusBar } from './StatusBar';
import { FocusModeBar } from './FocusModeBar';
import { useStatPrefs } from './statbar-prefs';
import { READABILITY_PLUGIN_KEY, readabilityPlugin } from '../lib/quality/readabilityPlugin';
import { pointsToHalfPoints } from './ui/FontSizePicker';
import { DocumentOutline, OUTLINE_RESERVED_SPACE } from './DocumentOutline';
import { SIDEBAR_DOCUMENT_SHIFT } from './sidebar/constants';
import { VersionHistoryPanel } from './sidebar/VersionHistoryPanel';
import { PropertiesPanel } from './sidebar/PropertiesPanel';
import { ImagePropertiesSection } from './sidebar/ImagePropertiesSection';
import { TablePropertiesSection } from './sidebar/TablePropertiesSection';
import { TextBoxPropertiesSection } from './sidebar/TextBoxPropertiesSection';
import { useEditHistory } from '../hooks/useEditHistory';
import { useVersionHistoryCapture } from '../version-history/useVersionHistoryCapture';
import { downloadServerVersion } from '../version-history/server-source';
import { useVoiceTyping } from '../hooks/useVoiceTyping';
import { VoiceTypingIndicator } from './ui/VoiceTypingIndicator';
import { UnifiedSidebar } from './UnifiedSidebar';
import { AgentPanel } from './AgentPanel';
import { PanelRail } from './PanelRail';
import { AutosaveRestoreBanner } from './AutosaveRestoreBanner';
import { writeAutosave } from '../utils/autosave';
import { recordRecentFile } from '../utils/recent-files';
import { CommentMarginMarkers } from './CommentMarginMarkers';
import { useCommentSidebarItems } from '../hooks/useCommentSidebarItems';
import { useTrackedChanges } from '../hooks/useTrackedChanges';
import { NodeSelection } from 'prosemirror-state';
import { undo as pmUndo, redo as pmRedo } from 'prosemirror-history';
import { checkAccessibility } from '@eigenpal/docx-core/utils';
import { ErrorBoundary, ErrorProvider } from './ErrorBoundary';
import { mapHexToHighlightName } from './toolbarUtils';
import { LocaleProvider, useTranslation } from '../i18n';
import { HorizontalRuler } from './ui/HorizontalRuler';
import { VerticalRuler } from './ui/VerticalRuler';
import { Z_INDEX } from '../styles/zIndex';
// Dialog hooks + utilities — pulled from their own modules so a
// consumer that needs the runtime helpers doesn't drag a lazy()-
// loaded dialog component's chunk back into the main bundle. That
// double-import (eager + lazy on the same file) was the root cause
// of the production-only "TypeError: n is not a function" at boot
// — Vite couldn't form a stable chunk graph and the minified output
// reached for a value that had become undefined.
import { useFindReplace } from './dialogs/useFindReplace';
import { findInDocument, scrollToMatch, } from './dialogs/findReplaceUtils';
import { useHyperlinkDialog } from './dialogs/useHyperlinkDialog';
import { EquationDialog } from './EquationDialog';
import { FootnoteEditDialog } from './FootnoteEditDialog';
import { InlineHeaderFooterEditor, } from './InlineHeaderFooterEditor';
// Dialog components (lazy-loaded — only fetched when first opened)
const trackedChangesActionBtnStyle = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 4,
    color: 'var(--doc-text-on-surface)',
    display: 'inline-flex',
    alignItems: 'center',
};
const FindReplaceDialog = lazy(() => import('./dialogs/FindReplaceDialog'));
const HyperlinkDialog = lazy(() => import('./dialogs/HyperlinkDialog'));
const TablePropertiesDialog = lazy(() => import('./dialogs/TablePropertiesDialog').then((m) => ({ default: m.TablePropertiesDialog })));
const SplitCellDialog = lazy(() => import('./dialogs/SplitCellDialog'));
const ImagePositionDialog = lazy(() => import('./dialogs/ImagePositionDialog').then((m) => ({ default: m.ImagePositionDialog })));
const ImagePropertiesDialog = lazy(() => import('./dialogs/ImagePropertiesDialog').then((m) => ({ default: m.ImagePropertiesDialog })));
const FootnotePropertiesDialog = lazy(() => import('./dialogs/FootnotePropertiesDialog').then((m) => ({
    default: m.FootnotePropertiesDialog,
})));
const PageSetupDialog = lazy(() => import('./dialogs/PageSetupDialog').then((m) => ({ default: m.PageSetupDialog })));
const FilePropertiesDialog = lazy(() => import('./dialogs/FilePropertiesDialog').then((m) => ({ default: m.FilePropertiesDialog })));
const WordCountDialog = lazy(() => import('./dialogs/WordCountDialog').then((m) => ({ default: m.WordCountDialog })));
const BookmarksDialog = lazy(() => import('./dialogs/BookmarksDialog').then((m) => ({ default: m.BookmarksDialog })));
const CharacterSpacingDialog = lazy(() => import('./dialogs/CharacterSpacingDialog').then((m) => ({ default: m.CharacterSpacingDialog })));
const CustomSpacingDialog = lazy(() => import('./dialogs/CustomSpacingDialog').then((m) => ({ default: m.CustomSpacingDialog })));
const BordersAndShadingDialog = lazy(() => import('./dialogs/BordersAndShadingDialog').then((m) => ({
    default: m.BordersAndShadingDialog,
})));
const InsertSymbolDialog = lazy(() => import('./dialogs/InsertSymbolDialog').then((m) => ({ default: m.InsertSymbolDialog })));
const AboutDialog = lazy(() => import('./dialogs/AboutDialog').then((m) => ({ default: m.AboutDialog })));
const CommandPaletteDialog = lazy(() => import('./dialogs/CommandPaletteDialog').then((m) => ({ default: m.CommandPaletteDialog })));
const KeyboardShortcutsDialog = lazy(() => import('./dialogs/KeyboardShortcutsDialog').then((m) => ({ default: m.KeyboardShortcutsDialog })));
const PreferencesDialog = lazy(() => import('./dialogs/PreferencesDialog').then((m) => ({ default: m.PreferencesDialog })));
const WatermarkDialog = lazy(() => import('./dialogs/WatermarkDialog').then((m) => ({ default: m.WatermarkDialog })));
const AccessibilityDialog = lazy(() => import('./dialogs/AccessibilityDialog').then((m) => ({ default: m.AccessibilityDialog })));
const BuildingBlocksDialog = lazy(() => import('./dialogs/BuildingBlocksDialog').then((m) => ({ default: m.BuildingBlocksDialog })));
const DictionaryDialog = lazy(() => import('./dialogs/DictionaryDialog').then((m) => ({ default: m.DictionaryDialog })));
const TranslateDialog = lazy(() => import('./dialogs/TranslateDialog').then((m) => ({ default: m.TranslateDialog })));
const TranslateDocumentDialog = lazy(() => import('./dialogs/TranslateDocumentDialog').then((m) => ({
    default: m.TranslateDocumentDialog,
})));
const WritingAssistantSheet = lazy(() => import('./dialogs/WritingAssistantSheet').then((m) => ({
    default: m.WritingAssistantSheet,
})));
const ExploreDialog = lazy(() => import('./dialogs/ExploreDialog').then((m) => ({ default: m.ExploreDialog })));
const CitationsDialog = lazy(() => import('./dialogs/CitationsDialog').then((m) => ({ default: m.CitationsDialog })));
import { MaterialSymbol } from './ui/Icons';
import { Tooltip } from './ui/Tooltip';
import { TextContextMenu, } from './TextContextMenu';
import { ImageContextMenu, useImageContextMenu } from './ImageContextMenu';
import { setImageWrapType } from '@eigenpal/docx-core/prosemirror/commands';
import { editorPreferences, setEditorPreference, setSpellChecker, refreshSpellcheckDecorations, } from '@eigenpal/docx-core/prosemirror/extensions';
import { getSpellCheckerImpl, isSpellEnabled, setSpellEnabled, loadSpellChecker, suggestionsFor, ignoreWord, } from '../lib/spellcheck/service';
import { SpellSuggestionsMenu } from './SpellSuggestionsMenu';
import { bootWriterController, useWriterState } from '../lib/writer/controller';
import { rewriteFragment, sampleContext } from '../lib/writer/rewriteFragment';
import { applyFragmentAsSuggestion, applyInsertAsSuggestion, applyMarkdownAsSuggestion, applyRewriteAsSuggestion, } from '../lib/writer/applyAsSuggestion';
import { stripModelPreamble } from '../lib/writer/stripPreamble';
import { AISuggestionPanel } from './AISuggestionPanel';
import { ChatPanel } from './ChatPanel';
import { InlinePreviewPopover } from './InlinePreviewPopover';
import { SelectionAskAi } from './SelectionAskAi';
import { runPipeline } from '../lib/writer/pipeline';
import { captureInlinePositionEmu, toolbarValueToLayoutTarget, forceRenderAllPages, restoreVirtualization, } from '@eigenpal/docx-core/layout-painter';
import { HyperlinkPopup } from './ui/HyperlinkPopup';
import { Toaster, toast } from 'sonner';
import { getBuiltinTableStyle } from './ui/TableStyleGallery';
import { DocumentAgent } from '@eigenpal/docx-core/agent';
import { DefaultLoadingIndicator, DefaultPlaceholder, ParseError } from './DocxEditorHelpers';
import { parseDocx, getFootnoteText, setFootnotePlainText, getEndnoteText, setEndnotePlainText, } from '@eigenpal/docx-core/docx';
import { findBodyPmAnchors } from '@eigenpal/docx-core/layout-bridge';
import { onFontsLoaded, loadDocumentFonts } from '@eigenpal/docx-core/utils';
import { resolveColorToHex } from '@eigenpal/docx-core/utils';
import { executeCommand } from '@eigenpal/docx-core/agent';
import { useTableSelection } from '../hooks/useTableSelection';
import { useDocumentHistory } from '../hooks/useHistory';
import { getSplitCellDialogConfig, splitActiveTableCell, } from '@eigenpal/docx-core/prosemirror/commands';
// Extension system
import { createStarterKit } from '@eigenpal/docx-core/prosemirror/extensions';
import { ExtensionManager } from '@eigenpal/docx-core/prosemirror/extensions';
import { createSuggestionModePlugin, setSuggestionMode, } from '@eigenpal/docx-core/prosemirror/plugins';
// Conversion (for HF inline editor save + version-history preview)
import { proseDocToBlocks, fromProseDoc } from '@eigenpal/docx-core/prosemirror/conversion';
import { buildVersionDiffDoc } from '../version-history/versionDiff';
import { setStrictCoEditing, isStrictCoEditingEnabled, strictCoEditingKey, } from '../collab/strictCoEditing';
// ProseMirror editor
import { TextSelection, extractSelectionState, toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleSuperscript, toggleSubscript, setTextColor, clearTextColor, setHighlight, setFontSize, setFontFamily, setAlignment, setLineSpacing, toggleBulletList, toggleNumberedList, increaseIndent, decreaseIndent, setIndentLeft, setIndentRight, setIndentFirstLine, removeTabStop, increaseListLevel, decreaseListLevel, clearFormatting, applyStyle, createStyleResolver, 
// Hyperlink commands
getHyperlinkAttrs, getSelectedText, setHyperlink, removeHyperlink, insertHyperlink, 
// Text direction commands
setRtl, setLtr, 
// Small caps / all caps / hidden / character spacing
toggleSmallCaps, toggleAllCaps, toggleHidden, 
// Text effects (emboss / imprint / shadow / outline)
toggleEmboss, toggleImprint, toggleTextShadow, toggleTextOutline, setCharacterSpacing, setCharacterAttrs, setParagraphAttrs, 
// Space before/after
setSpaceBefore, setSpaceAfter, 
// Page break command
insertPageBreak, 
// Section break command
insertSectionBreak, insertFootnote, insertHorizontalRule, 
// Field insert command (PAGE / NUMPAGES / DATE / …)
insertField, 
// List numbering control
restartListNumbering, continueListNumbering, 
// Table of Contents command
generateTOC, 
// Table commands
getTableContext, insertTable, addRowAbove, addRowBelow, deleteRow as pmDeleteRow, addColumnLeft, addColumnRight, deleteColumn as pmDeleteColumn, deleteTable as pmDeleteTable, selectTable as pmSelectTable, selectRow as pmSelectRow, selectColumn as pmSelectColumn, mergeCells as pmMergeCells, setCellBorder, setCellVerticalAlign, setCellMargins, setCellTextDirection, toggleNoWrap, setRowHeight, toggleHeaderRow, distributeColumns, distributeRows, autoFitContents, autoFitWindow, sortTable, setTableProperties, applyTableStyle, removeTableBorders, setAllTableBorders, setOutsideTableBorders, setInsideTableBorders, setCellFillColor, setTableBorderColor, setTableBorderWidth, } from '@eigenpal/docx-core/prosemirror';
import { acceptChange, rejectChange, acceptAllChanges, rejectAllChanges, findNextChange, findPreviousChange, } from '@eigenpal/docx-core/prosemirror/commands';
import { collectHeadings } from '@eigenpal/docx-core/utils';
import { getChangedParagraphIds, hasStructuralChanges, hasUntrackedChanges, hasNonParagraphBlockChanges, clearTrackedChanges, } from '@eigenpal/docx-core/prosemirror/extensions';
// Paginated editor
import { PagedEditor, DEFAULT_PAGE_WIDTH } from '../paged-editor/PagedEditor';
// E3 — suggesting-mode banner. Yellow stripe above the editor matching
// Google Docs' visual language; visible only while editing-mode is
// "suggesting".
import { SuggestingModeBanner } from './SuggestingModeBanner';
// Building blocks (C6) — saved reusable snippets the user inserts via the
// Insert menu. Backed by localStorage; PM Slice JSON round-trip.
import { Slice } from 'prosemirror-model';
import { translateFragment, TRANSLATE_LANGUAGES } from '../lib/translate';
import { loadBuildingBlocks, addBuildingBlock, removeBuildingBlock, previewFromText, } from '../utils/buildingBlocks';
// Convert selection to table (B8) — auto-detect-delimiter helper that
// turns the selected paragraphs into a table in one click. The reverse
// direction (table → text) lives alongside it.
import { convertSelectionToTable, convertTableToText } from '../utils/convertTextToTable';
import { detectTabular } from '../utils/smartPaste';
// Citations manager (A6 v0) — localStorage CRUD; the host renders the
// formatted citation text and threads in a hyperlink for the URL.
import { loadCitations, addCitation, removeCitation } from '../utils/citations';
// Basic inline shape generator (C2 v0). Returns SVG + data URL ready to
// drop into an image node at the cursor.
import { generateShape } from '../utils/shapes';
const EDITING_MODES = [
    {
        value: 'editing',
        labelKey: 'editor.editing',
        icon: 'edit_note',
        descKey: 'editor.editingDescription',
    },
    {
        value: 'suggesting',
        labelKey: 'editor.suggesting',
        icon: 'rate_review',
        descKey: 'editor.suggestingDescription',
    },
    {
        value: 'viewing',
        labelKey: 'editor.viewing',
        icon: 'visibility',
        descKey: 'editor.viewingDescription',
    },
];
/**
 * Floating page indicator shown next to the scrollbar while the user
 * scrolls a multi-page document. Wrapped so the `{current} of {total}`
 * template runs through `t()`; `useTranslation()` only works inside
 * `<LocaleProvider>`, which `DocxEditor`'s own body is not.
 */
function PageIndicator({ currentPage, totalPages, visible, }) {
    const { t } = useTranslation();
    return (_jsx("div", { style: {
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: visible ? 1 : 0,
            transition: 'opacity var(--doc-anim-slow)',
            userSelect: 'none',
        }, "aria-live": "polite", role: "status", children: t('viewer.pageIndicator', { current: currentPage, total: totalPages }) }));
}
function AgentPanelToggle({ active, onClick, badge, }) {
    const { t } = useTranslation();
    const title = t('agentPanel.toggle');
    return (_jsx(ToolbarButton, { onClick: onClick, active: active, title: title, ariaLabel: title, children: _jsxs("span", { style: { position: 'relative', display: 'inline-flex' }, children: [_jsx(MaterialSymbol, { name: "agent-sparkle", size: 20 }), badge != null && (_jsx("span", { "data-testid": "agent-panel-toggle-badge", style: {
                        position: 'absolute',
                        top: -4,
                        right: -6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 14,
                        height: 14,
                        padding: '0 3px',
                        borderRadius: 7,
                        fontSize: 10,
                        fontWeight: 600,
                        background: '#ef4444',
                        color: '#fff',
                        lineHeight: 1,
                    }, children: badge }))] }) }));
}
function EditingModeDropdown({ mode, onModeChange, }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [compact, setCompact] = useState(false);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const current = EDITING_MODES.find((m) => m.value === mode);
    // Responsive: icon-only below 1400px
    useEffect(() => {
        const mql = window.matchMedia('(max-width: 1400px)');
        setCompact(mql.matches);
        const handler = (e) => setCompact(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);
    // Position is computed in the trigger's onClick from e.currentTarget (see
    // below) so it works even when triggerRef is null — the <Tooltip> wrapper
    // can swallow the ref, which previously left the menu pinned at {0,0} (top
    // of the page) instead of under its right-aligned trigger.
    useEffect(() => {
        if (!isOpen)
            return;
        const close = (e) => {
            var _a, _b;
            if (!((_a = triggerRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)) &&
                !((_b = dropdownRef.current) === null || _b === void 0 ? void 0 : _b.contains(e.target))) {
                setIsOpen(false);
            }
        };
        const esc = (e) => {
            if (e.key === 'Escape')
                setIsOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', esc);
        };
    }, [isOpen]);
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsx(Tooltip, { content: `${t(current.labelKey)} (Ctrl+Shift+E)`, children: _jsxs("button", { ref: triggerRef, type: "button", onMouseDown: (e) => e.preventDefault(), onClick: (e) => {
                        if (!isOpen) {
                            const r = e.currentTarget.getBoundingClientRect();
                            // Right-align the 220px menu to the trigger, clamped into the
                            // viewport so it never runs off-screen or pins to a corner.
                            const left = Math.max(8, Math.min(r.right, window.innerWidth - 8) - 220);
                            setPos({ top: r.bottom + 2, left });
                        }
                        setIsOpen(!isOpen);
                    }, "aria-label": `${t(current.labelKey)} (Ctrl+Shift+E)`, style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: compact ? 0 : 4,
                        padding: compact ? '2px 4px' : '2px 6px 2px 4px',
                        border: 'none',
                        background: isOpen ? 'var(--doc-hover, #f3f4f6)' : 'transparent',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 400,
                        color: 'var(--doc-text, #374151)',
                        whiteSpace: 'nowrap',
                        height: 28,
                    }, children: [_jsx(MaterialSymbol, { name: current.icon, size: 18 }), !compact && _jsx("span", { children: t(current.labelKey) }), _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 16 })] }) }), isOpen && (_jsx("div", { ref: dropdownRef, onMouseDown: (e) => e.preventDefault(), style: {
                    position: 'fixed',
                    top: pos.top,
                    left: pos.left,
                    backgroundColor: 'var(--doc-surface, white)',
                    color: 'var(--doc-text-on-surface, #1f2937)',
                    border: '1px solid var(--doc-border, #d1d5db)',
                    borderRadius: 8,
                    boxShadow: 'var(--doc-shadow, 0 4px 12px rgba(0, 0, 0, 0.12))',
                    padding: '4px 0',
                    zIndex: 10000,
                    minWidth: 220,
                }, children: EDITING_MODES.map((m) => (_jsxs("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => {
                        onModeChange(m.value);
                        setIsOpen(false);
                    }, onMouseOver: (e) => {
                        e.currentTarget.style.backgroundColor =
                            'var(--doc-hover, #f3f4f6)';
                    }, onMouseOut: (e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }, style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--doc-text, #374151)',
                        width: '100%',
                        textAlign: 'left',
                    }, children: [_jsx(MaterialSymbol, { name: m.icon, size: 20 }), _jsxs("span", { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, children: [_jsx("span", { style: { fontWeight: 500 }, children: t(m.labelKey) }), _jsx("span", { style: { fontSize: 11, color: 'var(--doc-text-muted, #9ca3af)' }, children: t(m.descKey) })] }), m.value === mode && (_jsx(MaterialSymbol, { name: "check", size: 18, style: { marginLeft: 'auto', color: 'var(--doc-primary)' } }))] }, m.value))) }))] }));
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
// Bumped on document load to be above all existing comment + tracked change IDs.
// Can also be bumped on mount by the `commentIdBase` prop so collab peers
// can partition the ID space and avoid collisions (issue #257).
let nextCommentId = 1;
const PENDING_COMMENT_ID = -1;
/**
 * Bump the shared `nextCommentId` counter forward (never backward).
 * Used both by the doc-load handler (to skip past IDs already in the
 * document) and by the `commentIdBase` prop effect (to skip past a
 * collab partition).
 */
function bumpNextCommentIdAtLeast(value) {
    if (value > nextCommentId)
        nextCommentId = value;
}
/**
 * Inject commentRangeStart/End/Reference for reply comments.
 * Replies share the parent comment's text range in document.xml.
 * Without these markers, Pages/Word can't find the reply.
 */
function injectReplyRangeMarkers(content, comments) {
    const replies = comments.filter((c) => c.parentId != null);
    if (replies.length === 0)
        return;
    // Build parentId → reply IDs map
    const replyIdsByParent = new Map();
    for (const r of replies) {
        const arr = replyIdsByParent.get(r.parentId);
        if (arr)
            arr.push(r.id);
        else
            replyIdsByParent.set(r.parentId, [r.id]);
    }
    // Walk document content and find parent commentRangeStart/End locations
    function walkBlocks(blocks) {
        for (const block of blocks) {
            if (block.type === 'paragraph') {
                // Skip paragraphs without any comment range markers
                if (!block.content.some((i) => i.type === 'commentRangeStart' || i.type === 'commentRangeEnd'))
                    continue;
                const newItems = [];
                for (const item of block.content) {
                    if (item.type === 'commentRangeStart') {
                        newItems.push(item);
                        // Add reply range starts right after parent's start
                        const replyIds = replyIdsByParent.get(item.id);
                        if (replyIds) {
                            for (const rid of replyIds) {
                                newItems.push({ type: 'commentRangeStart', id: rid });
                            }
                        }
                    }
                    else if (item.type === 'commentRangeEnd') {
                        // Parent's rangeEnd first, then reply rangeEnds (parallel, not nested)
                        newItems.push(item);
                        const replyIds = replyIdsByParent.get(item.id);
                        if (replyIds) {
                            for (const rid of replyIds) {
                                newItems.push({ type: 'commentRangeEnd', id: rid });
                            }
                        }
                    }
                    else {
                        newItems.push(item);
                    }
                }
                block.content = newItems;
            }
            else if (block.type === 'table') {
                for (const row of block.rows) {
                    for (const cell of row.cells) {
                        walkBlocks(cell.content);
                    }
                }
            }
        }
    }
    walkBlocks(content);
}
/**
 * Inject commentRangeStart/End for comments that reply to tracked changes.
 * TC replies' parents are insertion/deletion nodes (not comments), so
 * injectReplyRangeMarkers can't find them. This function finds the TC
 * content nodes and wraps them with comment range markers.
 */
function injectTCReplyRangeMarkers(content, comments) {
    // Find replies whose parentId is a tracked change (not a real comment)
    const commentIds = new Set(comments.map((c) => c.id));
    const tcReplies = comments.filter((c) => c.parentId != null && !commentIds.has(c.parentId));
    if (tcReplies.length === 0)
        return;
    // Build revisionId → reply comment IDs
    const replyIdsByRevision = new Map();
    for (const r of tcReplies) {
        const arr = replyIdsByRevision.get(r.parentId);
        if (arr)
            arr.push(r.id);
        else
            replyIdsByRevision.set(r.parentId, [r.id]);
    }
    function walkBlocks(blocks) {
        for (const block of blocks) {
            if (block.type === 'paragraph') {
                // Check if any insertion/deletion in this paragraph matches a TC reply
                const hasTC = block.content.some((item) => (item.type === 'insertion' || item.type === 'deletion') &&
                    replyIdsByRevision.has(item.info.id));
                if (!hasTC)
                    continue;
                const newItems = [];
                const items = block.content;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if ((item.type === 'insertion' || item.type === 'deletion') &&
                        replyIdsByRevision.has(item.info.id)) {
                        const replyIds = replyIdsByRevision.get(item.info.id);
                        // Add commentRangeStart BEFORE the TC content
                        for (const rid of replyIds) {
                            newItems.push({ type: 'commentRangeStart', id: rid });
                        }
                        newItems.push(item);
                        // Check if the next item is the other half of a replacement pair
                        // (adjacent del+ins with same author+date). If so, include it inside
                        // the comment range so we don't break del-ins adjacency.
                        const next = items[i + 1];
                        if (next &&
                            (next.type === 'insertion' || next.type === 'deletion') &&
                            next.type !== item.type &&
                            next.info.author === item.info.author &&
                            next.info.date === item.info.date) {
                            newItems.push(next);
                            i++; // skip the paired item
                        }
                        // Add commentRangeEnd AFTER both TC items
                        for (const rid of replyIds) {
                            newItems.push({ type: 'commentRangeEnd', id: rid });
                        }
                    }
                    else {
                        newItems.push(item);
                    }
                }
                block.content = newItems;
            }
            else if (block.type === 'table') {
                for (const row of block.rows) {
                    for (const cell of row.cells) {
                        walkBlocks(cell.content);
                    }
                }
            }
        }
    }
    walkBlocks(content);
}
const EMPTY_ANCHOR_POSITIONS = new Map();
/**
 * Find the Y position (relative to parentEl) of the element containing the given PM position.
 * Used by both the floating comment button and the context menu comment action.
 * Queries all elements with data-pm-start (spans, divs, imgs) — not just spans,
 * since table cell content may use div fragments.
 */
function findSelectionYPosition(scrollContainer, parentEl, pmPos) {
    if (!scrollContainer || !parentEl)
        return null;
    const pagesEl = scrollContainer.querySelector('.paged-editor__pages');
    if (!pagesEl)
        return null;
    for (const el of findBodyPmAnchors(pagesEl)) {
        const pmStart = Number(el.dataset.pmStart);
        const pmEnd = Number(el.dataset.pmEnd);
        if (pmPos >= pmStart && pmPos <= pmEnd) {
            return el.getBoundingClientRect().top - parentEl.getBoundingClientRect().top;
        }
    }
    return null;
}
function createComment(text, authorName, parentId) {
    return Object.assign({ id: nextCommentId++, author: authorName, date: new Date().toISOString(), content: [
            {
                type: 'paragraph',
                formatting: {},
                content: [{ type: 'run', formatting: {}, content: [{ type: 'text', text }] }],
            },
        ] }, (parentId !== undefined && { parentId }));
}
function getInitialSectionProperties(doc) {
    var _a, _b, _c, _d;
    const body = (_a = doc === null || doc === void 0 ? void 0 : doc.package) === null || _a === void 0 ? void 0 : _a.document;
    return (_d = (_c = (_b = body === null || body === void 0 ? void 0 : body.sections) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.properties) !== null && _d !== void 0 ? _d : body === null || body === void 0 ? void 0 : body.finalSectionProperties;
}
/**
 * Find the ProseMirror position range for a paragraph by Word `w14:paraId`.
 * Stable across edits — the inverse of `formatContentForLLM`'s `[paraId]` line tag.
 *
 * Returns inclusive `from` (position before the textblock) and exclusive `to`
 * (`from + nodeSize`). Text content lives in `[from + 1, to - 1]`.
 */
function findParaIdRange(doc, paraId) {
    if (!paraId || !paraId.trim())
        return null;
    let result = null;
    doc.descendants((node, pos) => {
        var _a;
        if (result !== null)
            return false;
        if (node.isTextblock && ((_a = node.attrs) === null || _a === void 0 ? void 0 : _a.paraId) === paraId) {
            result = { from: pos, to: pos + node.nodeSize };
            return false;
        }
        return true;
    });
    return result;
}
/**
 * Find a text string within a ProseMirror paragraph node range and return its positions.
 *
 * Returns null if:
 *   - searchText is empty
 *   - searchText is not found
 *   - searchText appears more than once (ambiguous; caller must disambiguate)
 *
 * The fullText is built from PM text nodes only and matches the vanilla view
 * the agent reads via `read_document` (the bridge passes includeTrackedChanges/
 * includeCommentAnchors=false): tracked insertions are excluded (not in the doc
 * yet), tracked deletions are included (still in the doc until accepted), and
 * comment markers are stripped.
 */
/**
 * Vanilla-view text of a single PM node (typically a paragraph): concatenates
 * descendant text node content, skipping any text inside an `insertion` mark.
 * Use this in any agent-facing read path so the agent's view of the document
 * matches what `add_comment` / `suggest_change` can anchor.
 */
function getVanillaNodeText(node) {
    const parts = [];
    node.descendants((child) => {
        if (!child.isText || !child.text)
            return true;
        if (child.marks.some((m) => m.type.name === 'insertion'))
            return false;
        parts.push(child.text);
        return true;
    });
    return parts.join('');
}
/**
 * Vanilla-view text between two doc positions. Same semantics as
 * `getVanillaNodeText`, but takes a PM position range so it can serve a
 * selection rather than a single node.
 */
function getVanillaTextBetween(doc, from, to) {
    if (from >= to)
        return '';
    const parts = [];
    doc.nodesBetween(from, to, (child, pos) => {
        if (!child.isText || !child.text)
            return;
        if (child.marks.some((m) => m.type.name === 'insertion'))
            return;
        const start = Math.max(from, pos);
        const end = Math.min(to, pos + child.text.length);
        if (start < end)
            parts.push(child.text.slice(start - pos, end - pos));
    });
    return parts.join('');
}
function findTextInPmParagraph(doc, paragraphFrom, paragraphTo, searchText) {
    if (!searchText)
        return null;
    let fullText = '';
    const textPositions = [];
    doc.nodesBetween(paragraphFrom, paragraphTo, (node, pos) => {
        if (!node.isText || !node.text)
            return;
        // Vanilla view: text inside an `insertion` mark isn't in the doc yet.
        if (node.marks.some((m) => m.type.name === 'insertion'))
            return;
        textPositions.push({ pos, len: node.text.length });
        fullText += node.text;
    });
    const firstMatch = fullText.indexOf(searchText);
    if (firstMatch === -1)
        return null;
    // Reject ambiguous searches — the LLM gets a clearer error than a silent mistarget.
    const secondMatch = fullText.indexOf(searchText, firstMatch + 1);
    if (secondMatch !== -1)
        return null;
    // Map string offset to PM position
    let charOffset = 0;
    let fromPos = paragraphFrom;
    let toPos = paragraphFrom;
    for (const tp of textPositions) {
        const segEnd = charOffset + tp.len;
        if (charOffset <= firstMatch && firstMatch < segEnd) {
            fromPos = tp.pos + (firstMatch - charOffset);
        }
        if (charOffset <= firstMatch + searchText.length && firstMatch + searchText.length <= segEnd) {
            toPos = tp.pos + (firstMatch + searchText.length - charOffset);
            break;
        }
        charOffset = segEnd;
    }
    return { from: fromPos, to: toPos };
}
/**
 * DocxEditor - Complete DOCX editor component
 */
export const DocxEditor = forwardRef(function DocxEditor({ documentBuffer, document: initialDocument, onSave, onExport, onNew, author = 'User', onChange, onSelectionChange, onError, versionBackend, onFontsLoaded: onFontsLoadedCallback, theme, chrome, onReady, 
// `chrome` sets the default UI level; an explicit show* prop still wins
// (destructuring defaults only apply when the prop is undefined). No
// chrome → "full" defaults, so existing consumers are unaffected.
showToolbar = chrome === 'none' ? false : true, showPanelRail = chrome === 'none' || chrome === 'minimal' ? false : true, showStatusBar = chrome === 'none' || chrome === 'minimal' ? false : true, showZoomControl = chrome === 'none' ? false : true, showMarginGuides: _showMarginGuides = false, marginGuideColor: _marginGuideColor, showRuler = false, rulerUnit = 'inch', initialZoom = 1.0, readOnly: readOnlyProp = false, disableFindReplaceShortcuts = false, toolbarExtra, className = '', style, placeholder, loadingIndicator, showOutline: showOutlineProp = false, 
// showOutlineButton is a vestigial prop (the outline now lives in the
// right-edge PanelRail); kept on the props type for API compatibility but no
// longer consumed here.
fontFamilies, showPrintButton = true, printOptions: _printOptions, onPrint, onCopy: _onCopy, onCut: _onCut, onPaste: _onPaste, mode: modeProp, onModeChange, onCommentAdd, onCommentResolve, onCommentDelete, onCommentReply, comments: commentsProp, onCommentsChange, externalPlugins, externalContent = false, footnoteSync, endnoteSync, propsSync, commentIdBase, onEditorViewReady, onRenderedDomContextReady, pluginOverlays, pluginSidebarItems, pluginRenderedDomContext, renderLogo, documentName, onDocumentNameChange, documentNameEditable = true, renderTitleBarRight, i18n, agentPanel, wordCompat = false, }, ref) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15;
    const { t } = useTranslation();
    // State
    const [state, setState] = useState({
        isLoading: !!documentBuffer && !externalContent,
        parseError: null,
        zoom: initialZoom,
        selectionFormatting: {},
        paragraphIndentLeft: 0,
        paragraphIndentRight: 0,
        paragraphFirstLineIndent: 0,
        paragraphHangingIndent: false,
        paragraphTabs: null,
        pmTableContext: null,
        pmImageContext: null,
        pmTextBoxContext: null,
    });
    // Table properties dialog state
    const [tablePropsOpen, setTablePropsOpen] = useState(false);
    // Bookmarks dialog state (Phase 1.5 U14)
    const [bookmarksDialogOpen, setBookmarksDialogOpen] = useState(false);
    // Character spacing dialog state (Phase 1.5 U1)
    const [characterSpacingDialogOpen, setCharacterSpacingDialogOpen] = useState(false);
    const [characterSpacingInitial, setCharacterSpacingInitial] = useState({ scale: null, spacing: null, position: null, kerning: null });
    // Paragraph dialog state (Phase 1.5 U5)
    const [paragraphDialogOpen, setParagraphDialogOpen] = useState(false);
    // Borders + Shading dialog state (Phase 1.5 U6)
    const [bordersShadingOpen, setBordersShadingOpen] = useState(false);
    const [bordersShadingInitial, setBordersShadingInitial] = useState({
        borders: {},
        shading: { fillHex: '', pattern: 'clear', patternColorHex: '' },
    });
    const [splitCellDialogState, setSplitCellDialogState] = useState({
        isOpen: false,
        initialRows: 1,
        initialCols: 2,
        minRows: 1,
        minCols: 1,
        source: null,
        /** Captured cell coordinates at dialog-open time (PM path) */
        capturedCellRow: null,
        capturedCellCol: null,
    });
    // Image position dialog state
    const [imagePositionOpen, setImagePositionOpen] = useState(false);
    // Image properties dialog state
    const [imagePropsOpen, setImagePropsOpen] = useState(false);
    // Footnote properties dialog state
    const [footnotePropsOpen, setFootnotePropsOpen] = useState(false);
    // Header/footer editing state
    const [hfEditPosition, setHfEditPosition] = useState(null);
    const [hfEditIsFirstPage, setHfEditIsFirstPage] = useState(false);
    // Document outline sidebar state
    const [showOutline, setShowOutline] = useState(showOutlineProp);
    const showOutlineRef = useRef(false);
    showOutlineRef.current = showOutline;
    const [outlineHeadings, setHeadingInfos] = useState([]);
    // Comments sidebar state
    const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
    // Wire-up batch (Docs parity #1.5): dialogs that already existed but
    // had no menu entry. Each is open/close + a trigger handler.
    const [insertSymbolOpen, setInsertSymbolOpen] = useState(false);
    // Ruler visibility override — once the user toggles it, this takes
    // precedence over the showRuler prop. Initialised from the prop.
    const [showRulerLocal, setShowRulerLocal] = useState(null);
    // Focus mode (Phase 5) — declared early so it can gate the ruler
    // (and any other chrome) without TDZ errors. The keydown handler +
    // chrome conditionals further below consume the same state.
    const [focusMode, setFocusMode] = useState(false);
    const showRulerEffective = (showRulerLocal !== null && showRulerLocal !== void 0 ? showRulerLocal : showRuler) && !focusMode;
    // Paint format (format painter) — when set, the next non-empty
    // selection will receive these marks. Esc cancels. Toolbar button
    // toggles between idle/armed.
    const [paintFormatMarks, setPaintFormatMarks] = useState(null);
    const paintFormatMarksRef = useRef(null);
    useEffect(() => {
        paintFormatMarksRef.current = paintFormatMarks;
    }, [paintFormatMarks]);
    const [expandedSidebarItem, setExpandedSidebarItem] = useState(null);
    // Version-history side-panel state (F1 mount). The hook owns the
    // capture plugin; attach it to the body PM view once it's mounted.
    // Comments + version-history are mutually exclusive — opening one
    // closes the other so the right rail doesn't double-stack panels.
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    // Version preview — when set, a read-only render of the selected
    // version covers the canvas (Google-Docs model). `previewShowChanges`
    // toggles the inline insertion/deletion overlay vs a clean snapshot.
    // The live editor + its Yjs/undo state are untouched: the preview is a
    // separate read-only editor, so nothing is broadcast to peers.
    const [versionPreview, setVersionPreview] = useState(null);
    const [previewShowChanges, setPreviewShowChanges] = useState(true);
    // Strict / paragraph-lock co-editing (collab-only). `available` is true
    // when the collab session wired the plugin into the body view;
    // `enabled` mirrors the plugin's on/off so the View-menu label is right.
    const [strictCoEditAvailable, setStrictCoEditAvailable] = useState(false);
    const [strictCoEditEnabled, setStrictCoEditEnabled] = useState(false);
    const [showProperties, setShowProperties] = useState(false);
    // Footnote text editor (opened by double-clicking a footnote at page bottom).
    const [noteEdit, setNoteEdit] = useState(null);
    // Pending footnote/endnote text edits (id → new text), applied to the save
    // document in handleSave so they persist regardless of doc-object identity.
    const footnoteEditsRef = useRef(new Map());
    const endnoteEditsRef = useRef(new Map());
    // Pending core-property edits, applied to the save document in handleSave.
    const propsEditsRef = useRef({});
    const editHistory = useEditHistory({ author: 'You' });
    // Shared toggle handlers — used by both the toolbar buttons and the
    // right-edge PanelRail so the mutual-exclusion logic between Comments
    // and Version history lives in one place. Declared up here (before any
    // conditional early-return) to keep React's hook order stable.
    // Tracks `comments.length` so the rail toggle can read it without
    // depending on the (still-undeclared at this hook order) `comments`
    // variable. Updated every render in an effect below.
    const commentsCountRef = useRef(0);
    const handleToggleComments = useCallback(() => {
        // Comments use the anchored-cards approach: each thread renders as a
        // card floating next to its commented text (UnifiedSidebar), not a
        // solid docked panel. On an empty doc there are no anchors to show, so
        // surface a toast hint instead of an empty panel.
        setShowCommentsSidebar((v) => {
            const next = !v;
            if (next && commentsCountRef.current === 0) {
                toast.info('No comments yet. Select text and click "Add comment" to start a thread.');
            }
            // One right-side surface at a time: opening comments closes the rest.
            if (next) {
                setShowVersionHistory(false);
                setShowProperties(false);
                setShowOutline(false);
            }
            return next;
        });
        setExpandedSidebarItem(null);
    }, []);
    const handleToggleVersionHistory = useCallback(() => {
        setShowVersionHistory((v) => {
            const next = !v;
            if (next) {
                setShowCommentsSidebar(false);
                setExpandedSidebarItem(null);
                setShowProperties(false);
                setShowOutline(false);
            }
            return next;
        });
    }, []);
    // Comments live in internal state by default; if the consumer passes
    // `comments` as a prop, we treat the editor as controlled — `setComments`
    // routes mutations through `onCommentsChange` instead of touching internal
    // state. Keeps the controlled/uncontrolled API symmetric with React inputs.
    const [internalComments, setInternalComments] = useState([]);
    const isControlledComments = commentsProp !== undefined;
    const comments = isControlledComments ? commentsProp : internalComments;
    // Mirror to the ref the rail toggle reads — kept in render, not in
    // an effect, so the very first click after a comment-state update
    // sees the right count.
    commentsCountRef.current = comments.length;
    // Latest PM state — mirrored from the view on every doc-changing transaction.
    // Drives `useTrackedChanges` so the sidebar derives its list directly from PM
    // (the source of truth, including remote ySync updates) rather than a debounced
    // copy in React state.
    const [pmState, setPmState] = useState(null);
    // Index of the heading whose section the cursor is currently in.
    // Recomputed from the live PM selection + the heading list whenever
    // either changes. The outline panel uses this to render the active-row
    // highlight (A2 of the parity pipeline). Declared here (after pmState)
    // because both inputs need to be in scope.
    const activeOutlineIndex = useMemo(() => {
        if (outlineHeadings.length === 0 || !pmState)
            return null;
        const cursor = pmState.selection.from;
        let active = null;
        for (let i = 0; i < outlineHeadings.length; i++) {
            if (outlineHeadings[i].pmPos <= cursor)
                active = i;
            else
                break;
        }
        return active;
    }, [outlineHeadings, pmState]);
    const { entries: trackedChanges, commentToRevision } = useTrackedChanges(pmState);
    const [anchorPositions, setAnchorPositions] = useState(EMPTY_ANCHOR_POSITIONS);
    // No separate state needed — pluginRenderedDomContext comes from PluginHost
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentSelectionRange, setCommentSelectionRange] = useState(null);
    const [addCommentYPosition, setAddCommentYPosition] = useState(null);
    const [editingModeInternal, setEditingModeInternal] = useState(modeProp !== null && modeProp !== void 0 ? modeProp : 'editing');
    const editingMode = modeProp !== null && modeProp !== void 0 ? modeProp : editingModeInternal;
    const setEditingMode = (mode) => {
        if (!modeProp)
            setEditingModeInternal(mode);
        onModeChange === null || onModeChange === void 0 ? void 0 : onModeChange(mode);
    };
    // Refs so the global keydown listener can read latest without re-binding.
    const editingModeRef = useRef(editingMode);
    useEffect(() => {
        editingModeRef.current = editingMode;
    }, [editingMode]);
    const setEditingModeRef = useRef(setEditingMode);
    useEffect(() => {
        setEditingModeRef.current = setEditingMode;
    });
    // 'viewing' mode acts as read-only
    const readOnly = readOnlyProp || editingMode === 'viewing';
    // Agent panel open state (uncontrolled fallback when `agentPanel.open` is undefined).
    const [agentPanelInternalOpen, setAgentPanelInternalOpen] = useState(false);
    const isAgentPanelControlled = (agentPanel === null || agentPanel === void 0 ? void 0 : agentPanel.open) !== undefined;
    const agentPanelOpen = !agentPanel
        ? false
        : isAgentPanelControlled
            ? !!agentPanel.open
            : agentPanelInternalOpen;
    const setAgentPanelOpen = useCallback((next) => {
        var _a;
        (_a = agentPanel === null || agentPanel === void 0 ? void 0 : agentPanel.onOpenChange) === null || _a === void 0 ? void 0 : _a.call(agentPanel, next);
        if (!isAgentPanelControlled)
            setAgentPanelInternalOpen(next);
    }, [agentPanel, isAgentPanelControlled]);
    // Accessed by the stable recomputeFloatingCommentBtn callback below.
    // Kept in sync below after that callback is declared.
    // Floating "add comment" button position (relative to scroll container, null = hidden)
    const [floatingCommentBtn, setFloatingCommentBtn] = useState(null);
    // Right-click context menu state
    const [contextMenu, setContextMenu] = useState({
        isOpen: false,
        position: { x: 0, y: 0 },
        hasSelection: false,
        cursorInTable: false,
        tableContext: null,
    });
    // Debounce timer for orphaned-comment cleanup (still needed: orphan detection
    // requires a post-edit settle so the user doesn't see comments vanish mid-edit).
    const cleanOrphanedCommentsTimerRef = useRef(null);
    const commentsRef = useRef(comments);
    commentsRef.current = comments;
    const isAddingCommentRef = useRef(isAddingComment);
    isAddingCommentRef.current = isAddingComment;
    const onCommentDeleteRef = useRef(onCommentDelete);
    onCommentDeleteRef.current = onCommentDelete;
    // Bridge / agent event subscribers — fan-out from the existing onChange and
    // onSelectionChange paths so multiple listeners (host app, MCP server, etc.)
    // can observe edits without competing for the single React prop.
    const contentChangeSubscribersRef = useRef(new Set());
    const selectionChangeSubscribersRef = useRef(new Set());
    const onCommentsChangeRef = useRef(onCommentsChange);
    onCommentsChangeRef.current = onCommentsChange;
    // Unified setter — routes to internal state in uncontrolled mode and/or to
    // the parent's onCommentsChange callback in controlled mode.
    //
    // In uncontrolled mode we mutate `commentsRef.current` synchronously
    // *before* queuing the React update so rapid sequential calls in the
    // same tick (e.g. an agent loop calling `addComment` 30 times back-to-
    // back) see the latest accumulated state. Without this, every functional
    // updater reads the same stale ref and only the last comment survives.
    //
    // In controlled mode the parent's prop is the source of truth — we don't
    // mutate the ref here because the parent might transform / reject the
    // value before echoing it back via `commentsProp`. The `commentsRef.current = comments`
    // assignment one effect above keeps the ref in sync with the prop.
    const setComments = useCallback((next) => {
        var _a;
        const resolved = typeof next === 'function'
            ? next(commentsRef.current)
            : next;
        if (resolved === commentsRef.current)
            return;
        if (!isControlledComments) {
            commentsRef.current = resolved;
            setInternalComments(resolved);
        }
        (_a = onCommentsChangeRef.current) === null || _a === void 0 ? void 0 : _a.call(onCommentsChangeRef, resolved);
    }, [isControlledComments]);
    // Thread comments under their overlapping tracked change (parentId = revisionId).
    // The overlap map is computed in the same doc walk as `extractTrackedChanges`
    // so we don't pay for a second descendants() pass per transaction.
    useEffect(() => {
        if (commentToRevision.size === 0)
            return;
        setComments((prev) => {
            let changed = false;
            const updated = prev.map((c) => {
                if (c.parentId != null)
                    return c; // already threaded
                const rid = commentToRevision.get(c.id);
                if (rid != null) {
                    changed = true;
                    return Object.assign(Object.assign({}, c), { parentId: rid });
                }
                return c;
            });
            return changed ? updated : prev;
        });
    }, [commentToRevision, setComments]);
    // Remove comments whose marks no longer exist in the document
    const cleanOrphanedComments = useCallback(() => {
        var _a, _b;
        if (isAddingCommentRef.current)
            return;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const { doc, schema } = view.state;
        const commentMarkType = schema.marks.comment;
        if (!commentMarkType)
            return;
        const liveIds = new Set();
        doc.descendants((node) => {
            for (const mark of node.marks) {
                if (mark.type === commentMarkType) {
                    const id = mark.attrs.commentId;
                    if (id !== PENDING_COMMENT_ID)
                        liveIds.add(id);
                }
            }
        });
        const currentComments = commentsRef.current;
        const orphanedIds = new Set();
        for (const c of currentComments) {
            if (c.parentId == null && !liveIds.has(c.id)) {
                orphanedIds.add(c.id);
            }
        }
        if (orphanedIds.size === 0)
            return;
        for (const c of currentComments) {
            if (orphanedIds.has(c.id))
                (_b = onCommentDeleteRef.current) === null || _b === void 0 ? void 0 : _b.call(onCommentDeleteRef, c);
        }
        setComments((prev) => prev.filter((c) => !orphanedIds.has(c.id) && !orphanedIds.has(c.parentId)));
    }, []);
    // Clean up debounce timers on unmount
    useEffect(() => {
        return () => {
            if (cleanOrphanedCommentsTimerRef.current) {
                clearTimeout(cleanOrphanedCommentsTimerRef.current);
            }
        };
    }, []);
    // Sync outline visibility when prop changes
    useEffect(() => {
        var _a;
        setShowOutline(showOutlineProp);
        if (showOutlineProp) {
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view) {
                setHeadingInfos(collectHeadings(view.state.doc));
            }
        }
    }, [showOutlineProp]);
    // History hook for undo/redo - start with null document
    const history = useDocumentHistory(initialDocument || null, {
        maxEntries: 100,
        groupingInterval: 500,
        enableKeyboardShortcuts: true,
    });
    // Extract comments from document model on initial load
    const commentsLoadedRef = useRef(false);
    useEffect(() => {
        var _a, _b, _c;
        if (commentsLoadedRef.current)
            return;
        const doc = history.state;
        if (!doc)
            return;
        const bodyComments = (_b = (_a = doc.package) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.comments;
        if (bodyComments && bodyComments.length > 0) {
            setComments(bodyComments);
            setShowCommentsSidebar(true);
            commentsLoadedRef.current = true;
            // Ensure nextCommentId is above all loaded comment IDs AND tracked change
            // revisionIds to avoid collisions (they share the same ID space in OOXML)
            let maxId = bodyComments.reduce((max, c) => Math.max(max, c.id), 0);
            // Also check tracked change revisionIds from the PM document
            const view = (_c = pagedEditorRef.current) === null || _c === void 0 ? void 0 : _c.getView();
            if (view) {
                view.state.doc.descendants((node) => {
                    for (const mark of node.marks) {
                        if (mark.attrs.revisionId != null) {
                            maxId = Math.max(maxId, mark.attrs.revisionId);
                        }
                    }
                });
            }
            // Bump past the document's existing IDs and (if set) past the
            // collab partition base.
            const partition = commentIdBase !== null && commentIdBase !== void 0 ? commentIdBase : 0;
            bumpNextCommentIdAtLeast(Math.max(maxId, partition) + 1);
        }
    }, [history.state, commentIdBase]);
    // Apply commentIdBase on mount and whenever it changes — independent
    // of doc-load, since collab rooms can seed from createEmptyDocument()
    // (no comments → load-time bump never fires; both peers would start
    // at 1 without this).
    useEffect(() => {
        if (commentIdBase !== undefined) {
            bumpNextCommentIdAtLeast(commentIdBase + 1);
        }
    }, [commentIdBase]);
    // Extension manager — built once, provides schema + plugins + commands.
    //
    // When content is driven by an external CRDT (Yjs collab via
    // `externalContent` + a `yUndoPlugin` in `externalPlugins`), undo/redo
    // is owned by y-prosemirror's yUndoPlugin. Running the native
    // prosemirror-history alongside it is the documented y-prosemirror
    // footgun: native Ctrl+Z operates on the local EditorState's history and
    // can revert *other* users' changes, desyncing the shared Y.Doc. Disable
    // native history when content is external so undo stays scoped to the
    // local user. (Read once at mount — collab-ness is fixed for the
    // editor's lifetime; the schema must stay stable, hence the empty deps.)
    const extensionManager = useMemo(() => {
        const mgr = new ExtensionManager(createStarterKit(externalContent ? { disable: ['history'] } : {}));
        mgr.buildSchema();
        mgr.initializeRuntime();
        return mgr;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Suggestion mode plugin — merged with external plugins
    const suggestionPlugin = useMemo(() => createSuggestionModePlugin(editingMode === 'suggesting', author), [] // eslint-disable-line react-hooks/exhaustive-deps
    );
    const allExternalPlugins = useMemo(() => [suggestionPlugin, ...(externalPlugins !== null && externalPlugins !== void 0 ? externalPlugins : [])], [suggestionPlugin, externalPlugins]);
    // Refs
    const pagedEditorRef = useRef(null);
    const previewEditorRef = useRef(null);
    const previewScrollRef = useRef(null);
    const hfEditorRef = useRef(null);
    const agentRef = useRef(null);
    const containerRef = useRef(null);
    // Save the last known selection for restoring after toolbar interactions
    const lastSelectionRef = useRef(null);
    const imageInputRef = useRef(null);
    const docxInputRef = useRef(null);
    const editorContentRef = useRef(null);
    const scrollContainerRef = useRef(null);
    // True while a ruler margin marker is being dragged. Threaded to PagedEditor
    // so its post-reflow scroll-restore freezes the viewport instead of chasing
    // the moved content (which made the page scroll out from under the marker).
    const marginDraggingRef = useRef(false);
    const toolbarWrapperRef = useRef(null);
    const toolbarRoRef = useRef(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);
    // Horizontal scroll offset of the editor scroll container. Used to pin the
    // vertical ruler to the viewport's left edge during horizontal scroll
    // (`position: sticky` won't work — it only kicks in after scrolling past the
    // element's natural position, but we want the ruler at left=0 from the
    // start). The horizontal ruler scrolls natively via sticky-top.
    const [editorScrollLeft, setEditorScrollLeft] = useState(0);
    // Keep history.state accessible in stable callbacks without stale closures
    const historyStateRef = useRef(history.state);
    historyStateRef.current = history.state;
    // F1: attach the edit-history capture plugin once the body PM view is
    // ready. `pmState != null` flips false→true exactly when the view is
    // first available; subsequent state changes don't re-trigger the
    // effect since the dep is a boolean. attach() returns a cleanup that
    // detaches the plugin on unmount.
    const isBodyPmReady = pmState != null;
    const editHistoryAttach = editHistory.attach;
    // Hold the EditorView in state so child components (notably the
    // version-history capture hook) can depend on it via a stable
    // identity. Set once the body PM is ready.
    const [bodyView, setBodyView] = useState(null);
    useEffect(() => {
        var _a, _b;
        if (!isBodyPmReady) {
            setBodyView(null);
            return;
        }
        const view = (_b = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView()) !== null && _b !== void 0 ? _b : null;
        setBodyView(view);
        if (!view)
            return;
        return editHistoryAttach(view);
    }, [isBodyPmReady, editHistoryAttach]);
    // Coarse-grained, IDB-persisted snapshot capture (Versions tab feed).
    // Scoped by document name — matches recent-files identity. Manual
    // entries via the panel's "Save version…" button; auto entries every
    // 10 min while dirty.
    const versionCapture = useVersionHistoryCapture({
        docId: (documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'Untitled',
        view: bodyView,
    });
    // Restore a snapshot's PM doc JSON into the live editor. Mirrors
    // useEditHistory.revert's transaction shape so Ctrl+Z can undo a
    // restore.
    const handleRestoreSnapshot = useCallback((data) => {
        const view = bodyView;
        if (!view)
            return;
        try {
            const node = view.state.schema.nodeFromJSON(data);
            const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, node.content);
            view.dispatch(tr);
        }
        catch (err) {
            console.warn('[version-history] restore failed', err);
        }
    }, [bodyView]);
    // Open the in-canvas preview for a version. Carries the already-
    // resolved PM JSON (local snapshots hold their `data` in the list) and
    // the previous version's JSON for the show-changes diff.
    const handlePreviewVersion = useCallback((req) => {
        setPreviewShowChanges(true);
        setVersionPreview(req);
    }, []);
    const handleClosePreview = useCallback(() => setVersionPreview(null), []);
    const handleRestoreFromPreview = useCallback(() => {
        if (versionPreview)
            handleRestoreSnapshot(versionPreview.data);
        setVersionPreview(null);
    }, [versionPreview, handleRestoreSnapshot]);
    // Detect whether the collab session wired the Strict co-editing plugin
    // into the body view (only then does the View-menu toggle appear).
    useEffect(() => {
        var _a, _b;
        if (!isBodyPmReady) {
            setStrictCoEditAvailable(false);
            return;
        }
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        const ps = view ? strictCoEditingKey.getState(view.state) : undefined;
        setStrictCoEditAvailable(!!ps);
        setStrictCoEditEnabled((_b = ps === null || ps === void 0 ? void 0 : ps.enabled) !== null && _b !== void 0 ? _b : false);
    }, [isBodyPmReady]);
    const handleToggleStrictCoEditing = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const next = !isStrictCoEditingEnabled(view.state);
        setStrictCoEditing(next)(view.state, view.dispatch);
        setStrictCoEditEnabled(next);
    }, []);
    // Build the read-only preview Document: annotate the version's doc with
    // insertion/deletion marks (when Show changes is on), then convert to a
    // Document inheriting the live doc's sections/headers/footers so the
    // preview paints with the same page chrome. Built with the live schema
    // so `nodeFromJSON` resolves the same node/mark types.
    const previewDocument = useMemo(() => {
        var _a;
        if (!versionPreview)
            return null;
        const schema = bodyView === null || bodyView === void 0 ? void 0 : bodyView.state.schema;
        if (!schema)
            return null;
        try {
            const node = previewShowChanges
                ? buildVersionDiffDoc(versionPreview.previousData, versionPreview.data, schema, {
                    author: versionPreview.author,
                    date: new Date(versionPreview.savedAt).toISOString(),
                }).doc
                : schema.nodeFromJSON(versionPreview.data);
            return fromProseDoc(node, (_a = history.state) !== null && _a !== void 0 ? _a : undefined);
        }
        catch (err) {
            console.warn('[version-preview] failed to build preview doc', err);
            return null;
        }
    }, [versionPreview, previewShowChanges, bodyView, history.state]);
    // Long-sentence highlighter — Hemingway-style amber + yellow inline
    // decorations for sentences > 25/35 words. Attached once on view
    // ready; the meta-tagged toggle effect below flips its `enabled`
    // flag when the user changes the status-bar pref.
    const statPrefsForReadability = useStatPrefs();
    useEffect(() => {
        var _a;
        if (!isBodyPmReady)
            return;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const plugin = readabilityPlugin(statPrefsForReadability.prefs.readability);
        const next = view.state.reconfigure({
            plugins: [...view.state.plugins, plugin],
        });
        view.updateState(next);
        return () => {
            try {
                const without = view.state.reconfigure({
                    plugins: view.state.plugins.filter((p) => p !== plugin),
                });
                view.updateState(without);
            }
            catch (_a) {
                // View may be on its way out — ignore.
            }
        };
        // Intentionally exclude `statPrefsForReadability.prefs.readability`
        // from the deps. The toggle effect below uses a meta-tagged
        // transaction to flip enabled without tearing down the plugin.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBodyPmReady]);
    useEffect(() => {
        var _a;
        if (!isBodyPmReady)
            return;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const tr = view.state.tr.setMeta(READABILITY_PLUGIN_KEY, {
            enabled: statPrefsForReadability.prefs.readability,
        });
        view.dispatch(tr);
    }, [statPrefsForReadability.prefs.readability, isBodyPmReady]);
    // Word + character counts for the status bar. Derived from the live
    // ProseMirror doc (not `history.state` — that only refreshes on major
    // lifecycle events like open / save / autosave, so the count stayed
    // stale during typing + undo / redo). Walks every text node via
    // `descendants` and stitches text fragments. Recomputes whenever
    // `pmState` flips, which `onSelectionChange` and the post-load effect
    // already drive on every transaction.
    const { wordCount, charCount, charCountWithSpaces, paragraphCount, docPlainText } = useMemo(() => {
        if (!pmState) {
            return {
                wordCount: undefined,
                charCount: undefined,
                charCountWithSpaces: undefined,
                paragraphCount: undefined,
                docPlainText: '',
            };
        }
        const paraTexts = [];
        pmState.doc.descendants((node) => {
            if (node.type.name === 'paragraph') {
                paraTexts.push(node.textContent);
                return false;
            }
            return true;
        });
        const text = paraTexts.join('\n');
        const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
        // Word's "characters (with spaces)" includes the joined newlines
        // implicit between paragraphs. Mirror Word: count whitespace
        // collapsed into a single space per paragraph break.
        const charsWith = text.length;
        // "characters (no spaces)" matches Word's convention.
        const chars = text.replace(/\s/g, '').length;
        const paragraphs = paraTexts.filter((p) => p.trim().length > 0).length;
        return {
            wordCount: words,
            charCount: chars,
            charCountWithSpaces: charsWith,
            paragraphCount: paragraphs,
            // Status bar's readability cell wants the joined plain text so
            // it can run sentence + Flesch-Kincaid heuristics. Reusing the
            // same walk avoids a second descendants() pass per render.
            docPlainText: text,
        };
    }, [pmState]);
    // Track current border color/width for border presets (like Google Docs)
    const borderSpecRef = useRef({ style: 'single', size: 4, color: { rgb: '000000' } });
    // Cache style resolver to avoid recreating on every selection change
    const styleResolverCacheRef = useRef(null);
    const getCachedStyleResolver = useCallback((styles) => {
        const cached = styleResolverCacheRef.current;
        if (cached && cached.styles === styles) {
            return cached.resolver;
        }
        const resolver = createStyleResolver(styles);
        styleResolverCacheRef.current = { styles, resolver };
        return resolver;
    }, []);
    // Scroll-based page indicator (Google Docs style)
    const [scrollPageInfo, setScrollPageInfo] = useState({ currentPage: 1, totalPages: 1, visible: false });
    const scrollFadeTimerRef = useRef(null);
    // Measure toolbar height for positioning the outline panel below it
    const toolbarRefCallback = useCallback((el) => {
        toolbarWrapperRef.current = el;
        // Clean up previous observer
        if (toolbarRoRef.current) {
            toolbarRoRef.current.disconnect();
            toolbarRoRef.current = null;
        }
        if (!el) {
            setToolbarHeight(0);
            return;
        }
        setToolbarHeight(el.offsetHeight);
        const ro = new ResizeObserver(() => {
            setToolbarHeight(el.offsetHeight);
        });
        ro.observe(el);
        toolbarRoRef.current = ro;
    }, []);
    // Cleanup ResizeObserver on unmount
    useEffect(() => {
        return () => {
            var _a;
            (_a = toolbarRoRef.current) === null || _a === void 0 ? void 0 : _a.disconnect();
        };
    }, []);
    // Track horizontal scroll so the outline panel and toggle button slide
    // with the doc instead of staying pinned. Re-runs after the loading state
    // flips because the scroll container only mounts once the doc is ready.
    // Updates are coalesced to one per frame — scroll events fire faster than
    // React can re-render the whole editor tree.
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el)
            return;
        let frame = 0;
        const update = () => {
            frame = 0;
            setEditorScrollLeft(el.scrollLeft);
        };
        const onScroll = () => {
            if (frame === 0)
                frame = requestAnimationFrame(update);
        };
        update();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            if (frame !== 0)
                cancelAnimationFrame(frame);
        };
    }, [state.isLoading]);
    // Helper to get the active editor's view — returns HF editor view when in HF editing mode
    const getActiveEditorView = useCallback(() => {
        var _a;
        if (hfEditPosition && hfEditorRef.current) {
            return hfEditorRef.current.getView();
        }
        return (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
    }, [hfEditPosition]);
    // Helper to focus the active editor
    const focusActiveEditor = useCallback(() => {
        var _a;
        if (hfEditPosition && hfEditorRef.current) {
            hfEditorRef.current.focus();
        }
        else {
            (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [hfEditPosition]);
    // Helper to undo in the active editor
    const undoActiveEditor = useCallback(() => {
        var _a;
        if (hfEditPosition && hfEditorRef.current) {
            hfEditorRef.current.undo();
        }
        else {
            (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.undo();
        }
    }, [hfEditPosition]);
    // Helper to redo in the active editor
    const redoActiveEditor = useCallback(() => {
        var _a;
        if (hfEditPosition && hfEditorRef.current) {
            hfEditorRef.current.redo();
        }
        else {
            (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.redo();
        }
    }, [hfEditPosition]);
    const canUndoActiveEditor = useMemo(() => {
        const view = getActiveEditorView();
        return view ? pmUndo(view.state) : false;
    }, [getActiveEditorView, state.selectionFormatting, hfEditPosition]);
    const canRedoActiveEditor = useMemo(() => {
        const view = getActiveEditorView();
        return view ? pmRedo(view.state) : false;
    }, [getActiveEditorView, state.selectionFormatting, hfEditPosition]);
    // Find/Replace hook
    const findReplace = useFindReplace();
    // Hyperlink dialog hook
    const hyperlinkDialog = useHyperlinkDialog();
    // Page setup dialog state
    const [showPageSetup, setShowPageSetup] = useState(false);
    const handleOpenPageSetup = useCallback(() => setShowPageSetup(true), []);
    // File → Properties dialog state.
    const [showFileProperties, setShowFileProperties] = useState(false);
    const handleOpenFileProperties = useCallback(() => setShowFileProperties(true), []);
    // Word count dialog state (Ctrl+Shift+C, also surfaced via Edit menu).
    const [showWordCount, setShowWordCount] = useState(false);
    const handleOpenWordCount = useCallback(() => setShowWordCount(true), []);
    // Voice typing — inserts recognized text at the active editor's
    // cursor. The hook owns the SpeechRecognition lifecycle; we just
    // give it an insertion sink + render the floating indicator.
    const voiceTyping = useVoiceTyping({
        onFinalText: (text) => {
            const view = getActiveEditorView();
            if (!view)
                return;
            // Append a leading space when the cursor is mid-text and the
            // previous char isn't whitespace — Web Speech doesn't emit
            // leading whitespace between continuous sessions, so without
            // this two consecutive utterances would jam together.
            const { from } = view.state.selection;
            const prevChar = from > 0 ? view.state.doc.textBetween(from - 1, from, ' ', ' ') : '';
            const insert = prevChar && !/\s/.test(prevChar) ? ' ' + text : text;
            view.dispatch(view.state.tr.insertText(insert, from));
        },
    });
    const handleToggleVoiceTyping = useCallback(() => {
        voiceTyping.toggle();
    }, [voiceTyping]);
    // Help → About dialog state.
    const [showAbout, setShowAbout] = useState(false);
    const handleShowAbout = useCallback(() => setShowAbout(true), []);
    const handleReportBug = useCallback(() => {
        void import('./report-bug').then((m) => m.openBugReport());
    }, []);
    // Command palette state (⌘⇧P / Ctrl+Shift+P). Searchable list of every
    // menu action, sourced from the same callbacks the menus use.
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
    const [showEquationDialog, setShowEquationDialog] = useState(false);
    // Equation dialog prefill — empty for a new insert, or the selected math
    // node's LaTeX/display when editing an existing equation.
    const [equationInitial, setEquationInitial] = useState({ latex: '', display: 'inline' });
    const [showAccessibility, setShowAccessibility] = useState(false);
    const [accessibilityIssues, setAccessibilityIssues] = useState([]);
    // Building blocks (C6): persisted snippet list + a snapshot of whatever
    // the editor selection contained at the moment the dialog opened, so
    // saving works even after focus has shifted to the dialog input.
    const [showBuildingBlocks, setShowBuildingBlocks] = useState(false);
    const [buildingBlocks, setBuildingBlocks] = useState(() => loadBuildingBlocks());
    const [pendingBuildingBlock, setPendingBuildingBlock] = useState(null);
    // A4 — dictionary lookup. Captures the selected word at open time so
    // the dialog can show "looking up <word>" loading state without a
    // re-fetch on every render.
    const [showDictionary, setShowDictionary] = useState(false);
    const [dictionaryWord, setDictionaryWord] = useState(null);
    // A5 — translate selection. Captures the selection text at open time.
    // `translateRange` is also captured when the dialog is opened from
    // the editor's right-click menu so the Replace button can target the
    // exact span the user selected, even if the cursor moves while the
    // dialog is up.
    const [showTranslate, setShowTranslate] = useState(false);
    const [translateText, setTranslateText] = useState(null);
    const [translateRange, setTranslateRange] = useState(null);
    // Whole-document translate-and-export dialog. Separate from the
    // selection dialog above because its action (download a translated
    // copy) is distinct from "replace selection in-place".
    const [showTranslateDocument, setShowTranslateDocument] = useState(false);
    // Writing Assistant — sheet + rail entry. Boots the controller on
    // mount so capability checks + auto-load run before the sheet opens.
    const [showWritingAssistant, setShowWritingAssistant] = useState(false);
    const [showChatPanel, setShowChatPanel] = useState(false);
    useEffect(() => {
        void bootWriterController();
    }, []);
    // Right-side panel mutex. Google Docs / Microsoft Word only ever
    // expose ONE right-edge panel at a time (Comments XOR Outline,
    // Activity XOR Editor) — letting our four AI panels + version
    // history all stack at 340 px each would squeeze the doc to nothing.
    // Each opener closes the other three; an AI rewrite trigger also
    // wins exclusivity so the suggestion panel doesn't compete for the
    // same slot the user just opened chat in.
    //
    // Version history additionally closes the comments sidebar (mirrors
    // `handleToggleVersionHistory`'s historical behaviour — those two
    // share the right-margin slot).
    const openRightPanel = useCallback((which) => {
        setShowWritingAssistant(which === 'writer');
        setShowChatPanel(which === 'chat');
        setShowVersionHistory(which === 'history');
        setShowProperties(which === 'properties');
        // Only ONE right-side surface is ever open: outline (TOC), comments,
        // properties, history. Opening any of the docked panels closes the
        // others (outline included — it was previously left open alongside).
        if (which !== 'none') {
            setShowCommentsSidebar(false);
            setExpandedSidebarItem(null);
            setShowOutline(false);
        }
        if (which !== 'aiSuggestion')
            setAiSuggestion(null);
    }, []);
    // Smart paste — after the user pastes tabular content (TSV / CSV)
    // the editor surfaces a sonner toast offering one-click conversion
    // to a real table. Detection is strict (see `detectTabular`) so
    // ordinary prose paste doesn't trigger the prompt.
    useEffect(() => {
        const onPaste = (e) => {
            var _a, _b;
            const view = getActiveEditorView();
            if (!view)
                return;
            const target = e.target;
            if (!target || !view.dom.contains(target))
                return;
            const text = (_b = (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/plain')) !== null && _b !== void 0 ? _b : '';
            const shape = detectTabular(text);
            if (!shape)
                return;
            const sizeBefore = view.state.doc.content.size;
            // Wait one tick for PM to apply its paste transaction, then
            // grab the inserted range from the doc-size delta. The
            // selection collapses to the right edge of the inserted slice
            // after PM applies the paste.
            requestAnimationFrame(() => {
                const live = getActiveEditorView();
                if (!live)
                    return;
                const sizeAfter = live.state.doc.content.size;
                const inserted = sizeAfter - sizeBefore;
                if (inserted <= 0)
                    return;
                const to = live.state.selection.head;
                const from = Math.max(0, to - inserted);
                toast.message(`Pasted data looks like a ${shape.rows} × ${shape.columns} table.`, {
                    duration: 8000,
                    action: {
                        label: 'Convert to table',
                        onClick: () => {
                            const v = getActiveEditorView();
                            if (!v)
                                return;
                            v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, from, to)));
                            convertSelectionToTable(v);
                        },
                    },
                });
            });
        };
        document.addEventListener('paste', onPaste);
        return () => document.removeEventListener('paste', onPaste);
    }, [getActiveEditorView]);
    const aiAbortRef = useRef(null);
    const aiFragmentRef = useRef(null);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    // Inline preview popover proposal — the structured draft produced by
    // a chat-driven tool (insertTable, future rewrite/outline/translate).
    // Per the AI-editor research (`docs/internal/11-ai-editor-research.md`)
    // chat panels NEVER mutate the doc; mutations land here as a preview
    // the user must explicitly Replace / Insert below / Try again /
    // Discard.
    const [activeProposal, setActiveProposal] = useState(null);
    // Captures the prompt that produced the active proposal — used by
    // the popover's "Try again" refine flow to re-run the pipeline with
    // the original intent + a follow-up instruction ("make it
    // chronological"). Mirrors Notion's "Tell AI what to do next".
    const [lastProposalPrompt, setLastProposalPrompt] = useState('');
    const [proposalBusy, setProposalBusy] = useState(false);
    // Tracks whether the active editor view currently has a non-empty
    // selection. Drives `<SelectionAskAi>`'s visibility — the Notion-style
    // floating "Ask AI" pill anchored above the selection.
    const [hasTextSelection, setHasTextSelection] = useState(false);
    // Busy gate while a selection-prompt request is in flight, so the
    // user can't queue a second request while the first runs.
    const [askAiBusy, setAskAiBusy] = useState(false);
    useEffect(() => {
        const listener = (sel) => {
            setHasTextSelection(!!(sel === null || sel === void 0 ? void 0 : sel.hasSelection));
        };
        selectionChangeSubscribersRef.current.add(listener);
        return () => {
            selectionChangeSubscribersRef.current.delete(listener);
        };
    }, []);
    // A3 — explore (Wikipedia lookup). Seeds the query from the selection.
    const [showExplore, setShowExplore] = useState(false);
    const [exploreQuery, setExploreQuery] = useState(null);
    // A6 v0 — citations manager. Local-only storage.
    const [showCitations, setShowCitations] = useState(false);
    const [citations, setCitations] = useState(() => loadCitations());
    // Editor preferences — smart quotes / autocorrect runtime toggles.
    // Lazy-init from localStorage and hydrate the core singleton so the
    // smart-quotes/autocorrect plugins see the persisted values on the very
    // first keystroke, not just after a re-render.
    const [preferences, setPreferences] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = window.localStorage.getItem('docx-editor-prefs');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (typeof parsed.smartQuotes === 'boolean') {
                        editorPreferences.smartQuotes = parsed.smartQuotes;
                    }
                    if (typeof parsed.autocorrect === 'boolean') {
                        editorPreferences.autocorrect = parsed.autocorrect;
                    }
                }
            }
            catch (_a) {
                // Corrupted localStorage — fall through to defaults.
            }
        }
        return Object.assign({}, editorPreferences);
    });
    // Spell-suggestions popover — shown when the user right-clicks on a
    // misspelled word. Captures the underlying PM range so the picked
    // replacement can be dispatched directly.
    const [spellMenu, setSpellMenu] = useState(null);
    // Spell-check runtime toggle. Off by default — the ~500 KB Hunspell
    // dictionary downloads lazily the first time the user flips this on.
    // Persisted to localStorage so the choice survives reloads.
    const SPELLCHECK_KEY = 'docx-editor-spellcheck-enabled';
    const [spellOn, setSpellOn] = useState(() => {
        if (typeof window === 'undefined')
            return false;
        try {
            return window.localStorage.getItem(SPELLCHECK_KEY) === '1';
        }
        catch (_a) {
            return false;
        }
    });
    useEffect(() => {
        // Register the React-side checker with the core extension exactly
        // once. The injection is module-level so HMR-safe — every reload
        // overwrites the same singleton.
        setSpellChecker(getSpellCheckerImpl());
        return () => {
            setSpellChecker(null);
        };
    }, []);
    const handlePreferenceChange = useCallback((key, value) => {
        setEditorPreference(key, value);
        setPreferences((prev) => {
            const next = Object.assign(Object.assign({}, prev), { [key]: value });
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem('docx-editor-prefs', JSON.stringify(next));
                }
                catch (_a) {
                    // Quota exceeded / private mode — fail silently; runtime
                    // setting still applies for the current session.
                }
            }
            return next;
        });
    }, []);
    // Color theme: 'auto' (follow OS) | 'light' | 'dark'. Persisted in
    // localStorage. The @schnsrw/design-system tokens are manual-only — they
    // only define a [data-theme='dark'] override, with no prefers-color-scheme
    // fallback — so 'auto' is resolved to a concrete 'light'/'dark' attribute
    // in JS (resolveColorTheme below) and a single [data-theme='dark'] selector
    // drives both the DS palette and the editor chrome.
    const [colorTheme, setColorTheme] = useState(() => {
        if (typeof window === 'undefined')
            return 'auto';
        const stored = window.localStorage.getItem('casual-editor:color-theme');
        return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
    });
    // Resolve the user's choice to the concrete value the CSS keys off of:
    // 'auto' follows the OS via matchMedia, everything else passes through.
    const resolveColorTheme = useCallback((choice) => {
        if (choice !== 'auto')
            return choice;
        if (typeof window === 'undefined' || !window.matchMedia)
            return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);
    // Apply the *initial* theme synchronously on mount so the attribute is set
    // before the first paint (no flash). Also tag the document with
    // data-app="docs" so the DS swaps in the docs cyan accent ramp.
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        document.documentElement.setAttribute('data-app', 'docs');
        document.documentElement.setAttribute('data-theme', resolveColorTheme(colorTheme));
        // Only on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // While the user's choice is 'auto', track OS theme changes live so the
    // chrome flips with the system without a reload.
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia)
            return;
        if (colorTheme !== 'auto')
            return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            document.documentElement.setAttribute('data-theme', mql.matches ? 'dark' : 'light');
        };
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [colorTheme]);
    // Update the data-theme attribute synchronously in the click handler so
    // the CSS recalc happens immediately, without waiting for React's
    // commit phase + useEffect. The setState below only drives the icon
    // re-render in the title bar.
    const handleSetColorTheme = useCallback((t) => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', resolveColorTheme(t));
        }
        try {
            window.localStorage.setItem('casual-editor:color-theme', t);
        }
        catch (_a) {
            // localStorage may be unavailable (private mode); harmless.
        }
        setColorTheme(t);
    }, [resolveColorTheme]);
    // Hyperlink popup state (Google Docs-style floating popup on link click)
    const [hyperlinkPopupData, setHyperlinkPopupData] = useState(null);
    // Monotonically increasing generation counter to discard stale async loads
    const loadGenerationRef = useRef(0);
    // Real on-disk byte size of the most recently loaded document (Properties).
    const loadedSizeRef = useRef(null);
    // Reset internal state when loading a new document (clears stale refs, comments, tracked changes, etc.)
    const resetForNewDocument = useCallback(() => {
        commentsLoadedRef.current = false;
        trackedChangesLoadedRef.current = false;
        setComments([]);
        setHeadingInfos([]);
        setShowCommentsSidebar(false);
        setIsAddingComment(false);
        setCommentSelectionRange(null);
        setAddCommentYPosition(null);
        setFloatingCommentBtn(null);
        setHfEditPosition(null);
        setAnchorPositions(EMPTY_ANCHOR_POSITIONS);
        findReplace.setMatches([], 0);
        if (cleanOrphanedCommentsTimerRef.current) {
            clearTimeout(cleanOrphanedCommentsTimerRef.current);
            cleanOrphanedCommentsTimerRef.current = null;
        }
    }, [findReplace.setMatches, setComments]);
    // Load a pre-parsed document (used by ref method and internally)
    const loadParsedDocument = useCallback((doc) => {
        resetForNewDocument();
        history.reset(doc);
        setState((prev) => (Object.assign(Object.assign({}, prev), { isLoading: false, parseError: null })));
        loadDocumentFonts(doc).catch((err) => {
            console.warn('Failed to load document fonts:', err);
        });
    }, [resetForNewDocument, history]);
    // Load a DOCX buffer (used by ref method and internally)
    const loadBuffer = useCallback((buffer) => __awaiter(this, void 0, void 0, function* () {
        // Capture the REAL on-disk size of the loaded bytes (not an in-memory
        // serialization estimate) for the Properties dialog.
        loadedSizeRef.current =
            buffer instanceof Blob
                ? buffer.size
                : buffer instanceof ArrayBuffer
                    ? buffer.byteLength
                    : ArrayBuffer.isView(buffer)
                        ? buffer.byteLength
                        : null;
        const generation = ++loadGenerationRef.current;
        resetForNewDocument();
        // Loading a fresh buffer wipes the prior edit state, so the new
        // document starts clean.
        markDirty(false);
        setState((prev) => (Object.assign(Object.assign({}, prev), { isLoading: true, parseError: null })));
        try {
            const doc = yield parseDocx(buffer);
            // Discard result if a newer load was started while we were parsing
            if (loadGenerationRef.current !== generation)
                return;
            loadParsedDocument(doc);
        }
        catch (error) {
            if (loadGenerationRef.current !== generation)
                return;
            const message = error instanceof Error ? error.message : 'Failed to parse document';
            setState((prev) => (Object.assign(Object.assign({}, prev), { isLoading: false, parseError: message })));
            onError === null || onError === void 0 ? void 0 : onError(error instanceof Error ? error : new Error(message));
        }
    }), [resetForNewDocument, loadParsedDocument, onError]);
    // Restore a server-persisted revision: download its .docx from the
    // host and load it into the editor. In a live collab room the load
    // flows through the same PM path, so peers converge on the restored
    // content. Surfaces failures via onError rather than throwing.
    const handleRestoreServerVersion = useCallback((version) => {
        if (!versionBackend)
            return;
        void (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const buf = yield downloadServerVersion(versionBackend, version);
                yield loadBuffer(buf);
            }
            catch (err) {
                onError === null || onError === void 0 ? void 0 : onError(err instanceof Error ? err : new Error(String(err)));
            }
        }))();
    }, [versionBackend, loadBuffer, onError]);
    // React to document/documentBuffer prop changes
    useEffect(() => {
        // External content mode: caller (e.g. ySyncPlugin) populates PM directly — skip the load.
        if (externalContent)
            return;
        if (!documentBuffer) {
            if (initialDocument) {
                loadParsedDocument(initialDocument);
            }
            return;
        }
        loadBuffer(documentBuffer);
    }, [documentBuffer, initialDocument, externalContent]); // eslint-disable-line react-hooks/exhaustive-deps
    // Create/update agent when document changes
    useEffect(() => {
        if (history.state) {
            agentRef.current = new DocumentAgent(history.state);
        }
        else {
            agentRef.current = null;
        }
    }, [history.state]);
    // Mirror PM state on each external document load (mount-time view creation
    // is handled by PagedEditor's `onReady` below; this effect catches subsequent
    // loads via `document`/`documentBuffer` prop changes, which go through
    // HiddenProseMirror's `updateState` and never fire `handleDocumentChange`).
    // Effects run child-first, so `view.state` already reflects the new doc by
    // the time this runs.
    useEffect(() => {
        var _a;
        if (state.isLoading || !history.state)
            return;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (view)
            setPmState(view.state);
    }, [state.isLoading, history.state]);
    // Auto-open the sidebar once if the loaded document already has tracked changes.
    const trackedChangesLoadedRef = useRef(false);
    useEffect(() => {
        if (trackedChangesLoadedRef.current)
            return;
        if (state.isLoading || !pmState)
            return;
        trackedChangesLoadedRef.current = true;
        if (trackedChanges.length > 0)
            setShowCommentsSidebar(true);
    }, [pmState, state.isLoading, trackedChanges.length]);
    // Listen for font loading
    useEffect(() => {
        const cleanup = onFontsLoaded(() => {
            onFontsLoadedCallback === null || onFontsLoadedCallback === void 0 ? void 0 : onFontsLoadedCallback();
        });
        return cleanup;
    }, [onFontsLoadedCallback]);
    // Sync editing mode to ProseMirror suggestion mode plugin
    useEffect(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (view) {
            setSuggestionMode(editingMode === 'suggesting', view.state, view.dispatch, author);
        }
    }, [editingMode, author]);
    const pushDocument = useCallback((document) => {
        history.push(document);
        return document;
    }, [history]);
    // Tracks whether the user has unsaved edits. The ref is read by the
    // `beforeunload` listener (which can't trigger React re-renders).
    // The state mirrors the ref so the title-bar UnsavedIndicator updates
    // when the value flips.
    const isDirtyRef = useRef(false);
    const [isDirty, setIsDirty] = useState(false);
    const markDirty = useCallback((dirty) => {
        isDirtyRef.current = dirty;
        // Only re-render when the displayed state actually changes.
        setIsDirty((prev) => (prev === dirty ? prev : dirty));
    }, []);
    // True while a save / download is in flight — drives the
    // "Saving…" indicator in the title bar.
    const [isSaving, setIsSaving] = useState(false);
    // beforeunload guard — browsers show the native confirm dialog when
    // `event.returnValue` is set to a non-empty string (the actual string is
    // ignored in modern browsers; only the presence matters).
    useEffect(() => {
        const onBeforeUnload = (e) => {
            if (!isDirtyRef.current)
                return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, []);
    // Handle document change
    const handleDocumentChange = useCallback((newDocument) => {
        var _a, _b;
        markDirty(true);
        pushDocument(newDocument);
        onChange === null || onChange === void 0 ? void 0 : onChange(newDocument);
        // Fan out to bridge subscribers (errors in one don't break the others).
        for (const cb of contentChangeSubscribersRef.current) {
            try {
                cb(newDocument);
            }
            catch (e) {
                console.error('contentChange subscriber threw:', e);
            }
        }
        // Update outline headings if sidebar is open
        if (showOutlineRef.current) {
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view) {
                setHeadingInfos(collectHeadings(view.state.doc));
            }
        }
        // Mirror latest PM state so `useTrackedChanges` (and the threading effect)
        // re-derive from the new doc — including for transactions that came in
        // remotely via ySyncPlugin in collab mode.
        const view = (_b = pagedEditorRef.current) === null || _b === void 0 ? void 0 : _b.getView();
        if (view)
            setPmState(view.state);
        // Clean up orphaned comments (debounced — avoid yanking comments mid-edit)
        if (cleanOrphanedCommentsTimerRef.current) {
            clearTimeout(cleanOrphanedCommentsTimerRef.current);
        }
        cleanOrphanedCommentsTimerRef.current = setTimeout(cleanOrphanedComments, 300);
    }, [onChange, pushDocument, cleanOrphanedComments]);
    // Recompute the floating "add comment" button position from the current PM
    // selection + page/container geometry. Called from handleSelectionChange and
    // from the geometry-change effects below (resize, zoom), because PagedEditor's
    // onSelectionChange no longer fires on mere overlay redraws after the
    // state-identity dedup in #268.
    const readOnlyForFloatingBtnRef = useRef(false);
    const recomputeFloatingCommentBtn = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        if (isAddingCommentRef.current || readOnlyForFloatingBtnRef.current) {
            setFloatingCommentBtn(null);
            return;
        }
        const { from, to } = view.state.selection;
        if (from === to) {
            setFloatingCommentBtn(null);
            return;
        }
        const container = scrollContainerRef.current;
        const parentEl = editorContentRef.current;
        if (!container || !parentEl)
            return;
        const top = findSelectionYPosition(container, parentEl, from);
        if (top == null)
            return;
        const pagesEl = container.querySelector('.paged-editor__pages');
        const pageEl = pagesEl === null || pagesEl === void 0 ? void 0 : pagesEl.querySelector('.layout-page');
        const left = pageEl
            ? pageEl.getBoundingClientRect().right - parentEl.getBoundingClientRect().left
            : parentEl.getBoundingClientRect().width / 2 + 408;
        setFloatingCommentBtn({ top, left });
    }, []);
    // Keep the readOnly ref used by recomputeFloatingCommentBtn in sync
    readOnlyForFloatingBtnRef.current = readOnly;
    // Reposition the floating "add comment" button when the editor container
    // resizes (window resize, sidebar toggle, loading→ready transition) or when
    // zoom changes. Both move the page edges without changing PM selection, so
    // the onSelectionChange path no longer covers them after the dedup fix in
    // #268. The scroll container may not be mounted on the first render (loading
    // state renders a different subtree), so re-run the effect whenever that
    // state flips — that's the point at which the container first becomes
    // available.
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container)
            return;
        const ro = new ResizeObserver(() => recomputeFloatingCommentBtn());
        ro.observe(container);
        const onWinResize = () => recomputeFloatingCommentBtn();
        window.addEventListener('resize', onWinResize);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', onWinResize);
        };
    }, [state.isLoading, recomputeFloatingCommentBtn]);
    useEffect(() => {
        recomputeFloatingCommentBtn();
    }, [state.zoom, recomputeFloatingCommentBtn]);
    // Handle selection changes from ProseMirror
    const handleSelectionChange = useCallback((selectionState) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
        // Save selection for restoring after toolbar interactions
        const view = getActiveEditorView();
        if (view) {
            const { from, to } = view.state.selection;
            lastSelectionRef.current = { from, to };
        }
        // Also check table context from ProseMirror
        let pmTableCtx = null;
        if (view) {
            pmTableCtx = getTableContext(view.state);
            if (!pmTableCtx.isInTable) {
                pmTableCtx = null;
            }
        }
        // Sync borderSpecRef with the current cell's actual border color
        if (pmTableCtx === null || pmTableCtx === void 0 ? void 0 : pmTableCtx.cellBorderColor) {
            const rgb = resolveColorToHex(pmTableCtx.cellBorderColor, theme);
            if (rgb) {
                borderSpecRef.current = Object.assign(Object.assign({}, borderSpecRef.current), { color: { rgb } });
            }
        }
        // Check if cursor is on an image (NodeSelection)
        let pmImageCtx = null;
        if (view) {
            const sel = view.state.selection;
            // NodeSelection has a `node` property
            const selectedNode = sel.node;
            if ((selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) === 'image') {
                pmImageCtx = {
                    pos: sel.from,
                    wrapType: (_a = selectedNode.attrs.wrapType) !== null && _a !== void 0 ? _a : 'inline',
                    displayMode: (_b = selectedNode.attrs.displayMode) !== null && _b !== void 0 ? _b : 'inline',
                    cssFloat: (_c = selectedNode.attrs.cssFloat) !== null && _c !== void 0 ? _c : null,
                    transform: (_d = selectedNode.attrs.transform) !== null && _d !== void 0 ? _d : null,
                    alt: (_e = selectedNode.attrs.alt) !== null && _e !== void 0 ? _e : null,
                    borderWidth: (_f = selectedNode.attrs.borderWidth) !== null && _f !== void 0 ? _f : null,
                    borderColor: (_g = selectedNode.attrs.borderColor) !== null && _g !== void 0 ? _g : null,
                    borderStyle: (_h = selectedNode.attrs.borderStyle) !== null && _h !== void 0 ? _h : null,
                    width: (_j = selectedNode.attrs.width) !== null && _j !== void 0 ? _j : null,
                    height: (_k = selectedNode.attrs.height) !== null && _k !== void 0 ? _k : null,
                    distTop: (_l = selectedNode.attrs.distTop) !== null && _l !== void 0 ? _l : null,
                    distBottom: (_m = selectedNode.attrs.distBottom) !== null && _m !== void 0 ? _m : null,
                    distLeft: (_o = selectedNode.attrs.distLeft) !== null && _o !== void 0 ? _o : null,
                    distRight: (_p = selectedNode.attrs.distRight) !== null && _p !== void 0 ? _p : null,
                };
            }
        }
        // Check if the caret is inside (or the selection is) a text box. Walk the
        // ancestor chain so a caret in the box's text still surfaces the box —
        // textboxes are edited by clicking inside (caret model), like tables.
        let pmTextBoxCtx = null;
        if (view) {
            const sel = view.state.selection;
            const selNode = sel.node;
            let tbNode = null;
            let tbPos = -1;
            if ((selNode === null || selNode === void 0 ? void 0 : selNode.type.name) === 'textBox') {
                tbNode = selNode;
                tbPos = sel.from;
            }
            else {
                const $from = sel.$from;
                for (let d = $from.depth; d > 0; d--) {
                    if ($from.node(d).type.name === 'textBox') {
                        tbNode = $from.node(d);
                        tbPos = $from.before(d);
                        break;
                    }
                }
            }
            if (tbNode && tbPos >= 0) {
                pmTextBoxCtx = {
                    pos: tbPos,
                    width: (_q = tbNode.attrs.width) !== null && _q !== void 0 ? _q : null,
                    height: (_r = tbNode.attrs.height) !== null && _r !== void 0 ? _r : null,
                    fillColor: (_s = tbNode.attrs.fillColor) !== null && _s !== void 0 ? _s : null,
                    outlineWidth: (_t = tbNode.attrs.outlineWidth) !== null && _t !== void 0 ? _t : null,
                    outlineColor: (_u = tbNode.attrs.outlineColor) !== null && _u !== void 0 ? _u : null,
                    posOffsetH: (_v = tbNode.attrs.posOffsetH) !== null && _v !== void 0 ? _v : null,
                    posOffsetV: (_w = tbNode.attrs.posOffsetV) !== null && _w !== void 0 ? _w : null,
                };
            }
        }
        if (!selectionState) {
            setFloatingCommentBtn(null);
            setState((prev) => (Object.assign(Object.assign({}, prev), { selectionFormatting: {}, pmTableContext: pmTableCtx, pmImageContext: pmImageCtx, pmTextBoxContext: pmTextBoxCtx })));
            return;
        }
        // Update toolbar formatting from ProseMirror selection
        const { textFormatting, paragraphFormatting } = selectionState;
        // Extract font family (prefer ascii, fall back to hAnsi)
        let fontFamily = ((_x = textFormatting.fontFamily) === null || _x === void 0 ? void 0 : _x.ascii) || ((_y = textFormatting.fontFamily) === null || _y === void 0 ? void 0 : _y.hAnsi);
        let fontSize = textFormatting.fontSize;
        // If no explicit font/size marks, resolve from paragraph style or document defaults
        if (!fontFamily || !fontSize) {
            const currentDoc = historyStateRef.current;
            const paraStyleId = selectionState.styleId;
            if ((currentDoc === null || currentDoc === void 0 ? void 0 : currentDoc.package.styles) && paraStyleId) {
                const resolver = getCachedStyleResolver(currentDoc.package.styles);
                const resolved = resolver.resolveParagraphStyle(paraStyleId);
                if (!fontFamily && ((_z = resolved.runFormatting) === null || _z === void 0 ? void 0 : _z.fontFamily)) {
                    fontFamily =
                        resolved.runFormatting.fontFamily.ascii || resolved.runFormatting.fontFamily.hAnsi;
                }
                if (!fontSize && ((_0 = resolved.runFormatting) === null || _0 === void 0 ? void 0 : _0.fontSize)) {
                    fontSize = resolved.runFormatting.fontSize;
                }
            }
        }
        const textColorHex = resolveColorToHex(textFormatting.color, theme);
        const textColor = textColorHex ? `#${textColorHex}` : undefined;
        // Build list state from numPr
        const numPr = paragraphFormatting.numPr;
        const listState = numPr
            ? {
                type: (numPr.numId === 1 ? 'bullet' : 'numbered'),
                level: (_1 = numPr.ilvl) !== null && _1 !== void 0 ? _1 : 0,
                isInList: true,
                numId: numPr.numId,
            }
            : undefined;
        const formatting = {
            bold: textFormatting.bold,
            italic: textFormatting.italic,
            underline: !!textFormatting.underline,
            strike: textFormatting.strike,
            superscript: textFormatting.vertAlign === 'superscript',
            subscript: textFormatting.vertAlign === 'subscript',
            smallCaps: textFormatting.smallCaps,
            allCaps: textFormatting.allCaps,
            hidden: textFormatting.hidden,
            emboss: textFormatting.emboss,
            imprint: textFormatting.imprint,
            shadow: textFormatting.shadow,
            outline: textFormatting.outline,
            fontFamily,
            fontSize,
            color: textColor,
            highlight: textFormatting.highlight,
            alignment: paragraphFormatting.alignment,
            lineSpacing: paragraphFormatting.lineSpacing,
            spaceBefore: paragraphFormatting.spaceBefore,
            spaceAfter: paragraphFormatting.spaceAfter,
            listState,
            styleId: (_2 = selectionState.styleId) !== null && _2 !== void 0 ? _2 : undefined,
            indentLeft: paragraphFormatting.indentLeft,
            bidi: !!paragraphFormatting.bidi,
            keepNext: paragraphFormatting.keepNext,
            keepLines: paragraphFormatting.keepLines,
            pageBreakBefore: paragraphFormatting.pageBreakBefore,
            widowControl: paragraphFormatting.widowControl,
        };
        setState((prev) => {
            var _a, _b, _c, _d, _e;
            return (Object.assign(Object.assign({}, prev), { selectionFormatting: formatting, paragraphIndentLeft: (_a = paragraphFormatting.indentLeft) !== null && _a !== void 0 ? _a : 0, paragraphIndentRight: (_b = paragraphFormatting.indentRight) !== null && _b !== void 0 ? _b : 0, paragraphFirstLineIndent: (_c = paragraphFormatting.indentFirstLine) !== null && _c !== void 0 ? _c : 0, paragraphHangingIndent: (_d = paragraphFormatting.hangingIndent) !== null && _d !== void 0 ? _d : false, paragraphTabs: (_e = paragraphFormatting.tabs) !== null && _e !== void 0 ? _e : null, pmTableContext: pmTableCtx, pmImageContext: pmImageCtx, pmTextBoxContext: pmTextBoxCtx }));
        });
        // Update floating comment button position
        recomputeFloatingCommentBtn();
        // Paint-format armed and now there's a non-empty selection — apply.
        if (paintFormatMarksRef.current) {
            const view = (_3 = pagedEditorRef.current) === null || _3 === void 0 ? void 0 : _3.getView();
            if (view) {
                const { from, to } = view.state.selection;
                if (from !== to) {
                    applyPaintedMarks(from, to);
                }
            }
        }
        // Notify parent
        onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(selectionState);
        // Fan out to bridge subscribers.
        for (const cb of selectionChangeSubscribersRef.current) {
            try {
                cb(selectionState);
            }
            catch (e) {
                console.error('selectionChange subscriber threw:', e);
            }
        }
    }, 
    // getActiveEditorView's return depends on hfEditPosition; theme drives
    // color resolution. Both must be in deps to avoid stale-closure reads.
    [onSelectionChange, isAddingComment, readOnly, getActiveEditorView, theme]);
    // Table selection hook
    const tableSelection = useTableSelection({
        document: history.state,
        onChange: handleDocumentChange,
        onSelectionChange: (_context) => {
            // Could notify parent of table selection changes
        },
    });
    // Keyboard shortcuts for Find/Replace (Ctrl+F, Ctrl+H) and delete table selection
    useEffect(() => {
        const handleKeyDown = (e) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            // Check for Ctrl+F (Find) or Ctrl+H (Replace)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
            // Delete selected table from layout selection (non-ProseMirror selection)
            if (!cmdOrCtrl && !e.shiftKey && !e.altKey) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    // If full table is selected via ProseMirror CellSelection, delete it.
                    const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                    if (view) {
                        const sel = view.state.selection;
                        const isCellSel = '$anchorCell' in sel && typeof sel.forEachCell === 'function';
                        if (isCellSel) {
                            const context = getTableContext(view.state);
                            if (context.isInTable && context.table) {
                                let totalCells = 0;
                                context.table.descendants((node) => {
                                    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                                        totalCells += 1;
                                    }
                                });
                                let selectedCells = 0;
                                sel.forEachCell(() => {
                                    selectedCells += 1;
                                });
                                if (totalCells > 0 && selectedCells >= totalCells) {
                                    e.preventDefault();
                                    pmDeleteTable(view.state, view.dispatch);
                                    return;
                                }
                            }
                        }
                    }
                    if (tableSelection.state.tableIndex !== null) {
                        e.preventDefault();
                        tableSelection.handleAction('deleteTable');
                        return;
                    }
                }
            }
            // Alt+= → equation dialog (Word / OnlyOffice). Prefill when a math
            // node is selected so it edits in place; otherwise insert new.
            if (e.altKey && !cmdOrCtrl && !e.shiftKey && (e.key === '=' || e.code === 'Equal')) {
                e.preventDefault();
                const eqView = getActiveEditorView();
                const eqSel = eqView === null || eqView === void 0 ? void 0 : eqView.state.selection;
                if (eqView && eqSel instanceof NodeSelection && eqSel.node.type.name === 'math') {
                    setEquationInitial({
                        latex: eqSel.node.attrs.latex || '',
                        display: eqSel.node.attrs.display === 'block' ? 'block' : 'inline',
                    });
                }
                else {
                    setEquationInitial({ latex: '', display: 'inline' });
                }
                setShowEquationDialog(true);
                return;
            }
            if (cmdOrCtrl && !e.shiftKey && !e.altKey) {
                if (e.key.toLowerCase() === 'f') {
                    if (disableFindReplaceShortcuts)
                        return;
                    e.preventDefault();
                    // Get selected text if any
                    const selection = window.getSelection();
                    const selectedText = selection && !selection.isCollapsed ? selection.toString() : '';
                    findReplace.openFind(selectedText);
                }
                else if (e.key.toLowerCase() === 'h') {
                    if (disableFindReplaceShortcuts)
                        return;
                    e.preventDefault();
                    // Get selected text if any
                    const selection = window.getSelection();
                    const selectedText = selection && !selection.isCollapsed ? selection.toString() : '';
                    findReplace.openReplace(selectedText);
                }
                else if (e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    // Open hyperlink dialog
                    const view = (_b = pagedEditorRef.current) === null || _b === void 0 ? void 0 : _b.getView();
                    if (view) {
                        const selectedText = getSelectedText(view.state);
                        const existingLink = getHyperlinkAttrs(view.state);
                        if (existingLink) {
                            hyperlinkDialog.openEdit({
                                url: existingLink.href,
                                displayText: selectedText,
                                tooltip: existingLink.tooltip,
                            });
                        }
                        else {
                            hyperlinkDialog.openInsert(selectedText);
                        }
                    }
                }
                else if (e.key.toLowerCase() === 's') {
                    // Mod+S: Save (download .docx)
                    e.preventDefault();
                    (_d = (_c = shortcutActionsRef.current).save) === null || _d === void 0 ? void 0 : _d.call(_c);
                }
                else if (e.key.toLowerCase() === 'p') {
                    // Mod+P: Print
                    e.preventDefault();
                    (_f = (_e = shortcutActionsRef.current).print) === null || _f === void 0 ? void 0 : _f.call(_e);
                }
                else if (e.key.toLowerCase() === 'n') {
                    // Mod+N: New document. Only honor if the host opted in via onNew.
                    if (shortcutActionsRef.current.new) {
                        e.preventDefault();
                        shortcutActionsRef.current.new();
                    }
                }
                else if (e.key.toLowerCase() === 'o') {
                    // Mod+O: Open file picker
                    e.preventDefault();
                    (_h = (_g = shortcutActionsRef.current).open) === null || _h === void 0 ? void 0 : _h.call(_g);
                }
                else if (e.key === '\\') {
                    // Mod+\\: Clear formatting (Google Docs convention)
                    const view = (_j = pagedEditorRef.current) === null || _j === void 0 ? void 0 : _j.getView();
                    if (view) {
                        e.preventDefault();
                        clearFormatting(view.state, view.dispatch);
                    }
                }
                else if (e.key === '=' || e.key === '+') {
                    // Mod+= / Mod++: Zoom in.
                    e.preventDefault();
                    (_l = (_k = shortcutActionsRef.current).zoomIn) === null || _l === void 0 ? void 0 : _l.call(_k);
                }
                else if (e.key === '-') {
                    // Mod+-: Zoom out.
                    e.preventDefault();
                    (_o = (_m = shortcutActionsRef.current).zoomOut) === null || _o === void 0 ? void 0 : _o.call(_m);
                }
                else if (e.key === '0') {
                    // Mod+0: Reset zoom to 100%.
                    e.preventDefault();
                    (_q = (_p = shortcutActionsRef.current).zoomReset) === null || _q === void 0 ? void 0 : _q.call(_p);
                }
            }
            // Mod+Shift+P → command palette. Word / VS Code / Notion convention.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            // Mod+Shift+\ → toggle focus mode. iA Writer / Bear / Notion all
            // use a variant of this; backslash is chosen because it sits
            // alone on every layout (no conflict with format shortcuts) and
            // visually echoes the strikethrough of chrome.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.code === 'Backslash') {
                e.preventDefault();
                setFocusMode((v) => !v);
            }
            // Esc exits focus mode (regardless of whether the focus mode
            // bar itself has focus). Only fires while focus mode is on so
            // ESC inside a dialog still closes the dialog.
            if (e.key === 'Escape' && focusMode) {
                e.preventDefault();
                setFocusMode(false);
            }
            // Mod+Alt+M → start a new comment on the selection (Google Docs
            // binding). Uses e.code, not e.key, because Option remaps the M key
            // on macOS. No-op when the selection is empty (handled downstream).
            if (cmdOrCtrl && e.altKey && !e.shiftKey && e.code === 'KeyM') {
                e.preventDefault();
                (_s = (_r = shortcutActionsRef.current).startComment) === null || _s === void 0 ? void 0 : _s.call(_r);
            }
            // Mod+/ → keyboard-shortcuts dialog (Google Docs binding).
            if (cmdOrCtrl && !e.shiftKey && !e.altKey && e.key === '/') {
                e.preventDefault();
                setShowKeyboardShortcuts(true);
            }
            // Mod+Shift+L → toggle bullet list. Word convention; also matches
            // Google Docs (Ctrl+Shift+8 there, but L is the documented Word
            // binding and the doc community expects it). Routes through the
            // same handleFormat path the toolbar uses so behavior stays
            // identical to clicking the bullet button.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                const view = getActiveEditorView();
                if (view) {
                    toggleBulletList(view.state, view.dispatch);
                }
            }
            // Mod+Shift+E → cycle editing mode (Docs convention: Editing →
            // Suggesting → Viewing → Editing). The mode-toggle button tooltip
            // already advertises this shortcut; this wires it.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                const current = editingModeRef.current;
                const next = current === 'editing' ? 'suggesting' : current === 'suggesting' ? 'viewing' : 'editing';
                setEditingModeRef.current(next);
            }
            // Mod+Shift+C → open Word count dialog (Google Docs convention).
            // Same dialog the Edit → Word count menu item opens.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                setShowWordCount(true);
            }
            // Mod+Shift+Y → open Dictionary dialog (Google Docs convention, A4).
            // Same dialog the Tools → Dictionary menu item opens, with the
            // current selection (if any) pre-filled.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleOpenDictionary();
            }
            // Mod+Shift+H → toggle document outline. Mod+H (no shift) opens
            // Find & Replace, so the shifted variant is the obvious free slot.
            // Mac users can't easily use Mod+Alt+H — that's "Hide Others" at
            // the system level — so the shift-modifier shortcut is the
            // cross-platform-safe choice.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                handleToggleOutline();
            }
            // Mod+Shift+V → paste without formatting (Google Docs + Word
            // convention; the same handler the Edit menu's "Paste without
            // formatting" item runs). Reads the system clipboard as plain
            // text and inserts via execCommand so the inserted run inherits
            // the cursor's stored marks. Falls back silently when the
            // browser blocks the clipboard read — the user can still
            // ⌘V then Ctrl+\ (clear formatting) as a manual fallback.
            if (cmdOrCtrl && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                void (() => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const text = yield navigator.clipboard.readText();
                        if (!text)
                            return;
                        (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                        document.execCommand('insertText', false, text);
                    }
                    catch (_b) {
                        // Clipboard read denied — silently no-op; the Edit menu
                        // entry has the same fallback behaviour.
                    }
                }))();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [disableFindReplaceShortcuts, findReplace, hyperlinkDialog, tableSelection, focusMode]);
    // Ref holds the latest file-op handlers so the global keydown listener
    // (registered once above) can call them without depending on their
    // identity (they're defined later in the function — referencing them
    // directly trips TS's temporal-dead-zone check).
    const shortcutActionsRef = useRef({});
    // Handle table insert from toolbar
    const handleInsertTable = useCallback((rows, columns) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        insertTable(rows, columns)(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Paint format (format painter): toggle armed state. If already armed,
    // disarm. Otherwise capture the current cursor's mark set; the next
    // selection-change with a non-empty selection will apply them.
    const handleTogglePaintFormat = useCallback(() => {
        var _a;
        if (paintFormatMarksRef.current) {
            setPaintFormatMarks(null);
            return;
        }
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const { selection, storedMarks } = view.state;
        let marks;
        if (storedMarks && storedMarks.length > 0) {
            marks = storedMarks;
        }
        else if (!selection.empty) {
            // Take marks from the first character of the range.
            const $pos = view.state.doc.resolve(selection.from + 1);
            marks = $pos.marks();
        }
        else {
            marks = selection.$from.marks();
        }
        setPaintFormatMarks(marks);
    }, []);
    // Apply painted marks to a non-empty selection, then disarm.
    const applyPaintedMarks = useCallback((from, to) => {
        var _a;
        const marks = paintFormatMarksRef.current;
        if (!marks)
            return;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        let tr = view.state.tr;
        // Clear ALL existing marks on the range first, then add the captured
        // set. This is what Docs/Word do — paint format replaces, not merges.
        const allMarkTypes = Object.values(view.state.schema.marks);
        for (const mt of allMarkTypes) {
            tr = tr.removeMark(from, to, mt);
        }
        for (const m of marks) {
            tr = tr.addMark(from, to, m);
        }
        view.dispatch(tr);
        setPaintFormatMarks(null);
    }, []);
    // Cancel paint-format on Escape.
    useEffect(() => {
        if (!paintFormatMarks)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                setPaintFormatMarks(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [paintFormatMarks]);
    // Start the add-comment flow from a toolbar/menu trigger (mirrors the
    // floating "+" button + context-menu addComment paths). Selection
    // must be non-empty; when empty, the toolbar button is disabled.
    const handleStartAddComment = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const { from, to } = view.state.selection;
        if (from === to)
            return;
        const yPos = findSelectionYPosition(scrollContainerRef.current, editorContentRef.current, from);
        setCommentSelectionRange({ from, to });
        const pendingMark = view.state.schema.marks.comment.create({
            commentId: PENDING_COMMENT_ID,
        });
        const tr = view.state.tr.addMark(from, to, pendingMark);
        tr.setSelection(TextSelection.create(tr.doc, to));
        view.dispatch(tr);
        setAddCommentYPosition(yPos);
        setShowCommentsSidebar(true);
        setIsAddingComment(true);
        setFloatingCommentBtn(null);
    }, []);
    // Insert a page break at cursor
    const handleInsertPageBreak = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        insertPageBreak(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Open the Character Spacing dialog with attrs harvested from the
    // current selection's characterSpacing mark (or zeros if absent).
    const handleOpenCharacterSpacing = useCallback(() => {
        var _a, _b, _c, _d, _e;
        const view = getActiveEditorView();
        if (!view)
            return;
        const markType = view.state.schema.marks['characterSpacing'];
        const initial = { scale: null, spacing: null, position: null, kerning: null };
        if (markType) {
            const { from, to, empty } = view.state.selection;
            let attrs = null;
            if (empty) {
                const stored = (_a = view.state.storedMarks) !== null && _a !== void 0 ? _a : view.state.selection.$from.marks();
                const m = stored.find((mk) => mk.type === markType);
                if (m)
                    attrs = m.attrs;
            }
            else {
                view.state.doc.nodesBetween(from, to, (node) => {
                    if (attrs)
                        return false;
                    const m = node.marks.find((mk) => mk.type === markType);
                    if (m)
                        attrs = m.attrs;
                    return true;
                });
            }
            if (attrs) {
                const a = attrs;
                initial.scale = (_b = a.scale) !== null && _b !== void 0 ? _b : null;
                initial.spacing = (_c = a.spacing) !== null && _c !== void 0 ? _c : null;
                initial.position = (_d = a.position) !== null && _d !== void 0 ? _d : null;
                initial.kerning = (_e = a.kerning) !== null && _e !== void 0 ? _e : null;
            }
        }
        setCharacterSpacingInitial(initial);
        setCharacterSpacingDialogOpen(true);
    }, [getActiveEditorView]);
    const handleSubmitCharacterSpacing = useCallback((value) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        setCharacterAttrs(value)(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Open the Paragraph dialog with the cursor paragraph's current attrs.
    const handleOpenParagraphDialog = useCallback(() => {
        setParagraphDialogOpen(true);
    }, []);
    // Open the Borders & Shading dialog. Harvest the current paragraph's
    // borders/shading attrs from the live PM doc at open time so existing
    // values appear in the dialog (Word's behaviour).
    const handleOpenBordersShading = useCallback(() => {
        var _a, _b;
        const view = getActiveEditorView();
        const initial = {
            borders: {},
            shading: { fillHex: '', pattern: 'clear', patternColorHex: '' },
        };
        if (view) {
            const { $from } = view.state.selection;
            let para = $from.parent;
            // Walk up to nearest paragraph if cursor is deeper.
            for (let d = $from.depth; d > 0 && para.type.name !== 'paragraph'; d--) {
                para = $from.node(d - 1);
            }
            if (para.type.name === 'paragraph') {
                const attrs = para.attrs;
                if (attrs.borders) {
                    const b = attrs.borders;
                    ['top', 'bottom', 'left', 'right'].forEach((side) => {
                        var _a, _b;
                        const spec = b[side];
                        if (spec && spec.style && spec.style !== 'none' && spec.style !== 'nil') {
                            const known = ['single', 'double', 'dotted', 'dashed', 'thick', 'triple'];
                            const style = known.includes(spec.style)
                                ? spec.style
                                : 'single';
                            initial.borders[side] = {
                                style,
                                colorHex: (((_a = spec.color) === null || _a === void 0 ? void 0 : _a.rgb) || '000000').toUpperCase(),
                                size: (_b = spec.size) !== null && _b !== void 0 ? _b : 4,
                            };
                        }
                    });
                }
                if (attrs.shading) {
                    const s = attrs.shading;
                    initial.shading = {
                        fillHex: (((_a = s.fill) === null || _a === void 0 ? void 0 : _a.rgb) || '').toUpperCase(),
                        pattern: s.pattern || 'clear',
                        patternColorHex: (((_b = s.color) === null || _b === void 0 ? void 0 : _b.rgb) || '').toUpperCase(),
                    };
                }
            }
        }
        setBordersShadingInitial(initial);
        setBordersShadingOpen(true);
    }, [getActiveEditorView]);
    // Convert dialog value into OOXML-shaped paragraph attrs and dispatch.
    const handleSubmitBordersShading = useCallback((v) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const sides = ['top', 'bottom', 'left', 'right'];
        const borders = {};
        let anyBorder = false;
        for (const side of sides) {
            const spec = v.borders[side];
            if (spec) {
                anyBorder = true;
                borders[side] = {
                    style: spec.style,
                    color: spec.colorHex ? { rgb: spec.colorHex } : undefined,
                    size: spec.size,
                };
            }
        }
        const shadingHasFill = !!v.shading.fillHex;
        const shadingHasPattern = v.shading.pattern !== 'clear';
        const shadingHasPatternColor = !!v.shading.patternColorHex;
        const shading = shadingHasFill || shadingHasPattern || shadingHasPatternColor
            ? {
                fill: shadingHasFill ? { rgb: v.shading.fillHex } : undefined,
                color: shadingHasPatternColor ? { rgb: v.shading.patternColorHex } : undefined,
                pattern: v.shading.pattern,
            }
            : null;
        setParagraphAttrs({
            borders: anyBorder ? borders : null,
            shading,
        })(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Insert an inline OOXML field node (PAGE / NUMPAGES / DATE / TIME /
    // CREATEDATE / SAVEDATE / AUTHOR / FILENAME) at the cursor. The
    // header/footer flow is the primary use; body insertion also works
    // (Word renders PAGE in body the same way). The round-trip through
    // parser+serializer is locked in by footer-field-roundtrip.test.ts.
    const handleInsertField = useCallback((fieldType) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        insertField(fieldType)(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Insert a section break of the given OOXML type. Section breaks
    // are a stronger structural divider than page breaks — they let
    // the next section have its own page-size / margins / columns /
    // headers + footers. `nextPage` matches Word's default; the
    // other three (`continuous` / `evenPage` / `oddPage`) cover the
    // less-common section-control cases.
    const handleInsertSectionBreak = useCallback((breakType) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        insertSectionBreak(breakType)(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    const handleInsertHorizontalRule = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        insertHorizontalRule(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Insert a footnote ref at the cursor. The id is "next free integer"
    // computed by scanning existing footnoteRef marks in the doc.
    const handleInsertFootnote = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        let maxId = 0;
        view.state.doc.descendants((node) => {
            if (!node.isText)
                return;
            for (const m of node.marks) {
                if (m.type.name === 'footnoteRef') {
                    const id = Number(m.attrs.id);
                    if (Number.isFinite(id) && id > maxId)
                        maxId = id;
                }
            }
        });
        insertFootnote(maxId + 1)(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    const handleOpenInsertSymbol = useCallback(() => setInsertSymbolOpen(true), []);
    const handleToggleShowRuler = useCallback(() => {
        setShowRulerLocal((prev) => !(prev !== null && prev !== void 0 ? prev : showRuler));
    }, [showRuler]);
    // F6 — View → Show non-printing characters. Persist across sessions so
    // the preference survives a reload, matching how Google Docs / Word
    // remember the formatting-marks toggle.
    const [showFormattingMarks, setShowFormattingMarks] = useState(() => {
        if (typeof window === 'undefined')
            return false;
        try {
            return window.localStorage.getItem('docx-editor-show-marks') === '1';
        }
        catch (_a) {
            return false;
        }
    });
    const handleToggleShowFormattingMarks = useCallback(() => {
        setShowFormattingMarks((prev) => {
            const next = !prev;
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('docx-editor-show-marks', next ? '1' : '0');
                }
            }
            catch (_a) {
                // Quota / private mode — toggle still works in-memory.
            }
            return next;
        });
    }, []);
    const handleInsertSymbol = useCallback((symbol) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        view.dispatch(view.state.tr.insertText(symbol));
        setInsertSymbolOpen(false);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Insert a table of contents at cursor
    const handleInsertTOC = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        generateTOC(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Toggle document outline sidebar
    const handleToggleOutline = useCallback(() => {
        setShowOutline((prev) => {
            var _a;
            if (!prev) {
                // Opening: collect headings immediately
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (view) {
                    setHeadingInfos(collectHeadings(view.state.doc));
                }
                // One right-side surface at a time: opening the outline closes the rest.
                setShowCommentsSidebar(false);
                setExpandedSidebarItem(null);
                setShowVersionHistory(false);
                setShowProperties(false);
            }
            return !prev;
        });
    }, []);
    // Navigate to a heading from the outline
    const handleHeadingInfoClick = useCallback((pmPos) => {
        var _a, _b, _c;
        (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.scrollToPosition(pmPos);
        // Also set selection to the heading
        (_b = pagedEditorRef.current) === null || _b === void 0 ? void 0 : _b.setSelection(pmPos + 1);
        (_c = pagedEditorRef.current) === null || _c === void 0 ? void 0 : _c.focus();
    }, []);
    // Trigger file picker for image insert
    const handleInsertImageClick = useCallback(() => {
        var _a;
        (_a = imageInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    }, []);
    // Handle file selection for image insert
    const handleImageFileChange = useCallback((e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const view = getActiveEditorView();
        if (!view)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            // Create an Image element to get natural dimensions
            const img = new Image();
            img.onload = () => {
                let width = img.naturalWidth;
                let height = img.naturalHeight;
                // Constrain to reasonable max width (content area of US Letter page at 96dpi)
                const maxWidth = 612; // ~6.375 inches
                if (width > maxWidth) {
                    const scale = maxWidth / width;
                    width = maxWidth;
                    height = Math.round(height * scale);
                }
                const rId = `rId_img_${Date.now()}`;
                const imageNode = view.state.schema.nodes.image.create({
                    src: dataUrl,
                    alt: file.name,
                    width,
                    height,
                    rId,
                    wrapType: 'inline',
                    displayMode: 'inline',
                });
                const { from } = view.state.selection;
                const tr = view.state.tr.insert(from, imageNode);
                view.dispatch(tr.scrollIntoView());
                focusActiveEditor();
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        // Reset the input so the same file can be selected again
        e.target.value = '';
    }, [getActiveEditorView, focusActiveEditor]);
    // Handle shape insertion
    // Handle image wrap type change
    // Re-select the image as a NODE selection after a Format-panel edit. A plain
    // text selection at `pos` would NOT rebuild pmImageContext, so the panel
    // would fall back to its empty "select an object" state — this keeps it on
    // the image (the "keep selection through edits" behaviour).
    const reselectImageNode = useCallback((pos) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        try {
            const sel = NodeSelection.create(view.state.doc, pos);
            view.dispatch(view.state.tr.setSelection(sel));
        }
        catch (_a) {
            // pos no longer points at a selectable node; ignore.
        }
    }, [getActiveEditorView]);
    const handleImageWrapType = useCallback((toolbarValue) => {
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        // Translate the toolbar's legacy vocabulary into the PM command's
        // `ImageLayoutTarget` so the toolbar and the right-click menu share
        // `setImageWrapType` and its `resolveAnchorAttrs` taxonomy. The mapping
        // lives in core so the Vue adapter doesn't have to duplicate it.
        const target = toolbarValueToLayoutTarget(toolbarValue);
        if (!target)
            return;
        // For inline → anchor, capture the inline glyph's rendered offset so
        // the new float lands at the same X/Y (Word's behavior). The core
        // helper handles the zoom + EMU conversion uniformly.
        let opts;
        if (node.attrs.wrapType === 'inline' && target !== 'inline') {
            const inlineEl = document.querySelector(`.layout-run-image[data-pm-start="${pos}"]`);
            const captured = inlineEl ? captureInlinePositionEmu(inlineEl, state.zoom) : undefined;
            if (captured)
                opts = { initialPositionEmu: captured };
        }
        setImageWrapType(pos, target, opts)(view.state, view.dispatch);
        // Keep the image node-selected so the Format panel stays on it (and the
        // distance-from-text controls appear for the new wrap mode).
        reselectImageNode(pos);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext, state.zoom, reselectImageNode]);
    // Re-select the image as a NODE selection after a Format-panel edit. A plain
    // text selection at `pos` would NOT rebuild pmImageContext, so the panel
    // would fall back to its empty "select an object" state — this keeps it on
    // the image (the "keep selection through edits" follow-up).
    // Set explicit image width/height from the Format panel's size inputs.
    // Same node-markup path the resize handles use, so the painted pages and
    // round-trip stay consistent. Re-selects the image so the panel keeps it.
    const handleImageSetSize = useCallback((width, height) => {
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const w = Math.max(8, Math.min(2000, Math.round(width)));
        const h = Math.max(8, Math.min(2000, Math.round(height)));
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { width: w, height: h }));
        view.dispatch(tr);
        reselectImageNode(pos);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext, reselectImageNode]);
    // Re-select the image as a NODE selection after a Format-panel edit. A plain
    // text selection at `pos` would NOT rebuild pmImageContext, so the panel
    // would fall back to its empty "select an object" state — this keeps it on
    // the image (the "keep selection through edits" follow-up).
    // Set image border (width/color/style) from the Format panel. Same node
    // attrs the image-properties dialog uses, so the two stay consistent.
    const handleImageSetBorder = useCallback((borderWidth, borderColor, borderStyle) => {
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { borderWidth,
            borderColor,
            borderStyle }));
        view.dispatch(tr);
        reselectImageNode(pos);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext, reselectImageNode]);
    // Set a single distance-from-text margin (px) on the selected image. Drives
    // the wrap spacing the layout engine already honors for floating images.
    const handleImageSetDist = useCallback((side, value) => {
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const v = Math.max(0, Math.min(200, Math.round(value)));
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { [side]: v }));
        view.dispatch(tr);
        reselectImageNode(pos);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext, reselectImageNode]);
    // Set image alt text (accessibility) from the Format panel.
    const handleImageSetAlt = useCallback((alt) => {
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { alt: alt.trim() ? alt : null }));
        view.dispatch(tr);
        reselectImageNode(pos);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext, reselectImageNode]);
    // --- Text box Format-panel handlers ---------------------------------------
    // All go through setNodeMarkup on the textBox node (reliable + round-trips);
    // the painter re-renders at the new size/fill/outline. We keep the caret
    // inside the box (setSelection at pos+1) so the panel stays open on it.
    const updateTextBoxAttrs = useCallback((patch) => {
        const view = getActiveEditorView();
        if (!view || !state.pmTextBoxContext)
            return;
        const pos = state.pmTextBoxContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'textBox')
            return;
        // CRITICAL: an imported box carries its original OOXML envelope in
        // `rawXml`; the serializer re-emits that verbatim and skips the model
        // (the rawXml invariant in fromProseDoc). So a fill/size/outline edit
        // would render but be silently dropped on save. Clearing rawXml/
        // envelopeKey on edit switches the box to model-based emission so the
        // change actually persists. The model serializer is complete for the
        // box's geometry/fill/outline/text; only original VML/custom-geometry
        // /effects are dropped, which is the expected trade-off for editing.
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign(Object.assign({}, node.attrs), patch), { rawXml: null, envelopeKey: null }));
        view.dispatch(tr);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmTextBoxContext]);
    const handleTextBoxSetSize = useCallback((width, height) => {
        updateTextBoxAttrs({
            width: Math.max(24, Math.min(2000, Math.round(width))),
            height: height == null ? null : Math.max(16, Math.min(2000, Math.round(height))),
        });
    }, [updateTextBoxAttrs]);
    const handleTextBoxSetFill = useCallback((fillColor) => updateTextBoxAttrs({ fillColor }), [updateTextBoxAttrs]);
    const handleTextBoxSetPosition = useCallback((x, y) => {
        // Anchor the box at (x, y) px from the content-area top-left. `margin`
        // relativeFrom = the content area (page minus margins), so resolveAnchorX/Y
        // place it at exactly the offset. Clearing the align attrs lets the offset
        // win (align would otherwise override posOffset in anchorGeometry).
        updateTextBoxAttrs({
            posOffsetH: Math.max(0, Math.round(x)),
            posOffsetV: Math.max(0, Math.round(y)),
            posRelFromH: 'margin',
            posRelFromV: 'margin',
            posAlignH: null,
            posAlignV: null,
        });
    }, [updateTextBoxAttrs]);
    const handleTextBoxSetOutline = useCallback((outlineWidth, outlineColor) => updateTextBoxAttrs({
        outlineWidth,
        outlineColor: outlineWidth == null ? null : outlineColor,
        outlineStyle: outlineWidth == null ? null : 'solid',
    }), [updateTextBoxAttrs]);
    // Open the note editor with the current text of the double-clicked note.
    // Footnotes/endnotes live on the document package (history.state), NOT the PM doc.
    const handleEditFootnote = useCallback((footnoteId) => {
        var _a, _b, _c;
        const fn = (_c = (_b = (_a = history.state) === null || _a === void 0 ? void 0 : _a.package) === null || _b === void 0 ? void 0 : _b.footnotes) === null || _c === void 0 ? void 0 : _c.find((f) => f.id === footnoteId);
        setNoteEdit({ kind: 'footnote', id: footnoteId, text: fn ? getFootnoteText(fn) : '' });
    }, [history]);
    const handleEditEndnote = useCallback((endnoteId) => {
        var _a, _b, _c;
        const en = (_c = (_b = (_a = history.state) === null || _a === void 0 ? void 0 : _a.package) === null || _b === void 0 ? void 0 : _b.endnotes) === null || _c === void 0 ? void 0 : _c.find((e) => e.id === endnoteId);
        setNoteEdit({ kind: 'endnote', id: endnoteId, text: en ? getEndnoteText(en) : '' });
    }, [history]);
    // Apply a footnote/endnote text edit to BOTH the render doc (history.state)
    // and the save doc (agentRef). Marking the note `edited` makes the save path
    // regenerate ONLY its text in footnotes.xml/endnotes.xml; untouched notes stay
    // verbatim. Runs for local AND remote (collab) edits, so every peer's model —
    // and any peer's snapshot — carries the change.
    const applyNoteEditToModel = useCallback((kind, noteId, text) => {
        var _a, _b, _c;
        const editsRef = kind === 'footnote' ? footnoteEditsRef : endnoteEditsRef;
        const apply = (pkg) => {
            const list = kind === 'footnote' ? pkg === null || pkg === void 0 ? void 0 : pkg.footnotes : pkg === null || pkg === void 0 ? void 0 : pkg.endnotes;
            const note = list === null || list === void 0 ? void 0 : list.find((n) => n.id === noteId);
            if (note) {
                if (kind === 'footnote')
                    setFootnotePlainText(note, text);
                else
                    setEndnotePlainText(note, text);
                note.edited = true;
            }
        };
        apply((_a = history.state) === null || _a === void 0 ? void 0 : _a.package);
        apply((_c = (_b = agentRef.current) === null || _b === void 0 ? void 0 : _b.getDocument()) === null || _c === void 0 ? void 0 : _c.package);
        editsRef.current.set(noteId, text);
        // Instant visual feedback: patch the painted note text span(s).
        const cls = kind === 'footnote' ? 'layout-footnote' : 'layout-endnote';
        document
            .querySelectorAll(`.${cls}[data-${kind}-id="${noteId}"] .${cls}-text`)
            .forEach((el) => {
            el.textContent = ' ' + text;
        });
    }, [history]);
    // Commit an edit from the dialog. In collab, route through the shared map so
    // peers receive it; the observer applies it to every peer's model (including
    // ours). Single-user applies directly.
    const handleApplyNoteEdit = useCallback((kind, noteId, text) => {
        var _a;
        const noteSync = kind === 'footnote' ? footnoteSync : endnoteSync;
        if (noteSync) {
            noteSync.set(noteId, text);
        }
        else {
            applyNoteEditToModel(kind, noteId, text);
            (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.relayout();
        }
        setNoteEdit(null);
    }, [footnoteSync, endnoteSync, applyNoteEditToModel]);
    // Apply core-property edits to the live + save docs. Runs for local and remote
    // (collab) edits so every peer's model carries them and any peer's snapshot
    // writes them through applyCorePropertiesToXml.
    const applyPropsToModel = useCallback((edits) => {
        var _a, _b, _c;
        const apply = (pkg) => {
            var _a;
            if (pkg)
                pkg.properties = Object.assign(Object.assign({}, ((_a = pkg.properties) !== null && _a !== void 0 ? _a : {})), edits);
        };
        apply((_a = history.state) === null || _a === void 0 ? void 0 : _a.package);
        apply((_c = (_b = agentRef.current) === null || _b === void 0 ? void 0 : _b.getDocument()) === null || _c === void 0 ? void 0 : _c.package);
        propsEditsRef.current = Object.assign(Object.assign({}, propsEditsRef.current), edits);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Commit a File → Properties edit. In collab, route through the shared map so
    // peers receive it; the observer applies it everywhere. Single-user direct.
    const handleApplyFileProperties = useCallback((edits) => {
        if (propsSync)
            propsSync.set(edits);
        else
            applyPropsToModel(edits);
    }, [propsSync, applyPropsToModel]);
    useEffect(() => {
        if (!propsSync)
            return;
        return propsSync.observe((props) => applyPropsToModel(props));
    }, [propsSync, applyPropsToModel]);
    // Apply remote (and own) note edits broadcast over the shared maps.
    useEffect(() => {
        const unsubs = [];
        if (footnoteSync)
            unsubs.push(footnoteSync.observe((id, text) => {
                var _a;
                applyNoteEditToModel('footnote', id, text);
                (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.relayout();
            }));
        if (endnoteSync)
            unsubs.push(endnoteSync.observe((id, text) => {
                var _a;
                applyNoteEditToModel('endnote', id, text);
                (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.relayout();
            }));
        return () => unsubs.forEach((u) => u());
    }, [footnoteSync, endnoteSync, applyNoteEditToModel]);
    // Handle image transform (rotate/flip)
    const handleImageTransform = useCallback((action) => {
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const currentTransform = node.attrs.transform || '';
        // Parse current rotation and flip state
        const rotateMatch = currentTransform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
        let rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
        let hasFlipH = /scaleX\(-1\)/.test(currentTransform);
        let hasFlipV = /scaleY\(-1\)/.test(currentTransform);
        switch (action) {
            case 'rotateCW':
                rotation = (rotation + 90) % 360;
                break;
            case 'rotateCCW':
                rotation = (rotation - 90 + 360) % 360;
                break;
            case 'flipH':
                hasFlipH = !hasFlipH;
                break;
            case 'flipV':
                hasFlipV = !hasFlipV;
                break;
        }
        // Build new transform string
        const parts = [];
        if (rotation !== 0)
            parts.push(`rotate(${rotation}deg)`);
        if (hasFlipH)
            parts.push('scaleX(-1)');
        if (hasFlipV)
            parts.push('scaleY(-1)');
        const newTransform = parts.length > 0 ? parts.join(' ') : null;
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { transform: newTransform }));
        view.dispatch(tr.scrollIntoView());
        // Keep the image selected so the Format panel stays on it after the edit.
        reselectImageNode(pos);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext, reselectImageNode]);
    // Apply image position changes
    const handleApplyImagePosition = useCallback((data) => {
        var _a, _b, _c, _d;
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { position: {
                horizontal: data.horizontal,
                vertical: data.vertical,
            }, distTop: (_a = data.distTop) !== null && _a !== void 0 ? _a : node.attrs.distTop, distBottom: (_b = data.distBottom) !== null && _b !== void 0 ? _b : node.attrs.distBottom, distLeft: (_c = data.distLeft) !== null && _c !== void 0 ? _c : node.attrs.distLeft, distRight: (_d = data.distRight) !== null && _d !== void 0 ? _d : node.attrs.distRight }));
        view.dispatch(tr.scrollIntoView());
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext]);
    // Open image properties dialog
    const handleOpenImageProperties = useCallback(() => {
        setImagePropsOpen(true);
    }, []);
    // Apply image properties (alt text + border)
    const handleApplyImageProperties = useCallback((data) => {
        var _a, _b, _c, _d;
        const view = getActiveEditorView();
        if (!view || !state.pmImageContext)
            return;
        const pos = state.pmImageContext.pos;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'image')
            return;
        const tr = view.state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { alt: (_a = data.alt) !== null && _a !== void 0 ? _a : null, borderWidth: (_b = data.borderWidth) !== null && _b !== void 0 ? _b : null, borderColor: (_c = data.borderColor) !== null && _c !== void 0 ? _c : null, borderStyle: (_d = data.borderStyle) !== null && _d !== void 0 ? _d : null }));
        view.dispatch(tr.scrollIntoView());
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor, state.pmImageContext]);
    // Handle footnote/endnote properties update
    const handleApplyFootnoteProperties = useCallback((footnotePr, endnotePr) => {
        var _a;
        if (!((_a = history.state) === null || _a === void 0 ? void 0 : _a.package))
            return;
        const newDoc = Object.assign(Object.assign({}, history.state.package.document), { finalSectionProperties: Object.assign(Object.assign({}, history.state.package.document.finalSectionProperties), { footnotePr,
                endnotePr }) });
        pushDocument(Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, history.state.package), { document: newDoc }) }));
    }, [history, pushDocument]);
    const openSplitCellDialog = useCallback(() => {
        var _a, _b;
        const view = getActiveEditorView();
        const pmConfig = view ? getSplitCellDialogConfig(view.state) : null;
        const legacyConfig = pmConfig ? null : tableSelection.getSplitCellConfig();
        const config = pmConfig !== null && pmConfig !== void 0 ? pmConfig : legacyConfig;
        if (!config)
            return;
        setSplitCellDialogState(Object.assign(Object.assign({ isOpen: true }, config), { source: pmConfig ? 'pm' : 'legacy', capturedCellRow: (_a = pmConfig === null || pmConfig === void 0 ? void 0 : pmConfig.capturedCellRow) !== null && _a !== void 0 ? _a : null, capturedCellCol: (_b = pmConfig === null || pmConfig === void 0 ? void 0 : pmConfig.capturedCellCol) !== null && _b !== void 0 ? _b : null }));
    }, [getActiveEditorView, tableSelection]);
    // Handle table action from Toolbar - use ProseMirror commands
    const handleTableAction = useCallback((action) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const view = getActiveEditorView();
        if (!view) {
            if (action === 'splitCell') {
                openSplitCellDialog();
            }
            else if (typeof action !== 'object') {
                tableSelection.handleAction(action);
            }
            return;
        }
        switch (action) {
            case 'addRowAbove':
                addRowAbove(view.state, view.dispatch);
                break;
            case 'addRowBelow':
                addRowBelow(view.state, view.dispatch);
                break;
            case 'addColumnLeft':
                addColumnLeft(view.state, view.dispatch);
                break;
            case 'addColumnRight':
                addColumnRight(view.state, view.dispatch);
                break;
            case 'deleteRow':
                pmDeleteRow(view.state, view.dispatch);
                break;
            case 'deleteColumn':
                pmDeleteColumn(view.state, view.dispatch);
                break;
            case 'deleteTable':
                pmDeleteTable(view.state, view.dispatch);
                break;
            case 'selectTable':
                pmSelectTable(view.state, view.dispatch);
                break;
            case 'selectRow':
                pmSelectRow(view.state, view.dispatch);
                break;
            case 'selectColumn':
                pmSelectColumn(view.state, view.dispatch);
                break;
            case 'mergeCells':
                pmMergeCells(view.state, view.dispatch);
                break;
            case 'splitCell':
                openSplitCellDialog();
                break;
            // Border actions — use current border spec from toolbar
            case 'borderAll':
                setAllTableBorders(view.state, view.dispatch, borderSpecRef.current);
                break;
            case 'borderOutside':
                setOutsideTableBorders(view.state, view.dispatch, borderSpecRef.current);
                break;
            case 'borderInside':
                setInsideTableBorders(view.state, view.dispatch, borderSpecRef.current);
                break;
            case 'borderNone':
                removeTableBorders(view.state, view.dispatch);
                break;
            // Per-side border actions (use current border spec)
            case 'borderTop':
                setCellBorder('top', borderSpecRef.current, true)(view.state, view.dispatch);
                break;
            case 'borderBottom':
                setCellBorder('bottom', borderSpecRef.current, true)(view.state, view.dispatch);
                break;
            case 'borderLeft':
                setCellBorder('left', borderSpecRef.current, true)(view.state, view.dispatch);
                break;
            case 'borderRight':
                setCellBorder('right', borderSpecRef.current, true)(view.state, view.dispatch);
                break;
            default:
                // Handle complex actions (with parameters)
                if (typeof action === 'object') {
                    if (action.type === 'cellFillColor') {
                        setCellFillColor(action.color)(view.state, view.dispatch);
                    }
                    else if (action.type === 'borderColor') {
                        const rgb = action.color.replace(/^#/, '');
                        borderSpecRef.current = Object.assign(Object.assign({}, borderSpecRef.current), { color: { rgb } });
                        setTableBorderColor(action.color)(view.state, view.dispatch);
                    }
                    else if (action.type === 'borderWidth') {
                        borderSpecRef.current = Object.assign(Object.assign({}, borderSpecRef.current), { size: action.size });
                        setTableBorderWidth(action.size)(view.state, view.dispatch);
                    }
                    else if (action.type === 'cellBorder') {
                        setCellBorder(action.side, {
                            style: action.style,
                            size: action.size,
                            color: { rgb: action.color.replace(/^#/, '') },
                        })(view.state, view.dispatch);
                    }
                    else if (action.type === 'cellVerticalAlign') {
                        setCellVerticalAlign(action.align)(view.state, view.dispatch);
                    }
                    else if (action.type === 'cellMargins') {
                        setCellMargins(action.margins)(view.state, view.dispatch);
                    }
                    else if (action.type === 'cellTextDirection') {
                        setCellTextDirection(action.direction)(view.state, view.dispatch);
                    }
                    else if (action.type === 'toggleNoWrap') {
                        toggleNoWrap()(view.state, view.dispatch);
                    }
                    else if (action.type === 'rowHeight') {
                        setRowHeight(action.height, action.rule)(view.state, view.dispatch);
                    }
                    else if (action.type === 'toggleHeaderRow') {
                        toggleHeaderRow()(view.state, view.dispatch);
                    }
                    else if (action.type === 'distributeColumns') {
                        distributeColumns()(view.state, view.dispatch);
                    }
                    else if (action.type === 'distributeRows') {
                        distributeRows()(view.state, view.dispatch);
                    }
                    else if (action.type === 'sortTable') {
                        sortTable(action.direction)(view.state, view.dispatch);
                    }
                    else if (action.type === 'autoFitContents') {
                        autoFitContents()(view.state, view.dispatch);
                    }
                    else if (action.type === 'autoFitWindow') {
                        autoFitWindow()(view.state, view.dispatch);
                    }
                    else if (action.type === 'openTableProperties') {
                        setTablePropsOpen(true);
                    }
                    else if (action.type === 'tableProperties') {
                        setTableProperties(action.props)(view.state, view.dispatch);
                    }
                    else if (action.type === 'applyTableStyle') {
                        // Resolve style data from built-in presets or document styles
                        let preset = getBuiltinTableStyle(action.styleId);
                        const currentDocForTable = historyStateRef.current;
                        if (!preset && (currentDocForTable === null || currentDocForTable === void 0 ? void 0 : currentDocForTable.package.styles)) {
                            const styleResolver = getCachedStyleResolver(currentDocForTable.package.styles);
                            const docStyle = styleResolver.getStyle(action.styleId);
                            if (docStyle) {
                                // Convert to preset inline (same as documentStyleToPreset)
                                preset = { id: docStyle.styleId, name: (_a = docStyle.name) !== null && _a !== void 0 ? _a : docStyle.styleId };
                                if ((_b = docStyle.tblPr) === null || _b === void 0 ? void 0 : _b.borders) {
                                    const b = docStyle.tblPr.borders;
                                    preset.tableBorders = {};
                                    for (const side of [
                                        'top',
                                        'bottom',
                                        'left',
                                        'right',
                                        'insideH',
                                        'insideV',
                                    ]) {
                                        const bs = b[side];
                                        if (bs) {
                                            preset.tableBorders[side] = {
                                                style: bs.style,
                                                size: bs.size,
                                                color: ((_c = bs.color) === null || _c === void 0 ? void 0 : _c.rgb) ? { rgb: bs.color.rgb } : undefined,
                                            };
                                        }
                                    }
                                }
                                if (docStyle.tblStylePr) {
                                    preset.conditionals = {};
                                    for (const cond of docStyle.tblStylePr) {
                                        const entry = {};
                                        if ((_e = (_d = cond.tcPr) === null || _d === void 0 ? void 0 : _d.shading) === null || _e === void 0 ? void 0 : _e.fill)
                                            entry.backgroundColor = `#${cond.tcPr.shading.fill}`;
                                        if ((_f = cond.tcPr) === null || _f === void 0 ? void 0 : _f.borders) {
                                            const borders = {};
                                            for (const s of ['top', 'bottom', 'left', 'right']) {
                                                const bs2 = cond.tcPr.borders[s];
                                                if (bs2)
                                                    borders[s] = {
                                                        style: bs2.style,
                                                        size: bs2.size,
                                                        color: ((_g = bs2.color) === null || _g === void 0 ? void 0 : _g.rgb) ? { rgb: bs2.color.rgb } : undefined,
                                                    };
                                            }
                                            entry.borders = borders;
                                        }
                                        if ((_h = cond.rPr) === null || _h === void 0 ? void 0 : _h.bold)
                                            entry.bold = true;
                                        if ((_k = (_j = cond.rPr) === null || _j === void 0 ? void 0 : _j.color) === null || _k === void 0 ? void 0 : _k.rgb)
                                            entry.color = `#${cond.rPr.color.rgb}`;
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        preset.conditionals[cond.type] = entry;
                                    }
                                }
                                preset.look = { firstRow: true, lastRow: false, noHBand: false, noVBand: true };
                            }
                        }
                        if (preset) {
                            applyTableStyle({
                                styleId: preset.id,
                                tableBorders: preset.tableBorders,
                                conditionals: preset.conditionals,
                                look: preset.look,
                            })(view.state, view.dispatch);
                        }
                    }
                }
                else {
                    // Fallback to legacy table selection handler for other actions
                    tableSelection.handleAction(action);
                }
        }
        focusActiveEditor();
    }, [tableSelection, getActiveEditorView, focusActiveEditor, openSplitCellDialog]);
    // Context menu handler. Body content has its own context-menu plumbing
    // wired through PagedEditor (handleContextMenu below), so we early-out
    // when the right-click landed in the body's pages region — *unless* the
    // inline HF editor is open, in which case we need to show the menu for
    // the HF view since body's plumbing won't fire for HF clicks.
    const handleEditorContextMenu = useCallback((e) => {
        var _a;
        const target = e.target;
        if ((target === null || target === void 0 ? void 0 : target.closest('.paged-editor__pages')) && !target.closest('.hf-inline-editor')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const view = getActiveEditorView();
        const tableContext = view ? getTableContext(view.state) : { isInTable: false };
        const { from, to } = (_a = view === null || view === void 0 ? void 0 : view.state.selection) !== null && _a !== void 0 ? _a : { from: 0, to: 0 };
        const hasSel = from !== to;
        setContextMenu({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
            hasSelection: hasSel,
            cursorInTable: tableContext.isInTable,
            tableContext: tableContext.isInTable ? tableContext : null,
        });
    }, [getActiveEditorView]);
    // Handle formatting action from toolbar
    const handleFormat = useCallback((action) => {
        var _a;
        const view = getActiveEditorView();
        if (!view)
            return;
        // Focus editor first to ensure we can dispatch commands
        view.focus();
        // Restore selection if it was lost during toolbar interaction
        // This happens when user clicks on dropdown menus (font picker, style picker, etc.)
        // Only restore for the body editor — HF editor manages its own selection
        const isBodyEditor = view === ((_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView());
        const { from, to } = view.state.selection;
        const savedSelection = lastSelectionRef.current;
        if (isBodyEditor &&
            savedSelection &&
            (from !== savedSelection.from || to !== savedSelection.to)) {
            // Selection was lost (focus moved to dropdown portal) - restore it
            try {
                const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, savedSelection.from, savedSelection.to));
                view.dispatch(tr);
            }
            catch (e) {
                // If restoration fails (e.g., positions are invalid after doc change), continue with current selection
                console.warn('Could not restore selection:', e);
            }
        }
        // Handle simple toggle actions
        if (action === 'bold') {
            toggleBold(view.state, view.dispatch);
            return;
        }
        if (action === 'italic') {
            toggleItalic(view.state, view.dispatch);
            return;
        }
        if (action === 'underline') {
            toggleUnderline(view.state, view.dispatch);
            return;
        }
        if (action === 'strikethrough') {
            toggleStrike(view.state, view.dispatch);
            return;
        }
        if (action === 'superscript') {
            toggleSuperscript(view.state, view.dispatch);
            return;
        }
        if (action === 'subscript') {
            toggleSubscript(view.state, view.dispatch);
            return;
        }
        if (action === 'bulletList') {
            toggleBulletList(view.state, view.dispatch);
            return;
        }
        if (action === 'numberedList') {
            toggleNumberedList(view.state, view.dispatch);
            return;
        }
        if (action === 'indent') {
            // Try list indent first, then paragraph indent
            if (!increaseListLevel(view.state, view.dispatch)) {
                increaseIndent()(view.state, view.dispatch);
            }
            return;
        }
        if (action === 'outdent') {
            // Try list outdent first, then paragraph outdent
            if (!decreaseListLevel(view.state, view.dispatch)) {
                decreaseIndent()(view.state, view.dispatch);
            }
            return;
        }
        if (action === 'clearFormatting') {
            clearFormatting(view.state, view.dispatch);
            return;
        }
        if (action === 'setRtl') {
            setRtl(view.state, view.dispatch);
            return;
        }
        if (action === 'setLtr') {
            setLtr(view.state, view.dispatch);
            return;
        }
        if (action === 'selectAll') {
            const { doc } = view.state;
            const tr = view.state.tr.setSelection(TextSelection.create(doc, 0, doc.content.size));
            view.dispatch(tr);
            return;
        }
        if (action === 'toggleSmallCaps') {
            toggleSmallCaps(view.state, view.dispatch);
            return;
        }
        if (action === 'toggleAllCaps') {
            toggleAllCaps(view.state, view.dispatch);
            return;
        }
        if (action === 'toggleHidden') {
            toggleHidden(view.state, view.dispatch);
            return;
        }
        if (action === 'toggleEmboss') {
            toggleEmboss(view.state, view.dispatch);
            return;
        }
        if (action === 'toggleImprint') {
            toggleImprint(view.state, view.dispatch);
            return;
        }
        if (action === 'toggleTextShadow') {
            toggleTextShadow(view.state, view.dispatch);
            return;
        }
        if (action === 'toggleTextOutline') {
            toggleTextOutline(view.state, view.dispatch);
            return;
        }
        if (action === 'restartListNumbering') {
            restartListNumbering(view.state, view.dispatch);
            return;
        }
        if (action === 'continueListNumbering') {
            continueListNumbering(view.state, view.dispatch);
            return;
        }
        if (action === 'insertLink') {
            // Get the selected text for the hyperlink dialog
            const selectedText = getSelectedText(view.state);
            // Check if we're editing an existing link
            const existingLink = getHyperlinkAttrs(view.state);
            if (existingLink) {
                hyperlinkDialog.openEdit({
                    url: existingLink.href,
                    displayText: selectedText,
                    tooltip: existingLink.tooltip,
                });
            }
            else {
                hyperlinkDialog.openInsert(selectedText);
            }
            return;
        }
        // Handle object-based actions
        if (typeof action === 'object') {
            switch (action.type) {
                case 'alignment':
                    setAlignment(action.value)(view.state, view.dispatch);
                    break;
                case 'textColor': {
                    // action.value can be a ColorValue object or a string like "#FF0000"
                    const colorVal = action.value;
                    if (typeof colorVal === 'string') {
                        setTextColor({ rgb: colorVal.replace('#', '') })(view.state, view.dispatch);
                    }
                    else if (colorVal.auto) {
                        // "Automatic" — remove text color
                        clearTextColor(view.state, view.dispatch);
                    }
                    else {
                        setTextColor(colorVal)(view.state, view.dispatch);
                    }
                    break;
                }
                case 'highlightColor': {
                    // Convert hex to OOXML named highlight value (e.g., 'FFFF00' → 'yellow')
                    const highlightName = action.value ? mapHexToHighlightName(action.value) : '';
                    setHighlight(highlightName || action.value)(view.state, view.dispatch);
                    break;
                }
                case 'fontSize':
                    // Convert points to half-points (OOXML uses half-points for font sizes)
                    setFontSize(pointsToHalfPoints(action.value))(view.state, view.dispatch);
                    break;
                case 'fontFamily':
                    setFontFamily(action.value)(view.state, view.dispatch);
                    break;
                case 'lineSpacing':
                    setLineSpacing(action.value)(view.state, view.dispatch);
                    break;
                case 'spaceBefore':
                    setSpaceBefore(action.value)(view.state, view.dispatch);
                    break;
                case 'spaceAfter':
                    setSpaceAfter(action.value)(view.state, view.dispatch);
                    break;
                case 'charSpacing':
                    setCharacterSpacing(action.value)(view.state, view.dispatch);
                    break;
                case 'keepNext':
                case 'keepLines':
                case 'pageBreakBefore':
                case 'widowControl':
                    setParagraphAttrs({ [action.type]: action.value })(view.state, view.dispatch);
                    break;
                case 'applyStyle': {
                    // Resolve style to get its formatting properties
                    // Use ref to avoid stale closure (handleFormat has [] deps)
                    const currentDoc = historyStateRef.current;
                    const styleResolver = (currentDoc === null || currentDoc === void 0 ? void 0 : currentDoc.package.styles)
                        ? getCachedStyleResolver(currentDoc.package.styles)
                        : null;
                    if (styleResolver) {
                        const resolved = styleResolver.resolveParagraphStyle(action.value);
                        applyStyle(action.value, {
                            paragraphFormatting: resolved.paragraphFormatting,
                            runFormatting: resolved.runFormatting,
                        })(view.state, view.dispatch);
                    }
                    else {
                        // No styles available, just set the styleId
                        applyStyle(action.value)(view.state, view.dispatch);
                    }
                    break;
                }
            }
        }
    }, [getActiveEditorView, openSplitCellDialog]);
    const handleSplitCellDialogClose = useCallback(() => {
        setSplitCellDialogState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: false, source: null, capturedCellRow: null, capturedCellCol: null })));
    }, []);
    const handleSplitCellDialogApply = useCallback((rows, cols) => {
        var _a, _b;
        if (splitCellDialogState.source === 'legacy') {
            tableSelection.applySplitCell(rows, cols);
            focusActiveEditor();
            return;
        }
        const view = getActiveEditorView();
        if (!view)
            return;
        splitActiveTableCell(view.state, view.dispatch, rows, cols, (_a = splitCellDialogState.capturedCellRow) !== null && _a !== void 0 ? _a : undefined, (_b = splitCellDialogState.capturedCellCol) !== null && _b !== void 0 ? _b : undefined);
        focusActiveEditor();
    }, [
        focusActiveEditor,
        getActiveEditorView,
        splitCellDialogState.source,
        splitCellDialogState.capturedCellRow,
        splitCellDialogState.capturedCellCol,
        tableSelection,
    ]);
    // Handle zoom change
    const handleZoomChange = useCallback((zoom) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { zoom })));
    }, []);
    // Stable PagedEditor onTotalPagesChange — avoids breaking memo() on every render.
    const handleTotalPagesChange = useCallback((totalPages) => {
        setScrollPageInfo((prev) => prev.totalPages === totalPages ? prev : Object.assign(Object.assign({}, prev), { totalPages }));
    }, []);
    // Stable PagedEditor onOpenProperties — avoids breaking memo() on every render.
    const handleOpenProperties = useCallback(() => openRightPanel('properties'), [openRightPanel]);
    // Stable PagedEditor onReady — avoids breaking memo() on every render.
    const handlePagedEditorReady = useCallback((ref) => {
        const view = ref.getView();
        if (view)
            setPmState(view.state);
        if (view)
            onEditorViewReady === null || onEditorViewReady === void 0 ? void 0 : onEditorViewReady(view);
    }, [onEditorViewReady]);
    // Ref pattern for onSelectionChange: the implementation reads the latest
    // closure values on every call (resolvedCommentIds, commentSidebarItems…)
    // while the _stable wrapper_ never changes reference, keeping PagedEditor's
    // memo() effective across every DocxEditor re-render caused by
    // pmState / isDirty / isSaving state flips.
    const _pagedSelectionChangeImplRef = useRef(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const _pagedOnSelectionChangeStable = useCallback((from, to) => _pagedSelectionChangeImplRef.current(from, to), []);
    // Handle hyperlink dialog submit
    const handleHyperlinkSubmit = useCallback((data) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const url = data.url || '';
        const tooltip = data.tooltip;
        // Check if we have a selection
        const { empty } = view.state.selection;
        if (empty && data.displayText) {
            // No selection but display text provided - insert new linked text
            insertHyperlink(data.displayText, url, tooltip)(view.state, view.dispatch);
        }
        else if (!empty) {
            // Have selection - apply hyperlink to it
            setHyperlink(url, tooltip)(view.state, view.dispatch);
        }
        else if (data.displayText) {
            // Empty selection but display text provided
            insertHyperlink(data.displayText, url, tooltip)(view.state, view.dispatch);
        }
        hyperlinkDialog.close();
        focusActiveEditor();
    }, [hyperlinkDialog, getActiveEditorView, focusActiveEditor]);
    // Shared: remove hyperlink mark and refocus editor
    const doRemoveHyperlink = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        removeHyperlink(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Handle hyperlink removal (from dialog)
    const handleHyperlinkRemove = useCallback(() => {
        doRemoveHyperlink();
        hyperlinkDialog.close();
    }, [hyperlinkDialog, doRemoveHyperlink]);
    // Handle hyperlink popup (Google Docs-style)
    const handleHyperlinkClick = useCallback((data) => setHyperlinkPopupData(data), []);
    const handleHyperlinkPopupNavigate = useCallback((href) => {
        window.open(href, '_blank', 'noopener,noreferrer');
    }, []);
    const handleHyperlinkPopupCopy = useCallback((href) => {
        navigator.clipboard.writeText(href).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = href;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }, []);
    const handleHyperlinkPopupEdit = useCallback((displayText, href) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        // Find the full hyperlink mark range at current cursor position
        const hlType = view.state.schema.marks.hyperlink;
        if (!hlType)
            return;
        const { $from } = view.state.selection;
        const linkMark = $from.marks().find((m) => m.type === hlType);
        if (linkMark) {
            // Collect all contiguous text nodes with the same hyperlink mark
            const parent = $from.parent;
            const parentStart = $from.start();
            const ranges = [];
            let currentRange = null;
            parent.forEach((node, offset) => {
                const nodeStart = parentStart + offset;
                const nodeEnd = nodeStart + node.nodeSize;
                const hlMark = node.isText
                    ? node.marks.find((m) => m.type === hlType && m.attrs.href === linkMark.attrs.href)
                    : null;
                if (hlMark) {
                    if (currentRange) {
                        currentRange.end = nodeEnd;
                    }
                    else {
                        currentRange = { start: nodeStart, end: nodeEnd };
                    }
                }
                else {
                    if (currentRange) {
                        ranges.push(currentRange);
                        currentRange = null;
                    }
                }
            });
            if (currentRange)
                ranges.push(currentRange);
            // Find the range that contains the cursor
            const cursorPos = $from.pos;
            const targetRange = ranges.find((r) => r.start <= cursorPos && cursorPos <= r.end);
            if (!targetRange)
                return;
            // Replace the text and mark
            const tr = view.state.tr;
            const newMark = hlType.create({ href, tooltip: linkMark.attrs.tooltip });
            const textNode = view.state.schema.text(displayText, [
                ...$from.marks().filter((m) => m.type !== hlType),
                newMark,
            ]);
            tr.replaceWith(targetRange.start, targetRange.end, textNode);
            view.dispatch(tr.scrollIntoView());
        }
        setHyperlinkPopupData(null);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    const handleHyperlinkPopupRemove = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const hlType = view.state.schema.marks.hyperlink;
        if (!hlType)
            return;
        const { $from } = view.state.selection;
        // Try $from.marks() first, then check the node after the cursor
        // (ProseMirror may not report marks at boundary positions)
        let linkMark = $from.marks().find((m) => m.type === hlType);
        if (!linkMark && $from.nodeAfter) {
            linkMark = $from.nodeAfter.marks.find((m) => m.type === hlType);
        }
        if (!linkMark && $from.nodeBefore) {
            linkMark = $from.nodeBefore.marks.find((m) => m.type === hlType);
        }
        // Fall back to searching by href from popup data
        if (!linkMark && hyperlinkPopupData) {
            const parent = $from.parent;
            parent.forEach((node) => {
                if (!linkMark && node.isText) {
                    const m = node.marks.find((mk) => mk.type === hlType && mk.attrs.href === hyperlinkPopupData.href);
                    if (m)
                        linkMark = m;
                }
            });
        }
        if (!linkMark)
            return;
        // Find contiguous range of nodes with matching hyperlink mark
        const parent = $from.parent;
        const parentStart = $from.start();
        const ranges = [];
        let currentRange = null;
        parent.forEach((node, offset) => {
            const nodeStart = parentStart + offset;
            const nodeEnd = nodeStart + node.nodeSize;
            const hlMark = node.isText
                ? node.marks.find((m) => m.type === hlType && m.attrs.href === linkMark.attrs.href)
                : null;
            if (hlMark) {
                if (currentRange) {
                    currentRange.end = nodeEnd;
                }
                else {
                    currentRange = { start: nodeStart, end: nodeEnd };
                }
            }
            else {
                if (currentRange) {
                    ranges.push(currentRange);
                    currentRange = null;
                }
            }
        });
        if (currentRange)
            ranges.push(currentRange);
        const cursorPos = $from.pos;
        const targetRange = ranges.find((r) => r.start <= cursorPos && cursorPos <= r.end);
        if (!targetRange)
            return;
        const tr = view.state.tr;
        tr.removeMark(targetRange.start, targetRange.end, hlType);
        view.dispatch(tr.scrollIntoView());
        setHyperlinkPopupData(null);
        focusActiveEditor();
        toast('Link removed');
    }, [getActiveEditorView, focusActiveEditor, hyperlinkPopupData]);
    const handleHyperlinkPopupClose = useCallback(() => {
        setHyperlinkPopupData(null);
    }, []);
    // Image-specific right-click menu state.
    const imageContextMenu = useImageContextMenu();
    // Right-click context menu handlers. Use the active view so the menu
    // reflects HF state when the inline editor is open.
    const handleContextMenu = useCallback((data) => {
        // Spell-check hit takes priority over both image and text menus —
        // matches Word's behaviour where a misspelled word's right-click
        // menu pre-empts the standard one.
        if (data.spellcheck) {
            setSpellMenu({
                x: data.x,
                y: data.y,
                from: data.spellcheck.from,
                to: data.spellcheck.to,
                word: data.spellcheck.word,
                suggestions: suggestionsFor(data.spellcheck.word, 5),
            });
            return;
        }
        // Image right-click takes priority over the text context menu.
        if (data.image) {
            imageContextMenu.openForImage({
                x: data.x,
                y: data.y,
                wrapType: data.image.wrapType,
                cssFloat: data.image.cssFloat,
                pos: data.image.pos,
                inlinePositionEmu: data.image.inlinePositionEmu,
            });
            return;
        }
        const view = getActiveEditorView();
        const tableContext = view ? getTableContext(view.state) : { isInTable: false };
        setContextMenu({
            isOpen: true,
            position: data,
            hasSelection: data.hasSelection,
            cursorInTable: tableContext.isInTable,
            tableContext: tableContext.isInTable ? tableContext : null,
        });
    }, [getActiveEditorView, imageContextMenu]);
    // Apply a spell-check suggestion: replace the misspelled span with
    // the picked word, preserving the marks on the first character of the
    // range so case/format don't disappear.
    const handlePickSpellSuggestion = useCallback((suggestion) => {
        var _a;
        const view = getActiveEditorView();
        if (!view || !spellMenu)
            return;
        const { from, to } = spellMenu;
        const docSize = view.state.doc.content.size;
        const clampedFrom = Math.min(Math.max(from, 0), docSize);
        const clampedTo = Math.min(Math.max(to, clampedFrom), docSize);
        // Read the marks at the start of the misspelled word so the
        // replacement carries the same bold/italic/etc styling.
        const nodeAtFrom = view.state.doc.nodeAt(clampedFrom);
        const marks = (_a = nodeAtFrom === null || nodeAtFrom === void 0 ? void 0 : nodeAtFrom.marks) !== null && _a !== void 0 ? _a : [];
        const replacementNode = view.state.schema.text(suggestion, marks);
        const tr = view.state.tr.replaceWith(clampedFrom, clampedTo, replacementNode);
        view.dispatch(tr);
        setSpellMenu(null);
    }, [getActiveEditorView, spellMenu]);
    const handleIgnoreSpell = useCallback(() => {
        if (!spellMenu)
            return;
        ignoreWord(spellMenu.word);
        const view = getActiveEditorView();
        if (view)
            refreshSpellcheckDecorations(view);
        setSpellMenu(null);
    }, [getActiveEditorView, spellMenu]);
    const handleImageWrapApply = useCallback((target) => {
        const view = getActiveEditorView();
        if (!view || imageContextMenu.imagePos === null)
            return;
        // For inline → anchor, hand the captured EMU offset to the command so
        // the new float lands where the inline glyph used to sit.
        const opts = imageContextMenu.inlinePositionEmu
            ? { initialPositionEmu: imageContextMenu.inlinePositionEmu }
            : undefined;
        setImageWrapType(imageContextMenu.imagePos, target, opts)(view.state, view.dispatch);
    }, [getActiveEditorView, imageContextMenu.imagePos, imageContextMenu.inlinePositionEmu]);
    // Text actions that ride along inside the image context menu — Word shows
    // Cut / Copy / Paste / Delete underneath the layout choices, so users don't
    // need to flip menus to do basic clipboard work on the selected image.
    const imageContextMenuTextActions = useMemo(() => [
        {
            action: 'cut',
            label: t('contextMenu.cut'),
            shortcut: t('contextMenu.cutShortcut'),
        },
        {
            action: 'copy',
            label: t('contextMenu.copy'),
            shortcut: t('contextMenu.copyShortcut'),
        },
        {
            action: 'paste',
            label: t('contextMenu.paste'),
            shortcut: t('contextMenu.pasteShortcut'),
            dividerAfter: true,
        },
        {
            action: 'delete',
            label: t('contextMenu.delete'),
            shortcut: t('contextMenu.deleteShortcut'),
        },
    ], [t]);
    const handleContextMenuClose = useCallback(() => {
        setContextMenu({
            isOpen: false,
            position: { x: 0, y: 0 },
            hasSelection: false,
            cursorInTable: false,
            tableContext: null,
        });
    }, []);
    // Writing-Assistant state. The right-click "Rewrite with AI" and
    // "Summarize with AI" menu entries only appear when the matching
    // feature is enabled AND a model is currently loaded — anything
    // else and the user would tap a menu item that errors immediately.
    const writerState = useWriterState();
    const aiRewriteReady = writerState.enabledFeatures.includes('tone') &&
        writerState.phase === 'ready' &&
        writerState.loadedModelId !== null;
    const aiSummarizeReady = writerState.enabledFeatures.includes('summarize-basic') &&
        writerState.phase === 'ready' &&
        writerState.loadedModelId !== null;
    // "Ask AI about this" routes through the chat panel + the advanced
    // Llama tier (the only resident model that actually does open-ended
    // conversation). Hide the entry on the basic flan-t5 tier so users
    // don't ask the encoder-decoder a free-form question.
    const aiAskReady = writerState.enabledFeatures.includes('advanced-llm') &&
        writerState.phase === 'ready' &&
        writerState.loadedModelId !== null;
    const contextMenuItems = useMemo(() => {
        var _a, _b, _c, _d, _e, _f, _g;
        const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
        const mod = isMac ? '⌘' : 'Ctrl';
        const items = [
            { action: 'cut', label: 'Cut', shortcut: `${mod}+X` },
            { action: 'copy', label: 'Copy', shortcut: `${mod}+C` },
            { action: 'paste', label: 'Paste', shortcut: `${mod}+V` },
            {
                action: 'pasteAsPlainText',
                label: 'Paste as Plain Text',
                shortcut: `${mod}+Shift+V`,
                dividerAfter: true,
            },
            {
                action: 'delete',
                label: 'Delete',
                shortcut: 'Del',
                dividerAfter: !contextMenu.hasSelection && !contextMenu.cursorInTable,
            },
        ];
        if (contextMenu.hasSelection) {
            items.push({
                action: 'addComment',
                label: 'Comment',
            });
            // Quick-translate: instant replace with the last target the
            // user picked. The dialog entry sticks around for picking a
            // different language or seeing the preview.
            const lastTranslateTarget = (() => {
                try {
                    return window.localStorage.getItem('translate:last-target');
                }
                catch (_a) {
                    return null;
                }
            })();
            const targetLabel = lastTranslateTarget &&
                ((_a = TRANSLATE_LANGUAGES.find((l) => l.code === lastTranslateTarget)) === null || _a === void 0 ? void 0 : _a.label);
            if (targetLabel) {
                items.push({
                    action: 'translateQuickReplace',
                    label: `Translate to ${targetLabel}`,
                });
            }
            items.push({
                action: 'translateSelection',
                label: 'Translate selection…',
            });
            if (aiRewriteReady) {
                items.push({ action: 'aiRewrite', label: 'Rewrite with AI' });
            }
            if (aiSummarizeReady) {
                items.push({ action: 'aiSummarize', label: 'Summarize with AI' });
            }
            if (aiAskReady) {
                items.push({ action: 'aiAsk', label: 'Ask AI about this' });
            }
            // Add the divider on the last selection-only entry, before the
            // table block / Select All trailer.
            if (items.length > 0) {
                const last = items[items.length - 1];
                if (last)
                    last.dividerAfter = !contextMenu.cursorInTable;
            }
        }
        if (contextMenu.cursorInTable) {
            items.push({ action: 'addRowAbove', label: 'Insert row above' }, { action: 'addRowBelow', label: 'Insert row below' }, { action: 'deleteRow', label: 'Delete row', dividerAfter: true }, { action: 'addColumnLeft', label: 'Insert column left' }, { action: 'addColumnRight', label: 'Insert column right' }, { action: 'deleteColumn', label: 'Delete column', dividerAfter: true }, {
                action: 'mergeCells',
                label: (_c = (_b = i18n === null || i18n === void 0 ? void 0 : i18n.table) === null || _b === void 0 ? void 0 : _b.mergeCells) !== null && _c !== void 0 ? _c : defaultLocale.table.mergeCells,
                disabled: !((_d = contextMenu.tableContext) === null || _d === void 0 ? void 0 : _d.hasMultiCellSelection),
            }, {
                action: 'splitCell',
                label: (_f = (_e = i18n === null || i18n === void 0 ? void 0 : i18n.table) === null || _e === void 0 ? void 0 : _e.splitCell) !== null && _f !== void 0 ? _f : defaultLocale.table.splitCell,
                disabled: !((_g = contextMenu.tableContext) === null || _g === void 0 ? void 0 : _g.canSplitCell),
                dividerAfter: true,
            }, 
            // Whole-table delete — was buried in the TableMoreDropdown
            // before, so users couldn't find it. Surfaced here so the
            // right-click in a cell exposes the same affordance Notion /
            // Word both surface inline.
            { action: 'deleteTable', label: 'Delete table', dividerAfter: true });
        }
        items.push({ action: 'selectAll', label: 'Select All', shortcut: `${mod}+A` });
        return items;
    }, [
        contextMenu.hasSelection,
        contextMenu.cursorInTable,
        contextMenu.tableContext,
        aiRewriteReady,
        aiSummarizeReady,
        aiAskReady,
    ]);
    // ---------------------------------------------------------------
    // AI suggestion (rewrite / summarize) — popover-based flow.
    // ---------------------------------------------------------------
    const runAiSuggestion = useCallback((mode, tone, range) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const view = getActiveEditorView();
        if (!view)
            return;
        (_a = aiAbortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        const controller = new AbortController();
        aiAbortRef.current = controller;
        setAiSuggestion((prev) => prev ? Object.assign(Object.assign({}, prev), { busy: true, suggestion: null, error: null, inferenceMs: null }) : prev);
        try {
            const slice = view.state.doc.slice(range.from, range.to);
            const ctx = sampleContext(view.state.doc, range.from, range.to);
            const startedAt = Date.now();
            const transformed = yield rewriteFragment(slice.content, view.state.schema, mode === 'rewrite' ? 'rewrite' : 'summarize', {
                tone,
                contextBefore: ctx.before,
                contextAfter: ctx.after,
            }, controller.signal);
            const text = (() => {
                let out = '';
                for (let i = 0; i < transformed.childCount; i++)
                    out += transformed.child(i).textContent;
                return out.trim();
            })();
            if (controller.signal.aborted)
                return;
            setAiSuggestion((prev) => prev
                ? Object.assign(Object.assign({}, prev), { suggestion: text || prev.original, inferenceMs: Date.now() - startedAt, busy: false }) : prev);
            // Stash the transformed fragment so Accept can replay it
            // without re-running inference.
            aiFragmentRef.current = transformed;
        }
        catch (err) {
            if (controller.signal.aborted)
                return;
            const e = err;
            const msg = ((_b = e.message) === null || _b === void 0 ? void 0 : _b.includes('No model is loaded'))
                ? mode === 'rewrite'
                    ? 'Enable Tone & style rewrite in the Writing Assistant first.'
                    : 'Enable Summarize selection in the Writing Assistant first.'
                : ((_c = e.message) !== null && _c !== void 0 ? _c : 'Inference failed.');
            setAiSuggestion((prev) => (prev ? Object.assign(Object.assign({}, prev), { busy: false, error: msg }) : prev));
        }
    }), [getActiveEditorView]);
    const openAiSuggestion = useCallback((mode) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const { from, to } = view.state.selection;
        if (from === to)
            return;
        const original = view.state.doc.textBetween(from, to, ' ', ' ').trim();
        if (!original)
            return;
        // Right-docked panel doesn't need a per-selection bbox — the
        // dock position is fixed. We still snapshot the PM range so
        // Accept replays exactly the span the user picked, even if the
        // cursor moves while the panel is open.
        // Close any other right panel so the suggestion gets the slot.
        setShowWritingAssistant(false);
        setShowChatPanel(false);
        setShowVersionHistory(false);
        setAiSuggestion({
            mode,
            from,
            to,
            original,
            suggestion: null,
            inferenceMs: null,
            tone: 'polish',
            busy: true,
            error: null,
        });
        void runAiSuggestion(mode, 'polish', { from, to });
    }, [getActiveEditorView, runAiSuggestion]);
    const handleAiAccept = useCallback(() => {
        var _a;
        const view = getActiveEditorView();
        const state = aiSuggestion;
        if (!view || !state)
            return;
        const docSize = view.state.doc.content.size;
        if (state.mode === 'rewrite' && aiFragmentRef.current) {
            // Land the rewrite as a tracked change instead of clobbering the
            // selection — the original stays in place struck-through (red),
            // the AI's version arrives underlined (green) so the user
            // accepts or rejects through the existing tracked-change UI.
            const from = Math.min(Math.max(state.from, 0), docSize);
            const to = Math.min(Math.max(state.to, from), docSize);
            applyRewriteAsSuggestion({
                view,
                from,
                to,
                replacement: aiFragmentRef.current,
            });
        }
        else if (state.mode === 'summarize' && state.suggestion) {
            // Insert the summary at the END of the selection as a tracked
            // change. Nothing gets deleted; the user just gets a marked
            // insertion they can accept or reject.
            const to = Math.min(Math.max(state.to, 0), docSize);
            applyInsertAsSuggestion({
                view,
                at: to,
                text: `\n\nSummary: ${state.suggestion}\n`,
            });
        }
        (_a = aiAbortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        aiAbortRef.current = null;
        aiFragmentRef.current = null;
        setAiSuggestion(null);
        // Hint the user where the suggestion just landed. The doc body
        // now carries the deletion + insertion marks, and the action bar
        // (now always visible when there are tracked changes) gives them
        // Accept All / Reject All / Prev / Next at the top-right.
        toast.success('AI suggestion ready for review — accept or reject in the doc.', {
            duration: 5000,
        });
    }, [aiSuggestion, getActiveEditorView]);
    const handleAiReject = useCallback(() => {
        var _a;
        (_a = aiAbortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        aiAbortRef.current = null;
        aiFragmentRef.current = null;
        setAiSuggestion(null);
    }, []);
    const handleAiRetry = useCallback(() => {
        if (!aiSuggestion)
            return;
        void runAiSuggestion(aiSuggestion.mode, aiSuggestion.tone, {
            from: aiSuggestion.from,
            to: aiSuggestion.to,
        });
    }, [aiSuggestion, runAiSuggestion]);
    const handleAiTone = useCallback((id) => {
        if (!aiSuggestion)
            return;
        const next = id;
        setAiSuggestion((prev) => (prev ? Object.assign(Object.assign({}, prev), { tone: next, busy: true }) : prev));
        void runAiSuggestion(aiSuggestion.mode, next, {
            from: aiSuggestion.from,
            to: aiSuggestion.to,
        });
    }, [aiSuggestion, runAiSuggestion]);
    const handleContextMenuAction = useCallback((action) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const view = getActiveEditorView();
        if (!view)
            return;
        // Focus the hidden PM so execCommand targets the right element
        focusActiveEditor();
        switch (action) {
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste': {
                // Use Clipboard API — document.execCommand('paste') is blocked in modern browsers
                try {
                    const items = yield navigator.clipboard.read();
                    let html = '';
                    let text = '';
                    for (const item of items) {
                        if (item.types.includes('text/html')) {
                            html = yield (yield item.getType('text/html')).text();
                        }
                        if (item.types.includes('text/plain')) {
                            text = yield (yield item.getType('text/plain')).text();
                        }
                    }
                    const dt = new DataTransfer();
                    if (html)
                        dt.items.add(html, 'text/html');
                    if (text)
                        dt.items.add(text, 'text/plain');
                    const pasteEvent = new ClipboardEvent('paste', {
                        clipboardData: dt,
                        bubbles: true,
                        cancelable: true,
                    });
                    view.dom.dispatchEvent(pasteEvent);
                }
                catch (_c) {
                    try {
                        const text = yield navigator.clipboard.readText();
                        if (text)
                            view.dispatch(view.state.tr.insertText(text));
                    }
                    catch (_d) {
                        // Clipboard access denied
                    }
                }
                break;
            }
            case 'pasteAsPlainText':
                try {
                    const text = yield navigator.clipboard.readText();
                    if (text)
                        view.dispatch(view.state.tr.insertText(text));
                }
                catch (_e) {
                    // Clipboard access denied
                }
                break;
            case 'delete': {
                const { from, to } = view.state.selection;
                if (from !== to) {
                    view.dispatch(view.state.tr.deleteRange(from, to));
                }
                break;
            }
            case 'selectAll':
                view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 0, view.state.doc.content.size)));
                break;
            // Table operations
            case 'addRowAbove':
                addRowAbove(view.state, view.dispatch);
                break;
            case 'addRowBelow':
                addRowBelow(view.state, view.dispatch);
                break;
            case 'deleteRow':
                pmDeleteRow(view.state, view.dispatch);
                break;
            case 'addColumnLeft':
                addColumnLeft(view.state, view.dispatch);
                break;
            case 'addColumnRight':
                addColumnRight(view.state, view.dispatch);
                break;
            case 'deleteColumn':
                pmDeleteColumn(view.state, view.dispatch);
                break;
            case 'deleteTable':
                // The right-click "Delete table" item (see context-menu items)
                // routes here; without this case it fell through to a no-op,
                // so the menu entry did nothing.
                pmDeleteTable(view.state, view.dispatch);
                break;
            case 'mergeCells':
                pmMergeCells(view.state, view.dispatch);
                break;
            case 'splitCell':
                openSplitCellDialog();
                break;
            // Translate — capture the selection range so the dialog's
            // Replace button can write back to exactly this span.
            case 'translateSelection': {
                const { from, to } = view.state.selection;
                if (from === to)
                    break;
                const raw = view.state.doc.textBetween(from, to, ' ', ' ').trim();
                setTranslateRange({ from, to });
                setTranslateText(raw.length > 0 ? raw : null);
                setShowTranslate(true);
                break;
            }
            // Quick translate — instant format-preserving replace into
            // the user's last-chosen target language. No dialog, no
            // preview, just the same translateFragment path the dialog
            // would have run on Accept.
            case 'translateQuickReplace': {
                const { from, to } = view.state.selection;
                if (from === to)
                    break;
                let target = null;
                try {
                    target = window.localStorage.getItem('translate:last-target');
                }
                catch (_f) {
                    // Storage denied — fall back to dialog.
                }
                if (!target) {
                    // No remembered language yet; route through the dialog so
                    // the user picks one.
                    const raw = view.state.doc.textBetween(from, to, ' ', ' ').trim();
                    setTranslateRange({ from, to });
                    setTranslateText(raw.length > 0 ? raw : null);
                    setShowTranslate(true);
                    break;
                }
                const targetLang = target;
                const docSize = view.state.doc.content.size;
                const clampedFrom = Math.min(Math.max(from, 0), docSize);
                const clampedTo = Math.min(Math.max(to, clampedFrom), docSize);
                const slice = view.state.doc.slice(clampedFrom, clampedTo);
                const targetLabel = (_b = (_a = TRANSLATE_LANGUAGES.find((l) => l.code === targetLang)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : targetLang.toUpperCase();
                const toastId = toast.loading(`Translating to ${targetLabel}…`);
                try {
                    const translatedContent = yield translateFragment(slice.content, view.state.schema, 'en', targetLang);
                    const translatedSlice = new Slice(translatedContent, slice.openStart, slice.openEnd);
                    const live = getActiveEditorView();
                    if (!live) {
                        toast.dismiss(toastId);
                        break;
                    }
                    const tr = live.state.tr.replace(clampedFrom, clampedTo, translatedSlice);
                    live.dispatch(tr);
                    toast.success(`Replaced with ${targetLabel} translation.`, { id: toastId });
                }
                catch (_g) {
                    toast.error("Couldn't translate — check your connection or pick another language.", {
                        id: toastId,
                    });
                }
                break;
            }
            // AI rewrite — opens the inline suggestion popover anchored
            // to the selection. The popover is what runs the model + lets
            // the user Accept / Reject; nothing changes in the doc until
            // they explicitly click Replace.
            case 'aiRewrite': {
                openAiSuggestion('rewrite');
                break;
            }
            case 'aiSummarize': {
                openAiSuggestion('summarize');
                break;
            }
            // AI Ask — opens the chat panel; the selection chip will
            // auto-include the current selection because the panel reads
            // it on mount.
            case 'aiAsk': {
                openRightPanel('chat');
                break;
            }
            // Comment — same flow as floating comment button
            case 'addComment': {
                const { from, to } = view.state.selection;
                if (from === to)
                    break;
                // Compute Y position BEFORE dispatching — dispatch triggers re-layout
                // which rebuilds page DOM and invalidates the old span elements
                const yPos = findSelectionYPosition(scrollContainerRef.current, editorContentRef.current, from);
                setCommentSelectionRange({ from, to });
                const pendingMark = view.state.schema.marks.comment.create({
                    commentId: PENDING_COMMENT_ID,
                });
                const tr = view.state.tr.addMark(from, to, pendingMark);
                tr.setSelection(TextSelection.create(tr.doc, to));
                view.dispatch(tr);
                setAddCommentYPosition(yPos);
                setShowCommentsSidebar(true);
                setIsAddingComment(true);
                setFloatingCommentBtn(null);
                break;
            }
        }
        // TextContextMenu calls onClose after onAction, so no need to close here
    }), [getActiveEditorView, focusActiveEditor, openSplitCellDialog]);
    // Handle margin changes from rulers
    const createMarginHandler = useCallback((property) => (marginTwips) => {
        if (!history.state || readOnly)
            return;
        const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, history.state.package), { document: Object.assign(Object.assign({}, history.state.package.document), { finalSectionProperties: Object.assign(Object.assign({}, history.state.package.document.finalSectionProperties), { [property]: marginTwips }) }) }) });
        handleDocumentChange(newDoc);
    }, [history.state, readOnly, handleDocumentChange]);
    const handleLeftMarginChange = useMemo(() => createMarginHandler('marginLeft'), [createMarginHandler]);
    const handleRightMarginChange = useMemo(() => createMarginHandler('marginRight'), [createMarginHandler]);
    const handleTopMarginChange = useMemo(() => createMarginHandler('marginTop'), [createMarginHandler]);
    const handleBottomMarginChange = useMemo(() => createMarginHandler('marginBottom'), [createMarginHandler]);
    // Page setup apply handler
    const handlePageSetupApply = useCallback((props) => {
        if (!history.state || readOnly)
            return;
        const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, history.state.package), { document: Object.assign(Object.assign({}, history.state.package.document), { finalSectionProperties: Object.assign(Object.assign({}, history.state.package.document.finalSectionProperties), props) }) }) });
        handleDocumentChange(newDoc);
    }, [history.state, readOnly, handleDocumentChange]);
    // Page-color apply handler — writes the new color into the
    // doc-level <w:background> slot so the painter picks it up on
    // the next render and the next save round-trips it. `undefined`
    // clears the background entirely (the serializer skips emitting
    // <w:background> when `body.background` is absent).
    const handlePageColorChange = useCallback((color) => {
        if (!history.state || readOnly)
            return;
        const rgb = color === null || color === void 0 ? void 0 : color.replace(/^#/, '').toUpperCase();
        const nextBg = rgb ? { color: { rgb } } : undefined;
        const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, history.state.package), { document: Object.assign(Object.assign({}, history.state.package.document), { background: nextBg }) }) });
        handleDocumentChange(newDoc);
    }, [history.state, readOnly, handleDocumentChange]);
    // Accessibility check (D8) — snapshots issues from the current PM doc
    // when the user opens the dialog. Read-only; no edits to the document.
    const handleOpenAccessibility = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (view)
            setAccessibilityIssues(checkAccessibility(view.state.doc));
        setShowAccessibility(true);
    }, []);
    const handleAccessibilityGoto = useCallback((pmPos) => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const { doc } = view.state;
        const safePos = Math.max(0, Math.min(pmPos, doc.content.size));
        // Resolve to the nearest valid text selection so an image position
        // doesn't fail (NodeSelection vs TextSelection).
        const $pos = doc.resolve(safePos);
        const near = $pos.parent.isTextblock || $pos.parent.inlineContent
            ? TextSelection.near($pos)
            : TextSelection.create(doc, safePos);
        view.dispatch(view.state.tr.setSelection(near).scrollIntoView());
        view.focus();
    }, []);
    // Building blocks (C6) — capture the active editor's selection content
    // at open time so the dialog can save it later without depending on the
    // selection still being live (focus moves to the dialog input).
    const handleOpenBuildingBlocks = useCallback(() => {
        const view = getActiveEditorView();
        if (view && !view.state.selection.empty) {
            const { from, to } = view.state.selection;
            const slice = view.state.selection.content();
            const text = view.state.doc.textBetween(from, to, ' ', ' ');
            if (slice.content.size > 0) {
                setPendingBuildingBlock({
                    content: slice.toJSON(),
                    preview: previewFromText(text) || '(non-text content)',
                });
            }
            else {
                setPendingBuildingBlock(null);
            }
        }
        else {
            setPendingBuildingBlock(null);
        }
        setShowBuildingBlocks(true);
    }, [getActiveEditorView]);
    const handleSaveBuildingBlock = useCallback((name) => {
        if (!pendingBuildingBlock)
            return;
        const next = addBuildingBlock({
            name,
            content: pendingBuildingBlock.content,
            preview: pendingBuildingBlock.preview,
        });
        setBuildingBlocks(next);
        setPendingBuildingBlock(null);
    }, [pendingBuildingBlock]);
    const handleInsertBuildingBlock = useCallback((id) => {
        const block = buildingBlocks.find((b) => b.id === id);
        if (!block)
            return;
        const view = getActiveEditorView();
        if (!view)
            return;
        try {
            const slice = Slice.fromJSON(view.state.schema, block.content);
            view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
            view.focus();
        }
        catch (_a) {
            // Schema drift — block was saved against a different schema or the
            // JSON is corrupt. Silently swallow; the row remains in the list.
        }
        setShowBuildingBlocks(false);
    }, [buildingBlocks, getActiveEditorView]);
    const handleDeleteBuildingBlock = useCallback((id) => {
        setBuildingBlocks(removeBuildingBlock(id));
    }, []);
    // Convert selection to table (B8) — wraps the utility for the
    // Insert-menu callback. Returns `false` silently if there's nothing
    // convertible at the current selection.
    const handleConvertSelectionToTable = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        convertSelectionToTable(view);
    }, [getActiveEditorView]);
    const handleConvertTableToText = useCallback(() => {
        const view = getActiveEditorView();
        if (!view)
            return;
        convertTableToText(view);
    }, [getActiveEditorView]);
    // A6 — citations manager handlers. Local-only storage; the Insert
    // action writes formatted text at the cursor and wraps the URL
    // substring (if present) in a hyperlink mark so the link is clickable.
    const handleOpenCitations = useCallback(() => {
        setShowCitations(true);
    }, []);
    const handleAddCitation = useCallback((input) => {
        setCitations(addCitation(input));
    }, []);
    const handleDeleteCitation = useCallback((id) => {
        setCitations(removeCitation(id));
    }, []);
    // C2 v0 — drop a default-styled SVG primitive at the cursor as an
    // inline image. The user can resize / recolor via the existing image
    // handles + properties dialog.
    const handleInsertShape = useCallback((type) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const imageType = view.state.schema.nodes.image;
        if (!imageType)
            return;
        const shape = generateShape(type);
        const rId = `rId_shape_${Date.now()}`;
        const node = imageType.create({
            src: shape.dataUrl,
            alt: shape.altText,
            width: shape.width,
            height: shape.height,
            rId,
            wrapType: 'inline',
            displayMode: 'inline',
        });
        const { from } = view.state.selection;
        const tr = view.state.tr.insert(from, node);
        view.dispatch(tr.scrollIntoView());
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Insert a new, editable text box (or a styled "callout" variant) at
    // the cursor. The textBox node is block-level with `(paragraph|table)+`
    // content, so we seed it with one empty paragraph and drop the caret
    // inside so the user can type immediately.
    const handleInsertTextBox = useCallback((variant = 'plain') => {
        var _a;
        const view = getActiveEditorView();
        if (!view)
            return;
        const { schema } = view.state;
        const textBoxType = schema.nodes.textBox;
        const paragraphType = schema.nodes.paragraph;
        if (!textBoxType || !paragraphType)
            return;
        const attrs = variant === 'callout'
            ? {
                width: 260,
                displayMode: 'block',
                fillColor: '#eff6ff',
                outlineColor: '#3b82f6',
                outlineWidth: 1,
                outlineStyle: 'solid',
            }
            : { width: 240, displayMode: 'block' };
        const node = (_a = textBoxType.createAndFill(attrs, paragraphType.create())) !== null && _a !== void 0 ? _a : textBoxType.create(attrs, paragraphType.create());
        const tr = view.state.tr.replaceSelectionWith(node);
        // Place the caret inside the new text box's first paragraph. After
        // replaceSelectionWith, the node sits where the selection was; its
        // content starts 2 positions in (textBox open + paragraph open).
        const insertedAt = tr.selection.from - node.nodeSize;
        const inside = insertedAt + 2;
        try {
            tr.setSelection(TextSelection.create(tr.doc, inside));
        }
        catch (_b) {
            // Fall back to the default post-insert selection if the math is
            // off for an unusual schema configuration.
        }
        view.dispatch(tr.scrollIntoView());
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Insert (or, when a math node is selected, REPLACE) an authored equation
    // as a math node. It carries its LaTeX source + MathML (for re-editing +
    // rendering); on save the MathML is converted to native OMML so it
    // round-trips as real math.
    const handleInsertEquation = useCallback((eq) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const mathType = view.state.schema.nodes.math;
        if (!mathType)
            return;
        const node = mathType.create({
            display: eq.display,
            latex: eq.latex,
            mathml: eq.mathml,
            plainText: eq.plainText,
            ommlXml: '',
        });
        const sel = view.state.selection;
        const tr = sel instanceof NodeSelection && sel.node.type.name === 'math'
            ? view.state.tr.replaceWith(sel.from, sel.to, node) // edit existing
            : view.state.tr.replaceSelectionWith(node, false); // insert new
        view.dispatch(tr.scrollIntoView());
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Open the equation dialog. If a math node is selected, prefill it (edit);
    // otherwise start blank (insert).
    const openEquationDialog = useCallback(() => {
        const view = getActiveEditorView();
        const sel = view === null || view === void 0 ? void 0 : view.state.selection;
        if (view && sel instanceof NodeSelection && sel.node.type.name === 'math') {
            setEquationInitial({
                latex: sel.node.attrs.latex || '',
                display: sel.node.attrs.display === 'block' ? 'block' : 'inline',
            });
        }
        else {
            setEquationInitial({ latex: '', display: 'inline' });
        }
        setShowEquationDialog(true);
    }, [getActiveEditorView]);
    // Double-click a painted equation → select it + open the dialog prefilled.
    const handleEditEquation = useCallback((pos) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'math')
            return;
        try {
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
        }
        catch (_a) {
            return;
        }
        setEquationInitial({
            latex: node.attrs.latex || '',
            display: node.attrs.display === 'block' ? 'block' : 'inline',
        });
        setShowEquationDialog(true);
    }, [getActiveEditorView]);
    const handleInsertCitation = useCallback((formatted, url) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        const { schema } = view.state;
        // Two-phase insert: drop the citation text, then add a hyperlink
        // mark over the URL substring so clicking it navigates. Keeping
        // the entire citation as a single paragraph lets the user style
        // it (italic title, etc.) without further wrangling.
        const tr = view.state.tr.insertText(formatted);
        if (url) {
            const hyperlinkType = schema.marks.hyperlink;
            const idx = formatted.lastIndexOf(url);
            if (hyperlinkType && idx >= 0) {
                const start = tr.selection.from - (formatted.length - idx);
                const end = start + url.length;
                tr.addMark(start, end, hyperlinkType.create({ href: url }));
            }
        }
        view.dispatch(tr);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // A3 — open the Explore dialog (Wikipedia summary lookup). Seeds the
    // query from the current selection; "Cite this" inserts a hyperlink
    // at the cursor via the existing hyperlink command.
    const handleOpenExplore = useCallback(() => {
        const view = getActiveEditorView();
        if (view) {
            const { from, to } = view.state.selection;
            if (from !== to) {
                const raw = view.state.doc.textBetween(from, to, ' ', ' ').trim();
                setExploreQuery(raw.length > 0 ? raw : null);
            }
            else {
                setExploreQuery(null);
            }
        }
        else {
            setExploreQuery(null);
        }
        setShowExplore(true);
    }, [getActiveEditorView]);
    const handleExploreCite = useCallback((title, url) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        insertHyperlink(title, url, title)(view.state, view.dispatch);
        focusActiveEditor();
    }, [getActiveEditorView, focusActiveEditor]);
    // Spell-check: flip enabled state, lazy-load dictionary on first
    // enable, and tell the open editor view to repaint. Toast surfaces
    // load / failure since dict download can be 100–1500 ms.
    const handleToggleSpellcheck = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        const next = !isSpellEnabled();
        if (next) {
            try {
                // Pre-warm — block the visible "enabled" flip on the dict so
                // the very first transaction-tick already sees a usable engine.
                const loadingToast = toast.loading('Loading spell-check dictionary…');
                yield loadSpellChecker();
                toast.dismiss(loadingToast);
            }
            catch (_a) {
                toast.error("Couldn't load the spell-check dictionary.");
                return;
            }
        }
        setSpellEnabled(next);
        setSpellOn(next);
        try {
            window.localStorage.setItem(SPELLCHECK_KEY, next ? '1' : '0');
        }
        catch (_b) {
            // Storage denied — toggle still takes effect for the session.
        }
        const view = getActiveEditorView();
        if (view)
            refreshSpellcheckDecorations(view);
    }), [getActiveEditorView]);
    // Restore from localStorage on mount: if persisted "on", quietly load
    // the dictionary in the background and turn the engine on without a
    // visible toast — the user already opted in last session.
    useEffect(() => {
        if (!spellOn)
            return;
        if (isSpellEnabled())
            return;
        void (() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield loadSpellChecker();
                setSpellEnabled(true);
                const view = getActiveEditorView();
                if (view)
                    refreshSpellcheckDecorations(view);
            }
            catch (_a) {
                // Silent — the user can re-toggle from the menu.
            }
        }))();
    }, [spellOn, getActiveEditorView]);
    // A5 — Replace the selection (captured in `translateRange`) with a
    // per-mark-run translation. Each text node inside the range is
    // translated individually so bold/italic/link/etc boundaries land
    // exactly where the user drew them. Returns void; toasts on failure.
    const handleTranslateReplace = useCallback((source, target) => __awaiter(this, void 0, void 0, function* () {
        const view = getActiveEditorView();
        if (!view)
            throw new Error('no-view');
        const range = translateRange;
        if (!range)
            throw new Error('no-range');
        const { from, to } = range;
        if (from === to)
            throw new Error('empty-range');
        // Re-resolve against current doc — autosave / other tx may have
        // shifted positions while the dialog was up. Clamp to doc size.
        const docSize = view.state.doc.content.size;
        const clampedFrom = Math.min(Math.max(from, 0), docSize);
        const clampedTo = Math.min(Math.max(to, clampedFrom), docSize);
        const slice = view.state.doc.slice(clampedFrom, clampedTo);
        try {
            const translatedContent = yield translateFragment(slice.content, view.state.schema, source, target);
            const translatedSlice = new Slice(translatedContent, slice.openStart, slice.openEnd);
            // Re-read the live view at dispatch time: the user may have typed
            // or scrolled during the await; another tr may have shifted us.
            const live = getActiveEditorView();
            if (!live)
                return;
            const tr = live.state.tr.replace(clampedFrom, clampedTo, translatedSlice);
            live.dispatch(tr);
            try {
                window.localStorage.setItem('translate:last-target', target);
            }
            catch (_a) {
                // Storage denied — the right-click quick-translate just won't
                // remember across sessions; nothing else breaks.
            }
            toast.success(`Replaced with ${target.toUpperCase()} translation.`);
        }
        catch (err) {
            toast.error("Couldn't translate — check your connection and try again.");
            throw err;
        }
    }), [getActiveEditorView, translateRange]);
    // A5 — open the translate dialog. Seeds the original-text box with
    // the current selection; the user can edit it freely once the dialog
    // is up.
    const handleOpenTranslate = useCallback(() => {
        const view = getActiveEditorView();
        if (view) {
            const { from, to } = view.state.selection;
            if (from !== to) {
                const raw = view.state.doc.textBetween(from, to, ' ', ' ').trim();
                setTranslateText(raw.length > 0 ? raw : null);
                setTranslateRange({ from, to });
            }
            else {
                setTranslateText(null);
                setTranslateRange(null);
            }
        }
        else {
            setTranslateText(null);
            setTranslateRange(null);
        }
        setShowTranslate(true);
    }, [getActiveEditorView]);
    // A4 — open the dictionary dialog. Seeds the input from the selection
    // (collapsed selection → null, dialog shows the bare input).
    const handleOpenDictionary = useCallback(() => {
        var _a;
        const view = getActiveEditorView();
        if (view) {
            const { from, to } = view.state.selection;
            if (from !== to) {
                const raw = view.state.doc.textBetween(from, to, ' ', ' ').trim();
                // Take just the first whitespace-delimited token — the dictionary
                // endpoint is single-word; multi-word selections would 404.
                const firstWord = (_a = raw.split(/\s+/)[0]) !== null && _a !== void 0 ? _a : '';
                setDictionaryWord(firstWord.length > 0 ? firstWord : null);
            }
            else {
                setDictionaryWord(null);
            }
        }
        else {
            setDictionaryWord(null);
        }
        setShowDictionary(true);
    }, [getActiveEditorView]);
    // Watermark apply/clear handler (C5) — writes into the doc-level
    // body.watermark slot so the painter draws the overlay on the next
    // render. `undefined` clears it. Round-trip to header XML lands in a
    // separate pass.
    const handleWatermarkChange = useCallback((watermark) => {
        if (!history.state || readOnly)
            return;
        const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, history.state.package), { document: Object.assign(Object.assign({}, history.state.package.document), { watermark }) }) });
        handleDocumentChange(newDoc);
    }, [history.state, readOnly, handleDocumentChange]);
    // Paragraph indent handlers (for ruler)
    const handleIndentLeftChange = useCallback((twips) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        setIndentLeft(twips)(view.state, view.dispatch);
    }, [getActiveEditorView]);
    const handleIndentRightChange = useCallback((twips) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        setIndentRight(twips)(view.state, view.dispatch);
    }, [getActiveEditorView]);
    const handleFirstLineIndentChange = useCallback((twips) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        // If twips is negative, it's a hanging indent
        if (twips < 0) {
            setIndentFirstLine(-twips, true)(view.state, view.dispatch);
        }
        else {
            setIndentFirstLine(twips, false)(view.state, view.dispatch);
        }
    }, [getActiveEditorView]);
    const handleTabStopRemove = useCallback((positionTwips) => {
        const view = getActiveEditorView();
        if (!view)
            return;
        removeTabStop(positionTwips)(view.state, view.dispatch);
    }, [getActiveEditorView]);
    // Scroll-based page tracking: calculate current page from scroll position.
    // Re-attaches when the scroll container mounts (after loading completes).
    const scrollContainerEl = scrollContainerRef.current;
    useEffect(() => {
        if (!scrollContainerEl)
            return;
        const handleScroll = () => {
            var _a;
            const layout = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getLayout();
            if (!layout || layout.pages.length === 0)
                return;
            const scrollTop = scrollContainerEl.scrollTop;
            const totalPages = layout.pages.length;
            const pageGap = 24; // DEFAULT_PAGE_GAP from PagedEditor
            const paddingTop = 24; // top padding in paged-editor__pages
            // Calculate which page is visible at the viewport center
            const viewportCenter = scrollTop + scrollContainerEl.clientHeight / 2;
            let accumulatedY = paddingTop;
            let currentPage = 1;
            for (let i = 0; i < layout.pages.length; i++) {
                const pageHeight = layout.pages[i].size.h;
                const pageEnd = accumulatedY + pageHeight;
                if (viewportCenter < pageEnd) {
                    currentPage = i + 1;
                    break;
                }
                accumulatedY = pageEnd + pageGap;
                currentPage = i + 2; // next page
            }
            currentPage = Math.min(currentPage, totalPages);
            setScrollPageInfo({ currentPage, totalPages, visible: true });
            // Clear existing fade timer
            if (scrollFadeTimerRef.current) {
                clearTimeout(scrollFadeTimerRef.current);
            }
            // Hide after 0.6s of no scrolling
            scrollFadeTimerRef.current = setTimeout(() => {
                setScrollPageInfo((prev) => (Object.assign(Object.assign({}, prev), { visible: false })));
            }, 600);
        };
        scrollContainerEl.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            scrollContainerEl.removeEventListener('scroll', handleScroll);
            if (scrollFadeTimerRef.current) {
                clearTimeout(scrollFadeTimerRef.current);
            }
        };
    }, [scrollContainerEl]);
    // Handle save
    const handleSave = useCallback((options) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (!agentRef.current)
            return null;
        try {
            const agentDoc = agentRef.current.getDocument();
            // Get the document from the PM editor state — this runs fromProseDoc which
            // converts PM comment marks into commentRangeStart/End in the document body.
            // The agent's internal document has the original parsed content and won't
            // include markers for newly added comments.
            const pmDoc = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getDocument();
            if ((_b = pmDoc === null || pmDoc === void 0 ? void 0 : pmDoc.package) === null || _b === void 0 ? void 0 : _b.document) {
                agentDoc.package.document.content = pmDoc.package.document.content;
            }
            // Sync React comments state (including new replies) back to the document model
            agentDoc.package.document.comments = comments;
            // Apply pending footnote text edits to the save document so they persist
            // (the surgical footnotes.xml regeneration in rezip keys off `edited`).
            if (footnoteEditsRef.current.size > 0 && agentDoc.package.footnotes) {
                for (const [id, text] of footnoteEditsRef.current) {
                    const fn = agentDoc.package.footnotes.find((f) => f.id === id);
                    if (fn) {
                        setFootnotePlainText(fn, text);
                        fn.edited = true;
                    }
                }
            }
            if (endnoteEditsRef.current.size > 0 && agentDoc.package.endnotes) {
                for (const [id, text] of endnoteEditsRef.current) {
                    const en = agentDoc.package.endnotes.find((e) => e.id === id);
                    if (en) {
                        setEndnotePlainText(en, text);
                        en.edited = true;
                    }
                }
            }
            // Apply pending core-property edits to the save doc (collab peers may
            // have set these via the observer; ensure the saver writes them).
            if (Object.keys(propsEditsRef.current).length > 0) {
                agentDoc.package.properties = Object.assign(Object.assign({}, ((_c = agentDoc.package.properties) !== null && _c !== void 0 ? _c : {})), propsEditsRef.current);
            }
            // Inject commentRangeStart/End for reply comments that share the parent's range.
            // Pages/Word require every comment (including replies) to have range markers in document.xml.
            injectReplyRangeMarkers(agentDoc.package.document.content, comments);
            // Also inject range markers for comments that reply to tracked changes.
            injectTCReplyRangeMarkers(agentDoc.package.document.content, comments);
            // Build selective save options from change tracker state
            const useSelective = (options === null || options === void 0 ? void 0 : options.selective) !== false;
            const view = (_d = pagedEditorRef.current) === null || _d === void 0 ? void 0 : _d.getView();
            let selectiveOptions = undefined;
            if (useSelective && view) {
                const editorState = view.state;
                // Force full repack if any reply comments exist (both comment replies and
                // tracked-change replies need range markers injected into document.xml,
                // which selective save can't handle since the affected paragraphs may not
                // be in changedParaIds)
                const hasInjectedReplies = comments.some((c) => c.parentId != null);
                // Non-paragraph block changes (textBox / image / shape / table)
                // bypass the paraId-keyed selective path entirely — the
                // changed paraId set is empty for a drawing-only transaction
                // and the round-trip would silently drop the new node. Treat
                // them as untracked so the serializer falls back to a full
                // re-pack. See ParagraphChangeTrackerExtension for the source
                // of this signal.
                selectiveOptions = {
                    selective: {
                        changedParaIds: getChangedParagraphIds(editorState),
                        structuralChange: hasStructuralChanges(editorState) || hasInjectedReplies,
                        hasUntrackedChanges: hasUntrackedChanges(editorState) ||
                            hasNonParagraphBlockChanges(editorState) ||
                            // Footnote/endnote edits live outside the PM doc (in
                            // footnotes.xml/endnotes.xml), so the paraId-keyed selective path
                            // can't see them — force a full repack so the override runs.
                            footnoteEditsRef.current.size > 0 ||
                            endnoteEditsRef.current.size > 0 ||
                            Object.keys(propsEditsRef.current).length > 0,
                    },
                };
            }
            const buffer = yield agentRef.current.toBuffer(selectiveOptions);
            // Clear change tracker after successful save
            if (view) {
                view.dispatch(clearTrackedChanges(view.state));
            }
            onSave === null || onSave === void 0 ? void 0 : onSave(buffer);
            return buffer;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error instanceof Error ? error : new Error('Failed to save document'));
            return null;
        }
    }), [onSave, onError, comments]);
    // Handle error from editor
    const handleEditorError = useCallback((error) => {
        onError === null || onError === void 0 ? void 0 : onError(error);
    }, [onError]);
    // `handleDirectPrint` is also the underlying flow for Export as PDF —
    // browsers' "Save as PDF" destination in the print dialog uses the
    // print window's <title> as the default filename, so we let callers
    // pass one. The visible HTML and CSS are identical for print and PDF.
    const triggerPrintFlow = useCallback((windowTitle) => {
        var _a;
        const pagesEl = (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.querySelector('.paged-editor__pages');
        if (!pagesEl) {
            window.print();
            onPrint === null || onPrint === void 0 ? void 0 : onPrint();
            return;
        }
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            // Popup blocked — fall back to window.print()
            window.print();
            onPrint === null || onPrint === void 0 ? void 0 : onPrint();
            return;
        }
        // Collect all @font-face rules from the current page
        const fontFaceRules = [];
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                for (const rule of Array.from(sheet.cssRules)) {
                    if (rule instanceof CSSFontFaceRule) {
                        fontFaceRules.push(rule.cssText);
                    }
                }
            }
            catch (_b) {
                // Cross-origin stylesheets can't be read — skip
            }
        }
        // Force-render all virtualized page shells so the clone captures every
        // page's content, not just the pages near the viewport (issue #141).
        forceRenderAllPages(pagesEl);
        // Clone pages and remove transforms/shadows
        const pagesClone = pagesEl.cloneNode(true);
        pagesClone.style.cssText = 'display: block; margin: 0; padding: 0;';
        for (const page of Array.from(pagesClone.querySelectorAll('.layout-page'))) {
            const el = page;
            el.style.boxShadow = 'none';
            el.style.margin = '0';
        }
        // Restore memory-efficient virtualization after the clone is done.
        requestAnimationFrame(() => {
            restoreVirtualization(pagesEl);
        });
        const titleEscaped = windowTitle
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${titleEscaped}</title>
<style>
${fontFaceRules.join('\n')}
* { margin: 0; padding: 0; }
body { background: white; }
.layout-page { break-after: page; }
.layout-page:last-child { break-after: auto; }
@page { margin: 0; size: auto; }
</style>
</head><body>${pagesClone.outerHTML}</body></html>`);
        printWindow.document.close();
        // Wait for fonts/images then print. The fallback timeout below
        // covers browsers that never fire onload on a document-written
        // window; we clear it from inside onload so the normal path
        // doesn't double-trigger print() and surface a second print
        // dialog the user already cancelled. Pre-fix the second print
        // fired ~1s after the user dismissed the first.
        let printed = false;
        let fallback = null;
        const runPrint = () => {
            if (printed)
                return;
            printed = true;
            if (fallback !== null) {
                clearTimeout(fallback);
                fallback = null;
            }
            printWindow.print();
            printWindow.close();
        };
        printWindow.onload = runPrint;
        fallback = setTimeout(() => {
            fallback = null;
            if (!printWindow.closed)
                runPrint();
        }, 1000);
        onPrint === null || onPrint === void 0 ? void 0 : onPrint();
    }, [onPrint]);
    const handleDirectPrint = useCallback(() => {
        triggerPrintFlow('Print');
    }, [triggerPrintFlow]);
    // Export as PDF reuses the print pipeline — browsers' print dialogs
    // include a "Save as PDF" destination that uses the print window's
    // title as the default filename. We pass the current document name
    // (or a sensible default) so the saved file is `<doc>.pdf` rather
    // than `Print.pdf`. There is no JS API to preselect the PDF
    // destination — the user picks it once in the print dialog.
    const handleExportPdf = useCallback(() => {
        const base = ((documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'Document').replace(/\.docx$/i, '');
        triggerPrintFlow(base);
    }, [triggerPrintFlow, documentName]);
    const handleDownloadDocument = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        setIsSaving(true);
        try {
            const buffer = yield handleSave();
            if (!buffer)
                return;
            // When a parent supplied `onSave`, it owns persistence — `handleSave`
            // has already passed it the buffer. A browser blob download on top
            // of that would drop a duplicate file into ~/Downloads on every Save
            // inside the Tauri shell — exactly the "save creates new files" bug.
            // Mark clean and let the host surface its own save status.
            if (onSave) {
                markDirty(false);
                return;
            }
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            const fileName = `${((documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'document').replace(/\.docx$/i, '')}.docx`;
            a.download = fileName;
            a.click();
            // Defer revoke so Safari has time to start the download.
            setTimeout(() => URL.revokeObjectURL(url), 0);
            markDirty(false);
            toast.success(`Saved ${fileName}`);
        }
        finally {
            setIsSaving(false);
        }
    }), [handleSave, documentName, markDirty, onSave]);
    // Autosave to IndexedDB (sheet parity). A periodic interval polls the
    // dirty flag every 30s; if dirty, it serializes and writes the buffer.
    // The previous one-shot `setTimeout` only fired on the rising edge of
    // `isDirty`, so continuous typing past 30s without an explicit save
    // would never snapshot again. An interval gates on the ref so the
    // serializer (`handleSave` re-walks the PM doc + re-packs the .docx)
    // only runs when there's actually work to do.
    //
    // After a successful autosave we clear dirty so the next tick skips
    // serialization when nothing has changed. Without this, isDirty stays
    // true after each write and every subsequent tick re-serializes and
    // re-writes identical bytes (in desktop mode: real disk writes every
    // 30 s even with no user edits after the first save).
    const isDirtyRefAuto = useRef(false);
    isDirtyRefAuto.current = isDirty;
    useEffect(() => {
        const tick = () => {
            if (!isDirtyRefAuto.current)
                return;
            void (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    const buffer = yield handleSave();
                    if (!buffer)
                        return;
                    // Mark clean before the IndexedDB write — if the write
                    // fails the next tick can retry (isDirty will be set again
                    // by any subsequent edit, or stays false until one occurs).
                    markDirty(false);
                    yield writeAutosave({
                        name: (documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'Untitled',
                        buffer,
                        savedAt: Date.now(),
                    });
                }
                catch (_a) {
                    // Silent — autosave is best-effort and shouldn't surface
                    // errors to the user. The next tick will try again.
                }
            }))();
        };
        const interval = window.setInterval(tick, 30000);
        return () => window.clearInterval(interval);
    }, [handleSave, documentName, markDirty]);
    // File → Make a copy: download the current content as "Copy of <name>.docx".
    // The original document is unchanged, so we don't touch the dirty flag.
    // F2 — Email as attachment. Browsers can't auto-attach the downloaded
    // file to a mailto draft (security), so the honest version is to do
    // both: trigger the .docx download, then open the user's mail client
    // with subject/body pre-filled. They drag the downloaded file in.
    const handleEmailAsAttachment = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        setIsSaving(true);
        try {
            const buffer = yield handleSave();
            if (!buffer)
                return;
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const base = ((documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'document').replace(/\.docx$/i, '');
            const fileName = `${base}.docx`;
            // Desktop shell: save via the native dialog (picker) so the user
            // controls where the attachment lands; web falls back to a download.
            const savedViaHost = onExport ? yield onExport(blob, fileName) : false;
            if (!savedViaHost) {
                const url = URL.createObjectURL(blob);
                const a = window.document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 0);
            }
            const subject = encodeURIComponent(base);
            const where = savedViaHost ? 'saved to your chosen location' : 'downloaded to your machine';
            const body = encodeURIComponent(`Attached: ${fileName}\n\n(The file was ${where} — please attach it to this email.)`);
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener');
            toast.success(savedViaHost
                ? `Saved ${fileName}. Attach it to the email window.`
                : `Downloaded ${fileName}. Drag it into the email window to attach.`);
        }
        finally {
            setIsSaving(false);
        }
    }), [handleSave, documentName, onExport]);
    const handleMakeCopy = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        setIsSaving(true);
        try {
            const buffer = yield handleSave();
            if (!buffer)
                return;
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const base = ((documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'document').replace(/\.docx$/i, '');
            const fileName = `Copy of ${base}.docx`;
            // Desktop shell: native Save dialog instead of a phantom download.
            if (onExport && (yield onExport(blob, fileName))) {
                toast.success(`Saved ${fileName}`);
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            toast.success(`Downloaded ${fileName}`);
        }
        finally {
            setIsSaving(false);
        }
    }), [handleSave, documentName, onExport]);
    const handleExportAs = useCallback((target) => __awaiter(this, void 0, void 0, function* () {
        const label = target === 'odt' ? 'ODT' : target === 'md' ? 'Markdown' : 'Plain Text';
        // Loading toast — kept until convert finishes. The first non-DOCX
        // conversion in a session boots the ~7MB WASM bundle so this can
        // take a couple seconds; the toast tells the user it's working.
        const toastId = toast.loading(`Converting to ${label}…`);
        try {
            const buffer = yield handleSave();
            if (!buffer) {
                toast.dismiss(toastId);
                return;
            }
            const { exportDocxAs } = yield import('../lib/format-converter');
            const out = yield exportDocxAs(new Uint8Array(buffer), target);
            const base = ((documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'document').replace(/\.docx$/i, '');
            const mime = target === 'odt'
                ? 'application/vnd.oasis.opendocument.text'
                : target === 'md'
                    ? 'text/markdown'
                    : 'text/plain';
            const blob = typeof out === 'string'
                ? new Blob([out], { type: mime })
                : new Blob([out], { type: mime });
            const fileName = `${base}.${target}`;
            // Desktop shell: hand the bytes to the host's native Save dialog
            // (picker) instead of a phantom ~/Downloads blob. Falls through to
            // the browser download on the web (onExport unset / returned false).
            if (onExport && (yield onExport(blob, fileName))) {
                toast.success(`Saved ${fileName}`, { id: toastId });
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            toast.success(`Downloaded ${fileName}`, { id: toastId });
        }
        catch (error) {
            toast.error(`Failed to export as ${label}`, { id: toastId });
            onError === null || onError === void 0 ? void 0 : onError(error instanceof Error ? error : new Error(`Failed to export as ${target}`));
        }
    }), [handleSave, documentName, onError, onExport]);
    const handleExportOdt = useCallback(() => handleExportAs('odt'), [handleExportAs]);
    const handleExportMd = useCallback(() => handleExportAs('md'), [handleExportAs]);
    const handleExportTxt = useCallback(() => handleExportAs('txt'), [handleExportAs]);
    const handleOpenDocument = useCallback(() => {
        var _a;
        (_a = docxInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    }, []);
    // Keep the global-keydown handler in sync with the latest file-op
    // callbacks without recreating the listener. `save` → handleDownloadDocument,
    // which respects the `onSave` prop, so in Tauri-shell mode Ctrl/Cmd-S
    // routes through the bridge (overwrite in place, no blob download).
    useEffect(() => {
        shortcutActionsRef.current = {
            save: handleDownloadDocument,
            print: handleDirectPrint,
            new: onNew,
            open: handleOpenDocument,
            zoomIn: () => handleZoomChange(Math.min(state.zoom * 1.1, 4)),
            zoomOut: () => handleZoomChange(Math.max(state.zoom / 1.1, 0.25)),
            zoomReset: () => handleZoomChange(1),
            startComment: handleStartAddComment,
        };
    }, [
        handleDownloadDocument,
        handleDirectPrint,
        onNew,
        handleOpenDocument,
        handleZoomChange,
        state.zoom,
        handleStartAddComment,
    ]);
    const handleDocxFileChange = useCallback((event) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        // Reset so picking the same file twice still fires `change`.
        event.target.value = '';
        if (!file)
            return;
        try {
            const buffer = yield file.arrayBuffer();
            const { formatFromFilename, isForeignFormat, convertToDocx } = yield import('../lib/format-converter');
            const fmt = formatFromFilename(file.name);
            let docxBuffer = buffer;
            if (fmt && isForeignFormat(fmt)) {
                // .odt / .md / .txt → DOCX via the WASM worker, then feed the
                // existing parser. PDF is intentionally not handled.
                const out = yield convertToDocx(new Uint8Array(buffer), fmt);
                // Take ownership of just the populated slice so the buffer
                // passed to loadBuffer is exactly the converter's output.
                docxBuffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
            }
            yield loadBuffer(docxBuffer);
            const cleanName = file.name.replace(/\.(docx|odt|md|markdown|txt)$/i, '');
            onDocumentNameChange === null || onDocumentNameChange === void 0 ? void 0 : onDocumentNameChange(cleanName);
            // Record in the recent-files list so the Home screen can show
            // a one-click reopen tile. Best-effort — failures are logged
            // inside the helper and don't surface to the user.
            void recordRecentFile({
                name: cleanName || file.name,
                buffer: docxBuffer,
                size: docxBuffer.byteLength,
                openedAt: Date.now(),
            });
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error instanceof Error ? error : new Error('Failed to open document'));
        }
    }), [loadBuffer, onDocumentNameChange, onError]);
    // ============================================================================
    // FIND/REPLACE HANDLERS
    // ============================================================================
    // Store the current find result for navigation
    const findResultRef = useRef(null);
    const getFindDocument = useCallback(() => { var _a, _b; return (_b = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : history.state; }, [history.state]);
    // Handle find operation
    const handleFind = useCallback((searchText, options) => {
        const document = getFindDocument();
        if (!document || !searchText.trim()) {
            findResultRef.current = null;
            return null;
        }
        const matches = findInDocument(document, searchText, options);
        const result = {
            matches,
            totalCount: matches.length,
            currentIndex: 0,
        };
        findResultRef.current = result;
        findReplace.setMatches(matches, 0);
        // Scroll to first match
        if (matches.length > 0 && containerRef.current) {
            scrollToMatch(containerRef.current, matches[0]);
        }
        return result;
    }, [getFindDocument, findReplace]);
    // Handle find next
    const handleFindNext = useCallback(() => {
        if (!findResultRef.current || findResultRef.current.matches.length === 0) {
            return null;
        }
        const newIndex = findReplace.goToNextMatch();
        const match = findResultRef.current.matches[newIndex];
        // Scroll to the match
        if (match && containerRef.current) {
            scrollToMatch(containerRef.current, match);
        }
        return match || null;
    }, [findReplace]);
    // Handle find previous
    const handleFindPrevious = useCallback(() => {
        if (!findResultRef.current || findResultRef.current.matches.length === 0) {
            return null;
        }
        const newIndex = findReplace.goToPreviousMatch();
        const match = findResultRef.current.matches[newIndex];
        // Scroll to the match
        if (match && containerRef.current) {
            scrollToMatch(containerRef.current, match);
        }
        return match || null;
    }, [findReplace]);
    // Handle replace current match
    const handleReplace = useCallback((replaceText) => {
        const document = getFindDocument();
        if (!document || !findResultRef.current || findResultRef.current.matches.length === 0) {
            return false;
        }
        const currentMatch = findResultRef.current.matches[findResultRef.current.currentIndex];
        if (!currentMatch)
            return false;
        // Execute replace command
        try {
            const newDoc = executeCommand(document, {
                type: 'replaceText',
                range: {
                    start: {
                        paragraphIndex: currentMatch.paragraphIndex,
                        offset: currentMatch.startOffset,
                    },
                    end: {
                        paragraphIndex: currentMatch.paragraphIndex,
                        offset: currentMatch.endOffset,
                    },
                },
                text: replaceText,
            });
            handleDocumentChange(newDoc);
            return true;
        }
        catch (error) {
            console.error('Replace failed:', error);
            return false;
        }
    }, [getFindDocument, handleDocumentChange]);
    // Handle replace all matches
    const handleReplaceAll = useCallback((searchText, replaceText, options) => {
        const document = getFindDocument();
        if (!document || !searchText.trim()) {
            return 0;
        }
        // Find all matches first
        const matches = findInDocument(document, searchText, options);
        if (matches.length === 0)
            return 0;
        // Replace from end to start to maintain correct indices
        let doc = document;
        const sortedMatches = [...matches].sort((a, b) => {
            if (a.paragraphIndex !== b.paragraphIndex) {
                return b.paragraphIndex - a.paragraphIndex;
            }
            return b.startOffset - a.startOffset;
        });
        for (const match of sortedMatches) {
            try {
                doc = executeCommand(doc, {
                    type: 'replaceText',
                    range: {
                        start: {
                            paragraphIndex: match.paragraphIndex,
                            offset: match.startOffset,
                        },
                        end: {
                            paragraphIndex: match.paragraphIndex,
                            offset: match.endOffset,
                        },
                    },
                    text: replaceText,
                });
            }
            catch (error) {
                console.error('Replace failed for match:', match, error);
            }
        }
        handleDocumentChange(doc);
        findResultRef.current = null;
        findReplace.setMatches([], 0);
        return matches.length;
    }, [getFindDocument, handleDocumentChange, findReplace]);
    // Expose ref methods
    // Captured imperative handle + once-guard for the onReady handshake.
    const exposedApiRef = useRef(null);
    const onReadyFiredRef = useRef(false);
    useImperativeHandle(ref, () => {
        const api = {
            getAgent: () => agentRef.current,
            getDocument: () => history.state,
            getEditorRef: () => pagedEditorRef.current,
            save: handleSave,
            setZoom: (zoom) => setState((prev) => (Object.assign(Object.assign({}, prev), { zoom }))),
            getZoom: () => state.zoom,
            focus: () => {
                var _a;
                (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            },
            getCurrentPage: () => scrollPageInfo.currentPage,
            getTotalPages: () => scrollPageInfo.totalPages,
            scrollToPage: (pageNumber) => {
                var _a;
                (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.scrollToPage(pageNumber);
            },
            scrollToPosition: (pmPos) => {
                var _a;
                (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.scrollToPosition(pmPos);
            },
            openPrintPreview: handleDirectPrint,
            print: handleDirectPrint,
            loadDocument: loadParsedDocument,
            loadDocumentBuffer: loadBuffer,
            importDocx: loadBuffer,
            exportDocx: handleSave,
            addComment: (options) => {
                var _a;
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (!view)
                    return null;
                const { schema } = view.state;
                if (!schema.marks.comment)
                    return null;
                const range = findParaIdRange(view.state.doc, options.paraId);
                if (!range)
                    return null;
                let from = range.from;
                let to = range.to;
                if (options.search) {
                    const textRange = findTextInPmParagraph(view.state.doc, range.from, range.to, options.search);
                    if (!textRange)
                        return null;
                    from = textRange.from;
                    to = textRange.to;
                }
                const comment = createComment(options.text, options.author);
                const commentMark = schema.marks.comment.create({ commentId: comment.id });
                view.dispatch(view.state.tr.addMark(from, to, commentMark));
                setComments((prev) => [...prev, comment]);
                setShowCommentsSidebar(true);
                return comment.id;
            },
            replyToComment: (commentId, text, authorName) => {
                if (!comments.some((c) => c.id === commentId))
                    return null;
                const reply = createComment(text, authorName, commentId);
                setComments((prev) => [...prev, reply]);
                return reply.id;
            },
            resolveComment: (commentId) => {
                setComments((prev) => prev.map((c) => (c.id === commentId ? Object.assign(Object.assign({}, c), { done: true }) : c)));
            },
            proposeChange: (options) => {
                var _a;
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (!view)
                    return false;
                const { schema } = view.state;
                if (!schema.marks.deletion || !schema.marks.insertion)
                    return false;
                const range = findParaIdRange(view.state.doc, options.paraId);
                if (!range)
                    return false;
                const isInsertion = options.search === '';
                const isDeletion = options.replaceWith === '';
                let textFrom;
                let textTo;
                if (isInsertion) {
                    // Insert at end of paragraph (just before closing token).
                    textFrom = range.to - 1;
                    textTo = range.to - 1;
                }
                else {
                    const textRange = findTextInPmParagraph(view.state.doc, range.from, range.to, options.search);
                    if (!textRange)
                        return false;
                    textFrom = textRange.from;
                    textTo = textRange.to;
                }
                // Refuse to layer onto an existing tracked change.
                let overlapsTrackedChange = false;
                if (textFrom < textTo) {
                    view.state.doc.nodesBetween(textFrom, textTo, (node) => {
                        for (const m of node.marks) {
                            if (m.type === schema.marks.insertion || m.type === schema.marks.deletion) {
                                overlapsTrackedChange = true;
                                return false;
                            }
                        }
                        return true;
                    });
                    if (overlapsTrackedChange)
                        return false;
                }
                const revisionId = nextCommentId++;
                const date = new Date().toISOString();
                const deletionMark = schema.marks.deletion.create({
                    revisionId,
                    author: options.author,
                    date,
                });
                const insertionMark = schema.marks.insertion.create({
                    revisionId,
                    author: options.author,
                    date,
                });
                let tr = view.state.tr;
                if (!isInsertion) {
                    tr = tr.addMark(textFrom, textTo, deletionMark);
                }
                if (!isDeletion) {
                    const insertedNode = schema.text(options.replaceWith, [insertionMark]);
                    tr = tr.insert(textTo, insertedNode);
                }
                if (isInsertion && isDeletion)
                    return false; // nothing to do
                view.dispatch(tr);
                setShowCommentsSidebar(true);
                return true;
            },
            applyFormatting: (options) => {
                var _a, _b, _c, _d, _e, _f;
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (!view)
                    return false;
                const { schema } = view.state;
                const range = findParaIdRange(view.state.doc, options.paraId);
                if (!range)
                    return false;
                // Default range: the paragraph's text content (skip open/close tokens).
                let from = range.from + 1;
                let to = range.to - 1;
                if (options.search) {
                    const textRange = findTextInPmParagraph(view.state.doc, range.from, range.to, options.search);
                    if (!textRange)
                        return false;
                    from = textRange.from;
                    to = textRange.to;
                }
                if (from >= to)
                    return true;
                let tr = view.state.tr;
                const m = options.marks;
                if (m.bold !== undefined && schema.marks.bold) {
                    tr = m.bold
                        ? tr.addMark(from, to, schema.marks.bold.create())
                        : tr.removeMark(from, to, schema.marks.bold);
                }
                if (m.italic !== undefined && schema.marks.italic) {
                    tr = m.italic
                        ? tr.addMark(from, to, schema.marks.italic.create())
                        : tr.removeMark(from, to, schema.marks.italic);
                }
                if (m.underline !== undefined && schema.marks.underline) {
                    if (m.underline) {
                        const style = typeof m.underline === 'object' ? m.underline.style : undefined;
                        tr = tr.addMark(from, to, schema.marks.underline.create({ style: style !== null && style !== void 0 ? style : 'single' }));
                    }
                    else {
                        tr = tr.removeMark(from, to, schema.marks.underline);
                    }
                }
                if (m.strike !== undefined && schema.marks.strike) {
                    tr = m.strike
                        ? tr.addMark(from, to, schema.marks.strike.create())
                        : tr.removeMark(from, to, schema.marks.strike);
                }
                if (m.color !== undefined && schema.marks.textColor) {
                    if (m.color && (m.color.rgb || m.color.themeColor)) {
                        tr = tr.addMark(from, to, schema.marks.textColor.create({
                            rgb: (_b = m.color.rgb) !== null && _b !== void 0 ? _b : null,
                            themeColor: (_c = m.color.themeColor) !== null && _c !== void 0 ? _c : null,
                        }));
                    }
                    else {
                        tr = tr.removeMark(from, to, schema.marks.textColor);
                    }
                }
                if (m.highlight !== undefined && schema.marks.highlight) {
                    if (m.highlight) {
                        const name = mapHexToHighlightName(m.highlight);
                        tr = tr.addMark(from, to, schema.marks.highlight.create({ color: name || m.highlight }));
                    }
                    else {
                        tr = tr.removeMark(from, to, schema.marks.highlight);
                    }
                }
                if (m.fontSize !== undefined && schema.marks.fontSize) {
                    if (m.fontSize > 0) {
                        tr = tr.addMark(from, to, schema.marks.fontSize.create({ size: pointsToHalfPoints(m.fontSize) }));
                    }
                    else {
                        tr = tr.removeMark(from, to, schema.marks.fontSize);
                    }
                }
                if (m.fontFamily !== undefined && schema.marks.fontFamily) {
                    if (m.fontFamily && (m.fontFamily.ascii || m.fontFamily.hAnsi)) {
                        tr = tr.addMark(from, to, schema.marks.fontFamily.create({
                            ascii: (_d = m.fontFamily.ascii) !== null && _d !== void 0 ? _d : null,
                            hAnsi: (_f = (_e = m.fontFamily.hAnsi) !== null && _e !== void 0 ? _e : m.fontFamily.ascii) !== null && _f !== void 0 ? _f : null,
                        }));
                    }
                    else {
                        tr = tr.removeMark(from, to, schema.marks.fontFamily);
                    }
                }
                view.dispatch(tr);
                return true;
            },
            setParagraphStyle: (options) => {
                var _a, _b;
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (!view)
                    return false;
                const range = findParaIdRange(view.state.doc, options.paraId);
                if (!range)
                    return false;
                const currentDoc = historyStateRef.current;
                const styleResolver = ((_b = currentDoc === null || currentDoc === void 0 ? void 0 : currentDoc.package) === null || _b === void 0 ? void 0 : _b.styles)
                    ? getCachedStyleResolver(currentDoc.package.styles)
                    : null;
                // Refuse unknown styleIds so the agent gets a clear error
                // instead of silently writing `<w:pStyle w:val="NoSuchStyle"/>`.
                // We only enforce this when we have a resolver — without one,
                // we can't know which styles are defined, so fall through.
                if (styleResolver && !styleResolver.hasParagraphStyle(options.styleId)) {
                    return false;
                }
                // Build a synthetic state with selection inside the target paragraph
                // so applyStyle's cursor-driven walk lands on it. We restore the
                // original selection on the dispatched transaction.
                const $from = view.state.doc.resolve(range.from + 1);
                const $to = view.state.doc.resolve(range.to - 1);
                const paraSelection = TextSelection.between($from, $to);
                const stateWithSel = view.state.apply(view.state.tr.setSelection(paraSelection));
                const cmd = styleResolver
                    ? (() => {
                        const r = styleResolver.resolveParagraphStyle(options.styleId);
                        return applyStyle(options.styleId, {
                            paragraphFormatting: r.paragraphFormatting,
                            runFormatting: r.runFormatting,
                        });
                    })()
                    : applyStyle(options.styleId);
                let didApply = false;
                cmd(stateWithSel, (newTr) => {
                    didApply = true;
                    newTr.setSelection(view.state.selection.map(newTr.doc, newTr.mapping));
                    view.dispatch(newTr);
                });
                return didApply;
            },
            getPageContent: (pageNumber) => {
                var _a, _b, _c, _d, _e;
                const layout = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getLayout();
                if (!layout)
                    return null;
                const page = layout.pages[pageNumber - 1];
                if (!page)
                    return null;
                const view = (_b = pagedEditorRef.current) === null || _b === void 0 ? void 0 : _b.getView();
                if (!view)
                    return null;
                const doc = view.state.doc;
                const seen = new Set();
                const paragraphs = [];
                for (const frag of page.fragments) {
                    if (frag.kind !== 'paragraph')
                        continue;
                    // `pmStart` is the position immediately before the paragraph node;
                    // `doc.nodeAt(pmStart)` resolves to the paragraph itself.
                    const pmStart = frag.pmStart;
                    if (pmStart == null)
                        continue;
                    const node = doc.nodeAt(pmStart);
                    if (!node || !node.isTextblock)
                        continue;
                    const paraId = (_c = node.attrs) === null || _c === void 0 ? void 0 : _c.paraId;
                    if (!paraId || seen.has(paraId))
                        continue;
                    seen.add(paraId);
                    paragraphs.push({
                        paraId,
                        text: getVanillaNodeText(node),
                        styleId: (_e = (_d = node.attrs) === null || _d === void 0 ? void 0 : _d.styleId) !== null && _e !== void 0 ? _e : undefined,
                    });
                }
                const text = paragraphs.map((p) => `[${p.paraId}] ${p.text}`).join('\n');
                return { pageNumber, text, paragraphs };
            },
            scrollToParaId: (paraId) => { var _a, _b; return (_b = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.scrollToParaId(paraId)) !== null && _b !== void 0 ? _b : false; },
            findInDocument: (query, opts) => {
                var _a, _b, _c;
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (!view || !query)
                    return [];
                const caseSensitive = (_b = opts === null || opts === void 0 ? void 0 : opts.caseSensitive) !== null && _b !== void 0 ? _b : false;
                const limit = (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 20;
                const needle = caseSensitive ? query : query.toLowerCase();
                const results = [];
                view.state.doc.descendants((node) => {
                    var _a;
                    if (results.length >= limit)
                        return false;
                    if (!node.isTextblock)
                        return true;
                    const paraId = (_a = node.attrs) === null || _a === void 0 ? void 0 : _a.paraId;
                    if (!paraId)
                        return false;
                    const text = getVanillaNodeText(node);
                    const haystack = caseSensitive ? text : text.toLowerCase();
                    const at = haystack.indexOf(needle);
                    if (at === -1)
                        return false;
                    // Reject ambiguous matches in the same paragraph — agent should narrow query.
                    if (haystack.indexOf(needle, at + 1) !== -1)
                        return false;
                    const match = text.slice(at, at + query.length);
                    const CONTEXT = 40;
                    results.push({
                        paraId,
                        match,
                        before: text.slice(Math.max(0, at - CONTEXT), at),
                        after: text.slice(at + query.length, at + query.length + CONTEXT),
                    });
                    return false;
                });
                return results;
            },
            getSelectionInfo: () => {
                var _a, _b, _c;
                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                if (!view)
                    return null;
                const { selection, doc } = view.state;
                const $from = selection.$from;
                // Walk up to nearest textblock
                let depth = $from.depth;
                while (depth > 0 && !$from.node(depth).isTextblock)
                    depth--;
                const para = depth > 0 ? $from.node(depth) : null;
                if (!para)
                    return null;
                const paraId = (_c = (_b = para.attrs) === null || _b === void 0 ? void 0 : _b.paraId) !== null && _c !== void 0 ? _c : null;
                const paraStart = $from.start(depth);
                const paraEnd = paraStart + para.content.size;
                // Vanilla view: build before/selectedText/after independently from the
                // doc so the result matches what the agent reads via read_document and
                // can anchor via add_comment. Insertion-marked text never appears.
                const before = getVanillaTextBetween(doc, paraStart, selection.from);
                const selectedText = getVanillaTextBetween(doc, selection.from, selection.to);
                const after = getVanillaTextBetween(doc, selection.to, paraEnd);
                return {
                    paraId,
                    selectedText,
                    paragraphText: before + selectedText + after,
                    before,
                    after,
                };
            },
            getComments: () => comments,
            onContentChange: (listener) => {
                contentChangeSubscribersRef.current.add(listener);
                return () => {
                    contentChangeSubscribersRef.current.delete(listener);
                };
            },
            onSelectionChange: (listener) => {
                selectionChangeSubscribersRef.current.add(listener);
                return () => {
                    selectionChangeSubscribersRef.current.delete(listener);
                };
            },
        };
        // Expose the same handle to the onReady effect below.
        exposedApiRef.current = api;
        return api;
    }, [
        history.state,
        state.zoom,
        scrollPageInfo,
        handleSave,
        handleDirectPrint,
        loadParsedDocument,
        loadBuffer,
        comments,
    ]);
    // onReady — fire once, after the editor has mounted and the initial document
    // has finished loading, with the imperative API (sheet-SDK parity).
    useEffect(() => {
        if (!onReady || onReadyFiredRef.current || state.isLoading)
            return;
        const api = exposedApiRef.current;
        if (!api)
            return;
        onReadyFiredRef.current = true;
        onReady(api);
    }, [onReady, state.isLoading]);
    const initialSectionProperties = useMemo(() => getInitialSectionProperties(history.state), [history.state]);
    const finalSectionProperties = (_b = (_a = history.state) === null || _a === void 0 ? void 0 : _a.package.document) === null || _b === void 0 ? void 0 : _b.finalSectionProperties;
    // Get header and footer content from document
    const { headerContent, footerContent, firstPageHeaderContent, firstPageFooterContent } = useMemo(() => {
        var _a, _b, _c, _d, _e;
        if (!((_a = history.state) === null || _a === void 0 ? void 0 : _a.package)) {
            return {
                headerContent: null,
                footerContent: null,
                firstPageHeaderContent: null,
                firstPageFooterContent: null,
            };
        }
        const pkg = history.state.package;
        const sectionProps = finalSectionProperties !== null && finalSectionProperties !== void 0 ? finalSectionProperties : initialSectionProperties;
        const headers = pkg.headers;
        const footers = pkg.footers;
        let header = null;
        let footer = null;
        let firstHeader = null;
        let firstFooter = null;
        // Per OOXML §17.6.21, a `<w:sectPr>` that omits a `<w:headerReference>`
        // or `<w:footerReference>` for a given type INHERITS that reference
        // from the most recent preceding section that defined it. Multi-section
        // documents (e.g. the SDS template the user supplied — 30 sections,
        // header refs only on sections[0]) need this walk; the last section's
        // properties alone don't carry the reference forward to the renderer.
        const findInheritedRefs = (kind) => {
            var _a, _b, _c;
            const own = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps[kind];
            if (own && own.length > 0)
                return own;
            const sections = (_a = pkg.document) === null || _a === void 0 ? void 0 : _a.sections;
            if (!Array.isArray(sections))
                return undefined;
            for (let i = sections.length - 1; i >= 0; i--) {
                const refs = (_c = (_b = sections[i]) === null || _b === void 0 ? void 0 : _b.properties) === null || _c === void 0 ? void 0 : _c[kind];
                if (refs && refs.length > 0)
                    return refs;
            }
            return undefined;
        };
        const effHeaderRefs = findInheritedRefs('headerReferences');
        const effFooterRefs = findInheritedRefs('footerReferences');
        if (headers && effHeaderRefs) {
            const defaultRef = effHeaderRefs.find((r) => r.type === 'default');
            if (defaultRef === null || defaultRef === void 0 ? void 0 : defaultRef.rId) {
                header = (_b = headers.get(defaultRef.rId)) !== null && _b !== void 0 ? _b : null;
            }
            const firstRef = effHeaderRefs.find((r) => r.type === 'first');
            if (firstRef === null || firstRef === void 0 ? void 0 : firstRef.rId) {
                firstHeader = (_c = headers.get(firstRef.rId)) !== null && _c !== void 0 ? _c : null;
            }
        }
        if (footers && effFooterRefs) {
            const defaultRef = effFooterRefs.find((r) => r.type === 'default');
            if (defaultRef === null || defaultRef === void 0 ? void 0 : defaultRef.rId) {
                footer = (_d = footers.get(defaultRef.rId)) !== null && _d !== void 0 ? _d : null;
            }
            const firstRef = effFooterRefs.find((r) => r.type === 'first');
            if (firstRef === null || firstRef === void 0 ? void 0 : firstRef.rId) {
                firstFooter = (_e = footers.get(firstRef.rId)) !== null && _e !== void 0 ? _e : null;
            }
        }
        // When titlePg is not set but only 'first' headers exist, use them as default
        if (!(sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.titlePg)) {
            if (!header && firstHeader)
                header = firstHeader;
            if (!footer && firstFooter)
                footer = firstFooter;
        }
        return {
            headerContent: header,
            footerContent: footer,
            firstPageHeaderContent: firstHeader,
            firstPageFooterContent: firstFooter,
        };
    }, [history.state, initialSectionProperties, finalSectionProperties]);
    // Handle header/footer double-click — open editing overlay
    // If no header/footer exists, create an empty one so the user can add content
    const handleHeaderFooterDoubleClick = useCallback((position, pageNumber) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const sectProps = (_c = (_b = (_a = history.state) === null || _a === void 0 ? void 0 : _a.package) === null || _b === void 0 ? void 0 : _b.document) === null || _c === void 0 ? void 0 : _c.finalSectionProperties;
        const isFirstPage = (sectProps === null || sectProps === void 0 ? void 0 : sectProps.titlePg) === true && (pageNumber !== null && pageNumber !== void 0 ? pageNumber : 1) === 1;
        const hf = isFirstPage
            ? position === 'header'
                ? firstPageHeaderContent
                : firstPageFooterContent
            : position === 'header'
                ? headerContent
                : footerContent;
        setHfEditIsFirstPage(isFirstPage);
        if (hf) {
            setHfEditPosition(position);
            return;
        }
        // Create empty header/footer for docs that don't have one yet
        if (!((_d = history.state) === null || _d === void 0 ? void 0 : _d.package))
            return;
        const pkg = history.state.package;
        const sectionProps = (_e = pkg.document) === null || _e === void 0 ? void 0 : _e.finalSectionProperties;
        if (!sectionProps)
            return;
        const hdrFtrType = isFirstPage ? 'first' : 'default';
        const rId = `rId_new_${position}_${hdrFtrType}`;
        const emptyHf = {
            type: position === 'header' ? 'header' : 'footer',
            hdrFtrType,
            content: [{ type: 'paragraph', content: [] }],
        };
        const mapKey = position === 'header' ? 'headers' : 'footers';
        const newMap = new Map((_f = pkg[mapKey]) !== null && _f !== void 0 ? _f : []);
        newMap.set(rId, emptyHf);
        const refKey = position === 'header' ? 'headerReferences' : 'footerReferences';
        const existingRefs = (_g = sectionProps[refKey]) !== null && _g !== void 0 ? _g : [];
        const newRef = { type: hdrFtrType, rId };
        // Register the rel so the serializer wires up content types + doc rels (#274).
        const existingRels = pkg.relationships;
        const usedTargets = new Set();
        for (const rel of (_h = existingRels === null || existingRels === void 0 ? void 0 : existingRels.values()) !== null && _h !== void 0 ? _h : []) {
            if (rel.target)
                usedTargets.add(rel.target);
        }
        let targetNum = 1;
        while (usedTargets.has(`${position}${targetNum}.xml`))
            targetNum++;
        const relType = position === 'header'
            ? 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
            : 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';
        const newRelationships = new Map(existingRels);
        newRelationships.set(rId, {
            id: rId,
            type: relType,
            target: `${position}${targetNum}.xml`,
        });
        const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, pkg), { [mapKey]: newMap, relationships: newRelationships, document: pkg.document
                    ? Object.assign(Object.assign({}, pkg.document), { finalSectionProperties: Object.assign(Object.assign({}, sectionProps), { [refKey]: [...existingRefs, newRef] }) }) : pkg.document }) });
        pushDocument(newDoc);
        setHfEditPosition(position);
    }, [
        headerContent,
        footerContent,
        firstPageHeaderContent,
        firstPageFooterContent,
        history,
        pushDocument,
    ]);
    // Handle header/footer save — update document package with edited content
    const handleHeaderFooterSave = useCallback((content) => {
        var _a, _b, _c, _d, _e;
        if (!hfEditPosition || !((_a = history.state) === null || _a === void 0 ? void 0 : _a.package)) {
            setHfEditPosition(null);
            return;
        }
        const pkg = history.state.package;
        const sectionProps = (_b = pkg.document) === null || _b === void 0 ? void 0 : _b.finalSectionProperties;
        const refs = hfEditPosition === 'header'
            ? sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.headerReferences
            : sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.footerReferences;
        const targetType = hfEditIsFirstPage ? 'first' : 'default';
        const activeRef = (_e = (_d = (_c = refs === null || refs === void 0 ? void 0 : refs.find((r) => r.type === targetType)) !== null && _c !== void 0 ? _c : refs === null || refs === void 0 ? void 0 : refs.find((r) => r.type === 'default')) !== null && _d !== void 0 ? _d : refs === null || refs === void 0 ? void 0 : refs.find((r) => r.type === 'first')) !== null && _e !== void 0 ? _e : refs === null || refs === void 0 ? void 0 : refs[0];
        const mapKey = hfEditPosition === 'header' ? 'headers' : 'footers';
        const map = pkg[mapKey];
        if ((activeRef === null || activeRef === void 0 ? void 0 : activeRef.rId) && map) {
            const existing = map.get(activeRef.rId);
            const updated = Object.assign(Object.assign({ type: hfEditPosition, hdrFtrType: activeRef.type }, existing), { content });
            const newMap = new Map(map);
            newMap.set(activeRef.rId, updated);
            const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, pkg), { [mapKey]: newMap }) });
            pushDocument(newDoc);
        }
        setHfEditPosition(null);
    }, [hfEditPosition, history, pushDocument]);
    // Handle body click while in HF editing mode — save + close
    const handleBodyClick = useCallback(() => {
        var _a;
        if (!hfEditPosition)
            return;
        // Save if dirty, then close
        const view = (_a = hfEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (view) {
            const blocks = proseDocToBlocks(view.state.doc);
            handleHeaderFooterSave(blocks);
        }
        else {
            setHfEditPosition(null);
        }
    }, [hfEditPosition, handleHeaderFooterSave]);
    // Toggle the OOXML `w:titlePg` flag on the document's section
    // properties. When on, page 1 renders its own header/footer slot;
    // off restores the unified header/footer behaviour. The layout
    // engine already honours the flag; this just wires the on/off
    // mutation behind the HF options dropdown.
    const handleToggleTitlePg = useCallback((value) => {
        var _a, _b;
        if (!((_b = (_a = history.state) === null || _a === void 0 ? void 0 : _a.package) === null || _b === void 0 ? void 0 : _b.document))
            return;
        const pkg = history.state.package;
        const sectionProps = pkg.document.finalSectionProperties;
        pushDocument(Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, pkg), { document: Object.assign(Object.assign({}, pkg.document), { finalSectionProperties: Object.assign(Object.assign({}, sectionProps), { titlePg: value }) }) }) }));
    }, [history, pushDocument]);
    // Toggle `w:evenAndOddHeaders` (lives on settings.xml in OOXML, but
    // exposed here off the document object alongside titlePg). Painter
    // reads this flag to render an alternate even-page H/F.
    const handleToggleEvenAndOddHeaders = useCallback((value) => {
        var _a, _b;
        if (!((_b = (_a = history.state) === null || _a === void 0 ? void 0 : _a.package) === null || _b === void 0 ? void 0 : _b.document))
            return;
        const pkg = history.state.package;
        const sectionProps = pkg.document.finalSectionProperties;
        pushDocument(Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, pkg), { document: Object.assign(Object.assign({}, pkg.document), { finalSectionProperties: Object.assign(Object.assign({}, sectionProps), { evenAndOddHeaders: value }) }) }) }));
    }, [history, pushDocument]);
    // Handle removing the header/footer entirely
    const handleRemoveHeaderFooter = useCallback(() => {
        var _a, _b, _c, _d, _e, _f;
        if (!hfEditPosition || !((_a = history.state) === null || _a === void 0 ? void 0 : _a.package)) {
            setHfEditPosition(null);
            return;
        }
        const pkg = history.state.package;
        const sectionProps = (_b = pkg.document) === null || _b === void 0 ? void 0 : _b.finalSectionProperties;
        const refKey = hfEditPosition === 'header' ? 'headerReferences' : 'footerReferences';
        const mapKey = hfEditPosition === 'header' ? 'headers' : 'footers';
        const refs = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps[refKey];
        const delTargetType = hfEditIsFirstPage ? 'first' : 'default';
        const activeRef = (_e = (_d = (_c = refs === null || refs === void 0 ? void 0 : refs.find((r) => r.type === delTargetType)) !== null && _c !== void 0 ? _c : refs === null || refs === void 0 ? void 0 : refs.find((r) => r.type === 'default')) !== null && _d !== void 0 ? _d : refs === null || refs === void 0 ? void 0 : refs.find((r) => r.type === 'first')) !== null && _e !== void 0 ? _e : refs === null || refs === void 0 ? void 0 : refs[0];
        if (activeRef === null || activeRef === void 0 ? void 0 : activeRef.rId) {
            const newMap = new Map((_f = pkg[mapKey]) !== null && _f !== void 0 ? _f : []);
            newMap.delete(activeRef.rId);
            const newRefs = (refs !== null && refs !== void 0 ? refs : []).filter((r) => r.rId !== activeRef.rId);
            const newDoc = Object.assign(Object.assign({}, history.state), { package: Object.assign(Object.assign({}, pkg), { [mapKey]: newMap, document: pkg.document
                        ? Object.assign(Object.assign({}, pkg.document), { finalSectionProperties: Object.assign(Object.assign({}, sectionProps), { [refKey]: newRefs }) }) : pkg.document }) });
            pushDocument(newDoc);
        }
        setHfEditPosition(null);
    }, [hfEditPosition, history, pushDocument]);
    // Get the DOM element for the header/footer area on the first page
    const getHfTargetElement = useCallback((pos) => {
        var _a;
        const pagesContainer = (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.querySelector('.paged-editor__pages');
        if (!pagesContainer)
            return null;
        const className = pos === 'header' ? '.layout-page-header' : '.layout-page-footer';
        return pagesContainer.querySelector(className);
    }, []);
    // Container styles - using overflow: auto so sticky toolbar works
    const containerStyle = Object.assign({ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', 
        // The shell fills its (host-bounded) box and never scrolls itself — only
        // the inner canvas (editorContainerStyle) scrolls. overflow:hidden +
        // minHeight:0 keep the flex column from overflowing its parent, so the
        // chrome (toolbar/status bar) stays fixed regardless of how the host
        // sizes us.
        minHeight: 0, overflow: 'hidden', backgroundColor: 'var(--doc-bg)' }, style);
    const mainContentStyle = {
        display: 'flex',
        flex: 1,
        minHeight: 0, // Allow flex item to shrink below content size
        minWidth: 0, // Allow flex item to shrink below content width on narrow viewports
        flexDirection: 'row',
    };
    // --- Unified sidebar items ---
    const commentCallbacksRef = useRef({});
    commentCallbacksRef.current = {
        onCommentReply: (id, text) => {
            const reply = createComment(text, author, id);
            const parent = comments.find((c) => c.id === id);
            setComments((prev) => [...prev, reply]);
            if (parent)
                onCommentReply === null || onCommentReply === void 0 ? void 0 : onCommentReply(reply, parent);
        },
        onCommentResolve: (id) => {
            const target = comments.find((c) => c.id === id);
            setComments((prev) => prev.map((c) => (c.id === id ? Object.assign(Object.assign({}, c), { done: true }) : c)));
            // Collapse the card to its checkmark marker immediately. Resolving
            // doesn't go through a PM transaction, so the cursor-based collapse
            // path wouldn't fire; do it explicitly. Cascades into the highlight
            // hide via resolvedIdsForRender.
            if (expandedSidebarItem === `comment-${id}`) {
                setExpandedSidebarItem(null);
            }
            if (target)
                onCommentResolve === null || onCommentResolve === void 0 ? void 0 : onCommentResolve(Object.assign(Object.assign({}, target), { done: true }));
        },
        onCommentUnresolve: (id) => {
            setComments((prev) => prev.map((c) => (c.id === id ? Object.assign(Object.assign({}, c), { done: undefined }) : c)));
        },
        onCommentDelete: (id) => {
            var _a, _b;
            const target = comments.find((c) => c.id === id);
            setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
            // Remove the comment mark from PM to clear the yellow highlight
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view) {
                const mark = (_b = view.state.schema.marks.comment) === null || _b === void 0 ? void 0 : _b.create({ commentId: id });
                if (mark) {
                    const tr = view.state.tr.removeMark(0, view.state.doc.content.size, mark);
                    if (tr.docChanged)
                        view.dispatch(tr);
                }
            }
            if (target)
                onCommentDelete === null || onCommentDelete === void 0 ? void 0 : onCommentDelete(target);
        },
        onAddComment: (addText) => {
            var _a;
            const comment = createComment(addText, author);
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view && commentSelectionRange) {
                const { from, to } = commentSelectionRange;
                const pendingMark = view.state.schema.marks.comment.create({
                    commentId: PENDING_COMMENT_ID,
                });
                const realMark = view.state.schema.marks.comment.create({
                    commentId: comment.id,
                });
                const tr = view.state.tr.removeMark(from, to, pendingMark).addMark(from, to, realMark);
                view.dispatch(tr);
            }
            setComments((prev) => [...prev, comment]);
            setIsAddingComment(false);
            setCommentSelectionRange(null);
            setAddCommentYPosition(null);
            onCommentAdd === null || onCommentAdd === void 0 ? void 0 : onCommentAdd(comment);
        },
        onCancelAddComment: () => {
            var _a;
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view && commentSelectionRange) {
                const { from, to } = commentSelectionRange;
                const pendingMark = view.state.schema.marks.comment.create({
                    commentId: PENDING_COMMENT_ID,
                });
                view.dispatch(view.state.tr.removeMark(from, to, pendingMark));
            }
            setIsAddingComment(false);
            setCommentSelectionRange(null);
            setAddCommentYPosition(null);
        },
        onAcceptChange: (from, to) => {
            var _a;
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view)
                acceptChange(from, to)(view.state, view.dispatch);
            // No explicit re-extract: the dispatch fires `handleDocumentChange`,
            // which mirrors the new PM state into `pmState` and `useTrackedChanges`
            // re-derives.
        },
        onRejectChange: (from, to) => {
            var _a;
            const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
            if (view)
                rejectChange(from, to)(view.state, view.dispatch);
        },
        onTrackedChangeReply: (revisionId, text) => {
            setComments((prev) => [...prev, createComment(text, author, revisionId)]);
        },
    };
    // Bulk tracked-change actions used by the suggesting-mode sidebar
    // header bar. Each command lives in @eigenpal/docx-core; this is just
    // a focus + scroll convenience wrapper.
    const handleAcceptAllChanges = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        acceptAllChanges()(view.state, view.dispatch);
    }, []);
    const handleRejectAllChanges = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        rejectAllChanges()(view.state, view.dispatch);
    }, []);
    const handleNextChange = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const cursor = view.state.selection.from;
        const next = findNextChange(view.state, cursor);
        if (next) {
            view.dispatch(view.state.tr
                .setSelection(TextSelection.create(view.state.doc, next.from, next.to))
                .scrollIntoView());
            view.focus();
        }
    }, []);
    const handlePreviousChange = useCallback(() => {
        var _a;
        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
        if (!view)
            return;
        const cursor = view.state.selection.from;
        const prev = findPreviousChange(view.state, cursor);
        if (prev) {
            view.dispatch(view.state.tr
                .setSelection(TextSelection.create(view.state.doc, prev.from, prev.to))
                .scrollIntoView());
            view.focus();
        }
    }, []);
    // Stable callbacks wrapper that delegates to ref (avoids recreating items on every render)
    const stableCallbacks = useMemo(() => ({
        onCommentReply: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onCommentReply) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onCommentResolve: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onCommentResolve) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onCommentUnresolve: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onCommentUnresolve) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onCommentDelete: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onCommentDelete) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onAddComment: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onAddComment) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onCancelAddComment: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onCancelAddComment) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onAcceptChange: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onAcceptChange) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onRejectChange: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onRejectChange) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
        onTrackedChangeReply: (...args) => { var _a, _b; return (_b = (_a = commentCallbacksRef.current).onTrackedChangeReply) === null || _b === void 0 ? void 0 : _b.call(_a, ...args); },
    }), []);
    const commentSidebarItems = useCommentSidebarItems({
        comments,
        trackedChanges,
        callbacks: stableCallbacks,
        showResolved: showCommentsSidebar,
        isAddingComment: showCommentsSidebar ? isAddingComment : false,
        addCommentYPosition,
        currentAuthor: author,
    });
    const allSidebarItems = useMemo(() => {
        const items = [];
        if (showCommentsSidebar)
            items.push(...commentSidebarItems);
        if (pluginSidebarItems)
            items.push(...pluginSidebarItems);
        return items;
    }, [showCommentsSidebar, commentSidebarItems, pluginSidebarItems]);
    // Build a map from insertion revisionIds to sidebar item IDs for replacement tracked changes.
    // This allows clicking the insertion part of a replacement to activate the same sidebar card.
    const revisionIdAliases = useMemo(() => {
        const map = new Map();
        trackedChanges.forEach((change, idx) => {
            if (change.type === 'replacement' && change.insertionRevisionId != null) {
                map.set(String(change.insertionRevisionId), `tc-${change.revisionId}-${idx}`);
            }
        });
        return map;
    }, [trackedChanges]);
    // "Sidebar open" drives PagedEditor's left-translate so the centered
    // page makes horizontal room for Comments and per-anchor plugin
    // items, which both live inside PagedEditor's sidebarOverlay. Version
    // history is a flex sibling of the scroll container (see below) so
    // it reserves real horizontal space via the flex layout and doesn't
    // need the translate hack.
    const sidebarOpen = showCommentsSidebar || allSidebarItems.length > 0;
    // Reserve 2× the left-edge allowance so the centered page clears whatever
    // outline UI is showing, without forcing a shift on wide viewports.
    // Google-Docs-style centering: the page centers in the FULL window at every
    // width; the ruler + outline BUTTON are overlays in the page's left gutter, so
    // they don't reserve flow space and may scroll off-screen-left when the window
    // is too narrow to fit the page. Only the expanded outline PANEL is a real
    // left panel, so only it reserves a (symmetric, to keep the page centered)
    // lane. Previously the outline-button case reserved a 2×button-space lane,
    // which pushed the page into a left "lane" at medium widths and jammed the
    // ruler against the window's left corner instead of centering.
    const outlineLeftAllowance = showOutline ? OUTLINE_RESERVED_SPACE : 0;
    const minLayoutWidth = 2 * outlineLeftAllowance + DEFAULT_PAGE_WIDTH + (sidebarOpen ? SIDEBAR_DOCUMENT_SHIFT * 2 : 0);
    const sectionPropsPageWidth = (_f = (_e = (_d = (_c = history.state) === null || _c === void 0 ? void 0 : _c.package) === null || _d === void 0 ? void 0 : _d.document) === null || _e === void 0 ? void 0 : _e.finalSectionProperties) === null || _f === void 0 ? void 0 : _f.pageWidth;
    const pageWidthPx = sectionPropsPageWidth
        ? Math.round(sectionPropsPageWidth / 15)
        : DEFAULT_PAGE_WIDTH;
    const resolvedCommentIds = useMemo(() => {
        const ids = new Set();
        for (const c of comments) {
            if (c.done && c.parentId == null)
                ids.add(c.id);
        }
        return ids;
    }, [comments]);
    // Exclude expanded resolved comment from hide-set so its text gets highlighted
    const resolvedIdsForRender = useMemo(() => {
        if (!(expandedSidebarItem === null || expandedSidebarItem === void 0 ? void 0 : expandedSidebarItem.startsWith('comment-')))
            return resolvedCommentIds;
        const expandedId = parseInt(expandedSidebarItem.slice(8), 10);
        if (isNaN(expandedId) || !resolvedCommentIds.has(expandedId))
            return resolvedCommentIds;
        const ids = new Set(resolvedCommentIds);
        ids.delete(expandedId);
        return ids;
    }, [resolvedCommentIds, expandedSidebarItem]);
    const editorContainerStyle = {
        flex: 1,
        minHeight: 0,
        minWidth: 0, // Allow flex item to shrink below content width on narrow viewports
        overflow: 'auto', // Sole scroll container — PagedEditor sizes to content
        // Contain the scroll: reaching the top/bottom of the canvas must NOT
        // chain to the document and rubber-band the whole page (macOS/iOS).
        overscrollBehavior: 'contain',
        position: 'relative',
        overflowAnchor: 'none',
    };
    // Render loading state
    if (state.isLoading) {
        return (_jsx("div", { className: `ep-root docx-editor docx-editor-loading ${className}`, style: containerStyle, "data-testid": "docx-editor", children: loadingIndicator || _jsx(DefaultLoadingIndicator, {}) }));
    }
    // Render error state
    if (state.parseError) {
        return (_jsx("div", { className: `ep-root docx-editor docx-editor-error ${className}`, style: containerStyle, "data-testid": "docx-editor", children: _jsx(ParseError, { message: state.parseError }) }));
    }
    // Render placeholder when no document
    if (!history.state) {
        return (_jsx("div", { className: `ep-root docx-editor docx-editor-empty ${className}`, style: containerStyle, "data-testid": "docx-editor", children: placeholder || _jsx(DefaultPlaceholder, {}) }));
    }
    const toolbarChildren = (_jsxs(_Fragment, { children: [_jsx(ToolbarSeparator, {}), _jsx(EditingModeDropdown, { mode: editingMode, onModeChange: (mode) => {
                    setEditingMode(mode);
                    if (mode === 'suggesting')
                        setShowCommentsSidebar(true);
                } }), agentPanel && agentPanel.showToolbarButton !== false && (_jsxs(_Fragment, { children: [_jsx(ToolbarSeparator, {}), _jsx(AgentPanelToggle, { active: agentPanelOpen, badge: agentPanel.toolbarBadge, onClick: () => setAgentPanelOpen(!agentPanelOpen) })] })), toolbarExtra] }));
    // Suppress TS6133 for identifiers preserved while the LLM-stack UI
    // is hidden. None of these are unused conceptually — they're the
    // anchor points the restoration will reach for. This single void
    // reference keeps the declarations in scope without polluting the
    // render with `false &&` gates that would also break TS narrowing.
    void [
        AISuggestionPanel,
        ChatPanel,
        WritingAssistantSheet,
        applyMarkdownAsSuggestion,
        stripModelPreamble,
        handleToggleVoiceTyping,
        showWritingAssistant,
        showChatPanel,
        hasTextSelection,
        handleAiAccept,
        handleAiReject,
        handleAiRetry,
        handleAiTone,
    ];
    return (_jsx(LocaleProvider, { i18n: i18n, children: _jsx(ErrorProvider, { children: _jsx(ErrorBoundary, { onError: handleEditorError, children: _jsxs("div", { ref: containerRef, className: `ep-root docx-editor ${className}`, style: containerStyle, "data-testid": "docx-editor", children: [_jsxs("div", { style: mainContentStyle, children: [_jsxs("div", { style: {
                                        position: 'relative',
                                        flex: 1,
                                        minHeight: 0,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }, children: [showToolbar && !readOnlyProp && !focusMode && (_jsx("div", { ref: toolbarRefCallback, className: "z-50 flex flex-col gap-0 flex-shrink-0", children: _jsxs(EditorToolbar
                                            // When the agent panel is open, round the toolbar's
                                            // bottom-right corner so it mirrors the panel's top-left.
                                            // The radius transition (inline style on the inner div)
                                            // makes opening / closing ease instead of snap.
                                            , { 
                                                // When the agent panel is open, round the toolbar's
                                                // bottom-right corner so it mirrors the panel's top-left.
                                                // The radius transition (inline style on the inner div)
                                                // makes opening / closing ease instead of snap.
                                                className: agentPanelOpen ? 'rounded-br-2xl' : undefined, style: {
                                                    transition: 'border-radius var(--doc-anim-slow)',
                                                }, currentFormatting: state.selectionFormatting, onFormat: handleFormat, onUndo: undoActiveEditor, onRedo: redoActiveEditor, canUndo: canUndoActiveEditor, canRedo: canRedoActiveEditor, disabled: readOnly, documentStyles: (_h = (_g = history.state) === null || _g === void 0 ? void 0 : _g.package.styles) === null || _h === void 0 ? void 0 : _h.styles, theme: ((_j = history.state) === null || _j === void 0 ? void 0 : _j.package.theme) || theme, showPrintButton: showPrintButton, fontFamilies: fontFamilies, onPrint: handleDirectPrint, onOpen: handleOpenDocument, onSave: handleDownloadDocument, onMakeCopy: handleMakeCopy, onEmailAsAttachment: handleEmailAsAttachment, onNew: onNew, showZoomControl: showZoomControl, zoom: state.zoom, onZoomChange: handleZoomChange, onRefocusEditor: focusActiveEditor, onInsertTable: handleInsertTable, showTableInsert: true, onInsertImage: handleInsertImageClick, onInsertPageBreak: handleInsertPageBreak, onInsertSectionBreak: handleInsertSectionBreak, onInsertField: handleInsertField, onInsertTOC: handleInsertTOC, onOpenBookmarks: () => setBookmarksDialogOpen(true), onOpenCharacterSpacing: handleOpenCharacterSpacing, onOpenParagraphDialog: handleOpenParagraphDialog, onOpenBordersShading: handleOpenBordersShading, onAddComment: handleStartAddComment, onPaintFormat: handleTogglePaintFormat, paintFormatArmed: paintFormatMarks != null, onInsertHorizontalRule: handleInsertHorizontalRule, onInsertFootnote: handleInsertFootnote, onOpenInsertSymbol: handleOpenInsertSymbol, onToggleShowRuler: handleToggleShowRuler, rulerVisible: showRulerEffective, onToggleShowFormattingMarks: handleToggleShowFormattingMarks, showFormattingMarks: showFormattingMarks, onToggleOutline: handleToggleOutline, outlineVisible: showOutline, imageContext: state.pmImageContext, onImageWrapType: handleImageWrapType, onImageTransform: handleImageTransform, onOpenImageProperties: handleOpenImageProperties, onPageSetup: handleOpenPageSetup, onFileProperties: handleOpenFileProperties, onOpenWordCount: handleOpenWordCount, 
                                                // Voice typing hidden — Web Speech API is
                                                // inconsistent across browsers. Re-enable when
                                                // we standardize on a backend.
                                                onExportPdf: handleExportPdf, onExportOdt: handleExportOdt, onExportMd: handleExportMd, onExportTxt: handleExportTxt, onReportBug: handleReportBug, onShowAbout: handleShowAbout, onOpenCommandPalette: () => setShowCommandPalette(true), onOpenKeyboardShortcuts: () => setShowKeyboardShortcuts(true), onOpenPreferences: () => setShowPreferences(true), onOpenWatermark: () => setShowWatermarkDialog(true), onOpenAccessibility: handleOpenAccessibility, onOpenBuildingBlocks: handleOpenBuildingBlocks, onConvertSelectionToTable: handleConvertSelectionToTable, onConvertTableToText: ((_k = state.pmTableContext) === null || _k === void 0 ? void 0 : _k.isInTable) ? handleConvertTableToText : undefined, onOpenDictionary: handleOpenDictionary, 
                                                // LLM-stack entry points hidden: onOpenTranslate,
                                                // onTranslateDocument, onOpenWritingAssistant,
                                                // onOpenExplore. WebLLM inference blocks the main
                                                // thread on long docs; until that lands a yielding
                                                // path, these surfaces stay off. Re-wire with the
                                                // existing handlers when ready.
                                                onToggleSpellcheck: handleToggleSpellcheck, spellcheckEnabled: spellOn, onOpenCitations: handleOpenCitations, onInsertShape: handleInsertShape, onInsertTextBox: handleInsertTextBox, onSetColorTheme: handleSetColorTheme, colorTheme: colorTheme, isDirty: isDirty, isSaving: isSaving, tableContext: state.pmTableContext, onTableAction: handleTableAction, children: [_jsxs(EditorToolbar.TitleBar, { children: [renderLogo && _jsx(EditorToolbar.Logo, { children: renderLogo() }), documentName !== undefined && (_jsx(EditorToolbar.DocumentName, { value: documentName, onChange: onDocumentNameChange, editable: documentNameEditable })), renderTitleBarRight && (_jsx(EditorToolbar.TitleBarRight, { children: renderTitleBarRight() })), _jsx(EditorToolbar.MenuBar, {})] }), _jsx(EditorToolbar.FormattingBar, { children: toolbarChildren })] }) })), editingMode === 'suggesting' && (_jsx(SuggestingModeBanner, { onSwitchToEditing: () => setEditingMode('editing') })), _jsx(AutosaveRestoreBanner, { onRestore: (buf, name) => {
                                                void loadBuffer(buf);
                                                onDocumentNameChange === null || onDocumentNameChange === void 0 ? void 0 : onDocumentNameChange(name);
                                            } }), _jsxs("div", { style: {
                                                display: 'flex',
                                                flex: 1,
                                                minHeight: 0,
                                                minWidth: 0,
                                                flexDirection: 'row',
                                                position: 'relative',
                                            }, children: [_jsxs("div", { ref: scrollContainerRef, style: editorContainerStyle, onMouseDown: (e) => {
                                                        // Click in the grey gutter around the page → collapse any
                                                        // expanded sidebar card. Clicks on the doc body already
                                                        // collapse via the cursor-mark detector; clicks inside the
                                                        // sidebar are user interactions with the card itself.
                                                        const target = e.target;
                                                        if (target.closest('.paged-editor__pages') ||
                                                            target.closest('.docx-unified-sidebar') ||
                                                            target.closest('.docx-comment-margin-markers')) {
                                                            return;
                                                        }
                                                        setExpandedSidebarItem(null);
                                                    }, children: [showRulerEffective && !versionPreview && (_jsx("div", { className: "flex justify-center py-1 flex-shrink-0 bg-doc-bg", style: {
                                                                position: 'sticky',
                                                                top: 0,
                                                                // Must sit above the inline header/footer editor
                                                                // (Z_INDEX.hfInlineEditor) so the ruler stays readable
                                                                // when the HF editor is active near the viewport top.
                                                                zIndex: Z_INDEX.ruler,
                                                                // paddingRight biases the centered ruler so it tracks
                                                                // the page when the comments sidebar (translateX)
                                                                // shifts the page left. Outline doesn't bias here —
                                                                // the page stays centered until minLayoutWidth forces
                                                                // horizontal scroll, and the ruler centers with it.
                                                                paddingLeft: 20,
                                                                paddingRight: 20 + (sidebarOpen ? SIDEBAR_DOCUMENT_SHIFT * 2 : 0),
                                                                minWidth: minLayoutWidth,
                                                                transition: 'padding var(--doc-anim-slow)',
                                                            }, children: _jsx(HorizontalRuler, { sectionProps: (_m = (_l = history.state) === null || _l === void 0 ? void 0 : _l.package.document) === null || _m === void 0 ? void 0 : _m.finalSectionProperties, zoom: state.zoom, unit: rulerUnit, editable: !readOnly, onLeftMarginChange: handleLeftMarginChange, onRightMarginChange: handleRightMarginChange, indentLeft: state.paragraphIndentLeft, indentRight: state.paragraphIndentRight, onIndentLeftChange: handleIndentLeftChange, onIndentRightChange: handleIndentRightChange, showFirstLineIndent: true, firstLineIndent: state.paragraphFirstLineIndent, hangingIndent: state.paragraphHangingIndent, onFirstLineIndentChange: handleFirstLineIndentChange, tabStops: state.paragraphTabs, onTabStopRemove: handleTabStopRemove, onDragStateChange: (d) => {
                                                                    marginDraggingRef.current = d;
                                                                } }) })), _jsx("div", { style: {
                                                                display: 'flex',
                                                                flex: 1,
                                                                minHeight: 0,
                                                                position: 'relative',
                                                                minWidth: minLayoutWidth,
                                                            }, children: _jsxs("div", { ref: editorContentRef, style: {
                                                                    position: 'relative',
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }, onMouseDown: (e) => {
                                                                    var _a;
                                                                    // Focus editor when clicking on the background area (not the editor itself)
                                                                    // Using mouseDown for immediate response before focus can be lost
                                                                    if (e.target === e.currentTarget) {
                                                                        e.preventDefault();
                                                                        (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                                                                    }
                                                                }, onContextMenu: handleEditorContextMenu, children: [showRulerEffective && !readOnlyProp && (_jsx("div", { style: {
                                                                            position: 'absolute',
                                                                            left: 0,
                                                                            right: 0,
                                                                            top: 0,
                                                                            // Above the inline HF editor (Z_INDEX.hfInlineEditor)
                                                                            // so it stays readable on horizontal scroll.
                                                                            zIndex: Z_INDEX.ruler,
                                                                            // Must match `.paged-editor__pages` padding-top in
                                                                            // editor.css (24 viewport + 24 pages container).
                                                                            // That padding scales with zoom, so the ruler's
                                                                            // top offset has to scale too or it drifts off the
                                                                            // page top at non-100% zoom.
                                                                            paddingTop: 48 * state.zoom,
                                                                            // Same horizontal centering as the horizontal ruler
                                                                            // so the vertical ruler tracks the centered page
                                                                            // (and its comment-sidebar bias).
                                                                            paddingLeft: 20,
                                                                            paddingRight: 20 + (sidebarOpen ? SIDEBAR_DOCUMENT_SHIFT * 2 : 0),
                                                                            display: 'flex',
                                                                            justifyContent: 'center',
                                                                            // Only the ruler itself is interactive; the wrapper
                                                                            // must not swallow clicks over the gutter/page.
                                                                            pointerEvents: 'none',
                                                                            transition: 'padding var(--doc-anim-slow)',
                                                                        }, children: _jsx("div", { style: {
                                                                                width: pageWidthPx * state.zoom,
                                                                                flexShrink: 0,
                                                                                position: 'relative',
                                                                            }, children: _jsx("div", { style: {
                                                                                    position: 'absolute',
                                                                                    right: '100%',
                                                                                    top: 0,
                                                                                    marginRight: 6,
                                                                                    pointerEvents: 'auto',
                                                                                }, children: _jsx(VerticalRuler
                                                                                // Live section props (NOT initialSectionProperties):
                                                                                // margin drags write to finalSectionProperties, and the
                                                                                // horizontal ruler reads the same. initialSectionProperties
                                                                                // resolves to sections[0].properties for docs that have a
                                                                                // section, which the drag never updates — so the top/bottom
                                                                                // margin marker stayed pinned while the page reflowed.
                                                                                , { 
                                                                                    // Live section props (NOT initialSectionProperties):
                                                                                    // margin drags write to finalSectionProperties, and the
                                                                                    // horizontal ruler reads the same. initialSectionProperties
                                                                                    // resolves to sections[0].properties for docs that have a
                                                                                    // section, which the drag never updates — so the top/bottom
                                                                                    // margin marker stayed pinned while the page reflowed.
                                                                                    sectionProps: finalSectionProperties !== null && finalSectionProperties !== void 0 ? finalSectionProperties : initialSectionProperties, zoom: state.zoom, unit: rulerUnit, editable: !readOnly, onTopMarginChange: handleTopMarginChange, onBottomMarginChange: handleBottomMarginChange, onDragStateChange: (d) => {
                                                                                        marginDraggingRef.current = d;
                                                                                    } }) }) }) })), expandedSidebarItem && expandedSidebarItem.startsWith('comment-') && (_jsx("style", { children: `.paged-editor__pages [data-comment-id="${expandedSidebarItem.replace('comment-', '')}"] { background-color: rgba(255, 212, 0, 0.35) !important; border-bottom: 2px solid rgba(255, 212, 0, 0.7) !important; }` })), (expandedSidebarItem === null || expandedSidebarItem === void 0 ? void 0 : expandedSidebarItem.startsWith('tc-')) &&
                                                                        (() => {
                                                                            const revId = expandedSidebarItem.split('-')[1];
                                                                            const tc = trackedChanges.find((c) => String(c.revisionId) === revId);
                                                                            const insRevId = tc === null || tc === void 0 ? void 0 : tc.insertionRevisionId;
                                                                            return (_jsx("style", { children: `
                            .paged-editor__pages .docx-insertion[data-revision-id="${insRevId !== null && insRevId !== void 0 ? insRevId : revId}"] { background-color: rgba(52, 168, 83, 0.2) !important; border-bottom: 2px solid #2e7d32 !important; }
                            .paged-editor__pages .docx-deletion[data-revision-id="${revId}"] { background-color: rgba(211, 47, 47, 0.2) !important; text-decoration-thickness: 2px !important; }
                          ` }));
                                                                        })(), (_pagedSelectionChangeImplRef.current = (_from, _to) => {
                                                                        var _a, _b, _c, _d, _e, _f;
                                                                        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                                                                        if (view) {
                                                                            const selectionState = extractSelectionState(view.state);
                                                                            handleSelectionChange(selectionState);
                                                                            const $from = view.state.selection.$from;
                                                                            const marks = [
                                                                                ...((_b = view.state.storedMarks) !== null && _b !== void 0 ? _b : []),
                                                                                ...((_d = (_c = $from.nodeAfter) === null || _c === void 0 ? void 0 : _c.marks) !== null && _d !== void 0 ? _d : []),
                                                                                ...((_f = (_e = $from.nodeBefore) === null || _e === void 0 ? void 0 : _e.marks) !== null && _f !== void 0 ? _f : []),
                                                                                ...$from.marks(),
                                                                            ];
                                                                            let cursorSidebarItem = null;
                                                                            for (const mark of marks) {
                                                                                if (mark.type.name === 'comment' &&
                                                                                    mark.attrs.commentId != null) {
                                                                                    const commentId = mark.attrs.commentId;
                                                                                    if (resolvedCommentIds.has(commentId))
                                                                                        continue;
                                                                                    cursorSidebarItem = `comment-${commentId}`;
                                                                                    break;
                                                                                }
                                                                                if ((mark.type.name === 'insertion' ||
                                                                                    mark.type.name === 'deletion') &&
                                                                                    mark.attrs.revisionId != null) {
                                                                                    const revId = String(mark.attrs.revisionId);
                                                                                    const prefix = `tc-${revId}-`;
                                                                                    let match = commentSidebarItems.find((i) => i.id.startsWith(prefix));
                                                                                    if (!match && revisionIdAliases) {
                                                                                        const aliasedId = revisionIdAliases.get(revId);
                                                                                        if (aliasedId) {
                                                                                            match = commentSidebarItems.find((i) => i.id === aliasedId);
                                                                                        }
                                                                                    }
                                                                                    if (match) {
                                                                                        cursorSidebarItem = match.id;
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }
                                                                            if (cursorSidebarItem)
                                                                                setShowCommentsSidebar(true);
                                                                            setExpandedSidebarItem(cursorSidebarItem);
                                                                        }
                                                                        else {
                                                                            handleSelectionChange(null);
                                                                        }
                                                                    }) && null, _jsx(PagedEditor, { ref: pagedEditorRef, document: history.state, styles: (_o = history.state) === null || _o === void 0 ? void 0 : _o.package.styles, theme: ((_p = history.state) === null || _p === void 0 ? void 0 : _p.package.theme) || theme, sectionProperties: initialSectionProperties, finalSectionProperties: finalSectionProperties, headerContent: headerContent, footerContent: footerContent, firstPageHeaderContent: firstPageHeaderContent, firstPageFooterContent: firstPageFooterContent, onHeaderFooterDoubleClick: handleHeaderFooterDoubleClick, hfEditMode: hfEditPosition, onBodyClick: handleBodyClick, zoom: state.zoom, marginDraggingRef: marginDraggingRef, wordCompat: wordCompat, showFormattingMarks: showFormattingMarks, readOnly: readOnly, extensionManager: extensionManager, contentLabel: t('editor.contentLabel'), selectionFormatting: state.selectionFormatting, onFormat: handleFormat, onZoomChange: handleZoomChange, onDocumentChange: handleDocumentChange, onSelectionChange: _pagedOnSelectionChangeStable, externalPlugins: allExternalPlugins, onReady: handlePagedEditorReady, onRenderedDomContextReady: onRenderedDomContextReady, pluginOverlays: pluginOverlays, onHyperlinkClick: handleHyperlinkClick, onContextMenu: handleContextMenu, onOpenProperties: handleOpenProperties, onResizeTextBox: handleTextBoxSetSize, onEditFootnote: handleEditFootnote, onEditEquation: handleEditEquation, onEditEndnote: handleEditEndnote, commentsSidebarOpen: sidebarOpen, onAnchorPositionsChange: setAnchorPositions, onTotalPagesChange: handleTotalPagesChange, resolvedCommentIds: resolvedIdsForRender, scrollContainerRef: scrollContainerRef, sidebarOverlay: _jsxs(_Fragment, { children: [trackedChanges.length > 0 && (_jsxs("div", { style: {
                                                                                        position: 'absolute',
                                                                                        top: 6,
                                                                                        right: 12,
                                                                                        display: 'flex',
                                                                                        gap: 4,
                                                                                        padding: '4px 6px',
                                                                                        background: 'var(--doc-surface, white)',
                                                                                        border: '1px solid var(--doc-border)',
                                                                                        borderRadius: 6,
                                                                                        boxShadow: 'var(--doc-shadow, 0 2px 6px rgba(0,0,0,0.1))',
                                                                                        zIndex: 50,
                                                                                        fontSize: 12,
                                                                                    }, "data-testid": "tracked-changes-action-bar", children: [_jsx(Tooltip, { content: t('trackedChanges.previous'), children: _jsx("button", { type: "button", onClick: handlePreviousChange, style: trackedChangesActionBtnStyle, "aria-label": t('trackedChanges.previous'), children: _jsx(MaterialSymbol, { name: "navigate_before", size: 16 }) }) }), _jsx(Tooltip, { content: t('trackedChanges.next'), children: _jsx("button", { type: "button", onClick: handleNextChange, style: trackedChangesActionBtnStyle, "aria-label": t('trackedChanges.next'), children: _jsx(MaterialSymbol, { name: "navigate_next", size: 16 }) }) }), _jsx("span", { style: {
                                                                                                width: 1,
                                                                                                background: 'var(--doc-border)',
                                                                                                margin: '0 2px',
                                                                                            } }), _jsx(Tooltip, { content: t('trackedChanges.acceptAll'), children: _jsx("button", { type: "button", onClick: handleAcceptAllChanges, style: trackedChangesActionBtnStyle, "aria-label": t('trackedChanges.acceptAll'), "data-testid": "tracked-changes-accept-all", children: _jsx(MaterialSymbol, { name: "done_all", size: 16 }) }) }), _jsx(Tooltip, { content: t('trackedChanges.rejectAll'), children: _jsx("button", { type: "button", onClick: handleRejectAllChanges, style: trackedChangesActionBtnStyle, "aria-label": t('trackedChanges.rejectAll'), "data-testid": "tracked-changes-reject-all", children: _jsx(MaterialSymbol, { name: "block", size: 16 }) }) })] })), allSidebarItems.length > 0 && (_jsx(UnifiedSidebar, { items: allSidebarItems, anchorPositions: anchorPositions, renderedDomContext: pluginRenderedDomContext !== null && pluginRenderedDomContext !== void 0 ? pluginRenderedDomContext : null, pageWidth: pageWidthPx, zoom: state.zoom, editorContainerRef: scrollContainerRef, onExpandedItemChange: setExpandedSidebarItem, activeItemId: expandedSidebarItem })), _jsx(CommentMarginMarkers, { comments: comments, anchorPositions: anchorPositions, zoom: state.zoom, pageWidth: pageWidthPx, sidebarOpen: sidebarOpen, resolvedCommentIds: resolvedCommentIds, onMarkerClick: () => {
                                                                                        setShowCommentsSidebar(true);
                                                                                    } })] }) }), versionPreview && (_jsxs("div", { "data-testid": "version-preview-overlay", style: {
                                                                            position: 'absolute',
                                                                            inset: 0,
                                                                            zIndex: Z_INDEX.versionPreview,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            background: 'var(--doc-canvas-bg, #f1f3f4)',
                                                                        }, children: [_jsxs("div", { style: {
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 12,
                                                                                    padding: '8px 16px',
                                                                                    background: 'var(--doc-surface, #fff)',
                                                                                    borderBottom: '1px solid var(--doc-border, #e0e0e0)',
                                                                                    boxShadow: 'var(--doc-shadow, 0 1px 3px rgba(0,0,0,0.08))',
                                                                                }, children: [_jsx(Tooltip, { content: "Back to editing", children: _jsxs("button", { type: "button", onClick: handleClosePreview, "data-testid": "version-preview-back", "aria-label": "Back to editing", style: {
                                                                                                display: 'inline-flex',
                                                                                                alignItems: 'center',
                                                                                                gap: 4,
                                                                                                padding: '4px 10px',
                                                                                                border: '1px solid var(--doc-border)',
                                                                                                borderRadius: 4,
                                                                                                background: 'transparent',
                                                                                                color: 'var(--doc-text)',
                                                                                                fontSize: 13,
                                                                                                cursor: 'pointer',
                                                                                            }, children: [_jsx(MaterialSymbol, { name: "arrow_back", size: 16 }), "Back"] }) }), _jsxs("span", { style: { fontSize: 13, color: 'var(--doc-text-muted)' }, children: ["Viewing", ' ', _jsx("strong", { style: { color: 'var(--doc-text)' }, children: versionPreview.name }), ' · ', new Date(versionPreview.savedAt).toLocaleString()] }), _jsxs("label", { style: {
                                                                                            marginLeft: 'auto',
                                                                                            display: 'inline-flex',
                                                                                            alignItems: 'center',
                                                                                            gap: 6,
                                                                                            fontSize: 13,
                                                                                            color: 'var(--doc-text)',
                                                                                            cursor: versionPreview.previousData ? 'pointer' : 'not-allowed',
                                                                                            opacity: versionPreview.previousData ? 1 : 0.5,
                                                                                        }, children: [_jsx("input", { type: "checkbox", checked: previewShowChanges, disabled: !versionPreview.previousData, onChange: (e) => setPreviewShowChanges(e.target.checked), "data-testid": "version-preview-show-changes" }), "Show changes"] }), _jsx("button", { type: "button", onClick: handleRestoreFromPreview, "data-testid": "version-preview-restore", style: {
                                                                                            padding: '6px 14px',
                                                                                            border: 'none',
                                                                                            borderRadius: 4,
                                                                                            background: 'var(--doc-primary, #1a73e8)',
                                                                                            color: '#fff',
                                                                                            fontSize: 13,
                                                                                            fontWeight: 600,
                                                                                            cursor: 'pointer',
                                                                                        }, children: "Restore this version" })] }), _jsx("div", { ref: previewScrollRef, style: { flex: 1, minHeight: 0, overflow: 'auto' }, children: previewDocument ? (_jsx(PagedEditor
                                                                                // Remount on version / show-changes change:
                                                                                // the preview doc keeps the live doc's
                                                                                // metadata identity, so PagedEditor's
                                                                                // same-identity guard would otherwise skip
                                                                                // the swap and keep painting the old marks.
                                                                                , { ref: previewEditorRef, document: previewDocument, styles: previewDocument.package.styles, theme: previewDocument.package.theme || theme, sectionProperties: initialSectionProperties, finalSectionProperties: finalSectionProperties, headerContent: headerContent, footerContent: footerContent, firstPageHeaderContent: firstPageHeaderContent, firstPageFooterContent: firstPageFooterContent, zoom: state.zoom, wordCompat: wordCompat, readOnly: true, extensionManager: extensionManager, contentLabel: "Version preview", scrollContainerRef: previewScrollRef }, `${versionPreview.savedAt}-${previewShowChanges}`)) : (_jsx("div", { style: {
                                                                                        padding: 40,
                                                                                        textAlign: 'center',
                                                                                        color: 'var(--doc-text-muted)',
                                                                                        fontSize: 13,
                                                                                    }, children: "Preview unavailable for this version." })) })] })), floatingCommentBtn != null && !isAddingComment && !readOnly && (_jsx(Tooltip, { content: "Add comment", side: "bottom", delayMs: 300, children: _jsx("button", { type: "button", "data-testid": "floating-add-comment-button", "aria-label": "Add comment", onMouseDown: (e) => {
                                                                                var _a;
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                                                                                if (view) {
                                                                                    const { from, to } = view.state.selection;
                                                                                    if (from !== to) {
                                                                                        setCommentSelectionRange({ from, to });
                                                                                        const pendingMark = view.state.schema.marks.comment.create({
                                                                                            commentId: PENDING_COMMENT_ID,
                                                                                        });
                                                                                        const tr = view.state.tr.addMark(from, to, pendingMark);
                                                                                        tr.setSelection(TextSelection.create(tr.doc, to));
                                                                                        view.dispatch(tr);
                                                                                    }
                                                                                }
                                                                                setAddCommentYPosition(floatingCommentBtn.top);
                                                                                setShowCommentsSidebar(true);
                                                                                setIsAddingComment(true);
                                                                                setFloatingCommentBtn(null);
                                                                            }, style: {
                                                                                position: 'absolute',
                                                                                top: floatingCommentBtn.top,
                                                                                left: floatingCommentBtn.left,
                                                                                transform: 'translate(-50%, -50%)',
                                                                                zIndex: 50,
                                                                                width: 28,
                                                                                height: 28,
                                                                                borderRadius: 6,
                                                                                border: '1px solid rgba(26, 115, 232, 0.3)',
                                                                                backgroundColor: 'var(--doc-surface, #fff)',
                                                                                color: 'var(--doc-primary)',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                boxShadow: '0 1px 3px rgba(60,64,67,0.2)',
                                                                                transition: 'background-color var(--doc-anim-base), box-shadow var(--doc-anim-base)',
                                                                            }, onMouseOver: (e) => {
                                                                                e.currentTarget.style.backgroundColor =
                                                                                    'rgba(26, 115, 232, 0.08)';
                                                                                e.currentTarget.style.boxShadow =
                                                                                    '0 1px 4px rgba(26, 115, 232, 0.3)';
                                                                            }, onMouseOut: (e) => {
                                                                                e.currentTarget.style.backgroundColor =
                                                                                    'var(--doc-surface, #fff)';
                                                                                e.currentTarget.style.boxShadow =
                                                                                    '0 1px 3px rgba(60,64,67,0.2)';
                                                                            }, children: _jsx(MaterialSymbol, { name: "add_comment", size: 16 }) }) })), hfEditPosition &&
                                                                        (() => {
                                                                            var _a, _b, _c, _d, _e, _f, _g;
                                                                            const activeHf = hfEditIsFirstPage
                                                                                ? hfEditPosition === 'header'
                                                                                    ? firstPageHeaderContent
                                                                                    : firstPageFooterContent
                                                                                : hfEditPosition === 'header'
                                                                                    ? headerContent
                                                                                    : footerContent;
                                                                            if (!activeHf)
                                                                                return null;
                                                                            const targetEl = getHfTargetElement(hfEditPosition);
                                                                            const parentEl = editorContentRef.current;
                                                                            if (!targetEl || !parentEl)
                                                                                return null;
                                                                            return (_jsx(InlineHeaderFooterEditor, { ref: hfEditorRef, headerFooter: activeHf, position: hfEditPosition, styles: (_a = history.state) === null || _a === void 0 ? void 0 : _a.package.styles, targetElement: targetEl, parentElement: parentEl, onSave: handleHeaderFooterSave, onClose: () => setHfEditPosition(null), onSelectionChange: handleSelectionChange, onRemove: handleRemoveHeaderFooter, titlePg: (_d = (_c = (_b = history.state) === null || _b === void 0 ? void 0 : _b.package.document) === null || _c === void 0 ? void 0 : _c.finalSectionProperties) === null || _d === void 0 ? void 0 : _d.titlePg, evenAndOddHeaders: (_g = (_f = (_e = history.state) === null || _e === void 0 ? void 0 : _e.package.document) === null || _f === void 0 ? void 0 : _f.finalSectionProperties) === null || _g === void 0 ? void 0 : _g.evenAndOddHeaders, onToggleTitlePg: handleToggleTitlePg, onToggleEvenAndOdd: handleToggleEvenAndOddHeaders }));
                                                                        })()] }) })] }), showVersionHistory && (_jsx(VersionHistoryPanel, { history: editHistory, docId: (documentName === null || documentName === void 0 ? void 0 : documentName.trim()) || 'Untitled', saveNamedVersion: versionCapture.saveNamedVersion, onRestoreSnapshot: handleRestoreSnapshot, onPreviewVersion: handlePreviewVersion, onShowCurrent: handleClosePreview, isPreviewing: versionPreview != null, serverBackend: versionBackend, onRestoreServerVersion: handleRestoreServerVersion, onClose: () => setShowVersionHistory(false) })), showProperties &&
                                                    (() => {
                                                        var _a;
                                                        // Flex sibling — IDENTICAL to VersionHistoryPanel above:
                                                        // the page area auto-shrinks (flex:1 scroll container +
                                                        // this fixed-width column), so it sits BESIDE the doc and
                                                        // never overlaps it. Kind derived from the live selection.
                                                        const propsKind = state.pmImageContext
                                                            ? 'image'
                                                            : state.pmTextBoxContext
                                                                ? 'textbox'
                                                                : ((_a = state.pmTableContext) === null || _a === void 0 ? void 0 : _a.isInTable)
                                                                    ? 'table'
                                                                    : null;
                                                        return (_jsxs(PropertiesPanel, { kind: propsKind, onClose: () => openRightPanel('none'), children: [propsKind === 'image' && state.pmImageContext && (_jsx(ImagePropertiesSection, { wrapType: state.pmImageContext.wrapType, width: state.pmImageContext.width, height: state.pmImageContext.height, borderWidth: state.pmImageContext.borderWidth, borderColor: state.pmImageContext.borderColor, alt: state.pmImageContext.alt, distTop: state.pmImageContext.distTop, distBottom: state.pmImageContext.distBottom, distLeft: state.pmImageContext.distLeft, distRight: state.pmImageContext.distRight, onSetWrap: handleImageWrapType, onSetSize: handleImageSetSize, onTransform: handleImageTransform, onSetBorder: handleImageSetBorder, onSetAlt: handleImageSetAlt, onSetDist: handleImageSetDist })), propsKind === 'table' && (_jsx(TablePropertiesSection, { onAction: handleTableAction })), propsKind === 'textbox' && state.pmTextBoxContext && (_jsx(TextBoxPropertiesSection, { width: state.pmTextBoxContext.width, height: state.pmTextBoxContext.height, fillColor: state.pmTextBoxContext.fillColor, outlineWidth: state.pmTextBoxContext.outlineWidth, outlineColor: state.pmTextBoxContext.outlineColor, posOffsetH: state.pmTextBoxContext.posOffsetH, posOffsetV: state.pmTextBoxContext.posOffsetV, onSetSize: handleTextBoxSetSize, onSetFill: handleTextBoxSetFill, onSetOutline: handleTextBoxSetOutline, onSetPosition: handleTextBoxSetPosition }))] }));
                                                    })(), showPanelRail && !focusMode && (_jsx(PanelRail, { outlineVisible: showOutline, commentsVisible: showCommentsSidebar, historyVisible: showVersionHistory, onToggleOutline: handleToggleOutline, onToggleComments: handleToggleComments, propertiesVisible: showProperties, onToggleProperties: () => openRightPanel(showProperties ? 'none' : 'properties'), onToggleHistory: () => openRightPanel(showVersionHistory ? 'none' : 'history') }))] }), showStatusBar && !readOnlyProp && !focusMode && (_jsx(StatusBar, { currentPage: scrollPageInfo.currentPage, totalPages: scrollPageInfo.totalPages, wordCount: wordCount, charCount: charCount, docText: docPlainText, zoom: state.zoom, onZoomChange: handleZoomChange })), _jsx(FocusModeBar, { wordCount: wordCount !== null && wordCount !== void 0 ? wordCount : 0, isActive: focusMode }), scrollPageInfo.totalPages > 1 && (_jsx(PageIndicator, { currentPage: scrollPageInfo.currentPage, totalPages: scrollPageInfo.totalPages, visible: scrollPageInfo.visible })), showOutline && (_jsx(DocumentOutline, { headings: outlineHeadings, activeIndex: activeOutlineIndex, onHeadingClick: handleHeadingInfoClick, onClose: () => setShowOutline(false), topOffset: toolbarHeight, scrollLeft: editorScrollLeft }))] }), agentPanel && (_jsx(AgentPanel, { title: agentPanel.title, icon: agentPanel.icon, defaultWidth: agentPanel.defaultWidth, minWidth: agentPanel.minWidth, maxWidth: agentPanel.maxWidth, onClose: () => setAgentPanelOpen(false), closed: !agentPanelOpen, children: agentPanel.render({ close: () => setAgentPanelOpen(false) }) }))] }), _jsx(HyperlinkPopup, { data: hyperlinkPopupData, onNavigate: handleHyperlinkPopupNavigate, onCopy: handleHyperlinkPopupCopy, onEdit: handleHyperlinkPopupEdit, onRemove: handleHyperlinkPopupRemove, onClose: handleHyperlinkPopupClose, readOnly: readOnly }), _jsx(TextContextMenu, { isOpen: contextMenu.isOpen, position: contextMenu.position, hasSelection: contextMenu.hasSelection, isEditable: !readOnly, items: contextMenuItems, onAction: handleContextMenuAction, onClose: handleContextMenuClose }), spellMenu && (_jsx(SpellSuggestionsMenu, { isOpen: true, position: { x: spellMenu.x, y: spellMenu.y }, word: spellMenu.word, suggestions: spellMenu.suggestions, onPick: handlePickSpellSuggestion, onIgnore: handleIgnoreSpell, onClose: () => setSpellMenu(null) })), _jsx(ImageContextMenu, { isOpen: imageContextMenu.isOpen, position: imageContextMenu.position, currentWrapType: imageContextMenu.currentWrapType, currentCssFloat: imageContextMenu.currentCssFloat, onApplyLayout: handleImageWrapApply, textActions: imageContextMenuTextActions, onTextAction: handleContextMenuAction, onClose: imageContextMenu.closeMenu }), activeProposal && (_jsx(InlinePreviewPopover, { proposal: activeProposal, getView: () => { var _a; return (_a = getActiveEditorView()) !== null && _a !== void 0 ? _a : null; }, onReplace: () => {
                                const view = getActiveEditorView();
                                if (!view || !activeProposal.replaceRange) {
                                    setActiveProposal(null);
                                    return;
                                }
                                const { from, to } = activeProposal.replaceRange;
                                if (activeProposal.asTrackedChange) {
                                    // Same tracked-change path the AISuggestionPanel
                                    // uses — original range becomes a `deletion` mark
                                    // (red strikethrough) and the new fragment lands
                                    // after `to` with `insertion` marks (green
                                    // underline). User accepts/rejects via the doc-
                                    // body review bar.
                                    applyRewriteAsSuggestion({
                                        view,
                                        from,
                                        to,
                                        replacement: activeProposal.fragment,
                                    });
                                }
                                else {
                                    const tr = view.state.tr.replaceWith(from, to, activeProposal.fragment);
                                    view.dispatch(tr);
                                }
                                view.focus();
                                setActiveProposal(null);
                            }, onInsertBelow: () => {
                                const view = getActiveEditorView();
                                if (!view) {
                                    setActiveProposal(null);
                                    return;
                                }
                                // Walk up to the nearest block boundary so the
                                // fragment lands as a sibling, not inside an inline.
                                const { $from } = view.state.selection;
                                let insertPos = $from.pos;
                                for (let d = $from.depth; d > 0; d--) {
                                    const node = $from.node(d);
                                    if (node.type.name === 'paragraph' || node.type.name === 'table') {
                                        insertPos = $from.after(d);
                                        break;
                                    }
                                }
                                if (activeProposal.asTrackedChange) {
                                    applyFragmentAsSuggestion({
                                        view,
                                        at: insertPos,
                                        fragment: activeProposal.fragment,
                                    });
                                }
                                else {
                                    const tr = view.state.tr.insert(insertPos, activeProposal.fragment);
                                    view.dispatch(tr);
                                }
                                view.focus();
                                setActiveProposal(null);
                            }, busy: proposalBusy, onTryAgain: (refinePrompt) => {
                                const view = getActiveEditorView();
                                if (!view)
                                    return;
                                const schema = view.state.schema;
                                // Combine the original prompt with the refine
                                // instruction. The classifier re-routes to the same
                                // intent because the original intent verb is still
                                // first; the refine line tunes the result.
                                const combined = lastProposalPrompt
                                    ? `${lastProposalPrompt}\n\nRefine: ${refinePrompt}`
                                    : refinePrompt;
                                setProposalBusy(true);
                                void runPipeline({
                                    message: combined,
                                    includeDocContext: true,
                                    includeSelection: !!activeProposal.replaceRange,
                                }, {
                                    getDocText: () => view.state.doc.textBetween(0, view.state.doc.content.size, '\n', '\n'),
                                    getSelectionText: () => {
                                        const { from, to } = view.state.selection;
                                        if (from === to)
                                            return '';
                                        return view.state.doc.textBetween(from, to, '\n', ' ');
                                    },
                                    getView: () => view,
                                    schema,
                                })
                                    .then((result) => {
                                    if (result.kind === 'proposal') {
                                        setActiveProposal(result);
                                        setLastProposalPrompt(combined);
                                    }
                                    else if (result.kind === 'chat') {
                                        toast.message(result.text);
                                    }
                                    else {
                                        toast.error(result.message);
                                    }
                                })
                                    .catch((err) => {
                                    toast.error(`Refine failed: ${err.message}`);
                                })
                                    .finally(() => setProposalBusy(false));
                            }, onDiscard: () => setActiveProposal(null) })), _jsx(SelectionAskAi, { isOpen: false, getView: () => { var _a; return (_a = getActiveEditorView()) !== null && _a !== void 0 ? _a : null; }, busy: askAiBusy, onDismiss: () => setHasTextSelection(false), onSubmit: (promptText, capturedSelectionText) => {
                                const view = getActiveEditorView();
                                if (!view)
                                    return;
                                const schema = view.state.schema;
                                setAskAiBusy(true);
                                void runPipeline({
                                    message: promptText,
                                    includeDocContext: false,
                                    includeSelection: true,
                                }, {
                                    getDocText: () => view.state.doc.textBetween(0, view.state.doc.content.size, '\n', '\n'),
                                    // Prefer the snapshot taken when the pill opened —
                                    // by submit time the textarea has focus and the
                                    // editor's selection may be collapsed (or look
                                    // like it is). Falls back to a live read for any
                                    // code path that didn't capture.
                                    getSelectionText: () => {
                                        if (capturedSelectionText)
                                            return capturedSelectionText;
                                        const { from, to } = view.state.selection;
                                        if (from === to)
                                            return '';
                                        return view.state.doc.textBetween(from, to, '\n', ' ');
                                    },
                                    getView: () => view,
                                    schema,
                                })
                                    .then((result) => {
                                    if (result.kind === 'proposal') {
                                        setActiveProposal(result);
                                        setLastProposalPrompt(promptText);
                                    }
                                    else if (result.kind === 'chat') {
                                        // Surface short chat replies as a toast — the
                                        // user invoked from selection, not from chat, so
                                        // routing back into the chat history would be
                                        // jarring.
                                        toast.message(result.text);
                                    }
                                    else {
                                        toast.error(result.message);
                                    }
                                })
                                    .catch((err) => {
                                    toast.error(`AI request failed: ${err.message}`);
                                })
                                    .finally(() => setAskAiBusy(false));
                            } }), _jsx(Toaster, { position: "bottom-right" }), _jsxs(Suspense, { fallback: null, children: [findReplace.state.isOpen && (_jsx(FindReplaceDialog, { isOpen: findReplace.state.isOpen, onClose: findReplace.close, onFind: handleFind, onFindNext: handleFindNext, onFindPrevious: handleFindPrevious, onReplace: handleReplace, onReplaceAll: handleReplaceAll, initialSearchText: findReplace.state.searchText, replaceMode: findReplace.state.replaceMode, currentResult: findResultRef.current })), hyperlinkDialog.state.isOpen && (_jsx(HyperlinkDialog, { isOpen: hyperlinkDialog.state.isOpen, onClose: hyperlinkDialog.close, onSubmit: handleHyperlinkSubmit, onRemove: hyperlinkDialog.state.isEditing ? handleHyperlinkRemove : undefined, initialData: hyperlinkDialog.state.initialData, selectedText: hyperlinkDialog.state.selectedText, isEditing: hyperlinkDialog.state.isEditing })), tablePropsOpen && (_jsx(TablePropertiesDialog, { isOpen: tablePropsOpen, onClose: () => setTablePropsOpen(false), onApply: (props) => {
                                        const view = getActiveEditorView();
                                        if (view) {
                                            setTableProperties(props)(view.state, view.dispatch);
                                        }
                                    }, currentProps: (_r = (_q = state.pmTableContext) === null || _q === void 0 ? void 0 : _q.table) === null || _r === void 0 ? void 0 : _r.attrs })), bookmarksDialogOpen && (_jsx(BookmarksDialog, { isOpen: bookmarksDialogOpen, onClose: () => setBookmarksDialogOpen(false), bookmarks: (() => {
                                        var _a;
                                        const list = [];
                                        const view = (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.getView();
                                        const doc = view === null || view === void 0 ? void 0 : view.state.doc;
                                        if (!doc)
                                            return list;
                                        doc.descendants((node) => {
                                            if (node.type.name !== 'paragraph')
                                                return;
                                            const paraId = node.attrs.paraId;
                                            const bms = node.attrs.bookmarks;
                                            if (!bms || !paraId)
                                                return;
                                            for (const bm of bms)
                                                list.push({ paraId, name: bm.name });
                                            return false;
                                        });
                                        return list;
                                    })(), onGoTo: (paraId) => {
                                        var _a;
                                        (_a = pagedEditorRef.current) === null || _a === void 0 ? void 0 : _a.scrollToParaId(paraId);
                                    }, onAdd: (name) => {
                                        var _a;
                                        const view = getActiveEditorView();
                                        if (!view)
                                            return;
                                        const { $from } = view.state.selection;
                                        let paraNode = $from.parent;
                                        for (let d = $from.depth; d > 0 && paraNode.type.name !== 'paragraph'; d--) {
                                            paraNode = $from.node(d - 1);
                                        }
                                        if (paraNode.type.name !== 'paragraph')
                                            return;
                                        const existing = (_a = paraNode.attrs.bookmarks) !== null && _a !== void 0 ? _a : [];
                                        if (existing.some((b) => b.name === name))
                                            return;
                                        const nextId = existing.reduce((m, b) => Math.max(m, b.id), 0) +
                                            Math.floor(Math.random() * 1000) +
                                            1;
                                        setParagraphAttrs({
                                            bookmarks: [...existing, { id: nextId, name }],
                                        })(view.state, view.dispatch);
                                        focusActiveEditor();
                                    }, onDelete: (entry) => {
                                        var _a;
                                        const view = getActiveEditorView();
                                        if (!view)
                                            return;
                                        let targetPos = null;
                                        let targetNode = null;
                                        view.state.doc.descendants((node, pos) => {
                                            if (targetPos !== null)
                                                return false;
                                            if (node.type.name !== 'paragraph')
                                                return;
                                            if (node.attrs.paraId === entry.paraId) {
                                                targetPos = pos;
                                                targetNode = node;
                                            }
                                            return false;
                                        });
                                        if (targetPos === null || !targetNode)
                                            return;
                                        const existing = (_a = targetNode.attrs.bookmarks) !== null && _a !== void 0 ? _a : [];
                                        const next = existing.filter((b) => b.name !== entry.name);
                                        const tr = view.state.tr.setNodeMarkup(targetPos, undefined, Object.assign(Object.assign({}, targetNode.attrs), { bookmarks: next.length > 0 ? next : null }));
                                        view.dispatch(tr);
                                        focusActiveEditor();
                                    } })), characterSpacingDialogOpen && (_jsx(CharacterSpacingDialog, { isOpen: characterSpacingDialogOpen, onClose: () => setCharacterSpacingDialogOpen(false), initialValue: characterSpacingInitial, onSubmit: handleSubmitCharacterSpacing })), insertSymbolOpen && (_jsx(InsertSymbolDialog, { isOpen: insertSymbolOpen, onClose: () => setInsertSymbolOpen(false), onInsert: handleInsertSymbol })), bordersShadingOpen && (_jsx(BordersAndShadingDialog, { isOpen: bordersShadingOpen, onClose: () => setBordersShadingOpen(false), initialValue: bordersShadingInitial, onSubmit: handleSubmitBordersShading })), paragraphDialogOpen && (_jsx(CustomSpacingDialog, { isOpen: paragraphDialogOpen, onClose: () => setParagraphDialogOpen(false), initialValue: {
                                        lineSpacingRule: 'auto',
                                        lineSpacing: (_s = state.selectionFormatting.lineSpacing) !== null && _s !== void 0 ? _s : 240,
                                        spaceBefore: (_t = state.selectionFormatting.spaceBefore) !== null && _t !== void 0 ? _t : 0,
                                        spaceAfter: (_u = state.selectionFormatting.spaceAfter) !== null && _u !== void 0 ? _u : 0,
                                        contextualSpacing: false,
                                        keepNext: false,
                                        keepLines: false,
                                        widowControl: true,
                                        pageBreakBefore: false,
                                    }, onChange: (v) => {
                                        const view = getActiveEditorView();
                                        if (!view)
                                            return;
                                        setParagraphAttrs({
                                            lineSpacing: v.lineSpacing || null,
                                            lineSpacingRule: v.lineSpacingRule,
                                            spaceBefore: v.spaceBefore || null,
                                            spaceAfter: v.spaceAfter || null,
                                            contextualSpacing: v.contextualSpacing,
                                            keepNext: v.keepNext,
                                            keepLines: v.keepLines,
                                            widowControl: v.widowControl,
                                            pageBreakBefore: v.pageBreakBefore,
                                        })(view.state, view.dispatch);
                                    } })), splitCellDialogState.isOpen && (_jsx(SplitCellDialog, { isOpen: splitCellDialogState.isOpen, onClose: handleSplitCellDialogClose, onApply: handleSplitCellDialogApply, initialRows: splitCellDialogState.initialRows, initialCols: splitCellDialogState.initialCols, minRows: splitCellDialogState.minRows, minCols: splitCellDialogState.minCols })), imagePositionOpen && (_jsx(ImagePositionDialog, { isOpen: imagePositionOpen, onClose: () => setImagePositionOpen(false), onApply: handleApplyImagePosition })), noteEdit && (_jsx(FootnoteEditDialog, { initialText: noteEdit.text, title: noteEdit.kind === 'endnote' ? 'Edit endnote' : 'Edit footnote', onCancel: () => setNoteEdit(null), onApply: (t) => handleApplyNoteEdit(noteEdit.kind, noteEdit.id, t) })), imagePropsOpen && (_jsx(ImagePropertiesDialog, { isOpen: imagePropsOpen, onClose: () => setImagePropsOpen(false), onApply: handleApplyImageProperties, currentData: state.pmImageContext
                                        ? {
                                            alt: (_v = state.pmImageContext.alt) !== null && _v !== void 0 ? _v : undefined,
                                            borderWidth: (_w = state.pmImageContext.borderWidth) !== null && _w !== void 0 ? _w : undefined,
                                            borderColor: (_x = state.pmImageContext.borderColor) !== null && _x !== void 0 ? _x : undefined,
                                            borderStyle: (_y = state.pmImageContext.borderStyle) !== null && _y !== void 0 ? _y : undefined,
                                        }
                                        : undefined })), showPageSetup && (_jsx(PageSetupDialog, { isOpen: showPageSetup, onClose: () => setShowPageSetup(false), onApply: handlePageSetupApply, currentProps: (_0 = (_z = history.state) === null || _z === void 0 ? void 0 : _z.package.document) === null || _0 === void 0 ? void 0 : _0.finalSectionProperties, currentPageColor: ((_4 = (_3 = (_2 = (_1 = history.state) === null || _1 === void 0 ? void 0 : _1.package.document) === null || _2 === void 0 ? void 0 : _2.background) === null || _3 === void 0 ? void 0 : _3.color) === null || _4 === void 0 ? void 0 : _4.rgb)
                                        ? `#${history.state.package.document.background.color.rgb}`
                                        : undefined, onPageColorChange: handlePageColorChange })), footnotePropsOpen && (_jsx(FootnotePropertiesDialog, { isOpen: footnotePropsOpen, onClose: () => setFootnotePropsOpen(false), onApply: handleApplyFootnoteProperties, footnotePr: (_7 = (_6 = (_5 = history.state) === null || _5 === void 0 ? void 0 : _5.package.document) === null || _6 === void 0 ? void 0 : _6.finalSectionProperties) === null || _7 === void 0 ? void 0 : _7.footnotePr, endnotePr: (_10 = (_9 = (_8 = history.state) === null || _8 === void 0 ? void 0 : _8.package.document) === null || _9 === void 0 ? void 0 : _9.finalSectionProperties) === null || _10 === void 0 ? void 0 : _10.endnotePr })), showFileProperties && (_jsx(FilePropertiesDialog, { isOpen: showFileProperties, onClose: () => setShowFileProperties(false), fileName: documentName, sizeBytes: (_11 = loadedSizeRef.current) !== null && _11 !== void 0 ? _11 : undefined, current: (_13 = (_12 = history.state) === null || _12 === void 0 ? void 0 : _12.package) === null || _13 === void 0 ? void 0 : _13.properties, onApply: (edits) => handleApplyFileProperties(edits) })), showWordCount && (_jsx(WordCountDialog, { isOpen: showWordCount, onClose: () => setShowWordCount(false), stats: {
                                        words: wordCount !== null && wordCount !== void 0 ? wordCount : 0,
                                        characters: charCountWithSpaces !== null && charCountWithSpaces !== void 0 ? charCountWithSpaces : 0,
                                        charactersNoSpaces: charCount !== null && charCount !== void 0 ? charCount : 0,
                                        paragraphs: paragraphCount !== null && paragraphCount !== void 0 ? paragraphCount : 0,
                                        pages: scrollPageInfo.totalPages,
                                    } })), _jsx(VoiceTypingIndicator, { isListening: voiceTyping.isListening, interimText: voiceTyping.interimText, error: voiceTyping.error, onStop: voiceTyping.stop }), showAbout && _jsx(AboutDialog, { isOpen: showAbout, onClose: () => setShowAbout(false) }), showKeyboardShortcuts && (_jsx(KeyboardShortcutsDialog, { isOpen: showKeyboardShortcuts, onClose: () => setShowKeyboardShortcuts(false) })), showPreferences && (_jsx(PreferencesDialog, { isOpen: showPreferences, onClose: () => setShowPreferences(false), preferences: preferences, onChange: handlePreferenceChange })), showWatermarkDialog && (_jsx(WatermarkDialog, { isOpen: showWatermarkDialog, onClose: () => setShowWatermarkDialog(false), current: (_14 = history.state) === null || _14 === void 0 ? void 0 : _14.package.document.watermark, onApply: handleWatermarkChange })), showEquationDialog && (_jsx(EquationDialog, { isOpen: showEquationDialog, onClose: () => setShowEquationDialog(false), onInsert: handleInsertEquation, initialLatex: equationInitial.latex, initialDisplay: equationInitial.display })), showAccessibility && (_jsx(AccessibilityDialog, { isOpen: showAccessibility, onClose: () => setShowAccessibility(false), issues: accessibilityIssues, onGoto: handleAccessibilityGoto })), showBuildingBlocks && (_jsx(BuildingBlocksDialog, { isOpen: showBuildingBlocks, onClose: () => setShowBuildingBlocks(false), blocks: buildingBlocks, pendingPreview: (_15 = pendingBuildingBlock === null || pendingBuildingBlock === void 0 ? void 0 : pendingBuildingBlock.preview) !== null && _15 !== void 0 ? _15 : null, onSaveSelection: handleSaveBuildingBlock, onInsert: handleInsertBuildingBlock, onDelete: handleDeleteBuildingBlock })), showDictionary && (_jsx(DictionaryDialog, { isOpen: showDictionary, onClose: () => setShowDictionary(false), initialWord: dictionaryWord })), showTranslate && (_jsx(TranslateDialog, { isOpen: showTranslate, onClose: () => setShowTranslate(false), initialText: translateText, onReplace: translateRange ? handleTranslateReplace : undefined })), showTranslateDocument && (_jsx(TranslateDocumentDialog, { isOpen: showTranslateDocument, onClose: () => setShowTranslateDocument(false), documentName: documentName !== null && documentName !== void 0 ? documentName : 'Untitled', getView: () => { var _a; return (_a = getActiveEditorView()) !== null && _a !== void 0 ? _a : null; }, onSave: () => handleSave({ selective: false }), onExport: onExport, renderPreview: (buffer) => (_jsx(DocxEditorAsPreview, { documentBuffer: buffer, readOnly: true, showToolbar: false, showStatusBar: false, showZoomControl: false, showRuler: false, showOutlineButton: false, showPanelRail: false })) })), showExplore && (_jsx(ExploreDialog, { isOpen: showExplore, onClose: () => setShowExplore(false), initialQuery: exploreQuery, onCite: handleExploreCite })), showCitations && (_jsx(CitationsDialog, { isOpen: showCitations, onClose: () => setShowCitations(false), citations: citations, onAdd: handleAddCitation, onDelete: handleDeleteCitation, onInsert: handleInsertCitation })), showCommandPalette && (_jsx(CommandPaletteDialog, { isOpen: showCommandPalette, onClose: () => setShowCommandPalette(false), items: [
                                        ...(onNew
                                            ? [
                                                {
                                                    id: 'file.new',
                                                    label: 'New document',
                                                    path: 'File',
                                                    shortcut: '⌘N',
                                                    run: onNew,
                                                },
                                            ]
                                            : []),
                                        {
                                            id: 'file.open',
                                            label: 'Open…',
                                            path: 'File',
                                            shortcut: '⌘O',
                                            run: handleOpenDocument,
                                        },
                                        {
                                            id: 'file.save',
                                            label: 'Save (download .docx)',
                                            path: 'File',
                                            shortcut: '⌘S',
                                            run: handleDownloadDocument,
                                        },
                                        {
                                            id: 'file.print',
                                            label: 'Print',
                                            path: 'File',
                                            shortcut: '⌘P',
                                            run: handleDirectPrint,
                                        },
                                        {
                                            id: 'file.export.pdf',
                                            label: 'Export as PDF',
                                            path: 'File · Export',
                                            run: handleExportPdf,
                                        },
                                        {
                                            id: 'file.export.odt',
                                            label: 'Export as ODT',
                                            path: 'File · Export',
                                            run: handleExportOdt,
                                        },
                                        {
                                            id: 'file.export.md',
                                            label: 'Export as Markdown',
                                            path: 'File · Export',
                                            run: handleExportMd,
                                        },
                                        {
                                            id: 'file.export.txt',
                                            label: 'Export as Plain Text',
                                            path: 'File · Export',
                                            run: handleExportTxt,
                                        },
                                        {
                                            id: 'file.pageSetup',
                                            label: 'Page Setup…',
                                            path: 'File',
                                            run: handleOpenPageSetup,
                                        },
                                        {
                                            id: 'file.properties',
                                            label: 'Properties…',
                                            path: 'File',
                                            run: handleOpenFileProperties,
                                        },
                                        {
                                            id: 'file.makeCopy',
                                            label: 'Make a copy',
                                            path: 'File',
                                            run: handleMakeCopy,
                                        },
                                        {
                                            id: 'file.email',
                                            label: 'Email as attachment…',
                                            path: 'File',
                                            run: handleEmailAsAttachment,
                                        },
                                        {
                                            id: 'edit.find',
                                            label: 'Find',
                                            path: 'Edit',
                                            shortcut: '⌘F',
                                            run: () => findReplace.openFind(''),
                                        },
                                        {
                                            id: 'edit.findReplace',
                                            label: 'Find and Replace',
                                            path: 'Edit',
                                            shortcut: '⌘H',
                                            run: () => findReplace.openReplace(''),
                                        },
                                        {
                                            id: 'edit.hyperlink',
                                            label: 'Insert link',
                                            path: 'Edit',
                                            shortcut: '⌘K',
                                            run: () => handleFormat('insertLink'),
                                        },
                                        {
                                            id: 'edit.selectAll',
                                            label: 'Select All',
                                            path: 'Edit',
                                            shortcut: '⌘A',
                                            run: () => handleFormat('selectAll'),
                                        },
                                        {
                                            id: 'format.bold',
                                            label: 'Bold',
                                            path: 'Format',
                                            shortcut: '⌘B',
                                            run: () => handleFormat('bold'),
                                        },
                                        {
                                            id: 'format.italic',
                                            label: 'Italic',
                                            path: 'Format',
                                            shortcut: '⌘I',
                                            run: () => handleFormat('italic'),
                                        },
                                        {
                                            id: 'format.underline',
                                            label: 'Underline',
                                            path: 'Format',
                                            shortcut: '⌘U',
                                            run: () => handleFormat('underline'),
                                        },
                                        {
                                            id: 'format.strike',
                                            label: 'Strikethrough',
                                            path: 'Format',
                                            shortcut: '⌘⇧X',
                                            run: () => handleFormat('strikethrough'),
                                        },
                                        {
                                            id: 'format.super',
                                            label: 'Superscript',
                                            path: 'Format',
                                            shortcut: '⌘.',
                                            run: () => handleFormat('superscript'),
                                        },
                                        {
                                            id: 'format.sub',
                                            label: 'Subscript',
                                            path: 'Format',
                                            shortcut: '⌘,',
                                            run: () => handleFormat('subscript'),
                                        },
                                        {
                                            id: 'format.smallCaps',
                                            label: 'Small Caps',
                                            path: 'Format',
                                            run: () => handleFormat('toggleSmallCaps'),
                                        },
                                        {
                                            id: 'format.allCaps',
                                            label: 'All Caps',
                                            path: 'Format',
                                            run: () => handleFormat('toggleAllCaps'),
                                        },
                                        {
                                            id: 'format.clear',
                                            label: 'Clear formatting',
                                            path: 'Format',
                                            shortcut: '⌘\\',
                                            run: () => handleFormat('clearFormatting'),
                                        },
                                        {
                                            id: 'format.ltr',
                                            label: 'Left-to-right text',
                                            path: 'Format',
                                            run: () => handleFormat('setLtr'),
                                        },
                                        {
                                            id: 'format.rtl',
                                            label: 'Right-to-left text',
                                            path: 'Format',
                                            run: () => handleFormat('setRtl'),
                                        },
                                        {
                                            id: 'view.focusMode',
                                            label: focusMode ? 'Exit focus mode' : 'Enter focus mode',
                                            path: 'View',
                                            shortcut: 'Ctrl+Shift+\\',
                                            run: () => setFocusMode((v) => !v),
                                        },
                                        {
                                            id: 'view.zoomIn',
                                            label: 'Zoom in',
                                            path: 'View',
                                            shortcut: '⌘=',
                                            run: () => handleZoomChange(Math.min(state.zoom * 1.1, 4)),
                                        },
                                        {
                                            id: 'view.zoomOut',
                                            label: 'Zoom out',
                                            path: 'View',
                                            shortcut: '⌘−',
                                            run: () => handleZoomChange(Math.max(state.zoom / 1.1, 0.25)),
                                        },
                                        {
                                            id: 'view.zoomReset',
                                            label: 'Reset zoom to 100%',
                                            path: 'View',
                                            shortcut: '⌘0',
                                            run: () => handleZoomChange(1),
                                        },
                                        {
                                            id: 'view.themeAuto',
                                            label: 'Theme: match system',
                                            path: 'View',
                                            run: () => handleSetColorTheme('auto'),
                                        },
                                        {
                                            id: 'view.themeLight',
                                            label: 'Theme: light',
                                            path: 'View',
                                            run: () => handleSetColorTheme('light'),
                                        },
                                        {
                                            id: 'view.themeDark',
                                            label: 'Theme: dark',
                                            path: 'View',
                                            run: () => handleSetColorTheme('dark'),
                                        },
                                        // Strict co-editing — only when a collab session wired the
                                        // plugin. Mirrors OnlyOffice's Fast/Strict co-editing mode.
                                        ...(strictCoEditAvailable
                                            ? [
                                                {
                                                    id: 'view.strictCoEditing',
                                                    label: strictCoEditEnabled
                                                        ? 'Strict co-editing: on'
                                                        : 'Strict co-editing: off',
                                                    path: 'View',
                                                    run: handleToggleStrictCoEditing,
                                                },
                                            ]
                                            : []),
                                        {
                                            id: 'insert.pageBreak',
                                            label: 'Insert page break',
                                            path: 'Insert',
                                            shortcut: '⌘↵',
                                            run: () => handleInsertPageBreak(),
                                        },
                                        {
                                            id: 'insert.toc',
                                            label: 'Insert table of contents',
                                            path: 'Insert',
                                            run: () => handleInsertTOC(),
                                        },
                                        {
                                            id: 'insert.image',
                                            label: 'Insert image',
                                            path: 'Insert',
                                            run: handleInsertImageClick,
                                        },
                                        {
                                            id: 'insert.watermark',
                                            label: 'Watermark…',
                                            path: 'Insert',
                                            run: () => setShowWatermarkDialog(true),
                                        },
                                        {
                                            id: 'insert.buildingBlocks',
                                            label: 'Building blocks…',
                                            path: 'Insert',
                                            run: handleOpenBuildingBlocks,
                                        },
                                        {
                                            id: 'insert.convertToTable',
                                            label: 'Convert selection to table',
                                            path: 'Insert',
                                            run: handleConvertSelectionToTable,
                                        },
                                        {
                                            id: 'insert.shape.rectangle',
                                            label: 'Shape · Rectangle',
                                            path: 'Insert',
                                            run: () => handleInsertShape('rectangle'),
                                        },
                                        {
                                            id: 'insert.shape.ellipse',
                                            label: 'Shape · Ellipse',
                                            path: 'Insert',
                                            run: () => handleInsertShape('ellipse'),
                                        },
                                        {
                                            id: 'insert.shape.line',
                                            label: 'Shape · Line',
                                            path: 'Insert',
                                            run: () => handleInsertShape('line'),
                                        },
                                        {
                                            id: 'insert.shape.arrow',
                                            label: 'Shape · Arrow',
                                            path: 'Insert',
                                            run: () => handleInsertShape('arrow'),
                                        },
                                        {
                                            id: 'insert.textbox',
                                            label: 'Text box',
                                            path: 'Insert',
                                            run: () => handleInsertTextBox('plain'),
                                        },
                                        {
                                            id: 'insert.callout',
                                            label: 'Callout',
                                            path: 'Insert',
                                            run: () => handleInsertTextBox('callout'),
                                        },
                                        {
                                            id: 'insert.equation',
                                            label: 'Equation',
                                            path: 'Insert',
                                            shortcut: 'Alt+=',
                                            run: openEquationDialog,
                                        },
                                        {
                                            id: 'tools.wordCount',
                                            label: 'Word count',
                                            path: 'Tools',
                                            shortcut: '⌘⇧C',
                                            run: handleOpenWordCount,
                                        },
                                        {
                                            id: 'tools.dictionary',
                                            label: 'Dictionary',
                                            path: 'Tools',
                                            shortcut: '⌘⇧Y',
                                            run: handleOpenDictionary,
                                        },
                                        {
                                            id: 'tools.translate',
                                            label: 'Translate…',
                                            path: 'Tools',
                                            run: handleOpenTranslate,
                                        },
                                        {
                                            id: 'tools.explore',
                                            label: 'Explore…',
                                            path: 'Tools',
                                            run: handleOpenExplore,
                                        },
                                        {
                                            id: 'tools.citations',
                                            label: 'Citations…',
                                            path: 'Tools',
                                            run: handleOpenCitations,
                                        },
                                        {
                                            id: 'tools.preferences',
                                            label: 'Preferences…',
                                            path: 'Tools',
                                            run: () => setShowPreferences(true),
                                        },
                                        {
                                            id: 'tools.accessibility',
                                            label: 'Accessibility…',
                                            path: 'Tools',
                                            run: handleOpenAccessibility,
                                        },
                                        {
                                            id: 'view.showFormattingMarks',
                                            label: showFormattingMarks
                                                ? 'Hide non-printing characters'
                                                : 'Show non-printing characters',
                                            path: 'View',
                                            run: handleToggleShowFormattingMarks,
                                        },
                                        {
                                            id: 'view.showOutline',
                                            label: showOutline ? 'Hide document outline' : 'Show document outline',
                                            path: 'View',
                                            shortcut: '⌘⇧H',
                                            run: handleToggleOutline,
                                        },
                                        {
                                            id: 'view.showComments',
                                            label: showCommentsSidebar ? 'Hide comments' : 'Show comments',
                                            path: 'View',
                                            run: handleToggleComments,
                                        },
                                        {
                                            id: 'view.showVersionHistory',
                                            label: showVersionHistory ? 'Hide version history' : 'Show version history',
                                            path: 'View',
                                            run: handleToggleVersionHistory,
                                        },
                                        {
                                            id: 'help.report',
                                            label: 'Report a bug',
                                            path: 'Help',
                                            run: handleReportBug,
                                        },
                                        {
                                            id: 'help.about',
                                            label: 'About Casual Editor',
                                            path: 'Help',
                                            run: handleShowAbout,
                                        },
                                    ] }))] }), _jsx("input", { ref: imageInputRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: handleImageFileChange }), _jsx("input", { ref: docxInputRef, type: "file", accept: ".docx,.odt,.md,.markdown,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document", style: { display: 'none' }, onChange: handleDocxFileChange })] }) }) }) }));
});
// ============================================================================
// EXPORTS
// ============================================================================
export default DocxEditor;
// Type-only re-cast for the same DocxEditor component, suitable for
// JSX use in places (like the Translate-document preview pane) where
// forwardRef's stricter signature trips TypeScript. Renders the exact
// same component — no ref forwarding is needed at the call site.
const DocxEditorAsPreview = DocxEditor;
//# sourceMappingURL=DocxEditor.js.map