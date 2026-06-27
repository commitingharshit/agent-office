/**
 * EMF / WMF → PNG conversion for the media map.
 *
 * Word embeds EMF (Enhanced Metafile) and WMF (Windows Metafile) for
 * native charts, shapes, and OLE thumbnails. Browsers don't render
 * either format in an `<img>` tag, so without conversion the editor
 * either shows the broken-image icon or — with the placeholder shipped
 * alongside this module — a sized labelled stub. This module promotes
 * the experience from "placeholder" to "real picture" by replaying the
 * vector record stream onto a Canvas via `emf-converter` and replacing
 * the original `data:image/x-emf;base64,…` URL with a
 * `data:image/png;base64,…` URL the painter happily renders as `<img>`.
 *
 * Used by:
 *   - `parser.ts` (post-buildMediaMap async pass)
 *
 * Failure handling:
 *   - The converter returns `null` for malformed input → we keep the
 *     original media entry untouched. The painter's placeholder
 *     fallback in `renderParagraph.ts` handles it from there.
 *   - Headless environments without `OffscreenCanvas` /
 *     `HTMLCanvasElement` / `createImageBitmap` (Bun unit tests,
 *     fidelity-audit script) trigger an internal throw inside
 *     emf-converter — we catch it and leave the entry untouched so the
 *     parser doesn't fail. The audit script tags-counts; it doesn't
 *     care about rendered image bytes.
 */
import type { MediaFile } from '../types/document';
/**
 * Iterate the media map, locate every EMF / WMF entry, and replace
 * its data URL with a PNG conversion. Mutates the map in place.
 *
 * The function is intentionally tolerant of partial failure: a
 * malformed EMF, a missing canvas API, or a network-style throw inside
 * the converter all leave that single entry untouched and the rest of
 * the map intact. Logs each failure once for operator visibility.
 */
export declare function convertEmfWmfMediaFiles(media: Map<string, MediaFile>): Promise<void>;
//# sourceMappingURL=emfWmfConverter.d.ts.map