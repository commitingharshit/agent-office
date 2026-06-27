/**
 * Extension System Type Definitions
 *
 * Tiptap-style extension architecture for ProseMirror.
 * Three extension types:
 * - Extension: plugins, commands, keymaps (no schema)
 * - NodeExtension: adds a node spec to the schema
 * - MarkExtension: adds a mark spec to the schema
 */
import type { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';
import type { Plugin as PMPlugin, Command } from 'prosemirror-state';
import type { ExtensionManager } from './ExtensionManager';
export type ExtensionPriority = number;
export declare const Priority: {
    readonly Highest: 0;
    readonly High: 50;
    readonly Default: 100;
    readonly Low: 150;
    readonly Lowest: 200;
};
export interface ExtensionContext {
    schema: Schema;
    /**
     * The manager that owns this extension. Use this in runtime callbacks
     * (e.g. `handleKeyDown`) that need to dispatch commands, instead of
     * reaching back to the `singletonManager` export — the latter forms a
     * circular import that breaks when the package is consumed as a built
     * bundle.
     */
    manager: ExtensionManager;
}
export type CommandMap = Record<string, (...args: any[]) => Command>;
export type KeyboardShortcutMap = Record<string, Command>;
export interface ExtensionRuntime {
    commands?: CommandMap;
    keyboardShortcuts?: KeyboardShortcutMap;
    plugins?: PMPlugin[];
}
export interface ExtensionConfig {
    name: string;
    priority: ExtensionPriority;
    options: Record<string, unknown>;
}
export interface NodeExtensionConfig extends ExtensionConfig {
    schemaNodeName: string;
    nodeSpec: NodeSpec;
}
export interface MarkExtensionConfig extends ExtensionConfig {
    schemaMarkName: string;
    markSpec: MarkSpec;
}
export interface Extension {
    type: 'extension';
    config: ExtensionConfig;
    onSchemaReady(ctx: ExtensionContext): ExtensionRuntime;
}
export interface NodeExtension {
    type: 'node';
    config: NodeExtensionConfig;
    onSchemaReady(ctx: ExtensionContext): ExtensionRuntime;
}
export interface MarkExtension {
    type: 'mark';
    config: MarkExtensionConfig;
    onSchemaReady(ctx: ExtensionContext): ExtensionRuntime;
}
export type AnyExtension = Extension | NodeExtension | MarkExtension;
export interface ExtensionDefinition<TOptions = Record<string, unknown>> {
    name: string;
    priority?: ExtensionPriority;
    defaultOptions?: TOptions;
    onSchemaReady(ctx: ExtensionContext, options: TOptions): ExtensionRuntime;
}
export interface NodeExtensionDefinition<TOptions = Record<string, unknown>> {
    name: string;
    priority?: ExtensionPriority;
    defaultOptions?: TOptions;
    schemaNodeName: string;
    nodeSpec: NodeSpec | ((options: TOptions) => NodeSpec);
    onSchemaReady?(ctx: ExtensionContext, options: TOptions): ExtensionRuntime;
}
export interface MarkExtensionDefinition<TOptions = Record<string, unknown>> {
    name: string;
    priority?: ExtensionPriority;
    defaultOptions?: TOptions;
    schemaMarkName: string;
    markSpec: MarkSpec | ((options: TOptions) => MarkSpec);
    onSchemaReady?(ctx: ExtensionContext, options: TOptions): ExtensionRuntime;
}
//# sourceMappingURL=types.d.ts.map