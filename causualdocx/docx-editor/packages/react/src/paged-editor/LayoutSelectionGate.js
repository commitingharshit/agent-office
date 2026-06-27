/**
 * Layout Selection Gate
 *
 * Guards selection rendering until layout is up-to-date.
 * Uses sequenced versioning to prevent stale cursor positions.
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LayoutSelectionGate_instances, _LayoutSelectionGate_stateSeq, _LayoutSelectionGate_renderSeq, _LayoutSelectionGate_layoutUpdating, _LayoutSelectionGate_pendingRender, _LayoutSelectionGate_renderCallbacks, _LayoutSelectionGate_tryRender, _LayoutSelectionGate_executeRender;
/**
 * LayoutSelectionGate coordinates the timing between document edits and
 * layout reflow so that selection overlays are only painted against
 * current DOM geometry.
 *
 * Workflow:
 * 1. Document changes → setStateSeq(++seq)
 * 2. Layout starts → onLayoutStart()
 * 3. Layout completes → onLayoutComplete(seq)
 * 4. Selection update requested → requestRender()
 * 5. If safe → callback is called
 */
export class LayoutSelectionGate {
    constructor() {
        _LayoutSelectionGate_instances.add(this);
        /** Current document state sequence */
        _LayoutSelectionGate_stateSeq.set(this, 0);
        /** Last painted layout sequence */
        _LayoutSelectionGate_renderSeq.set(this, 0);
        /** Whether layout is currently being computed/painted */
        _LayoutSelectionGate_layoutUpdating.set(this, false);
        /** Pending render callback */
        _LayoutSelectionGate_pendingRender.set(this, null);
        /** Registered render callbacks */
        _LayoutSelectionGate_renderCallbacks.set(this, new Set());
    }
    /**
     * Set the document state sequence (call when document changes).
     * This should be called on every ProseMirror transaction that changes the doc.
     */
    setStateSeq(seq) {
        __classPrivateFieldSet(this, _LayoutSelectionGate_stateSeq, seq, "f");
    }
    /**
     * Increment document state sequence (convenience method).
     * Returns the new sequence value.
     */
    incrementStateSeq() {
        var _a;
        return __classPrivateFieldSet(this, _LayoutSelectionGate_stateSeq, (_a = __classPrivateFieldGet(this, _LayoutSelectionGate_stateSeq, "f"), ++_a), "f");
    }
    /**
     * Get current document state sequence.
     */
    getStateSeq() {
        return __classPrivateFieldGet(this, _LayoutSelectionGate_stateSeq, "f");
    }
    /**
     * Get current layout render sequence.
     */
    getRenderSeq() {
        return __classPrivateFieldGet(this, _LayoutSelectionGate_renderSeq, "f");
    }
    /**
     * Called when layout computation starts.
     */
    onLayoutStart() {
        __classPrivateFieldSet(this, _LayoutSelectionGate_layoutUpdating, true, "f");
    }
    /**
     * Called when layout computation and DOM painting completes.
     * @param seq - The document state sequence that was just painted
     */
    onLayoutComplete(seq) {
        __classPrivateFieldSet(this, _LayoutSelectionGate_renderSeq, seq, "f");
        __classPrivateFieldSet(this, _LayoutSelectionGate_layoutUpdating, false, "f");
        // If there's a pending render and it's now safe, execute it
        __classPrivateFieldGet(this, _LayoutSelectionGate_instances, "m", _LayoutSelectionGate_tryRender).call(this);
    }
    /**
     * Check if it's safe to render selection.
     * Safe when: layout is not updating AND render sequence >= state sequence
     */
    isSafeToRender() {
        return !__classPrivateFieldGet(this, _LayoutSelectionGate_layoutUpdating, "f") && __classPrivateFieldGet(this, _LayoutSelectionGate_renderSeq, "f") >= __classPrivateFieldGet(this, _LayoutSelectionGate_stateSeq, "f");
    }
    /**
     * Request a selection render. Will be executed when safe.
     * If already safe, executes immediately.
     */
    requestRender() {
        if (this.isSafeToRender()) {
            __classPrivateFieldGet(this, _LayoutSelectionGate_instances, "m", _LayoutSelectionGate_executeRender).call(this);
        }
        else {
            // Mark that we have a pending render
            __classPrivateFieldSet(this, _LayoutSelectionGate_pendingRender, () => __classPrivateFieldGet(this, _LayoutSelectionGate_instances, "m", _LayoutSelectionGate_executeRender).call(this), "f");
        }
    }
    /**
     * Register a callback to be called on render events.
     */
    onRender(callback) {
        __classPrivateFieldGet(this, _LayoutSelectionGate_renderCallbacks, "f").add(callback);
        return () => {
            __classPrivateFieldGet(this, _LayoutSelectionGate_renderCallbacks, "f").delete(callback);
        };
    }
    /**
     * Reset the gate state (useful for testing or document reload).
     */
    reset() {
        __classPrivateFieldSet(this, _LayoutSelectionGate_stateSeq, 0, "f");
        __classPrivateFieldSet(this, _LayoutSelectionGate_renderSeq, 0, "f");
        __classPrivateFieldSet(this, _LayoutSelectionGate_layoutUpdating, false, "f");
        __classPrivateFieldSet(this, _LayoutSelectionGate_pendingRender, null, "f");
    }
    /**
     * Get debug info about current state.
     */
    getDebugInfo() {
        return {
            stateSeq: __classPrivateFieldGet(this, _LayoutSelectionGate_stateSeq, "f"),
            renderSeq: __classPrivateFieldGet(this, _LayoutSelectionGate_renderSeq, "f"),
            layoutUpdating: __classPrivateFieldGet(this, _LayoutSelectionGate_layoutUpdating, "f"),
            hasPendingRender: __classPrivateFieldGet(this, _LayoutSelectionGate_pendingRender, "f") !== null,
            isSafe: this.isSafeToRender(),
        };
    }
}
_LayoutSelectionGate_stateSeq = new WeakMap(), _LayoutSelectionGate_renderSeq = new WeakMap(), _LayoutSelectionGate_layoutUpdating = new WeakMap(), _LayoutSelectionGate_pendingRender = new WeakMap(), _LayoutSelectionGate_renderCallbacks = new WeakMap(), _LayoutSelectionGate_instances = new WeakSet(), _LayoutSelectionGate_tryRender = function _LayoutSelectionGate_tryRender() {
    if (__classPrivateFieldGet(this, _LayoutSelectionGate_pendingRender, "f") && this.isSafeToRender()) {
        const render = __classPrivateFieldGet(this, _LayoutSelectionGate_pendingRender, "f");
        __classPrivateFieldSet(this, _LayoutSelectionGate_pendingRender, null, "f");
        render();
    }
}, _LayoutSelectionGate_executeRender = function _LayoutSelectionGate_executeRender() {
    for (const callback of __classPrivateFieldGet(this, _LayoutSelectionGate_renderCallbacks, "f")) {
        try {
            callback();
        }
        catch (error) {
            console.error('LayoutSelectionGate: render callback error', error);
        }
    }
};
//# sourceMappingURL=LayoutSelectionGate.js.map