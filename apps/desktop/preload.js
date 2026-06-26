import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, DOCUMENT_MODE } from './ipc.js';

contextBridge.exposeInMainWorld('desktop', {
  // Workspace
  openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.openFolderDialog),
  openFile: (payload) => ipcRenderer.invoke(IPC_CHANNELS.openFileDialog, payload),
  getWorkspaceState: () => ipcRenderer.invoke(IPC_CHANNELS.getWorkspaceState),
  openWorkspaceEntry: (entryPath) =>
    ipcRenderer.invoke(IPC_CHANNELS.openWorkspaceEntry, entryPath),
  setSelectedEntry: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.setSelectedEntry, payload),
  
  // Tabs
  setActiveTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.setActiveTab, tabId),
  closeTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.closeTab, tabId),
  
  // Agent panel
  toggleAgentPanel: () => ipcRenderer.invoke(IPC_CHANNELS.toggleAgentPanel),
  
  // Document session (Phase 1 minimum for Phase 2)
  getDocumentForTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.getDocumentForTab, tabId),
  setDocumentMode: ({ tabId, mode }) => ipcRenderer.invoke(IPC_CHANNELS.setDocumentMode, { tabId, mode }),
  saveDocument: ({ tabId, blob }) => ipcRenderer.invoke(IPC_CHANNELS.saveDocument, { tabId, blob }),
  getSessionState: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.getSessionState, tabId),
  hasUnsavedChanges: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.hasUnsavedChanges, tabId),
  
  // Events
  onWorkspaceStateChanged: (listener) => {
    const wrapped = (_event, state) => listener(state);
    ipcRenderer.on(IPC_CHANNELS.subscribeWorkspaceState, wrapped);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.subscribeWorkspaceState, wrapped);
    };
  },
  
  // Constants
  DOCUMENT_MODE
});
