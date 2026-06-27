/**
 * @eigenpal/docx-js-editor
 *
 * A complete WYSIWYG DOCX editor with full Microsoft Word fidelity.
 *
 * Features:
 * - Full text and paragraph formatting
 * - Tables, images, shapes, text boxes
 * - Hyperlinks, bookmarks, fields
 * - Footnotes, lists, headers/footers
 * - Page layout with margins and columns
 * - DocumentAgent API for programmatic editing
 * - Template variable substitution
 * - AI-powered context menu
 *
 * CSS Styles:
 * For optimal cursor visibility and selection highlighting, import the editor styles:
 * ```
 * import '@eigenpal/docx-js-editor/styles/editor.css';
 * ```
 */
// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '0.0.2';
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export { DocxEditor, } from './components/DocxEditor';
// CasualEditor — composable SDK wrapper bundling DocxEditor +
// FileSource + optional collab + optional autosave for host apps
// (Drive, future sheet) that want the editor with minimum ceremony.
// Advanced consumers can still use the raw DocxEditor.
export { CasualEditor, } from './components/CasualEditor';
// CasualEditorIframe — iframe-mounting variant of CasualEditor.
// Doc 16 in the parent repo. Use this for hosts that need CSS / React
// runtime isolation (most consumers; Drive in particular). The
// consumer copies the SDK's `dist/embed/*` into its public dir
// (default `/embed/docs`). v1.2 will rename this to CasualEditor and
// the existing direct-mount component → CasualEditorDirect.
export { CasualEditorIframe, } from './components/CasualEditorIframe';
// Embed — iframe delivery surface. EmbedTransport bridges
// postMessage to React handlers; the envelope shapes mirror
// docs/internal/13-iframe-protocol.md.
export { EmbedTransport, isCasualEnvelope, } from './embed';
// Signing — document-signature pipeline. Types mirror the iframe
// envelopes (docs/internal/13-iframe-protocol.md) so SDK and
// iframe deliveries are interchangeable. Uniform across docs +
// sheet (anchor discriminator differs only).
export { SigningProvider, useSigning, SigningPane, DrawnSignaturePad, TypedSignatureField, UploadedSignatureField, createSigningController, } from './signing';
export { renderAsync } from './renderAsync';
export { toArrayBuffer } from '@eigenpal/docx-core/utils';
export { AgentPanel } from './components/AgentPanel';
// Collab presence cluster (avatars + room status + Share) for the title bar's
// `renderTitleBarRight` slot. Built from the shared design-system UI-kit.
export { PresenceCluster, } from './components/PresenceCluster';
// Collab — Yjs/y-websocket wiring exposed so SDK consumers (host
// apps embedding the editor) can opt into co-edit by passing the
// returned plugins into DocxEditor's `externalPlugins`. `yjs`,
// `y-websocket`, `y-prosemirror` are optional peerDependencies —
// non-collab deploys don't pay the bundle cost.
export { useCollab, } from './collab/useCollab';
// Strict / paragraph-lock co-editing — opt-in collab mode. The plugin is
// wired automatically by `useCollab`; hosts toggle it on the editor view
// with `setStrictCoEditing` and reflect state with `isStrictCoEditingEnabled`.
export { setStrictCoEditing, isStrictCoEditingEnabled, peerLocks, strictCoEditingKey, } from './collab/strictCoEditing';
// Recent files (host-facing — call `recordRecentFile` on doc open,
// surface `listRecentFiles` on a "Home" / "Open" screen).
export { recordRecentFile, listRecentFiles, deleteRecentFile, formatSize, } from './utils/recent-files';
// File source — pluggable storage abstraction (Browser / WOPI /
// Personal). See docs/internal/11-storage-modes.md. Host apps call
// `chooseFileSource()` at boot and wrap the editor tree in
// `<FileSourceProvider>`; everything inside reads via `useFileSource()`.
export { BrowserFileSource, PersonalFileSource, PersonalFileSourceError, WopiFileSource, WopiNotSupportedError, WopiSaveConflictError, AuthClient, PersonalAuthGate, PersonalAuthGateModal, UserMenu, ProfileSettingsDialog, usePersonalAuth, useAuthContext, useFileSourceAutoSave, AutosaveStatus, chooseFileSource, extractWopiContext, FileSourceProvider, useFileSource, } from './file-source';
// Spell-check asset config — host must call this with URLs for the
// Hunspell .aff / .dic files before the Tools → Spell check toggle
// runs (lazy-loaded). The dictionary asset files aren't bundled into
// this lib so the consumer's bundler (Vite, webpack, etc.) handles
// asset hashing.
export { setSpellAssetUrls } from './lib/spellcheck/service';
// Writing-assistant worker URL — same pattern as `setSpellAssetUrls`:
// the consumer's bundler produces the worker asset URL and hands it
// to the library, which can't bake the path in (tsup can't resolve
// `new URL('./writer.worker.ts', import.meta.url)`).
export { setWriterWorkerUrl } from './lib/writer/controller';
// Foreign-format conversion (.odt / .md / .txt ⇄ .docx) via the WASM worker.
// Exported so hosts opening files (Home/landing pickers) can convert non-DOCX
// uploads to the DOCX model before handing them to the editor.
export { isForeignFormat, convertToDocx, formatFromFilename, exportDocxAs, } from './lib/format-converter';
// AgentChat exports removed: the source file (./components/AgentChat) imported
// from the AGPL @eigenpal/docx-editor-agents package and was dropped in this
// fork's AGPL purge. See docs/agpl-removal.md.
// ============================================================================
// AGENT API
// ============================================================================
export { DocumentAgent } from '@eigenpal/docx-core/agent';
export { executeCommand, executeCommands } from '@eigenpal/docx-core/agent';
export { getAgentContext, getDocumentSummary, } from '@eigenpal/docx-core/agent';
export { buildSelectionContext, buildExtendedSelectionContext, } from '@eigenpal/docx-core/agent';
// ============================================================================
// PARSER / SERIALIZER
// ============================================================================
export { parseDocx } from '@eigenpal/docx-core/docx';
export { serializeDocument as serializeDocx, serializeDocumentBody, serializeSectionProperties, } from '@eigenpal/docx-core/docx/serializer';
export { processTemplate, processTemplateDetailed, processTemplateAsBlob, getTemplateTags, validateTemplate, } from '@eigenpal/docx-core/utils';
// ============================================================================
// DOCUMENT CREATION
// ============================================================================
export { createEmptyDocument, createDocumentWithText, } from '@eigenpal/docx-core/utils';
// ============================================================================
// FONT LOADER
// ============================================================================
export { loadFont, loadFonts, loadFontFromBuffer, isFontLoaded, isLoading as isFontsLoading, getLoadedFonts, onFontsLoaded, canRenderFont, preloadCommonFonts, } from '@eigenpal/docx-core/utils';
// ============================================================================
// UI COMPONENTS
// ============================================================================
export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, } from './components/Toolbar';
export { EditorToolbar, } from './components/EditorToolbar';
export { FormattingBar } from './components/FormattingBar';
export { ContextMenu, useContextMenu, getActionShortcut, isActionAvailable, getDefaultActions, getAllActions, } from './components/ContextMenu';
export { ResponsePreview, useResponsePreview, createMockResponse, createErrorResponse, } from './components/ResponsePreview';
export { TextContextMenu, useTextContextMenu, getTextActionLabel, getTextActionShortcut, getDefaultTextContextMenuItems, isTextActionAvailable, } from './components/TextContextMenu';
// ============================================================================
// ERROR HANDLING
// ============================================================================
export { ErrorBoundary, ErrorProvider, useErrorNotifications, ParseErrorDisplay, UnsupportedFeatureWarning, isParseError, getUserFriendlyMessage, } from './components/ErrorBoundary';
// ============================================================================
// UI CONTROLS
// ============================================================================
export { ZoomControl } from './components/ui/ZoomControl';
export { FontPicker } from './components/ui/FontPicker';
export { FontSizePicker } from './components/ui/FontSizePicker';
export { LineSpacingPicker, } from './components/ui/LineSpacingPicker';
export { ColorPicker, } from './components/ui/ColorPicker';
export { StylePicker } from './components/ui/StylePicker';
export { AlignmentButtons } from './components/ui/AlignmentButtons';
export { ListButtons, createDefaultListState, } from './components/ui/ListButtons';
export { TableToolbar, createTableContext, addRow, deleteRow, addColumn, deleteColumn, mergeCells, getTableSplitCellDialogConfig, splitTableCell, splitCell, getColumnCount, getCellAt, } from './components/ui/TableToolbar';
export { HorizontalRuler, getRulerDimensions, getMarginInUnits, parseMarginFromUnits, positionToMargin, } from './components/ui/HorizontalRuler';
export { PrintButton, PrintStyles, triggerPrint, openPrintWindow, getDefaultPrintOptions, parsePageRange, formatPageRange as formatPrintPageRange, isPrintSupported, } from './components/ui/PrintPreview';
export { TableBorderPicker } from './components/ui/TableBorderPicker';
export { TableBorderColorPicker, } from './components/ui/TableBorderColorPicker';
export { TableBorderWidthPicker, } from './components/ui/TableBorderWidthPicker';
export { TableCellFillPicker, } from './components/ui/TableCellFillPicker';
export { TableMergeButton } from './components/ui/TableMergeButton';
export { TableInsertButtons, } from './components/ui/TableInsertButtons';
export { TableMoreDropdown } from './components/ui/TableMoreDropdown';
export { UnsavedIndicator, useUnsavedChanges, getVariantLabel, getAllVariants as getAllIndicatorVariants, getAllPositions as getAllIndicatorPositions, createChangeTracker, } from './components/ui/UnsavedIndicator';
export { LoadingIndicator, useLoading, useLoadingOperations, getLoadingVariantLabel, getAllLoadingVariants, getAllLoadingSizes, delay, } from './components/ui/LoadingIndicator';
export { ResponsiveToolbar, ToolbarGroup as ResponsiveToolbarGroup, useResponsiveToolbar, createToolbarItem, createToolbarItems, getRecommendedPriority, } from './components/ui/ResponsiveToolbar';
// ============================================================================
// DIALOGS
// ============================================================================
export { FindReplaceDialog, useFindReplace, findInDocument, findInParagraph, findAllMatches, scrollToMatch, createDefaultFindOptions, createSearchPattern, replaceAllInContent, replaceFirstInContent, getMatchCountText, isEmptySearch, escapeRegexString, getDefaultHighlightOptions, } from './components/dialogs/FindReplaceDialog';
export { HyperlinkDialog, useHyperlinkDialog, } from './components/dialogs/HyperlinkDialog';
export { InsertTableDialog, useInsertTableDialog, createDefaultTableConfig, isValidTableConfig, clampTableConfig, formatTableDimensions, getTablePresets, } from './components/dialogs/InsertTableDialog';
export { InsertImageDialog, useInsertImageDialog, isValidImageFile, getSupportedImageExtensions, getImageAcceptString, calculateFitDimensions, dataUrlToBlob, getImageDimensions, formatFileSize, } from './components/dialogs/InsertImageDialog';
export { InsertSymbolDialog, useInsertSymbolDialog, getSymbolCategories, getSymbolsByCategory, getSymbolInfo as getSymbolUnicodeInfo, searchSymbols, symbolFromCodePoint, SYMBOL_CATEGORIES, } from './components/dialogs/InsertSymbolDialog';
export { PasteSpecialDialog, usePasteSpecial, getPasteOption, getAllPasteOptions, getDefaultPasteOption, isPasteSpecialShortcut, } from './components/dialogs/PasteSpecialDialog';
export { KeyboardShortcutsDialog, useKeyboardShortcutsDialog, getDefaultShortcuts, getShortcutsByCategory, getCommonShortcuts, getCategoryLabel, getAllCategories, formatShortcutKeys, } from './components/dialogs/KeyboardShortcutsDialog';
// ============================================================================
// I18N
// ============================================================================
export { LocaleProvider, useTranslation, } from './i18n';
// ============================================================================
// HOOKS
// ============================================================================
export { useTableSelection, TABLE_DATA_ATTRIBUTES, } from './hooks/useTableSelection';
export { useAutoSave, formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported, } from './hooks/useAutoSave';
export { useWheelZoom, getZoomPresets, findNearestZoomPreset, getNextZoomPreset, getPreviousZoomPreset, formatZoom, parseZoom, isZoomPreset, clampZoom, ZOOM_PRESETS, } from './hooks/useWheelZoom';
// ============================================================================
// UTILITIES
// ============================================================================
export { twipsToPixels, pixelsToTwips, formatPx, emuToPixels, pointsToPixels, halfPointsToPixels, pixelsToEmu, emuToTwips, twipsToEmu, } from '@eigenpal/docx-core/utils';
export { resolveColor, resolveHighlightColor, resolveShadingColor, parseColorString, createThemeColor, createRgbColor, darkenColor, lightenColor, blendColors, getContrastingColor, isBlack, isWhite, colorsEqual, } from '@eigenpal/docx-core/utils';
export { createPageBreak, createColumnBreak, createLineBreak, createPageBreakRun, createPageBreakParagraph, insertPageBreak, createHorizontalRule, insertHorizontalRule, isPageBreak, isColumnBreak, isLineBreak, isBreakContent, hasPageBreakBefore, countPageBreaks, findPageBreaks, removePageBreak, } from '@eigenpal/docx-core/utils';
// Selection highlighting
export { useSelectionHighlight, generateOverlayElements, } from './hooks/useSelectionHighlight';
export { DEFAULT_SELECTION_STYLE, HIGH_CONTRAST_SELECTION_STYLE, SELECTION_CSS_VARS, getSelectionRects, mergeAdjacentRects, getMergedSelectionRects, getHighlightRectStyle, generateSelectionCSS, hasActiveSelection, getSelectedText, isSelectionWithin, getSelectionBoundingRect, highlightTextRange, selectRange, clearSelection, isSelectionBackwards, normalizeSelectionDirection, injectSelectionStyles, removeSelectionStyles, areSelectionStylesInjected, createSelectionChangeHandler, } from '@eigenpal/docx-core/utils';
// Text selection utilities for word/paragraph selection
export { isWordCharacter, isWhitespace, findWordBoundaries, getWordAt, findWordAt, selectWordAtCursor, selectWordInTextNode, expandSelectionToWordBoundaries, selectParagraphAtCursor, handleClickForMultiClick, createDoubleClickWordSelector, createTripleClickParagraphSelector, } from '@eigenpal/docx-core/utils';
// Keyboard navigation
export { 
// Word boundary detection
isWordCharacter as isWordChar, isWhitespace as isWhitespaceChar, isPunctuation, findWordStart, findWordEnd, findNextWordStart, findPreviousWordStart, 
// Line boundary detection
findVisualLineStart, findVisualLineEnd, 
// DOM selection utilities
getSelectionInfo, setSelectionPosition, extendSelectionTo, moveByWord, moveToLineEdge, 
// Keyboard event handling
parseNavigationAction, handleNavigationKey, isNavigationKey, 
// Selection word expansion
expandSelectionToWord, getWordAtCursor, 
// Keyboard shortcut utilities
matchesShortcut, NAVIGATION_SHORTCUTS, describeShortcut, getNavigationShortcutDescriptions, } from '@eigenpal/docx-core/utils';
// Clipboard utilities
export { useClipboard, createSelectionFromDOM, getSelectionRuns, } from './hooks/useClipboard';
export { copyRuns, copyParagraphs, readFromClipboard, handlePasteEvent, htmlToRuns, cleanWordHtml, isWordHtml, isEditorHtml, createClipboardHandlers, runsToClipboardContent, paragraphsToClipboardContent, writeToClipboard, parseClipboardHtml, INTERNAL_CLIPBOARD_TYPE, CLIPBOARD_TYPES, } from '@eigenpal/docx-core/utils';
// ============================================================================
// PLUGIN API
// ============================================================================
export { PluginHost, PLUGIN_HOST_STYLES, } from './plugin-api';
// ============================================================================
// PLUGINS
// ============================================================================
// Template Plugin (Editor UI)
export { templatePlugin, createPlugin as createTemplatePlugin, createTemplatePlugin as createTemplateProseMirrorPlugin, templatePluginKey, getTemplateTags as getTemplatePluginTags, setHoveredElement, setSelectedElement, TEMPLATE_DECORATION_STYLES, } from './plugins/template';
// ============================================================================
// CORE PLUGIN SYSTEM
// ============================================================================
export { pluginRegistry, PluginRegistry, registerPlugins, docxtemplaterPlugin, } from '@eigenpal/docx-core/core-plugins';
// ============================================================================
// FOCUS TRAP — opt-in primitive for dialog focus management
// ============================================================================
//
// Wraps a modal subtree so Tab / Shift+Tab cycle inside it and focus
// restores to the previously-active element on unmount. See
// docs/internal/08-improvement-tracker.md § F3.
export { FocusTrap } from './components/ui/FocusTrap';
// ============================================================================
// VERSION HISTORY — opt-in side panel + ProseMirror transaction feed
// ============================================================================
//
// Captures every committed transaction into a coalesced, human-readable
// timeline with revert-to support. Mirrors Casual Sheets' HistoryPanel.
// See docs/internal/08-improvement-tracker.md § F1.
export { VersionHistoryPanel, } from './components/sidebar/VersionHistoryPanel';
export { fetchServerVersions, downloadServerVersion, } from './version-history/server-source';
export { useEditHistory, } from './hooks/useEditHistory';
//# sourceMappingURL=index.js.map