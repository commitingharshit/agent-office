import { jsx as _jsx } from "react/jsx-runtime";
/**
 * TableBorderColorPicker - Wrapper around ColorPicker for table border colors.
 *
 * Translates ColorPicker's ColorValue output to the TableAction format
 * expected by the toolbar's table action handler.
 */
import { useCallback } from 'react';
import { ColorPicker } from './ColorPicker';
import { useTranslation } from '../../i18n';
export function TableBorderColorPicker({ onAction, disabled = false, theme, value, }) {
    const { t } = useTranslation();
    const handleChange = useCallback((color) => {
        if (typeof color === 'string') {
            onAction({ type: 'borderColor', color: color.replace(/^#/, '') });
        }
        else if (color.rgb) {
            onAction({ type: 'borderColor', color: color.rgb.replace(/^#/, '') });
        }
        else if (color.auto) {
            onAction({ type: 'borderColor', color: '000000' });
        }
    }, [onAction]);
    return (_jsx(ColorPicker, { mode: "border", value: value, onChange: handleChange, theme: theme, disabled: disabled, title: t('table.borderColor') }));
}
export default TableBorderColorPicker;
//# sourceMappingURL=TableBorderColorPicker.js.map