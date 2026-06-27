/**
 * LayoutCoordinator
 *
 * Framework-agnostic class coordinating the PM state → layout engine →
 * layout painter → selection overlay pipeline.
 *
 * Extracted from PagedEditor.tsx. Manages:
 * - Layout pipeline state (blocks, measures, layout)
 * - Selection state (selectionRects, caretPosition)
 * - Drag selection state
 * - Column resize state
 * - Image interaction state
 *
 * Usage with React:
 * ```ts
 * const snapshot = useSyncExternalStore(coordinator.subscribe, coordinator.getSnapshot);
 * ```
 *
 * NOTE: This class defines the state shape and subscription pattern.
 * Full integration with PagedEditor is done incrementally.
 */
import { Subscribable } from './Subscribable';
/** Selection rectangle for rendering selection overlays */
export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
    pageIndex: number;
}
/** Caret position for rendering the blinking cursor */
export interface CaretPosition {
    x: number;
    y: number;
    height: number;
    pageIndex: number;
}
/** Info about the currently selected/hovered image */
export interface ImageSelectionInfo {
    pmPos: number;
    pageIndex: number;
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    widthEmu: number;
    heightEmu: number;
    isInline: boolean;
}
/** Column resize tracking state */
export interface ColumnResizeState {
    isResizing: boolean;
    startX: number;
    columnIndex: number;
    tablePmStart: number;
    originalWidths: {
        left: number;
        right: number;
    };
}
/** The full snapshot exposed to UI frameworks */
export interface LayoutCoordinatorSnapshot {
    /** Computed page layout, null until first computation */
    hasLayout: boolean;
    /** Selection rectangles for range selection overlay */
    selectionRects: SelectionRect[];
    /** Caret position for cursor overlay */
    caretPosition: CaretPosition | null;
    /** Currently selected/hovered image */
    selectedImageInfo: ImageSelectionInfo | null;
    /** Whether the editor is focused */
    isFocused: boolean;
    /** Whether a text drag is in progress */
    isDragging: boolean;
    /** Whether a column resize is in progress */
    isResizingColumn: boolean;
    /** Whether an image interaction is in progress */
    isImageInteracting: boolean;
    /** Version counter — incremented on every state change */
    version: number;
}
export declare class LayoutCoordinator extends Subscribable<LayoutCoordinatorSnapshot> {
    private _hasLayout;
    private _selectionRects;
    private _caretPosition;
    private _isDragging;
    private _dragAnchor;
    private _columnResize;
    private _selectedImageInfo;
    private _isImageInteracting;
    private _isFocused;
    private _version;
    constructor();
    /** Notify that layout has been computed. */
    setLayoutReady(hasLayout: boolean): void;
    /** Update selection rectangles and caret position. */
    updateSelection(selectionRects: SelectionRect[], caretPosition: CaretPosition | null): void;
    /** Start a drag selection from the given PM anchor position. */
    startDrag(anchor: number): void;
    /** End drag selection. */
    endDrag(): void;
    /** Get the drag anchor position. */
    getDragAnchor(): number | null;
    /** Start resizing a table column. */
    startColumnResize(tablePmStart: number, columnIndex: number, startX: number, originalWidths: {
        left: number;
        right: number;
    }): void;
    /** End column resize. */
    endColumnResize(): void;
    /** Get current column resize state. */
    getColumnResize(): ColumnResizeState;
    /** Set the currently selected image. */
    setSelectedImage(imageInfo: ImageSelectionInfo | null): void;
    /** Clear the image selection. */
    clearSelectedImage(): void;
    /** Set whether an image interaction (resize/move) is in progress. */
    setImageInteracting(interacting: boolean): void;
    /** Update focus state. */
    setFocused(focused: boolean): void;
    private emitSnapshot;
}
//# sourceMappingURL=LayoutCoordinator.d.ts.map