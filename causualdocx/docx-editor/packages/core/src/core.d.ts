/**
 * @eigenpal/docx-core (default entry point)
 *
 * Fat barrel that re-exports the parser, serializer, agent, plugin
 * registry, and the most-used types. No React/DOM imports.
 *
 * **When to import from `.` vs `./headless`:** identical for Node.js
 * use; `.` is the convenient aggregate, `./headless` is its mirror with
 * a slightly different name suffix. Adapter authors who only need a
 * specific slice should prefer the smaller subpaths (`./docx`, `./agent`,
 * `./prosemirror`, `./layout-*`, `./utils`) — they tree-shake better.
 *
 * @example
 * ```ts
 * import { parseDocx, serializeDocx, resolveColor } from '@eigenpal/docx-core';
 * ```
 */
export declare const VERSION = "0.0.2";
export { parseDocx } from './docx/parser';
export { serializeDocument as serializeDocx, serializeDocumentBody, serializeSectionProperties, } from './docx/serializer/documentSerializer';
export { repackDocx, createDocx, updateMultipleFiles } from './docx/rezip';
export { attemptSelectiveSave } from './docx/selectiveSave';
export { buildPatchedDocumentXml, validatePatchSafety } from './docx/selectiveXmlPatch';
export { processTemplate, processTemplateDetailed, processTemplateAsBlob, getTemplateTags, validateTemplate, type ProcessTemplateOptions, type ProcessTemplateResult, } from './utils/processTemplate';
export { createEmptyDocument, createDocumentWithText, type CreateEmptyDocumentOptions, } from './utils/createDocument';
export { DocumentAgent } from './agent/DocumentAgent';
export { executeCommand, executeCommands } from './agent/executor';
export { getAgentContext, getDocumentSummary, type AgentContextOptions } from './agent/context';
export { buildSelectionContext, buildExtendedSelectionContext, type SelectionContextOptions, type ExtendedSelectionContext, } from './agent/selectionContext';
export { twipsToPixels, pixelsToTwips, formatPx, emuToPixels, pointsToPixels, halfPointsToPixels, pixelsToEmu, emuToTwips, twipsToEmu, } from './utils/units';
export { resolveColor, resolveHighlightColor, resolveShadingColor, parseColorString, createThemeColor, createRgbColor, darkenColor, lightenColor, blendColors, getContrastingColor, isBlack, isWhite, colorsEqual, generateThemeTintShadeMatrix, getThemeTintShadeHex, ensureHexPrefix, resolveHighlightToCss, type ThemeMatrixCell, } from './utils/colorResolver';
export { createPageBreak, createColumnBreak, createLineBreak, createPageBreakRun, createPageBreakParagraph, insertPageBreak, createHorizontalRule, insertHorizontalRule, isPageBreak, isColumnBreak, isLineBreak, isBreakContent, hasPageBreakBefore, countPageBreaks, findPageBreaks, removePageBreak, type InsertPosition, } from './utils/insertOperations';
export { type DocxInput, toArrayBuffer } from './utils/docxInput';
export { findStartPosForParaId } from './prosemirror/utils/findStartPosForParaId';
export { findParagraphByParaId } from './prosemirror/utils/findParagraphByParaId';
export { loadFont, loadFonts, loadFontFromBuffer, isFontLoaded, isLoading as isFontsLoading, getLoadedFonts, onFontsLoaded, canRenderFont, preloadCommonFonts, } from './utils/fontLoader';
export { detectVariables, detectVariablesDetailed, detectVariablesInBody, detectVariablesInParagraph, extractVariablesFromText, hasTemplateVariables, isValidVariableName, sanitizeVariableName, formatVariable, parseVariable, replaceVariables, removeVariables, documentHasVariables, type VariableDetectionResult, type VariableOccurrence, } from './utils/variableDetector';
export type { Document, DocxPackage, DocumentBody, BlockContent, Paragraph, Run, RunContent, TextContent, Table, TableRow, TableCell, Image, Shape, TextBox, Hyperlink, BookmarkStart, BookmarkEnd, Field, Theme, ThemeColorScheme, ThemeFont, ThemeFontScheme, Style, StyleDefinitions, TextFormatting, ParagraphFormatting, SectionProperties, HeaderFooter, HeaderReference, FooterReference, Footnote, Endnote, ListLevel, NumberingDefinitions, Relationship, } from './types/document';
export type { AIAction, AIActionRequest, AgentResponse, AgentContext, SelectionContext, Range, Position, ParagraphContext, SuggestedAction, AgentCommand, InsertTextCommand, ReplaceTextCommand, DeleteTextCommand, FormatTextCommand, InsertTableCommand, InsertImageCommand, InsertHyperlinkCommand, SetVariableCommand, ApplyStyleCommand, } from './types/agentApi';
export type { EditorPluginCore, PluginPanelProps, PanelConfig, RenderedDomContext, PositionCoordinates, } from './plugin-api/types';
export { pluginRegistry, PluginRegistry, registerPlugins, docxtemplaterPlugin, type CorePlugin, type McpToolDefinition, type McpToolHandler, type McpToolResult, type McpSession, } from './core-plugins';
export { Subscribable, AutoSaveManager, TableSelectionManager, ErrorManager, PluginLifecycleManager, formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported, TABLE_DATA_ATTRIBUTES, findTableFromClick, getTableFromDocument, updateTableInDocument, deleteTableFromDocument, getSelectionRuns, createSelectionFromDOM, extractFormattingFromElement, rgbToHex, injectStyles, LayoutCoordinator, EditorCoordinator, } from './managers';
export type { EditorHandle, AutoSaveStatus, AutoSaveManagerOptions, SavedDocumentData, AutoSaveSnapshot, CellCoordinates, TableSelectionSnapshot, ErrorSeverity, ErrorNotification, ErrorManagerSnapshot, PluginLifecycleConfig, PluginLifecycleSnapshot, ClipboardSelection, SelectionRect, CaretPosition, ImageSelectionInfo, ColumnResizeState, LayoutCoordinatorSnapshot, EditorLoadingState, EditorCoordinatorOptions, EditorCoordinatorSnapshot, } from './managers';
//# sourceMappingURL=core.d.ts.map