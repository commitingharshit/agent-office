/**
 * Feature + model registry. Declarative — no behaviour, just the
 * shape the UI and controller read from.
 *
 * See `docs/internal/10-writing-assistant-design.md` § 4.
 */
import type { DeviceCapabilities, WriterBackend } from './capabilities';
export type FeatureId = 'grammar' | 'tone' | 'summarize-basic' | 'advanced-llm';
/** Which inference engine a model needs. */
export type ModelEngine = 'transformers-js' | 'web-llm';
export interface ModelSpec {
    id: string;
    /** Display label shown in the sheet. */
    label: string;
    /** Quantized size in MB (Cache-API footprint after first download). */
    sizeMb: number;
    /** Preferred backend ranked highest first; controller falls back. */
    preferredBackend: WriterBackend;
    fallbackBackends: WriterBackend[];
    /** Which inference engine the worker dispatches to for this model. */
    engine: ModelEngine;
}
export interface FeatureSpec {
    id: FeatureId;
    label: string;
    description: string;
    modelIds: string[];
    /** Minimum reported device memory in GB for this to be safe. */
    minMemoryGb: number;
    /** Total cache footprint across all this feature's models. */
    sizeMb: number;
    /** Advanced features hide behind the disclosure. */
    advanced: boolean;
    /** P1 ships the UI for these but locks them off until P3. */
    comingSoon: boolean;
}
export declare const MODELS: Record<string, ModelSpec>;
export declare const FEATURES: FeatureSpec[];
export interface FeatureSupport {
    supported: boolean;
    reason?: string;
}
/**
 * Returns `{supported: true}` when the device can run the feature, or
 * `{supported: false, reason}` with a human-readable string surfaced
 * in the UI tooltip.
 */
export declare function isFeatureSupported(feature: FeatureSpec, caps: DeviceCapabilities): FeatureSupport;
export declare function getFeature(id: FeatureId): FeatureSpec | undefined;
//# sourceMappingURL=registry.d.ts.map