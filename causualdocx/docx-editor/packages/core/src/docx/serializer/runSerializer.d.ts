/**
 * Run Serializer - Serialize runs to OOXML XML
 *
 * Converts Run objects back to <w:r> XML format for DOCX files.
 * Handles all formatting properties and content types.
 *
 * OOXML Reference:
 * - Run: w:r
 * - Run properties: w:rPr
 * - Text content: w:t
 */
import type { Run, TextFormatting } from '../../types/document';
/**
 * Reset the auto-incrementing ID counter. Call before each serialization pass
 * to keep IDs deterministic across saves.
 */
export declare function resetAutoIdCounter(): void;
/**
 * Serialize text formatting properties to w:rPr XML
 */
export declare function serializeTextFormatting(formatting: TextFormatting | undefined): string;
/**
 * Serialize a run to OOXML XML (w:r)
 *
 * @param run - The run to serialize
 * @returns XML string for the run
 */
export declare function serializeRun(run: Run): string;
/**
 * Serialize multiple runs to OOXML XML
 *
 * @param runs - The runs to serialize
 * @returns XML string for all runs
 */
export declare function serializeRuns(runs: Run[]): string;
/**
 * Check if a run has any content
 */
export declare function hasRunContent(run: Run): boolean;
/**
 * Check if a run has formatting
 */
export declare function hasRunFormatting(run: Run): boolean;
/**
 * Get plain text from a run (for comparison/debugging)
 */
export declare function getRunPlainText(run: Run): string;
/**
 * Create an empty run
 */
export declare function createEmptyRun(): Run;
/**
 * Create a text run
 */
export declare function createTextRun(text: string, formatting?: TextFormatting): Run;
/**
 * Create a break run
 */
export declare function createBreakRun(breakType?: 'page' | 'column' | 'textWrapping', formatting?: TextFormatting): Run;
/**
 * Create a tab run
 */
export declare function createTabRun(formatting?: TextFormatting): Run;
export default serializeRun;
//# sourceMappingURL=runSerializer.d.ts.map