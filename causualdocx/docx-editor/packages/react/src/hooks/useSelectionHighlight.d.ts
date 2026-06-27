/**
 * Selection Highlight Hook
 *
 * A React hook that manages visual selection highlighting across multiple runs.
 * Uses a combination of CSS ::selection pseudo-element styling and optional
 * overlay rectangles for complex scenarios.
 *
 * Features:
 * - Consistent selection highlighting across all text runs
 * - Support for text with different backgrounds (highlighted, dark bg)
 * - Optional overlay rectangles for custom highlight effects
 * - Debounced updates for performance
 */
import React from 'react';
import type { CSSProperties } from 'react';
import { HighlightRect, SelectionHighlightConfig } from '@eigenpal/docx-core/utils';
/**
 * Options for the useSelectionHighlight hook
 */
export interface UseSelectionHighlightOptions {
    /** Reference to the container element */
    containerRef: React.RefObject<HTMLElement>;
    /** Whether to enable selection highlighting */
    enabled?: boolean;
    /** Custom highlight configuration */
    config?: SelectionHighlightConfig;
    /** Whether to use overlay rectangles (default: false, uses CSS) */
    useOverlay?: boolean;
    /** Debounce delay for rect updates in ms (default: 16) */
    debounceMs?: number;
    /** Callback when selection changes */
    onSelectionChange?: (hasSelection: boolean, text: string) => void;
}
/**
 * Return value from the useSelectionHighlight hook
 */
export interface UseSelectionHighlightReturn {
    /** Whether there is an active selection */
    hasSelection: boolean;
    /** The selected text */
    selectedText: string;
    /** Highlight rectangles (only populated if useOverlay is true) */
    highlightRects: HighlightRect[];
    /** Whether selection is within the container */
    isSelectionInContainer: boolean;
    /** Refresh the highlight state */
    refresh: () => void;
    /** Get styles for a highlight rect overlay */
    getOverlayStyle: (rect: HighlightRect) => CSSProperties;
}
/**
 * Hook to manage selection highlighting in the editor
 */
export declare function useSelectionHighlight(options: UseSelectionHighlightOptions): UseSelectionHighlightReturn;
/**
 * Props for selection overlay component
 */
export interface SelectionOverlayProps {
    /** Highlight rectangles to render */
    rects: HighlightRect[];
    /** Style configuration */
    config?: SelectionHighlightConfig;
    /** Additional class name */
    className?: string;
}
/**
 * Generate selection overlay elements (for use in JSX)
 *
 * Usage:
 * ```tsx
 * const { highlightRects } = useSelectionHighlight({ ... });
 * return (
 *   <div style={{ position: 'relative' }}>
 *     {generateOverlayElements(highlightRects)}
 *     <div>... content ...</div>
 *   </div>
 * );
 * ```
 */
export declare function generateOverlayElements(rects: HighlightRect[], config?: SelectionHighlightConfig): React.ReactNode[];
export default useSelectionHighlight;
//# sourceMappingURL=useSelectionHighlight.d.ts.map