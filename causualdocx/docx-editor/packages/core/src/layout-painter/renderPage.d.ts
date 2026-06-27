/**
 * Page Renderer
 *
 * Renders a single page from Layout data to DOM elements.
 * Each page contains positioned fragments within a content area.
 */
import type { Page, FlowBlock, Measure, TableBlock, ImageRun } from '../layout-engine/types';
import type { BlockLookup } from './index';
import type { BorderSpec } from '../types/document';
import type { Theme } from '../types/document';
/**
 * Whether a floating image record reserves space in the text-wrap calculation.
 * Operates on any record that carries `wrapType`; centralises the predicate so
 * page-level and cell-level layers agree. Records reaching this predicate have
 * already passed `isFloatingImageRun`, so `wrapType=undefined` implies a `cssFloat`-driven float
 * — those wrap text by default.
 *
 * @internal
 */
export declare function floatingImageWrapsText(img: {
    wrapType?: string;
}): boolean;
/** @internal */
export declare function floatingImageIsBehindDoc(img: {
    wrapType?: string;
}): boolean;
/**
 * CSS class names for page elements
 */
export declare const PAGE_CLASS_NAMES: {
    page: string;
    content: string;
    header: string;
    footer: string;
};
/**
 * Context passed to fragment renderers
 */
export interface RenderContext {
    /** Current page number (1-indexed) */
    pageNumber: number;
    /** Total number of pages */
    totalPages: number;
    /** Which section is being rendered */
    section: 'body' | 'header' | 'footer';
    /** Content width in pixels (page width minus margins) - used for justify */
    contentWidth?: number;
    /** When true, floating images render in-flow instead of being skipped (for table cells) */
    insideTableCell?: boolean;
    /** Comment IDs that are resolved — skip highlight for these */
    resolvedCommentIds?: Set<number>;
    /**
     * How the renderer should position its outer element. The body lays
     * fragments at absolute (x, y) on the page (`'absolute'`, the default),
     * while headers/footers and text boxes flow blocks vertically and let
     * normal document flow handle placement (`'flow'`). The caller passes
     * 'flow' instead of overwriting the renderer's inline styles after the
     * fact (#379).
     */
    positioning?: 'absolute' | 'flow';
    /**
     * Word-compat opt-in (#395): when true, table renderers may apply
     * Word-specific rendering quirks that don't follow ECMA-376 strictly.
     * Currently used by renderTable.ts to extend the firstRow's bottom
     * border under the last body row when no explicit lastRow/tblBorders
     * border exists — matches Word Online's behavior; LibreOffice / Google
     * Docs do not draw this line. Default off.
     */
    wordCompat?: boolean;
}
/**
 * Header/footer content for rendering
 */
export interface HeaderFooterContent {
    /** Flow blocks for the header/footer content. */
    blocks: FlowBlock[];
    /** Measurements for the blocks. */
    measures: Measure[];
    /** Total height of the content. */
    height: number;
    /** Top-most visual extent relative to the nominal flow origin. */
    visualTop?: number;
    /** Bottom-most visual extent relative to the nominal flow origin. */
    visualBottom?: number;
}
/**
 * A single footnote item ready for rendering at page bottom.
 */
export interface FootnoteRenderItem {
    /** Display number (e.g. "1", "2") */
    displayNumber: string;
    /** Plain text content */
    text: string;
    /** Footnote id (anchors click-to-edit). */
    id?: number;
}
/**
 * Options for rendering a page
 */
export interface RenderPageOptions {
    /** Document to create elements in (default: window.document) */
    document?: Document;
    /** Custom page class name */
    pageClassName?: string;
    /** Show page borders (for debugging) */
    showBorders?: boolean;
    /** Background color for pages */
    backgroundColor?: string;
    /** Drop shadow on pages */
    showShadow?: boolean;
    /** Header content to render (used for all pages, or pages 2+ when titlePg is set). */
    headerContent?: HeaderFooterContent;
    /** Footer content to render (used for all pages, or pages 2+ when titlePg is set). */
    footerContent?: HeaderFooterContent;
    /** Header content for the first page only (when titlePg is set). */
    firstPageHeaderContent?: HeaderFooterContent;
    /** Footer content for the first page only (when titlePg is set). */
    firstPageFooterContent?: HeaderFooterContent;
    /** Whether different first page headers/footers are enabled (w:titlePg). */
    titlePg?: boolean;
    /** Distance from page top to header content. */
    headerDistance?: number;
    /** Distance from page bottom to footer content. */
    footerDistance?: number;
    /** Block lookup for rendering actual content. */
    blockLookup?: BlockLookup;
    /** OOXML page borders from section properties. */
    pageBorders?: {
        top?: BorderSpec;
        bottom?: BorderSpec;
        left?: BorderSpec;
        right?: BorderSpec;
        display?: 'allPages' | 'firstPage' | 'notFirstPage';
        offsetFrom?: 'page' | 'text';
        zOrder?: 'front' | 'back';
    };
    /**
     * OOXML line numbering from section properties (`w:lnNumType`). When set,
     * a left-margin gutter of line numbers is painted next to each body text
     * line per ECMA-376 §17.6.10.
     *
     * `start` is the number of the first line (default 1); `countBy` prints a
     * number only every Nth line (default 1 = every line); `distance` is the
     * gap from the text to the numbers in twips (default ≈ 0.25").
     *
     * Numbering currently restarts on each page. True cross-page `continuous`
     * numbering needs the paginator to thread a per-page starting line index,
     * which isn't available at the painter level yet.
     */
    lineNumbers?: {
        start?: number;
        countBy?: number;
        distance?: number;
        restart?: 'continuous' | 'newPage' | 'newSection';
    };
    /** Theme for resolving border colors. */
    theme?: Theme | null;
    /** Footnotes to render at the bottom of this page. */
    footnoteArea?: FootnoteRenderItem[];
    /** Comment IDs that are resolved — skip highlight for these */
    resolvedCommentIds?: Set<number>;
    /** Word-compat (#395). See PainterOptions.wordCompat. */
    wordCompat?: boolean;
    /**
     * Document-wide text watermark — drawn as a rotated overlay behind the
     * page's flow content. Promoted from `DocumentBody.watermark` by the host;
     * see PagedEditor.tsx for the wiring. `pointer-events: none` so it never
     * blocks clicks; `user-select: none` so it never lands in selections.
     */
    watermark?: {
        text: string;
        color?: string;
        opacity?: number;
        fontSize?: number;
        rotation?: number;
    };
}
export interface HeaderFooterLayoutInfo {
    flowTop: number;
    flowLeft: number;
    contentWidth: number;
    pageWidth: number;
    pageHeight: number;
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
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
export declare function resolveHeaderFooterFloatingTablePosition(floating: NonNullable<TableBlock['floating']>, layout: HeaderFooterLayoutInfo): {
    left: number;
    top: number;
};
/**
 * EMU to pixels conversion for floating image positioning
 */
export declare function emuToPixels(emu: number | undefined): number;
/**
 * Check if an image run is a floating image (should be positioned at page level)
 */
export declare function isFloatingImageRun(run: ImageRun): boolean;
/**
 * Check if a floating image should create text wrapping exclusion zones.
 * wrapNone images (`behind` / `inFront`) are positioned floats but do not
 * shrink line widths; text paints over or under them.
 */
export declare function isTextWrappingFloatingImageRun(run: ImageRun): boolean;
/**
 * Minimum fields the floating-image painter needs. Page-level and cell-level
 * float records both satisfy this shape.
 *
 * @internal
 */
export interface FloatingImagePaintRecord {
    src: string;
    width: number;
    height: number;
    alt?: string;
    transform?: string;
    x: number;
    y: number;
    pmStart?: number;
    pmEnd?: number;
    /** wp:srcRect crop fractions in [0, 1]. */
    cropTop?: number;
    cropRight?: number;
    cropBottom?: number;
    cropLeft?: number;
    /** a:alphaModFix → CSS opacity. */
    opacity?: number;
}
/** @internal */
export interface FloatingImagesLayerOptions {
    layerClass: string;
    itemClass: string;
    /**
     * `inset0` sizes the layer with `top/right/bottom/left = 0` (used at page level).
     * `fullSize` uses `width/height = 100%` and adds `overflow: hidden` (used inside table cells).
     */
    sizing: 'inset0' | 'fullSize';
    /** `behind` skips z-index so DOM order keeps the layer below body fragments. */
    layerMode: 'front' | 'behind';
}
/**
 * Render a layer of positioned floating images. Used at both page level and
 * inside table cells; the variant differs only in class names and sizing.
 *
 * @internal
 */
export declare function renderFloatingImagesLayer(floatingImages: FloatingImagePaintRecord[], doc: Document, options: FloatingImagesLayerOptions): HTMLElement;
/**
 * Render a single page to DOM
 *
 * @param page - The page to render
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The page DOM element
 */
export declare function renderPage(page: Page, context: RenderContext, options?: RenderPageOptions): HTMLElement;
/**
 * Render multiple pages to a container with virtualization for large documents.
 *
 * For documents with fewer than VIRTUALIZATION_THRESHOLD pages, all pages
 * are rendered eagerly. For larger documents, only pages near the visible
 * viewport are fully rendered — off-screen pages are lightweight shells
 * with correct dimensions to preserve scroll position.
 *
 * An IntersectionObserver watches page elements and populates/clears
 * content as pages scroll into and out of view.
 */
export type RenderPagesUpdateKind = 'incremental' | 'full';
export declare function renderPages(pages: Page[], container: HTMLElement, options?: RenderPageOptions & {
    pageGap?: number;
    footnotesByPage?: Map<number, FootnoteRenderItem[]>;
}): RenderPagesUpdateKind;
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
export declare function forceRenderAllPages(container: HTMLElement): void;
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
export declare function restoreVirtualization(container: HTMLElement): void;
//# sourceMappingURL=renderPage.d.ts.map