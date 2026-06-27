/**
 * Shape Extension — inline shape node
 *
 * Renders basic shapes (rect, ellipse, line, etc.) as inline SVG elements.
 * Supports fill color, outline, transforms, and selection.
 */
export interface ShapeAttrs {
    /** Shape type preset */
    shapeType?: string;
    /** Unique identifier */
    shapeId?: string;
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    /** Fill color as CSS color */
    fillColor?: string;
    /** Fill type: none, solid, gradient */
    fillType?: string;
    /** Gradient type: linear, radial, rectangular, path */
    gradientType?: string;
    /** Gradient angle in degrees (for linear) */
    gradientAngle?: number;
    /** Gradient stops as JSON string: [{position, color}] */
    gradientStops?: string;
    /** Outline width in pixels */
    outlineWidth?: number;
    /** Outline color as CSS color */
    outlineColor?: string;
    /** Outline style */
    outlineStyle?: string;
    /** CSS transform */
    transform?: string;
    /** Display mode */
    displayMode?: 'inline' | 'float' | 'block';
    /** CSS float */
    cssFloat?: 'left' | 'right' | 'none';
    /** Wrap type */
    wrapType?: string;
    /** Anchor horizontal offset in pixels (floating shapes) */
    posOffsetH?: number | null;
    /** Anchor vertical offset in pixels (floating shapes) */
    posOffsetV?: number | null;
    /** Horizontal anchor base (page/margin/column/...) */
    posRelFromH?: string | null;
    /** Vertical anchor base (page/margin/paragraph/...) */
    posRelFromV?: string | null;
    /** Horizontal anchor alignment (left/right/center/...) */
    posAlignH?: string | null;
    /** Vertical anchor alignment (top/bottom/center/...) */
    posAlignV?: string | null;
    /** Shadow color as CSS color */
    shadowColor?: string;
    /** Shadow blur radius in pixels */
    shadowBlur?: number;
    /** Shadow X offset in pixels */
    shadowOffsetX?: number;
    /** Shadow Y offset in pixels */
    shadowOffsetY?: number;
    /** Glow color as CSS color */
    glowColor?: string;
    /** Glow radius in pixels */
    glowRadius?: number;
    /** Original OOXML envelope (VML/DrawingML) for verbatim re-emission on save. */
    rawXml?: string;
    /** Dedupe key for shapes sharing one source envelope. */
    envelopeKey?: string;
}
export declare const ShapeExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
//# sourceMappingURL=ShapeExtension.d.ts.map