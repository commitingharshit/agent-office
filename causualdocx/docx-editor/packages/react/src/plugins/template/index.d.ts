/**
 * Template Plugin
 *
 * Docxtemplater template support as a plugin for the DOCX Editor.
 *
 * Features:
 * - Full docxtemplater syntax detection (variables, loops, conditionals)
 * - Sidebar annotation chips showing template structure (via getSidebarItems)
 * - Differentiated visual highlighting by element type
 *
 * @example
 * ```tsx
 * import { PluginHost } from '@docx-editor/plugin-api';
 * import { templatePlugin } from '@docx-editor/plugins/template';
 *
 * function MyEditor() {
 *   return (
 *     <PluginHost plugins={[templatePlugin]}>
 *       <DocxEditor document={doc} onChange={handleChange} />
 *     </PluginHost>
 *   );
 * }
 * ```
 */
import type { ReactEditorPlugin } from '../../plugin-api/types';
import type { TemplateTag } from './prosemirror-plugin';
interface TemplatePluginState {
    tags: TemplateTag[];
    hoveredId?: string;
    selectedId?: string;
}
/**
 * Create the template plugin instance.
 */
export declare function createPlugin(_options?: {
    /** @deprecated — panel is no longer used; template chips render in the unified sidebar */
    defaultCollapsed?: boolean;
    /** @deprecated */
    panelPosition?: 'left' | 'right';
    /** @deprecated */
    panelWidth?: number;
}): ReactEditorPlugin<TemplatePluginState>;
/**
 * Default template plugin instance.
 */
export declare const templatePlugin: ReactEditorPlugin<TemplatePluginState>;
export type { TemplateTag, TagType } from './prosemirror-plugin';
export { createTemplatePlugin, templatePluginKey, getTemplateTags, setHoveredElement, setSelectedElement, TEMPLATE_DECORATION_STYLES, } from './prosemirror-plugin';
//# sourceMappingURL=index.d.ts.map