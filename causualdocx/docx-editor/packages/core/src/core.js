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
// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '0.0.2';
// ============================================================================
// PARSER / SERIALIZER
// ============================================================================
export { parseDocx } from './docx/parser';
export { serializeDocument as serializeDocx, serializeDocumentBody, serializeSectionProperties, } from './docx/serializer/documentSerializer';
export { repackDocx, createDocx, updateMultipleFiles } from './docx/rezip';
export { attemptSelectiveSave } from './docx/selectiveSave';
export { buildPatchedDocumentXml, validatePatchSafety } from './docx/selectiveXmlPatch';
// ============================================================================
// TEMPLATE PROCESSING
// ============================================================================
export { processTemplate, processTemplateDetailed, processTemplateAsBlob, getTemplateTags, validateTemplate, } from './utils/processTemplate';
// ============================================================================
// DOCUMENT CREATION
// ============================================================================
export { createEmptyDocument, createDocumentWithText, } from './utils/createDocument';
// ============================================================================
// AGENT API
// ============================================================================
export { DocumentAgent } from './agent/DocumentAgent';
export { executeCommand, executeCommands } from './agent/executor';
export { getAgentContext, getDocumentSummary } from './agent/context';
export { buildSelectionContext, buildExtendedSelectionContext, } from './agent/selectionContext';
// ============================================================================
// UTILITIES
// ============================================================================
export { twipsToPixels, pixelsToTwips, formatPx, emuToPixels, pointsToPixels, halfPointsToPixels, pixelsToEmu, emuToTwips, twipsToEmu, } from './utils/units';
export { resolveColor, resolveHighlightColor, resolveShadingColor, parseColorString, createThemeColor, createRgbColor, darkenColor, lightenColor, blendColors, getContrastingColor, isBlack, isWhite, colorsEqual, generateThemeTintShadeMatrix, getThemeTintShadeHex, ensureHexPrefix, resolveHighlightToCss, } from './utils/colorResolver';
export { createPageBreak, createColumnBreak, createLineBreak, createPageBreakRun, createPageBreakParagraph, insertPageBreak, createHorizontalRule, insertHorizontalRule, isPageBreak, isColumnBreak, isLineBreak, isBreakContent, hasPageBreakBefore, countPageBreaks, findPageBreaks, removePageBreak, } from './utils/insertOperations';
export { toArrayBuffer } from './utils/docxInput';
export { findStartPosForParaId } from './prosemirror/utils/findStartPosForParaId';
export { findParagraphByParaId } from './prosemirror/utils/findParagraphByParaId';
// ============================================================================
// FONT LOADER
// ============================================================================
export { loadFont, loadFonts, loadFontFromBuffer, isFontLoaded, isLoading as isFontsLoading, getLoadedFonts, onFontsLoaded, canRenderFont, preloadCommonFonts, } from './utils/fontLoader';
// ============================================================================
// VARIABLE DETECTION
// ============================================================================
export { detectVariables, detectVariablesDetailed, detectVariablesInBody, detectVariablesInParagraph, extractVariablesFromText, hasTemplateVariables, isValidVariableName, sanitizeVariableName, formatVariable, parseVariable, replaceVariables, removeVariables, documentHasVariables, } from './utils/variableDetector';
// ============================================================================
// CORE PLUGIN SYSTEM
// ============================================================================
export { pluginRegistry, PluginRegistry, registerPlugins, docxtemplaterPlugin, } from './core-plugins';
// ============================================================================
// MANAGER CLASSES (Framework-Agnostic Business Logic)
// ============================================================================
export { 
// Base class
Subscribable, 
// Manager classes
AutoSaveManager, TableSelectionManager, ErrorManager, PluginLifecycleManager, 
// AutoSave utilities
formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported, 
// TableSelection utilities
TABLE_DATA_ATTRIBUTES, findTableFromClick, getTableFromDocument, updateTableInDocument, deleteTableFromDocument, 
// Clipboard utilities
getSelectionRuns, createSelectionFromDOM, extractFormattingFromElement, rgbToHex, 
// PluginLifecycle utilities
injectStyles, 
// Coordinators
LayoutCoordinator, EditorCoordinator, } from './managers';
//# sourceMappingURL=core.js.map