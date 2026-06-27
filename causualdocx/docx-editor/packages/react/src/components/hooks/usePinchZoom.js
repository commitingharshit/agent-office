/**
 * usePinchZoom — two-finger pinch gesture on a target element that
 * proportionally updates the editor's zoom factor.
 *
 * Gated to phone viewports via matchMedia('(max-width: 720px)'). On
 * desktop the hook attaches nothing — the editor's existing zoom
 * dropdown is the right surface there.
 *
 * The gesture math is straightforward: on the first 2-finger
 * touchstart we record the initial finger distance + the editor's
 * current zoom. On each touchmove we compute the new distance and
 * scale the zoom proportionally. On touchend we clamp + commit.
 *
 * Why not rely on the browser's native pinch? Native zoom inflates
 * the *entire page* — toolbar, status bar, everything — and breaks
 * the editor's coordinate system (the layout-painter assumes 1 px
 * = 1 CSS px). Wiring our own gesture into the editor's zoom state
 * keeps the chrome at native size and only scales the document,
 * which is the Word / Pages mental model.
 */
import { useEffect, useRef } from 'react';
/** Inclusive zoom range — anything outside this is unreadable / breaks layout. */
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;
/** Round to 0.05 so the zoom indicator reads cleanly (60%, 65%, …). */
function roundZoom(z) {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(z * 20) / 20));
}
function distance(a, b) {
    const dx = b.clientX - a.clientX;
    const dy = b.clientY - a.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
export function usePinchZoom({ target, zoom, onZoomChange, onZoomPreview, disabled = false, }) {
    const stateRef = useRef(null);
    // Hold the zoom ref so the live touchmove handler always sees the
    // latest committed value without re-attaching on every zoom change.
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;
    useEffect(() => {
        if (disabled || !target)
            return;
        // Only attach on phone widths — desktop pinch typically comes from
        // a trackpad gesture that the browser maps to Ctrl-wheel; the
        // zoom dropdown is the right surface for desktop.
        const mql = window.matchMedia('(max-width: 720px)');
        if (!mql.matches)
            return;
        const onTouchStart = (e) => {
            if (e.touches.length !== 2)
                return;
            stateRef.current = {
                startDist: distance(e.touches[0], e.touches[1]),
                startZoom: zoomRef.current,
            };
        };
        const onTouchMove = (e) => {
            if (e.touches.length !== 2 || !stateRef.current)
                return;
            e.preventDefault(); // suppress browser-level pinch on the editor
            const d = distance(e.touches[0], e.touches[1]);
            const ratio = d / stateRef.current.startDist;
            const next = stateRef.current.startZoom * ratio;
            if (onZoomPreview)
                onZoomPreview(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next)));
        };
        const onTouchEnd = (e) => {
            if (!stateRef.current)
                return;
            // Only finalise when both fingers lift.
            if (e.touches.length >= 2)
                return;
            const last = e.changedTouches[0];
            const other = e.touches[0];
            let final = stateRef.current.startZoom;
            if (last && other) {
                const d = distance(last, other);
                const ratio = d / stateRef.current.startDist;
                final = stateRef.current.startZoom * ratio;
            }
            else if (last && e.changedTouches[1]) {
                const d = distance(last, e.changedTouches[1]);
                const ratio = d / stateRef.current.startDist;
                final = stateRef.current.startZoom * ratio;
            }
            stateRef.current = null;
            onZoomChange(roundZoom(final));
        };
        // `passive: false` is required so preventDefault() in onTouchMove
        // can actually suppress the browser pinch.
        target.addEventListener('touchstart', onTouchStart, { passive: true });
        target.addEventListener('touchmove', onTouchMove, { passive: false });
        target.addEventListener('touchend', onTouchEnd, { passive: true });
        target.addEventListener('touchcancel', onTouchEnd, { passive: true });
        return () => {
            target.removeEventListener('touchstart', onTouchStart);
            target.removeEventListener('touchmove', onTouchMove);
            target.removeEventListener('touchend', onTouchEnd);
            target.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [target, disabled, onZoomChange, onZoomPreview]);
}
//# sourceMappingURL=usePinchZoom.js.map