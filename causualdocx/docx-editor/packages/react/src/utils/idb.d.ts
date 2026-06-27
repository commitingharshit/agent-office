/**
 * Shared IndexedDB handle for editor-local state — autosave, recent
 * files, future per-doc version history, etc. Lives in one named DB
 * (`casual-docs`) with multiple object stores so the version handshake
 * stays in one place; modules import the opener instead of touching
 * `indexedDB.open` directly.
 *
 * Mirrors `services/sheet/apps/web/src/autosave/store.ts`'s "modules
 * share this IDB; MUST agree on a single version" pattern.
 *
 * On version bump: add the new `objectStore` creation here (idempotent
 * via the `contains()` guard) and increment `VERSION`.
 */
export declare const DOCS_DB_NAME = "casual-docs";
export declare const DOCS_DB_VERSION = 3;
export declare const STORE_AUTOSAVE = "autosave";
export declare const STORE_RECENT_FILES = "recent-files";
export declare const STORE_VERSIONS = "versions";
export declare function openDocsDb(): Promise<IDBDatabase>;
//# sourceMappingURL=idb.d.ts.map