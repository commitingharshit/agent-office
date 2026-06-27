/**
 * Template ProseMirror Plugin
 *
 * Simple plugin that finds template tags using regex and creates decorations.
 * No separate parsing layer - everything happens here.
 */
import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { DecorationSet } from 'prosemirror-view';
/**
 * Template tag types
 */
export type TagType = 'variable' | 'sectionStart' | 'sectionEnd' | 'invertedStart' | 'raw';
/**
 * A found template tag
 */
export interface TemplateTag {
    id: string;
    type: TagType;
    name: string;
    rawTag: string;
    from: number;
    to: number;
    /** For sections: nested variable names */
    nestedVars?: string[];
    /** True if this variable is inside a section (shown in section's nested vars) */
    insideSection?: boolean;
}
/**
 * Plugin state
 */
interface TemplatePluginState {
    tags: TemplateTag[];
    decorations: DecorationSet;
    hoveredId?: string;
    selectedId?: string;
}
/**
 * Plugin key
 */
export declare const templatePluginKey: PluginKey<TemplatePluginState>;
/**
 * Create the template plugin
 */
export declare function createTemplatePlugin(): Plugin<TemplatePluginState>;
/**
 * Get tags from editor state
 */
export declare function getTemplateTags(state: import('prosemirror-state').EditorState): TemplateTag[];
/**
 * Set hovered tag
 */
export declare function setHoveredElement(view: EditorView, id: string | undefined): void;
/**
 * Set selected tag
 */
export declare function setSelectedElement(view: EditorView, id: string | undefined): void;
/**
 * CSS styles for template decorations
 */
export declare const TEMPLATE_DECORATION_STYLES = "\n.docx-template-tag {\n  cursor: pointer;\n  transition: background-color 0.1s;\n}\n\n.docx-template-tag:hover,\n.docx-template-tag.hovered {\n  filter: brightness(0.95);\n}\n\n.docx-template-tag.selected {\n  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);\n}\n";
export {};
//# sourceMappingURL=prosemirror-plugin.d.ts.map