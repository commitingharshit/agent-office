/**
 * Insert Operations Utility
 *
 * Utility functions for inserting content into the document.
 * Provides functions for inserting page breaks, horizontal rules, and other elements.
 */
// ============================================================================
// PAGE BREAK
// ============================================================================
/**
 * Create a page break content element
 */
export function createPageBreak() {
    return {
        type: 'break',
        breakType: 'page',
    };
}
/**
 * Create a column break content element
 */
export function createColumnBreak() {
    return {
        type: 'break',
        breakType: 'column',
    };
}
/**
 * Create a text wrapping break (line break)
 */
export function createLineBreak(clear) {
    return {
        type: 'break',
        breakType: 'textWrapping',
        clear,
    };
}
/**
 * Create a run containing a page break
 */
export function createPageBreakRun() {
    return {
        type: 'run',
        content: [createPageBreak()],
    };
}
/**
 * Create an empty paragraph with a page break before it
 */
export function createPageBreakParagraph() {
    return {
        type: 'paragraph',
        content: [],
        formatting: {
            pageBreakBefore: true,
        },
    };
}
/**
 * Get runs from paragraph content
 */
function getParagraphRuns(paragraph) {
    return paragraph.content.filter((item) => item.type === 'run');
}
/**
 * Insert a page break at a position in the document
 * This inserts a new paragraph with pageBreakBefore: true
 */
export function insertPageBreak(doc, position) {
    const { paragraphIndex } = position;
    const content = [...(doc.package.document.content || [])];
    // Create a new paragraph with page break before
    const pageBreakParagraph = createPageBreakParagraph();
    // Insert after the specified paragraph
    content.splice(paragraphIndex + 1, 0, pageBreakParagraph);
    return Object.assign(Object.assign({}, doc), { package: Object.assign(Object.assign({}, doc.package), { document: Object.assign(Object.assign({}, doc.package.document), { content }) }) });
}
// ============================================================================
// HORIZONTAL RULE
// ============================================================================
/**
 * Create a horizontal rule paragraph
 * Uses a paragraph with bottom border to simulate horizontal rule
 */
export function createHorizontalRule() {
    return {
        type: 'paragraph',
        content: [],
        formatting: {
            borders: {
                bottom: {
                    style: 'single',
                    color: { rgb: '000000' },
                    size: 12, // 1.5pt
                    space: 1,
                },
            },
            spaceBefore: 120, // 6pt
            spaceAfter: 120, // 6pt
        },
    };
}
/**
 * Insert a horizontal rule at a position in the document
 */
export function insertHorizontalRule(doc, position) {
    const { paragraphIndex } = position;
    const content = [...(doc.package.document.content || [])];
    // Create a horizontal rule paragraph
    const hrParagraph = createHorizontalRule();
    // Insert after the specified paragraph
    content.splice(paragraphIndex + 1, 0, hrParagraph);
    return Object.assign(Object.assign({}, doc), { package: Object.assign(Object.assign({}, doc.package), { document: Object.assign(Object.assign({}, doc.package.document), { content }) }) });
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Check if content is a page break
 */
export function isPageBreak(content) {
    return content.type === 'break' && content.breakType === 'page';
}
/**
 * Check if content is a column break
 */
export function isColumnBreak(content) {
    return content.type === 'break' && content.breakType === 'column';
}
/**
 * Check if content is a line break
 */
export function isLineBreak(content) {
    return content.type === 'break' && content.breakType === 'textWrapping';
}
/**
 * Check if content is any type of break
 */
export function isBreakContent(content) {
    return content.type === 'break';
}
/**
 * Check if a paragraph has pageBreakBefore
 */
export function hasPageBreakBefore(paragraph) {
    var _a;
    return ((_a = paragraph.formatting) === null || _a === void 0 ? void 0 : _a.pageBreakBefore) === true;
}
/**
 * Count page breaks in a document
 */
export function countPageBreaks(doc) {
    let count = 0;
    for (const block of doc.package.document.content || []) {
        if (block.type === 'paragraph') {
            const paragraph = block;
            // Check for pageBreakBefore
            if (hasPageBreakBefore(paragraph)) {
                count++;
            }
            // Check for page breaks in runs
            const runs = getParagraphRuns(paragraph);
            for (const run of runs) {
                for (const content of run.content) {
                    if (isPageBreak(content)) {
                        count++;
                    }
                }
            }
        }
    }
    return count;
}
/**
 * Find all page break positions in a document
 */
export function findPageBreaks(doc) {
    const positions = [];
    const content = doc.package.document.content || [];
    for (let paragraphIndex = 0; paragraphIndex < content.length; paragraphIndex++) {
        const block = content[paragraphIndex];
        if (block.type === 'paragraph') {
            const paragraph = block;
            // Check for pageBreakBefore
            if (hasPageBreakBefore(paragraph)) {
                positions.push({ paragraphIndex });
            }
            // Check for page breaks in runs
            const runs = getParagraphRuns(paragraph);
            for (let runIndex = 0; runIndex < runs.length; runIndex++) {
                const run = runs[runIndex];
                for (const runContent of run.content) {
                    if (isPageBreak(runContent)) {
                        positions.push({ paragraphIndex, runIndex });
                    }
                }
            }
        }
    }
    return positions;
}
/**
 * Remove a page break at a specific position
 */
export function removePageBreak(doc, position) {
    const { paragraphIndex, runIndex } = position;
    const content = [...(doc.package.document.content || [])];
    const block = content[paragraphIndex];
    if (block.type !== 'paragraph') {
        return doc;
    }
    const paragraph = block;
    // If pageBreakBefore, remove the formatting
    if (hasPageBreakBefore(paragraph) && runIndex === undefined) {
        content[paragraphIndex] = Object.assign(Object.assign({}, paragraph), { formatting: Object.assign(Object.assign({}, paragraph.formatting), { pageBreakBefore: false }) });
        return Object.assign(Object.assign({}, doc), { package: Object.assign(Object.assign({}, doc.package), { document: Object.assign(Object.assign({}, doc.package.document), { content }) }) });
    }
    // If page break in run, remove it
    if (runIndex !== undefined) {
        const newParagraphContent = [];
        let currentRunIndex = 0;
        for (const item of paragraph.content) {
            if (item.type === 'run') {
                if (currentRunIndex === runIndex) {
                    const newRunContent = item.content.filter((c) => !isPageBreak(c));
                    if (newRunContent.length > 0) {
                        newParagraphContent.push(Object.assign(Object.assign({}, item), { content: newRunContent }));
                    }
                }
                else {
                    newParagraphContent.push(item);
                }
                currentRunIndex++;
            }
            else {
                newParagraphContent.push(item);
            }
        }
        content[paragraphIndex] = Object.assign(Object.assign({}, paragraph), { content: newParagraphContent });
        return Object.assign(Object.assign({}, doc), { package: Object.assign(Object.assign({}, doc.package), { document: Object.assign(Object.assign({}, doc.package.document), { content }) }) });
    }
    return doc;
}
// ============================================================================
// EXPORTS
// ============================================================================
export default {
    createPageBreak,
    createColumnBreak,
    createLineBreak,
    createPageBreakRun,
    createPageBreakParagraph,
    insertPageBreak,
    createHorizontalRule,
    insertHorizontalRule,
    isPageBreak,
    isColumnBreak,
    isLineBreak,
    isBreakContent,
    hasPageBreakBefore,
    countPageBreaks,
    findPageBreaks,
    removePageBreak,
};
//# sourceMappingURL=insertOperations.js.map