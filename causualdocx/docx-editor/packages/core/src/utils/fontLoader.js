/**
 * Google Fonts Loader
 *
 * Dynamically loads fonts from Google Fonts API with:
 * - Loading state tracking
 * - Duplicate prevention
 * - Callback notifications
 * - Font availability detection
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Track loaded fonts to avoid duplicate requests
const loadedFonts = new Set();
// Track fonts currently being loaded
const loadingFonts = new Map();
// Callbacks to notify when fonts are loaded
const loadCallbacks = new Set();
// Track overall loading state
let isLoadingAny = false;
/**
 * Generate Google Fonts CSS URL for a font family
 *
 * @param fontFamily - The font family name (e.g., "Roboto", "Open Sans")
 * @param weights - Font weights to load (default: 400, 700)
 * @param styles - Font styles to load (default: normal, italic)
 * @returns Google Fonts CSS URL
 */
function getGoogleFontsUrl(fontFamily, weights = [400, 700], styles = ['normal', 'italic']) {
    // Encode font family name for URL
    const encodedFamily = encodeURIComponent(fontFamily);
    // Build weight/style combinations
    // Format: ital,wght@0,400;0,700;1,400;1,700
    const combinations = [];
    for (const style of styles) {
        const italVal = style === 'italic' ? 1 : 0;
        for (const weight of weights) {
            combinations.push(`${italVal},${weight}`);
        }
    }
    // Sort and join
    combinations.sort();
    const spec = combinations.join(';');
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@${spec}&display=swap`;
}
/**
 * Load a font from Google Fonts
 *
 * @param fontFamily - The font family name to load
 * @param options - Optional configuration
 * @returns Promise resolving to true if font loaded successfully, false otherwise
 */
export function loadFont(fontFamily, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Skip font loading in non-browser environments (Node.js, SSR)
        if (typeof document === 'undefined') {
            return false;
        }
        // Normalize font family name
        const normalizedFamily = fontFamily.trim();
        // Already loaded?
        if (loadedFonts.has(normalizedFamily)) {
            return true;
        }
        // Self-hosted first: if this family is already declared via a bundled
        // `@font-face` (Carlito/Caladea/Liberation, shipped in fonts.css), load it
        // from the local woff2 instead of fetching from the Google CDN. This is what
        // keeps rendering deterministic offline and in regions where Google is
        // blocked — no third-party request, no IP leak.
        if ('fonts' in document) {
            const declared = Array.from(document.fonts).some((ff) => ff.family.replace(/['"]/g, '').toLowerCase() === normalizedFamily.toLowerCase());
            if (declared) {
                try {
                    yield document.fonts.load(`400 16px "${normalizedFamily}"`);
                }
                catch (_a) {
                    // ignore — the @font-face is present; canvas/CSS will still use it
                }
                loadedFonts.add(normalizedFamily);
                notifyCallbacks([normalizedFamily]);
                return true;
            }
        }
        // Currently loading? Return existing promise
        const existingLoad = loadingFonts.get(normalizedFamily);
        if (existingLoad) {
            return existingLoad;
        }
        // Create load promise
        const loadPromise = (() => __awaiter(this, void 0, void 0, function* () {
            isLoadingAny = true;
            try {
                // Generate Google Fonts URL
                const url = getGoogleFontsUrl(normalizedFamily, options === null || options === void 0 ? void 0 : options.weights, options === null || options === void 0 ? void 0 : options.styles);
                // Create link element
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                // Wait for load or error
                const loaded = yield new Promise((resolve) => {
                    link.onload = () => resolve(true);
                    link.onerror = () => resolve(false);
                    // Append to head
                    document.head.appendChild(link);
                    // Timeout after 5 seconds
                    setTimeout(() => resolve(false), 5000);
                });
                if (loaded) {
                    // Wait a bit for the font to be available
                    yield waitForFontAvailable(normalizedFamily, 3000);
                    loadedFonts.add(normalizedFamily);
                    // Notify callbacks
                    notifyCallbacks([normalizedFamily]);
                    return true;
                }
                return false;
            }
            catch (error) {
                console.warn(`Failed to load font "${normalizedFamily}":`, error);
                return false;
            }
            finally {
                loadingFonts.delete(normalizedFamily);
                // Check if still loading any fonts
                if (loadingFonts.size === 0) {
                    isLoadingAny = false;
                }
            }
        }))();
        loadingFonts.set(normalizedFamily, loadPromise);
        return loadPromise;
    });
}
/**
 * Load multiple fonts from Google Fonts
 *
 * @param families - Array of font family names to load
 * @param options - Optional configuration
 * @returns Promise resolving when all fonts are loaded (or failed)
 */
export function loadFonts(families, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Filter out already loaded fonts
        const toLoad = families.filter((family) => !loadedFonts.has(family.trim()));
        if (toLoad.length === 0) {
            return;
        }
        // Load all fonts in parallel
        yield Promise.all(toLoad.map((family) => loadFont(family, options)));
    });
}
/**
 * Check if a font is loaded
 *
 * @param fontFamily - The font family name to check
 * @returns true if the font is loaded, false otherwise
 */
export function isFontLoaded(fontFamily) {
    return loadedFonts.has(fontFamily.trim());
}
/**
 * Check if any fonts are currently loading
 *
 * @returns true if any fonts are loading, false otherwise
 */
export function isLoading() {
    return isLoadingAny;
}
/**
 * Get list of all loaded fonts
 *
 * @returns Array of loaded font family names
 */
export function getLoadedFonts() {
    return Array.from(loadedFonts);
}
/**
 * Register a callback to be notified when fonts are loaded
 *
 * @param callback - Function to call when fonts are loaded
 * @returns Cleanup function to remove the callback
 */
export function onFontsLoaded(callback) {
    loadCallbacks.add(callback);
    // Return cleanup function
    return () => {
        loadCallbacks.delete(callback);
    };
}
/**
 * Notify all registered callbacks
 */
function notifyCallbacks(fonts) {
    for (const callback of loadCallbacks) {
        try {
            callback(fonts);
        }
        catch (error) {
            console.warn('Font load callback error:', error);
        }
    }
}
/**
 * Wait for a font to be available using the CSS Font Loading API
 *
 * @param fontFamily - The font family to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise resolving when font is available or timeout
 */
function waitForFontAvailable(fontFamily, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use CSS Font Loading API if available
        if ('fonts' in document) {
            try {
                // Try to wait for the font
                const fontFace = `400 16px "${fontFamily}"`;
                yield Promise.race([
                    document.fonts.load(fontFace),
                    new Promise((resolve) => setTimeout(resolve, timeout)),
                ]);
                return document.fonts.check(fontFace);
            }
            catch (_a) {
                // Fall through to fallback
            }
        }
        // Fallback: just wait a bit
        yield new Promise((resolve) => setTimeout(resolve, 100));
        return true;
    });
}
/**
 * Check if a font is available on the system using canvas measurement
 *
 * This uses the technique of comparing text width with the target font
 * vs a known fallback font. If they differ, the font is available.
 *
 * @param fontFamily - The font family name to check
 * @param fallbackFont - Fallback font to compare against
 * @returns true if font is available, false otherwise
 */
export function canRenderFont(fontFamily, fallbackFont = 'sans-serif') {
    // Skip if we're not in a browser
    if (typeof document === 'undefined') {
        return false;
    }
    const _canRenderFont = (fontName, fallback) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return false;
        }
        ctx.textBaseline = 'top';
        const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
        // Measure with fallback font only
        ctx.font = `72px ${fallback}`;
        const fallbackWidth = ctx.measureText(text).width;
        // Measure with target font (with fallback)
        ctx.font = `72px "${fontName}", ${fallback}`;
        const customWidth = ctx.measureText(text).width;
        // If widths differ, the custom font was used
        return customWidth !== fallbackWidth;
    };
    // Check with primary fallback
    if (_canRenderFont(fontFamily, fallbackFont)) {
        return true;
    }
    // Check with opposite fallback (handles edge case where font name
    // matches the browser's default sans-serif or serif)
    const oppositeFallback = fallbackFont === 'sans-serif' ? 'serif' : 'sans-serif';
    return _canRenderFont(fontFamily, oppositeFallback);
}
/**
 * Load a font from a raw buffer (e.g., embedded in DOCX)
 *
 * @param fontFamily - The font family name
 * @param buffer - Font file buffer (TTF, OTF, WOFF, WOFF2)
 * @param options - Font options
 * @returns Promise resolving when font is loaded
 */
export function loadFontFromBuffer(fontFamily, buffer, options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const normalizedFamily = fontFamily.trim();
        // Already loaded?
        if (loadedFonts.has(normalizedFamily)) {
            return true;
        }
        try {
            // Create blob URL
            const blob = new Blob([buffer], { type: 'font/ttf' });
            const url = URL.createObjectURL(blob);
            // Create @font-face CSS
            const style = document.createElement('style');
            style.textContent = `
      @font-face {
        font-family: "${normalizedFamily}";
        src: url(${url}) format('truetype');
        font-weight: ${(_a = options === null || options === void 0 ? void 0 : options.weight) !== null && _a !== void 0 ? _a : 'normal'};
        font-style: ${(_b = options === null || options === void 0 ? void 0 : options.style) !== null && _b !== void 0 ? _b : 'normal'};
        font-display: swap;
      }
    `;
            document.head.appendChild(style);
            // Wait for font to be available
            yield waitForFontAvailable(normalizedFamily, 3000);
            loadedFonts.add(normalizedFamily);
            notifyCallbacks([normalizedFamily]);
            return true;
        }
        catch (error) {
            console.warn(`Failed to load font "${normalizedFamily}" from buffer:`, error);
            return false;
        }
    });
}
/**
 * Mapping from common Office/system fonts to Google Fonts equivalents
 *
 * Google Fonts doesn't have exact matches for many Microsoft fonts,
 * but these are close alternatives that work well for document rendering.
 */
export const FONT_MAPPING = {
    // Microsoft Office fonts → bundled OFL equivalents (self-hosted; loaded
    // locally via the @font-face guard in loadFont, no CDN fetch).
    Calibri: 'Carlito',
    Cambria: 'Caladea',
    Arial: 'Liberation Sans',
    'Times New Roman': 'Liberation Serif',
    'Courier New': 'Liberation Mono',
    Garamond: 'EB Garamond',
    'Book Antiqua': 'EB Garamond',
    Georgia: 'Tinos',
    Verdana: 'Open Sans',
    Tahoma: 'Open Sans',
    'Trebuchet MS': 'Source Sans Pro',
    'Century Gothic': 'Poppins',
    'Franklin Gothic': 'Libre Franklin',
    Palatino: 'EB Garamond',
    'Palatino Linotype': 'EB Garamond',
    'Lucida Sans': 'Open Sans',
    'Segoe UI': 'Open Sans',
    Impact: 'Anton',
    'Comic Sans MS': 'Comic Neue',
    Consolas: 'Inconsolata',
    'Lucida Console': 'Inconsolata',
    Monaco: 'Fira Code',
};
/**
 * Get the Google Fonts equivalent for a font name
 *
 * @param fontName - The original font name from the document
 * @returns The Google Fonts equivalent, or the original name if no mapping exists
 */
export function getGoogleFontEquivalent(fontName) {
    const trimmed = fontName.trim();
    return FONT_MAPPING[trimmed] || trimmed;
}
/**
 * Load a font, automatically mapping to Google Fonts equivalent if needed.
 * If the font needs mapping, also creates a CSS alias so the original font
 * name works in stylesheets.
 *
 * @param fontFamily - The font family name (may be an Office font)
 * @returns Promise resolving to true if font loaded
 */
export function loadFontWithMapping(fontFamily) {
    return __awaiter(this, void 0, void 0, function* () {
        const trimmed = fontFamily.trim();
        const googleFont = getGoogleFontEquivalent(trimmed);
        // Load the Google Font under its own name (no aliasing).
        // The font resolver provides CSS fallback stacks that list both the
        // original DOCX font and the Google equivalent, so the browser will
        // use whichever is available without @font-face aliasing that would
        // hijack Canvas measurements.
        if (googleFont !== trimmed) {
            const result = yield loadFont(googleFont);
            if (result) {
                loadedFonts.add(trimmed);
            }
            return result;
        }
        // No mapping needed, load directly
        return loadFont(googleFont);
    });
}
/**
 * Load multiple fonts with automatic mapping to Google Fonts equivalents
 *
 * @param families - Array of font family names
 * @returns Promise resolving when all fonts are loaded
 */
export function loadFontsWithMapping(families) {
    return __awaiter(this, void 0, void 0, function* () {
        // Remove duplicates
        const uniqueFonts = [...new Set(families.map((f) => f.trim()))];
        // Load each font with mapping (creates aliases for Office → Google font mappings)
        yield Promise.all(uniqueFonts.map((family) => loadFontWithMapping(family)));
    });
}
/**
 * Preload a list of common document fonts
 *
 * This preloads fonts commonly used in DOCX documents that have
 * Google Fonts equivalents.
 */
export function preloadCommonFonts() {
    return __awaiter(this, void 0, void 0, function* () {
        const commonFonts = [
            'Carlito', // Calibri equivalent
            'Caladea', // Cambria equivalent
            'Arimo', // Arial equivalent
            'Tinos', // Times New Roman equivalent
            'Cousine', // Courier New equivalent
            'EB Garamond', // Garamond equivalent
        ];
        yield loadFonts(commonFonts);
    });
}
/**
 * Extract all font families used in a document
 *
 * Uses loose typing to handle any document-like structure.
 *
 * @param document - The parsed document
 * @returns Set of unique font family names
 */
export function extractFontsFromDocument(document) {
    var _a, _b, _c, _d, _e, _f;
    const fonts = new Set();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = document;
    if (!(doc === null || doc === void 0 ? void 0 : doc.package))
        return fonts;
    // Extract from document content
    const content = (_b = (_a = doc.package) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.content;
    if (Array.isArray(content)) {
        for (const paragraph of content) {
            if ((paragraph === null || paragraph === void 0 ? void 0 : paragraph.type) === 'paragraph' && Array.isArray(paragraph.content)) {
                for (const run of paragraph.content) {
                    if ((run === null || run === void 0 ? void 0 : run.type) === 'run' && ((_c = run.formatting) === null || _c === void 0 ? void 0 : _c.fontFamily)) {
                        const { ascii, hAnsi } = run.formatting.fontFamily;
                        if (ascii)
                            fonts.add(ascii);
                        if (hAnsi && hAnsi !== ascii)
                            fonts.add(hAnsi);
                    }
                }
            }
        }
    }
    // Extract from styles
    const styles = (_e = (_d = doc.package) === null || _d === void 0 ? void 0 : _d.styles) === null || _e === void 0 ? void 0 : _e.styles;
    if (Array.isArray(styles)) {
        for (const style of styles) {
            if ((_f = style === null || style === void 0 ? void 0 : style.runProperties) === null || _f === void 0 ? void 0 : _f.fontFamily) {
                const { ascii, hAnsi } = style.runProperties.fontFamily;
                if (ascii)
                    fonts.add(ascii);
                if (hAnsi && hAnsi !== ascii)
                    fonts.add(hAnsi);
            }
        }
    }
    return fonts;
}
/**
 * Extract fonts from a document and load them from Google Fonts
 *
 * @param document - The parsed document
 * @returns Promise resolving when fonts are loaded
 */
export function loadDocumentFonts(document) {
    return __awaiter(this, void 0, void 0, function* () {
        const fonts = extractFontsFromDocument(document);
        if (fonts.size === 0) {
            return;
        }
        // Loading document fonts
        yield loadFontsWithMapping(Array.from(fonts));
    });
}
//# sourceMappingURL=fontLoader.js.map