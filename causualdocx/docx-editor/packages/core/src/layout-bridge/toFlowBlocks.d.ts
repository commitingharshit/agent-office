/**
 * ProseMirror to FlowBlock Converter
 *
 * Converts a ProseMirror document into FlowBlock[] for the layout engine.
 * Tracks pmStart/pmEnd positions for click-to-position mapping.
 */
import type { Node as PMNode } from 'prosemirror-model';
import type { FlowBlock, BorderStyle } from '../layout-engine/types';
import type { Theme, NumberFormat } from '../types/document';
/**
 * Options for the conversion.
 */
export type ToFlowBlocksOptions = {
    /** Default font family. */
    defaultFont?: string;
    /** Default font size in points. */
    defaultSize?: number;
    /** Theme for resolving theme colors. */
    theme?: Theme | null;
    /** Page content height in pixels (pageHeight - marginTop - marginBottom). Images taller than this are scaled down to fit. */
    pageContentHeight?: number;
    /**
     * @internal Allocated by toFlowBlocks() and threaded through table /
     * text-box conversion so list numbering stays continuous across containers.
     * Keyed by abstractNumId when known (ECMA-376 §17.9.18: numIds sharing one
     * abstractNum share counter state); falls back to numId.
     */
    listCounters?: Map<number, number[]>;
    /**
     * @internal Tracks `${numId}:${ilvl}` pairs whose startOverride has already
     * been applied. Per ECMA-376 §17.9.27 the override fires the first time
     * each level of a numId is encountered, so a numId with overrides on
     * multiple ilvls fires each one independently.
     */
    listSeenNumIds?: Set<string>;
};
/**
 * Resolve an OOXML lvlText template like "%1.%2." against the counter stack
 * and per-level numFmt list (ECMA-376 §17.9.11).
 *
 * When a referenced counter has no value yet (e.g. "%2" referenced from a
 * level-0 paragraph), the placeholder AND the punctuation immediately
 * following it are dropped — matches Word's behavior so "%1.%2." renders
 * "1." rather than "1..".
 *
 * Exported for unit testing.
 */
export declare function resolveListTemplate(template: string, counters: number[], levelNumFmts: NumberFormat[] | undefined): string;
/**
 * Reset the block ID counter (useful for testing).
 */
export declare function resetBlockIdCounter(): void;
/**
 * Convert an OOXML BorderSpec to a layout-engine BorderStyle.
 * Shared by paragraph borders, cell borders, and header/footer borders.
 */
export declare function convertBorderSpecToLayout(border: {
    style?: string;
    size?: number;
    space?: number;
    color?: {
        rgb?: string;
        themeColor?: string;
        themeTint?: string;
        themeShade?: string;
    };
}, theme?: Theme | null): BorderStyle | undefined;
/**
 * Convert a ProseMirror document to FlowBlock array.
 *
 * Walks the document tree, converting each node to the appropriate block type.
 * Tracks pmStart/pmEnd positions for each block for click-to-position mapping.
 */
export declare function toFlowBlocks(doc: PMNode, options?: ToFlowBlocksOptions): FlowBlock[];
//# sourceMappingURL=toFlowBlocks.d.ts.map