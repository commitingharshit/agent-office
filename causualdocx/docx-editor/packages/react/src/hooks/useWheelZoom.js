/**
 * useWheelZoom Hook
 *
 * Enables Ctrl+scroll (or Cmd+scroll on Mac) to zoom in/out.
 * Features:
 * - Configurable zoom range and step
 * - Smooth zoom transitions
 * - Pinch-to-zoom support on trackpads
 * - Zoom reset (Ctrl+0)
 * - Zoom in/out shortcuts (Ctrl++, Ctrl+-)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_INITIAL_ZOOM = 1.0;
const DEFAULT_MIN_ZOOM = 0.25;
const DEFAULT_MAX_ZOOM = 4.0;
const DEFAULT_ZOOM_STEP = 0.1;
/**
 * Preset zoom levels for snapping
 */
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Round zoom to 2 decimal places
 */
function roundZoom(zoom) {
    return Math.round(zoom * 100) / 100;
}
/**
 * Find nearest preset zoom level
 */
function nearestPreset(zoom) {
    let nearest = ZOOM_PRESETS[0];
    let minDiff = Math.abs(zoom - nearest);
    for (const preset of ZOOM_PRESETS) {
        const diff = Math.abs(zoom - preset);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = preset;
        }
    }
    return nearest;
}
/**
 * Get next preset zoom level (for zoom in)
 */
function nextPreset(currentZoom) {
    for (const preset of ZOOM_PRESETS) {
        if (preset > currentZoom + 0.01) {
            return preset;
        }
    }
    return ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
}
/**
 * Get previous preset zoom level (for zoom out)
 */
function prevPreset(currentZoom) {
    for (let i = ZOOM_PRESETS.length - 1; i >= 0; i--) {
        if (ZOOM_PRESETS[i] < currentZoom - 0.01) {
            return ZOOM_PRESETS[i];
        }
    }
    return ZOOM_PRESETS[0];
}
// ============================================================================
// USE WHEEL ZOOM HOOK
// ============================================================================
/**
 * React hook for Ctrl+scroll zoom functionality
 */
export function useWheelZoom(options = {}) {
    const { initialZoom = DEFAULT_INITIAL_ZOOM, minZoom = DEFAULT_MIN_ZOOM, maxZoom = DEFAULT_MAX_ZOOM, zoomStep = DEFAULT_ZOOM_STEP, enabled = true, containerRef, onZoomChange, enableKeyboardShortcuts = true, preventDefault = true, } = options;
    const [zoom, setZoomState] = useState(initialZoom);
    const zoomRef = useRef(zoom);
    // Keep ref in sync with state
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);
    /**
     * Set zoom with clamping and callback
     */
    const setZoom = useCallback((newZoom) => {
        const clampedZoom = roundZoom(clamp(newZoom, minZoom, maxZoom));
        if (clampedZoom !== zoomRef.current) {
            setZoomState(clampedZoom);
            onZoomChange === null || onZoomChange === void 0 ? void 0 : onZoomChange(clampedZoom);
        }
    }, [minZoom, maxZoom, onZoomChange]);
    /**
     * Zoom in by step
     */
    const zoomIn = useCallback(() => {
        setZoom(zoomRef.current + zoomStep);
    }, [zoomStep, setZoom]);
    /**
     * Zoom out by step
     */
    const zoomOut = useCallback(() => {
        setZoom(zoomRef.current - zoomStep);
    }, [zoomStep, setZoom]);
    /**
     * Reset zoom to initial level
     */
    const resetZoom = useCallback(() => {
        setZoom(initialZoom);
    }, [initialZoom, setZoom]);
    /**
     * Reset zoom to 100%
     */
    const zoomTo100 = useCallback(() => {
        setZoom(1.0);
    }, [setZoom]);
    /**
     * Zoom to fit width
     */
    const zoomToFit = useCallback((containerWidth, contentWidth) => {
        if (contentWidth > 0) {
            const fitZoom = containerWidth / contentWidth;
            setZoom(fitZoom);
        }
    }, [setZoom]);
    /**
     * Handle wheel event
     */
    const handleWheel = useCallback((event) => {
        if (!enabled)
            return;
        // Check for Ctrl/Cmd key
        const isCtrlOrMeta = event.ctrlKey || event.metaKey;
        if (!isCtrlOrMeta)
            return;
        // Prevent default browser zoom
        if (preventDefault) {
            event.preventDefault();
        }
        // Determine zoom direction
        // deltaY > 0 means scrolling down (zoom out)
        // deltaY < 0 means scrolling up (zoom in)
        const delta = event.deltaY;
        if (delta < 0) {
            // Scroll up = zoom in
            setZoom(zoomRef.current + zoomStep);
        }
        else if (delta > 0) {
            // Scroll down = zoom out
            setZoom(zoomRef.current - zoomStep);
        }
    }, [enabled, preventDefault, zoomStep, setZoom]);
    /**
     * Handle keyboard shortcuts
     */
    const handleKeyDown = useCallback((event) => {
        if (!enabled || !enableKeyboardShortcuts)
            return;
        const isCtrlOrMeta = event.ctrlKey || event.metaKey;
        if (!isCtrlOrMeta)
            return;
        // Ctrl+0 - Reset zoom to 100%
        if (event.key === '0') {
            event.preventDefault();
            zoomTo100();
            return;
        }
        // Ctrl++ or Ctrl+= - Zoom in
        if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomIn();
            return;
        }
        // Ctrl+- - Zoom out
        if (event.key === '-') {
            event.preventDefault();
            zoomOut();
            return;
        }
    }, [enabled, enableKeyboardShortcuts, zoomIn, zoomOut, zoomTo100]);
    // Attach wheel listener to container
    useEffect(() => {
        if (!enabled)
            return;
        const container = containerRef === null || containerRef === void 0 ? void 0 : containerRef.current;
        if (!container)
            return;
        // Use passive: false to allow preventDefault
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [enabled, containerRef, handleWheel]);
    // Attach keyboard listener
    useEffect(() => {
        if (!enabled || !enableKeyboardShortcuts)
            return;
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, enableKeyboardShortcuts, handleKeyDown]);
    return {
        zoom,
        setZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        zoomTo100,
        zoomToFit,
        isMinZoom: zoom <= minZoom,
        isMaxZoom: zoom >= maxZoom,
        zoomPercent: Math.round(zoom * 100),
        handleWheel,
        handleKeyDown,
    };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get zoom presets
 */
export function getZoomPresets() {
    return [...ZOOM_PRESETS];
}
/**
 * Find nearest zoom preset
 */
export function findNearestZoomPreset(zoom) {
    return nearestPreset(zoom);
}
/**
 * Get next zoom preset (for zoom in)
 */
export function getNextZoomPreset(zoom) {
    return nextPreset(zoom);
}
/**
 * Get previous zoom preset (for zoom out)
 */
export function getPreviousZoomPreset(zoom) {
    return prevPreset(zoom);
}
/**
 * Format zoom level for display
 */
export function formatZoom(zoom) {
    return `${Math.round(zoom * 100)}%`;
}
/**
 * Parse zoom from percentage string
 */
export function parseZoom(zoomString) {
    const match = zoomString.match(/(\d+(\.\d+)?)/);
    if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
            return value / 100;
        }
    }
    return null;
}
/**
 * Check if zoom level is at a preset
 */
export function isZoomPreset(zoom) {
    return ZOOM_PRESETS.some((preset) => Math.abs(preset - zoom) < 0.01);
}
/**
 * Clamp zoom to valid range
 */
export function clampZoom(zoom, minZoom = DEFAULT_MIN_ZOOM, maxZoom = DEFAULT_MAX_ZOOM) {
    return roundZoom(clamp(zoom, minZoom, maxZoom));
}
// ============================================================================
// EXPORTS
// ============================================================================
export default useWheelZoom;
//# sourceMappingURL=useWheelZoom.js.map