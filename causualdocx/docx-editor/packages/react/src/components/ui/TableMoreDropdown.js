import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TableMoreDropdown - Compact dropdown for less-used table actions
 *
 * Contains: delete row/column/table, vertical alignment, header row,
 * distribute columns, auto-fit, table alignment, cell margins,
 * text direction, no-wrap, row height, table properties.
 */
import { useState, useCallback } from 'react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { MaterialSymbol } from './MaterialSymbol';
import { cn } from '../../lib/utils';
import { useFixedDropdown } from './useFixedDropdown';
import { useTranslation } from '../../i18n';
const menuItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 14px',
    fontSize: 13,
    color: 'var(--doc-text)',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
};
const separatorStyles = {
    height: 1,
    backgroundColor: 'var(--doc-border)',
    margin: '4px 0',
};
const sectionLabelStyles = {
    padding: '6px 14px 2px',
    fontSize: 11,
    color: 'var(--doc-text-muted)',
    fontWeight: 500,
};
export function TableMoreDropdown({ onAction, disabled = false, tableContext, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const close = useCallback(() => setIsOpen(false), []);
    const { containerRef, dropdownRef, dropdownStyle, handleMouseDown } = useFixedDropdown({
        isOpen,
        onClose: close,
        align: 'right',
    });
    const currentJustification = (_c = (_b = (_a = tableContext === null || tableContext === void 0 ? void 0 : tableContext.table) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.justification) !== null && _c !== void 0 ? _c : 'left';
    const handleAction = useCallback((action) => {
        onAction(action);
        setIsOpen(false);
    }, [onAction]);
    const menuItem = (id, icon, label, action, opts) => {
        const isItemDisabled = disabled || (opts === null || opts === void 0 ? void 0 : opts.itemDisabled);
        return (_jsxs("button", { type: "button", role: "menuitem", style: Object.assign(Object.assign({}, menuItemStyles), { backgroundColor: hoveredItem === id && !isItemDisabled ? 'var(--doc-bg-hover)' : 'transparent', color: isItemDisabled
                    ? 'var(--doc-text-muted)'
                    : (opts === null || opts === void 0 ? void 0 : opts.danger)
                        ? 'var(--doc-error)'
                        : 'var(--doc-text)', cursor: isItemDisabled ? 'not-allowed' : 'pointer' }), onClick: () => !isItemDisabled && handleAction(action), onMouseEnter: () => setHoveredItem(id), onMouseLeave: () => setHoveredItem(null), disabled: isItemDisabled, children: [_jsx(MaterialSymbol, { name: icon, size: 16, className: (opts === null || opts === void 0 ? void 0 : opts.danger) && !isItemDisabled ? 'text-red-600' : '' }), _jsx("span", { style: { flex: 1 }, children: label })] }, id));
    };
    const button = (_jsx(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', isOpen && 'bg-[color:var(--doc-bg-hover)]', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: () => !disabled && setIsOpen((prev) => !prev), disabled: disabled, "aria-label": t('table.moreOptions'), "aria-expanded": isOpen, "aria-haspopup": "menu", "data-testid": "toolbar-table-more", children: _jsx(MaterialSymbol, { name: "more_vert", size: 20 }) }));
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block' }, children: [!isOpen ? _jsx(Tooltip, { content: t('table.moreOptions'), children: button }) : button, isOpen && !disabled && (_jsxs("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, dropdownStyle), { backgroundColor: 'var(--doc-surface, white)', border: '1px solid var(--doc-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', padding: '4px 0', minWidth: 200, maxHeight: '70vh', overflowY: 'auto' }), role: "menu", onMouseDown: (e) => e.stopPropagation(), children: [menuItem('addRowAbove', 'add', t('table.insertRowAbove'), 'addRowAbove'), menuItem('addRowBelow', 'add', t('table.insertRowBelow'), 'addRowBelow'), menuItem('addColumnLeft', 'add', t('table.insertColumnLeft'), 'addColumnLeft'), menuItem('addColumnRight', 'add', t('table.insertColumnRight'), 'addColumnRight'), _jsx("div", { style: separatorStyles, role: "separator" }), menuItem('mergeCells', 'call_merge', t('table.mergeCells'), 'mergeCells', {
                        itemDisabled: !(tableContext === null || tableContext === void 0 ? void 0 : tableContext.hasMultiCellSelection),
                    }), menuItem('splitCell', 'call_split', t('table.splitCell'), 'splitCell', {
                        itemDisabled: !(tableContext === null || tableContext === void 0 ? void 0 : tableContext.canSplitCell),
                    }), _jsx("div", { style: separatorStyles, role: "separator" }), menuItem('deleteRow', 'delete', t('table.deleteRow'), 'deleteRow', {
                        danger: true,
                        itemDisabled: ((_d = tableContext === null || tableContext === void 0 ? void 0 : tableContext.rowCount) !== null && _d !== void 0 ? _d : 0) <= 1,
                    }), menuItem('deleteColumn', 'delete', t('table.deleteColumn'), 'deleteColumn', {
                        danger: true,
                        itemDisabled: ((_e = tableContext === null || tableContext === void 0 ? void 0 : tableContext.columnCount) !== null && _e !== void 0 ? _e : 0) <= 1,
                    }), menuItem('deleteTable', 'delete', t('table.deleteTable'), 'deleteTable', {
                        danger: true,
                    }), _jsx("div", { style: separatorStyles, role: "separator" }), _jsx("div", { style: sectionLabelStyles, children: t('tableAdvanced.verticalAlignment') }), _jsx("div", { style: { display: 'flex', gap: 4, padding: '4px 14px' }, children: ['top', 'center', 'bottom'].map((align) => {
                            const icons = {
                                top: 'vertical_align_top',
                                center: 'vertical_align_center',
                                bottom: 'vertical_align_bottom',
                            };
                            const labelKeys = {
                                top: 'tableAdvanced.top',
                                center: 'tableAdvanced.middle',
                                bottom: 'tableAdvanced.bottom',
                            };
                            const label = t(labelKeys[align]);
                            return (_jsx(Tooltip, { content: label, children: _jsx("button", { type: "button", "aria-label": label, style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 28,
                                        border: '1px solid var(--doc-border)',
                                        borderRadius: 4,
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                    }, onMouseDown: (e) => e.preventDefault(), onMouseEnter: (e) => {
                                        e.currentTarget.style.backgroundColor =
                                            'var(--doc-bg-hover)';
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }, onClick: () => handleAction({ type: 'cellVerticalAlign', align }), children: _jsx(MaterialSymbol, { name: icons[align], size: 16 }) }) }, align));
                        }) }), _jsx("div", { style: separatorStyles, role: "separator" }), _jsx("div", { style: sectionLabelStyles, children: t('tableAdvanced.tableAlignment') }), _jsx("div", { style: { display: 'flex', gap: 4, padding: '4px 14px' }, children: ['left', 'center', 'right'].map((align) => {
                            const icons = {
                                left: 'format_align_left',
                                center: 'format_align_center',
                                right: 'format_align_right',
                            };
                            const isActive = currentJustification === align;
                            const label = t({
                                left: 'tableAdvanced.alignTableLeft',
                                center: 'tableAdvanced.alignTableCenter',
                                right: 'tableAdvanced.alignTableRight',
                            }[align]);
                            return (_jsx(Tooltip, { content: label, children: _jsx("button", { type: "button", "aria-label": label, style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 28,
                                        border: '1px solid var(--doc-border)',
                                        borderRadius: 4,
                                        backgroundColor: isActive ? 'var(--doc-primary-light)' : 'transparent',
                                        borderColor: isActive ? 'var(--doc-primary)' : 'var(--doc-border)',
                                        color: isActive ? 'var(--doc-primary)' : 'var(--doc-text)',
                                        cursor: 'pointer',
                                    }, onMouseDown: (e) => e.preventDefault(), onClick: () => handleAction({ type: 'tableProperties', props: { justification: align } }), children: _jsx(MaterialSymbol, { name: icons[align], size: 16 }) }) }, align));
                        }) }), _jsx("div", { style: separatorStyles, role: "separator" }), menuItem('headerRow', (tableContext === null || tableContext === void 0 ? void 0 : tableContext.currentRowIsHeader) ? 'push_pin' : 'table_rows', (tableContext === null || tableContext === void 0 ? void 0 : tableContext.currentRowIsHeader)
                        ? `✓ ${t('tableAdvanced.toggleHeaderRow')}`
                        : t('tableAdvanced.toggleHeaderRow'), { type: 'toggleHeaderRow' }), menuItem('distributeRows', 'table_rows', t('tableAdvanced.distributeRows'), {
                        type: 'distributeRows',
                    }), menuItem('distribute', 'view_column', t('tableAdvanced.distributeColumns'), {
                        type: 'distributeColumns',
                    }), menuItem('autoFit', 'fit_width', t('tableAdvanced.autoFit'), {
                        type: 'autoFitContents',
                    }), menuItem('autoFitWindow', 'fit_width', t('tableAdvanced.autoFitWindow'), {
                        type: 'autoFitWindow',
                    }), menuItem('sortAsc', 'keyboard_arrow_up', t('tableAdvanced.sortAscending', { column: ((_f = tableContext === null || tableContext === void 0 ? void 0 : tableContext.columnIndex) !== null && _f !== void 0 ? _f : 0) + 1 }), { type: 'sortTable', direction: 'asc' }), menuItem('sortDesc', 'keyboard_arrow_down', t('tableAdvanced.sortDescending', { column: ((_g = tableContext === null || tableContext === void 0 ? void 0 : tableContext.columnIndex) !== null && _g !== void 0 ? _g : 0) + 1 }), { type: 'sortTable', direction: 'desc' }), menuItem('noWrap', 'wrap_text', t('tableAdvanced.toggleNoWrap'), {
                        type: 'toggleNoWrap',
                    }), _jsx("div", { style: separatorStyles, role: "separator" }), menuItem('properties', 'settings', t('tableAdvanced.tableProperties'), {
                        type: 'openTableProperties',
                    })] }))] }));
}
export default TableMoreDropdown;
//# sourceMappingURL=TableMoreDropdown.js.map