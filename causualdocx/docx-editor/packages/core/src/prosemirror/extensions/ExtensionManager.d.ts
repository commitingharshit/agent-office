/**
 * Extension Manager
 *
 * Two-phase initialization:
 * 1. buildSchema() — collects NodeSpecs/MarkSpecs from extensions → new Schema
 * 2. initializeRuntime() — calls onSchemaReady() on each extension, collects plugins/commands/keymaps
 */
import { Schema } from 'prosemirror-model';
import type { Plugin as PMPlugin, Command } from 'prosemirror-state';
import type { AnyExtension, CommandMap } from './types';
export declare class ExtensionManager {
    private extensions;
    private schema;
    private plugins;
    private commands;
    constructor(extensions: AnyExtension[]);
    /**
     * Phase 1: Build schema from node/mark extensions
     */
    buildSchema(): void;
    /**
     * Phase 2: Initialize runtime (plugins, commands, keymaps)
     * Must be called after buildSchema()
     */
    initializeRuntime(): void;
    /**
     * Get the built schema
     */
    getSchema(): Schema;
    /**
     * Get all plugins (raw + keymap merged)
     */
    getPlugins(): PMPlugin[];
    /**
     * Get the flat command registry
     */
    getCommands(): CommandMap;
    /**
     * Get a specific command by name
     */
    getCommand(name: string): ((...args: any[]) => Command) | undefined;
    /**
     * Lifecycle: destroy
     */
    destroy(): void;
}
//# sourceMappingURL=ExtensionManager.d.ts.map