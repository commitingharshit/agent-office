/**
 * Run Consolidator - Merge consecutive runs with identical formatting
 *
 * DOCX files often contain many small runs with the same formatting,
 * created by Word for various reasons (spell checking, revision tracking,
 * cursor positioning, etc.). This causes:
 * - 252+ tiny <span> elements instead of a few
 * - Poor editing UX (cursor jumps between spans)
 * - Performance issues
 *
 * This module provides utilities to consolidate runs with identical
 * formatting into single runs, reducing fragmentation.
 */
import type { Run, TextFormatting, ParagraphContent, Paragraph } from '../types/document';
/**
 * Check if two TextFormatting objects are equivalent
 *
 * Uses deep comparison of all properties to determine if runs
 * can be merged without losing formatting information.
 */
export declare function formattingEquals(a: TextFormatting | undefined, b: TextFormatting | undefined): boolean;
/**
 * Check if a run contains only text content
 * (runs with special content like images, fields, etc. should not be merged)
 */
export declare function isTextOnlyRun(run: Run): boolean;
/**
 * Check if a run can be merged with another run
 * Runs with breaks, tabs, images, fields, etc. act as merge boundaries
 */
export declare function canMergeRun(run: Run): boolean;
/**
 * Consolidate an array of runs by merging consecutive runs with identical formatting
 *
 * @param runs - Array of runs to consolidate
 * @returns Consolidated array with fewer, larger runs
 */
export declare function consolidateRuns(runs: Run[]): Run[];
/**
 * Consolidate runs within a paragraph content array
 *
 * This handles the full paragraph structure, consolidating runs while
 * preserving hyperlinks, bookmarks, and fields as merge boundaries.
 */
export declare function consolidateParagraphContent(content: ParagraphContent[]): ParagraphContent[];
/**
 * Consolidate all runs within a paragraph
 *
 * @param paragraph - Paragraph to consolidate
 * @returns New paragraph with consolidated runs
 */
export declare function consolidateParagraph(paragraph: Paragraph): Paragraph;
/**
 * Get the number of runs in a paragraph (for debugging/metrics)
 */
export declare function countRuns(paragraph: Paragraph): number;
/**
 * Calculate the consolidation ratio (reduction in number of runs)
 * Useful for debugging and metrics
 */
export declare function getConsolidationStats(originalParagraphs: Paragraph[], consolidatedParagraphs: Paragraph[]): {
    originalRunCount: number;
    consolidatedRunCount: number;
    reductionPercentage: number;
};
//# sourceMappingURL=runConsolidator.d.ts.map