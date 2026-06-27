var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Restore-prompt banner shown at editor mount when an autosave record
 * exists from the last session. Two actions:
 *
 *   - **Restore** — swap the editor's buffer for the saved snapshot.
 *   - **Discard** — drop the saved record.
 *
 * Two gates keep this from showing for noise:
 *   - **Age gate** — 24 h. Older snapshots are auto-discarded; if a
 *     user hasn't returned in a day the saved state is almost
 *     certainly stale.
 *   - **Same-doc gate** — if the editor already has unsaved changes on
 *     a different document name, the banner is suppressed to avoid
 *     clobbering current work.
 *
 * Self-dismisses after either action. Visual mirrors the existing
 * SuggestingModeBanner pattern so the editor's banner system stays
 * coherent.
 */
import { useEffect, useState } from 'react';
import { clearAutosave, formatAgo, readAutosave } from '../utils/autosave';
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 h
const ROOT_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 16px',
    // Themed via the info-state CSS variables so the banner reads as a
    // soft blue notification in light mode and a muted blue surface in
    // dark mode, instead of the previous hardcoded light-blue that sat
    // jarringly on a dark editor background.
    background: 'var(--doc-info-bg, #e8f0fe)',
    color: 'var(--doc-info-text, #1f2937)',
    borderBottom: '1px solid var(--doc-info-border, #aac6f7)',
    fontSize: 13,
    lineHeight: 1.4,
};
const MESSAGE_STYLE = {
    flex: 1,
    minWidth: 0,
};
const STRONG_STYLE = {
    fontWeight: 600,
    marginRight: 6,
};
const PRIMARY_BTN_STYLE = {
    padding: '4px 14px',
    fontSize: 12,
    border: '1px solid var(--doc-primary, #1a73e8)',
    background: 'var(--doc-primary, #1a73e8)',
    color: 'white',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
    flexShrink: 0,
};
const SECONDARY_BTN_STYLE = {
    padding: '4px 10px',
    fontSize: 12,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'transparent',
    color: 'var(--doc-text-on-surface, #1f2937)',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
    flexShrink: 0,
};
export function AutosaveRestoreBanner({ onRestore, suppress }) {
    const [rec, setRec] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    useEffect(() => {
        let cancelled = false;
        void (() => __awaiter(this, void 0, void 0, function* () {
            const r = yield readAutosave();
            if (cancelled)
                return;
            if (!r) {
                setRec(null);
                return;
            }
            // Age gate — drop stale snapshots silently.
            if (Date.now() - r.savedAt > STALE_AFTER_MS) {
                yield clearAutosave();
                setRec(null);
                return;
            }
            setRec(r);
        }))();
        return () => {
            cancelled = true;
        };
        // Read on mount only — the banner is a "boot-time prompt", not a
        // live subscription. Re-reading every render would race with
        // discard/restore actions.
    }, []);
    if (!rec || dismissed || suppress)
        return null;
    return (_jsxs("div", { role: "status", "aria-live": "polite", "data-testid": "autosave-banner", style: ROOT_STYLE, children: [_jsxs("div", { style: MESSAGE_STYLE, children: [_jsx("span", { style: STRONG_STYLE, children: "Unsaved changes" }), _jsxs("span", { children: ["from ", _jsx("em", { children: rec.name }), " (", formatAgo(Date.now() - rec.savedAt), ") \u2014 restore them?"] })] }), _jsx("button", { type: "button", style: PRIMARY_BTN_STYLE, "data-testid": "autosave-restore", onClick: () => __awaiter(this, void 0, void 0, function* () {
                    onRestore(rec.buffer, rec.name);
                    yield clearAutosave();
                    setDismissed(true);
                }), children: "Restore" }), _jsx("button", { type: "button", style: SECONDARY_BTN_STYLE, "data-testid": "autosave-discard", onClick: () => __awaiter(this, void 0, void 0, function* () {
                    yield clearAutosave();
                    setDismissed(true);
                }), children: "Discard" })] }));
}
export default AutosaveRestoreBanner;
//# sourceMappingURL=AutosaveRestoreBanner.js.map