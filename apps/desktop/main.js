/**
 * SuperDoc Desktop - Main Process
 * 
 * This is the Electron main process that manages the application lifecycle,
 * creates the main window, and handles native OS interactions.
 */

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {BrowserWindow | null}
 */
let mainWindow = null;

// Store reference to workspace state
let workspaceState = {
  workspacePath: null,
  openTabs: [],
  activeTab: null,
  activeDocument: null,
  agentPanelVisible: true
};

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'SuperDoc Desktop',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Handle Open Folder command
 * Opens a dialog to select a workspace folder
 */
async function handleOpenFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Workspace Folder',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Open Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    workspaceState.workspacePath = folderPath;
    
    // Send to renderer process
    mainWindow.webContents.send('open-folder', { path: folderPath });
    
    return { success: true, path: folderPath };
  }
  
  return { success: false };
}

/**
 * Handle Open File command
 * Opens a dialog to select a DOCX file
 */
async function handleOpenFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open DOCX File',
    properties: ['openFile'],
    filters: [
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    buttonLabel: 'Open File'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    
    // Add to tabs
    const tabId = `tab-${Date.now()}`;
    workspaceState.openTabs.push({
      id: tabId,
      path: filePath,
      name: filePath.split('/').pop(),
      type: 'docx'
    });
    workspaceState.activeTab = tabId;
    workspaceState.activeDocument = tabId;
    
    // Send to renderer process
    mainWindow.webContents.send('open-file', { 
      path: filePath,
      tabId
    });
    
    return { success: true, path: filePath, tabId };
  }
  
  return { success: false };
}

/**
 * Get current workspace state
 */
function getWorkspaceState() {
  return { ...workspaceState };
}

/**
 * Set up IPC handlers for communication with renderer process
 */
function setupIPC() {
  // Open folder handler
  ipcMain.handle('open-folder', async () => {
    return await handleOpenFolder();
  });

  // Open file handler
  ipcMain.handle('open-file', async () => {
    return await handleOpenFile();
  });

  // Get workspace state
  ipcMain.handle('get-workspace-state', () => {
    return getWorkspaceState();
  });

  // Set workspace path
  ipcMain.handle('set-workspace-path', (event, path) => {
    workspaceState.workspacePath = path;
    return { success: true };
  });

  // Add tab
  ipcMain.handle('add-tab', (event, tabInfo) => {
    const tabId = `tab-${Date.now()}`;
    workspaceState.openTabs.push({
      id: tabId,
      ...tabInfo
    });
    return { success: true, tabId };
  });

  // Set active tab
  ipcMain.handle('set-active-tab', (event, tabId) => {
    workspaceState.activeTab = tabId;
    workspaceState.activeDocument = tabId;
    return { success: true };
  });

  // Close tab
  ipcMain.handle('close-tab', (event, tabId) => {
    workspaceState.openTabs = workspaceState.openTabs.filter(
      tab => tab.id !== tabId
    );
    if (workspaceState.activeTab === tabId) {
      workspaceState.activeTab = null;
      workspaceState.activeDocument = null;
    }
    return { success: true };
  });

  // Toggle agent panel
  ipcMain.handle('toggle-agent-panel', (event) => {
    workspaceState.agentPanelVisible = !workspaceState.agentPanelVisible;
    return { success: true, visible: workspaceState.agentPanelVisible };
  });
}

// This method will be called when Electron has finished initialization
// and is ready to create browser windows
app.whenReady().then(() => {
  // Setup IPC handlers
  setupIPC();
  
  // Create main window
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
