var _a;
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog } from '../ui/Dialog';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const APP_VERSION = (_a = globalThis.__APP_VERSION__) !== null && _a !== void 0 ? _a : 'dev';
const bodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
};
const logoWrap = {
    width: 56,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
const productTitleStyle = {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
    color: 'var(--doc-text)',
    letterSpacing: '-0.01em',
};
const taglineStyle = {
    margin: 0,
    fontSize: 13,
    color: 'var(--doc-text-muted)',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 380,
};
const factsStyle = {
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
    rowGap: 6,
    columnGap: 16,
    marginTop: 4,
    fontSize: 13,
    width: '100%',
    alignItems: 'baseline',
};
const dtStyle = {
    color: 'var(--doc-text-muted)',
};
const ddStyle = {
    margin: 0,
    color: 'var(--doc-text)',
};
const copyrightStyle = {
    margin: 0,
    fontSize: 11,
    color: 'var(--doc-text-muted)',
    textAlign: 'center',
    marginTop: 4,
};
const primaryBtnStyle = {
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid var(--doc-primary)',
    background: 'var(--doc-primary)',
    color: 'white',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background var(--doc-anim-fast)',
};
const linkStyle = {
    color: 'var(--doc-primary)',
    textDecoration: 'none',
};
/**
 * Canonical Casual Editor mark — identical artwork to
 * examples/vite/public/logo.svg + favicon.svg so the title-bar logo,
 * favicon, About dialog, and README header all render the same
 * recognisable square. Blue rounded background carries through both
 * light and dark mode without a harsh white wrapper that disappears
 * (light) or glares (dark).
 */
function CasualEditorLogo({ size = 56 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 64 64", fill: "none", xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-label": "Casual Editor", children: [_jsx("rect", { width: "64", height: "64", rx: "14", fill: "#1a73e8" }), _jsx("path", { d: "M18 14 H42 L48 20 V50 H18 Z", fill: "#ffffff" }), _jsx("path", { d: "M42 14 L48 20 H42 Z", fill: "#1557b0" }), _jsx("rect", { x: "22", y: "26", width: "22", height: "2.5", rx: "1.25", fill: "#1a73e8", opacity: "0.85" }), _jsx("rect", { x: "22", y: "33", width: "18", height: "2.5", rx: "1.25", fill: "#1a73e8", opacity: "0.6" }), _jsx("rect", { x: "22", y: "40", width: "22", height: "2.5", rx: "1.25", fill: "#1a73e8", opacity: "0.85" }), _jsx("rect", { x: "22", y: "47", width: "12", height: "2.5", rx: "1.25", fill: "#1a73e8", opacity: "0.6" })] }));
}
export function AboutDialog({ isOpen, onClose, appName = 'Casual Editor', sourceUrl = 'https://github.com/CasualOffice/docs', homepageUrl = 'https://docs.casualoffice.org/', }) {
    const year = new Date().getFullYear();
    return (_jsx(Dialog, { isOpen: isOpen, onClose: onClose, title: `About ${appName}`, testId: "about-dialog", width: 520, footer: _jsx("button", { type: "button", style: primaryBtnStyle, onClick: onClose, "data-testid": "about-close", children: "Close" }), children: _jsxs("div", { style: bodyStyle, children: [_jsx("div", { style: logoWrap, children: _jsx(CasualEditorLogo, {}) }), _jsx("h3", { style: productTitleStyle, children: appName }), _jsxs("p", { style: taglineStyle, children: ["A casual, real-time collaborative ", _jsx("code", { children: ".docx" }), " editor.", _jsx("br", {}), "Open it.", ' ', _jsx("a", { href: homepageUrl, target: "_blank", rel: "noreferrer noopener", style: linkStyle, children: "Try the live demo" }), "."] }), _jsxs("dl", { style: factsStyle, children: [_jsx("dt", { style: dtStyle, children: "Version" }), _jsx("dd", { style: ddStyle, "data-testid": "about-version", children: APP_VERSION }), _jsx("dt", { style: dtStyle, children: "Source" }), _jsx("dd", { style: ddStyle, children: _jsx("a", { href: sourceUrl, target: "_blank", rel: "noreferrer noopener", style: linkStyle, children: sourceUrl.replace(/^https?:\/\//, '') }) }), _jsx("dt", { style: dtStyle, children: "Engine" }), _jsxs("dd", { style: ddStyle, children: ["Built on", ' ', _jsx("a", { href: "https://github.com/eigenpal/docx-editor", target: "_blank", rel: "noreferrer noopener", style: linkStyle, children: "eigenpal/docx-editor" }), ' ', "(MIT)"] }), _jsx("dt", { style: dtStyle, children: "License" }), _jsx("dd", { style: ddStyle, children: "Apache-2.0" })] }), _jsxs("p", { style: copyrightStyle, children: ["\u00A9 ", year, " Casual Office. Released under the Apache-2.0 license."] })] }) }));
}
//# sourceMappingURL=AboutDialog.js.map