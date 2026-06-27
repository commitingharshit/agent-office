var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * CasualEditor — the composable SDK wrapper around DocxEditor.
 *
 * Bundles the four pieces a host app needs to embed the editor with
 * minimum ceremony:
 *
 *   1. DocxEditor (the editing surface)
 *   2. FileSource (bytes I/O — host's API or any FileSource impl)
 *   3. Optional collab (Yjs over WS) — opts in by passing backendUrl
 *   4. Optional autosave — opts in by passing autosave={true}
 *
 * Design intent — exposing the SDK shape for Drive integration:
 *
 *   <CasualEditor
 *     fileSource={driveFs}
 *     docId={fileId}
 *     backendUrl={enableCollab ? 'wss://...' : undefined}
 *     autosave
 *     user={{ name, color }}
 *   />
 *
 * Standalone mode (no `backendUrl`): the editor runs entirely
 * client-side, reading bytes from `fileSource.open(docId)`,
 * saving back via `fileSource.save(docId, bytes)`. No WS server,
 * no Yjs runtime — Drive deploys as one container.
 *
 * Collab mode (`backendUrl` set): Yjs sync over WS via the
 * library's `useCollab` hook. Initial load + final snapshot still
 * flow through FileSource; the WS only carries Y updates between
 * connected clients. Drive operator runs the Casual gateway as a
 * second container.
 *
 * Advanced consumers can still import the raw `DocxEditor` +
 * compose their own — this wrapper is a sensible-defaults
 * convenience, not a constraint.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { DocxEditor } from './DocxEditor';
import { createEmptyDocument } from '@eigenpal/docx-core/utils';
import { useCollab, makeFootnoteSync, makePropsSync, } from '../collab/useCollab';
import { commentsFromMap, observeComments, writeCommentsToMap } from '../collab/commentSync';
import { useFileSourceAutoSave, } from '../file-source/useFileSourceAutoSave';
import { SigningProvider, SigningPane } from '../signing';
export const CasualEditor = forwardRef(function CasualEditor(props, ref) {
    const { fileSource, docId, backendUrl, user, autosave = false, autosaveInterval = 30000, author, onSave, onSelectionChange, onError, onAutosaveState, onCollabState, renderLoading, renderError, signing, docxEditorProps, } = props;
    const editorRef = useRef(null);
    // ---------------------------------------------------------------
    // Document loading via FileSource
    // ---------------------------------------------------------------
    const [loadState, setLoadState] = useState({ kind: 'loading' });
    useEffect(() => {
        let cancelled = false;
        setLoadState({ kind: 'loading' });
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield fileSource.open(docId);
                if (cancelled)
                    return;
                setLoadState({ kind: 'ready', buffer: result.bytes, fileName: result.name });
            }
            catch (err) {
                if (cancelled)
                    return;
                setLoadState({ kind: 'error', err: err instanceof Error ? err : new Error(String(err)) });
            }
        }))();
        return () => {
            cancelled = true;
        };
    }, [fileSource, docId]);
    // ---------------------------------------------------------------
    // Collab — opt-in via backendUrl
    // ---------------------------------------------------------------
    // The hook MUST be called unconditionally to obey rules-of-hooks;
    // we pass sentinel values when collab is off and ignore the
    // returned plugins. The destructured plugins are an empty array
    // in standalone mode because we never wire them to DocxEditor.
    const collabState = useCollabSafe({
        enabled: !!backendUrl,
        backend: backendUrl !== null && backendUrl !== void 0 ? backendUrl : '',
        room: docId,
        user: user !== null && user !== void 0 ? user : { name: 'Anonymous', color: '#94a3b8' },
    });
    useEffect(() => {
        if (collabState && onCollabState)
            onCollabState(collabState);
    }, [collabState, onCollabState]);
    // Adapter so footnote edits ride the shared `footnotes` Y.Map (footnotes
    // aren't in the PM tree, so they don't travel over ySyncPlugin). Memoised on
    // collabState so the editor's observer subscribes once per session.
    const footnoteSync = useMemo(() => (collabState ? makeFootnoteSync(collabState.footnotesMap) : undefined), [collabState]);
    const endnoteSync = useMemo(() => (collabState ? makeFootnoteSync(collabState.endnotesMap) : undefined), [collabState]);
    const propsSync = useMemo(() => (collabState ? makePropsSync(collabState.propsMap) : undefined), [collabState]);
    // Comment threads ride a shared `comments` Y.Map (highlight marks sync via
    // ySyncPlugin, but the thread content doesn't). In collab we drive
    // DocxEditor's CONTROLLED comments from the map: observe → setState; the
    // editor's onCommentsChange reconciles back into the map (the observer is
    // the single source of truth, so local writes round-trip through it too).
    const [collabComments, setCollabComments] = useState([]);
    useEffect(() => {
        if (!collabState)
            return;
        const map = collabState.commentsMap;
        setCollabComments(commentsFromMap(map));
        return observeComments(map, setCollabComments);
    }, [collabState]);
    const handleCommentsChange = useCallback((next) => {
        if (collabState)
            writeCommentsToMap(collabState.commentsMap, next);
    }, [collabState]);
    // ---------------------------------------------------------------
    // Autosave — opt-in via autosave={true}
    // ---------------------------------------------------------------
    const autosaveState = useFileSourceAutoSave({
        fileSource,
        docId,
        editorRef,
        interval: autosaveInterval,
        enabled: autosave,
    });
    useEffect(() => {
        if (autosave && onAutosaveState)
            onAutosaveState(autosaveState);
    }, [autosave, autosaveState, onAutosaveState]);
    // ---------------------------------------------------------------
    // Ref forwarding
    // ---------------------------------------------------------------
    useImperativeHandle(ref, () => {
        const inner = editorRef.current;
        // Defensive: when the editor hasn't mounted yet, return a
        // surface that mostly no-ops so consumers don't have to
        // null-check every method.
        const safe = inner !== null && inner !== void 0 ? inner : noopDocxEditorRef();
        return Object.assign(Object.assign({}, safe), { flushSave: () => (autosave ? autosaveState.flush() : Promise.resolve()), collabPeers: () => (collabState ? collabState.peers : []), collabStatus: () => (collabState ? collabState.status : 'standalone') });
    }, [collabState, autosaveState, autosave]);
    // ---------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------
    if (loadState.kind === 'loading') {
        return _jsx(_Fragment, { children: renderLoading ? renderLoading() : _jsx(DefaultLoading, {}) });
    }
    if (loadState.kind === 'error') {
        return _jsx(_Fragment, { children: renderError ? renderError(loadState.err) : _jsx(DefaultError, { err: loadState.err }) });
    }
    const editor = (_jsx(DocxEditor, Object.assign({ ref: editorRef, documentBuffer: loadState.buffer, document: collabState ? blankDoc() : undefined, externalContent: !!collabState, externalPlugins: collabState ? collabState.plugins : undefined, footnoteSync: footnoteSync, endnoteSync: endnoteSync, propsSync: propsSync, comments: collabState ? collabComments : undefined, onCommentsChange: collabState ? handleCommentsChange : undefined, author: author, onSave: onSave, onSelectionChange: onSelectionChange, onError: onError }, docxEditorProps)));
    // Without an active signing session, return the editor alone.
    if (!signing)
        return editor;
    // With a signing session, wrap the editor in a SigningProvider
    // and render the SigningPane alongside. The provider captures
    // the current document bytes so the eventual `onComplete`
    // payload carries the right base buffer.
    return (_jsxs(SigningProvider, { session: signing, documentBytes: loadState.buffer, children: [editor, _jsx(SigningPane, { banner: signing.banner })] }));
});
// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
/**
 * useCollabSafe wraps useCollab so the hook only runs when collab
 * is enabled. We can't call hooks conditionally, so we return a
 * stable null and let the underlying hook short-circuit via a
 * sentinel `__collabDisabled` value passed when `enabled=false`.
 *
 * Implementation: when disabled, we DON'T call useCollab at all
 * (it'd open a WS) — we render the wrapper without collab. To
 * keep rules-of-hooks happy across mode changes the host MUST
 * keep `backendUrl` stable across the component's lifetime: either
 * provide it or don't, but don't flip mid-session. (We can't
 * enforce that at the type level; a host that swaps modes should
 * unmount + remount the wrapper.)
 */
function useCollabSafe(args) {
    if (!args.enabled) {
        // Hook order is fixed for the lifetime of the component — if
        // the caller flips backendUrl, React will throw a clearer error
        // than we could. This branch deliberately doesn't call useCollab.
        return null;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCollab({ backend: args.backend, room: args.room, user: args.user });
}
function blankDoc() {
    return createEmptyDocument();
}
function DefaultLoading() {
    return (_jsx("div", { style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            color: 'var(--doc-text-muted, #64748b)',
            fontSize: 14,
        }, children: "Loading\u2026" }));
}
function DefaultError({ err }) {
    return (_jsxs("div", { style: {
            padding: '32px 24px',
            color: 'rgb(153, 27, 27)',
            fontSize: 14,
        }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: 6 }, children: "Couldn\u2019t load the document" }), _jsx("div", { style: { color: 'var(--doc-text-muted, #64748b)' }, children: err.message })] }));
}
/**
 * Sentinel ref returned by useImperativeHandle before the
 * underlying DocxEditor has mounted. Each method is a no-op or
 * trivial default so a consumer that grabs `casualRef.current`
 * before first render doesn't crash.
 */
function noopDocxEditorRef() {
    const noop = () => {
        /* unmounted */
    };
    const noopAsync = () => Promise.resolve(null);
    return {
        getAgent: () => null,
        getDocument: () => null,
        getEditorRef: () => null,
        save: noopAsync,
        setZoom: noop,
        getZoom: () => 100,
        focus: noop,
        getCurrentPage: () => 1,
        getTotalPages: () => 1,
        scrollToPage: noop,
        scrollToParaId: () => false,
        scrollToPosition: noop,
        openPrintPreview: noop,
        print: noop,
        loadDocument: noop,
        loadDocumentBuffer: () => Promise.resolve(),
        addComment: () => null,
        replyToComment: () => null,
        resolveComment: noop,
        proposeChange: () => false,
        findInDocument: () => [],
        applyFormatting: () => false,
        setParagraphStyle: () => false,
        getPageContent: () => null,
    };
}
//# sourceMappingURL=CasualEditor.js.map