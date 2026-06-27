export interface OmmlToMathmlOptions {
    /** 'block' → display="block" (own line); 'inline' → inline. */
    display?: 'inline' | 'block';
}
/**
 * Convert a raw OMML XML string (`<m:oMath>…` or `<m:oMathPara>…`) to a
 * MathML string (`<math>…</math>`). Returns null when the input can't be
 * parsed or contains no math — callers fall back to the plain-text render.
 */
export declare function ommlToMathml(ommlXml: string, options?: OmmlToMathmlOptions): string | null;
//# sourceMappingURL=ommlToMathml.d.ts.map