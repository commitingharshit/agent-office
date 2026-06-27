/**
 * Bold Mark Extension
 */
import { createMarkExtension } from '../create';
import { toggleMark } from './markUtils';
export const BoldExtension = createMarkExtension({
    name: 'bold',
    schemaMarkName: 'bold',
    markSpec: {
        parseDOM: [
            { tag: 'strong' },
            {
                tag: 'b',
                getAttrs(dom) {
                    var _a;
                    // Reject <b> with explicit non-bold font-weight (e.g. Google Docs structural wrapper)
                    const fw = (_a = dom.style) === null || _a === void 0 ? void 0 : _a.fontWeight;
                    if (fw === 'normal' || fw === '400')
                        return false;
                    return null;
                },
            },
            {
                style: 'font-weight',
                getAttrs: (value) => (/^(bold(er)?|[5-9]\d{2})$/.test(value) ? null : false),
            },
        ],
        toDOM() {
            return ['strong', 0];
        },
    },
    onSchemaReady(ctx) {
        return {
            commands: {
                toggleBold: () => toggleMark(ctx.schema.marks.bold),
            },
            keyboardShortcuts: {
                'Mod-b': toggleMark(ctx.schema.marks.bold),
            },
        };
    },
});
//# sourceMappingURL=BoldExtension.js.map