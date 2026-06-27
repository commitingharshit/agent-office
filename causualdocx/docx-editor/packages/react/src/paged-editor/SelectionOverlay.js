import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Selection Overlay Component
 *
 * Renders the selection overlay for the paged editor, including:
 * - Caret cursor (blinking vertical line for collapsed selection)
 * - Selection highlights (blue rectangles for range selection)
 *
 * The overlay is positioned absolutely over the pages container and
 * renders selection rectangles in container-relative coordinates.
 */
import { useEffect, useState, useRef } from 'react';
// =============================================================================
// CONSTANTS
// =============================================================================
const DEFAULT_CARET_COLOR = '#000';
const DEFAULT_SELECTION_COLOR = 'rgba(66, 133, 244, 0.3)'; // Google Docs style blue
const DEFAULT_CARET_WIDTH = 2;
const DEFAULT_BLINK_INTERVAL = 530; // Standard cursor blink rate
// =============================================================================
// STYLES
// =============================================================================
const overlayStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 10,
    overflow: 'hidden',
};
const caretStyles = (caret, color, width, visible) => ({
    position: 'absolute',
    left: caret.x,
    top: caret.y,
    width: width,
    height: caret.height,
    backgroundColor: color,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.05s ease-out',
    pointerEvents: 'none',
});
const selectionRectStyles = (rect, color) => ({
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    backgroundColor: color,
    pointerEvents: 'none',
});
// =============================================================================
// COMPONENT
// =============================================================================
/**
 * Caret component with blinking animation.
 */
const Caret = ({ position, color, width, blinkInterval, isFocused }) => {
    const [visible, setVisible] = useState(isFocused);
    const blinkTimerRef = useRef(null);
    useEffect(() => {
        // Clear any existing timer
        if (blinkTimerRef.current) {
            window.clearInterval(blinkTimerRef.current);
            blinkTimerRef.current = null;
        }
        // Only blink when focused and interval is set
        if (isFocused && blinkInterval > 0) {
            setVisible(true);
            blinkTimerRef.current = window.setInterval(() => {
                setVisible((v) => !v);
            }, blinkInterval);
        }
        else {
            // Hide caret when not focused
            setVisible(false);
        }
        return () => {
            if (blinkTimerRef.current) {
                window.clearInterval(blinkTimerRef.current);
            }
        };
    }, [isFocused, blinkInterval]);
    // Reset blink cycle when position changes (show immediately after typing/navigation)
    useEffect(() => {
        if (!isFocused)
            return;
        setVisible(true);
        // Restart blink timer from this moment
        if (blinkTimerRef.current) {
            window.clearInterval(blinkTimerRef.current);
        }
        if (blinkInterval > 0) {
            blinkTimerRef.current = window.setInterval(() => {
                setVisible((v) => !v);
            }, blinkInterval);
        }
        return () => {
            if (blinkTimerRef.current) {
                window.clearInterval(blinkTimerRef.current);
            }
        };
    }, [position.x, position.y, isFocused, blinkInterval]);
    return _jsx("div", { style: caretStyles(position, color, width, visible), "data-testid": "caret" });
};
/**
 * Selection rectangle component.
 */
const SelectionRectangle = ({ rect, color, index }) => {
    return (_jsx("div", { style: selectionRectStyles(rect, color), "data-testid": `selection-rect-${index}`, "data-page-index": rect.pageIndex }));
};
/**
 * Selection overlay component.
 *
 * Renders selection highlights and caret cursor over the paginated document.
 * Should be positioned as a child of the pages container with relative positioning.
 */
export const SelectionOverlay = ({ selectionRects, caretPosition, isFocused, readOnly = false, caretColor = DEFAULT_CARET_COLOR, selectionColor = DEFAULT_SELECTION_COLOR, caretWidth = DEFAULT_CARET_WIDTH, blinkInterval = DEFAULT_BLINK_INTERVAL, }) => {
    if (readOnly) {
        return null;
    }
    // Determine if we have a range selection or collapsed selection
    const hasRangeSelection = selectionRects.length > 0;
    const hasCollapsedSelection = caretPosition !== null && !hasRangeSelection;
    return (_jsxs("div", { style: overlayStyles, "data-testid": "selection-overlay", children: [hasRangeSelection &&
                selectionRects.map((rect, index) => (_jsx(SelectionRectangle, { rect: rect, color: selectionColor, index: index }, `sel-${rect.pageIndex}-${rect.x}-${rect.y}-${index}`))), hasCollapsedSelection && caretPosition && (_jsx(Caret, { position: caretPosition, color: caretColor, width: caretWidth, blinkInterval: blinkInterval, isFocused: isFocused }))] }));
};
let layoutBridge = null;
const layoutBridgePromise = import('@eigenpal/docx-core/layout-bridge').then((mod) => (layoutBridge = mod));
/**
 * Hook to manage selection overlay state.
 *
 * @param pmSelection - ProseMirror selection {from, to}.
 * @param layout - Document layout.
 * @param blocks - Flow blocks.
 * @param measures - Measurements.
 * @returns Selection overlay props.
 */
export function useSelectionOverlay(pmSelection, layout, blocks, measures) {
    const [selectionRects, setSelectionRects] = useState([]);
    const [caretPosition, setCaretPosition] = useState(null);
    useEffect(() => {
        if (!layout || !pmSelection) {
            setSelectionRects([]);
            setCaretPosition(null);
            return;
        }
        const apply = ({ selectionToRects, getCaretPosition }) => {
            const { from, to } = pmSelection;
            if (from === to) {
                // Collapsed selection - show caret
                const caret = getCaretPosition(layout, blocks, measures, from);
                setCaretPosition(caret);
                setSelectionRects([]);
            }
            else {
                // Range selection - show highlight
                const rects = selectionToRects(layout, blocks, measures, from, to);
                setSelectionRects(rects);
                setCaretPosition(null);
            }
        };
        // Module already warm → compute synchronously, no per-selection frame lag.
        if (layoutBridge) {
            apply(layoutBridge);
            return;
        }
        // First selection before the chunk finished loading → fall back to async,
        // guarding against the effect being torn down before it resolves.
        let cancelled = false;
        layoutBridgePromise.then((mod) => {
            if (!cancelled)
                apply(mod);
        });
        return () => {
            cancelled = true;
        };
    }, [pmSelection, layout, blocks, measures]);
    return { selectionRects, caretPosition };
}
export default SelectionOverlay;
//# sourceMappingURL=SelectionOverlay.js.map