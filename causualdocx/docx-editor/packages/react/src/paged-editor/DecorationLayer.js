import { jsx as _jsx } from "react/jsx-runtime";
/**
 * DecorationLayer — generic ProseMirror decoration forwarder for the
 * layout-painter visible pages.
 *
 * Background: the editor renders into TWO surfaces (see CLAUDE.md → "Editor
 * Architecture — Dual Rendering System"). PM's own decoration rendering
 * happens in the off-screen HiddenProseMirror, so any plugin that publishes
 * its UI as `Decoration` objects is silently invisible. This component
 * collects decorations from every plugin and renders them as positioned
 * overlays on top of the visible pages.
 *
 * Supported kinds:
 * - **Widget** (`from === to`): the plugin's `toDOM(view, getPos)` is called
 *   and the returned element is appended at the pixel coords of `from`.
 * - **Inline / node** (`from < to`): one absolute-positioned `<div>` per
 *   line-wrap rect, with the decoration's `class` / `style` applied — gives
 *   yCursorPlugin's selection-range tint, search highlights, etc.
 *
 * The overlay is `pointer-events: none` so it never blocks editing; the
 * layout-painter's spans below remain interactive. Per-decoration opt-in to
 * pointer events is up to the plugin (set `style: 'pointer-events: auto'`).
 *
 * **Opt-out**: a plugin that already renders its decorations through its own
 * React overlay (e.g. via `pluginOverlays` + `RenderedDomContext`) can mark
 * its `Decoration` spec with `noOverlay: true` to prevent double-painting.
 */
import { useEffect, useRef, useState } from 'react';
import { createRenderedDomContext } from '../plugin-api/RenderedDomContext';
const overlayStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    // One above SelectionOverlay (z-index: 10) so cursor name labels render above
    // the local caret. Decoration-overlay children inherit this z-index.
    zIndex: 11,
};
export function DecorationLayer({ getView, getPagesContainer, zoom, transactionVersion, syncCoordinator, }) {
    const overlayRef = useRef(null);
    const rafRef = useRef(null);
    // Bumps when layout completes a render pass. Without this, a doc-changing
    // transaction would bump `transactionVersion`, the rAF would fire while
    // layout is still updating, `isSafeToRender()` returns false, and the
    // decorations would never paint until the next user input.
    const [renderEpoch, setRenderEpoch] = useState(0);
    useEffect(() => {
        return syncCoordinator.onRender(() => setRenderEpoch((e) => e + 1));
    }, [syncCoordinator]);
    useEffect(() => {
        if (rafRef.current !== null)
            cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const view = getView();
            const pagesContainer = getPagesContainer();
            const overlay = overlayRef.current;
            if (!view || !pagesContainer || !overlay)
                return;
            if (!syncCoordinator.isSafeToRender())
                return;
            syncDecorations(view, pagesContainer, overlay, zoom);
        });
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
        // getView/getPagesContainer are stable closures over refs; syncCoordinator
        // is a useMemo([]) singleton from PagedEditor.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom, transactionVersion, renderEpoch]);
    return (_jsx("div", { ref: overlayRef, className: "paged-editor__decoration-overlay", style: overlayStyle, "aria-hidden": "true" }));
}
function syncDecorations(view, pagesContainer, overlay, zoom) {
    var _a;
    // Defer building the RenderedDomContext until we know there are decorations
    // to position — the common no-op case (no plugin emits decorations) costs
    // a single state.plugins iteration and one early return.
    const decorations = collectDecorations(view.state);
    if (decorations.length === 0) {
        if (overlay.firstChild)
            overlay.replaceChildren();
        return;
    }
    const ctx = createRenderedDomContext(pagesContainer, zoom);
    // The overlay div is a SIBLING of the pages container (both inside the
    // viewport), but `getCoordinatesForPosition` / `getRectsForRange` return
    // coords relative to the pages container itself. The pages container is
    // typically centered within the viewport, so we add its offset to every
    // decoration position before rendering.
    const offset = ctx.getContainerOffset();
    const fragment = document.createDocumentFragment();
    for (const { decoration, from, to } of decorations) {
        if (from === to) {
            // Widget decoration (anchored at one position).
            const dom = getWidgetDOM(decoration, view);
            if (!dom)
                continue;
            const coords = ctx.getCoordinatesForPosition(from);
            if (!coords)
                continue;
            const wrapper = document.createElement('div');
            wrapper.style.cssText =
                `position:absolute;left:${coords.x + offset.x}px;top:${coords.y + offset.y}px;` +
                    `height:${coords.height}px;`;
            wrapper.appendChild(dom);
            fragment.appendChild(wrapper);
            continue;
        }
        // Inline / node decoration: render one rect per line-wrap.
        const attrs = getDecorationAttrs(decoration);
        if (!attrs)
            continue;
        const rects = ctx.getRectsForRange(from, to);
        for (const rect of rects) {
            const el = document.createElement('div');
            // Forward every attr that came from the decoration spec — class, style,
            // data-*, aria-*, title, etc. Plugins wire UX through these.
            for (const [name, value] of Object.entries(attrs)) {
                if (name === 'nodeName')
                    continue; // tag name doesn't apply on an overlay div
                el.setAttribute(name, value);
            }
            const baseStyle = `position:absolute;left:${rect.x + offset.x}px;top:${rect.y + offset.y}px;` +
                `width:${rect.width}px;height:${rect.height}px;`;
            el.style.cssText = baseStyle + ((_a = attrs.style) !== null && _a !== void 0 ? _a : '');
            fragment.appendChild(el);
        }
    }
    overlay.replaceChildren(fragment);
}
function collectDecorations(state) {
    const out = [];
    for (const plugin of state.plugins) {
        const decorationsFn = plugin.props.decorations;
        if (!decorationsFn)
            continue;
        const source = decorationsFn.call(plugin, state);
        if (!source)
            continue;
        // `decorations` returns a `DecorationSource` (could be a `DecorationSet`
        // or a `DecorationGroup` of multiple sets) — `forEachSet` iterates each
        // underlying set so multiple sources aggregate cleanly.
        source.forEachSet((set) => {
            set.find().forEach((decoration) => {
                var _a;
                // Honor opt-out for plugins that already render through their own
                // overlay (e.g. TemplateHighlightOverlay).
                if ((_a = decoration.spec) === null || _a === void 0 ? void 0 : _a.noOverlay)
                    return;
                out.push({ decoration, from: decoration.from, to: decoration.to });
            });
        });
    }
    return out;
}
function getWidgetDOM(d, view) {
    const type = d.type;
    if (!type)
        return null;
    const toDOM = type.toDOM;
    if (typeof toDOM === 'function')
        return toDOM(view, () => d.from);
    if (toDOM instanceof HTMLElement)
        return toDOM.cloneNode(true);
    return null;
}
function getDecorationAttrs(d) {
    var _a;
    const type = d.type;
    return (_a = type === null || type === void 0 ? void 0 : type.attrs) !== null && _a !== void 0 ? _a : null;
}
//# sourceMappingURL=DecorationLayer.js.map