/**
 * Signing state machine — pure with respect to React so bun-test
 * can exercise it without a renderer. The React wrappers
 * (SigningProvider / SigningPane) sit on top of this.
 *
 * Single source of truth for "which field is the signer on,
 * which fields are done, can we complete yet" — the React layer
 * never recomputes these from scratch.
 */
import type { SignedFieldPayload, SignatureField, SignatureMode } from './types';
export interface SigningSnapshot {
    fields: SignatureField[];
    mode: SignatureMode;
    /** Fields completed in order they were signed. */
    signed: Record<string, SignedFieldPayload>;
    /** Index into `fields` of the field the signer should focus on
     *  next. -1 once everything required is done. */
    activeFieldIndex: number;
    /** True once every required field has a payload. */
    canComplete: boolean;
    /** True once the controller has received a completion command. */
    isComplete: boolean;
    /** True if a cancel has been emitted. */
    isCancelled: boolean;
}
export interface SigningController {
    snapshot(): SigningSnapshot;
    subscribe(listener: (s: SigningSnapshot) => void): () => void;
    /** Record a signed field. Throws if the field id is unknown. */
    signField(payload: SignedFieldPayload): void;
    /** Move focus to a specific field (concurrent mode let users
     *  pick); in sequential mode the controller silently no-ops if
     *  the requested field isn't the next required. */
    focusField(fieldId: string): void;
    /** Mark the session complete. Returns the snapshot at the
     *  moment of completion; throws if not yet canComplete. */
    complete(): SigningSnapshot;
    /** Mark the session cancelled. Idempotent. */
    cancel(): void;
}
export declare function createSigningController(fields: SignatureField[], mode: SignatureMode): SigningController;
//# sourceMappingURL=controller.d.ts.map