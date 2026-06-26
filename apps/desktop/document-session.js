/**
 * SuperDoc Desktop - Document Session Service
 * 
 * Minimum Phase 1 infrastructure to support Phase 2 (SuperDoc embedding).
 * This service manages document sessions for tabs and provides the boundary
 * between the shell and SuperDoc document engine.
 * 
 * This can later be moved to packages/desktop-core/ as described in implement.md.
 */

import { promises as fs } from 'fs';
import { basename, extname } from 'path';

/**
 * Document session states
 */
export const DOCUMENT_MODE = {
  VIEWING: 'viewing',
  EDITING: 'editing',
  SUGGESTING: 'suggesting'
};

/**
 * Session store - maps tabId to document session
 * A session holds the SuperDoc editor instance and document state
 */
const sessions = new Map();

/**
 * Active session by tab ID
 * @type {Map<string, {editor: any, filePath: string, mode: string, superdoc: any}>}
 */

/**
 * Create a document session from a file path
 * Reads the file, creates a SuperDoc-compatible blob, and stores the session
 * 
 * @param {string} filePath - Absolute path to DOCX file
 * @param {string} tabId - Tab ID to associate with
 * @returns {Promise<{tabId: string, filePath: string, mode: string}>}
 */
export async function createDocumentSession(filePath, tabId) {
  // Validate file
  const fileExt = extname(filePath).toLowerCase();
  if (fileExt !== '.docx') {
    throw new Error(`Unsupported file type: ${fileExt}. Only .docx is supported.`);
  }

  // Check file exists and is readable
  await fs.access(filePath);
  
  // Read file as buffer
  const buffer = await fs.readFile(filePath);
  
  // Create Blob from buffer
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
  
  // Create File object from Blob
  const file = new File([blob], basename(filePath), { 
    type: blob.type,
    lastModified: (await fs.stat(filePath)).mtimeMs
  });

  // Store session
  sessions.set(tabId, {
    tabId,
    filePath,
    file,
    blob,
    mode: DOCUMENT_MODE.EDITING,
    dirty: false,
    lastSaved: Date.now()
  });

  return {
    tabId,
    filePath,
    file,
    blob,
    mode: DOCUMENT_MODE.EDITING
  };
}

/**
 * Get document session by tab ID
 * 
 * @param {string} tabId 
 * @returns {object|null} Session or null if not found
 */
export function getDocumentSession(tabId) {
  return sessions.get(tabId) || null;
}

/**
 * Get all active sessions
 * 
 * @returns {Array} Array of all sessions
 */
export function getAllSessions() {
  return Array.from(sessions.values());
}

/**
 * Set document mode for a session
 * 
 * @param {string} tabId - Tab ID
 * @param {string} mode - One of DOCUMENT_MODE.VIEWING, EDITING, SUGGESTING
 */
export function setDocumentMode(tabId, mode) {
  const session = sessions.get(tabId);
  if (session) {
    session.mode = mode;
    session.dirty = true;
  }
}

/**
 * Mark session as dirty (unsaved changes)
 * 
 * @param {string} tabId
 */
export function markSessionDirty(tabId) {
  const session = sessions.get(tabId);
  if (session) {
    session.dirty = true;
  }
}

/**
 * Mark session as clean (saved)
 * 
 * @param {string} tabId
 */
export function markSessionClean(tabId) {
  const session = sessions.get(tabId);
  if (session) {
    session.dirty = false;
    session.lastSaved = Date.now();
  }
}

/**
 * Save document session back to disk
 * 
 * @param {string} tabId - Tab ID to save
 * @param {Blob} blob - DOCX blob from SuperDoc export
 * @returns {Promise<{success: boolean, path: string, savedAt: number}>}
 */
export async function saveDocumentSession(tabId, blob) {
  const session = sessions.get(tabId);
  
  if (!session) {
    throw new Error(`No session found for tab: ${tabId}`);
  }

  // Write blob to file
  const buffer = Buffer.from(await blob.arrayBuffer());
  await fs.writeFile(session.filePath, buffer);

  // Update session state
  session.dirty = false;
  session.lastSaved = Date.now();
  session.blob = blob;

  return {
    success: true,
    path: session.filePath,
    savedAt: session.lastSaved
  };
}

/**
 * Close document session
 * 
 * @param {string} tabId - Tab ID to close
 */
export function closeDocumentSession(tabId) {
  const session = sessions.get(tabId);
  if (session) {
    // Clean up any editor reference
    if (session.editor) {
      try {
        session.editor.destroy();
      } catch (error) {
        // Ignore destroy errors
        console.warn(`Error destroying editor for tab ${tabId}:`, error);
      }
    }
    sessions.delete(tabId);
  }
}

/**
 * Reload document session from disk
 * 
 * @param {string} tabId - Tab ID to reload
 * @returns {Promise<object>} Updated session
 */
export async function reloadDocumentSession(tabId) {
  const session = sessions.get(tabId);
  
  if (!session) {
    throw new Error(`No session found for tab: ${tabId}`);
  }

  // Close existing session
  closeDocumentSession(tabId);

  // Recreate session from file
  return await createDocumentSession(session.filePath, tabId);
}

/**
 * Switch active document to a different tab
 * 
 * @param {string} fromTabId - Current tab ID
 * @param {string} toTabId - Target tab ID
 */
export function switchActiveDocument(fromTabId, toTabId) {
  const fromSession = sessions.get(fromTabId);
  const toSession = sessions.get(toTabId);

  if (!toSession) {
    throw new Error(`No session found for tab: ${toTabId}`);
  }

  // Return the session to switch to
  return toSession;
}

/**
 * Get session state summary for UI
 * 
 * @param {string} tabId 
 * @returns {object} Session state for UI display
 */
export function getSessionState(tabId) {
  const session = sessions.get(tabId);
  
  if (!session) {
    return {
      loaded: false,
      filePath: null,
      fileName: null,
      mode: null,
      dirty: false
    };
  }

  return {
    loaded: true,
    filePath: session.filePath,
    fileName: basename(session.filePath),
    mode: session.mode,
    dirty: session.dirty,
    lastSaved: session.lastSaved
  };
}

/**
 * Check if session has unsaved changes
 * 
 * @param {string} tabId
 * @returns {boolean}
 */
export function hasUnsavedChanges(tabId) {
  const session = sessions.get(tabId);
  return session ? session.dirty : false;
}

/**
 * Close all document sessions
 */
export function closeAllSessions() {
  for (const [tabId] of sessions) {
    closeDocumentSession(tabId);
  }
  sessions.clear();
}

/**
 * Get document for SuperDoc consumption
 * Returns the File or Blob to pass to SuperDoc
 * 
 * @param {string} tabId
 * @returns {File|Blob|null}
 */
export function getDocumentForSuperDoc(tabId) {
  const session = sessions.get(tabId);
  return session ? session.file : null;
}

/**
 * Store SuperDoc editor reference in session
 * 
 * @param {string} tabId
 * @param {any} editor - SuperDoc editor instance
 */
export function storeEditorReference(tabId, editor) {
  const session = sessions.get(tabId);
  if (session) {
    session.editor = editor;
  }
}

/**
 * Get SuperDoc editor reference from session
 * 
 * @param {string} tabId
 * @returns {any|null}
 */
export function getEditorReference(tabId) {
  const session = sessions.get(tabId);
  return session ? session.editor : null;
}

export default {
  DOCUMENT_MODE,
  createDocumentSession,
  getDocumentSession,
  getAllSessions,
  setDocumentMode,
  markSessionDirty,
  markSessionClean,
  saveDocumentSession,
  closeDocumentSession,
  reloadDocumentSession,
  switchActiveDocument,
  getSessionState,
  hasUnsavedChanges,
  closeAllSessions,
  getDocumentForSuperDoc,
  storeEditorReference,
  getEditorReference
};
