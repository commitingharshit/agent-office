/**
 * useCollab — bridges a Yjs Y.Doc + HocuspocusProvider into the
 * DocxEditor via `externalPlugins` + `externalContent`.
 *
 * Opt-in. The host imports this hook only when collab is wanted;
 * `yjs`, `@hocuspocus/provider`, and `y-prosemirror` are optional
 * peer dependencies so SDK consumers who don't enable collab don't
 * pay the bundle weight.
 *
 * Wire shape: the shared CasualOffice `collab` server (Hocuspocus +
 * Yjs) holds one authoritative Y.Doc per room — so a fresh peer syncs
 * from server state and the server can snapshot/version on its own.
 * `ySyncPlugin` populates ProseMirror from the shared Y state;
 * `yCursorPlugin` renders remote cursors from awareness; `yUndoPlugin`
 * scopes undo to the local user.
 *
 * Lifecycle:
 *   - First call constructs Y.Doc + provider + plugins.
 *   - Provider opens a WS to `backend` and joins room `name`.
 *   - When peers' awareness picks up users, remote cursors light up.
 *   - On unmount, provider is destroyed and the Y.Doc closed.
 */
import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, ySyncPluginKey } from 'y-prosemirror';
import { createStrictCoEditingPlugin } from './strictCoEditing';
import { peerLocksFromAwareness, subscribeAwareness } from './peerLocks';
/**
 * Build a {@link FootnoteSync} over a `footnotes` Y.Map. `set` writes the new
 * text (which Yjs syncs to peers); `observe` fires the callback for every
 * changed key — local AND remote — so each peer applies edits to its own model
 * uniformly. Pure of React so it can be unit-tested with two synced Y.Docs.
 */
export function makeFootnoteSync(map) {
    return {
        set: (id, text) => map.set(String(id), text),
        observe: (cb) => {
            const handler = (event) => {
                event.changes.keys.forEach((_change, key) => {
                    const text = map.get(key);
                    if (text !== undefined)
                        cb(Number(key), text);
                });
            };
            map.observe(handler);
            return () => map.unobserve(handler);
        },
    };
}
/** Build a {@link PropsSync} over a `props` Y.Map (one entry per field). */
export function makePropsSync(map) {
    return {
        set: (edits) => {
            const doc = map.doc;
            const apply = () => {
                for (const [k, v] of Object.entries(edits))
                    map.set(k, v);
            };
            if (doc)
                doc.transact(apply);
            else
                apply();
        },
        observe: (cb) => {
            const handler = () => {
                const obj = {};
                map.forEach((v, k) => {
                    obj[k] = v;
                });
                cb(obj);
            };
            map.observe(handler);
            return () => map.unobserve(handler);
        },
    };
}
/**
 * Hook returning the plugin array + live status for a collab
 * session. Caller should pass `externalContent={true}` to
 * DocxEditor alongside the returned plugins so the editor's own
 * loader doesn't overwrite the Yjs-populated PM state.
 */
export function useCollab({ room, backend, user, token }) {
    const { ydoc, provider, plugins, metaMap, footnotesMap, endnotesMap, propsMap, commentsMap } = useMemo(() => {
        const ydoc = new Y.Doc();
        // Hocuspocus carries the document name in the handshake (`name`),
        // not the URL path — so `backend` is the bare ws endpoint. A
        // truthy token lets the handshake complete past an onAuthenticate
        // hook even for anonymous sessions.
        const provider = new HocuspocusProvider({
            url: backend,
            name: room,
            document: ydoc,
            token: token !== null && token !== void 0 ? token : 'anon',
        });
        const fragment = ydoc.getXmlFragment('prosemirror');
        // Hocuspocus creates awareness by default; guard the type union so
        // the cursor plugin is only wired when it's actually present.
        const awareness = provider.awareness;
        const plugins = [
            ySyncPlugin(fragment),
            ...(awareness
                ? [
                    yCursorPlugin(awareness),
                    // Strict / paragraph-lock co-editing (opt-in; off by default).
                    // Locks are derived from peers' cursor awareness; only LOCAL
                    // edits are gated — remote Yjs sync transactions pass through.
                    createStrictCoEditingPlugin({
                        getLocks: peerLocksFromAwareness(awareness),
                        subscribeToLockChanges: subscribeAwareness(awareness),
                        isRemoteTransaction: (tr) => tr.getMeta(ySyncPluginKey) != null,
                    }),
                ]
                : []),
            yUndoPlugin(),
        ];
        const metaMap = ydoc.getMap('meta');
        // Footnote text edits don't live in the ProseMirror document (footnotes are
        // a separate part of the .docx), so they don't travel over ySyncPlugin.
        // A dedicated shared map in the SAME Y.Doc gives them the same realtime
        // sync + offline resilience as the body content. Keyed by footnote id
        // (string) → current plain text.
        const footnotesMap = ydoc.getMap('footnotes');
        const endnotesMap = ydoc.getMap('endnotes');
        // Core document properties (title / subject / creator / keywords /
        // description) edited via File → Properties. Not in the PM tree; keyed by
        // field name → value so two peers editing different fields merge.
        const propsMap = ydoc.getMap('props');
        // Comment threads (text / replies / resolved) live in React state, not the
        // PM tree, so the highlight marks sync but the thread content wouldn't.
        // A shared map keyed by comment id (string) → Comment JSON gives them the
        // same realtime sync. Replies are separate Comment entries (parentId).
        const commentsMap = ydoc.getMap('comments');
        return { ydoc, provider, plugins, metaMap, footnotesMap, endnotesMap, propsMap, commentsMap };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room, backend, token]);
    const [status, setStatus] = useState('connecting');
    const [peers, setPeers] = useState([]);
    // Publish local-user identity into awareness so peers can render
    // avatars + remote cursors. Re-runs on rename / recolor without
    // rebuilding the doc.
    useEffect(() => {
        var _a;
        (_a = provider.awareness) === null || _a === void 0 ? void 0 : _a.setLocalStateField('user', user);
    }, [provider, user.name, user.color]);
    useEffect(() => {
        const awareness = provider.awareness;
        if (!awareness)
            return;
        const refreshPeers = () => {
            const localId = awareness.clientID;
            const out = [];
            awareness.getStates().forEach((state, clientId) => {
                var _a, _b;
                if (!state.user)
                    return;
                out.push({
                    clientId,
                    name: (_a = state.user.name) !== null && _a !== void 0 ? _a : 'Anonymous',
                    color: (_b = state.user.color) !== null && _b !== void 0 ? _b : '#94a3b8',
                    isLocal: clientId === localId,
                });
            });
            // Local user always first in the list — keeps the UI stable
            // when peers come and go.
            out.sort((a, b) => (a.isLocal === b.isLocal ? a.clientId - b.clientId : a.isLocal ? -1 : 1));
            setPeers(out);
        };
        const onStatus = (e) => setStatus(e.status);
        provider.on('status', onStatus);
        awareness.on('change', refreshPeers);
        refreshPeers();
        return () => {
            provider.off('status', onStatus);
            awareness.off('change', refreshPeers);
        };
    }, [provider]);
    // Tear down provider + Y.Doc when the hook unmounts. Provider
    // destruction closes the WS and frees the awareness listeners.
    useEffect(() => {
        return () => {
            provider.destroy();
            ydoc.destroy();
        };
    }, [provider, ydoc]);
    return {
        plugins,
        status,
        peers,
        awareness: provider.awareness,
        metaMap,
        footnotesMap,
        endnotesMap,
        propsMap,
        commentsMap,
    };
}
//# sourceMappingURL=useCollab.js.map