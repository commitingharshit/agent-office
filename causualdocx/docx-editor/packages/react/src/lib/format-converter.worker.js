/// <reference lib="webworker" />
/**
 * Format converter Web Worker — bridges to @casualoffice/core (WASM).
 *
 * Vite picks this file up via `new Worker(new URL('./format-converter.worker.ts', import.meta.url), { type: 'module' })`
 * in `format-converter.ts` and bundles it as a separate chunk. The WASM
 * artefact (~7 MB) is lazy-loaded on first message — the chunk only
 * lands in the browser when the user opens or exports a non-DOCX file.
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
import { init, convert, convertToString, detectFormat } from '@schnsrw/core';
let initialized = false;
function ensureInit() {
    return __awaiter(this, void 0, void 0, function* () {
        if (initialized)
            return;
        yield init();
        initialized = true;
    });
}
const TEXT_FORMATS = new Set(['md', 'txt']);
self.addEventListener('message', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const msg = event.data;
    try {
        yield ensureInit();
        if (msg.kind === 'detect') {
            const det = yield detectFormat(msg.bytes);
            const reply = { id: msg.id, ok: true, kind: 'detect', format: det.format };
            self.postMessage(reply);
            return;
        }
        // kind === 'convert'
        if (TEXT_FORMATS.has(msg.to)) {
            const text = yield convertToString(msg.bytes, { from: msg.from, to: msg.to });
            const reply = { id: msg.id, ok: true, kind: 'convert', text };
            self.postMessage(reply);
        }
        else {
            const bytes = yield convert(msg.bytes, { from: msg.from, to: msg.to });
            const reply = { id: msg.id, ok: true, kind: 'convert', bytes };
            // Transfer the underlying buffer to avoid the structured-clone copy.
            self.postMessage(reply, [bytes.buffer]);
        }
    }
    catch (err) {
        const reply = {
            id: msg.id,
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        };
        self.postMessage(reply);
    }
}));
//# sourceMappingURL=format-converter.worker.js.map