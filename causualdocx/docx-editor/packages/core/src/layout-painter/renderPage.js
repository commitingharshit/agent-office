/**
 * Page Renderer
 *
 * Renders a single page from Layout data to DOM elements.
 * Each page contains positioned fragments within a content area.
 */
import { renderFragment } from './renderFragment';
import { renderParagraphFragment } from './renderParagraph';
import { renderTableFragment } from './renderTable';
import { renderImageFragment, applyImageVisualAttrs, hasImageVisualAttrs } from './renderImage';
import { renderTextBoxFragment } from './renderTextBox';
import { resolveAnchorX, resolveAnchorY, } from '../layout-engine/anchorGeometry';
import { borderToStyle } from '../utils/formatToStyle';
import { measureParagraph } from '../layout-bridge/measuring';
import { resolveFontFamily } from '../utils/fontResolver';
import { isFloatingWrapType, isWrapNone, wrapsAroundText } from '../docx/wrapTypes';
import { pointsToPixels, twipsToPixels } from '../utils/units';
/**
 * Whether a floating image record reserves space in the text-wrap calculation.
 * Operates on any record that carries `wrapType`; centralises the predicate so
 * page-level and cell-level layers agree. Records reaching this predicate have
 * already passed `isFloatingImageRun`, so `wrapType=undefined` implies a `cssFloat`-driven float
 * — those wrap text by default.
 *
 * @internal
 */
export function floatingImageWrapsText(img) {
    return !isWrapNone(img.wrapType) && img.wrapType !== 'topAndBottom';
}
/** @internal */
export function floatingImageIsBehindDoc(img) {
    return img.wrapType === 'behind';
}
/**
 * CSS class names for page elements
 */
export const PAGE_CLASS_NAMES = {
    page: 'layout-page',
    content: 'layout-page-content',
    header: 'layout-page-header',
    footer: 'layout-page-footer',
};
/**
 * Apply page styles to an element
 */
function applyPageStyles(element, width, height, options) {
    var _a;
    element.style.position = 'relative';
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.backgroundColor = (_a = options.backgroundColor) !== null && _a !== void 0 ? _a : '#ffffff';
    element.style.overflow = 'hidden';
    // Establish a stacking context on the page so behind-doc objects (anchored
    // shapes / text-boxes painted at z-index:-1, e.g. "behind text" VML frames)
    // stay contained within the page and render ABOVE its background. Without it,
    // no ancestor forms a stacking context, so a z-index:-1 child escapes to the
    // root's negative layer and paints behind the page's opaque background —
    // making real behind-doc content (not just watermarks) silently vanish.
    element.style.isolation = 'isolate';
    // Page-level default (11pt Calibri). Must use the same chain as canvas
    // measurement in measureContainer.ts, otherwise unbreakable runs that lack
    // an explicit fontFamily can overflow the page margin (#334).
    element.style.fontFamily = resolveFontFamily('Calibri').cssFallback;
    // Use pixels to match Canvas-based measurements (11pt = 11 * 96/72 ≈ 14.67px)
    element.style.fontSize = `${(11 * 96) / 72}px`;
    element.style.color = '#000000';
    if (options.showBorders) {
        element.style.border = '1px solid #ccc';
    }
    if (options.showShadow) {
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    }
}
function pageBorderShouldRender(pageNumber, display) {
    switch (display !== null && display !== void 0 ? display : 'allPages') {
        case 'firstPage':
            return pageNumber === 1;
        case 'notFirstPage':
            return pageNumber !== 1;
        case 'allPages':
        default:
            return true;
    }
}
function pageBorderSpacePx(border) {
    return (border === null || border === void 0 ? void 0 : border.space) !== undefined ? pointsToPixels(border.space) : 0;
}
function applyPageBorderSide(element, border, side, theme) {
    if (!border || border.style === 'none' || border.style === 'nil')
        return;
    const styles = borderToStyle(border, side, theme);
    for (const [key, value] of Object.entries(styles)) {
        element.style[key] = String(value);
    }
    const styleKey = `border${side}Style`;
    const widthKey = `border${side}Width`;
    const styleValue = element.style[styleKey];
    if (styleValue === 'double') {
        const widthValue = parseFloat(element.style[widthKey]);
        if (!Number.isFinite(widthValue) || widthValue < 3) {
            element.style[widthKey] = '3px';
        }
    }
}
function renderPageBorderOverlay(page, options, doc) {
    var _a;
    const pb = options.pageBorders;
    if (!pb || !pageBorderShouldRender(page.number, pb.display))
        return null;
    const hasBorder = [pb.top, pb.bottom, pb.left, pb.right].some((border) => border && border.style !== 'none' && border.style !== 'nil');
    if (!hasBorder)
        return null;
    const offsetFrom = (_a = pb.offsetFrom) !== null && _a !== void 0 ? _a : 'text';
    const topOffset = pageBorderSpacePx(pb.top);
    const rightOffset = pageBorderSpacePx(pb.right);
    const bottomOffset = pageBorderSpacePx(pb.bottom);
    const leftOffset = pageBorderSpacePx(pb.left);
    const overlay = doc.createElement('div');
    overlay.className = 'layout-page-border';
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.boxSizing = 'border-box';
    overlay.style.zIndex = pb.zOrder === 'back' ? '0' : '20';
    if (offsetFrom === 'page') {
        overlay.style.top = `${topOffset}px`;
        overlay.style.right = `${rightOffset}px`;
        overlay.style.bottom = `${bottomOffset}px`;
        overlay.style.left = `${leftOffset}px`;
    }
    else {
        overlay.style.top = `${Math.max(0, page.margins.top - topOffset)}px`;
        overlay.style.right = `${Math.max(0, page.margins.right - rightOffset)}px`;
        overlay.style.bottom = `${Math.max(0, page.margins.bottom - bottomOffset)}px`;
        overlay.style.left = `${Math.max(0, page.margins.left - leftOffset)}px`;
    }
    applyPageBorderSide(overlay, pb.top, 'Top', options.theme);
    applyPageBorderSide(overlay, pb.bottom, 'Bottom', options.theme);
    applyPageBorderSide(overlay, pb.left, 'Left', options.theme);
    applyPageBorderSide(overlay, pb.right, 'Right', options.theme);
    return overlay;
}
/**
 * Apply content area styles to an element
 */
function applyContentAreaStyles(element, page) {
    const margins = page.margins;
    element.style.position = 'absolute';
    element.style.top = `${margins.top}px`;
    element.style.left = `${margins.left}px`;
    element.style.right = `${margins.right}px`;
    element.style.bottom = `${margins.bottom}px`;
    element.style.overflow = 'visible';
}
function getPositionAlignment(position) {
    var _a;
    return (_a = position === null || position === void 0 ? void 0 : position.align) !== null && _a !== void 0 ? _a : position === null || position === void 0 ? void 0 : position.alignment;
}
function resolveHeaderFooterFloatTop(floatImg, layout) {
    const v = floatImg.position.vertical;
    if (!v) {
        return floatImg.paragraphY;
    }
    const align = getPositionAlignment(v);
    const offsetPx = v.posOffset !== undefined ? emuToPixels(v.posOffset) : undefined;
    if (v.relativeTo === 'page') {
        if (offsetPx !== undefined) {
            return offsetPx - layout.flowTop;
        }
        if (align === 'top') {
            return -layout.flowTop;
        }
        if (align === 'bottom') {
            return layout.pageHeight - floatImg.height - layout.flowTop;
        }
        if (align === 'center') {
            return (layout.pageHeight - floatImg.height) / 2 - layout.flowTop;
        }
    }
    if (v.relativeTo === 'margin') {
        const marginTop = layout.margins.top;
        const marginHeight = layout.pageHeight - layout.margins.top - layout.margins.bottom;
        if (offsetPx !== undefined) {
            return marginTop + offsetPx - layout.flowTop;
        }
        if (align === 'top') {
            return marginTop - layout.flowTop;
        }
        if (align === 'bottom') {
            return marginTop + marginHeight - floatImg.height - layout.flowTop;
        }
        if (align === 'center') {
            return marginTop + (marginHeight - floatImg.height) / 2 - layout.flowTop;
        }
    }
    if (offsetPx !== undefined) {
        return floatImg.paragraphY + offsetPx;
    }
    return floatImg.paragraphY;
}
function applyHeaderFooterFloatHorizontalPosition(img, floatImg, layout) {
    const h = floatImg.position.horizontal;
    if (!h) {
        img.style.left = '0';
        return;
    }
    const align = getPositionAlignment(h);
    if (h.relativeTo === 'page') {
        if (h.posOffset !== undefined) {
            img.style.left = `${emuToPixels(h.posOffset) - layout.flowLeft}px`;
            return;
        }
        if (align === 'right') {
            img.style.left = `${layout.pageWidth - floatImg.width - layout.flowLeft}px`;
            return;
        }
        if (align === 'center') {
            img.style.left = `${(layout.pageWidth - floatImg.width) / 2 - layout.flowLeft}px`;
            return;
        }
        if (align === 'left') {
            img.style.left = `${-layout.flowLeft}px`;
            return;
        }
    }
    // Margin-anchored: mirrors resolveHeaderFooterFloatTop's vertical
    // 'margin' branch (lines 432-447). Mathematically reduces to
    // `emuToPixels(h.posOffset)` for the current data shape because the
    // HF construction sites all set `flowLeft = page.margins.left`, but
    // we keep the explicit form to (a) match the vertical-axis function's
    // structure and (b) stay correct if a future HF layout decouples
    // flowLeft from margins.left.
    if (h.relativeTo === 'margin') {
        const marginLeft = layout.margins.left;
        const marginWidth = layout.pageWidth - layout.margins.left - layout.margins.right;
        if (h.posOffset !== undefined) {
            img.style.left = `${marginLeft + emuToPixels(h.posOffset) - layout.flowLeft}px`;
            return;
        }
        if (align === 'right') {
            img.style.left = `${marginLeft + marginWidth - floatImg.width - layout.flowLeft}px`;
            return;
        }
        if (align === 'center') {
            img.style.left = `${marginLeft + (marginWidth - floatImg.width) / 2 - layout.flowLeft}px`;
            return;
        }
        if (align === 'left') {
            img.style.left = `${marginLeft - layout.flowLeft}px`;
            return;
        }
    }
    // Fallback for column / character / *Margin anchor types — uncommon
    // in headers/footers. Treats posOffset as container-relative; an
    // explicit branch would require knowing the column/anchor-paragraph
    // origin which the HF context doesn't carry. Better than no output.
    if (h.posOffset !== undefined) {
        img.style.left = `${emuToPixels(h.posOffset)}px`;
        return;
    }
    if (align === 'right') {
        img.style.left = `${layout.contentWidth - floatImg.width}px`;
        return;
    }
    if (align === 'center') {
        img.style.left = `${(layout.contentWidth - floatImg.width) / 2}px`;
        return;
    }
    img.style.left = '0';
}
/**
 * Resolve the (left, top) position for a floating table inside a header/
 * footer container, per ECMA-376 §17.4.57. The table's `floating.tblpX/tblpY`
 * are already in pixels (parser converted from twips); `horzAnchor`/
 * `vertAnchor` decide whether the offset is relative to the page, the
 * margins, or the surrounding text/column. Coordinates returned are
 * relative to the HF container's flow origin (`layout.flowTop` /
 * `layout.flowLeft`) so the caller can drop them straight into
 * `style.top` / `style.left`.
 */
export function resolveHeaderFooterFloatingTablePosition(floating, layout) {
    var _a, _b;
    // Vertical: tblpY relative to vertAnchor.
    let top = (_a = floating.tblpY) !== null && _a !== void 0 ? _a : 0;
    if (floating.vertAnchor === 'page') {
        top -= layout.flowTop;
    }
    else if (floating.vertAnchor === 'margin') {
        top += layout.margins.top - layout.flowTop;
    }
    // 'text' anchor (or unspecified) means offset from the surrounding
    // paragraph — for HF that's the flow cursor, but tblpY for floating
    // tables is typically authored relative to the page or margin. Treat
    // an unspecified anchor as 'text' but with zero offset → leaves top
    // at tblpY relative to container origin, which matches Word's
    // observed behavior for HF floating tables.
    // Horizontal: tblpX relative to horzAnchor.
    let left = (_b = floating.tblpX) !== null && _b !== void 0 ? _b : 0;
    if (floating.horzAnchor === 'page') {
        left -= layout.flowLeft;
    }
    else if (floating.horzAnchor === 'margin') {
        left += layout.margins.left - layout.flowLeft;
    }
    return { left, top };
}
/**
 * Apply fragment positioning styles
 * Note: Fragment x/y include page margins, but fragments are positioned
 * inside the content area which already has margin offsets applied.
 * So we subtract the margins to get content-area-relative positions.
 */
function applyFragmentStyles(element, fragment, margins) {
    element.style.position = 'absolute';
    element.style.left = `${fragment.x - margins.left}px`;
    element.style.top = `${fragment.y - margins.top}px`;
    element.style.width = `${fragment.width}px`;
    // Height handling varies by fragment type
    if ('height' in fragment) {
        element.style.height = `${fragment.height}px`;
    }
}
/**
 * EMU to pixels conversion for floating image positioning
 */
export function emuToPixels(emu) {
    if (emu === undefined)
        return 0;
    return Math.round((emu * 96) / 914400);
}
/**
 * Check if an image run is a floating image (should be positioned at page level)
 */
export function isFloatingImageRun(run) {
    if (isFloatingWrapType(run.wrapType))
        return true;
    // Or explicit float display mode (but not topAndBottom — those are block images)
    return run.displayMode === 'float';
}
/**
 * Check if a floating image should create text wrapping exclusion zones.
 * wrapNone images (`behind` / `inFront`) are positioned floats but do not
 * shrink line widths; text paints over or under them.
 */
export function isTextWrappingFloatingImageRun(run) {
    if (isWrapNone(run.wrapType) || run.wrapType === 'topAndBottom')
        return false;
    if (wrapsAroundText(run.wrapType))
        return true;
    return run.displayMode === 'float' && run.cssFloat !== 'none';
}
/**
 * Extract floating images from a paragraph block and determine their page-level positions.
 * Returns extracted images and info for the paragraph about space reserved.
 */
function extractFloatingImagesFromParagraph(block, fragmentY, // Y position of the paragraph fragment on the page (relative to content area)
contentWidth, // Width of the content area
geometry) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const floatingImages = [];
    for (const run of block.runs) {
        if (run.kind !== 'image')
            continue;
        const imgRun = run;
        if (!isFloatingImageRun(imgRun))
            continue;
        // Determine position based on image attributes
        const position = imgRun.position;
        const distTop = (_a = imgRun.distTop) !== null && _a !== void 0 ? _a : 0;
        const distBottom = (_b = imgRun.distBottom) !== null && _b !== void 0 ? _b : 0;
        const distLeft = (_c = imgRun.distLeft) !== null && _c !== void 0 ? _c : 12;
        const distRight = (_d = imgRun.distRight) !== null && _d !== void 0 ? _d : 12;
        // Determine horizontal position (left or right side). Mirror of the
        // vertical logic — `relativeFrom` decides the anchor frame, then
        // `align` (left/center/right) or `posOffset` chooses within it. Body
        // images don't have margin pages or character frames, so for the
        // `*Margin` and `character` / `line` variants we fall back to the
        // content-area frame, which matches Word's render for single-column
        // body documents.
        const geom = {
            pageWidth: (_e = geometry === null || geometry === void 0 ? void 0 : geometry.pageWidth) !== null && _e !== void 0 ? _e : 0,
            pageHeight: (_f = geometry === null || geometry === void 0 ? void 0 : geometry.pageHeight) !== null && _f !== void 0 ? _f : 0,
            marginLeft: (_g = geometry === null || geometry === void 0 ? void 0 : geometry.marginLeft) !== null && _g !== void 0 ? _g : 0,
            marginTop: (_h = geometry === null || geometry === void 0 ? void 0 : geometry.marginTop) !== null && _h !== void 0 ? _h : 0,
            contentWidth,
            contentHeight: (_j = geometry === null || geometry === void 0 ? void 0 : geometry.contentHeight) !== null && _j !== void 0 ? _j : 0,
        };
        let side = 'left';
        let x = 0;
        if (position === null || position === void 0 ? void 0 : position.horizontal) {
            const r = resolveAnchorX(position.horizontal, imgRun.width, geom);
            x = r.x;
            side = r.side;
        }
        else if (imgRun.cssFloat === 'right') {
            side = 'right';
            x = contentWidth - imgRun.width;
        }
        // Vertical position: paragraph/line bands stay in flow; page/margin bands
        // resolve against the painter's content-area coordinate space. See
        // `resolveAnchorY` (ported from this code) for the full ST_RelFromV map.
        let y = 0;
        if (position === null || position === void 0 ? void 0 : position.vertical) {
            y = resolveAnchorY(position.vertical, imgRun.height, fragmentY, geom);
        }
        else {
            // No positionV at all — default to paragraph anchor.
            y = fragmentY;
        }
        // Derive wrapText from cssFloat:
        // cssFloat='left' → image floats left → text on right → wrapText='right'
        // cssFloat='right' → image floats right → text on left → wrapText='left'
        // cssFloat='none' or undefined → wrapText='bothSides' (default)
        let wrapText = 'bothSides';
        if (imgRun.cssFloat === 'left') {
            wrapText = 'right';
        }
        else if (imgRun.cssFloat === 'right') {
            wrapText = 'left';
        }
        floatingImages.push({
            src: imgRun.src,
            width: imgRun.width,
            height: imgRun.height,
            alt: imgRun.alt,
            transform: imgRun.transform,
            side,
            x,
            y,
            distTop,
            distBottom,
            distLeft,
            distRight,
            pmStart: imgRun.pmStart,
            pmEnd: imgRun.pmEnd,
            wrapText,
            wrapType: imgRun.wrapType,
            cropTop: imgRun.cropTop,
            cropRight: imgRun.cropRight,
            cropBottom: imgRun.cropBottom,
            cropLeft: imgRun.cropLeft,
            opacity: imgRun.opacity,
        });
    }
    return floatingImages;
}
/**
 * Convert floating exclusion rectangles to per-image FloatingImageZone[]
 * for the measurement system. Each rect becomes its own zone so
 * lines at different Y positions get independently correct widths.
 *
 * wrapText controls which side(s) TEXT flows on:
 *   'right'    → text only on right → image blocks left side (leftMargin)
 *   'left'     → text only on left  → image blocks right side (rightMargin)
 *   'bothSides'→ text on right of left-side images, left of right-side images
 *   'largest'  → same as bothSides (simplified)
 *
 * topAndBottom → full-width exclusion (leftMargin = contentWidth → forces line skip)
 */
function rectsToFloatingZones(rects, contentWidth) {
    return rects.map((rect) => {
        var _a;
        const rectRight = rect.x + rect.width + rect.distRight;
        const rectTop = rect.y - rect.distTop;
        const rectBottom = rect.y + rect.height + rect.distBottom;
        let leftMargin = 0;
        let rightMargin = 0;
        const wt = (_a = rect.wrapText) !== null && _a !== void 0 ? _a : 'bothSides';
        if (wt === 'right') {
            // Text flows on RIGHT only → image blocks the left side
            leftMargin = rectRight;
        }
        else if (wt === 'left') {
            // Text flows on LEFT only → image blocks the right side
            rightMargin = contentWidth - (rect.x - rect.distLeft);
        }
        else {
            // bothSides / largest: use image position to determine which side it blocks
            if (rect.side === 'left') {
                leftMargin = rectRight;
            }
            else {
                rightMargin = contentWidth - (rect.x - rect.distLeft);
            }
        }
        return { leftMargin, rightMargin, topY: rectTop, bottomY: rectBottom };
    });
}
/**
 * Render a layer of positioned floating images. Used at both page level and
 * inside table cells; the variant differs only in class names and sizing.
 *
 * @internal
 */
export function renderFloatingImagesLayer(floatingImages, doc, options) {
    const layer = doc.createElement('div');
    layer.className = options.layerClass;
    layer.style.position = 'absolute';
    layer.style.top = '0';
    layer.style.left = '0';
    if (options.sizing === 'inset0') {
        layer.style.right = '0';
        layer.style.bottom = '0';
    }
    else {
        layer.style.width = '100%';
        layer.style.height = '100%';
        layer.style.overflow = 'hidden';
    }
    layer.style.pointerEvents = 'none';
    if (options.layerMode === 'front') {
        layer.style.zIndex = '10';
    }
    for (const floatImg of floatingImages) {
        const container = doc.createElement('div');
        container.className = options.itemClass;
        container.style.position = 'absolute';
        container.style.pointerEvents = 'auto';
        container.style.top = `${floatImg.y}px`;
        container.style.left = `${floatImg.x}px`;
        if (floatImg.pmStart !== undefined)
            container.dataset.pmStart = String(floatImg.pmStart);
        if (floatImg.pmEnd !== undefined)
            container.dataset.pmEnd = String(floatImg.pmEnd);
        const img = doc.createElement('img');
        img.src = floatImg.src;
        img.style.width = `${floatImg.width}px`;
        img.style.height = `${floatImg.height}px`;
        // Override the global `img { max-width: 100% }` reset: a floating image is
        // sized to its explicit anchor extent (and to the user's resize), so it must
        // honor that width even when it exceeds the container. Without this the width
        // is capped to the container while the height is not, distorting the image
        // (e.g. resizing a wide logo larger stretched it vertically).
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.display = 'block';
        if (floatImg.alt)
            img.alt = floatImg.alt;
        if (floatImg.transform) {
            img.style.transform = floatImg.transform;
            img.style.transformOrigin = 'center center';
        }
        if (hasImageVisualAttrs(floatImg))
            applyImageVisualAttrs(img, floatImg);
        container.appendChild(img);
        layer.appendChild(container);
    }
    return layer;
}
/**
 * Render header or footer content
 */
function renderHeaderFooterContent(content, context, options, layout) {
    var _a, _b, _c, _d, _e, _f, _g;
    const doc = (_a = options.document) !== null && _a !== void 0 ? _a : document;
    const containerEl = doc.createElement('div');
    containerEl.style.position = 'relative';
    // Use content width from context if available, otherwise default to reasonable width
    const contentWidth = (_b = context.contentWidth) !== null && _b !== void 0 ? _b : 600;
    // Collect floating images to render separately, with their paragraph's Y position
    const floatingImages = [];
    let cursorY = 0;
    for (let i = 0; i < content.blocks.length; i++) {
        const block = content.blocks[i];
        const measure = content.measures[i];
        if (!block || !measure)
            continue;
        if (block.kind === 'paragraph' && measure.kind === 'paragraph') {
            const paragraphBlock = block;
            const paragraphMeasure = measure;
            const paragraphSpacingBefore = (_e = (_d = (_c = paragraphBlock.attrs) === null || _c === void 0 ? void 0 : _c.spacing) === null || _d === void 0 ? void 0 : _d.before) !== null && _e !== void 0 ? _e : 0;
            // Track the Y position where this paragraph starts
            const paragraphStartY = cursorY;
            // Extract floating images and filter them from runs
            const inlineRuns = [];
            for (const run of paragraphBlock.runs) {
                if (run.kind === 'image' && 'position' in run && run.position) {
                    const imgRun = run;
                    floatingImages.push({
                        src: imgRun.src,
                        width: imgRun.width,
                        height: imgRun.height,
                        alt: imgRun.alt,
                        paragraphY: paragraphStartY, // Store where this paragraph starts
                        position: imgRun.position,
                    });
                }
                else {
                    // Keep non-floating runs for inline rendering
                    inlineRuns.push(run);
                }
            }
            // Create a modified paragraph block without floating images
            const inlineBlock = Object.assign(Object.assign({}, paragraphBlock), { runs: inlineRuns });
            // Create a synthetic fragment for the paragraph
            const syntheticFragment = {
                kind: 'paragraph',
                blockId: paragraphBlock.id,
                x: 0,
                y: cursorY + paragraphSpacingBefore,
                width: contentWidth,
                height: paragraphMeasure.totalHeight,
                fromLine: 0,
                toLine: paragraphMeasure.lines.length,
            };
            // Render paragraph fragment (with floating images filtered out). The
            // HF context positions blocks absolutely within its own container,
            // stacking vertically via `cursorY` — `paragraphMeasure.totalHeight`
            // already includes `spaceBefore` / `spaceAfter`. Pass `positioning:
            // 'absolute'` so the renderer applies that mode itself instead of the
            // caller having to flip its inline style after the fact (#379).
            const fragEl = renderParagraphFragment(syntheticFragment, inlineBlock, paragraphMeasure, Object.assign(Object.assign({}, context), { positioning: 'absolute' }), { document: doc });
            fragEl.style.top = `${cursorY + paragraphSpacingBefore}px`;
            fragEl.style.left = '0';
            fragEl.style.width = `${contentWidth}px`;
            containerEl.appendChild(fragEl);
            cursorY += paragraphMeasure.totalHeight;
        }
        else if (block.kind === 'table' && measure.kind === 'table') {
            // HF tables don't paginate, so the synthetic fragment covers all rows.
            const syntheticFragment = {
                kind: 'table',
                blockId: block.id,
                x: 0,
                y: cursorY,
                width: measure.totalWidth,
                height: measure.totalHeight,
                fromRow: 0,
                toRow: measure.rows.length,
                pmStart: block.pmStart,
                pmEnd: block.pmEnd,
            };
            const fragEl = renderTableFragment(syntheticFragment, block, measure, Object.assign(Object.assign({}, context), { positioning: 'absolute' }), { document: doc });
            // Floating tables (`<w:tblpPr>`) opt out of the cursorY flow. They
            // anchor at (tblpX, tblpY) relative to the page/margin/column per
            // ECMA-376 §17.4.57 and don't advance cursorY (#382). Inline tables
            // keep their cursorY-based stacking.
            if (block.floating) {
                const { left, top } = resolveHeaderFooterFloatingTablePosition(block.floating, layout);
                fragEl.style.top = `${top}px`;
                fragEl.style.left = `${left}px`;
                containerEl.appendChild(fragEl);
                // Floating tables do NOT advance cursorY — surrounding HF blocks
                // flow as if the table weren't there. Word renders text behind
                // floating tables when no wrap behavior is requested; we match.
            }
            else {
                // Inline placement: top/left stack within the HF container at cursorY.
                fragEl.style.top = `${cursorY}px`;
                fragEl.style.left = '0';
                containerEl.appendChild(fragEl);
                cursorY += measure.totalHeight;
            }
        }
        else if (block.kind === 'textBox' && measure.kind === 'textBox') {
            // HF text boxes don't paginate — synthesize a fragment covering the
            // full block. Mirrors the body painter's textBox path at the
            // fragment-handling site above. Issue #318: previously the HF
            // painter skipped textBox blocks entirely so a textbox declared
            // inside `<w:hdr>` rendered nothing.
            const tbBlock = block;
            const tbMeasure = measure;
            const a = tbBlock.anchor;
            const anchored = !!a && (a.offsetH != null || a.offsetV != null || a.relFromH != null || a.relFromV != null);
            // Anchored (floating) header/footer textboxes are positioned absolutely
            // from their page/margin offset — mapped into the header content box,
            // which is inset by margins.left with its flow-top at layout.flowTop — and
            // do NOT take flow space. In-flow stacking (the old behavior) both
            // mispositioned them (all at left:0) and inflated the header height,
            // pushing the body onto extra pages.
            let tbLeft = 0;
            let tbTop = cursorY;
            if (anchored) {
                const offH = (_f = a.offsetH) !== null && _f !== void 0 ? _f : 0;
                const offV = (_g = a.offsetV) !== null && _g !== void 0 ? _g : 0;
                tbLeft = a.relFromH === 'page' ? offH - layout.margins.left : offH;
                if (a.relFromV === 'page')
                    tbTop = offV - layout.flowTop;
                else if (a.relFromV === 'margin')
                    tbTop = layout.margins.top + offV - layout.flowTop;
                else
                    tbTop = offV;
            }
            const syntheticFragment = {
                kind: 'textBox',
                blockId: tbBlock.id,
                x: tbLeft,
                y: tbTop,
                width: tbMeasure.width,
                height: tbMeasure.height,
                isAnchored: anchored || undefined,
            };
            const fragEl = renderTextBoxFragment(syntheticFragment, tbBlock, tbMeasure, Object.assign(Object.assign({}, context), { positioning: 'absolute' }), { document: doc });
            fragEl.style.top = `${tbTop}px`;
            fragEl.style.left = `${tbLeft}px`;
            containerEl.appendChild(fragEl);
            if (!anchored)
                cursorY += tbMeasure.height;
        }
    }
    // Render floating images with absolute positioning
    for (const floatImg of floatingImages) {
        const img = doc.createElement('img');
        img.src = floatImg.src;
        img.width = floatImg.width;
        img.height = floatImg.height;
        if (floatImg.alt)
            img.alt = floatImg.alt;
        img.style.position = 'absolute';
        img.style.display = 'block';
        // Header/footer images can intentionally extend beyond the text area.
        // Override global img resets (for example max-width: 100%) so the DOCX
        // anchor extent is honored instead of shrinking to the header/footer box.
        img.style.width = `${floatImg.width}px`;
        img.style.height = `${floatImg.height}px`;
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        applyHeaderFooterFloatHorizontalPosition(img, floatImg, layout);
        img.style.top = `${resolveHeaderFooterFloatTop(floatImg, layout)}px`;
        containerEl.appendChild(img);
    }
    return containerEl;
}
/**
 * Render the footnote area at the bottom of a page.
 * Includes a separator line (33% width) and footnote entries.
 */
function renderFootnoteArea(footnotes, contentWidth, doc) {
    const container = doc.createElement('div');
    container.className = 'layout-footnote-area';
    container.style.width = `${contentWidth}px`;
    // Separator line (33% width, Google Docs style)
    const separator = doc.createElement('div');
    separator.style.width = '33%';
    separator.style.height = '0.5px';
    separator.style.backgroundColor = '#000';
    separator.style.marginBottom = '6px';
    separator.style.marginTop = '6px';
    container.appendChild(separator);
    // Render each footnote
    for (const fn of footnotes) {
        const fnEl = doc.createElement('div');
        fnEl.style.fontSize = '10px';
        fnEl.style.lineHeight = '1.3';
        fnEl.style.marginBottom = '4px';
        fnEl.style.color = '#000';
        fnEl.className = 'layout-footnote';
        if (fn.id !== undefined)
            fnEl.dataset.footnoteId = String(fn.id);
        const sup = doc.createElement('sup');
        sup.textContent = fn.displayNumber;
        sup.style.fontSize = '7px';
        sup.style.marginRight = '2px';
        fnEl.appendChild(sup);
        // Text in its own span so click-to-edit can target it (and show a hint).
        const textSpan = doc.createElement('span');
        textSpan.className = 'layout-footnote-text';
        textSpan.textContent = ' ' + fn.text;
        if (fn.id !== undefined) {
            fnEl.style.cursor = 'text';
            fnEl.title = 'Double-click to edit footnote';
        }
        fnEl.appendChild(textSpan);
        container.appendChild(fnEl);
    }
    return container;
}
/**
 * Default distance (twips) from the line-number gutter to the body text when
 * `w:lnNumType/@w:distance` is omitted. Word uses ~0.25" ≈ 360 twips; we keep a
 * small fixed gap so the numbers sit just outside the content area.
 */
const DEFAULT_LINE_NUMBER_DISTANCE_TWIPS = 180;
/**
 * Paint the left-margin line-number gutter for a page (`w:lnNumType`,
 * ECMA-376 §17.6.10). Walks each body paragraph fragment in document order,
 * tracking a running line counter, and emits a number in the left margin
 * aligned to the vertical centre of every Nth line (`countBy`).
 *
 * Coordinates are content-area-relative (the gutter is appended to the page's
 * content element). The numbers are positioned to the LEFT of the content box
 * via a negative `left`, separated by `distance`.
 *
 * Limitation: the counter restarts on each page. Continuous cross-page
 * numbering would need the paginator to assign each page a starting line
 * index, which isn't surfaced to the painter — see `RenderPageOptions.lineNumbers`.
 *
 * @internal
 */
function renderLineNumberGutter(page, options, doc) {
    var _a, _b;
    const ln = options.lineNumbers;
    if (!ln || !options.blockLookup)
        return null;
    const start = (_a = ln.start) !== null && _a !== void 0 ? _a : 1;
    const countBy = ln.countBy && ln.countBy > 0 ? ln.countBy : 1;
    const distancePx = twipsToPixels((_b = ln.distance) !== null && _b !== void 0 ? _b : DEFAULT_LINE_NUMBER_DISTANCE_TWIPS);
    const gutter = doc.createElement('div');
    gutter.className = 'layout-line-numbers';
    gutter.style.position = 'absolute';
    gutter.style.top = '0';
    gutter.style.left = '0';
    gutter.style.right = '0';
    gutter.style.bottom = '0';
    gutter.style.pointerEvents = 'none';
    gutter.style.userSelect = 'none';
    gutter.setAttribute('aria-hidden', 'true');
    // 1-based running line number across the page's body paragraphs.
    let lineCounter = 0;
    let emitted = 0;
    for (const fragment of page.fragments) {
        if (fragment.kind !== 'paragraph')
            continue;
        const blockData = options.blockLookup.get(String(fragment.blockId));
        if ((blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) !== 'paragraph' || blockData.measure.kind !== 'paragraph')
            continue;
        const measure = blockData.measure;
        // Fragment Y is page-relative; convert to content-area-relative.
        let lineTop = fragment.y - page.margins.top;
        for (let i = fragment.fromLine; i < fragment.toLine && i < measure.lines.length; i++) {
            const line = measure.lines[i];
            lineCounter += 1;
            const displayNumber = start - 1 + lineCounter;
            // Print only every Nth line (countBy); the first line (1) always prints
            // when countBy is 1, matching Word's gutter cadence.
            if (displayNumber % countBy === 0) {
                const numberEl = doc.createElement('div');
                numberEl.className = 'layout-line-number';
                numberEl.textContent = String(displayNumber);
                numberEl.style.position = 'absolute';
                // Right-align the number against the inner edge of the left margin so
                // it reads `… 5 |text`, then push it out by `distance`.
                numberEl.style.right = `calc(100% + ${distancePx}px)`;
                numberEl.style.top = `${lineTop}px`;
                numberEl.style.height = `${line.lineHeight}px`;
                numberEl.style.lineHeight = `${line.lineHeight}px`;
                numberEl.style.whiteSpace = 'nowrap';
                numberEl.style.fontSize = '9px';
                numberEl.style.color = '#000';
                numberEl.style.textAlign = 'right';
                gutter.appendChild(numberEl);
                emitted += 1;
            }
            lineTop += line.lineHeight;
        }
    }
    return emitted > 0 ? gutter : null;
}
/**
 * Render a single page to DOM
 *
 * @param page - The page to render
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The page DOM element
 */
export function renderPage(page, context, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
    const doc = (_a = options.document) !== null && _a !== void 0 ? _a : document;
    // Create page container
    const pageEl = doc.createElement('div');
    pageEl.className = (_b = options.pageClassName) !== null && _b !== void 0 ? _b : PAGE_CLASS_NAMES.page;
    pageEl.dataset.pageNumber = String(page.number);
    applyPageStyles(pageEl, page.size.w, page.size.h, options);
    // Watermark — drawn behind the content. Append before the content area so
    // it naturally sits at the lowest z-index within the page; pointer-events
    // and user-select disabled so it can't intercept clicks or selections.
    if ((_c = options.watermark) === null || _c === void 0 ? void 0 : _c.text) {
        const wm = options.watermark;
        const wmEl = doc.createElement('div');
        wmEl.className = 'layout-page-watermark';
        wmEl.setAttribute('aria-hidden', 'true');
        Object.assign(wmEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            overflow: 'hidden',
            zIndex: '0',
        });
        const text = doc.createElement('span');
        text.textContent = wm.text;
        Object.assign(text.style, {
            color: `#${(_d = wm.color) !== null && _d !== void 0 ? _d : '808080'}`,
            opacity: String((_e = wm.opacity) !== null && _e !== void 0 ? _e : 0.5),
            fontSize: `${(_f = wm.fontSize) !== null && _f !== void 0 ? _f : 96}px`,
            fontWeight: '700',
            whiteSpace: 'nowrap',
            transform: `rotate(${(_g = wm.rotation) !== null && _g !== void 0 ? _g : -45}deg)`,
            transformOrigin: 'center center',
        });
        wmEl.appendChild(text);
        pageEl.appendChild(wmEl);
    }
    const pageBorderEl = renderPageBorderOverlay(page, options, doc);
    if (pageBorderEl && ((_h = options.pageBorders) === null || _h === void 0 ? void 0 : _h.zOrder) === 'back') {
        pageEl.appendChild(pageBorderEl);
    }
    // Create content area
    const contentEl = doc.createElement('div');
    contentEl.className = PAGE_CLASS_NAMES.content;
    applyContentAreaStyles(contentEl, page);
    // Calculate content width for justify alignment
    const contentWidth = page.size.w - page.margins.left - page.margins.right;
    // PHASE 1: Extract all floating images from paragraphs on this page
    const allFloatingImages = [];
    const floatingRects = [];
    for (const fragment of page.fragments) {
        if (fragment.kind === 'paragraph' && options.blockLookup) {
            const blockData = options.blockLookup.get(String(fragment.blockId));
            if ((blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) === 'paragraph') {
                const paragraphBlock = blockData.block;
                // Fragment Y is relative to page top, we need it relative to content area
                const contentRelativeY = fragment.y - page.margins.top;
                const extracted = extractFloatingImagesFromParagraph(paragraphBlock, contentRelativeY, contentWidth, {
                    pageWidth: page.size.w,
                    pageHeight: page.size.h,
                    marginLeft: page.margins.left,
                    marginTop: page.margins.top,
                    contentWidth,
                    contentHeight: page.size.h - page.margins.top - page.margins.bottom,
                });
                allFloatingImages.push(...extracted);
                // Note: topAndBottom images are handled by measureParagraph as block images
                // (they get their own line). No exclusion zones needed for them.
            }
        }
    }
    // Collect floating image exclusion rectangles
    for (const img of allFloatingImages) {
        if (!floatingImageWrapsText(img))
            continue;
        floatingRects.push({
            side: img.side,
            x: img.x,
            y: img.y,
            width: img.width,
            height: img.height,
            distTop: img.distTop,
            distBottom: img.distBottom,
            distLeft: img.distLeft,
            distRight: img.distRight,
            wrapText: img.wrapText,
            wrapType: img.wrapType,
        });
    }
    // Collect floating table exclusion rectangles
    if (options.blockLookup) {
        for (const fragment of page.fragments) {
            if (fragment.kind !== 'table')
                continue;
            const blockData = options.blockLookup.get(String(fragment.blockId));
            if ((blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) !== 'table')
                continue;
            const tableBlock = blockData.block;
            const floating = tableBlock.floating;
            if (!floating)
                continue;
            const contentX = fragment.x - page.margins.left;
            const contentY = fragment.y - page.margins.top;
            const distTop = (_j = floating.topFromText) !== null && _j !== void 0 ? _j : 0;
            const distBottom = (_k = floating.bottomFromText) !== null && _k !== void 0 ? _k : 0;
            const distLeft = (_l = floating.leftFromText) !== null && _l !== void 0 ? _l : 12;
            const distRight = (_m = floating.rightFromText) !== null && _m !== void 0 ? _m : 12;
            const side = contentX < contentWidth / 2 ? 'left' : 'right';
            floatingRects.push({
                side,
                x: contentX,
                y: contentY,
                width: fragment.width,
                height: fragment.height,
                distTop,
                distBottom,
                distLeft,
                distRight,
            });
        }
    }
    // PHASE 2: Convert floating rects to per-image measurement zones
    const floatingZones = floatingRects.length > 0 ? rectsToFloatingZones(floatingRects, contentWidth) : [];
    // PHASE 3: Render behind-text floating images before text fragments.
    const behindFloatingImages = allFloatingImages.filter(floatingImageIsBehindDoc);
    const frontFloatingImages = allFloatingImages.filter((img) => !floatingImageIsBehindDoc(img));
    if (behindFloatingImages.length > 0) {
        const floatingLayer = renderFloatingImagesLayer(behindFloatingImages, doc, {
            layerClass: 'layout-floating-images-layer',
            itemClass: 'layout-page-floating-image',
            sizing: 'inset0',
            layerMode: 'behind',
        });
        contentEl.appendChild(floatingLayer);
    }
    // PHASE 4: Render each fragment with floating image awareness
    // Helper to peek at a fragment's paragraph borders (for border grouping)
    const getParaBorders = (frag) => {
        var _a;
        if (frag.kind !== 'paragraph' || !options.blockLookup || !frag.blockId)
            return undefined;
        const blockData = options.blockLookup.get(String(frag.blockId));
        if ((blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) === 'paragraph')
            return (_a = blockData.block.attrs) === null || _a === void 0 ? void 0 : _a.borders;
        return undefined;
    };
    let prevParagraphBorders;
    const renderedInlineImageKeysByBlock = new Map();
    for (let i = 0; i < page.fragments.length; i++) {
        const fragment = page.fragments[i];
        let fragmentEl;
        const fragmentContext = Object.assign(Object.assign({}, context), { section: 'body', contentWidth });
        // Calculate fragment's Y position relative to content area (for per-line margin calculation)
        const fragmentContentY = fragment.y - page.margins.top;
        // If we have block lookup, try to render full content based on fragment type
        if (options.blockLookup && fragment.blockId) {
            const blockData = options.blockLookup.get(String(fragment.blockId));
            if (fragment.kind === 'paragraph' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) === 'paragraph' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.measure.kind) === 'paragraph') {
                const paragraphBlock = blockData.block;
                const nextBorders = i + 1 < page.fragments.length ? getParaBorders(page.fragments[i + 1]) : undefined;
                const blockKey = String(fragment.blockId);
                let renderedInlineImageKeys = renderedInlineImageKeysByBlock.get(blockKey);
                if (!renderedInlineImageKeys) {
                    renderedInlineImageKeys = new Set();
                    renderedInlineImageKeysByBlock.set(blockKey, renderedInlineImageKeys);
                }
                // Re-measure paragraph with floating zones for text wrapping
                let paragraphMeasure = blockData.measure;
                if (floatingZones.length > 0) {
                    paragraphMeasure = measureParagraph(paragraphBlock, contentWidth, {
                        floatingZones,
                        paragraphYOffset: fragmentContentY,
                    });
                }
                fragmentEl = renderParagraphFragment(fragment, paragraphBlock, paragraphMeasure, fragmentContext, {
                    document: doc,
                    fragmentContentY: fragmentContentY,
                    prevBorders: prevParagraphBorders,
                    nextBorders,
                    renderedInlineImageKeys,
                });
                prevParagraphBorders = (_o = paragraphBlock.attrs) === null || _o === void 0 ? void 0 : _o.borders;
            }
            else if (fragment.kind === 'table' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) === 'table' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.measure.kind) === 'table') {
                fragmentEl = renderTableFragment(fragment, blockData.block, blockData.measure, fragmentContext, { document: doc });
                prevParagraphBorders = undefined;
            }
            else if (fragment.kind === 'image' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) === 'image' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.measure.kind) === 'image') {
                fragmentEl = renderImageFragment(fragment, blockData.block, blockData.measure, fragmentContext, { document: doc });
                prevParagraphBorders = undefined;
            }
            else if (fragment.kind === 'textBox' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.block.kind) === 'textBox' &&
                (blockData === null || blockData === void 0 ? void 0 : blockData.measure.kind) === 'textBox') {
                fragmentEl = renderTextBoxFragment(fragment, blockData.block, blockData.measure, fragmentContext, { document: doc });
                prevParagraphBorders = undefined;
            }
            else {
                // Fallback to placeholder
                fragmentEl = renderFragment(fragment, fragmentContext, { document: doc });
                prevParagraphBorders = undefined;
            }
        }
        else {
            // Use placeholder when no blockLookup
            fragmentEl = renderFragment(fragment, fragmentContext, { document: doc });
            prevParagraphBorders = undefined;
        }
        applyFragmentStyles(fragmentEl, fragment, { left: page.margins.left, top: page.margins.top });
        contentEl.appendChild(fragmentEl);
    }
    // Render in-front floating images after text fragments so wrapNone and
    // wrapping images paint above body text without participating in flow.
    if (frontFloatingImages.length > 0) {
        const floatingLayer = renderFloatingImagesLayer(frontFloatingImages, doc, {
            layerClass: 'layout-floating-images-layer',
            itemClass: 'layout-page-floating-image',
            sizing: 'inset0',
            layerMode: 'front',
        });
        contentEl.appendChild(floatingLayer);
    }
    // Render column separator lines between columns (when w:sep is set)
    if (page.columns && page.columns.separator && page.columns.count > 1) {
        const colCount = page.columns.count;
        const colGap = page.columns.gap;
        const colWidth = (contentWidth - (colCount - 1) * colGap) / colCount;
        const contentHeight = page.size.h - page.margins.top - page.margins.bottom;
        for (let col = 0; col < colCount - 1; col++) {
            const lineX = (col + 1) * colWidth + col * colGap + colGap / 2;
            const line = doc.createElement('div');
            line.style.position = 'absolute';
            line.style.left = `${lineX}px`;
            line.style.top = '0';
            line.style.height = `${contentHeight}px`;
            line.style.width = '0.5px';
            line.style.backgroundColor = '#000';
            line.style.pointerEvents = 'none';
            contentEl.appendChild(line);
        }
    }
    // Render footnote area at the bottom of the content area (above footer)
    if (options.footnoteArea && options.footnoteArea.length > 0) {
        const fnAreaEl = renderFootnoteArea(options.footnoteArea, contentWidth, doc);
        fnAreaEl.style.position = 'absolute';
        // Position at page bottom minus bottom margin (bottom of content area)
        // The reserved height includes separator + all footnotes
        const reservedHeight = (_p = page.footnoteReservedHeight) !== null && _p !== void 0 ? _p : 0;
        const contentAreaBottom = page.size.h - page.margins.bottom - page.margins.top;
        fnAreaEl.style.top = `${contentAreaBottom - reservedHeight}px`;
        fnAreaEl.style.left = '0';
        fnAreaEl.style.right = '0';
        contentEl.appendChild(fnAreaEl);
    }
    // Line-number gutter (w:lnNumType) — painted in the left margin alongside
    // body text. Appended to the content area so its coordinates are
    // content-area-relative; the numbers themselves spill into the left margin.
    const lineNumberGutter = renderLineNumberGutter(page, options, doc);
    if (lineNumberGutter) {
        contentEl.appendChild(lineNumberGutter);
    }
    pageEl.appendChild(contentEl);
    // Render header area (always rendered for hover hint / double-click target)
    {
        const defaultHeaderDistance = 48;
        const headerDistance = (_r = (_q = options.headerDistance) !== null && _q !== void 0 ? _q : page.margins.header) !== null && _r !== void 0 ? _r : defaultHeaderDistance;
        const headerContentWidth = page.size.w - page.margins.left - page.margins.right;
        const availableHeaderHeight = Math.max(page.margins.top - headerDistance, 48);
        const headerVisualTop = (_t = (_s = options.headerContent) === null || _s === void 0 ? void 0 : _s.visualTop) !== null && _t !== void 0 ? _t : 0;
        const headerVisualBottom = (_x = (_v = (_u = options.headerContent) === null || _u === void 0 ? void 0 : _u.visualBottom) !== null && _v !== void 0 ? _v : (_w = options.headerContent) === null || _w === void 0 ? void 0 : _w.height) !== null && _x !== void 0 ? _x : 0;
        const actualHeaderHeight = Math.max(headerVisualBottom - headerVisualTop, 24);
        // If header content fits in the original space, clip overflow; otherwise
        // margins.top was already expanded so let content show fully.
        const headerOverflows = headerVisualBottom > availableHeaderHeight;
        const headerEl = doc.createElement('div');
        headerEl.className = PAGE_CLASS_NAMES.header;
        headerEl.title = 'Double-click to edit header';
        headerEl.style.position = 'absolute';
        headerEl.style.top = `${headerDistance + headerVisualTop}px`;
        headerEl.style.left = `${page.margins.left}px`;
        headerEl.style.right = `${page.margins.right}px`;
        headerEl.style.width = `${headerContentWidth}px`;
        headerEl.style.height = `${actualHeaderHeight}px`;
        headerEl.style.minHeight = `${actualHeaderHeight}px`;
        let shouldClipHeader = !headerOverflows;
        if (options.headerContent && options.headerContent.blocks.length > 0) {
            const headerContentEl = renderHeaderFooterContent(options.headerContent, Object.assign(Object.assign({}, context), { section: 'header', contentWidth: headerContentWidth }), options, {
                flowTop: headerDistance,
                flowLeft: page.margins.left,
                contentWidth: headerContentWidth,
                pageWidth: page.size.w,
                pageHeight: page.size.h,
                margins: page.margins,
            });
            headerContentEl.style.top = `${-headerVisualTop}px`;
            // Do not clip header containers that include media. Their measured content
            // height can exclude absolutely positioned runs, which causes visible cut-off.
            if (headerContentEl.querySelector('img')) {
                shouldClipHeader = false;
            }
            headerEl.appendChild(headerContentEl);
        }
        if (shouldClipHeader) {
            headerEl.style.maxHeight = `${availableHeaderHeight}px`;
            headerEl.style.overflow = 'hidden';
        }
        pageEl.appendChild(headerEl);
    }
    // Render footer area (always rendered for hover hint / double-click target)
    {
        const defaultFooterDistance = 48;
        const footerDistance = (_z = (_y = options.footerDistance) !== null && _y !== void 0 ? _y : page.margins.footer) !== null && _z !== void 0 ? _z : defaultFooterDistance;
        const footerContentWidth = page.size.w - page.margins.left - page.margins.right;
        const availableFooterHeight = Math.max(page.margins.bottom - footerDistance, 48);
        const footerVisualTop = (_1 = (_0 = options.footerContent) === null || _0 === void 0 ? void 0 : _0.visualTop) !== null && _1 !== void 0 ? _1 : 0;
        const footerVisualBottom = (_5 = (_3 = (_2 = options.footerContent) === null || _2 === void 0 ? void 0 : _2.visualBottom) !== null && _3 !== void 0 ? _3 : (_4 = options.footerContent) === null || _4 === void 0 ? void 0 : _4.height) !== null && _5 !== void 0 ? _5 : 0;
        const actualFooterHeight = Math.max(footerVisualBottom - footerVisualTop, 24);
        const footerOverflows = actualFooterHeight > availableFooterHeight;
        const footerEl = doc.createElement('div');
        footerEl.className = PAGE_CLASS_NAMES.footer;
        footerEl.title = 'Double-click to edit footer';
        footerEl.style.position = 'absolute';
        footerEl.style.top = `${page.size.h - footerDistance - actualFooterHeight}px`;
        footerEl.style.left = `${page.margins.left}px`;
        footerEl.style.right = `${page.margins.right}px`;
        footerEl.style.width = `${footerContentWidth}px`;
        footerEl.style.height = `${actualFooterHeight}px`;
        footerEl.style.minHeight = `${actualFooterHeight}px`;
        let shouldClipFooter = !footerOverflows;
        if (options.footerContent && options.footerContent.blocks.length > 0) {
            const footerContentEl = renderHeaderFooterContent(options.footerContent, Object.assign(Object.assign({}, context), { section: 'footer', contentWidth: footerContentWidth }), options, {
                flowTop: page.size.h - footerDistance - ((_7 = (_6 = options.footerContent) === null || _6 === void 0 ? void 0 : _6.height) !== null && _7 !== void 0 ? _7 : 0),
                flowLeft: page.margins.left,
                contentWidth: footerContentWidth,
                pageWidth: page.size.w,
                pageHeight: page.size.h,
                margins: page.margins,
            });
            footerContentEl.style.top = `${-footerVisualTop}px`;
            if (footerContentEl.querySelector('img')) {
                shouldClipFooter = false;
            }
            footerEl.appendChild(footerContentEl);
        }
        if (shouldClipFooter) {
            footerEl.style.maxHeight = `${availableFooterHeight}px`;
            footerEl.style.overflow = 'hidden';
        }
        pageEl.appendChild(footerEl);
    }
    if (pageBorderEl && ((_8 = options.pageBorders) === null || _8 === void 0 ? void 0 : _8.zOrder) !== 'back') {
        pageEl.appendChild(pageBorderEl);
    }
    return pageEl;
}
/**
 * Build a RenderContext and resolved page options (with footnotes) for a page.
 * Centralises logic shared by populatePageShell, repopulatePageContent, and the eager render path.
 */
function buildPageRenderArgs(page, totalPages, options) {
    const context = {
        pageNumber: page.number,
        totalPages,
        section: 'body',
        resolvedCommentIds: options.resolvedCommentIds,
        wordCompat: options.wordCompat,
    };
    const pageOptions = Object.assign({}, options);
    // Per-page header/footer selection when titlePg is enabled
    if (options.titlePg && page.number === 1) {
        pageOptions.headerContent = options.firstPageHeaderContent;
        pageOptions.footerContent = options.firstPageFooterContent;
    }
    if (options.footnotesByPage) {
        const fns = options.footnotesByPage.get(page.number);
        if (fns && fns.length > 0) {
            pageOptions.footnoteArea =
                fns;
        }
    }
    return { context, pageOptions };
}
/**
 * Compute a fingerprint string for a page that changes when its content changes.
 * Used to detect which pages need re-rendering on incremental updates.
 */
function computePageFingerprint(page) {
    const parts = [];
    // Page-level properties
    parts.push(`s:${page.size.w},${page.size.h}`);
    parts.push(`m:${page.margins.top},${page.margins.right},${page.margins.bottom},${page.margins.left}`);
    parts.push(`n:${page.number}`);
    if (page.footnoteReservedHeight)
        parts.push(`fn:${page.footnoteReservedHeight}`);
    // Each fragment's stable properties
    for (const frag of page.fragments) {
        let fp = `${frag.kind}:${frag.blockId},${frag.x},${frag.y},${frag.width},${frag.height}`;
        if (frag.pmStart !== undefined)
            fp += `,ps:${frag.pmStart}`;
        if (frag.pmEnd !== undefined)
            fp += `,pe:${frag.pmEnd}`;
        if (frag.kind === 'paragraph') {
            fp += `,fl:${frag.fromLine},tl:${frag.toLine}`;
        }
        else if (frag.kind === 'table') {
            fp += `,fr:${frag.fromRow},tr:${frag.toRow}`;
        }
        parts.push(fp);
    }
    return parts.join('|');
}
/**
 * Compute a hash for render options that affect all pages globally.
 * When this changes, all pages need a full re-render.
 */
function computeOptionsHash(options) {
    var _a, _b, _c, _d, _e;
    const parts = [];
    // Header/footer content changes affect all pages
    if (options.headerContent) {
        parts.push(`hdr:${options.headerContent.blocks.length},${options.headerContent.height},${(_a = options.headerContent.visualTop) !== null && _a !== void 0 ? _a : 0},${(_b = options.headerContent.visualBottom) !== null && _b !== void 0 ? _b : options.headerContent.height}`);
    }
    if (options.footerContent) {
        parts.push(`ftr:${options.footerContent.blocks.length},${options.footerContent.height},${(_c = options.footerContent.visualTop) !== null && _c !== void 0 ? _c : 0},${(_d = options.footerContent.visualBottom) !== null && _d !== void 0 ? _d : options.footerContent.height}`);
    }
    if (options.firstPageHeaderContent) {
        parts.push(`fp-hdr:${options.firstPageHeaderContent.blocks.length},${options.firstPageHeaderContent.height}`);
    }
    if (options.firstPageFooterContent) {
        parts.push(`fp-ftr:${options.firstPageFooterContent.blocks.length},${options.firstPageFooterContent.height}`);
    }
    if (options.titlePg)
        parts.push('titlePg');
    // Theme changes
    if (options.theme) {
        parts.push(`thm:${(_e = options.theme.name) !== null && _e !== void 0 ? _e : 'default'}`);
    }
    // Page border changes
    if (options.pageBorders) {
        parts.push(`pb:${JSON.stringify(options.pageBorders)}`);
    }
    // Line numbering changes
    if (options.lineNumbers) {
        parts.push(`ln:${JSON.stringify(options.lineNumbers)}`);
    }
    // Header/footer distances
    if (options.headerDistance !== undefined)
        parts.push(`hd:${options.headerDistance}`);
    if (options.footerDistance !== undefined)
        parts.push(`fd:${options.footerDistance}`);
    return parts.join('|');
}
/**
 * Apply standard container styles for the pages wrapper.
 */
function applyContainerStyles(container, pageGap) {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = `${pageGap}px`;
    container.style.padding = `${pageGap}px`;
    container.style.backgroundColor = 'var(--doc-bg, #f8f9fa)';
}
/**
 * Number of pages to render above and below the visible area.
 * Keeps nearby pages ready for smooth scrolling.
 */
const VIRTUALIZATION_BUFFER = 2;
/**
 * Minimum page count before virtualization kicks in.
 * Small documents render all pages eagerly for simplicity.
 */
const VIRTUALIZATION_THRESHOLD = 8;
export function renderPages(pages, container, options = {}) {
    var _a, _b, _c, _d, _e;
    const totalPages = pages.length;
    const pageGap = (_a = options.pageGap) !== null && _a !== void 0 ? _a : 24;
    const pc = container;
    const prevState = pc.__pageRenderState;
    const currentOptionsHash = computeOptionsHash(options);
    const useVirtualization = totalPages >= VIRTUALIZATION_THRESHOLD;
    // Determine if we can do an incremental update
    const canIncremental = prevState && prevState.optionsHash === currentOptionsHash && useVirtualization;
    if (canIncremental) {
        // --- INCREMENTAL UPDATE PATH ---
        const prevShells = prevState.pageStates;
        const prevDataMap = prevState.pageDataMap;
        const observer = pc.__pageObserver;
        // Compute new fingerprints
        const newFingerprints = [];
        for (const page of pages) {
            newFingerprints.push(computePageFingerprint(page));
        }
        // If total page count changed, NUMPAGES fields in headers/footers are stale.
        // Force re-render of all currently-rendered pages.
        const totalPagesChanged = prevState.totalPages !== totalPages;
        // Update existing pages
        const commonCount = Math.min(prevShells.length, pages.length);
        for (let i = 0; i < commonCount; i++) {
            const prev = prevShells[i];
            const newFp = newFingerprints[i];
            if (prev.fingerprint === newFp && !totalPagesChanged) {
                // Page unchanged — update data map with new page data (references may differ)
                const data = prevDataMap.get(prev.element);
                if (data) {
                    data.page = pages[i];
                }
                continue;
            }
            // Page changed — update the shell
            const shell = prev.element;
            const data = prevDataMap.get(shell);
            // Update data map entry
            if (data) {
                data.page = pages[i];
                if (data.rendered) {
                    // Surgically replace only the content area, preserving header/footer
                    repopulatePageContent(shell, prevDataMap, totalPages, options);
                }
                // If not rendered, it will be populated when it scrolls into view
            }
            // Update fingerprint
            prev.fingerprint = newFp;
            // Update page styles in case size changed
            applyPageStyles(shell, pages[i].size.w, pages[i].size.h, options);
            shell.dataset.pageNumber = String(pages[i].number);
        }
        // Handle new pages (document grew)
        if (pages.length > prevShells.length) {
            const doc = (_b = options.document) !== null && _b !== void 0 ? _b : document;
            for (let i = prevShells.length; i < pages.length; i++) {
                const page = pages[i];
                const pageEl = doc.createElement('div');
                pageEl.className = (_c = options.pageClassName) !== null && _c !== void 0 ? _c : PAGE_CLASS_NAMES.page;
                pageEl.dataset.pageNumber = String(page.number);
                pageEl.dataset.pageIndex = String(i);
                applyPageStyles(pageEl, page.size.w, page.size.h, options);
                container.appendChild(pageEl);
                prevShells.push({ element: pageEl, fingerprint: newFingerprints[i] });
                prevDataMap.set(pageEl, { page, index: i, rendered: false });
                if (observer) {
                    observer.observe(pageEl);
                }
            }
        }
        // Handle removed pages (document shrank)
        if (pages.length < prevShells.length) {
            for (let i = prevShells.length - 1; i >= pages.length; i--) {
                const shell = prevShells[i].element;
                if (observer) {
                    observer.unobserve(shell);
                }
                prevDataMap.delete(shell);
                container.removeChild(shell);
            }
            prevShells.length = pages.length;
        }
        // Update indices in data map (they may have shifted)
        for (let i = 0; i < prevShells.length; i++) {
            const data = prevDataMap.get(prevShells[i].element);
            if (data) {
                data.index = i;
            }
        }
        // Update stored state with fresh options (blockLookup, footnotes, etc.)
        prevState.totalPages = totalPages;
        prevState.currentOptions = options;
        return 'incremental';
    }
    // --- FULL REBUILD PATH ---
    // Disconnect any previous observer
    const prevObserver = pc.__pageObserver;
    if (prevObserver) {
        prevObserver.disconnect();
        pc.__pageObserver = undefined;
    }
    // Clear existing content
    container.innerHTML = '';
    pc.__pageRenderState = undefined;
    applyContainerStyles(container, pageGap);
    // Build all page shells
    const pageShells = [];
    const fingerprints = [];
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        fingerprints.push(computePageFingerprint(page));
        if (!useVirtualization) {
            // Small document: render all pages eagerly
            const { context, pageOptions } = buildPageRenderArgs(page, totalPages, options);
            const pageEl = renderPage(page, context, pageOptions);
            container.appendChild(pageEl);
            pageShells.push(pageEl);
        }
        else {
            // Large document: create lightweight shell with correct dimensions
            const doc = (_d = options.document) !== null && _d !== void 0 ? _d : document;
            const pageEl = doc.createElement('div');
            pageEl.className = (_e = options.pageClassName) !== null && _e !== void 0 ? _e : PAGE_CLASS_NAMES.page;
            pageEl.dataset.pageNumber = String(page.number);
            pageEl.dataset.pageIndex = String(i);
            applyPageStyles(pageEl, page.size.w, page.size.h, options);
            container.appendChild(pageEl);
            pageShells.push(pageEl);
        }
    }
    if (!useVirtualization) {
        // Store state for potential future incremental updates (won't be used
        // since small docs skip the incremental path, but keeps data consistent)
        return 'full';
    }
    // --- Virtualization via IntersectionObserver ---
    // Store page data for lazy rendering
    const pageDataMap = new Map();
    for (let i = 0; i < pages.length; i++) {
        pageDataMap.set(pageShells[i], { page: pages[i], index: i, rendered: false });
    }
    // Use the browser viewport as intersection root.
    // The observer reads from pc.__pageRenderState so it always uses
    // the latest options/totalPages (updated by the incremental path).
    const observer = new IntersectionObserver((entries) => {
        const renderState = pc.__pageRenderState;
        if (!renderState)
            return;
        const { currentOptions: liveOptions, totalPages: liveTotalPages, pageDataMap: liveDataMap, } = renderState;
        for (const entry of entries) {
            const shell = entry.target;
            const data = liveDataMap.get(shell);
            if (!data)
                continue;
            if (entry.isIntersecting) {
                // Page is near viewport — render it and neighbors
                populatePageShell(shell, liveDataMap, liveTotalPages, liveOptions);
                // Also render buffer pages above and below
                for (let offset = -VIRTUALIZATION_BUFFER; offset <= VIRTUALIZATION_BUFFER; offset++) {
                    const neighborIdx = data.index + offset;
                    if (neighborIdx >= 0 &&
                        neighborIdx < renderState.pageStates.length &&
                        neighborIdx !== data.index) {
                        populatePageShell(renderState.pageStates[neighborIdx].element, liveDataMap, liveTotalPages, liveOptions);
                    }
                }
            }
        }
        // Sweep: depopulate pages far from any currently-visible page.
        const viewportHeight = window.innerHeight;
        const nearThreshold = viewportHeight * 3;
        const nearIndices = new Set();
        for (const [el, data] of liveDataMap) {
            if (!data.rendered)
                continue;
            const rect = el.getBoundingClientRect();
            if (rect.bottom > -nearThreshold && rect.top < viewportHeight + nearThreshold) {
                nearIndices.add(data.index);
            }
        }
        for (const [el, data] of liveDataMap) {
            if (!data.rendered)
                continue;
            let keepRendered = false;
            for (const nearIdx of nearIndices) {
                if (Math.abs(data.index - nearIdx) <= VIRTUALIZATION_BUFFER + 1) {
                    keepRendered = true;
                    break;
                }
            }
            if (!keepRendered && nearIndices.size > 0) {
                depopulatePageShell(el, liveDataMap);
            }
        }
    }, {
        root: null,
        rootMargin: '1500px 0px 1500px 0px',
    });
    // Observe all page shells
    for (const shell of pageShells) {
        observer.observe(shell);
    }
    // Store observer and render state on the container BEFORE eager rendering,
    // so the populatePageShell calls below can find state if needed.
    pc.__pageObserver = observer;
    pc.__pageRenderState = {
        pageStates: pageShells.map((el, i) => ({ element: el, fingerprint: fingerprints[i] })),
        totalPages,
        optionsHash: currentOptionsHash,
        pageDataMap,
        currentOptions: options,
    };
    // Eagerly render the first few pages so the initial view isn't blank
    const initialRenderCount = Math.min(pages.length, VIRTUALIZATION_BUFFER + 3);
    for (let i = 0; i < initialRenderCount; i++) {
        populatePageShell(pageShells[i], pageDataMap, totalPages, options);
    }
    return 'full';
}
/**
 * Populate a page shell with full rendered content.
 */
function populatePageShell(shell, pageDataMap, totalPages, options) {
    const data = pageDataMap.get(shell);
    if (!data || data.rendered)
        return;
    const { context, pageOptions } = buildPageRenderArgs(data.page, totalPages, options);
    const fullPageEl = renderPage(data.page, context, pageOptions);
    while (fullPageEl.firstChild) {
        shell.appendChild(fullPageEl.firstChild);
    }
    data.rendered = true;
}
/**
 * Surgically replace only the content area of a rendered page shell.
 * Preserves header/footer elements to avoid blinking.
 */
function repopulatePageContent(shell, pageDataMap, totalPages, options) {
    const data = pageDataMap.get(shell);
    if (!data)
        return;
    const { context, pageOptions } = buildPageRenderArgs(data.page, totalPages, options);
    // Render a full page off-screen
    const fullPageEl = renderPage(data.page, context, pageOptions);
    // Extract the new content area from the rendered page
    const newContentEl = fullPageEl.querySelector(`.${PAGE_CLASS_NAMES.content}`);
    const oldContentEl = shell.querySelector(`.${PAGE_CLASS_NAMES.content}`);
    if (newContentEl && oldContentEl) {
        // Replace only the content area — header/footer stay untouched
        shell.replaceChild(newContentEl, oldContentEl);
    }
    else {
        // Fallback: full replace if structure doesn't match
        shell.innerHTML = '';
        data.rendered = false;
        populatePageShell(shell, pageDataMap, totalPages, options);
    }
}
/**
 * Clear a page shell's content (keep shell dimensions for scroll).
 */
function depopulatePageShell(shell, pageDataMap) {
    const data = pageDataMap.get(shell);
    if (!data || !data.rendered)
        return;
    shell.innerHTML = '';
    data.rendered = false;
}
/**
 * Force-render all virtualized page shells so that cloneNode(true) captures
 * every page's content — not just the pages near the viewport.
 *
 * Call this immediately before cloning the `.paged-editor__pages` container
 * for print/PDF export (issue #141). For documents with fewer than
 * VIRTUALIZATION_THRESHOLD pages, all pages are already rendered eagerly and
 * this is a no-op.
 *
 * After the clone is done, call `restoreVirtualization()` in a
 * `requestAnimationFrame` to free the temporarily-rendered pages.
 */
export function forceRenderAllPages(container) {
    const pc = container;
    const state = pc.__pageRenderState;
    if (!state)
        return; // Not virtualized — all pages already rendered.
    const { pageDataMap, totalPages, currentOptions } = state;
    for (const [shell, data] of pageDataMap) {
        if (!data.rendered) {
            populatePageShell(shell, pageDataMap, totalPages, currentOptions);
        }
    }
}
/**
 * Restore memory-efficient virtualization after a print/PDF clone.
 *
 * Depopulates pages whose index is farther from the viewport center than
 * VIRTUALIZATION_BUFFER + 1. Pages within the buffer stay rendered so the
 * editor remains responsive immediately after print completes.
 *
 * This is a best-effort cleanup; skipping it is safe (just wastes RAM until
 * the next IntersectionObserver tick depopulates far pages automatically).
 */
export function restoreVirtualization(container) {
    var _a;
    const pc = container;
    const state = pc.__pageRenderState;
    if (!state)
        return;
    const { pageDataMap } = state;
    // Find the currently-visible center page by looking for a rendered shell
    // near the scroll mid-point.
    const scrollable = (_a = container.parentElement) !== null && _a !== void 0 ? _a : container;
    const viewportTop = scrollable.scrollTop;
    const viewportBottom = viewportTop + scrollable.clientHeight;
    const viewportMid = (viewportTop + viewportBottom) / 2;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (const [shell, data] of pageDataMap) {
        const shellMid = shell.offsetTop + shell.offsetHeight / 2;
        const dist = Math.abs(shellMid - viewportMid);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = data.index;
        }
    }
    for (const [shell, data] of pageDataMap) {
        if (Math.abs(data.index - nearestIdx) > VIRTUALIZATION_BUFFER + 1) {
            depopulatePageShell(shell, pageDataMap);
        }
    }
}
//# sourceMappingURL=renderPage.js.map