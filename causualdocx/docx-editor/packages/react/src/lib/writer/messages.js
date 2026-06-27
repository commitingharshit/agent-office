/**
 * Typed wire protocol between the controller (main thread) and the
 * writer worker. See `docs/internal/10-writing-assistant-design.md` § 6.
 *
 * Every request carries a UUID `id` so responses route back to the
 * correct awaiting promise. `abort` references a previous request's
 * `id` via `targetId`.
 */
export function newRequestId() {
    // crypto.randomUUID is available in every modern browser; tsup
    // / Vite both polyfill where needed.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID (very old browsers).
    return `wr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
//# sourceMappingURL=messages.js.map