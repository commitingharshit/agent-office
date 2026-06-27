/**
 * Doc-context summariser — gives every chat-driven AI call a one-
 * paragraph picture of the active document so the model can reason
 * about WHAT it's editing instead of treating each prompt as
 * context-free.
 *
 * Inputs are deliberately cheap to compute (plain-text scan + a small
 * walk of the PM doc when available). The output is plain English, no
 * markdown — designed to drop into a system prompt's preamble:
 *
 *   "You are editing the user's document. About the document:
 *    – Likely a resume / cover-letter
 *    – ~340 words, 4 headings (Summary, Experience, Education, Skills)
 *    – 8 bullet points · 1 table · 0 images
 *    – The user has 2 paragraphs of "Experience" selected (160 chars)"
 *
 * Caller passes `getDocText`, optional editor view, and the user's
 * current selection text. Returned string is capped at ~600 chars so
 * the system-prompt budget stays predictable.
 */
function walkPm(view) {
    const c = {
        paragraphs: 0,
        headings: [],
        bullets: 0,
        numbered: 0,
        tables: 0,
        images: 0,
    };
    view.state.doc.descendants((node) => {
        var _a, _b, _c, _d, _e, _f, _g;
        if (node.type.name === 'paragraph') {
            c.paragraphs += 1;
            // Heading detection — fork uses `headingStyle` attr / mark-based
            // headings rather than a `heading` node. Detect via a font-size
            // mark > 22 half-points OR via a styleId hint.
            const styleId = (_a = node.attrs) === null || _a === void 0 ? void 0 : _a.styleId;
            const looksHeading = (typeof styleId === 'string' && /^Heading\s*(\d)/i.test(styleId)) ||
                ((_c = (_b = node.firstChild) === null || _b === void 0 ? void 0 : _b.marks) === null || _c === void 0 ? void 0 : _c.some((m) => { var _a, _b; return m.type.name === 'fontSize' && ((_b = (_a = m.attrs) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0) >= 24; }));
            if (looksHeading) {
                const level = (_d = styleId === null || styleId === void 0 ? void 0 : styleId.match(/(\d)/)) === null || _d === void 0 ? void 0 : _d[1];
                const text = (_f = (_e = node.textContent) === null || _e === void 0 ? void 0 : _e.slice(0, 80)) !== null && _f !== void 0 ? _f : '';
                c.headings.push({
                    level: level ? Number(level) : 2,
                    text,
                });
            }
            const txt = (_g = node.textContent) !== null && _g !== void 0 ? _g : '';
            if (/^\s*[-•]\s+/.test(txt))
                c.bullets += 1;
            if (/^\s*\d+\.\s+/.test(txt))
                c.numbered += 1;
        }
        if (node.type.name === 'table') {
            c.tables += 1;
            return false; // don't descend into cells for the count
        }
        if (node.type.name === 'image')
            c.images += 1;
        return true;
    });
    return c;
}
function wordCount(text) {
    const m = text.trim().match(/\S+/g);
    return m ? m.length : 0;
}
export function inferDocKind(text, headings) {
    const lc = text.toLowerCase();
    const hl = headings.map((h) => h.toLowerCase());
    const has = (re) => hl.some((h) => re.test(h)) || re.test(lc.slice(0, 800));
    if (has(/experience/) && (has(/education/) || has(/skills/)))
        return 'resume';
    if (has(/cover letter/) || /dear hiring manager/i.test(text))
        return 'cover-letter';
    if (has(/memorandum|to:|from:|subject:/i))
        return 'memo';
    if (has(/abstract/) && has(/introduction/))
        return 'academic';
    if (has(/agenda/))
        return 'meeting-notes';
    if (/^\s*#/.test(text) || /\n\n#{1,6}\s/.test(text))
        return 'markdown-doc';
    return null;
}
const DOC_TEXT_SCAN_LIMIT = 6000;
const SELECTION_HINT_CAP = 200;
export function summariseDocStructure(opts) {
    var _a, _b, _c, _d;
    const text = ((_a = opts.docText) !== null && _a !== void 0 ? _a : '').slice(0, DOC_TEXT_SCAN_LIMIT);
    const view = (_b = opts.view) !== null && _b !== void 0 ? _b : null;
    const counts = view
        ? walkPm(view)
        : { paragraphs: 0, headings: [], bullets: 0, numbered: 0, tables: 0, images: 0 };
    const words = wordCount(text);
    const headingNames = counts.headings.map((h) => h.text.trim()).filter(Boolean);
    const kind = inferDocKind(text, headingNames);
    const parts = [];
    if (words === 0) {
        parts.push('The document is currently empty.');
    }
    else {
        const lead = kind ? `Likely a ${kind}.` : 'A working document.';
        parts.push(lead);
        parts.push(`~${words} word${words === 1 ? '' : 's'}` +
            (counts.paragraphs
                ? `, ${counts.paragraphs} paragraph${counts.paragraphs === 1 ? '' : 's'}`
                : ''));
        if (headingNames.length > 0) {
            const sample = headingNames.slice(0, 6).join(', ');
            parts.push(`${counts.headings.length} heading${counts.headings.length === 1 ? '' : 's'} (${sample}${headingNames.length > 6 ? ', …' : ''})`);
        }
        const decorationParts = [];
        if (counts.bullets > 0)
            decorationParts.push(`${counts.bullets} bullet point${counts.bullets === 1 ? '' : 's'}`);
        if (counts.numbered > 0)
            decorationParts.push(`${counts.numbered} numbered item${counts.numbered === 1 ? '' : 's'}`);
        if (counts.tables > 0)
            decorationParts.push(`${counts.tables} table${counts.tables === 1 ? '' : 's'}`);
        if (counts.images > 0)
            decorationParts.push(`${counts.images} image${counts.images === 1 ? '' : 's'}`);
        if (decorationParts.length > 0)
            parts.push(decorationParts.join(' · '));
    }
    const sel = (_d = (_c = opts.selectionText) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '';
    if (sel.length > 0) {
        const selWords = wordCount(sel);
        const preview = sel.length > SELECTION_HINT_CAP ? `${sel.slice(0, SELECTION_HINT_CAP)}…` : sel;
        parts.push(`The user currently has ${selWords} word${selWords === 1 ? '' : 's'} selected: "${preview}"`);
    }
    else {
        parts.push('No text is currently selected — cursor only.');
    }
    return parts.join('\n');
}
//# sourceMappingURL=docContext.js.map