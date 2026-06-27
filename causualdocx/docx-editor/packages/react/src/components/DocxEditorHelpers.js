import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * DocxEditor Helper Components
 *
 * Small presentational components used by DocxEditor for
 * loading, placeholder, and error states.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
// ============================================================================
// HELPER COMPONENTS
// ============================================================================
/**
 * Default loading indicator. Honest phase labels + elapsed timer so the
 * user can tell whether a parse is mid-flight or wedged. Phases are
 * time-based heuristics (we don't currently emit progress from the
 * parser); the labels switch as time passes so it never looks frozen.
 */
export function DefaultLoadingIndicator() {
    const { t } = useTranslation();
    const [elapsedMs, setElapsedMs] = useState(0);
    useEffect(() => {
        const startedAt = Date.now();
        const i = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
        return () => window.clearInterval(i);
    }, []);
    // Phase labels are time-based. They roughly mirror what the parser
    // actually does — reading bytes is fast, schema build is the bulk, then
    // the layout-painter paint is the last leg.
    let phase = 'Reading document…';
    if (elapsedMs > 600)
        phase = 'Parsing…';
    if (elapsedMs > 2200)
        phase = 'Building layout…';
    if (elapsedMs > 6000)
        phase = 'Still working — large document…';
    const showTimer = elapsedMs >= 1500;
    const seconds = (elapsedMs / 1000).toFixed(1);
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px',
            color: 'var(--doc-text-muted)',
        }, role: "status", "aria-live": "polite", "aria-label": `${t('errors.loadingDocument')} — ${phase}`, "data-testid": "loading-indicator", children: [_jsx("div", { style: {
                    width: '36px',
                    height: '36px',
                    border: '3px solid var(--doc-border)',
                    borderTopColor: 'var(--doc-primary)',
                    borderRadius: '50%',
                    animation: 'docx-spin 0.8s linear infinite',
                } }), _jsx("style", { children: `
          @keyframes docx-spin {
            to { transform: rotate(360deg); }
          }
        ` }), _jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: t('errors.loadingDocument') }), _jsx("div", { style: { fontSize: '12px', color: 'var(--doc-text-on-surface-muted, #6b7280)' }, children: phase }), showTimer && (_jsxs("div", { style: {
                    fontSize: '11px',
                    color: 'var(--doc-text-on-surface-muted, #9ca3af)',
                    fontVariantNumeric: 'tabular-nums',
                }, children: [seconds, "s elapsed"] }))] }));
}
/**
 * Default placeholder
 */
export function DefaultPlaceholder() {
    const { t } = useTranslation();
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--doc-text-placeholder)',
        }, children: [_jsxs("svg", { width: "64", height: "64", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" })] }), _jsx("div", { style: { marginTop: '16px' }, children: t('errors.noDocumentLoaded') })] }));
}
/**
 * Parse error display
 */
export function ParseError({ message }) {
    const { t } = useTranslation();
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '20px',
            textAlign: 'center',
        }, children: [_jsx("div", { style: { color: 'var(--doc-error)', marginBottom: '16px' }, children: _jsxs("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16v.01" })] }) }), _jsx("h3", { style: { color: 'var(--doc-error)', marginBottom: '8px' }, children: t('errors.failedToLoad') }), _jsx("p", { style: { color: 'var(--doc-text-muted)', maxWidth: '400px' }, children: message })] }));
}
//# sourceMappingURL=DocxEditorHelpers.js.map