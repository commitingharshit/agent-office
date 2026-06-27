/**
 * findTextRange — locate a plain-text substring inside a ProseMirror
 * document and map it back to a PM position range `{from, to}`.
 *
 * Used by the version-history per-change revert: the diff is a
 * sequence of text segments, but PM transactions need positions. We
 * already produce the live doc as a string via `view.state.doc.
 * textBetween(0, size, '\n', '\n')`; this util walks the doc tree
 * and produces a `(textOffset → pmPos)` map that matches that
 * stringification exactly.
 *
 * Match strategy:
 *   - First try the exact `text` (plus an optional `context` prefix /
 *     suffix to disambiguate when the substring appears multiple
 *     times — typing "hello" twice should only revert one of them).
 *   - Returns the FIRST match. The diff segment carries its
 *     surrounding kept-text context so this is normally unique.
 *   - Returns `null` if no match — caller falls back to a toast.
 *
 * Newlines: the same `'\n'` block separator the panel's `extractText`
 * uses, so search inputs match what the user sees in the diff box.
 */
import type { Node as PMNode } from 'prosemirror-model';
/**
 * Returns the first PM position range matching `text`. `context` is
 * an optional preceding string used to disambiguate identical
 * substrings — when supplied, we look for `context + text` and
 * return only the `text` portion's range.
 */
export declare function findTextRange(doc: PMNode, text: string, context?: string): {
    from: number;
    to: number;
} | null;
//# sourceMappingURL=findTextRange.d.ts.map