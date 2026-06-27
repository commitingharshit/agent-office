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
import { type CasualApp, type HostHelloData, type LoadResponseData, type SaveRequestData, type SaveResponseData, type SelectionChangedData, type TelemetryEventData, type CommandSetReadOnlyData, type CommandSetThemeData, type CommandSetLocaleData, type CommandSetViewModeData, type CasualErrorData, type SignatureRequestData, type SignatureRequestAckData, type SignatureFieldSignedData, type SignatureCompleteData, type SignatureCancelData } from './protocol';
export interface EmbedTransportOptions {
    app: CasualApp;
    /** Origin allowed to send messages. Required — no `*` default. */
    hostOrigin: string;
    /** Editor build identity, surfaced in the editor.hello handshake. */
    version: string;
    commit: string;
    /** Editor-side capabilities advertised at handshake. */
    capabilities: string[];
    /** Optional injection for `window.parent` — tests pass a stub. */
    parentWindow?: {
        postMessage: (msg: unknown, targetOrigin: string, transfer?: Transferable[]) => void;
    };
    /** Optional injection for the window receiving messages — tests pass a stub. */
    hostWindow?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}
export interface EmbedTransportHandlers {
    /** Host → editor handshake. Editor responds with `editor.ready`. */
    onHostHello?: (data: HostHelloData) => void | Promise<void>;
    /** Host → editor: command.* messages. */
    onCommandSetReadOnly?: (data: CommandSetReadOnlyData) => void | Promise<void>;
    onCommandSetTheme?: (data: CommandSetThemeData) => void | Promise<void>;
    onCommandSetLocale?: (data: CommandSetLocaleData) => void | Promise<void>;
    /** Host → editor: switch chrome density (preview ↔ editor). */
    onCommandSetViewMode?: (data: CommandSetViewModeData) => void | Promise<void>;
    onCommandFocus?: () => void | Promise<void>;
    onCommandSave?: () => void | Promise<void>;
    onCommandLoad?: () => void | Promise<void>;
    /** Host → editor signing session. Editor responds with `signature.request.ack`. */
    onSignatureRequest?: (data: SignatureRequestData) => SignatureRequestAckData | Promise<SignatureRequestAckData>;
    onSignatureCancel?: (data: SignatureCancelData) => void | Promise<void>;
    /** Host → editor: response to a prior load.request the editor issued. */
    onLoadResponse?: (id: string, data: LoadResponseData) => void;
    /** Host → editor: response to a prior save.request the editor issued. */
    onSaveResponse?: (id: string, data: SaveResponseData) => void;
}
export declare class EmbedTransport {
    private readonly opts;
    private handlers;
    private destroyed;
    private pendingRequests;
    constructor(opts: EmbedTransportOptions);
    /** Replaces the handler set. Idempotent — call multiple times. */
    on(handlers: EmbedTransportHandlers): void;
    /** Editor → Host: announce ourselves. Call once after handlers are wired. */
    sendHello(): void;
    /** Editor → Host: editor is ready to receive commands. */
    sendReady(): void;
    /** Editor → Host: ask the host to supply document bytes for `docId`. */
    requestLoad(docId: string, timeoutMs?: number): Promise<LoadResponseData>;
    /** Editor → Host: ask the host to persist `bytes`. */
    requestSave(req: SaveRequestData, timeoutMs?: number): Promise<SaveResponseData>;
    /** Editor → Host: selection moved. Fire-and-forget. */
    sendSelectionChanged(data: SelectionChangedData): void;
    /** Editor → Host: a noteworthy event. */
    sendTelemetry(data: TelemetryEventData): void;
    /** Editor → Host: per-field progress during a signing session. */
    sendSignatureFieldSigned(data: SignatureFieldSignedData): void;
    /** Editor → Host: signing session is finished. */
    sendSignatureComplete(data: SignatureCompleteData): void;
    /** Editor → Host: editor-side cancel of a signing session. */
    sendSignatureCancel(reason: SignatureCancelData['reason']): void;
    /** Editor → Host: fatal boot / load error. Host surfaces via wrapper
     *  `onError` callback. Fire-and-forget. */
    sendError(data: CasualErrorData): void;
    /** Tear down listeners. Idempotent. */
    destroy(): void;
    private boundMessage;
    private dispatch;
    private post;
    private postReply;
    private request;
}
//# sourceMappingURL=EmbedTransport.d.ts.map