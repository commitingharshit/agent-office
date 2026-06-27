/**
 * Tab-local autosave for the docx editor. Single slot per origin — we
 * keep the most recent dirty snapshot so the user can recover from a
 * crash or accidental close. Anything more elaborate (versioned
 * history, cross-tab merge) is out of scope until we have a backend.
 *
 * IndexedDB is used over localStorage because docx buffers regularly
 * exceed the 5 MB localStorage budget; IDB stores the ArrayBuffer
 * directly via structured clone, no JSON round-trip required.
 *
 * Mirrors the sibling Casual Sheets autosave store
 * (`services/sheet/apps/web/src/autosave/store.ts`) — same single-slot
 * design, same DB / store / key convention. Pulled into its own DB
 * (`casual-docs`) so we don't have to lockstep version numbers with
 * the sheet repo.
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
import { openDocsDb, STORE_AUTOSAVE as STORE } from './idb';
const KEY = 'current';
const openDb = openDocsDb;
export function readAutosave() {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined')
            return null;
        try {
            const db = yield openDb();
            return yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).get(KEY);
                req.onsuccess = () => { var _a; return resolve((_a = req.result) !== null && _a !== void 0 ? _a : null); };
                req.onerror = () => { var _a; return reject((_a = req.error) !== null && _a !== void 0 ? _a : new Error('read failed')); };
            });
        }
        catch (err) {
            // Private-mode browsers + Safari ITP can throw on open. Restoring
            // gracefully fails to "no record" so the editor still mounts.
            if (typeof console !== 'undefined') {
                console.warn('[autosave] read failed; skipping restore', err);
            }
            return null;
        }
    });
}
export function writeAutosave(rec) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined')
            return;
        try {
            const db = yield openDb();
            yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).put(rec, KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('write failed')); };
            });
        }
        catch (err) {
            if (typeof console !== 'undefined') {
                console.warn('[autosave] write failed', err);
            }
        }
    });
}
export function clearAutosave() {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined')
            return;
        try {
            const db = yield openDb();
            yield new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).delete(KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = () => { var _a; return reject((_a = tx.error) !== null && _a !== void 0 ? _a : new Error('clear failed')); };
            });
        }
        catch (err) {
            if (typeof console !== 'undefined') {
                console.warn('[autosave] clear failed', err);
            }
        }
    });
}
/** "moments ago" / "12 min ago" / "3 hr ago" / "2 days ago". */
export function formatAgo(ms) {
    if (ms < 60000)
        return 'moments ago';
    const mins = Math.round(ms / 60000);
    if (mins < 60)
        return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24)
        return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
//# sourceMappingURL=autosave.js.map