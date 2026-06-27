/**
 * Document Agent
 *
 * Headless, framework-agnostic API for inspecting and editing the
 * Document model. Used by `@eigenpal/docx-editor-agents` and any
 * adapter that wants agent capabilities without UI.
 */
export { DocumentAgent, createAgent, createAgentFromDocument } from './DocumentAgent';
export { executeCommand, executeCommands } from './executor';
export { getAgentContext, getDocumentSummary, buildSelectionContext as buildSelectionContextFromContext, } from './context';
export { buildSelectionContext, buildExtendedSelectionContext, getSelectionFormattingSummary, } from './selectionContext';
export { getParagraphText, getRunText, getHyperlinkText, getTableText, getBodyText, countWords, countCharacters, getBodyWordCount, getBodyCharacterCount, getTextBefore, getTextAfter, getFormattingAtPosition, isPositionInHyperlink, getHyperlinkAtPosition, isHeadingStyle, parseHeadingLevel, hasImages, hasHyperlinks, hasTables, getParagraphs, getParagraphAtIndex, getBlockIndexForParagraph, } from './text-utils';
export { createCollapsedRange, createRange, isPositionInRange, comparePositions, getActionLabel, getActionDescription, createCommand, DEFAULT_AI_ACTIONS, } from '../types/agentApi';
//# sourceMappingURL=index.js.map