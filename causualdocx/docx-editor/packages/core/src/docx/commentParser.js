/**
 * Comment Parser - Parse comments.xml and commentsExtensible.xml
 *
 * Parses OOXML comments (w:comment) from comments.xml file.
 * Cross-references with commentsExtensible.xml (or commentsExtended.xml)
 * to obtain reliable UTC timestamps via w16cex:dateUtc.
 *
 * Note: Microsoft Word stores w:date as local time WITHOUT timezone offset,
 * which is ambiguous. The reliable UTC timestamp lives in the separate
 * commentsExtensible.xml part (Word 2016+).
 *
 * OOXML Reference:
 * - Comments: w:comments
 * - Comment: w:comment (w:id, w:author, w:date, w:initials)
 * - Comment content: child w:p elements
 */
import { parseXml, findChild, getChildElements, getAttribute } from './xmlParser';
import { parseParagraph } from './paragraphParser';
/**
 * Build a lookup from paraId → dateUtc from commentsExtensible.xml
 *
 * The XML structure is:
 * <w16cex:commentsExtensible>
 *   <w16cex:comment w16cex:paraId="..." w16cex:dateUtc="2024-02-10T14:30:45Z"/>
 * </w16cex:commentsExtensible>
 */
function parseCommentsExtensible(xml) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const dateUtcByParaId = new Map();
    const root = parseXml(xml);
    if (!root)
        return dateUtcByParaId;
    // Find the root element (may be w16cex:commentsExtensible or similar)
    const container = (_a = findChild(root, 'w16cex', 'commentsExtensible')) !== null && _a !== void 0 ? _a : root;
    for (const child of getChildElements(container)) {
        const localName = (_c = (_b = child.name) === null || _b === void 0 ? void 0 : _b.replace(/^.*:/, '')) !== null && _c !== void 0 ? _c : '';
        if (localName !== 'comment')
            continue;
        // Try multiple namespace prefixes since they vary between Word versions
        const paraId = (_g = (_e = (_d = getAttribute(child, 'w16cex', 'paraId')) !== null && _d !== void 0 ? _d : getAttribute(child, 'w15', 'paraId')) !== null && _e !== void 0 ? _e : (_f = child.attributes) === null || _f === void 0 ? void 0 : _f['w16cex:paraId']) !== null && _g !== void 0 ? _g : (_h = child.attributes) === null || _h === void 0 ? void 0 : _h['w15:paraId'];
        const dateUtc = (_m = (_k = (_j = getAttribute(child, 'w16cex', 'dateUtc')) !== null && _j !== void 0 ? _j : getAttribute(child, 'w15', 'dateUtc')) !== null && _k !== void 0 ? _k : (_l = child.attributes) === null || _l === void 0 ? void 0 : _l['w16cex:dateUtc']) !== null && _m !== void 0 ? _m : (_o = child.attributes) === null || _o === void 0 ? void 0 : _o['w15:dateUtc'];
        if (paraId && dateUtc) {
            dateUtcByParaId.set(String(paraId).toUpperCase(), String(dateUtc));
        }
    }
    return dateUtcByParaId;
}
/**
 * Parse commentsExtended.xml (w15:commentsEx) for reply threading.
 * Returns a map of paraId → paraIdParent.
 */
function parseCommentsExtended(xml) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const parentByParaId = new Map();
    const doneByParaId = new Map();
    const root = parseXml(xml);
    if (!root)
        return { parentByParaId, doneByParaId };
    const container = (_a = findChild(root, 'w15', 'commentsEx')) !== null && _a !== void 0 ? _a : root;
    for (const child of getChildElements(container)) {
        const localName = (_c = (_b = child.name) === null || _b === void 0 ? void 0 : _b.replace(/^.*:/, '')) !== null && _c !== void 0 ? _c : '';
        if (localName !== 'commentEx')
            continue;
        const paraId = (_d = getAttribute(child, 'w15', 'paraId')) !== null && _d !== void 0 ? _d : (_e = child.attributes) === null || _e === void 0 ? void 0 : _e['w15:paraId'];
        const paraIdParent = (_f = getAttribute(child, 'w15', 'paraIdParent')) !== null && _f !== void 0 ? _f : (_g = child.attributes) === null || _g === void 0 ? void 0 : _g['w15:paraIdParent'];
        const done = (_h = getAttribute(child, 'w15', 'done')) !== null && _h !== void 0 ? _h : (_j = child.attributes) === null || _j === void 0 ? void 0 : _j['w15:done'];
        if (paraId) {
            const pid = String(paraId).toUpperCase();
            if (paraIdParent) {
                parentByParaId.set(pid, String(paraIdParent).toUpperCase());
            }
            if (done === '1') {
                doneByParaId.set(pid, true);
            }
        }
    }
    return { parentByParaId, doneByParaId };
}
/**
 * Parse comments.xml into an array of Comment objects.
 *
 * If commentsExtensibleXml is provided, UTC timestamps are cross-referenced
 * via paraId and preferred over the ambiguous w:date local time.
 *
 * If commentsExtendedXml is provided, reply threading (paraIdParent) and
 * resolved state (done) are cross-referenced via paraId.
 */
export function parseComments(commentsXml, styles, theme, rels, media, commentsExtensibleXml, commentsExtendedXml) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    if (!commentsXml)
        return [];
    const root = parseXml(commentsXml);
    if (!root)
        return [];
    // Build UTC date lookup from commentsExtensible.xml (if available)
    const dateUtcByParaId = commentsExtensibleXml
        ? parseCommentsExtensible(commentsExtensibleXml)
        : new Map();
    // Build threading lookup from commentsExtended.xml (if available)
    const extended = commentsExtendedXml ? parseCommentsExtended(commentsExtendedXml) : null;
    const commentsEl = (_a = findChild(root, 'w', 'comments')) !== null && _a !== void 0 ? _a : root;
    const children = getChildElements(commentsEl);
    const comments = [];
    // Track each comment's last paragraph paraId for threading resolution
    const lastParaIdByCommentIdx = [];
    for (const child of children) {
        const localName = (_c = (_b = child.name) === null || _b === void 0 ? void 0 : _b.replace(/^.*:/, '')) !== null && _c !== void 0 ? _c : '';
        if (localName !== 'comment')
            continue;
        const id = parseInt((_d = getAttribute(child, 'w', 'id')) !== null && _d !== void 0 ? _d : '0', 10);
        const author = (_e = getAttribute(child, 'w', 'author')) !== null && _e !== void 0 ? _e : 'Unknown';
        const rawInitials = getAttribute(child, 'w', 'initials');
        const initials = rawInitials != null ? String(rawInitials) : undefined;
        const rawDate = getAttribute(child, 'w', 'date');
        const localDate = rawDate != null ? String(rawDate) : undefined;
        // Try to find the UTC date from commentsExtensible.xml via paraId
        const paraId = (_h = (_f = getAttribute(child, 'w14', 'paraId')) !== null && _f !== void 0 ? _f : (_g = child.attributes) === null || _g === void 0 ? void 0 : _g['w14:paraId']) !== null && _h !== void 0 ? _h : getAttribute(child, 'w', 'paraId');
        const dateUtc = paraId ? dateUtcByParaId.get(String(paraId).toUpperCase()) : undefined;
        // Prefer UTC date over ambiguous local date
        const date = dateUtc !== null && dateUtc !== void 0 ? dateUtc : localDate;
        // Parse w:done attribute (resolved/done state)
        const rawDone = (_j = getAttribute(child, 'w', 'done')) !== null && _j !== void 0 ? _j : (_k = child.attributes) === null || _k === void 0 ? void 0 : _k['w:done'];
        let done = rawDone === '1' || rawDone === 'true' ? true : undefined;
        // Parse parent comment ID for replies (w16cid:parentId on w:comment)
        const rawParentId = (_p = (_m = (_l = getAttribute(child, 'w16cid', 'parentId')) !== null && _l !== void 0 ? _l : getAttribute(child, 'w', 'parentId')) !== null && _m !== void 0 ? _m : (_o = child.attributes) === null || _o === void 0 ? void 0 : _o['w16cid:parentId']) !== null && _p !== void 0 ? _p : (_q = child.attributes) === null || _q === void 0 ? void 0 : _q['w:parentId'];
        const parentId = rawParentId != null ? parseInt(String(rawParentId), 10) : undefined;
        // Parse comment content (paragraphs) and track the last paragraph's paraId
        const paragraphs = [];
        let lastParagraphParaId = '';
        for (const contentChild of getChildElements(child)) {
            const contentName = (_s = (_r = contentChild.name) === null || _r === void 0 ? void 0 : _r.replace(/^.*:/, '')) !== null && _s !== void 0 ? _s : '';
            if (contentName === 'p') {
                const paragraph = parseParagraph(contentChild, styles, theme, null, rels, media);
                paragraphs.push(paragraph);
                // Get w14:paraId from the paragraph element
                const pParaId = (_t = getAttribute(contentChild, 'w14', 'paraId')) !== null && _t !== void 0 ? _t : (_u = contentChild.attributes) === null || _u === void 0 ? void 0 : _u['w14:paraId'];
                if (pParaId)
                    lastParagraphParaId = String(pParaId).toUpperCase();
            }
        }
        // Cross-reference done state from commentsExtended.xml
        if (done == null && extended && lastParagraphParaId) {
            const extDone = extended.doneByParaId.get(lastParagraphParaId);
            if (extDone)
                done = true;
        }
        lastParaIdByCommentIdx.push(lastParagraphParaId);
        comments.push(Object.assign(Object.assign({ id,
            author,
            initials,
            date, content: paragraphs }, (done != null ? { done } : {})), (parentId != null && !isNaN(parentId) ? { parentId } : {})));
    }
    // Resolve reply threading from commentsExtended.xml (w15:paraIdParent)
    // Word stores threading here, not as w16cid:parentId on w:comment
    if (extended && extended.parentByParaId.size > 0) {
        // Build reverse lookup: paraId → comment id
        const commentIdByParaId = new Map();
        for (let i = 0; i < comments.length; i++) {
            const pid = lastParaIdByCommentIdx[i];
            if (pid)
                commentIdByParaId.set(pid, comments[i].id);
        }
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].parentId != null)
                continue; // already has parentId
            const pid = lastParaIdByCommentIdx[i];
            if (!pid)
                continue;
            const parentParaId = extended.parentByParaId.get(pid);
            if (!parentParaId)
                continue;
            const parentCommentId = commentIdByParaId.get(parentParaId);
            if (parentCommentId != null) {
                comments[i] = Object.assign(Object.assign({}, comments[i]), { parentId: parentCommentId });
            }
        }
    }
    return comments;
}
//# sourceMappingURL=commentParser.js.map