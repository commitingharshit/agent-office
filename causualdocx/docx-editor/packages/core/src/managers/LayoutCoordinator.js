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
// ============================================================================
// COORDINATOR
// ============================================================================
export class LayoutCoordinator extends Subscribable {
    constructor() {
        super({
            hasLayout: false,
            selectionRects: [],
            caretPosition: null,
            selectedImageInfo: null,
            isFocused: false,
            isDragging: false,
            isResizingColumn: false,
            isImageInteracting: false,
            version: 0,
        });
        // Layout pipeline state
        this._hasLayout = false;
        // Selection state
        this._selectionRects = [];
        this._caretPosition = null;
        // Drag state
        this._isDragging = false;
        this._dragAnchor = null;
        // Column resize state
        this._columnResize = {
            isResizing: false,
            startX: 0,
            columnIndex: 0,
            tablePmStart: 0,
            originalWidths: { left: 0, right: 0 },
        };
        // Image interaction state
        this._selectedImageInfo = null;
        this._isImageInteracting = false;
        // Focus state
        this._isFocused = false;
        // Version counter for fine-grained change tracking
        this._version = 0;
    }
    // --------------------------------------------------------------------------
    // LAYOUT PIPELINE
    // --------------------------------------------------------------------------
    /** Notify that layout has been computed. */
    setLayoutReady(hasLayout) {
        this._hasLayout = hasLayout;
        this.emitSnapshot();
    }
    // --------------------------------------------------------------------------
    // SELECTION STATE
    // --------------------------------------------------------------------------
    /** Update selection rectangles and caret position. */
    updateSelection(selectionRects, caretPosition) {
        this._selectionRects = selectionRects;
        this._caretPosition = caretPosition;
        this.emitSnapshot();
    }
    // --------------------------------------------------------------------------
    // DRAG SELECTION
    // --------------------------------------------------------------------------
    /** Start a drag selection from the given PM anchor position. */
    startDrag(anchor) {
        this._isDragging = true;
        this._dragAnchor = anchor;
        this.emitSnapshot();
    }
    /** End drag selection. */
    endDrag() {
        this._isDragging = false;
        this._dragAnchor = null;
        this.emitSnapshot();
    }
    /** Get the drag anchor position. */
    getDragAnchor() {
        return this._dragAnchor;
    }
    // --------------------------------------------------------------------------
    // COLUMN RESIZE
    // --------------------------------------------------------------------------
    /** Start resizing a table column. */
    startColumnResize(tablePmStart, columnIndex, startX, originalWidths) {
        this._columnResize = {
            isResizing: true,
            startX,
            columnIndex,
            tablePmStart,
            originalWidths,
        };
        this.emitSnapshot();
    }
    /** End column resize. */
    endColumnResize() {
        this._columnResize = Object.assign(Object.assign({}, this._columnResize), { isResizing: false });
        this.emitSnapshot();
    }
    /** Get current column resize state. */
    getColumnResize() {
        return this._columnResize;
    }
    // --------------------------------------------------------------------------
    // IMAGE INTERACTION
    // --------------------------------------------------------------------------
    /** Set the currently selected image. */
    setSelectedImage(imageInfo) {
        this._selectedImageInfo = imageInfo;
        this.emitSnapshot();
    }
    /** Clear the image selection. */
    clearSelectedImage() {
        this._selectedImageInfo = null;
        this._isImageInteracting = false;
        this.emitSnapshot();
    }
    /** Set whether an image interaction (resize/move) is in progress. */
    setImageInteracting(interacting) {
        this._isImageInteracting = interacting;
        this.emitSnapshot();
    }
    // --------------------------------------------------------------------------
    // FOCUS
    // --------------------------------------------------------------------------
    /** Update focus state. */
    setFocused(focused) {
        this._isFocused = focused;
        this.emitSnapshot();
    }
    // --------------------------------------------------------------------------
    // PRIVATE
    // --------------------------------------------------------------------------
    emitSnapshot() {
        this._version++;
        this.setSnapshot({
            hasLayout: this._hasLayout,
            selectionRects: this._selectionRects,
            caretPosition: this._caretPosition,
            selectedImageInfo: this._selectedImageInfo,
            isFocused: this._isFocused,
            isDragging: this._isDragging,
            isResizingColumn: this._columnResize.isResizing,
            isImageInteracting: this._isImageInteracting,
            version: this._version,
        });
    }
}
//# sourceMappingURL=LayoutCoordinator.js.map