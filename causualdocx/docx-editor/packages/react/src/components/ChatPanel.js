var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ChatPanel — right-docked chat surface for the on-device LLM.
 * Streams Llama-3.2-1B's reply tokens into the message bubble as
 * they arrive so the UX matches a hosted chat assistant. Optional
 * "Use document context" sends a truncated snapshot of the open
 * document as system context so the user can ask "what does this
 * doc say about …" / "summarise section 3" without copy-paste.
 *
 * Chat is gated on the Advanced LLM tier being loaded — the flan-t5
 * small model isn't conversational and would produce nonsense, so
 * the panel renders a hint pointing the user at the Writing
 * Assistant sheet when the LLM isn't resident.
 */
import { useEffect, useMemo, useRef, useState, } from 'react';
import { useWriterState } from '../lib/writer/controller';
import { runPipeline } from '../lib/writer/pipeline';
import { getQuickPromptsForDoc } from '../lib/writer/suggestActions';
import { Markdown } from '../lib/markdown';
import { RightDockPanel } from './RightDockPanel';
import { MaterialSymbol } from './ui/Icons';
// Layout (root container + header + close button) now lives in
// `RightDockPanel`. Only the panel-specific surfaces below stay local.
const clearBtnStyle = {
    fontSize: 11,
    padding: '3px 9px',
    borderRadius: 4,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'transparent',
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    cursor: 'pointer',
};
const selChipRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderBottom: '1px solid var(--doc-border, #e0e0e0)',
};
function selChipStyle(active) {
    return {
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 99,
        border: `1px solid ${active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-border, #d1d5db)'}`,
        background: active ? 'var(--doc-primary-light, #e8f0fe)' : 'transparent',
        color: active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-text-on-surface-muted, #5f6368)',
        cursor: 'pointer',
    };
}
const bodyStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};
const emptyStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: 'var(--doc-text-muted, #6b7280)',
    fontSize: 12,
    textAlign: 'center',
    padding: 24,
    gap: 8,
};
const bubbleBase = {
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    maxWidth: '88%',
};
const userBubbleStyle = Object.assign(Object.assign({}, bubbleBase), { alignSelf: 'flex-end', background: 'var(--doc-primary, #1a73e8)', color: 'white', borderBottomRightRadius: 4 });
const assistantBubbleStyle = Object.assign(Object.assign({}, bubbleBase), { alignSelf: 'flex-start', background: 'var(--doc-surface-sunken, #f1f3f4)', color: 'var(--doc-text-on-surface, #1f2937)', borderBottomLeftRadius: 4 });
const ctxRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--doc-text-muted, #6b7280)',
    padding: '4px 16px',
    borderBottom: '1px solid var(--doc-border, #e0e0e0)',
};
const slashPopoverStyle = {
    borderTop: '1px solid var(--doc-border, #e0e0e0)',
    background: 'var(--doc-surface, white)',
    maxHeight: 220,
    overflow: 'auto',
    padding: '4px 0',
};
const slashItemStyle = {
    display: 'grid',
    gridTemplateColumns: '70px 1fr auto',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 14px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 12,
};
const slashCmdStyle = {
    fontFamily: 'Consolas, "SF Mono", Menlo, monospace',
    color: 'var(--doc-primary, #1a73e8)',
    fontSize: 12,
};
const slashLabelStyle = {
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const slashHintStyle = {
    color: 'var(--doc-text-muted, #6b7280)',
    fontSize: 11,
};
const inputRowStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '10px 12px',
    borderTop: '1px solid var(--doc-border, #e0e0e0)',
    flexShrink: 0,
};
const textareaStyle = {
    flex: 1,
    resize: 'none',
    minHeight: 36,
    maxHeight: 140,
    padding: '8px 10px',
    fontSize: 13,
    lineHeight: 1.4,
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 8,
    background: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    fontFamily: 'inherit',
};
const sendBtnStyle = {
    padding: '7px 14px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid var(--doc-primary, #1a73e8)',
    background: 'var(--doc-primary, #1a73e8)',
    color: 'white',
    fontWeight: 500,
};
const stopBtnStyle = Object.assign(Object.assign({}, sendBtnStyle), { border: '1px solid var(--doc-border, #d1d5db)', background: 'transparent', color: 'var(--doc-text-on-surface, #1f2937)' });
const subtleStyle = {
    fontSize: 11,
    color: 'var(--doc-text-muted, #6b7280)',
    alignSelf: 'flex-start',
};
// System prompt + per-call context budgeting moved into the writer
// pipeline (`lib/writer/pipeline.ts` + the per-tool agents). The panel
// no longer composes a raw prompt — it just hands the user message +
// context callbacks to the pipeline.
const HISTORY_KEY = 'writer:chat-history';
const HISTORY_MAX = 40;
const DOC_CONTEXT_KEY = 'writer:chat-use-doc-context';
function loadDocContextPref() {
    if (typeof window === 'undefined')
        return true;
    try {
        const raw = window.localStorage.getItem(DOC_CONTEXT_KEY);
        if (raw === null)
            return true; // default ON — chat lives inside a doc editor
        return raw === '1';
    }
    catch (_a) {
        return true;
    }
}
function saveDocContextPref(v) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(DOC_CONTEXT_KEY, v ? '1' : '0');
    }
    catch (_a) {
        // ignored
    }
}
function loadHistory() {
    if (typeof window === 'undefined')
        return [];
    try {
        const raw = window.localStorage.getItem(HISTORY_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .filter((m) => !!m &&
            typeof m === 'object' &&
            'role' in m &&
            'content' in m &&
            typeof m.content === 'string')
            .slice(-HISTORY_MAX);
    }
    catch (_a) {
        return [];
    }
}
function saveHistory(messages) {
    if (typeof window === 'undefined')
        return;
    try {
        const trimmed = messages.slice(-HISTORY_MAX);
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    }
    catch (_a) {
        // Storage denied or quota exceeded — drop silently; the chat still
        // functions for the session.
    }
}
function wordCount(text) {
    const t = text.trim();
    if (!t)
        return 0;
    return t.split(/\s+/).length;
}
const quickRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
};
const quickChipStyle = {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 99,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'transparent',
    color: 'var(--doc-text-on-surface, #1f2937)',
    cursor: 'pointer',
};
const SLASH_COMMANDS = [
    {
        cmd: '/rewrite',
        label: 'Rewrite selection',
        hint: 'Rewrite the selection (tone optional)',
        build: (rest) => rest.trim()
            ? `Rewrite the selected passage to be ${rest.trim()}. Keep the meaning and format.`
            : 'Rewrite the selected passage to improve clarity and flow. Keep the meaning and format.',
    },
    {
        cmd: '/summarize',
        label: 'Summarize selection',
        hint: 'One-paragraph summary',
        build: () => 'Summarise the selected passage in a single concise paragraph.',
    },
    {
        cmd: '/grammar',
        label: 'Grammar fix',
        hint: 'Correct typos and grammar only',
        build: () => 'Fix grammar, agreement, and punctuation in the selected passage. Return ONLY the corrected text.',
    },
    {
        cmd: '/translate',
        label: 'Translate selection',
        hint: 'Translate to a language',
        build: (rest) => `Translate the selected passage to ${rest.trim() || 'Spanish'}. Return only the translation.`,
    },
    {
        cmd: '/explain',
        label: 'Explain selection',
        hint: 'Plain-English explanation',
        build: () => 'Explain the selected passage in simple, plain English suitable for a non-expert reader.',
    },
    {
        cmd: '/expand',
        label: 'Expand selection',
        hint: 'Add detail and depth',
        build: () => 'Expand the selected passage with more detail and concrete examples while keeping the original meaning.',
    },
    {
        cmd: '/shorten',
        label: 'Shorten selection',
        hint: 'Tighten without losing meaning',
        build: () => 'Shorten the selected passage while keeping the meaning intact. Return only the shortened text.',
    },
    {
        // Pairs with the inline long-sentence highlighter — fixes what
        // the yellow / amber tints flag. Routes through applyRewrite
        // with the new "readable" tone so the rewrite lands as a
        // tracked-change suggestion in the inline preview popover.
        cmd: '/polish',
        label: 'Polish for readability',
        hint: 'Shorter sentences, plain English, active voice',
        build: () => 'Rewrite the selected passage to be more readable: break sentences longer than 25 words, use plain English, prefer active voice. Keep the meaning unchanged.',
    },
    {
        cmd: '/plain',
        label: 'Plain English',
        hint: 'Short sentences, simple words, no jargon',
        build: () => 'Rewrite the selected passage in plain English suitable for a general audience: short sentences under 20 words, simple words, active voice, no jargon. Keep the meaning intact.',
    },
    {
        // Selection → real PM table via the inline preview popover.
        // Classifier matches "transform … into a table" → insertTable
        // intent → table proposal. The user reviews + accepts in the
        // popover instead of the chat bubble.
        cmd: '/table',
        label: 'Convert selection to table',
        hint: 'Build a real table from the selected text',
        build: (rest) => rest.trim()
            ? `Transform the selected passage into a table. ${rest.trim()}.`
            : 'Transform the selected passage into a table.',
    },
    {
        // Routes through the Wikipedia research tool — chat reply with a
        // summary + deep link. Distinct from /explain, which paraphrases
        // the selection; /research is an external lookup.
        cmd: '/research',
        label: 'Look up on Wikipedia',
        hint: 'Fact lookup (Wikipedia REST)',
        build: (rest) => rest.trim() ? `What is ${rest.trim()}?` : 'What is the topic of the selected passage?',
    },
    {
        // Run the resume target through transformDoc on the live doc. The
        // classifier handles the routing; the popover shows the proposal.
        cmd: '/resume',
        label: 'Create a resume from this doc',
        hint: 'Restructure into ATS-friendly resume',
        build: (rest) => rest.trim()
            ? `Create a ${rest.trim()} resume from this document.`
            : 'Create an ATS-friendly resume from this document.',
    },
    {
        cmd: '/memo',
        label: 'Create a memo from this doc',
        hint: 'Restructure into a memorandum',
        build: () => 'Draft a memo from this document.',
    },
];
function matchSlash(value) {
    if (!value.startsWith('/'))
        return null;
    const space = value.indexOf(' ');
    const head = space === -1 ? value : value.slice(0, space);
    const rest = space === -1 ? '' : value.slice(space + 1);
    const command = SLASH_COMMANDS.find((c) => c.cmd === head);
    return command ? { command, rest } : null;
}
const msgActionsStyle = {
    display: 'flex',
    gap: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
};
const msgActionBtnStyle = {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'transparent',
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    cursor: 'pointer',
};
export function ChatPanel({ isOpen, onClose, getDocText, getSelectionText, onInsertAtCursor, getView, onProposal, }) {
    const writer = useWriterState();
    const [history, setHistory] = useState(() => loadHistory());
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    // Default to ON — chat lives inside a document editor, the doc is
    // almost always the implicit subject ("summarise this document",
    // "find typos in this"). Persist the user's choice so opting out
    // sticks across sessions.
    const [useDocContext, setUseDocContextState] = useState(() => loadDocContextPref());
    const setUseDocContext = (v) => {
        setUseDocContextState(v);
        saveDocContextPref(v);
    };
    const [streaming, setStreaming] = useState('');
    // Sample the selection when the panel mounts so the chip in the
    // header reflects what the user had selected at the moment they
    // opened chat. They can still flip the include-selection toggle on
    // or off; the actual text is re-read at send time.
    const [includeSelection, setIncludeSelection] = useState(() => isOpen && getSelectionText().trim().length > 0);
    const selectionWords = useMemo(() => (isOpen ? wordCount(getSelectionText()) : 0), [isOpen, getSelectionText]);
    // Slash-command suggestions for the autocomplete popover above the
    // input. Only render when the textarea starts with `/` and we're
    // not yet typing arguments (no space after the command head).
    const slashSuggestions = useMemo(() => {
        if (!input.startsWith('/'))
            return [];
        const space = input.indexOf(' ');
        if (space !== -1)
            return [];
        const head = input.toLowerCase();
        return SLASH_COMMANDS.filter((c) => c.cmd.startsWith(head));
    }, [input]);
    const abortRef = useRef(null);
    const bodyRef = useRef(null);
    const llmReady = useMemo(() => writer.phase === 'ready' &&
        writer.loadedModelId !== null &&
        writer.enabledFeatures.includes('advanced-llm'), [writer.phase, writer.loadedModelId, writer.enabledFeatures]);
    // Auto-scroll on every history change / streaming chunk.
    useEffect(() => {
        var _a;
        (_a = bodyRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
    }, [history, streaming]);
    // Persist chat history to localStorage so the conversation survives
    // a reload. Capped to the last 40 messages so a long session
    // doesn't push other Casual-Editor data out of the quota.
    useEffect(() => {
        saveHistory(history);
    }, [history]);
    useEffect(() => {
        var _a;
        if (isOpen)
            return;
        (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        setStreaming('');
        setBusy(false);
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape' && !busy)
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose, busy]);
    if (!isOpen)
        return null;
    const onSend = () => __awaiter(this, void 0, void 0, function* () {
        const raw = input.trim();
        if (!raw || busy || !llmReady)
            return;
        // Expand `/cmd args` → real instruction. The user bubble keeps the
        // raw `/cmd args` so the history reads naturally; the actual
        // prompt sent to the pipeline is the expanded form.
        const slash = matchSlash(raw);
        const expanded = slash ? slash.command.build(slash.rest) : raw;
        const userMsg = { role: 'user', content: raw };
        const nextHistory = [...history, userMsg];
        setHistory(nextHistory);
        setInput('');
        setBusy(true);
        setStreaming('');
        const controller = new AbortController();
        abortRef.current = controller;
        const view = getView();
        const schema = view === null || view === void 0 ? void 0 : view.state.schema;
        if (!schema) {
            setHistory([
                ...nextHistory,
                {
                    role: 'assistant',
                    content: 'Editor is not ready yet — give it a second and try again.',
                },
            ]);
            setBusy(false);
            return;
        }
        try {
            const result = yield runPipeline({
                message: expanded,
                history: nextHistory
                    .slice(0, -1)
                    .filter((m) => m.role === 'user' || m.role === 'assistant')
                    .map((m) => ({ role: m.role, content: m.content })),
                includeDocContext: useDocContext,
                // Slash commands always pull the selection in — they're scoped
                // to a passage by design.
                includeSelection: slash ? true : includeSelection,
                onDelta: (chunk) => setStreaming((prev) => prev + chunk),
            }, {
                getDocText,
                getSelectionText,
                getView,
                schema,
            }, controller.signal);
            // Render by kind. Per the AI editor research, chat renders text
            // only — doc-modifying proposals get a one-line reply describing
            // where to find the preview, and the actual content goes to the
            // inline preview popover via `onProposal`.
            if (result.kind === 'chat') {
                setHistory([...nextHistory, { role: 'assistant', content: result.text }]);
            }
            else if (result.kind === 'proposal') {
                const where = result.replaceRange ? 'over your selection' : 'below your cursor';
                const tip = onProposal
                    ? `Drafted ${result.summary} — preview is ${where}. Use Replace / Insert below / Try again / Discard in the popover.`
                    : `Drafted ${result.summary}, but the preview surface isn't wired up yet.`;
                setHistory([...nextHistory, { role: 'assistant', content: tip }]);
                if (onProposal)
                    onProposal(result, expanded);
            }
            else {
                setHistory([...nextHistory, { role: 'assistant', content: `Sorry — ${result.message}` }]);
            }
            setStreaming('');
        }
        catch (err) {
            const e = err;
            if (e.name !== 'AbortError') {
                setHistory([
                    ...nextHistory,
                    {
                        role: 'assistant',
                        content: `Error: ${e.message || 'Failed to reach the model.'}`,
                    },
                ]);
            }
            setStreaming('');
        }
        finally {
            setBusy(false);
        }
    });
    const onStop = () => {
        var _a;
        (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        if (streaming) {
            // Persist whatever streamed so far so the user keeps the partial.
            setHistory((prev) => [...prev, { role: 'assistant', content: streaming }]);
            setStreaming('');
        }
    };
    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void onSend();
        }
    };
    const headerActions = history.length > 0 && (_jsx("button", { type: "button", style: clearBtnStyle, onClick: () => {
            setHistory([]);
            setStreaming('');
        }, title: "Clear conversation", "data-testid": "chat-clear", children: "Clear" }));
    const footer = (_jsxs(_Fragment, { children: [slashSuggestions.length > 0 && (_jsx("div", { style: slashPopoverStyle, "data-testid": "chat-slash-popover", children: slashSuggestions.map((c) => (_jsxs("button", { type: "button", style: slashItemStyle, onClick: () => setInput(`${c.cmd} `), "data-testid": `chat-slash-${c.cmd.slice(1)}`, children: [_jsx("span", { style: slashCmdStyle, children: c.cmd }), _jsx("span", { style: slashLabelStyle, children: c.label }), _jsx("span", { style: slashHintStyle, children: c.hint })] }, c.cmd))) })), _jsxs("div", { style: inputRowStyle, children: [_jsx("textarea", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: onKeyDown, placeholder: llmReady ? 'Ask anything… (Enter to send, Shift+Enter for newline)' : 'LLM not loaded.', disabled: !llmReady || busy, style: textareaStyle, rows: 1, "data-testid": "chat-input" }), busy ? (_jsx("button", { type: "button", style: stopBtnStyle, onClick: onStop, "data-testid": "chat-stop", children: "Stop" })) : (_jsx("button", { type: "button", style: sendBtnStyle, onClick: () => void onSend(), disabled: !llmReady || !input.trim(), "data-testid": "chat-send", children: "Send" }))] })] }));
    return (_jsx(RightDockPanel, { title: "Ask AI", icon: _jsx(MaterialSymbol, { name: "chat_bubble_outline", size: 16 }), onClose: onClose, headerActions: headerActions, testId: "chat-panel", ariaLabel: "Ask AI", footer: footer, children: _jsxs(_Fragment, { children: [selectionWords > 0 && (_jsx("div", { style: selChipRowStyle, "data-testid": "chat-selection-chip-row", children: _jsxs("button", { type: "button", style: selChipStyle(includeSelection), onClick: () => setIncludeSelection((v) => !v), "data-testid": "chat-selection-chip", children: ["Selection \u00B7 ", selectionWords, " ", selectionWords === 1 ? 'word' : 'words', ' ', includeSelection ? '(included)' : '(excluded)'] }) })), _jsxs("label", { style: ctxRowStyle, children: [_jsx("input", { type: "checkbox", checked: useDocContext, onChange: (e) => setUseDocContext(e.target.checked), "data-testid": "chat-use-doc-context" }), "Use document context"] }), _jsxs("div", { ref: bodyRef, style: bodyStyle, children: [!llmReady && (_jsxs("div", { style: emptyStyle, children: [_jsx("strong", { children: "Chat needs the Advanced LLM tier." }), _jsxs("span", { children: ["Open the Writing Assistant from the rail and enable", _jsx("em", { children: " Advanced (Llama-3.2-1B) " }), "to start a conversation. ~880 MB one-time download."] })] })), llmReady && history.length === 0 && !streaming && (_jsx(ChatEmptyState, { docTextSnapshot: isOpen ? getDocText() : '', hasSelection: selectionWords > 0, onPick: (p) => setInput(p) })), history.map((m, i) => {
                            const isUser = m.role === 'user';
                            return (_jsxs("div", { style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                                    maxWidth: '92%',
                                }, children: [_jsx("div", { style: isUser ? userBubbleStyle : assistantBubbleStyle, "data-testid": `chat-msg-${m.role}`, children: isUser ? m.content : _jsx(Markdown, { text: m.content }) }), !isUser && m.content.trim() && (_jsxs("div", { style: msgActionsStyle, children: [_jsx("button", { type: "button", style: msgActionBtnStyle, onClick: () => onInsertAtCursor(m.content), title: "Insert this reply at the cursor as a tracked suggestion", "data-testid": `chat-msg-insert-${i}`, children: "Insert at cursor" }), _jsx("button", { type: "button", style: msgActionBtnStyle, onClick: () => {
                                                    var _a;
                                                    return void ((_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(stripMarkdownForCopy(m.content)).catch(() => { }));
                                                }, "data-testid": `chat-msg-copy-${i}`, children: "Copy" })] }))] }, i));
                        }), streaming && (_jsxs("div", { style: assistantBubbleStyle, "data-testid": "chat-msg-streaming", children: [_jsx(Markdown, { text: streaming }), _jsx("span", { style: { opacity: 0.4 }, children: "\u258D" })] })), busy && !streaming && _jsx("div", { style: subtleStyle, children: "Thinking\u2026" })] })] }) }));
}
/**
 * ChatEmptyState — the "Ready when you are" intro shown when chat
 * history is empty. Computes doc-type-aware quick prompts on mount
 * (and when the chat re-opens) so the user sees suggestions tailored
 * to what they're working on: resume → ATS / cover-letter; memo →
 * Next Steps; selection present → rewrite / translate.
 */
function ChatEmptyState({ docTextSnapshot, hasSelection, onPick, }) {
    const prompts = useMemo(() => getQuickPromptsForDoc({
        docText: docTextSnapshot,
        hasSelection,
    }), [docTextSnapshot, hasSelection]);
    return (_jsxs("div", { style: emptyStyle, children: [_jsx("strong", { children: "Ready when you are." }), _jsx("span", { children: "Ask anything about the open document, request rewrites, or brainstorm. Toggle \"Use document context\" above to send the doc text along with your question." }), _jsx("div", { style: quickRowStyle, children: prompts.map((p) => (_jsx("button", { type: "button", style: quickChipStyle, onClick: () => onPick(p), "data-testid": `chat-quick-${p.slice(0, 12).replace(/\s/g, '-')}`, children: p }, p))) })] }));
}
/**
 * Strip markdown formatting from a chat-bubble's text content so the
 * Copy button hands the user plain prose instead of `**bold**`,
 * `[link](url)` syntax, and `# heading` chrome. Insert-at-cursor
 * already converts markdown to PM nodes via applyMarkdownAsSuggestion;
 * this matches that path for copy-out.
 */
function stripMarkdownForCopy(text) {
    let out = text;
    // Fenced code blocks → keep the contents, drop the fences.
    out = out.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, '$1');
    // Headings — drop the leading hashes + space.
    out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');
    // Bold + italic + strike — strip the surrounding markers.
    out = out.replace(/(\*\*|__)(.+?)\1/g, '$2');
    out = out.replace(/(\*|_)(.+?)\1/g, '$2');
    out = out.replace(/~~(.+?)~~/g, '$1');
    // Inline code — drop the backticks but keep the content.
    out = out.replace(/`([^`]+)`/g, '$1');
    // Links — `[label](url)` → `label (url)`. The URL is retained on
    // the same line so the user still has the reference.
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    // Bullets and numbered prefixes — normalise to "- " then a clean
    // newline-separated list so spreadsheets / Slack don't choke on
    // the asterisks.
    out = out.replace(/^\s*[*+-]\s+/gm, '- ');
    out = out.replace(/^\s*\d+\.\s+/gm, (m) => m); // keep numbered as-is
    // Collapse 3+ blank lines to 2 — keeps paragraph breaks readable.
    out = out.replace(/\n{3,}/g, '\n\n');
    return out.trim();
}
export default ChatPanel;
//# sourceMappingURL=ChatPanel.js.map