import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AgentPanel — dumb resizable right column for an agent UI.
 *
 * The shell renders the chrome (header, close button, drag-to-resize handle).
 * Children render whatever the consumer wants — message list, composer,
 * tool-call cards, settings panel, multiple tabs. We intentionally ship no
 * chat primitives: consumers use AI SDK's `useChat`, `assistant-ui`, or any
 * other framework as the panel's children.
 *
 * When uncontrolled, the drag-resize state persists to localStorage so the
 * user's chosen width survives reloads. Pass `width` + `onWidthChange` to
 * lift control into the consumer.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n';
import { MaterialSymbol } from './ui/Icons';
import { Tooltip } from './ui/Tooltip';
const STORAGE_KEY = 'eigenpal:docx-editor:agentPanelWidth';
const DEFAULT_WIDTH = 360;
const DEFAULT_MIN = 280;
const DEFAULT_MAX = 600;
export function AgentPanel({ title, icon, width: controlledWidth, defaultWidth = DEFAULT_WIDTH, minWidth = DEFAULT_MIN, maxWidth = DEFAULT_MAX, onWidthChange, onClose, children, className, closed = false, }) {
    const { t } = useTranslation();
    const isControlled = controlledWidth !== undefined;
    // Only transition `width` / `flex-basis` during open/close — never during
    // a drag, otherwise the visual width lags behind the user's pointer. We
    // track `closeTransitioning` for ~260ms after `closed` flips.
    const [closeTransitioning, setCloseTransitioning] = useState(false);
    const prevClosedRef = useRef(closed);
    useEffect(() => {
        if (prevClosedRef.current !== closed) {
            prevClosedRef.current = closed;
            setCloseTransitioning(true);
            const id = window.setTimeout(() => setCloseTransitioning(false), 260);
            return () => window.clearTimeout(id);
        }
    }, [closed]);
    const [internalWidth, setInternalWidth] = useState(() => {
        if (isControlled)
            return controlledWidth;
        if (typeof window === 'undefined')
            return defaultWidth;
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const n = Number(stored);
                if (Number.isFinite(n) && n >= minWidth && n <= maxWidth)
                    return n;
            }
        }
        catch (_a) {
            // localStorage may be blocked — fall through to default.
        }
        return defaultWidth;
    });
    const width = isControlled ? controlledWidth : internalWidth;
    // Drag state + latest props in two refs. document-level listeners read from
    // the refs, so mid-drag setState doesn't reidentify them and we keep every
    // pointermove. The latest-props ref tracks min/max/onWidthChange/etc. so the
    // listener always sees the current values without re-attaching.
    const dragStateRef = useRef(null);
    const latestPropsRef = useRef({
        minWidth,
        maxWidth,
        isControlled,
        onWidthChange,
    });
    latestPropsRef.current = { minWidth, maxWidth, isControlled, onWidthChange };
    const handlersRef = useRef(null);
    if (!handlersRef.current) {
        const move = (e) => {
            var _a;
            const drag = dragStateRef.current;
            if (!drag)
                return;
            const p = latestPropsRef.current;
            // Panel is on the right; dragging left increases width.
            const delta = drag.startX - e.clientX;
            const next = Math.min(p.maxWidth, Math.max(p.minWidth, drag.startWidth + delta));
            drag.lastWidth = next;
            if (!p.isControlled)
                setInternalWidth(next);
            (_a = p.onWidthChange) === null || _a === void 0 ? void 0 : _a.call(p, next);
        };
        const up = () => {
            const drag = dragStateRef.current;
            if (!drag)
                return;
            dragStateRef.current = null;
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            if (!latestPropsRef.current.isControlled) {
                try {
                    window.localStorage.setItem(STORAGE_KEY, String(drag.lastWidth));
                }
                catch (_a) {
                    // localStorage may be blocked — silent.
                }
            }
        };
        handlersRef.current = { move, up };
    }
    const onHandlePointerDown = useCallback((e) => {
        e.preventDefault();
        const startWidth = isControlled ? controlledWidth : internalWidth;
        dragStateRef.current = { startX: e.clientX, startWidth, lastWidth: startWidth };
        document.addEventListener('pointermove', handlersRef.current.move);
        document.addEventListener('pointerup', handlersRef.current.up);
        // controlledWidth/internalWidth read at handler-fire time; safe to ignore deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        return () => {
            const h = handlersRef.current;
            if (!h)
                return;
            document.removeEventListener('pointermove', h.move);
            document.removeEventListener('pointerup', h.up);
        };
    }, []);
    const headerTitle = title !== null && title !== void 0 ? title : t('agentPanel.defaultTitle');
    const closeLabel = t('agentPanel.close');
    return (_jsxs("div", { className: `ep-agent-panel${className ? ` ${className}` : ''}`, style: {
            // Closed: collapse to zero width but keep the children mounted so
            // chat state (messages, scroll position, draft input) survives
            // close/reopen. Transition flex/width/margin/opacity together so
            // the toolbar reflows smoothly. Drag during a transition is OK —
            // the listeners read the latest width from props each frame.
            width: closed ? 0 : width,
            flex: closed ? '0 0 0px' : `0 0 ${width}px`,
            // White floating card on the editor's `--doc-bg` canvas, matching
            // Google Docs' Gemini side panel.
            height: 'calc(100% - 16px)',
            margin: closed ? '8px 0 8px 0' : '8px 8px 8px 12px',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--doc-surface, white)',
            border: closed ? '1px solid transparent' : '1px solid #e3e3e3',
            borderRadius: 16,
            boxShadow: closed
                ? 'none'
                : '0 1px 2px rgba(60,64,67,0.05), 0 4px 12px rgba(60,64,67,0.08)',
            opacity: closed ? 0 : 1,
            pointerEvents: closed ? 'none' : 'auto',
            position: 'relative',
            boxSizing: 'border-box',
            minWidth: closed ? 0 : minWidth,
            overflow: 'hidden',
            fontFamily: "'Google Sans', 'Google Sans Text', system-ui, -apple-system, sans-serif",
            transition: closeTransitioning
                ? 'flex-basis 220ms cubic-bezier(0.4, 0, 0.2, 1), width 220ms cubic-bezier(0.4, 0, 0.2, 1), margin 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease, box-shadow 220ms ease, border-color 220ms ease'
                : 'opacity 180ms ease, box-shadow 220ms ease, border-color 220ms ease',
        }, "aria-hidden": closed, "data-testid": "agent-panel", "data-state": closed ? 'closed' : 'open', role: "complementary", "aria-label": headerTitle, children: [_jsx("div", { role: "separator", "aria-orientation": "vertical", "aria-label": t('agentPanel.resizeHandle'), onPointerDown: onHandlePointerDown, style: {
                    position: 'absolute',
                    left: -3,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    cursor: 'col-resize',
                    touchAction: 'none',
                    zIndex: 1,
                }, "data-testid": "agent-panel-resize-handle" }), _jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 16px 10px',
                    flex: '0 0 auto',
                    background: 'var(--doc-surface, white)',
                }, children: [_jsx("span", { style: { display: 'inline-flex', alignItems: 'center', color: 'var(--doc-primary)' }, children: icon !== null && icon !== void 0 ? icon : _jsx(MaterialSymbol, { name: "agent-sparkle", size: 22 }) }), _jsx("span", { style: {
                            flex: 1,
                            fontSize: 15,
                            fontWeight: 500,
                            color: 'var(--doc-text)',
                            letterSpacing: 0.1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }, children: headerTitle }), onClose && (_jsx(Tooltip, { content: closeLabel, children: _jsx("button", { type: "button", onClick: onClose, "aria-label": closeLabel, "data-testid": "agent-panel-close", style: {
                                border: 'none',
                                background: 'transparent',
                                padding: 6,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--doc-text-muted)',
                                borderRadius: 999,
                                transition: 'background var(--doc-anim-base)',
                            }, onMouseEnter: (e) => {
                                e.currentTarget.style.background =
                                    'var(--doc-bg-hover, #f1f3f4)';
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.background = 'transparent';
                            }, children: _jsx(MaterialSymbol, { name: "close", size: 18 }) }) }))] }), _jsx("div", { style: {
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }, children: children })] }));
}
//# sourceMappingURL=AgentPanel.js.map