import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * StatusBar — bottom strip with page indicator, word count, and zoom
 * controls. Inspired by the bottom bar in Google Docs / Word and the
 * sibling Casual Sheets project's status row.
 *
 * Renders inside the editor container, below the paginated pages, so
 * it stays visible while the document scrolls.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialSymbol } from './ui/Icons';
import { Tooltip } from './ui/Tooltip';
import { STAT_LABELS, useStatPrefs } from './statbar-prefs';
import { computeReadability, formatReadingTime, gradeLabel } from '../lib/quality/readability';
const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const ZOOM_STEP = 1.1;
const barStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '4px 12px',
    borderTop: '1px solid var(--doc-border, #e0e0e0)',
    background: 'var(--doc-chrome, #eef1f5)',
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    fontSize: 12,
    height: 28,
    flexShrink: 0,
    userSelect: 'none',
};
const cellStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
};
const dividerStyle = {
    width: 1,
    height: 16,
    background: 'var(--doc-border, #e0e0e0)',
};
const zoomButtonStyle = {
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: 3,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 22,
    width: 22,
};
const checklistStyle = {
    position: 'absolute',
    bottom: '100%',
    left: 12,
    marginBottom: 4,
    padding: '4px 0',
    background: 'var(--doc-surface, white)',
    border: '1px solid var(--doc-border, #ddd)',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    minWidth: 180,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
};
const checklistItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: 'var(--doc-text-on-surface, #1f2937)',
    cursor: 'pointer',
};
const zoomMenuStyle = {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 4,
    padding: '4px 0',
    background: 'var(--doc-surface, white)',
    border: '1px solid var(--doc-border, #ddd)',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    minWidth: 96,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
};
const zoomMenuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '5px 12px',
    fontSize: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--doc-text-on-surface, #1f2937)',
    cursor: 'pointer',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
};
const zoomMenuItemActiveStyle = Object.assign(Object.assign({}, zoomMenuItemStyle), { background: 'var(--doc-bg-hover, #f1f3f4)', fontWeight: 500 });
const zoomReadoutStyle = {
    fontVariantNumeric: 'tabular-nums',
    minWidth: 36,
    textAlign: 'center',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 3,
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontSize: 12,
};
function formatCount(n, singular, plural) {
    if (n === undefined)
        return '';
    const word = n === 1 ? singular : (plural !== null && plural !== void 0 ? plural : singular + 's');
    return `${n.toLocaleString()} ${word}`;
}
export function StatusBar({ currentPage, totalPages, wordCount, charCount, docText, zoom, onZoomChange, minZoom = 0.25, maxZoom = 4, visible = true, }) {
    // Preset popover state lives next to the trigger so the parent
    // doesn't need to know it exists. Closes on outside-click / Escape.
    const [presetsOpen, setPresetsOpen] = useState(false);
    const presetWrapRef = useRef(null);
    useEffect(() => {
        if (!presetsOpen)
            return;
        const onDown = (e) => {
            var _a;
            if (!((_a = presetWrapRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)))
                setPresetsOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape')
                setPresetsOpen(false);
        };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [presetsOpen]);
    // Status-bar customisation checklist (Excel-style right-click).
    // Both popover state and the dirty-flag prefs use hooks — they must
    // run BEFORE the `!visible` early return below, or React will see a
    // different hook order between visible and hidden renders.
    const { prefs, toggle } = useStatPrefs();
    const [checklistOpen, setChecklistOpen] = useState(false);
    const checklistWrapRef = useRef(null);
    useEffect(() => {
        if (!checklistOpen)
            return;
        const onDown = (e) => {
            var _a;
            if (!((_a = checklistWrapRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)))
                setChecklistOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape')
                setChecklistOpen(false);
        };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [checklistOpen]);
    const handleContextMenu = (e) => {
        e.preventDefault();
        setChecklistOpen(true);
    };
    // Early-return AFTER all hooks have run so React sees a stable hook
    // order. The derived zoom values are non-hook helpers so they sit
    // below the early-return guard.
    if (!visible)
        return null;
    const zoomPct = zoom !== undefined ? Math.round(zoom * 100) : 100;
    const zoomIn = () => onZoomChange === null || onZoomChange === void 0 ? void 0 : onZoomChange(Math.min((zoom !== null && zoom !== void 0 ? zoom : 1) * ZOOM_STEP, maxZoom));
    const zoomOut = () => onZoomChange === null || onZoomChange === void 0 ? void 0 : onZoomChange(Math.max((zoom !== null && zoom !== void 0 ? zoom : 1) / ZOOM_STEP, minZoom));
    const hasPages = totalPages !== undefined && totalPages > 0;
    return (_jsxs("div", { role: "status", "aria-label": "Document status", style: barStyle, "data-testid": "status-bar", onContextMenu: handleContextMenu, children: [hasPages && prefs.page && (_jsxs(_Fragment, { children: [_jsxs("span", { style: cellStyle, "aria-label": `Page ${currentPage !== null && currentPage !== void 0 ? currentPage : 1} of ${totalPages}`, children: ["Page ", currentPage !== null && currentPage !== void 0 ? currentPage : 1, " of ", totalPages] }), ((wordCount !== undefined && prefs.words) ||
                        (charCount !== undefined && prefs.chars)) && _jsx("span", { style: dividerStyle })] })), wordCount !== undefined && prefs.words && (_jsx("span", { style: cellStyle, "aria-label": `${wordCount} words`, children: formatCount(wordCount, 'word') })), charCount !== undefined && prefs.chars && (_jsx("span", { style: cellStyle, "aria-label": `${charCount} characters`, children: formatCount(charCount, 'character') })), wordCount !== undefined &&
                wordCount > 0 &&
                prefs.readingTime &&
                (() => {
                    const minutes = Math.max(1, Math.ceil(wordCount / 200));
                    return (_jsxs("span", { style: cellStyle, "aria-label": `Estimated ${minutes} minute read`, "data-testid": "status-reading-time", children: ["~", minutes, " min read"] }));
                })(), prefs.readability && docText && docText.length > 0 && _jsx(ReadabilityCell, { docText: docText }), checklistOpen && (_jsx("div", { ref: checklistWrapRef, role: "menu", "aria-label": "Status bar customisation", "data-testid": "statbar-checklist", style: checklistStyle, children: Object.keys(STAT_LABELS).map((k) => (_jsxs("label", { style: checklistItemStyle, children: [_jsx("input", { type: "checkbox", checked: prefs[k], onChange: () => toggle(k), "data-testid": `statbar-toggle-${k}` }), _jsx("span", { children: STAT_LABELS[k] })] }, k))) })), _jsx("span", { style: { flex: 1 } }), onZoomChange && (_jsxs("span", { style: cellStyle, children: [_jsx(Tooltip, { content: "Zoom out (\u2318\u2212)", children: _jsx("button", { type: "button", className: "docx-status-zoom-btn", style: zoomButtonStyle, onClick: zoomOut, onMouseDown: (e) => e.preventDefault(), "aria-label": "Zoom out", disabled: (zoom !== null && zoom !== void 0 ? zoom : 1) <= minZoom + 1e-3, children: _jsx(MaterialSymbol, { name: "remove", size: 14 }) }) }), _jsxs("span", { ref: presetWrapRef, style: { position: 'relative' }, children: [_jsx(Tooltip, { content: "Zoom presets (\u23180 to reset)", children: _jsxs("button", { type: "button", style: zoomReadoutStyle, onClick: () => setPresetsOpen((o) => !o), onMouseDown: (e) => e.preventDefault(), "aria-label": `Zoom: ${zoomPct} percent. Click to choose a preset.`, "aria-haspopup": "menu", "aria-expanded": presetsOpen, "data-testid": "zoom-readout", children: [zoomPct, "%"] }) }), presetsOpen && (_jsx("div", { role: "menu", "aria-label": "Zoom presets", "data-testid": "zoom-presets-menu", style: zoomMenuStyle, children: ZOOM_PRESETS.map((preset) => {
                                    const pct = Math.round(preset * 100);
                                    const isActive = Math.abs(zoomPct - pct) < 1;
                                    return (_jsxs("button", { type: "button", role: "menuitem", style: isActive ? zoomMenuItemActiveStyle : zoomMenuItemStyle, onClick: () => {
                                            onZoomChange === null || onZoomChange === void 0 ? void 0 : onZoomChange(preset);
                                            setPresetsOpen(false);
                                        }, onMouseDown: (e) => e.preventDefault(), children: [pct, "%", isActive && _jsx("span", { style: { marginLeft: 8 }, children: "\u2713" })] }, preset));
                                }) }))] }), _jsx(Tooltip, { content: "Zoom in (\u2318=)", children: _jsx("button", { type: "button", className: "docx-status-zoom-btn", style: zoomButtonStyle, onClick: zoomIn, onMouseDown: (e) => e.preventDefault(), "aria-label": "Zoom in", disabled: (zoom !== null && zoom !== void 0 ? zoom : 1) >= maxZoom - 1e-3, children: _jsx(MaterialSymbol, { name: "add", size: 14 }) }) })] }))] }));
}
/**
 * Compact readability cell — short label in the status bar plus a
 * tooltip with the full breakdown. Stats are memoised on the doc text
 * so large docs don't re-compute on every keystroke (the parent only
 * passes a fresh snapshot when the doc actually changes).
 */
function ReadabilityCell({ docText }) {
    const stats = useMemo(() => computeReadability(docText), [docText]);
    const compact = (() => {
        if (stats.gradeLevel == null)
            return 'Readability: —';
        return `${gradeLabel(stats.gradeLevel)}`;
    })();
    const detailLines = [
        `${stats.sentences} sentence${stats.sentences === 1 ? '' : 's'}`,
        `${stats.avgSentenceLength} words/sentence`,
    ];
    if (stats.longSentences > 0) {
        detailLines.push(`${stats.longSentences} long sentence${stats.longSentences === 1 ? '' : 's'} (> 25 words)`);
    }
    detailLines.push(`Reading time: ${formatReadingTime(stats.readingTimeMs)}`);
    if (stats.gradeLevel != null) {
        detailLines.push(`Flesch-Kincaid: ${stats.gradeLevel}`);
    }
    const detail = detailLines.join('\n');
    return (_jsx(Tooltip, { content: detail, children: _jsx("span", { style: cellStyle, "data-testid": "status-readability", "aria-label": `Readability: ${compact}. ${detail.replace(/\n/g, ', ')}`, tabIndex: 0, children: compact }) }));
}
//# sourceMappingURL=StatusBar.js.map