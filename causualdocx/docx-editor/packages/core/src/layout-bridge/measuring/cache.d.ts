/**
 * Measurement Cache
 *
 * LRU cache for text width measurements and paragraph layout results.
 * Improves performance by avoiding repeated measurements of identical content.
 */
import type { ParagraphBlock, ParagraphMeasure } from '../../layout-engine/types';
/**
 * Get cached text width or return undefined
 */
export declare function getCachedTextWidth(text: string, font: string, letterSpacing?: number): number | undefined;
/**
 * Store text width in cache
 */
export declare function setCachedTextWidth(text: string, font: string, letterSpacing: number, width: number): void;
/**
 * Clear the text width cache
 */
export declare function clearTextWidthCache(): void;
/**
 * Set the maximum size of the text width cache
 */
export declare function setTextCacheSize(size: number): void;
/**
 * Get current text width cache size
 */
export declare function getTextCacheSize(): number;
/**
 * Cached font metrics entry
 */
interface FontMetricsEntry {
    ascent: number;
    descent: number;
    lineHeight: number;
}
/**
 * Get cached font metrics or return undefined
 */
export declare function getCachedFontMetrics(fontFamily: string, fontSize: number, bold?: boolean, italic?: boolean): FontMetricsEntry | undefined;
/**
 * Store font metrics in cache
 */
export declare function setCachedFontMetrics(fontFamily: string, fontSize: number, bold: boolean, italic: boolean, metrics: FontMetricsEntry): void;
/**
 * Clear the font metrics cache
 */
export declare function clearFontMetricsCache(): void;
/**
 * Set the maximum size of the font metrics cache
 */
export declare function setFontCacheSize(size: number): void;
/**
 * Get current font metrics cache size
 */
export declare function getFontCacheSize(): number;
/**
 * Generate a simple hash for a paragraph block
 * Used as cache key to identify identical content
 */
export declare function hashParagraphBlock(block: ParagraphBlock): string;
/**
 * Get cached paragraph measurement or return undefined
 */
export declare function getCachedParagraphMeasure(block: ParagraphBlock, maxWidth: number): ParagraphMeasure | undefined;
/**
 * Store paragraph measurement in cache
 */
export declare function setCachedParagraphMeasure(block: ParagraphBlock, maxWidth: number, measure: ParagraphMeasure): void;
/**
 * Clear the paragraph measure cache
 */
export declare function clearParagraphMeasureCache(): void;
/**
 * Set the maximum size of the paragraph measure cache
 */
export declare function setParagraphCacheSize(size: number): void;
/**
 * Get current paragraph measure cache size
 */
export declare function getParagraphCacheSize(): number;
/**
 * Clear all measurement caches
 * Call when fonts change, page width changes, or for testing
 */
export declare function clearAllCaches(): void;
/**
 * Get total size of all caches
 */
export declare function getTotalCacheSize(): number;
export {};
//# sourceMappingURL=cache.d.ts.map