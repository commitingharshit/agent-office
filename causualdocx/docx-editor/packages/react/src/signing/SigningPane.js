var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SigningPane — the floating sidebar that walks the signer through
 * fields. Lives inside <SigningProvider>; uses the controller via
 * `useSigning()`.
 *
 * Layout: a right-anchored panel showing
 *   - Banner (optional, from session config)
 *   - Field list with state markers (active / signed / pending)
 *   - Method picker for the active field
 *   - Capture surface (Drawn / Typed / Uploaded) depending on method
 *   - Footer: Cancel + Complete
 *
 * The pane is presentation-only — every action routes through the
 * SigningProvider's helpers (signField, completeIfReady, cancel)
 * so the controller stays the single source of truth.
 */
import { useEffect, useState } from 'react';
import { useSigning } from './SigningProvider';
import { DrawnSignaturePad, TypedSignatureField, UploadedSignatureField, } from './captures';
export function SigningPane({ banner, testId = 'signing-pane' }) {
    const ctx = useSigning();
    if (!ctx)
        return null;
    const { snapshot, signField, completeIfReady, cancel } = ctx;
    if (snapshot.isComplete || snapshot.isCancelled)
        return null;
    const active = snapshot.activeFieldIndex >= 0 ? snapshot.fields[snapshot.activeFieldIndex] : null;
    return (_jsxs("aside", { style: paneStyle, role: "region", "aria-label": "Signing pane", "data-testid": testId, children: [banner && (_jsx("div", { style: bannerStyle, "data-testid": `${testId}-banner`, children: banner })), _jsx("div", { style: listStyle, "data-testid": `${testId}-fields`, children: snapshot.fields.map((f, i) => {
                    const isSigned = !!snapshot.signed[f.fieldId];
                    const isActive = i === snapshot.activeFieldIndex;
                    return (_jsxs("div", { style: listItemStyle(isActive, isSigned), "data-testid": `${testId}-field-${f.fieldId}`, "data-state": isSigned ? 'signed' : isActive ? 'active' : 'pending', children: [_jsx("span", { style: listIconStyle(isSigned), "aria-hidden": "true", children: isSigned ? '✓' : i + 1 }), _jsx("span", { style: listLabelStyle, children: f.label }), !f.required && (_jsx("span", { style: optionalChipStyle, "aria-label": "Optional", children: "optional" }))] }, f.fieldId));
                }) }), active && (_jsx(ActiveFieldEditor, { field: active, testId: testId, onCapture: (cap, method) => __awaiter(this, void 0, void 0, function* () {
                    const payload = {
                        fieldId: active.fieldId,
                        method,
                        bytes: cap.bytes,
                        mime: cap.mime,
                        signedAt: new Date().toISOString(),
                    };
                    yield signField(payload);
                }) })), !active && snapshot.canComplete && (_jsx("div", { style: completeBlockStyle, "data-testid": `${testId}-complete-block`, children: "All required signatures collected. Ready to finalise." })), _jsxs("footer", { style: footerStyle, children: [_jsx("button", { type: "button", onClick: () => cancel('signer_cancelled'), style: secondaryBtnStyle(), "data-testid": `${testId}-cancel`, children: "Cancel" }), _jsx("button", { type: "button", onClick: () => void completeIfReady(), disabled: !snapshot.canComplete, style: primaryBtnStyle(!snapshot.canComplete), "data-testid": `${testId}-complete`, children: "Complete" })] })] }));
}
// ---------------------------------------------------------------
// Active field editor — method picker + capture surface
// ---------------------------------------------------------------
function ActiveFieldEditor({ field, testId, onCapture, }) {
    var _a, _b, _c;
    const [method, setMethod] = useState(field.methods[0]);
    // Reset the method picker whenever the active field changes — a
    // method that was valid for the previous field may not be in this
    // field's list.
    useEffect(() => {
        setMethod(field.methods[0]);
    }, [field]);
    return (_jsxs("div", { style: editorStyle, "data-testid": `${testId}-editor`, children: [_jsxs("div", { style: editorHeaderStyle, children: [_jsx("div", { style: editorLabelStyle, children: field.label }), ((_a = field.signer) === null || _a === void 0 ? void 0 : _a.name) && _jsx("div", { style: editorSignerStyle, children: field.signer.name })] }), field.methods.length > 1 && (_jsx("div", { style: methodTabsStyle, role: "tablist", "data-testid": `${testId}-methods`, children: field.methods.map((m) => (_jsx("button", { type: "button", role: "tab", "aria-selected": method === m, onClick: () => setMethod(m), style: methodTabStyle(method === m), "data-testid": `${testId}-method-${m}`, children: methodLabel(m) }, m))) })), _jsxs("div", { style: captureWrapStyle, children: [method === 'drawn' && _jsx(DrawnSignaturePad, { onCapture: (c) => onCapture(c, 'drawn') }), method === 'typed' && (_jsx(TypedSignatureField, { defaultText: (_c = (_b = field.signer) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : '', onCapture: (c) => onCapture(c, 'typed') })), method === 'uploaded' && (_jsx(UploadedSignatureField, { onCapture: (c) => onCapture(c, 'uploaded') }))] })] }));
}
function methodLabel(m) {
    switch (m) {
        case 'drawn':
            return 'Draw';
        case 'typed':
            return 'Type';
        case 'uploaded':
            return 'Upload';
    }
}
// ---------------------------------------------------------------
// Styles
// ---------------------------------------------------------------
const paneStyle = {
    position: 'fixed',
    top: 16,
    right: 16,
    bottom: 16,
    width: 360,
    maxWidth: '100vw',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: 16,
    background: 'var(--doc-surface, #fff)',
    border: '1px solid var(--doc-border, #cbd5e1)',
    borderRadius: 12,
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04), 0 6px 24px rgba(15, 23, 42, 0.12)',
    fontFamily: 'inherit',
    zIndex: 9000,
};
const bannerStyle = {
    padding: '8px 10px',
    background: 'var(--doc-surface-2, #f1f5f9)',
    border: '1px solid var(--doc-border-light, #e2e8f0)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--doc-text-muted, #475569)',
};
const listStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};
function listItemStyle(active, signed) {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        background: active ? 'var(--doc-surface-2, #f1f5f9)' : signed ? 'transparent' : 'transparent',
        border: active ? '1px solid var(--doc-border, #cbd5e1)' : '1px solid transparent',
        opacity: signed && !active ? 0.7 : 1,
    };
}
function listIconStyle(signed) {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: signed ? 'var(--doc-accent, #2563eb)' : 'var(--doc-surface-2, #f1f5f9)',
        color: signed ? '#fff' : 'var(--doc-text-muted, #475569)',
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
    };
}
const listLabelStyle = {
    flex: 1,
    fontSize: 13,
    color: 'var(--doc-text, #0f172a)',
    fontWeight: 500,
};
const optionalChipStyle = {
    fontSize: 11,
    color: 'var(--doc-text-muted, #64748b)',
    padding: '2px 6px',
    background: 'var(--doc-surface-2, #f1f5f9)',
    borderRadius: 4,
};
const editorStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};
const editorHeaderStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
};
const editorLabelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--doc-text, #0f172a)',
};
const editorSignerStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted, #64748b)',
};
const methodTabsStyle = {
    display: 'flex',
    gap: 4,
    padding: 2,
    background: 'var(--doc-surface-2, #f1f5f9)',
    borderRadius: 6,
};
function methodTabStyle(selected) {
    return {
        flex: 1,
        padding: '6px 10px',
        background: selected ? 'var(--doc-surface, #fff)' : 'transparent',
        border: 'none',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        color: selected ? 'var(--doc-text, #0f172a)' : 'var(--doc-text-muted, #475569)',
        cursor: 'pointer',
        fontFamily: 'inherit',
    };
}
const captureWrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const completeBlockStyle = {
    padding: '10px 12px',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.28)',
    borderRadius: 6,
    fontSize: 12,
    color: 'rgb(20, 83, 45)',
};
const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid var(--doc-border-light, #e2e8f0)',
};
function primaryBtnStyle(disabled) {
    return {
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid transparent',
        background: disabled ? 'var(--doc-border, #cbd5e1)' : 'var(--doc-accent, #2563eb)',
        color: disabled ? 'var(--doc-text-muted, #64748b)' : '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
    };
}
function secondaryBtnStyle() {
    return {
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid var(--doc-border, #cbd5e1)',
        background: 'transparent',
        color: 'var(--doc-text, #0f172a)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
    };
}
//# sourceMappingURL=SigningPane.js.map