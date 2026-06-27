/**
 * Internal run shading mark.
 *
 * DOCX `<w:shd>` is character shading, not the same semantic as
 * `<w:highlight>`. Keep it in the ProseMirror document so export preserves the
 * source XML, but do not paint it like a user-applied text highlight.
 */
export declare const RunShadingExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
//# sourceMappingURL=RunShadingExtension.d.ts.map