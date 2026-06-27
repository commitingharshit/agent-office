/**
 * useAutoSave Hook
 *
 * Thin React wrapper around the framework-agnostic AutoSaveManager.
 * Bridges AutoSaveManager's subscribe/getSnapshot pattern with React state.
 */
import { formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported } from '@eigenpal/docx-core';
import type { AutoSaveStatus, SavedDocumentData } from '@eigenpal/docx-core';
import type { Document } from '@eigenpal/docx-core/types/document';
export type { AutoSaveStatus, SavedDocumentData };
export { formatLastSaveTime, getAutoSaveStatusLabel, getAutoSaveStorageSize, formatStorageSize, isAutoSaveSupported, };
/** Options for useAutoSave hook */
export interface UseAutoSaveOptions {
    /** Storage key for localStorage (default: 'docx-editor-autosave') */
    storageKey?: string;
    /** Save interval in milliseconds (default: 30000 - 30 seconds) */
    interval?: number;
    /** Whether auto-save is enabled (default: true) */
    enabled?: boolean;
    /** Maximum age of auto-save in milliseconds before it's considered stale (default: 24 hours) */
    maxAge?: number;
    /** Callback when save succeeds */
    onSave?: (timestamp: Date) => void;
    /** Callback when save fails */
    onError?: (error: Error) => void;
    /** Callback when recovery data is found */
    onRecoveryAvailable?: (savedDocument: SavedDocumentData) => void;
    /** Whether to save immediately when document changes (debounced) */
    saveOnChange?: boolean;
    /** Debounce delay for saveOnChange in milliseconds (default: 2000) */
    debounceDelay?: number;
}
/** Return value of useAutoSave hook */
export interface UseAutoSaveReturn {
    status: AutoSaveStatus;
    lastSaveTime: Date | null;
    save: () => Promise<boolean>;
    clearAutoSave: () => void;
    hasRecoveryData: boolean;
    getRecoveryData: () => SavedDocumentData | null;
    acceptRecovery: () => Document | null;
    dismissRecovery: () => void;
    isEnabled: boolean;
    enable: () => void;
    disable: () => void;
}
export declare function useAutoSave(document: Document | null | undefined, options?: UseAutoSaveOptions): UseAutoSaveReturn;
export default useAutoSave;
//# sourceMappingURL=useAutoSave.d.ts.map