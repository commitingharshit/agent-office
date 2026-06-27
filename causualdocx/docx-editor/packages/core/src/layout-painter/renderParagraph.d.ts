/**
 * Paragraph Fragment Renderer
 *
 * Renders paragraph fragments with lines and text runs to DOM.
 * Handles text formatting, alignment, and positioning.
 */
import type { ParagraphBlock, ParagraphMeasure, ParagraphFragment, ParagraphBorders, MeasuredLine, Run, TabRun, ImageRun, TabStop } from '../layout-engine/types';
import { type RenderContext } from './renderPage';
/**
 * CSS class names for paragraph rendering
 */
export declare const PARAGRAPH_CLASS_NAMES: {
    fragment: string;
    line: string;
    run: string;
    text: string;
    tab: string;
    image: string;
    lineBreak: string;
};
/**
 * Options for rendering a paragraph
 */
export interface RenderParagraphOptions {
    /** Document to create elements in */
    document?: Document;
    /** Fragment's Y position relative to content area (for per-line margin calculation) */
    fragmentContentY?: number;
    /** Borders from the previous adjacent paragraph (for border grouping) */
    prevBorders?: ParagraphBorders;
    /** Borders from the next adjacent paragraph (for border grouping) */
    nextBorders?: ParagraphBorders;
    /** Inline image runs already rendered for this paragraph block */
    renderedInlineImageKeys?: Set<string>;
}
/**
 * Render a tab run with calculated width.
 *
 * Tab leaders (TOCs etc.) used to span the *full* width of the tab
 * span — including the gutter touching the runs on either side. Glyphs
 * like `.` or `-` would butt against the section title on the left
 * and the page number on the right (openspec `tab-leader-fidelity`).
 *
 * Fix:
 *   - Small horizontal padding inside the tab span keeps the leader
 *     glyphs clear of adjacent runs.
 *   - `background-clip: content-box` so the repeating-glyph pattern
 *     respects that padding rather than rendering across it.
 *   - For solid-line leaders (underscore / heavy) use a CSS border-
 *     bottom instead of the `_` character — the character has gaps
 *     between repeats that look like a dotted line.
 */
/** @internal — exported for unit tests in `__tests__/tab-leader.test.ts`. */
export declare function renderTabRun(run: TabRun, doc: Document, width: number, leader?: string): HTMLElement;
/**
 * Render an inline image run (flows with text).
 * @internal exported for unit tests in `__tests__/tiff-placeholder.test.ts`.
 */
export declare function renderInlineImageRun(run: ImageRun, doc: Document): HTMLElement;
/**
 * Slice runs for a specific line
 *
 * @param block - The paragraph block
 * @param line - The line measurement
 * @returns Array of runs for this line
 */
export declare function sliceRunsForLine(block: ParagraphBlock, line: MeasuredLine): Run[];
/**
 * Options for rendering a line with justify support
 */
interface RenderLineOptions {
    /** Available width for the line (content area width minus indentation) */
    availableWidth: number;
    /** Whether this is the last line of the paragraph */
    isLastLine: boolean;
    /** Whether this is the first line of the paragraph */
    isFirstLine: boolean;
    /** Whether the paragraph ends with a line break */
    paragraphEndsWithLineBreak: boolean;
    /** Tab stops from paragraph attributes */
    tabStops?: TabStop[];
    /** Render context for field substitution */
    context?: RenderContext;
    /** Left indent in pixels */
    leftIndentPx?: number;
    /** First line indent in pixels (positive) or hanging indent (negative) */
    firstLineIndentPx?: number;
    /** Line-specific floating image margins (calculated per-line based on Y overlap) */
    floatingMargins?: {
        leftMargin: number;
        rightMargin: number;
    };
    /** Track inline image runs already rendered in this paragraph fragment to prevent duplicates */
    renderedInlineImageKeys?: Set<string>;
}
/**
 * Render a single line
 *
 * @param block - The paragraph block
 * @param line - The line measurement
 * @param alignment - Text alignment
 * @param doc - Document to create elements in
 * @param options - Additional options for justify calculation
 * @returns The line DOM element
 */
export declare function renderLine(block: ParagraphBlock, line: MeasuredLine, alignment: 'left' | 'center' | 'right' | 'justify' | undefined, doc: Document, options?: RenderLineOptions): HTMLElement;
/**
 * Render a paragraph fragment
 *
 * @param fragment - The fragment to render
 * @param block - The paragraph block
 * @param measure - The paragraph measurement
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The fragment DOM element
 */
export declare function renderParagraphFragment(fragment: ParagraphFragment, block: ParagraphBlock, measure: ParagraphMeasure, context: RenderContext, options?: RenderParagraphOptions): HTMLElement;
export {};
//# sourceMappingURL=renderParagraph.d.ts.map