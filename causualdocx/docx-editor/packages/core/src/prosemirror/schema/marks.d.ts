/**
 * ProseMirror Mark Type Interfaces
 *
 * Type definitions for mark attributes used by conversion modules,
 * extensions, and other consumers. MarkSpec definitions have moved
 * to the extension system (extensions/marks/).
 */
import type { UnderlineStyle, ThemeColorSlot, ShadingProperties } from '../../types/document';
/**
 * Text color mark attributes
 */
export interface TextColorAttrs {
    rgb?: string;
    themeColor?: ThemeColorSlot;
    themeTint?: string;
    themeShade?: string;
    auto?: boolean;
}
/**
 * Underline mark attributes
 */
export interface UnderlineAttrs {
    style?: UnderlineStyle;
    color?: TextColorAttrs;
}
/**
 * Internal run shading mark attributes.
 */
export interface RunShadingAttrs {
    shading?: ShadingProperties;
}
/**
 * Font size mark attributes
 */
export interface FontSizeAttrs {
    size: number;
}
/**
 * Font family mark attributes
 */
export interface FontFamilyAttrs {
    ascii?: string;
    hAnsi?: string;
    eastAsia?: string;
    cs?: string;
    asciiTheme?: string;
    hAnsiTheme?: string;
    eastAsiaTheme?: string;
    csTheme?: string;
}
/**
 * Hyperlink mark attributes
 */
export interface HyperlinkAttrs {
    href: string;
    tooltip?: string;
    rId?: string;
}
//# sourceMappingURL=marks.d.ts.map