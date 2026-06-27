/**
 * Subscribable Base Class
 *
 * Framework-agnostic base for manager classes that need to notify
 * UI frameworks of state changes.
 *
 * Compatible with:
 * - React: useSyncExternalStore(manager.subscribe, manager.getSnapshot)
 * - Vue: watchEffect(() => { manager.subscribe(triggerRef) })
 */
export class Subscribable {
    constructor(initialSnapshot) {
        this.listeners = new Set();
        /**
         * Subscribe to state changes. Returns an unsubscribe function.
         * Bound method — safe to pass as `useSyncExternalStore(manager.subscribe, ...)`.
         */
        this.subscribe = (listener) => {
            this.listeners.add(listener);
            return () => {
                this.listeners.delete(listener);
            };
        };
        /**
         * Get the current snapshot. Returns a stable reference unless state has changed.
         * Bound method — safe to pass as `useSyncExternalStore(..., manager.getSnapshot)`.
         */
        this.getSnapshot = () => {
            return this.snapshot;
        };
        this.snapshot = initialSnapshot;
    }
    /**
     * Update the snapshot and notify all subscribers.
     * Subclasses should call this whenever their state changes.
     */
    setSnapshot(snapshot) {
        this.snapshot = snapshot;
        this.notify();
    }
    notify() {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
//# sourceMappingURL=Subscribable.js.map