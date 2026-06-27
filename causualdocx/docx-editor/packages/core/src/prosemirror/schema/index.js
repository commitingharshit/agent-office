/**
 * ProseMirror Schema for DOCX Editor
 *
 * Singleton ExtensionManager that builds the schema and initializes runtime.
 * Legacy code imports `schema` and commands from here; new code should use
 * ExtensionManager directly.
 */
import { createStarterKit } from '../extensions/StarterKit';
import { ExtensionManager } from '../extensions/ExtensionManager';
/**
 * Singleton ExtensionManager — builds schema + initializes runtime (plugins, commands, keymaps)
 */
const mgr = new ExtensionManager(createStarterKit());
mgr.buildSchema();
mgr.initializeRuntime();
export const singletonManager = mgr;
export const schema = mgr.getSchema();
//# sourceMappingURL=index.js.map