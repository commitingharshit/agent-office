/**
 * Accessibility checker — read-only analyzer over a ProseMirror document.
 *
 * Surfaces two classes of issue that screen readers + assistive tech care
 * about and that the user can fix in the editor:
 *
 *   - `missing-alt`: an `image` node whose `alt` attr is empty/null.
 *   - `heading-jump`: heading levels that skip a level in document order
 *     (e.g. H1 → H3 with no H2 between). Outline order matters for
 *     navigation.
 *
 * No schema changes; this is purely a walk over the current PM doc. The
 * dialog calls it on open and renders the results.
 */
import { collectHeadings } from './headingCollector';
export function checkAccessibility(doc) {
    const issues = [];
    // Images missing alt text.
    doc.descendants((node, pos) => {
        var _a;
        if (node.type.name === 'image') {
            const alt = (_a = node.attrs.alt) !== null && _a !== void 0 ? _a : '';
            if (!alt.trim())
                issues.push({ kind: 'missing-alt', pmPos: pos });
        }
        return true;
    });
    // Heading-order jumps — walk in document order and flag any level that
    // is more than one deeper than the previous level. (Going shallower is
    // fine; that's a normal section close.)
    const headings = collectHeadings(doc);
    let prevLevel = null;
    for (const h of headings) {
        if (prevLevel !== null && h.level > prevLevel + 1) {
            // headingCollector levels are 0-indexed (level 0 = H1); convert to
            // 1-indexed for the UI so the dialog can render "H1 → H3" directly.
            issues.push({
                kind: 'heading-jump',
                pmPos: h.pmPos,
                previousLevel: prevLevel + 1,
                level: h.level + 1,
                text: h.text,
            });
        }
        prevLevel = h.level;
    }
    return issues;
}
//# sourceMappingURL=accessibilityCheck.js.map