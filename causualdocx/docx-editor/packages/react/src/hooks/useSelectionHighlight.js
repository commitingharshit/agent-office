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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SELECTION_STYLE, getMergedSelectionRects, hasActiveSelection, getSelectedText, isSelectionWithin, injectSelectionStyles, areSelectionStylesInjected, } from '@eigenpal/docx-core/utils';
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
/**
 * Hook to manage selection highlighting in the editor
 */
export function useSelectionHighlight(options) {
    const { containerRef, enabled = true, config = DEFAULT_SELECTION_STYLE, useOverlay = false, debounceMs = 16, onSelectionChange, } = options;
    // State
    const [hasSelectionState, setHasSelectionState] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [highlightRects, setHighlightRects] = useState([]);
    const [isSelectionInContainer, setIsSelectionInContainer] = useState(false);
    // Refs for debouncing
    const debounceTimeoutRef = useRef(null);
    const lastUpdateRef = useRef(0);
    /**
     * Update selection state
     */
    const updateSelectionState = useCallback(() => {
        const container = containerRef.current;
        const hasActive = hasActiveSelection();
        const text = getSelectedText();
        const inContainer = container ? isSelectionWithin(container) : false;
        setHasSelectionState(hasActive);
        setSelectedText(text);
        setIsSelectionInContainer(inContainer);
        // Update overlay rects if enabled
        if (useOverlay && inContainer) {
            const rects = getMergedSelectionRects(container);
            setHighlightRects(rects);
        }
        else {
            setHighlightRects([]);
        }
        // Notify callback
        if (onSelectionChange) {
            onSelectionChange(hasActive && inContainer, text);
        }
    }, [containerRef, useOverlay, onSelectionChange]);
    /**
     * Debounced update
     */
    const debouncedUpdate = useCallback(() => {
        const now = performance.now();
        // Skip if updated too recently
        if (now - lastUpdateRef.current < debounceMs) {
            // Schedule delayed update
            if (debounceTimeoutRef.current !== null) {
                clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = window.setTimeout(() => {
                lastUpdateRef.current = performance.now();
                updateSelectionState();
                debounceTimeoutRef.current = null;
            }, debounceMs);
            return;
        }
        lastUpdateRef.current = now;
        updateSelectionState();
    }, [debounceMs, updateSelectionState]);
    /**
     * Force refresh
     */
    const refresh = useCallback(() => {
        updateSelectionState();
    }, [updateSelectionState]);
    /**
     * Get overlay style for a highlight rect
     */
    const getOverlayStyle = useCallback((rect) => {
        var _a, _b;
        return ({
            position: 'absolute',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: config.backgroundColor,
            borderRadius: config.borderRadius ? `${config.borderRadius}px` : undefined,
            border: config.borderColor ? `1px solid ${config.borderColor}` : undefined,
            zIndex: (_a = config.zIndex) !== null && _a !== void 0 ? _a : 0,
            opacity: (_b = config.opacity) !== null && _b !== void 0 ? _b : 1,
            mixBlendMode: config.mixBlendMode,
            pointerEvents: 'none',
            userSelect: 'none',
        });
    }, [config]);
    // Inject CSS styles on mount
    useEffect(() => {
        if (enabled && !areSelectionStylesInjected()) {
            injectSelectionStyles(config);
        }
        return () => {
            // Only remove if we're the last one using them
            // In practice, we keep them for the lifetime of the app
        };
    }, [enabled, config]);
    // Listen for selection changes
    useEffect(() => {
        if (!enabled)
            return;
        const handleSelectionChange = () => {
            debouncedUpdate();
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        // Also listen for mouseup in case selectionchange doesn't fire
        document.addEventListener('mouseup', handleSelectionChange);
        // Initial update
        updateSelectionState();
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleSelectionChange);
            if (debounceTimeoutRef.current !== null) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [enabled, debouncedUpdate, updateSelectionState]);
    return {
        hasSelection: hasSelectionState,
        selectedText,
        highlightRects,
        isSelectionInContainer,
        refresh,
        getOverlayStyle,
    };
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
export function generateOverlayElements(rects, config = DEFAULT_SELECTION_STYLE) {
    return rects.map((rect, index) => {
        var _a, _b;
        return React.createElement('div', {
            key: `selection-overlay-${index}`,
            style: {
                position: 'absolute',
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                backgroundColor: config.backgroundColor,
                borderRadius: config.borderRadius ? `${config.borderRadius}px` : undefined,
                border: config.borderColor ? `1px solid ${config.borderColor}` : undefined,
                zIndex: (_a = config.zIndex) !== null && _a !== void 0 ? _a : 0,
                opacity: (_b = config.opacity) !== null && _b !== void 0 ? _b : 1,
                mixBlendMode: config.mixBlendMode,
                pointerEvents: 'none',
                userSelect: 'none',
            },
        });
    });
}
export default useSelectionHighlight;
//# sourceMappingURL=useSelectionHighlight.js.map