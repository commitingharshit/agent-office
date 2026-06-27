/**
 * TextBox Extension — editable text box node
 *
 * An isolating block node that contains paragraphs (and tables).
 * Rendered as a positioned container with optional fill, outline, and margins.
 * Supports inline and floating positioning.
 */
import { createNodeExtension } from '../create';
export const TextBoxExtension = createNodeExtension({
    name: 'textBox',
    schemaNodeName: 'textBox',
    nodeSpec: {
        group: 'block',
        content: '(paragraph | table)+',
        isolating: true,
        draggable: true,
        attrs: {
            width: { default: 200 },
            height: { default: null },
            textBoxId: { default: null },
            fillColor: { default: null },
            outlineWidth: { default: null },
            outlineColor: { default: null },
            outlineStyle: { default: null },
            marginTop: { default: 4 },
            marginBottom: { default: 4 },
            marginLeft: { default: 7 },
            marginRight: { default: 7 },
            verticalAlign: { default: null },
            displayMode: { default: 'inline' },
            cssFloat: { default: null },
            wrapType: { default: 'inline' },
            autoFit: { default: null },
            posOffsetH: { default: null },
            posOffsetV: { default: null },
            posRelFromH: { default: null },
            posRelFromV: { default: null },
            posAlignH: { default: null },
            posAlignV: { default: null },
            // Original OOXML envelope (VML/DrawingML), carried through PM + Yjs so a
            // from-PM rebuild re-emits the drawing verbatim instead of dropping it.
            rawXml: { default: null },
            envelopeKey: { default: null },
        },
        parseDOM: [
            {
                tag: 'div.docx-textbox',
                getAttrs(dom) {
                    const el = dom;
                    return {
                        width: el.dataset.width ? Number(el.dataset.width) : undefined,
                        height: el.dataset.height ? Number(el.dataset.height) : undefined,
                        textBoxId: el.dataset.textboxId || undefined,
                        fillColor: el.dataset.fillColor || undefined,
                        outlineWidth: el.dataset.outlineWidth ? Number(el.dataset.outlineWidth) : undefined,
                        outlineColor: el.dataset.outlineColor || undefined,
                        outlineStyle: el.dataset.outlineStyle || undefined,
                        marginTop: el.dataset.marginTop ? Number(el.dataset.marginTop) : undefined,
                        marginBottom: el.dataset.marginBottom ? Number(el.dataset.marginBottom) : undefined,
                        marginLeft: el.dataset.marginLeft ? Number(el.dataset.marginLeft) : undefined,
                        marginRight: el.dataset.marginRight ? Number(el.dataset.marginRight) : undefined,
                        verticalAlign: el.dataset.verticalAlign || undefined,
                        displayMode: el.dataset.displayMode || undefined,
                        cssFloat: el.dataset.cssFloat || undefined,
                        wrapType: el.dataset.wrapType || undefined,
                        autoFit: el.dataset.autoFit || undefined,
                        posOffsetH: el.dataset.posOffsetH ? Number(el.dataset.posOffsetH) : undefined,
                        posOffsetV: el.dataset.posOffsetV ? Number(el.dataset.posOffsetV) : undefined,
                        posRelFromH: el.dataset.posRelFromH || undefined,
                        posRelFromV: el.dataset.posRelFromV || undefined,
                        posAlignH: el.dataset.posAlignH || undefined,
                        posAlignV: el.dataset.posAlignV || undefined,
                    };
                },
            },
        ],
        toDOM(node) {
            var _a, _b, _c, _d;
            const attrs = node.attrs;
            const domAttrs = {
                class: 'docx-textbox',
            };
            // Data attributes for round-trip
            if (attrs.width)
                domAttrs['data-width'] = String(attrs.width);
            if (attrs.height)
                domAttrs['data-height'] = String(attrs.height);
            if (attrs.textBoxId)
                domAttrs['data-textbox-id'] = attrs.textBoxId;
            if (attrs.fillColor)
                domAttrs['data-fill-color'] = attrs.fillColor;
            if (attrs.outlineWidth)
                domAttrs['data-outline-width'] = String(attrs.outlineWidth);
            if (attrs.outlineColor)
                domAttrs['data-outline-color'] = attrs.outlineColor;
            if (attrs.outlineStyle)
                domAttrs['data-outline-style'] = attrs.outlineStyle;
            if (attrs.marginTop != null)
                domAttrs['data-margin-top'] = String(attrs.marginTop);
            if (attrs.marginBottom != null)
                domAttrs['data-margin-bottom'] = String(attrs.marginBottom);
            if (attrs.marginLeft != null)
                domAttrs['data-margin-left'] = String(attrs.marginLeft);
            if (attrs.marginRight != null)
                domAttrs['data-margin-right'] = String(attrs.marginRight);
            if (attrs.verticalAlign)
                domAttrs['data-vertical-align'] = attrs.verticalAlign;
            if (attrs.displayMode)
                domAttrs['data-display-mode'] = attrs.displayMode;
            if (attrs.cssFloat)
                domAttrs['data-css-float'] = attrs.cssFloat;
            if (attrs.wrapType)
                domAttrs['data-wrap-type'] = attrs.wrapType;
            if (attrs.autoFit)
                domAttrs['data-auto-fit'] = attrs.autoFit;
            if (attrs.posOffsetH != null)
                domAttrs['data-pos-offset-h'] = String(attrs.posOffsetH);
            if (attrs.posOffsetV != null)
                domAttrs['data-pos-offset-v'] = String(attrs.posOffsetV);
            if (attrs.posRelFromH)
                domAttrs['data-pos-rel-from-h'] = attrs.posRelFromH;
            if (attrs.posRelFromV)
                domAttrs['data-pos-rel-from-v'] = attrs.posRelFromV;
            if (attrs.posAlignH)
                domAttrs['data-pos-align-h'] = attrs.posAlignH;
            if (attrs.posAlignV)
                domAttrs['data-pos-align-v'] = attrs.posAlignV;
            // Build inline styles
            const styles = [];
            if (attrs.width)
                styles.push(`width: ${attrs.width}px`);
            if (attrs.height)
                styles.push(`min-height: ${attrs.height}px`);
            // Background
            if (attrs.fillColor) {
                styles.push(`background-color: ${attrs.fillColor}`);
            }
            // Border/outline
            if (attrs.outlineWidth && attrs.outlineWidth > 0) {
                const style = attrs.outlineStyle || 'solid';
                const color = attrs.outlineColor || '#000000';
                styles.push(`border: ${attrs.outlineWidth}px ${style} ${color}`);
            }
            else {
                // Default thin border for text boxes
                styles.push('border: 1px solid var(--doc-border, #d1d5db)');
            }
            // Internal margins/padding
            const mt = (_a = attrs.marginTop) !== null && _a !== void 0 ? _a : 4;
            const mb = (_b = attrs.marginBottom) !== null && _b !== void 0 ? _b : 4;
            const ml = (_c = attrs.marginLeft) !== null && _c !== void 0 ? _c : 7;
            const mr = (_d = attrs.marginRight) !== null && _d !== void 0 ? _d : 7;
            styles.push(`padding: ${mt}px ${mr}px ${mb}px ${ml}px`);
            // Vertical alignment
            if (attrs.verticalAlign === 'middle' || attrs.verticalAlign === 'center') {
                styles.push('display: flex');
                styles.push('flex-direction: column');
                styles.push('justify-content: center');
            }
            else if (attrs.verticalAlign === 'bottom') {
                styles.push('display: flex');
                styles.push('flex-direction: column');
                styles.push('justify-content: flex-end');
            }
            // Float/positioning
            if (attrs.displayMode === 'float' && attrs.cssFloat && attrs.cssFloat !== 'none') {
                styles.push(`float: ${attrs.cssFloat}`);
                styles.push('margin: 4px 8px');
            }
            else if (attrs.displayMode === 'block') {
                styles.push('margin-left: auto');
                styles.push('margin-right: auto');
            }
            // Box sizing
            styles.push('box-sizing: border-box');
            styles.push('overflow: hidden');
            styles.push('position: relative');
            domAttrs.style = styles.join('; ');
            return ['div', domAttrs, 0];
        },
    },
});
//# sourceMappingURL=TextBoxExtension.js.map