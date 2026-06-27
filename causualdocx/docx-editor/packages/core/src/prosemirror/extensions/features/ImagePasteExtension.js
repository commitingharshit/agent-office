/**
 * Image Paste Extension — handles image files pasted from the clipboard
 *
 * When an image file is present on the clipboard, this intercepts the paste,
 * reads the image data, and inserts an image node instead of a file icon.
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
import { Plugin, TextSelection } from 'prosemirror-state';
import { createExtension } from '../create';
import { getClipboardImageFiles } from '../../../utils/clipboard';
const MAX_INLINE_IMAGE_WIDTH = 612; // ~6.375 inches at 96 DPI
function readFileAsDataUrl(file) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => { var _a; return reject((_a = reader.error) !== null && _a !== void 0 ? _a : new Error('Failed to read image file')); };
            reader.readAsDataURL(file);
        });
    });
}
function loadImageSize(src) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
            img.onerror = () => reject(new Error('Failed to load pasted image'));
            img.src = src;
        });
    });
}
function insertImageFiles(view, files) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageType = view.state.schema.nodes.image;
        if (!imageType)
            return;
        let insertPos = view.state.selection.from;
        for (const file of files) {
            let dataUrl;
            try {
                dataUrl = yield readFileAsDataUrl(file);
            }
            catch (_a) {
                continue;
            }
            let naturalWidth = 1;
            let naturalHeight = 1;
            try {
                ({ width: naturalWidth, height: naturalHeight } = yield loadImageSize(dataUrl));
            }
            catch (_b) {
                // Fall back to a safe minimal size if the image can't be decoded
                naturalWidth = 1;
                naturalHeight = 1;
            }
            let width = naturalWidth;
            let height = naturalHeight;
            if (width > MAX_INLINE_IMAGE_WIDTH) {
                const scale = MAX_INLINE_IMAGE_WIDTH / width;
                width = MAX_INLINE_IMAGE_WIDTH;
                height = Math.max(1, Math.round(height * scale));
            }
            const imageNode = imageType.create({
                src: dataUrl,
                alt: file.name,
                width,
                height,
                rId: `rId_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                wrapType: 'inline',
                displayMode: 'inline',
            });
            const tr = view.state.tr.insert(insertPos, imageNode);
            insertPos += imageNode.nodeSize;
            tr.setSelection(TextSelection.create(tr.doc, insertPos));
            view.dispatch(tr.scrollIntoView());
        }
        view.focus();
    });
}
export const ImagePasteExtension = createExtension({
    name: 'imagePaste',
    onSchemaReady(_ctx) {
        const plugin = new Plugin({
            props: {
                handleDOMEvents: {
                    paste(view, event) {
                        const clipboardEvent = event;
                        const imageFiles = getClipboardImageFiles(clipboardEvent.clipboardData);
                        if (imageFiles.length === 0) {
                            return false;
                        }
                        if (!view.state.schema.nodes.image) {
                            return false;
                        }
                        clipboardEvent.preventDefault();
                        void insertImageFiles(view, imageFiles).catch(() => undefined);
                        return true;
                    },
                },
            },
        });
        return { plugins: [plugin] };
    },
});
//# sourceMappingURL=ImagePasteExtension.js.map