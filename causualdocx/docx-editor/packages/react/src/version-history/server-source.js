var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function historyUrl(b) {
    return `${b.baseUrl}/api/docs/${encodeURIComponent(b.docId)}/history`;
}
/** List the host's revision chain as `VersionSnapshot[]`, newest-first
 *  (matching the local list's display order). Throws on a non-OK
 *  response so the caller can fall back / surface an error. */
export function fetchServerVersions(b, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(historyUrl(b), { signal });
        if (!res.ok)
            throw new Error(`history HTTP ${res.status}`);
        const revs = (yield res.json());
        return revs
            .slice()
            .sort((a, z) => z.version - a.version)
            .map((r) => ({
            id: r.version,
            serverVersion: r.version,
            docId: b.docId,
            kind: 'auto',
            name: r.author ? `Saved by ${r.author}` : `Version ${r.version}`,
            savedAt: Date.parse(r.savedAt) || 0,
            sourceFormat: 'docx',
            data: undefined,
            size: r.sizeBytes,
        }));
    });
}
/** Download one revision's `.docx` bytes for restore. */
export function downloadServerVersion(b, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`${historyUrl(b)}/${encodeURIComponent(String(version))}/download`);
        if (!res.ok)
            throw new Error(`revision HTTP ${res.status}`);
        return res.arrayBuffer();
    });
}
//# sourceMappingURL=server-source.js.map