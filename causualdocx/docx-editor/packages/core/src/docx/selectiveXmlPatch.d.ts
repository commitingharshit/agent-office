/**
 * Selective XML Patch Module
 *
 * Patches only changed paragraphs in document.xml, preserving
 * unchanged content byte-for-byte. Uses string offset tracking
 * with proper tag depth counting (not regex) to handle nested elements.
 */
/**
 * Find the exact string start and end offsets of a <w:p> element
 * identified by its w14:paraId attribute.
 *
 * Handles nested <w:p> elements (e.g. inside mc:AlternateContent)
 * via proper depth counting.
 *
 * Returns null if paraId not found or appears more than once (ambiguous).
 */
export declare function findParagraphOffsets(xml: string, paraId: string): {
    start: number;
    end: number;
} | null;
/**
 * Extract the serialized XML for a specific paragraph by paraId
 * from a fully serialized document.xml string.
 */
export declare function extractParagraphXml(serializedXml: string, paraId: string): string | null;
/**
 * Count <w:p> elements in an XML string (top-level paragraph count).
 * Counts opening <w:p tags that are NOT self-closing.
 */
export declare function countParagraphElements(xml: string): number;
export interface PatchValidationResult {
    safe: boolean;
    reason?: string;
}
/**
 * Validate that a selective patch can be safely applied.
 *
 * Checks:
 * - All changed paraIds exist in original XML (exactly once)
 * - All changed paraIds exist in serialized XML (exactly once)
 * - Paragraph count matches between original and serialized
 */
export declare function validatePatchSafety(originalXml: string, serializedXml: string, changedIds: Set<string>): PatchValidationResult;
/**
 * Build a patched document.xml by splicing new paragraph XML into
 * the original at the correct offsets. Only changed paragraphs
 * are replaced; everything else is preserved byte-for-byte.
 *
 * Returns null if any step fails.
 */
export declare function buildPatchedDocumentXml(originalXml: string, serializedXml: string, changedIds: Set<string>): string | null;
//# sourceMappingURL=selectiveXmlPatch.d.ts.map