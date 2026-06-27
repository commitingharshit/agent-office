/**
 * Image Extension — inline/floating image node
 */
import { createNodeExtension } from '../create';
export function resolveAnchorAttrs(target, current, opts) {
    // Pick the `position` to write. When promoting inline → anchor, Word
    // anchors the float at the inline image's current X/Y so the result lands
    // exactly where the user was looking. Callers measure that in EMUs and
    // pass it via `initialPositionEmu`.
    const buildAnchorPosition = () => {
        var _a, _b;
        if (((_a = current.position) === null || _a === void 0 ? void 0 : _a.horizontal) && ((_b = current.position) === null || _b === void 0 ? void 0 : _b.vertical)) {
            return current.position;
        }
        if (opts === null || opts === void 0 ? void 0 : opts.initialPositionEmu) {
            return {
                horizontal: {
                    relativeTo: 'column',
                    posOffset: opts.initialPositionEmu.horizontalEmu,
                },
                vertical: {
                    relativeTo: 'paragraph',
                    posOffset: opts.initialPositionEmu.verticalEmu,
                },
            };
        }
        return {
            horizontal: { relativeTo: 'column', posOffset: 0 },
            vertical: { relativeTo: 'paragraph', posOffset: 0 },
        };
    };
    switch (target) {
        case 'inline':
            // Drop every anchor-only attr so the saver emits `<wp:inline>` and the
            // renderer routes the image through the inline-glyph path. The
            // `dist*` margins existed to keep wrapped text away from the float;
            // an inline glyph doesn't need them, and leaving them populates
            // `<wp:inline distT/B/L/R>` with stale anchor padding that would add
            // visible whitespace around the inline image after a save round-trip.
            return {
                wrapType: 'inline',
                displayMode: 'inline',
                cssFloat: 'none',
                wrapText: undefined,
                position: undefined,
                distTop: undefined,
                distBottom: undefined,
                distLeft: undefined,
                distRight: undefined,
            };
        case 'squareLeft':
        case 'squareRight': {
            const cssFloat = target === 'squareLeft' ? 'left' : 'right';
            // Image-on-left ⇒ text flows on the right, and vice versa.
            const wrapText = target === 'squareLeft' ? 'right' : 'left';
            // Keep `tight` / `through` if the image came in with one — flipping the
            // anchor side shouldn't drop the polygon-clipping XML.
            const wrapType = current.wrapType === 'tight' || current.wrapType === 'through'
                ? current.wrapType
                : 'square';
            return {
                wrapType,
                displayMode: 'float',
                cssFloat,
                wrapText,
                position: buildAnchorPosition(),
            };
        }
        case 'square':
        case 'tight':
        case 'through': {
            const cssFloat = current.cssFloat === 'left' || current.cssFloat === 'right' ? current.cssFloat : 'left';
            const wrapText = cssFloat === 'left' ? 'right' : 'left';
            return {
                wrapType: target,
                displayMode: 'float',
                cssFloat,
                wrapText,
                position: buildAnchorPosition(),
            };
        }
        case 'topAndBottom':
            return {
                wrapType: 'topAndBottom',
                displayMode: 'block',
                cssFloat: 'none',
                wrapText: 'bothSides',
                position: buildAnchorPosition(),
            };
        case 'behind':
        case 'inFront':
            return {
                wrapType: target,
                displayMode: 'float',
                cssFloat: 'none',
                wrapText: 'bothSides',
                position: buildAnchorPosition(),
            };
    }
}
export const ImageExtension = createNodeExtension({
    name: 'image',
    schemaNodeName: 'image',
    nodeSpec: {
        inline: true,
        group: 'inline',
        draggable: true,
        attrs: {
            src: {},
            alt: { default: null },
            title: { default: null },
            width: { default: null },
            height: { default: null },
            rId: { default: null },
            wrapType: { default: 'inline' },
            displayMode: { default: 'inline' },
            cssFloat: { default: null },
            transform: { default: null },
            distTop: { default: null },
            distBottom: { default: null },
            distLeft: { default: null },
            distRight: { default: null },
            position: { default: null },
            borderWidth: { default: null },
            borderColor: { default: null },
            borderStyle: { default: null },
            wrapText: { default: null },
            hlinkHref: { default: null },
            cropTop: { default: null },
            cropRight: { default: null },
            cropBottom: { default: null },
            cropLeft: { default: null },
            opacity: { default: null },
            effectExtentTop: { default: null },
            effectExtentBottom: { default: null },
            effectExtentLeft: { default: null },
            effectExtentRight: { default: null },
            layoutInCell: { default: null },
            allowOverlap: { default: null },
        },
        parseDOM: [
            {
                tag: 'img[src]',
                getAttrs(dom) {
                    const element = dom;
                    return {
                        src: element.getAttribute('src') || '',
                        alt: element.getAttribute('alt') || undefined,
                        title: element.getAttribute('title') || undefined,
                        width: element.width || undefined,
                        height: element.height || undefined,
                        rId: element.dataset.rid || undefined,
                        wrapType: element.dataset.wrapType || 'inline',
                        displayMode: element.dataset.displayMode || 'inline',
                        cssFloat: element.dataset.cssFloat || undefined,
                        transform: element.dataset.transform || undefined,
                        borderWidth: element.dataset.borderWidth
                            ? Number(element.dataset.borderWidth)
                            : undefined,
                        borderColor: element.dataset.borderColor || undefined,
                        borderStyle: element.dataset.borderStyle || undefined,
                    };
                },
            },
        ],
        toDOM(node) {
            var _a, _b, _c, _d, _e, _f;
            const attrs = node.attrs;
            const domAttrs = {
                src: attrs.src,
                class: 'docx-image',
            };
            if (attrs.alt)
                domAttrs.alt = attrs.alt;
            if (attrs.title)
                domAttrs.title = attrs.title;
            if (attrs.rId)
                domAttrs['data-rid'] = attrs.rId;
            if (attrs.wrapType)
                domAttrs['data-wrap-type'] = attrs.wrapType;
            if (attrs.displayMode)
                domAttrs['data-display-mode'] = attrs.displayMode;
            if (attrs.cssFloat)
                domAttrs['data-css-float'] = attrs.cssFloat;
            if (attrs.transform)
                domAttrs['data-transform'] = attrs.transform;
            if (attrs.borderWidth)
                domAttrs['data-border-width'] = String(attrs.borderWidth);
            if (attrs.borderColor)
                domAttrs['data-border-color'] = attrs.borderColor;
            if (attrs.borderStyle)
                domAttrs['data-border-style'] = attrs.borderStyle;
            const styles = [];
            if (attrs.width) {
                domAttrs.width = String(attrs.width);
                styles.push(`width: ${attrs.width}px`);
            }
            if (attrs.height) {
                domAttrs.height = String(attrs.height);
                styles.push(`height: ${attrs.height}px`);
            }
            styles.push('max-width: 100%');
            if (attrs.width && attrs.height) {
                styles.push('object-fit: contain');
            }
            else {
                styles.push('height: auto');
            }
            if (attrs.displayMode === 'float' && attrs.cssFloat && attrs.cssFloat !== 'none') {
                styles.push(`float: ${attrs.cssFloat}`);
                domAttrs.class += ` docx-image-float docx-image-float-${attrs.cssFloat}`;
                const marginTop = (_a = attrs.distTop) !== null && _a !== void 0 ? _a : 0;
                const marginBottom = (_b = attrs.distBottom) !== null && _b !== void 0 ? _b : 0;
                const marginLeft = (_c = attrs.distLeft) !== null && _c !== void 0 ? _c : 0;
                const marginRight = (_d = attrs.distRight) !== null && _d !== void 0 ? _d : 0;
                if (attrs.cssFloat === 'left') {
                    styles.push(`margin: ${marginTop}px ${marginRight || 12}px ${marginBottom}px ${marginLeft}px`);
                }
                else {
                    styles.push(`margin: ${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft || 12}px`);
                }
            }
            else if (attrs.displayMode === 'block') {
                styles.push('display: block');
                styles.push('margin-left: auto');
                styles.push('margin-right: auto');
                domAttrs.class += ' docx-image-block';
                const marginTop = (_e = attrs.distTop) !== null && _e !== void 0 ? _e : 0;
                const marginBottom = (_f = attrs.distBottom) !== null && _f !== void 0 ? _f : 0;
                if (marginTop > 0)
                    styles.push(`margin-top: ${marginTop}px`);
                if (marginBottom > 0)
                    styles.push(`margin-bottom: ${marginBottom}px`);
            }
            if (attrs.transform) {
                styles.push(`transform: ${attrs.transform}`);
            }
            if (attrs.borderWidth && attrs.borderWidth > 0) {
                const bStyle = attrs.borderStyle || 'solid';
                const bColor = attrs.borderColor || '#000000';
                styles.push(`border: ${attrs.borderWidth}px ${bStyle} ${bColor}`);
            }
            domAttrs.style = styles.join('; ');
            return ['img', domAttrs];
        },
    },
    onSchemaReady(ctx) {
        const imageType = ctx.schema.nodes.image;
        /**
         * Mutate the image at `pos` to the target wrap-layout. Returns false (and
         * stays a no-op) when the image is currently `inline` — that transition
         * is structural and lives in a follow-up.
         */
        const setImageWrapType = (pos, target, opts) => (state, dispatch) => {
            const node = state.doc.nodeAt(pos);
            if (!node || node.type !== imageType)
                return false;
            const attrs = node.attrs;
            const next = resolveAnchorAttrs(target, {
                wrapType: attrs.wrapType,
                cssFloat: attrs.cssFloat,
                position: attrs.position,
            }, opts);
            if (attrs.wrapType === next.wrapType &&
                attrs.displayMode === next.displayMode &&
                attrs.cssFloat === next.cssFloat &&
                attrs.wrapText === next.wrapText &&
                // Position equality check is shallow; for inline → inline this is a
                // no-op. For anchor → anchor with same (wrapType, cssFloat, wrapText)
                // we keep the existing position untouched anyway.
                attrs.position === next.position) {
                return true;
            }
            if (dispatch) {
                dispatch(state.tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), next)));
            }
            return true;
        };
        return {
            commands: {
                setImageWrapType: (pos, target, opts) => setImageWrapType(pos, target, opts),
            },
        };
    },
});
//# sourceMappingURL=ImageExtension.js.map