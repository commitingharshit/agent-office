/**
 * BrowserFileSource — the FileSource implementation for Mode 1
 * (Pages). Wraps the existing IDB-backed recent-files store so the
 * landing screen + File menu have a uniform contract regardless of
 * deploy mode.
 *
 * Scope of this implementation is intentionally narrow — Mode 1 is
 * the "single-device hosted demo" deploy and doesn't try to be a
 * real file system. The File System Access integration listed in
 * docs/internal/11-storage-modes.md is Phase A and lands separately;
 * this class is the no-FSA baseline.
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
import { deleteRecentFile, listRecentFiles, recordRecentFile, } from '../utils/recent-files';
import { RecentObserver, readLastOpened, writeLastOpened } from './local-prefs';
const SCOPE = 'browser';
export class BrowserFileSource {
    constructor() {
        this.kind = 'browser';
        this.label = 'This browser';
        this.recent = new RecentObserver();
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield listRecentFiles();
            const entries = rows.map(toEntry);
            this.recent.set(entries);
            return entries;
        });
    }
    open(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield listRecentFiles();
            const row = rows.find((r) => idFor(r) === id);
            if (!row) {
                throw new Error(`BrowserFileSource: unknown id ${id}`);
            }
            return { bytes: row.buffer, name: row.name };
        });
    }
    save(id, bytes, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // Mode 1 doesn't have a server-side notion of doc identity; the
            // recent-files store keys by name. Reuse the supplied name (for
            // overwrite-by-name) or fall back to a synthetic one.
            const name = (_b = (_a = opts === null || opts === void 0 ? void 0 : opts.name) !== null && _a !== void 0 ? _a : id) !== null && _b !== void 0 ? _b : `Untitled-${Date.now()}.docx`;
            yield recordRecentFile({
                name,
                buffer: bytes,
                size: bytes.byteLength,
                openedAt: Date.now(),
            });
            // Refresh the observer + re-derive id from the row we just wrote.
            const rows = yield listRecentFiles();
            const row = rows.find((r) => r.name === name);
            const newId = row ? idFor(row) : name;
            this.recent.set(rows.map(toEntry));
            return { id: newId, etag: String((_c = row === null || row === void 0 ? void 0 : row.openedAt) !== null && _c !== void 0 ? _c : Date.now()) };
        });
    }
    rename() {
        return __awaiter(this, void 0, void 0, function* () {
            // The IDB store keys by name; renaming in place would change the
            // identity, which the recent-files surface doesn't model. Mode 1
            // gets a save-as path instead. Throw so a caller that wandered
            // here from a Mode 3 codepath sees the bug rather than silently
            // no-op'ing.
            throw new Error('BrowserFileSource: rename is not supported (Mode 1 uses save-as)');
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const numeric = Number(id);
            if (!Number.isFinite(numeric))
                return;
            yield deleteRecentFile(numeric);
            const rows = yield listRecentFiles();
            this.recent.set(rows.map(toEntry));
        });
    }
    watchRecent(cb) {
        return this.recent.watch(cb);
    }
    rememberLastOpened(id) {
        return __awaiter(this, void 0, void 0, function* () {
            writeLastOpened(SCOPE, id);
        });
    }
    lastOpened() {
        return __awaiter(this, void 0, void 0, function* () {
            return readLastOpened(SCOPE);
        });
    }
}
function idFor(row) {
    // Use the IDB auto-increment id when present, falling back to the
    // name. The fallback only matters for in-flight rows before the
    // tx commits.
    return row.id != null ? String(row.id) : row.name;
}
function toEntry(row) {
    return {
        id: idFor(row),
        name: row.name,
        size: row.size,
        modifiedAt: row.openedAt,
        source: 'browser',
    };
}
//# sourceMappingURL=browser.js.map