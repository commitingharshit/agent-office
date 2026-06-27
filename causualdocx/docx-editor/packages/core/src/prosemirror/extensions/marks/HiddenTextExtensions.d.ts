/**
 * Run-level marks that don't fit the existing TextEffectsExtensions bucket:
 *
 * - `hidden` (w:vanish): hides the run from the visible layout. Word still
 *   keeps the text in the document and prints/exports it conditionally; the
 *   simplest WYSIWYG approximation is `display: none`.
 * - `rtl` (w:rtl): forces a single run to right-to-left independently of the
 *   paragraph direction. Rendered as `dir="rtl"`.
 * - `textEffect` (w:effect): legacy text animations (blink, ants, shimmer,
 *   sparkle). Browsers don't have a native equivalent; we apply distinctive
 *   class hooks so the host stylesheet can opt-in to animations or just
 *   visually mark the runs.
 */
export declare const HiddenExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
export declare const RtlExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
export declare const TextEffectExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
//# sourceMappingURL=HiddenTextExtensions.d.ts.map