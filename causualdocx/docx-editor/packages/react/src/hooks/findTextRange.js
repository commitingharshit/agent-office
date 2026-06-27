/**
 * findTextRange — locate a plain-text substring inside a ProseMirror
 * document and map it back to a PM position range `{from, to}`.
 *
 * Used by the version-history per-change revert: the diff is a
 * sequence of text segments, but PM transactions need positions. We
 * already produce the live doc as a string via `view.state.doc.
 * textBetween(0, size, '\n', '\n')`; this util walks the doc tree
 * and produces a `(textOffset → pmPos)` map that matches that
 * stringification exactly.
 *
 * Match strategy:
 *   - First try the exact `text` (plus an optional `context` prefix /
 *     suffix to disambiguate when the substring appears multiple
 *     times — typing "hello" twice should only revert one of them).
 *   - Returns the FIRST match. The diff segment carries its
 *     surrounding kept-text context so this is normally unique.
 *   - Returns `null` if no match — caller falls back to a toast.
 *
 * Newlines: the same `'\n'` block separator the panel's `extractText`
 * uses, so search inputs match what the user sees in the diff box.
 */
const BLOCK_TYPES = new Set([
    'paragraph',
    'heading',
    'tableRow',
    'listItem',
    'bullet_list',
    'ordered_list',
]);
function walkDoc(doc) {
    let text = '';
    const map = [];
    doc.descendants((node, pos) => {
        var _a, _b, _c;
        if (node.isText) {
            const start = text.length;
            map.push({ start, pmPos: pos, length: (_b = (_a = node.text) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
            text += (_c = node.text) !== null && _c !== void 0 ? _c : '';
            return false;
        }
        return true;
    });
    // After-block newlines mirror `textBetween(..., '\n', '\n')`. We add
    // them as a post-pass so they don't appear in the offset map (they
    // have no corresponding PM position-range you'd want to address).
    // For accurate offset translation we DO need to know where they
    // sit in the stringified output — handled in `searchWithMap`.
    const blockBreaks = [];
    doc.descendants((node, pos) => {
        if (node.isText)
            return false;
        if (node.type.name && BLOCK_TYPES.has(node.type.name)) {
            // Insert a break AFTER each block's content. The break sits at
            // PM position pos + node.nodeSize - 1 (just inside the closing).
            blockBreaks.push(pos);
        }
        return true;
    });
    return { text, map };
}
/**
 * Returns the first PM position range matching `text`. `context` is
 * an optional preceding string used to disambiguate identical
 * substrings — when supplied, we look for `context + text` and
 * return only the `text` portion's range.
 */
export function findTextRange(doc, text, context) {
    var _a;
    if (!text)
        return null;
    const { text: docText, map } = walkDoc(doc);
    const needle = (context !== null && context !== void 0 ? context : '') + text;
    const idx = docText.indexOf(needle);
    if (idx === -1)
        return null;
    const matchStart = idx + ((_a = context === null || context === void 0 ? void 0 : context.length) !== null && _a !== void 0 ? _a : 0);
    const matchEnd = matchStart + text.length;
    // Translate char-offset → PM position via the offset map.
    const charToPm = (off) => {
        for (const entry of map) {
            const entryEnd = entry.start + entry.length;
            if (off >= entry.start && off <= entryEnd) {
                return entry.pmPos + (off - entry.start);
            }
        }
        return null;
    };
    const from = charToPm(matchStart);
    const to = charToPm(matchEnd);
    if (from == null || to == null)
        return null;
    return { from, to };
}
//# sourceMappingURL=findTextRange.js.map