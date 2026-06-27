/**
 * Theme Parser - Parse theme1.xml for colors and fonts
 *
 * Extracts color scheme (dk1, lt1, dk2, lt2, accent1-6, hlink, folHlink)
 * and font scheme (majorFont, minorFont) from the theme.
 *
 * OOXML Reference:
 * - Theme file is at: word/theme/theme1.xml
 * - Uses DrawingML namespace (a:)
 * - Colors can be srgbClr, sysClr, or schemeClr
 */
import type { Theme, ThemeColorScheme } from '../types/document';
/**
 * Parse theme1.xml content
 *
 * @param themeXml - XML content of theme1.xml, or null if not present
 * @returns Parsed Theme object with colors and fonts
 */
export declare function parseTheme(themeXml: string | null): Theme;
/**
 * Get a color from the theme by slot name
 *
 * @param theme - Parsed theme
 * @param slot - Color slot name (dk1, lt1, accent1, etc.)
 * @returns Hex color value (6 characters, no #)
 */
export declare function getThemeColor(theme: Theme | null | undefined, slot: keyof ThemeColorScheme): string;
/**
 * Get the major font (heading font) from theme
 *
 * @param theme - Parsed theme
 * @param script - Optional script code (defaults to latin)
 * @returns Font family name
 */
export declare function getMajorFont(theme: Theme | null | undefined, script?: string): string;
/**
 * Get the minor font (body font) from theme
 *
 * @param theme - Parsed theme
 * @param script - Optional script code (defaults to latin)
 * @returns Font family name
 */
export declare function getMinorFont(theme: Theme | null | undefined, script?: string): string;
/**
 * Resolve a theme font reference to an actual font name
 *
 * Theme font references are like: majorAscii, majorHAnsi, minorAscii, minorHAnsi, etc.
 *
 * @param theme - Parsed theme
 * @param themeRef - Theme font reference
 * @returns Font family name
 */
export declare function resolveThemeFontRef(theme: Theme | null | undefined, themeRef: string): string;
/**
 * Get all font families from the theme for preloading
 *
 * @param theme - Parsed theme
 * @returns Array of unique font family names
 */
export declare function getThemeFonts(theme: Theme | null | undefined): string[];
/**
 * Get the default theme (Office 2016 theme)
 *
 * @returns Default Theme object
 */
export declare function getDefaultTheme(): Theme;
//# sourceMappingURL=themeParser.d.ts.map