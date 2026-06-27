/**
 * WriterController — module-level singleton that owns the worker, the
 * state machine, and the public hook UI components subscribe to.
 *
 * See `docs/internal/10-writing-assistant-design.md` § 7.
 *
 * UI never touches the worker directly. Components call
 * `useWriterState()` to read the current snapshot and reflect
 * downloads / errors / ready state; they call action helpers
 * (`enableFeature`, `disableFeature`, `runTask`, ...) for behaviour.
 */
import { type DeviceCapabilities } from './capabilities';
import { type FeatureId, type FeatureSpec } from './registry';
import { type JsonResponseFormat, type WriterErrorCode, type WriterTask } from './messages';
export type WriterPhase = 'idle' | 'checking-caps' | 'confirming' | 'downloading' | 'loading' | 'ready' | 'busy' | 'evicting' | 'error';
export interface WriterState {
    phase: WriterPhase;
    enabledFeatures: FeatureId[];
    /** Model currently resident in the worker, if any. */
    loadedModelId: string | null;
    /** Live download progress (0..1) when phase === 'downloading'. */
    progress: number;
    /** Last successful inference latency in ms (for the status pill). */
    lastInferenceMs: number | null;
    errorCode: WriterErrorCode | null;
    errorMessage: string | null;
    capabilities: DeviceCapabilities | null;
    /** UI bit: is the Advanced disclosure expanded. */
    advancedOpen: boolean;
    /** Auto-load on next boot. */
    autoLoad: boolean;
    /** True after the user has signed off on the consent copy. */
    consented: boolean;
}
/**
 * Host must call this exactly once before any feature is enabled —
 * the consumer's bundler is what produces the worker asset URL. The
 * library can't bake the path in because tsup doesn't know how to
 * resolve `new URL('./writer.worker.ts', import.meta.url)`.
 */
export declare function setWriterWorkerUrl(url: string): void;
/** Visible to the consumer's `setWriterWorkerUrl` adapters / tests. */
export declare function getWriterWorkerUrl(): string | null;
/**
 * Run once at editor mount. Detects capabilities, restores persisted
 * features + consent, and schedules an auto-load if the user had a
 * feature on last session.
 */
export declare function bootWriterController(): Promise<void>;
export interface EnableOpts {
    /** When true, ignore the current consent state — used by the UI to
     *  drive the consent modal flow. */
    skipConsentCheck?: boolean;
}
/**
 * Enable a feature. Throws if consent is missing and `skipConsentCheck`
 * isn't set — the UI is responsible for surfacing the consent modal,
 * recording the user's acceptance via `recordConsent()`, and re-calling.
 */
export declare function enableFeature(id: FeatureId, opts?: EnableOpts): Promise<void>;
export declare function disableFeature(id: FeatureId): Promise<void>;
export declare function recordConsent(): void;
export declare function dismissConsent(): void;
export declare function setAutoLoad(v: boolean): void;
export declare function setAdvancedOpen(v: boolean): void;
/**
 * Run a task on the currently-loaded model. Resolves to the model's
 * output string. Rejects with `Error` on worker error / abort.
 */
export declare function runTask(task: WriterTask, input: string, signal?: AbortSignal): Promise<string>;
/**
 * Stream a chat completion against the resident LLM. Resolves with
 * the full reply once the stream ends; calls `opts.onDelta` for each
 * incoming chunk so the UI can paint as the model generates.
 *
 * Chat only flows through the WebLLM tier (Llama-3.2-1B) — the
 * flan-t5-small tier isn't a conversational model. The worker
 * rejects with a clean error if the user only has the basic tier
 * loaded.
 */
export declare function runChat(messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
}[], opts?: {
    onDelta?: (text: string) => void;
    signal?: AbortSignal;
    maxTokens?: number;
    temperature?: number;
    /** When set, WebLLM constrains output to this format (JSON-mode). */
    responseFormat?: JsonResponseFormat;
}): Promise<string>;
/**
 * Test/debug — terminate the worker and reset all in-memory state.
 */
export declare function resetWriterControllerForTests(): void;
/**
 * Subscribe a React component to controller state. Re-renders on every
 * patch. Pair with the action helpers (`enableFeature`, etc.).
 */
export declare function useWriterState(): WriterState;
/**
 * Resolve a feature's support given the current snapshot — keeps the
 * UI from re-importing `isFeatureSupported` everywhere.
 */
export declare function featureSupport(feature: FeatureSpec): {
    supported: boolean;
    reason?: string;
};
/**
 * True when an LLM-capable model is resident in the worker. Used by
 * surfaces outside the writer pipeline (translate dialog, quick-
 * replace) to decide whether to route work through the on-device LLM
 * (no rate limit) or fall back to the network API.
 */
export declare function isLlmReady(): boolean;
//# sourceMappingURL=controller.d.ts.map