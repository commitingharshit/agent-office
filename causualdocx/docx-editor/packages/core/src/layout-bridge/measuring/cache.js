/**
 * Measurement Cache
 *
 * LRU cache for text width measurements and paragraph layout results.
 * Improves performance by avoiding repeated measurements of identical content.
 */
/**
 * Default max entries for text width cache
 * Large documents (30+ pages) can generate 20,000+ unique text measurements.
 * A generous default avoids cache thrashing on big docs.
 */
const DEFAULT_TEXT_CACHE_SIZE = 20000;
/**
 * Current max size for text width cache
 */
let textCacheMaxSize = DEFAULT_TEXT_CACHE_SIZE;
/**
 * LRU cache for text width measurements
 * Key format: "text|font|letterSpacing"
 */
const textWidthCache = new Map();
/**
 * Create a cache key for text width lookup
 */
function makeTextKey(text, font, letterSpacing) {
    return `${text}|${font}|${letterSpacing || 0}`;
}
/**
 * Evict oldest entries if cache exceeds max size
 */
function evictTextEntries() {
    while (textWidthCache.size > textCacheMaxSize) {
        const oldestKey = textWidthCache.keys().next().value;
        if (oldestKey === undefined)
            break;
        textWidthCache.delete(oldestKey);
    }
}
/**
 * Get cached text width or return undefined
 */
export function getCachedTextWidth(text, font, letterSpacing = 0) {
    const key = makeTextKey(text, font, letterSpacing);
    const entry = textWidthCache.get(key);
    if (entry !== undefined) {
        // Refresh LRU - move to end by re-inserting
        textWidthCache.delete(key);
        textWidthCache.set(key, entry);
        return entry.width;
    }
    return undefined;
}
/**
 * Store text width in cache
 */
export function setCachedTextWidth(text, font, letterSpacing, width) {
    const key = makeTextKey(text, font, letterSpacing);
    textWidthCache.set(key, { width });
    evictTextEntries();
}
/**
 * Clear the text width cache
 */
export function clearTextWidthCache() {
    textWidthCache.clear();
}
/**
 * Set the maximum size of the text width cache
 */
export function setTextCacheSize(size) {
    if (!Number.isFinite(size) || size <= 0) {
        return;
    }
    textCacheMaxSize = size;
    evictTextEntries();
}
/**
 * Get current text width cache size
 */
export function getTextCacheSize() {
    return textWidthCache.size;
}
/**
 * Default max entries for font metrics cache
 */
const DEFAULT_FONT_CACHE_SIZE = 1000;
/**
 * Current max size for font metrics cache
 */
let fontCacheMaxSize = DEFAULT_FONT_CACHE_SIZE;
/**
 * LRU cache for font metrics
 * Key format: "fontFamily|fontSize|bold|italic"
 */
const fontMetricsCache = new Map();
/**
 * Create a cache key for font metrics lookup
 */
function makeFontKey(fontFamily, fontSize, bold = false, italic = false) {
    return `${fontFamily}|${fontSize}|${bold}|${italic}`;
}
/**
 * Evict oldest entries if font cache exceeds max size
 */
function evictFontEntries() {
    while (fontMetricsCache.size > fontCacheMaxSize) {
        const oldestKey = fontMetricsCache.keys().next().value;
        if (oldestKey === undefined)
            break;
        fontMetricsCache.delete(oldestKey);
    }
}
/**
 * Get cached font metrics or return undefined
 */
export function getCachedFontMetrics(fontFamily, fontSize, bold = false, italic = false) {
    const key = makeFontKey(fontFamily, fontSize, bold, italic);
    const entry = fontMetricsCache.get(key);
    if (entry !== undefined) {
        // Refresh LRU
        fontMetricsCache.delete(key);
        fontMetricsCache.set(key, entry);
        return entry;
    }
    return undefined;
}
/**
 * Store font metrics in cache
 */
export function setCachedFontMetrics(fontFamily, fontSize, bold, italic, metrics) {
    const key = makeFontKey(fontFamily, fontSize, bold, italic);
    fontMetricsCache.set(key, metrics);
    evictFontEntries();
}
/**
 * Clear the font metrics cache
 */
export function clearFontMetricsCache() {
    fontMetricsCache.clear();
}
/**
 * Set the maximum size of the font metrics cache
 */
export function setFontCacheSize(size) {
    if (!Number.isFinite(size) || size <= 0) {
        return;
    }
    fontCacheMaxSize = size;
    evictFontEntries();
}
/**
 * Get current font metrics cache size
 */
export function getFontCacheSize() {
    return fontMetricsCache.size;
}
/**
 * Default max entries for paragraph measure cache
 * Large documents can have 500+ unique paragraphs.
 */
const DEFAULT_PARAGRAPH_CACHE_SIZE = 5000;
/**
 * Current max size for paragraph measure cache
 */
let paragraphCacheMaxSize = DEFAULT_PARAGRAPH_CACHE_SIZE;
/**
 * LRU cache for paragraph measurements
 * Key format: block content hash
 */
const paragraphMeasureCache = new Map();
/**
 * Generate a simple hash for a paragraph block
 * Used as cache key to identify identical content
 */
export function hashParagraphBlock(block) {
    // Simple hash based on runs content
    const parts = [];
    for (const run of block.runs) {
        if (run.kind === 'text') {
            parts.push(`t:${run.text}|${run.fontFamily}|${run.fontSize}|${run.bold}|${run.italic}`);
        }
        else if (run.kind === 'tab') {
            parts.push(`tab:${run.width}`);
        }
        else if (run.kind === 'image') {
            parts.push(`img:${run.width}x${run.height}`);
        }
        else if (run.kind === 'lineBreak') {
            parts.push('br');
        }
    }
    // Include relevant attrs in hash
    const attrs = block.attrs;
    if (attrs) {
        if (attrs.alignment)
            parts.push(`align:${attrs.alignment}`);
        if (attrs.indent) {
            parts.push(`indent:${attrs.indent.left}|${attrs.indent.right}|${attrs.indent.firstLine}|${attrs.indent.hanging}`);
        }
        if (attrs.spacing) {
            parts.push(`spacing:${attrs.spacing.before}|${attrs.spacing.after}|${attrs.spacing.line}|${attrs.spacing.lineRule}`);
        }
        // Default font drives line height for empty paragraphs (no runs to hash).
        // Without this, empty paragraphs collide regardless of font choice and the
        // caret renders at the previously cached size until typing forces a re-key.
        if (attrs.defaultFontSize != null)
            parts.push(`dfs:${attrs.defaultFontSize}`);
        if (attrs.defaultFontFamily != null)
            parts.push(`dff:${attrs.defaultFontFamily}`);
        // Borders affect measurement only via box-sizing in the renderer, but their
        // presence on otherwise-identical empty paragraphs (e.g. one with a
        // `<w:pBdr>` horizontal rule, one without) is a real authorial difference
        // — fold them into the key so the two don't share a cache entry.
        const b = attrs.borders;
        if (b) {
            const sig = (s) => { var _a, _b, _c; return s ? `${(_a = s.width) !== null && _a !== void 0 ? _a : ''},${(_b = s.style) !== null && _b !== void 0 ? _b : ''},${(_c = s.color) !== null && _c !== void 0 ? _c : ''}` : ''; };
            parts.push(`bdr:${sig(b.top)}|${sig(b.bottom)}|${sig(b.left)}|${sig(b.right)}`);
        }
        // Same for the trailing-empty-paragraph-after-table zero-height flag.
        if (attrs.suppressEmptyParagraphHeight)
            parts.push('sup');
    }
    return parts.join('||');
}
/**
 * Evict oldest entries if paragraph cache exceeds max size
 */
function evictParagraphEntries() {
    while (paragraphMeasureCache.size > paragraphCacheMaxSize) {
        const oldestKey = paragraphMeasureCache.keys().next().value;
        if (oldestKey === undefined)
            break;
        paragraphMeasureCache.delete(oldestKey);
    }
}
/**
 * Get cached paragraph measurement or return undefined
 */
export function getCachedParagraphMeasure(block, maxWidth) {
    const key = hashParagraphBlock(block);
    const entry = paragraphMeasureCache.get(key);
    if (entry !== undefined && entry.maxWidth === maxWidth) {
        // Refresh LRU
        paragraphMeasureCache.delete(key);
        paragraphMeasureCache.set(key, entry);
        return entry.measure;
    }
    return undefined;
}
/**
 * Store paragraph measurement in cache
 */
export function setCachedParagraphMeasure(block, maxWidth, measure) {
    const key = hashParagraphBlock(block);
    paragraphMeasureCache.set(key, { measure, maxWidth });
    evictParagraphEntries();
}
/**
 * Clear the paragraph measure cache
 */
export function clearParagraphMeasureCache() {
    paragraphMeasureCache.clear();
}
/**
 * Set the maximum size of the paragraph measure cache
 */
export function setParagraphCacheSize(size) {
    if (!Number.isFinite(size) || size <= 0) {
        return;
    }
    paragraphCacheMaxSize = size;
    evictParagraphEntries();
}
/**
 * Get current paragraph measure cache size
 */
export function getParagraphCacheSize() {
    return paragraphMeasureCache.size;
}
// =============================================================================
// GLOBAL CACHE MANAGEMENT
// =============================================================================
/**
 * Clear all measurement caches
 * Call when fonts change, page width changes, or for testing
 */
export function clearAllCaches() {
    clearTextWidthCache();
    clearFontMetricsCache();
    clearParagraphMeasureCache();
}
/**
 * Get total size of all caches
 */
export function getTotalCacheSize() {
    return getTextCacheSize() + getFontCacheSize() + getParagraphCacheSize();
}
//# sourceMappingURL=cache.js.map