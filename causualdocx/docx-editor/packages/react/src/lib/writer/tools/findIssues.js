/**
 * findIssues tool — proof-reads the selection (or full doc when
 * nothing's selected) and returns a structured list of issues so the
 * chat bubble can render them as actionable cards.
 *
 * Why a tool (vs raw "list typos"):
 *  - Llama-1B free-form output for proofreading tends to be one of
 *    two failure modes: either it rewrites the whole passage in its
 *    own voice, or it hallucinates issues that aren't there. A JSON
 *    schema with explicit {original, suggestion, reason, kind} fields
 *    keeps it honest — it can only emit issues that fit the shape.
 *  - The result is a CHAT bubble (formatted as a list), not a
 *    document edit. Users typically want to look at the list and
 *    decide which suggestions to apply by hand. Direct insertion of
 *    an "improved" passage is what `applyRewrite` is for.
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
import { runJsonChat } from '../jsonMode';
const SCHEMA = {
    type: 'object',
    properties: {
        issues: {
            type: 'array',
            minItems: 0,
            maxItems: 10,
            items: {
                type: 'object',
                properties: {
                    kind: { type: 'string', enum: ['typo', 'grammar', 'awkward', 'redundant'] },
                    original: { type: 'string', minLength: 1, maxLength: 160 },
                    suggestion: { type: 'string', minLength: 1, maxLength: 200 },
                    reason: { type: 'string', maxLength: 160 },
                },
                required: ['kind', 'original', 'suggestion'],
            },
        },
    },
    required: ['issues'],
};
const SYSTEM = `You are a careful copy editor reading a passage for issues.

Return a JSON object with an "issues" array. Each issue must have:
- "kind": one of "typo" (spelling), "grammar" (rules), "awkward" (clunky phrasing), "redundant" (filler).
- "original": EXACT substring from the user's passage (≤ 160 chars). Must be a literal copy — do not paraphrase.
- "suggestion": the corrected version.
- "reason": short one-line explanation (optional).

Rules:
- Only report REAL issues. Empty issues array is fine if the passage is clean.
- Do not invent issues. If you're unsure, leave it out.
- Do not rewrite the whole passage. Keep each "original" focused on the problem.
- Output ONLY the JSON object.`;
// Cap the scanned text so the call always fits the 4096 ctx window
// even when summed with the system prompt and JSON output budget.
const SCAN_CAP = 3500;
const KIND_LABEL = {
    typo: 'Typo',
    grammar: 'Grammar',
    awkward: 'Awkward',
    redundant: 'Redundant',
};
export const findIssuesTool = {
    name: 'findIssues',
    description: 'Find typos and weak phrasing in the selection (or document).',
    execute(args, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const raw = args.selectionOnly
                ? ctx.getSelectionText().trim()
                : ctx.getSelectionText().trim() || ctx.getDocText().trim();
            if (!raw) {
                return { kind: 'error', message: 'There is no text to scan.' };
            }
            const passage = raw.slice(0, SCAN_CAP);
            const truncated = raw.length > SCAN_CAP;
            let out;
            try {
                out = yield runJsonChat([
                    { role: 'system', content: SYSTEM },
                    { role: 'user', content: `Passage:\n\n${passage}` },
                ], { schema: SCHEMA, maxTokens: 600, temperature: 0.15, signal: ctx.signal });
            }
            catch (err) {
                return { kind: 'error', message: `Proofread failed — ${err.message}` };
            }
            const issues = ((_a = out.issues) !== null && _a !== void 0 ? _a : []).filter((i) => { var _a, _b; return ((_a = i.original) === null || _a === void 0 ? void 0 : _a.trim()) && ((_b = i.suggestion) === null || _b === void 0 ? void 0 : _b.trim()); });
            if (issues.length === 0) {
                return {
                    kind: 'chat',
                    text: 'No issues found in the passage. Looks clean!',
                };
            }
            // Render as a markdown bullet list the Markdown component already
            // knows how to paint in chat bubbles.
            const lines = issues.map((i) => {
                var _a;
                const label = (_a = KIND_LABEL[i.kind]) !== null && _a !== void 0 ? _a : 'Issue';
                const reason = i.reason ? ` — ${i.reason}` : '';
                return `- **${label}**: \`${i.original}\` → \`${i.suggestion}\`${reason}`;
            });
            const header = `Found **${issues.length}** issue${issues.length === 1 ? '' : 's'}${truncated ? ' (scanned first 3.5 KB):' : ':'}`;
            return {
                kind: 'chat',
                text: `${header}\n${lines.join('\n')}`,
            };
        });
    },
};
//# sourceMappingURL=findIssues.js.map