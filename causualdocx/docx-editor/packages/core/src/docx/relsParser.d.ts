/**
 * Relationship Parser
 *
 * Parses .rels files from DOCX packages to map relationship IDs (rId)
 * to their targets (images, hyperlinks, headers, footers, etc.).
 *
 * .rels files are XML with structure:
 * <Relationships xmlns="...">
 *   <Relationship Id="rId1" Type="..." Target="..." TargetMode="External|Internal"/>
 * </Relationships>
 *
 * Key relationship types:
 * - image: Embedded images (word/media/*)
 * - hyperlink: External URLs (TargetMode="External")
 * - header: Header XML files
 * - footer: Footer XML files
 * - footnotes: Footnotes XML
 * - endnotes: Endnotes XML
 * - styles: styles.xml
 * - numbering: numbering.xml
 * - fontTable: fontTable.xml
 * - theme: theme/theme1.xml
 */
import type { Relationship, RelationshipMap, RelationshipType } from '../types';
/**
 * Relationship type constants for common types
 */
export declare const RELATIONSHIP_TYPES: {
    readonly image: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
    readonly hyperlink: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink";
    readonly header: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header";
    readonly footer: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer";
    readonly footnotes: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes";
    readonly endnotes: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes";
    readonly styles: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles";
    readonly numbering: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering";
    readonly fontTable: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable";
    readonly theme: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme";
    readonly settings: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings";
    readonly webSettings: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings";
    readonly oleObject: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject";
    readonly chart: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
    readonly diagramData: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData";
    readonly officeDocument: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
    readonly coreProperties: "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties";
    readonly extendedProperties: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties";
    readonly customProperties: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties";
    readonly customXml: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml";
    readonly comments: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments";
    readonly commentsExtended: "http://schemas.microsoft.com/office/2011/relationships/commentsExtended";
    readonly commentsIds: "http://schemas.microsoft.com/office/2016/09/relationships/commentsIds";
    readonly commentsExtensible: "http://schemas.microsoft.com/office/2018/08/relationships/commentsExtensible";
};
/**
 * Parse a .rels XML file into a RelationshipMap
 *
 * @param relsXml - XML content of a .rels file
 * @returns Map of relationship ID to Relationship object
 */
export declare function parseRelationships(relsXml: string): RelationshipMap;
/**
 * Get the short type name from a full relationship type URI
 *
 * @param typeUri - Full relationship type URI
 * @returns Short type name (e.g., "image", "hyperlink") or "unknown"
 */
export declare function getRelationshipTypeName(typeUri: string): string;
/**
 * Check if a relationship type is an external link (hyperlink)
 *
 * @param rel - Relationship to check
 * @returns true if this is an external hyperlink
 */
export declare function isExternalHyperlink(rel: Relationship): boolean;
/**
 * Check if a relationship type is an image
 *
 * @param rel - Relationship to check
 * @returns true if this is an image relationship
 */
export declare function isImageRelationship(rel: Relationship): boolean;
/**
 * Check if a relationship type is a header
 *
 * @param rel - Relationship to check
 * @returns true if this is a header relationship
 */
export declare function isHeaderRelationship(rel: Relationship): boolean;
/**
 * Check if a relationship type is a footer
 *
 * @param rel - Relationship to check
 * @returns true if this is a footer relationship
 */
export declare function isFooterRelationship(rel: Relationship): boolean;
/**
 * Filter relationships by type
 *
 * @param map - RelationshipMap to filter
 * @param type - Relationship type URI to filter by
 * @returns Array of matching relationships
 */
export declare function filterByType(map: RelationshipMap, type: RelationshipType): Relationship[];
/**
 * Get all images from a relationship map
 *
 * @param map - RelationshipMap to search
 * @returns Array of image relationships
 */
export declare function getImages(map: RelationshipMap): Relationship[];
/**
 * Get all hyperlinks from a relationship map
 *
 * @param map - RelationshipMap to search
 * @returns Array of hyperlink relationships
 */
export declare function getHyperlinks(map: RelationshipMap): Relationship[];
/**
 * Get all headers from a relationship map
 *
 * @param map - RelationshipMap to search
 * @returns Array of header relationships
 */
export declare function getHeaders(map: RelationshipMap): Relationship[];
/**
 * Get all footers from a relationship map
 *
 * @param map - RelationshipMap to search
 * @returns Array of footer relationships
 */
export declare function getFooters(map: RelationshipMap): Relationship[];
/**
 * Resolve a relationship ID to a target path
 *
 * @param map - RelationshipMap to search
 * @param rId - Relationship ID (e.g., "rId1")
 * @returns Target path or undefined if not found
 */
export declare function resolveTarget(map: RelationshipMap, rId: string): string | undefined;
/**
 * Resolve a relationship ID to a full relationship
 *
 * @param map - RelationshipMap to search
 * @param rId - Relationship ID (e.g., "rId1")
 * @returns Relationship or undefined if not found
 */
export declare function resolveRelationship(map: RelationshipMap, rId: string): Relationship | undefined;
/**
 * Resolve a relative target path to an absolute path within the DOCX
 *
 * For example, if basePath is "word/_rels/document.xml.rels" and
 * target is "media/image1.png", the result is "word/media/image1.png"
 *
 * @param basePath - Path of the .rels file
 * @param target - Relative target from the relationship
 * @returns Absolute path within the DOCX
 */
export declare function resolveRelativePath(basePath: string, target: string): string;
/**
 * Parse document.xml.rels specifically
 *
 * This is a convenience wrapper for the main document relationships.
 *
 * @param relsXml - XML content of word/_rels/document.xml.rels
 * @returns RelationshipMap
 */
export declare function parseDocumentRelationships(relsXml: string): RelationshipMap;
/**
 * Parse package-level .rels
 *
 * This is a convenience wrapper for the package relationships (_rels/.rels)
 *
 * @param relsXml - XML content of _rels/.rels
 * @returns RelationshipMap
 */
export declare function parsePackageRelationships(relsXml: string): RelationshipMap;
/**
 * Debug: Print all relationships in a map
 *
 * @param map - RelationshipMap to print
 */
export declare function printRelationships(map: RelationshipMap): void;
//# sourceMappingURL=relsParser.d.ts.map