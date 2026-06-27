/**
 * Extension Factory Functions
 *
 * Creates extension instances from definitions.
 * Each factory returns a function that accepts options and returns an extension instance.
 */
import type { Extension, NodeExtension, MarkExtension, ExtensionDefinition, NodeExtensionDefinition, MarkExtensionDefinition } from './types';
/**
 * Create a generic extension (plugins, commands, keymaps — no schema contribution)
 */
export declare function createExtension<TOptions extends Record<string, unknown> = Record<string, unknown>>(def: ExtensionDefinition<TOptions>): (options?: Partial<TOptions>) => Extension;
/**
 * Create a node extension (contributes a NodeSpec to the schema)
 */
export declare function createNodeExtension<TOptions extends Record<string, unknown> = Record<string, unknown>>(def: NodeExtensionDefinition<TOptions>): (options?: Partial<TOptions>) => NodeExtension;
/**
 * Create a mark extension (contributes a MarkSpec to the schema)
 */
export declare function createMarkExtension<TOptions extends Record<string, unknown> = Record<string, unknown>>(def: MarkExtensionDefinition<TOptions>): (options?: Partial<TOptions>) => MarkExtension;
//# sourceMappingURL=create.d.ts.map