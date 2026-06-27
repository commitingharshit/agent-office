import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TableInsertButtons - 4 icon buttons for row/column insertion
 *
 * Insert row above, insert row below, insert column left, insert column right.
 */
import { useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';
const INSERT_ACTIONS = [
    {
        action: 'addRowAbove',
        icon: 'keyboard_arrow_up',
        labelKey: 'table.insertRowAbove',
        testId: 'toolbar-table-add-row-above',
    },
    {
        action: 'addRowBelow',
        icon: 'keyboard_arrow_down',
        labelKey: 'table.insertRowBelow',
        testId: 'toolbar-table-add-row-below',
    },
    {
        action: 'addColumnLeft',
        icon: 'keyboard_arrow_left',
        labelKey: 'table.insertColumnLeft',
        testId: 'toolbar-table-add-col-left',
    },
    {
        action: 'addColumnRight',
        icon: 'keyboard_arrow_right',
        labelKey: 'table.insertColumnRight',
        testId: 'toolbar-table-add-col-right',
    },
];
export function TableInsertButtons({ onAction, disabled = false }) {
    const { t } = useTranslation();
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    return (_jsx(_Fragment, { children: INSERT_ACTIONS.map(({ action, icon, labelKey, testId }) => {
            const label = t(labelKey);
            return (_jsx(Tooltip, { content: label, children: _jsx(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: () => !disabled && onAction(action), disabled: disabled, "aria-label": label, "data-testid": testId, children: _jsx(MaterialSymbol, { name: icon, size: 20 }) }) }, typeof action === 'string' ? action : action.type));
        }) }));
}
export default TableInsertButtons;
//# sourceMappingURL=TableInsertButtons.js.map