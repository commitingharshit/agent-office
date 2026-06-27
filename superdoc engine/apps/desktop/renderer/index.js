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

let currentTabId = null;
let currentSessionState = null;

const workspacePathEl = document.getElementById('workspace-path');
const workspaceBrandEl = document.getElementById('workspace-brand');
const documentSummaryEl = document.getElementById('document-summary');
const workspaceSummaryEl = document.getElementById('workspace-summary');
const workspaceTreeEl = document.getElementById('workspace-tree');
const activeTabIndicatorEl = document.getElementById('active-tab-indicator');
const tabStripEl = document.getElementById('tab-strip');
const appContainerEl = document.getElementById('app-container');
const editorContentEl = document.getElementById('editor-content');
const agentSidebarEl = document.getElementById('agent-sidebar');
const explorerStateEl = document.getElementById('explorer-state');
const recentDocumentsEl = document.getElementById('recent-documents');
const statusSaveEl = document.getElementById('status-save');
const statusDocInfoEl = document.getElementById('status-docinfo');
const statusCursorEl = document.getElementById('status-cursor');
const statusZoomEl = document.getElementById('status-zoom');
const statusAiEl = document.getElementById('status-ai');
const assistantStreamEl = document.getElementById('assistant-stream');
const assistantSelectedTextEl = document.getElementById('assistant-selected-text');
const assistantReferencedFilesEl = document.getElementById('assistant-referenced-files');
const superdocContainerEl = document.getElementById('superdoc-container');
const documentToolbarEl = document.getElementById('document-toolbar');
const modeViewingBtn = document.getElementById('mode-viewing');
const modeEditingBtn = document.getElementById('mode-editing');
const modeSuggestingBtn = document.getElementById('mode-suggesting');
const toggleAgentButton = document.getElementById('toggle-agent-button');
const toggleAgentButtonLabel = document.getElementById('toggle-agent-button-label');
const saveButton = document.getElementById('save-button');
const openFolderButtons = [
  document.getElementById('open-folder-button'),
  document.getElementById('explorer-open-folder'),
  document.getElementById('placeholder-open-folder')
].filter(Boolean);
const openFileButtons = [
  document.getElementById('open-file-button'),
  document.getElementById('explorer-open-file'),
  document.getElementById('placeholder-open-file')
].filter(Boolean);

async function init() {
  bindEvents();

  if (!window.desktop || !window.superdocDesktop) {
    const missing = [
      !window.desktop ? 'window.desktop' : null,
      !window.superdocDesktop ? 'window.superdocDesktop' : null
    ].filter(Boolean);
    showFatal(`Desktop preload API is unavailable: ${missing.join(', ')}`);
    return;
  }

  window.desktop.onWorkspaceStateChanged((nextState) => {
    workspaceState = nextState;
    render().catch(reportError);
  });

  window.addEventListener('superdoc:update', ({ detail }) => {
    if (detail?.tabId === currentTabId) {
      handleDocumentUpdate(detail.tabId).catch(reportError);
    }
  });

  window.addEventListener('superdoc:error', ({ detail }) => {
    statusAiEl.textContent = detail?.message ?? 'SuperDoc error';
  });

  window.addEventListener('superdoc:ready', ({ detail }) => {
    if (detail?.tabId === currentTabId) {
      statusAiEl.textContent = `Ready: ${getActiveTab()?.name ?? 'document'}`;
    }
  });

  workspaceState = await window.desktop.getWorkspaceState();
  await render();
}

function bindEvents() {
  openFolderButtons.forEach((button) => button.addEventListener('click', () => openFolder().catch(reportError)));
  openFileButtons.forEach((button) => button.addEventListener('click', () => openFile().catch(reportError)));
  if (toggleAgentButton) {
    toggleAgentButton.addEventListener('click', () => toggleAgentPanel().catch(reportError));
  }
  document.getElementById('close-agent-button').addEventListener('click', () => toggleAgentPanel().catch(reportError));
  modeViewingBtn.addEventListener('click', () => setDocumentMode(window.desktop.DOCUMENT_MODE.VIEWING).catch(reportError));
  modeEditingBtn.addEventListener('click', () => setDocumentMode(window.desktop.DOCUMENT_MODE.EDITING).catch(reportError));
  modeSuggestingBtn.addEventListener('click', () => setDocumentMode(window.desktop.DOCUMENT_MODE.SUGGESTING).catch(reportError));
  saveButton.addEventListener('click', () => saveDocument().catch(reportError));
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveDocument().catch(reportError);
    }
  });
}

async function render() {
  renderTopBar();
  renderWorkspaceTree();
  renderTabs();
  await renderEditorSurface();
  renderDocumentToolbar();
  renderAgentPanel();
  renderStatusStrip();
}

function renderTopBar() {
  if (workspaceState.workspacePath) {
    workspacePathEl.textContent = workspaceState.workspacePath;
    workspacePathEl.title = workspaceState.workspacePath;
    workspaceBrandEl.textContent = getWorkspaceLabel(workspaceState.workspacePath);
    workspaceSummaryEl.textContent = `${countDocxFiles(workspaceState.workspaceTree)} DOCX files`;
  } else {
    workspacePathEl.textContent = 'No workspace selected';
    workspaceBrandEl.textContent = 'No workspace';
    workspaceSummaryEl.textContent = 'No folder';
    workspacePathEl.title = '';
  }

  const activeTab = getActiveTab();
  const activeMode = currentSessionState?.mode ? currentSessionState.mode.toUpperCase() : 'IDLE';
  const saveState = currentSessionState?.dirty ? 'Unsaved' : 'Saved';
  activeTabIndicatorEl.textContent = activeTab ? activeTab.name : 'No document open';
  activeTabIndicatorEl.classList.toggle('has-document', Boolean(activeTab));
  documentSummaryEl.querySelector('.document-summary-title').textContent = activeTab ? activeTab.name : 'No document open';
  documentSummaryEl.querySelector('.document-summary-meta').textContent = activeTab
    ? `${saveState} • ${activeMode}`
    : 'Saved state appears here';
}

function renderWorkspaceTree() {
  const paneContent = workspaceTreeEl.querySelector('.pane-content');
  paneContent.innerHTML = '';

  if (!workspaceState.workspaceTree) {
    paneContent.appendChild(renderExplorerEmptyState());
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
    closeButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (tab.id === currentTabId) {
        await window.superdocDesktop.destroyDocument();
        currentTabId = null;
        currentSessionState = null;
      }
      await window.desktop.closeTab(tab.id);
    });

    tabEl.appendChild(activateButton);
    tabEl.appendChild(closeButton);
    tabStripEl.appendChild(tabEl);
  }
}

function renderDocumentToolbar() {
  const hasDocument = Boolean(getActiveTab() && currentSessionState?.loaded);
  documentToolbarEl.classList.toggle('visible', hasDocument);
  if (hasDocument) {
    updateModeButtons(currentSessionState.mode);
    saveButton.disabled = !currentSessionState.dirty;
  }
}

async function renderEditorSurface() {
  const activeTab = getActiveTab();
  if (!activeTab) {
    await clearActiveDocument();
    showEditorPlaceholderMarkup();
    return;
  }

  const sessionState = await window.desktop.getSessionState(activeTab.id);
  currentSessionState = sessionState;

  if (!sessionState.loaded) {
    await clearActiveDocument();
    showEditorPlaceholderMarkup();
    return;
  }

  if (currentTabId !== activeTab.id) {
    await mountDocumentForTab(activeTab.id, sessionState);
  } else {
    hideEditorPlaceholder();
    showDocumentCanvas();
  }
}

function renderAgentPanel() {
  agentSidebarEl.classList.toggle('hidden', !workspaceState.agentPanelVisible);
  appContainerEl?.setAttribute('data-agent-visible', String(workspaceState.agentPanelVisible));
  if (toggleAgentButtonLabel) {
    toggleAgentButtonLabel.textContent = workspaceState.agentPanelVisible ? 'Hide Assistant' : 'Show Assistant';
  }
  assistantSelectedTextEl.textContent = workspaceState.selectedPath ?? 'Nothing selected';
  assistantReferencedFilesEl.textContent = getActiveTab()?.name ?? 'No references yet';
  statusAiEl.textContent = currentSessionState?.loaded ? 'AI ready' : 'AI idle';
}

function renderStatusStrip() {
  if (!currentSessionState?.loaded) {
    statusSaveEl.textContent = 'Saved';
    statusDocInfoEl.textContent = 'No document open';
    statusCursorEl.textContent = 'Ln 1, Col 1';
    statusZoomEl.textContent = '100%';
    statusAiEl.textContent = 'AI idle';
    return;
  }

  const status = currentSessionState.dirty ? 'Unsaved changes' : 'Saved';
  statusSaveEl.textContent = status;
  statusDocInfoEl.textContent = `${currentSessionState.fileName} • ${currentSessionState.mode}`;
  statusCursorEl.textContent = 'Ln 1, Col 1';
  statusZoomEl.textContent = '100%';
  statusAiEl.textContent = workspaceState.agentPanelVisible ? 'AI ready' : 'AI hidden';
  renderAssistantStream();
}

async function mountDocumentForTab(tabId, sessionState) {
  const result = await window.desktop.getDocumentForTab(tabId);
  if (!result.success || !result.payload) {
    throw new Error(`Failed to load document payload for tab ${tabId}.`);
  }

  hideEditorPlaceholder();
  showDocumentCanvas();

  await window.superdocDesktop.mountDocument({
    tabId,
    selector: '#superdoc-editor',
    toolbar: '#superdoc-toolbar-host',
    payload: result.payload,
    mode: sessionState.mode
  });

  currentTabId = tabId;
  renderRecentDocuments();
  showDocumentCanvas();
}

async function switchToTab(tabId) {
  if (currentTabId === tabId) return;
  currentSessionState = await window.desktop.getSessionState(tabId);
  await mountDocumentForTab(tabId, currentSessionState);
  renderDocumentToolbar();
  renderStatusStrip();
  renderRecentDocuments();
}

async function setDocumentMode(mode) {
  const activeTab = getActiveTab();
  if (!activeTab || !currentSessionState?.loaded) return;

  const result = await window.desktop.setDocumentMode({ tabId: activeTab.id, mode });
  if (!result.success) {
    throw new Error(result.error?.message ?? 'Failed to set document mode.');
  }

  await window.superdocDesktop.setDocumentMode(mode);
  currentSessionState = result.session;
  renderDocumentToolbar();
  renderStatusStrip();
}

async function saveDocument() {
  const activeTab = getActiveTab();
  if (!activeTab || !currentSessionState?.loaded) return;

  const bytes = await window.superdocDesktop.exportCurrentDocument({ format: 'docx' });
  const result = await window.desktop.saveDocument({ tabId: activeTab.id, bytes });
  if (!result.success) {
    throw new Error(result.error?.message ?? 'Failed to save document.');
  }

  currentSessionState = await window.desktop.getSessionState(activeTab.id);
  renderDocumentToolbar();
  renderStatusStrip();
  renderTopBar();
}

async function handleDocumentUpdate(tabId) {
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.id !== tabId) return;

  await window.desktop.markDocumentDirty(tabId);
  currentSessionState = await window.desktop.getSessionState(tabId);
  renderDocumentToolbar();
  renderStatusStrip();
  renderTopBar();
}

async function clearActiveDocument() {
  await window.superdocDesktop.destroyDocument();
  currentTabId = null;
  currentSessionState = null;
  hideDocumentCanvas();
}

function showEditorPlaceholderMarkup() {
  editorContentEl.innerHTML = `
    <div class="welcome-state">
      <div class="welcome-copy">
        <div class="welcome-eyebrow">DOCX workspace</div>
        <h1>Open a document to start editing</h1>
        <p>Browse the workspace, open a DOCX, and keep AI context aligned with the selected document.</p>
      </div>
      <div class="welcome-actions">
        <button class="welcome-button primary" id="inline-open-file" type="button">Open document</button>
        <button class="welcome-button secondary" id="inline-open-folder" type="button">Open folder</button>
      </div>
      <div class="welcome-grid">
        <div class="welcome-card">
          <span class="welcome-card-label">Recent files</span>
          <div id="recent-documents-inline" class="welcome-card-list"></div>
        </div>
        <div class="welcome-card">
          <span class="welcome-card-label">Drop zone</span>
          <div class="drop-zone">
            <span>Drag a `.docx` into the app</span>
          </div>
        </div>
      </div>
    </div>
  `;
  editorContentEl.style.display = 'block';
  document.getElementById('inline-open-file').addEventListener('click', () => openFile().catch(reportError));
  document.getElementById('inline-open-folder').addEventListener('click', () => openFolder().catch(reportError));
  renderRecentDocuments('recent-documents-inline');
}

function hideEditorPlaceholder() {
  editorContentEl.style.display = 'none';
}

function showDocumentCanvas() {
  superdocContainerEl.classList.add('visible');
  superdocContainerEl.style.display = 'block';
}

function hideDocumentCanvas() {
  superdocContainerEl.classList.remove('visible');
  superdocContainerEl.style.display = 'none';
}

function renderExplorerEmptyState() {
  const wrapper = document.createElement('div');
  wrapper.className = 'compact-state';
  wrapper.innerHTML = `
    <div class="compact-state-kicker">Workspace</div>
    <div class="compact-state-title">Open a folder or recent document</div>
    <div class="compact-state-actions">
      <button class="link-button" type="button" id="explorer-empty-open-folder">Open folder</button>
      <button class="link-button" type="button" id="explorer-empty-open-file">Open document</button>
    </div>
  `;
  wrapper.querySelector('#explorer-empty-open-folder').addEventListener('click', () => openFolder().catch(reportError));
  wrapper.querySelector('#explorer-empty-open-file').addEventListener('click', () => openFile().catch(reportError));
  return wrapper;
}

function renderRecentDocuments(targetId = 'recent-documents') {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = '';
  const docs = getRecentDocuments();

  if (docs.length === 0) {
    target.appendChild(buildRecentDocEntry('No recent documents', 'Open a DOCX to populate this list', false));
    return;
  }

  docs.slice(0, 4).forEach((doc) => {
    target.appendChild(buildRecentDocEntry(doc.name, doc.path, true));
  });
}

function buildRecentDocEntry(title, subtitle, clickable) {
  const wrapper = document.createElement('div');
  wrapper.className = 'recent-doc';
  wrapper.dataset.path = subtitle;
  wrapper.innerHTML = `
    <span class="recent-doc-title">${title}</span>
    <span class="recent-doc-subtitle">${subtitle}</span>
  `;
  if (clickable) {
    wrapper.addEventListener('click', async () => {
      const doc = getRecentDocuments().find((entry) => entry.path === subtitle);
      if (doc) {
        await window.desktop.openWorkspaceEntry(doc.path);
      }
    });
  }
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

function getWorkspaceLabel(path) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) ?? path;
}

function getRecentDocuments() {
  const seen = new Set();
  const docs = [];

  for (const tab of [...workspaceState.openTabs].reverse()) {
    if (seen.has(tab.path)) continue;
    seen.add(tab.path);
    docs.push({ name: tab.name, path: tab.path });
  }

  return docs;
}

function renderAssistantStream() {
  if (!assistantStreamEl) return;

  const docTitle = currentSessionState?.fileName ?? 'No document open';
  const mode = currentSessionState?.mode ?? 'idle';
  const saveState = currentSessionState?.dirty ? 'unsaved' : 'saved';

  assistantStreamEl.innerHTML = `
    <div class="assistant-message assistant-message-system">
      <span class="assistant-label">Context</span>
      <p>${docTitle} is ${saveState} and in ${mode} mode.</p>
    </div>
    <div class="assistant-message assistant-message-user">
      <span class="assistant-label">Prompt</span>
      <p>Ask for a summary, rewrite, or targeted edit once document content is selected.</p>
    </div>
  `;
}

function updateModeButtons(mode) {
  modeViewingBtn.classList.toggle('active', mode === window.desktop.DOCUMENT_MODE.VIEWING);
  modeEditingBtn.classList.toggle('active', mode === window.desktop.DOCUMENT_MODE.EDITING);
  modeSuggestingBtn.classList.toggle('active', mode === window.desktop.DOCUMENT_MODE.SUGGESTING);
}

function reportError(error) {
  console.error(error);
  statusAiEl.textContent = error?.message ?? String(error);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(reportError);
});
