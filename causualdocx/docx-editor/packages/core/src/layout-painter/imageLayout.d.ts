/**
 * Image layout helpers shared between framework adapters (React, Vue, ...).
 *
 * Everything here is framework-agnostic: pure DOM math + pure functions over
 * OOXML wrap-type vocabulary. The corresponding UI bindings (right-click menu,
 * toolbar dropdown) live in each framework adapter and call into these.
 */
import type { ImageAttrs } from '../prosemirror/schema/nodes';
import type { ImageLayoutTarget } from '../prosemirror/extensions/nodes/ImageExtension';
import type { WrapType } from '../docx/wrapTypes';
export declare const LAYOUT_IMAGE_CLASSES: {
    /** Inline image rendered inside `.layout-line`. */
    readonly runImage: "layout-run-image";
    /** Block (centered, topAndBottom) image. */
    readonly blockImage: "layout-block-image";
    /** Anchored image rendered in the page-level floating layer. */
    readonly pageFloatingImage: "layout-page-floating-image";
    /** Anchored image rendered inside a table cell's floating layer. */
    readonly cellFloatingImage: "layout-cell-floating-image";
    readonly pageContent: "layout-page-content";
    readonly paragraph: "layout-paragraph";
};
export interface ImageHitTestResult {
    /** PM doc position of the image node, read from `data-pm-start`. */
    pos: number;
    /** The matched element — pass to `captureInlinePositionEmu` if it's inline. */
    imageEl: HTMLElement;
}
/**
 * Walk up from an event target looking for any rendered image element. Returns
 * the PM position embedded in `data-pm-start`, or null if the target isn't on
 * an image.
 */
export declare function hitTestImage(target: EventTarget | null): ImageHitTestResult | null;
/**
 * Capture the rendered position of an inline image as EMUs, normalised to
 * unzoomed coordinates. Returns horizontal offset relative to the page
 * content area (column origin) and vertical offset relative to the
 * containing paragraph — matches the OOXML attrs the resolver writes
 * (`relativeFrom: 'column'` / `relativeFrom: 'paragraph'`).
 *
 * `zoom` defaults to 1; pass the editor's current zoom factor when the
 * pages container has a CSS scale applied so `getBoundingClientRect` deltas
 * are converted back to authored-pixel space before going to EMU.
 *
 * Returns undefined for non-inline images or detached DOM.
 */
export declare function captureInlinePositionEmu(imageEl: HTMLElement, zoom?: number): {
    horizontalEmu: number;
    verticalEmu: number;
} | undefined;
/**
 * Map an image's current OOXML attrs onto the menu's choice vocabulary so the
 * menu can highlight the active option. Returns null for `topAndBottom` and
 * any unknown wrap type — those don't have a directional menu entry.
 *
 * `cssFloat` accepts both `null` and `undefined` so framework adapters can
 * use either as their "unset" sentinel without an extra normalisation step.
 */
export declare function deriveLayoutChoice(wrapType: WrapType, cssFloat?: ImageAttrs['cssFloat'] | null): ImageLayoutTarget | null;
/**
 * Hint to the framework's icon registry for which Material Symbol — or
 * equivalent — to render alongside each option. Bindings own the icon
 * component itself.
 */
export type ImageLayoutIconHint = 'inline' | 'squareLeft' | 'squareRight' | 'behind' | 'inFront';
export interface ImageLayoutOptionDef {
    /** Choice value — what gets dispatched on click. */
    choice: ImageLayoutTarget;
    /** i18n key under `imageWrap.menu.*`. */
    i18nLabelKey: string;
    /** i18n key under `imageWrap.menuDesc.*`. */
    i18nDescKey: string;
    /** Hint for the framework's icon registry. */
    iconHint: ImageLayoutIconHint;
}
/** Mirrors Word's Wrap Text menu — five directional options. */
export declare const IMAGE_LAYOUT_OPTIONS: readonly ImageLayoutOptionDef[];
/**
 * Whether a given option is enabled for an image with the given current wrap
 * type. Every option stays clickable — picking the option that matches the
 * current state is a no-op (the PM command early-returns), which matches
 * Word's behavior. We don't grey out the current option, so the menu reads
 * consistently regardless of whether the image is inline or anchored.
 *
 * The flag is kept around for forward-compatibility (e.g. future read-only
 * mode), but currently always returns true.
 */
export declare function isImageLayoutOptionEnabled(_option: ImageLayoutOptionDef, _currentWrapType: WrapType): boolean;
/**
 * Translate the legacy toolbar wrap-type vocabulary (`wrapLeft` / `wrapRight`
 * / `square` / `tight` / `through` / `topAndBottom` / `behind` / `inFront` /
 * `inline`) into a `ImageLayoutTarget` so toolbar dispatch shares the same PM
 * command path as the right-click menu.
 *
 * Returns `undefined` for unknown values; callers should treat that as
 * "no-op".
 */
export declare function toolbarValueToLayoutTarget(value: string): ImageLayoutTarget | undefined;
//# sourceMappingURL=imageLayout.d.ts.map