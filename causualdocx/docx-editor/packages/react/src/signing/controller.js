/**
 * Signing state machine — pure with respect to React so bun-test
 * can exercise it without a renderer. The React wrappers
 * (SigningProvider / SigningPane) sit on top of this.
 *
 * Single source of truth for "which field is the signer on,
 * which fields are done, can we complete yet" — the React layer
 * never recomputes these from scratch.
 */
export function createSigningController(fields, mode) {
    if (fields.length === 0) {
        throw new Error('createSigningController: at least one field required');
    }
    const fieldIds = new Set(fields.map((f) => f.fieldId));
    if (fieldIds.size !== fields.length) {
        throw new Error('createSigningController: duplicate fieldId');
    }
    const signed = {};
    let activeFieldIndex = nextRequiredIndex(fields, signed);
    let isComplete = false;
    let isCancelled = false;
    const listeners = new Set();
    function emit() {
        const snap = snapshotInternal();
        for (const l of listeners)
            l(snap);
    }
    function snapshotInternal() {
        return {
            fields,
            mode,
            signed: Object.assign({}, signed),
            activeFieldIndex,
            canComplete: allRequiredSigned(fields, signed),
            isComplete,
            isCancelled,
        };
    }
    return {
        snapshot: snapshotInternal,
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        signField(payload) {
            if (isComplete || isCancelled)
                return;
            if (!fieldIds.has(payload.fieldId)) {
                throw new Error(`signField: unknown fieldId ${payload.fieldId}`);
            }
            signed[payload.fieldId] = payload;
            activeFieldIndex = nextRequiredIndex(fields, signed);
            emit();
        },
        focusField(fieldId) {
            if (isComplete || isCancelled)
                return;
            const idx = fields.findIndex((f) => f.fieldId === fieldId);
            if (idx < 0)
                return;
            if (mode === 'sequential') {
                // Sequential mode: only the next-required field is focusable.
                const next = nextRequiredIndex(fields, signed);
                if (idx !== next)
                    return;
            }
            activeFieldIndex = idx;
            emit();
        },
        complete() {
            if (!allRequiredSigned(fields, signed)) {
                throw new Error('complete: required fields are still unsigned');
            }
            isComplete = true;
            activeFieldIndex = -1;
            emit();
            return snapshotInternal();
        },
        cancel() {
            if (isComplete || isCancelled)
                return;
            isCancelled = true;
            activeFieldIndex = -1;
            emit();
        },
    };
}
// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function allRequiredSigned(fields, signed) {
    return fields.every((f) => !f.required || signed[f.fieldId] !== undefined);
}
function nextRequiredIndex(fields, signed) {
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].required && !signed[fields[i].fieldId])
            return i;
    }
    // Either all required are done OR no required exists; pick the
    // first unsigned optional.
    for (let i = 0; i < fields.length; i++) {
        if (!signed[fields[i].fieldId])
            return i;
    }
    return -1;
}
//# sourceMappingURL=controller.js.map