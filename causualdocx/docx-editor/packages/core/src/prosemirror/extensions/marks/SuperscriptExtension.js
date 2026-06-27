/**
 * Superscript Mark Extension
 */
import { toggleMark } from 'prosemirror-commands';
import { createMarkExtension } from '../create';
export const SuperscriptExtension = createMarkExtension({
    name: 'superscript',
    schemaMarkName: 'superscript',
    markSpec: {
        excludes: 'subscript',
        parseDOM: [{ tag: 'sup' }],
        toDOM() {
            return ['sup', 0];
        },
    },
    onSchemaReady(ctx) {
        return {
            commands: {
                toggleSuperscript: () => toggleMark(ctx.schema.marks.superscript),
            },
            keyboardShortcuts: {
                // Google Docs: Ctrl+. for superscript
                'Mod-.': toggleMark(ctx.schema.marks.superscript),
            },
        };
    },
});
//# sourceMappingURL=SuperscriptExtension.js.map