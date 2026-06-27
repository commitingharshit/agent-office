/**
 * Format converter Web Worker — bridges to @casualoffice/core (WASM).
 *
 * Vite picks this file up via `new Worker(new URL('./format-converter.worker.ts', import.meta.url), { type: 'module' })`
 * in `format-converter.ts` and bundles it as a separate chunk. The WASM
 * artefact (~7 MB) is lazy-loaded on first message — the chunk only
 * lands in the browser when the user opens or exports a non-DOCX file.
 */
import type { Format } from '@schnsrw/core';
export interface ConvertRequest {
    id: number;
    kind: 'convert';
    bytes: Uint8Array;
    from?: Format;
    to: Format;
}
export interface DetectRequest {
    id: number;
    kind: 'detect';
    bytes: Uint8Array;
}
export type WorkerRequest = ConvertRequest | DetectRequest;
export interface ConvertOk {
    id: number;
    ok: true;
    kind: 'convert';
    /** Binary output (docx/odt/pdf) — undefined when `text` is set. */
    bytes?: Uint8Array;
    /** UTF-8 output (md/txt) — undefined when `bytes` is set. */
    text?: string;
}
export interface DetectOk {
    id: number;
    ok: true;
    kind: 'detect';
    format: Format | null;
}
export interface WorkerErr {
    id: number;
    ok: false;
    error: string;
}
export type WorkerResponse = ConvertOk | DetectOk | WorkerErr;
//# sourceMappingURL=format-converter.worker.d.ts.map