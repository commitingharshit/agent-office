/**
 * EmbedTransport — postMessage bridge for the iframe-embedded
 * editor. Validates origin, dispatches envelopes to handlers,
 * sends responses back to the host. Pure TypeScript — no React.
 *
 * Wire shape defined in
 * `docs/internal/13-iframe-protocol.md` + `./protocol.ts`.
 *
 * Lifetime: constructed once when the /embed page mounts.
 * Destroyed when the page unloads. Concurrent calls into the same
 * handler are the host's responsibility (well-behaved hosts
 * serialise requests by id).
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
export class EmbedTransport {
    constructor(opts) {
        var _a, _b;
        this.handlers = {};
        this.destroyed = false;
        this.pendingRequests = new Map();
        this.opts = Object.assign(Object.assign({}, opts), { parentWindow: (_a = opts.parentWindow) !== null && _a !== void 0 ? _a : (typeof window !== 'undefined'
                ? window.parent
                : { postMessage: () => undefined }), hostWindow: (_b = opts.hostWindow) !== null && _b !== void 0 ? _b : (typeof window !== 'undefined'
                ? window
                : {
                    addEventListener: () => undefined,
                    removeEventListener: () => undefined,
                }) });
        this.boundMessage = this.boundMessage.bind(this);
        this.opts.hostWindow.addEventListener('message', this.boundMessage);
    }
    /** Replaces the handler set. Idempotent — call multiple times. */
    on(handlers) {
        this.handlers = Object.assign(Object.assign({}, this.handlers), handlers);
    }
    /** Editor → Host: announce ourselves. Call once after handlers are wired. */
    sendHello() {
        const data = {
            capabilities: this.opts.capabilities,
            version: this.opts.version,
            commit: this.opts.commit,
        };
        this.post('casual.hello', data);
    }
    /** Editor → Host: editor is ready to receive commands. */
    sendReady() {
        this.post('casual.ready', {});
    }
    /** Editor → Host: ask the host to supply document bytes for `docId`. */
    requestLoad(docId_1) {
        return __awaiter(this, arguments, void 0, function* (docId, timeoutMs = 30000) {
            return this.request('casual.load.request', { docId }, timeoutMs);
        });
    }
    /** Editor → Host: ask the host to persist `bytes`. */
    requestSave(req_1) {
        return __awaiter(this, arguments, void 0, function* (req, timeoutMs = 30000) {
            return this.request('casual.save.request', req, timeoutMs, [req.bytes]);
        });
    }
    /** Editor → Host: selection moved. Fire-and-forget. */
    sendSelectionChanged(data) {
        this.post('casual.selection.changed', data);
    }
    /** Editor → Host: a noteworthy event. */
    sendTelemetry(data) {
        this.post('casual.telemetry.event', data);
    }
    /** Editor → Host: per-field progress during a signing session. */
    sendSignatureFieldSigned(data) {
        // Bytes ride the transfer list.
        this.post('casual.signature.field.signed', data, [data.bytes]);
    }
    /** Editor → Host: signing session is finished. */
    sendSignatureComplete(data) {
        this.post('casual.signature.complete', data, [data.bytes]);
    }
    /** Editor → Host: editor-side cancel of a signing session. */
    sendSignatureCancel(reason) {
        this.post('casual.signature.cancel', { reason });
    }
    /** Editor → Host: fatal boot / load error. Host surfaces via wrapper
     *  `onError` callback. Fire-and-forget. */
    sendError(data) {
        this.post('casual.error', data);
    }
    /** Tear down listeners. Idempotent. */
    destroy() {
        if (this.destroyed)
            return;
        this.opts.hostWindow.removeEventListener('message', this.boundMessage);
        this.pendingRequests.clear();
        this.destroyed = true;
    }
    // ---------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------
    boundMessage(ev) {
        // MessageEvent isn't always available on the typing side when
        // a stub window is injected; cast pragmatically.
        const msg = ev;
        if (msg.origin && msg.origin !== this.opts.hostOrigin)
            return;
        if (!isCasualEnvelope(msg.data))
            return;
        void this.dispatch(msg.data);
    }
    dispatch(env) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
            // Responses to outbound requests route through the correlation map.
            if (env.id && this.pendingRequests.has(env.id)) {
                const resolve = this.pendingRequests.get(env.id);
                this.pendingRequests.delete(env.id);
                resolve(env);
                return;
            }
            switch (env.type) {
                case 'casual.hello':
                    yield ((_b = (_a = this.handlers).onHostHello) === null || _b === void 0 ? void 0 : _b.call(_a, env.data));
                    this.sendReady();
                    return;
                case 'casual.command.setReadOnly':
                    yield ((_d = (_c = this.handlers).onCommandSetReadOnly) === null || _d === void 0 ? void 0 : _d.call(_c, env.data));
                    return;
                case 'casual.command.setTheme':
                    yield ((_f = (_e = this.handlers).onCommandSetTheme) === null || _f === void 0 ? void 0 : _f.call(_e, env.data));
                    return;
                case 'casual.command.setLocale':
                    yield ((_h = (_g = this.handlers).onCommandSetLocale) === null || _h === void 0 ? void 0 : _h.call(_g, env.data));
                    return;
                case 'casual.command.set.viewmode':
                    yield ((_k = (_j = this.handlers).onCommandSetViewMode) === null || _k === void 0 ? void 0 : _k.call(_j, env.data));
                    return;
                case 'casual.command.focus':
                    yield ((_m = (_l = this.handlers).onCommandFocus) === null || _m === void 0 ? void 0 : _m.call(_l));
                    return;
                case 'casual.command.save':
                    yield ((_p = (_o = this.handlers).onCommandSave) === null || _p === void 0 ? void 0 : _p.call(_o));
                    return;
                case 'casual.command.load':
                    yield ((_r = (_q = this.handlers).onCommandLoad) === null || _r === void 0 ? void 0 : _r.call(_q));
                    return;
                case 'casual.signature.request': {
                    const ack = (_u = (yield ((_t = (_s = this.handlers).onSignatureRequest) === null || _t === void 0 ? void 0 : _t.call(_s, env.data)))) !== null && _u !== void 0 ? _u : {
                        ok: false,
                        code: 'unhandled',
                    };
                    if (env.id) {
                        this.postReply(env.id, 'casual.signature.request.ack', ack);
                    }
                    return;
                }
                case 'casual.signature.cancel':
                    yield ((_w = (_v = this.handlers).onSignatureCancel) === null || _w === void 0 ? void 0 : _w.call(_v, env.data));
                    return;
                default:
                    // Unknown envelope — silently drop per the forward-compat
                    // convention in the protocol doc.
                    return;
            }
        });
    }
    post(type, data, transfer) {
        const env = { type, app: this.opts.app, v: 1, data };
        try {
            this.opts.parentWindow.postMessage(env, this.opts.hostOrigin, transfer);
        }
        catch (_a) {
            // Cross-origin postMessage can throw if the parent went away;
            // silently swallow — the next user action will retry.
        }
    }
    postReply(id, type, data) {
        const env = { type, app: this.opts.app, id, v: 1, data };
        try {
            this.opts.parentWindow.postMessage(env, this.opts.hostOrigin);
        }
        catch (_a) {
            // see post()
        }
    }
    request(type, data, timeoutMs, transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = newRequestId();
            return new Promise((resolve, reject) => {
                const timer = timeoutMs > 0
                    ? setTimeout(() => {
                        this.pendingRequests.delete(id);
                        reject(new Error(`Embed request ${type} timed out after ${timeoutMs}ms`));
                    }, timeoutMs)
                    : null;
                this.pendingRequests.set(id, (env) => {
                    if (timer)
                        clearTimeout(timer);
                    resolve(env.data);
                });
                const env = { type, app: this.opts.app, id, v: 1, data };
                try {
                    this.opts.parentWindow.postMessage(env, this.opts.hostOrigin, transfer);
                }
                catch (err) {
                    if (timer)
                        clearTimeout(timer);
                    this.pendingRequests.delete(id);
                    reject(err);
                }
            });
        });
    }
}
function newRequestId() {
    // 8 hex chars is plenty — IDs only need to be unique within a
    // single editor session. Math.random is fine; the host can't
    // use these for security.
    return Math.random().toString(16).slice(2, 10);
}
//# sourceMappingURL=EmbedTransport.js.map