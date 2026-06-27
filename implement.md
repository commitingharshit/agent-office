# DOCX Editor Goals Checklist

## Phase 1: Make DOCX Render In Code OSS

- [ ] Open `.docx` files in Code OSS as a custom editor tab.
- Treat `.docx` as a custom document, not a plain text file.
- Keep the current `apps/vscode-ext` custom editor shell as the first host.
- Make the file open from Explorer, recent files, and reopen flows.
- [ ] Render the document inside Electron, not only on localhost.
- The renderer must work in the workbench webview, not only in the local demo app.
- The bundle must load in Electron with the current CSP and manifest flow.
- Failures should be visible in the webview or as a workbench error, not a blank panel.
- [ ] Keep the existing VS Code file open / close / tab lifecycle working.
- Opening, closing, re-opening, and switching tabs must behave like a normal editor.
- The custom editor should respect the workbench's standard dirty-close prompt.
- Hidden tabs must restore their state when brought back to the front.
- [ ] Keep save, save as, revert, and dirty state working end to end.
- The workbench save path must fetch the live document state from the webview before disk write.
- Save As must preserve the in-memory edited state, then retarget the saved file.
- Revert must reload disk bytes and refresh the renderer with the fresh document state.
- Dirty state must come from the editor surface, not from stale snapshots.
- [ ] Keep the webview as the rendering surface for formatting and editing controls.
- Put bold, italics, color, comments, and similar document UI in the middle panel.
- Keep the host chrome thin; do not move document rendering into the extension process.
- Preserve live editing in the same surface where the user sees the document.
- [ ] Make the extension the source of truth for file bytes and disk writes.
- The extension owns disk I/O, backup, save, save as, and revert.
- The webview can request save or report changes, but it should not directly write files.
- The extension should keep the latest committed bytes as its authoritative snapshot.
- [ ] Make the webview send live document bytes back on save.
- The webview must serialize the current ProseMirror/editor state on demand.
- The save response should be correlated so the extension can match request and response.
- The workbench-triggered save must not rely on stale bytes cached before editing.
- [ ] Make revert reload bytes from disk and rehydrate the renderer.
- Revert must replace the editor contents with the on-disk version.
- The renderer should re-bind to the new document bytes after revert.
- The tab should clear dirty state when revert completes.
- [ ] Make re-reveal / tab restore redraw the document correctly.
- Hiding and revealing the editor should not blank the document.
- Rehydration must work after tab switching, layout changes, and reloads.
- The editor should send a fresh init on re-reveal if needed.

## Phase 2: Keep The Host Native

- [ ] Preserve normal Code OSS editor behavior for `.docx`.
- The user should get normal editor tabs, focus, dirty dots, and close prompts.
- The extension should behave like a first-class editor, not a special popup.
- Keep keyboard and command behavior aligned with the workbench.
- [ ] Keep editor resolution deterministic for DOCX files.
- `.docx` should resolve to the custom editor consistently, without flaky fallback behavior.
- Reopen, open-with, and diff-related resolution should follow the same rule set every time.
- Avoid ambiguous resolution paths that depend on incidental state.
- [ ] Keep custom editor registration narrow and predictable.
- Register only the DOCX view types needed for the current milestone.
- Avoid broad file-type claims or unrelated editor registrations.
- Keep the provider capabilities explicit and minimal.
- [ ] Patch only the Code OSS seams needed for lifecycle, not unrelated editor internals.
- Prefer editor resolution, custom editor input, and webview lifecycle seams.
- Do not patch Monaco, SCM, or generic diff internals unless a DOCX requirement forces it.
- Keep future native patches isolated and easy to remove if the architecture changes.

## Phase 3: Cursor-Like Redlines

- [ ] Support `suggesting` mode as the first visible redline workflow.
- Use the engine's semantic suggestion mode, not a byte-diff overlay.
- Make track-changes the default visible diff language for document edits.
- Surface the mode in the editor UI so users can switch between editing and suggesting.
- [ ] Show insertions, deletions, and replacements as tracked changes.
- Render the redline state directly in the document view.
- Preserve author, revision, and timestamp metadata where the engine supports it.
- Keep the markup stable enough to serialize back into OOXML.
- [ ] Let the user accept or reject tracked changes.
- Accept/reject actions should work on the semantic document model.
- The UI should expose the change list and per-change actions.
- Rejections should remove the change cleanly without corrupting the document structure.
- [ ] Keep tracked-change metadata stable through save and reload.
- Save and reopen must not lose the tracked-change structure.
- Revision IDs must survive serialization in a consistent way.
- Reloaded documents should reconstitute the same redline semantics.
- [ ] Preserve revision IDs for later diff and patch workflows.
- Revision IDs are the bridge between live redlines, compare views, and AI patch suggestions.
- Do not collapse them into opaque text replacements.
- Keep them available in the semantic model for later indexing and matching.

## Phase 4: DOCX Compare

- [ ] Compare two `.docx` files semantically, not as raw zip bytes.
- Compare paragraphs, runs, tables, comments, and revisions, not binary archives.
- Use parsed document structure as the unit of diff.
- Preserve meaning even when byte-level layout changes.
- [ ] Reuse the existing custom diff pipeline in Code OSS.
- Build on the custom editor diff host instead of inventing a new diff editor.
- Let Code OSS manage diff opening, tab behavior, and layout toggles.
- Keep the diff implementation aligned with existing workbench conventions.
- [ ] Support inline diff and side-by-side diff views.
- Inline diff should support a compact review workflow.
- Side-by-side diff should support detailed comparison when needed.
- The user should be able to switch based on workbench configuration or command choice.
- [ ] Map differences to document structure such as paragraphs, runs, tables, and comments.
- Diff results should be structural and readable, not just line-based.
- Keep enough semantic context to explain what changed.
- The compare view should feed later redline and patch workflows.

## Phase 5: Semantic Indexing And AI Patching

- [ ] Index the document by semantic nodes, not by raw OOXML bytes.
- Index chapters, paragraphs, runs, tables, comments, and revisions.
- Keep the index keyed by stable document structure rather than archive offsets.
- Make retrieval fast enough for agent context expansion.
- [ ] Use stable structural anchors for retrieval and patching.
- Anchors should survive minor edits and preserve local edit intent.
- They should point to document regions, not just absolute character offsets.
- Use anchors to map AI instructions back onto the document model.
- [ ] Apply AI edits as targeted semantic patches.
- AI output should become a patch against the semantic model.
- Avoid full-document rewrites when a localized change is sufficient.
- Patches should preserve surrounding structure and formatting where possible.
- [ ] Preview AI edits as tracked changes or compare output before commit.
- Give users an inspectable diff before committing any agent action.
- Prefer redlines or compare preview over silent mutation.
- The preview must explain what changed and where.
- [ ] Keep the context surface fast enough for agentic use.
- Retrieval, patch generation, and preview should stay responsive on large documents.
- The indexing layer should minimize repeated parsing work.
- The system should support incremental updates instead of full recomputation whenever possible.

## Explicit Non-Goals For Now

- [ ] Do not use LibreOffice as the runtime editor.
- LibreOffice can remain a fidelity reference or fallback tool, not the main editor loop.
- [ ] Do not build a byte-level diff engine as the main UX.
- Byte diffs are too low-level for document editing semantics.
- The user-facing diff should be structural and meaningful.
- [ ] Do not patch Monaco internals unless a specific DOCX feature requires it.
- Monaco is not the DOCX model.
- Only touch it if a later document feature genuinely needs editor-core integration.
- [ ] Do not fork broad Code OSS subsystems before the semantic DOCX model is stable.
- Keep the host changes narrow until the engine proves the model.
- Avoid deep workbench forks until the rendering and document semantics are locked down.
