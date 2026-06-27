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
import { renderPage, renderPages, isFloatingImageRun, isTextWrappingFloatingImageRun, forceRenderAllPages, restoreVirtualization, } from './renderPage';
import { renderParagraphFragment, sliceRunsForLine, renderLine } from './renderParagraph';
import { renderFragment, FRAGMENT_CLASS_NAMES } from './renderFragment';
import { renderTableFragment, TABLE_CLASS_NAMES } from './renderTable';
import { renderImageFragment, IMAGE_CLASS_NAMES } from './renderImage';
import { renderTextBoxFragment, TEXTBOX_CLASS_NAMES } from './renderTextBox';
// Re-export render functions
export { renderPage, renderPages, renderParagraphFragment, renderTableFragment, renderImageFragment, renderFragment, sliceRunsForLine, renderLine, FRAGMENT_CLASS_NAMES, TABLE_CLASS_NAMES, IMAGE_CLASS_NAMES, renderTextBoxFragment, TEXTBOX_CLASS_NAMES, isFloatingImageRun, isTextWrappingFloatingImageRun, forceRenderAllPages, restoreVirtualization, };
// Framework-agnostic image layout helpers shared by React + Vue adapters.
export { LAYOUT_IMAGE_CLASSES, hitTestImage, captureInlinePositionEmu, deriveLayoutChoice, IMAGE_LAYOUT_OPTIONS, isImageLayoutOptionEnabled, toolbarValueToLayoutTarget, } from './imageLayout';
/**
 * Layout Painter class
 *
 * Renders Layout data to DOM with efficient reconciliation.
 * Only updates changed pages and fragments for better performance.
 */
export class LayoutPainter {
    constructor(options = {}) {
        var _a;
        this.container = null;
        this.blockLookup = new Map();
        this.pageStates = [];
        this.totalPages = 0;
        this.resolvedCommentIds = new Set();
        this.options = options;
        this.doc = (_a = options.document) !== null && _a !== void 0 ? _a : document;
    }
    /**
     * Set the block lookup map for rendering fragments
     */
    setBlockLookup(lookup) {
        this.blockLookup = lookup;
    }
    /**
     * Mount the painter to a container element
     */
    mount(container) {
        this.container = container;
        this.applyContainerStyles();
    }
    /**
     * Unmount the painter
     */
    unmount() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.container = null;
        this.pageStates = [];
    }
    /**
     * Apply styles to the container
     */
    applyContainerStyles() {
        var _a, _b;
        if (!this.container)
            return;
        const pageGap = (_a = this.options.pageGap) !== null && _a !== void 0 ? _a : 24;
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.gap = `${pageGap}px`;
        this.container.style.padding = `${pageGap}px`;
        this.container.style.backgroundColor =
            (_b = this.options.containerBackground) !== null && _b !== void 0 ? _b : 'var(--doc-bg, #f8f9fa)';
        this.container.style.minHeight = '100%';
    }
    /**
     * Paint a layout to the container
     */
    paint(layout) {
        if (!this.container) {
            throw new Error('LayoutPainter: not mounted');
        }
        const { pages } = layout;
        this.totalPages = pages.length;
        // Full repaint for now (reconciliation can be added later)
        this.container.innerHTML = '';
        this.pageStates = [];
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const context = {
                pageNumber: page.number,
                totalPages: this.totalPages,
                section: 'body',
                resolvedCommentIds: this.resolvedCommentIds,
                wordCompat: this.options.wordCompat,
            };
            const pageEl = this.renderPageWithLookup(page, context);
            this.container.appendChild(pageEl);
            this.pageStates.push({
                element: pageEl,
                pageNumber: page.number,
                fragmentCount: page.fragments.length,
            });
        }
    }
    /**
     * Render a page using block lookup for full fragment rendering
     */
    renderPageWithLookup(page, context) {
        var _a;
        const pageEl = this.doc.createElement('div');
        pageEl.className = 'layout-page';
        pageEl.dataset.pageNumber = String(page.number);
        // Apply page styles
        pageEl.style.position = 'relative';
        pageEl.style.width = `${page.size.w}px`;
        pageEl.style.height = `${page.size.h}px`;
        pageEl.style.backgroundColor = (_a = this.options.pageBackground) !== null && _a !== void 0 ? _a : '#ffffff';
        pageEl.style.overflow = 'hidden';
        if (this.options.showShadow) {
            pageEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        }
        // Create content area
        const contentEl = this.doc.createElement('div');
        contentEl.className = 'layout-page-content';
        contentEl.style.position = 'absolute';
        contentEl.style.top = `${page.margins.top}px`;
        contentEl.style.left = `${page.margins.left}px`;
        contentEl.style.right = `${page.margins.right}px`;
        contentEl.style.bottom = `${page.margins.bottom}px`;
        contentEl.style.overflow = 'visible';
        // Render fragments
        for (const fragment of page.fragments) {
            const fragmentEl = this.renderFragmentWithLookup(fragment, context);
            this.applyFragmentPosition(fragmentEl, fragment);
            contentEl.appendChild(fragmentEl);
        }
        pageEl.appendChild(contentEl);
        return pageEl;
    }
    /**
     * Render a fragment using block lookup for full content rendering
     */
    renderFragmentWithLookup(fragment, context) {
        const lookup = this.blockLookup.get(String(fragment.blockId));
        if (fragment.kind === 'paragraph' && lookup) {
            const block = lookup.block;
            const measure = lookup.measure;
            return renderParagraphFragment(fragment, block, measure, context, {
                document: this.doc,
            });
        }
        if (fragment.kind === 'table' && lookup) {
            const block = lookup.block;
            const measure = lookup.measure;
            return renderTableFragment(fragment, block, measure, context, {
                document: this.doc,
            });
        }
        if (fragment.kind === 'image' && lookup) {
            const block = lookup.block;
            const measure = lookup.measure;
            return renderImageFragment(fragment, block, measure, context, {
                document: this.doc,
            });
        }
        if (fragment.kind === 'textBox' && lookup) {
            const block = lookup.block;
            const measure = lookup.measure;
            return renderTextBoxFragment(fragment, block, measure, context, {
                document: this.doc,
            });
        }
        // Fallback to placeholder for other fragment types
        return renderFragment(fragment, context, { document: this.doc });
    }
    /**
     * Apply positioning styles to a fragment element
     */
    applyFragmentPosition(element, fragment) {
        element.style.position = 'absolute';
        element.style.left = `${fragment.x}px`;
        element.style.top = `${fragment.y}px`;
        element.style.width = `${fragment.width}px`;
        if ('height' in fragment) {
            element.style.height = `${fragment.height}px`;
        }
    }
    /**
     * Get the current page count
     */
    getPageCount() {
        return this.totalPages;
    }
    /**
     * Get a page element by index
     */
    getPageElement(index) {
        var _a, _b;
        return (_b = (_a = this.pageStates[index]) === null || _a === void 0 ? void 0 : _a.element) !== null && _b !== void 0 ? _b : null;
    }
    /**
     * Scroll to a specific page
     */
    scrollToPage(pageNumber) {
        const state = this.pageStates.find((s) => s.pageNumber === pageNumber);
        if (state === null || state === void 0 ? void 0 : state.element) {
            state.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
/**
 * Create a new LayoutPainter instance
 */
export function createPainter(options) {
    return new LayoutPainter(options);
}
//# sourceMappingURL=index.js.map