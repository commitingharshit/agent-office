/**
 * useAutoSave Hook
 *
 * Thin React wrapper around the framework-agnostic AutoSaveManager.
 * Bridges AutoSaveManager's subscribe/getSnapshot pattern with React state.
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { AutoSaveManager, formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported, } from '@eigenpal/docx-core';
export { formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported, };
// ============================================================================
// HOOK
// ============================================================================
export function useAutoSave(document, options = {}) {
    const { storageKey, interval, enabled: initialEnabled = true, maxAge, onSave, onError, onRecoveryAvailable, saveOnChange, debounceDelay, } = options;
    // Create the manager once (stable across renders)
    const manager = useMemo(() => new AutoSaveManager({
        storageKey,
        interval,
        maxAge,
        saveOnChange,
        debounceDelay,
        onSave,
        onError,
        onRecoveryAvailable,
    }), 
    // Only recreate if storageKey changes — callbacks are captured in the manager
    [storageKey]);
    // Start/stop interval based on enabled prop
    useEffect(() => {
        if (initialEnabled) {
            manager.enable();
            manager.startInterval();
        }
        else {
            manager.disable();
        }
    }, [manager, initialEnabled]);
    // Feed document changes to the manager
    useEffect(() => {
        manager.onDocumentChanged(document !== null && document !== void 0 ? document : null);
    }, [manager, document]);
    // Destroy on unmount
    useEffect(() => {
        return () => {
            manager.destroy();
        };
    }, [manager]);
    // Subscribe to manager state via useSyncExternalStore
    const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot);
    // Stable callback refs
    const save = useCallback(() => manager.save(), [manager]);
    const clearAutoSave = useCallback(() => manager.clear(), [manager]);
    const getRecoveryData = useCallback(() => manager.getRecoveryData(), [manager]);
    const acceptRecovery = useCallback(() => manager.acceptRecovery(), [manager]);
    const dismissRecovery = useCallback(() => manager.dismissRecovery(), [manager]);
    const enable = useCallback(() => manager.enable(), [manager]);
    const disable = useCallback(() => manager.disable(), [manager]);
    return {
        status: snapshot.status,
        lastSaveTime: snapshot.lastSaveTime,
        save,
        clearAutoSave,
        hasRecoveryData: snapshot.hasRecoveryData,
        getRecoveryData,
        acceptRecovery,
        dismissRecovery,
        isEnabled: snapshot.isEnabled,
        enable,
        disable,
    };
}
export default useAutoSave;
//# sourceMappingURL=useAutoSave.js.map