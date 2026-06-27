/**
 * Builds a pre-filled GitHub "new issue" URL for the Help > Report issue action.
 *
 * GitHub does not allow file attachments via URL params, so the body asks the
 * user to drag-drop their DOCX onto the issue after it opens.
 */
const ISSUE_URL = 'https://github.com/eigenpal/docx-editor/issues/new';
export function buildReportIssueUrl(env = {}) {
    var _a, _b, _c;
    const ua = (_a = env.userAgent) !== null && _a !== void 0 ? _a : (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown');
    const vp = (_b = env.viewport) !== null && _b !== void 0 ? _b : (typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 0, height: 0 });
    const pageUrl = (_c = env.pageUrl) !== null && _c !== void 0 ? _c : (typeof window !== 'undefined' ? window.location.href : '');
    const body = [
        '### What happened',
        '',
        '### Steps to reproduce',
        '1. ',
        '2. ',
        '3. ',
        '',
        '### Expected',
        '',
        '### Actual',
        '',
        '### Attach the DOCX',
        'Please drag the `.docx` file that reproduces this onto the issue (below this text box). Bugs are much faster to fix with a real file.',
        '',
        '### Environment',
        `- URL: ${pageUrl}`,
        `- Viewport: ${vp.width} x ${vp.height}`,
        `- User agent: ${ua}`,
        '',
    ].join('\n');
    const params = new URLSearchParams({ title: '[Bug] ', body });
    return `${ISSUE_URL}?${params.toString()}`;
}
export function openReportIssue(env) {
    if (typeof window === 'undefined')
        return;
    window.open(buildReportIssueUrl(env), '_blank', 'noopener,noreferrer');
}
//# sourceMappingURL=reportIssue.js.map