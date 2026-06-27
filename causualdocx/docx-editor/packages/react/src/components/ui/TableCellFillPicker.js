import { jsx as _jsx } from "react/jsx-runtime";
/**
 * TableCellFillPicker - Wrapper around ColorPicker for table cell fill/shading.
 *
 * Translates ColorPicker's output to the TableAction format
 * expected by the toolbar's table action handler.
 */
import { useCallback } from 'react';
import { ColorPicker } from './ColorPicker';
import { useTranslation } from '../../i18n';
export function TableCellFillPicker({ onAction, disabled = false, theme, value, }) {
    const { t } = useTranslation();
    const handleChange = useCallback((color) => {
        // highlight mode emits hex strings or 'none'
        if (typeof color === 'string') {
            if (color === 'none') {
                onAction({ type: 'cellFillColor', color: null });
            }
            else {
                onAction({ type: 'cellFillColor', color: color.replace(/^#/, '') });
            }
        }
    }, [onAction]);
    return (_jsx(ColorPicker, { mode: "highlight", value: value, onChange: handleChange, theme: theme, disabled: disabled, title: t('table.cellFillColor'), icon: "format_color_fill", autoLabel: t('colorPicker.noColor') }));
}
export default TableCellFillPicker;
//# sourceMappingURL=TableCellFillPicker.js.map