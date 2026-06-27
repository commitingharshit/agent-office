/**
 * Keep Together Logic - Handle keepNext and keepLines paragraph properties
 *
 * DOCX paragraphs can have keepNext (keep with next paragraph) and keepLines
 * (keep all lines together) properties that affect pagination.
 */
import type { FlowBlock, Measure } from './types';
/**
 * A chain of consecutive keepNext paragraphs.
 */
export type KeepNextChain = {
    /** Index of the first paragraph in the chain. */
    startIndex: number;
    /** Index of the last paragraph in the chain. */
    endIndex: number;
    /** All paragraph indices in the chain. */
    memberIndices: number[];
    /** Index of the anchor paragraph (first non-keepNext after chain), or -1 if none. */
    anchorIndex: number;
};
/**
 * Pre-scan blocks to find all keepNext chains.
 *
 * A keepNext chain is a sequence of consecutive paragraphs with keepNext=true,
 * followed by an anchor paragraph (the first non-keepNext paragraph).
 * The entire chain must stay on the same page as the anchor's first line.
 *
 * Returns a map from chain start index to chain info.
 */
export declare function computeKeepNextChains(blocks: FlowBlock[]): Map<number, KeepNextChain>;
/**
 * Calculate the total height needed to keep a chain together.
 *
 * Includes all chain members plus the first line of the anchor paragraph.
 */
export declare function calculateChainHeight(chain: KeepNextChain, blocks: FlowBlock[], measures: Measure[]): number;
/**
 * Get the set of indices that are mid-chain (not chain starters).
 * These should skip the keepNext check since their chain starter already decided.
 */
export declare function getMidChainIndices(chains: Map<number, KeepNextChain>): Set<number>;
/**
 * Check if a paragraph has keepLines property (all lines must stay together).
 */
export declare function hasKeepLines(block: FlowBlock): boolean;
/**
 * Check if a paragraph should start on a new page (pageBreakBefore).
 */
export declare function hasPageBreakBefore(block: FlowBlock): boolean;
//# sourceMappingURL=keep-together.d.ts.map