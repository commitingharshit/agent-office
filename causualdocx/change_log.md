# Change Log

## Scope
This log captures the current worktree changes in the `docx-editor` project, with folder-level detail and the key file paths that were modified or generated during the Hermes/Copilot integration work.

## 1) VS Code extension integration
Folder: `docx-editor/apps/vscode-ext/`

### Source/config files modified
- `docx-editor/apps/vscode-ext/README.md`
- `docx-editor/apps/vscode-ext/package.json`
- `docx-editor/apps/vscode-ext/src/DocxDocument.ts`
- `docx-editor/apps/vscode-ext/src/extension.ts`
- `docx-editor/apps/vscode-ext/src/types.ts`
- `docx-editor/apps/vscode-ext/tsconfig.json`
- `docx-editor/apps/vscode-ext/webview/package.json`
- `docx-editor/apps/vscode-ext/webview/src/main.tsx`
- `docx-editor/apps/vscode-ext/webview/tsconfig.json`
- `docx-editor/apps/vscode-ext/webview/vite.config.ts`

### New source file added
- `docx-editor/apps/vscode-ext/src/hermesChatParticipant.ts`

### Generated / build output in this folder
- `docx-editor/apps/vscode-ext/webview/src/index.css`
- `docx-editor/apps/vscode-ext/webview/src/main.js`
- `docx-editor/apps/vscode-ext/webview/src/main.js.map`

### Notes
- This folder now contains the Hermes participant wiring and the webview-side UI/runtime changes that back the VS Code chat / Copilot-like surface.
- The extension package and webview package configs were updated together so the participant and the embedded UI stay in sync.

## 2) React editor package changes
Folder: `docx-editor/packages/react/`

### Source/config files modified
- `docx-editor/packages/react/src/components/TitleBar.tsx`
- `docx-editor/packages/react/tsup.config.ts`

### Build output generated under this package
- Generated files were emitted into `docx-editor/packages/react/src/` as compiled `.js`, `.js.map`, `.d.ts`, and `.d.ts.map` artifacts.
- Total generated file count currently visible in git status for this subtree: 592

### Notes
- These changes are part of the editor-side integration that the extension/webview work depends on.
- The generated artifacts were produced by the package build step and are not hand-edited source.

## 3) Core package build output
Folder: `docx-editor/packages/core/`

### Generated build artifacts
- Generated files were emitted into `docx-editor/packages/core/src/` as compiled `.js`, `.js.map`, `.d.ts`, and `.d.ts.map` artifacts.
- Total generated file count currently visible in git status for this subtree: 814

### Notes
- These are build outputs created by the current toolchain run.
- They are grouped here because the repo is large and the build emits many files across the core package tree.

## 4) Workspace-level dependency / build metadata
Folder: `docx-editor/`

### Modified files
- `docx-editor/package.json`
- `docx-editor/bun.lock`

### Notes
- These reflect dependency / package-level changes required by the extension and webview work.

## 5) Summary by folder
- `docx-editor/apps/vscode-ext/` — 14 changed paths
- `docx-editor/packages/react/` — 592 changed paths
- `docx-editor/packages/core/` — 814 changed paths
- `docx-editor/package.json` and `docx-editor/bun.lock` — workspace-level changes

## 6) Validation status
- TypeScript compile: passed
- ESLint: passed
- Build: passed
