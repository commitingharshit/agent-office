/**
 * Production peer-lock reader for Strict co-editing.
 *
 * Derives the set of peer-locked blocks from the SAME cursor awareness
 * `yCursorPlugin` already publishes: for each remote peer with a cursor,
 * convert its (relative) head position to an absolute position in the
 * local document and lock the top-level block that contains it.
 *
 * Kept separate from `strictCoEditing.ts` so the enforcement core stays
 * free of the `yjs` / `y-prosemirror` dependency and can be unit-tested
 * with stub locks.
 */
import * as Y from 'yjs';
import { ySyncPluginKey, relativePositionToAbsolutePosition } from 'y-prosemirror';
const VALID_HEX = /^#[0-9a-fA-F]{6}$/;
function normalizeColor(color) {
    return color && VALID_HEX.test(color) ? color : '#888888';
}
/**
 * Build the `getLocks(state)` reader for `createStrictCoEditingPlugin`.
 * Returns [] until the ySync binding is ready, when no peers have cursors,
 * or for the local user's own cursor.
 */
export function peerLocksFromAwareness(awareness) {
    return (state) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ystate = ySyncPluginKey.getState(state);
        if (!(ystate === null || ystate === void 0 ? void 0 : ystate.binding) || ystate.binding.mapping.size === 0)
            return [];
        const ydoc = ystate.doc;
        const out = [];
        awareness.getStates().forEach((aw, clientId) => {
            var _a, _b, _c;
            if (clientId === ydoc.clientID)
                return; // skip self
            if (!aw.cursor)
                return;
            const head = relativePositionToAbsolutePosition(ydoc, ystate.type, Y.createRelativePositionFromJSON(aw.cursor.head), ystate.binding.mapping);
            if (head == null)
                return;
            const size = state.doc.content.size;
            const $pos = state.doc.resolve(Math.max(0, Math.min(head, size)));
            if ($pos.depth < 1)
                return; // not inside a block
            out.push({
                from: $pos.before(1),
                to: $pos.after(1),
                name: (_b = (_a = aw.user) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Someone',
                color: normalizeColor((_c = aw.user) === null || _c === void 0 ? void 0 : _c.color),
                clientId,
            });
        });
        return out;
    };
}
/** Subscribe helper: refresh locks whenever peers' awareness changes. */
export function subscribeAwareness(awareness) {
    return (refresh) => {
        awareness.on('change', refresh);
        return () => awareness.off('change', refresh);
    };
}
//# sourceMappingURL=peerLocks.js.map