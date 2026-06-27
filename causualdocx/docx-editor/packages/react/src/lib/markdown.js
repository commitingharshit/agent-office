import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Tiny inline markdown renderer for chat bubbles.
 *
 * Llama-3.2-1B's replies routinely use **bold**, *italic*, `code`,
 * bullets, numbered lists, and fenced code blocks. Showing them as
 * raw asterisks makes the chat feel amateur; pulling in a full
 * markdown lib (react-markdown + remark + …) adds 50 KB+ of deps we
 * don't need for the subset the model actually uses.
 *
 * What we handle:
 *  - `# heading` to `###### heading`
 *  - `**bold**`, `__bold__`, `*italic*`, `_italic_`
 *  - `` `inline code` ``
 *  - Fenced code blocks (```)
 *  - Bullet lists (`- `, `* `)
 *  - Numbered lists (`1. `, `2. `, …)
 *  - Links: `[text](url)`
 *  - Hard line breaks (blank line between paragraphs)
 *
 * What we deliberately ignore: tables, images, blockquotes,
 * strikethrough, HTML pass-through. Small models seldom emit them,
 * and supporting them properly belongs in a real markdown engine.
 */
import { Fragment, memo } from 'react';
const INLINE_PATTERNS = [
    { kind: 'bold', open: '**', close: '**', pattern: /\*\*([^*]+)\*\*/ },
    { kind: 'bold', open: '__', close: '__', pattern: /__([^_]+)__/ },
    { kind: 'italic', open: '*', close: '*', pattern: /(^|[^*])\*([^*]+)\*/ },
    { kind: 'italic', open: '_', close: '_', pattern: /(^|[^_])_([^_]+)_/ },
    { kind: 'code', open: '`', close: '`', pattern: /`([^`]+)`/ },
    {
        kind: 'link',
        open: '[',
        close: ')',
        pattern: /\[([^\]]+)\]\(([^)]+)\)/,
    },
];
function tokeniseInline(text) {
    var _a, _b, _c, _d, _e, _f, _g;
    const tokens = [];
    let remaining = text;
    while (remaining.length > 0) {
        let best = null;
        for (const spec of INLINE_PATTERNS) {
            const m = remaining.match(spec.pattern);
            if (!m)
                continue;
            if (!best || ((_a = m.index) !== null && _a !== void 0 ? _a : 0) < ((_b = best.match.index) !== null && _b !== void 0 ? _b : 0)) {
                best = { match: m, spec };
            }
        }
        if (!best || best.match.index === undefined) {
            tokens.push({ kind: 'text', value: remaining });
            break;
        }
        const before = remaining.slice(0, best.match.index);
        if (before.length > 0)
            tokens.push({ kind: 'text', value: before });
        if (best.spec.kind === 'link') {
            tokens.push({
                kind: 'link',
                value: (_c = best.match[1]) !== null && _c !== void 0 ? _c : '',
                href: (_d = best.match[2]) !== null && _d !== void 0 ? _d : '',
            });
            remaining = remaining.slice(best.match.index + best.match[0].length);
            continue;
        }
        if (best.spec.kind === 'italic') {
            // Italic patterns include a leading non-marker capture so they
            // don't eat the first asterisk of a bold span. Re-emit the
            // captured prefix as plain text.
            const prefix = (_e = best.match[1]) !== null && _e !== void 0 ? _e : '';
            if (prefix.length > 0)
                tokens.push({ kind: 'text', value: prefix });
            tokens.push({ kind: 'italic', value: (_f = best.match[2]) !== null && _f !== void 0 ? _f : '' });
            remaining = remaining.slice(best.match.index + best.match[0].length);
            continue;
        }
        tokens.push({ kind: best.spec.kind, value: (_g = best.match[1]) !== null && _g !== void 0 ? _g : '' });
        remaining = remaining.slice(best.match.index + best.match[0].length);
    }
    return tokens;
}
function renderInline(text) {
    const tokens = tokeniseInline(text);
    return tokens.map((t, i) => {
        var _a;
        switch (t.kind) {
            case 'bold':
                return _jsx("strong", { children: renderInline(t.value) }, i);
            case 'italic':
                return _jsx("em", { children: renderInline(t.value) }, i);
            case 'code':
                return (_jsx("code", { style: {
                        fontFamily: 'Consolas, "SF Mono", Menlo, monospace',
                        fontSize: '0.92em',
                        background: 'rgba(0,0,0,0.06)',
                        padding: '1px 5px',
                        borderRadius: 3,
                    }, children: t.value }, i));
            case 'link':
                return (_jsx("a", { href: (_a = t.href) !== null && _a !== void 0 ? _a : '#', target: "_blank", rel: "noopener noreferrer", style: { color: 'var(--doc-primary, #1a73e8)', textDecoration: 'underline' }, children: t.value }, i));
            default:
                return _jsx(Fragment, { children: t.value }, i);
        }
    });
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
            i++; // skip the closing fence
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
        // Plain paragraph — collect consecutive non-empty, non-special
        // lines.
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
const headingStyles = {
    1: { fontSize: 18, fontWeight: 600, margin: '6px 0 4px' },
    2: { fontSize: 16, fontWeight: 600, margin: '6px 0 4px' },
    3: { fontSize: 14, fontWeight: 600, margin: '6px 0 4px' },
    4: { fontSize: 13, fontWeight: 600, margin: '6px 0 4px' },
    5: { fontSize: 13, fontWeight: 600, margin: '6px 0 4px' },
    6: { fontSize: 13, fontWeight: 600, margin: '6px 0 4px' },
};
function MarkdownImpl({ text }) {
    // parseBlocks + renderInline are pure CPU work. For chat / live
    // previews / version-history activity rows the same text gets
    // rendered many times as siblings update. Without memoising we
    // re-parse every block on every parent render — quadratic on the
    // translate live-preview pane (N chunks × N renders per chunk
    // landing), which is the freeze the user reported. Memo wrapper
    // below collapses to one parse per unique `text`.
    const blocks = parseBlocks(text);
    return (_jsx(_Fragment, { children: blocks.map((b, i) => {
            var _a, _b;
            switch (b.kind) {
                case 'heading': {
                    const level = Math.max(1, Math.min(6, (_a = b.level) !== null && _a !== void 0 ? _a : 3));
                    const inner = renderInline((_b = b.lines[0]) !== null && _b !== void 0 ? _b : '');
                    const style = headingStyles[level];
                    switch (level) {
                        case 1:
                            return (_jsx("h1", { style: style, children: inner }, i));
                        case 2:
                            return (_jsx("h2", { style: style, children: inner }, i));
                        case 3:
                            return (_jsx("h3", { style: style, children: inner }, i));
                        case 4:
                            return (_jsx("h4", { style: style, children: inner }, i));
                        case 5:
                            return (_jsx("h5", { style: style, children: inner }, i));
                        default:
                            return (_jsx("h6", { style: style, children: inner }, i));
                    }
                }
                case 'paragraph':
                    return (_jsx("p", { style: { margin: '0 0 6px' }, children: renderInline(b.lines.join(' ')) }, i));
                case 'bullet':
                    return (_jsx("ul", { style: { margin: '0 0 6px 18px', padding: 0 }, children: b.lines.map((li, j) => (_jsx("li", { children: renderInline(li) }, j))) }, i));
                case 'numbered':
                    return (_jsx("ol", { style: { margin: '0 0 6px 18px', padding: 0 }, children: b.lines.map((li, j) => (_jsx("li", { children: renderInline(li) }, j))) }, i));
                case 'code':
                    return (_jsx("pre", { style: {
                            margin: '4px 0 6px',
                            padding: '8px 10px',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.06)',
                            fontFamily: 'Consolas, "SF Mono", Menlo, monospace',
                            fontSize: 12,
                            lineHeight: 1.4,
                            overflowX: 'auto',
                        }, children: b.lines.join('\n') }, i));
            }
        }) }));
}
// Memoise on the `text` prop. Same-string siblings collapse to one
// parse pass + reused VDOM. Equality is reference-then-string so React
// can shortcut identical refs without an N-char compare.
export const Markdown = memo(MarkdownImpl, (a, b) => a.text === b.text);
//# sourceMappingURL=markdown.js.map