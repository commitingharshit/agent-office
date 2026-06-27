# SuperDoc Desktop Implementation

## Phase 0: Desktop Shell (COMPLETE)

Implemented the foundation Electron app from [implement.md](/home/harshit/coding/agent-office/implement.md):

- Electron main window for Linux-first desktop use
- left explorer pane backed by a real workspace folder tree
- center editor pane placeholder with tab state
- right agent sidebar placeholder
- top-level open-folder and open-file actions for `.docx`
- main-process-owned workspace state with renderer subscriptions

## Phase 1: Document Session Service (MINIMUM - COMPLETE)

Implemented the minimum Phase 1 infrastructure required to support Phase 2:

- [document-session.js](/home/harshit/coding/agent-office/apps/desktop/document-session.js)
  - createDocumentSession(filePath, tabId) - reads DOCX from disk, creates File/Blob
  - getDocumentSession(tabId) - retrieve session
  - setDocumentMode(tabId, mode) - switch between viewing/editing/suggesting
  - saveDocumentSession(tabId, blob) - write back to disk
  - closeDocumentSession(tabId) - cleanup
  - getSessionState(tabId) - state summary for UI
  - Session store: Map of tabId -> {filePath, file, blob, mode, dirty, lastSaved}

## Phase 2: SuperDoc Embedding (COMPLETE)

Embedded SuperDoc editor in the center pane:

- SuperDoc instance mounted through the preload bridge
- Document loaded from session byte payload
- Supports viewing, editing, and suggesting modes
- Toolbar controls outside editor component
- Save/export back to disk via IPC
- Tab switching remounts the active editor cleanly
- Shell isolated from ProseMirror internals

## Architectural choices

The shell keeps filesystem access and state mutation in the Electron main process.
The renderer never receives raw Node or Electron primitives. Instead it uses the
preload bridge exposed as `window.desktop`.

### File Structure:

- [main.js](/home/harshit/coding/agent-office/apps/desktop/main.js)
  - owns dialogs, workspace traversal, tab opening, document session creation, state broadcasts
- [store.js](/home/harshit/coding/agent-office/apps/desktop/store.js)
  - canonical workspace store and transition helpers
- [ipc.js](/home/harshit/coding/agent-office/apps/desktop/ipc.js)
  - shared IPC channel contract + DOCUMENT_MODE constants
- [preload.js](/home/harshit/coding/agent-office/apps/desktop/preload.js)
  - narrow renderer bridge, exposes desktop API and SuperDoc controller methods
- [document-session.js](/home/harshit/coding/agent-office/apps/desktop/document-session.js)
  - **Phase 1 minimum**: lightweight document session service
- [package.json](/home/harshit/coding/agent-office/apps/desktop/package.json)
  - added superdoc workspace dependency
- [renderer/index.html](/home/harshit/coding/agent-office/apps/desktop/renderer/index.html)
  - added document toolbar, SuperDoc container
- [renderer/styles.css](/home/harshit/coding/agent-office/apps/desktop/renderer/styles.css)
  - added toolbar, SuperDoc container styles
- [renderer/index.js](/home/harshit/coding/agent-office/apps/desktop/renderer/index.js)
  - SuperDoc mounting, tab switching, save handling, mode switching

## Current state

- [x] Phase 0: Shell with folder tree and tab management
- [x] Phase 1 (minimum): Document session service for open/save/mode
- [x] Phase 2: SuperDoc embedded, renders DOCX, supports modes, save to disk

## Verification target

Phase 2 is considered successful when:
1. App launches and folder can be opened
2. `.docx` files appear in workspace tree
3. Clicking a `.docx` file opens it in a tab
4. Document renders in center pane with SuperDoc
5. Typing edits the document
6. Switching modes (viewing/editing/suggesting) works
7. Save button exports and writes back to disk
8. Switching tabs switches the rendered document cleanly

## Gaps intentionally left for later phases

- no watcher-driven incremental workspace refresh yet
- no agent runtime or MCP integration yet
- no patch engine or diff viewer yet
- document session service can be extracted to packages/desktop-core/
- renderer no longer imports SuperDoc packages directly
