/**
 * Paste Style Inliner Extension
 *
 * When pasting from apps like Google Docs that use class-based CSS
 * (e.g. `<style>.c5 { margin-top: 12pt }</style>`) instead of inline styles,
 * ProseMirror's parseDOM can't read the styles because elements aren't attached
 * to the live document during parsing.
 *
 * This extension provides a `transformPastedHTML` hook that:
 * 1. Parses the pasted HTML string
 * 2. Extracts all `<style>` rules
 * 3. Inlines them onto matching elements
 * 4. Returns the modified HTML so parseDOM can read inline styles
 */
export declare const PasteStyleInlinerExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=PasteStyleInlinerExtension.d.ts.map