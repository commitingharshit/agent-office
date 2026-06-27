/**
 * Simple imperative API for rendering a DOCX editor into a DOM element.
 *
 * Returns an `EditorHandle` (from @eigenpal/docx-core) that works with
 * any framework implementation.
 *
 * Usage:
 * ```ts
 * import { renderAsync } from '@eigenpal/docx-js-editor';
 *
 * const editor = await renderAsync(docxBlob, document.getElementById('container'), {
 *   readOnly: false,
 *   showToolbar: true,
 * });
 *
 * // Save the edited document
 * const blob = await editor.save();
 *
 * // Clean up
 * editor.destroy();
 * ```
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocxEditor } from './components/DocxEditor';
/**
 * Render a DOCX editor into a container element.
 *
 * @param input - DOCX data as ArrayBuffer, Uint8Array, Blob, or File
 * @param container - DOM element to render into
 * @param options - Editor configuration (toolbar, readOnly, callbacks, etc.)
 * @returns A handle with save / destroy / getDocument methods
 */
export function renderAsync(input, container, options = {}) {
    return new Promise((resolve, reject) => {
        const ref = React.createRef();
        let root = null;
        try {
            root = createRoot(container);
        }
        catch (err) {
            reject(err);
            return;
        }
        const handle = {
            save: () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const buffer = yield ((_b = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.save()) !== null && _b !== void 0 ? _b : Promise.resolve(null));
                if (!buffer)
                    return null;
                return new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });
            }),
            getDocument: () => { var _a, _b; return (_b = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : null; },
            focus: () => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus(); },
            setZoom: (z) => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.setZoom(z); },
            scrollToParaId: (paraId) => { var _a, _b; return (_b = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollToParaId(paraId)) !== null && _b !== void 0 ? _b : false; },
            scrollToPosition: (pmPos) => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollToPosition(pmPos); },
            destroy: () => {
                root === null || root === void 0 ? void 0 : root.unmount();
                root = null;
            },
        };
        // Track whether we've already resolved/rejected to avoid double-calling
        let settled = false;
        const element = React.createElement(DocxEditor, Object.assign(Object.assign({}, options), { documentBuffer: input, onError: (error) => {
                var _a;
                (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error);
                if (!settled) {
                    settled = true;
                    reject(error);
                }
            }, onChange: (doc) => {
                var _a;
                (_a = options.onChange) === null || _a === void 0 ? void 0 : _a.call(options, doc);
                // First onChange means the document parsed and rendered successfully
                if (!settled) {
                    settled = true;
                    resolve(handle);
                }
            }, ref }));
        root.render(element);
    });
}
//# sourceMappingURL=renderAsync.js.map