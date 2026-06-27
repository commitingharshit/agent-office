/**
 * Italic Mark Extension
 */
import { createMarkExtension } from '../create';
import { toggleMark } from './markUtils';
export const ItalicExtension = createMarkExtension({
    name: 'italic',
    schemaMarkName: 'italic',
    markSpec: {
        parseDOM: [
            { tag: 'i' },
            { tag: 'em' },
            {
                style: 'font-style',
                getAttrs: (value) => (value === 'italic' ? null : false),
            },
        ],
        toDOM() {
            return ['em', 0];
        },
    },
    onSchemaReady(ctx) {
        return {
            commands: {
                toggleItalic: () => toggleMark(ctx.schema.marks.italic),
            },
            keyboardShortcuts: {
                'Mod-i': toggleMark(ctx.schema.marks.italic),
            },
        };
    },
});
//# sourceMappingURL=ItalicExtension.js.map