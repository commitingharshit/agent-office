/**
 * Signing — document-signature pipeline.
 *
 * Surfaces:
 *   - SigningProvider + useSigning — React context wrapping the
 *     pure controller.
 *   - SigningPane — floating sidebar walking the signer through
 *     fields.
 *   - DrawnSignaturePad / TypedSignatureField / UploadedSignatureField
 *     — capture surfaces emitting { bytes, mime } pairs.
 *
 * Types mirror the iframe envelopes from
 * `docs/internal/13-iframe-protocol.md` — same shape across docs
 * and sheet.
 */
export { SigningProvider, useSigning } from './SigningProvider';
export { SigningPane } from './SigningPane';
export { DrawnSignaturePad, TypedSignatureField, UploadedSignatureField, } from './captures';
export { createSigningController, } from './controller';
//# sourceMappingURL=index.js.map