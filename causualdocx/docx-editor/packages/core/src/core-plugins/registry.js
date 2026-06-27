/**
 * Plugin Registry
 *
 * Central registry for core plugins. Manages plugin lifecycle,
 * collects command handlers from all plugins, and aggregates
 * MCP tool definitions for the MCP server.
 */
// ============================================================================
// PLUGIN REGISTRY
// ============================================================================
/**
 * Plugin Registry - manages core plugins
 *
 * @example
 * ```ts
 * import { pluginRegistry, docxtemplaterPlugin } from '@eigenpal/docx-editor/core-plugins';
 *
 * // Register plugins
 * pluginRegistry.register(docxtemplaterPlugin);
 *
 * // Get all MCP tools for MCP server
 * const tools = pluginRegistry.getMcpTools();
 *
 * // Get command handler for executor
 * const handler = pluginRegistry.getCommandHandler('insertTemplateVariable');
 * ```
 */
export class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.commandHandlers = new Map();
        this.eventListeners = new Set();
        this.initialized = new Set();
    }
    // ==========================================================================
    // REGISTRATION
    // ==========================================================================
    /**
     * Register a plugin
     *
     * @param plugin - The plugin to register
     * @param options - Optional configuration
     * @returns Registration result
     */
    register(plugin, options) {
        const warnings = [];
        // Validate plugin
        if (!plugin.id) {
            return { success: false, error: 'Plugin must have an id' };
        }
        if (this.plugins.has(plugin.id)) {
            return { success: false, error: `Plugin '${plugin.id}' is already registered` };
        }
        // Check dependencies
        if (plugin.dependencies) {
            for (const depId of plugin.dependencies) {
                if (!this.plugins.has(depId)) {
                    return {
                        success: false,
                        error: `Plugin '${plugin.id}' requires '${depId}' which is not registered`,
                    };
                }
            }
        }
        // Register command handlers
        if (plugin.commandHandlers) {
            for (const [commandType, handler] of Object.entries(plugin.commandHandlers)) {
                if (this.commandHandlers.has(commandType)) {
                    const existing = this.commandHandlers.get(commandType);
                    warnings.push(`Command '${commandType}' from '${plugin.id}' overrides handler from '${existing.pluginId}'`);
                }
                this.commandHandlers.set(commandType, { pluginId: plugin.id, handler });
            }
        }
        // Store plugin
        this.plugins.set(plugin.id, plugin);
        // Initialize if needed
        if (plugin.initialize && !this.initialized.has(plugin.id)) {
            try {
                const result = plugin.initialize();
                if (result instanceof Promise) {
                    // Handle async initialization
                    result
                        .then(() => {
                        this.initialized.add(plugin.id);
                    })
                        .catch((err) => {
                        this.emit({ type: 'error', pluginId: plugin.id, error: err });
                    });
                }
                else {
                    this.initialized.add(plugin.id);
                }
            }
            catch (err) {
                this.emit({ type: 'error', pluginId: plugin.id, error: err });
            }
        }
        // Log if debug enabled
        if (options === null || options === void 0 ? void 0 : options.debug) {
            console.log(`[PluginRegistry] Registered plugin: ${plugin.id}`);
        }
        // Emit event
        this.emit({ type: 'registered', plugin });
        return {
            success: true,
            plugin,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    /**
     * Unregister a plugin
     *
     * @param pluginId - ID of the plugin to unregister
     * @returns Whether unregistration succeeded
     */
    unregister(pluginId) {
        var _a;
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            return false;
        }
        // Check if other plugins depend on this one
        for (const [id, p] of this.plugins) {
            if ((_a = p.dependencies) === null || _a === void 0 ? void 0 : _a.includes(pluginId)) {
                console.warn(`Cannot unregister '${pluginId}': '${id}' depends on it`);
                return false;
            }
        }
        // Remove command handlers
        for (const [commandType, { pluginId: pid }] of this.commandHandlers) {
            if (pid === pluginId) {
                this.commandHandlers.delete(commandType);
            }
        }
        // Call destroy if available
        if (plugin.destroy) {
            try {
                const result = plugin.destroy();
                if (result instanceof Promise) {
                    result.catch((err) => {
                        this.emit({ type: 'error', pluginId, error: err });
                    });
                }
            }
            catch (err) {
                this.emit({ type: 'error', pluginId, error: err });
            }
        }
        // Remove plugin
        this.plugins.delete(pluginId);
        this.initialized.delete(pluginId);
        // Emit event
        this.emit({ type: 'unregistered', pluginId });
        return true;
    }
    // ==========================================================================
    // QUERIES
    // ==========================================================================
    /**
     * Get a registered plugin by ID
     *
     * @param id - Plugin ID
     * @returns The plugin or undefined
     */
    get(id) {
        return this.plugins.get(id);
    }
    /**
     * Get all registered plugins
     *
     * @returns Array of all plugins
     */
    getAll() {
        return Array.from(this.plugins.values());
    }
    /**
     * Check if a plugin is registered
     *
     * @param id - Plugin ID
     * @returns Whether the plugin is registered
     */
    has(id) {
        return this.plugins.has(id);
    }
    /**
     * Get number of registered plugins
     */
    get size() {
        return this.plugins.size;
    }
    // ==========================================================================
    // COMMAND HANDLERS
    // ==========================================================================
    /**
     * Get a command handler for a command type
     *
     * @param commandType - The command type
     * @returns The handler or undefined
     */
    getCommandHandler(commandType) {
        const entry = this.commandHandlers.get(commandType);
        return entry === null || entry === void 0 ? void 0 : entry.handler;
    }
    /**
     * Get all registered command types
     *
     * @returns Array of command type strings
     */
    getCommandTypes() {
        return Array.from(this.commandHandlers.keys());
    }
    /**
     * Check if a command type has a handler
     *
     * @param commandType - The command type
     * @returns Whether a handler exists
     */
    hasCommandHandler(commandType) {
        return this.commandHandlers.has(commandType);
    }
    // ==========================================================================
    // MCP TOOLS
    // ==========================================================================
    /**
     * Get all MCP tools from all registered plugins
     *
     * @returns Array of MCP tool definitions
     */
    getMcpTools() {
        const tools = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.mcpTools) {
                tools.push(...plugin.mcpTools);
            }
        }
        return tools;
    }
    /**
     * Get MCP tools from a specific plugin
     *
     * @param pluginId - Plugin ID
     * @returns Array of MCP tool definitions
     */
    getMcpToolsForPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        return (plugin === null || plugin === void 0 ? void 0 : plugin.mcpTools) || [];
    }
    /**
     * Get an MCP tool by name
     *
     * @param toolName - Tool name
     * @returns The tool definition or undefined
     */
    getMcpTool(toolName) {
        for (const plugin of this.plugins.values()) {
            if (plugin.mcpTools) {
                const tool = plugin.mcpTools.find((t) => t.name === toolName);
                if (tool)
                    return tool;
            }
        }
        return undefined;
    }
    // ==========================================================================
    // EVENTS
    // ==========================================================================
    /**
     * Add an event listener
     *
     * @param listener - Event listener function
     */
    addEventListener(listener) {
        this.eventListeners.add(listener);
    }
    /**
     * Remove an event listener
     *
     * @param listener - Event listener function
     */
    removeEventListener(listener) {
        this.eventListeners.delete(listener);
    }
    /**
     * Emit an event to all listeners
     */
    emit(event) {
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            }
            catch (err) {
                console.error('[PluginRegistry] Event listener error:', err);
            }
        }
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Clear all registered plugins
     *
     * Useful for testing or resetting state.
     */
    clear() {
        // Call destroy on all plugins
        for (const plugin of this.plugins.values()) {
            if (plugin.destroy) {
                try {
                    plugin.destroy();
                }
                catch (_a) {
                    // Ignore errors during clear
                }
            }
        }
        this.plugins.clear();
        this.commandHandlers.clear();
        this.initialized.clear();
    }
    /**
     * Get registry state for debugging
     */
    getDebugInfo() {
        return {
            plugins: Array.from(this.plugins.keys()),
            commandTypes: Array.from(this.commandHandlers.keys()),
            mcpTools: this.getMcpTools().map((t) => t.name),
            initialized: Array.from(this.initialized),
        };
    }
}
// ============================================================================
// GLOBAL INSTANCE
// ============================================================================
/**
 * Global plugin registry instance
 *
 * Use this for registering plugins and accessing their capabilities.
 */
export const pluginRegistry = new PluginRegistry();
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Register multiple plugins at once
 *
 * @param plugins - Array of plugins to register
 * @returns Array of registration results
 */
export function registerPlugins(plugins, options) {
    return plugins.map((plugin) => pluginRegistry.register(plugin, options));
}
/**
 * Create a plugin registration helper with options pre-configured
 *
 * @param options - Default options for plugin registration
 * @returns Registration function
 */
export function createPluginRegistrar(options) {
    return (plugin) => pluginRegistry.register(plugin, options);
}
//# sourceMappingURL=registry.js.map