import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dialog — the shared shell for every modal in the editor.
 *
 * Background: 31 dialog components in `components/dialogs/` each rolled
 * their own backdrop overlay, header, footer, button row, and motion.
 * Result: inconsistent close-X placement, different padding rhythms,
 * mismatched button hierarchies, and absent or jarring entry motion.
 * This shell unifies all of that so callers only describe their own
 * body and action slots.
 *
 * Premium aesthetic pass — same motion language as the command palette
 * and right-dock panel:
 *   - Backdrop: slate-tinted scrim + 8 px blur + 140 % saturate so the
 *     editor stays perceptible behind the dialog (focuses, doesn't
 *     blackout).
 *   - Shell: 14 px corner radius, three-layer shadow (ambient + edge +
 *     landing), --doc-border-light hairline.
 *   - Entry motion: 200 ms cubic-bezier(0.16, 1, 0.3, 1) scale-from-
 *     96 % + 6 px slide-down. Overlay fades in 180 ms.
 *   - Header: optional leading icon slot, title in -0.005em
 *     letterspacing, close-X as a stroked SVG with 6 px radius soft
 *     hover background.
 *   - Footer: optional helper text on the left, action button row on
 *     the right. Buttons are slot children — the caller controls
 *     hierarchy (typically Cancel/secondary, then Primary).
 *
 * Behavior:
 *   - Esc closes
 *   - Click on the backdrop (outside the shell) closes — disabled when
 *     `dismissOnBackdrop={false}` (use this for any in-flight async
 *     operation the user shouldn't be able to interrupt)
 *   - FocusTrap keeps Tab cycling inside the dialog while open
 *
 * Migration: existing dialogs convert one at a time. The shell is
 * additive — older dialogs that haven't migrated still work.
 */
import { useEffect, useState } from 'react';
import { FocusTrap } from './FocusTrap';
const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.32)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '14vh',
    paddingLeft: 16,
    paddingRight: 16,
    zIndex: 10000,
    animation: 'docDialogOverlayIn var(--doc-anim-base) both',
};
const shellStyle = (width) => ({
    width,
    maxWidth: '92vw',
    maxHeight: '78vh',
    background: 'var(--doc-surface, white)',
    color: 'var(--doc-text)',
    borderRadius: 14,
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.08), 0 24px 64px rgba(15, 23, 42, 0.18)',
    border: '1px solid var(--doc-border-light)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'docDialogShellIn var(--doc-anim-base) both',
});
const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 20px',
    borderBottom: '1px solid var(--doc-border-light)',
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: '-0.005em',
    flexShrink: 0,
};
const titleStyle = {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: 'var(--doc-text)',
};
const iconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'var(--doc-text-muted)',
    flexShrink: 0,
};
const closeBtnStyle = (hover) => ({
    border: 'none',
    background: hover ? 'var(--doc-bg-hover)' : 'transparent',
    color: hover ? 'var(--doc-text)' : 'var(--doc-text-muted)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 6,
    marginRight: -6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    flexShrink: 0,
    transition: 'background 80ms cubic-bezier(0.4, 0, 0.2, 1), color 80ms cubic-bezier(0.4, 0, 0.2, 1)',
});
const bodyStyle = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '18px 20px',
    fontSize: 14,
    lineHeight: 1.55,
};
const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px',
    borderTop: '1px solid var(--doc-border-light)',
    flexShrink: 0,
    background: 'var(--doc-surface-muted)',
};
const helperStyle = {
    flex: 1,
    color: 'var(--doc-text-muted)',
    fontSize: 12.5,
    lineHeight: 1.4,
};
export function Dialog({ isOpen, onClose, title, icon, width = 520, children, footer, helper, dismissOnBackdrop = true, dismissOnEscape = true, hideCloseButton = false, ariaLabel, testId, }) {
    const [closeHover, setCloseHover] = useState(false);
    useEffect(() => {
        if (!isOpen || !dismissOnEscape)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, dismissOnEscape, onClose]);
    if (!isOpen)
        return null;
    return (_jsxs(FocusTrap, { children: [_jsx("style", { children: `
        @keyframes docDialogOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes docDialogShellIn {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      ` }), _jsx("div", { style: overlayStyle, onMouseDown: (e) => {
                    if (dismissOnBackdrop && e.target === e.currentTarget)
                        onClose();
                }, role: "dialog", "aria-modal": "true", "aria-label": ariaLabel !== null && ariaLabel !== void 0 ? ariaLabel : (typeof title === 'string' ? title : 'Dialog'), "data-testid": testId, children: _jsxs("div", { style: shellStyle(width), onMouseDown: (e) => e.stopPropagation(), children: [_jsxs("header", { style: headerStyle, children: [icon && (_jsx("span", { style: iconStyle, "aria-hidden": "true", children: icon })), _jsx("span", { style: titleStyle, children: title }), !hideCloseButton && (_jsx("button", { type: "button", style: closeBtnStyle(closeHover), onClick: onClose, onMouseEnter: () => setCloseHover(true), onMouseLeave: () => setCloseHover(false), onFocus: () => setCloseHover(true), onBlur: () => setCloseHover(false), "aria-label": "Close dialog", "data-testid": testId ? `${testId}-close` : undefined, children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M18 6L6 18" }), _jsx("path", { d: "M6 6l12 12" })] }) }))] }), _jsx("div", { style: bodyStyle, children: children }), (footer || helper) && (_jsxs("footer", { style: footerStyle, children: [helper && _jsx("span", { style: helperStyle, children: helper }), !helper && _jsx("span", { style: { flex: 1 } }), footer] }))] }) })] }));
}
export default Dialog;
//# sourceMappingURL=Dialog.js.map