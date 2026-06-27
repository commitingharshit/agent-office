# DOCX Editor for VS Code

A custom VS Code editor for `.docx` files, providing full Word document editing fidelity with the Casual Docs / EigenPal editor engine.

## Features

- Open `.docx` files directly in VS Code tabs
- Full Word formatting support (tables, images, styles, etc.)
- Save and Save As support
- Revert to last saved state
- Dirty state tracking
- Standard VS Code editor behavior
- Hermes chat participant (`@hermes`) in the VS Code Chat panel

## Requirements

- VS Code 1.85.0 or higher

## Installation

### From source

1. Clone the repository:
   ```bash
   git clone https://github.com/CasualOffice/docs.git
   cd docs/docx-editor
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the packages:
   ```bash
   bun run build
   ```

4. Navigate to the extension directory:
   ```bash
   cd apps/vscode-ext
   ```

5. Install extension dependencies:
   ```bash
   npm install
   ```

6. Build the webview:
   ```bash
   cd webview
   npm install
   npm run build
   cd ..
   ```

7. Compile the extension:
   ```bash
   npm run compile
   ```

8. Open in VS Code:
   ```bash
   code .
   ```

9. Press F5 to launch the Extension Development Host and test

### Packaging

To package the extension for distribution:

```bash
npm run vscode:prepublish
```

This will create a `.vsix` file that can be installed in VS Code.

## Architecture

The extension uses VS Code's [Custom Editors API](https://code.visualstudio.com/api/extension-guides/custom-editors):

- **Extension Host**: Manages document lifecycle, file I/O, and dirty state
- **Webview**: Hosts the React-based Casual Docs editor
- **Message Bridge**: Uses `acquireVsCodeApi()` for bidirectional communication

```
VS Code Workbench
  └─ Custom Editor Host
      └─ vscode-ext package
          ├─ CustomEditorProvider for *.docx
          ├─ DocxDocument model (bytes, URI, dirty state)
          └─ Webview lifecycle
              └─ React bundle
                  └─ <DocxEditor /> from @casualoffice/docs
```

## Message Protocol

The extension and webview communicate using the following messages:

| Message Type | Direction | Description |
|-------------|-----------|-------------|
| `init` | Extension → Webview | Initialize with document data |
| `ready` | Webview → Extension | Webview is ready to receive data |
| `change` | Webview → Extension | Document has unsaved changes |
| `save` | Webview → Extension | Request to save document |
| `error` | Either | Report an error |
| `getDocument` | Extension → Webview | Request current document bytes |
| `setDocument` | Extension → Webview | Set document bytes (e.g., on revert) |

## Development

### Building the webview

The webview uses Vite for bundling. To build:

```bash
cd webview
npm run build
```

This outputs to `webview/dist/` which is loaded by the extension.

### Debugging

1. Open the extension folder in VS Code
2. Press F5 to launch the Extension Development Host
3. Open a `.docx` file to test the editor
4. Use the VS Code debugger to set breakpoints in `src/extension.ts`

### Testing

Create a test `.docx` file and open it in the Extension Development Host. The editor should:

- Load the document
- Display it with proper formatting
- Track dirty state when edited
- Save changes on Ctrl+S
- Prompt before closing with unsaved changes

## Configuration

The extension currently has minimal configuration. Future options may include:

- Default zoom level
- Theme settings
- Toolbar visibility
- Auto-save behavior

### Hermes chat

The extension also contributes a VS Code chat participant named `@hermes`.

- Type `@hermes` in the VS Code Chat panel to talk to the local Hermes CLI.
- Use `/reset` inside the participant to clear saved chat history.
- If the Hermes command is not on your PATH, set `docxEditor.hermes.command` in VS Code settings to the full executable path.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## Related Projects

- [Casual Docs](https://github.com/CasualOffice/docs) - The web-based DOCX editor this extension uses
- [EigenPal DOCX Editor](https://github.com/eigenpal/docx-editor) - The upstream editor component
- [VS Code Custom Editors](https://code.visualstudio.com/api/extension-guides/custom-editors) - Official VS Code documentation
