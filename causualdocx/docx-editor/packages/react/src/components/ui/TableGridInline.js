import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TableGridInline — a grid picker for table dimensions, rendered inline (no button/dropdown wrapper).
 * Used both standalone inside menu submenus and internally by TableGridPicker.
 */
import { useState, useCallback } from 'react';
const CELL_SIZE = 18;
const CELL_GAP = 2;
const cellStyle = {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'var(--doc-surface, white)',
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 2,
    transition: 'background-color var(--doc-anim-fast), border-color var(--doc-anim-fast)',
    cursor: 'pointer',
};
const cellSelectedStyle = Object.assign(Object.assign({}, cellStyle), { backgroundColor: 'var(--doc-primary, #3b82f6)', border: '1px solid var(--doc-primary, #3b82f6)' });
const labelStyle = {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--doc-text, #374151)',
    textAlign: 'center',
};
export function TableGridInline({ onInsert, gridRows = 6, gridColumns = 6 }) {
    const [hoverRows, setHoverRows] = useState(0);
    const [hoverCols, setHoverCols] = useState(0);
    const handleCellClick = useCallback(() => {
        if (hoverRows > 0 && hoverCols > 0) {
            onInsert(hoverRows, hoverCols);
        }
    }, [hoverRows, hoverCols, onInsert]);
    const gridCells = [];
    for (let row = 1; row <= gridRows; row++) {
        for (let col = 1; col <= gridColumns; col++) {
            const isSelected = row <= hoverRows && col <= hoverCols;
            gridCells.push(_jsx("div", { style: isSelected ? cellSelectedStyle : cellStyle, onMouseEnter: () => {
                    setHoverRows(row);
                    setHoverCols(col);
                }, onClick: handleCellClick, role: "gridcell", "aria-selected": isSelected }, `${row}-${col}`));
        }
    }
    const gridLabel = hoverRows > 0 && hoverCols > 0 ? `${hoverCols} × ${hoverRows}` : 'Select size';
    return (_jsxs("div", { children: [_jsx("div", { style: {
                    display: 'grid',
                    gap: CELL_GAP,
                    gridTemplateColumns: `repeat(${gridColumns}, ${CELL_SIZE}px)`,
                }, onMouseLeave: () => {
                    setHoverRows(0);
                    setHoverCols(0);
                }, role: "grid", "aria-label": "Table size selector", children: gridCells }), _jsx("div", { style: labelStyle, children: gridLabel })] }));
}
//# sourceMappingURL=TableGridInline.js.map