/**
 * OOXML image wrap-type taxonomy.
 *
 * `wp:inline` flows in the line. `wp:anchor` covers all positioned variants:
 *   - `square` / `tight` / `through` — text wraps around the image
 *   - `topAndBottom` — text breaks above and below
 *   - `behind` / `inFront` (`wp:wrapNone`) — image paints out of flow
 */
const WRAPS_AROUND_TEXT = ['square', 'tight', 'through'];
const WRAPS_NONE = ['behind', 'inFront'];
const FLOATING = [...WRAPS_AROUND_TEXT, ...WRAPS_NONE];
/** True for wrap types that anchor at a position (i.e. not `inline`, not `topAndBottom`). */
export function isFloatingWrapType(wrapType) {
    return !!wrapType && FLOATING.includes(wrapType);
}
/** True for `wp:wrapNone` variants (`behind` / `inFront`) — positioned but ignore text-flow. */
export function isWrapNone(wrapType) {
    return wrapType === 'behind' || wrapType === 'inFront';
}
/** True for wrap types where text flows around the image (`square` / `tight` / `through`). */
export function wrapsAroundText(wrapType) {
    return !!wrapType && WRAPS_AROUND_TEXT.includes(wrapType);
}
//# sourceMappingURL=wrapTypes.js.map