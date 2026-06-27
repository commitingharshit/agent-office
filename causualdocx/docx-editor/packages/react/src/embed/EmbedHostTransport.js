/**
 * EmbedHostTransport — the parent side of the embed iframe bridge.
 *
 * Counterpart to `EmbedTransport` (which lives inside the embedded
 * editor). The CasualEditor wrapper constructs one per iframe mount;
 * it forwards postMessage envelopes to / from the editor and turns
 * editor-side requests (`casual.file.load.request`, `save.request`,
 * `selection.changed`, …) into host-side callbacks.
 *
 * Wire shape: `docs/internal/13-iframe-protocol.md` +
 * `docs/internal/16-sdk-iframe-architecture.md` §7.
 *
 * Lifetime: constructed once when the wrapper mounts the iframe.
 * `destroy()` removes the event listener; safe to call multiple times.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isCasualEnvelope, } from './protocol';
export class EmbedHostTransport {
    constructor(opts) {
        var _a;
        this.handlers = {};
        this.destroyed = false;
        this.opts = opts;
        this.boundOnMessage = this.onMessage.bind(this);
        const target = (_a = opts.hostWindow) !== null && _a !== void 0 ? _a : window;
        target.addEventListener('message', this.boundOnMessage);
    }
    on(handlers) {
        this.handlers = Object.assign(Object.assign({}, this.handlers), handlers);
    }
    destroy() {
        var _a;
        if (this.destroyed)
            return;
        this.destroyed = true;
        const target = (_a = this.opts.hostWindow) !== null && _a !== void 0 ? _a : window;
        target.removeEventListener('message', this.boundOnMessage);
    }
    // ─── outbound (host → editor) ───────────────────────────────────────
    /** Initial handshake. Send right after the iframe fires `load`. */
    sendHostHello(data) {
        this.post('casual.hello', data);
    }
    /** Tell the editor to switch chrome density without re-mounting. */
    sendSetViewMode(data) {
        this.post('casual.command.set.viewmode', data);
    }
    sendSetReadOnly(data) {
        this.post('casual.command.set.readonly', data);
    }
    sendSetTheme(data) {
        this.post('casual.command.set.theme', data);
    }
    sendSetLocale(data) {
        this.post('casual.command.set.locale', data);
    }
    sendCommandSave() {
        this.post('casual.command.save', null);
    }
    sendCommandFocus() {
        this.post('casual.command.focus', null);
    }
    /** Open a signing session inside the embedded editor. */
    sendSignatureRequest(id, data) {
        this.post('casual.signature.request', data, id);
    }
    /** Cancel a signing session from the host side. */
    sendSignatureCancel(data) {
        this.post('casual.signature.cancel', data);
    }
    // ─── inbound dispatch ───────────────────────────────────────────────
    onMessage(ev) {
        if (this.destroyed)
            return;
        // Origin gate first — drop anything not from the embed.
        if (ev.origin !== this.opts.embedOrigin)
            return;
        // Source gate — only accept messages from THIS iframe's window.
        if (ev.source !== this.opts.iframeWindow)
            return;
        if (!isCasualEnvelope(ev.data))
            return;
        if (ev.data.app !== this.opts.app)
            return;
        void this.dispatch(ev.data);
    }
    dispatch(env) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            switch (env.type) {
                case 'casual.ready':
                    (_b = (_a = this.handlers).onEditorReady) === null || _b === void 0 ? void 0 : _b.call(_a, env.data);
                    return;
                case 'casual.load.request': {
                    if (!this.handlers.onLoadRequest)
                        return;
                    const id = (_c = env.id) !== null && _c !== void 0 ? _c : '';
                    try {
                        const resp = yield this.handlers.onLoadRequest(env.data);
                        // Transfer the ArrayBuffer so the structuredClone is cheap.
                        const transfer = resp.ok ? [resp.bytes] : [];
                        this.post('casual.load.response', resp, id, transfer);
                    }
                    catch (err) {
                        this.post('casual.load.response', {
                            ok: false,
                            code: 'host_error',
                            message: err instanceof Error ? err.message : String(err),
                        }, id);
                    }
                    return;
                }
                case 'casual.save.request': {
                    if (!this.handlers.onSaveRequest)
                        return;
                    const id = (_d = env.id) !== null && _d !== void 0 ? _d : '';
                    try {
                        const resp = yield this.handlers.onSaveRequest(env.data);
                        this.post('casual.save.response', resp, id);
                    }
                    catch (err) {
                        this.post('casual.save.response', {
                            ok: false,
                            code: 'host_error',
                            message: err instanceof Error ? err.message : String(err),
                        }, id);
                    }
                    return;
                }
                case 'casual.selection.changed':
                    (_f = (_e = this.handlers).onSelectionChanged) === null || _f === void 0 ? void 0 : _f.call(_e, env.data);
                    return;
                case 'casual.telemetry.event':
                    (_h = (_g = this.handlers).onTelemetry) === null || _h === void 0 ? void 0 : _h.call(_g, env.data);
                    return;
                case 'casual.signature.field.signed':
                    (_k = (_j = this.handlers).onSignatureFieldSigned) === null || _k === void 0 ? void 0 : _k.call(_j, env.data);
                    return;
                case 'casual.signature.complete':
                    (_m = (_l = this.handlers).onSignatureComplete) === null || _m === void 0 ? void 0 : _m.call(_l, env.data);
                    return;
                case 'casual.signature.cancel':
                    (_p = (_o = this.handlers).onSignatureCancel) === null || _p === void 0 ? void 0 : _p.call(_o, env.data);
                    return;
                case 'casual.signature.request.ack':
                    // Acknowledgement of the host's signature.request — fire-and-forget
                    // for now. Could be exposed if hosts want to know the editor
                    // accepted the session.
                    return;
                case 'casual.error':
                    (_r = (_q = this.handlers).onError) === null || _r === void 0 ? void 0 : _r.call(_q, env.data);
                    return;
                default:
                    // Forward-compat: unknown casual.* envelopes are silently dropped.
                    return;
            }
        });
    }
    post(type, data, id, transfer) {
        const env = Object.assign({ type, app: this.opts.app, v: 1, data }, (id ? { id } : {}));
        const send = this.opts.iframeWindow.postMessage.bind(this.opts.iframeWindow);
        send(env, this.opts.embedOrigin, transfer);
    }
}
//# sourceMappingURL=EmbedHostTransport.js.map