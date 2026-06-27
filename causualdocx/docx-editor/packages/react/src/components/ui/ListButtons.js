import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * List Buttons Component
 *
 * A component for list formatting controls in the DOCX editor:
 * - Bullet list button
 * - Numbered list button
 * - Toggles list on/off for selection
 * - Indent/outdent for list levels
 */
import { useState, useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { useTranslation } from '../../i18n';
// ============================================================================
// STYLES
// ============================================================================
const CONTAINER_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
};
const BUTTON_GROUP_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
};
const BUTTON_STYLE = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: '4px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color var(--doc-anim-fast)',
    color: 'var(--doc-text-muted)',
};
const BUTTON_HOVER_STYLE = Object.assign(Object.assign({}, BUTTON_STYLE), { backgroundColor: 'var(--doc-bg-hover)' });
const BUTTON_ACTIVE_STYLE = Object.assign(Object.assign({}, BUTTON_STYLE), { backgroundColor: 'var(--doc-primary-light)', color: 'var(--doc-primary)' });
const BUTTON_DISABLED_STYLE = Object.assign(Object.assign({}, BUTTON_STYLE), { cursor: 'default', opacity: 0.38 });
const COMPACT_BUTTON_STYLE = {
    width: '28px',
    height: '28px',
    padding: '2px',
};
const SEPARATOR_STYLE = {
    width: '1px',
    height: '20px',
    backgroundColor: 'var(--doc-border)',
    margin: '0 6px',
};
// ============================================================================
// ICON SIZE CONSTANT
// ============================================================================
const ICON_SIZE = 20;
// ============================================================================
// LIST BUTTON COMPONENT
// ============================================================================
/**
 * Individual list button
 */
export function ListButton({ active = false, disabled = false, title, onClick, children, className, style, }) {
    const [isHovered, setIsHovered] = useState(false);
    const buttonStyle = Object.assign(Object.assign({}, (disabled
        ? BUTTON_DISABLED_STYLE
        : active
            ? BUTTON_ACTIVE_STYLE
            : isHovered
                ? BUTTON_HOVER_STYLE
                : BUTTON_STYLE)), style);
    // Prevent mousedown from stealing focus/selection from the editor
    const handleMouseDown = (e) => {
        e.preventDefault();
    };
    return (_jsx("button", { type: "button", className: `docx-list-button ${active ? 'docx-list-button-active' : ''} ${disabled ? 'docx-list-button-disabled' : ''} ${className || ''}`, style: buttonStyle, onMouseDown: handleMouseDown, onClick: disabled ? undefined : onClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), disabled: disabled, title: title, "aria-label": title, "aria-pressed": active, role: "button", children: children }));
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * List buttons component for bullet/numbered list controls
 */
export function ListButtons({ listState, onBulletList, onNumberedList, onIndent, onOutdent, disabled = false, className, style, showIndentButtons = true, compact = false, hasIndent = false, }) {
    var _a;
    const { t } = useTranslation();
    /**
     * Get button style with compact option
     */
    const getButtonStyle = useCallback(() => (compact ? Object.assign({}, COMPACT_BUTTON_STYLE) : {}), [compact]);
    const isBulletList = (listState === null || listState === void 0 ? void 0 : listState.type) === 'bullet';
    const isNumberedList = (listState === null || listState === void 0 ? void 0 : listState.type) === 'numbered';
    const isInList = (listState === null || listState === void 0 ? void 0 : listState.isInList) || isBulletList || isNumberedList;
    // Can outdent if: in a list with level > 0, OR has paragraph indentation
    const canOutdent = (isInList && ((_a = listState === null || listState === void 0 ? void 0 : listState.level) !== null && _a !== void 0 ? _a : 0) > 0) || hasIndent;
    return (_jsxs("div", { className: `docx-list-buttons ${className || ''}`, style: Object.assign(Object.assign({}, CONTAINER_STYLE), style), role: "group", "aria-label": t('lists.ariaLabel'), children: [_jsxs("div", { style: BUTTON_GROUP_STYLE, role: "group", "aria-label": t('lists.typeAriaLabel'), children: [_jsx(ListButton, { active: isBulletList, disabled: disabled, title: `${t('lists.bulletList')} (⌘⇧8)`, onClick: onBulletList, style: getButtonStyle(), children: _jsx(MaterialSymbol, { name: "format_list_bulleted", size: ICON_SIZE }) }), _jsx(ListButton, { active: isNumberedList, disabled: disabled, title: `${t('lists.numberedList')} (⌘⇧7)`, onClick: onNumberedList, style: getButtonStyle(), children: _jsx(MaterialSymbol, { name: "format_list_numbered", size: ICON_SIZE }) })] }), showIndentButtons && (_jsxs(_Fragment, { children: [_jsx("div", { style: SEPARATOR_STYLE, role: "separator" }), _jsxs("div", { style: BUTTON_GROUP_STYLE, role: "group", "aria-label": t('lists.indentationAriaLabel'), children: [_jsx(ListButton, { active: false, disabled: disabled || !canOutdent, title: `${t('lists.decreaseIndent')} (⌘[)`, onClick: onOutdent, style: getButtonStyle(), children: _jsx(MaterialSymbol, { name: "format_indent_decrease", size: ICON_SIZE }) }), _jsx(ListButton, { active: false, disabled: disabled, title: `${t('lists.increaseIndent')} (⌘])`, onClick: onIndent, style: getButtonStyle(), children: _jsx(MaterialSymbol, { name: "format_indent_increase", size: ICON_SIZE }) })] })] }))] }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Create a default list state (not in a list)
 */
export function createDefaultListState() {
    return {
        type: 'none',
        level: 0,
        isInList: false,
    };
}
/**
 * Create a bullet list state
 */
export function createBulletListState(level = 0, numId) {
    return {
        type: 'bullet',
        level,
        isInList: true,
        numId,
    };
}
/**
 * Create a numbered list state
 */
export function createNumberedListState(level = 0, numId) {
    return {
        type: 'numbered',
        level,
        isInList: true,
        numId,
    };
}
/**
 * Check if a list state represents a bullet list
 */
export function isBulletListState(state) {
    return (state === null || state === void 0 ? void 0 : state.type) === 'bullet';
}
/**
 * Check if a list state represents a numbered list
 */
export function isNumberedListState(state) {
    return (state === null || state === void 0 ? void 0 : state.type) === 'numbered';
}
/**
 * Check if a list state represents any list
 */
export function isAnyListState(state) {
    return (state === null || state === void 0 ? void 0 : state.isInList) === true;
}
/**
 * Get the next indent level (max 8)
 */
export function getNextIndentLevel(currentLevel) {
    return Math.min(currentLevel + 1, 8);
}
/**
 * Get the previous indent level (min 0)
 */
export function getPreviousIndentLevel(currentLevel) {
    return Math.max(currentLevel - 1, 0);
}
/**
 * Toggle between list types
 */
export function toggleListType(state, targetType) {
    // If already that type, remove list
    if ((state === null || state === void 0 ? void 0 : state.type) === targetType) {
        return createDefaultListState();
    }
    // Otherwise, set to the target type (preserving level if coming from another list)
    const level = (state === null || state === void 0 ? void 0 : state.isInList) ? state.level : 0;
    if (targetType === 'bullet') {
        return createBulletListState(level);
    }
    else if (targetType === 'numbered') {
        return createNumberedListState(level);
    }
    else {
        return createDefaultListState();
    }
}
/**
 * Get CSS for list indent
 */
export function getListIndentCss(level) {
    const baseIndent = 36; // ~0.5 inch per level
    return {
        marginLeft: `${baseIndent * (level + 1)}px`,
        textIndent: `-${baseIndent * 0.5}px`,
    };
}
/**
 * Get default bullet character for a level
 */
export function getDefaultBulletForLevel(level) {
    const bullets = ['•', '○', '▪', '•', '○', '▪', '•', '○', '▪'];
    return bullets[level % bullets.length];
}
/**
 * Get default number format for a level
 */
export function getDefaultNumberFormatForLevel(level) {
    const formats = [
        'decimal',
        'lowerLetter',
        'lowerRoman',
        'decimal',
        'lowerLetter',
        'lowerRoman',
        'decimal',
        'lowerLetter',
        'lowerRoman',
    ];
    return formats[level % formats.length];
}
/**
 * Handle keyboard shortcut for list operations
 * Returns the action to perform, or undefined if no match
 */
export function handleListShortcut(event) {
    // Tab for indent, Shift+Tab for outdent
    if (event.key === 'Tab') {
        if (event.shiftKey) {
            return 'outdent';
        }
        return 'indent';
    }
    // Check for Ctrl/Cmd shortcuts (not commonly used for lists, but some editors support them)
    if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey && event.key.toLowerCase() === 'l') {
            return 'bullet';
        }
        // Note: Ctrl+Shift+L is often bullet in Word-like editors
    }
    return undefined;
}
// ============================================================================
// EXPORTS
// ============================================================================
export default ListButtons;
//# sourceMappingURL=ListButtons.js.map