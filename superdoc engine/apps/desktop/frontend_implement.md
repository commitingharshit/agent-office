# SuperDoc Desktop Frontend Implementation

## Goal
Make the desktop shell feel closer to VS Code while preserving the document backend, especially SuperDoc mounting, document sessions, and save/reload behavior.

## Phase 1: Shell Realignment
- Keep the Electron main process, preload bridge, and document-session flow unchanged.
- Use the right-side assistant panel as a hideable surface instead of a permanent layout anchor.
- Expand the center editor when the assistant is hidden.
- Move the explorer tree slightly lower so the left column reads more like VS Code.

## Phase 2: VS Code-Like Chrome
- Tighten the top bar spacing and neutralize the palette toward VS Code dark.
- Rework buttons, tabs, and status strip to feel like native editor chrome.
- Keep the document toolbar as the only visible formatting surface in the shell.

## Phase 3: Renderer Surface Reduction
- Remove any visible renderer-only panel chrome that duplicates document actions.
- Preserve the formatting backend behind the toolbar actions such as bold, italics, and future inline commands.
- Keep the webview/editor mount point stable so document rendering is not disturbed.

## Phase 4: Panel and Analyzer Expansion
- Add a clearer dock for analysis or assistant output when needed.
- Ensure the main document panel can take the full center width in the default state.
- Keep the layout responsive so the assistant can be hidden on smaller screens without breaking the editor.

## Phase 5: Visual Cleanup
- Remove any decorative blue document-style artwork if it appears in later UI surfaces.
- Recheck spacing, icon density, and panel alignment against the VS Code reference images.
- Validate that save, reload, tab switching, and document mode changes still behave exactly as before.