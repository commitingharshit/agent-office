/**
 * Layout Painter
 *
 * Main entry point for rendering Layout data to DOM.
 * Provides reconciliation for efficient incremental updates.
 *
 * @experimental Stable enough for the first-party React adapter, but the
 * API may change in minor releases until a third-party adapter validates
 * it. Pin a version range if you depend on this directly.
 */
import type { Layout, FlowBlock, Measure } from '../layout-engine/types';
import { renderPage, renderPages, isFloatingImageRun, isTextWrappingFloatingImageRun, forceRenderAllPages, restoreVirtualization, type RenderContext, type RenderPagesUpdateKind } from './renderPage';
import { renderParagraphFragment, sliceRunsForLine, renderLine } from './renderParagraph';
import { renderFragment, FRAGMENT_CLASS_NAMES } from './renderFragment';
import { renderTableFragment, TABLE_CLASS_NAMES } from './renderTable';
import { renderImageFragment, IMAGE_CLASS_NAMES } from './renderImage';
import { renderTextBoxFragment, TEXTBOX_CLASS_NAMES } from './renderTextBox';
export { renderPage, renderPages, renderParagraphFragment, renderTableFragment, renderImageFragment, renderFragment, sliceRunsForLine, renderLine, FRAGMENT_CLASS_NAMES, TABLE_CLASS_NAMES, IMAGE_CLASS_NAMES, renderTextBoxFragment, TEXTBOX_CLASS_NAMES, isFloatingImageRun, isTextWrappingFloatingImageRun, forceRenderAllPages, restoreVirtualization, type RenderContext, };
export type { RenderPagesUpdateKind };
export type { HeaderFooterContent, RenderPageOptions, FootnoteRenderItem } from './renderPage';
export { LAYOUT_IMAGE_CLASSES, hitTestImage, captureInlinePositionEmu, deriveLayoutChoice, IMAGE_LAYOUT_OPTIONS, isImageLayoutOptionEnabled, toolbarValueToLayoutTarget, } from './imageLayout';
export type { ImageHitTestResult, ImageLayoutIconHint, ImageLayoutOptionDef } from './imageLayout';
/**
 * Block lookup entry for painter
 */
export interface BlockLookupEntry {
    block: FlowBlock;
    measure: Measure;
    version?: string;
}
/**
 * Block lookup map type
 */
export type BlockLookup = Map<string, BlockLookupEntry>;
/**
 * Painter options
 */
export interface PainterOptions {
    /** Document to create elements in */
    document?: Document;
    /** Gap between pages in pixels */
    pageGap?: number;
    /** Show page shadows */
    showShadow?: boolean;
    /** Background color for pages */
    pageBackground?: string;
    /** Container background color */
    containerBackground?: string;
    /**
     * Word-compat (#395): draw the firstRow style's bottom border under the
     * last body row of tables that declare it but have no lastRow style or
     * tblBorders of their own. Matches Word's behavior; LibreOffice and
     * Google Docs do not draw this line. Off by default.
     */
    wordCompat?: boolean;
}
/**
 * Layout Painter class
 *
 * Renders Layout data to DOM with efficient reconciliation.
 * Only updates changed pages and fragments for better performance.
 */
export declare class LayoutPainter {
    private container;
    private blockLookup;
    private pageStates;
    private totalPages;
    private options;
    private doc;
    resolvedCommentIds: Set<number>;
    constructor(options?: PainterOptions);
    /**
     * Set the block lookup map for rendering fragments
     */
    setBlockLookup(lookup: BlockLookup): void;
    /**
     * Mount the painter to a container element
     */
    mount(container: HTMLElement): void;
    /**
     * Unmount the painter
     */
    unmount(): void;
    /**
     * Apply styles to the container
     */
    private applyContainerStyles;
    /**
     * Paint a layout to the container
     */
    paint(layout: Layout): void;
    /**
     * Render a page using block lookup for full fragment rendering
     */
    private renderPageWithLookup;
    /**
     * Render a fragment using block lookup for full content rendering
     */
    private renderFragmentWithLookup;
    /**
     * Apply positioning styles to a fragment element
     */
    private applyFragmentPosition;
    /**
     * Get the current page count
     */
    getPageCount(): number;
    /**
     * Get a page element by index
     */
    getPageElement(index: number): HTMLElement | null;
    /**
     * Scroll to a specific page
     */
    scrollToPage(pageNumber: number): void;
}
/**
 * Create a new LayoutPainter instance
 */
export declare function createPainter(options?: PainterOptions): LayoutPainter;
//# sourceMappingURL=index.d.ts.map