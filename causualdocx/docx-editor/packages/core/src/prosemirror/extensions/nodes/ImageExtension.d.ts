/**
 * Image Extension — inline/floating image node
 */
import type { ImageAttrs } from '../../schema/nodes';
import type { WrapType } from '../../../docx/wrapTypes';
/**
 * Anchored wrap-type targets — the OOXML wrap types except `inline`.
 */
export type AnchorWrapType = Exclude<WrapType, 'inline'>;
/**
 * User-facing layout choices that mirror Word's Wrap Text menu. These are
 * directional shortcuts that fold (`wrapType`, `cssFloat`) into a single
 * picker option:
 *
 *   - `squareLeft`  — image floats left, text wraps on the right
 *   - `squareRight` — image floats right, text wraps on the left
 *   - `inline`      — image flows in the line as a glyph
 *   - the other targets are 1:1 with their OOXML wrap types
 *
 * `setImageWrapType` accepts both raw OOXML targets (square / tight / through
 * / topAndBottom / behind / inFront / inline) and the directional convenience
 * targets.
 */
export type ImageLayoutTarget = AnchorWrapType | 'squareLeft' | 'squareRight' | 'inline';
/**
 * Optional context for `setImageWrapType` transitions:
 *
 *   - `initialPositionEmu`: when promoting an inline image to an anchor, the
 *     caller passes the inline image's current rendered position relative to
 *     the column origin in EMUs. The command stores this as the anchor's
 *     `wp:positionH` / `wp:positionV` so Word renders the new float exactly
 *     where the inline image used to sit (Word's own behavior).
 */
export interface SetImageWrapTypeOptions {
    initialPositionEmu?: {
        horizontalEmu: number;
        verticalEmu: number;
    };
}
/**
 * Resolve the consistent (`wrapType`, `displayMode`, `cssFloat`, `wrapText`)
 * tuple for a target layout choice, given the image's current attrs.
 *
 * - `squareLeft` / `squareRight` are directional convenience targets that pin
 *   `cssFloat` and `wrapText` explicitly. They preserve `wrapType` when it's
 *   already `tight` / `through` so the user keeps the polygon-clipped XML
 *   they came in with; otherwise they normalize to `square`.
 * - `square` / `tight` / `through` keep the existing `cssFloat` if it's
 *   `left`/`right`, otherwise default to `left` (Word's default).
 * - `topAndBottom` is a block-band that breaks text above and below.
 * - `behind` / `inFront` (`wp:wrapNone`) paint at a position with no flow.
 *
 * `wrapText` is the OOXML hint for which side(s) text flows on. We always
 * emit it alongside `cssFloat` so the saved DOCX agrees with the in-memory
 * cssFloat after a round-trip — without this, `fromProseDoc` writes a stale
 * `wrapText` from the original load and reopening the doc silently flips the
 * image side.
 */
type AnchorAttrs = Pick<ImageAttrs, 'wrapType' | 'displayMode' | 'cssFloat' | 'wrapText' | 'position' | 'distTop' | 'distBottom' | 'distLeft' | 'distRight'>;
export declare function resolveAnchorAttrs(target: ImageLayoutTarget, current: Pick<ImageAttrs, 'wrapType' | 'cssFloat' | 'position'>, opts?: SetImageWrapTypeOptions): AnchorAttrs;
export declare const ImageExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
export {};
//# sourceMappingURL=ImageExtension.d.ts.map