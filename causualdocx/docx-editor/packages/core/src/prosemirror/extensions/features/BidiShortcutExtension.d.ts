/**
 * Bidi Shortcut Extension — Ctrl/Cmd+Left Shift → LTR, Ctrl/Cmd+Right Shift → RTL
 *
 * Uses KeyboardEvent.code to distinguish ShiftLeft vs ShiftRight,
 * matching the standard Google Docs shortcut behavior.
 *
 * Priority: High (50) — should intercept before other keymaps
 */
export declare const BidiShortcutExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=BidiShortcutExtension.d.ts.map