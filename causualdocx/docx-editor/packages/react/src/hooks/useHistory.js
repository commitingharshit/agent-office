/**
 * History hook for undo/redo functionality
 *
 * Maintains undo/redo stacks with support for:
 * - undo() and redo() operations
 * - canUndo and canRedo state
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
 * - Grouping rapid changes to avoid cluttering history
 */
import { useState, useCallback, useEffect, useRef } from 'react';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Default equality check using JSON stringify
 */
function defaultIsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
/**
 * Custom hook for managing undo/redo history
 */
export function useHistory(initialState, options = {}) {
    const { maxEntries = 100, groupingInterval = 500, enableKeyboardShortcuts = true, isEqual = defaultIsEqual, onUndo, onRedo, containerRef, } = options;
    // Current state
    const [state, setState] = useState(initialState);
    // History stacks
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    // Track last push time for grouping
    const lastPushTimeRef = useRef(0);
    // Track if we're currently in an undo/redo operation
    const isUndoRedoRef = useRef(false);
    /**
     * Push a new state to history
     */
    const push = useCallback((newState, description) => {
        // Skip if state hasn't changed
        if (isEqual(state, newState)) {
            return;
        }
        // If this is an undo/redo operation, don't push
        if (isUndoRedoRef.current) {
            setState(newState);
            return;
        }
        const now = Date.now();
        const timeSinceLastPush = now - lastPushTimeRef.current;
        // Check if we should group with previous entry
        if (timeSinceLastPush < groupingInterval && undoStack.length > 0) {
            // Update the most recent entry instead of creating new one
            setUndoStack((prev) => {
                const newStack = [...prev];
                newStack[newStack.length - 1] = {
                    state: state, // Keep the state before the grouped changes
                    timestamp: now,
                    description: description || newStack[newStack.length - 1].description,
                };
                return newStack;
            });
        }
        else {
            // Push current state to undo stack
            setUndoStack((prev) => {
                const newEntry = {
                    state,
                    timestamp: now,
                    description,
                };
                // Limit stack size
                const newStack = [...prev, newEntry];
                if (newStack.length > maxEntries) {
                    return newStack.slice(newStack.length - maxEntries);
                }
                return newStack;
            });
        }
        // Clear redo stack on new change
        setRedoStack([]);
        // Update current state
        setState(newState);
        // Update last push time
        lastPushTimeRef.current = now;
    }, [state, isEqual, groupingInterval, maxEntries, undoStack.length]);
    /**
     * Undo to previous state
     */
    const undo = useCallback(() => {
        if (undoStack.length === 0) {
            return undefined;
        }
        isUndoRedoRef.current = true;
        // Pop from undo stack
        const prevEntry = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));
        // Push current state to redo stack
        setRedoStack((prev) => [
            ...prev,
            {
                state,
                timestamp: Date.now(),
            },
        ]);
        // Restore previous state
        setState(prevEntry.state);
        // Reset flag after state update
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 0);
        // Call callback
        onUndo === null || onUndo === void 0 ? void 0 : onUndo(prevEntry.state);
        return prevEntry.state;
    }, [undoStack, state, onUndo]);
    /**
     * Redo to next state
     */
    const redo = useCallback(() => {
        if (redoStack.length === 0) {
            return undefined;
        }
        isUndoRedoRef.current = true;
        // Pop from redo stack
        const nextEntry = redoStack[redoStack.length - 1];
        setRedoStack((prev) => prev.slice(0, -1));
        // Push current state to undo stack
        setUndoStack((prev) => [
            ...prev,
            {
                state,
                timestamp: Date.now(),
            },
        ]);
        // Restore next state
        setState(nextEntry.state);
        // Reset flag after state update
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 0);
        // Call callback
        onRedo === null || onRedo === void 0 ? void 0 : onRedo(nextEntry.state);
        return nextEntry.state;
    }, [redoStack, state, onRedo]);
    /**
     * Clear all history
     */
    const clear = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
    }, []);
    /**
     * Reset to initial state and clear history
     */
    const reset = useCallback((newInitialState) => {
        setState(newInitialState !== null && newInitialState !== void 0 ? newInitialState : initialState);
        setUndoStack([]);
        setRedoStack([]);
        lastPushTimeRef.current = 0;
    }, [initialState]);
    /**
     * Get undo stack (for debugging)
     */
    const getUndoStack = useCallback(() => {
        return [...undoStack];
    }, [undoStack]);
    /**
     * Get redo stack (for debugging)
     */
    const getRedoStack = useCallback(() => {
        return [...redoStack];
    }, [redoStack]);
    /**
     * Transform all stored states (current + undo/redo stacks).
     * Useful for bulk cleanup such as stripping cached snapshots.
     */
    const transformAll = useCallback((fn) => {
        setState((prev) => fn(prev));
        setUndoStack((prev) => prev.map((entry) => (Object.assign(Object.assign({}, entry), { state: fn(entry.state) }))));
        setRedoStack((prev) => prev.map((entry) => (Object.assign(Object.assign({}, entry), { state: fn(entry.state) }))));
    }, []);
    /**
     * Handle keyboard shortcuts
     */
    useEffect(() => {
        if (!enableKeyboardShortcuts)
            return;
        const handleKeyDown = (event) => {
            // Ctrl+Z or Cmd+Z for undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
                return;
            }
            // Ctrl+Y or Cmd+Shift+Z for redo
            if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
                ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey)) {
                event.preventDefault();
                redo();
                return;
            }
        };
        // Add listener to container or document
        const target = (containerRef === null || containerRef === void 0 ? void 0 : containerRef.current) || document;
        target.addEventListener('keydown', handleKeyDown);
        return () => {
            target.removeEventListener('keydown', handleKeyDown);
        };
    }, [enableKeyboardShortcuts, undo, redo, containerRef]);
    return {
        state,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        push,
        undo,
        redo,
        clear,
        reset,
        getUndoStack,
        getRedoStack,
        transformAll,
    };
}
// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================
/**
 * Simplified hook that just tracks state changes automatically
 */
export function useAutoHistory(value, options = {}) {
    const history = useHistory(value, options);
    // Automatically push when value changes
    useEffect(() => {
        history.push(value);
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
    return history;
}
/**
 * Hook for document history with specialized comparison
 */
export function useDocumentHistory(document, options = {}) {
    // Compare document content, headers, and footers for detecting changes
    const isEqual = useCallback((a, b) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (((_a = a === null || a === void 0 ? void 0 : a.package) === null || _a === void 0 ? void 0 : _a.document) !== ((_b = b === null || b === void 0 ? void 0 : b.package) === null || _b === void 0 ? void 0 : _b.document)) {
            if (JSON.stringify((_c = a === null || a === void 0 ? void 0 : a.package) === null || _c === void 0 ? void 0 : _c.document) !== JSON.stringify((_d = b === null || b === void 0 ? void 0 : b.package) === null || _d === void 0 ? void 0 : _d.document)) {
                return false;
            }
        }
        // Also compare headers/footers (stored as Maps, use reference equality first)
        if (((_e = a === null || a === void 0 ? void 0 : a.package) === null || _e === void 0 ? void 0 : _e.headers) !== ((_f = b === null || b === void 0 ? void 0 : b.package) === null || _f === void 0 ? void 0 : _f.headers))
            return false;
        if (((_g = a === null || a === void 0 ? void 0 : a.package) === null || _g === void 0 ? void 0 : _g.footers) !== ((_h = b === null || b === void 0 ? void 0 : b.package) === null || _h === void 0 ? void 0 : _h.footers))
            return false;
        return true;
    }, []);
    return useHistory(document, Object.assign(Object.assign({}, options), { isEqual }));
}
// ============================================================================
// UTILITY EXPORTS
// ============================================================================
/**
 * Create a history manager for non-React usage
 */
export class HistoryManager {
    constructor(initialState, options = {}) {
        var _a, _b, _c;
        this.undoStack = [];
        this.redoStack = [];
        this.lastPushTime = 0;
        this.currentState = initialState;
        this.maxEntries = (_a = options.maxEntries) !== null && _a !== void 0 ? _a : 100;
        this.groupingInterval = (_b = options.groupingInterval) !== null && _b !== void 0 ? _b : 500;
        this.isEqual = (_c = options.isEqual) !== null && _c !== void 0 ? _c : defaultIsEqual;
    }
    get state() {
        return this.currentState;
    }
    get canUndo() {
        return this.undoStack.length > 0;
    }
    get canRedo() {
        return this.redoStack.length > 0;
    }
    push(newState, description) {
        if (this.isEqual(this.currentState, newState)) {
            return;
        }
        const now = Date.now();
        const timeSinceLastPush = now - this.lastPushTime;
        if (timeSinceLastPush < this.groupingInterval && this.undoStack.length > 0) {
            // Group with previous entry
            this.undoStack[this.undoStack.length - 1].timestamp = now;
        }
        else {
            // Push new entry
            this.undoStack.push({
                state: this.currentState,
                timestamp: now,
                description,
            });
            // Limit stack size
            if (this.undoStack.length > this.maxEntries) {
                this.undoStack = this.undoStack.slice(-this.maxEntries);
            }
        }
        // Clear redo stack
        this.redoStack = [];
        // Update state
        this.currentState = newState;
        this.lastPushTime = now;
    }
    undo() {
        if (this.undoStack.length === 0) {
            return undefined;
        }
        const prevEntry = this.undoStack.pop();
        this.redoStack.push({
            state: this.currentState,
            timestamp: Date.now(),
        });
        this.currentState = prevEntry.state;
        return prevEntry.state;
    }
    redo() {
        if (this.redoStack.length === 0) {
            return undefined;
        }
        const nextEntry = this.redoStack.pop();
        this.undoStack.push({
            state: this.currentState,
            timestamp: Date.now(),
        });
        this.currentState = nextEntry.state;
        return nextEntry.state;
    }
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
    reset(newInitialState) {
        this.currentState = newInitialState !== null && newInitialState !== void 0 ? newInitialState : this.currentState;
        this.undoStack = [];
        this.redoStack = [];
        this.lastPushTime = 0;
    }
}
export default useHistory;
//# sourceMappingURL=useHistory.js.map