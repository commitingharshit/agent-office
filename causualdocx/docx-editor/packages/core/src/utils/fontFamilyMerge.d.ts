import type { TextFormatting } from '../types/document';
type FontFamily = NonNullable<TextFormatting['fontFamily']>;
/**
 * Merge two `<w:rFonts>` references per ECMA-376 §17.3.2.27.
 *
 * Each of the four font slots (`ascii`, `hAnsi`, `eastAsia`, `cs`) has an
 * explicit name and a paired theme reference (`asciiTheme`, etc.). When a
 * source style overrides a slot, both members of that pair must travel
 * together — otherwise an inherited theme attr can leak through and silently
 * override an explicit name (the `Theme` attr wins at render time, so a
 * stale `asciiTheme="minorHAnsi"` from `docDefaults` overrides an explicit
 * `ascii="Arial"` from the parent style and resolves back to `Calibri`).
 *
 * This is the rule that fixes #387.
 */
export declare function mergeFontFamily(target: FontFamily | undefined, source: FontFamily): FontFamily;
export {};
//# sourceMappingURL=fontFamilyMerge.d.ts.map