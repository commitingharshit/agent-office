/**
 * Persistence + cache-usage helpers for the Writing Assistant. See
 * `docs/internal/10-writing-assistant-design.md` § 8.
 *
 * localStorage holds the user's enable list + consent state; the
 * model-weight cache is owned by transformers.js (Cache API), which we
 * never touch directly — we just surface usage via
 * `navigator.storage.estimate()` and offer an explicit "clear" hook.
 */
import type { FeatureId } from './registry';
export declare const CURRENT_CONSENT_VERSION = 1;
export declare function loadEnabledFeatures(): FeatureId[];
export declare function saveEnabledFeatures(ids: FeatureId[]): void;
export declare function loadConsentVersion(): number;
export declare function saveConsentVersion(v: number): void;
export declare function hasCurrentConsent(): boolean;
export declare function loadAutoLoad(): boolean;
export declare function saveAutoLoad(v: boolean): void;
export declare function loadAdvancedOpen(): boolean;
export declare function saveAdvancedOpen(v: boolean): void;
/**
 * Drop everything the assistant put in storage. The model-weight cache
 * is wiped separately because it lives in the Cache API under
 * transformers.js's namespace, not in localStorage.
 */
export declare function clearCachedModels(): Promise<void>;
/**
 * For tests: clear localStorage keys so the next boot re-runs the
 * first-time flow.
 */
export declare function resetWriterPrefsForTests(): void;
//# sourceMappingURL=storage.d.ts.map