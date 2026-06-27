/**
 * Translate helpers — shared between the TranslateDialog (preview),
 * the right-click quick-translate, and the full-document
 * TranslateDocumentDialog.
 *
 * Backend: MyMemory free public endpoint. No API key. The free tier
 * is rate-limited (~5 req/sec, daily char quota), so we layer three
 * reliability tricks on top of the raw fetch:
 *
 *  1. An in-memory cache keyed by `${source}|${target}|${text}` so
 *     language-flips / re-runs don't re-hit the network for inputs
 *     we've already seen.
 *  2. Exponential backoff on 429 / 5xx with a small retry budget.
 *  3. Skip empty / whitespace-only / no-letter runs (punctuation,
 *     pure digits) — there's no value in translating "," and they
 *     burn quota.
 *
 * `translateFragment` reports progress through an optional callback
 * so the dialog can keep the user informed during long docs.
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
import { isLlmReady, runChat } from './writer/controller';
import { tryParseJson } from './writer/jsonMode';
const cache = new Map();
// Short retry budget. The longer 4-sec wait the old code did meant a
// rate-limited run took 6.6 seconds before giving up — on an 18-run
// doc that's 2 minutes of stuck progress when MyMemory throttles.
// One quick retry then fail fast lets the dialog show a real error.
const RETRY_DELAYS_MS = [400];
// MyMemory's free tier has a daily char quota. When we hit it the
// dialog used to dead-end. Lingva.ml is a CORS-friendly Google
// Translate proxy (Apache-2.0) — slightly different lang-code shape
// but covers the same major languages. We fall back to it
// per-request when MyMemory returns 429 / quota-exceeded, and
// remember the failure so subsequent requests skip MyMemory entirely
// until the user reloads.
let myMemoryDown = false;
const LINGVA_BASE = 'https://lingva.ml/api/v1';
// How many BATCHES to translate in parallel inside
// `translateFragment`. Each batch can carry multiple text runs joined
// by a separator (see BATCH_SEPARATOR), so the network-call count is
// number-of-batches, not number-of-runs. With paragraph-level
// batching this is typically 1 batch per paragraph; on a 200-page
// doc the count is hundreds, not thousands. MyMemory's free tier
// accepts ~5 req/sec so 4 parallel batches keeps us under.
const PARALLEL_TRANSLATIONS = 4;
// Sentinel used to join multiple text runs into a single API call.
// MyMemory's translator preserves the literal token across language
// boundaries in our manual testing (it's a printable ASCII triple
// that the model treats as opaque). We split on it after the
// response. Each batch caps at ~480 chars so we don't trip
// MyMemory's 500-char single-string limit.
const BATCH_SEPARATOR = ' |!| ';
const BATCH_CHAR_LIMIT = 460;
// Minimum gap between onProgress callbacks. Per-run callbacks made
// React re-render the dialog flicker-fast — visible flicker reported.
// 150 ms is one paint frame at most refresh rates without losing the
// "this is moving" perception.
const PROGRESS_THROTTLE_MS = 150;
function shouldSkip(text) {
    // Empty, whitespace, or no-letter runs (digits, punctuation only).
    // `\p{L}` covers every script's letters so non-Latin docs still
    // route real text through the API.
    if (!text || !text.trim())
        return true;
    return !/\p{L}/u.test(text);
}
/**
 * Translate a string. With the new paragraph-level batching in
 * `translateFragment`, this function receives ONE joined batch at a
 * time (not one text-run), so each call here is amortised across
 * many runs. That makes the on-device LLM path viable again: even at
 * 3-5 sec per call, a 50-paragraph doc completes in ~2-4 minutes
 * which is comparable to a rate-limited MyMemory sweep.
 *
 * Routing:
 *   1. LLM (Llama-3.2-1B) when the Advanced tier is loaded. No rate
 *      limit, no quota, deterministic privacy.
 *   2. MyMemory when no LLM is available (or when LLM declined).
 *      Cheap and fast, but quota-limited.
 *   3. Lingva.ml as MyMemory's CORS-friendly fallback when MyMemory
 *      throws (rate-limit, quota, network).
 */
export function translateText(text, source, target, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (source === target)
            return text;
        if (shouldSkip(text))
            return text;
        const key = `${source}|${target}|${text}`;
        const cached = cache.get(key);
        if (cached !== undefined)
            return cached;
        // 1. On-device LLM when available. Fails-soft to network backends.
        if (isLlmReady()) {
            try {
                const out = yield translateViaLlm(text, source, target, signal);
                cache.set(key, out);
                return out;
            }
            catch (err) {
                const e = err;
                if (e.name === 'AbortError')
                    throw e;
                // Fall through to network — better a slightly-different
                // translation than a hard error.
            }
        }
        // 2/3. Network path. If MyMemory has already failed this session,
        // skip straight to Lingva.
        if (myMemoryDown) {
            try {
                const out = yield translateViaLingva(text, source, target, signal);
                cache.set(key, out);
                return out;
            }
            catch (err) {
                const e = err;
                if (e.name === 'AbortError')
                    throw e;
                throw e;
            }
        }
        let lastErr = null;
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                throw new DOMException('Aborted', 'AbortError');
            try {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
                const res = yield fetch(url, { signal });
                if (res.status === 429 || res.status >= 500) {
                    throw new Error(`translate-http-${res.status}`);
                }
                if (!res.ok)
                    throw new Error(`translate-http-${res.status}`);
                const data = (yield res.json());
                // MyMemory occasionally returns 200 with a quota-exceeded payload;
                // surface it as a retryable error if `responseStatus` is 4xx-ish.
                const status = Number(data.responseStatus);
                if (Number.isFinite(status) && status >= 400) {
                    throw new Error(`translate-status-${status}`);
                }
                const out = (_a = data.responseData) === null || _a === void 0 ? void 0 : _a.translatedText;
                if (!out || typeof out !== 'string')
                    throw new Error('translate-empty');
                cache.set(key, out);
                return out;
            }
            catch (err) {
                const e = err;
                if (e.name === 'AbortError')
                    throw e;
                lastErr = e;
                const delay = RETRY_DELAYS_MS[attempt];
                if (delay === undefined)
                    break;
                yield sleep(delay, signal);
            }
        }
        // MyMemory fully exhausted retries — remember that for the rest of
        // this session and try Lingva as the last resort.
        myMemoryDown = true;
        try {
            const out = yield translateViaLingva(text, source, target, signal);
            cache.set(key, out);
            return out;
        }
        catch (err) {
            const e = err;
            if (e.name === 'AbortError')
                throw e;
            // Surface whichever error is more informative — usually the
            // original MyMemory failure (Lingva 404s on an unsupported lang
            // are less useful than "rate limited").
            throw lastErr !== null && lastErr !== void 0 ? lastErr : e;
        }
    });
}
/**
 * Translate via Lingva.ml — a CORS-friendly Apache-2.0 Google
 * Translate proxy. No key needed. Used as MyMemory's network fallback
 * and as the primary network path once `myMemoryDown` is set.
 */
function translateViaLingva(text, source, target, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        const sourceCode = source === 'auto' ? 'auto' : source;
        const url = `${LINGVA_BASE}/${encodeURIComponent(sourceCode)}/${encodeURIComponent(target)}/${encodeURIComponent(text)}`;
        const res = yield fetch(url, {
            headers: { Accept: 'application/json' },
            signal,
        });
        if (!res.ok)
            throw new Error(`lingva-http-${res.status}`);
        const data = (yield res.json());
        if (!data.translation)
            throw new Error('lingva-empty');
        return data.translation;
    });
}
/**
 * Translate via the on-device Llama-3.2-1B with JSON-mode response
 * to keep output structurally clean. Same shape as
 * `translateRangeTool` so the rules are familiar.
 */
function translateViaLlm(text, source, target, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const sourceName = (_a = LANG_NAME_BY_CODE[source]) !== null && _a !== void 0 ? _a : source;
        const targetName = (_b = LANG_NAME_BY_CODE[target]) !== null && _b !== void 0 ? _b : target;
        const system = `You are a professional translator. ` +
            `Translate the user's text from ${sourceName} into ${targetName}. ` +
            `Preserve proper nouns, technical terms, numbers, punctuation, and any " |!| " separators verbatim. ` +
            `Return ONLY a JSON object: {"translation": "<the translation>"}. ` +
            `No commentary, no quotation marks around the whole reply.`;
        const raw = yield runChat([
            { role: 'system', content: system },
            { role: 'user', content: text },
        ], {
            responseFormat: { type: 'json_object' },
            maxTokens: Math.min(1024, Math.ceil(text.length * 1.6) + 64),
            temperature: 0.15,
            signal,
        });
        const parsed = tryParseJson(raw);
        const out = ((_c = parsed === null || parsed === void 0 ? void 0 : parsed.translation) !== null && _c !== void 0 ? _c : '').trim();
        if (!out)
            throw new Error('translate-llm-empty');
        return out;
    });
}
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
function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        const id = setTimeout(resolve, ms);
        signal === null || signal === void 0 ? void 0 : signal.addEventListener('abort', () => {
            clearTimeout(id);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
/**
 * Recursively translate every text leaf in `fragment`, preserving the
 * block structure (paragraphs, headings, lists, tables) and the marks
 * on each text node. Skipped / cached runs don't count against
 * progress totals so the bar reflects real work.
 *
 * Strategy:
 *   1. Walk the fragment once to enumerate every translatable text
 *      run with a deterministic id. Skipped / cache-hit runs are
 *      resolved here so the worker pool only does network work.
 *   2. Run up to `PARALLEL_TRANSLATIONS` network calls concurrently
 *      via a small worker pool. Cuts wall-clock by ~4x vs sequential
 *      while staying under MyMemory's free-tier rate limit.
 *   3. Stitch the translated strings back into a new Fragment with the
 *      original marks intact.
 *   4. Throttle `onProgress` to every PROGRESS_THROTTLE_MS so the
 *      dialog doesn't flicker on every completion.
 */
export function translateFragment(fragment_1, schema_1, source_1, target_1, signal_1) {
    return __awaiter(this, arguments, void 0, function* (fragment, schema, source, target, signal, opts = {}) {
        if (source === target)
            return fragment;
        // 1) Walk + collect translatable runs. Skips and cache hits resolve
        //    here; the worker pool only sees uncached runs that need network.
        const allRuns = [];
        const resolved = new Map();
        let nextId = 0;
        fragment.descendants((node) => {
            var _a;
            if (!node.isText)
                return true;
            const text = (_a = node.text) !== null && _a !== void 0 ? _a : '';
            const id = nextId++;
            if (shouldSkip(text)) {
                resolved.set(id, text);
                return false;
            }
            const cached = cache.get(`${source}|${target}|${text}`);
            if (cached !== undefined) {
                resolved.set(id, cached);
                return false;
            }
            allRuns.push({ id, text });
            return false;
        });
        const totalRuns = allRuns.length;
        // 2) Pack runs into batches so a paragraph of 18 text-runs becomes
        //    one API call (or two if total length > BATCH_CHAR_LIMIT). For
        //    a 200-page doc this cuts MyMemory hits from ~5000 to ~200.
        const batches = [];
        {
            let current = {
                ids: [],
                joined: '',
                runTexts: [],
            };
            const flush = () => {
                if (current.ids.length === 0)
                    return;
                batches.push(current);
                current = { ids: [], joined: '', runTexts: [] };
            };
            for (const run of allRuns) {
                const segment = run.text;
                const projected = current.joined.length
                    ? current.joined.length + BATCH_SEPARATOR.length + segment.length
                    : segment.length;
                if (current.ids.length > 0 && projected > BATCH_CHAR_LIMIT)
                    flush();
                // A single run longer than the limit ships solo — MyMemory may
                // still complain but at least we send the whole text rather
                // than truncating it.
                if (current.ids.length > 0)
                    current.joined += BATCH_SEPARATOR;
                current.joined += segment;
                current.ids.push(run.id);
                current.runTexts.push(segment);
            }
            flush();
        }
        let completedRuns = 0;
        let lastEmit = 0;
        const emit = (force = false) => {
            var _a;
            const now = Date.now();
            if (!force && now - lastEmit < PROGRESS_THROTTLE_MS)
                return;
            lastEmit = now;
            // The dialog displays "X of Y text runs" — keep the same units so
            // the existing UI copy stays accurate.
            (_a = opts.onProgress) === null || _a === void 0 ? void 0 : _a.call(opts, { completed: completedRuns, total: totalRuns });
        };
        emit(true);
        // 3) Worker pool — up to PARALLEL_TRANSLATIONS batches in flight.
        let cursor = 0;
        let firstError = null;
        function worker() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                while (true) {
                    if (signal === null || signal === void 0 ? void 0 : signal.aborted)
                        throw new DOMException('Aborted', 'AbortError');
                    if (firstError)
                        return;
                    const idx = cursor++;
                    if (idx >= batches.length)
                        return;
                    const batch = batches[idx];
                    try {
                        // Cache lookup at batch granularity isn't useful because the
                        // joined text changes with run order; per-run caching still
                        // applies on the next translate-call because we populate the
                        // cache as soon as a run completes.
                        const translated = yield translateText(batch.joined, source, target, signal);
                        const parts = splitBatchResponse(translated, batch.runTexts.length);
                        for (let i = 0; i < batch.ids.length; i++) {
                            const id = batch.ids[i];
                            const originalText = batch.runTexts[i];
                            const piece = ((_a = parts[i]) !== null && _a !== void 0 ? _a : originalText).trim();
                            resolved.set(id, piece);
                            // Populate the per-run cache too so subsequent translate
                            // calls for repeated text hit the cache.
                            cache.set(`${source}|${target}|${originalText}`, piece);
                        }
                        completedRuns += batch.ids.length;
                        emit();
                    }
                    catch (err) {
                        const e = err;
                        if (e.name === 'AbortError')
                            throw e;
                        if (!firstError)
                            firstError = e;
                    }
                }
            });
        }
        const poolSize = Math.min(PARALLEL_TRANSLATIONS, batches.length);
        const pool = Array.from({ length: poolSize }, () => worker());
        yield Promise.all(pool);
        if (firstError)
            throw firstError;
        emit(true);
        // Stitch results back into a new Fragment.
        nextId = 0;
        return reassemble(fragment, schema, resolved, () => nextId++);
    });
}
function reassemble(fragment, schema, resolved, nextId) {
    var _a, _b;
    const children = [];
    for (let i = 0; i < fragment.childCount; i++) {
        const node = fragment.child(i);
        if (node.isText) {
            const id = nextId();
            const translated = (_b = (_a = resolved.get(id)) !== null && _a !== void 0 ? _a : node.text) !== null && _b !== void 0 ? _b : '';
            children.push(schema.text(translated, node.marks));
        }
        else if (node.isLeaf) {
            children.push(node);
        }
        else {
            const newContent = reassemble(node.content, schema, resolved, nextId);
            children.push(node.copy(newContent));
        }
    }
    return Fragment.fromArray(children);
}
// The previous sequential `walk` and per-iteration `yieldToMainThread`
// are gone — replaced by the worker-pool model in `translateFragment`
// above. Throttled progress updates make manual yields unnecessary.
/**
 * Split a batched-translation response back into per-run pieces. We
 * sent BATCH_SEPARATOR between runs; the model usually preserves it
 * verbatim, but variants happen — extra spaces, the separator
 * collapsed to a single bar, etc. The split is permissive: matches
 * the separator with any internal whitespace AND falls back to a
 * single-string return when the response can't be split into the
 * expected count (caller assigns the joined result to the first run
 * and leaves the others to their originals).
 */
function splitBatchResponse(joined, expectedCount) {
    if (expectedCount === 1)
        return [joined];
    // Permissive split — collapse the separator's literal form plus a
    // common "|!|" or "| ! |" variant the model occasionally produces.
    const re = /\s*\|\s*!\s*\|\s*/g;
    const parts = joined.split(re);
    if (parts.length === expectedCount)
        return parts;
    // Imperfect split — best effort: pad with empty strings if short,
    // truncate if long. The caller falls back to the original run text
    // for empty pieces.
    if (parts.length < expectedCount) {
        while (parts.length < expectedCount)
            parts.push('');
        return parts;
    }
    return parts.slice(0, expectedCount);
}
/**
 * For tests / dev tools — wipe the in-memory translation cache.
 */
export function clearTranslateCacheForTests() {
    cache.clear();
}
/**
 * Top-ten globally-spoken languages plus a few that round out coverage.
 * Codes match MyMemory's ISO 639-1 expectations.
 */
export const TRANSLATE_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'nl', label: 'Dutch' },
    { code: 'pl', label: 'Polish' },
    { code: 'tr', label: 'Turkish' },
    { code: 'ar', label: 'Arabic' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese (Simplified)' },
];
//# sourceMappingURL=translate.js.map