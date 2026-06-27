/**
 * Color Resolver - Convert OOXML colors to CSS
 *
 * Handles:
 * - Theme color references (accent1, dk1, etc.)
 * - RGB hex values
 * - "auto" colors (context-dependent)
 * - Tint/shade modifications
 *
 * OOXML Color References:
 * - w:color/@w:val - RGB hex or "auto"
 * - w:color/@w:themeColor - Theme color slot
 * - w:color/@w:themeTint - Tint modifier (0-255, hex)
 * - w:color/@w:themeShade - Shade modifier (0-255, hex)
 *
 * Tint/Shade Calculations:
 * - Tint makes color lighter (blend with white)
 * - Shade makes color darker (blend with black)
 * - Value is in hex (00-FF), converted to 0-1 for calculation
 */
import type { ColorValue, Theme, ThemeColorSlot, ThemeColorScheme } from '../types/document';
/**
 * Resolve a ColorValue to a CSS color string
 *
 * @param color - ColorValue object with rgb, themeColor, tint/shade, or auto
 * @param theme - Theme for resolving theme colors
 * @param defaultColor - Default color if auto or undefined (default: black)
 * @returns CSS color string (e.g., "#FF0000" or "inherit")
 */
export declare function resolveColor(color: ColorValue | undefined | null, theme: Theme | null | undefined, defaultColor?: string): string;
/**
 * Resolve any ColorValue (text, fill/shading, border, underline) to a 6-char
 * uppercase hex string — or `undefined` if transparent/unset/unresolvable.
 *
 * Shared display-side resolver. Prefer this over reading `.rgb` directly so
 * that `themeColor` + `themeTint`/`themeShade` are honored consistently across
 * all render paths (PM attrs, layout-bridge, clipboard HTML, toolbar swatches).
 *
 * When a themed color is present but `theme` is null/undefined, falls back to
 * `color.rgb` if Word wrote one for compat; otherwise returns `undefined`.
 *
 * @returns 6-char uppercase hex without `#`, or `undefined`.
 */
export declare function resolveColorToHex(color: ColorValue | undefined | null, theme: Theme | null | undefined): string | undefined;
/**
 * Resolve a highlight color name to CSS
 *
 * @param highlight - Highlight color name (e.g., "yellow", "cyan")
 * @returns CSS color string or empty string for "none"
 */
export declare function resolveHighlightColor(highlight: string | undefined): string;
/**
 * Resolve a shading fill or pattern color to CSS
 *
 * @param color - ColorValue for fill
 * @param theme - Theme for resolving theme colors
 * @returns CSS color string
 */
export declare function resolveShadingColor(color: ColorValue | undefined | null, theme: Theme | null | undefined): string;
/**
 * Check if a color is effectively black
 *
 * @param color - ColorValue object
 * @param theme - Theme for resolving theme colors
 * @returns True if color resolves to black or very dark
 */
export declare function isBlack(color: ColorValue | undefined | null, theme: Theme | null | undefined): boolean;
/**
 * Check if a color is effectively white
 *
 * @param color - ColorValue object
 * @param theme - Theme for resolving theme colors
 * @returns True if color resolves to white or very light
 */
export declare function isWhite(color: ColorValue | undefined | null, theme: Theme | null | undefined): boolean;
/**
 * Get contrasting text color for a background
 *
 * @param backgroundColor - Background ColorValue
 * @param theme - Theme for resolving theme colors
 * @returns Black or white hex color for best contrast
 */
export declare function getContrastingColor(backgroundColor: ColorValue | undefined | null, theme: Theme | null | undefined): string;
/**
 * Parse a color string (various formats) to ColorValue
 *
 * @param colorString - Color string like "FF0000", "auto", or theme color name
 * @returns ColorValue object
 */
export declare function parseColorString(colorString: string | undefined): ColorValue | undefined;
/**
 * Create a ColorValue from theme color reference
 *
 * @param themeColor - Theme color slot name
 * @param tint - Optional tint modifier
 * @param shade - Optional shade modifier
 * @returns ColorValue object
 */
export declare function createThemeColor(themeColor: ThemeColorSlot, tint?: number, shade?: number): ColorValue;
/**
 * Create a ColorValue from RGB hex
 *
 * @param hex - 6-character hex color (no #)
 * @returns ColorValue object
 */
export declare function createRgbColor(hex: string): ColorValue;
/**
 * Darken a color by a percentage
 *
 * @param color - ColorValue to darken
 * @param theme - Theme for resolving
 * @param percent - Percentage to darken (0-100)
 * @returns CSS color string
 */
export declare function darkenColor(color: ColorValue | undefined | null, theme: Theme | null | undefined, percent: number): string;
/**
 * Lighten a color by a percentage
 *
 * @param color - ColorValue to lighten
 * @param theme - Theme for resolving
 * @param percent - Percentage to lighten (0-100)
 * @returns CSS color string
 */
export declare function lightenColor(color: ColorValue | undefined | null, theme: Theme | null | undefined, percent: number): string;
/**
 * Blend two colors together
 *
 * @param color1 - First color
 * @param color2 - Second color
 * @param ratio - Blend ratio (0 = all color1, 1 = all color2)
 * @param theme - Theme for resolving
 * @returns CSS color string
 */
export declare function blendColors(color1: ColorValue | undefined | null, color2: ColorValue | undefined | null, ratio: number, theme: Theme | null | undefined): string;
/**
 * Ensure a hex color string has a '#' prefix.
 */
export declare function ensureHexPrefix(hex: string): string;
/**
 * Resolve a highlight color value to a CSS-ready string.
 * Tries OOXML named highlight first, then ensures hex prefix.
 */
export declare function resolveHighlightToCss(value: string): string;
/**
 * Theme color matrix cell
 */
export interface ThemeMatrixCell {
    /** Resolved hex color (6 chars, no #) */
    hex: string;
    /** Theme color slot */
    themeSlot: ThemeColorSlot;
    /** Tint hex modifier if applicable (e.g., "CC") */
    tint?: string;
    /** Shade hex modifier if applicable (e.g., "BF") */
    shade?: string;
    /** Human-readable label (e.g., "Accent 1, Lighter 60%") */
    label: string;
}
/**
 * Compute a single tinted or shaded hex color from a base color.
 *
 * @param baseHex - 6-character hex color (no #)
 * @param type - 'tint' to lighten, 'shade' to darken
 * @param fraction - Amount (0-1). For tint: 0=no change, 1=white. For shade: 0=black, 1=no change.
 * @returns 6-character hex color (no #)
 */
export declare function getThemeTintShadeHex(baseHex: string, type: 'tint' | 'shade', fraction: number): string;
/**
 * Generate the 10×6 theme color matrix for an advanced color picker.
 *
 * Columns: lt1, dk1, lt2, dk2, accent1-6 (matches Word's order)
 * Rows: base, 80% tint, 60% tint, 40% tint, 25% shade, 50% shade
 *
 * @param colorScheme - Theme color scheme (falls back to Office 2016 defaults)
 * @returns 6 rows × 10 columns of ThemeMatrixCell
 */
export declare function generateThemeTintShadeMatrix(colorScheme?: ThemeColorScheme | null): ThemeMatrixCell[][];
/**
 * Check if two colors are equal
 *
 * @param color1 - First color
 * @param color2 - Second color
 * @param theme - Theme for resolving
 * @returns True if colors resolve to the same value
 */
export declare function colorsEqual(color1: ColorValue | undefined | null, color2: ColorValue | undefined | null, theme: Theme | null | undefined): boolean;
//# sourceMappingURL=colorResolver.d.ts.map