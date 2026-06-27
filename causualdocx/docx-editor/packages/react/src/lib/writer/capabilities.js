/**
 * DeviceCapabilities — one-shot snapshot of the runtime environment we
 * rely on for the on-device Writing Assistant. Detected once at editor
 * mount and cached at module scope; UI components re-read on next
 * render but the snapshot never re-runs (capability flips don't
 * happen mid-session in practice).
 *
 * See `docs/internal/10-writing-assistant-design.md` § 3.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let cached = null;
let inflight = null;
/**
 * Resolve once per session. Subsequent calls return the same snapshot.
 */
export function getDeviceCapabilities() {
    if (cached)
        return Promise.resolve(cached);
    if (inflight)
        return inflight;
    inflight = detect().then((caps) => {
        cached = caps;
        return caps;
    });
    return inflight;
}
/**
 * Test-only — drop the snapshot so the next call re-detects.
 */
export function resetDeviceCapabilitiesForTests() {
    cached = null;
    inflight = null;
}
function detect() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const unsupportedReasons = [];
        const wasmSimd = detectWasmSimd();
        if (!wasmSimd)
            unsupportedReasons.push('no-wasm-simd');
        const sab = typeof SharedArrayBuffer !== 'undefined';
        const webgpu = yield detectWebGpu();
        const deviceMemoryGb = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
            ? ((_a = navigator.deviceMemory) !== null && _a !== void 0 ? _a : null)
            : null;
        let storageQuotaMb = null;
        let storageUsedMb = null;
        try {
            if (typeof navigator !== 'undefined' && ((_b = navigator.storage) === null || _b === void 0 ? void 0 : _b.estimate)) {
                const est = yield navigator.storage.estimate();
                if (est.quota != null)
                    storageQuotaMb = Math.round(est.quota / (1024 * 1024));
                if (est.usage != null)
                    storageUsedMb = Math.round(est.usage / (1024 * 1024));
            }
        }
        catch (_c) {
            // Some browsers gate `storage.estimate()` on a secure context; just
            // leave the values null and the UI hides the storage line.
        }
        const effectiveNet = readEffectiveNet();
        const recommendedBackend = webgpu ? 'webgpu' : wasmSimd ? 'wasm-simd' : 'wasm';
        return {
            webgpu,
            wasmSimd,
            sharedArrayBuffer: sab,
            deviceMemoryGb,
            storageQuotaMb,
            storageUsedMb,
            effectiveNet,
            recommendedBackend,
            unsupportedReasons,
        };
    });
}
/**
 * WebAssembly SIMD probe — compiles a tiny module that uses the
 * `v128.const` opcode; throws on engines without SIMD support.
 * Source: https://github.com/GoogleChromeLabs/wasm-feature-detect
 */
function detectWasmSimd() {
    if (typeof WebAssembly === 'undefined')
        return false;
    try {
        return WebAssembly.validate(new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0,
            253, 15, 253, 98, 11,
        ]));
    }
    catch (_a) {
        return false;
    }
}
function detectWebGpu() {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof navigator === 'undefined')
            return false;
        const gpu = navigator.gpu;
        if (!gpu)
            return false;
        try {
            const adapter = yield gpu.requestAdapter();
            return adapter !== null && adapter !== undefined;
        }
        catch (_a) {
            return false;
        }
    });
}
function readEffectiveNet() {
    var _a;
    if (typeof navigator === 'undefined')
        return 'unknown';
    const conn = navigator.connection;
    if (!conn)
        return 'unknown';
    const et = (_a = conn.effectiveType) !== null && _a !== void 0 ? _a : '';
    if (et === '4g')
        return '4g';
    if (et === '3g')
        return '3g';
    if (et === 'slow-2g' || et === '2g')
        return 'slow';
    return 'unknown';
}
//# sourceMappingURL=capabilities.js.map