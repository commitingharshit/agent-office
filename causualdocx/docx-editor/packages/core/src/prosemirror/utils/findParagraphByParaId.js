/**
 * ProseMirror position range for the paragraph (or any textblock) whose
 * `paraId` attribute equals `paraId`. Returns the inclusive `from` and
 * exclusive `to` positions, plus the node, so callers can both target
 * the paragraph (e.g. addMark over its text range) and inspect it.
 *
 * `from` is the position immediately before the textblock; `to` is
 * `from + node.nodeSize`. The text content lives at `[from + 1, to - 1]`.
 *
 * Returns null if no textblock with that paraId exists.
 */
export function findParagraphByParaId(doc, paraId) {
    if (!paraId || !paraId.trim())
        return null;
    let result = null;
    doc.descendants((node, pos) => {
        var _a;
        if (result !== null)
            return false;
        if (node.isTextblock && ((_a = node.attrs) === null || _a === void 0 ? void 0 : _a.paraId) === paraId) {
            result = { node, from: pos, to: pos + node.nodeSize };
            return false;
        }
        return true;
    });
    return result;
}
//# sourceMappingURL=findParagraphByParaId.js.map