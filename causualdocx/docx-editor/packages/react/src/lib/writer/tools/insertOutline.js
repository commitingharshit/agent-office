/**
 * insertOutline tool — builds a structured outline (memo / essay /
 * report) directly as PM heading + paragraph nodes.
 *
 * The previous chat path produced bracketed placeholders like
 * `[Your Editor's Name]` and `[Date]` because the model defaulted to
 * a stale memo template it had seen in pre-training. We fix that two
 * ways:
 *
 *  1. JSON schema forces sections with `heading` + `content` strings.
 *     The model can't emit raw `[brackets]` because the schema
 *     describes the artefact (heading text, body text), not a
 *     template form.
 *  2. The system prompt explicitly forbids placeholder text.
 *
 * Sections land in the doc as heading paragraphs (bold, sized by
 * level) followed by body paragraphs — same nodes the layout-painter
 * already knows how to render.
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
import { markdownToFragment } from '../markdownToFragment';
import { combineValidators, noPlaceholderValidator, runJsonChatWithValidation, } from '../validateAndRetry';
const SCHEMA = {
    type: 'object',
    properties: {
        title: { type: 'string', minLength: 1, maxLength: 80 },
        sections: {
            type: 'array',
            minItems: 3,
            maxItems: 6,
            items: {
                type: 'object',
                properties: {
                    heading: { type: 'string', minLength: 1, maxLength: 60 },
                    content: { type: 'string', minLength: 20, maxLength: 600 },
                },
                required: ['heading', 'content'],
            },
        },
    },
    required: ['title', 'sections'],
};
function systemPromptFor(kind) {
    return `You generate the content for a ${kind} that will be inserted into a Word document.

Return a JSON object with:
- "title": short title for the document (3-10 words).
- "sections": 3-5 sections, each with:
  - "heading": short section heading (2-6 words).
  - "content": 1-2 paragraphs of real, specific prose for that section. Plain text. No markdown. No bullet points.

Critical rules:
- Write REAL content, not a template. Never use bracketed placeholders like [Your Name], [Date], [Recipient], [Insert here].
- Be specific to the user's topic. If a name or date is needed, leave it out or describe it generically ("the project lead", "later this quarter").
- Each section's content must be self-contained and immediately usable.
- Output ONLY the JSON object. No commentary, no markdown fences.`;
}
export const insertOutlineTool = {
    name: 'outline',
    description: 'Insert a structured outline (memo, essay, report) into the document.',
    execute(args, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const kind = (args.kind || guessKind(args.topic) || 'memo').toLowerCase();
            const topic = ((_a = args.topic) !== null && _a !== void 0 ? _a : '').trim() || 'general subject';
            // Semantic check: every section must have a non-empty heading +
            // non-trivial body. Catches the model returning an array of empty
            // shells that the JSON schema's `minLength` thresholds didn't.
            const semanticOutlineValidator = (o) => {
                var _a;
                const issues = [];
                const secs = (_a = o.sections) !== null && _a !== void 0 ? _a : [];
                secs.forEach((s, i) => {
                    var _a, _b, _c;
                    if (!((_a = s.heading) === null || _a === void 0 ? void 0 : _a.trim())) {
                        issues.push({
                            field: `sections[${i}].heading`,
                            text: '',
                            reason: 'is empty',
                        });
                    }
                    if (!((_b = s.content) === null || _b === void 0 ? void 0 : _b.trim()) || s.content.trim().length < 30) {
                        issues.push({
                            field: `sections[${i}].content`,
                            text: ((_c = s.content) !== null && _c !== void 0 ? _c : '').slice(0, 60),
                            reason: 'is empty or shorter than 30 chars — write real prose',
                        });
                    }
                });
                return issues;
            };
            let outline;
            try {
                outline = yield runJsonChatWithValidation([
                    { role: 'system', content: systemPromptFor(kind) },
                    {
                        role: 'user',
                        content: `${kind.charAt(0).toUpperCase() + kind.slice(1)} topic: ${topic}`,
                    },
                ], {
                    schema: SCHEMA,
                    maxTokens: 900,
                    temperature: 0.5,
                    signal: ctx.signal,
                    validator: combineValidators(noPlaceholderValidator, semanticOutlineValidator),
                });
            }
            catch (err) {
                return { kind: 'error', message: `Couldn't draft the outline — ${err.message}` };
            }
            const sections = ((_b = outline.sections) !== null && _b !== void 0 ? _b : []).filter((s) => { var _a, _b; return ((_a = s.heading) === null || _a === void 0 ? void 0 : _a.trim()) && ((_b = s.content) === null || _b === void 0 ? void 0 : _b.trim()); });
            if (sections.length === 0) {
                return { kind: 'error', message: 'Model returned no sections.' };
            }
            const view = ctx.getView();
            if (!view)
                return { kind: 'error', message: 'Editor is not focused.' };
            // Build markdown that markdownToFragment already supports —
            // headings (`#`) + paragraphs — then route through the tracked-
            // change apply path so the user can accept/reject.
            const lines = [];
            if (outline.title)
                lines.push(`# ${outline.title}`);
            for (const s of sections) {
                lines.push('');
                lines.push(`## ${s.heading.trim()}`);
                lines.push('');
                lines.push(s.content.trim());
            }
            const md = lines.join('\n');
            // Phase 2: stage as a proposal. Markdown → PM fragment up front so
            // the popover can render a meaningful preview AND the host can
            // commit without reparsing.
            const fragment = markdownToFragment(md, ctx.schema);
            if (fragment.childCount === 0) {
                return { kind: 'error', message: 'Model returned an outline that produced no PM nodes.' };
            }
            return {
                kind: 'proposal',
                what: 'outline',
                summary: `Outline — “${outline.title}” · ${sections.length} sections`,
                fragment,
                // Outline is fresh content inserted at cursor — no selection to
                // overwrite. Replace falls back to Insert at cursor in the
                // popover's commit row.
                replaceRange: null,
                intent: 'outline',
                asTrackedChange: true,
            };
        });
    },
};
function guessKind(topic) {
    const t = topic.toLowerCase();
    if (/\bmemo\b/.test(t))
        return 'memo';
    if (/\bessay\b/.test(t))
        return 'essay';
    if (/\bletter\b/.test(t))
        return 'letter';
    if (/\breport\b/.test(t))
        return 'report';
    if (/\barticle\b/.test(t))
        return 'article';
    return null;
}
//# sourceMappingURL=insertOutline.js.map