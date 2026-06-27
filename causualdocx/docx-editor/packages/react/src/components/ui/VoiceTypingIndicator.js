import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MaterialSymbol } from './Icons';
import { useTranslation } from '../../i18n';
const wrapperStyle = {
    position: 'fixed',
    top: 80,
    right: 24,
    zIndex: 6000,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: 'var(--doc-surface)',
    border: '1px solid var(--doc-border)',
    borderRadius: 999,
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.16), 0 1px 2px rgba(15, 23, 42, 0.08)',
    maxWidth: 320,
    pointerEvents: 'auto',
};
const micPulseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--doc-error, #c5221f)',
    color: 'white',
    // Pulse animation — defined inline via a keyframes-injected style
    // element below to avoid adding a new global CSS rule.
    animation: 'docx-voice-typing-pulse 1.2s ease-in-out infinite',
};
const interimStyle = {
    fontSize: 13,
    color: 'var(--doc-text-on-surface-muted)',
    fontStyle: 'italic',
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};
const stopButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: 'none',
    background: 'transparent',
    borderRadius: '50%',
    cursor: 'pointer',
    color: 'var(--doc-text-on-surface-muted)',
};
// One-shot stylesheet injector for the pulse keyframes. Idempotent.
function injectKeyframes() {
    if (typeof document === 'undefined')
        return;
    if (document.getElementById('docx-voice-typing-keyframes'))
        return;
    const style = document.createElement('style');
    style.id = 'docx-voice-typing-keyframes';
    style.textContent = `
    @keyframes docx-voice-typing-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(197, 34, 31, 0.5); }
      50%      { box-shadow: 0 0 0 8px rgba(197, 34, 31, 0); }
    }
  `;
    document.head.appendChild(style);
}
export function VoiceTypingIndicator({ isListening, interimText, error, onStop, }) {
    const { t } = useTranslation();
    injectKeyframes();
    if (!isListening && !error)
        return null;
    return (_jsxs("div", { style: wrapperStyle, role: "status", "aria-live": "polite", "data-testid": "voice-typing-indicator", children: [_jsx("span", { style: micPulseStyle, "aria-hidden": "true", children: _jsx(MaterialSymbol, { name: "mic", size: 16 }) }), _jsx("span", { style: interimStyle, "aria-label": t('voiceTyping.listening'), children: error ? t('voiceTyping.error', { error }) : interimText || t('voiceTyping.listeningHint') }), _jsx("button", { type: "button", onClick: onStop, style: stopButtonStyle, "aria-label": t('voiceTyping.stop'), "data-testid": "voice-typing-stop", children: _jsx(MaterialSymbol, { name: "close", size: 18 }) })] }));
}
export default VoiceTypingIndicator;
//# sourceMappingURL=VoiceTypingIndicator.js.map