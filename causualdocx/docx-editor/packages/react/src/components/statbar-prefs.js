/**
 * Persistent preference for which counters appear in the status bar.
 * Mirrors Excel's right-click-on-status-bar checklist (and the sibling
 * Casual Sheets implementation at
 * `services/sheet/apps/web/src/shell/use-statbar-prefs.ts`).
 *
 * Stored via a small module-level store so two consumers (the stats
 * row + the right-click customisation popover) always see the same
 * flags without prop-drilling.
 */
import { useSyncExternalStore } from 'react';
const STORAGE_KEY = 'docx-editor-statbar-prefs';
const DEFAULTS = {
    page: true,
    words: true,
    chars: true,
    readingTime: true,
    readability: true,
};
function read() {
    if (typeof window === 'undefined')
        return Object.assign({}, DEFAULTS);
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return Object.assign({}, DEFAULTS);
        const parsed = JSON.parse(raw);
        return Object.assign(Object.assign({}, DEFAULTS), parsed);
    }
    catch (_a) {
        return Object.assign({}, DEFAULTS);
    }
}
let current = read();
const subs = new Set();
function subscribe(fn) {
    subs.add(fn);
    return () => {
        subs.delete(fn);
    };
}
function snapshot() {
    return current;
}
function serverSnapshot() {
    return DEFAULTS;
}
function setPrefs(next) {
    current = next;
    try {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
    }
    catch (_a) {
        /* Private-mode / quota — preference stays in-memory only. */
    }
    for (const fn of subs) {
        try {
            fn();
        }
        catch (_b) {
            /* Subscriber threw — ignore so one broken consumer doesn't crash the rest. */
        }
    }
}
export function useStatPrefs() {
    const prefs = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    const toggle = (key) => setPrefs(Object.assign(Object.assign({}, prefs), { [key]: !prefs[key] }));
    return { prefs, toggle };
}
export const STAT_LABELS = {
    page: 'Page indicator',
    words: 'Word count',
    chars: 'Character count',
    readingTime: 'Reading time',
    readability: 'Readability score',
};
//# sourceMappingURL=statbar-prefs.js.map