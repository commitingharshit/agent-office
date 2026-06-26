export const IPC_CHANNELS = {
  // Workspace dialogs
  openFolderDialog: 'dialog:open-folder',
  openFileDialog: 'dialog:open-file',
  
  // Workspace state
  getWorkspaceState: 'workspace:get-state',
  subscribeWorkspaceState: 'workspace:state-changed',
  
  // Workspace navigation
  openWorkspaceEntry: 'workspace:open-entry',
  setSelectedEntry: 'workspace:set-selected-entry',
  
  // Tabs
  setActiveTab: 'tabs:set-active',
  closeTab: 'tabs:close',
  
  // Agent panel
  toggleAgentPanel: 'panel:toggle-agent',
  
  // Document session (Phase 1 minimum for Phase 2)
  createDocumentSession: 'document-session:create',
  getDocumentForTab: 'document-session:get-document',
  setDocumentMode: 'document-session:set-mode',
  saveDocument: 'document-session:save',
  closeDocumentSession: 'document-session:close',
  getSessionState: 'document-session:get-state',
  hasUnsavedChanges: 'document-session:has-unsaved-changes'
};

export const DOCUMENT_MODE = {
  VIEWING: 'viewing',
  EDITING: 'editing',
  SUGGESTING: 'suggesting'
};
