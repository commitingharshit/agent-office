/**
 * SuperDoc Desktop workspace store.
 *
 * The main process owns the canonical state. The renderer receives snapshots
 * and requests state transitions through the preload bridge.
 */

const INITIAL_STATE = {
  workspacePath: null,
  workspaceTree: null,
  openTabs: [],
  activeTab: null,
  activeDocument: null,
  agentPanelVisible: true,
  selectedPath: null,
  selectedEntryType: null
};

export function createWorkspaceStore(initialState = {}) {
  let state = createState(initialState);
  const subscribers = new Set();

  function emit() {
    const snapshot = getState();
    for (const subscriber of subscribers) {
      subscriber(snapshot);
    }
  }

  function setState(nextState) {
    state = {
      ...state,
      ...nextState
    };
    emit();
  }

  return {
    getState,
    subscribe,
    reset,
    setWorkspace,
    clearWorkspace,
    setWorkspaceTree,
    setSelectedEntry,
    addTab,
    setActiveTab,
    closeTab,
    toggleAgentPanel
  };

  function getState() {
    return structuredClone(state);
  }

  function subscribe(callback) {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }

  function reset() {
    state = createState();
    emit();
  }

  function setWorkspace(workspacePath) {
    setState({
      workspacePath,
      selectedPath: workspacePath,
      selectedEntryType: 'directory'
    });
  }

  function clearWorkspace() {
    setState({
      workspacePath: null,
      workspaceTree: null,
      selectedPath: null,
      selectedEntryType: null
    });
  }

  function setWorkspaceTree(workspaceTree) {
    setState({ workspaceTree });
  }

  function setSelectedEntry(selectedPath, selectedEntryType) {
    setState({ selectedPath, selectedEntryType });
  }

  function addTab(tab) {
    const existingTab = state.openTabs.find((entry) => entry.path === tab.path);

    if (existingTab) {
      setActiveTab(existingTab.id);
      return existingTab;
    }

    const nextTab = { ...tab };
    const openTabs = [...state.openTabs, nextTab];
    setState({
      openTabs,
      activeTab: nextTab.id,
      activeDocument: nextTab.id,
      selectedPath: nextTab.path,
      selectedEntryType: 'file'
    });
    return nextTab;
  }

  function setActiveTab(tabId) {
    const activeTab = state.openTabs.find((entry) => entry.id === tabId);
    if (!activeTab) return null;

    setState({
      activeTab: activeTab.id,
      activeDocument: activeTab.id,
      selectedPath: activeTab.path,
      selectedEntryType: 'file'
    });
    return activeTab;
  }

  function closeTab(tabId) {
    const openTabs = state.openTabs.filter((entry) => entry.id !== tabId);
    const wasActive = state.activeTab === tabId;
    const nextActiveTab = wasActive ? openTabs[0] ?? null : openTabs.find((entry) => entry.id === state.activeTab) ?? null;

    setState({
      openTabs,
      activeTab: nextActiveTab?.id ?? null,
      activeDocument: nextActiveTab?.id ?? null,
      selectedPath: nextActiveTab?.path ?? state.workspacePath,
      selectedEntryType: nextActiveTab ? 'file' : state.workspacePath ? 'directory' : null
    });
  }

  function toggleAgentPanel() {
    const agentPanelVisible = !state.agentPanelVisible;
    setState({ agentPanelVisible });
    return agentPanelVisible;
  }
}

function createState(initialState = {}) {
  return {
    ...INITIAL_STATE,
    ...structuredClone(initialState)
  };
}
