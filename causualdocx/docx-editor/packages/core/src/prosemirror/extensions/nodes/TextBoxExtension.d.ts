/**
 * TextBox Extension — editable text box node
 *
 * An isolating block node that contains paragraphs (and tables).
 * Rendered as a positioned container with optional fill, outline, and margins.
 * Supports inline and floating positioning.
 */
export interface TextBoxAttrs {
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    /** Unique identifier */
    textBoxId?: string;
    /** Fill color as CSS color */
    fillColor?: string;
    /** Outline width in pixels */
    outlineWidth?: number;
    /** Outline color as CSS color */
    outlineColor?: string;
    /** Outline style */
    outlineStyle?: string;
    /** Internal margin top in pixels */
    marginTop?: number;
    /** Internal margin bottom in pixels */
    marginBottom?: number;
    /** Internal margin left in pixels */
    marginLeft?: number;
    /** Internal margin right in pixels */
    marginRight?: number;
    /** Vertical text alignment */
    verticalAlign?: string;
    /** Display mode */
    displayMode?: 'inline' | 'float' | 'block';
    /** CSS float direction */
    cssFloat?: 'left' | 'right' | 'none';
    /** Wrap type */
    wrapType?: string;
    /**
     * Text-fit mode parsed from a:spAutoFit / a:noAutofit / a:normAutofit.
     * `spAutoFit` makes the stored `height` a *minimum* — the layout engine
     * grows the box if content exceeds it (so text doesn't clip when our
     * font metrics disagree with Word's saved ext.cy).
     */
    autoFit?: 'spAutoFit' | 'noAutofit' | 'normAutofit';
    /**
     * Anchor position for floating text-bearing shapes (wps:wsp inside
     * wp:anchor + wpg:wgp children). Stored in PIXELS at 96 DPI so they
     * sit alongside `width` / `height` / `marginTop` etc. — the parser
     * converts EMU → px in `convertTextBox` and `fromProseDoc` reverses
     * it on save.
     *
     * HONORED BY THE LAYOUT ENGINE via `layoutAnchoredTextBox`, which
     * resolves the full `relativeFrom` band math (page/margin/column/
     * paragraph) through `resolveAnchorX/Y` and places the box WITHOUT
     * reserving in-flow space (behind-doc clusters reserve once via
     * `reservesBehindDocBand`). The Format-panel "Position X/Y" control
     * writes posOffsetH/V as `margin`-relative offsets through these attrs.
     *
     * History: the first attempt wired these into `layoutTextBox` directly
     * (commit `d8b85d1`, reverted in `d4ceebf`) and floated EVERY imported
     * shape as an overlay that didn't advance the cursor — shifting body
     * text on real-world fixtures (medical-incident-form 4→3 pages). The
     * working approach is the dedicated anchored path above, which only
     * floats genuinely-anchored boxes and keeps in-flow boxes in flow.
     */
    posOffsetH?: number;
    posOffsetV?: number;
    /**
     * `wp:positionH/V`'s `relativeFrom` (e.g. "margin", "page",
     * "column", "paragraph"). Captured for round-trip; same caveat as
     * `posOffsetH/V` above — not yet honored by the layout engine.
     */
    posRelFromH?: string;
    posRelFromV?: string;
    /**
     * `wp:positionH/V`'s `<wp:align>` value when no `posOffset` is
     * given (e.g. "center", "right"). Captured for round-trip.
     */
    posAlignH?: string;
    posAlignV?: string;
    /** Original OOXML envelope for verbatim re-emission on save. */
    rawXml?: string;
    /** Dedupe key for shapes sharing one source envelope. */
    envelopeKey?: string;
}
export declare const TextBoxExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").NodeExtension;
//# sourceMappingURL=TextBoxExtension.d.ts.map