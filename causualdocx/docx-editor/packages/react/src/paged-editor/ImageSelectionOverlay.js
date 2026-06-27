import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ImageSelectionOverlay Component
 *
 * Renders a selection overlay with resize handles over a selected image
 * in the visible pages. Handles:
 * - Blue selection border
 * - 4 corner resize handles
 * - Drag-to-resize with aspect ratio lock
 * - Dimension tooltip during resize
 */
import { useState, useRef, useCallback, useEffect } from 'react';
// =============================================================================
// STYLES
// =============================================================================
const HANDLE_SIZE = 10;
const HANDLE_HALF = HANDLE_SIZE / 2;
const BORDER_WIDTH = 2;
const ACCENT_COLOR = '#2563eb'; // Blue-600
const overlayStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 15,
    overflow: 'visible',
};
const borderStyles = {
    position: 'absolute',
    border: `${BORDER_WIDTH}px solid ${ACCENT_COLOR}`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
};
const handleBaseStyles = {
    position: 'absolute',
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    backgroundColor: ACCENT_COLOR,
    border: '1px solid white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    zIndex: 16,
};
const dimensionStyles = {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    fontSize: '11px',
    fontFamily: 'system-ui, sans-serif',
    padding: '2px 8px',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 20,
    transform: 'translateX(-50%)',
};
const HANDLE_CURSORS = {
    nw: 'nw-resize',
    ne: 'ne-resize',
    se: 'se-resize',
    sw: 'sw-resize',
};
// =============================================================================
// RESIZE CALCULATION
// =============================================================================
function calculateNewDimensions(handle, deltaX, deltaY, startWidth, startHeight, lockAspect) {
    const signX = handle.includes('w') ? -1 : 1;
    const signY = handle.includes('n') ? -1 : 1;
    let newWidth = startWidth + deltaX * signX;
    let newHeight = startHeight + deltaY * signY;
    if (lockAspect) {
        const scale = Math.max(newWidth / startWidth, newHeight / startHeight);
        newWidth = startWidth * scale;
        newHeight = startHeight * scale;
    }
    return {
        width: Math.max(20, Math.min(2000, newWidth)),
        height: Math.max(20, Math.min(2000, newHeight)),
    };
}
// =============================================================================
// COMPONENT
// =============================================================================
export function ImageSelectionOverlay({ imageInfo, zoom, panelOpen, reanchorTick, isFocused, onResize, onResizeStart, onResizeEnd, onDragMove, onDragStart, onDragEnd, onContextMenu, onOpenProperties, }) {
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeWidth, setResizeWidth] = useState(0);
    const [resizeHeight, setResizeHeight] = useState(0);
    const [overlayRect, setOverlayRect] = useState(null);
    const rafRef = useRef(null);
    const overlayRef = useRef(null);
    // Store callbacks in refs so imperative handlers always have latest values
    const onResizeRef = useRef(onResize);
    const onResizeStartRef = useRef(onResizeStart);
    const onResizeEndRef = useRef(onResizeEnd);
    const onDragMoveRef = useRef(onDragMove);
    const onDragStartRef = useRef(onDragStart);
    const onDragEndRef = useRef(onDragEnd);
    onResizeRef.current = onResize;
    onResizeStartRef.current = onResizeStart;
    onResizeEndRef.current = onResizeEnd;
    onDragMoveRef.current = onDragMove;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
    // Store imageInfo and zoom in refs for the imperative mousemove/mouseup handlers
    const imageInfoRef = useRef(imageInfo);
    const zoomRef = useRef(zoom);
    imageInfoRef.current = imageInfo;
    zoomRef.current = zoom;
    // Update overlay position when imageInfo or layout changes
    const updatePosition = useCallback(() => {
        if (!imageInfo || !overlayRef.current) {
            setOverlayRect(null);
            return;
        }
        // Use the overlay's own offsetParent (the viewport div) for correct coordinates
        const parent = overlayRef.current.offsetParent;
        if (!parent) {
            setOverlayRect(null);
            return;
        }
        const parentRect = parent.getBoundingClientRect();
        const imageRect = imageInfo.element.getBoundingClientRect();
        // Calculate position relative to the overlay's positioning parent
        setOverlayRect({
            left: (imageRect.left - parentRect.left) / zoom,
            top: (imageRect.top - parentRect.top) / zoom,
            width: imageRect.width / zoom,
            height: imageRect.height / zoom,
        });
    }, [imageInfo, zoom]);
    // Update position on mount and when dependencies change
    useEffect(() => {
        updatePosition();
    }, [updatePosition]);
    // Opening/closing a right panel shifts the page via a CSS transform with a
    // ~0.2s transition. No scroll/resize event fires, so without this the blue
    // box detached from the image until the panel was toggled again. Track the
    // image through the whole transition with a short rAF loop so the box glides
    // with it and lands aligned.
    useEffect(() => {
        if (!imageInfo)
            return;
        let raf = 0;
        const start = performance.now();
        const tick = () => {
            updatePosition();
            if (performance.now() - start < 320)
                raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [panelOpen, reanchorTick, imageInfo, updatePosition]);
    // Also update on scroll/resize
    useEffect(() => {
        var _a, _b, _c;
        if (!imageInfo)
            return;
        const container = (_b = (_a = overlayRef.current) === null || _a === void 0 ? void 0 : _a.closest('[style*="overflow"]')) !== null && _b !== void 0 ? _b : (_c = overlayRef.current) === null || _c === void 0 ? void 0 : _c.closest('.paged-editor__container');
        if (!container)
            return;
        const handleScrollOrResize = () => {
            if (rafRef.current)
                cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updatePosition);
        };
        container.addEventListener('scroll', handleScrollOrResize, { passive: true });
        window.addEventListener('resize', handleScrollOrResize, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScrollOrResize);
            window.removeEventListener('resize', handleScrollOrResize);
            if (rafRef.current)
                cancelAnimationFrame(rafRef.current);
        };
    }, [imageInfo, updatePosition]);
    // Handle resize start - registers window listeners IMMEDIATELY (not via useEffect)
    // This is critical because browser automation and fast interactions fire
    // mousedown/mousemove/mouseup synchronously before React can re-render.
    const handleResizeStart = useCallback((handle, e) => {
        var _a;
        if (!imageInfo || !overlayRect)
            return;
        e.preventDefault();
        e.stopPropagation();
        const startWidth = overlayRect.width;
        const startHeight = overlayRect.height;
        const startX = e.clientX;
        const startY = e.clientY;
        // Track final dimensions in local variables (no stale closure issues)
        let finalWidth = Math.round(startWidth);
        let finalHeight = Math.round(startHeight);
        setIsResizing(true);
        setResizeWidth(finalWidth);
        setResizeHeight(finalHeight);
        (_a = onResizeStartRef.current) === null || _a === void 0 ? void 0 : _a.call(onResizeStartRef);
        const handleMouseMove = (moveEvent) => {
            const currentZoom = zoomRef.current;
            const deltaX = (moveEvent.clientX - startX) / currentZoom;
            const deltaY = (moveEvent.clientY - startY) / currentZoom;
            const lockAspect = !moveEvent.shiftKey;
            const dims = calculateNewDimensions(handle, deltaX, deltaY, startWidth, startHeight, lockAspect);
            finalWidth = Math.round(dims.width);
            finalHeight = Math.round(dims.height);
            setResizeWidth(finalWidth);
            setResizeHeight(finalHeight);
            // Update overlay rect for live preview
            setOverlayRect((prev) => {
                if (!prev)
                    return prev;
                const newRect = Object.assign({}, prev);
                if (handle.includes('w')) {
                    newRect.left = prev.left + (prev.width - dims.width);
                }
                if (handle.includes('n')) {
                    newRect.top = prev.top + (prev.height - dims.height);
                }
                newRect.width = dims.width;
                newRect.height = dims.height;
                return newRect;
            });
        };
        const handleMouseUp = () => {
            var _a, _b;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            setIsResizing(false);
            // Use the locally tracked final dimensions (always up to date)
            const info = imageInfoRef.current;
            if (info) {
                (_a = onResizeRef.current) === null || _a === void 0 ? void 0 : _a.call(onResizeRef, info.pmPos, finalWidth, finalHeight);
            }
            (_b = onResizeEndRef.current) === null || _b === void 0 ? void 0 : _b.call(onResizeEndRef);
        };
        // Register listeners IMMEDIATELY - not in a useEffect
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [imageInfo, overlayRect]);
    // Handle drag-to-move: mousedown on image body (not a handle) starts a move drag
    const handleBodyMouseDown = useCallback((e) => {
        if (!imageInfo || !overlayRect)
            return;
        e.preventDefault();
        e.stopPropagation();
        const DRAG_THRESHOLD = 4; // px before considering it a drag
        const startX = e.clientX;
        const startY = e.clientY;
        // Where inside the image the pointer grabbed, from the image's top-left.
        // The draggable body div exactly overlays the painted image, so its rect
        // is the image's on-screen box. Preserving this offset keeps the grabbed
        // point under the cursor for the whole drag (Google-Docs behaviour).
        const bodyRect = e.currentTarget.getBoundingClientRect();
        const grabOffsetX = startX - bodyRect.left;
        const grabOffsetY = startY - bodyRect.top;
        let dragStarted = false;
        let ghostEl = null;
        const handleMouseMove = (moveEvent) => {
            var _a;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            if (!dragStarted && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
                return; // Haven't moved enough to start dragging
            }
            if (!dragStarted) {
                dragStarted = true;
                setIsDragging(true);
                (_a = onDragStartRef.current) === null || _a === void 0 ? void 0 : _a.call(onDragStartRef);
                // Create ghost element
                ghostEl = document.createElement('div');
                ghostEl.style.cssText =
                    'position: fixed; pointer-events: none; z-index: 10000; ' +
                        'opacity: 0.5; border: 2px dashed #2563eb; border-radius: 4px; ' +
                        'background: rgba(37, 99, 235, 0.1);';
                ghostEl.style.width = `${overlayRect.width}px`;
                ghostEl.style.height = `${overlayRect.height}px`;
                document.body.appendChild(ghostEl);
            }
            if (ghostEl) {
                // Track the grabbed point, not the image centre, so the ghost sits
                // exactly where the image will land on drop.
                ghostEl.style.left = `${moveEvent.clientX - grabOffsetX}px`;
                ghostEl.style.top = `${moveEvent.clientY - grabOffsetY}px`;
            }
        };
        const handleMouseUp = (upEvent) => {
            var _a, _b;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (ghostEl) {
                ghostEl.remove();
                ghostEl = null;
            }
            setIsDragging(false);
            if (dragStarted) {
                const info = imageInfoRef.current;
                if (info) {
                    (_a = onDragMoveRef.current) === null || _a === void 0 ? void 0 : _a.call(onDragMoveRef, info.pmPos, upEvent.clientX, upEvent.clientY, grabOffsetX, grabOffsetY);
                }
                (_b = onDragEndRef.current) === null || _b === void 0 ? void 0 : _b.call(onDragEndRef);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [imageInfo, overlayRect]);
    // Always render the container div so the ref is available for position calculation.
    // Use visibility:hidden when not active (keeps offsetParent accessible).
    const showOverlay = !!(imageInfo && overlayRect && isFocused);
    if (!showOverlay) {
        return (_jsx("div", { ref: overlayRef, style: Object.assign(Object.assign({}, overlayStyles), { visibility: 'hidden' }), className: "image-selection-overlay" }));
    }
    const { left, top, width, height } = overlayRect;
    return (_jsxs("div", { ref: overlayRef, style: overlayStyles, className: "image-selection-overlay", children: [_jsx("div", { style: Object.assign(Object.assign({}, borderStyles), { left: left - BORDER_WIDTH, top: top - BORDER_WIDTH, width: width + BORDER_WIDTH * 2, height: height + BORDER_WIDTH * 2 }) }), _jsx("div", { style: {
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    pointerEvents: 'auto',
                    zIndex: 15,
                }, onMouseDown: handleBodyMouseDown, onContextMenu: onContextMenu }), _jsx(Handle, { handle: "nw", style: { left: left - HANDLE_HALF, top: top - HANDLE_HALF }, onMouseDown: handleResizeStart }), _jsx(Handle, { handle: "ne", style: { left: left + width - HANDLE_HALF, top: top - HANDLE_HALF }, onMouseDown: handleResizeStart }), _jsx(Handle, { handle: "se", style: { left: left + width - HANDLE_HALF, top: top + height - HANDLE_HALF }, onMouseDown: handleResizeStart }), _jsx(Handle, { handle: "sw", style: { left: left - HANDLE_HALF, top: top + height - HANDLE_HALF }, onMouseDown: handleResizeStart }), onOpenProperties && !isResizing && !isDragging && (_jsxs("button", { type: "button", "data-testid": "image-format-chip", "aria-label": "Format image", title: "Format", onMouseDown: (e) => {
                    // Don't let the mousedown reach the image body (would start a drag)
                    // or the hidden PM view (would move the caret).
                    e.preventDefault();
                    e.stopPropagation();
                }, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenProperties();
                }, style: {
                    position: 'absolute',
                    left: left + width - 4,
                    top: top - 14,
                    transform: 'translateX(-100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 26,
                    padding: '0 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: '26px',
                    color: '#fff',
                    background: ACCENT_COLOR,
                    border: 'none',
                    borderRadius: 13,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 21,
                    whiteSpace: 'nowrap',
                }, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" }) }), "Format"] })), isResizing && (_jsxs("div", { style: Object.assign(Object.assign({}, dimensionStyles), { left: left + width / 2, top: top + height + 12 }), children: [resizeWidth, " \u00D7 ", resizeHeight] }))] }));
}
function Handle({ handle, style, onMouseDown }) {
    return (_jsx("div", { style: Object.assign(Object.assign(Object.assign({}, handleBaseStyles), style), { cursor: HANDLE_CURSORS[handle] }), onMouseDown: (e) => onMouseDown(handle, e), "data-handle": handle }));
}
export default ImageSelectionOverlay;
//# sourceMappingURL=ImageSelectionOverlay.js.map