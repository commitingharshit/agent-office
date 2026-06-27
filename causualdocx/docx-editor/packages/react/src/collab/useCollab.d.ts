import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import type { Plugin } from 'prosemirror-state';
export type CollabStatus = 'connecting' | 'connected' | 'disconnected';
export interface CollabPeer {
    /** y-prosemirror's awareness clientID (uint32). */
    clientId: number;
    name: string;
    color: string;
    /** True for the local user's own awareness entry. */
    isLocal: boolean;
}
export interface CollabState {
    /** Pass to <DocxEditor externalPlugins={...} />. */
    plugins: Plugin[];
    /** Connection state from the Yjs provider. */
    status: CollabStatus;
    /** Live snapshot of who's connected, including the local user. */
    peers: CollabPeer[];
    /** The Yjs awareness instance — exposed for advanced consumers. */
    awareness: HocuspocusProvider['awareness'];
    /**
     * Shared document metadata. Lives in the same Y.Doc as the
     * editor content so it travels over the same WS, with the same
     * offline-resilience and conflict-resolution guarantees — no
     * extra channel to keep in sync.
     *
     * Keys today:
     *   - `fileName: string` — document name shown in the title bar.
     *
     * Hosts read via `metaMap.get('fileName')` and observe via
     * `metaMap.observe(...)`. To rename, set the key from any peer;
     * Yjs propagates to all others.
     */
    metaMap: Y.Map<unknown>;
    /**
     * Shared footnote-text edits (footnote id → plain text), in the same Y.Doc
     * as the body. Footnotes aren't in the ProseMirror tree, so this is how
     * footnote edits sync across peers. Hosts pass a small adapter built from
     * this map to `<DocxEditor footnoteSync={...} />`.
     */
    footnotesMap: Y.Map<string>;
    /** Shared endnote-text edits (endnote id → plain text). Mirror of footnotes. */
    endnotesMap: Y.Map<string>;
    /** Shared core document properties (field name → value), File → Properties. */
    propsMap: Y.Map<string>;
    /**
     * Shared comment threads (comment id → Comment JSON), in the same Y.Doc as
     * the body. Comment highlight marks ride ySyncPlugin, but the thread content
     * doesn't — this map carries it. Hosts wire it to DocxEditor's controlled
     * `comments` + `onCommentsChange` via the helpers in `collab/commentSync`.
     */
    commentsMap: Y.Map<unknown>;
}
/** A transport for footnote-text edits (id → text), backed by a shared map. */
export interface FootnoteSync {
    set: (id: number, text: string) => void;
    observe: (cb: (id: number, text: string) => void) => () => void;
}
/**
 * Build a {@link FootnoteSync} over a `footnotes` Y.Map. `set` writes the new
 * text (which Yjs syncs to peers); `observe` fires the callback for every
 * changed key — local AND remote — so each peer applies edits to its own model
 * uniformly. Pure of React so it can be unit-tested with two synced Y.Docs.
 */
export declare function makeFootnoteSync(map: Y.Map<string>): FootnoteSync;
/** Transport for document-properties edits (field → value). */
export interface PropsSync {
    set: (edits: Record<string, string>) => void;
    observe: (cb: (props: Record<string, string>) => void) => () => void;
}
/** Build a {@link PropsSync} over a `props` Y.Map (one entry per field). */
export declare function makePropsSync(map: Y.Map<string>): PropsSync;
export interface UseCollabOptions {
    /** Per-doc room identifier — typically the docID. */
    room: string;
    /** Base ws:// or wss:// URL of the collab server (Hocuspocus).
     *  Unlike the old y-websocket gateway, the room name travels in the
     *  Hocuspocus handshake, so this is the bare endpoint with no path. */
    backend: string;
    /** Local user metadata published over awareness. */
    user: {
        name: string;
        color: string;
    };
    /** Optional auth token for the server's onAuthenticate hook.
     *  Defaults to a truthy placeholder so the handshake completes even
     *  when the server gates joins by role. */
    token?: string;
}
/**
 * Hook returning the plugin array + live status for a collab
 * session. Caller should pass `externalContent={true}` to
 * DocxEditor alongside the returned plugins so the editor's own
 * loader doesn't overwrite the Yjs-populated PM state.
 */
export declare function useCollab({ room, backend, user, token }: UseCollabOptions): CollabState;
//# sourceMappingURL=useCollab.d.ts.map