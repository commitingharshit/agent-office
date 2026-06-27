/**
 * Field Parser - Parse field codes in DOCX documents
 *
 * OOXML supports two types of fields:
 * 1. Simple fields (w:fldSimple) - Single element with instruction attribute
 * 2. Complex fields (w:fldChar + w:instrText) - Multi-element spanning runs
 *
 * Fields provide dynamic content like:
 * - Page numbers (PAGE, NUMPAGES)
 * - Dates and times (DATE, TIME, CREATEDATE)
 * - Document properties (AUTHOR, TITLE, FILENAME)
 * - Cross-references (REF, PAGEREF, NOTEREF)
 * - Tables of contents (TOC, INDEX)
 * - Mail merge fields (MERGEFIELD)
 *
 * OOXML Reference:
 * - Simple field: <w:fldSimple w:instr="FIELD INSTRUCTION">content</w:fldSimple>
 * - Complex field:
 *   <w:r><w:fldChar w:fldCharType="begin"/></w:r>
 *   <w:r><w:instrText>FIELD INSTRUCTION</w:instrText></w:r>
 *   <w:r><w:fldChar w:fldCharType="separate"/></w:r>
 *   <w:r><w:t>display result</w:t></w:r>
 *   <w:r><w:fldChar w:fldCharType="end"/></w:r>
 */
import type { FieldType, SimpleField, ComplexField, Field, Run, Hyperlink } from '../types/document';
import type { StyleMap } from './styleParser';
import type { Theme } from '../types/document';
import { type XmlElement } from './xmlParser';
/**
 * All known field types from OOXML specification
 */
export declare const KNOWN_FIELD_TYPES: FieldType[];
/**
 * Parse field type from instruction string
 *
 * Field instructions follow the format: FIELDNAME [arguments] [switches]
 * Examples:
 * - "PAGE \\* MERGEFORMAT"
 * - "DATE \\@ \"MMMM d, yyyy\""
 * - "MERGEFIELD client_name \\* Upper"
 * - "REF _Ref123456 \\h"
 *
 * @param instruction - The field instruction string
 * @returns The detected field type
 */
export declare function parseFieldType(instruction: string): FieldType;
/**
 * Check if a field type is a known type
 *
 * @param type - Field type string to check
 * @returns true if it's a known field type
 */
export declare function isKnownFieldType(type: string): type is FieldType;
/**
 * Parsed field instruction with arguments and switches
 */
export interface ParsedFieldInstruction {
    /** Field type */
    type: FieldType;
    /** Raw instruction string */
    raw: string;
    /** Field argument (e.g., property name for DOCPROPERTY, bookmark name for REF) */
    argument?: string;
    /** Field switches (e.g., \* MERGEFORMAT, \@ "date format") */
    switches: FieldSwitch[];
}
/**
 * Field switch parsed from instruction
 */
export interface FieldSwitch {
    /** Switch character (e.g., '*', '@', '#', 'h', 'p') */
    switch: string;
    /** Switch value if any */
    value?: string;
}
/**
 * Parse a complete field instruction into structured data
 *
 * @param instruction - Raw instruction string
 * @returns Parsed instruction object
 */
export declare function parseFieldInstruction(instruction: string): ParsedFieldInstruction;
/**
 * Get the format switch value (\* or \@)
 *
 * @param instruction - Parsed instruction
 * @returns Format string or undefined
 */
export declare function getFormatSwitch(instruction: ParsedFieldInstruction): string | undefined;
/**
 * Check if field has MERGEFORMAT switch (preserve formatting)
 *
 * @param instruction - Parsed instruction
 * @returns true if MERGEFORMAT is present
 */
export declare function hasMergeFormat(instruction: ParsedFieldInstruction): boolean;
/**
 * Parse a simple field element (w:fldSimple)
 *
 * @param node - The w:fldSimple XML element
 * @param styles - Style definitions for parsing content runs
 * @param theme - Theme for color/font resolution
 * @returns Parsed SimpleField object
 */
export declare function parseSimpleField(node: XmlElement, styles: StyleMap | null, theme: Theme | null): SimpleField;
/**
 * State machine for tracking complex field parsing
 */
export type ComplexFieldState = 'outside' | 'code' | 'result';
/**
 * Complex field parsing context
 */
export interface ComplexFieldContext {
    /** Current state */
    state: ComplexFieldState;
    /** Accumulated instruction text */
    instruction: string;
    /** Runs in the field code section */
    codeRuns: Run[];
    /** Runs in the result section */
    resultRuns: Run[];
    /** Whether field is locked */
    fldLock: boolean;
    /** Whether field needs update */
    dirty: boolean;
    /** Nesting level (for nested fields) */
    nestingLevel: number;
}
/**
 * Create a new complex field context
 */
export declare function createComplexFieldContext(): ComplexFieldContext;
/**
 * Reset the context for a new field
 */
export declare function resetComplexFieldContext(ctx: ComplexFieldContext): void;
/**
 * Finalize a complex field from its context
 *
 * @param ctx - The field context
 * @returns The parsed ComplexField
 */
export declare function finalizeComplexField(ctx: ComplexFieldContext): ComplexField;
/**
 * Get the current display value of a field
 *
 * @param field - The field (simple or complex)
 * @returns The display text
 */
export declare function getFieldDisplayValue(field: Field): string;
/**
 * Check if field represents a page number
 *
 * @param field - The field to check
 * @returns true if this is a page number field
 */
export declare function isPageNumberField(field: Field): boolean;
/**
 * Check if field represents total page count
 *
 * @param field - The field to check
 * @returns true if this is a total pages field
 */
export declare function isTotalPagesField(field: Field): boolean;
/**
 * Check if field is a date/time field
 *
 * @param field - The field to check
 * @returns true if this is a date/time field
 */
export declare function isDateTimeField(field: Field): boolean;
/**
 * Check if field is a document property field
 *
 * @param field - The field to check
 * @returns true if this is a document property field
 */
export declare function isDocPropertyField(field: Field): boolean;
/**
 * Check if field is a cross-reference field
 *
 * @param field - The field to check
 * @returns true if this is a cross-reference field
 */
export declare function isReferenceField(field: Field): boolean;
/**
 * Check if field is a mail merge field
 *
 * @param field - The field to check
 * @returns true if this is a mail merge field
 */
export declare function isMergeField(field: Field): boolean;
/**
 * Check if field is a hyperlink field
 *
 * @param field - The field to check
 * @returns true if this is a hyperlink field
 */
export declare function isHyperlinkField(field: Field): boolean;
/**
 * Check if field is a TOC/Index field
 *
 * @param field - The field to check
 * @returns true if this is a TOC or index field
 */
export declare function isTocField(field: Field): boolean;
/**
 * Compute the value for a page number field
 *
 * @param pageNumber - Current page number
 * @param instruction - Parsed instruction for format switches
 * @returns Formatted page number string
 */
export declare function computePageNumber(pageNumber: number, instruction?: ParsedFieldInstruction): string;
/**
 * Format a date according to a format string
 *
 * Supports common OOXML date format codes:
 * - M, MM, MMM, MMMM - Month
 * - d, dd, ddd, dddd - Day
 * - yy, yyyy - Year
 * - h, hh, H, HH - Hour
 * - m, mm - Minute (in time context)
 * - s, ss - Second
 * - AM/PM, am/pm - AM/PM indicator
 *
 * @param date - The date to format
 * @param format - The format string
 * @returns Formatted date string
 */
export declare function formatDate(date: Date, format: string): string;
/**
 * Collect all fields from a document content array
 *
 * @param content - Array of paragraph content items
 * @returns Array of all fields found
 */
export declare function collectFields(content: Array<Run | Hyperlink | Field | unknown>): Field[];
/**
 * Get all fields of a specific type
 *
 * @param fields - Array of fields
 * @param fieldType - The field type to filter by
 * @returns Filtered array of fields
 */
export declare function getFieldsByType(fields: Field[], fieldType: FieldType): Field[];
/**
 * Find all page number fields
 *
 * @param fields - Array of fields
 * @returns Array of PAGE fields
 */
export declare function getPageNumberFields(fields: Field[]): Field[];
/**
 * Find all merge fields
 *
 * @param fields - Array of fields
 * @returns Array of MERGEFIELD fields
 */
export declare function getMergeFields(fields: Field[]): Field[];
/**
 * Extract merge field names from fields
 *
 * @param fields - Array of fields
 * @returns Array of merge field names
 */
export declare function getMergeFieldNames(fields: Field[]): string[];
//# sourceMappingURL=fieldParser.d.ts.map