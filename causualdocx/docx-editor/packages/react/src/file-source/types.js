/**
 * FileSource — the storage abstraction that lets the editor shell,
 * recent-files list, File menu, autosave, and version-history all
 * speak to one interface regardless of deploy mode.
 *
 * One interface, three implementations:
 *
 *   - BrowserFileSource (Mode 1 — Pages): IDB + optional File System
 *     Access folder. Single-device, no server.
 *   - WopiFileSource    (Mode 2 — WOPI):  REST against a WOPI host
 *     identified by a JWT in the URL.
 *   - PersonalFileSource (Mode 3 — Standalone): cookie-authenticated
 *     REST against the Casual gateway's /files routes.
 *
 * The full design contract lives at docs/internal/11-storage-modes.md.
 * Keep this file in lockstep with the "Shared web-side abstraction"
 * section there — divergence between the doc and the type would cause
 * us to re-litigate the routes on every new implementation.
 */
export {};
//# sourceMappingURL=types.js.map