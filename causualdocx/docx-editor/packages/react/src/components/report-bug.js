/**
 * Open the GitHub bug template prefilled with environment info the user
 * shouldn't have to dig up (browser, viewport, URL). The structured form
 * lives at `.github/ISSUE_TEMPLATE/bug.yml`; GitHub maps query params to
 * matching form fields by `id`.
 */
export function openBugReport(repoUrl = 'https://github.com/CasualOffice/docs') {
    const url = new URL(`${repoUrl.replace(/\/$/, '')}/issues/new`);
    url.searchParams.set('template', 'bug.yml');
    url.searchParams.set('labels', 'bug');
    if (typeof location !== 'undefined') {
        url.searchParams.set('url', location.href);
    }
    url.searchParams.set('env', describeEnv());
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
}
function describeEnv() {
    var _a, _b, _c;
    if (typeof navigator === 'undefined')
        return 'unknown / unknown / unknown';
    const ua = navigator.userAgent || '';
    const browser = pickBrowser(ua);
    const platform = 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_c = (_b = (_a = navigator.userAgentData) === null || _a === void 0 ? void 0 : _a.platform) !== null && _b !== void 0 ? _b : navigator.platform) !== null && _c !== void 0 ? _c : 'unknown';
    const viewport = typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : 'unknown';
    return `${browser} / ${platform} / viewport ${viewport}`;
}
function pickBrowser(ua) {
    const checks = [
        [/Edg\/(\d+)/, (m) => `Edge ${m[1]}`],
        [/OPR\/(\d+)/, (m) => `Opera ${m[1]}`],
        [/Firefox\/(\d+)/, (m) => `Firefox ${m[1]}`],
        [/Chrome\/(\d+)/, (m) => `Chrome ${m[1]}`],
        [/Version\/([\d.]+).*Safari/, (m) => `Safari ${m[1]}`],
    ];
    for (const [re, fmt] of checks) {
        const m = ua.match(re);
        if (m)
            return fmt(m);
    }
    return 'unknown browser';
}
//# sourceMappingURL=report-bug.js.map