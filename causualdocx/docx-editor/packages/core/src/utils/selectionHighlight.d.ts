/**
 * Selection Highlight Utilities
 *
 * Provides visual highlighting for text selection across multiple runs.
 * Browsers handle ::selection pseudo-element differently, especially when
 * selection spans multiple elements with different backgrounds or styling.
 *
 * This module provides:
 * - Custom selection highlight rendering
 * - Programmatic selection range marking
 * - Visual feedback for selection across runs
 */
/** Framework-agnostic CSS properties type (compatible with React.CSSProperties) */
type CSSProperties = Record<string, any>;
/**
 * Highlight rectangle representing a selected region
 */
export interface HighlightRect {
    /** Left position in pixels */
    left: number;
    /** Top position in pixels */
    top: number;
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
}
/**
 * Selection highlight configuration
 */
export interface SelectionHighlightConfig {
    /** Background color for selection */
    backgroundColor: string;
    /** Optional border color for selection */
    borderColor?: string;
    /** Optional border radius */
    borderRadius?: number;
    /** Z-index for overlay */
    zIndex?: number;
    /** Opacity for highlight */
    opacity?: number;
    /** Mix blend mode */
    mixBlendMode?: CSSProperties['mixBlendMode'];
}
/**
 * Selection range in document coordinates
 */
export interface SelectionRange {
    /** Start position */
    start: {
        paragraphIndex: number;
        contentIndex: number;
        offset: number;
    };
    /** End position */
    end: {
        paragraphIndex: number;
        contentIndex: number;
        offset: number;
    };
}
/**
 * Default selection highlight style (matches Word/Google Docs)
 */
export declare const DEFAULT_SELECTION_STYLE: SelectionHighlightConfig;
/**
 * High contrast selection style
 */
export declare const HIGH_CONTRAST_SELECTION_STYLE: SelectionHighlightConfig;
/**
 * Selection highlight CSS custom properties
 */
export declare const SELECTION_CSS_VARS: {
    readonly backgroundColor: "--docx-selection-bg";
    readonly borderColor: "--docx-selection-border";
    readonly textColor: "--docx-selection-text";
};
/**
 * Get all selection rectangles from the current DOM selection
 *
 * Uses getClientRects() to get accurate rectangles even when
 * selection spans multiple inline elements.
 */
export declare function getSelectionRects(containerElement?: HTMLElement | null): HighlightRect[];
/**
 * Merge adjacent or overlapping rectangles
 *
 * This reduces the number of highlight elements needed and creates
 * a cleaner visual appearance.
 */
export declare function mergeAdjacentRects(rects: HighlightRect[], tolerance?: number): HighlightRect[];
/**
 * Get selection rectangles with merging applied
 */
export declare function getMergedSelectionRects(containerElement?: HTMLElement | null): HighlightRect[];
/**
 * Generate CSS styles for a highlight rectangle
 */
export declare function getHighlightRectStyle(rect: HighlightRect, config?: SelectionHighlightConfig): CSSProperties;
/**
 * Generate inline CSS for selection pseudo-elements
 *
 * This is used to inject consistent selection styling
 * across all editable elements.
 */
export declare function generateSelectionCSS(selector: string, config?: SelectionHighlightConfig): string;
/**
 * Check if there is an active text selection (not collapsed)
 */
export declare function hasActiveSelection(): boolean;
/**
 * Get the selected text
 */
export declare function getSelectedText(): string;
/**
 * Check if selection is within a specific element
 */
export declare function isSelectionWithin(element: HTMLElement): boolean;
/**
 * Get the bounding rect of the current selection
 */
export declare function getSelectionBoundingRect(): DOMRect | null;
/**
 * Create a selection highlight for a specific text range
 *
 * This is useful for find/replace highlighting, AI action previews, etc.
 */
export declare function highlightTextRange(_containerElement: HTMLElement, startNode: Node, startOffset: number, endNode: Node, endOffset: number): Range | null;
/**
 * Select a text range programmatically
 */
export declare function selectRange(range: Range): void;
/**
 * Clear the current selection
 */
export declare function clearSelection(): void;
/**
 * Check if selection is backwards (focus before anchor)
 */
export declare function isSelectionBackwards(): boolean;
/**
 * Normalize selection to always be forward (start before end)
 */
export declare function normalizeSelectionDirection(): void;
/**
 * Inject selection highlight CSS into document
 */
export declare function injectSelectionStyles(config?: SelectionHighlightConfig): void;
/**
 * Remove injected selection styles
 */
export declare function removeSelectionStyles(): void;
/**
 * Check if selection styles are injected
 */
export declare function areSelectionStylesInjected(): boolean;
/**
 * Create a selection change handler that updates highlight rects
 */
export declare function createSelectionChangeHandler(containerElement: HTMLElement | null, onRectsChange: (rects: HighlightRect[]) => void, merge?: boolean): () => void;
declare const _default: {
    DEFAULT_SELECTION_STYLE: SelectionHighlightConfig;
    HIGH_CONTRAST_SELECTION_STYLE: SelectionHighlightConfig;
    getSelectionRects: typeof getSelectionRects;
    mergeAdjacentRects: typeof mergeAdjacentRects;
    getMergedSelectionRects: typeof getMergedSelectionRects;
    getHighlightRectStyle: typeof getHighlightRectStyle;
    generateSelectionCSS: typeof generateSelectionCSS;
    hasActiveSelection: typeof hasActiveSelection;
    getSelectedText: typeof getSelectedText;
    isSelectionWithin: typeof isSelectionWithin;
    getSelectionBoundingRect: typeof getSelectionBoundingRect;
    highlightTextRange: typeof highlightTextRange;
    selectRange: typeof selectRange;
    clearSelection: typeof clearSelection;
    isSelectionBackwards: typeof isSelectionBackwards;
    normalizeSelectionDirection: typeof normalizeSelectionDirection;
    injectSelectionStyles: typeof injectSelectionStyles;
    removeSelectionStyles: typeof removeSelectionStyles;
    areSelectionStylesInjected: typeof areSelectionStylesInjected;
    createSelectionChangeHandler: typeof createSelectionChangeHandler;
};
export default _default;
//# sourceMappingURL=selectionHighlight.d.ts.map