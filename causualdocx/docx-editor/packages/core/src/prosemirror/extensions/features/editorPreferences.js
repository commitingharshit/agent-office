/**
 * Editor preferences — runtime-toggleable behavior the user controls from
 * the Tools → Preferences dialog. The smart-quotes and autocorrect
 * extensions read this on every `handleTextInput` so flipping a toggle
 * takes effect immediately, without rebuilding the editor.
 *
 * This is a module-level mutable singleton on purpose: these are
 * app-wide editor behaviors, not per-document state, and the editor is
 * client-side single-instance. The React layer is responsible for
 * persistence (reads `localStorage` on mount, calls `setEditorPreference`
 * from the dialog).
 *
 * Note: this is independent of `createStarterKit({ disable: [...] })`,
 * which removes the extension entirely at build time. When the extension
 * is present, this flag gates the runtime behavior.
 */
export const editorPreferences = {
    smartQuotes: true,
    autocorrect: true,
};
export function setEditorPreference(key, value) {
    editorPreferences[key] = value;
}
//# sourceMappingURL=editorPreferences.js.map