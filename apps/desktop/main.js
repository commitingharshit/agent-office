/**
 * SuperDoc Desktop main process.
 *
 * Phase 0 keeps the shell thin: filesystem access and state transitions happen
 * here, while the renderer consumes snapshots and dispatches intents.
 * 
 * Phase 1/2: Document session service integrated for SuperDoc embedding.
 */

import { promises as fs } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { IPC_CHANNELS, DOCUMENT_MODE } from './ipc.js';
import { createWorkspaceStore } from './store.js';
import {
  createDocumentSession,
  getDocumentForSuperDoc,
  setDocumentMode,
  saveDocumentSession,
  closeDocumentSession,
  getSessionState,
  hasUnsavedChanges
} from './document-session.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow = null;
const workspaceStore = createWorkspaceStore();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: 'SuperDoc Desktop',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function broadcastWorkspaceState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(
    IPC_CHANNELS.subscribeWorkspaceState,
    workspaceStore.getState()
  );
}

async function handleOpenFolder() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Workspace Folder',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Open Folder'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    const workspacePath = resolve(result.filePaths[0]);
    workspaceStore.setWorkspace(workspacePath);
    workspaceStore.setWorkspaceTree(await buildWorkspaceTree(workspacePath));

    return {
      success: true,
      path: workspacePath
    };
  } catch (error) {
    return formatError('OPEN_FOLDER_FAILED', error);
  }
}

async function handleOpenFile({ path } = {}) {
  try {
    let filePath = path;

    if (!filePath) {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open DOCX File',
        properties: ['openFile'],
        defaultPath: workspaceStore.getState().workspacePath ?? undefined,
        filters: [{ name: 'Word Documents', extensions: ['docx'] }],
        buttonLabel: 'Open File'
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }

      [filePath] = result.filePaths;
    }

    const absolutePath = resolve(filePath);
    if (extname(absolutePath).toLowerCase() !== '.docx') {
      return {
        success: false,
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'Only .docx files are supported.'
        }
      };
    }

    await assertReadable(absolutePath);

    // Create tab in workspace store
    const tab = workspaceStore.addTab({
      id: `tab-${Date.now()}`,
      path: absolutePath,
      name: basename(absolutePath),
      type: 'docx'
    });

    // Create document session for this tab (Phase 1 minimum)
    // This reads the file and prepares it for SuperDoc
    await createDocumentSession(absolutePath, tab.id);

    return {
      success: true,
      path: absolutePath,
      tabId: tab.id
    };
  } catch (error) {
    return formatError('OPEN_FILE_FAILED', error);
  }
}

async function handleOpenWorkspaceEntry(entryPath) {
  try {
    const absolutePath = resolve(entryPath);
    const stats = await fs.stat(absolutePath);

    if (stats.isDirectory()) {
      workspaceStore.setSelectedEntry(absolutePath, 'directory');
      return { success: true, type: 'directory', path: absolutePath };
    }

    const result = await handleOpenFile({ path: absolutePath });
    return {
      ...result,
      type: 'file'
    };
  } catch (error) {
    return formatError('OPEN_ENTRY_FAILED', error);
  }
}

function setupIPC() {
  ipcMain.handle(IPC_CHANNELS.openFolderDialog, handleOpenFolder);
  ipcMain.handle(IPC_CHANNELS.openFileDialog, (_, payload) => handleOpenFile(payload));
  ipcMain.handle(IPC_CHANNELS.getWorkspaceState, () => workspaceStore.getState());
  ipcMain.handle(IPC_CHANNELS.openWorkspaceEntry, (_, entryPath) => handleOpenWorkspaceEntry(entryPath));
  ipcMain.handle(IPC_CHANNELS.setSelectedEntry, (_, payload) => {
    workspaceStore.setSelectedEntry(payload.path, payload.type);
    return { success: true };
  });
  ipcMain.handle(IPC_CHANNELS.setActiveTab, (_, tabId) => {
    const tab = workspaceStore.setActiveTab(tabId);
    return {
      success: Boolean(tab),
      tabId
    };
  });
  ipcMain.handle(IPC_CHANNELS.closeTab, (_, tabId) => {
    workspaceStore.closeTab(tabId);
    closeDocumentSession(tabId);
    return { success: true };
  });
  ipcMain.handle(IPC_CHANNELS.toggleAgentPanel, () => {
    const visible = workspaceStore.toggleAgentPanel();
    return { success: true, visible };
  });

  // Document session IPC handlers (Phase 1 minimum for Phase 2)
  ipcMain.handle(IPC_CHANNELS.createDocumentSession, async (_, { filePath, tabId }) => {
    return await createDocumentSession(filePath, tabId);
  });
  
  ipcMain.handle(IPC_CHANNELS.getDocumentForTab, (_, tabId) => {
    const file = getDocumentForSuperDoc(tabId);
    return file ? { success: true, file } : { success: false };
  });
  
  ipcMain.handle(IPC_CHANNELS.setDocumentMode, (_, { tabId, mode }) => {
    if (Object.values(DOCUMENT_MODE).includes(mode)) {
      setDocumentMode(tabId, mode);
      return { success: true, mode };
    }
    return { success: false, error: { code: 'INVALID_MODE', message: `Invalid document mode: ${mode}` } };
  });
  
  ipcMain.handle(IPC_CHANNELS.saveDocument, async (_, { tabId, blob }) => {
    try {
      const result = await saveDocumentSession(tabId, blob);
      return { success: true, ...result };
    } catch (error) {
      return formatError('SAVE_FAILED', error);
    }
  });
  
  ipcMain.handle(IPC_CHANNELS.closeDocumentSession, (_, tabId) => {
    closeDocumentSession(tabId);
    return { success: true };
  });
  
  ipcMain.handle(IPC_CHANNELS.getSessionState, (_, tabId) => {
    return getSessionState(tabId);
  });
  
  ipcMain.handle(IPC_CHANNELS.hasUnsavedChanges, (_, tabId) => {
    return { hasUnsavedChanges: hasUnsavedChanges(tabId) };
  });
}

async function buildWorkspaceTree(rootPath) {
  return {
    name: basename(rootPath),
    path: rootPath,
    type: 'directory',
    children: await readDirectoryEntries(rootPath)
  };
}

async function readDirectoryEntries(directoryPath) {
  let entries = [];
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return [];
  }
  const sortedEntries = entries
    .filter((entry) => entry.isDirectory() || extname(entry.name).toLowerCase() === '.docx')
    .sort((left, right) => {
      if (left.isDirectory() !== right.isDirectory()) {
        return left.isDirectory() ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

  return Promise.all(
    sortedEntries.map(async (entry) => {
      const entryPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: entryPath,
          type: 'directory',
          children: await readDirectoryEntries(entryPath)
        };
      }

      return {
        name: entry.name,
        path: entryPath,
        type: 'file'
      };
    })
  );
}

async function assertReadable(filePath) {
  await fs.access(filePath);
}

function formatError(code, error) {
  return {
    success: false,
    error: {
      code,
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

workspaceStore.subscribe(() => {
  broadcastWorkspaceState();
});

app.whenReady().then(() => {
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      broadcastWorkspaceState();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
