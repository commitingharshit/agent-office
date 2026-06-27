/**
 * Template ProseMirror Plugin
 *
 * Simple plugin that finds template tags using regex and creates decorations.
 * No separate parsing layer - everything happens here.
 */
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
/**
 * Regex to match template tags: {name}, {#name}, {/name}, {^name}, {@name}
 */
const TAG_REGEX = /\{([#/^@]?)([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\}/g;
/**
 * Plugin key
 */
export const templatePluginKey = new PluginKey('template');
/**
 * Generate a stable tag ID based on content, not a counter.
 * This ensures React keys remain stable across re-parses,
 * preventing DOM destruction/recreation (which causes blinking).
 */
function stableId(type, name, occurrence) {
    return `${type}:${name}:${occurrence}`;
}
/**
 * Find all template tags in the document
 */
function findTags(doc) {
    var _a, _b;
    // Collect all text with positions
    const parts = [];
    doc.descendants((node, pos) => {
        if (node.isText && node.text) {
            parts.push({ text: node.text, pos });
        }
        return true;
    });
    // Build combined text and position map
    let combined = '';
    const posMap = [];
    for (const p of parts) {
        for (let i = 0; i < p.text.length; i++) {
            posMap.push(p.pos + i);
        }
        combined += p.text;
    }
    // Find tags
    const tags = [];
    const sectionStack = [];
    const occurrences = new Map();
    let match;
    TAG_REGEX.lastIndex = 0;
    while ((match = TAG_REGEX.exec(combined)) !== null) {
        const [rawTag, prefix, name] = match;
        const from = posMap[match.index];
        const to = posMap[match.index + rawTag.length - 1] + 1;
        let type;
        if (prefix === '#')
            type = 'sectionStart';
        else if (prefix === '/')
            type = 'sectionEnd';
        else if (prefix === '^')
            type = 'invertedStart';
        else if (prefix === '@')
            type = 'raw';
        else
            type = 'variable';
        const key = `${type}:${name}`;
        const occ = (_a = occurrences.get(key)) !== null && _a !== void 0 ? _a : 0;
        occurrences.set(key, occ + 1);
        const tag = { id: stableId(type, name, occ), type, name, rawTag, from, to };
        // Track nested variables in sections
        if (type === 'sectionStart' || type === 'invertedStart') {
            tag.nestedVars = [];
            sectionStack.push(tag);
        }
        else if (type === 'sectionEnd') {
            // Pop matching section
            for (let i = sectionStack.length - 1; i >= 0; i--) {
                if (sectionStack[i].name === name) {
                    sectionStack.splice(i, 1);
                    break;
                }
            }
        }
        else if (type === 'variable' && sectionStack.length > 0) {
            // Add to nearest section's nested vars and mark as inside section
            const section = sectionStack[sectionStack.length - 1];
            (_b = section.nestedVars) === null || _b === void 0 ? void 0 : _b.push(name);
            tag.insideSection = true;
        }
        tags.push(tag);
    }
    return tags;
}
/**
 * Get color for tag type
 */
function getColor(type) {
    switch (type) {
        case 'sectionStart':
        case 'sectionEnd':
            return '#3b82f6';
        case 'invertedStart':
            return '#8b5cf6';
        case 'raw':
            return '#ef4444';
        default:
            return '#f59e0b';
    }
}
/**
 * Create decorations for tags
 */
function createDecorations(doc, tags, hoveredId, selectedId) {
    const decorations = [];
    for (const tag of tags) {
        const isHovered = tag.id === hoveredId;
        const isSelected = tag.id === selectedId;
        const color = getColor(tag.type);
        const classes = ['docx-template-tag'];
        if (isHovered)
            classes.push('hovered');
        if (isSelected)
            classes.push('selected');
        decorations.push(Decoration.inline(tag.from, tag.to, {
            class: classes.join(' '),
            'data-tag-id': tag.id,
            style: `background-color: ${color}22; border-radius: 2px;`,
        }, 
        // Skip generic decoration-forwarding; TemplateHighlightOverlay
        // already paints these on the visible pages.
        { noOverlay: true }));
    }
    return DecorationSet.create(doc, decorations);
}
/**
 * Compare two tag arrays for structural equality (same tag IDs in same order).
 * Position shifts (from/to) are expected during typing and don't count as structural changes.
 */
function tagsStructureEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id)
            return false;
    }
    return true;
}
/**
 * Create the template plugin
 */
export function createTemplatePlugin() {
    return new Plugin({
        key: templatePluginKey,
        state: {
            init(_, state) {
                const tags = findTags(state.doc);
                return {
                    tags,
                    decorations: createDecorations(state.doc, tags),
                };
            },
            apply(tr, value, _oldState, newState) {
                var _a, _b;
                // Re-parse on doc change
                if (tr.docChanged) {
                    const newTags = findTags(newState.doc);
                    // When tag structure is unchanged (same IDs, just shifted positions),
                    // map existing decorations instead of rebuilding from scratch.
                    // Tags still get updated positions for overlay rendering.
                    const structureSame = tagsStructureEqual(value.tags, newTags);
                    return {
                        tags: newTags,
                        decorations: structureSame
                            ? value.decorations.map(tr.mapping, tr.doc)
                            : createDecorations(newState.doc, newTags, value.hoveredId, value.selectedId),
                        hoveredId: value.hoveredId,
                        selectedId: value.selectedId,
                    };
                }
                // Handle hover/select changes
                const meta = tr.getMeta(templatePluginKey);
                if (meta) {
                    const newHovered = (_a = meta.hoveredId) !== null && _a !== void 0 ? _a : value.hoveredId;
                    const newSelected = (_b = meta.selectedId) !== null && _b !== void 0 ? _b : value.selectedId;
                    return Object.assign(Object.assign({}, value), { hoveredId: newHovered, selectedId: newSelected, decorations: createDecorations(newState.doc, value.tags, newHovered, newSelected) });
                }
                // Map decorations
                return Object.assign(Object.assign({}, value), { decorations: value.decorations.map(tr.mapping, tr.doc) });
            },
        },
        props: {
            decorations(state) {
                var _a, _b;
                return (_b = (_a = templatePluginKey.getState(state)) === null || _a === void 0 ? void 0 : _a.decorations) !== null && _b !== void 0 ? _b : DecorationSet.empty;
            },
            handleClick(view, pos) {
                var _a, _b, _c;
                const tags = (_b = (_a = templatePluginKey.getState(view.state)) === null || _a === void 0 ? void 0 : _a.tags) !== null && _b !== void 0 ? _b : [];
                const clicked = tags.find((t) => pos >= t.from && pos <= t.to);
                if (clicked) {
                    view.dispatch(view.state.tr.setMeta(templatePluginKey, { selectedId: clicked.id }));
                    return true;
                }
                const current = (_c = templatePluginKey.getState(view.state)) === null || _c === void 0 ? void 0 : _c.selectedId;
                if (current) {
                    view.dispatch(view.state.tr.setMeta(templatePluginKey, { selectedId: undefined }));
                }
                return false;
            },
            handleDOMEvents: {
                mouseover(view, event) {
                    var _a, _b, _c;
                    const el = (_b = (_a = event.target).closest) === null || _b === void 0 ? void 0 : _b.call(_a, '[data-tag-id]');
                    const id = (el === null || el === void 0 ? void 0 : el.getAttribute('data-tag-id')) || undefined;
                    const current = (_c = templatePluginKey.getState(view.state)) === null || _c === void 0 ? void 0 : _c.hoveredId;
                    if (id !== current) {
                        view.dispatch(view.state.tr.setMeta(templatePluginKey, { hoveredId: id }));
                    }
                    return false;
                },
                mouseout(view, event) {
                    var _a, _b;
                    const related = event.relatedTarget;
                    if (!((_a = related === null || related === void 0 ? void 0 : related.closest) === null || _a === void 0 ? void 0 : _a.call(related, '[data-tag-id]'))) {
                        const current = (_b = templatePluginKey.getState(view.state)) === null || _b === void 0 ? void 0 : _b.hoveredId;
                        if (current) {
                            view.dispatch(view.state.tr.setMeta(templatePluginKey, { hoveredId: undefined }));
                        }
                    }
                    return false;
                },
            },
        },
    });
}
/**
 * Get tags from editor state
 */
export function getTemplateTags(state) {
    var _a, _b;
    return (_b = (_a = templatePluginKey.getState(state)) === null || _a === void 0 ? void 0 : _a.tags) !== null && _b !== void 0 ? _b : [];
}
/**
 * Set hovered tag
 */
export function setHoveredElement(view, id) {
    view.dispatch(view.state.tr.setMeta(templatePluginKey, { hoveredId: id }));
}
/**
 * Set selected tag
 */
export function setSelectedElement(view, id) {
    view.dispatch(view.state.tr.setMeta(templatePluginKey, { selectedId: id }));
}
/**
 * CSS styles for template decorations
 */
export const TEMPLATE_DECORATION_STYLES = `
.docx-template-tag {
  cursor: pointer;
  transition: background-color 0.1s;
}

.docx-template-tag:hover,
.docx-template-tag.hovered {
  filter: brightness(0.95);
}

.docx-template-tag.selected {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
`;
//# sourceMappingURL=prosemirror-plugin.js.map