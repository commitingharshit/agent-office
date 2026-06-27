/**
 * Flexible input types for DOCX documents.
 *
 * Accepts any common binary format so consumers don't need to manually
 * convert before passing data to the editor or parser.
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
/**
 * Normalize any {@link DocxInput} into an `ArrayBuffer` for internal use.
 */
export function toArrayBuffer(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (input instanceof ArrayBuffer) {
            return input;
        }
        if (input instanceof Uint8Array) {
            // Copy into a fresh ArrayBuffer (input may be a view over a larger or shared buffer)
            const copy = new ArrayBuffer(input.byteLength);
            new Uint8Array(copy).set(input);
            return copy;
        }
        if (input instanceof Blob) {
            // Blob and File both support arrayBuffer()
            return input.arrayBuffer();
        }
        // Exhaustive check — should never happen at runtime
        throw new TypeError(`Unsupported DocxInput type: ${typeof input}`);
    });
}
//# sourceMappingURL=docxInput.js.map