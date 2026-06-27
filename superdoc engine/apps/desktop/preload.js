import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, DOCUMENT_MODE } from './ipc.js';

let activeEditor = null;
let activeTabId = null;
let superdocModulePromise = null;
let fontsModulePromise = null;

contextBridge.exposeInMainWorld('desktop', {
  openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.openFolderDialog),
  openFile: (payload) => ipcRenderer.invoke(IPC_CHANNELS.openFileDialog, payload),
  getWorkspaceState: () => ipcRenderer.invoke(IPC_CHANNELS.getWorkspaceState),
  openWorkspaceEntry: (entryPath) =>
    ipcRenderer.invoke(IPC_CHANNELS.openWorkspaceEntry, entryPath),
  setSelectedEntry: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.setSelectedEntry, payload),
  setActiveTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.setActiveTab, tabId),
  closeTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.closeTab, tabId),
  toggleAgentPanel: () => ipcRenderer.invoke(IPC_CHANNELS.toggleAgentPanel),
  getDocumentForTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.getDocumentForTab, tabId),
  setDocumentMode: ({ tabId, mode }) => ipcRenderer.invoke(IPC_CHANNELS.setDocumentMode, { tabId, mode }),
  markDocumentDirty: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.markDocumentDirty, tabId),
  saveDocument: ({ tabId, bytes }) => ipcRenderer.invoke(IPC_CHANNELS.saveDocument, { tabId, bytes }),
  getSessionState: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.getSessionState, tabId),
  hasUnsavedChanges: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.hasUnsavedChanges, tabId),
  onWorkspaceStateChanged: (listener) => {
    const wrapped = (_event, state) => listener(state);
    ipcRenderer.on(IPC_CHANNELS.subscribeWorkspaceState, wrapped);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.subscribeWorkspaceState, wrapped);
    };
  },
  DOCUMENT_MODE
});

contextBridge.exposeInMainWorld('superdocDesktop', {
  mountDocument,
  setDocumentMode: async (mode) => {
    if (!activeEditor) throw new Error('No active SuperDoc instance.');
    activeEditor.setDocumentMode(mode);
  },
  exportCurrentDocument,
  destroyDocument
});

async function mountDocument({ tabId, selector, toolbar, payload, mode }) {
  await destroyDocument();

  const [{ SuperDoc }, fontsModule] = await Promise.all([
    loadSuperDocModule(),
    loadFontsModule()
  ]);

  const file = new File([payload.data], payload.fileName, {
    type: payload.mimeType,
    lastModified: payload.lastModified
  });

  activeEditor = new SuperDoc({
    selector,
    toolbar,
    document: file,
    documentMode: mode,
    fonts: fontsModule.superdocFonts,
    onReady: () => {
      window.dispatchEvent(
        new CustomEvent('superdoc:ready', {
          detail: { tabId }
        })
      );
    },
    onException: (error) => {
      window.dispatchEvent(
        new CustomEvent('superdoc:error', {
          detail: { tabId, message: error?.message ?? String(error) }
        })
      );
    },
    onEditorCreate: ({ editor }) => {
      editor?.on?.('update', () => {
        window.dispatchEvent(
          new CustomEvent('superdoc:update', {
            detail: { tabId }
          })
        );
      });
    }
  });

  activeTabId = tabId;
}

async function exportCurrentDocument({ format = 'docx' } = {}) {
  if (!activeEditor) throw new Error('No active SuperDoc instance.');
  const blob = await activeEditor.export({ format });
  return new Uint8Array(await blob.arrayBuffer());
}

async function destroyDocument() {
  if (!activeEditor) return;
  try {
    activeEditor.destroy();
  } finally {
    activeEditor = null;
    activeTabId = null;
  }
}

function loadSuperDocModule() {
  if (!superdocModulePromise) {
    superdocModulePromise = import('superdoc');
  }
  return superdocModulePromise;
}

function loadFontsModule() {
  if (!fontsModulePromise) {
    fontsModulePromise = import('@superdoc-dev/fonts');
  }
  return fontsModulePromise;
}
