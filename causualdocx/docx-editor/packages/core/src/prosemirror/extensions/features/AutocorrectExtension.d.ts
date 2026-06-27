/**
 * Autocorrect Extension
 *
 * Two classes of substitution, both via `handleTextInput`:
 *
 * 1. Symbol sequences — fire on the character that *completes* the
 *    sequence, mirroring Word's AutoFormat:
 *      (c)  → ©    (r) → ®    (tm) → ™
 *      -->  → →    <-- → ←    ->  → →    <- → ←
 *
 * 2. Common-typo dictionary — fires on a word-boundary character
 *    (space / tab). When the user finishes a word, the just-typed
 *    word is looked up in COMMON_TYPOS and replaced if found,
 *    preserving the boundary character the user typed.
 *
 * Each replacement is a single transaction so one Ctrl+Z reverts to
 * exactly what the user typed — matching every other autocorrect
 * engine + our SmartQuotesExtension.
 *
 * Disabled via StarterKit:
 *   createStarterKit({ disable: ['autocorrect'] })
 *
 * The typo dictionary is intentionally small (highest-value common
 * misspellings only) — a full spell-correct engine is out of scope
 * (that's D3/D4 in the parity pipeline). Case is preserved for the
 * leading letter so "Teh" → "The".
 */
export declare const AutocorrectExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=AutocorrectExtension.d.ts.map