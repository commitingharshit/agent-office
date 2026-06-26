let workspaceState = {
  workspacePath: null,
  workspaceTree: null,
  openTabs: [],
  activeTab: null,
  activeDocument: null,
  agentPanelVisible: true,
  selectedPath: null,
  selectedEntryType: null
};

// Document session state (Phase 2)
let activeSuperDocInstance = null;
let currentTabId = null;

const workspacePathEl = document.getElementById('workspace-path');
const workspaceSummaryEl = document.getElementById('workspace-summary');
const workspaceTreeEl = document.getElementById('workspace-tree');
const activeTabIndicatorEl = document.getElementById('active-tab-indicator');
const tabStripEl = document.getElementById('tab-strip');
const editorContentEl = document.getElementById('editor-content');
const agentSidebarEl = document.getElementById('agent-sidebar');
const selectionStatusEl = document.getElementById('selection-status');
const documentStatusEl = document.getElementById('document-status');
const superdocContainerEl = document.getElementById('superdoc-container');
const documentToolbarEl = document.getElementById('document-toolbar');

// Toolbar mode buttons
const modeViewingBtn = document.getElementById('mode-viewing');
const modeEditingBtn = document.getElementById('mode-editing');
const modeSuggestingBtn = document.getElementById('mode-suggesting');
const saveButton = document.getElementById('save-button');

async function init() {
  bindEvents();

  if (!window.desktop) {
    showFatal('Desktop preload API is unavailable.');
    return;
  }

  window.desktop.onWorkspaceStateChanged((nextState) => {
    workspaceState = nextState;
    render();
  });

  workspaceState = await window.desktop.getWorkspaceState();
  render();
}

function bindEvents() {
  // Workspace events
  document.getElementById('open-folder-button').addEventListener('click', openFolder);
  document.getElementById('open-file-button').addEventListener('click', openFile);
  document.getElementById('placeholder-open-file').addEventListener('click', openFile);
  document.getElementById('toggle-agent-button').addEventListener('click', toggleAgentPanel);
  document.getElementById('close-agent-button').addEventListener('click', toggleAgentPanel);

  // Document toolbar events (Phase 2)
  if (modeViewingBtn) modeViewingBtn.addEventListener('click', () => setDocumentMode('viewing'));
  if (modeEditingBtn) modeEditingBtn.addEventListener('click', () => setDocumentMode('editing'));
  if (modeSuggestingBtn) modeSuggestingBtn.addEventListener('click', () => setDocumentMode('suggesting'));
  if (saveButton) saveButton.addEventListener('click', saveDocument);
}

function render() {
  renderTopBar();
  renderWorkspaceTree();
  renderTabs();
  renderEditorSurface();
  renderDocumentToolbar();
  renderAgentPanel();
  renderStatusStrip();
}

function renderTopBar() {
  if (workspaceState.workspacePath) {
    workspacePathEl.textContent = workspaceState.workspacePath;
    workspacePathEl.title = workspaceState.workspacePath;
    workspaceSummaryEl.textContent = `${countDocxFiles(workspaceState.workspaceTree)} DOCX files`;
  } else {
    workspacePathEl.textContent = 'No workspace selected';
    workspacePathEl.title = '';
    workspaceSummaryEl.textContent = 'No folder';
  }

  const activeTab = getActiveTab();
  activeTabIndicatorEl.textContent = activeTab ? activeTab.name : 'No document open';
  activeTabIndicatorEl.classList.toggle('has-document', Boolean(activeTab));
}

function renderWorkspaceTree() {
  const paneContent = workspaceTreeEl.querySelector('.pane-content');
  paneContent.innerHTML = '';

  if (!workspaceState.workspaceTree) {
    paneContent.appendChild(createEmptyState('Select a folder to browse `.docx` files.'));
    return;
  }

  paneContent.appendChild(renderTreeNode(workspaceState.workspaceTree, 0));
}

function renderTreeNode(node, depth) {
  const container = document.createElement('div');
  container.className = 'tree-node';

  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'tree-item';
  row.style.setProperty('--depth', `${depth}`);
  row.dataset.entryType = node.type;
  row.dataset.active = String(workspaceState.selectedPath === node.path);
  row.innerHTML = `
    <span class="tree-icon">${node.type === 'directory' ? 'DIR' : 'DOCX'}</span>
    <span class="tree-label">${node.name}</span>
  `;

  row.addEventListener('click', async () => {
    await window.desktop.setSelectedEntry({ path: node.path, type: node.type });
    if (node.type === 'file') {
      await window.desktop.openWorkspaceEntry(node.path);
    }
  });

  container.appendChild(row);

  if (node.type === 'directory' && node.children?.length) {
    const children = document.createElement('div');
    children.className = 'tree-children';
    for (const child of node.children) {
      children.appendChild(renderTreeNode(child, depth + 1));
    }
    container.appendChild(children);
  }

  return container;
}

function renderTabs() {
  tabStripEl.innerHTML = '';

  if (workspaceState.openTabs.length === 0) {
    tabStripEl.classList.add('is-empty');
    return;
  }

  tabStripEl.classList.remove('is-empty');

  for (const tab of workspaceState.openTabs) {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-pill';
    tabEl.dataset.active = String(tab.id === workspaceState.activeTab);

    const activateButton = document.createElement('button');
    activateButton.type = 'button';
    activateButton.className = 'tab-pill-button';
    activateButton.textContent = tab.name;
    activateButton.addEventListener('click', async () => {
      await window.desktop.setActiveTab(tab.id);
      await switchToTab(tab.id);
    });

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'tab-pill-close';
    closeButton.textContent = 'x';
    closeButton.title = `Close ${tab.name}`;
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      window.desktop.closeTab(tab.id);
    });

    tabEl.appendChild(activateButton);
    tabEl.appendChild(closeButton);
    tabStripEl.appendChild(tabEl);
  }
}

/**
 * Render document toolbar (Phase 2)
 */
function renderDocumentToolbar() {
  const activeTab = getActiveTab();
  const hasDocument = Boolean(activeTab);
  
  // Show/hide toolbar based on whether a document is open
  documentToolbarEl.classList.toggle('visible', hasDocument);
  
  if (!hasDocument) {
    return;
  }

  // Update mode buttons based on current session state
  if (!window.desktop || !window.desktop.DOCUMENT_MODE) {
    return;
  }

  // Get session state from main process
  const sessionState = window.desktop.getSessionState(activeTab.id);
  
  // Update active mode button
  modeViewingBtn.classList.toggle('active', sessionState.mode === window.desktop.DOCUMENT_MODE.VIEWING);
  modeEditingBtn.classList.toggle('active', sessionState.mode === window.desktop.DOCUMENT_MODE.EDITING);
  modeSuggestingBtn.classList.toggle('active', sessionState.mode === window.desktop.DOCUMENT_MODE.SUGGESTING);
  
  // Update save button state
  saveButton.disabled = !sessionState.dirty;
}

function renderEditorSurface() {
  const activeTab = getActiveTab();

  if (!activeTab) {
    showEditorPlaceholder();
    hideSuperDocContainer();
    return;
  }

  // Check if we have a document session for this tab
  if (!window.desktop) {
    showEditorPlaceholder();
    hideSuperDocContainer();
    return;
  }

  const sessionState = window.desktop.getSessionState(activeTab.id);
  
  if (sessionState.loaded) {
    // Hide placeholder and show SuperDoc container
    hideEditorPlaceholder();
    showSuperDocContainer();
    
    // If this is a new tab or we need to load the document, do so
    if (currentTabId !== activeTab.id) {
      loadDocumentForTab(activeTab.id);
    }
  } else {
    // Show placeholder for now
    showEditorPlaceholder();
    hideSuperDocContainer();
  }
}

function renderAgentPanel() {
  agentSidebarEl.classList.toggle('hidden', !workspaceState.agentPanelVisible);
}

function renderStatusStrip() {
  selectionStatusEl.textContent = workspaceState.selectedPath
    ? `${workspaceState.selectedEntryType ?? 'entry'}: ${workspaceState.selectedPath}`
    : 'No selection';

  const activeTab = getActiveTab();
  documentStatusEl.textContent = activeTab
    ? `Active tab: ${activeTab.name}`
    : 'Waiting for a DOCX session';
}

function showEditorPlaceholder() {
  editorContentEl.innerHTML = `
    <div class="editor-placeholder">
      <div class="placeholder-badge">Phase 0</div>
      <h1>Desktop shell ready</h1>
      <p>Open a folder, browse the workspace, and select a \`.docx\` file.</p>
      <button class="placeholder-button" id="inline-open-file" type="button">Open DOCX File</button>
    </div>
  `;

  document.getElementById('inline-open-file').addEventListener('click', openFile);
}

function createEmptyState(message) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-empty';
  wrapper.innerHTML = `<p>${message}</p>`;
  return wrapper;
}

function showFatal(message) {
  editorContentEl.innerHTML = `
    <div class="editor-placeholder">
      <div class="placeholder-badge error">Error</div>
      <h1>Desktop shell unavailable</h1>
      <p>${message}</p>
    </div>
  `;
}

async function openFolder() {
  await window.desktop.openFolder();
}

async function openFile() {
  await window.desktop.openFile();
}

async function toggleAgentPanel() {
  await window.desktop.toggleAgentPanel();
}

function getActiveTab() {
  return workspaceState.openTabs.find((tab) => tab.id === workspaceState.activeTab) ?? null;
}

function countDocxFiles(node) {
  if (!node) return 0;
  if (node.type === 'file') return 1;
  return (node.children ?? []).reduce((sum, child) => sum + countDocxFiles(child), 0);
}

// ============================================
// Phase 2: SuperDoc Integration
// ============================================

/**
 * Load SuperDoc for a specific tab
 * @param {string} tabId 
 */
async function loadDocumentForTab(tabId) {
  if (currentTabId === tabId && activeSuperDocInstance) {
    // Already loaded for this tab
    return;
  }

  // Clean up previous instance
  destroySuperDocInstance();

  // Get document from session
  const result = await window.desktop.getDocumentForTab(tabId);
  
  if (!result.success || !result.file) {
    console.error('Failed to get document for tab:', tabId);
    showEditorPlaceholder();
    hideSuperDocContainer();
    return;
  }

  // Get session state to know the mode
  const sessionState = window.desktop.getSessionState(tabId);
  const mode = sessionState.mode || window.desktop.DOCUMENT_MODE.EDITING;

  try {
    // Import SuperDoc dynamically
    const { SuperDoc } = await import('superdoc');
    const { superdocFonts } = await import('@superdoc-dev/fonts');
    
    // Import styles
    await import('superdoc/style.css');

    // Create SuperDoc instance
    activeSuperDocInstance = new SuperDoc({
      selector: '#superdoc-editor',
      document: result.file,
      documentMode: mode,
      fonts: superdocFonts,
      // Listen for changes to mark session as dirty
      onUpdate: () => {
        if (currentTabId === tabId) {
          markSessionDirty(tabId);
        }
      }
    });

    // Store reference in session (via main process)
    // Note: We can't directly call storeEditorReference from renderer
    // This would require adding an IPC handler
    
    currentTabId = tabId;
    
    // Update toolbar to reflect current mode
    updateModeButtons(mode);
    
    console.log('SuperDoc loaded for tab:', tabId, 'mode:', mode);
    
  } catch (error) {
    console.error('Failed to load SuperDoc:', error);
    showEditorPlaceholder();
    hideSuperDocContainer();
    destroySuperDocInstance();
  }
}

/**
 * Switch to a different tab
 * @param {string} tabId 
 */
async function switchToTab(tabId) {
  if (currentTabId === tabId) {
    return;
  }

  // Get session state for new tab
  const sessionState = window.desktop.getSessionState(tabId);
  
  if (sessionState.loaded) {
    // Load the document for this tab
    await loadDocumentForTab(tabId);
    
    // Update toolbar
    renderDocumentToolbar();
  } else {
    // No session yet, show placeholder
    currentTabId = null;
    destroySuperDocInstance();
    showEditorPlaceholder();
    hideSuperDocContainer();
  }
}

/**
 * Mark session as dirty (has unsaved changes)
 * @param {string} tabId
 */
function markSessionDirty(tabId) {
  if (window.desktop) {
    // This will trigger a state change that we listen to
    // For now, just update the toolbar
    renderDocumentToolbar();
  }
}

/**
 * Set document mode
 * @param {string} mode 
 */
async function setDocumentMode(mode) {
  const activeTab = getActiveTab();
  if (!activeTab) return;

  try {
    await window.desktop.setDocumentMode({ tabId: activeTab.id, mode });
    
    // Update SuperDoc instance if it exists
    if (activeSuperDocInstance && currentTabId === activeTab.id) {
      // Note: SuperDoc's documentMode can be changed via API
      // This requires SuperDoc to expose a way to change mode dynamically
      // For now, we would need to destroy and recreate
      // In the future, this should use editor.setDocumentMode(mode)
      console.log('Mode changed to:', mode);
      activeSuperDocInstance.destroy();
      await loadDocumentForTab(activeTab.id);
    }
    
    // Update UI
    updateModeButtons(mode);
    renderDocumentToolbar();
    
  } catch (error) {
    console.error('Failed to set document mode:', error);
  }
}

/**
 * Save current document
 */
async function saveDocument() {
  const activeTab = getActiveTab();
  if (!activeTab || !activeSuperDocInstance) return;

  try {
    // Export document from SuperDoc
    const blob = await activeSuperDocInstance.export({ isFinalDoc: true });
    
    // Save via main process
    const result = await window.desktop.saveDocument({ 
      tabId: activeTab.id, 
      blob 
    });
    
    if (result.success) {
      console.log('Document saved:', result.path);
      
      // Update UI
      renderDocumentToolbar();
      documentStatusEl.textContent = `Saved: ${new Date(result.savedAt).toLocaleTimeString()}`;
      
      // Show success feedback
      setTimeout(() => {
        documentStatusEl.textContent = `Active tab: ${activeTab.name}`;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to save document:', error);
    documentStatusEl.textContent = `Save failed: ${error.message}`;
  }
}

/**
 * Update mode button active states
 * @param {string} mode 
 */
function updateModeButtons(mode) {
  if (!window.desktop || !window.desktop.DOCUMENT_MODE) return;
  
  modeViewingBtn.classList.toggle('active', mode === window.desktop.DOCUMENT_MODE.VIEWING);
  modeEditingBtn.classList.toggle('active', mode === window.desktop.DOCUMENT_MODE.EDITING);
  modeSuggestingBtn.classList.toggle('active', mode === window.desktop.DOCUMENT_MODE.SUGGESTING);
}

/**
 * Destroy current SuperDoc instance
 */
function destroySuperDocInstance() {
  if (activeSuperDocInstance) {
    try {
      activeSuperDocInstance.destroy();
    } catch (error) {
      console.warn('Error destroying SuperDoc instance:', error);
    }
    activeSuperDocInstance = null;
    currentTabId = null;
  }
}

/**
 * Hide editor placeholder
 */
function hideEditorPlaceholder() {
  editorContentEl.style.display = 'none';
}

/**
 * Show editor placeholder
 */
function showEditorPlaceholder() {
  editorContentEl.style.display = 'block';
}

/**
 * Show SuperDoc container
 */
function showSuperDocContainer() {
  superdocContainerEl.classList.add('visible');
}

/**
 * Hide SuperDoc container
 */
function hideSuperDocContainer() {
  superdocContainerEl.classList.remove('visible');
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error(error);
    showFatal(error.message);
  });
});
