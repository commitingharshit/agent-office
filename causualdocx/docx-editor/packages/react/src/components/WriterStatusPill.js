import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useWriterState } from '../lib/writer/controller';
import { MaterialSymbol } from './ui/Icons';
const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    fontSize: 11,
    borderRadius: 99,
    border: '1px solid var(--doc-border, #e0e0e0)',
    background: 'var(--doc-surface-sunken, #f1f3f4)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
};
export function WriterStatusPill({ onClick }) {
    var _a;
    const state = useWriterState();
    if (state.enabledFeatures.length === 0 && state.phase === 'idle')
        return null;
    let label = '';
    switch (state.phase) {
        case 'idle':
            label = 'Ready to load';
            break;
        case 'checking-caps':
            label = 'Checking…';
            break;
        case 'confirming':
            label = 'Confirm download';
            break;
        case 'downloading':
            label = `Loading ${Math.round(state.progress * 100)}%`;
            break;
        case 'loading':
            label = 'Loading…';
            break;
        case 'ready':
            label = state.lastInferenceMs !== null ? `Ready · ${state.lastInferenceMs} ms` : 'Ready';
            break;
        case 'busy':
            label = 'Running…';
            break;
        case 'evicting':
            label = 'Unloading…';
            break;
        case 'error':
            label = 'Paused';
            break;
    }
    return (_jsxs("button", { type: "button", style: baseStyle, onClick: onClick, "data-testid": "writer-status-pill", "aria-label": "Writing Assistant status \u2014 click to open settings", title: (_a = state.errorMessage) !== null && _a !== void 0 ? _a : label, children: [_jsx(MaterialSymbol, { name: state.phase === 'error' ? 'warning' : 'auto_awesome', size: 14 }), _jsx("span", { children: label })] }));
}
export default WriterStatusPill;
//# sourceMappingURL=WriterStatusPill.js.map