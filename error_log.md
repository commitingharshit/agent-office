# VS Code Extension Build Error Log

This log details the TypeScript compilation errors encountered when building the VS Code DOCX Editor extension (`docx-editor-vscode`) and the corresponding fixes implemented.

## 1. TS6059: File is not under 'rootDir'

### Error Description
```
error TS6059: File '/home/harshit/coding/agent-office/causualdocx/docx-editor/packages/core/src/docx/serializer/documentSerializer.ts' is not under 'rootDir' '/home/harshit/coding/agent-office/causualdocx/docx-editor/apps/vscode-ext'. 'rootDir' is expected to contain all source files.
```
This error occurred because the extension imports files from local packages (e.g., `@casualoffice/docs` and `@eigenpal/docx-core`) located in the `packages/` directory, which lay outside the VS Code extension's defined `rootDir` (`.`).

### Solution
Modified `tsconfig.json` to change the `rootDir` from `.` to `../..` (the monorepo root). This expands the compiler's scope to include both `apps/vscode-ext` and `packages/` source files.
```json
"rootDir": "../.."
```

---

## 2. TS17004: Cannot use JSX unless the '--jsx' flag is provided

### Error Description
```
webview/src/main.tsx(147,7): error TS17004: Cannot use JSX unless the '--jsx' flag is provided.
```
The compiler encountered JSX syntax in the webview source files but had no JSX compilation rule configured.

### Solution
Added `"jsx": "react-jsx"` to the compiler options in `tsconfig.json` to enable the modern React 17+ automatic JSX transform.
```json
"jsx": "react-jsx"
```

---

## 3. TS2488: Type 'NodeListOf<...>' must have a '[Symbol.iterator]()' method

### Error Description
```
../../packages/core/src/prosemirror/extensions/features/PasteStyleInlinerExtension.ts(75,25): error TS2488: Type 'NodeListOf<HTMLStyleElement>' must have a '[Symbol.iterator]()' method that returns an iterator.
```
The compiler did not recognize DOM collection objects (like `NodeListOf`) as iterable because the standard `dom` library typings were not configured with ES6+ iteration capabilities.

### Solution
Updated the `lib` option in `tsconfig.json` to target `es2017` and added the `dom.iterable` library.
```json
"lib": ["es2017", "dom", "dom.iterable"]
```

---

## 4. TS2786: 'DocxEditor' cannot be used as a JSX component (Dual React Types Conflict)

### Error Description
```
webview/src/main.tsx(186,8): error TS2786: 'DocxEditor' cannot be used as a JSX component.
  Its type 'ForwardRefExoticComponent<DocxEditorProps & RefAttributes<DocxEditorRef>>' is not a valid JSX element type.
  Type 'import(".../node_modules/.bun/@types+react@19.2.14/...").ReactNode' is not assignable to type 'React.ReactNode'.
    Type 'bigint' is not assignable to type 'ReactNode'.
```
This was caused by a version mismatch. The shared package `packages/react` uses React 19 types (which include `bigint` in `ReactNode`), whereas the VS Code extension webview had React 18 types installed in its local `node_modules`. Compiling the webview files under the extension's root TS config caused conflicts between these two versions of `@types/react`.

### Solution
1. Excluded `webview` from the root VS Code extension `tsconfig.json` since it is bundled separately by Vite using its own `webview/tsconfig.json`.
2. Changed the `exclude` and `include` rules in the root `tsconfig.json`:
```json
"exclude": ["node_modules", ".vscode-test", "out", "webview"],
"include": ["src/**/*"]
```

---

## 5. Webview TypeScript Compilation Errors (TS6059, TS2786, TS7016)

### Error Description
When building the webview (`webview/tsconfig.json`), three errors occurred:
1. **TS6059 (rootDir)**: Imported files from `@casualoffice/docs` lay outside the webview's default rootDir (`.`).
2. **TS2786 (React Type Conflict)**: The webview resolved `react` types to its local `@types/react` (v18), conflicting with `packages/react`'s React 19 types.
3. **TS7016 (Missing types for nspell)**: The compiler couldn't find types for the `nspell` library imported in `packages/react/src/lib/spellcheck/service.ts`.

### Solution
Updated `apps/vscode-ext/webview/tsconfig.json` to:
1. Change `rootDir` to `"../../.."` to encompass the monorepo root packages.
2. Override `react` and `react/jsx-runtime` paths to resolve directly to the root `@types/react` (v19) package, ensuring single-version alignment.
3. Explicitly include `packages/react/src/types/nspell.d.ts` (the ambient declarations file) in the `include` array so it is loaded.
```json
{
  "compilerOptions": {
    "rootDir": "../../..",
    "lib": ["es2017", "dom", "dom.iterable"],
    "paths": {
      "react": ["../../../node_modules/@types/react"],
      "react/jsx-runtime": ["../../../node_modules/@types/react/jsx-runtime"],
      "@casualoffice/docs": ["../../../packages/react/src/index.ts"]
    }
  },
  "include": ["src/**/*", "../../../packages/react/src/types/nspell.d.ts"]
}
```

---

## 6. Vite Web Worker Build Error (Rollup Code-Splitting)

### Error Description
```
[vite:worker-import-meta-url] Invalid value "iife" for option "output.format" - UMD and IIFE output formats are not supported for code-splitting builds.
file: /home/harshit/coding/agent-office/causualdocx/docx-editor/packages/react/src/lib/format-converter.js
```
Vite bundles web workers (such as `format-converter.worker.ts`) using the `iife` format by default. Because the worker's dependencies required code-splitting, Rollup threw an error stating that `iife` cannot support split chunks.

### Solution
Updated `apps/vscode-ext/webview/vite.config.ts` to configure the worker build format as `"es"` instead of the default `"iife"`:
```typescript
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src'),
  worker: {
    format: 'es',
  },
  // ...
});
```

---

---

## 7. Runtime Error: Cannot read properties of undefined (reading 'startsWith')

### Error Description
```
Unable to open 'Background Check.docx'
Cannot read properties of undefined (reading 'startsWith')
```
This error occurred at runtime when Code-OSS Dev invoked `openCustomDocument`. Depending on the environment state or Code-OSS version, `openContext` might be passed as `undefined` or have a non-string or `undefined` `backupId` property. The previous code did not safely guard against these cases, resulting in an unhandled exception when checking `openContext.backupId.startsWith()`.

### Solution
Modified `openCustomDocument` in `apps/vscode-ext/src/extension.ts` to perform a highly robust safety check before reading `backupId`:
```typescript
    let sourceUri = uri;
    if (openContext && typeof openContext.backupId === 'string') {
      sourceUri = openContext.backupId.startsWith('file:')
        ? vscode.Uri.parse(openContext.backupId)
        : vscode.Uri.file(openContext.backupId);
    }
```

---

## 8. Runtime Error: Fix Not Taking Effect (Stale Compiled Artifacts Caching)

### Error Description
Even after applying the safe `openContext.backupId` check in `src/extension.ts` and compiling the code, the `Cannot read properties of undefined (reading 'startsWith')` error persisted. 

### Cause
Due to the monorepo `rootDir` adjustments made earlier, the compilation output path shifted from `./out/extension.js` to `./out/apps/vscode-ext/src/extension.js`. However, old compiled files at `./out/src/extension.js` and `./out/webview/` remained in the `out/` folder from previous builds. If the Extension Development Host/Code-OSS cached or loaded the old `out/src/extension.js` entry point instead of the new one, the old buggy code would run, making the fix appear ineffective.

### Solution
Deleted the stale build folders (`out/src` and `out/webview`) entirely:
```bash
rm -rf apps/vscode-ext/out/src
rm -rf apps/vscode-ext/out/webview
```
Then, ran a clean compilation to ensure that only the correct modern entry point exists:
```bash
npm run compile
```

---

## 9. Unrelated Console/Terminal Errors in Code-OSS Dev Host

### Error Description
During the execution of the Code-OSS Dev Host, the following errors appear in the terminal logs:
1. **Uncaught exception in main:** `Error: Cannot find module '../build/Release/vscode-sqlite3.node'`
2. **Warn/Error logs:** `Timed out waiting for authentication provider 'github' to register.`

### Explanation & Resolution
* **SQLite3 Native Binding Error:** This is an internal Code-OSS workspace issue where native modules (`@vscode/sqlite3`) were not compiled/rebuilt for the specific version of Electron running the editor. It is entirely unrelated to the custom editor extension and does not affect its performance or runtime lifecycle.
* **Authentication Provider Timeout:** Code-OSS Dev tries to register default credentials providers (like GitHub auth). Since it is running in a local isolated test environment (`/tmp/codeoss-docx-dev`), these providers fail to register or time out. This is expected behavior for custom dev builds and can be safely ignored.

---

---

## 10. Real Root Cause of 'startsWith' Error — VS Code Internal Bug from Stale Webview State

### Error Description (from Developer Tools)
```
ERR TypeError: Cannot read properties of undefined (reading 'startsWith')
    at WebviewViewTypeTransformer.toExternal (mainThreadWebviewPanels.ts:74:19)
    at Object.canResolve (mainThreadWebviewPanels.ts:126:48)
    at canRevive (webviewWorkbenchService.ts:111:17)
    at WebviewEditorService.tryRevive (webviewWorkbenchService.ts:371:8)
    at WebviewEditorService.resolveWebview (webviewWorkbenchService.ts:380:32)
    at CustomEditorInput.resolve (customEditorInput.ts:327:15)
    at WebviewEditor.setInput (webviewEditor.ts:148:15)
```

### Cause
**This error is NOT in the extension code.** It is inside VS Code's own `mainThreadWebviewPanels.ts`. Code-OSS was trying to **revive a stale webview panel** from a previous session stored in `/tmp/codeoss-docx-dev` (the `--user-data-dir`). The stored workspace state contained a webview entry with an `undefined` viewType. VS Code's `WebviewViewTypeTransformer.toExternal()` then crashed calling `.startsWith()` on that `undefined` viewType at line 74.

### Solution
Delete the stale user-data directory entirely so Code-OSS starts fresh with no corrupted workspace state to revive:
```bash
rm -rf /tmp/codeoss-docx-dev
```

---

## 11. ENOSPC: System Limit for Number of File Watchers Reached

### Error Description
```
ERR [File Watcher (node.js)] Failed to watch /tmp/codeoss-docx-dev/User for changes using fs.watch()
(Error: ENOSPC: System limit for number of file watchers reached)

ERR [File Watcher ('parcel')] Inotify limit reached (ENOSPC) (path: /home/harshit/Downloads)
```

### Cause
Linux sets a hard cap on the number of `inotify` file watchers (default: ~8192). Running VS Code in a large monorepo alongside other apps (Firefox, Chromium, etc.) exhausts this quota quickly.

### Solution
Increase the system-wide inotify limit. Run once in a terminal:
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```
**Confirmed resolved:**
```
fs.inotify.max_user_watches=524288
fs.inotify.max_user_watches = 524288   ✅
```
This change persists across reboots.

---

## 13. Webview Blank / Not Rendering — CSP Blocked ES Module Dynamic Imports

### Error Description
After clearing the stale user-data dir and fixing all compile issues, the `.docx` file would open (no crash dialog) but the webview rendered **blank** — no editor content visible.

### Cause
The webview entry script (`main.js`) is loaded as `type="module"` and uses dynamic `import()` to lazily load chunked assets (`assets/*.js`, `assets/*.worker.js`). The Content-Security-Policy in `renderHtml` only allowed:
```
script-src 'nonce-${nonce}'
```
Dynamically imported chunks do **not** carry the nonce, so the browser silently blocked them. No JS error is shown — the page just stays blank.

### Solution
Updated the CSP in `renderHtml` inside `apps/vscode-ext/src/extension.ts` to also allow scripts from the webview's own trusted origin (`${cspSource}`) and web workers:

```diff
- script-src 'nonce-${nonce}';
+ script-src 'nonce-${nonce}' ${cspSource}; worker-src ${cspSource} blob:;
```

Then recompiled:
```bash
npm run compile   # EXIT: 0 ✅
```

---

## 12. Code-OSS Built-in Extensions Not Compiled (emmet, git-base, github-authentication, etc.)

### Error Description
```
Error: Activating extension 'vscode.github-authentication' failed:
  Cannot find module '/home/harshit/coding/agent-office/vscode/extensions/github-authentication/out/extension.js'

Error: Activating extension 'vscode.emmet' failed:
  Cannot find module '/home/harshit/coding/agent-office/vscode/extensions/emmet/out/node/emmetNodeMain'

Error: Activating extension 'vscode.git-base' failed:
  Cannot find module '/home/harshit/coding/agent-office/vscode/extensions/git-base/out/extension.js'
```
Also: `@vscode/spdlog` and `@vscode/sqlite3` native bindings missing.

### Cause
The local Code-OSS source repository at `/home/harshit/coding/agent-office/vscode` had never been compiled. All built-in extension TypeScript sources had no `out/` build artifacts.

### Solution
Run the full compile in the Code-OSS source root:
```bash
cd /home/harshit/coding/agent-office/vscode
npm run compile
```
**Result:** Completed successfully with 0 errors (all built-in extensions compiled including emmet, git, github-authentication, etc.).

> **Note:** The native `.node` bindings (`spdlog.node`, `sqlite3.node`) still need to be rebuilt separately with `npm run electron` or `node scripts/node-minify.js` from the vscode root. These are non-critical for the DOCX editor functionality.

---

## Verification
All compile pipelines exit with 0 errors:

**1. Webview Build:**
```bash
$ cd apps/vscode-ext/webview && npm run build
> docx-editor-webview@0.0.1 build
> tsc && vite build
✓ built in 7.66s   EXIT: 0
```

**2. DOCX Extension Compilation:**
```bash
$ cd apps/vscode-ext && npm run compile
> docx-editor-vscode@0.0.1 compile
> tsc -p ./   EXIT: 0
```

**3. Code-OSS Source Compilation:**
```bash
$ cd vscode && npm run compile
[compile-client] Finished compile-extension:emmet after 15773 ms
[compile-client] Finished compile-extension:git after 15747 ms
[compile-client] Finished compilation with 0 errors after 35840 ms
[compile-client] Finished 'compile' after 1.15 min   EXIT: 0
```

---

## 14. Uint8Array Serialization Mismatch through postMessage

### Error Description
When binary data was passed from the extension to the webview via `postMessage` as `Uint8Array`, the document failed to parse and rendered as a continuous loading state or blank editor with no visual feedback.

### Cause
VS Code's `postMessage` protocol uses JSON serialization/deserialization internally. In this process, a standard typed `Uint8Array` is converted into a plain object of the form `{0: val, 1: val, 2: val, ...}`. The webview received a plain object instead of a proper typed array, which was then passed directly into the ProseMirror editor engine, causing silent parser failures.

### Solution
1. In the extension (`extension.ts`), converted `Uint8Array` to a plain JSON-safe array before sending:
```typescript
documentBytes: Array.from(document.bytes) as unknown as Uint8Array
```
2. In the webview (`main.tsx`), reconstructed a new `Uint8Array` from the object values when received:
```typescript
new Uint8Array(Object.values(message.documentBytes as unknown as Record<string, number>))
```

---

## 15. Extension Fails to Activate / Blank Editor (Missing Publisher Manifest Field)

### Error Description
Even when the workspace compiled cleanly and the extension host launched without runtime binding crashes, the DOCX editor was completely blank and did not load even the static HTML fallback structure.

### Cause
The extension manifest (`package.json`) did not contain a `publisher` field. VS Code and Code-OSS require a valid `publisher` name. If the `publisher` field is missing, VS Code silently fails to load or recognize the extension entirely, meaning the custom editor provider is never registered.

### Solution
Added `"publisher": "casualoffice"` and changed `activationEvents` to `["*"]` to ensure the extension always boots cleanly when the custom editor path is matched.
```json
"publisher": "casualoffice",
"activationEvents": [
  "*"
]
```
Recompiled the extension and launched Code-OSS with a cleaned user data directory.

---

## 16. Webview UI Layout Broken / CSS Missing (Code-Split Chunks CSS)

### Error Description
The editor webview loaded and displayed contents but had no styling (e.g. toolbar was absolute/vertical, text was misplaced, styling layout was completely broken).

### Cause
Vite automatically code-splits CSS files, outputting a separate CSS file for chunks like the main editor component (`assets/index.css`) separate from the main entry script CSS (`assets/main.css`). The extension was only loading the CSS file associated with `main.tsx` (`main.css`), leaving out all components' styles.

### Solution
Modified `extension.ts` to collect and load every unique CSS file reference in the webview bundle manifest:
```typescript
    const cssFiles = new Set<string>();
    for (const key in manifest) {
      const entryObj = manifest[key];
      if (entryObj.css) {
        for (const cssFile of entryObj.css) {
          cssFiles.add(cssFile);
        }
      }
    }
    const cssUris = Array.from(cssFiles).map((cssFile) =>
      webview.asWebviewUri(vscode.Uri.joinPath(distRoot, cssFile))
    );
```

---

## 17. Unprocessed Tailwind Directives / Ribbon collapses vertically (Vite 8 CSS Transformer)

### Error Description
Even after injecting `assets/main.css` and `assets/index.css` correctly, the toolbar collapsed into a vertical stack and lost all styling (flex, alignment, gap, spacing).

### Cause
Vite 8 uses `lightningcss` as the default CSS transformer, which completely bypasses PostCSS. This meant the `@tailwind utilities;` directive inside `editor.css` was never expanded into Tailwind CSS utility classes, resulting in no flexbox or grid rules for the toolbar or ribbon. Furthermore, Tailwind needs absolute paths to find content templates because relative paths in the monorepo config don't resolve from the vscode extension subfolder context.

### Solution
Modified `apps/vscode-ext/webview/vite.config.ts` to explicitly configure the legacy `postcss` transformer and plug in `tailwindcss` and `autoprefixer` using absolute file matching patterns:
```typescript
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// ... inside defineConfig:
  css: {
    transformer: 'postcss',
    postcss: {
      plugins: [
        tailwindcss({
          config: path.join(monorepoRoot, 'tailwind.config.js'),
          content: {
            files: [
              path.join(monorepoRoot, 'packages/react/src/**/*.{ts,tsx}'),
              path.join(__dirname, 'src/**/*.{ts,tsx}'),
            ],
          },
          safelist: [{ pattern: /.*/ }],
        }),
        autoprefixer(),
      ],
    },
  },
```
Rebuilt the webview (`npm run build`) and compiled the extension.

---

## 18. Webview Keybindings Overlapping / Ctrl+S Save and Tab Navigation

### Error Description
Standard Code-OSS shortcuts (like `Ctrl+S`, `Ctrl+P`, `Ctrl+Shift+P`, `Ctrl+W`) were being captured or blocked by the browser webview context, preventing the user from saving, quick-opening, or closing the tab cleanly. Conversely, document shortcuts (like `Ctrl+Z`, `Ctrl+Y`, `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+F`) should be kept locally inside the document.

Furthermore, `Uint8Array` serialization was failing during save requests, which caused empty/corrupted files to be saved because the JSON serialization flattened the array to a plain object.

### Solution
1. **Shortcut Interception**: Registered a capturing keydown listener in `webview/src/main.tsx` to explicitly intercept and prevent default browser action for workspace-scoped keys, sending messages to the extension host instead:
   * `Ctrl+S` → `vscode.postMessage({ type: 'saveShortcut' })`
   * `Ctrl+P` → `vscode.postMessage({ type: 'triggerCommand', command: 'workbench.action.quickOpen' })`
   * `Ctrl+Shift+P` → `vscode.postMessage({ type: 'triggerCommand', command: 'workbench.action.showCommands' })`
   * `Ctrl+W` → `vscode.postMessage({ type: 'triggerCommand', command: 'workbench.action.closeActiveEditor' })`
2. **Extension Dispatcher**: Added listeners in `extension.ts` that execute the associated Code-OSS workspace commands using `vscode.commands.executeCommand`.
3. **Serialization Bridge**: Standardized the serialization of binary data using `Array.from` in the webview prior to transmission, combined with a robust deserialization helper `deserializeUint8Array` in the extension to safely reconstruct the `Uint8Array` under all environments.





