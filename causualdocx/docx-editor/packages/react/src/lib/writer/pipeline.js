/**
 * Pipeline — single entry point ChatPanel uses for every user message.
 *
 * Flow:
 *
 *   user message
 *      │
 *      ▼
 *   classifyIntent  →  { intent, args } (Llama, JSON-mode constrained)
 *      │
 *      ▼
 *   route to the matching Tool
 *      │
 *      ▼
 *   ToolResult discriminated union
 *
 * The pipeline owns the abort signal, the assembled tool context, and
 * the (intentionally limited) chat history. ChatPanel just renders the
 * result by `kind`.
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
import { classifyIntent } from './intents';
import { getTool } from './tools/registry';
export function runPipeline(req, ctxBase, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const ctx = Object.assign(Object.assign({}, ctxBase), { signal });
        const hasSelection = ctxBase.getSelectionText().trim().length > 0;
        const intent = yield classifyIntent(req.message, { hasSelection }, signal);
        // Route. Each branch hands the user-supplied args to the tool with
        // sane defaults so a sparse classifier output still produces a
        // reasonable result.
        let result;
        switch (intent.intent) {
            case 'insertTable':
                result = yield getTool('insertTable').execute({
                    topic: (_a = intent.topic) !== null && _a !== void 0 ? _a : req.message,
                    rows: intent.rows,
                    cols: intent.cols,
                }, ctx);
                break;
            case 'summarize':
                result = yield getTool('summarize').execute({ selectionOnly: hasSelection && /selection|selected/i.test(req.message) }, ctx);
                break;
            case 'rewrite':
                result = yield getTool('rewrite').execute({ tone: intent.tone, instruction: intent.topic }, ctx);
                break;
            case 'outline':
                result = yield getTool('outline').execute({
                    topic: (_b = intent.topic) !== null && _b !== void 0 ? _b : req.message,
                    kind: guessKind(req.message),
                }, ctx);
                break;
            case 'transformDoc':
                result = yield getTool('transformDoc').execute({
                    target: (_c = intent.transformTarget) !== null && _c !== void 0 ? _c : 'resume',
                    instruction: intent.instruction,
                }, ctx);
                break;
            case 'research':
                result = yield getTool('research').execute({ query: (_d = intent.query) !== null && _d !== void 0 ? _d : req.message }, ctx);
                break;
            case 'translate':
            case 'findIssues':
                // Not yet implemented as a tool — fall through to chat with a
                // hint so the model gives a usable manual reply instead of
                // throwing. Will be replaced by dedicated tools in the next pass.
                result = yield getTool('chat').execute({
                    message: req.message,
                    history: req.history,
                    includeDocContext: req.includeDocContext,
                    includeSelection: req.includeSelection,
                    onDelta: req.onDelta,
                }, ctx);
                break;
            case 'chat':
            default:
                result = yield getTool('chat').execute({
                    message: req.message,
                    history: req.history,
                    includeDocContext: req.includeDocContext,
                    includeSelection: req.includeSelection,
                    onDelta: req.onDelta,
                }, ctx);
                break;
        }
        return Object.assign(Object.assign({}, result), { intent: intent.intent });
    });
}
function guessKind(message) {
    const m = message.toLowerCase();
    if (/\bmemo\b/.test(m))
        return 'memo';
    if (/\bessay\b/.test(m))
        return 'essay';
    if (/\bletter\b/.test(m))
        return 'letter';
    if (/\breport\b/.test(m))
        return 'report';
    if (/\barticle\b/.test(m))
        return 'article';
    return undefined;
}
//# sourceMappingURL=pipeline.js.map