import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * HorizontalRuler Component — Google Docs style
 *
 * 3 handles only:
 * - Left side: first-line indent (▼ down at top) + left indent (▲ up at bottom)
 * - Right side: right indent (▼ down at top)
 *
 * Margins shown as gray zones on the ruler edges.
 * Drag the boundary between gray/white to adjust page margins.
 * Drag tooltip shows value during any drag.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { twipsToPixels, pixelsToTwips, formatPx } from '@eigenpal/docx-core/utils';
import { useTranslation } from '../../i18n';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_PAGE_WIDTH_TWIPS = 12240;
const DEFAULT_MARGIN_TWIPS = 1440;
const TWIPS_PER_INCH = 1440;
const TWIPS_PER_CM = 567;
const RULER_HEIGHT = 22;
const RULER_TEXT_COLOR = 'var(--doc-text-muted)';
const RULER_TICK_COLOR = 'var(--doc-text-subtle)';
const MARGIN_ZONE_COLOR = 'rgba(0, 0, 0, 0.02)';
const INDENT_COLOR = '#4285f4';
const INDENT_HOVER_COLOR = '#3367d6';
const INDENT_ACTIVE_COLOR = '#2a56c6';
const TRI_SIZE = 5; // triangle half-width in px
// ============================================================================
// HELPERS
// ============================================================================
function formatValueForTooltip(twips, unit) {
    if (unit === 'inch') {
        return (twips / TWIPS_PER_INCH).toFixed(2) + '"';
    }
    return (twips / TWIPS_PER_CM).toFixed(1) + ' cm';
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function HorizontalRuler({ sectionProps, zoom = 1, editable = false, onLeftMarginChange, onRightMarginChange, onFirstLineIndentChange, showFirstLineIndent = false, firstLineIndent = 0, hangingIndent = false, indentLeft = 0, indentRight = 0, onIndentLeftChange, onIndentRightChange, unit = 'inch', onDragStateChange, className = '', style, tabStops, onTabStopRemove, }) {
    var _a, _b, _c;
    const { t } = useTranslation();
    const [dragging, setDragging] = useState(null);
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const [dragValue, setDragValue] = useState(null);
    const [dragPositionPx, setDragPositionPx] = useState(null);
    const rulerRef = useRef(null);
    // Anchor captured at drag-start; the new value is computed as
    // `startValue + (pointer delta in twips)` against this fixed reference, so
    // re-flowing the page mid-drag can't shift it and make the marker oscillate.
    // `marker` is stored here (not read from React state) so handleDrag can stay
    // referentially stable — see its definition. Same pattern in VerticalRuler.
    const dragAnchorRef = useRef(null);
    // Page dimensions
    const pageWidthTwips = (_a = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.pageWidth) !== null && _a !== void 0 ? _a : DEFAULT_PAGE_WIDTH_TWIPS;
    const leftMarginTwips = (_b = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginLeft) !== null && _b !== void 0 ? _b : DEFAULT_MARGIN_TWIPS;
    const rightMarginTwips = (_c = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginRight) !== null && _c !== void 0 ? _c : DEFAULT_MARGIN_TWIPS;
    const contentTwips = pageWidthTwips - leftMarginTwips - rightMarginTwips;
    // Pixel conversions
    const pageWidthPx = twipsToPixels(pageWidthTwips) * zoom;
    const leftMarginPx = twipsToPixels(leftMarginTwips) * zoom;
    const rightMarginPx = twipsToPixels(rightMarginTwips) * zoom;
    const indentLeftPx = twipsToPixels(indentLeft) * zoom;
    const indentRightPx = twipsToPixels(indentRight) * zoom;
    // First line indent: hanging goes left, normal goes right
    const effectiveFirstLineIndent = hangingIndent ? -firstLineIndent : firstLineIndent;
    const firstLineIndentPx = twipsToPixels(effectiveFirstLineIndent) * zoom;
    // Handle positions (in px from ruler left edge)
    const leftIndentPosPx = leftMarginPx + indentLeftPx;
    const rightIndentPosPx = pageWidthPx - rightMarginPx - indentRightPx;
    const firstLinePosPx = leftMarginPx + indentLeftPx + firstLineIndentPx;
    // Live values mirrored into a ref so handleDrag is referentially STABLE
    // (empty deps). Depending on the live margins/indents would recreate
    // handleDrag on every drag step, churning the mousemove listener (remove +
    // re-add every frame) which drops events and makes the marker jitter/"shake".
    const liveRef = useRef({
        zoom,
        pageWidthTwips,
        pageWidthPx,
        leftMarginTwips,
        leftMarginPx,
        rightMarginTwips,
        rightMarginPx,
        contentTwips,
        indentLeft,
        indentLeftPx,
        indentRight,
        onLeftMarginChange,
        onRightMarginChange,
        onFirstLineIndentChange,
        onIndentLeftChange,
        onIndentRightChange,
    });
    liveRef.current = {
        zoom,
        pageWidthTwips,
        pageWidthPx,
        leftMarginTwips,
        leftMarginPx,
        rightMarginTwips,
        rightMarginPx,
        contentTwips,
        indentLeft,
        indentLeftPx,
        indentRight,
        onLeftMarginChange,
        onRightMarginChange,
        onFirstLineIndentChange,
        onIndentLeftChange,
        onIndentRightChange,
    };
    const handleDragStart = useCallback((e, marker) => {
        if (!editable)
            return;
        e.preventDefault();
        e.stopPropagation();
        dragAnchorRef.current = {
            marker,
            startClientX: e.clientX,
            startLeftMarginTwips: leftMarginTwips,
            startRightMarginTwips: rightMarginTwips,
            startFirstLineIndentTwips: effectiveFirstLineIndent,
            startLeftIndentTwips: indentLeft,
            startRightIndentTwips: indentRight,
        };
        setDragging(marker);
        onDragStateChange === null || onDragStateChange === void 0 ? void 0 : onDragStateChange(true);
    }, [
        editable,
        leftMarginTwips,
        rightMarginTwips,
        effectiveFirstLineIndent,
        indentLeft,
        indentRight,
        onDragStateChange,
    ]);
    // Referentially stable (reads everything from refs) so the mousemove
    // listener is attached exactly once per drag.
    const handleDrag = useCallback((e) => {
        const anchor = dragAnchorRef.current;
        if (!anchor)
            return;
        const { zoom, pageWidthTwips, pageWidthPx, leftMarginTwips, leftMarginPx, rightMarginTwips, rightMarginPx, contentTwips, indentLeft, indentLeftPx, indentRight, onLeftMarginChange, onRightMarginChange, onFirstLineIndentChange, onIndentLeftChange, onIndentRightChange, } = liveRef.current;
        // Pointer delta only — no scroll feedback (see VerticalRuler for why folding
        // in the scroller delta created a margin-runaway/stuck feedback loop).
        const dxPx = e.clientX - anchor.startClientX;
        const dxTwips = pixelsToTwips(dxPx / zoom);
        if (anchor.marker === 'leftMargin') {
            // Drag right = larger left margin.
            const maxMargin = pageWidthTwips - rightMarginTwips - 720;
            const rounded = Math.round(Math.max(0, Math.min(anchor.startLeftMarginTwips + dxTwips, maxMargin)));
            setDragValue(rounded);
            // dragPositionPx kept for the value-tooltip overlay — express
            // it as the marker's new screen position derived from the
            // ANCHOR value, not from rect.left. The tooltip just needs a
            // monotonic px value; absolute accuracy isn't required.
            setDragPositionPx(twipsToPixels(rounded) * zoom);
            onLeftMarginChange === null || onLeftMarginChange === void 0 ? void 0 : onLeftMarginChange(rounded);
        }
        else if (anchor.marker === 'rightMargin') {
            // Drag right = smaller right margin (the right edge moves
            // right with the pin).
            const maxMargin = pageWidthTwips - leftMarginTwips - 720;
            const rounded = Math.round(Math.max(0, Math.min(anchor.startRightMarginTwips - dxTwips, maxMargin)));
            setDragValue(rounded);
            setDragPositionPx(pageWidthPx - twipsToPixels(rounded) * zoom);
            onRightMarginChange === null || onRightMarginChange === void 0 ? void 0 : onRightMarginChange(rounded);
        }
        else if (anchor.marker === 'firstLineIndent') {
            const maxIndent = contentTwips - indentLeft - indentRight - 720;
            const rounded = Math.round(Math.max(-indentLeft, Math.min(anchor.startFirstLineIndentTwips + dxTwips, maxIndent)));
            setDragValue(rounded);
            setDragPositionPx(leftMarginPx + indentLeftPx + twipsToPixels(rounded) * zoom);
            onFirstLineIndentChange === null || onFirstLineIndentChange === void 0 ? void 0 : onFirstLineIndentChange(rounded);
        }
        else if (anchor.marker === 'leftIndent') {
            const maxIndent = contentTwips - indentRight - 720;
            const rounded = Math.round(Math.max(0, Math.min(anchor.startLeftIndentTwips + dxTwips, maxIndent)));
            setDragValue(rounded);
            setDragPositionPx(leftMarginPx + twipsToPixels(rounded) * zoom);
            onIndentLeftChange === null || onIndentLeftChange === void 0 ? void 0 : onIndentLeftChange(rounded);
        }
        else if (anchor.marker === 'rightIndent') {
            // Drag right = smaller right indent.
            const maxIndent = contentTwips - indentLeft - 720;
            const rounded = Math.round(Math.max(0, Math.min(anchor.startRightIndentTwips - dxTwips, maxIndent)));
            setDragValue(rounded);
            setDragPositionPx(pageWidthPx - rightMarginPx - twipsToPixels(rounded) * zoom);
            onIndentRightChange === null || onIndentRightChange === void 0 ? void 0 : onIndentRightChange(rounded);
        }
    }, 
    // Stable: all live values are read from liveRef.current.
    []);
    const handleDragEnd = useCallback(() => {
        setDragging(null);
        setDragValue(null);
        setDragPositionPx(null);
        dragAnchorRef.current = null;
        onDragStateChange === null || onDragStateChange === void 0 ? void 0 : onDragStateChange(false);
    }, [onDragStateChange]);
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
    const ticks = generateTicks(pageWidthTwips, zoom, unit);
    return (_jsxs("div", { ref: rulerRef, className: `docx-horizontal-ruler ${className}`, style: Object.assign({ position: 'relative', width: formatPx(pageWidthPx), height: RULER_HEIGHT, backgroundColor: 'transparent', overflow: 'visible', userSelect: 'none', cursor: dragging ? 'ew-resize' : 'default' }, style), 
        // The ruler is a GROUP of margin/indent sliders, not a slider itself —
        // role="slider" here both lacked aria-valuenow and nested the focusable
        // indent markers inside an interactive control (nested-interactive).
        role: "group", "aria-label": t('ruler.horizontal'), children: [_jsx("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: formatPx(leftMarginPx),
                    height: RULER_HEIGHT,
                    backgroundColor: MARGIN_ZONE_COLOR,
                    borderRight: '1px solid rgba(0,0,0,0.06)',
                    cursor: editable ? 'ew-resize' : 'default',
                    zIndex: 1,
                }, onMouseDown: editable && onLeftMarginChange ? (e) => handleDragStart(e, 'leftMargin') : undefined }), _jsx("div", { style: {
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: formatPx(rightMarginPx),
                    height: RULER_HEIGHT,
                    backgroundColor: MARGIN_ZONE_COLOR,
                    borderLeft: '1px solid rgba(0,0,0,0.06)',
                    cursor: editable ? 'ew-resize' : 'default',
                    zIndex: 1,
                }, onMouseDown: editable && onRightMarginChange ? (e) => handleDragStart(e, 'rightMargin') : undefined }), _jsx("div", { style: { position: 'absolute', inset: 0, pointerEvents: 'none' }, children: ticks.map((tick, i) => (_jsx(RulerTick, { tick: tick }, i))) }), showFirstLineIndent && (_jsx(IndentTriangle, { direction: "down", positionPx: firstLinePosPx, editable: editable, isDragging: dragging === 'firstLineIndent', isHovered: hoveredMarker === 'firstLineIndent', onMouseEnter: () => setHoveredMarker('firstLineIndent'), onMouseLeave: () => setHoveredMarker(null), onMouseDown: (e) => handleDragStart(e, 'firstLineIndent'), label: t('ruler.firstLineIndent'), maxPx: pageWidthPx })), editable && onIndentLeftChange && (_jsx(IndentTriangle, { direction: "up", positionPx: leftIndentPosPx, editable: editable, isDragging: dragging === 'leftIndent', isHovered: hoveredMarker === 'leftIndent', onMouseEnter: () => setHoveredMarker('leftIndent'), onMouseLeave: () => setHoveredMarker(null), onMouseDown: (e) => handleDragStart(e, 'leftIndent'), label: t('ruler.leftIndent'), maxPx: pageWidthPx })), editable && onIndentRightChange && (_jsx(IndentTriangle, { direction: "down", positionPx: rightIndentPosPx, editable: editable, isDragging: dragging === 'rightIndent', isHovered: hoveredMarker === 'rightIndent', onMouseEnter: () => setHoveredMarker('rightIndent'), onMouseLeave: () => setHoveredMarker(null), onMouseDown: (e) => handleDragStart(e, 'rightIndent'), label: t('ruler.rightIndent'), maxPx: pageWidthPx })), tabStops === null || tabStops === void 0 ? void 0 : tabStops.map((tab) => (_jsx(TabStopMarker, { tabStop: tab, positionPx: twipsToPixels(tab.position) * zoom, onDoubleClick: () => onTabStopRemove === null || onTabStopRemove === void 0 ? void 0 : onTabStopRemove(tab.position) }, tab.position))), dragging && dragValue !== null && dragPositionPx !== null && (_jsx(DragTooltip, { value: formatValueForTooltip(dragValue, unit), positionPx: dragPositionPx }))] }));
}
function RulerTick({ tick }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                    position: 'absolute',
                    left: formatPx(tick.position),
                    bottom: 0,
                    width: 1,
                    height: tick.height,
                    backgroundColor: RULER_TICK_COLOR,
                } }), tick.label && (_jsx("div", { style: {
                    position: 'absolute',
                    left: formatPx(tick.position),
                    top: 3,
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: RULER_TEXT_COLOR,
                    fontFamily: 'sans-serif',
                    whiteSpace: 'nowrap',
                }, children: tick.label }))] }));
}
function IndentTriangle({ direction, positionPx, editable, isDragging, isHovered, onMouseEnter, onMouseLeave, onMouseDown, label, maxPx, }) {
    const color = isDragging ? INDENT_ACTIVE_COLOR : isHovered ? INDENT_HOVER_COLOR : INDENT_COLOR;
    const triHeight = Math.round(TRI_SIZE * 1.6);
    const containerStyle = Object.assign({ position: 'absolute', left: formatPx(positionPx - TRI_SIZE), width: TRI_SIZE * 2, height: triHeight + 2, cursor: editable ? 'ew-resize' : 'default', zIndex: isDragging ? 10 : 4 }, (direction === 'down' ? { top: 0 } : { bottom: 0 }));
    const triangleStyle = direction === 'down'
        ? {
            position: 'absolute',
            top: 1,
            left: 0,
            width: 0,
            height: 0,
            borderLeft: `${TRI_SIZE}px solid transparent`,
            borderRight: `${TRI_SIZE}px solid transparent`,
            borderTop: `${triHeight}px solid ${color}`,
            transition: 'border-top-color var(--doc-anim-fast)',
        }
        : {
            position: 'absolute',
            bottom: 1,
            left: 0,
            width: 0,
            height: 0,
            borderLeft: `${TRI_SIZE}px solid transparent`,
            borderRight: `${TRI_SIZE}px solid transparent`,
            borderBottom: `${triHeight}px solid ${color}`,
            transition: 'border-bottom-color var(--doc-anim-fast)',
        };
    return (_jsx("div", { className: "docx-ruler-indent", style: containerStyle, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, onMouseDown: onMouseDown, role: "slider", "aria-label": label, "aria-orientation": "horizontal", "aria-valuemin": 0, "aria-valuemax": Math.round(maxPx), "aria-valuenow": Math.round(Math.min(Math.max(positionPx, 0), maxPx)), tabIndex: editable ? 0 : -1, children: _jsx("div", { style: triangleStyle }) }));
}
function DragTooltip({ value, positionPx, }) {
    return (_jsx("div", { style: {
            position: 'absolute',
            left: formatPx(positionPx),
            top: -22,
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: '#fff',
            fontSize: '10px',
            fontFamily: 'sans-serif',
            padding: '2px 6px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 20,
        }, children: value }));
}
const TAB_SYMBOLS = {
    left: 'L',
    center: 'C',
    right: 'R',
    decimal: 'D',
    bar: '|',
};
function TabStopMarker({ tabStop, positionPx, onDoubleClick, }) {
    return (_jsx("div", { style: {
            position: 'absolute',
            left: formatPx(positionPx - 5),
            bottom: 0,
            width: 10,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 700,
            color: '#555',
            cursor: 'pointer',
            userSelect: 'none',
        }, onDoubleClick: (e) => {
            e.stopPropagation();
            onDoubleClick();
        }, title: `${tabStop.alignment} tab at ${(tabStop.position / 1440).toFixed(2)}"`, children: TAB_SYMBOLS[tabStop.alignment] || 'L' }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function generateTicks(pageWidthTwips, zoom, unit) {
    const ticks = [];
    if (unit === 'inch') {
        const eighthInchTwips = TWIPS_PER_INCH / 8;
        const totalEighths = Math.ceil(pageWidthTwips / eighthInchTwips);
        for (let i = 0; i <= totalEighths; i++) {
            const twipsPos = i * eighthInchTwips;
            if (twipsPos > pageWidthTwips)
                break;
            const pxPos = twipsToPixels(twipsPos) * zoom;
            if (i % 8 === 0) {
                ticks.push({ position: pxPos, height: 10, label: i / 8 > 0 ? String(i / 8) : undefined });
            }
            else if (i % 4 === 0) {
                ticks.push({ position: pxPos, height: 6 });
            }
            else if (i % 2 === 0) {
                ticks.push({ position: pxPos, height: 4 });
            }
            else {
                ticks.push({ position: pxPos, height: 2 });
            }
        }
    }
    else {
        const mmTwips = TWIPS_PER_CM / 10;
        const totalMm = Math.ceil(pageWidthTwips / mmTwips);
        for (let i = 0; i <= totalMm; i++) {
            const twipsPos = i * mmTwips;
            if (twipsPos > pageWidthTwips)
                break;
            const pxPos = twipsToPixels(twipsPos) * zoom;
            if (i % 10 === 0) {
                ticks.push({ position: pxPos, height: 10, label: i / 10 > 0 ? String(i / 10) : undefined });
            }
            else if (i % 5 === 0) {
                ticks.push({ position: pxPos, height: 6 });
            }
            else {
                ticks.push({ position: pxPos, height: 3 });
            }
        }
    }
    return ticks;
}
export function positionToMargin(positionPx, side, pageWidthPx, zoom) {
    const positionTwips = pixelsToTwips(positionPx / zoom);
    if (side === 'left')
        return Math.max(0, positionTwips);
    return Math.max(0, pixelsToTwips(pageWidthPx / zoom) - positionTwips);
}
export function getRulerDimensions(sectionProps, zoom = 1) {
    var _a, _b, _c;
    const pw = (_a = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.pageWidth) !== null && _a !== void 0 ? _a : DEFAULT_PAGE_WIDTH_TWIPS;
    const lm = (_b = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginLeft) !== null && _b !== void 0 ? _b : DEFAULT_MARGIN_TWIPS;
    const rm = (_c = sectionProps === null || sectionProps === void 0 ? void 0 : sectionProps.marginRight) !== null && _c !== void 0 ? _c : DEFAULT_MARGIN_TWIPS;
    const width = twipsToPixels(pw) * zoom;
    const leftMargin = twipsToPixels(lm) * zoom;
    const rightMargin = twipsToPixels(rm) * zoom;
    return { width, leftMargin, rightMargin, contentWidth: width - leftMargin - rightMargin };
}
export function getMarginInUnits(marginTwips, unit) {
    return unit === 'inch'
        ? (marginTwips / TWIPS_PER_INCH).toFixed(2) + '"'
        : (marginTwips / TWIPS_PER_CM).toFixed(1) + ' cm';
}
export function parseMarginFromUnits(value, unit) {
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    if (isNaN(num))
        return null;
    return Math.round(num * (unit === 'inch' ? TWIPS_PER_INCH : TWIPS_PER_CM));
}
export default HorizontalRuler;
//# sourceMappingURL=HorizontalRuler.js.map