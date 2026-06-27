var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * WritingAssistantSheet — right-docked panel that exposes the on-
 * device writing assistant: per-feature toggles, device capability
 * readout, download progress, consent flow, and the model cache
 * control.
 *
 * See `docs/internal/10-writing-assistant-design.md` § 9.
 */
import { useEffect, useState } from 'react';
import { bootWriterController, dismissConsent, disableFeature, enableFeature, featureSupport, recordConsent, setAdvancedOpen, setAutoLoad, useWriterState, } from '../../lib/writer/controller';
import { FEATURES } from '../../lib/writer/registry';
import { clearCachedModels } from '../../lib/writer/storage';
import { RightDockPanel } from '../RightDockPanel';
import { MaterialSymbol } from '../ui/Icons';
// Layout (root + header + close) moved to RightDockPanel — the sheet
// now docks with the same geometry as every other right-side panel
// (chat, AI suggestion, version history). Width is the canonical
// RIGHT_PANEL_WIDTH (340) from sidebar/constants.ts; the previous
// bespoke 360 was just one more drift point.
const bodyStyle = {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
};
const sectionHeadingStyle = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    color: 'var(--doc-text-muted, #6b7280)',
    margin: '0 0 6px',
};
const introStyle = {
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    margin: 0,
};
const rowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--doc-border, #e0e0e0)',
    background: 'var(--doc-surface, white)',
};
const rowDisabledStyle = Object.assign(Object.assign({}, rowStyle), { opacity: 0.55 });
// Toggle switch geometry — matches Google Material's small switch
// (36 × 20 track, 16 px handle). Lives inline rather than a separate
// component for P1 so we keep the diff focused; promoted to
// `components/ui/Toggle.tsx` once a second consumer appears.
const toggleTrackStyle = {
    position: 'relative',
    width: 36,
    height: 20,
    borderRadius: 999,
    background: 'var(--doc-border, #d1d5db)',
    flexShrink: 0,
    marginTop: 2,
    transition: 'background-color var(--doc-anim-base)',
    cursor: 'pointer',
};
const toggleTrackOnStyle = Object.assign(Object.assign({}, toggleTrackStyle), { background: 'var(--doc-primary, #1a73e8)' });
const toggleHandleStyle = {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 1px 2px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
    transition: 'transform var(--doc-anim-base)',
};
const toggleHandleOnStyle = Object.assign(Object.assign({}, toggleHandleStyle), { transform: 'translateX(16px)' });
const visuallyHiddenStyle = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
};
const featureLabelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    fontSize: 13,
};
const featureNameStyle = {
    fontWeight: 500,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const featureMetaStyle = {
    fontSize: 11,
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
};
const subtleStyle = {
    fontSize: 11,
    color: 'var(--doc-text-muted, #6b7280)',
};
const advancedToggleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--doc-text-on-surface, #1f2937)',
    cursor: 'pointer',
    fontSize: 12,
    padding: 0,
};
const footerStyle = {
    borderTop: '1px solid var(--doc-border, #e0e0e0)',
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const statusBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    padding: '4px 8px',
    borderRadius: 99,
    background: 'var(--doc-bg-hover, #f1f3f4)',
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const consentOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9100,
};
const consentDialogStyle = {
    width: 420,
    maxWidth: '90vw',
    background: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
};
const btnRowStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
};
const secondaryBtnStyle = {
    padding: '6px 14px',
    fontSize: 13,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'transparent',
    color: 'var(--doc-text-on-surface, #1f2937)',
    borderRadius: 4,
    cursor: 'pointer',
};
const primaryBtnStyle = {
    padding: '6px 14px',
    fontSize: 13,
    border: '1px solid var(--doc-primary, #1a73e8)',
    background: 'var(--doc-primary, #1a73e8)',
    color: 'white',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const progressBarStyle = {
    height: 4,
    background: 'var(--doc-border, #e0e0e0)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
};
function progressFillStyle(progress) {
    return {
        height: '100%',
        width: `${Math.max(2, Math.min(100, progress * 100))}%`,
        background: 'var(--doc-primary, #1a73e8)',
        transition: 'width var(--doc-anim-base)',
    };
}
export function WritingAssistantSheet({ isOpen, onClose }) {
    const state = useWriterState();
    const [pendingFeature, setPendingFeature] = useState(null);
    const [busyId, setBusyId] = useState(null);
    useEffect(() => {
        if (!isOpen)
            return;
        void bootWriterController();
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const toggleFeature = (feature, checked) => __awaiter(this, void 0, void 0, function* () {
        // `busyId` is a per-row guard so the same row's checkbox doesn't
        // double-fire mid-load. We deliberately let a different row toggle
        // through — they get queued by the controller's state machine.
        if (busyId === feature.id)
            return;
        setBusyId(feature.id);
        try {
            if (checked) {
                if (!state.consented) {
                    setPendingFeature(feature.id);
                    yield enableFeature(feature.id, { skipConsentCheck: false });
                }
                else {
                    yield enableFeature(feature.id, { skipConsentCheck: true });
                }
            }
            else {
                yield disableFeature(feature.id);
            }
        }
        catch (_a) {
            // Errors surface via the state machine; nothing to render here.
        }
        finally {
            setBusyId(null);
        }
    });
    const onConsentAccept = () => __awaiter(this, void 0, void 0, function* () {
        recordConsent();
        if (pendingFeature) {
            yield enableFeature(pendingFeature, { skipConsentCheck: true });
        }
        setPendingFeature(null);
    });
    const onConsentCancel = () => {
        dismissConsent();
        setPendingFeature(null);
    };
    const footer = (_jsxs("div", { style: footerStyle, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }, children: [_jsx("input", { type: "checkbox", checked: state.autoLoad, onChange: (e) => setAutoLoad(e.target.checked), "data-testid": "writer-autoload" }), "Re-enable automatically next time"] }), _jsx("button", { type: "button", style: secondaryBtnStyle, "data-testid": "writer-clear-cache", onClick: () => void clearCachedModels(), children: "Clear cached models" })] }));
    return (_jsxs(_Fragment, { children: [_jsx(RightDockPanel, { title: "Writing Assistant", icon: _jsx(MaterialSymbol, { name: "auto_awesome", size: 16 }), onClose: onClose, testId: "writing-assistant-sheet", ariaLabel: "Writing Assistant", footer: footer, children: _jsxs("div", { style: bodyStyle, children: [_jsx("p", { style: introStyle, children: "Runs entirely in your browser. Your document is never sent to a server." }), _jsx(FeatureSection, { title: "Features", features: FEATURES.filter((f) => !f.advanced), state: state, busyId: busyId, onToggle: toggleFeature }), _jsx(AdvancedSection, { features: FEATURES.filter((f) => f.advanced), state: state, busyId: busyId, onToggle: toggleFeature }), _jsx(DeviceSection, { state: state }), _jsx(StatusSection, { state: state })] }) }), state.phase === 'confirming' && pendingFeature && (_jsx(ConsentDialog, { onAccept: onConsentAccept, onCancel: onConsentCancel }))] }));
}
function FeatureSection({ title, features, state, busyId, onToggle, }) {
    return (_jsxs("section", { children: [_jsx("p", { style: sectionHeadingStyle, children: title }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: features.map((f) => (_jsx(FeatureRow, { feature: f, state: state, busy: busyId === f.id, onToggle: (c) => onToggle(f, c) }, f.id))) })] }));
}
function AdvancedSection({ features, state, busyId, onToggle, }) {
    return (_jsxs("section", { children: [_jsxs("button", { type: "button", style: advancedToggleStyle, onClick: () => setAdvancedOpen(!state.advancedOpen), "data-testid": "writer-advanced-toggle", "aria-expanded": state.advancedOpen, children: [_jsx("span", { "aria-hidden": "true", children: state.advancedOpen ? '▾' : '▸' }), "Advanced (off by default)"] }), state.advancedOpen && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }, children: features.map((f) => (_jsx(FeatureRow, { feature: f, state: state, busy: busyId === f.id, onToggle: (c) => onToggle(f, c) }, f.id))) }))] }));
}
function FeatureRow({ feature, state, busy, onToggle, }) {
    var _a;
    const support = featureSupport(feature);
    const checked = state.enabledFeatures.includes(feature.id);
    const disabled = !support.supported || busy;
    const reason = (_a = support.reason) !== null && _a !== void 0 ? _a : '';
    return (_jsxs("label", { style: disabled ? rowDisabledStyle : rowStyle, title: !support.supported ? reason : undefined, children: [_jsx("span", { style: checked ? toggleTrackOnStyle : toggleTrackStyle, "aria-hidden": "true", children: _jsx("span", { style: checked ? toggleHandleOnStyle : toggleHandleStyle }) }), _jsx("input", { type: "checkbox", checked: checked, disabled: disabled, onChange: (e) => onToggle(e.target.checked), style: visuallyHiddenStyle, "data-testid": `writer-feature-${feature.id}`, "aria-label": feature.label }), _jsxs("span", { style: featureLabelStyle, children: [_jsx("span", { style: featureNameStyle, children: feature.label }), _jsx("span", { style: featureMetaStyle, children: feature.description }), _jsxs("span", { style: subtleStyle, children: [feature.sizeMb, " MB \u00B7 ", feature.modelIds.length, " model", feature.modelIds.length === 1 ? '' : 's', !support.supported && ` · ${reason}`] }), checked && state.phase === 'downloading' && (_jsxs("span", { style: subtleStyle, "data-testid": `writer-progress-${feature.id}`, children: ["Downloading\u2026 ", Math.round(state.progress * 100), "%"] })), checked && state.phase === 'loading' && _jsx("span", { style: subtleStyle, children: "Loading model\u2026" })] })] }));
}
function DeviceSection({ state }) {
    const caps = state.capabilities;
    return (_jsxs("section", { children: [_jsx("p", { style: sectionHeadingStyle, children: "Your device" }), !caps && _jsx("p", { style: subtleStyle, children: "Detecting capabilities\u2026" }), caps && (_jsxs("ul", { style: { listStyle: 'none', padding: 0, margin: 0, fontSize: 12, lineHeight: 1.6 }, children: [_jsxs("li", { children: [caps.webgpu ? '✓' : '·', " WebGPU", ' ', _jsx("span", { style: subtleStyle, children: caps.webgpu ? 'available' : 'unavailable' })] }), _jsxs("li", { children: [caps.wasmSimd ? '✓' : '·', " WebAssembly SIMD", ' ', _jsx("span", { style: subtleStyle, children: caps.wasmSimd ? 'available' : 'unavailable' })] }), caps.deviceMemoryGb !== null && (_jsxs("li", { children: ["\u00B7 Device memory ", _jsxs("span", { style: subtleStyle, children: [caps.deviceMemoryGb, " GB reported"] })] })), caps.storageQuotaMb !== null && caps.storageUsedMb !== null && (_jsxs("li", { children: ["\u00B7 Browser storage", ' ', _jsxs("span", { style: subtleStyle, children: [Math.round(caps.storageUsedMb), " MB used of ", Math.round(caps.storageQuotaMb), " MB"] })] })), _jsxs("li", { children: ["\u00B7 Backend ", _jsx("span", { style: subtleStyle, children: caps.recommendedBackend })] }), caps.effectiveNet !== 'unknown' && (_jsxs("li", { children: ["\u00B7 Network ", _jsx("span", { style: subtleStyle, children: caps.effectiveNet })] }))] }))] }));
}
function StatusSection({ state }) {
    return (_jsxs("section", { children: [_jsx("p", { style: sectionHeadingStyle, children: "Status" }), _jsx("span", { style: statusBadgeStyle, "data-testid": "writer-status-badge", children: renderStatusLabel(state) }), state.phase === 'downloading' && (_jsx("div", { style: progressBarStyle, "aria-label": "Download progress", children: _jsx("div", { style: progressFillStyle(state.progress) }) })), state.phase === 'error' && state.errorMessage && (_jsx("p", { style: Object.assign(Object.assign({}, subtleStyle), { marginTop: 6 }), children: state.errorMessage }))] }));
}
function renderStatusLabel(state) {
    switch (state.phase) {
        case 'idle':
            return state.enabledFeatures.length === 0 ? 'No features enabled' : 'Ready to load on demand';
        case 'checking-caps':
            return 'Checking your device…';
        case 'confirming':
            return 'Waiting for confirmation';
        case 'downloading':
            return `Downloading… ${Math.round(state.progress * 100)}%`;
        case 'loading':
            return 'Loading model…';
        case 'ready':
            return state.lastInferenceMs !== null
                ? `Ready · last call ${state.lastInferenceMs} ms`
                : 'Ready';
        case 'busy':
            return 'Running…';
        case 'evicting':
            return 'Unloading model…';
        case 'error':
            return 'Paused — see message below';
    }
}
function ConsentDialog({ onAccept, onCancel }) {
    return (_jsx("div", { style: consentOverlayStyle, role: "dialog", "aria-modal": "true", "aria-label": "Download writing assistant", children: _jsxs("div", { style: consentDialogStyle, "data-testid": "writer-consent-dialog", children: [_jsx("h2", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "Download writing assistant" }), _jsx("p", { style: { fontSize: 13, lineHeight: 1.5, marginTop: 10 }, children: "This downloads a ~95 MB model to your browser cache so the assistant can run on your device. Your document is never sent to a server." }), _jsx("p", { style: { fontSize: 12, lineHeight: 1.5, marginTop: 8, color: 'var(--doc-text-muted)' }, children: "The model is open-source (Apache-2.0)." }), _jsxs("div", { style: btnRowStyle, children: [_jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onCancel, "data-testid": "writer-consent-cancel", children: "Cancel" }), _jsx("button", { type: "button", style: primaryBtnStyle, onClick: onAccept, "data-testid": "writer-consent-accept", children: "Download and continue" })] })] }) }));
}
export default WritingAssistantSheet;
//# sourceMappingURL=WritingAssistantSheet.js.map