/**
 * translateMarkdown — LLM-friendly translation strategy.
 *
 * Per-text-run translation wastes the LLM's context window: each call
 * carries one ~50-char run plus a 200-token system prompt = ~280
 * tokens of system : payload ratio of 5:1. With paragraph batching
 * we improved that, but a markdown round-trip is the real fix.
 *
 *  1. docToMarkdown(doc) — render the live ProseMirror document as
 *     markdown that preserves headings, bold/italic, hyperlinks,
 *     bullets, numbered lists. The model can translate ~600 words at
 *     a time in one call instead of 60.
 *  2. chunkMarkdown — split at paragraph boundaries below ~2000 chars
 *     so each chunk fits comfortably inside Llama-3.2-1B's 4096 ctx
 *     with room for the response.
 *  3. translateMarkdownChunkViaLlm — one LLM call per chunk. The
 *     system prompt is explicit about preserving every markdown
 *     marker so the round-trip back to PM is clean.
 *  4. markdownToFragment (existing) — round-trip the translated
 *     markdown back to PM nodes, marks intact.
 *
 * Wall-clock napkin math for a 200-page doc (~50000 words, ~250 KB
 * markdown): ~125 chunks at 2-4 sec each = 5-8 minutes total.
 * Compare to ~5000 per-run network calls or ~600 per-paragraph
 * batched API calls — and unlike either of those, the LLM doesn't
 * rate-limit.
 *
 * Progress is reported per chunk so the dialog can show a meaningful
 * "Chunk 12 of 125 — '… first 60 chars …'" indicator instead of a
 * stuck per-run counter.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { runChat } from './writer/controller';
import { markdownToFragment } from './writer/markdownToFragment';
import { stripModelPreamble } from './writer/stripPreamble';
const LANG_NAME_BY_CODE = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    nl: 'Dutch',
    pl: 'Polish',
    tr: 'Turkish',
    ar: 'Arabic',
    hi: 'Hindi',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
};
const CHUNK_TARGET_CHARS = 2000;
// ---------------------------------------------------------------------------
// PM → markdown
// ---------------------------------------------------------------------------
function inlineToMarkdown(node) {
    var _a, _b, _c, _d, _e;
    let text = (_a = node.text) !== null && _a !== void 0 ? _a : '';
    if (!text)
        return '';
    const markNames = new Set(node.marks.map((m) => m.type.name));
    const hyperlink = node.marks.find((m) => m.type.name === 'hyperlink');
    const fontFamily = node.marks.find((m) => m.type.name === 'fontFamily');
    // Inline code first so backticks don't get escaped by emphasis.
    if ((_d = (_c = (_b = fontFamily === null || fontFamily === void 0 ? void 0 : fontFamily.attrs) === null || _b === void 0 ? void 0 : _b.fontFamily) === null || _c === void 0 ? void 0 : _c.toLowerCase) === null || _d === void 0 ? void 0 : _d.call(_c).includes('mono')) {
        text = `\`${text}\``;
    }
    else if (markNames.has('bold') && markNames.has('italic')) {
        text = `***${text}***`;
    }
    else if (markNames.has('bold')) {
        text = `**${text}**`;
    }
    else if (markNames.has('italic')) {
        text = `*${text}*`;
    }
    if ((_e = hyperlink === null || hyperlink === void 0 ? void 0 : hyperlink.attrs) === null || _e === void 0 ? void 0 : _e.href) {
        text = `[${text}](${hyperlink.attrs.href})`;
    }
    return text;
}
function paragraphInlineMarkdown(para) {
    let out = '';
    para.descendants((child) => {
        if (child.isText) {
            out += inlineToMarkdown(child);
            return false;
        }
        if (child.type.name === 'hardBreak' || child.type.name === 'hard_break') {
            out += '  \n';
            return false;
        }
        return true;
    });
    return out;
}
function paragraphHeadingLevel(para) {
    var _a, _b;
    // Heading-shaped paragraphs in this fork: bold + fontSize half-pt
    // >= 24. Map roughly to # / ## / ### by size.
    const first = para.firstChild;
    if (!first || !first.isText)
        return null;
    const bold = first.marks.some((m) => m.type.name === 'bold');
    if (!bold)
        return null;
    const fontSizeMark = first.marks.find((m) => m.type.name === 'fontSize');
    const size = Number((_b = (_a = fontSizeMark === null || fontSizeMark === void 0 ? void 0 : fontSizeMark.attrs) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0);
    if (size >= 36)
        return 1;
    if (size >= 30)
        return 2;
    if (size >= 24)
        return 3;
    return null;
}
function tableToMarkdown(tableNode) {
    const rows = [];
    tableNode.descendants((row) => {
        if (row.type.name !== 'tableRow')
            return true;
        const cells = [];
        row.descendants((cell) => {
            if (cell.type.name !== 'tableCell' && cell.type.name !== 'tableHeader')
                return true;
            let cellText = '';
            cell.descendants((leaf) => {
                var _a;
                if (leaf.isText)
                    cellText += (_a = leaf.text) !== null && _a !== void 0 ? _a : '';
                return true;
            });
            cells.push(cellText.replace(/\|/g, '\\|').trim() || ' ');
            return false;
        });
        if (cells.length > 0)
            rows.push(cells);
        return false;
    });
    if (rows.length === 0)
        return '';
    const cols = Math.max(...rows.map((r) => r.length));
    const header = rows[0];
    while (header.length < cols)
        header.push(' ');
    const separator = Array(cols).fill('---');
    const body = rows.slice(1).map((r) => {
        while (r.length < cols)
            r.push(' ');
        return r;
    });
    return [
        `| ${header.join(' | ')} |`,
        `| ${separator.join(' | ')} |`,
        ...body.map((r) => `| ${r.join(' | ')} |`),
    ].join('\n');
}
export function docToMarkdown(doc) {
    const parts = [];
    doc.forEach((node) => {
        var _a, _b;
        if (node.type.name === 'paragraph') {
            const text = paragraphInlineMarkdown(node);
            if (!text.trim()) {
                parts.push('');
                return;
            }
            const heading = paragraphHeadingLevel(node);
            if (heading != null) {
                parts.push(`${'#'.repeat(heading)} ${text.replace(/\*\*/g, '')}`);
                return;
            }
            // Bullet detection — fork prefixes bullets with `•  `.
            if (text.startsWith('•  ')) {
                parts.push(`- ${text.slice(3)}`);
                return;
            }
            const numbered = text.match(/^(\d+)\.\s\s+(.*)$/);
            if (numbered) {
                parts.push(`${numbered[1]}. ${numbered[2]}`);
                return;
            }
            parts.push(text);
            return;
        }
        if (node.type.name === 'table') {
            parts.push(tableToMarkdown(node));
            return;
        }
        if (node.type.name === 'heading') {
            // Schemas that ship a real heading node — render as #-prefixed.
            const level = Number((_a = node.attrs.level) !== null && _a !== void 0 ? _a : 2);
            parts.push(`${'#'.repeat(Math.max(1, Math.min(6, level)))} ${node.textContent}`);
            return;
        }
        // Fallback — emit plain text.
        const txt = (_b = node.textContent) === null || _b === void 0 ? void 0 : _b.trim();
        if (txt)
            parts.push(txt);
    });
    return parts
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------
export function chunkMarkdown(md, maxChars = CHUNK_TARGET_CHARS) {
    if (md.length <= maxChars)
        return md.trim() ? [md] : [];
    const blocks = md.split(/\n{2,}/);
    const out = [];
    let current = '';
    for (const block of blocks) {
        if (current.length === 0) {
            current = block;
            continue;
        }
        if (current.length + 2 + block.length <= maxChars) {
            current = `${current}\n\n${block}`;
        }
        else {
            out.push(current);
            current = block;
        }
    }
    if (current)
        out.push(current);
    return out;
}
// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------
function translateMarkdownChunkViaLlm(md, source, target, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const sourceName = (_a = LANG_NAME_BY_CODE[source]) !== null && _a !== void 0 ? _a : source;
        const targetName = (_b = LANG_NAME_BY_CODE[target]) !== null && _b !== void 0 ? _b : target;
        const system = `You are a professional translator translating one markdown chunk at a time. ` +
            `Translate from ${sourceName} into ${targetName}. ` +
            `Preserve ALL markdown syntax exactly — # headings, **bold**, *italic*, ` +
            `[link text](url), - bullets, numbered lists, table pipes, line breaks. ` +
            `Translate ONLY the human-readable text. URLs, code blocks, numbers, and ` +
            `proper-noun acronyms must remain unchanged. ` +
            `Return ONLY the translated markdown — no preamble, no JSON wrapper, no commentary.`;
        const raw = yield runChat([
            { role: 'system', content: system },
            { role: 'user', content: md },
        ], {
            // Translations of European languages typically grow ~1.3-1.5x;
            // CJK can compress. Budget generously, clip on responses that
            // exceed the per-chunk cap.
            maxTokens: Math.min(2048, Math.ceil(md.length * 1.7) + 128),
            temperature: 0.12,
            signal,
        });
        return stripModelPreamble(raw.trim());
    });
}
/**
 * Translate an entire PM document via the markdown round-trip
 * strategy. Returns a Fragment ready to drop into the live doc or
 * preview pane.
 *
 * Caller responsibilities:
 *   - Ensure the Advanced LLM tier is ready before invoking (no
 *     network fallback is attempted here — the dialog should route
 *     to MyMemory/Lingva when the LLM isn't loaded).
 *   - Abort via the AbortSignal if the user cancels.
 */
export function translateDocViaMarkdown(doc_1, schema_1, source_1, target_1) {
    return __awaiter(this, arguments, void 0, function* (doc, schema, source, target, opts = {}) {
        const { signal, onProgress, onChunkStateChange } = opts;
        if (source === target)
            return doc.content;
        const md = docToMarkdown(doc);
        if (!md.trim())
            return doc.content;
        const chunks = chunkMarkdown(md);
        const translatedChunks = [];
        // Initial state — nothing translated yet, everything is remaining.
        onChunkStateChange === null || onChunkStateChange === void 0 ? void 0 : onChunkStateChange({
            translated: [],
            inProgress: null,
            remaining: chunks.slice(),
        });
        for (let i = 0; i < chunks.length; i++) {
            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                throw new DOMException('Aborted', 'AbortError');
            const chunk = chunks[i];
            onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                chunk: i + 1,
                totalChunks: chunks.length,
                preview: chunk.replace(/\s+/g, ' ').slice(0, 60),
            });
            // Emit "in flight" state BEFORE the LLM call so the dialog shows
            // the spinner-tinted chunk during the wait.
            onChunkStateChange === null || onChunkStateChange === void 0 ? void 0 : onChunkStateChange({
                translated: translatedChunks.slice(),
                inProgress: chunk,
                remaining: chunks.slice(i + 1),
            });
            const translated = yield translateMarkdownChunkViaLlm(chunk, source, target, signal);
            translatedChunks.push(translated);
            // Emit landed state — the just-finished chunk moves from
            // `inProgress` to `translated`. The dialog re-renders the live
            // preview with one more chunk in the target language.
            onChunkStateChange === null || onChunkStateChange === void 0 ? void 0 : onChunkStateChange({
                translated: translatedChunks.slice(),
                inProgress: null,
                remaining: chunks.slice(i + 1),
            });
        }
        const joined = translatedChunks.join('\n\n');
        return markdownToFragment(joined, schema);
    });
}
//# sourceMappingURL=translateMarkdown.js.map