/**
 * JSON-mode helper for the writer pipeline.
 *
 * Llama-3.2-1B is too small to write coherent free-form documents on
 * its own — but WebLLM's `response_format: { type: 'json_object',
 * schema }` clamps the model's vocabulary at every decoding step so
 * it can only emit tokens that keep the output syntactically valid.
 * That turns the 1B into a workable *structured* extractor: given a
 * topic, it can decide which fields to populate in a fixed schema,
 * which is exactly what tools like `insertTable` and the intent
 * classifier need.
 *
 * Two helpers:
 *
 *   - `runJsonChat<T>(messages, jsonSchema)` — wraps the controller's
 *     `runChat` with `responseFormat`, parses the reply, validates
 *     it's an object, and returns it typed.
 *   - `tryParseJson` — defensive parser for the (rare) case where the
 *     constrained engine still emits unparseable output (model OOM,
 *     truncation at `max_tokens`). Returns `null` instead of throwing
 *     so callers can fall back gracefully.
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
import { runChat } from './controller';
export function runJsonChat(messages_1) {
    return __awaiter(this, arguments, void 0, function* (messages, opts = {}) {
        var _a, _b;
        const raw = yield runChat(messages, {
            responseFormat: {
                type: 'json_object',
                schema: opts.schema ? JSON.stringify(opts.schema) : undefined,
            },
            maxTokens: (_a = opts.maxTokens) !== null && _a !== void 0 ? _a : 512,
            // Lower temperature for structured generation — variety hurts
            // when the schema already pins the shape.
            temperature: (_b = opts.temperature) !== null && _b !== void 0 ? _b : 0.2,
            signal: opts.signal,
        });
        const parsed = tryParseJson(raw);
        if (parsed === null) {
            throw new Error(`Model returned invalid JSON: ${raw.slice(0, 120)}`);
        }
        return parsed;
    });
}
export function tryParseJson(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return null;
    // Strip ``` fences if a model wraps the JSON despite response_format
    // (older WebLLM builds occasionally do for the first chunk).
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    const candidate = fenced ? fenced[1] : trimmed;
    try {
        return JSON.parse(candidate);
    }
    catch (_a) {
        // Try to recover by finding the first JSON object substring.
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start)
            return null;
        try {
            return JSON.parse(candidate.slice(start, end + 1));
        }
        catch (_b) {
            return null;
        }
    }
}
//# sourceMappingURL=jsonMode.js.map