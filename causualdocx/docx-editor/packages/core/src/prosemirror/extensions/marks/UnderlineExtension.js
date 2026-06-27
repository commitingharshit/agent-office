/**
 * Underline Mark Extension
 */
import { createMarkExtension } from '../create';
import { setMark, toggleMark } from './markUtils';
export const UnderlineExtension = createMarkExtension({
    name: 'underline',
    schemaMarkName: 'underline',
    markSpec: {
        attrs: {
            style: { default: 'single' },
            color: { default: null },
        },
        parseDOM: [
            { tag: 'u' },
            {
                style: 'text-decoration',
                getAttrs: (value) => (value.includes('underline') ? {} : false),
            },
        ],
        toDOM(mark) {
            var _a;
            const attrs = mark.attrs;
            const cssStyle = ['text-decoration: underline'];
            if (attrs.style && attrs.style !== 'single') {
                const styleMap = {
                    double: 'double',
                    dotted: 'dotted',
                    dash: 'dashed',
                    wave: 'wavy',
                };
                const cssDecorationStyle = styleMap[attrs.style];
                if (cssDecorationStyle) {
                    cssStyle.push(`text-decoration-style: ${cssDecorationStyle}`);
                }
            }
            if ((_a = attrs.color) === null || _a === void 0 ? void 0 : _a.rgb) {
                cssStyle.push(`text-decoration-color: #${attrs.color.rgb}`);
            }
            return ['span', { style: cssStyle.join('; ') }, 0];
        },
    },
    onSchemaReady(ctx) {
        return {
            commands: {
                toggleUnderline: () => toggleMark(ctx.schema.marks.underline),
                setUnderlineStyle: (style, color) => setMark(ctx.schema.marks.underline, { style, color }),
            },
            keyboardShortcuts: {
                'Mod-u': toggleMark(ctx.schema.marks.underline),
            },
        };
    },
});
//# sourceMappingURL=UnderlineExtension.js.map