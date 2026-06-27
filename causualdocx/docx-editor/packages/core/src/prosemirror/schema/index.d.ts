/**
 * ProseMirror Schema for DOCX Editor
 *
 * Singleton ExtensionManager that builds the schema and initializes runtime.
 * Legacy code imports `schema` and commands from here; new code should use
 * ExtensionManager directly.
 */
import { ExtensionManager } from '../extensions/ExtensionManager';
export type { ParagraphAttrs, ImageAttrs, ImagePositionAttrs, TableAttrs, TableRowAttrs, TableCellAttrs, } from './nodes';
export type { TextColorAttrs, UnderlineAttrs, RunShadingAttrs, FontSizeAttrs, FontFamilyAttrs, HyperlinkAttrs, } from './marks';
export declare const singletonManager: ExtensionManager;
export declare const schema: import("prosemirror-model").Schema<any, any>;
/**
 * Export types for convenience
 */
export type DocxSchema = typeof schema;
export type DocxNode = ReturnType<typeof schema.node>;
export type DocxMark = ReturnType<typeof schema.mark>;
//# sourceMappingURL=index.d.ts.map