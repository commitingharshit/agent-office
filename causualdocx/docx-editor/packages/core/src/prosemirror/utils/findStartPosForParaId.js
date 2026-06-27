/**
 * ProseMirror position immediately before the first textblock whose `paraId`
 * attribute equals `paraId` (Word `w14:paraId` / OOXML paragraph id).
 *
 * Match is strict string equality on `node.attrs.paraId`.
 */
export function findStartPosForParaId(doc, paraId) {
    // Whitespace-only paraIds aren't valid Word w14:paraId values; bail early
    // so descendants() doesn't walk the entire document for nothing.
    if (!paraId || !paraId.trim())
        return null;
    let found = null;
    doc.descendants((node, pos) => {
        var _a;
        if (found !== null)
            return false;
        if (((_a = node.attrs) === null || _a === void 0 ? void 0 : _a.paraId) === paraId && node.isTextblock) {
            found = pos;
            return false;
        }
        return true;
    });
    return found;
}
//# sourceMappingURL=findStartPosForParaId.js.map