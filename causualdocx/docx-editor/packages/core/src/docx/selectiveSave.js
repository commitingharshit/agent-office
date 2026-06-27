/**
 * Selective Save Module
 *
 * Orchestrates selective XML patching for the save flow.
 * Serializes full document.xml, validates patch safety, builds patched XML,
 * and calls applyUpdatesToZip() to produce the final DOCX.
 *
 * Returns null on any failure, signaling the caller to fall back to full repack.
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
import { serializeDocument } from './serializer/documentSerializer';
import { serializeCommentsWithInfo, serializeCommentsExtended, serializeCommentsIds, serializeCommentsExtensible, } from './serializer/commentSerializer';
import { buildPatchedDocumentXml } from './selectiveXmlPatch';
import { applyUpdatesToZip, findMaxRId, updateCoreProperties, collectHeaderFooterUpdates, COMMENTS_CONTENT_TYPE, COMMENTS_EXTENDED_CONTENT_TYPE, COMMENTS_IDS_CONTENT_TYPE, COMMENTS_EXTENSIBLE_CONTENT_TYPE, } from './rezip';
import { RELATIONSHIP_TYPES } from './relsParser';
/**
 * Check if document content has new images (data: URL without rId) or
 * new hyperlinks (href without rId). Combined into a single traversal
 * to avoid walking the block tree twice.
 */
function hasNewImagesOrHyperlinks(blocks) {
    var _a, _b, _c;
    for (const block of blocks) {
        if (block.type === 'paragraph') {
            for (const item of block.content) {
                if (item.type === 'run') {
                    for (const c of item.content) {
                        if (c.type === 'drawing' && ((_b = (_a = c.image) === null || _a === void 0 ? void 0 : _a.src) === null || _b === void 0 ? void 0 : _b.startsWith('data:')) && !((_c = c.image) === null || _c === void 0 ? void 0 : _c.rId)) {
                            return true;
                        }
                    }
                }
                else if (item.type === 'hyperlink' && item.href && !item.rId && !item.anchor) {
                    return true;
                }
            }
        }
        else if (block.type === 'table') {
            for (const row of block.rows) {
                for (const cell of row.cells) {
                    if (hasNewImagesOrHyperlinks(cell.content))
                        return true;
                }
            }
        }
    }
    return false;
}
/**
 * Attempt a selective save — patch only changed paragraphs in document.xml.
 * Also updates comments, headers/footers, and core properties so that
 * all document parts stay in sync even when only paragraphs are patched.
 *
 * Returns the saved ArrayBuffer, or null if selective save is not possible
 * (caller should fall back to full repack).
 */
export function attemptSelectiveSave(doc, originalBuffer, options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { changedParaIds, structuralChange, hasUntrackedChanges } = options;
        // Bail out conditions — fall back to full repack
        if (structuralChange)
            return null;
        if (hasUntrackedChanges)
            return null;
        if (!originalBuffer)
            return null;
        // Check for new images/hyperlinks that need relationship management
        const content = doc.package.document.content;
        if (hasNewImagesOrHyperlinks(content))
            return null;
        const comments = doc.package.document.comments;
        const hasComments = comments && comments.length > 0;
        const headerFooterUpdates = collectHeaderFooterUpdates(doc);
        try {
            const JSZip = (yield import('jszip')).default;
            const zip = yield JSZip.loadAsync(originalBuffer);
            const updates = new Map();
            // Patch document.xml if paragraphs changed
            if (changedParaIds.size > 0) {
                const docXmlFile = zip.file('word/document.xml');
                if (!docXmlFile)
                    return null;
                const originalDocXml = yield docXmlFile.async('text');
                const serializedDocXml = serializeDocument(doc);
                const patchedDocXml = buildPatchedDocumentXml(originalDocXml, serializedDocXml, changedParaIds);
                if (!patchedDocXml)
                    return null;
                updates.set('word/document.xml', patchedDocXml);
            }
            // Always serialize comments.xml + commentsExtended.xml when the document has comments
            if (hasComments) {
                const { xml: commentsXml, paraInfos } = serializeCommentsWithInfo(comments);
                updates.set('word/comments.xml', commentsXml);
                // Write commentsExtended.xml for reply threading (Word/Google Docs interop)
                const extendedXml = serializeCommentsExtended(paraInfos);
                if (extendedXml) {
                    updates.set('word/commentsExtended.xml', extendedXml);
                }
                // Write commentsIds.xml for stable IDs (Word Online needs this for replies)
                const idsXml = serializeCommentsIds(paraInfos);
                if (idsXml) {
                    updates.set('word/commentsIds.xml', idsXml);
                }
                // Write commentsExtensible.xml for UTC dates (Pages, Word 2016+)
                const extensibleXml = serializeCommentsExtensible(paraInfos, comments);
                if (extensibleXml) {
                    updates.set('word/commentsExtensible.xml', extensibleXml);
                }
                // Ensure [Content_Types].xml has Overrides for all comment parts
                const ctFile = zip.file('[Content_Types].xml');
                if (ctFile) {
                    let ctXml = (_a = updates.get('[Content_Types].xml')) !== null && _a !== void 0 ? _a : (yield ctFile.async('text'));
                    let ctChanged = false;
                    const ctEntries = [
                        ['/word/comments.xml', COMMENTS_CONTENT_TYPE],
                        ['/word/commentsExtended.xml', COMMENTS_EXTENDED_CONTENT_TYPE],
                        ['/word/commentsIds.xml', COMMENTS_IDS_CONTENT_TYPE],
                        ['/word/commentsExtensible.xml', COMMENTS_EXTENSIBLE_CONTENT_TYPE],
                    ];
                    for (const [partName, contentType] of ctEntries) {
                        if (!ctXml.includes(partName)) {
                            ctXml = ctXml.replace('</Types>', `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`);
                            ctChanged = true;
                        }
                    }
                    if (ctChanged)
                        updates.set('[Content_Types].xml', ctXml);
                }
                // Ensure word/_rels/document.xml.rels has Relationships for all
                const relsPath = 'word/_rels/document.xml.rels';
                const relsFile = zip.file(relsPath);
                if (relsFile) {
                    let relsXml = (_b = updates.get(relsPath)) !== null && _b !== void 0 ? _b : (yield relsFile.async('text'));
                    let relsChanged = false;
                    const relEntries = [
                        ['comments.xml', RELATIONSHIP_TYPES.comments],
                        ['commentsExtended.xml', RELATIONSHIP_TYPES.commentsExtended],
                        ['commentsIds.xml', RELATIONSHIP_TYPES.commentsIds],
                        ['commentsExtensible.xml', RELATIONSHIP_TYPES.commentsExtensible],
                    ];
                    for (const [target, type] of relEntries) {
                        if (!relsXml.includes(target)) {
                            const maxId = findMaxRId(relsXml);
                            relsXml = relsXml.replace('</Relationships>', `<Relationship Id="rId${maxId + 1}" Type="${type}" Target="${target}"/></Relationships>`);
                            relsChanged = true;
                        }
                    }
                    if (relsChanged)
                        updates.set(relsPath, relsXml);
                }
            }
            // Serialize modified headers/footers
            for (const [path, xml] of headerFooterUpdates) {
                updates.set(path, xml);
            }
            // Update modification date in docProps/core.xml
            const corePropsFile = zip.file('docProps/core.xml');
            if (corePropsFile) {
                const corePropsXml = yield corePropsFile.async('text');
                updates.set('docProps/core.xml', updateCoreProperties(corePropsXml, { updateModifiedDate: true }));
            }
            // Use the already-loaded zip to avoid a redundant decompression pass
            return yield applyUpdatesToZip(zip, updates);
        }
        catch (_c) {
            // Any error — fall back to full repack
            return null;
        }
    });
}
//# sourceMappingURL=selectiveSave.js.map