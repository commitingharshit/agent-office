# Project Plan: Code OSS DOCX Editor Integration

## Vision

Build a native-first DOCX editor inside Code OSS that treats `.docx` as a semantic document, not a blob.

The first step is to make DOCX render and edit inside Electron using the existing custom editor shell. The long-term goal is larger:

- preserve Code OSS file open, close, tab, save, save as, revert, and diff behavior
- expose Word-like formatting and tracked changes in the render surface
- keep the document model semantic so AI agents can index, diff, and patch it quickly
- support cursor-like redlines and future compare workflows on top of the same engine

The architecture should stay narrow:

- Code OSS owns editor lifecycle and host behavior
- the DOCX engine owns OOXML parse, render, edit, and serialization
- the webview is the first Electron host for the renderer

## Product Goals

- Open `.docx` files in a normal editor tab with Word-fidelity rendering.
- Render the document inside a Code OSS webview.
- Preserve standard Code OSS custom-editor behavior end-to-end.
- Support manual save only in v1.
- Keep the architecture small enough to extend later for autosave, collaboration, and virtual filesystem work.
- Prove OOXML round-trip fidelity on hard documents before investing in diff or patch workflows.
- Keep the Code OSS fork surface narrow and intentional.

## Monorepo Context

The integration lives inside the `causualdocx/` fork of `eigenpal/docx-editor`:

```text
causualdocx/docx-editor/
  apps/
    vscode-ext/          ← extension host (TypeScript, CommonJS)
      src/               ← extension.ts, DocxDocument.ts, types.ts
      webview/           ← React bundle (Vite, ESM)
        src/main.tsx
  packages/
    react/               ← @casualoffice/docs — editor component and renderer
    core/                ← @eigenpal/docx-core
```

The webview bundle aliases `@casualoffice/docs` to `packages/react` via Vite path resolution. `packages/react` must be built (`bun run build`) before the webview build.

## Scope For V1

- `CustomEditorProvider<DocxDocument>` for `*.docx`
- Read bytes from disk into a document model
- Send bytes to the webview renderer via `postMessage`
- Receive updated bytes back from the webview on explicit save
- Write bytes to disk on save, save as, and revert
- Dirty tracking driven by webview change events
- No autosave
- No live collab server sync
- No collaboration in the first pass
- No undo/redo stack in the extension. The webview ProseMirror instance owns undo history.
- We are already in a Code OSS fork; the goal is to keep future host patches localized and deliberate.

## Non-Goals For V1

- No Electron-embedded standalone application
- No file-system watcher loop
- No background sync
- No OOXML virtual filesystem abstraction
- No multiple editors per document
- No attempt to replace Code OSS editor chrome
- No extension-side undo/redo

## Success Criteria

- `.docx` files open as custom editors, not text editors.
- The renderer shows the document correctly in the webview.
- Edits mark the tab dirty.
- Ctrl+S inside the webview persists changes to the same file.
- Ctrl+S from the workbench also persists the latest editor state, not stale bytes.
- Save As produces a new file from the current in-memory edit state.
- Revert reloads the current file from disk and updates the renderer.
- Closing a dirty editor triggers the expected workbench prompt.

## Known Risks

- **OOXML fidelity gap.** ProseMirror-based DOCX editing can lose XML details that Word expects to round-trip cleanly. This must be proven on a stress corpus before Phase 3-5 are treated as reliable.
- **Stale bytes on workbench save.** When the workbench triggers `saveCustomDocument`, the extension only has the last-serialized bytes unless it asks the webview for the live editor state first. The save flow must perform a `getDocument` / `save` round-trip before writing disk.
- **Message ordering race.** The extension must not assume the React app has mounted when `resolveCustomEditor` fires. Mitigation: the webview sends a `ready` message on mount; the extension replies with `init` only after `ready` and again on re-reveal.
- **Build ordering.** `packages/react/dist` must exist before `webview/` can build. CI must run `bun run build` in `docx-editor/` first.
- **Edit loss on crash.** Because the extension snapshot updates only on explicit save, any crash or force-close before save loses edits since the last successful write. Accepted for v1.

## Delivery Phases

### Phase 0: OOXML Fidelity Proof

- Build a stress corpus with nested tables, comments, tracked changes, headers, footers, styles, images, and representative Word-authored documents.
- Prove parse -> edit -> serialize -> reopen round-trips without losing required OOXML structure.
- Verify that revision IDs, comments, and style relationships survive a save/reload cycle.
- Fail the phase if fidelity depends on a manual repair step after serialization.

### Phase 1: Extension Skeleton

- Add the VS Code extension package under `causualdocx/docx-editor/apps/vscode-ext`.
- Wire it into the monorepo workspace through path aliases in `tsconfig.json` and Vite aliases in `webview/vite.config.ts`.
- Register the custom editor contribution for `.docx` in `package.json`.
- This phase is already nearly complete; use it as the baseline for narrowing remaining gaps rather than rethinking the host.

### Phase 2: Document Lifecycle

- Implement `DocxDocument`: load, save, saveAs, revert, backup, dirty flag, version counter.
- Implement `DocxEditorProvider` with all `CustomEditorProvider<DocxDocument>` lifecycle hooks.
- Keep the extension as the source of truth for bytes, dirty state, and save/revert operations.
- Ensure save always resolves the latest webview bytes before writing to disk.
- Keep re-open, re-reveal, and backup flows deterministic.

### Phase 3: Webview Renderer

- Create `webview/src/main.tsx` as the React bundle entrypoint.
- Import `DocxEditor` and `DocxEditorRef` from `@casualoffice/docs`.
- Bridge editor events through the VS Code webview message API.
- Feed document bytes into `<DocxEditor />`.
- Use `window.addEventListener('message', ...)` for inbound extension messages.
- Keep the webview bundle Electron-safe and avoid Node-only runtime dependencies.

### Phase 4: Verification

Blockers that must be resolved before smoke-testing:

1. Tighten the extension/webview message protocol and handshake semantics.
2. Make the extension own the current byte snapshot and dirty state.
3. Ensure save and save-as both resolve the latest webview state before disk writes.
4. Add disposal and cleanup rules for open editors and documents.
5. Build `packages/react` (`bun run build` in `docx-editor/`).
6. Build the webview (`npm run build` in `apps/vscode-ext/webview/`).
7. Compile the extension (`tsc -p ./` in `apps/vscode-ext/`).
8. Smoke test open, edit, save, save as, revert, and close flows in the Code OSS Extension Development Host.
9. Verify that the flow works without patching core Code OSS files.
10. Confirm which host gaps still require fork-level patches versus extension-only fixes.

### Phase 5: Polish and Packaging

- Write `.vscodeignore` to exclude `src/`, `webview/src/`, and `node_modules/` from the packaged extension.
- Add `launch.json` for Extension Development Host debugging.
- Fix CSP to allow `vscode-resource:` fonts from the editor stylesheet.
- Add cleanup for `_editors` and `_documents` maps on document close.
- Add packaging and release metadata once the editor flow is stable.
- Only introduce additional Code OSS fork changes here if a later feature has a proven need for them.
