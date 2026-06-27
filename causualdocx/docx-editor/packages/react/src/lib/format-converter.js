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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const FOREIGN_FORMATS = new Set(['odt', 'md', 'txt']);
export function isForeignFormat(ext) {
    return FOREIGN_FORMATS.has(ext);
}
let worker = null;
let nextId = 1;
const pending = new Map();
function getWorker() {
    if (worker)
        return worker;
    worker = new Worker(new URL('./format-converter.worker.ts', import.meta.url), {
        type: 'module',
    });
    worker.addEventListener('message', (e) => {
        const resolver = pending.get(e.data.id);
        if (!resolver)
            return;
        pending.delete(e.data.id);
        resolver(e.data);
    });
    return worker;
}
function send(req, transfer) {
    return new Promise((resolve, reject) => {
        pending.set(req.id, (r) => {
            if (r.ok)
                resolve(r);
            else
                reject(new Error(r.error));
        });
        getWorker().postMessage(req, transfer);
    });
}
/**
 * Convert from any supported format to DOCX bytes. Used by File → Open
 * when the user picks a .odt/.md/.txt file — we hand the result to the
 * existing DOCX parser.
 */
export function convertToDocx(bytes, from) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = {
            id: nextId++,
            kind: 'convert',
            bytes,
            from,
            to: 'docx',
        };
        const reply = yield send(req, [bytes.buffer]);
        if (!reply.bytes)
            throw new Error('Converter returned no bytes');
        return reply.bytes;
    });
}
/**
 * Convert DOCX bytes to a foreign format. Used by File → Export As — the
 * existing serializer produces the DOCX bytes, we hand them off here.
 *
 * Returns either `Uint8Array` (for `odt`) or `string` (for `md`/`txt`).
 */
export function exportDocxAs(docxBytes, to) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = {
            id: nextId++,
            kind: 'convert',
            bytes: docxBytes,
            from: 'docx',
            to,
        };
        const reply = yield send(req, [docxBytes.buffer]);
        if (reply.text !== undefined)
            return reply.text;
        if (reply.bytes !== undefined)
            return reply.bytes;
        throw new Error('Converter returned neither bytes nor text');
    });
}
/** Sniff the format of a file by its bytes. Falls back to the extension. */
export function detectFormat(bytes) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = { id: nextId++, kind: 'detect', bytes };
        const reply = yield send(req, [
            bytes.buffer,
        ]);
        return reply.format;
    });
}
/** Best-effort guess of the format from a filename. */
export function formatFromFilename(name) {
    const m = /\.([a-z0-9]+)$/i.exec(name);
    if (!m)
        return null;
    const ext = m[1].toLowerCase();
    if (ext === 'docx' || ext === 'odt' || ext === 'md' || ext === 'txt' || ext === 'pdf') {
        return ext;
    }
    if (ext === 'markdown')
        return 'md';
    return null;
}
//# sourceMappingURL=format-converter.js.map