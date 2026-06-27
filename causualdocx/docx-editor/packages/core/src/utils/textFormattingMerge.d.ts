import type { TextFormatting } from '../types/document';
/**
 * Merge two `TextFormatting` objects (source overrides target).
 *
 * Used everywhere OOXML rPr inheritance is resolved — basedOn chains in
 * `styleParser`, paragraph-style merge in `styleResolver`, and pPr/rPr
 * onto style rPr in `toProseDoc`. Keeping one implementation prevents the
 * three diverging again (#391, #394).
 *
 * Merge rules per ECMA-376 §17.3.2:
 * - `fontFamily` — per-slot merge (§17.3.2.27): each ascii/hAnsi/eastAsia/cs
 *   slot and its theme pair travel together; source only replaces slots it
 *   actually sets. See `mergeFontFamily`.
 * - `color` — `w:val="auto"` (§17.3.2.6) means "inherit" and does not
 *   override an explicit color from the chain unless source also names an
 *   explicit color or theme reference.
 * - other object-shaped fields (`underline`, `borders`, etc.) — shallow
 *   merge so a child rPr that only sets one property does not wipe out
 *   sibling properties from the parent.
 * - primitives — replace.
 */
export declare function mergeTextFormatting(target: TextFormatting | undefined, source: TextFormatting | undefined): TextFormatting | undefined;
//# sourceMappingURL=textFormattingMerge.d.ts.map