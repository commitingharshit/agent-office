/**
 * Keep Together Logic - Handle keepNext and keepLines paragraph properties
 *
 * DOCX paragraphs can have keepNext (keep with next paragraph) and keepLines
 * (keep all lines together) properties that affect pagination.
 */
/**
 * Pre-scan blocks to find all keepNext chains.
 *
 * A keepNext chain is a sequence of consecutive paragraphs with keepNext=true,
 * followed by an anchor paragraph (the first non-keepNext paragraph).
 * The entire chain must stay on the same page as the anchor's first line.
 *
 * Returns a map from chain start index to chain info.
 */
export function computeKeepNextChains(blocks) {
    var _a, _b;
    const chains = new Map();
    const processed = new Set();
    for (let i = 0; i < blocks.length; i++) {
        // Skip already-processed blocks (mid-chain members)
        if (processed.has(i))
            continue;
        const block = blocks[i];
        // Only paragraphs can have keepNext
        if (block.kind !== 'paragraph')
            continue;
        const para = block;
        // Skip paragraphs without keepNext
        if (!((_a = para.attrs) === null || _a === void 0 ? void 0 : _a.keepNext))
            continue;
        // Found a keepNext paragraph - scan forward to find full chain
        const memberIndices = [i];
        let endIndex = i;
        for (let j = i + 1; j < blocks.length; j++) {
            const nextBlock = blocks[j];
            // Breaks terminate the chain
            if (nextBlock.kind === 'sectionBreak' ||
                nextBlock.kind === 'pageBreak' ||
                nextBlock.kind === 'columnBreak') {
                break;
            }
            // Non-paragraphs terminate the chain
            if (nextBlock.kind !== 'paragraph') {
                break;
            }
            const nextPara = nextBlock;
            if ((_b = nextPara.attrs) === null || _b === void 0 ? void 0 : _b.keepNext) {
                // Continue the chain
                memberIndices.push(j);
                endIndex = j;
                processed.add(j);
            }
            else {
                // Found the anchor - stop here
                break;
            }
        }
        // Find the anchor (first paragraph after the chain)
        const potentialAnchor = endIndex + 1;
        let anchorIndex = -1;
        if (potentialAnchor < blocks.length) {
            const anchorBlock = blocks[potentialAnchor];
            // Anchor must not be a break
            if (anchorBlock.kind !== 'sectionBreak' &&
                anchorBlock.kind !== 'pageBreak' &&
                anchorBlock.kind !== 'columnBreak') {
                anchorIndex = potentialAnchor;
            }
        }
        // Record the chain
        chains.set(i, {
            startIndex: i,
            endIndex,
            memberIndices,
            anchorIndex,
        });
    }
    return chains;
}
/**
 * Calculate the total height needed to keep a chain together.
 *
 * Includes all chain members plus the first line of the anchor paragraph.
 */
export function calculateChainHeight(chain, blocks, measures) {
    var _a, _b, _c, _d, _e, _f;
    let totalHeight = 0;
    // Sum heights of all chain members
    for (const memberIndex of chain.memberIndices) {
        const block = blocks[memberIndex];
        const measure = measures[memberIndex];
        if (block.kind !== 'paragraph' || measure.kind !== 'paragraph')
            continue;
        const para = block;
        const paraMeasure = measure;
        // Add spacing before (simplified - could be more sophisticated with collapse)
        const spacingBefore = (_c = (_b = (_a = para.attrs) === null || _a === void 0 ? void 0 : _a.spacing) === null || _b === void 0 ? void 0 : _b.before) !== null && _c !== void 0 ? _c : 0;
        totalHeight += spacingBefore;
        // Add paragraph height
        totalHeight += paraMeasure.totalHeight;
        // Add spacing after
        const spacingAfter = (_f = (_e = (_d = para.attrs) === null || _d === void 0 ? void 0 : _d.spacing) === null || _e === void 0 ? void 0 : _e.after) !== null && _f !== void 0 ? _f : 0;
        totalHeight += spacingAfter;
    }
    // Add the leading height of the anchor — enough that the chain stays with
    // the START of whatever it anchors to, so a caption never separates from its
    // content. For a paragraph that's the first line; for a table it's the first
    // row (Word keeps a heading with at least the first table row); for an image
    // it's the whole image (an image is atomic and can't split).
    if (chain.anchorIndex !== -1) {
        const anchorMeasure = measures[chain.anchorIndex];
        if ((anchorMeasure === null || anchorMeasure === void 0 ? void 0 : anchorMeasure.kind) === 'paragraph') {
            const anchorPara = anchorMeasure;
            if (anchorPara.lines.length > 0) {
                totalHeight += anchorPara.lines[0].lineHeight;
            }
        }
        else if ((anchorMeasure === null || anchorMeasure === void 0 ? void 0 : anchorMeasure.kind) === 'table') {
            const anchorTable = anchorMeasure;
            if (anchorTable.rows.length > 0) {
                totalHeight += anchorTable.rows[0].height;
            }
        }
        else if ((anchorMeasure === null || anchorMeasure === void 0 ? void 0 : anchorMeasure.kind) === 'image') {
            totalHeight += anchorMeasure.height;
        }
    }
    return totalHeight;
}
/**
 * Get the set of indices that are mid-chain (not chain starters).
 * These should skip the keepNext check since their chain starter already decided.
 */
export function getMidChainIndices(chains) {
    const midChain = new Set();
    for (const chain of chains.values()) {
        // All members except the first are mid-chain
        for (let i = 1; i < chain.memberIndices.length; i++) {
            midChain.add(chain.memberIndices[i]);
        }
    }
    return midChain;
}
/**
 * Check if a paragraph has keepLines property (all lines must stay together).
 */
export function hasKeepLines(block) {
    var _a;
    if (block.kind !== 'paragraph')
        return false;
    const para = block;
    return ((_a = para.attrs) === null || _a === void 0 ? void 0 : _a.keepLines) === true;
}
/**
 * Check if a paragraph should start on a new page (pageBreakBefore).
 */
export function hasPageBreakBefore(block) {
    var _a;
    if (block.kind !== 'paragraph')
        return false;
    const para = block;
    return ((_a = para.attrs) === null || _a === void 0 ? void 0 : _a.pageBreakBefore) === true;
}
//# sourceMappingURL=keep-together.js.map