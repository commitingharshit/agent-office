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
/**
 * Navigation direction
 */
export type NavigationDirection = 'left' | 'right' | 'up' | 'down';
/**
 * Navigation unit
 */
export type NavigationUnit = 'character' | 'word' | 'line' | 'paragraph' | 'document';
/**
 * Keyboard navigation action
 */
export interface NavigationAction {
    /** Direction to navigate */
    direction: NavigationDirection;
    /** Unit of movement */
    unit: NavigationUnit;
    /** Whether to extend selection */
    extend: boolean;
}
/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
}
/**
 * Check if a character is a word character (letter, digit, or underscore)
 */
export declare function isWordCharacter(char: string): boolean;
/**
 * Check if a character is whitespace
 */
export declare function isWhitespace(char: string): boolean;
/**
 * Check if a character is a punctuation character
 */
export declare function isPunctuation(char: string): boolean;
/**
 * Find the start of the current or previous word
 */
export declare function findWordStart(text: string, position: number): number;
/**
 * Find the end of the current or next word
 */
export declare function findWordEnd(text: string, position: number): number;
/**
 * Find the next word start (for Ctrl+Right navigation)
 */
export declare function findNextWordStart(text: string, position: number): number;
/**
 * Find the previous word start (for Ctrl+Left navigation)
 */
export declare function findPreviousWordStart(text: string, position: number): number;
/**
 * Find the start of the current line in a text node
 * Uses visual line detection based on bounding rectangles
 */
export declare function findVisualLineStart(container: Node, offset: number): {
    node: Node;
    offset: number;
} | null;
/**
 * Find the end of the current line in a text node
 * Uses visual line detection based on bounding rectangles
 */
export declare function findVisualLineEnd(container: Node, offset: number): {
    node: Node;
    offset: number;
} | null;
/**
 * Get the current selection info
 */
export declare function getSelectionInfo(): {
    node: Node;
    offset: number;
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;
    isCollapsed: boolean;
    text: string;
} | null;
/**
 * Set the selection to a specific position
 */
export declare function setSelectionPosition(node: Node, offset: number): void;
/**
 * Extend selection to a specific position
 */
export declare function extendSelectionTo(node: Node, offset: number): void;
/**
 * Move selection by word in a text node
 */
export declare function moveByWord(direction: 'left' | 'right', extend?: boolean): boolean;
/**
 * Move to start/end of line
 */
export declare function moveToLineEdge(edge: 'start' | 'end', extend?: boolean): boolean;
/**
 * Parse a keyboard event into a navigation action
 */
export declare function parseNavigationAction(event: KeyboardEvent): NavigationAction | null;
/**
 * Handle a keyboard navigation event
 * Returns true if the event was handled
 */
export declare function handleNavigationKey(event: KeyboardEvent, options?: {
    onDocumentStart?: () => void;
    onDocumentEnd?: () => void;
}): boolean;
/**
 * Check if an event is a navigation key event
 */
export declare function isNavigationKey(event: KeyboardEvent): boolean;
/**
 * Expand selection to word boundaries
 * Used for double-click word selection
 */
export declare function expandSelectionToWord(): boolean;
/**
 * Get the word at the current cursor position
 */
export declare function getWordAtCursor(): string | null;
/**
 * Check if a keyboard event matches a shortcut definition
 */
export declare function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean;
/**
 * Common navigation shortcuts
 */
export declare const NAVIGATION_SHORTCUTS: {
    readonly wordLeft: KeyboardShortcut;
    readonly wordRight: KeyboardShortcut;
    readonly selectWordLeft: KeyboardShortcut;
    readonly selectWordRight: KeyboardShortcut;
    readonly lineStart: KeyboardShortcut;
    readonly lineEnd: KeyboardShortcut;
    readonly selectToLineStart: KeyboardShortcut;
    readonly selectToLineEnd: KeyboardShortcut;
    readonly documentStart: KeyboardShortcut;
    readonly documentEnd: KeyboardShortcut;
    readonly selectToDocumentStart: KeyboardShortcut;
    readonly selectToDocumentEnd: KeyboardShortcut;
};
/**
 * Get a human-readable description of a shortcut
 */
export declare function describeShortcut(shortcut: KeyboardShortcut): string;
/**
 * Get all navigation shortcuts with descriptions
 */
export declare function getNavigationShortcutDescriptions(): Array<{
    action: string;
    shortcut: string;
}>;
//# sourceMappingURL=keyboardNavigation.d.ts.map