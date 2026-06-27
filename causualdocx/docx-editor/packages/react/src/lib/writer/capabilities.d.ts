/**
 * DeviceCapabilities — one-shot snapshot of the runtime environment we
 * rely on for the on-device Writing Assistant. Detected once at editor
 * mount and cached at module scope; UI components re-read on next
 * render but the snapshot never re-runs (capability flips don't
 * happen mid-session in practice).
 *
 * See `docs/internal/10-writing-assistant-design.md` § 3.
 */
export type WriterBackend = 'webgpu' | 'wasm-simd' | 'wasm';
export type EffectiveNet = '4g' | '3g' | 'slow' | 'unknown';
export interface DeviceCapabilities {
    /** WebGPU adapter present + initialised. */
    webgpu: boolean;
    /** WebAssembly SIMD support — almost universal on modern browsers. */
    wasmSimd: boolean;
    /** SharedArrayBuffer = WASM threads. Requires COOP/COEP isolation. */
    sharedArrayBuffer: boolean;
    /** `navigator.deviceMemory` (GB hint). Null on Firefox / Safari. */
    deviceMemoryGb: number | null;
    /** Reported storage quota in MB; null if `navigator.storage` is missing. */
    storageQuotaMb: number | null;
    /** Bytes already used by this origin's caches + IDB, in MB. */
    storageUsedMb: number | null;
    /** Network class hint via `navigator.connection`. */
    effectiveNet: EffectiveNet;
    /** Resolved best-available backend ranked by speed. */
    recommendedBackend: WriterBackend;
    /** Human-readable reasons surfaced in the UI when something's off. */
    unsupportedReasons: string[];
}
/**
 * Resolve once per session. Subsequent calls return the same snapshot.
 */
export declare function getDeviceCapabilities(): Promise<DeviceCapabilities>;
/**
 * Test-only — drop the snapshot so the next call re-detects.
 */
export declare function resetDeviceCapabilitiesForTests(): void;
//# sourceMappingURL=capabilities.d.ts.map