/**
 * Google Fonts Loader
 *
 * Dynamically loads fonts from Google Fonts API with:
 * - Loading state tracking
 * - Duplicate prevention
 * - Callback notifications
 * - Font availability detection
 */
/**
 * Load a font from Google Fonts
 *
 * @param fontFamily - The font family name to load
 * @param options - Optional configuration
 * @returns Promise resolving to true if font loaded successfully, false otherwise
 */
export declare function loadFont(fontFamily: string, options?: {
    weights?: number[];
    styles?: ('normal' | 'italic')[];
}): Promise<boolean>;
/**
 * Load multiple fonts from Google Fonts
 *
 * @param families - Array of font family names to load
 * @param options - Optional configuration
 * @returns Promise resolving when all fonts are loaded (or failed)
 */
export declare function loadFonts(families: string[], options?: {
    weights?: number[];
    styles?: ('normal' | 'italic')[];
}): Promise<void>;
/**
 * Check if a font is loaded
 *
 * @param fontFamily - The font family name to check
 * @returns true if the font is loaded, false otherwise
 */
export declare function isFontLoaded(fontFamily: string): boolean;
/**
 * Check if any fonts are currently loading
 *
 * @returns true if any fonts are loading, false otherwise
 */
export declare function isLoading(): boolean;
/**
 * Get list of all loaded fonts
 *
 * @returns Array of loaded font family names
 */
export declare function getLoadedFonts(): string[];
/**
 * Register a callback to be notified when fonts are loaded
 *
 * @param callback - Function to call when fonts are loaded
 * @returns Cleanup function to remove the callback
 */
export declare function onFontsLoaded(callback: (fonts: string[]) => void): () => void;
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
export declare function canRenderFont(fontFamily: string, fallbackFont?: string): boolean;
/**
 * Load a font from a raw buffer (e.g., embedded in DOCX)
 *
 * @param fontFamily - The font family name
 * @param buffer - Font file buffer (TTF, OTF, WOFF, WOFF2)
 * @param options - Font options
 * @returns Promise resolving when font is loaded
 */
export declare function loadFontFromBuffer(fontFamily: string, buffer: ArrayBuffer, options?: {
    weight?: number | string;
    style?: 'normal' | 'italic';
}): Promise<boolean>;
/**
 * Mapping from common Office/system fonts to Google Fonts equivalents
 *
 * Google Fonts doesn't have exact matches for many Microsoft fonts,
 * but these are close alternatives that work well for document rendering.
 */
export declare const FONT_MAPPING: Record<string, string>;
/**
 * Get the Google Fonts equivalent for a font name
 *
 * @param fontName - The original font name from the document
 * @returns The Google Fonts equivalent, or the original name if no mapping exists
 */
export declare function getGoogleFontEquivalent(fontName: string): string;
/**
 * Load a font, automatically mapping to Google Fonts equivalent if needed.
 * If the font needs mapping, also creates a CSS alias so the original font
 * name works in stylesheets.
 *
 * @param fontFamily - The font family name (may be an Office font)
 * @returns Promise resolving to true if font loaded
 */
export declare function loadFontWithMapping(fontFamily: string): Promise<boolean>;
/**
 * Load multiple fonts with automatic mapping to Google Fonts equivalents
 *
 * @param families - Array of font family names
 * @returns Promise resolving when all fonts are loaded
 */
export declare function loadFontsWithMapping(families: string[]): Promise<void>;
/**
 * Preload a list of common document fonts
 *
 * This preloads fonts commonly used in DOCX documents that have
 * Google Fonts equivalents.
 */
export declare function preloadCommonFonts(): Promise<void>;
/**
 * Extract all font families used in a document
 *
 * Uses loose typing to handle any document-like structure.
 *
 * @param document - The parsed document
 * @returns Set of unique font family names
 */
export declare function extractFontsFromDocument(document: unknown): Set<string>;
/**
 * Extract fonts from a document and load them from Google Fonts
 *
 * @param document - The parsed document
 * @returns Promise resolving when fonts are loaded
 */
export declare function loadDocumentFonts(document: unknown): Promise<void>;
//# sourceMappingURL=fontLoader.d.ts.map