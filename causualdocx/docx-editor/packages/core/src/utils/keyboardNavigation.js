/**
 * Keyboard Navigation Utilities
 *
 * Provides enhanced keyboard navigation for the editor:
 * - Ctrl+Left/Right: Move by word
 * - Home/End: Move to start/end of line
 * - Ctrl+Home/End: Move to start/end of document
 * - Ctrl+Shift+Left/Right: Select by word
 * - Shift+Home/End: Select to start/end of line
 */
// ============================================================================
// WORD BOUNDARY DETECTION
// ============================================================================
/**
 * Check if a character is a word character (letter, digit, or underscore)
 */
export function isWordCharacter(char) {
    if (!char)
        return false;
    // Word characters: letters (including unicode), digits, underscore
    return /[\p{L}\p{N}_]/u.test(char);
}
/**
 * Check if a character is whitespace
 */
export function isWhitespace(char) {
    if (!char)
        return false;
    return /\s/.test(char);
}
/**
 * Check if a character is a punctuation character
 */
export function isPunctuation(char) {
    if (!char)
        return false;
    return /[\p{P}]/u.test(char);
}
/**
 * Find the start of the current or previous word
 */
export function findWordStart(text, position) {
    if (position <= 0)
        return 0;
    if (position > text.length)
        position = text.length;
    let pos = position;
    // If we're in the middle of whitespace, skip to the end of whitespace
    while (pos > 0 && isWhitespace(text[pos - 1])) {
        pos--;
    }
    // If we hit the start while skipping whitespace, return 0
    if (pos === 0)
        return 0;
    // Now find the start of the word
    while (pos > 0 && isWordCharacter(text[pos - 1])) {
        pos--;
    }
    return pos;
}
/**
 * Find the end of the current or next word
 */
export function findWordEnd(text, position) {
    if (position >= text.length)
        return text.length;
    if (position < 0)
        position = 0;
    let pos = position;
    // If we're at a word character, find the end of this word
    while (pos < text.length && isWordCharacter(text[pos])) {
        pos++;
    }
    // Skip whitespace to reach the start of next word
    while (pos < text.length && isWhitespace(text[pos])) {
        pos++;
    }
    return pos;
}
/**
 * Find the next word start (for Ctrl+Right navigation)
 */
export function findNextWordStart(text, position) {
    if (position >= text.length)
        return text.length;
    let pos = position;
    // If we're on a word character, move to end of current word
    while (pos < text.length && isWordCharacter(text[pos])) {
        pos++;
    }
    // Skip whitespace and punctuation to reach next word
    while (pos < text.length && !isWordCharacter(text[pos])) {
        pos++;
    }
    return pos;
}
/**
 * Find the previous word start (for Ctrl+Left navigation)
 */
export function findPreviousWordStart(text, position) {
    if (position <= 0)
        return 0;
    let pos = position;
    // Skip whitespace and punctuation going backwards
    while (pos > 0 && !isWordCharacter(text[pos - 1])) {
        pos--;
    }
    // Move to start of word
    while (pos > 0 && isWordCharacter(text[pos - 1])) {
        pos--;
    }
    return pos;
}
// ============================================================================
// LINE BOUNDARY DETECTION
// ============================================================================
/**
 * Find the start of the current line in a text node
 * Uses visual line detection based on bounding rectangles
 */
export function findVisualLineStart(container, offset) {
    var _a;
    const selection = window.getSelection();
    if (!selection)
        return null;
    // Get the current caret position's bounding rect
    const range = document.createRange();
    if (container.nodeType === Node.TEXT_NODE) {
        // Handle text node
        range.setStart(container, Math.min(offset, ((_a = container.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0));
        range.collapse(true);
        const currentRect = range.getBoundingClientRect();
        const currentTop = currentRect.top;
        // Binary search to find line start
        let start = 0;
        let end = offset;
        while (start < end) {
            const mid = Math.floor((start + end) / 2);
            range.setStart(container, mid);
            range.collapse(true);
            const rect = range.getBoundingClientRect();
            if (Math.abs(rect.top - currentTop) < 2) {
                // Same line, search left
                end = mid;
            }
            else {
                // Different line, search right
                start = mid + 1;
            }
        }
        return { node: container, offset: start };
    }
    return null;
}
/**
 * Find the end of the current line in a text node
 * Uses visual line detection based on bounding rectangles
 */
export function findVisualLineEnd(container, offset) {
    var _a;
    const selection = window.getSelection();
    if (!selection)
        return null;
    const textLength = ((_a = container.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0;
    // Get the current caret position's bounding rect
    const range = document.createRange();
    if (container.nodeType === Node.TEXT_NODE) {
        range.setStart(container, Math.min(offset, textLength));
        range.collapse(true);
        const currentRect = range.getBoundingClientRect();
        const currentTop = currentRect.top;
        // Binary search to find line end
        let start = offset;
        let end = textLength;
        while (start < end) {
            const mid = Math.ceil((start + end) / 2);
            range.setStart(container, mid);
            range.collapse(true);
            const rect = range.getBoundingClientRect();
            if (Math.abs(rect.top - currentTop) < 2) {
                // Same line, search right
                start = mid;
            }
            else {
                // Different line, search left
                end = mid - 1;
            }
        }
        return { node: container, offset: start };
    }
    return null;
}
// ============================================================================
// DOM SELECTION UTILITIES
// ============================================================================
/**
 * Get the current selection info
 */
export function getSelectionInfo() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return null;
    const range = selection.getRangeAt(0);
    return {
        node: range.startContainer,
        offset: range.startOffset,
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset,
        isCollapsed: selection.isCollapsed,
        text: selection.toString(),
    };
}
/**
 * Set the selection to a specific position
 */
export function setSelectionPosition(node, offset) {
    var _a;
    const selection = window.getSelection();
    if (!selection)
        return;
    const range = document.createRange();
    const maxOffset = node.nodeType === Node.TEXT_NODE ? ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0 : node.childNodes.length;
    range.setStart(node, Math.min(offset, maxOffset));
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}
/**
 * Extend selection to a specific position
 */
export function extendSelectionTo(node, offset) {
    var _a, _b;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode)
        return;
    try {
        selection.extend(node, Math.min(offset, ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0));
    }
    catch (_c) {
        // If extend fails (e.g., different containers), fall back to setBaseAndExtent
        const maxOffset = node.nodeType === Node.TEXT_NODE ? ((_b = node.textContent) === null || _b === void 0 ? void 0 : _b.length) || 0 : node.childNodes.length;
        selection.setBaseAndExtent(selection.anchorNode, selection.anchorOffset, node, Math.min(offset, maxOffset));
    }
}
/**
 * Move selection by word in a text node
 */
export function moveByWord(direction, extend = false) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return false;
    const focusNode = selection.focusNode;
    if (!focusNode || focusNode.nodeType !== Node.TEXT_NODE)
        return false;
    const text = focusNode.textContent || '';
    const currentOffset = selection.focusOffset;
    let newOffset;
    if (direction === 'left') {
        newOffset = findPreviousWordStart(text, currentOffset);
    }
    else {
        newOffset = findNextWordStart(text, currentOffset);
    }
    if (extend) {
        extendSelectionTo(focusNode, newOffset);
    }
    else {
        setSelectionPosition(focusNode, newOffset);
    }
    return true;
}
/**
 * Move to start/end of line
 */
export function moveToLineEdge(edge, extend = false) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return false;
    const focusNode = selection.focusNode;
    if (!focusNode)
        return false;
    // For text nodes, find visual line boundaries
    if (focusNode.nodeType === Node.TEXT_NODE) {
        const result = edge === 'start'
            ? findVisualLineStart(focusNode, selection.focusOffset)
            : findVisualLineEnd(focusNode, selection.focusOffset);
        if (result) {
            if (extend) {
                extendSelectionTo(result.node, result.offset);
            }
            else {
                setSelectionPosition(result.node, result.offset);
            }
            return true;
        }
    }
    // Fallback: move to start/end of the focus node's text content
    const text = focusNode.textContent || '';
    const newOffset = edge === 'start' ? 0 : text.length;
    if (extend) {
        extendSelectionTo(focusNode, newOffset);
    }
    else {
        setSelectionPosition(focusNode, newOffset);
    }
    return true;
}
// ============================================================================
// KEYBOARD EVENT HANDLING
// ============================================================================
/**
 * Parse a keyboard event into a navigation action
 */
export function parseNavigationAction(event) {
    const { key, ctrlKey, metaKey, shiftKey, altKey: _altKey } = event;
    // Use Ctrl on Windows/Linux, Meta (Cmd) on Mac
    const isModifier = ctrlKey || metaKey;
    switch (key) {
        case 'ArrowLeft':
            if (isModifier) {
                return {
                    direction: 'left',
                    unit: 'word',
                    extend: shiftKey,
                };
            }
            break;
        case 'ArrowRight':
            if (isModifier) {
                return {
                    direction: 'right',
                    unit: 'word',
                    extend: shiftKey,
                };
            }
            break;
        case 'Home':
            if (isModifier) {
                return {
                    direction: 'left',
                    unit: 'document',
                    extend: shiftKey,
                };
            }
            return {
                direction: 'left',
                unit: 'line',
                extend: shiftKey,
            };
        case 'End':
            if (isModifier) {
                return {
                    direction: 'right',
                    unit: 'document',
                    extend: shiftKey,
                };
            }
            return {
                direction: 'right',
                unit: 'line',
                extend: shiftKey,
            };
    }
    return null;
}
/**
 * Handle a keyboard navigation event
 * Returns true if the event was handled
 */
export function handleNavigationKey(event, options) {
    const action = parseNavigationAction(event);
    if (!action)
        return false;
    switch (action.unit) {
        case 'word':
            // moveByWord only supports horizontal directions
            if ((action.direction === 'left' || action.direction === 'right') &&
                moveByWord(action.direction, action.extend)) {
                event.preventDefault();
                return true;
            }
            break;
        case 'line':
            const edge = action.direction === 'left' ? 'start' : 'end';
            if (moveToLineEdge(edge, action.extend)) {
                event.preventDefault();
                return true;
            }
            break;
        case 'document':
            // Document navigation needs to be handled by the editor component
            // as it involves cross-paragraph movement
            if (action.direction === 'left' && (options === null || options === void 0 ? void 0 : options.onDocumentStart)) {
                event.preventDefault();
                options.onDocumentStart();
                return true;
            }
            if (action.direction === 'right' && (options === null || options === void 0 ? void 0 : options.onDocumentEnd)) {
                event.preventDefault();
                options.onDocumentEnd();
                return true;
            }
            break;
    }
    return false;
}
/**
 * Check if an event is a navigation key event
 */
export function isNavigationKey(event) {
    const { key, ctrlKey, metaKey } = event;
    const isModifier = ctrlKey || metaKey;
    // Arrow keys with Ctrl/Cmd
    if (isModifier && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        return true;
    }
    // Home/End keys
    if (key === 'Home' || key === 'End') {
        return true;
    }
    return false;
}
// ============================================================================
// SELECTION WORD EXPANSION
// ============================================================================
/**
 * Expand selection to word boundaries
 * Used for double-click word selection
 */
export function expandSelectionToWord() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return false;
    const focusNode = selection.focusNode;
    if (!focusNode || focusNode.nodeType !== Node.TEXT_NODE)
        return false;
    const text = focusNode.textContent || '';
    const offset = selection.focusOffset;
    // Find word boundaries around the cursor
    let start = offset;
    let end = offset;
    // Expand backwards to word start
    while (start > 0 && isWordCharacter(text[start - 1])) {
        start--;
    }
    // Expand forwards to word end
    while (end < text.length && isWordCharacter(text[end])) {
        end++;
    }
    // If we didn't find a word (cursor on whitespace), don't expand
    if (start === end)
        return false;
    // Create the selection
    const range = document.createRange();
    range.setStart(focusNode, start);
    range.setEnd(focusNode, end);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
}
/**
 * Get the word at the current cursor position
 */
export function getWordAtCursor() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return null;
    const focusNode = selection.focusNode;
    if (!focusNode || focusNode.nodeType !== Node.TEXT_NODE)
        return null;
    const text = focusNode.textContent || '';
    const offset = selection.focusOffset;
    let start = offset;
    let end = offset;
    while (start > 0 && isWordCharacter(text[start - 1])) {
        start--;
    }
    while (end < text.length && isWordCharacter(text[end])) {
        end++;
    }
    if (start === end)
        return null;
    return text.slice(start, end);
}
// ============================================================================
// KEYBOARD SHORTCUT MATCHING
// ============================================================================
/**
 * Check if a keyboard event matches a shortcut definition
 */
export function matchesShortcut(event, shortcut) {
    // Handle both Ctrl and Meta (Cmd on Mac)
    const eventModifier = event.ctrlKey || event.metaKey;
    const shortcutModifier = shortcut.ctrlKey || shortcut.metaKey;
    return (event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        eventModifier === !!shortcutModifier &&
        event.shiftKey === !!shortcut.shiftKey &&
        event.altKey === !!shortcut.altKey);
}
/**
 * Common navigation shortcuts
 */
export const NAVIGATION_SHORTCUTS = {
    // Word navigation
    wordLeft: { key: 'ArrowLeft', ctrlKey: true },
    wordRight: { key: 'ArrowRight', ctrlKey: true },
    selectWordLeft: { key: 'ArrowLeft', ctrlKey: true, shiftKey: true },
    selectWordRight: { key: 'ArrowRight', ctrlKey: true, shiftKey: true },
    // Line navigation
    lineStart: { key: 'Home' },
    lineEnd: { key: 'End' },
    selectToLineStart: { key: 'Home', shiftKey: true },
    selectToLineEnd: { key: 'End', shiftKey: true },
    // Document navigation
    documentStart: { key: 'Home', ctrlKey: true },
    documentEnd: { key: 'End', ctrlKey: true },
    selectToDocumentStart: { key: 'Home', ctrlKey: true, shiftKey: true },
    selectToDocumentEnd: { key: 'End', ctrlKey: true, shiftKey: true },
};
/**
 * Get a human-readable description of a shortcut
 */
export function describeShortcut(shortcut) {
    const parts = [];
    if (shortcut.ctrlKey || shortcut.metaKey) {
        // Use Cmd symbol on Mac, Ctrl on others
        const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
        parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shiftKey)
        parts.push('Shift');
    if (shortcut.altKey)
        parts.push('Alt');
    // Format the key
    let keyName = shortcut.key;
    if (keyName === 'ArrowLeft')
        keyName = '←';
    else if (keyName === 'ArrowRight')
        keyName = '→';
    else if (keyName === 'ArrowUp')
        keyName = '↑';
    else if (keyName === 'ArrowDown')
        keyName = '↓';
    parts.push(keyName);
    return parts.join('+');
}
/**
 * Get all navigation shortcuts with descriptions
 */
export function getNavigationShortcutDescriptions() {
    return [
        { action: 'Move by word (left)', shortcut: describeShortcut(NAVIGATION_SHORTCUTS.wordLeft) },
        { action: 'Move by word (right)', shortcut: describeShortcut(NAVIGATION_SHORTCUTS.wordRight) },
        {
            action: 'Select word (left)',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.selectWordLeft),
        },
        {
            action: 'Select word (right)',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.selectWordRight),
        },
        { action: 'Go to line start', shortcut: describeShortcut(NAVIGATION_SHORTCUTS.lineStart) },
        { action: 'Go to line end', shortcut: describeShortcut(NAVIGATION_SHORTCUTS.lineEnd) },
        {
            action: 'Select to line start',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.selectToLineStart),
        },
        {
            action: 'Select to line end',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.selectToLineEnd),
        },
        {
            action: 'Go to document start',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.documentStart),
        },
        { action: 'Go to document end', shortcut: describeShortcut(NAVIGATION_SHORTCUTS.documentEnd) },
        {
            action: 'Select to document start',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.selectToDocumentStart),
        },
        {
            action: 'Select to document end',
            shortcut: describeShortcut(NAVIGATION_SHORTCUTS.selectToDocumentEnd),
        },
    ];
}
//# sourceMappingURL=keyboardNavigation.js.map