var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Version-history side panel — surfaces the feed produced by
 * `useEditHistory` as a scrollable timeline with a revert button
 * per entry. Mirrors the Sheets `HistoryPanel` shape so the two
 * products feel like cousins.
 *
 * Layout: vertical list, newest-first. Each entry shows author,
 * elapsed-time stamp, coalesced edit count, summary, and a "Revert
 * to here" button. Reverting takes the doc back to the entry's `before`
 * snapshot (captured when the entry opened) and wraps the change in a
 * new transaction so Ctrl+Z reverses the revert.
 *
 * Consumer pattern — solo session:
 *
 *   const history = useEditHistory({ author: 'You' });
 *   useEffect(() => view ? history.attach(view) : undefined, [view, history]);
 *   return <VersionHistoryPanel history={history} />;
 *
 * Collab session — pass `author={presenceName}` so peer entries show
 * the right name when capturing locally-applied transactions; the
 * cross-peer log is the Yjs op-log (out of scope for v1).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { PanelState } from '../ui/PanelState';
import { Tooltip } from '../ui/Tooltip';
import { RightDockPanel } from '../RightDockPanel';
import { useFixedDropdown } from '../ui/useFixedDropdown';
import { diffStats, diffWords, extractText } from '../../hooks/wordDiff';
import { useLiveVersionList } from '../../version-history/useLiveVersionList';
import { deleteVersion, readVersion, renameVersion, } from '../../version-history/store';
// Width / outer chrome / header come from RightDockPanel — the old
// ROOT_STYLE and HEADER_STYLE were removed in Phase 3 (panel chrome
// unification).
const TABS_STYLE = {
    display: 'flex',
    borderBottom: '1px solid var(--doc-border, #e0e0e0)',
};
const SUBHEADER_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    fontSize: 12,
    color: 'var(--doc-text-muted)',
    fontWeight: 600,
};
const GROUP_STYLE = {
    listStyle: 'none',
};
const GROUP_HEADER_STYLE = {
    padding: '8px 16px 4px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--doc-text-muted)',
    fontWeight: 600,
};
const KIND_BADGE_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#eab308', // amber-500 — manual-named star
    outline: 'none',
};
const SIZE_STYLE = {
    fontSize: 11,
    color: 'var(--doc-text-muted)',
};
const SAVE_VERSION_BTN_STYLE = {
    marginLeft: 'auto',
    padding: '4px 10px',
    border: '1px solid var(--doc-border-strong, var(--doc-border))',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--doc-primary, #1a73e8)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'none',
    letterSpacing: 0,
};
const COUNT_STYLE = {
    marginLeft: 'auto',
    fontSize: 12,
    color: 'var(--doc-text-muted)',
    fontWeight: 400,
};
const LIST_STYLE = {
    flex: 1,
    overflowY: 'auto',
    listStyle: 'none',
    margin: 0,
    padding: 0,
};
const ENTRY_STYLE = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px 16px',
    borderBottom: '1px solid var(--doc-border-light, #f0eee9)',
};
const ENTRY_HEAD_STYLE = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    fontSize: 12,
    color: 'var(--doc-text-muted)',
};
const AUTHOR_STYLE = {
    color: 'var(--doc-text)',
    fontWeight: 600,
};
const SUMMARY_STYLE = {
    fontSize: 13,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const REVERT_BUTTON_STYLE = {
    alignSelf: 'flex-start',
    marginTop: 4,
    padding: '4px 10px',
    border: '1px solid var(--doc-border-strong, var(--doc-border))',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--doc-text)',
    fontSize: 12,
    cursor: 'pointer',
};
const ENTRY_ACTIONS_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
};
const STATS_PILL_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    marginLeft: 'auto',
    color: 'var(--doc-text-muted)',
};
const STAT_ADD_STYLE = {
    color: '#16a34a',
    fontWeight: 600,
};
const STAT_REMOVE_STYLE = {
    color: '#dc2626',
    fontWeight: 600,
};
const DIFF_BOX_STYLE = {
    marginTop: 8,
    padding: '8px 10px',
    background: 'var(--doc-surface-sunken, #f6f8fa)',
    border: '1px solid var(--doc-border-light, #e7eaee)',
    borderRadius: 6,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 320,
    overflow: 'auto',
};
const DIFF_ADD_STYLE = {
    background: '#defbe1',
    color: '#15803d',
    borderRadius: 2,
    padding: '0 2px',
};
const DIFF_REMOVE_STYLE = {
    background: '#fde2e1',
    color: '#b91c1c',
    borderRadius: 2,
    padding: '0 2px',
    textDecoration: 'line-through',
};
const SHOW_DIFF_BTN_STYLE = {
    padding: '4px 8px',
    border: '1px solid transparent',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--doc-primary, #1a73e8)',
    fontSize: 12,
    cursor: 'pointer',
};
const NAMED_FILTER_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 16px 8px',
    fontSize: 12,
    color: 'var(--doc-text-muted)',
    cursor: 'pointer',
};
const KEBAB_BTN_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--doc-text-muted)',
    cursor: 'pointer',
};
const KEBAB_MENU_STYLE = {
    minWidth: 168,
    padding: '4px 0',
    background: 'var(--doc-surface, #fff)',
    border: '1px solid var(--doc-border, #e0e0e0)',
    borderRadius: 8,
    boxShadow: 'var(--doc-shadow-lg, 0 4px 16px rgba(0,0,0,0.16))',
};
const KEBAB_ITEM_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    background: 'transparent',
    color: 'var(--doc-text)',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
};
const CURRENT_ROW_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '1px solid var(--doc-border-light, #f0eee9)',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--doc-text)',
    cursor: 'pointer',
    textAlign: 'left',
};
const DIFF_TRUNCATE_LIMIT = 50000; // chars per side — safety for huge docs
function relativeTime(time, now) {
    const diff = Math.max(0, now - time);
    const s = Math.round(diff / 1000);
    if (s < 5)
        return 'just now';
    if (s < 60)
        return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60)
        return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24)
        return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}
export function VersionHistoryPanel({ history, docId = null, saveNamedVersion, onRestoreSnapshot, onPreviewVersion, onShowCurrent, isPreviewing = false, onClose, title = 'Version history', emptyHint = 'No edits yet. Type into the document to start recording.', serverBackend, onRestoreServerVersion, }) {
    // Default to Versions when we have a docId (the persisted timeline
    // is what users come here for); Activity is the secondary "what
    // just changed" feed. With no docId only Activity makes sense.
    const [tab, setTab] = useState(docId ? 'versions' : 'activity');
    // Render via the shared RightDockPanel shell so every right-edge
    // panel inherits the same width, header chrome, slide-in motion,
    // and close-X affordance. The tab strip + tab body live in
    // children so they sit below the standard header.
    return (_jsxs(RightDockPanel, { title: title, icon: _jsx(MaterialSymbol, { name: "history", size: 18 }), testId: "version-history-panel", ariaLabel: title, onClose: onClose !== null && onClose !== void 0 ? onClose : (() => { }), children: [_jsxs("div", { style: TABS_STYLE, role: "tablist", "aria-label": "Version history tabs", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": tab === 'versions', "data-testid": "version-history-tab-versions", onClick: () => setTab('versions'), style: tabButtonStyle(tab === 'versions'), children: "Versions" }), _jsx("button", { type: "button", role: "tab", "aria-selected": tab === 'activity', "data-testid": "version-history-tab-activity", onClick: () => setTab('activity'), style: tabButtonStyle(tab === 'activity'), children: "Activity" })] }), tab === 'versions' ? (_jsx(VersionsTab, { docId: docId, saveNamedVersion: saveNamedVersion, onRestoreSnapshot: onRestoreSnapshot, onPreviewVersion: onPreviewVersion, onShowCurrent: onShowCurrent, isPreviewing: isPreviewing, serverBackend: serverBackend, onRestoreServerVersion: onRestoreServerVersion })) : (_jsx(ActivityTab, { history: history, emptyHint: emptyHint }))] }));
}
/* ============================================================
   Activity tab — the existing edit-feed UI (unchanged behavior,
   just hoisted into a sub-component so the tab container can
   render either side).
   ============================================================ */
function ActivityTab({ history, emptyHint }) {
    // Newest-first display so the latest edit is at the top — humans
    // scan downward. The hook returns oldest-first so the ring trim
    // semantics stay obvious.
    const sorted = useMemo(() => [...history.entries].sort((a, b) => b.time - a.time), [history.entries]);
    // Precompute (before, after) pairs for each entry. Older entries
    // use the next-newer entry's `before` as their "after"; the very
    // latest entry uses the live document text.
    const afterByEntryId = useMemo(() => {
        const map = new Map();
        const liveText = history.getCurrentText();
        let nextAfter = liveText;
        for (const e of sorted) {
            map.set(e.id, nextAfter);
            nextAfter = extractText(e.before);
        }
        return map;
    }, [sorted, history]);
    const now = Date.now();
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: SUBHEADER_STYLE, children: [_jsx("span", { children: "Activity" }), _jsx("span", { style: COUNT_STYLE, "data-testid": "version-history-count", children: history.entries.length })] }), sorted.length === 0 ? (_jsx(PanelState, { kind: "empty", message: emptyHint })) : (_jsx("ol", { style: LIST_STYLE, role: "list", children: sorted.map((entry) => {
                    var _a;
                    return (_jsx(EditHistoryEntryRow, { entry: entry, now: now, afterText: (_a = afterByEntryId.get(entry.id)) !== null && _a !== void 0 ? _a : '', onRevert: () => history.revert(entry.id), onRevertChange: (op, text, context) => history.revertHunk(op, text, context) }, entry.id));
                }) }))] }));
}
/* ============================================================
   Versions tab — IDB-backed persisted snapshots. Mirrors sheets'
   `apps/web/src/shell/VersionHistoryPanel.tsx` VersionsTab.
   ============================================================ */
function VersionsTab({ docId, saveNamedVersion, onRestoreSnapshot, onPreviewVersion, onShowCurrent, isPreviewing = false, serverBackend, onRestoreServerVersion, }) {
    const list = useLiveVersionList(docId, serverBackend);
    // "Only named versions" filter (Google-Docs pattern) — narrows the
    // list to manual milestones. Diffs still compare against the true
    // previous version from the FULL list, so a named version previews
    // against whatever immediately preceded it (auto or named).
    const [namedOnly, setNamedOnly] = useState(false);
    const visible = useMemo(() => (namedOnly ? list.filter((s) => s.kind === 'manual') : list), [list, namedOnly]);
    const groups = useMemo(() => groupByDay(visible), [visible]);
    const now = Date.now();
    // Chronological neighbor for diffing: the list is newest-first, so
    // each row's "previous version" is the entry one slot later in the
    // array (older in time). The last row has no previous — its diff
    // toggle is disabled.
    const previousById = useMemo(() => {
        const map = new Map();
        for (let i = 0; i < list.length - 1; i++) {
            const cur = list[i];
            const prev = list[i + 1];
            if ((cur === null || cur === void 0 ? void 0 : cur.id) != null && prev)
                map.set(cur.id, prev);
        }
        return map;
    }, [list]);
    const handleSaveVersion = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        if (!saveNamedVersion)
            return;
        // Native prompt — small, deterministic, works in Playwright.
        // A future iteration can replace it with the styled
        // InlineRenameDialog used elsewhere in the editor.
        // eslint-disable-next-line no-alert
        const raw = window.prompt('Name this version', '');
        if (raw == null)
            return;
        const trimmed = raw.trim();
        if (!trimmed)
            return;
        yield saveNamedVersion(trimmed);
    }), [saveNamedVersion]);
    const handleRestore = useCallback((snap) => __awaiter(this, void 0, void 0, function* () {
        // Server-backed entry: restore by downloading its .docx bytes
        // (the host owns the content; the list carries metadata only).
        if (snap.serverVersion != null) {
            onRestoreServerVersion === null || onRestoreServerVersion === void 0 ? void 0 : onRestoreServerVersion(snap.serverVersion);
            return;
        }
        if (!onRestoreSnapshot || snap.id == null)
            return;
        const full = yield readVersion(snap.id);
        if (!full)
            return;
        onRestoreSnapshot(full.data);
    }), [onRestoreSnapshot, onRestoreServerVersion]);
    const handleRename = useCallback((snap) => __awaiter(this, void 0, void 0, function* () {
        if (snap.serverVersion != null || snap.id == null)
            return; // server versions are host-owned
        // eslint-disable-next-line no-alert
        const next = window.prompt('Rename version', snap.name);
        if (next == null)
            return;
        const trimmed = next.trim();
        if (!trimmed || trimmed === snap.name)
            return;
        yield renameVersion(snap.id, trimmed);
    }), []);
    const handleDelete = useCallback((snap) => __awaiter(this, void 0, void 0, function* () {
        if (snap.serverVersion != null || snap.id == null)
            return; // server versions are host-owned
        // eslint-disable-next-line no-alert
        if (!window.confirm(`Delete "${snap.name}"? This cannot be undone.`))
            return;
        yield deleteVersion(snap.id);
    }), []);
    // Open the in-canvas preview. Local snapshots carry their `data`; the
    // previous (older) snapshot is the diff baseline. Server-backed
    // revisions hold no inline data, so they have no preview (Restore
    // downloads them instead).
    const handlePreview = useCallback((snap, previousSnap) => {
        var _a;
        if (!onPreviewVersion || snap.serverVersion != null || snap.data == null)
            return;
        onPreviewVersion({
            name: snap.name,
            savedAt: snap.savedAt,
            data: snap.data,
            previousData: (_a = previousSnap === null || previousSnap === void 0 ? void 0 : previousSnap.data) !== null && _a !== void 0 ? _a : null,
        });
    }, [onPreviewVersion]);
    if (!docId) {
        return _jsx(PanelState, { kind: "empty", message: "Open a document to see its version history." });
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: SUBHEADER_STYLE, children: [_jsx("span", { children: "Versions" }), _jsx("span", { style: COUNT_STYLE, "data-testid": "version-history-versions-count", children: visible.length }), saveNamedVersion && !serverBackend && (_jsx("button", { type: "button", onClick: handleSaveVersion, style: SAVE_VERSION_BTN_STYLE, "data-testid": "version-history-save-version", children: "Save version\u2026" }))] }), list.some((s) => s.kind !== 'manual') && (_jsxs("label", { style: NAMED_FILTER_STYLE, children: [_jsx("input", { type: "checkbox", checked: namedOnly, onChange: (e) => setNamedOnly(e.target.checked), "data-testid": "version-history-named-only" }), "Only named versions"] })), list.length === 0 ? (_jsx(PanelState, { kind: "empty", message: 'No saved versions yet. "Save version\u2026" bookmarks the current doc, or wait ~10 minutes for the first auto snapshot.' })) : (_jsxs("ol", { style: LIST_STYLE, role: "list", children: [onShowCurrent && (_jsx("li", { style: GROUP_STYLE, children: _jsx(CurrentVersionRow, { active: !isPreviewing, onClick: onShowCurrent }) })), namedOnly && visible.length === 0 && (_jsx("li", { style: Object.assign(Object.assign({}, ENTRY_STYLE), { color: 'var(--doc-text-muted)', fontSize: 12 }), children: "No named versions yet. Use \u201CSave version\u2026\u201D to bookmark one." })), groups.map(({ label, items }) => (_jsxs("li", { style: GROUP_STYLE, children: [_jsx("div", { style: GROUP_HEADER_STYLE, children: label }), _jsx("ol", { style: LIST_STYLE, role: "list", children: items.map((snap) => {
                                    const previousSnap = snap.id != null ? previousById.get(snap.id) : undefined;
                                    const canPreview = !!onPreviewVersion && snap.serverVersion == null && snap.data != null;
                                    return (_jsx(VersionRow, { snap: snap, previousSnap: previousSnap, now: now, onRestore: () => handleRestore(snap), onPreview: canPreview ? () => handlePreview(snap, previousSnap) : undefined, onRename: snap.serverVersion != null ? undefined : () => handleRename(snap), onDelete: snap.serverVersion != null ? undefined : () => handleDelete(snap) }, snap.id));
                                }) })] }, label)))] }))] }));
}
function VersionRow({ snap, previousSnap, now, onRestore, onPreview, onRename, onDelete, }) {
    // +/- word stats render at all times so the user can see the
    // magnitude of the change at a glance. Cheap LCS over the two
    // snapshots' plain text — memoised against the snapshot pair.
    const stats = useMemo(() => {
        if (!previousSnap)
            return null;
        const before = extractText(previousSnap.data).slice(0, DIFF_TRUNCATE_LIMIT);
        const after = extractText(snap.data).slice(0, DIFF_TRUNCATE_LIMIT);
        return diffStats(diffWords(before, after));
    }, [previousSnap, snap]);
    // The whole row is a click target that opens the full-canvas preview
    // (with the changes-since-previous overlaid) — the Google-Docs
    // interaction. Falls back to a plain <li> for server revisions.
    const interactive = !!onPreview;
    const [hover, setHover] = useState(false);
    // Per-row actions are consolidated into a kebab (⋮) menu so the row
    // stays clean and scannable (Google-Docs pattern). Restore is always
    // present; Rename / Delete only for client-owned local snapshots.
    const menuItems = [
        { icon: 'history', label: 'Restore this version', onClick: onRestore },
        ...(onRename ? [{ icon: 'edit_note', label: 'Rename', onClick: onRename }] : []),
        ...(onDelete ? [{ icon: 'delete', label: 'Delete', onClick: onDelete, danger: true }] : []),
    ];
    return (_jsxs("li", { style: Object.assign(Object.assign({}, ENTRY_STYLE), { cursor: interactive ? 'pointer' : 'default', background: hover && interactive ? 'var(--doc-surface-hover, #f5f7fa)' : 'transparent' }), "data-testid": "version-history-version-row", role: interactive ? 'button' : undefined, tabIndex: interactive ? 0 : undefined, onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onClick: interactive ? onPreview : undefined, onKeyDown: interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreview === null || onPreview === void 0 ? void 0 : onPreview();
                }
            }
            : undefined, children: [_jsxs("div", { style: ENTRY_HEAD_STYLE, children: [_jsx("span", { style: AUTHOR_STYLE, children: snap.name }), snap.kind === 'manual' && (_jsx(Tooltip, { content: "Named version \u2014 kept until deleted", children: _jsx("span", { style: KIND_BADGE_STYLE, tabIndex: 0, children: _jsx(MaterialSymbol, { name: "star", size: 12 }) }) })), _jsx("span", { style: { marginLeft: 'auto' }, children: _jsx(Tooltip, { content: new Date(snap.savedAt).toLocaleString(), children: _jsx("span", { tabIndex: 0, style: { outline: 'none' }, children: relativeTime(snap.savedAt, now) }) }) }), _jsx("span", { onClick: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation(), role: "presentation", children: _jsx(RowKebabMenu, { items: menuItems }) })] }), typeof snap.size === 'number' && snap.size > 0 && (_jsx("div", { style: SIZE_STYLE, children: formatSize(snap.size) })), stats && (stats.added > 0 || stats.removed > 0) && (_jsxs("div", { style: STATS_PILL_STYLE, "data-testid": "version-history-version-stats", children: [stats.added > 0 && _jsxs("span", { style: STAT_ADD_STYLE, children: ["+", stats.added] }), stats.added > 0 && stats.removed > 0 && _jsx("span", { children: "\u00B7" }), stats.removed > 0 && _jsxs("span", { style: STAT_REMOVE_STYLE, children: ["-", stats.removed] }), _jsxs("span", { children: ["word", stats.added + stats.removed === 1 ? '' : 's'] })] }))] }));
}
/* ============================================================
   Current-version row + per-row kebab menu.
   ============================================================ */
function CurrentVersionRow({ active, onClick }) {
    return (_jsxs("button", { type: "button", onClick: onClick, "data-testid": "version-history-current-row", "aria-current": active ? 'true' : 'false', style: Object.assign(Object.assign({}, CURRENT_ROW_STYLE), { background: active ? 'var(--doc-primary-subtle, #e8f0fe)' : 'transparent', color: active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-text)' }), children: [_jsx("span", { children: "Current version" }), active && _jsx(MaterialSymbol, { name: "check", size: 16, style: { marginLeft: 'auto' } })] }));
}
function RowKebabMenu({ items }) {
    const [open, setOpen] = useState(false);
    const { containerRef, dropdownRef, dropdownStyle, handleMouseDown } = useFixedDropdown({
        isOpen: open,
        onClose: () => setOpen(false),
        align: 'right',
    });
    return (_jsxs("span", { ref: containerRef, style: { display: 'inline-flex' }, children: [_jsx(Tooltip, { content: "More actions", children: _jsx("button", { type: "button", onMouseDown: handleMouseDown, onClick: () => setOpen((v) => !v), style: KEBAB_BTN_STYLE, "aria-haspopup": "menu", "aria-expanded": open, "aria-label": "Version actions", "data-testid": "version-history-row-menu", children: _jsx(MaterialSymbol, { name: "more_vert", size: 18 }) }) }), open && (_jsx("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, dropdownStyle), KEBAB_MENU_STYLE), role: "menu", children: items.map((item) => (_jsxs("button", { type: "button", role: "menuitem", onClick: () => {
                        setOpen(false);
                        item.onClick();
                    }, style: Object.assign(Object.assign({}, KEBAB_ITEM_STYLE), { color: item.danger ? '#b91c1c' : 'var(--doc-text)' }), children: [_jsx(MaterialSymbol, { name: item.icon, size: 16 }), item.label] }, item.label))) }))] }));
}
function groupByDay(list) {
    if (list.length === 0)
        return [];
    // Sheets uses the same labels (Today / Yesterday / explicit date).
    // Ordering follows the list itself (assumed newest-first by store).
    const now = new Date();
    const todayKey = dayKey(now);
    const yesterdayKey = dayKey(new Date(now.getTime() - 86400000));
    const map = new Map();
    for (const snap of list) {
        const d = new Date(snap.savedAt);
        const key = dayKey(d);
        const label = key === todayKey
            ? 'Today'
            : key === yesterdayKey
                ? 'Yesterday'
                : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        let group = map.get(key);
        if (!group) {
            group = { label, items: [] };
            map.set(key, group);
        }
        group.items.push(snap);
    }
    return Array.from(map.values());
}
function dayKey(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function tabButtonStyle(active) {
    return {
        flex: 1,
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-text-muted)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        borderBottom: active ? '2px solid var(--doc-primary, #1a73e8)' : '2px solid transparent',
        cursor: 'pointer',
    };
}
function EditHistoryEntryRow({ entry, now, afterText, onRevert, onRevertChange, }) {
    const canRevert = entry.before != null;
    const [showDiff, setShowDiff] = useState(false);
    // Compute the diff only when expanded — LCS is O(N*M) so we don't
    // want to spin it on every panel re-render for entries the user
    // hasn't asked to see. The result is memoised against the snapshot
    // strings so toggling expanded keeps the same value.
    const diff = useMemo(() => {
        if (!showDiff)
            return null;
        const before = extractText(entry.before).slice(0, DIFF_TRUNCATE_LIMIT);
        const after = afterText.slice(0, DIFF_TRUNCATE_LIMIT);
        return diffWords(before, after);
    }, [showDiff, entry.before, afterText]);
    // Stats (added/removed words) shown on the row at all times.
    //
    // PREVIOUSLY: setState was called inside `useMemo`, which is a
    // React anti-pattern — under some renders it produced
    // "Too many re-renders" (error #185) and crashed the whole editor
    // (user-reported as "page becomes unresponsive"). useEffect is the
    // correct hook for the side-effect of writing computed state.
    const [stats, setStats] = useState(null);
    useEffect(() => {
        if (!afterText && entry.before == null) {
            setStats(null);
            return;
        }
        const before = extractText(entry.before).slice(0, DIFF_TRUNCATE_LIMIT);
        const after = afterText.slice(0, DIFF_TRUNCATE_LIMIT);
        const segments = diffWords(before, after);
        setStats(diffStats(segments));
    }, [entry.before, afterText]);
    return (_jsxs("li", { style: ENTRY_STYLE, children: [_jsxs("div", { style: ENTRY_HEAD_STYLE, children: [_jsx("span", { style: AUTHOR_STYLE, children: entry.author }), _jsx("span", { children: "\u00B7" }), _jsx(Tooltip, { content: new Date(entry.time).toLocaleString(), children: _jsx("span", { tabIndex: 0, style: { outline: 'none' }, children: relativeTime(entry.time, now) }) }), entry.txCount > 1 && _jsxs("span", { style: { marginLeft: 'auto' }, children: [entry.txCount, " edits"] })] }), _jsx("div", { style: SUMMARY_STYLE, children: entry.summary }), stats && (stats.added > 0 || stats.removed > 0) && (_jsxs("div", { style: STATS_PILL_STYLE, "data-testid": "version-history-stats", children: [stats.added > 0 && _jsxs("span", { style: STAT_ADD_STYLE, children: ["+", stats.added] }), stats.added > 0 && stats.removed > 0 && _jsx("span", { children: "\u00B7" }), stats.removed > 0 && _jsxs("span", { style: STAT_REMOVE_STYLE, children: ["-", stats.removed] }), _jsxs("span", { children: ["word", stats.added + stats.removed === 1 ? '' : 's'] })] })), _jsxs("div", { style: ENTRY_ACTIONS_STYLE, children: [_jsx(Tooltip, { content: canRevert ? 'Revert document to this point' : 'Snapshot unavailable', children: _jsx("button", { type: "button", onClick: onRevert, disabled: !canRevert, "aria-label": `Revert to ${entry.summary}`, style: REVERT_BUTTON_STYLE, children: "Revert to here" }) }), _jsx("button", { type: "button", onClick: () => setShowDiff((v) => !v), style: SHOW_DIFF_BTN_STYLE, "aria-expanded": showDiff, "data-testid": "version-history-toggle-diff", children: showDiff ? 'Hide changes' : 'Show changes' })] }), showDiff && diff && (_jsx("pre", { style: DIFF_BOX_STYLE, "data-testid": "version-history-diff", children: diff.map((seg, i) => {
                    if (seg.op === 'keep')
                        return _jsx("span", { children: seg.text }, i);
                    // Anchor context = last 30 chars of the preceding `keep`
                    // run. Disambiguates identical substrings — e.g. typing
                    // "hello" in two paragraphs reverts the right one.
                    const prevKept = (() => {
                        for (let j = i - 1; j >= 0; j--) {
                            if (diff[j].op === 'keep')
                                return diff[j].text.slice(-30);
                            // A non-keep segment between us and the previous keep
                            // means there's no clean disambiguating prefix; bail
                            // and use empty context. Could be improved by chaining
                            // through adjacent changes, but the common case is
                            // single-keep gaps.
                            break;
                        }
                        return '';
                    })();
                    // `seg.op` is now narrowed to `'add' | 'remove'` because
                    // the `keep` branch returned `<span>` above.
                    const opForRevert = seg.op;
                    const onRevertHunk = () => {
                        const ok = onRevertChange(opForRevert, seg.text, prevKept);
                        if (!ok) {
                            // Soft-fail — no toast plumbing into this leaf
                            // component; aria-live label updates so screen readers
                            // know. The Cmd+Z path still works for users who
                            // expected the previous behaviour.
                        }
                    };
                    if (seg.op === 'add') {
                        return (_jsx("ins", { style: DIFF_ADD_STYLE, role: "button", tabIndex: 0, title: "Revert this insertion", "data-testid": "version-history-diff-add", onClick: onRevertHunk, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onRevertHunk();
                                }
                            }, children: seg.text }, i));
                    }
                    return (_jsx("del", { style: DIFF_REMOVE_STYLE, role: "button", tabIndex: 0, title: "Bring this text back", "data-testid": "version-history-diff-remove", onClick: onRevertHunk, onKeyDown: (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onRevertHunk();
                            }
                        }, children: seg.text }, i));
                }) }))] }));
}
//# sourceMappingURL=VersionHistoryPanel.js.map