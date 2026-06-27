/**
 * StarterKit — bundles all extensions into a ready-to-use set
 *
 * Usage:
 *   const extensions = createStarterKit();
 *   const manager = new ExtensionManager(extensions);
 *   manager.buildSchema();
 *   manager.initializeRuntime();
 */
import type { AnyExtension } from './types';
import type { SelectionChangeCallback } from '../plugins/selectionTracker';
export interface StarterKitOptions {
    /** Extensions to disable by name */
    disable?: string[];
    /** History depth (default: 100) */
    historyDepth?: number;
    /** History new group delay (default: 500) */
    historyNewGroupDelay?: number;
    /** Selection change callback */
    onSelectionChange?: SelectionChangeCallback;
}
/**
 * Create the full set of extensions for the DOCX editor
 */
export declare function createStarterKit(options?: StarterKitOptions): AnyExtension[];
//# sourceMappingURL=StarterKit.d.ts.map