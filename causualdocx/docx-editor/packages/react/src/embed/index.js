/**
 * Embed — iframe delivery surface.
 *
 * EmbedTransport bridges postMessage to React handlers. The
 * envelope shapes (`./protocol.ts`) mirror the documentation
 * contract in `docs/internal/13-iframe-protocol.md` and the
 * signing payloads from `../signing/types.ts`.
 */
export { EmbedTransport, } from './EmbedTransport';
export { isCasualEnvelope, } from './protocol';
//# sourceMappingURL=index.js.map