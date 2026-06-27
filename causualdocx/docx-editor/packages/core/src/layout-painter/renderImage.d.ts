/**
 * Image Renderer
 *
 * Renders image fragments to DOM. Handles:
 * - Inline images
 * - Anchored/floating images with z-index layering
 * - Basic image sizing
 */
import type { ImageFragment, ImageBlock, ImageMeasure } from '../layout-engine/types';
import type { RenderContext } from './renderPage';
/**
 * CSS class names for image elements
 */
export declare const IMAGE_CLASS_NAMES: {
    image: string;
    imageAnchored: string;
};
/**
 * Structural shape required to apply Word's per-image visual attributes:
 * `wp:srcRect` crop fractions, `a:alphaModFix` opacity, and `wp:effectExtent`
 * reservation. `ImageRun`, `FloatingImagePaintRecord`, and `PageFloatingImage`
 * all satisfy this — no adapter needed at the call sites.
 *
 * effectExtent is intentionally NOT applied to CSS: per ECMA-376 §20.4.2.5
 * it's a hint to the wrap engine about the visual bounding box, not a request
 * to shift the picture. Applying it as `margin` would push the image (or its
 * siblings) instead of reserving space for a shadow that we don't draw. We
 * keep the values on the model so they round-trip cleanly; if a real shadow
 * effect ships later, the reservation becomes meaningful.
 */
export interface ImageVisualAttrs {
    cropTop?: number;
    cropRight?: number;
    cropBottom?: number;
    cropLeft?: number;
    opacity?: number;
}
/**
 * True when any visual attribute is set. Cheap call-site guard so the no-op
 * common case skips the function call and template-literal allocations.
 *
 * IMPORTANT: ProseMirror schema attrs default to `null`, not `undefined`,
 * and that `null` survives the `as number | undefined` cast in the layout
 * bridge. Use `!= null` rather than `!== undefined` so a default-null
 * opacity isn't read as `0` (`null < 1` is `true`, `Math.max(0, null)` is
 * `0`) — that bug hid every image behind `opacity: 0`.
 */
export declare function hasImageVisualAttrs(v: ImageVisualAttrs): boolean;
/**
 * Apply crop and opacity to an `<img>` element. Caller should gate with
 * `hasImageVisualAttrs(v)` to avoid the function call for plain images.
 */
export declare function applyImageVisualAttrs(img: HTMLImageElement, v: ImageVisualAttrs): void;
/**
 * Options for rendering an image fragment
 */
export interface RenderImageFragmentOptions {
    document?: Document;
}
/**
 * Render an image fragment to DOM
 *
 * @param fragment - The image fragment to render
 * @param block - The full image block
 * @param measure - The image measure
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The image DOM element
 */
export declare function renderImageFragment(fragment: ImageFragment, block: ImageBlock, _measure: ImageMeasure, _context: RenderContext, options?: RenderImageFragmentOptions): HTMLElement;
//# sourceMappingURL=renderImage.d.ts.map