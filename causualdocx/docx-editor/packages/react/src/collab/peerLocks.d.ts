import type { EditorState } from 'prosemirror-state';
import type { PeerLock } from './strictCoEditing';
/** Minimal structural view of a Yjs Awareness — avoids a hard type import. */
interface AwarenessLike {
    getStates(): Map<number, {
        cursor?: {
            head: unknown;
        };
        user?: {
            name?: string;
            color?: string;
        };
    }>;
    on(event: 'change', cb: () => void): void;
    off(event: 'change', cb: () => void): void;
}
/**
 * Build the `getLocks(state)` reader for `createStrictCoEditingPlugin`.
 * Returns [] until the ySync binding is ready, when no peers have cursors,
 * or for the local user's own cursor.
 */
export declare function peerLocksFromAwareness(awareness: AwarenessLike): (state: EditorState) => PeerLock[];
/** Subscribe helper: refresh locks whenever peers' awareness changes. */
export declare function subscribeAwareness(awareness: AwarenessLike): (refresh: () => void) => (() => void);
export {};
//# sourceMappingURL=peerLocks.d.ts.map