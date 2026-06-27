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
 * Three signature-capture surfaces: drawn (canvas), typed (input
 * rendered in a script font), uploaded (image file picker).
 *
 * Each one emits an `{ bytes, mime }` pair that the parent feeds
 * into SigningContext.signField. The components are presentation +
 * input only — they don't know about the controller or the field
 * they're capturing for.
 */
import { useEffect, useRef, useState } from 'react';
export function DrawnSignaturePad({ onCapture, clearLabel = 'Clear', saveLabel = 'Use this signature', width = 480, height = 160, }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const [hasInk, setHasInk] = useState(false);
    // Set up a clean canvas on mount. Background is transparent so
    // the stamped image composites cleanly over the document.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);
    const start = (e) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const { x, y } = pointerPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
        drawingRef.current = true;
        canvas.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
        if (!drawingRef.current)
            return;
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const { x, y } = pointerPos(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (!hasInk)
            setHasInk(true);
    };
    const end = (e) => {
        var _a;
        drawingRef.current = false;
        (_a = canvasRef.current) === null || _a === void 0 ? void 0 : _a.releasePointerCapture(e.pointerId);
    };
    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasInk(false);
    };
    const save = () => __awaiter(this, void 0, void 0, function* () {
        const canvas = canvasRef.current;
        if (!canvas || !hasInk)
            return;
        const blob = yield new Promise((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (!blob)
            return;
        const bytes = yield blob.arrayBuffer();
        onCapture({ bytes, mime: 'image/png' });
        clear();
    });
    return (_jsxs("div", { style: padWrapStyle, "data-testid": "drawn-signature-pad", children: [_jsx("canvas", { ref: canvasRef, width: width, height: height, style: padCanvasStyle(width, height), onPointerDown: start, onPointerMove: move, onPointerUp: end, onPointerLeave: end, "data-testid": "drawn-signature-canvas" }), _jsxs("div", { style: padActionsStyle, children: [_jsx("button", { type: "button", onClick: clear, style: secondaryBtnStyle(false), children: clearLabel }), _jsx("button", { type: "button", onClick: save, disabled: !hasInk, style: primaryBtnStyle(!hasInk), "data-testid": "drawn-signature-save", children: saveLabel })] })] }));
}
function pointerPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
    };
}
export function TypedSignatureField({ onCapture, defaultText = '', saveLabel = 'Use this signature', }) {
    const [value, setValue] = useState(defaultText);
    const save = () => {
        const trimmed = value.trim();
        if (!trimmed)
            return;
        const bytes = new TextEncoder().encode(trimmed).buffer;
        onCapture({ bytes, mime: 'text/plain' });
        setValue('');
    };
    return (_jsxs("div", { style: padWrapStyle, "data-testid": "typed-signature-field", children: [_jsx("input", { type: "text", value: value, onChange: (e) => setValue(e.target.value), placeholder: "Type your full name", style: typedInputStyle, "data-testid": "typed-signature-input", autoFocus: true }), _jsx("div", { style: padActionsStyle, children: _jsx("button", { type: "button", onClick: save, disabled: !value.trim(), style: primaryBtnStyle(!value.trim()), "data-testid": "typed-signature-save", children: saveLabel }) })] }));
}
export function UploadedSignatureField({ onCapture, accept = 'image/png,image/jpeg,image/svg+xml', }) {
    const inputRef = useRef(null);
    const [fileName, setFileName] = useState(null);
    const onChange = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const bytes = yield file.arrayBuffer();
        onCapture({ bytes, mime: file.type || 'application/octet-stream' });
        setFileName(file.name);
        if (inputRef.current)
            inputRef.current.value = '';
    });
    return (_jsx("div", { style: padWrapStyle, "data-testid": "uploaded-signature-field", children: _jsxs("label", { style: uploadLabelStyle, children: [_jsx("input", { ref: inputRef, type: "file", accept: accept, onChange: onChange, style: { display: 'none' }, "data-testid": "uploaded-signature-input" }), _jsx("span", { children: fileName !== null && fileName !== void 0 ? fileName : 'Choose image…' })] }) }));
}
// ---------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------
const padWrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};
const padCanvasStyle = (w, h) => ({
    width: w,
    height: h,
    maxWidth: '100%',
    border: '1px dashed var(--doc-border, #cbd5e1)',
    borderRadius: 8,
    background: 'var(--doc-surface, #fff)',
    cursor: 'crosshair',
    touchAction: 'none',
});
const padActionsStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
const typedInputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--doc-border, #cbd5e1)',
    borderRadius: 6,
    fontSize: 18,
    fontFamily: '"Caveat", "Dancing Script", "Brush Script MT", cursive',
    background: 'var(--doc-surface, #fff)',
    color: 'var(--doc-text, #0f172a)',
};
const uploadLabelStyle = {
    display: 'inline-flex',
    padding: '8px 14px',
    border: '1px dashed var(--doc-border, #cbd5e1)',
    borderRadius: 6,
    background: 'var(--doc-surface, #fff)',
    color: 'var(--doc-text, #0f172a)',
    fontSize: 13,
    cursor: 'pointer',
    alignSelf: 'flex-start',
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
function secondaryBtnStyle(disabled) {
    return {
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid var(--doc-border, #cbd5e1)',
        background: 'transparent',
        color: 'var(--doc-text, #0f172a)',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
    };
}
//# sourceMappingURL=captures.js.map