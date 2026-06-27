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
import { PluginKey } from 'prosemirror-state';
import { DecorationSet, type EditorView } from 'prosemirror-view';
/**
 * Injection point — the React package registers a checker on mount.
 * The shape is intentionally tiny so future engines (browser native,
 * server-side, alternative dictionaries) can drop in without changes
 * to this file.
 */
export interface SpellChecker {
    /** True when spell-check is currently enabled. */
    isEnabled(): boolean;
    /** True when the given word is definitely misspelled. */
    isMisspelled(word: string): boolean;
    /** Version bumps when enable/disable flips so we can invalidate the set. */
    version(): number;
}
export declare function setSpellChecker(impl: SpellChecker | null): void;
export declare const spellcheckPluginKey: PluginKey<{
    version: number;
    decos: DecorationSet;
}>;
export declare const SpellcheckExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
/**
 * Ask any open editor to refresh its decorations — call after toggling
 * the checker on, or after the dictionary has finished downloading.
 * The view is the only thing the React layer reliably has, so we
 * dispatch a refresh meta on its current state.
 */
export declare function refreshSpellcheckDecorations(view: EditorView): void;
//# sourceMappingURL=SpellcheckExtension.d.ts.map