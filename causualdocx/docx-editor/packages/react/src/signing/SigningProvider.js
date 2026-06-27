var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * SigningProvider — wraps a signing session in React context so
 * descendant components (SigningPane, capture surfaces, and the
 * editor's field-highlight decorations) all see the same snapshot.
 *
 * The pure state machine lives in `./controller.ts`; this file
 * just bridges it to React.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createSigningController, } from './controller';
const SigningContext = createContext(null);
export function SigningProvider({ session, documentBytes, children }) {
    if (!session) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsx(SigningProviderInner, { session: session, documentBytes: documentBytes, children: children }));
}
function SigningProviderInner({ session, documentBytes, children, }) {
    // Controller is constructed once per session-config identity.
    // Hosts that swap sessions mid-tree must change the React `key`
    // on the provider — otherwise stale state would leak.
    const controller = useMemo(() => createSigningController(session.fields, session.mode), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.fields, session.mode]);
    const [snapshot, setSnapshot] = useState(() => controller.snapshot());
    useEffect(() => {
        const unsub = controller.subscribe(setSnapshot);
        return unsub;
    }, [controller]);
    const value = useMemo(() => ({
        controller,
        snapshot,
        signField: (payload) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            controller.signField(payload);
            yield ((_a = session.onFieldSigned) === null || _a === void 0 ? void 0 : _a.call(session, payload));
        }),
        completeIfReady: () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!controller.snapshot().canComplete)
                return;
            const final = controller.complete();
            const completePayload = {
                fieldIds: final.fields
                    .map((f) => f.fieldId)
                    .filter((id) => final.signed[id] !== undefined),
                bytes: documentBytes !== null && documentBytes !== void 0 ? documentBytes : new ArrayBuffer(0),
                fields: final.signed,
            };
            yield ((_a = session.onComplete) === null || _a === void 0 ? void 0 : _a.call(session, completePayload));
        }),
        cancel: (reason) => {
            var _a;
            controller.cancel();
            (_a = session.onCancel) === null || _a === void 0 ? void 0 : _a.call(session, { reason });
        },
        baseDocumentBytes: documentBytes,
    }), [controller, snapshot, session, documentBytes]);
    return _jsx(SigningContext.Provider, { value: value, children: children });
}
/**
 * Hook for descendants of <SigningProvider>. Returns null when
 * no signing session is active — caller renders its non-signing
 * shape.
 */
export function useSigning() {
    return useContext(SigningContext);
}
//# sourceMappingURL=SigningProvider.js.map