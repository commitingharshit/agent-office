/**
 * Collect all headings from a ProseMirror document.
 *
 * Detection logic:
 * 1. Check `outlineLevel` attr (set by OOXML parsing or style resolution)
 * 2. Fallback to `styleId` matching /^[Hh]eading(\d)$/
 */
export function collectHeadings(doc) {
    const headings = [];
    doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph') {
            const level = node.attrs.outlineLevel;
            const styleId = node.attrs.styleId;
            let effectiveLevel = level;
            if (effectiveLevel == null && styleId) {
                const match = styleId.match(/^[Hh]eading(\d)$/);
                if (match)
                    effectiveLevel = parseInt(match[1], 10) - 1;
            }
            if (effectiveLevel != null && effectiveLevel >= 0 && effectiveLevel <= 8) {
                let text = '';
                node.forEach((child) => {
                    if (child.isText)
                        text += child.text || '';
                });
                if (text.trim()) {
                    headings.push({ text: text.trim(), level: effectiveLevel, pmPos: pos });
                }
            }
        }
    });
    return headings;
}
//# sourceMappingURL=headingCollector.js.map