/**
 * SuperDoc Desktop - Renderer Process
 * 
 * This is the frontend JavaScript that runs in the renderer process.
 * It handles UI interactions, communicates with the main process via IPC,
 * and manages the workspace state.
 */

// Expose global functions for HTML onclick handlers
window.openFolder = openFolder;
window.openFile = openFile;
window.toggleAgentPanel = toggleAgentPanel;

// Workspace state (mirrored from main process)
let workspaceState = {
  workspacePath: null,
  openTabs: [],
  activeTab: null,
  activeDocument: null,
  agentPanelVisible: true
};

// DOM element references
const workspacePathEl = document.getElementById('workspace-path');
const activeTabIndicatorEl = document.getElementById('active-tab-indicator');
const agentSidebarEl = document.getElementById('agent-sidebar');
const workspaceTreeEl = document.getElementById('workspace-tree');

/**
 * Initialize the application
 */
function init() {
  console.log('SuperDoc Desktop Renderer: Initializing...');
  
  // Setup IPC listeners for messages from main process
  setupIPCListeners();
  
  // Load initial state
  loadInitialState();
  
  // Update UI based on state
  updateUI();
  
  console.log('SuperDoc Desktop Renderer: Initialized');
}

/**
 * Setup IPC listeners for receiving messages from main process
 */
function setupIPCListeners() {
  // Use the exposed API from preload.js
  if (window.electronAPI && window.electronAPI.ipcRenderer) {
    const { ipcRenderer } = window.electronAPI;
    
    // Listen for folder opened event
    ipcRenderer.on('open-folder', (event, { path }) => {
      console.log('Folder opened:', path);
      workspaceState.workspacePath = path;
      updateWorkspaceTree();
      updateUI();
    });
    
    // Listen for file opened event
    ipcRenderer.on('open-file', (event, { path, tabId }) => {
      console.log('File opened:', path, tabId);
      
      // Add tab to workspace state
      workspaceState.openTabs.push({
        id: tabId,
        path: path,
        name: path.split('/').pop(),
        type: 'docx'
      });
      workspaceState.activeTab = tabId;
      workspaceState.activeDocument = tabId;
      
      updateWorkspaceTree();
      updateUI();
      
      // TODO: Load and render the DOCX file in the editor
      // This will be implemented in Phase 1 and 2
      showEditorPlaceholder(`📄 ${path.split('/').pop()}`);
    });
  } else {
    console.warn('electronAPI not available, using fallback API');
    
    // Fallback to window.api
    if (window.api) {
      window.api.receive('open-folder', (data) => {
        workspaceState.workspacePath = data.path;
        updateWorkspaceTree();
        updateUI();
      });
      
      window.api.receive('open-file', (data) => {
        workspaceState.openTabs.push({
          id: data.tabId,
          path: data.path,
          name: data.path.split('/').pop(),
          type: 'docx'
        });
        workspaceState.activeTab = data.tabId;
        workspaceState.activeDocument = data.tabId;
        
        updateWorkspaceTree();
        updateUI();
        showEditorPlaceholder(`📄 ${data.path.split('/').pop()}`);
      });
    }
  }
}

/**
 * Load initial workspace state from main process
 */
async function loadInitialState() {
  try {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      const state = await window.electronAPI.ipcRenderer.invoke('get-workspace-state');
      workspaceState = { ...workspaceState, ...state };
      console.log('Loaded initial state:', state);
    } else if (window.api) {
      const state = await window.api.invoke('get-workspace-state');
      workspaceState = { ...workspaceState, ...state };
      console.log('Loaded initial state:', state);
    }
  } catch (error) {
    console.error('Failed to load initial state:', error);
  }
}

/**
 * Update all UI elements based on current state
 */
function updateUI() {
  // Update workspace path indicator
  if (workspaceState.workspacePath) {
    const shortenedPath = workspaceState.workspacePath.length > 40 
      ? '...' + workspaceState.workspacePath.slice(-37) 
      : workspaceState.workspacePath;
    workspacePathEl.textContent = shortenedPath;
    workspacePathEl.title = workspaceState.workspacePath;
  } else {
    workspacePathEl.textContent = 'No workspace selected';
    workspacePathEl.title = '';
  }
  
  // Update active tab indicator
  const activeTab = workspaceState.openTabs.find(t => t.id === workspaceState.activeTab);
  if (activeTab) {
    activeTabIndicatorEl.textContent = activeTab.name;
    activeTabIndicatorEl.classList.add('has-document');
  } else {
    activeTabIndicatorEl.textContent = 'No document open';
    activeTabIndicatorEl.classList.remove('has-document');
  }
  
  // Update agent panel visibility
  if (workspaceState.agentPanelVisible) {
    agentSidebarEl.classList.remove('hidden');
  } else {
    agentSidebarEl.classList.add('hidden');
  }
}

/**
 * Update the workspace tree in the left pane
 */
function updateWorkspaceTree() {
  // For Phase 0, we just show the workspace path and tabs
  // In Phase 3, this will be expanded to show the full file tree
  
  const treeContent = document.createElement('div');
  
  // Workspace root
  if (workspaceState.workspacePath) {
    const rootItem = document.createElement('div');
    rootItem.className = 'tree-item workspace-root';
    rootItem.innerHTML = `<span class="tree-icon">📁</span><span class="tree-label">${workspaceState.workspacePath.split('/').pop()}</span>`;
    rootItem.onclick = () => {
      // TODO: Expand/collapse workspace
    };
    treeContent.appendChild(rootItem);
    
    // Show open tabs/files
    if (workspaceState.openTabs.length > 0) {
      const filesHeader = document.createElement('div');
      filesHeader.className = 'tree-item';
      filesHeader.style.fontSize = '11px';
      filesHeader.style.color = '#666666';
      filesHeader.style.paddingLeft = '15px';
      filesHeader.textContent = 'OPEN FILES';
      treeContent.appendChild(filesHeader);
      
      workspaceState.openTabs.forEach(tab => {
        const fileItem = document.createElement('div');
        fileItem.className = 'tree-item';
        fileItem.style.paddingLeft = '20px';
        fileItem.innerHTML = `<span class="tree-icon">📄</span><span class="tree-label">${tab.name}</span>`;
        fileItem.onclick = () => {
          setActiveTab(tab.id);
        };
        
        if (tab.id === workspaceState.activeTab) {
          fileItem.style.backgroundColor = '#2d2d2d';
          fileItem.style.color = '#ffffff';
        }
        
        treeContent.appendChild(fileItem);
      });
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'tree-item tree-placeholder';
      placeholder.innerHTML = '<em>Open a folder to see files</em>';
      treeContent.appendChild(placeholder);
    }
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'tree-item tree-placeholder';
    placeholder.innerHTML = '<em>Open a folder to see files</em>';
    treeContent.appendChild(placeholder);
  }
  
  // Replace the content of workspace tree
  const paneContent = workspaceTreeEl.querySelector('.pane-content');
  if (paneContent) {
    paneContent.innerHTML = '';
    paneContent.appendChild(treeContent);
  }
}

/**
 * Show placeholder in editor with message
 */
function showEditorPlaceholder(message) {
  const editorContent = document.getElementById('editor-content');
  const placeholder = editorContent.querySelector('.editor-placeholder');
  
  if (placeholder) {
    placeholder.querySelector('h2').textContent = message;
  }
}

/**
 * Open folder dialog via IPC
 */
async function openFolder() {
  console.log('Opening folder dialog...');
  
  try {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      const result = await window.electronAPI.ipcRenderer.invoke('open-folder');
      if (result.success) {
        console.log('Folder selected:', result.path);
      }
    } else if (window.api) {
      const result = await window.api.invoke('open-folder');
      if (result.success) {
        console.log('Folder selected:', result.path);
      }
    }
  } catch (error) {
    console.error('Failed to open folder:', error);
  }
}

/**
 * Open file dialog via IPC
 */
async function openFile() {
  console.log('Opening file dialog...');
  
  try {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      const result = await window.electronAPI.ipcRenderer.invoke('open-file');
      if (result.success) {
        console.log('File selected:', result.path);
      }
    } else if (window.api) {
      const result = await window.api.invoke('open-file');
      if (result.success) {
        console.log('File selected:', result.path);
      }
    }
  } catch (error) {
    console.error('Failed to open file:', error);
  }
}

/**
 * Toggle agent panel visibility
 */
async function toggleAgentPanel() {
  try {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      const result = await window.electronAPI.ipcRenderer.invoke('toggle-agent-panel');
      workspaceState.agentPanelVisible = result.visible;
      updateUI();
    } else if (window.api) {
      const result = await window.api.invoke('toggle-agent-panel');
      workspaceState.agentPanelVisible = result.visible;
      updateUI();
    }
  } catch (error) {
    console.error('Failed to toggle agent panel:', error);
    // Fallback to local state
    workspaceState.agentPanelVisible = !workspaceState.agentPanelVisible;
    updateUI();
  }
}

/**
 * Set active tab
 */
async function setActiveTab(tabId) {
  try {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      await window.electronAPI.ipcRenderer.invoke('set-active-tab', tabId);
    } else if (window.api) {
      await window.api.invoke('set-active-tab', tabId);
    }
    
    workspaceState.activeTab = tabId;
    workspaceState.activeDocument = tabId;
    
    const activeTab = workspaceState.openTabs.find(t => t.id === tabId);
    if (activeTab) {
      showEditorPlaceholder(`📄 ${activeTab.name}`);
    }
    
    updateUI();
    updateWorkspaceTree();
  } catch (error) {
    console.error('Failed to set active tab:', error);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Also run init if it's already loaded
document.readyState === 'complete' && init();
