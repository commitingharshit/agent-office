/**
 * Smart Quotes / Typography Extension
 *
 * Replaces plain ASCII punctuation with typographic equivalents as
 * the user types — what Word and Google Docs both do silently:
 *
 *   "  → " (U+201C) opening or " (U+201D) closing
 *   '  → ' (U+2018) opening or ' (U+2019) closing
 *   -- → — (U+2014, em dash)
 *   ...→ … (U+2026, horizontal ellipsis)
 *
 * The opening-vs-closing decision for quotes looks at the character
 * immediately before the cursor: whitespace, line start, or another
 * opening quote → opening; anything else → closing. Matches Word's
 * AutoFormat heuristic.
 *
 * Undo: each replacement is dispatched as a single transaction so
 * one Ctrl+Z reverts the substitution back to the typed ASCII
 * character, matching every other autocorrect engine.
 *
 * Disabled via StarterKit's `disable` option:
 *   createStarterKit({ disable: ['smartQuotes'] })
 */
export declare const SmartQuotesExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=SmartQuotesExtension.d.ts.map