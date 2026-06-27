/**
 * Numbering/List Parser for DOCX
 *
 * Parses numbering.xml to extract:
 * - Abstract numbering definitions (templates with levels)
 * - Numbering instances (concrete references with optional overrides)
 *
 * OOXML Structure:
 * - w:abstractNum - Template definitions with 9 levels (0-8)
 * - w:num - Instances that reference abstractNum and can override levels
 * - w:lvl - Level definition with start, format, text pattern, etc.
 */
import type { NumberingDefinitions, AbstractNumbering, NumberingInstance, ListLevel, NumberFormat } from '../types/document';
/**
 * Map of rId to numbering definitions
 */
export type NumberingMap = {
    definitions: NumberingDefinitions;
    /** Get level info for a numId and ilvl */
    getLevel: (numId: number, ilvl: number) => ListLevel | null;
    /** Get abstract numbering by ID */
    getAbstract: (abstractNumId: number) => AbstractNumbering | null;
    /** Get the numbering instance (numId → abstractNumId + lvlOverrides) */
    getInstance: (numId: number) => NumberingInstance | null;
    /** Check if numId exists */
    hasNumbering: (numId: number) => boolean;
};
/**
 * Parse numbering.xml into NumberingDefinitions
 *
 * @param numberingXml - Raw XML string from word/numbering.xml (or null if not present)
 * @returns NumberingMap with definitions and helper functions
 */
export declare function parseNumbering(numberingXml: string | null): NumberingMap;
/**
 * Format a number according to the specified format
 *
 * @param num - The number to format
 * @param format - The number format
 * @returns Formatted string
 */
export declare function formatNumber(num: number, format: NumberFormat): string;
/**
 * Render list marker text by replacing placeholders with formatted numbers
 *
 * @param lvlText - The level text pattern (e.g., "%1.", "%1.%2")
 * @param counters - Array of counter values for each level (index 0 = level 0, etc.)
 * @param formats - Array of number formats for each level
 * @returns Rendered marker text
 */
export declare function renderListMarker(lvlText: string, counters: number[], formats: NumberFormat[]): string;
/**
 * Get the bullet character for a bullet list level
 *
 * @param level - The list level definition
 * @returns The bullet character to display
 */
export declare function getBulletCharacter(level: ListLevel): string;
/**
 * Check if a list level is a bullet (not numbered)
 */
export declare function isBulletLevel(level: ListLevel): boolean;
//# sourceMappingURL=numberingParser.d.ts.map