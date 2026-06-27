import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Image Wrap Dropdown — thin wrapper around IconGridDropdown.
 */
import { IconGridDropdown } from './IconGridDropdown';
import { useTranslation } from '../../i18n';
// Mirrors Word's simplified Picture > Wrap Text dropdown — five options.
// Top-and-bottom and tight/through live in the right-click image menu where
// Word also surfaces the full set.
const WRAP_OPTIONS = [
    { value: 'inline', labelKey: 'imageWrap.inline', iconName: 'wrap_text' },
    // Square Left = image anchored on the left, text wraps on the right.
    { value: 'wrapRight', labelKey: 'imageWrap.floatLeft', iconName: 'format_image_left' },
    // Square Right = image anchored on the right, text wraps on the left.
    { value: 'wrapLeft', labelKey: 'imageWrap.floatRight', iconName: 'format_image_right' },
    { value: 'behind', labelKey: 'imageWrap.behindText', iconName: 'flip_to_back' },
    { value: 'inFront', labelKey: 'imageWrap.inFrontOfText', iconName: 'flip_to_front' },
];
function getActiveWrapValue(ctx) {
    if (ctx.displayMode === 'float' && ctx.cssFloat === 'left')
        return 'wrapRight';
    if (ctx.displayMode === 'float' && ctx.cssFloat === 'right')
        return 'wrapLeft';
    return ctx.wrapType;
}
export function ImageWrapDropdown({ imageContext, onChange, disabled = false, }) {
    const { t } = useTranslation();
    const translatedOptions = WRAP_OPTIONS.map((opt) => (Object.assign(Object.assign({}, opt), { label: t(opt.labelKey) })));
    const activeValue = getActiveWrapValue(imageContext);
    const currentOption = translatedOptions.find((o) => o.value === activeValue) || translatedOptions[0];
    return (_jsx(IconGridDropdown, { options: translatedOptions, activeValue: activeValue, triggerIcon: currentOption.iconName, tooltipContent: `Wrap: ${currentOption.label}`, onSelect: onChange, disabled: disabled, testId: "toolbar-image-wrap", showLabels: true }));
}
//# sourceMappingURL=ImageWrapDropdown.js.map