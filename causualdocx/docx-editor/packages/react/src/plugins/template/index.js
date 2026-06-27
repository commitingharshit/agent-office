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
import React from 'react';
import { TextSelection } from 'prosemirror-state';
import { createTemplatePlugin, templatePluginKey, setHoveredElement, setSelectedElement, TEMPLATE_DECORATION_STYLES, } from './prosemirror-plugin';
import { TemplateHighlightOverlay, TEMPLATE_HIGHLIGHT_OVERLAY_STYLES, } from './components/TemplateHighlightOverlay';
import { TemplateChip, TEMPLATE_CHIP_STYLES } from './components/TemplateChip';
/**
 * Plugin state interface
 */
function selectTag(view, tags, id) {
    if (!view)
        return;
    setSelectedElement(view, id);
    const tag = tags.find((t) => t.id === id);
    if (tag) {
        const tr = view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(tag.from)));
        view.dispatch(tr);
        view.focus();
    }
}
/**
 * Create the template plugin instance.
 */
export function createPlugin(_options = {}) {
    const pmPlugin = createTemplatePlugin();
    return {
        id: 'template',
        name: 'Template',
        proseMirrorPlugins: [pmPlugin],
        onStateChange: (view) => {
            const pluginState = templatePluginKey.getState(view.state);
            if (!pluginState)
                return undefined;
            return {
                tags: pluginState.tags,
                hoveredId: pluginState.hoveredId,
                selectedId: pluginState.selectedId,
            };
        },
        initialize: (_view) => {
            return { tags: [] };
        },
        getSidebarItems: (state, context) => {
            if (!state || state.tags.length === 0)
                return [];
            const visibleTags = state.tags.filter((t) => t.type !== 'sectionEnd' && !t.insideSection);
            return visibleTags.map((tag) => ({
                id: `template-${tag.id}`,
                anchorPos: tag.from,
                priority: 10,
                estimatedHeight: 32,
                render: (props) => React.createElement(TemplateChip, Object.assign(Object.assign({}, props), { tag, isHovered: tag.id === state.hoveredId, onHover: (id) => {
                        if (context.editorView)
                            setHoveredElement(context.editorView, id);
                    }, onSelect: (id) => selectTag(context.editorView, state.tags, id) })),
            }));
        },
        renderOverlay: (context, state, editorView) => {
            if (!state || state.tags.length === 0)
                return null;
            return React.createElement(TemplateHighlightOverlay, {
                context,
                tags: state.tags,
                hoveredId: state.hoveredId,
                selectedId: state.selectedId,
                onHover: (id) => {
                    if (editorView)
                        setHoveredElement(editorView, id);
                },
                onSelect: (id) => selectTag(editorView, state.tags, id),
            });
        },
        styles: `
${TEMPLATE_DECORATION_STYLES}
${TEMPLATE_CHIP_STYLES}
${TEMPLATE_HIGHLIGHT_OVERLAY_STYLES}
`,
    };
}
/**
 * Default template plugin instance.
 */
export const templatePlugin = createPlugin();
export { createTemplatePlugin, templatePluginKey, getTemplateTags, setHoveredElement, setSelectedElement, TEMPLATE_DECORATION_STYLES, } from './prosemirror-plugin';
//# sourceMappingURL=index.js.map