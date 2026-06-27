/**
 * AutoSaveManager
 *
 * Framework-agnostic class for auto-saving documents to localStorage.
 * Extracted from the React `useAutoSave` hook.
 *
 * Usage with React:
 * ```ts
 * const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot);
 * ```
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
import { Subscribable } from './Subscribable';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_STORAGE_KEY = 'docx-editor-autosave';
const DEFAULT_INTERVAL = 30000; // 30 seconds
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_DEBOUNCE_DELAY = 2000; // 2 seconds
const SAVE_VERSION = 1;
// ============================================================================
// HELPERS
// ============================================================================
function isLocalStorageAvailable() {
    try {
        const testKey = '__docx_editor_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    }
    catch (_a) {
        return false;
    }
}
function serializeForStorage(document) {
    return JSON.stringify(Object.assign(Object.assign({}, document), { originalBuffer: null }));
}
function parseSavedData(json) {
    try {
        const data = JSON.parse(json);
        if (!data || typeof data !== 'object')
            return null;
        if (!data.document || !data.savedAt)
            return null;
        if (data.version !== SAVE_VERSION) {
            console.warn('Auto-save data version mismatch, may need migration');
        }
        return data;
    }
    catch (_a) {
        return null;
    }
}
function isStale(savedAt, maxAge) {
    const savedTime = new Date(savedAt).getTime();
    return Date.now() - savedTime > maxAge;
}
// ============================================================================
// MANAGER
// ============================================================================
export class AutoSaveManager extends Subscribable {
    constructor(options = {}) {
        var _a, _b, _c, _d, _e;
        super({
            status: 'idle',
            lastSaveTime: null,
            hasRecoveryData: false,
            isEnabled: true,
        });
        this.currentDocument = null;
        this.lastSavedJson = null;
        this.intervalTimer = null;
        this.debounceTimer = null;
        this.status = 'idle';
        this.lastSaveTime = null;
        this._hasRecoveryData = false;
        this.storageKey = (_a = options.storageKey) !== null && _a !== void 0 ? _a : DEFAULT_STORAGE_KEY;
        this.interval = (_b = options.interval) !== null && _b !== void 0 ? _b : DEFAULT_INTERVAL;
        this.maxAge = (_c = options.maxAge) !== null && _c !== void 0 ? _c : DEFAULT_MAX_AGE;
        this.saveOnChange = (_d = options.saveOnChange) !== null && _d !== void 0 ? _d : true;
        this.debounceDelay = (_e = options.debounceDelay) !== null && _e !== void 0 ? _e : DEFAULT_DEBOUNCE_DELAY;
        this.onSaveCallback = options.onSave;
        this.onErrorCallback = options.onError;
        this.onRecoveryAvailableCallback = options.onRecoveryAvailable;
        this._isEnabled = true;
        this.storageAvailable = isLocalStorageAvailable();
        // Check for recovery data
        this.checkRecoveryData();
    }
    // --------------------------------------------------------------------------
    // PUBLIC API
    // --------------------------------------------------------------------------
    /** Update the current document. Triggers debounced save if enabled. */
    onDocumentChanged(document) {
        this.currentDocument = document;
        if (this._isEnabled && this.saveOnChange && document && this.storageAvailable) {
            this.debounceSave();
        }
    }
    /** Manually trigger a save. */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!this.storageAvailable) {
                (_a = this.onErrorCallback) === null || _a === void 0 ? void 0 : _a.call(this, new Error('localStorage is not available'));
                return false;
            }
            const doc = this.currentDocument;
            if (!doc)
                return false;
            this.updateStatus('saving');
            try {
                const serialized = serializeForStorage(doc);
                // Skip if unchanged
                if (serialized === this.lastSavedJson) {
                    this.updateStatus('saved');
                    return true;
                }
                this.persistToStorage(serialized);
                this.lastSavedJson = serialized;
                const saveTime = new Date();
                this.lastSaveTime = saveTime;
                this.updateStatus('saved');
                (_b = this.onSaveCallback) === null || _b === void 0 ? void 0 : _b.call(this, saveTime);
                return true;
            }
            catch (error) {
                console.error('Auto-save failed:', error);
                this.updateStatus('error');
                (_c = this.onErrorCallback) === null || _c === void 0 ? void 0 : _c.call(this, error);
                return false;
            }
        });
    }
    /** Clear auto-saved data from storage. */
    clear() {
        if (!this.storageAvailable)
            return;
        try {
            localStorage.removeItem(this.storageKey);
            this._hasRecoveryData = false;
            this.lastSavedJson = null;
            this.emitSnapshot();
        }
        catch (error) {
            console.error('Failed to clear auto-save:', error);
        }
    }
    /** Get recovery data from storage. */
    getRecoveryData() {
        if (!this.storageAvailable)
            return null;
        try {
            const savedJson = localStorage.getItem(this.storageKey);
            if (!savedJson)
                return null;
            const savedData = parseSavedData(savedJson);
            if (!savedData)
                return null;
            if (isStale(savedData.savedAt, this.maxAge)) {
                this.clear();
                return null;
            }
            return savedData;
        }
        catch (_a) {
            return null;
        }
    }
    /** Accept recovery and return the document. */
    acceptRecovery() {
        const data = this.getRecoveryData();
        if (!data)
            return null;
        this._hasRecoveryData = false;
        this.emitSnapshot();
        return data.document;
    }
    /** Dismiss recovery and clear saved data. */
    dismissRecovery() {
        this.clear();
        this._hasRecoveryData = false;
        this.emitSnapshot();
    }
    /** Enable auto-save and start the interval timer. */
    enable() {
        this._isEnabled = true;
        this.startInterval();
        this.emitSnapshot();
    }
    /** Disable auto-save and stop all timers. */
    disable() {
        this._isEnabled = false;
        this.stopTimers();
        this.emitSnapshot();
    }
    /** Start the interval timer. Call after enabling or on init. */
    startInterval() {
        this.stopTimers();
        if (!this._isEnabled || !this.storageAvailable)
            return;
        this.intervalTimer = setInterval(() => {
            this.save();
        }, this.interval);
    }
    /** Save synchronously on destroy (best-effort). */
    destroy() {
        this.stopTimers();
        if (this._isEnabled && this.currentDocument && this.storageAvailable) {
            try {
                this.persistToStorage(serializeForStorage(this.currentDocument));
            }
            catch (error) {
                console.error('Failed to save on destroy:', error);
            }
        }
    }
    // --------------------------------------------------------------------------
    // PRIVATE
    // --------------------------------------------------------------------------
    checkRecoveryData() {
        var _a;
        if (!this.storageAvailable)
            return;
        const data = this.getRecoveryData();
        if (data) {
            this._hasRecoveryData = true;
            this.emitSnapshot();
            (_a = this.onRecoveryAvailableCallback) === null || _a === void 0 ? void 0 : _a.call(this, data);
        }
    }
    persistToStorage(serialized) {
        const dataToSave = {
            document: JSON.parse(serialized),
            savedAt: new Date().toISOString(),
            version: SAVE_VERSION,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    }
    debounceSave() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.save();
        }, this.debounceDelay);
    }
    stopTimers() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }
    updateStatus(status) {
        this.status = status;
        this.emitSnapshot();
    }
    emitSnapshot() {
        this.setSnapshot({
            status: this.status,
            lastSaveTime: this.lastSaveTime,
            hasRecoveryData: this._hasRecoveryData,
            isEnabled: this._isEnabled,
        });
    }
}
// ============================================================================
// UTILITY FUNCTIONS (re-exported as-is from the old hook)
// ============================================================================
/** Format last save time for display */
export function formatLastSaveTime(date) {
    if (!date)
        return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    if (diffSec < 10)
        return 'Just now';
    if (diffSec < 60)
        return `${diffSec} seconds ago`;
    if (diffMin < 60)
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHour < 24)
        return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
}
/** Get auto-save status label */
export function getAutoSaveStatusLabel(status) {
    const labels = {
        idle: 'Ready',
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Save failed',
    };
    return labels[status];
}
/** Get storage size used by auto-save */
export function getAutoSaveStorageSize(storageKey = DEFAULT_STORAGE_KEY) {
    try {
        const data = localStorage.getItem(storageKey);
        if (!data)
            return 0;
        return new Blob([data]).size;
    }
    catch (_a) {
        return 0;
    }
}
/** Format storage size for display */
export function formatStorageSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
/** Check if auto-save is supported */
export function isAutoSaveSupported() {
    return isLocalStorageAvailable();
}
//# sourceMappingURL=AutoSaveManager.js.map