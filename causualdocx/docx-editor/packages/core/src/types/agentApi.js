/**
 * Agent API Types
 *
 * TypeScript interfaces for the agent API:
 * - Position and Range types
 * - Command types for document manipulation
 * - Context types for AI agents
 */
/**
 * Create a collapsed range (cursor) at a position
 */
export function createCollapsedRange(position) {
    return {
        start: position,
        end: position,
        collapsed: true,
    };
}
/**
 * Create a range from two positions
 */
export function createRange(start, end) {
    return {
        start,
        end,
        collapsed: start.paragraphIndex === end.paragraphIndex && start.offset === end.offset,
    };
}
/**
 * Check if a position is within a range
 */
export function isPositionInRange(position, range) {
    // Before range start
    if (position.paragraphIndex < range.start.paragraphIndex ||
        (position.paragraphIndex === range.start.paragraphIndex && position.offset < range.start.offset)) {
        return false;
    }
    // After range end
    if (position.paragraphIndex > range.end.paragraphIndex ||
        (position.paragraphIndex === range.end.paragraphIndex && position.offset > range.end.offset)) {
        return false;
    }
    return true;
}
/**
 * Compare two positions
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function comparePositions(a, b) {
    if (a.paragraphIndex < b.paragraphIndex)
        return -1;
    if (a.paragraphIndex > b.paragraphIndex)
        return 1;
    if (a.offset < b.offset)
        return -1;
    if (a.offset > b.offset)
        return 1;
    return 0;
}
/**
 * Get action label
 */
export function getActionLabel(action) {
    const labels = {
        askAI: 'Ask AI',
        rewrite: 'Rewrite',
        expand: 'Expand',
        summarize: 'Summarize',
        translate: 'Translate',
        explain: 'Explain',
        fixGrammar: 'Fix Grammar',
        makeFormal: 'Make Formal',
        makeCasual: 'Make Casual',
        custom: 'Custom Prompt',
    };
    return labels[action];
}
/**
 * Get action description
 */
export function getActionDescription(action) {
    const descriptions = {
        askAI: 'Ask AI a question about this text',
        rewrite: 'Rewrite this text in a different way',
        expand: 'Expand this text with more details',
        summarize: 'Summarize this text to be shorter',
        translate: 'Translate this text to another language',
        explain: 'Explain what this text means',
        fixGrammar: 'Fix grammar and spelling errors',
        makeFormal: 'Make the tone more formal',
        makeCasual: 'Make the tone more casual',
        custom: 'Enter a custom prompt',
    };
    return descriptions[action];
}
/**
 * Default AI actions for context menu
 */
export const DEFAULT_AI_ACTIONS = [
    'askAI',
    'rewrite',
    'expand',
    'summarize',
    'translate',
    'explain',
];
/**
 * Create a command with generated ID
 */
export function createCommand(command) {
    return Object.assign(Object.assign({}, command), { id: generateCommandId() });
}
/**
 * Generate a unique command ID
 */
function generateCommandId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
export default {
    createCollapsedRange,
    createRange,
    isPositionInRange,
    comparePositions,
    getActionLabel,
    getActionDescription,
    createCommand,
    DEFAULT_AI_ACTIONS,
};
//# sourceMappingURL=agentApi.js.map