import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const ACCENT = 'var(--doc-primary, #1a73e8)';
const ADD = '#1e8e3e';
const DEL = '#d93025';
const LINE = 'currentColor';
// Shared mini-grid frame (a 2×2 table). `tint` colours one band to show which
// row/column an action targets.
function Grid({ tint, band, }) {
    const cells = [];
    if (tint && band) {
        if (band === 'top')
            cells.push(_jsx("rect", { x: "4", y: "4", width: "16", height: "6", fill: tint, opacity: "0.85" }, "b"));
        if (band === 'bottom')
            cells.push(_jsx("rect", { x: "4", y: "14", width: "16", height: "6", fill: tint, opacity: "0.85" }, "b"));
        if (band === 'left')
            cells.push(_jsx("rect", { x: "4", y: "4", width: "6", height: "16", fill: tint, opacity: "0.85" }, "b"));
        if (band === 'right')
            cells.push(_jsx("rect", { x: "14", y: "4", width: "6", height: "16", fill: tint, opacity: "0.85" }, "b"));
        if (band === 'all')
            cells.push(_jsx("rect", { x: "4", y: "4", width: "16", height: "16", fill: tint, opacity: "0.15" }, "b"));
    }
    return (_jsxs(_Fragment, { children: [cells, _jsx("rect", { x: "4", y: "4", width: "16", height: "16", rx: "1.5", fill: "none", stroke: LINE, strokeWidth: "1.5" }), _jsx("path", { d: "M12 4v16M4 12h16", stroke: LINE, strokeWidth: "1.2" })] }));
}
function Plus({ x, y }) {
    return (_jsx("g", { stroke: ADD, strokeWidth: "1.8", strokeLinecap: "round", children: _jsx("path", { d: `M${x - 3} ${y}h6M${x} ${y - 3}v6` }) }));
}
const ICONS = {
    addRowAbove: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, { tint: ADD, band: "top" }), _jsx(Plus, { x: 12, y: 1.5 })] })),
    addRowBelow: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, { tint: ADD, band: "bottom" }), _jsx(Plus, { x: 12, y: 22.5 })] })),
    deleteRow: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, { tint: DEL, band: "all" }), _jsx("rect", { x: "4", y: "10.5", width: "16", height: "3", fill: DEL })] })),
    addColumnLeft: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, { tint: ADD, band: "left" }), _jsx(Plus, { x: 1.5, y: 12 })] })),
    addColumnRight: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, { tint: ADD, band: "right" }), _jsx(Plus, { x: 22.5, y: 12 })] })),
    deleteColumn: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, { tint: DEL, band: "all" }), _jsx("rect", { x: "10.5", y: "4", width: "3", height: "16", fill: DEL })] })),
    mergeCells: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx("rect", { x: "4", y: "6", width: "16", height: "12", rx: "1.5", fill: "none", stroke: LINE, strokeWidth: "1.5" }), _jsx("path", { d: "M12 6v3M12 15v3", stroke: LINE, strokeWidth: "1.2" }), _jsx("path", { d: "M9 12h6M9 12l2-2M9 12l2 2M15 12l-2-2M15 12l-2 2", stroke: ACCENT, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })] })),
    splitCell: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx("rect", { x: "4", y: "6", width: "16", height: "12", rx: "1.5", fill: "none", stroke: LINE, strokeWidth: "1.5" }), _jsx("path", { d: "M12 6v12", stroke: ACCENT, strokeWidth: "1.5", strokeDasharray: "2 2" })] })),
    deleteTable: (_jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", children: [_jsx(Grid, {}), _jsx("path", { d: "M7 7l10 10M17 7L7 17", stroke: DEL, strokeWidth: "1.8", strokeLinecap: "round" })] })),
};
const GROUPS = [
    {
        header: 'Rows',
        items: [
            { action: 'addRowAbove', label: 'Above' },
            { action: 'addRowBelow', label: 'Below' },
            { action: 'deleteRow', label: 'Delete', danger: true },
        ],
    },
    {
        header: 'Columns',
        items: [
            { action: 'addColumnLeft', label: 'Left' },
            { action: 'addColumnRight', label: 'Right' },
            { action: 'deleteColumn', label: 'Delete', danger: true },
        ],
    },
    {
        header: 'Cells',
        items: [
            { action: 'mergeCells', label: 'Merge' },
            { action: 'splitCell', label: 'Split' },
        ],
    },
    {
        header: 'Table',
        items: [{ action: 'deleteTable', label: 'Delete table', danger: true }],
    },
];
const GROUP_HEADER = {
    padding: '12px 16px 6px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--doc-text-muted)',
    fontWeight: 600,
};
const TILE_GRID = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
    padding: '0 12px 4px',
};
const tile = (danger) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 2px 6px',
    fontSize: 11,
    lineHeight: 1.2,
    textAlign: 'center',
    color: danger ? 'var(--doc-danger, #d93025)' : 'var(--doc-text, #202124)',
    background: 'transparent',
    border: '1.5px solid var(--doc-border, #dadce0)',
    borderRadius: 8,
    cursor: 'pointer',
});
export function TablePropertiesSection({ onAction }) {
    return (_jsx("div", { "data-testid": "properties-table-section", children: GROUPS.map((group) => (_jsxs("div", { children: [_jsx("div", { style: GROUP_HEADER, children: group.header }), _jsx("div", { style: TILE_GRID, role: "group", "aria-label": group.header, children: group.items.map((item) => (_jsxs("button", { type: "button", style: tile(!!item.danger), title: item.label, "aria-label": `${group.header}: ${item.label}`, "data-testid": `properties-table-${item.action}`, onMouseDown: (e) => {
                            e.preventDefault();
                            onAction(item.action);
                        }, children: [ICONS[item.action], _jsx("span", { children: item.label })] }, item.action))) })] }, group.header))) }));
}
//# sourceMappingURL=TablePropertiesSection.js.map