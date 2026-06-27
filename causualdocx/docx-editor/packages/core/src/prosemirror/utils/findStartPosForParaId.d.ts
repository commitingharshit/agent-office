import type { Node as PMNode } from 'prosemirror-model';
/**
 * ProseMirror position immediately before the first textblock whose `paraId`
 * attribute equals `paraId` (Word `w14:paraId` / OOXML paragraph id).
 *
 * Match is strict string equality on `node.attrs.paraId`.
 */
export declare function findStartPosForParaId(doc: PMNode, paraId: string): number | null;
//# sourceMappingURL=findStartPosForParaId.d.ts.map