/**
 * IDB-backed version-history snapshot store. Separate object store
 * from the single-slot autosave (`utils/idb.ts` STORE_AUTOSAVE) — the
 * two solve different problems:
 *
 *   - **Autosave**: one slot, overwritten on every change. "I crashed
 *     mid-edit — recover the doc." Lifetime: until explicit save / discard.
 *   - **Version history**: many slots, captured at coarse-grained
 *     moments (every ~10 min while dirty, or on explicit "Save version").
 *     "I want to roll back to how it looked an hour ago." Lifetime:
 *     kept until pruned or hand-deleted.
 *
 * The fine-grained live edit feed (`useEditHistory`) is a third layer
 * and stays in-memory — it would balloon IDB with full-doc JSON per
 * coalesced edit, which isn't what users actually want for "roll back
 * a version" anyway.
 *
 * Retention rules (mirrors sheets):
 *   - Manual snapshots are NEVER auto-pruned — the user asked for them.
 *   - Auto snapshots are kept by count: `AUTO_RETENTION_PER_DOC` newest
 *     auto entries per `docId` survive each write.
 *
 * Storage cost: each snapshot is a full ProseMirror doc JSON. A typical
 * 5-page doc is ~30-80 KB; a 100-page report a few MB. With 30 auto +
 * N manual snapshots per doc, a power user crosses tens of MB of IDB
 * use. Future: lz-string compression on write would cut that ~4×.
 *
 * Ported from sheets' `apps/web/src/version-history/store.ts` —
 * adapted to scope by `docId` (sheets is single-active-workbook;
 * the editor switches docs without unmount).
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
import { openDocsDb, STORE_VERSIONS } from '../utils/idb';
const AUTO_RETENTION_PER_DOC = 30;
/**
 * Persist a draft snapshot. Returns the assigned id. Triggers a prune
 * pass that drops the oldest `auto` entries for `draft.docId` past
 * `AUTO_RETENTION_PER_DOC`.
 */
export function writeVersion(draft) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield openDocsDb();
        const size = estimateSize(draft.data);
        const record = Object.assign(Object.assign({}, draft), { size });
        const id = yield new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_VERSIONS, 'readwrite');
            const req = tx.objectStore(STORE_VERSIONS).add(record);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('write failed')); };
        });
        // Fire-and-forget retention sweep; failures are non-fatal — old
        // entries are cosmetic clutter, not correctness.
        void pruneAutoFor(draft.docId).catch((err) => console.warn('[version-history] prune failed', err));
        notifyFeed();
        return id;
    });
}
export function listVersions(docId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield openDocsDb();
            return yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_VERSIONS, 'readonly');
                const idx = tx.objectStore(STORE_VERSIONS).index('docId');
                const req = idx.getAll(IDBKeyRange.only(docId));
                req.onsuccess = () => {
                    var _a;
                    const list = ((_a = req.result) !== null && _a !== void 0 ? _a : []);
                    list.sort((a, b) => b.savedAt - a.savedAt);
                    resolve(list);
                };
                req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('list failed')); };
            });
        }
        catch (err) {
            console.warn('[version-history] list failed', err);
            return [];
        }
    });
}
export function readVersion(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield openDocsDb();
            return yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_VERSIONS, 'readonly');
                const req = tx.objectStore(STORE_VERSIONS).get(id);
                req.onsuccess = () => { var _a; return resolve((_a = req.result) !== null && _a !== void 0 ? _a : null); };
                req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('read failed')); };
            });
        }
        catch (err) {
            console.warn('[version-history] read failed', err);
            return null;
        }
    });
}
export function renameVersion(id, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield openDocsDb();
        yield new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_VERSIONS, 'readwrite');
            const os = tx.objectStore(STORE_VERSIONS);
            const get = os.get(id);
            get.onsuccess = () => {
                const existing = get.result;
                if (!existing) {
                    resolve();
                    return;
                }
                os.put(Object.assign(Object.assign({}, existing), { name }));
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('rename failed')); };
        });
        notifyFeed();
    });
}
export function deleteVersion(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield openDocsDb();
        yield new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_VERSIONS, 'readwrite');
            tx.objectStore(STORE_VERSIONS).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('delete failed')); };
        });
        notifyFeed();
    });
}
/** Drop every snapshot for `docId`. Used by the panel's "Clear
 *  version history" action (yet-to-be-added) + tests. */
export function clearVersionsFor(docId) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield openDocsDb();
        yield new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_VERSIONS, 'readwrite');
            const idx = tx.objectStore(STORE_VERSIONS).index('docId');
            const req = idx.openCursor(IDBKeyRange.only(docId));
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor)
                    return;
                cursor.delete();
                cursor.continue();
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('clear failed')); };
        });
        notifyFeed();
    });
}
function pruneAutoFor(docId) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield openDocsDb();
        // Walk auto entries for this doc, sorted by savedAt descending. Keep
        // the first AUTO_RETENTION_PER_DOC; delete the rest.
        yield new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_VERSIONS, 'readwrite');
            const os = tx.objectStore(STORE_VERSIONS);
            const idx = os.index('savedAt');
            // No compound (kind, docId) index — we filter post-cursor. Volumes
            // here are tens of snapshots per doc; a full-index walk is fine.
            const req = idx.openCursor(null, 'prev');
            let kept = 0;
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor) {
                    resolve();
                    return;
                }
                const snap = cursor.value;
                if (snap.docId === docId && snap.kind === 'auto') {
                    kept += 1;
                    if (kept > AUTO_RETENTION_PER_DOC) {
                        os.delete(cursor.primaryKey);
                    }
                }
                cursor.continue();
            };
            req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('prune failed')); };
            tx.oncomplete = () => resolve();
        });
    });
}
/** Crude byte-size estimate — JSON-stringify length in chars, treated
 *  as a near-1:1 byte proxy. Fine for the UI's "≈ 120 KB" hint. */
function estimateSize(data) {
    try {
        return JSON.stringify(data).length;
    }
    catch (_a) {
        return 0;
    }
}
let feed = null;
export function setLiveFeed(f) {
    feed = f;
}
function notifyFeed() {
    feed === null || feed === void 0 ? void 0 : feed.tick();
}
//# sourceMappingURL=store.js.map