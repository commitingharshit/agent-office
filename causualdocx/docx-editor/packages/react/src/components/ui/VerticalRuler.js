import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * VerticalRuler Component
 *
 * A vertical ruler that displays alongside the document with:
 * - Page height scale with tick marks
 * - Top and bottom margin indicators
 * - Optional dragging to adjust margins
 * - Support for zoom levels
 *
 * Similar to Google Docs' vertical ruler.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { twipsToPixels, pixelsToTwips, formatPx } from '@eigenpal/docx-core/utils';
import { useTranslation } from '../../i18n';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_PAGE_HEIGHT_TWIPS = 15840; // 11 inches
const DEFAULT_MARGIN_TWIPS = 1440; // 1 inch
const TWIPS_PER_INCH = 1440;
const TWIPS_PER_CM = 567;
// Ruler styling - Google Docs style
const RULER_WIDTH = 20;
const RULER_TEXT_COLOR = 'var(--doc-text-muted)';
const RULER_TICK_COLOR = 'var(--doc-text-subtle)';
const MARKER_COLOR = 'var(--doc-primary)';
const MARKER_HOVER_COLOR = 'var(--doc-primary)';
const MARKER_ACTIVE_COLOR = 'var(--doc-primary-hover)';
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function VerticalRuler({ sectionProps, zoom = 1, editable = false, onTopMarginChange, onBottomMarginChange, unit = 'inch', onDragStateChange, className = '', style, }) {
    var _a, _b, _c;
    const { t } = useTranslation();
    const [dragging, setDragging] = useState(null);
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const rulerRef = useRef(null);
    // Anchor captured at drag-start. The new margin is computed as
    // `startMargin + (pointer delta in twips)` against this fixed anchor, so
    // re-laying the page mid-drag can't shift the reference and make the marker
    // oscillate. `marker` is stored here (not read from React state) so the
    // mousemove handler can stay referentially stable — see handleDrag.
    const dragAnchorRef = useRef(null);
    // Get page dimensions
    const pageHeightTwips = (_a = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.pageHeight) !== null && _a !== void 0 ? _a : DEFAULT_PAGE_HEIGHT_TWIPS;
    const topMarginTwips = (_b = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginTop) !== null && _b !== void 0 ? _b : DEFAULT_MARGIN_TWIPS;
    const bottomMarginTwips = (_c = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginBottom) !== null && _c !== void 0 ? _c : DEFAULT_MARGIN_TWIPS;
    // Convert to pixels with zoom
    const pageHeightPx = twipsToPixels(pageHeightTwips) * zoom;
    const topMarginPx = twipsToPixels(topMarginTwips) * zoom;
    const bottomMarginPx = twipsToPixels(bottomMarginTwips) * zoom;
    // Live values the mousemove handler needs, mirrored into a ref so handleDrag
    // can be referentially STABLE (empty deps). If handleDrag depended on the
    // live margins, it would be recreated on every drag step and the useEffect
    // would remove+re-add the mousemove listener every frame — dropping events
    // and making the marker jitter/"shake".
    const liveRef = useRef({
        zoom,
        pageHeightTwips,
        topMarginTwips,
        bottomMarginTwips,
        onTopMarginChange,
        onBottomMarginChange,
    });
    liveRef.current = {
        zoom,
        pageHeightTwips,
        topMarginTwips,
        bottomMarginTwips,
        onTopMarginChange,
        onBottomMarginChange,
    };
    // Handle drag start
    const handleDragStart = useCallback((e, marker) => {
        if (!editable)
            return;
        e.preventDefault();
        dragAnchorRef.current = {
            marker,
            startClientY: e.clientY,
            startTopMarginTwips: topMarginTwips,
            startBottomMarginTwips: bottomMarginTwips,
        };
        setDragging(marker);
        onDragStateChange === null || onDragStateChange === void 0 ? void 0 : onDragStateChange(true);
    }, [editable, topMarginTwips, bottomMarginTwips, onDragStateChange]);
    // Handle drag. Referentially stable (reads everything from refs) so the
    // mousemove listener is attached exactly once per drag.
    const handleDrag = useCallback((e) => {
        const anchor = dragAnchorRef.current;
        if (!anchor)
            return;
        const { zoom, pageHeightTwips, topMarginTwips, bottomMarginTwips, onTopMarginChange, onBottomMarginChange, } = liveRef.current;
        // Pointer delta only. We deliberately do NOT fold in the scroller's
        // scrollTop change: dragging the margin reflows the page and auto-scrolls
        // to keep the caret in view, and reading that auto-scroll as additional
        // drag created a feedback loop — the margin ran straight to its clamp and
        // the marker got stuck (one direction wouldn't move).
        const dyPx = e.clientY - anchor.startClientY;
        const dyTwips = pixelsToTwips(dyPx / zoom);
        if (anchor.marker === 'topMargin') {
            // Dragging down (positive dy) → larger top margin.
            const maxMargin = pageHeightTwips - bottomMarginTwips - 720;
            const newMargin = Math.max(0, Math.min(anchor.startTopMarginTwips + dyTwips, maxMargin));
            onTopMarginChange === null || onTopMarginChange === void 0 ? void 0 : onTopMarginChange(Math.round(newMargin));
        }
        else {
            // Dragging down (positive dy) → smaller bottom margin (the content
            // area's bottom edge follows the pin down).
            const maxMargin = pageHeightTwips - topMarginTwips - 720;
            const newMargin = Math.max(0, Math.min(anchor.startBottomMarginTwips - dyTwips, maxMargin));
            onBottomMarginChange === null || onBottomMarginChange === void 0 ? void 0 : onBottomMarginChange(Math.round(newMargin));
        }
    }, []);
    // Handle drag end
    const handleDragEnd = useCallback(() => {
        setDragging(null);
        dragAnchorRef.current = null;
        onDragStateChange === null || onDragStateChange === void 0 ? void 0 : onDragStateChange(false);
    }, [onDragStateChange]);
    // Add/remove document event listeners
    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
            return () => {
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [dragging, handleDrag, handleDragEnd]);
    // Generate tick marks
    const ticks = generateVerticalTicks(pageHeightTwips, zoom, unit);
    const rulerStyle = Object.assign({ position: 'relative', width: RULER_WIDTH, height: formatPx(pageHeightPx), backgroundColor: 'transparent', overflow: 'visible', userSelect: 'none', cursor: dragging ? 'ns-resize' : 'default' }, style);
    return (_jsxs("div", { ref: rulerRef, className: `docx-vertical-ruler ${className}`, style: rulerStyle, 
        // A GROUP of margin sliders, not a slider itself — role="slider" here
        // lacked aria-valuenow and nested the focusable markers inside an
        // interactive control (nested-interactive).
        role: "group", "aria-label": t('ruler.vertical'), children: [_jsx("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                }, children: ticks.map((tick, index) => (_jsx(VerticalTick, { tick: tick }, index))) }), _jsx(VerticalMarginMarker, { type: "topMargin", position: topMarginPx, editable: editable, isDragging: dragging === 'topMargin', isHovered: hoveredMarker === 'topMargin', onMouseEnter: () => setHoveredMarker('topMargin'), onMouseLeave: () => setHoveredMarker(null), onMouseDown: (e) => handleDragStart(e, 'topMargin'), maxPx: pageHeightPx }), _jsx(VerticalMarginMarker, { type: "bottomMargin", position: pageHeightPx - bottomMarginPx, editable: editable, isDragging: dragging === 'bottomMargin', isHovered: hoveredMarker === 'bottomMargin', onMouseEnter: () => setHoveredMarker('bottomMargin'), onMouseLeave: () => setHoveredMarker(null), onMouseDown: (e) => handleDragStart(e, 'bottomMargin'), maxPx: pageHeightPx })] }));
}
function VerticalTick({ tick }) {
    const tickStyle = {
        position: 'absolute',
        top: formatPx(tick.position),
        right: 0,
        height: 1,
        width: tick.width,
        backgroundColor: RULER_TICK_COLOR,
    };
    const labelStyle = {
        position: 'absolute',
        top: formatPx(tick.position),
        left: 2,
        transform: 'translateY(-50%)',
        fontSize: '9px',
        color: RULER_TEXT_COLOR,
        fontFamily: 'sans-serif',
        whiteSpace: 'nowrap',
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: tickStyle }), tick.label && _jsx("div", { style: labelStyle, children: tick.label })] }));
}
function VerticalMarginMarker({ type, position, editable, isDragging, isHovered, onMouseEnter, onMouseLeave, onMouseDown, maxPx, }) {
    const { t } = useTranslation();
    const color = isDragging ? MARKER_ACTIVE_COLOR : isHovered ? MARKER_HOVER_COLOR : MARKER_COLOR;
    const markerStyle = {
        position: 'absolute',
        top: formatPx(position - 5),
        right: 0,
        width: RULER_WIDTH,
        height: 10,
        cursor: editable ? 'ns-resize' : 'default',
        zIndex: isDragging ? 10 : 1,
    };
    // Triangle pointing left (for top) or right (for bottom)
    const triangleStyle = {
        position: 'absolute',
        top: 0,
        right: 2,
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderRight: `8px solid ${color}`,
        transition: 'border-right-color var(--doc-anim-fast)',
    };
    return (_jsx("div", { className: `docx-ruler-marker docx-ruler-marker-${type}`, style: markerStyle, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, onMouseDown: onMouseDown, role: "slider", "aria-label": type === 'topMargin' ? t('ruler.topMargin') : t('ruler.bottomMargin'), "aria-orientation": "vertical", "aria-valuemin": 0, "aria-valuemax": Math.round(maxPx), "aria-valuenow": Math.round(Math.min(Math.max(position, 0), maxPx)), tabIndex: editable ? 0 : -1, children: _jsx("div", { style: triangleStyle }) }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function generateVerticalTicks(pageHeightTwips, zoom, unit) {
    const ticks = [];
    if (unit === 'inch') {
        const eighthInchTwips = TWIPS_PER_INCH / 8;
        const totalEighths = Math.ceil(pageHeightTwips / eighthInchTwips);
        for (let i = 0; i <= totalEighths; i++) {
            const twipsPos = i * eighthInchTwips;
            if (twipsPos > pageHeightTwips)
                break;
            const pxPos = twipsToPixels(twipsPos) * zoom;
            if (i % 8 === 0) {
                const inches = i / 8;
                ticks.push({
                    position: pxPos,
                    width: 10,
                    label: inches > 0 ? String(inches) : undefined,
                });
            }
            else if (i % 4 === 0) {
                ticks.push({ position: pxPos, width: 6 });
            }
            else if (i % 2 === 0) {
                ticks.push({ position: pxPos, width: 4 });
            }
            else {
                ticks.push({ position: pxPos, width: 2 });
            }
        }
    }
    else {
        const mmTwips = TWIPS_PER_CM / 10;
        const totalMm = Math.ceil(pageHeightTwips / mmTwips);
        for (let i = 0; i <= totalMm; i++) {
            const twipsPos = i * mmTwips;
            if (twipsPos > pageHeightTwips)
                break;
            const pxPos = twipsToPixels(twipsPos) * zoom;
            if (i % 10 === 0) {
                const cm = i / 10;
                ticks.push({
                    position: pxPos,
                    width: 10,
                    label: cm > 0 ? String(cm) : undefined,
                });
            }
            else if (i % 5 === 0) {
                ticks.push({ position: pxPos, width: 6 });
            }
            else {
                ticks.push({ position: pxPos, width: 3 });
            }
        }
    }
    return ticks;
}
export default VerticalRuler;
//# sourceMappingURL=VerticalRuler.js.map