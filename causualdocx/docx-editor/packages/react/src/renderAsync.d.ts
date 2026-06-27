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
import { type DocxEditorProps } from './components/DocxEditor';
import type { DocxInput } from '@eigenpal/docx-core/utils';
import type { EditorHandle } from '@eigenpal/docx-core';
/**
 * Options for {@link renderAsync}. A subset of DocxEditorProps minus
 * `documentBuffer` / `document` (passed as the first argument instead).
 */
export type RenderAsyncOptions = Omit<DocxEditorProps, 'documentBuffer' | 'document'>;
/**
 * React-specific handle that extends the framework-agnostic EditorHandle
 * with zoom control.
 */
export interface DocxEditorHandle extends EditorHandle {
    /** Set zoom level (1.0 = 100%). */
    setZoom: (zoom: number) => void;
    /** Scroll to a body paragraph by Word `w14:paraId`. */
    scrollToParaId: (paraId: string) => boolean;
    /** Scroll to a raw ProseMirror document position. */
    scrollToPosition: (pmPos: number) => void;
}
/**
 * Render a DOCX editor into a container element.
 *
 * @param input - DOCX data as ArrayBuffer, Uint8Array, Blob, or File
 * @param container - DOM element to render into
 * @param options - Editor configuration (toolbar, readOnly, callbacks, etc.)
 * @returns A handle with save / destroy / getDocument methods
 */
export declare function renderAsync(input: DocxInput, container: HTMLElement, options?: RenderAsyncOptions): Promise<DocxEditorHandle>;
//# sourceMappingURL=renderAsync.d.ts.map