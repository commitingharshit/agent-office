/**
 * Formatting to CSS Converter
 *
 * Converts OOXML formatting objects (TextFormatting, ParagraphFormatting)
 * to React CSSProperties for rendering.
 *
 * Handles ALL formatting properties:
 * - Font: family, size, weight, style
 * - Text: color, background, decoration (underline, strike, double-strike)
 * - Effects: superscript, subscript, small-caps, all-caps
 * - Spacing: letter-spacing
 * - Paragraph: alignment, line-height, margins, padding, borders, background
 */
/** Framework-agnostic CSS properties type (compatible with React.CSSProperties) */
type CSSProperties = Record<string, any>;
import type { TextFormatting, ParagraphFormatting, BorderSpec, ShadingProperties, Theme } from '../types/document';
/**
 * Convert TextFormatting to CSS properties for a run/span
 *
 * @param formatting - Text formatting from OOXML
 * @param theme - Theme for resolving colors and fonts
 * @returns React CSSProperties
 */
export declare function textToStyle(formatting: TextFormatting | undefined | null, theme?: Theme | null): CSSProperties;
/**
 * Convert ParagraphFormatting to CSS properties
 *
 * @param formatting - Paragraph formatting from OOXML
 * @param theme - Theme for resolving colors
 * @returns React CSSProperties
 */
export declare function paragraphToStyle(formatting: ParagraphFormatting | undefined | null, theme?: Theme | null): CSSProperties;
/**
 * Convert a BorderSpec to CSS border properties
 *
 * @param border - Border specification
 * @param side - 'Top' | 'Bottom' | 'Left' | 'Right' | '' for all
 * @param theme - Theme for color resolution
 * @returns Partial CSSProperties with border styles
 */
export declare function borderToStyle(border: BorderSpec | undefined | null, side?: 'Top' | 'Bottom' | 'Left' | 'Right' | '', theme?: Theme | null): CSSProperties;
/**
 * Convert ShadingProperties to background color
 *
 * @param shading - Shading properties
 * @param theme - Theme for color resolution
 * @returns CSS color string or empty string
 */
export declare function resolveShadingFill(shading: ShadingProperties | undefined | null, theme?: Theme | null): string;
/**
 * Merge multiple CSSProperties objects
 *
 * Later objects override earlier ones for conflicting properties.
 *
 * @param styles - Array of CSSProperties objects
 * @returns Merged CSSProperties
 */
export declare function mergeStyles(...styles: (CSSProperties | undefined | null)[]): CSSProperties;
/**
 * Get CSS for a table cell based on formatting
 *
 * @param formatting - Table cell formatting
 * @param theme - Theme for color resolution
 * @returns CSSProperties for the cell
 */
export declare function tableCellToStyle(formatting: {
    verticalAlign?: 'top' | 'center' | 'bottom';
    textDirection?: string;
    shading?: ShadingProperties;
    borders?: {
        top?: BorderSpec;
        bottom?: BorderSpec;
        left?: BorderSpec;
        right?: BorderSpec;
    };
    margins?: {
        top?: {
            value: number;
            type: string;
        };
        bottom?: {
            value: number;
            type: string;
        };
        left?: {
            value: number;
            type: string;
        };
        right?: {
            value: number;
            type: string;
        };
    };
} | undefined | null, theme?: Theme | null): CSSProperties;
/**
 * Get CSS for page/section container
 *
 * @param sectionProps - Section properties
 * @returns CSSProperties for the page container
 */
export declare function sectionToStyle(sectionProps: {
    pageWidth?: number;
    pageHeight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    background?: {
        color?: {
            rgb?: string;
            themeColor?: string;
        };
    };
} | undefined | null, theme?: Theme | null): CSSProperties;
export {};
//# sourceMappingURL=formatToStyle.d.ts.map