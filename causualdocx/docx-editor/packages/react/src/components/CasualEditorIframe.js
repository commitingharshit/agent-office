var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * CasualEditorIframe — the iframe-mounting variant of `<CasualEditor>`.
 * Doc 16 §5 + §6.
 *
 * Public surface is intentionally identical to the existing
 * `<CasualEditor>` so v1.1's migration path is one component swap.
 * v1.2 will rename CasualEditorIframe → CasualEditor (and the
 * existing direct-mount component → CasualEditorDirect).
 */
import { forwardRef, useCallback, useEffect, useRef, } from 'react';
import { EmbedHostTransport } from '../embed/EmbedHostTransport';
const DEFAULT_STYLE = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
};
export const CasualEditorIframe = forwardRef(function CasualEditorIframe(props, ref) {
    const { fileSource, docId, viewMode = 'editor', embedBasePath = '/embed/docs', app = 'docs', onSelectionChanged, onTelemetry, onError, style, className, testId = 'casual-editor-iframe', } = props;
    const iframeRef = useRef(null);
    const transportRef = useRef(null);
    // Latest fileSource via ref so the load/save handlers don't
    // rebuild the transport on every consumer re-render.
    const fileSourceRef = useRef(fileSource);
    fileSourceRef.current = fileSource;
    const onLoad = useCallback((req) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { bytes, name, etag } = yield fileSourceRef.current.open(req.docId);
            return Object.assign({ ok: true, bytes, fileName: name }, (etag !== undefined ? { etag } : {}));
        }
        catch (err) {
            return {
                ok: false,
                code: 'open_failed',
                message: err instanceof Error ? err.message : String(err),
            };
        }
    }), []);
    const onSave = useCallback((req) => __awaiter(this, void 0, void 0, function* () {
        try {
            const opts = req.baseEtag !== undefined ? { etag: req.baseEtag } : undefined;
            const { etag } = yield fileSourceRef.current.save(req.docId, req.bytes, opts);
            return { ok: true, etag };
        }
        catch (err) {
            return {
                ok: false,
                code: 'save_failed',
                message: err instanceof Error ? err.message : String(err),
            };
        }
    }), []);
    // Wire the transport when the iframe fires `load`.
    const onIframeLoad = useCallback(() => {
        var _a;
        const iframe = iframeRef.current;
        if (!(iframe === null || iframe === void 0 ? void 0 : iframe.contentWindow))
            return;
        (_a = transportRef.current) === null || _a === void 0 ? void 0 : _a.destroy();
        const transport = new EmbedHostTransport({
            app,
            iframeWindow: iframe.contentWindow,
            embedOrigin: window.location.origin,
        });
        transport.on(Object.assign(Object.assign(Object.assign(Object.assign({ onLoadRequest: onLoad, onSaveRequest: onSave }, (onSelectionChanged ? { onSelectionChanged } : {})), (onTelemetry ? { onTelemetry } : {})), (onError ? { onError } : {})), { onEditorReady: () => {
                transport.sendHostHello({ capabilities: ['load', 'save'] });
                transport.sendSetViewMode({ viewMode });
            } }));
        transportRef.current = transport;
    }, [app, onLoad, onSave, onSelectionChanged, onTelemetry, onError, viewMode]);
    // Push viewMode changes through the wire instead of re-mounting.
    useEffect(() => {
        var _a;
        (_a = transportRef.current) === null || _a === void 0 ? void 0 : _a.sendSetViewMode({ viewMode });
    }, [viewMode]);
    // Tear-down on unmount.
    useEffect(() => {
        return () => {
            var _a;
            (_a = transportRef.current) === null || _a === void 0 ? void 0 : _a.destroy();
            transportRef.current = null;
        };
    }, []);
    // Imperative ref API.
    if (ref) {
        const apiRef = ref;
        apiRef.current = {
            setViewMode: (mode) => { var _a; return (_a = transportRef.current) === null || _a === void 0 ? void 0 : _a.sendSetViewMode({ viewMode: mode }); },
            iframe: () => iframeRef.current,
        };
    }
    const url = `${embedBasePath}/embed.html` +
        `?app=${app}` +
        `&docId=${encodeURIComponent(docId)}` +
        `&viewMode=${viewMode}`;
    return (_jsx("iframe", { ref: iframeRef, src: url, onLoad: onIframeLoad, title: "Casual Editor", sandbox: "allow-scripts allow-same-origin allow-downloads allow-modals", style: Object.assign(Object.assign({}, DEFAULT_STYLE), style), className: className, "data-testid": testId }));
});
//# sourceMappingURL=CasualEditorIframe.js.map