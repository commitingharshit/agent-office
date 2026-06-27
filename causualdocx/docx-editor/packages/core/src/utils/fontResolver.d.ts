/**
 * Font Family Resolver
 *
 * Maps DOCX font names to Google Fonts equivalents with proper CSS fallback stacks.
 *
 * DOCX files often use fonts that aren't freely available (Calibri, Cambria, etc.)
 * This module provides mappings to metrically-compatible Google Fonts alternatives.
 */
import type { ThemeFontScheme } from '../types';
/**
 * Result of resolving a font family
 */
export interface ResolvedFont {
    /** Google Font name to load (null if no mapping available) */
    googleFont: string | null;
    /** CSS font-family value with proper fallback stack */
    cssFallback: string;
    /** Original font name from the DOCX */
    originalFont: string;
    /** Whether this font has a Google Fonts equivalent */
    hasGoogleEquivalent: boolean;
    /** OS/2 single-line ratio: (usWinAscent + usWinDescent) / unitsPerEm (no external leading) */
    singleLineRatio: number;
}
/**
 * Font category for fallback selection
 */
type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'cursive' | 'fantasy' | 'system-ui';
/**
 * Default OS/2 single-line ratio for unmapped fonts.
 * Middle of the common range (1.07–1.27) for standard DOCX fonts.
 */
export declare const DEFAULT_SINGLE_LINE_RATIO = 1.15;
/**
 * Resolve a DOCX font name to a Google Font and CSS fallback stack
 *
 * @param docxFontName - The font name from the DOCX file
 * @returns Resolved font information
 */
export declare function resolveFontFamily(docxFontName: string): ResolvedFont;
/**
 * Resolve a theme font reference to actual font names
 *
 * @param themeRef - Theme font reference (e.g., 'majorAscii', 'minorHAnsi')
 * @param fontScheme - Theme font scheme from the DOCX
 * @returns Resolved font name or null if not found
 */
export declare function resolveThemeFont(themeRef: string, fontScheme?: ThemeFontScheme): string | null;
/**
 * Get all Google Font names needed for a list of DOCX fonts
 *
 * @param docxFonts - Array of font names from the DOCX
 * @returns Array of Google Font names to load
 */
export declare function getGoogleFontsToLoad(docxFonts: string[]): string[];
/**
 * Build a CSS font-family string from an array of font names
 *
 * @param fonts - Array of font names
 * @param category - Fallback category
 * @returns CSS font-family value
 */
export declare function buildFontFamilyString(fonts: string[], category?: FontCategory): string;
/**
 * Get the Google Font equivalent for a DOCX font (if any)
 *
 * @param docxFontName - The font name from the DOCX file
 * @returns Google Font name or null
 */
export declare function getGoogleFontEquivalent(docxFontName: string): string | null;
/**
 * Check if a font has a known Google Fonts equivalent
 *
 * @param docxFontName - The font name from the DOCX file
 * @returns true if there's a Google Fonts equivalent
 */
export declare function hasGoogleFontEquivalent(docxFontName: string): boolean;
export {};
//# sourceMappingURL=fontResolver.d.ts.map