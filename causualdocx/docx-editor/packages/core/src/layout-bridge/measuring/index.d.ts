/**
 * Text Measurement Module
 *
 * Provides text measurement utilities for the layout engine.
 * Uses Canvas API for accurate, cached measurements.
 */
export { getCanvasContext, resetCanvasContext, buildFontString, getFontMetrics, measureTextWidth, measureText, measureRun, findCharacterAtX, getXForCharacter, twipsToPx, pxToTwips, ptToPx, pxToPt, halfPtToPx, pxToHalfPt, type FontStyle, type FontMetrics, type TextMeasurement, type RunMeasurement, } from './measureContainer';
export { measureParagraph, measureParagraphs, getRunCharWidths, type FloatingImageZone, type MeasureParagraphOptions, } from './measureParagraph';
export { getCachedTextWidth, setCachedTextWidth, clearTextWidthCache, setTextCacheSize, getTextCacheSize, getCachedFontMetrics, setCachedFontMetrics, clearFontMetricsCache, setFontCacheSize, getFontCacheSize, hashParagraphBlock, getCachedParagraphMeasure, setCachedParagraphMeasure, clearParagraphMeasureCache, setParagraphCacheSize, getParagraphCacheSize, clearAllCaches, getTotalCacheSize, } from './cache';
//# sourceMappingURL=index.d.ts.map