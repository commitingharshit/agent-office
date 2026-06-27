/**
 * Per-author colors for tracked changes — the Word / Google-Docs "by author"
 * convention: each reviewer's suggestions get a distinct, stable color, and the
 * decoration carries insert-vs-delete (underline = insertion, strikethrough =
 * deletion). This lets multiple reviewers' changes be told apart at a glance.
 *
 * When the change has no author (anonymous / single-user), the caller falls back
 * to the classic green-insert / red-delete styling.
 */
/** Saturated line/decoration color + a faint background tint, per author slot. */
export interface ChangeColor {
    solid: string;
    bg: string;
}
/**
 * Color for a tracked-change author, or `null` when there's no author (the
 * caller then uses the default green-insert / red-delete styling).
 */
export declare function colorForAuthor(author?: string | null): ChangeColor | null;
//# sourceMappingURL=changeAuthorColor.d.ts.map