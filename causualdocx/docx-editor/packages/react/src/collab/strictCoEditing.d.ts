/**
 * Strict / paragraph-lock co-editing (OnlyOffice "Strict" pattern).
 *
 * Opt-in collaboration mode: while another peer has their cursor inside a
 * block, that block is locked for the local user — they see it dimmed
 * with a lock badge and cannot edit it. This prevents two people
 * reflowing the same paragraph at once (and, on long documents, mitigates
 * the distant-concurrent-edit drift tracked in Phase B).
 *
 * It is a purely LOCAL policy: turning Strict mode on only constrains the
 * local user. The set of locked blocks is derived from peers' existing
 * cursor awareness (the same `cursor` field `yCursorPlugin` publishes), so
 * no new awareness channel is needed. Remote Yjs sync transactions are
 * never filtered — only local user edits are gated.
 *
 * The enforcement core (decorations + `filterTransaction`) is decoupled
 * from Yjs via an injected `getLocks(state)` reader, so it is unit-tested
 * with a plain schema and stub locks (the data-layer verification the
 * roadmap calls for; multi-peer UI e2e needs a live server). The
 * production reader lives in `peerLocksFromAwareness`.
 */
import { Plugin, PluginKey, type EditorState, type Transaction } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
/** A block locked by a peer, in current-document coordinates. */
export interface PeerLock {
    /** Block start position (before the node). */
    from: number;
    /** Block end position (after the node). */
    to: number;
    /** Peer display name, for the lock badge. */
    name: string;
    /** Peer presence colour (6-digit hex). */
    color: string;
    /** Yjs client id — stable key for the decoration. */
    clientId: number;
}
export interface StrictCoEditingOptions {
    /** Compute the peer-locked block ranges for the given state. Production
     *  reads peers' cursor awareness; tests inject fixed ranges. */
    getLocks: (state: EditorState) => PeerLock[];
    /** True when a transaction originates from a remote Yjs sync (those must
     *  never be blocked — they are peers' already-accepted edits). Defaults
     *  to "never remote" for unit tests. */
    isRemoteTransaction?: (tr: Transaction) => boolean;
    /** Subscribe to lock-source changes (peers moving their cursor) so the
     *  plugin can refresh decorations even without a document edit. Returns
     *  an unsubscribe fn. Production wires `awareness.on('change', …)`. */
    subscribeToLockChanges?: (refresh: () => void) => () => void;
    /** Whether Strict mode starts enabled. Default false (opt-in). */
    initiallyEnabled?: boolean;
}
interface StrictPluginState {
    enabled: boolean;
    locks: PeerLock[];
    decorations: DecorationSet;
}
export declare const strictCoEditingKey: PluginKey<StrictPluginState>;
/** Command: turn Strict co-editing on/off. */
export declare function setStrictCoEditing(enabled: boolean): (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;
/** Read whether Strict mode is currently enabled. */
export declare function isStrictCoEditingEnabled(state: EditorState): boolean;
/** Current peer locks (for UI / tests). */
export declare function peerLocks(state: EditorState): PeerLock[];
export declare function createStrictCoEditingPlugin(options: StrictCoEditingOptions): Plugin;
export {};
//# sourceMappingURL=strictCoEditing.d.ts.map