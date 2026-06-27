var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Lazy import so headless callers (audit script) that never actually
// hit an EMF blob don't pay the bundling cost.
function loadConverter() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield import('emf-converter');
        }
        catch (_a) {
            return null;
        }
    });
}
/**
 * Returns true when the canvas + image-bitmap APIs `emf-converter`
 * needs are available in the host environment. Saves us a try-catch
 * per media entry in headless contexts.
 */
function canvasAvailable() {
    if (typeof globalThis === 'undefined')
        return false;
    const g = globalThis;
    return typeof g.OffscreenCanvas !== 'undefined' || typeof g.HTMLCanvasElement !== 'undefined';
}
const EMF_MIME_PATTERN = /^image\/x?-?emf$/;
const WMF_MIME_PATTERN = /^image\/x?-?wmf$/;
function rewriteToPng(file, pngDataUrl) {
    return Object.assign(Object.assign({}, file), { mimeType: 'image/png', dataUrl: pngDataUrl });
}
/**
 * Iterate the media map, locate every EMF / WMF entry, and replace
 * its data URL with a PNG conversion. Mutates the map in place.
 *
 * The function is intentionally tolerant of partial failure: a
 * malformed EMF, a missing canvas API, or a network-style throw inside
 * the converter all leave that single entry untouched and the rest of
 * the map intact. Logs each failure once for operator visibility.
 */
export function convertEmfWmfMediaFiles(media) {
    return __awaiter(this, void 0, void 0, function* () {
        // Quick exit if there's nothing to convert. Saves the dynamic import
        // entirely on the common case (no EMF/WMF in the doc).
        let hasMetafile = false;
        for (const file of media.values()) {
            if (file.mimeType &&
                (EMF_MIME_PATTERN.test(file.mimeType) || WMF_MIME_PATTERN.test(file.mimeType))) {
                hasMetafile = true;
                break;
            }
        }
        if (!hasMetafile)
            return;
        if (!canvasAvailable()) {
            // Headless environment (Bun unit tests, audit script). The painter
            // placeholder handles display in browsers; in headless contexts
            // image rendering is irrelevant. No-op cleanly.
            return;
        }
        const mod = yield loadConverter();
        if (!mod)
            return;
        // Same MediaFile pointer can be stored under multiple keys (the
        // parser writes `word/media/x.emf` AND the normalised `media/x.emf`).
        // Convert once per unique pointer, then update every key that points
        // at it.
        const seen = new WeakMap();
        for (const [key, file] of media.entries()) {
            if (!file.mimeType ||
                (!EMF_MIME_PATTERN.test(file.mimeType) && !WMF_MIME_PATTERN.test(file.mimeType))) {
                continue;
            }
            const cached = seen.get(file);
            if (cached) {
                media.set(key, cached);
                continue;
            }
            try {
                // Always normalise to a fresh ArrayBuffer slice. emf-converter's
                // signature requires `ArrayBuffer` (not `ArrayBufferLike`), and
                // `Uint8Array.buffer` resolves to the more permissive
                // `ArrayBufferLike` (which also admits `SharedArrayBuffer`).
                const buffer = (() => {
                    if (file.data instanceof ArrayBuffer)
                        return file.data;
                    const u = file.data;
                    const out = new ArrayBuffer(u.byteLength);
                    new Uint8Array(out).set(u);
                    return out;
                })();
                const pngDataUrl = EMF_MIME_PATTERN.test(file.mimeType)
                    ? yield mod.convertEmfToDataUrl(buffer)
                    : yield mod.convertWmfToDataUrl(buffer);
                if (pngDataUrl && pngDataUrl.startsWith('data:image/png')) {
                    const replaced = rewriteToPng(file, pngDataUrl);
                    seen.set(file, replaced);
                    media.set(key, replaced);
                }
                else {
                    // Converter returned null — leave entry untouched, painter
                    // falls back to the placeholder.
                    seen.set(file, file);
                }
            }
            catch (err) {
                // One bad metafile shouldn't take down the whole parse. Log
                // once and leave the rest of the media map intact.
                // eslint-disable-next-line no-console
                console.warn(`[emfWmfConverter] failed to convert ${file.path} (${file.mimeType}):`, err instanceof Error ? err.message : err);
                seen.set(file, file);
            }
        }
    });
}
//# sourceMappingURL=emfWmfConverter.js.map