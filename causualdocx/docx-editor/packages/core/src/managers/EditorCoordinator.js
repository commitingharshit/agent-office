/**
 * EditorCoordinator
 *
 * Framework-agnostic class managing the document editor lifecycle:
 * - Document parsing and loading
 * - Font loading coordination
 * - Zoom level management
 * - Extension manager initialization
 * - Agent command execution
 *
 * Extracted from DocxEditor.tsx.
 *
 * Usage with React:
 * ```ts
 * const snapshot = useSyncExternalStore(coordinator.subscribe, coordinator.getSnapshot);
 * ```
 *
 * NOTE: This class defines the state shape and coordination logic.
 * Full integration with DocxEditor is done incrementally.
 */
import { Subscribable } from './Subscribable';
// ============================================================================
// COORDINATOR
// ============================================================================
export class EditorCoordinator extends Subscribable {
    constructor(options = {}) {
        var _a;
        const zoom = (_a = options.initialZoom) !== null && _a !== void 0 ? _a : 1.0;
        super({
            loadingState: 'idle',
            parseError: null,
            isReady: false,
            zoom,
            fontsLoaded: false,
            version: 0,
        });
        this._loadingState = 'idle';
        this._parseError = null;
        this._fontsLoaded = false;
        this._document = null;
        this._version = 0;
        this._zoom = zoom;
        this.onChangeCallback = options.onChange;
        this.onErrorCallback = options.onError;
    }
    // --------------------------------------------------------------------------
    // DOCUMENT LIFECYCLE
    // --------------------------------------------------------------------------
    /** Signal that document parsing has started. */
    setParsingStarted() {
        this._loadingState = 'parsing';
        this._parseError = null;
        this.emitSnapshot();
    }
    /** Signal that document parsing completed successfully. */
    setDocumentLoaded(document) {
        this._document = document;
        this._loadingState = 'loading-fonts';
        this._parseError = null;
        this.emitSnapshot();
    }
    /** Signal that font loading completed. */
    setFontsLoaded() {
        this._fontsLoaded = true;
        this._loadingState = 'ready';
        this.emitSnapshot();
    }
    /** Signal that an error occurred during loading. */
    setLoadError(error) {
        var _a;
        this._loadingState = 'error';
        this._parseError = error.message;
        (_a = this.onErrorCallback) === null || _a === void 0 ? void 0 : _a.call(this, error);
        this.emitSnapshot();
    }
    /** Get the current document. */
    getDocument() {
        return this._document;
    }
    /** Update the document (after edits). */
    updateDocument(document) {
        var _a;
        this._document = document;
        (_a = this.onChangeCallback) === null || _a === void 0 ? void 0 : _a.call(this, document);
        this.emitSnapshot();
    }
    // --------------------------------------------------------------------------
    // ZOOM
    // --------------------------------------------------------------------------
    /** Set the zoom level (1.0 = 100%). */
    setZoom(zoom) {
        this._zoom = Math.max(0.25, Math.min(4.0, zoom));
        this.emitSnapshot();
    }
    /** Get the current zoom level. */
    getZoom() {
        return this._zoom;
    }
    // --------------------------------------------------------------------------
    // PRIVATE
    // --------------------------------------------------------------------------
    emitSnapshot() {
        this._version++;
        this.setSnapshot({
            loadingState: this._loadingState,
            parseError: this._parseError,
            isReady: this._loadingState === 'ready',
            zoom: this._zoom,
            fontsLoaded: this._fontsLoaded,
            version: this._version,
        });
    }
}
//# sourceMappingURL=EditorCoordinator.js.map