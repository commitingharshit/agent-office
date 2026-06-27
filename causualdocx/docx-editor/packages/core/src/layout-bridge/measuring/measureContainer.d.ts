/**
 * Measurement container for text layout
 *
 * Uses HTML5 Canvas API to measure text runs and calculate typography metrics.
 * Canvas-based measurement is more accurate and performant than DOM-based approaches.
 *
 * Typography conventions (matching Word behavior):
 * - ascent ≈ fontSize * 0.8 (baseline to top)
 * - descent ≈ fontSize * 0.2 (baseline to bottom)
 * - lineHeight from font metrics (fontBoundingBoxAscent + fontBoundingBoxDescent),
 *   falling back to fontSize * 1.0 (OOXML spec default single spacing)
 */
/**
 * Font styling properties for measurement
 */
export interface FontStyle {
    fontFamily?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    letterSpacing?: number;
}
/**
 * Typography metrics for a font
 */
export interface FontMetrics {
    fontSize: number;
    ascent: number;
    descent: number;
    lineHeight: number;
    fontFamily: string;
    /** OS/2 single-line ratio for OOXML line spacing calculation */
    singleLineRatio: number;
}
/**
 * Result of measuring a text string
 */
export interface TextMeasurement {
    width: number;
    height: number;
    ascent: number;
    descent: number;
}
/**
 * Result of measuring a run of text
 */
export interface RunMeasurement {
    width: number;
    charWidths: number[];
    metrics: FontMetrics;
}
/**
 * Get or create a canvas 2D context for text measurement
 */
export declare function getCanvasContext(): CanvasRenderingContext2D;
/**
 * Reset the canvas context (useful for testing)
 */
export declare function resetCanvasContext(): void;
/**
 * Build a CSS font string from styling properties
 *
 * Font sizes are in points and need to be converted to pixels for canvas.
 * 1pt = 96/72 px ≈ 1.333px at standard web DPI.
 *
 * Uses the font resolver to get category-appropriate fallback stacks
 * (serif fonts get serif fallbacks, sans-serif get sans-serif, etc.)
 * matching the same stacks used in rendering for consistent measurements.
 *
 * @example
 * buildFontString({ fontFamily: "Arial", fontSize: 12, bold: true })
 * // Returns: "bold 16px Arial, Arimo, Helvetica, sans-serif" (12pt = 16px)
 */
export declare function buildFontString(style: FontStyle): string;
/**
 * Get typography metrics for a given font size and family
 *
 * Uses Canvas TextMetrics API when available for precise metrics,
 * falls back to ratio-based approximations.
 */
export declare function getFontMetrics(style: FontStyle): FontMetrics;
/**
 * Measure the width of a text string with specific styling
 *
 * @param text - The text to measure
 * @param style - Font styling properties
 * @returns Width in pixels
 */
export declare function measureTextWidth(text: string, style: FontStyle): number;
/**
 * Measure text and return full metrics
 */
export declare function measureText(text: string, style: FontStyle): TextMeasurement;
/**
 * Measure a run of text and return per-character widths for click positioning
 *
 * @param text - The text to measure
 * @param style - Font styling properties
 * @returns Run measurement with width and per-character widths
 */
export declare function measureRun(text: string, style: FontStyle): RunMeasurement;
/**
 * Find the character offset at a given X position within a text run
 *
 * @param x - X position relative to run start
 * @param charWidths - Per-character widths from measureRun
 * @returns Character offset (0-based index)
 */
export declare function findCharacterAtX(x: number, charWidths: number[]): number;
/**
 * Get the X position of a character offset within a text run
 *
 * @param offset - Character offset (0-based index)
 * @param charWidths - Per-character widths from measureRun
 * @returns X position in pixels
 */
export declare function getXForCharacter(offset: number, charWidths: number[]): number;
/**
 * Convert twips to pixels
 */
export declare function twipsToPx(twips: number): number;
/**
 * Convert pixels to twips
 */
export declare function pxToTwips(px: number): number;
/**
 * Convert points to pixels
 */
export declare function ptToPx(pt: number): number;
/**
 * Convert pixels to points
 */
export declare function pxToPt(px: number): number;
/**
 * Convert OOXML half-points to pixels
 * OOXML font sizes are in half-points (24 = 12pt)
 */
export declare function halfPtToPx(halfPt: number): number;
/**
 * Convert pixels to OOXML half-points
 */
export declare function pxToHalfPt(px: number): number;
//# sourceMappingURL=measureContainer.d.ts.map