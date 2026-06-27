import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { submitButtonStyle, CANCEL_BUTTON_STYLE } from './cardUtils';
import { useTranslation } from '../../i18n';
const ACTIVE_INPUT_STYLE = {
    width: '100%',
    border: '1px solid #1a73e8',
    borderRadius: 20,
    outline: 'none',
    fontSize: 14,
    padding: '8px 16px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const INACTIVE_INPUT_STYLE = {
    width: '100%',
    border: '1px solid var(--doc-border, #dadce0)',
    borderRadius: 20,
    outline: 'none',
    fontSize: 14,
    padding: '8px 16px',
    fontFamily: 'inherit',
    color: 'var(--doc-text-subtle)',
    cursor: 'text',
    backgroundColor: 'var(--doc-surface, white)',
    boxSizing: 'border-box',
};
export function ReplyInput({ onSubmit }) {
    const [active, setActive] = useState(false);
    const [text, setText] = useState('');
    const { t } = useTranslation();
    if (!active) {
        return (_jsx("div", { onClick: (e) => e.stopPropagation(), style: { marginTop: 12 }, children: _jsx("input", { readOnly: true, onMouseDown: (e) => e.stopPropagation(), onClick: (e) => {
                    e.stopPropagation();
                    setActive(true);
                }, placeholder: t('comments.replyPlaceholder'), style: INACTIVE_INPUT_STYLE }) }));
    }
    const trimmed = text.trim();
    return (_jsxs("div", { onClick: (e) => e.stopPropagation(), style: { marginTop: 12 }, children: [_jsx("input", { ref: (el) => el === null || el === void 0 ? void 0 : el.focus({ preventScroll: true }), type: "text", value: text, onChange: (e) => setText(e.target.value), onMouseDown: (e) => e.stopPropagation(), onKeyDown: (e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (trimmed)
                            onSubmit(trimmed);
                        setText('');
                        setActive(false);
                    }
                    if (e.key === 'Escape') {
                        setActive(false);
                        setText('');
                    }
                }, placeholder: t('comments.replyPlaceholder'), style: ACTIVE_INPUT_STYLE }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }, children: [_jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            setActive(false);
                            setText('');
                        }, style: CANCEL_BUTTON_STYLE, children: t('common.cancel') }), _jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            if (trimmed)
                                onSubmit(trimmed);
                            setText('');
                            setActive(false);
                        }, disabled: !trimmed, style: submitButtonStyle(!!trimmed), children: t('common.reply') })] })] }));
}
//# sourceMappingURL=ReplyInput.js.map