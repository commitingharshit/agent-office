/**
 * Extension Manager
 *
 * Two-phase initialization:
 * 1. buildSchema() — collects NodeSpecs/MarkSpecs from extensions → new Schema
 * 2. initializeRuntime() — calls onSchemaReady() on each extension, collects plugins/commands/keymaps
 */
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
export class ExtensionManager {
    constructor(extensions) {
        this.schema = null;
        this.plugins = [];
        this.commands = {};
        // Sort by priority (lower number = higher priority)
        this.extensions = [...extensions].sort((a, b) => a.config.priority - b.config.priority);
    }
    /**
     * Phase 1: Build schema from node/mark extensions
     */
    buildSchema() {
        const nodes = {};
        const marks = {};
        for (const ext of this.extensions) {
            if (ext.type === 'node') {
                nodes[ext.config.schemaNodeName] = ext.config.nodeSpec;
            }
            else if (ext.type === 'mark') {
                marks[ext.config.schemaMarkName] = ext.config.markSpec;
            }
        }
        this.schema = new Schema({ nodes, marks });
    }
    /**
     * Phase 2: Initialize runtime (plugins, commands, keymaps)
     * Must be called after buildSchema()
     */
    initializeRuntime() {
        if (!this.schema) {
            throw new Error('ExtensionManager: buildSchema() must be called before initializeRuntime()');
        }
        const ctx = { schema: this.schema, manager: this };
        const allKeyboardShortcuts = [];
        const allPlugins = [];
        const allCommands = {};
        for (const ext of this.extensions) {
            const runtime = ext.onSchemaReady(ctx);
            if (runtime.commands) {
                Object.assign(allCommands, runtime.commands);
            }
            if (runtime.keyboardShortcuts) {
                allKeyboardShortcuts.push(runtime.keyboardShortcuts);
            }
            if (runtime.plugins) {
                allPlugins.push(...runtime.plugins);
            }
        }
        // Build final plugin array:
        // 1. Raw plugins from extensions (in priority order)
        // 2. Merged keymap plugins (each shortcut map becomes a keymap plugin, in priority order)
        this.plugins = [...allPlugins, ...allKeyboardShortcuts.map((shortcuts) => keymap(shortcuts))];
        this.commands = allCommands;
    }
    /**
     * Get the built schema
     */
    getSchema() {
        if (!this.schema) {
            throw new Error('ExtensionManager: buildSchema() must be called first');
        }
        return this.schema;
    }
    /**
     * Get all plugins (raw + keymap merged)
     */
    getPlugins() {
        return this.plugins;
    }
    /**
     * Get the flat command registry
     */
    getCommands() {
        return this.commands;
    }
    /**
     * Get a specific command by name
     */
    getCommand(name) {
        return this.commands[name];
    }
    /**
     * Lifecycle: destroy
     */
    destroy() {
        this.plugins = [];
        this.commands = {};
    }
}
//# sourceMappingURL=ExtensionManager.js.map