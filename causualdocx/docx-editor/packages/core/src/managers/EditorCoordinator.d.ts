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
import type { Document } from '../types/document';
/** Editor loading state */
export type EditorLoadingState = 'idle' | 'parsing' | 'loading-fonts' | 'ready' | 'error';
/** Configuration for EditorCoordinator */
export interface EditorCoordinatorOptions {
    /** Initial zoom level (default: 1.0) */
    initialZoom?: number;
    /** Callback when the document changes */
    onChange?: (document: Document) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
}
/** The full snapshot exposed to UI frameworks */
export interface EditorCoordinatorSnapshot {
    /** Current loading state */
    loadingState: EditorLoadingState;
    /** Error message if loadingState is 'error' */
    parseError: string | null;
    /** Whether the editor is ready for interaction */
    isReady: boolean;
    /** Current zoom level (1.0 = 100%) */
    zoom: number;
    /** Whether fonts have been loaded */
    fontsLoaded: boolean;
    /** Version counter */
    version: number;
}
export declare class EditorCoordinator extends Subscribable<EditorCoordinatorSnapshot> {
    private _loadingState;
    private _parseError;
    private _zoom;
    private _fontsLoaded;
    private _document;
    private _version;
    private onChangeCallback?;
    private onErrorCallback?;
    constructor(options?: EditorCoordinatorOptions);
    /** Signal that document parsing has started. */
    setParsingStarted(): void;
    /** Signal that document parsing completed successfully. */
    setDocumentLoaded(document: Document): void;
    /** Signal that font loading completed. */
    setFontsLoaded(): void;
    /** Signal that an error occurred during loading. */
    setLoadError(error: Error): void;
    /** Get the current document. */
    getDocument(): Document | null;
    /** Update the document (after edits). */
    updateDocument(document: Document): void;
    /** Set the zoom level (1.0 = 100%). */
    setZoom(zoom: number): void;
    /** Get the current zoom level. */
    getZoom(): number;
    private emitSnapshot;
}
//# sourceMappingURL=EditorCoordinator.d.ts.map