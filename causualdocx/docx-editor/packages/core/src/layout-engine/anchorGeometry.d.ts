/** Page geometry needed to resolve an anchor band, in CSS pixels. */
export interface AnchorGeometry {
    pageWidth: number;
    pageHeight: number;
    marginLeft: number;
    marginTop: number;
    contentWidth: number;
    contentHeight: number;
    /** Column left edge (content-area-relative). Defaults to 0 (single column). */
    columnX?: number;
    /** Column width. Defaults to contentWidth. */
    columnWidth?: number;
}
/** Horizontal anchor (`<wp:positionH>` / VML `mso-position-horizontal*`). */
export interface HorizontalAnchorSpec {
    relativeTo?: string;
    align?: string;
    posOffset?: number;
}
/** Vertical anchor (`<wp:positionV>` / VML `mso-position-vertical*`). */
export interface VerticalAnchorSpec {
    relativeTo?: string;
    align?: string;
    posOffset?: number;
}
/**
 * Resolve the horizontal position of an anchored object within the painter's
 * content-area coordinate space. Returns the x (content-area-relative) and the
 * heuristic `side` the floating-image wrap logic uses.
 */
export declare function resolveAnchorX(h: HorizontalAnchorSpec, objectWidth: number, geom: AnchorGeometry): {
    x: number;
    side: 'left' | 'right';
};
/**
 * Resolve the vertical position of an anchored object within the painter's
 * content-area coordinate space. `fragmentY` is the in-flow Y of the anchoring
 * paragraph (used for paragraph/line-relative anchors and as the fallback).
 */
export declare function resolveAnchorY(v: VerticalAnchorSpec, objectHeight: number, fragmentY: number, geom: AnchorGeometry): number;
//# sourceMappingURL=anchorGeometry.d.ts.map