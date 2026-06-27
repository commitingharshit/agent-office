/**
 * Hyperlink Parser - Parse hyperlinks (w:hyperlink) with URL resolution
 *
 * OOXML Reference:
 * - Hyperlink element: w:hyperlink
 * - Attributes:
 *   - r:id - Relationship ID for external link (resolves via .rels)
 *   - w:anchor - Internal bookmark name
 *   - w:tooltip - Tooltip/title text
 *   - w:tgtFrame - Target frame (_blank, _self, etc.)
 *   - w:history - Whether to add to history
 *   - w:docLocation - Location within a document
 *
 * External links use r:id to reference a relationship in document.xml.rels
 * Internal links use w:anchor to reference a bookmark in the same document
 */
import { getAttribute, getChildElements, parseNumericAttribute, } from './xmlParser';
import { parseRun } from './runParser';
import { isExternalHyperlink } from './relsParser';
// ============================================================================
// HYPERLINK PARSER
// ============================================================================
/**
 * Get the local name of an element (without namespace prefix)
 */
function getLocalName(name) {
    if (!name)
        return '';
    const colonIndex = name.indexOf(':');
    return colonIndex >= 0 ? name.substring(colonIndex + 1) : name;
}
/**
 * Parse bookmark start (w:bookmarkStart)
 *
 * Used for internal hyperlink targets within the document.
 */
function parseBookmarkStart(node) {
    var _a, _b;
    const id = (_a = parseNumericAttribute(node, 'w', 'id')) !== null && _a !== void 0 ? _a : 0;
    const name = (_b = getAttribute(node, 'w', 'name')) !== null && _b !== void 0 ? _b : '';
    const bookmark = {
        type: 'bookmarkStart',
        id,
        name,
    };
    // Table column bookmarks
    const colFirst = parseNumericAttribute(node, 'w', 'colFirst');
    if (colFirst !== undefined)
        bookmark.colFirst = colFirst;
    const colLast = parseNumericAttribute(node, 'w', 'colLast');
    if (colLast !== undefined)
        bookmark.colLast = colLast;
    return bookmark;
}
/**
 * Parse bookmark end (w:bookmarkEnd)
 */
function parseBookmarkEnd(node) {
    var _a;
    const id = (_a = parseNumericAttribute(node, 'w', 'id')) !== null && _a !== void 0 ? _a : 0;
    return {
        type: 'bookmarkEnd',
        id,
    };
}
/**
 * Parse a hyperlink element (w:hyperlink)
 *
 * Handles both external links (via r:id relationship) and internal
 * links (via w:anchor bookmark reference).
 *
 * @param node - The w:hyperlink XML element
 * @param rels - Relationship map to resolve r:id references
 * @param styles - Style map for resolving run styles
 * @param theme - Theme for resolving colors/fonts
 * @param media - Media files map for image data
 * @returns Parsed Hyperlink object
 */
export function parseHyperlink(node, rels, styles = null, theme = null, media = null) {
    const hyperlink = {
        type: 'hyperlink',
        children: [],
    };
    // === External Link (r:id) ===
    // Get relationship ID for external links
    const rId = getAttribute(node, 'r', 'id');
    if (rId) {
        hyperlink.rId = rId;
        // Resolve the relationship to get the actual URL
        if (rels) {
            const rel = rels.get(rId);
            if (rel) {
                // External hyperlinks have TargetMode="External" and target is the URL
                if (isExternalHyperlink(rel)) {
                    hyperlink.href = rel.target;
                }
                else {
                    // Internal document link (to another part of the DOCX)
                    hyperlink.href = rel.target;
                }
            }
        }
    }
    // === Internal Bookmark Link (w:anchor) ===
    // Get internal bookmark anchor
    const anchor = getAttribute(node, 'w', 'anchor');
    if (anchor) {
        hyperlink.anchor = anchor;
        // For internal links, create a fragment-style href
        if (!hyperlink.href) {
            hyperlink.href = `#${anchor}`;
        }
    }
    // === Tooltip ===
    const tooltip = getAttribute(node, 'w', 'tooltip');
    if (tooltip) {
        hyperlink.tooltip = tooltip;
    }
    // === Target Frame ===
    // Common values: _blank (new window), _self (same), _parent, _top
    const tgtFrame = getAttribute(node, 'w', 'tgtFrame');
    if (tgtFrame) {
        hyperlink.target = tgtFrame;
    }
    // === History ===
    // Whether to add to browser history
    const history = getAttribute(node, 'w', 'history');
    if (history === '1' || history === 'true') {
        hyperlink.history = true;
    }
    // === Document Location ===
    // Location within a linked document (like fragment for external doc)
    const docLocation = getAttribute(node, 'w', 'docLocation');
    if (docLocation) {
        hyperlink.docLocation = docLocation;
    }
    // === Parse Children ===
    // Hyperlinks contain runs for the display text, and possibly bookmarks
    const children = getChildElements(node);
    for (const child of children) {
        const localName = getLocalName(child.name);
        switch (localName) {
            case 'r':
                hyperlink.children.push(parseRun(child, styles, theme, rels, media));
                break;
            case 'bookmarkStart':
                hyperlink.children.push(parseBookmarkStart(child));
                break;
            case 'bookmarkEnd':
                hyperlink.children.push(parseBookmarkEnd(child));
                break;
            // Note: hyperlinks can technically contain other elements like
            // fldSimple, but these are rare. Add support as needed.
        }
    }
    return hyperlink;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get the display text of a hyperlink
 *
 * Concatenates text from all child runs.
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns Display text string
 */
export function getHyperlinkText(hyperlink) {
    let text = '';
    for (const child of hyperlink.children) {
        if (child.type === 'run') {
            for (const content of child.content) {
                if (content.type === 'text') {
                    text += content.text;
                }
                else if (content.type === 'tab') {
                    text += '\t';
                }
            }
        }
    }
    return text;
}
/**
 * Check if a hyperlink is an external link
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns true if this links to an external URL
 */
export function isExternalLink(hyperlink) {
    // Has rId and resolved href that starts with a protocol
    if (hyperlink.href) {
        return /^https?:\/\/|^mailto:|^tel:|^ftp:/i.test(hyperlink.href);
    }
    // Has rId but not resolved (still counts as external attempt)
    return !!hyperlink.rId && !hyperlink.anchor;
}
/**
 * Check if a hyperlink is an internal bookmark link
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns true if this links to an internal bookmark
 */
export function isInternalLink(hyperlink) {
    return !!hyperlink.anchor;
}
/**
 * Get the resolved URL of a hyperlink
 *
 * For external links, returns the full URL.
 * For internal links, returns the anchor prefixed with #.
 * Returns undefined if the link couldn't be resolved.
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns Resolved URL or undefined
 */
export function getHyperlinkUrl(hyperlink) {
    return hyperlink.href;
}
/**
 * Check if a hyperlink has any content (runs)
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns true if hyperlink has child runs
 */
export function hasContent(hyperlink) {
    return hyperlink.children.some((child) => child.type === 'run');
}
/**
 * Get all runs from a hyperlink
 *
 * @param hyperlink - Parsed Hyperlink object
 * @returns Array of Run objects
 */
export function getHyperlinkRuns(hyperlink) {
    return hyperlink.children.filter((child) => child.type === 'run');
}
/**
 * Resolve a hyperlink's rId to a URL using a relationship map
 *
 * This is useful when you have a hyperlink that was parsed without
 * relationship context and need to resolve it later.
 *
 * @param hyperlink - Parsed Hyperlink object (will be modified)
 * @param rels - Relationship map to resolve against
 * @returns The resolved URL or undefined
 */
export function resolveHyperlinkUrl(hyperlink, rels) {
    if (hyperlink.rId) {
        const rel = rels.get(hyperlink.rId);
        if (rel) {
            if (isExternalHyperlink(rel)) {
                hyperlink.href = rel.target;
            }
            else {
                hyperlink.href = rel.target;
            }
            return hyperlink.href;
        }
    }
    // If there's an anchor but no href yet, set it
    if (hyperlink.anchor && !hyperlink.href) {
        hyperlink.href = `#${hyperlink.anchor}`;
        return hyperlink.href;
    }
    return hyperlink.href;
}
/**
 * Create an internal hyperlink to a bookmark
 *
 * Utility function for creating hyperlinks programmatically.
 *
 * @param anchor - Bookmark name to link to
 * @param children - Child runs for display text
 * @param options - Optional properties (tooltip, etc.)
 * @returns New Hyperlink object
 */
export function createInternalHyperlink(anchor, children, options) {
    return {
        type: 'hyperlink',
        anchor,
        href: `#${anchor}`,
        tooltip: options === null || options === void 0 ? void 0 : options.tooltip,
        children,
    };
}
/**
 * Create an external hyperlink
 *
 * Utility function for creating hyperlinks programmatically.
 * Note: The rId would need to be assigned when serializing.
 *
 * @param url - External URL
 * @param children - Child runs for display text
 * @param options - Optional properties (tooltip, target, etc.)
 * @returns New Hyperlink object
 */
export function createExternalHyperlink(url, children, options) {
    return {
        type: 'hyperlink',
        href: url,
        tooltip: options === null || options === void 0 ? void 0 : options.tooltip,
        target: options === null || options === void 0 ? void 0 : options.target,
        children,
    };
}
//# sourceMappingURL=hyperlinkParser.js.map