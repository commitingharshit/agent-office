/**
 * StoredMarksRestore — re-hydrates `state.storedMarks` from a paragraph's
 * `defaultTextFormatting` attr whenever the cursor sits in an empty
 * paragraph and PM has cleared storedMarks.
 *
 * Why this exists: `defaultTextFormatting` is the OOXML-style "what
 * formatting does an empty paragraph remember" attr, mirrored from
 * storedMarks at the moment the user toggled bold / italic / a font on
 * an empty paragraph (see markUtils.ts:saveStoredMarksToParagraph).
 * ProseMirror clears storedMarks aggressively — every transform step
 * does it, including the deletion that's produced when the user
 * select-alls + Backspaces a paragraph back to empty. Once storedMarks
 * is null, the next typed character draws its marks from `$from.marks()`
 * which is empty in an empty paragraph, so the inherited bold / italic
 * is silently dropped.
 *
 * The fix mirrors the priority encoded in `effectiveCursorMarks`:
 * storedMarks → $from.marks() → marks-from-defaultTextFormatting. We
 * run as an `appendTransaction`, detect the (empty paragraph + dtf +
 * null storedMarks) state, and append a transaction that calls
 * `setStoredMarks` from the dtf-derived marks. The resulting state
 * has storedMarks populated, so the next text-input transaction
 * inserts characters carrying those marks.
 *
 * No infinite loop: after we append the setStoredMarks transaction,
 * newState.storedMarks is non-null and the early-return guard fires
 * on the next pass.
 */
import { PluginKey } from 'prosemirror-state';
export declare const storedMarksRestoreKey: PluginKey<any>;
export declare const StoredMarksRestoreExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=StoredMarksRestoreExtension.d.ts.map