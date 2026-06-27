/**
 * Tab Width Calculator
 *
 * Computes tab widths based on position and tab stops.
 * Follows OOXML tab stop semantics:
 * - Default tab interval: 720 twips (0.5 inch, 48px at 96dpi)
 * - Tab stops can be start (left), end (right), center, decimal, or bar
 * - Explicit tab stops override default stops
 *
 * Based on ECMA-376 specification and clean-room understanding of tab layout.
 */
/**
 * Tab alignment types
 */
export type TabAlignment = 'start' | 'end' | 'center' | 'decimal' | 'bar' | 'clear';
/**
 * Tab leader (fill character) types
 */
export type TabLeader = 'none' | 'dot' | 'hyphen' | 'underscore' | 'middleDot' | 'heavy';
/**
 * Tab stop definition
 */
export interface TabStop {
    /** Tab alignment mode */
    val: TabAlignment;
    /** Position in twips from left margin */
    pos: number;
    /** Optional leader character */
    leader?: TabLeader;
}
/**
 * Context for tab calculations
 */
export interface TabContext {
    /** Explicit tab stops from paragraph or style */
    explicitStops?: TabStop[];
    /** Default tab interval in twips (default: 720 = 0.5 inch) */
    defaultTabInterval?: number;
    /** Left indent in twips */
    leftIndent?: number;
}
/**
 * Result of tab width calculation
 */
export interface TabWidthResult {
    /** Width of the tab in pixels */
    width: number;
    /** Leader character to render (if any) */
    leader?: TabLeader;
    /** Alignment that was applied */
    alignment: TabAlignment | 'default';
}
/** Default tab interval: 720 twips = 0.5 inch */
export declare const DEFAULT_TAB_INTERVAL_TWIPS = 720;
/** Twips per inch */
export declare const TWIPS_PER_INCH = 1440;
/** Pixels per inch (96 dpi standard for CSS) */
export declare const PIXELS_PER_INCH = 96;
/**
 * Convert twips to pixels
 * @param twips - Value in twips (1/1440 inch)
 * @returns Value in pixels (at 96 dpi)
 */
export declare function twipsToPixels(twips: number): number;
/**
 * Convert pixels to twips
 * @param pixels - Value in pixels (at 96 dpi)
 * @returns Value in twips (1/1440 inch)
 */
export declare function pixelsToTwips(pixels: number): number;
/**
 * Compute the list of effective tab stops for a paragraph
 *
 * Merges explicit stops with default stops at regular intervals.
 * Filters out stops that fall before the left indent.
 *
 * @param context - Tab context with explicit stops and settings
 * @returns Sorted array of tab stops in twips
 */
export declare function computeTabStops(context: TabContext): TabStop[];
/**
 * Calculate the width of a tab character
 *
 * Finds the next tab stop after the current position and computes
 * the width needed to reach it.
 *
 * @param currentXPx - Current horizontal position in pixels
 * @param context - Tab context with stops and settings
 * @param followingText - Text immediately after the tab (for center/end/decimal alignment)
 * @param measureText - Function to measure text width in pixels
 * @param decimalSeparator - Character used for decimal alignment (default: '.')
 * @returns Tab width result with width in pixels
 */
export declare function calculateTabWidth(currentXPx: number, context: TabContext, followingText?: string, measureText?: (text: string) => number, decimalSeparator?: string): TabWidthResult;
/**
 * Calculate tab width with simple default stops
 *
 * Simplified version for basic tab rendering without explicit stops.
 * Uses the default 0.5 inch (48px) tab interval.
 *
 * @param currentXPx - Current horizontal position in pixels
 * @returns Width of the tab in pixels
 */
export declare function calculateSimpleTabWidth(currentXPx: number): number;
//# sourceMappingURL=tabCalculator.d.ts.map