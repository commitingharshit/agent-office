/**
 * Iframe protocol — wire envelopes that match
 * `docs/internal/13-iframe-protocol.md`.
 *
 * Mirror updates to the doc whenever a new envelope shape lands.
 * The discriminator on `type` (always starts with `casual.`) and
 * the per-envelope `data` shape are the contract.
 */
// ---------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------
export function isCasualEnvelope(value) {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    return (typeof v.type === 'string' &&
        v.type.startsWith('casual.') &&
        (v.app === 'docs' || v.app === 'sheet') &&
        v.v === 1 &&
        'data' in v);
}
//# sourceMappingURL=protocol.js.map