/**
 * markdown → PM Fragment converter for AI insertions.
 *
 * Llama-3.2-1B's output routinely carries markdown — `**bold**`,
 * `*italic*`, `` `code` ``, bullets, numbered lists, headings. The
 * chat panel renders that as proper HTML via `lib/markdown.tsx`, but
 * when the user clicks **Insert at cursor** we need the same content
 * to land in the OOXML model — not as raw asterisks the user has to
 * strip by hand.
 *
 * This walker mirrors `lib/markdown.tsx`'s block + inline parser,
 * but emits ProseMirror nodes whose marks plug straight into the
 * fork's existing OOXML round-trip:
 *
 *  - `bold` / `italic` → matching PM marks (round-trip to `w:b` /
 *    `w:i`).
 *  - `` `code` `` → `fontFamily: Consolas` mark when the schema
 *    has one; otherwise the inline text falls back to plain.
 *  - `[text](url)` → `hyperlink` mark with the `href` attr the
 *    extension expects.
 *  - Headings → paragraphs with the existing `headingStyle` attr
 *    so the layout-painter renders them at the right size.
 *  - Bullets / numbered lists → paragraphs prefixed with `•` /
 *    `N.` (the fork uses paragraph-level `numPr` for real lists,
 *    which needs a registered numbering definition that's beyond
 *    a one-shot insert — the prefix keeps the structure visible).
 *  - Fenced code → a paragraph per line, each carrying the
 *    monospace fontFamily.
 *
 * Every emitted text node carries the caller-supplied extra marks
 * (the `insertion` mark for tracked-change inserts), so the
 * tracked-change Accept / Reject UI owns the final decision.
 */
import { Fragment } from 'prosemirror-model';
const INLINE_PATTERNS = [
    { kind: 'bold', pattern: /\*\*([^*]+)\*\*/ },
    { kind: 'bold', pattern: /__([^_]+)__/ },
    { kind: 'italic', pattern: /(^|[^*])\*([^*]+)\*/ },
    { kind: 'italic', pattern: /(^|[^_])_([^_]+)_/ },
    { kind: 'code', pattern: /`([^`]+)`/ },
    { kind: 'link', pattern: /\[([^\]]+)\]\(([^)]+)\)/ },
];
function tokeniseInline(text) {
    var _a, _b, _c, _d, _e, _f, _g;
    const tokens = [];
    let remaining = text;
    while (remaining.length > 0) {
        let best = null;
        for (const { kind, pattern } of INLINE_PATTERNS) {
            const m = remaining.match(pattern);
            if (!m)
                continue;
            if (!best || ((_a = m.index) !== null && _a !== void 0 ? _a : 0) < ((_b = best.match.index) !== null && _b !== void 0 ? _b : 0)) {
                best = { match: m, kind };
            }
        }
        if (!best || best.match.index === undefined) {
            tokens.push({ kind: 'text', value: remaining });
            break;
        }
        const before = remaining.slice(0, best.match.index);
        if (before.length > 0)
            tokens.push({ kind: 'text', value: before });
        if (best.kind === 'link') {
            tokens.push({ kind: 'link', value: (_c = best.match[1]) !== null && _c !== void 0 ? _c : '', href: (_d = best.match[2]) !== null && _d !== void 0 ? _d : '' });
        }
        else if (best.kind === 'italic') {
            const prefix = (_e = best.match[1]) !== null && _e !== void 0 ? _e : '';
            if (prefix.length > 0)
                tokens.push({ kind: 'text', value: prefix });
            tokens.push({ kind: 'italic', value: (_f = best.match[2]) !== null && _f !== void 0 ? _f : '' });
        }
        else {
            tokens.push({ kind: best.kind, value: (_g = best.match[1]) !== null && _g !== void 0 ? _g : '' });
        }
        remaining = remaining.slice(best.match.index + best.match[0].length);
    }
    return tokens;
}
function inlineToTextNodes(text, schema, extraMarks) {
    var _a;
    const out = [];
    const tokens = tokeniseInline(text);
    for (const tok of tokens) {
        if (!tok.value)
            continue;
        const marks = [...extraMarks];
        if (tok.kind === 'bold' && schema.marks.bold)
            marks.push(schema.marks.bold.create());
        if (tok.kind === 'italic' && schema.marks.italic)
            marks.push(schema.marks.italic.create());
        if (tok.kind === 'code' && schema.marks.fontFamily)
            marks.push(schema.marks.fontFamily.create({ fontFamily: 'Consolas' }));
        if (tok.kind === 'link' && schema.marks.hyperlink) {
            marks.push(schema.marks.hyperlink.create({ href: (_a = tok.href) !== null && _a !== void 0 ? _a : '' }));
        }
        out.push(schema.text(tok.value, marks));
    }
    return out;
}
function paragraph(schema, children, attrs = {}) {
    const para = schema.nodes.paragraph;
    if (!para)
        return null;
    return para.create(attrs, children);
}
function parseBlocks(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const lines = input.replace(/\r/g, '').split('\n');
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
        const line = (_a = lines[i]) !== null && _a !== void 0 ? _a : '';
        if (line.startsWith('```')) {
            const code = [];
            i++;
            while (i < lines.length && !((_b = lines[i]) !== null && _b !== void 0 ? _b : '').startsWith('```')) {
                code.push((_c = lines[i]) !== null && _c !== void 0 ? _c : '');
                i++;
            }
            blocks.push({ kind: 'code', lines: code });
            i++;
            continue;
        }
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            blocks.push({
                kind: 'heading',
                level: headingMatch[1].length,
                lines: [(_d = headingMatch[2]) !== null && _d !== void 0 ? _d : ''],
            });
            i++;
            continue;
        }
        if (/^\s*[-*]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s+/.test((_e = lines[i]) !== null && _e !== void 0 ? _e : '')) {
                items.push(((_f = lines[i]) !== null && _f !== void 0 ? _f : '').replace(/^\s*[-*]\s+/, ''));
                i++;
            }
            blocks.push({ kind: 'bullet', lines: items });
            continue;
        }
        if (/^\s*\d+\.\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test((_g = lines[i]) !== null && _g !== void 0 ? _g : '')) {
                items.push(((_h = lines[i]) !== null && _h !== void 0 ? _h : '').replace(/^\s*\d+\.\s+/, ''));
                i++;
            }
            blocks.push({ kind: 'numbered', lines: items });
            continue;
        }
        if (line.trim().length === 0) {
            i++;
            continue;
        }
        const para = [];
        while (i < lines.length &&
            ((_j = lines[i]) !== null && _j !== void 0 ? _j : '').trim().length > 0 &&
            !/^#{1,6}\s+/.test((_k = lines[i]) !== null && _k !== void 0 ? _k : '') &&
            !/^\s*[-*]\s+/.test((_l = lines[i]) !== null && _l !== void 0 ? _l : '') &&
            !/^\s*\d+\.\s+/.test((_m = lines[i]) !== null && _m !== void 0 ? _m : '') &&
            !((_o = lines[i]) !== null && _o !== void 0 ? _o : '').startsWith('```')) {
            para.push((_p = lines[i]) !== null && _p !== void 0 ? _p : '');
            i++;
        }
        blocks.push({ kind: 'paragraph', lines: para });
    }
    return blocks;
}
const HEADING_SIZE_HALFPT = {
    1: 36,
    2: 32,
    3: 28,
    4: 26,
    5: 24,
    6: 24,
};
export function markdownToFragment(markdown, schema, extraMarks = []) {
    var _a, _b, _c;
    const blocks = parseBlocks(markdown);
    const children = [];
    for (const block of blocks) {
        if (block.kind === 'paragraph') {
            const inline = inlineToTextNodes(block.lines.join(' '), schema, extraMarks);
            const para = paragraph(schema, inline);
            if (para)
                children.push(para);
            continue;
        }
        if (block.kind === 'heading') {
            const sizeHalfPt = (_b = HEADING_SIZE_HALFPT[(_a = block.level) !== null && _a !== void 0 ? _a : 3]) !== null && _b !== void 0 ? _b : 26;
            const headingMarks = [...extraMarks];
            if (schema.marks.bold)
                headingMarks.push(schema.marks.bold.create());
            if (schema.marks.fontSize)
                headingMarks.push(schema.marks.fontSize.create({ size: sizeHalfPt }));
            const inline = inlineToTextNodes((_c = block.lines[0]) !== null && _c !== void 0 ? _c : '', schema, headingMarks);
            const para = paragraph(schema, inline);
            if (para)
                children.push(para);
            continue;
        }
        if (block.kind === 'bullet' || block.kind === 'numbered') {
            block.lines.forEach((item, idx) => {
                const prefix = block.kind === 'bullet' ? '•  ' : `${idx + 1}.  `;
                const prefixed = inlineToTextNodes(prefix + item, schema, extraMarks);
                const para = paragraph(schema, prefixed, { indentLeft: 360 });
                if (para)
                    children.push(para);
            });
            continue;
        }
        if (block.kind === 'code') {
            const codeMarks = [...extraMarks];
            if (schema.marks.fontFamily)
                codeMarks.push(schema.marks.fontFamily.create({ fontFamily: 'Consolas' }));
            for (const line of block.lines) {
                const inline = [schema.text(line || ' ', codeMarks)];
                const para = paragraph(schema, inline);
                if (para)
                    children.push(para);
            }
            continue;
        }
    }
    return Fragment.fromArray(children);
}
//# sourceMappingURL=markdownToFragment.js.map