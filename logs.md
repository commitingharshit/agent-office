# Change Log

## 2026-06-26

- Created `project_plan.md` to capture the product vision for the Code OSS DOCX custom editor integration.
- Created `implement.md` to describe the extension architecture, document lifecycle, webview contract, and save/revert flow.
- Reserved this file for future implementation notes and change tracking.

## 2026-06-26 - Architecture upgrade

- Reviewed the initial docs against the repo context and tightened the Code OSS custom editor contract.
- Clarified that the extension is the source of truth for bytes and dirty state, while the webview owns ProseMirror editing state.
- Added a stricter `ready` / `init` handshake and explicit request-response semantics for save operations.
- Removed ambiguity around stale-byte saves, save-as behavior, and editor cleanup responsibilities.

## 2026-06-26 - First code slice

- Replaced the placeholder extension provider with a real `CustomEditorProvider<DocxDocument>` implementation.
- Rewrote the document model around explicit load/save/saveAs/revert/backup helpers.
- Rebuilt the webview as a minimal React host around `DocxEditor` with message-driven init, save, and revert flows.
- Updated the Vite config to emit a manifest and resolve the local DOCX editor and core packages from source.

## 2026-06-26 - Runtime Fix & Stale Out Cleanup

- Identified and cleaned up stale/duplicate output directories (`out/src` and `out/webview`) resulting from the monorepo `rootDir` refactor.
- Rewrote `openCustomDocument` in `extension.ts` to safely validate `openContext` and `openContext.backupId` (ensuring it is a string before evaluating `.startsWith`).
- Recompiled the extension cleanly (`npm run compile`), generating a single correct build output in `out/apps/vscode-ext/src/extension.js`.
- Verified that the DOCX Custom Editor extension operates fully self-contained offline via `vscode-file://` with no backend/separate server requirement.

