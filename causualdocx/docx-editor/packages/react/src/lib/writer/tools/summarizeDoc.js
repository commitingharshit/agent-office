/**
 * summarizeDoc tool — produces a coherent summary that always fits in
 * Llama-1B's 4096-token context window.
 *
 * The previous chat path stuffed the entire document into the system
 * prompt and hoped — that gave us "Prompt tokens exceed context
 * window size: 4687; context window size: 4096" for any non-trivial
 * doc. Here we chunk first, then map-reduce.
 *
 * Strategy:
 *   1. If the doc fits in one chunk (< ~6 KB chars ≈ 1.5 K tokens),
 *      do a single summary call.
 *   2. Otherwise split on paragraph boundaries into ~5 KB chunks,
 *      summarise each into 1-2 sentences, then summarise the
 *      concatenated chunk-summaries into the final 4-6 bullet output.
 *
 * Output is plain markdown (bullets + optional intro line). It lands
 * in the chat bubble — the user clicks **Insert at cursor** if they
 * want it in the doc.
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
import { runChat } from '../controller';
import { stripModelPreamble } from '../stripPreamble';
const ONE_PASS_LIMIT_CHARS = 5500;
const CHUNK_CHARS = 4500;
const MAX_CHUNKS = 8; // hard ceiling to keep total wallclock bounded.
const FINAL_SYSTEM = `You are a precise summariser. Produce a concise summary of the document as Markdown:
- One opening sentence describing what the document is about.
- 3-6 bullet points capturing the key facts / arguments / decisions.
- Plain language. No commentary. No quotation marks around the whole reply.`;
const CHUNK_SYSTEM = `You are summarising one section of a larger document.
Return 1-2 sentences capturing the most important facts in this section.
No commentary, no bullets, no quotation marks.`;
export const summarizeDocTool = {
    name: 'summarize',
    description: 'Summarise the document (or selection) into a few bullets.',
    execute(args, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const source = args.selectionOnly ? ctx.getSelectionText().trim() : ctx.getDocText().trim();
            if (!source) {
                return {
                    kind: 'error',
                    message: args.selectionOnly
                        ? 'Select some text first to summarise it.'
                        : 'The document is empty — nothing to summarise.',
                };
            }
            const t0 = Date.now();
            let text;
            try {
                text =
                    source.length <= ONE_PASS_LIMIT_CHARS
                        ? yield summariseOnePass(source, ctx.signal)
                        : yield summariseMapReduce(source, ctx.signal);
            }
            catch (err) {
                return {
                    kind: 'error',
                    message: `Summary failed — ${err.message}`,
                };
            }
            return {
                kind: 'chat',
                text: stripModelPreamble(text),
                meta: { tool: 'summarize', elapsedMs: Date.now() - t0 },
            };
        });
    },
};
function summariseOnePass(text, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        return runChat([
            { role: 'system', content: FINAL_SYSTEM },
            { role: 'user', content: `Document:\n\n${text}` },
        ], { maxTokens: 384, temperature: 0.3, signal });
    });
}
function summariseMapReduce(text, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunks = splitIntoChunks(text, CHUNK_CHARS).slice(0, MAX_CHUNKS);
        const partials = [];
        for (let i = 0; i < chunks.length; i++) {
            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                throw new DOMException('Aborted', 'AbortError');
            const partial = yield runChat([
                { role: 'system', content: CHUNK_SYSTEM },
                {
                    role: 'user',
                    content: `Section ${i + 1} of ${chunks.length}:\n\n${chunks[i]}`,
                },
            ], { maxTokens: 160, temperature: 0.2, signal });
            partials.push(`- ${partial.trim()}`);
        }
        const combined = partials.join('\n');
        return runChat([
            { role: 'system', content: FINAL_SYSTEM },
            {
                role: 'user',
                content: `Here are section-by-section notes about a longer document. Combine them into a single summary.\n\n${combined}`,
            },
        ], { maxTokens: 384, temperature: 0.3, signal });
    });
}
/**
 * Split text into paragraph-aligned chunks no larger than `maxChars`.
 * Falls back to hard splits inside very long paragraphs so a single
 * unbroken wall of text doesn't blow past the budget.
 */
function splitIntoChunks(text, maxChars) {
    const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
    const out = [];
    let current = '';
    for (const p of paragraphs) {
        if (p.length > maxChars) {
            if (current) {
                out.push(current);
                current = '';
            }
            for (let i = 0; i < p.length; i += maxChars) {
                out.push(p.slice(i, i + maxChars));
            }
            continue;
        }
        if (current.length + p.length + 2 > maxChars) {
            out.push(current);
            current = p;
        }
        else {
            current = current ? `${current}\n\n${p}` : p;
        }
    }
    if (current)
        out.push(current);
    return out.length > 0 ? out : [text.slice(0, maxChars)];
}
//# sourceMappingURL=summarizeDoc.js.map