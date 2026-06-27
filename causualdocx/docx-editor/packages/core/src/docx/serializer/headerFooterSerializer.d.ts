/**
 * Header/Footer Serializer - Serialize headers/footers to OOXML XML
 *
 * Converts HeaderFooter objects back to valid header*.xml / footer*.xml format.
 * Reuses paragraph and table serializers for content.
 *
 * OOXML Reference:
 * - Header root: w:hdr
 * - Footer root: w:ftr
 * - Content: w:p, w:tbl (same as document body)
 */
import type { HeaderFooter } from '../../types/document';
/**
 * Serialize a HeaderFooter object to valid OOXML XML
 *
 * @param hf - HeaderFooter object to serialize
 * @returns Complete XML string for header*.xml or footer*.xml
 */
export declare function serializeHeaderFooter(hf: HeaderFooter): string;
//# sourceMappingURL=headerFooterSerializer.d.ts.map