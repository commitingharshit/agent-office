/**
 * PluginLifecycleManager
 *
 * Framework-agnostic class for managing editor plugin lifecycle.
 * Extracted from React's `PluginHost.tsx`.
 *
 * Handles:
 * - Plugin initialization and state tracking
 * - Plugin state updates via `updateStates()`
 * - Plugin destroy/cleanup
 *
 * Does NOT handle (framework hosts are responsible for):
 * - CSS injection (use the exported `injectStyles` utility)
 * - DOM event listeners / dispatch wrapping
 */
import type { EditorView } from 'prosemirror-view';
import { Subscribable } from './Subscribable';
import type { PluginLifecycleConfig, PluginLifecycleSnapshot } from './types';
/** Inject CSS styles into the document head. Returns a cleanup function. */
export declare function injectStyles(pluginId: string, css: string): () => void;
export declare class PluginLifecycleManager extends Subscribable<PluginLifecycleSnapshot> {
    private plugins;
    private pluginStates;
    private version;
    constructor();
    /**
     * Initialize plugins with an editor view.
     * Calls `plugin.initialize(editorView)` for each plugin.
     *
     * Note: CSS injection and DOM event listeners are the responsibility
     * of the framework-specific host (e.g. React PluginHost).
     */
    initialize(plugins: PluginLifecycleConfig[], editorView: EditorView): void;
    /**
     * Update all plugin states by calling `onStateChange` on each plugin.
     * Returns true if any plugin state changed.
     */
    updateStates(editorView: EditorView): boolean;
    /** Get plugin state by ID. */
    getPluginState<T>(pluginId: string): T | undefined;
    /** Set plugin state by ID. */
    setPluginState<T>(pluginId: string, state: T): void;
    /** Destroy all plugins and clean up. */
    destroy(): void;
    private destroyPlugins;
    private emitSnapshot;
}
//# sourceMappingURL=PluginLifecycleManager.d.ts.map