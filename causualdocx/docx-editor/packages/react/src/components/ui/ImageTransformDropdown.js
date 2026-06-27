import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Image Transform Dropdown — thin wrapper around IconGridDropdown.
 */
import { IconGridDropdown } from './IconGridDropdown';
import { useTranslation } from '../../i18n';
const TRANSFORM_OPTIONS = [
    { value: 'rotateCW', labelKey: 'imageTransform.rotateClockwise', iconName: 'rotate_right' },
    {
        value: 'rotateCCW',
        labelKey: 'imageTransform.rotateCounterClockwise',
        iconName: 'rotate_left',
    },
    { value: 'flipH', labelKey: 'imageTransform.flipHorizontal', iconName: 'swap_horiz' },
    { value: 'flipV', labelKey: 'imageTransform.flipVertical', iconName: 'swap_vert' },
];
export function ImageTransformDropdown({ onTransform, disabled = false, }) {
    const { t } = useTranslation();
    const translatedOptions = TRANSFORM_OPTIONS.map((opt) => (Object.assign(Object.assign({}, opt), { label: t(opt.labelKey) })));
    return (_jsx(IconGridDropdown, { options: translatedOptions, triggerIcon: "rotate_right", tooltipContent: t('imageTransform.tooltip'), onSelect: onTransform, disabled: disabled, testId: "toolbar-image-transform" }));
}
//# sourceMappingURL=ImageTransformDropdown.js.map