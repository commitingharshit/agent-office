import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Insert Table Dialog Component
 *
 * Modal dialog for inserting a new table into the document.
 * Provides a visual grid selector for choosing rows and columns.
 *
 * Features:
 * - Visual grid selector (hover to select dimensions)
 * - Manual row/column input
 * - Preview of table dimensions
 * - Quick insert with default sizes
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
// ============================================================================
// STYLES
// ============================================================================
const DIALOG_OVERLAY_STYLE = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
};
const DIALOG_CONTENT_STYLE = {
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    minWidth: '320px',
    maxWidth: '400px',
    width: '100%',
    margin: 'clamp(8px, 2.5vw, 20px)',
};
const DIALOG_HEADER_STYLE = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--doc-border)',
};
const DIALOG_TITLE_STYLE = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--doc-text)',
};
const CLOSE_BUTTON_STYLE = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    padding: '4px 8px',
    lineHeight: 1,
};
const DIALOG_BODY_STYLE = {
    padding: '20px',
};
const GRID_CONTAINER_STYLE = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
};
const GRID_STYLE = {
    display: 'grid',
    gap: '2px',
    padding: '4px',
    backgroundColor: 'var(--doc-bg-hover)',
    borderRadius: '4px',
    cursor: 'pointer',
};
const GRID_CELL_STYLE = {
    width: '24px',
    height: '24px',
    backgroundColor: 'var(--doc-surface, white)',
    border: '1px solid var(--doc-border-dark)',
    borderRadius: '2px',
    transition: 'background-color var(--doc-anim-fast), border-color var(--doc-anim-fast)',
};
const GRID_CELL_SELECTED_STYLE = Object.assign(Object.assign({}, GRID_CELL_STYLE), { backgroundColor: 'var(--doc-primary)', borderColor: 'var(--doc-primary)' });
const GRID_LABEL_STYLE = {
    marginTop: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--doc-text)',
};
const SEPARATOR_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
    color: 'var(--doc-text-muted)',
    fontSize: '12px',
};
const SEPARATOR_LINE_STYLE = {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--doc-border)',
};
const INPUT_ROW_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
};
const LABEL_STYLE = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--doc-text)',
    minWidth: '80px',
};
const INPUT_STYLE = {
    width: '80px',
    padding: '8px 12px',
    border: '1px solid var(--doc-border-input)',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
};
const DIALOG_FOOTER_STYLE = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid var(--doc-border)',
};
const BUTTON_BASE_STYLE = {
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
};
const PRIMARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-primary)', color: 'white' });
const SECONDARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-bg-hover)', color: 'var(--doc-text)', border: '1px solid var(--doc-border-input)' });
const DISABLED_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-border-input)', color: 'var(--doc-text-muted)', cursor: 'not-allowed' });
// ============================================================================
// ICONS
// ============================================================================
/**
 * Table Icon
 */
function TableIcon() {
    return (_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "2", y: "2", width: "16", height: "16", stroke: "currentColor", strokeWidth: "1.5", fill: "none", rx: "1" }), _jsx("line", { x1: "2", y1: "7", x2: "18", y2: "7", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("line", { x1: "2", y1: "12", x2: "18", y2: "12", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "18", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("line", { x1: "13", y1: "2", x2: "13", y2: "18", stroke: "currentColor", strokeWidth: "1.5" })] }));
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * InsertTableDialog - Modal for inserting tables with visual grid selector
 */
export function InsertTableDialog({ isOpen, onClose, onInsert, maxGridRows = 8, maxGridColumns = 10, maxRows = 100, maxColumns = 20, className, style, }) {
    const { t } = useTranslation();
    // State for grid hover selection
    const [hoverRows, setHoverRows] = useState(0);
    const [hoverCols, setHoverCols] = useState(0);
    // State for manual input
    const [inputRows, setInputRows] = useState(3);
    const [inputCols, setInputCols] = useState(3);
    // Refs
    const dialogRef = useRef(null);
    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setHoverRows(0);
            setHoverCols(0);
            setInputRows(3);
            setInputCols(3);
        }
    }, [isOpen]);
    // Focus trap
    useEffect(() => {
        var _a;
        if (isOpen) {
            (_a = dialogRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [isOpen]);
    /**
     * Handle grid cell hover
     */
    const handleCellHover = useCallback((row, col) => {
        setHoverRows(row);
        setHoverCols(col);
    }, []);
    /**
     * Handle grid cell click - insert table with selected dimensions
     */
    const handleCellClick = useCallback(() => {
        if (hoverRows > 0 && hoverCols > 0) {
            onInsert({ rows: hoverRows, columns: hoverCols });
        }
    }, [hoverRows, hoverCols, onInsert]);
    /**
     * Handle manual input insert
     */
    const handleManualInsert = useCallback(() => {
        const rows = Math.min(Math.max(1, inputRows), maxRows);
        const cols = Math.min(Math.max(1, inputCols), maxColumns);
        onInsert({ rows, columns: cols });
    }, [inputRows, inputCols, maxRows, maxColumns, onInsert]);
    /**
     * Handle keyboard events
     */
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleManualInsert();
        }
    }, [onClose, handleManualInsert]);
    /**
     * Handle overlay click (close dialog)
     */
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);
    /**
     * Handle row input change
     */
    const handleRowsChange = useCallback((e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setInputRows(Math.min(Math.max(1, value), maxRows));
        }
        else if (e.target.value === '') {
            setInputRows(1);
        }
    }, [maxRows]);
    /**
     * Handle column input change
     */
    const handleColsChange = useCallback((e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setInputCols(Math.min(Math.max(1, value), maxColumns));
        }
        else if (e.target.value === '') {
            setInputCols(1);
        }
    }, [maxColumns]);
    // Don't render if not open
    if (!isOpen) {
        return null;
    }
    // Generate grid cells
    const gridCells = [];
    for (let row = 1; row <= maxGridRows; row++) {
        for (let col = 1; col <= maxGridColumns; col++) {
            const isSelected = row <= hoverRows && col <= hoverCols;
            gridCells.push(_jsx("div", { style: isSelected ? GRID_CELL_SELECTED_STYLE : GRID_CELL_STYLE, onMouseEnter: () => handleCellHover(row, col), onClick: handleCellClick, role: "gridcell", "aria-selected": isSelected }, `${row}-${col}`));
        }
    }
    const canInsert = inputRows >= 1 && inputCols >= 1;
    const gridLabel = hoverRows > 0 && hoverCols > 0
        ? t('dialogs.insertTable.tableSize', { cols: hoverCols, rows: hoverRows })
        : t('dialogs.insertTable.hoverToSelect');
    return (_jsx(FocusTrap, { children: _jsx("div", { className: `docx-insert-table-dialog-overlay ${className || ''}`, style: Object.assign(Object.assign({}, DIALOG_OVERLAY_STYLE), style), onClick: handleOverlayClick, onKeyDown: handleKeyDown, role: "dialog", "aria-modal": "true", "aria-labelledby": "insert-table-dialog-title", children: _jsxs("div", { ref: dialogRef, className: "docx-insert-table-dialog", style: DIALOG_CONTENT_STYLE, tabIndex: -1, children: [_jsxs("div", { className: "docx-insert-table-dialog-header", style: DIALOG_HEADER_STYLE, children: [_jsx("h2", { id: "insert-table-dialog-title", style: DIALOG_TITLE_STYLE, children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(TableIcon, {}), t('dialogs.insertTable.title')] }) }), _jsx("button", { type: "button", className: "docx-insert-table-dialog-close", style: CLOSE_BUTTON_STYLE, onClick: onClose, "aria-label": t('common.closeDialog'), children: "\u00D7" })] }), _jsxs("div", { className: "docx-insert-table-dialog-body", style: DIALOG_BODY_STYLE, children: [_jsxs("div", { className: "docx-insert-table-grid-container", style: GRID_CONTAINER_STYLE, children: [_jsx("div", { className: "docx-insert-table-grid", style: Object.assign(Object.assign({}, GRID_STYLE), { gridTemplateColumns: `repeat(${maxGridColumns}, 1fr)` }), onMouseLeave: () => {
                                            setHoverRows(0);
                                            setHoverCols(0);
                                        }, role: "grid", "aria-label": "Table size selector", children: gridCells }), _jsx("div", { className: "docx-insert-table-grid-label", style: GRID_LABEL_STYLE, children: gridLabel })] }), _jsxs("div", { className: "docx-insert-table-separator", style: SEPARATOR_STYLE, children: [_jsx("div", { style: SEPARATOR_LINE_STYLE }), _jsx("span", { children: t('dialogs.insertTable.orSpecifySize') }), _jsx("div", { style: SEPARATOR_LINE_STYLE })] }), _jsxs("div", { className: "docx-insert-table-inputs", children: [_jsxs("div", { style: INPUT_ROW_STYLE, children: [_jsx("label", { htmlFor: "insert-table-rows", style: LABEL_STYLE, children: t('dialogs.insertTable.rowsLabel') }), _jsx("input", { id: "insert-table-rows", type: "number", min: 1, max: maxRows, value: inputRows, onChange: handleRowsChange, style: INPUT_STYLE })] }), _jsxs("div", { style: INPUT_ROW_STYLE, children: [_jsx("label", { htmlFor: "insert-table-cols", style: LABEL_STYLE, children: t('dialogs.insertTable.columnsLabel') }), _jsx("input", { id: "insert-table-cols", type: "number", min: 1, max: maxColumns, value: inputCols, onChange: handleColsChange, style: INPUT_STYLE })] })] })] }), _jsxs("div", { className: "docx-insert-table-dialog-footer", style: DIALOG_FOOTER_STYLE, children: [_jsx("button", { type: "button", className: "docx-insert-table-dialog-cancel", style: SECONDARY_BUTTON_STYLE, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", className: "docx-insert-table-dialog-insert", style: canInsert ? PRIMARY_BUTTON_STYLE : DISABLED_BUTTON_STYLE, onClick: handleManualInsert, disabled: !canInsert, children: t('dialogs.insertTable.insertButton') })] })] }) }) }));
}
// ============================================================================
// HOOK
// ============================================================================
/**
 * Hook for managing Insert Table dialog state
 */
export function useInsertTableDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    return { isOpen, open, close, toggle };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create a default TableConfig
 */
export function createDefaultTableConfig(rows = 3, columns = 3) {
    return { rows, columns };
}
/**
 * Validate TableConfig
 */
export function isValidTableConfig(config, maxRows = 100, maxColumns = 20) {
    return (config.rows >= 1 &&
        config.rows <= maxRows &&
        config.columns >= 1 &&
        config.columns <= maxColumns);
}
/**
 * Clamp TableConfig to valid range
 */
export function clampTableConfig(config, maxRows = 100, maxColumns = 20) {
    return {
        rows: Math.min(Math.max(1, config.rows), maxRows),
        columns: Math.min(Math.max(1, config.columns), maxColumns),
    };
}
/**
 * Format table dimensions for display
 */
export function formatTableDimensions(config) {
    return `${config.columns} x ${config.rows}`;
}
/**
 * Get common table presets
 */
export function getTablePresets() {
    return [
        { label: '2 x 2', config: { rows: 2, columns: 2 } },
        { label: '3 x 3', config: { rows: 3, columns: 3 } },
        { label: '4 x 4', config: { rows: 4, columns: 4 } },
        { label: '2 x 4', config: { rows: 2, columns: 4 } },
        { label: '4 x 2', config: { rows: 4, columns: 2 } },
        { label: '5 x 5', config: { rows: 5, columns: 5 } },
    ];
}
// ============================================================================
// EXPORTS
// ============================================================================
export default InsertTableDialog;
//# sourceMappingURL=InsertTableDialog.js.map