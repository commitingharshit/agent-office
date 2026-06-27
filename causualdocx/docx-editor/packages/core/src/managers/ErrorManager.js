/**
 * ErrorManager
 *
 * Framework-agnostic pub/sub error notification system.
 * Replaces React's `componentDidCatch` + context pattern for error notifications.
 *
 * Usage with React:
 * ```ts
 * const { notifications } = useSyncExternalStore(manager.subscribe, manager.getSnapshot);
 * ```
 */
import { Subscribable } from './Subscribable';
export class ErrorManager extends Subscribable {
    constructor() {
        super({ notifications: [] });
        this.notifications = [];
        this.idCounter = 0;
        this.timers = new Set();
    }
    /** Show an error notification (persistent, not auto-dismissed). */
    showError(message, details) {
        return this.addNotification(message, 'error', details);
    }
    /** Show a warning notification (auto-dismissed after 5s). */
    showWarning(message, details) {
        return this.addNotification(message, 'warning', details);
    }
    /** Show an info notification (auto-dismissed after 5s). */
    showInfo(message, details) {
        return this.addNotification(message, 'info', details);
    }
    /** Dismiss a notification by ID. */
    dismiss(id) {
        this.notifications = this.notifications.map((n) => n.id === id ? Object.assign(Object.assign({}, n), { dismissed: true }) : n);
        this.emitSnapshot();
        // Remove from list after animation delay
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            this.notifications = this.notifications.filter((n) => n.id !== id);
            this.emitSnapshot();
        }, 300);
        this.timers.add(timer);
    }
    /** Clear all notifications and cancel pending timers. */
    clearAll() {
        this.notifications = [];
        for (const timer of this.timers)
            clearTimeout(timer);
        this.timers.clear();
        this.emitSnapshot();
    }
    /** Destroy the manager and clean up all timers. */
    destroy() {
        for (const timer of this.timers)
            clearTimeout(timer);
        this.timers.clear();
        this.notifications = [];
    }
    // --------------------------------------------------------------------------
    // PRIVATE
    // --------------------------------------------------------------------------
    addNotification(message, severity, details) {
        const id = `error-${++this.idCounter}-${Date.now()}`;
        const notification = {
            id,
            message,
            severity,
            details,
            timestamp: Date.now(),
        };
        this.notifications = [...this.notifications, notification];
        this.emitSnapshot();
        // Auto-dismiss after 5 seconds for info/warning
        if (severity !== 'error') {
            const timer = setTimeout(() => {
                this.timers.delete(timer);
                this.dismiss(id);
            }, 5000);
            this.timers.add(timer);
        }
        return id;
    }
    emitSnapshot() {
        this.setSnapshot({ notifications: this.notifications });
    }
}
//# sourceMappingURL=ErrorManager.js.map