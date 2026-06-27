/**
 * Long-sentence highlighter — ProseMirror decoration plugin.
 *
 * Walks each paragraph, tokenises into sentences via `.!?` boundaries,
 * and adds an `inline` Decoration over the range of any sentence whose
 * word count crosses our thresholds:
 *
 *   > 35 words → amber background (very long — break in two)
 *   > 25 words → yellow background (long — consider splitting)
 *
 * No PM doc mutation: decorations are a view-only overlay so the
 * OOXML round-trip is untouched. Toggleable from the host so users
 * who find it noisy can hide the highlights without losing the
 * status-bar readability stats.
 *
 * Activation: the host owns an `enabled` flag (persisted in
 * statbar-prefs alongside the readability stat). When false, the
 * plugin returns an empty DecorationSet so the cost stays at the
 * cheapest possible no-op.
 */
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
export const READABILITY_PLUGIN_KEY = new PluginKey('docx-editor-readability');
const LONG_SENTENCE_WORDS = 25;
const VERY_LONG_SENTENCE_WORDS = 35;
const LONG_STYLE = 'background-color: rgba(252, 211, 77, 0.32);';
const VERY_LONG_STYLE = 'background-color: rgba(251, 146, 60, 0.4);';
const WORD_RE = /\p{L}+(?:'\p{L}+)*/gu;
function wordCount(text) {
    var _a, _b;
    return (_b = (_a = text.match(WORD_RE)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
}
/**
 * Walk one paragraph's text node-by-node, tracking character offsets
 * inside the paragraph so we can map sentence boundaries (which we
 * detect on the joined text) back to PM positions.
 *
 * Returns the joined text + a `(charOffset → pmPos)` lookup so the
 * caller can reconstruct sentence ranges without re-walking the doc.
 */
function gatherParagraph(paraNode, paraStart) {
    let text = '';
    const segments = [];
    paraNode.descendants((node, posInPara) => {
        var _a;
        if (node.isText) {
            const t = (_a = node.text) !== null && _a !== void 0 ? _a : '';
            segments.push({ start: text.length, pmPos: paraStart + posInPara + 1, length: t.length });
            text += t;
            return false;
        }
        return true;
    });
    const offsetToPm = (off) => {
        for (const seg of segments) {
            const segEnd = seg.start + seg.length;
            if (off >= seg.start && off <= segEnd) {
                return seg.pmPos + (off - seg.start);
            }
        }
        // Off past the last segment — return paragraph end.
        return paraStart + paraNode.nodeSize - 1;
    };
    return { text, offsetToPm };
}
function buildDecorations(state, enabled) {
    if (!enabled)
        return DecorationSet.empty;
    const decorations = [];
    state.doc.descendants((node, pos) => {
        if (node.type.name !== 'paragraph')
            return true;
        const { text, offsetToPm } = gatherParagraph(node, pos);
        if (!text.trim())
            return false;
        // Sentence boundaries: walk `.!?` followed by whitespace or end.
        let cursor = 0;
        const sentenceRanges = [];
        const re = /[.!?]+(?=\s|$)/g;
        let match;
        while ((match = re.exec(text)) != null) {
            const end = match.index + match[0].length;
            const sentenceText = text.slice(cursor, end);
            const trimmedStart = cursor + (sentenceText.length - sentenceText.replace(/^\s+/, '').length);
            sentenceRanges.push({
                from: trimmedStart,
                to: end,
                words: wordCount(sentenceText),
            });
            cursor = end;
        }
        if (cursor < text.length) {
            const tail = text.slice(cursor);
            if (tail.trim()) {
                const trimmedStart = cursor + (tail.length - tail.replace(/^\s+/, '').length);
                sentenceRanges.push({
                    from: trimmedStart,
                    to: text.length,
                    words: wordCount(tail),
                });
            }
        }
        for (const s of sentenceRanges) {
            if (s.words <= LONG_SENTENCE_WORDS)
                continue;
            const style = s.words > VERY_LONG_SENTENCE_WORDS ? VERY_LONG_STYLE : LONG_STYLE;
            const title = s.words > VERY_LONG_SENTENCE_WORDS
                ? `${s.words}-word sentence — consider breaking in two`
                : `${s.words}-word sentence — consider shortening`;
            const from = offsetToPm(s.from);
            const to = offsetToPm(s.to);
            if (to > from) {
                decorations.push(Decoration.inline(from, to, {
                    style,
                    title,
                    class: 'docx-readability-long-sentence',
                }));
            }
        }
        return false; // don't descend into paragraph children
    });
    return DecorationSet.create(state.doc, decorations);
}
/**
 * Toggle the highlighter on/off without recreating the plugin.
 * Reflects the new state via a meta-tagged no-op transaction the
 * caller dispatches.
 */
export function readabilityPluginSetEnabled(enabled) {
    return { [READABILITY_PLUGIN_KEY]: { enabled } };
}
export function readabilityPlugin(initialEnabled = true) {
    return new Plugin({
        key: READABILITY_PLUGIN_KEY,
        state: {
            init(_config, state) {
                return {
                    enabled: initialEnabled,
                    decorations: buildDecorations(state, initialEnabled),
                };
            },
            apply(tr, value, _oldState, newState) {
                const meta = tr.getMeta(READABILITY_PLUGIN_KEY);
                const nextEnabled = (meta === null || meta === void 0 ? void 0 : meta.enabled) != null ? meta.enabled : value.enabled;
                // Recompute decorations when the doc changes OR the enabled
                // flag flips. Mapping the prior set across `tr` would be
                // cheaper but ranges shift inside paragraphs as the user
                // types, and a stale yellow span on a now-short sentence is
                // worse than the recompute cost.
                if (tr.docChanged || nextEnabled !== value.enabled) {
                    return {
                        enabled: nextEnabled,
                        decorations: buildDecorations(newState, nextEnabled),
                    };
                }
                return value;
            },
        },
        props: {
            decorations(state) {
                var _a, _b;
                return (_b = (_a = this.getState(state)) === null || _a === void 0 ? void 0 : _a.decorations) !== null && _b !== void 0 ? _b : DecorationSet.empty;
            },
        },
    });
}
//# sourceMappingURL=readabilityPlugin.js.map