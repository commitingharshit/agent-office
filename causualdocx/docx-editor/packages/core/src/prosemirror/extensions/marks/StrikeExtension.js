/**
 * Strikethrough Mark Extension
 */
import { createMarkExtension } from '../create';
import { toggleMark } from './markUtils';
export const StrikeExtension = createMarkExtension({
    name: 'strike',
    schemaMarkName: 'strike',
    markSpec: {
        attrs: {
            double: { default: false },
        },
        parseDOM: [
            { tag: 's' },
            { tag: 'strike' },
            { tag: 'del' },
            {
                style: 'text-decoration',
                getAttrs: (value) => (value.includes('line-through') ? {} : false),
            },
        ],
        toDOM() {
            return ['s', 0];
        },
    },
    onSchemaReady(ctx) {
        return {
            commands: {
                toggleStrike: () => toggleMark(ctx.schema.marks.strike),
            },
            keyboardShortcuts: {
                'Mod-Shift-x': toggleMark(ctx.schema.marks.strike),
            },
        };
    },
});
//# sourceMappingURL=StrikeExtension.js.map