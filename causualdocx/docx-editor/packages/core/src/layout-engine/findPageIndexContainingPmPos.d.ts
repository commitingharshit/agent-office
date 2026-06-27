import type { Layout } from './types';
/**
 * Page index (0-based) whose layout fragments cover `pmPos`, or null if none.
 * Used when the painted DOM may not yet have `[data-pm-start]` for this position (virtualization).
 *
 * Range semantics: `[pmStart, pmEnd)` — half-open, matching ProseMirror's
 * `pos + nodeSize` convention. Boundary positions belong to the next fragment,
 * so when a fragment ends at the same position the next one starts, the next
 * fragment wins (avoids returning the previous page for the start of the
 * next paragraph).
 */
export declare function findPageIndexContainingPmPos(layout: Layout, pmPos: number): number | null;
//# sourceMappingURL=findPageIndexContainingPmPos.d.ts.map