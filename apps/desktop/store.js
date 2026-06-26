/**
 * SuperDoc Desktop - Workspace State Store
 * 
 * This is a simple reactive state management for the workspace.
 * In Phase 0, this is a basic implementation.
 * In later phases, this may be replaced with a more sophisticated store
 * or moved to a separate package (desktop-core).
 */

// Initial state
let state = {
  workspacePath: null,
  openTabs: [],
  activeTab: null,
  activeDocument: null,
  agentPanelVisible: true
};

// Array of subscribers (callback functions)
const subscribers = [];

/**
 * Get the current workspace state
 * @returns {Object} Current state
 */
export function getState() {
  return { ...state };
}

/**
 * Set the workspace path
 * @param {string} path - Absolute path to workspace folder
 */
export function setWorkspacePath(path) {
  state.workspacePath = path;
  notifySubscribers();
}

/**
 * Add a new tab
 * @param {Object} tabInfo - Tab information
 * @param {string} tabInfo.path - File path
 * @param {string} tabInfo.name - Display name
 * @param {string} tabInfo.type - File type
 * @returns {string} Generated tab ID
 */
export function addTab(tabInfo) {
  const tabId = `tab-${Date.now()}`;
  state.openTabs.push({
    id: tabId,
    ...tabInfo
  });
  
  // If this is the first tab, make it active
  if (state.openTabs.length === 1) {
    state.activeTab = tabId;
    state.activeDocument = tabId;
  }
  
  notifySubscribers();
  return tabId;
}

/**
 * Set the active tab
 * @param {string} tabId - Tab ID to activate
 */
export function setActiveTab(tabId) {
  const tabExists = state.openTabs.some(tab => tab.id === tabId);
  if (tabExists) {
    state.activeTab = tabId;
    state.activeDocument = tabId;
    notifySubscribers();
  } else {
    console.warn(`Tab ${tabId} does not exist`);
  }
}

/**
 * Close a tab
 * @param {string} tabId - Tab ID to close
 */
export function closeTab(tabId) {
  const index = state.openTabs.findIndex(tab => tab.id === tabId);
  
  if (index !== -1) {
    state.openTabs.splice(index, 1);
    
    // If the closed tab was active, clear active tab
    if (state.activeTab === tabId) {
      state.activeTab = null;
      state.activeDocument = null;
    }
    
    // If there are still tabs, activate the first one
    if (state.openTabs.length > 0 && !state.activeTab) {
      state.activeTab = state.openTabs[0].id;
      state.activeDocument = state.openTabs[0].id;
    }
    
    notifySubscribers();
    return true;
  }
  
  return false;
}

/**
 * Close all tabs
 */
export function closeAllTabs() {
  state.openTabs = [];
  state.activeTab = null;
  state.activeDocument = null;
  notifySubscribers();
}

/**
 * Set active document
 * @param {string} sessionId - Document session ID
 */
export function setActiveDocument(sessionId) {
  state.activeDocument = sessionId;
  notifySubscribers();
}

/**
 * Toggle agent panel visibility
 * @returns {boolean} New visibility state
 */
export function toggleAgentPanel() {
  state.agentPanelVisible = !state.agentPanelVisible;
  notifySubscribers();
  return state.agentPanelVisible;
}

/**
 * Set agent panel visibility
 * @param {boolean} visible - Visibility state
 */
export function setAgentPanelVisible(visible) {
  state.agentPanelVisible = visible;
  notifySubscribers();
}

/**
 * Get tab by ID
 * @param {string} tabId - Tab ID
 * @returns {Object|null} Tab object or null
 */
export function getTab(tabId) {
  return state.openTabs.find(tab => tab.id === tabId) || null;
}

/**
 * Get active tab
 * @returns {Object|null} Active tab or null
 */
export function getActiveTab() {
  return state.openTabs.find(tab => tab.id === state.activeTab) || null;
}

/**
 * Get all tabs
 * @returns {Array} Array of all tabs
 */
export function getAllTabs() {
  return [...state.openTabs];
}

/**
 * Get workspace path
 * @returns {string|null} Workspace path or null
 */
export function getWorkspacePath() {
  return state.workspacePath;
}

/**
 * Reset state to initial
 */
export function reset() {
  state = {
    workspacePath: null,
    openTabs: [],
    activeTab: null,
    activeDocument: null,
    agentPanelVisible: true
  };
  notifySubscribers();
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
  subscribers.forEach(callback => {
    try {
      callback({ ...state });
    } catch (error) {
      console.error('Error in subscriber callback:', error);
    }
  });
}

// Export the current state for debugging
export { state };
