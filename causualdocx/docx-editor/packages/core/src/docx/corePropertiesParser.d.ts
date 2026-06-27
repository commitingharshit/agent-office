/**
 * docProps/core.xml — Open Packaging Conventions core properties.
 *
 * Word writes these fields with stable namespace prefixes (`cp:`, `dc:`,
 * `dcterms:`), so a regex-based extractor is enough to read them without
 * pulling the whole xml-js pipeline into the rezip hot path. The writer
 * (`applyCorePropertiesToXml`) preserves any other tags Word might have
 * written by editing the document in place — only the elements we know
 * about are touched.
 *
 * Fields covered (the set Word exposes in File → Info → Properties):
 *   - title           dc:title
 *   - subject         dc:subject
 *   - creator         dc:creator
 *   - keywords        cp:keywords
 *   - description     dc:description
 *   - lastModifiedBy  cp:lastModifiedBy
 *   - revision        cp:revision
 *   - created         dcterms:created
 *   - modified        dcterms:modified
 *   - category        cp:category
 *   - contentStatus   cp:contentStatus
 */
export interface CoreProperties {
    title?: string;
    subject?: string;
    creator?: string;
    keywords?: string;
    description?: string;
    lastModifiedBy?: string;
    revision?: number;
    created?: Date;
    modified?: Date;
    category?: string;
    contentStatus?: string;
}
/** Parse docProps/core.xml into a structured `CoreProperties`. */
export declare function parseCoreProperties(xml: string | null | undefined): CoreProperties | undefined;
/**
 * Apply edits to a docProps/core.xml string. Only the fields present on
 * `updates` are touched; everything else (including unknown tags Word
 * may have written) is left in place. Missing tags are inserted before
 * `</cp:coreProperties>`.
 */
export declare function applyCorePropertiesToXml(xml: string, updates: Partial<CoreProperties> | undefined): string;
/** Default core.xml shell used when the package has none. */
export declare const EMPTY_CORE_PROPERTIES_XML = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"></cp:coreProperties>";
//# sourceMappingURL=corePropertiesParser.d.ts.map