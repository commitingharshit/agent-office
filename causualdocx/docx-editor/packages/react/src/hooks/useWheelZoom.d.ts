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
/**
 * Options for useWheelZoom hook
 */
export interface UseWheelZoomOptions {
    /** Initial zoom level (default: 1.0) */
    initialZoom?: number;
    /** Minimum zoom level (default: 0.25) */
    minZoom?: number;
    /** Maximum zoom level (default: 4.0) */
    maxZoom?: number;
    /** Zoom step for each scroll event (default: 0.1) */
    zoomStep?: number;
    /** Whether zoom is enabled (default: true) */
    enabled?: boolean;
    /** Container element ref to attach wheel listener */
    containerRef?: React.RefObject<HTMLElement>;
    /** Callback when zoom changes */
    onZoomChange?: (zoom: number) => void;
    /** Whether to enable keyboard shortcuts (Ctrl++, Ctrl+-, Ctrl+0) */
    enableKeyboardShortcuts?: boolean;
    /** Whether to prevent default browser zoom behavior */
    preventDefault?: boolean;
}
/**
 * Return value of useWheelZoom hook
 */
export interface UseWheelZoomReturn {
    /** Current zoom level */
    zoom: number;
    /** Set zoom level directly */
    setZoom: (zoom: number) => void;
    /** Zoom in by step */
    zoomIn: () => void;
    /** Zoom out by step */
    zoomOut: () => void;
    /** Reset zoom to initial level */
    resetZoom: () => void;
    /** Reset zoom to 100% */
    zoomTo100: () => void;
    /** Zoom to fit width */
    zoomToFit: (containerWidth: number, contentWidth: number) => void;
    /** Whether currently at minimum zoom */
    isMinZoom: boolean;
    /** Whether currently at maximum zoom */
    isMaxZoom: boolean;
    /** Zoom percentage (e.g., 100 for zoom level 1.0) */
    zoomPercent: number;
    /** Wheel event handler (for manual attachment) */
    handleWheel: (event: WheelEvent) => void;
    /** Keyboard event handler (for manual attachment) */
    handleKeyDown: (event: KeyboardEvent) => void;
}
/**
 * Preset zoom levels for snapping
 */
export declare const ZOOM_PRESETS: number[];
/**
 * React hook for Ctrl+scroll zoom functionality
 */
export declare function useWheelZoom(options?: UseWheelZoomOptions): UseWheelZoomReturn;
/**
 * Get zoom presets
 */
export declare function getZoomPresets(): number[];
/**
 * Find nearest zoom preset
 */
export declare function findNearestZoomPreset(zoom: number): number;
/**
 * Get next zoom preset (for zoom in)
 */
export declare function getNextZoomPreset(zoom: number): number;
/**
 * Get previous zoom preset (for zoom out)
 */
export declare function getPreviousZoomPreset(zoom: number): number;
/**
 * Format zoom level for display
 */
export declare function formatZoom(zoom: number): string;
/**
 * Parse zoom from percentage string
 */
export declare function parseZoom(zoomString: string): number | null;
/**
 * Check if zoom level is at a preset
 */
export declare function isZoomPreset(zoom: number): boolean;
/**
 * Clamp zoom to valid range
 */
export declare function clampZoom(zoom: number, minZoom?: number, maxZoom?: number): number;
export default useWheelZoom;
//# sourceMappingURL=useWheelZoom.d.ts.map