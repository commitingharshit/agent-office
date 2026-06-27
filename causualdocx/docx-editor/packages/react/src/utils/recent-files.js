/**
 * IndexedDB-backed "recent files" list. Captures the user's last N
 * opened documents so the Home screen can let them reopen with one
 * click. Distinct from autosave (single-slot crash recovery) and
 * version history (per-doc timeline) — this is "what docs have I been
 * working with lately, across sessions".
 *
 * Retention: capped at MAX_ENTRIES, oldest evicted first. Entries
 * older than STALE_AFTER_MS are silently dropped on list.
 *
 * Mirrors `services/sheet/apps/web/src/recent-files/store.ts` — same
 * keyspace, same auto-increment + indexed model, same prune-on-record
 * design.
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
import { openDocsDb, STORE_RECENT_FILES as STORE } from './idb';
const MAX_ENTRIES = 10;
const STALE_AFTER_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
function isAvailable() {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}
/**
 * Record (or refresh) a doc in the recent-files list. If an entry with
 * the same name already exists, it's updated in place (same id, new
 * openedAt + buffer); otherwise a new entry is appended. Triggers a
 * prune pass to enforce the cap.
 */
export function recordRecentFile(rec) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isAvailable())
            return;
        try {
            const db = yield openDocsDb();
            yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readwrite');
                const os = tx.objectStore(STORE);
                const idx = os.index('name');
                const getReq = idx.get(rec.name);
                getReq.onsuccess = () => {
                    const existing = getReq.result;
                    if (existing && existing.id != null) {
                        os.put(Object.assign(Object.assign(Object.assign({}, existing), rec), { id: existing.id }));
                    }
                    else {
                        os.add(Object.assign({}, rec));
                    }
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('record failed')); };
            });
            void prune().catch(() => {
                // Best-effort — losing the prune pass doesn't break recording.
            });
        }
        catch (err) {
            if (typeof console !== 'undefined') {
                console.warn('[recent-files] record failed', err);
            }
        }
    });
}
export function listRecentFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isAvailable())
            return [];
        try {
            const db = yield openDocsDb();
            const all = yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).getAll();
                req.onsuccess = () => { var _a; return resolve(((_a = req.result) !== null && _a !== void 0 ? _a : [])); };
                req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('list failed')); };
            });
            const cutoff = Date.now() - STALE_AFTER_MS;
            return all.filter((r) => r.openedAt >= cutoff).sort((a, b) => b.openedAt - a.openedAt);
        }
        catch (err) {
            if (typeof console !== 'undefined') {
                console.warn('[recent-files] list failed', err);
            }
            return [];
        }
    });
}
export function deleteRecentFile(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isAvailable())
            return;
        try {
            const db = yield openDocsDb();
            yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).delete(id);
                tx.oncomplete = () => resolve();
                tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('delete failed')); };
            });
        }
        catch (err) {
            if (typeof console !== 'undefined') {
                console.warn('[recent-files] delete failed', err);
            }
        }
    });
}
function prune() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield openDocsDb();
        yield new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const os = tx.objectStore(STORE);
            const idx = os.index('openedAt');
            const req = idx.openCursor(null, 'prev');
            let kept = 0;
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor)
                    return;
                kept += 1;
                if (kept > MAX_ENTRIES ||
                    cursor.value.openedAt < Date.now() - STALE_AFTER_MS) {
                    os.delete(cursor.primaryKey);
                }
                cursor.continue();
            };
            req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('prune failed')); };
            tx.oncomplete = () => resolve();
        });
    });
}
/** Human-readable size — "23 KB", "1.4 MB". */
export function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
//# sourceMappingURL=recent-files.js.map