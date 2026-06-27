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
import { parseRun } from './runParser';
import { getAttribute, findChildren } from './xmlParser';
// ============================================================================
// FIELD TYPE DETECTION
// ============================================================================
/**
 * All known field types from OOXML specification
 */
export const KNOWN_FIELD_TYPES = [
    // Document information
    'PAGE',
    'NUMPAGES',
    'NUMWORDS',
    'NUMCHARS',
    // Date and time
    'DATE',
    'TIME',
    'CREATEDATE',
    'SAVEDATE',
    'PRINTDATE',
    'EDITTIME',
    // Document properties
    'AUTHOR',
    'TITLE',
    'SUBJECT',
    'KEYWORDS',
    'COMMENTS',
    'FILENAME',
    'FILESIZE',
    'TEMPLATE',
    'REVNUM',
    'DOCPROPERTY',
    'DOCVARIABLE',
    // Cross-references
    'REF',
    'PAGEREF',
    'NOTEREF',
    'HYPERLINK',
    // Tables of contents and indexes
    'TOC',
    'TOA',
    'INDEX',
    // Numbering
    'SEQ',
    'STYLEREF',
    'AUTONUM',
    'AUTONUMLGL',
    'AUTONUMOUT',
    // Section info
    'SECTION',
    'SECTIONPAGES',
    // User info
    'USERADDRESS',
    'USERNAME',
    'USERINITIALS',
    // Mail merge
    'IF',
    'MERGEFIELD',
    'NEXT',
    'NEXTIF',
    'ASK',
    'SET',
    // Inclusion
    'QUOTE',
    'INCLUDETEXT',
    'INCLUDEPICTURE',
    // Other
    'SYMBOL',
    'ADVANCE',
];
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
export function parseFieldType(instruction) {
    if (!instruction)
        return 'UNKNOWN';
    // Trim and extract the field name (first word, may have leading backslash)
    const trimmed = instruction.trim();
    const match = trimmed.match(/^\\?([A-Z][A-Z0-9]*)/i);
    if (!match)
        return 'UNKNOWN';
    const fieldName = match[1].toUpperCase();
    if (KNOWN_FIELD_TYPES.includes(fieldName)) {
        return fieldName;
    }
    return 'UNKNOWN';
}
/**
 * Check if a field type is a known type
 *
 * @param type - Field type string to check
 * @returns true if it's a known field type
 */
export function isKnownFieldType(type) {
    return KNOWN_FIELD_TYPES.includes(type);
}
/**
 * Parse a complete field instruction into structured data
 *
 * @param instruction - Raw instruction string
 * @returns Parsed instruction object
 */
export function parseFieldInstruction(instruction) {
    const type = parseFieldType(instruction);
    const trimmed = instruction.trim();
    const switches = [];
    // Extract the field name part
    const nameMatch = trimmed.match(/^\\?([A-Z][A-Z0-9]*)/i);
    const fieldNameEnd = nameMatch ? nameMatch[0].length : 0;
    // Everything after the field name
    const remaining = trimmed.substring(fieldNameEnd).trim();
    // Extract switches (start with \)
    const switchRegex = /\\(\*|@|#|!|[a-z])\s*(?:"([^"]*)"|([\S]*))?/gi;
    let switchMatch;
    const switchPositions = [];
    while ((switchMatch = switchRegex.exec(remaining)) !== null) {
        const sw = {
            switch: switchMatch[1],
        };
        if (switchMatch[2]) {
            // Quoted value
            sw.value = switchMatch[2];
        }
        else if (switchMatch[3]) {
            // Unquoted value
            sw.value = switchMatch[3];
        }
        switches.push(sw);
        switchPositions.push({
            start: switchMatch.index,
            end: switchMatch.index + switchMatch[0].length,
        });
    }
    // Find argument (text before first switch, excluding field name)
    let argument;
    if (remaining.length > 0) {
        const firstSwitchPos = switchPositions.length > 0 ? switchPositions[0].start : remaining.length;
        const beforeSwitch = remaining.substring(0, firstSwitchPos).trim();
        // Remove quotes if present
        if (beforeSwitch.startsWith('"') && beforeSwitch.endsWith('"')) {
            argument = beforeSwitch.slice(1, -1);
        }
        else if (beforeSwitch) {
            argument = beforeSwitch;
        }
    }
    return {
        type,
        raw: instruction,
        argument,
        switches,
    };
}
/**
 * Get the format switch value (\* or \@)
 *
 * @param instruction - Parsed instruction
 * @returns Format string or undefined
 */
export function getFormatSwitch(instruction) {
    const formatSwitch = instruction.switches.find((s) => s.switch === '*' || s.switch === '@');
    return formatSwitch === null || formatSwitch === void 0 ? void 0 : formatSwitch.value;
}
/**
 * Check if field has MERGEFORMAT switch (preserve formatting)
 *
 * @param instruction - Parsed instruction
 * @returns true if MERGEFORMAT is present
 */
export function hasMergeFormat(instruction) {
    var _a;
    const formatSwitch = instruction.switches.find((s) => s.switch === '*');
    return ((_a = formatSwitch === null || formatSwitch === void 0 ? void 0 : formatSwitch.value) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'MERGEFORMAT';
}
// ============================================================================
// SIMPLE FIELD PARSING
// ============================================================================
/**
 * Parse a simple field element (w:fldSimple)
 *
 * @param node - The w:fldSimple XML element
 * @param styles - Style definitions for parsing content runs
 * @param theme - Theme for color/font resolution
 * @returns Parsed SimpleField object
 */
export function parseSimpleField(node, styles, theme) {
    var _a;
    const instruction = (_a = getAttribute(node, 'w', 'instr')) !== null && _a !== void 0 ? _a : '';
    const fieldType = parseFieldType(instruction);
    const field = {
        type: 'simpleField',
        instruction,
        fieldType,
        content: [],
    };
    // Check for fldLock
    const fldLock = getAttribute(node, 'w', 'fldLock');
    if (fldLock === '1' || fldLock === 'true') {
        field.fldLock = true;
    }
    // Check for dirty (needs update)
    const dirty = getAttribute(node, 'w', 'dirty');
    if (dirty === '1' || dirty === 'true') {
        field.dirty = true;
    }
    // Parse content (child runs and hyperlinks)
    const children = findChildren(node, 'w', 'r');
    for (const child of children) {
        const run = parseRun(child, styles, theme);
        field.content.push(run);
    }
    // Note: Hyperlinks inside fields would need their own parsing
    // For now, we handle runs which is the common case
    return field;
}
/**
 * Create a new complex field context
 */
export function createComplexFieldContext() {
    return {
        state: 'outside',
        instruction: '',
        codeRuns: [],
        resultRuns: [],
        fldLock: false,
        dirty: false,
        nestingLevel: 0,
    };
}
/**
 * Reset the context for a new field
 */
export function resetComplexFieldContext(ctx) {
    ctx.state = 'code';
    ctx.instruction = '';
    ctx.codeRuns = [];
    ctx.resultRuns = [];
    ctx.fldLock = false;
    ctx.dirty = false;
}
/**
 * Finalize a complex field from its context
 *
 * @param ctx - The field context
 * @returns The parsed ComplexField
 */
export function finalizeComplexField(ctx) {
    return Object.assign(Object.assign({ type: 'complexField', instruction: ctx.instruction.trim(), fieldType: parseFieldType(ctx.instruction), fieldCode: ctx.codeRuns, fieldResult: ctx.resultRuns }, (ctx.fldLock && { fldLock: true })), (ctx.dirty && { dirty: true }));
}
// ============================================================================
// FIELD VALUE EXTRACTION
// ============================================================================
/**
 * Get the current display value of a field
 *
 * @param field - The field (simple or complex)
 * @returns The display text
 */
export function getFieldDisplayValue(field) {
    if (field.type === 'simpleField') {
        return field.content
            .filter((c) => 'content' in c)
            .map((run) => getRunText(run))
            .join('');
    }
    else {
        return field.fieldResult.map((run) => getRunText(run)).join('');
    }
}
/**
 * Helper to get text from a run (simplified)
 */
function getRunText(run) {
    return run.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');
}
/**
 * Check if field represents a page number
 *
 * @param field - The field to check
 * @returns true if this is a page number field
 */
export function isPageNumberField(field) {
    return field.fieldType === 'PAGE';
}
/**
 * Check if field represents total page count
 *
 * @param field - The field to check
 * @returns true if this is a total pages field
 */
export function isTotalPagesField(field) {
    return field.fieldType === 'NUMPAGES';
}
/**
 * Check if field is a date/time field
 *
 * @param field - The field to check
 * @returns true if this is a date/time field
 */
export function isDateTimeField(field) {
    const dateTimeTypes = [
        'DATE',
        'TIME',
        'CREATEDATE',
        'SAVEDATE',
        'PRINTDATE',
        'EDITTIME',
    ];
    return dateTimeTypes.includes(field.fieldType);
}
/**
 * Check if field is a document property field
 *
 * @param field - The field to check
 * @returns true if this is a document property field
 */
export function isDocPropertyField(field) {
    const docPropTypes = [
        'AUTHOR',
        'TITLE',
        'SUBJECT',
        'KEYWORDS',
        'COMMENTS',
        'FILENAME',
        'FILESIZE',
        'TEMPLATE',
        'REVNUM',
        'DOCPROPERTY',
        'DOCVARIABLE',
    ];
    return docPropTypes.includes(field.fieldType);
}
/**
 * Check if field is a cross-reference field
 *
 * @param field - The field to check
 * @returns true if this is a cross-reference field
 */
export function isReferenceField(field) {
    const refTypes = ['REF', 'PAGEREF', 'NOTEREF'];
    return refTypes.includes(field.fieldType);
}
/**
 * Check if field is a mail merge field
 *
 * @param field - The field to check
 * @returns true if this is a mail merge field
 */
export function isMergeField(field) {
    const mergeTypes = ['MERGEFIELD', 'IF', 'NEXT', 'NEXTIF', 'ASK', 'SET'];
    return mergeTypes.includes(field.fieldType);
}
/**
 * Check if field is a hyperlink field
 *
 * @param field - The field to check
 * @returns true if this is a hyperlink field
 */
export function isHyperlinkField(field) {
    return field.fieldType === 'HYPERLINK';
}
/**
 * Check if field is a TOC/Index field
 *
 * @param field - The field to check
 * @returns true if this is a TOC or index field
 */
export function isTocField(field) {
    const tocTypes = ['TOC', 'TOA', 'INDEX'];
    return tocTypes.includes(field.fieldType);
}
// ============================================================================
// FIELD VALUE COMPUTATION
// ============================================================================
/**
 * Compute the value for a page number field
 *
 * @param pageNumber - Current page number
 * @param instruction - Parsed instruction for format switches
 * @returns Formatted page number string
 */
export function computePageNumber(pageNumber, instruction) {
    if (!instruction) {
        return String(pageNumber);
    }
    const format = getFormatSwitch(instruction);
    if (!format) {
        return String(pageNumber);
    }
    // Handle common format switches
    switch (format.toUpperCase()) {
        case 'ROMAN':
            return toRoman(pageNumber);
        case 'ALPHABETIC':
            return toLetter(pageNumber);
        case 'ARABIC':
        default:
            return String(pageNumber);
    }
}
/**
 * Convert number to uppercase Roman numerals
 */
function toRoman(num) {
    if (num <= 0 || num > 3999)
        return String(num);
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    let remaining = num;
    for (let i = 0; i < values.length; i++) {
        while (remaining >= values[i]) {
            result += symbols[i];
            remaining -= values[i];
        }
    }
    return result;
}
/**
 * Convert number to letter (A, B, ... Z, AA, AB, ...)
 */
function toLetter(num) {
    if (num <= 0)
        return String(num);
    let result = '';
    let n = num;
    while (n > 0) {
        n--;
        result = String.fromCharCode(65 + (n % 26)) + result;
        n = Math.floor(n / 26);
    }
    return result;
}
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
export function formatDate(date, format) {
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const shortMonths = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pad = (n) => n.toString().padStart(2, '0');
    let result = format;
    // Year
    result = result.replace(/yyyy/g, date.getFullYear().toString());
    result = result.replace(/yy/g, (date.getFullYear() % 100).toString().padStart(2, '0'));
    // Month - do longer patterns first
    result = result.replace(/MMMM/g, months[date.getMonth()]);
    result = result.replace(/MMM/g, shortMonths[date.getMonth()]);
    result = result.replace(/MM/g, pad(date.getMonth() + 1));
    result = result.replace(/M/g, (date.getMonth() + 1).toString());
    // Day - do longer patterns first
    result = result.replace(/dddd/g, days[date.getDay()]);
    result = result.replace(/ddd/g, shortDays[date.getDay()]);
    result = result.replace(/dd/g, pad(date.getDate()));
    result = result.replace(/d/g, date.getDate().toString());
    // Hour (12-hour)
    const hour12 = date.getHours() % 12 || 12;
    result = result.replace(/hh/g, pad(hour12));
    result = result.replace(/h/g, hour12.toString());
    // Hour (24-hour)
    result = result.replace(/HH/g, pad(date.getHours()));
    result = result.replace(/H/g, date.getHours().toString());
    // Minute (use lowercase m for minutes - distinguished by context)
    // This is simplified - in OOXML, 'm' in date context is month, in time context is minute
    result = result.replace(/mm/g, pad(date.getMinutes()));
    // Second
    result = result.replace(/ss/g, pad(date.getSeconds()));
    result = result.replace(/s/g, date.getSeconds().toString());
    // AM/PM
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    result = result.replace(/AM\/PM/g, ampm);
    result = result.replace(/am\/pm/g, ampm.toLowerCase());
    return result;
}
// ============================================================================
// FIELD COLLECTION
// ============================================================================
/**
 * Collect all fields from a document content array
 *
 * @param content - Array of paragraph content items
 * @returns Array of all fields found
 */
export function collectFields(content) {
    const fields = [];
    for (const item of content) {
        if (item && typeof item === 'object' && 'type' in item) {
            const typed = item;
            if (typed.type === 'simpleField' || typed.type === 'complexField') {
                fields.push(item);
            }
        }
    }
    return fields;
}
/**
 * Get all fields of a specific type
 *
 * @param fields - Array of fields
 * @param fieldType - The field type to filter by
 * @returns Filtered array of fields
 */
export function getFieldsByType(fields, fieldType) {
    return fields.filter((f) => f.fieldType === fieldType);
}
/**
 * Find all page number fields
 *
 * @param fields - Array of fields
 * @returns Array of PAGE fields
 */
export function getPageNumberFields(fields) {
    return getFieldsByType(fields, 'PAGE');
}
/**
 * Find all merge fields
 *
 * @param fields - Array of fields
 * @returns Array of MERGEFIELD fields
 */
export function getMergeFields(fields) {
    return getFieldsByType(fields, 'MERGEFIELD');
}
/**
 * Extract merge field names from fields
 *
 * @param fields - Array of fields
 * @returns Array of merge field names
 */
export function getMergeFieldNames(fields) {
    return getMergeFields(fields)
        .map((f) => {
        const parsed = parseFieldInstruction(f.instruction);
        return parsed.argument;
    })
        .filter((name) => !!name);
}
//# sourceMappingURL=fieldParser.js.map