import { promises as fs } from 'fs';
import { basename, extname } from 'path';

export const DOCUMENT_MODE = {
  VIEWING: 'viewing',
  EDITING: 'editing',
  SUGGESTING: 'suggesting'
};

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const sessions = new Map();

export async function createDocumentSession(filePath, tabId) {
  const fileExt = extname(filePath).toLowerCase();
  if (fileExt !== '.docx') {
    throw new Error(`Unsupported file type: ${fileExt}. Only .docx is supported.`);
  }

  const stats = await fs.stat(filePath);
  const buffer = await fs.readFile(filePath);
  const data = new Uint8Array(buffer);
  const fileName = basename(filePath);

  const session = {
    tabId,
    filePath,
    fileName,
    mimeType: DOCX_MIME,
    lastModified: stats.mtimeMs,
    data,
    mode: DOCUMENT_MODE.EDITING,
    dirty: false,
    lastSaved: Date.now()
  };

  sessions.set(tabId, session);
  return toSessionState(session);
}

export function getDocumentPayload(tabId) {
  const session = sessions.get(tabId);
  if (!session) return null;

  return {
    fileName: session.fileName,
    mimeType: session.mimeType,
    lastModified: session.lastModified,
    data: session.data
  };
}

export function setDocumentMode(tabId, mode) {
  const session = sessions.get(tabId);
  if (!session) return null;
  session.mode = mode;
  return toSessionState(session);
}

export function markSessionDirty(tabId) {
  const session = sessions.get(tabId);
  if (!session) return null;
  session.dirty = true;
  return toSessionState(session);
}

export async function saveDocumentSession(tabId, bytesLike) {
  const session = sessions.get(tabId);
  if (!session) {
    throw new Error(`No session found for tab: ${tabId}`);
  }

  const data = normalizeBytes(bytesLike);
  await fs.writeFile(session.filePath, data);

  const stats = await fs.stat(session.filePath);
  session.data = data;
  session.lastModified = stats.mtimeMs;
  session.lastSaved = Date.now();
  session.dirty = false;

  return {
    success: true,
    path: session.filePath,
    savedAt: session.lastSaved
  };
}

export function closeDocumentSession(tabId) {
  sessions.delete(tabId);
}

export function getSessionState(tabId) {
  const session = sessions.get(tabId);
  return session ? toSessionState(session) : emptySessionState();
}

export function hasUnsavedChanges(tabId) {
  const session = sessions.get(tabId);
  return Boolean(session?.dirty);
}

function emptySessionState() {
  return {
    loaded: false,
    filePath: null,
    fileName: null,
    mode: null,
    dirty: false,
    lastSaved: null,
    lastModified: null
  };
}

function toSessionState(session) {
  return {
    loaded: true,
    filePath: session.filePath,
    fileName: session.fileName,
    mode: session.mode,
    dirty: session.dirty,
    lastSaved: session.lastSaved,
    lastModified: session.lastModified
  };
}

function normalizeBytes(bytesLike) {
  if (bytesLike instanceof Uint8Array) {
    return new Uint8Array(bytesLike);
  }

  if (bytesLike instanceof ArrayBuffer) {
    return new Uint8Array(bytesLike);
  }

  if (Array.isArray(bytesLike)) {
    return Uint8Array.from(bytesLike);
  }

  if (bytesLike?.buffer instanceof ArrayBuffer) {
    return new Uint8Array(bytesLike.buffer, bytesLike.byteOffset ?? 0, bytesLike.byteLength);
  }

  throw new Error('Unsupported document byte payload.');
}
