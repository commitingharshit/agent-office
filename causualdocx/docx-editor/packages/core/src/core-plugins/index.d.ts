/**
 * Core Plugin System
 *
 * Headless plugin system for extending DocumentAgent with custom
 * commands and exposing MCP tools for AI integration.
 *
 * @example
 * ```ts
 * import {
 *   pluginRegistry,
 *   docxtemplaterPlugin,
 *   type CorePlugin
 * } from '@eigenpal/docx-editor/core-plugins';
 *
 * // Register the docxtemplater plugin
 * pluginRegistry.register(docxtemplaterPlugin);
 *
 * // Get MCP tools for MCP server
 * const tools = pluginRegistry.getMcpTools();
 *
 * // Check available command handlers
 * const commandTypes = pluginRegistry.getCommandTypes();
 * ```
 */
export type { CorePlugin, Plugin, PluginCommand, CommandHandler, PluginCommandHandler, CommandResult, PluginOptions, PluginRegistrationResult, McpToolDefinition, ToolDefinition, McpToolHandler, ToolHandler, McpToolResult, ToolResult, McpToolContent, McpToolContext, McpToolAnnotations, McpToolExample, McpSession, LoadedDocument, JsonSchema, ZodSchemaLike, PluginEvent, PluginEventListener, TypedCommandHandler, ExtractCommand, } from './types';
export { isZodSchema } from './types';
export { PluginRegistry, pluginRegistry, registerPlugins, createPluginRegistrar } from './registry';
export { docxtemplaterPlugin } from './docxtemplater';
//# sourceMappingURL=index.d.ts.map