/**
 * Smart paste helpers — detect when the user just pasted tabular
 * content (CSV, TSV, anything that looks gridded) so the host can
 * offer a one-click "Convert to table" affordance.
 *
 * Heuristics are deliberately strict to avoid false positives on
 * regular prose. Tab-delimited input always triggers; comma-
 * delimited only triggers when there are at least 3 lines AND a
 * solid majority carry ≥ 2 commas (most prose paragraphs don't).
 */
export function detectTabular(text) {
    if (!text)
        return null;
    const lines = text
        .replace(/\r/g, '')
        .split('\n')
        .filter((l) => l.length > 0);
    if (lines.length < 2)
        return null;
    // Tabs are the strongest signal — almost no prose uses them.
    if (lines.some((l) => l.includes('\t'))) {
        const colsPerLine = lines.map((l) => l.split('\t').length);
        const cols = mode(colsPerLine);
        if (cols >= 2)
            return { delimiter: 'tab', rows: lines.length, columns: cols };
    }
    // CSV-like: require ≥ 3 lines AND at least 60 % of them to carry
    // ≥ 2 commas. Common prose like "I bought eggs, milk, and bread."
    // would fail the 60 % gate.
    if (lines.length >= 3) {
        const richCommaLines = lines.filter((l) => { var _a, _b; return ((_b = (_a = l.match(/,/g)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= 2; }).length;
        if (richCommaLines / lines.length >= 0.6) {
            const colsPerLine = lines.map((l) => l.split(',').length);
            const cols = mode(colsPerLine);
            if (cols >= 2)
                return { delimiter: 'comma', rows: lines.length, columns: cols };
        }
    }
    return null;
}
function mode(nums) {
    var _a;
    const counts = new Map();
    for (const n of nums)
        counts.set(n, ((_a = counts.get(n)) !== null && _a !== void 0 ? _a : 0) + 1);
    let best = 0;
    let bestCount = 0;
    for (const [n, c] of counts) {
        if (c > bestCount) {
            best = n;
            bestCount = c;
        }
    }
    return best;
}
//# sourceMappingURL=smartPaste.js.map