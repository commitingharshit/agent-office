/**
 * Spell-check service — lazy-loaded Hunspell engine (nspell + en_US
 * dictionary). Single module-level instance shared across the app.
 *
 * The PM `SpellcheckExtension` lives in `@eigenpal/docx-core` and has
 * no idea how to look words up; it calls into the shared accessors
 * below, which the React package wires once the dictionary download
 * has finished. Until then, `isMisspelled()` returns `false` for every
 * word — so the editor renders cleanly while the ~500 KB dict streams.
 *
 * Why a singleton: a casual editor only runs one document at a time,
 * the dictionary is identical for everyone, and loading it twice would
 * waste memory + bandwidth. The Tools-menu toggle flips
 * `setSpellEnabled` so the extension can early-return without throwing
 * decorations into the void.
 */
import NSpell from 'nspell';
/**
 * Tell the spell-check loader where to fetch the Hunspell dictionary.
 * Call this once at editor mount before the first `loadSpellChecker()`.
 * URLs can be absolute (CDN) or relative; the loader just `fetch()`es
 * them and treats the bodies as text.
 */
export declare function setSpellAssetUrls(aff: string, dic: string): void;
/**
 * True when the user has asked for spell-check (Tools → Spell check).
 * The PM extension reads this on every transaction; flipping it off
 * removes the decoration overhead immediately.
 */
export declare function isSpellEnabled(): boolean;
/**
 * Flip the runtime toggle. Returns the new value so callers can do
 * `setSpellEnabled(!isSpellEnabled())` and use the result.
 */
export declare function setSpellEnabled(next: boolean): boolean;
/** Version counter exposed to the PM extension so it can detect on/off + dict-load. */
export declare function getSpellVersion(): number;
/**
 * Begin downloading the dictionary (idempotent). Resolves when the
 * engine is ready. Callers can `await` this before flipping `enabled`
 * if they want the user to see "Loading…" before the first squiggles.
 */
export declare function loadSpellChecker(): Promise<NSpell>;
/**
 * True when the word is **definitely** misspelled. Unknown / not-yet-
 * loaded state returns `false` so we never flag false-positives during
 * the dictionary download. Words the user told us to ignore are
 * silently treated as correct.
 */
export declare function isMisspelled(word: string): boolean;
/**
 * Return up to `limit` suggestions for the given word. Empty array if
 * the dictionary hasn't loaded yet or there are no suggestions.
 */
export declare function suggestionsFor(word: string, limit?: number): string[];
/**
 * Mark a word as "don't flag this again" for the current session.
 */
export declare function ignoreWord(word: string): void;
/**
 * Bind the React-side service to the core extension. Call once at
 * editor mount; subsequent toggles flip through `setSpellEnabled`.
 */
export declare function getSpellCheckerImpl(): {
    isEnabled: () => boolean;
    isMisspelled: (word: string) => boolean;
    version: () => number;
};
/**
 * For tests: drop the loaded state.
 */
export declare function resetSpellCheckerForTests(): void;
//# sourceMappingURL=service.d.ts.map