/**
 * file-source — pluggable storage abstraction.
 *
 * One interface (FileSource), three implementations:
 *   - BrowserFileSource   (Mode 1 — Pages)
 *   - WopiFileSource      (Mode 2 — WOPI, Phase D, not yet)
 *   - PersonalFileSource  (Mode 3 — Standalone)
 *
 * See docs/internal/11-storage-modes.md for the design contract.
 */
export { BrowserFileSource } from './browser';
export { PersonalFileSource, PersonalFileSourceError, } from './personal';
export { AuthClient } from './auth-client';
export { PersonalAuthGate, PersonalAuthGateModal, usePersonalAuth, useAuthContext, } from './PersonalAuthGate';
export { UserMenu } from './UserMenu';
export { ProfileSettingsDialog } from './ProfileSettingsDialog';
export { useFileSourceAutoSave, } from './useFileSourceAutoSave';
export { AutosaveStatus } from './AutosaveStatus';
export { WopiFileSource, WopiNotSupportedError, WopiSaveConflictError, } from './wopi';
export { chooseFileSource, extractWopiContext, } from './select';
export { FileSourceProvider, useFileSource } from './context';
//# sourceMappingURL=index.js.map