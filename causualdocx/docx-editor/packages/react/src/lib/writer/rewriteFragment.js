/**
 * Per-mark-run AI helpers — walks a PM Fragment and runs the model
 * against each contiguous text-mark-run individually, then rebuilds
 * the Fragment with the same node + mark structure as the original.
 * That's the only way to keep bold / italic / link / heading
 * boundaries from collapsing the way they did with the original
 * toast-based handler.
 *
 * Surrounding-paragraph context is included as a prompt prefix so
 * flan-t5-small has something to anchor against — "rewrite this
 * sentence to be more concise" hits very different quality when the
 * model can see the paragraphs on either side.
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
import { Fragment } from 'prosemirror-model';
import { runTask } from './controller';
function buildPrompt(task, text, opts) {
    var _a, _b, _c;
    const tone = (_a = opts.tone) !== null && _a !== void 0 ? _a : 'polish';
    const ctxBefore = (_b = opts.contextBefore) === null || _b === void 0 ? void 0 : _b.trim();
    const ctxAfter = (_c = opts.contextAfter) === null || _c === void 0 ? void 0 : _c.trim();
    const ctxLine = ctxBefore || ctxAfter ? `Context: ${ctxBefore !== null && ctxBefore !== void 0 ? ctxBefore : ''} […selection…] ${ctxAfter !== null && ctxAfter !== void 0 ? ctxAfter : ''}\n` : '';
    if (task === 'rewrite') {
        const instruction = tone === 'concise'
            ? 'Rewrite to be more concise, keeping the same meaning'
            : tone === 'formal'
                ? 'Rewrite in a more formal tone'
                : tone === 'casual'
                    ? 'Rewrite in a more casual tone'
                    : tone === 'shorter'
                        ? 'Rewrite to be shorter while keeping the meaning'
                        : tone === 'longer'
                            ? 'Expand with more detail while keeping the meaning'
                            : 'Improve clarity, grammar, and flow';
        return `${ctxLine}${instruction}: ${text}`;
    }
    if (task === 'summarize') {
        return `${ctxLine}Summarize: ${text}`;
    }
    return `${ctxLine}Fix grammar: ${text}`;
}
/**
 * Walk every text leaf inside `fragment` and replace its text with
 * the model's response, keeping the node's marks intact. Block
 * structure (paragraphs, headings, list items, tables) passes
 * through via `node.copy(newContent)` — the same recipe
 * `translateFragment` uses.
 *
 * Rejects on the first model error so the caller can surface it
 * without leaving the popover in a half-applied state.
 */
export function rewriteFragment(fragment, schema, task, opts, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        const children = [];
        for (let i = 0; i < fragment.childCount; i++) {
            const node = fragment.child(i);
            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                throw new DOMException('Aborted', 'AbortError');
            if (node.isText && node.text) {
                const prompt = buildPrompt(task, node.text, opts);
                const out = yield runTask(task, prompt, signal);
                const cleaned = (out !== null && out !== void 0 ? out : '').trim() || node.text;
                children.push(schema.text(cleaned, node.marks));
            }
            else if (node.isLeaf) {
                children.push(node);
            }
            else {
                const newContent = yield rewriteFragment(node.content, schema, task, opts, signal);
                children.push(node.copy(newContent));
            }
        }
        return Fragment.fromArray(children);
    });
}
/**
 * Sample text around the selection so the model has anchor context.
 * Up to `max` chars on each side. Stops at paragraph boundaries so
 * we don't feed multi-section noise.
 */
export function sampleContext(doc, from, to, max = 240) {
    const start = Math.max(0, from - max);
    const end = Math.min(doc.content.size, to + max);
    const before = doc.textBetween(start, from, ' ', ' ').trim();
    const after = doc.textBetween(to, end, ' ', ' ').trim();
    return { before, after };
}
//# sourceMappingURL=rewriteFragment.js.map