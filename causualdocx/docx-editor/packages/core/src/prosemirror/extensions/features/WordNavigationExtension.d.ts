/**
 * Word Navigation Extension
 *
 * ProseMirror-native word-wise cursor motion, bound to the platform's
 * word-jump shortcut: Alt+Arrow on macOS, Ctrl+Arrow elsewhere (matching
 * the OS convention and Google Docs / Word). Shift variants extend the
 * selection.
 *
 * Why this exists: the editor advertises "move by word" in the keyboard-
 * shortcuts dialog, but the older `window.getSelection()`-based helper in
 * `utils/keyboardNavigation.ts` was never wired into the keymap and is the
 * wrong layer for the hidden-ProseMirror model — it drives the DOM
 * selection rather than PM state. This command operates on PM state.
 *
 * Offsets are computed against the textblock's `textContent`, so paragraphs
 * mixing text with inline atoms (tabs, breaks) can be off by the atom count;
 * plain-text paragraphs — the overwhelmingly common case — are exact.
 */
export declare const WordNavigationExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=WordNavigationExtension.d.ts.map