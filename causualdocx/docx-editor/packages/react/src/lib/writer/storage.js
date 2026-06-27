/**
 * Persistence + cache-usage helpers for the Writing Assistant. See
 * `docs/internal/10-writing-assistant-design.md` § 8.
 *
 * localStorage holds the user's enable list + consent state; the
 * model-weight cache is owned by transformers.js (Cache API), which we
 * never touch directly — we just surface usage via
 * `navigator.storage.estimate()` and offer an explicit "clear" hook.
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
const KEY_ENABLED = 'writer:enabled-features';
const KEY_CONSENT = 'writer:consent-version';
const KEY_AUTOLOAD = 'writer:auto-load';
const KEY_ADVANCED_OPEN = 'writer:advanced-open';
export const CURRENT_CONSENT_VERSION = 1;
export function loadEnabledFeatures() {
    if (typeof window === 'undefined')
        return [];
    try {
        const raw = window.localStorage.getItem(KEY_ENABLED);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((v) => typeof v === 'string');
    }
    catch (_a) {
        return [];
    }
}
export function saveEnabledFeatures(ids) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(KEY_ENABLED, JSON.stringify(ids));
    }
    catch (_a) {
        // Storage denied — toggle still takes effect for the session.
    }
}
export function loadConsentVersion() {
    if (typeof window === 'undefined')
        return 0;
    try {
        const raw = window.localStorage.getItem(KEY_CONSENT);
        if (!raw)
            return 0;
        const n = parseInt(raw, 10);
        return Number.isFinite(n) ? n : 0;
    }
    catch (_a) {
        return 0;
    }
}
export function saveConsentVersion(v) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(KEY_CONSENT, String(v));
    }
    catch (_a) {
        // ignored
    }
}
export function hasCurrentConsent() {
    return loadConsentVersion() >= CURRENT_CONSENT_VERSION;
}
export function loadAutoLoad() {
    if (typeof window === 'undefined')
        return true;
    try {
        const raw = window.localStorage.getItem(KEY_AUTOLOAD);
        if (raw === null)
            return true;
        return raw === '1';
    }
    catch (_a) {
        return true;
    }
}
export function saveAutoLoad(v) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(KEY_AUTOLOAD, v ? '1' : '0');
    }
    catch (_a) {
        // ignored
    }
}
export function loadAdvancedOpen() {
    if (typeof window === 'undefined')
        return false;
    try {
        return window.localStorage.getItem(KEY_ADVANCED_OPEN) === '1';
    }
    catch (_a) {
        return false;
    }
}
export function saveAdvancedOpen(v) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(KEY_ADVANCED_OPEN, v ? '1' : '0');
    }
    catch (_a) {
        // ignored
    }
}
/**
 * Drop everything the assistant put in storage. The model-weight cache
 * is wiped separately because it lives in the Cache API under
 * transformers.js's namespace, not in localStorage.
 */
export function clearCachedModels() {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof caches === 'undefined')
            return;
        try {
            const names = yield caches.keys();
            yield Promise.all(names.filter((n) => /transformers|huggingface/i.test(n)).map((n) => caches.delete(n)));
        }
        catch (_a) {
            // Some browsers gate Cache API on a secure context.
        }
    });
}
/**
 * For tests: clear localStorage keys so the next boot re-runs the
 * first-time flow.
 */
export function resetWriterPrefsForTests() {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.removeItem(KEY_ENABLED);
        window.localStorage.removeItem(KEY_CONSENT);
        window.localStorage.removeItem(KEY_AUTOLOAD);
        window.localStorage.removeItem(KEY_ADVANCED_OPEN);
    }
    catch (_a) {
        // ignored
    }
}
//# sourceMappingURL=storage.js.map