 # SuperDoc Desktop IDE + OOXML Patch Engine

  ## Summary

  - Build a standalone Electron desktop app with a VS Code-like layout:
      - left: workspace/file tree and search
      - center: SuperDoc editor
      - right: agent sidebar
      - optional bottom: patch logs / diagnostics / diff viewer

  - Reuse the current SuperDoc stack for document rendering and editing.
  - Reuse the current MCP/SDK/document-host surfaces for the first agent integration.
  - Add two new core subsystems:
      - a workspace index for folder/file/document discovery and semantic lookup
      - an OOXML patch engine for Cursor-style diff/patch workflows

  - Treat OfficeCLI as the external semantic reference for patching behavior:
      - deterministic operations
      - path-based targeting
      - batch edits
      - repair/validation flows

  - Treat OpenClaw as the initial local agent-hosting/inference integration reference only. It must sit behind an abstraction so it can be swapped later.

  ## Product Rules

  - The app is DOCX-first. Do not plan Excel/PowerPoint support in v1.
  - The editor must never depend on raw ProseMirror internals from the shell layer.
  - The document engine remains the source of truth for document state; the shell only orchestrates.
  - The patch engine must be able to:
      - diff two DOCX states
      - apply atomic or batched changes
      - preserve package integrity
      - emit structured errors

  - The index layer must support:
      - workspace folder traversal
      - file-level search
      - document-level search
      - revision-aware handles
      - incremental refresh after save and file change

  ## Target Architecture

  - apps/desktop
      - Electron main process
      - Electron preload
      - React renderer
      - workspace tree, tabs, agent sidebar, diff panel

  - packages/desktop-core
      - document session service
      - file watcher
      - state store
      - UI event contracts

  - packages/workspace-index
      - folder/file index
      - document text/structure index
      - semantic retrieval hooks
      - incremental reindex API

  - packages/ooxml-patch-engine
      - diff capture
      - patch representation
      - patch apply/rewrite
      - repair pass
      - validation and checksum checks

  - packages/agent-runtime
      - agent message loop
      - tool execution abstraction
      - MCP backend
      - OpenClaw backend adapter

  - packages/officecli-adapter
      - OfficeCLI-style path parsing
      - OfficeCLI-compatible patch translation
      - OfficeCLI-like error normalization
      - optional validation/repair bridge

  ## Existing SuperDoc Surfaces to Reuse

  - Open/edit/export in browser or embedded UI:
      - SuperDoc / @superdoc-dev/react

  - Headless document operations:
      - @superdoc-dev/sdk
      - @superdoc/document-host

  - Agent tool surface:
      - apps/mcp

  - Document API primitives:
      - query.match
      - find
      - insert
      - replace
      - format.apply
      - comments.*
      - trackChanges.*
      - diff.capture
      - diff.compare
      - diff.apply
      - index.*
      - metadata.*

  ## Implementation Phases

  ### Phase 0: Freeze Scope and Add the Desktop App Skeleton

  - Create apps/desktop.
  - Add a root-level workspace package entry for it.
  - Add a minimal Electron shell with:
      - one main window
      - a left sidebar placeholder
      - a center editor placeholder
      - a right agent sidebar placeholder

  - Add a top-level “Open Folder” command.
  - Add a top-level “Open File” command for .docx.
  - Add a basic store for:
      - active workspace path
      - open tabs
      - active document session
      - selected folder/file
      - agent panel state

  Deliverables:

  - App launches.
  - Folder picker works.
  - File picker works.
  - Layout is stable.

  Acceptance criteria:

  - App opens on Linux desktop.
  - App can choose a folder.
  - App can select a .docx file from that folder.
  - No document editing yet, only shell navigation.

  ———

  ### Phase 1: Document Session Service

  Create the service that every editor tab uses.

  Responsibilities:

  - Open a DOCX file from disk.
  - Create a document session.
  - Export/save current state back to disk.
  - Close session cleanly.
  - Expose a normalized document snapshot to the UI.
  - Expose a normalized event stream for:
      - edits
      - save
      - reload
      - exceptions
      - doc mode changes
      - tracked changes updates

  Use the SuperDoc SDK or document-host as the actual runtime handle. The UI must not talk directly to file bytes except through this service.

  Proposed service methods:

  - openDocument(path, options)
  - saveDocument(sessionId, options)
  - closeDocument(sessionId)
  - reloadDocument(sessionId)
  - getDocumentSnapshot(sessionId)
  - subscribeDocumentEvents(sessionId, listener)
  - applyPatch(sessionId, patch)
  - runQuery(sessionId, query)
  - runTool(sessionId, toolName, args)

  Snapshot should include:

  - document path
  - session id
  - dirty state
  - revision or fingerprint
  - document mode
  - capabilities
  - open metadata
  - last save timestamp
  - any diff/index fingerprints needed by the patch engine

  Acceptance criteria:

  - Open a DOCX from disk.
  - Render it.
  - Save it back to the same file.
  - Reopen and verify persisted changes.

  ———

  ### Phase 2: Embed SuperDoc in the Center Pane

  Use the existing React wrapper and document config path.

  Center-pane requirements:

  - render the .docx
  - support editing mode
  - support viewing mode
  - support suggesting mode
  - support export/save
  - support comments and tracked changes
  - support basic toolbar actions

  Implementation details:

  - mount SuperDoc in the renderer
  - keep the hidden editor state isolated from the shell
  - keep toolbar and mode controls outside the editor component
  - forward file bytes into the editor as a File or Blob
  - export to DOCX bytes on save

  Recommended UI surfaces:

  - top toolbar
  - editor canvas
  - document status strip
  - revision/dirty indicator

  Acceptance criteria:

  - Open document renders with pagination and formatting.
  - Typing edits the document.
  - Save writes the updated DOCX to disk.
  - Reopening preserves formatting and content.

  ———

  ### Phase 3: Left Workspace Tree

  Build the Explorer-like file tree.

  Features:

  - recursive folder browsing
  - file filtering by extension
  - open file on click
  - context actions:
      - open
      - reveal in OS file explorer
      - copy path
      - rename
      - delete

  - recent folders list
  - pinned folders list

  Data source:

  - local file system only
  - no document parsing in this layer
  - document parsing happens only after opening a file

  Implementation notes:

  - Use a file tree model with lazy loading for large folders.
  - Cache folder children and invalidate on watcher events.
  - Keep UI navigation state separate from document sessions.

  Acceptance criteria:

  - Open a folder and browse nested files.
  - Click a .docx and open it in a tab.
  - Refresh tree when files are added, removed, or renamed.

  ———

  ### Phase 4: Right Agent Sidebar

  Create a docked agent panel that can:

  - read current document context
  - ask questions about the document
  - propose edits
  - apply edits through document tools
  - show tool calls and intermediate results
  - show retry / failure reasons

  Panel layout:

  - conversation stream
  - tool-call trace
  - action buttons for approve / reject / apply
  - document context summary
  - active patch preview

  Agent backend abstraction:

  - MCPBackend for initial tool access
  - OpenClawBackend for later conversational/model integration
  - both conform to the same AgentRuntime interface

  Initial UI flow:

  1. user types prompt
  2. agent backend requests context
  3. agent executes tool calls
  4. tool calls update the document session
  5. sidebar shows result and a patch summary

  Acceptance criteria:

  - Sidebar can read the current document.
  - Sidebar can perform at least one edit.
  - Sidebar can show the tool trace.
  - Sidebar updates the document in the editor pane.

  ———

  ### Phase 5: Workspace Index

  Build a separate index that supports “Cursor-style” navigation across the workspace.

  Important distinction:

  - This is workspace indexing, not raw XML indexing.
  - It must serve:
      - file discovery
      - semantic search
      - change impact
      - document navigation
      - future agent retrieval

  Index layers:

  1. Workspace file index
      - paths
      - file types
      - size
      - modified time
      - open state

  2. Document structural index
      - headings
      - paragraphs
      - tables
      - comments
      - tracked changes
      - content controls
      - index entries
      - metadata anchors

  3. Retrieval index
      - extracted text chunks
      - optional embeddings
      - semantic labels
      - backlinks to file paths and document targets

  Index sources:

  - folder tree
  - SuperDoc Document API discovery surfaces
  - document diff snapshots
  - file watcher events
  - save events

  Index behaviors:

  - build on open
  - refresh on save
  - refresh on external file change
  - preserve stable handles when possible
  - mark stale handles after structural change
  - support exact and semantic search

  Acceptance criteria:

  - Search a folder for files.
  - Search a document for headings, text, comments, and index entries.
  - Reopen a file and keep stable references where possible.
  - Refresh changed files without a full workspace rebuild.

  ———

  ### Phase 6: OOXML Patch Engine

  Build the real patch system here.

  Goal:

  - allow the app and agent to request document changes as patches rather than raw UI actions
  - support deterministic patch capture, compare, preview, and apply
  - preserve DOCX package integrity

  The patch engine should expose:

  - captureSnapshot(session)
  - compareSnapshots(base, target)
  - previewPatch(base, patch)
  - applyPatch(session, patch, options)
  - repairPatch(patch, context)
  - validatePatch(patch, context)

  Patch model requirements:

  - versioned
  - explicit target handles
  - structured operations
  - deterministic errors
  - reversible metadata where possible
  - support direct vs tracked application modes

  Patch content should be able to represent:

  - insert / delete / replace text
  - formatting changes
  - list changes
  - comments
  - track-change decisions
  - metadata anchors
  - index entry changes
  - table cell mutations
  - section/header/footer changes where supported

  OfficeCLI alignment:

  - use path-based, deterministic patch notation
  - preserve a clean JSON representation
  - support batch execution
  - emit stable diagnostics for invalid targets
  - allow repair/validation before final application

  Recommended internal flow:

  1. capture source snapshot
  2. compute target snapshot or intent patch
  3. normalize and validate
  4. preview against session state
  5. apply to document session
  6. export DOCX
  7. reopen and verify integrity
  8. if invalid, run repair/normalize pass

  Acceptance criteria:

  - diff two docs
  - apply diff to base doc
  - export result
  - reopen result without corruption
  - preserve comments/tracked changes where present

  ———

  ### Phase 7: OfficeCLI Compatibility Adapter

  Use OfficeCLI as a compatibility and inspiration layer, not a hard dependency.

  The adapter should:

  - map OfficeCLI-style target paths into SuperDoc targets
  - normalize OfficeCLI-like structured errors
  - translate batch edit intent into the local patch engine
  - support “verify then patch” behavior
  - support raw-XML repair fallback only if structured patching fails

  Adapter outputs:

  - target resolution result
  - patch plan
  - validation report
  - apply report
  - repair suggestions

  This layer is where you keep the system open to external CLI interop later.

  Acceptance criteria:

  - given a path-like instruction, resolve the intended target
  - given a batch patch request, emit a deterministic patch plan
  - unsupported ops fail cleanly with structured errors

  ———

  ### Phase 8: Agent Tooling and Model Integration

  Build agent execution around tools, not direct DOM mutation.

  Agent runtime modes:

  - mcp
  - sdk
  - openclaw
  - later: native

  Agent capabilities:

  - inspect document
  - search document
  - diff document
  - apply patch
  - create comments
  - accept/reject tracked changes
  - generate patch preview
  - request human approval before destructive actions

  Agent UX:

  - prompt composer
  - streaming response area
  - tool-call timeline
  - approval prompts for risky operations
  - “apply patch” preview card
  - rollback/retry state

  Safety rules:

  - never let the agent edit raw file bytes directly
  - always pass through document session or patch engine
  - require explicit user approval for destructive operations if configured
  - maintain a full action log

  Acceptance criteria:

  - agent can propose a patch
  - agent can preview the patch
  - user can approve or reject
  - approved changes land in the document

  ———

  ### Phase 9: Diff Viewer and Review Workflow

  Add a proper review panel for document diffs.

  Features:

  - compare current doc to saved version or another file
  - show summary of changed components
  - show line/block-level changes
  - show tracked changes separately from direct edits
  - accept/reject individual changes or whole diff
  - navigate between changes

  Use:

  - diff.capture
  - diff.compare
  - diff.apply
  - trackChanges.list
  - trackChanges.get
  - trackChanges.decide

  Acceptance criteria:

  - create a diff between two DOCX files
  - inspect the diff summary
  - apply it as tracked changes
  - accept/reject changes from the sidebar

  ———

  ### Phase 10: Packaging and Distribution

  Package as a desktop app.

  Targets:

  - Linux first
  - then Windows
  - then macOS

  Packaging tasks:

  - app icon
  - installer or AppImage
  - auto-update strategy
  - file association for .docx
  - OS open-with integration
  - recent documents persistence
  - crash recovery
  - unsaved changes prompts

  Acceptance criteria:

  - installable package
  - double-clicking a .docx opens the app
  - folder tree and agent sidebar persist layout state across restarts

  ## Proposed Internal APIs

  ### Document session API

  - openDocument(path: string): Promise<DocumentSession>
  - saveDocument(sessionId: string, opts?: { out?: string; inPlace?: boolean }): Promise<void>
  - closeDocument(sessionId: string): Promise<void>
  - reloadDocument(sessionId: string): Promise<void>

  ### Patch engine API

  - captureSnapshot(sessionId: string): Promise<DiffSnapshot>
  - compareSnapshots(base: DiffSnapshot, target: DiffSnapshot): Promise<DiffPayload>
  - applyPatch(sessionId: string, patch: PatchEnvelope, opts?: { mode: 'direct' | 'tracked' }): Promise<PatchApplyResult>
  - repairPatch(patch: PatchEnvelope, context: RepairContext): Promise<PatchEnvelope>

  ### Workspace index API

  - indexWorkspace(root: string): Promise<void>
  - reindexPath(path: string): Promise<void>
  - searchWorkspace(query: string): Promise<SearchResult[]>
  - searchDocument(sessionId: string, query: string): Promise<DocumentSearchResult[]>

  ### Agent runtime API

  - sendMessage(sessionId: string, message: string): Promise<AgentTurn>
  - streamTurn(sessionId: string, message: string): AsyncIterable<AgentEvent>
  - approveToolCall(turnId: string, toolCallId: string): Promise<void>
  - rejectToolCall(turnId: string, toolCallId: string): Promise<void>

  ## Error and Validation Rules

  - All services must return structured errors, not bare strings, for normal failure paths.
  - Invalid targets must fail before mutation.
  - Post-apply not-found should not be silent.
  - Diff/patch operations must include fingerprints or revisions.
  - Stale handles must be marked explicitly.
  - Any repair fallback must be visible in logs and the UI.

  ## Testing Plan

  ### Unit tests

  - document session open/save/close
  - workspace tree loading and invalidation
  - patch normalization and validation
  - OfficeCLI path parsing
  - agent runtime event sequencing

  ### Integration tests

  - open DOCX → edit → export → reopen
  - diff two fixture docs → apply patch → verify output
  - workspace search returns expected files and targets
  - agent tool call updates document and logs trace
  - file watcher reloads external changes

  ### Regression tests

  - DOCX round-trip integrity
  - tracked changes persistence
  - comments persistence
  - tables, lists, headers/footers, numbering
  - index entries and metadata anchors
  - patch engine preserves package relationships and media

  ### Packaging tests

  - Linux app launch
  - file open from OS shell
  - open-with association
  - crash recovery
  - permission denied handling

  ## Milestone Order

  1. Electron shell
  2. document session service
  3. SuperDoc embed
  4. folder tree + tabs
  5. save/reload/watch
  6. agent sidebar using MCP/SDK
  7. workspace index
  8. diff/patch engine
  9. OfficeCLI compatibility adapter
  10. packaging and release

  ## Assumptions

  - Electron is the first desktop shell.
  - DOCX is the only document type in v1.
  - The initial agent backend uses the built-in MCP/SDK route.
  - OpenClaw is used only behind the AgentRuntime interface, not as the document engine.
  - OfficeCLI is a reference implementation for semantics and compatibility, not a required dependency.
  - “Cursor-style indexing” means workspace semantic indexing plus document structural indexing, not a raw text grep of OOXML XML parts.
  - The implementation doc should be saved as apps/desktop/IMPLEMENTATION.md.

  ## Suggested Acceptance Gate for MVP

  - Open folder
  - Browse files
  - Open .docx
  - Edit the document
  - Save to disk
  - Show agent sidebar
  - Ask agent to change text
  - Preview and apply a patch
  - Reopen and verify the .docx is still valid

  ## Source References

  - packages/superdoc/README.md
  - apps/vscode-ext/README.md
  - apps/mcp/README.md
  - packages/document-host/README.md
  - packages/document-api/src/README.md
  - packages/document-api/src/types/discovery.ts
  - packages/document-api/src/diff/diff.types.ts
  - demos/editor/custom-ui/README.md
  - demos/collaborative-agent/README.md
  - examples/ai/footnote-tool-agent/README.md
  - examples/ai/streaming/README.md
  - OfficeCLI repository (https://github.com/iOfficeAI/OfficeCLI)
