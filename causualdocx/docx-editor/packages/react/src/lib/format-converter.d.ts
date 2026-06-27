/**
 * Main-thread shim over `format-converter.worker.ts`. Lazy-loads the worker
 * (and the 7 MB WASM behind it) on first call.
 *
 * Use this for two flows only:
 *   - Open: foreign format bytes → DOCX bytes → feed our existing parser.
 *   - Export-as: our existing serializer → DOCX bytes → foreign format bytes/string.
 *
 * In-editor live operations stay on the existing TS pipeline — this file
 * is convert-as-bytes only.
 */
import type { Format } from '@schnsrw/core';
export type { Format };
/** Format we route through the converter. DOCX stays on the native path. */
export type ForeignFormat = Exclude<Format, 'docx' | 'pdf'>;
export declare function isForeignFormat(ext: string): ext is ForeignFormat;
/**
 * Convert from any supported format to DOCX bytes. Used by File → Open
 * when the user picks a .odt/.md/.txt file — we hand the result to the
 * existing DOCX parser.
 */
export declare function convertToDocx(bytes: Uint8Array, from: ForeignFormat): Promise<Uint8Array>;
/**
 * Convert DOCX bytes to a foreign format. Used by File → Export As — the
 * existing serializer produces the DOCX bytes, we hand them off here.
 *
 * Returns either `Uint8Array` (for `odt`) or `string` (for `md`/`txt`).
 */
export declare function exportDocxAs(docxBytes: Uint8Array, to: ForeignFormat): Promise<Uint8Array | string>;
/** Sniff the format of a file by its bytes. Falls back to the extension. */
export declare function detectFormat(bytes: Uint8Array): Promise<Format | null>;
/** Best-effort guess of the format from a filename. */
export declare function formatFromFilename(name: string): Format | null;
//# sourceMappingURL=format-converter.d.ts.map