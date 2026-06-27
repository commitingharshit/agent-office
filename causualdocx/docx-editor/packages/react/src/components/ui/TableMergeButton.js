import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TableMergeButton - Toggle button for merge/split cells
 */
import { useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';
export function TableMergeButton({ onAction, disabled = false, canMerge = false, canSplit = false, }) {
    const { t } = useTranslation();
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    const handleMerge = useCallback(() => {
        if (canMerge)
            onAction('mergeCells');
    }, [onAction, canMerge]);
    const handleSplit = useCallback(() => {
        if (canSplit)
            onAction('splitCell');
    }, [onAction, canSplit]);
    const mergeButton = (_jsx(Tooltip, { content: t('table.mergeCells'), children: _jsx(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', (disabled || !canMerge) && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: handleMerge, disabled: disabled || !canMerge, "aria-label": t('table.mergeCells'), "data-testid": "toolbar-table-merge", children: _jsx(MaterialSymbol, { name: "call_merge", size: 20 }) }) }));
    const splitButton = (_jsx(Tooltip, { content: t('table.splitCell'), children: _jsx(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', (disabled || !canSplit) && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: handleSplit, disabled: disabled || !canSplit, "aria-label": t('table.splitCell'), "data-testid": "toolbar-table-split", children: _jsx(MaterialSymbol, { name: "call_split", size: 20 }) }) }));
    return (_jsxs(_Fragment, { children: [mergeButton, splitButton] }));
}
export default TableMergeButton;
//# sourceMappingURL=TableMergeButton.js.map