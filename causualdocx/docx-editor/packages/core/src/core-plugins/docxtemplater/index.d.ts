/**
 * Docxtemplater Plugin
 *
 * Core plugin for template variable functionality using docxtemplater.
 *
 * **Command handlers** — `insertTemplateVariable` and `replaceWithTemplateVariable`
 * allow DocumentAgent to programmatically insert `{variable}` placeholders.
 *
 * @example
 * ```ts
 * import { pluginRegistry } from '@eigenpal/docx-editor/core-plugins';
 * import { docxtemplaterPlugin } from '@eigenpal/docx-editor/core-plugins/docxtemplater';
 *
 * pluginRegistry.register(docxtemplaterPlugin);
 * ```
 */
import type { CorePlugin } from '../types';
/**
 * Docxtemplater plugin for template variable functionality.
 *
 * Dependency validation is handled lazily by `processTemplate` at call time,
 * so no eager `initialize()` is needed.
 */
export declare const docxtemplaterPlugin: CorePlugin;
export { handleInsertTemplateVariable, handleReplaceWithTemplateVariable, type InsertTemplateVariableCommand, type ReplaceWithTemplateVariableCommand, } from './handlers';
export { docxtemplaterMcpTools, getVariablesTool, insertVariableTool, applyTemplateTool, validateTemplateTool, } from './mcp-tools';
//# sourceMappingURL=index.d.ts.map