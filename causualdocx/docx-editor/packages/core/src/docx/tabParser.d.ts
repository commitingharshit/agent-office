/**
 * Tab Parser - Parse and handle tab stops in DOCX documents
 *
 * Tab stops define positions where the cursor jumps when the user presses Tab.
 * They can have different alignments (left, center, right, decimal) and
 * leader characters (dots, dashes, underscores).
 *
 * OOXML Reference:
 * - Tab stops container: w:tabs
 * - Individual tab stop: w:tab
 * - Tab character in runs: w:tab (different from tab stop definition)
 *
 * Attributes of w:tab in w:tabs:
 * - w:val - alignment type (left, center, right, decimal, bar, clear, num)
 * - w:pos - position in twips from left margin
 * - w:leader - leader character (none, dot, hyphen, underscore, heavy, middleDot)
 */
import type { TabStop, TabStopAlignment, TabLeader } from '../types/document';
import { type XmlElement } from './xmlParser';
/**
 * Default tab stop interval in twips (0.5 inches = 720 twips at 1440 twips/inch)
 * Word uses this when no explicit tab stops are defined
 */
export declare const DEFAULT_TAB_INTERVAL_TWIPS = 720;
/**
 * Default tab alignment
 */
export declare const DEFAULT_TAB_ALIGNMENT: TabStopAlignment;
/**
 * Default tab leader
 */
export declare const DEFAULT_TAB_LEADER: TabLeader;
/**
 * Parse a single tab stop element (w:tab within w:tabs)
 *
 * @param tab - The w:tab XML element
 * @returns Parsed TabStop or null if invalid
 */
export declare function parseTabStop(tab: XmlElement): TabStop | null;
/**
 * Parse tab stops container (w:tabs)
 *
 * @param tabs - The w:tabs XML element
 * @returns Array of TabStop objects, sorted by position
 */
export declare function parseTabStops(tabs: XmlElement | null): TabStop[];
/**
 * Parse tab stops from paragraph properties element
 *
 * @param pPr - The w:pPr XML element
 * @returns Array of TabStop objects or undefined if none
 */
export declare function parseTabStopsFromParagraphProperties(pPr: XmlElement | null): TabStop[] | undefined;
/**
 * Merge tab stops from different sources (style, direct formatting)
 *
 * Direct formatting tab stops override style tab stops at the same position.
 * "clear" alignment removes a tab stop from the style.
 *
 * @param styleTabs - Tab stops from style
 * @param directTabs - Tab stops from direct formatting (w:pPr in paragraph)
 * @returns Merged and filtered tab stops
 */
export declare function mergeTabStops(styleTabs: TabStop[] | undefined, directTabs: TabStop[] | undefined): TabStop[];
/**
 * Get the next tab stop position for a given current position
 *
 * @param currentPosition - Current position in twips from left margin
 * @param tabStops - Defined tab stops
 * @param pageWidth - Page content width in twips (for boundary)
 * @returns The next tab stop or a default position
 */
export declare function getNextTabStop(currentPosition: number, tabStops: TabStop[], pageWidth: number): TabStop;
/**
 * Find a tab stop at a specific position
 *
 * @param position - Position to look for (in twips)
 * @param tabStops - Array of tab stops
 * @param tolerance - Position tolerance in twips (default 10)
 * @returns TabStop at that position or undefined
 */
export declare function findTabStopAtPosition(position: number, tabStops: TabStop[], tolerance?: number): TabStop | undefined;
/**
 * Calculate the width needed for a tab at a given position
 *
 * @param currentPosition - Current position in twips
 * @param tabStops - Defined tab stops
 * @param pageWidth - Page content width in twips
 * @returns Width in twips that the tab should span
 */
export declare function calculateTabWidth(currentPosition: number, tabStops: TabStop[], pageWidth: number): number;
/**
 * Calculate tab width considering alignment
 *
 * For non-left alignments (center, right, decimal), the width depends on
 * the content that follows the tab.
 *
 * @param currentPosition - Current position in twips
 * @param tabStops - Defined tab stops
 * @param pageWidth - Page content width in twips
 * @param followingContentWidth - Width of content after the tab (for alignment)
 * @returns Width in twips
 */
export declare function calculateTabWidthWithAlignment(currentPosition: number, tabStops: TabStop[], pageWidth: number, followingContentWidth?: number): {
    width: number;
    alignment: TabStopAlignment;
};
/**
 * Get the character used for a tab leader
 *
 * @param leader - Tab leader type
 * @returns The character to use for filling
 */
export declare function getLeaderCharacter(leader: TabLeader | undefined): string;
/**
 * Check if a leader type requires visible filling
 *
 * @param leader - Tab leader type
 * @returns true if the leader needs visible characters
 */
export declare function hasVisibleLeader(leader: TabLeader | undefined): boolean;
/**
 * Generate leader string for a tab of given width
 *
 * @param leader - Tab leader type
 * @param widthInChars - Approximate number of characters to fill
 * @returns String of leader characters
 */
export declare function generateLeaderString(leader: TabLeader | undefined, widthInChars: number): string;
/**
 * Check if a value is a valid tab alignment
 */
export declare function isValidTabAlignment(value: string): value is TabStopAlignment;
/**
 * Check if a value is a valid tab leader
 */
export declare function isValidTabLeader(value: string): value is TabLeader;
/**
 * Generate default tab stops for a given page width
 *
 * Word creates implicit tab stops at regular intervals when no explicit
 * tab stops are defined.
 *
 * @param pageWidth - Page content width in twips
 * @param interval - Tab interval in twips (default: 720 = 0.5 inches)
 * @returns Array of default tab stops
 */
export declare function generateDefaultTabStops(pageWidth: number, interval?: number): TabStop[];
/**
 * Get effective tab stops, combining explicit and default
 *
 * @param explicitTabs - Explicitly defined tab stops
 * @param pageWidth - Page content width in twips
 * @returns Combined tab stops with defaults filling gaps
 */
export declare function getEffectiveTabStops(explicitTabs: TabStop[] | undefined, pageWidth: number): TabStop[];
//# sourceMappingURL=tabParser.d.ts.map