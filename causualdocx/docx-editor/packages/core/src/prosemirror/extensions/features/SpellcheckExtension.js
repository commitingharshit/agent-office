/**
 * SpellcheckExtension — paints decorations under misspelled words.
 *
 * The actual word lookup is plugged in by the React layer through
 * `setSpellChecker` so this file (which lives in `@eigenpal/docx-core`)
 * stays free of the ~500 KB Hunspell dictionary. While no checker is
 * registered the plugin is inert; once registered it walks the doc
 * once per debounced transaction and rebuilds a DecorationSet of
 * `class: 'spellcheck-error'` inline ranges over each misspelled span.
 *
 * Rendering is handled by `DecorationLayer` (see CLAUDE.md → Editor
 * Architecture — Dual Rendering System). The CSS class is styled in
 * `editor.css` to draw a red wavy underline, matching Word's and
 * Google Docs' visual.
 */
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createExtension } from '../create';
import { Priority } from '../types';
let checker = null;
export function setSpellChecker(impl) {
    checker = impl;
}
export const spellcheckPluginKey = new PluginKey('spellcheck');
// Letters + apostrophes (don't / it's). Numbers and other punctuation
// terminate the word. Matches `\p{L}` plus `'` and `’` curly apostrophe.
const WORD_RE = /[\p{L}'’]+/gu;
function collectMisspellings(doc, isMisspelled) {
    const ranges = [];
    doc.descendants((node, pos) => {
        if (!node.isText || !node.text)
            return;
        const text = node.text;
        WORD_RE.lastIndex = 0;
        let m;
        while ((m = WORD_RE.exec(text)) !== null) {
            const word = m[0];
            // 1-letter "words" are almost always intentional ("I", "a"); skip.
            if (word.length < 2)
                continue;
            // Skip pure-numeric (shouldn't match anyway) and pure-uppercase
            // acronyms — most are correct in context (HTML, USA, NASA).
            if (word === word.toUpperCase() && word.length <= 5)
                continue;
            if (!isMisspelled(word))
                continue;
            const start = pos + m.index;
            ranges.push({ from: start, to: start + word.length });
        }
    });
    return ranges;
}
function buildDecorations(doc) {
    if (!checker || !checker.isEnabled())
        return DecorationSet.empty;
    const ranges = collectMisspellings(doc, (w) => checker.isMisspelled(w));
    if (ranges.length === 0)
        return DecorationSet.empty;
    const decos = ranges.map(({ from, to }) => Decoration.inline(from, to, { class: 'spellcheck-error' }));
    return DecorationSet.create(doc, decos);
}
export const SpellcheckExtension = createExtension({
    name: 'spellcheck',
    priority: Priority.Low,
    onSchemaReady() {
        return {
            plugins: [
                new Plugin({
                    key: spellcheckPluginKey,
                    state: {
                        init(_, { doc }) {
                            var _a;
                            return { version: (_a = checker === null || checker === void 0 ? void 0 : checker.version()) !== null && _a !== void 0 ? _a : 0, decos: buildDecorations(doc) };
                        },
                        apply(tr, prev) {
                            var _a;
                            const currentVersion = (_a = checker === null || checker === void 0 ? void 0 : checker.version()) !== null && _a !== void 0 ? _a : 0;
                            // Re-scan when the doc actually changed, when the checker
                            // flips on/off (version bump), or when meta requests a
                            // refresh (e.g. dictionary finished loading).
                            const forceRefresh = tr.getMeta(spellcheckPluginKey) === 'refresh';
                            if (!tr.docChanged && currentVersion === prev.version && !forceRefresh) {
                                return prev;
                            }
                            return {
                                version: currentVersion,
                                decos: buildDecorations(tr.doc),
                            };
                        },
                    },
                    props: {
                        decorations(state) {
                            var _a, _b;
                            return (_b = (_a = spellcheckPluginKey.getState(state)) === null || _a === void 0 ? void 0 : _a.decos) !== null && _b !== void 0 ? _b : DecorationSet.empty;
                        },
                    },
                }),
            ],
        };
    },
});
/**
 * Ask any open editor to refresh its decorations — call after toggling
 * the checker on, or after the dictionary has finished downloading.
 * The view is the only thing the React layer reliably has, so we
 * dispatch a refresh meta on its current state.
 */
export function refreshSpellcheckDecorations(view) {
    const tr = view.state.tr.setMeta(spellcheckPluginKey, 'refresh');
    view.dispatch(tr);
}
//# sourceMappingURL=SpellcheckExtension.js.map