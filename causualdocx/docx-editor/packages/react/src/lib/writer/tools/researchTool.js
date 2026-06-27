/**
 * researchTool — Wikipedia-backed lookup the assistant can call when
 * the user asks a knowledge question ("what is ATS?", "look up
 * Hemingway", "find info on resume formats").
 *
 * Why Wikipedia: the REST summary endpoint is CORS-enabled for all
 * origins, requires no API key, and returns a calibrated 1-3 sentence
 * lead extract for the article. That's the right grain for an inline
 * chat reply — terse enough to fit the chat bubble, factual enough to
 * not hallucinate. Source: https://en.wikipedia.org/api/rest_v1/
 *
 * Two stages:
 *   1. Disambiguate — `/page/title/{q}` returns the best match for a
 *      query (handles "ATS" → "Applicant tracking system" etc.).
 *   2. Summarise — `/page/summary/{title}` returns `{title, extract,
 *      content_urls.desktop.page, thumbnail}`.
 *
 * Failure modes (always degrade gracefully):
 *   - 404: term not found → return a chat reply that says so + suggest
 *     the user rephrase. No throw.
 *   - Network error / offline: return a chat reply explaining the
 *     lookup couldn't run. The chatReply tool stays available for the
 *     user's follow-up question without it.
 *   - Rate-limit: Wikipedia is generous; if we hit one anyway, surface
 *     the 429 + suggest retry.
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
const SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const DISAMBIG_BASE = 'https://en.wikipedia.org/w/api.php';
function searchTitle(query, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        // Use the action API's `opensearch` style endpoint for best-match
        // title resolution. CORS-enabled, no key.
        const url = new URL(DISAMBIG_BASE);
        url.searchParams.set('action', 'query');
        url.searchParams.set('list', 'search');
        url.searchParams.set('srsearch', query);
        url.searchParams.set('srlimit', '1');
        url.searchParams.set('format', 'json');
        url.searchParams.set('origin', '*');
        const res = yield fetch(url.toString(), { signal });
        if (!res.ok)
            return null;
        const data = (yield res.json());
        const top = (_b = (_a = data.query) === null || _a === void 0 ? void 0 : _a.search) === null || _b === void 0 ? void 0 : _b[0];
        return (_c = top === null || top === void 0 ? void 0 : top.title) !== null && _c !== void 0 ? _c : null;
    });
}
function fetchSummary(title, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${SUMMARY_BASE}${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
        const res = yield fetch(url, {
            headers: { Accept: 'application/json' },
            signal,
        });
        if (res.status === 404)
            return null;
        if (!res.ok) {
            throw new Error(`Wikipedia ${res.status}`);
        }
        return (yield res.json());
    });
}
function stripQuestionPunctuation(q) {
    return q
        .replace(/^\s*(?:what(?:'s| is)?|who(?:'s| is)?|tell me about|look up|search for|find info on|define)\s+/i, '')
        .replace(/[?!.]+\s*$/g, '')
        .trim();
}
export const researchTool = {
    name: 'research',
    description: 'Look up a topic on Wikipedia and return a brief factual summary.',
    execute(args, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const raw = ((_a = args.query) !== null && _a !== void 0 ? _a : '').trim();
            if (!raw) {
                return {
                    kind: 'error',
                    message: "Tell me what to look up — e.g. 'what is an ATS-friendly resume?'.",
                };
            }
            const cleaned = stripQuestionPunctuation(raw) || raw;
            const t0 = Date.now();
            try {
                // 1. Direct summary attempt — fast path when the query matches a
                //    canonical article title.
                let summary = yield fetchSummary(cleaned, ctx.signal);
                // 2. Disambiguation / not-found → fall back to search-then-summary.
                if (!summary || summary.type === 'disambiguation') {
                    const best = yield searchTitle(cleaned, ctx.signal);
                    if (best)
                        summary = yield fetchSummary(best, ctx.signal);
                }
                if (!summary || !summary.extract) {
                    return {
                        kind: 'chat',
                        text: `I couldn't find a Wikipedia article matching "${cleaned}". Try rephrasing, or ask me a more specific question.`,
                        meta: { tool: 'research', elapsedMs: Date.now() - t0 },
                    };
                }
                const link = (_c = (_b = summary.content_urls) === null || _b === void 0 ? void 0 : _b.desktop) === null || _c === void 0 ? void 0 : _c.page;
                const title = (_d = summary.title) !== null && _d !== void 0 ? _d : cleaned;
                const extract = summary.extract.trim();
                const reply = link
                    ? `**${title}** — ${extract}\n\n[Wikipedia](${link})`
                    : `**${title}** — ${extract}`;
                return {
                    kind: 'chat',
                    text: reply,
                    meta: { tool: 'research', elapsedMs: Date.now() - t0 },
                };
            }
            catch (err) {
                const e = err;
                if (e.name === 'AbortError')
                    throw e;
                return {
                    kind: 'chat',
                    text: `Couldn't reach Wikipedia (${e.message}). Try again, or rephrase the question and I'll answer from my training knowledge instead.`,
                    meta: { tool: 'research', elapsedMs: Date.now() - t0 },
                };
            }
        });
    },
};
//# sourceMappingURL=researchTool.js.map