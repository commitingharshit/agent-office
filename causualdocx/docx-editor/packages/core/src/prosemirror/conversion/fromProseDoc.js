/**
 * ProseMirror to Document Conversion
 *
 * Converts a ProseMirror document back to our Document type.
 * This enables round-trip editing: DOCX -> Document -> PM -> Document -> DOCX
 *
 * Key responsibilities:
 * - Coalesce consecutive text with same marks into single Runs
 * - Preserve paragraph attributes (paraId, textId, formatting)
 * - Handle marks -> TextFormatting conversion
 */
import { pixelsToEmu } from '../../docx/imageParser';
import { mathmlToOmml } from '../../docx/mathmlToOmml';
/**
 * Convert a ProseMirror document to our Document type
 */
export function fromProseDoc(pmDoc, baseDocument) {
    const blocks = extractBlocks(pmDoc);
    // Preserve section properties (margins, headers, footers) from base document
    const documentBody = {
        content: blocks,
        finalSectionProperties: baseDocument === null || baseDocument === void 0 ? void 0 : baseDocument.package.document.finalSectionProperties,
        sections: baseDocument === null || baseDocument === void 0 ? void 0 : baseDocument.package.document.sections,
        comments: baseDocument === null || baseDocument === void 0 ? void 0 : baseDocument.package.document.comments,
    };
    // If we have a base document, preserve its package structure
    if (baseDocument) {
        return Object.assign(Object.assign({}, baseDocument), { package: Object.assign(Object.assign({}, baseDocument.package), { document: documentBody }) });
    }
    // Create a minimal document structure
    return {
        package: {
            document: documentBody,
        },
    };
}
/**
 * Extract blocks (paragraphs and tables) from ProseMirror document
 */
function extractBlocks(pmDoc) {
    const blocks = [];
    const documentCounts = buildDocumentTrackedChangeCounts(pmDoc);
    pmDoc.forEach((node) => {
        if (node.type.name === 'paragraph') {
            blocks.push(convertPMParagraph(node, documentCounts));
        }
        else if (node.type.name === 'table') {
            blocks.push(convertPMTable(node, documentCounts));
        }
        else if (node.type.name === 'textBox') {
            // Convert text box back to a paragraph containing a shape with text body
            blocks.push(convertPMTextBox(node));
        }
        else if (node.type.name === 'pageBreak') {
            // Convert page break node to a paragraph with a page break run
            blocks.push(createPageBreakParagraph());
        }
    });
    return blocks;
}
/**
 * Create a paragraph containing only a page break run (for DOCX serialization)
 */
function createPageBreakParagraph() {
    const breakContent = { type: 'break', breakType: 'page' };
    const run = { type: 'run', content: [breakContent] };
    return {
        type: 'paragraph',
        content: [run],
    };
}
/**
 * Convert a ProseMirror paragraph node to our Paragraph type
 */
function convertPMParagraph(node, documentCounts) {
    const attrs = node.attrs;
    let content = insertCommentRanges(extractParagraphContent(node, documentCounts), node);
    // Emit BookmarkStart/End from bookmarks attr (for TOC anchors, cross-references)
    const bookmarks = attrs.bookmarks;
    if (bookmarks && bookmarks.length > 0) {
        const starts = bookmarks.map((b) => ({
            type: 'bookmarkStart',
            id: b.id,
            name: b.name,
        }));
        const ends = bookmarks.map((b) => ({
            type: 'bookmarkEnd',
            id: b.id,
        }));
        content = [...starts, ...content, ...ends];
    }
    const paragraph = {
        type: 'paragraph',
        paraId: attrs.paraId || undefined,
        textId: attrs.textId || undefined,
        formatting: paragraphAttrsToFormatting(attrs),
        content,
    };
    // Preserve `<w:lastRenderedPageBreak/>` so a save+reload doesn't silently
    // drop the break Word recorded for paginating this paragraph.
    if (attrs.renderedPageBreakBefore) {
        paragraph.renderedPageBreakBefore = true;
    }
    // Restore full section properties (round-trip) or fallback to break type only
    if (attrs._sectionProperties) {
        paragraph.sectionProperties =
            attrs._sectionProperties;
    }
    else if (attrs.sectionBreakType) {
        paragraph.sectionProperties = {
            sectionStart: attrs.sectionBreakType,
        };
    }
    return paragraph;
}
/**
 * Convert ProseMirror paragraph attrs to ParagraphFormatting
 */
/**
 * Scan paragraph PM node for comment marks and insert commentRangeStart/End
 * markers in the content array for round-trip serialization.
 */
function insertCommentRanges(content, paragraph) {
    // Collect which comment IDs appear as marks on child nodes
    const commentIds = new Set();
    paragraph.forEach((node) => {
        for (const mark of node.marks) {
            if (mark.type.name === 'comment') {
                commentIds.add(mark.attrs.commentId);
            }
        }
    });
    if (commentIds.size === 0)
        return content;
    // For each comment ID, find the first and last content item that belongs to it
    // and wrap with commentRangeStart/End
    const result = [];
    const openedComments = new Set();
    let nodeIndex = 0;
    paragraph.forEach((node) => {
        const nodeCommentIds = new Set();
        for (const mark of node.marks) {
            if (mark.type.name === 'comment') {
                nodeCommentIds.add(mark.attrs.commentId);
            }
        }
        // Close comments that are no longer active BEFORE pushing current content,
        // so commentRangeEnd lands after the last marked node, not after the first unmarked one
        for (const cid of [...openedComments]) {
            if (!nodeCommentIds.has(cid)) {
                result.push({ type: 'commentRangeEnd', id: cid });
                openedComments.delete(cid);
            }
        }
        // Open new comments
        for (const cid of nodeCommentIds) {
            if (!openedComments.has(cid)) {
                result.push({ type: 'commentRangeStart', id: cid });
                openedComments.add(cid);
            }
        }
        // Push the actual content item
        if (nodeIndex < content.length) {
            result.push(content[nodeIndex]);
        }
        nodeIndex++;
    });
    // Close any remaining open comments
    for (const cid of openedComments) {
        result.push({ type: 'commentRangeEnd', id: cid });
    }
    return result;
}
function paragraphAttrsToFormatting(attrs) {
    var _a;
    // If we have the original inline formatting from the DOCX, use it as a base
    // for lossless round-trip. This preserves properties like contextualSpacing,
    // widowControl, beforeAutospacing, runProperties, etc. that aren't tracked
    // as individual PM attrs. It also avoids "inlining" style-inherited values
    // (spacing, indentation, numPr) which would override style definitions
    // and break rendering in Word/Pages/Google Docs.
    //
    // We then apply overrides for any properties the user may have changed
    // via editor commands (alignment, list toggle, etc.).
    if (attrs._originalFormatting) {
        const orig = attrs._originalFormatting;
        const result = Object.assign({}, orig);
        // Override properties that user may have changed via editor commands.
        // Only override if the PM attr differs from the original value.
        if (attrs.alignment !== (orig.alignment || undefined)) {
            result.alignment = attrs.alignment || undefined;
        }
        if (attrs.numPr !== orig.numPr) {
            // Use JSON comparison since these are objects
            if (JSON.stringify(attrs.numPr) !== JSON.stringify(orig.numPr)) {
                result.numPr = attrs.numPr || undefined;
            }
        }
        if (attrs.styleId !== (orig.styleId || undefined)) {
            result.styleId = attrs.styleId || undefined;
        }
        if (attrs.pageBreakBefore !== (orig.pageBreakBefore || undefined)) {
            result.pageBreakBefore = attrs.pageBreakBefore || undefined;
        }
        if (attrs.bidi !== (orig.bidi || undefined)) {
            result.bidi = attrs.bidi || undefined;
        }
        return result;
    }
    // Fallback: reconstruct formatting from individual attrs (e.g. for
    // newly created paragraphs that don't have _originalFormatting)
    const hasFormatting = attrs.alignment ||
        attrs.spaceBefore ||
        attrs.spaceAfter ||
        attrs.lineSpacing ||
        attrs.indentLeft ||
        attrs.indentRight ||
        attrs.indentFirstLine ||
        attrs.numPr ||
        attrs.styleId ||
        attrs.borders ||
        attrs.shading ||
        attrs.tabs ||
        attrs.outlineLevel != null ||
        attrs.contextualSpacing ||
        attrs.bidi;
    if (!hasFormatting) {
        return undefined;
    }
    return {
        alignment: attrs.alignment || undefined,
        spaceBefore: attrs.spaceBefore || undefined,
        spaceAfter: attrs.spaceAfter || undefined,
        lineSpacing: attrs.lineSpacing || undefined,
        lineSpacingRule: attrs.lineSpacingRule || undefined,
        indentLeft: attrs.indentLeft || undefined,
        indentRight: attrs.indentRight || undefined,
        indentFirstLine: attrs.indentFirstLine || undefined,
        hangingIndent: attrs.hangingIndent || undefined,
        numPr: attrs.numPr || undefined,
        styleId: attrs.styleId || undefined,
        borders: attrs.borders || undefined,
        shading: attrs.shading || undefined,
        tabs: attrs.tabs || undefined,
        outlineLevel: (_a = attrs.outlineLevel) !== null && _a !== void 0 ? _a : undefined,
        contextualSpacing: attrs.contextualSpacing || undefined,
        bidi: attrs.bidi || undefined,
    };
}
/**
 * Extract paragraph content (runs, hyperlinks) from ProseMirror paragraph
 *
 * Coalesces consecutive text with the same marks into single Runs
 * for efficient DOCX representation.
 */
function extractParagraphContent(paragraph, documentCounts) {
    const content = [];
    const trackedChangeCounts = documentCounts !== null && documentCounts !== void 0 ? documentCounts : buildDocumentTrackedChangeCounts(paragraph);
    // Track current run being built
    let currentRun = null;
    let currentMarksKey = null;
    let currentHyperlink = null;
    paragraph.forEach((node) => {
        var _a, _b;
        // Check for footnote/endnote reference mark
        const noteRefMark = node.marks.find((m) => m.type.name === 'footnoteRef');
        if (noteRefMark) {
            // Finish any current content
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            if (currentHyperlink) {
                content.push(currentHyperlink);
                currentHyperlink = null;
            }
            const noteType = noteRefMark.attrs.noteType === 'endnote' ? 'endnoteRef' : 'footnoteRef';
            const noteRef = {
                type: noteType,
                id: parseInt(noteRefMark.attrs.id, 10) || 0,
            };
            content.push({
                type: 'run',
                content: [noteRef],
            });
            return;
        }
        // Check for tracked change marks (insertion/deletion)
        const insertionMark = node.marks.find((m) => m.type.name === 'insertion');
        const deletionMark = node.marks.find((m) => m.type.name === 'deletion');
        if (insertionMark || deletionMark) {
            // Finish any current content
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            if (currentHyperlink) {
                content.push(currentHyperlink);
                currentHyperlink = null;
            }
            const changeMark = (insertionMark || deletionMark);
            // Filter out the tracked change mark for text formatting extraction
            const otherMarks = node.marks.filter((m) => m.type.name !== 'insertion' && m.type.name !== 'deletion');
            const formatting = marksToTextFormatting(otherMarks);
            const run = Object.assign({ type: 'run', content: node.isText && node.text ? [{ type: 'text', text: node.text }] : [] }, (Object.keys(formatting).length > 0 ? { formatting } : {}));
            const info = {
                id: changeMark.attrs.revisionId,
                author: changeMark.attrs.author || 'Unknown',
                date: changeMark.attrs.date || undefined,
            };
            const revisionId = info.id;
            const hasInsertionForId = ((_a = trackedChangeCounts.insertionById.get(revisionId)) !== null && _a !== void 0 ? _a : 0) > 0;
            const hasDeletionForId = ((_b = trackedChangeCounts.deletionById.get(revisionId)) !== null && _b !== void 0 ? _b : 0) > 0;
            const isMovePair = hasInsertionForId && hasDeletionForId;
            if (insertionMark) {
                if (isMovePair) {
                    content.push({ type: 'moveTo', info, content: [run] });
                }
                else {
                    content.push({ type: 'insertion', info, content: [run] });
                }
            }
            else {
                if (isMovePair) {
                    content.push({ type: 'moveFrom', info, content: [run] });
                }
                else {
                    content.push({ type: 'deletion', info, content: [run] });
                }
            }
            return;
        }
        // Check for hyperlink mark
        const linkMark = node.marks.find((m) => m.type.name === 'hyperlink');
        if (linkMark) {
            // Start or continue hyperlink
            const linkKey = getLinkKey(linkMark);
            const currentKey = (currentHyperlink === null || currentHyperlink === void 0 ? void 0 : currentHyperlink.href) || ((currentHyperlink === null || currentHyperlink === void 0 ? void 0 : currentHyperlink.anchor) ? `#${currentHyperlink.anchor}` : '');
            if (currentHyperlink && currentKey === linkKey) {
                // Continue current hyperlink
                addNodeToHyperlink(currentHyperlink, node);
            }
            else {
                // Finish previous content
                if (currentRun) {
                    content.push(currentRun);
                    currentRun = null;
                    currentMarksKey = null;
                }
                if (currentHyperlink) {
                    content.push(currentHyperlink);
                }
                // Start new hyperlink
                currentHyperlink = createHyperlink(linkMark);
                addNodeToHyperlink(currentHyperlink, node);
            }
            return;
        }
        // Not in hyperlink - finish any current hyperlink
        if (currentHyperlink) {
            content.push(currentHyperlink);
            currentHyperlink = null;
        }
        // Handle node types
        if (node.isText) {
            const marksKey = getMarksKey(node.marks);
            if (currentRun && currentMarksKey === marksKey) {
                // Append to current run
                appendTextToRun(currentRun, node.text || '');
            }
            else {
                // Start new run
                if (currentRun) {
                    content.push(currentRun);
                }
                currentRun = createRunFromText(node.text || '', node.marks);
                currentMarksKey = marksKey;
            }
        }
        else if (node.type.name === 'hardBreak') {
            // Hard break ends current run
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createBreakRun());
        }
        else if (node.type.name === 'image') {
            // Image ends current run
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createImageRun(node));
        }
        else if (node.type.name === 'shape') {
            // Shape ends current run
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createShapeRun(node));
        }
        else if (node.type.name === 'tab') {
            // Tab ends current run
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createTabRun());
        }
        else if (node.type.name === 'field') {
            // Field ends current run and emits a field content item
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createFieldFromNode(node, node.marks));
        }
        else if (node.type.name === 'sdt') {
            // SDT ends current run and emits an InlineSdt content item
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createInlineSdtFromNode(node));
        }
        else if (node.type.name === 'math') {
            // Math ends current run and emits a MathEquation content item
            if (currentRun) {
                content.push(currentRun);
                currentRun = null;
                currentMarksKey = null;
            }
            content.push(createMathFromNode(node));
        }
    });
    // Don't forget the last run/hyperlink
    if (currentRun) {
        content.push(currentRun);
    }
    if (currentHyperlink) {
        content.push(currentHyperlink);
    }
    return content;
}
/**
 * Build document-wide tracked change counts by scanning all nodes.
 * Used for cross-paragraph move pair detection (moveFrom in one paragraph,
 * moveTo in another).
 */
function buildDocumentTrackedChangeCounts(pmDoc) {
    const insertionById = new Map();
    const deletionById = new Map();
    pmDoc.descendants((node) => {
        var _a, _b;
        const insertionMark = node.marks.find((m) => m.type.name === 'insertion');
        const deletionMark = node.marks.find((m) => m.type.name === 'deletion');
        if (insertionMark) {
            const revisionId = Number(insertionMark.attrs.revisionId);
            if (Number.isFinite(revisionId)) {
                insertionById.set(revisionId, ((_a = insertionById.get(revisionId)) !== null && _a !== void 0 ? _a : 0) + 1);
            }
        }
        if (deletionMark) {
            const revisionId = Number(deletionMark.attrs.revisionId);
            if (Number.isFinite(revisionId)) {
                deletionById.set(revisionId, ((_b = deletionById.get(revisionId)) !== null && _b !== void 0 ? _b : 0) + 1);
            }
        }
    });
    return { insertionById, deletionById };
}
/**
 * Create a unique key for a link mark
 */
function getLinkKey(mark) {
    return mark.attrs.href || '';
}
/**
 * Create a unique key for a set of marks (excluding hyperlink)
 */
function getMarksKey(marks) {
    const nonLinkMarks = marks.filter((m) => m.type.name !== 'hyperlink');
    if (nonLinkMarks.length === 0)
        return '';
    return nonLinkMarks
        .map((m) => `${m.type.name}:${JSON.stringify(m.attrs)}`)
        .sort()
        .join('|');
}
/**
 * Create a Hyperlink from a link mark
 */
function createHyperlink(linkMark) {
    const href = linkMark.attrs.href;
    // Internal bookmark links use the anchor property in OOXML
    if (href === null || href === void 0 ? void 0 : href.startsWith('#')) {
        return {
            type: 'hyperlink',
            anchor: href.substring(1),
            tooltip: linkMark.attrs.tooltip || undefined,
            children: [],
        };
    }
    return {
        type: 'hyperlink',
        href,
        tooltip: linkMark.attrs.tooltip || undefined,
        rId: linkMark.attrs.rId || undefined,
        children: [],
    };
}
/**
 * Add a node to a hyperlink
 */
function addNodeToHyperlink(hyperlink, node) {
    if (node.isText && node.text) {
        const nonLinkMarks = node.marks.filter((m) => m.type.name !== 'hyperlink');
        const run = createRunFromText(node.text, nonLinkMarks);
        hyperlink.children.push(run);
    }
}
/**
 * Create a Run from text and marks
 */
function createRunFromText(text, marks) {
    const formatting = marksToTextFormatting(marks);
    const textContent = {
        type: 'text',
        text,
    };
    return {
        type: 'run',
        formatting: Object.keys(formatting).length > 0 ? formatting : undefined,
        content: [textContent],
    };
}
/**
 * Append text to an existing run
 */
function appendTextToRun(run, text) {
    const lastContent = run.content[run.content.length - 1];
    if (lastContent && lastContent.type === 'text') {
        lastContent.text += text;
    }
    else {
        run.content.push({ type: 'text', text });
    }
}
/**
 * Create a Run containing a line break
 */
function createBreakRun() {
    const breakContent = {
        type: 'break',
        breakType: 'textWrapping',
    };
    return {
        type: 'run',
        content: [breakContent],
    };
}
/**
 * Create a Run containing a tab
 */
function createTabRun() {
    const tabContent = {
        type: 'tab',
    };
    return {
        type: 'run',
        content: [tabContent],
    };
}
/**
 * Create a SimpleField or ComplexField from a PM field node
 */
function createFieldFromNode(node, marks) {
    const attrs = node.attrs;
    const formatting = marks && marks.length > 0 ? marksToTextFormatting(marks) : undefined;
    // Provide fallback display text for dynamic fields so <w:t> is never empty
    let displayText = attrs.displayText || '';
    if (!displayText) {
        switch (attrs.fieldType) {
            case 'PAGE':
                displayText = '1';
                break;
            case 'NUMPAGES':
                displayText = '1';
                break;
            default:
                displayText = ' ';
                break;
        }
    }
    const displayRun = Object.assign({ type: 'run', content: [{ type: 'text', text: displayText }] }, (formatting && Object.keys(formatting).length > 0 ? { formatting } : {}));
    if (attrs.fieldKind === 'complex') {
        return {
            type: 'complexField',
            instruction: attrs.instruction,
            fieldType: attrs.fieldType,
            fieldCode: [],
            fieldResult: [displayRun],
            fldLock: attrs.fldLock || undefined,
            dirty: attrs.dirty || undefined,
        };
    }
    return {
        type: 'simpleField',
        instruction: attrs.instruction,
        fieldType: attrs.fieldType,
        content: [displayRun],
        fldLock: attrs.fldLock || undefined,
        dirty: attrs.dirty || undefined,
    };
}
/**
 * Create a MathEquation from a PM math node
 */
function createMathFromNode(node) {
    var _a;
    const attrs = node.attrs;
    const display = attrs.display || 'inline';
    // Authored equations carry MathML but no OMML until they're saved —
    // derive native OMML from the MathML so they round-trip into the .docx
    // as real math (not lost, not an image). Word-imported equations keep
    // their original preserved OMML.
    let ommlXml = attrs.ommlXml;
    if (!ommlXml && attrs.mathml) {
        ommlXml = (_a = mathmlToOmml(attrs.mathml, { display })) !== null && _a !== void 0 ? _a : '';
    }
    return {
        type: 'mathEquation',
        display,
        ommlXml,
        plainText: attrs.plainText || undefined,
    };
}
/**
 * Create an InlineSdt from a PM sdt node
 */
function createInlineSdtFromNode(node) {
    var _a, _b, _c, _d, _e, _f, _g;
    const attrs = node.attrs;
    const properties = {
        sdtType: (_a = attrs.sdtType) !== null && _a !== void 0 ? _a : 'richText',
        alias: (_b = attrs.alias) !== null && _b !== void 0 ? _b : undefined,
        tag: (_c = attrs.tag) !== null && _c !== void 0 ? _c : undefined,
        lock: (_d = attrs.lock) !== null && _d !== void 0 ? _d : undefined,
        placeholder: (_e = attrs.placeholder) !== null && _e !== void 0 ? _e : undefined,
        showingPlaceholder: (_f = attrs.showingPlaceholder) !== null && _f !== void 0 ? _f : undefined,
        dateFormat: (_g = attrs.dateFormat) !== null && _g !== void 0 ? _g : undefined,
        listItems: attrs.listItems ? JSON.parse(attrs.listItems) : undefined,
        checked: attrs.checked != null ? attrs.checked : undefined,
    };
    // Extract content from the sdt node's children
    const sdtContent = extractParagraphContent(node);
    const content = sdtContent.filter((c) => c.type === 'run' || c.type === 'hyperlink');
    return {
        type: 'inlineSdt',
        properties,
        content,
    };
}
/**
 * Create a Run containing an image
 */
function createImageRun(node) {
    var _a, _b;
    const attrs = node.attrs;
    // Determine wrap type from attrs (default: inline)
    const wrapType = attrs.wrapType || 'inline';
    const wrap = { type: wrapType };
    if (attrs.distTop !== undefined)
        wrap.distT = pixelsToEmu(attrs.distTop);
    if (attrs.distBottom !== undefined)
        wrap.distB = pixelsToEmu(attrs.distBottom);
    if (attrs.distLeft !== undefined)
        wrap.distL = pixelsToEmu(attrs.distLeft);
    if (attrs.distRight !== undefined)
        wrap.distR = pixelsToEmu(attrs.distRight);
    // Restore wrapText from PM attr
    if (attrs.wrapText) {
        wrap.wrapText = attrs.wrapText;
    }
    const image = {
        type: 'image',
        rId: attrs.rId || '',
        src: attrs.src,
        alt: attrs.alt || undefined,
        title: attrs.title || undefined,
        size: {
            width: pixelsToEmu(attrs.width || 0),
            height: pixelsToEmu(attrs.height || 0),
        },
        wrap,
    };
    // Parse CSS transform string back to ImageTransform for round-trip
    if (attrs.transform) {
        const transformStr = attrs.transform;
        const imgTransform = {};
        const rotateMatch = transformStr.match(/rotate\(([-\d.]+)deg\)/);
        if (rotateMatch) {
            imgTransform.rotation = parseFloat(rotateMatch[1]);
        }
        if (transformStr.includes('scaleX(-1)')) {
            imgTransform.flipH = true;
        }
        if (transformStr.includes('scaleY(-1)')) {
            imgTransform.flipV = true;
        }
        if (imgTransform.rotation || imgTransform.flipH || imgTransform.flipV) {
            image.transform = imgTransform;
        }
    }
    // Round-trip floating image position (ImagePositionAttrs uses loose strings;
    // cast to the strict OOXML union types for the Document model)
    if (((_a = attrs.position) === null || _a === void 0 ? void 0 : _a.horizontal) && ((_b = attrs.position) === null || _b === void 0 ? void 0 : _b.vertical)) {
        const pos = attrs.position;
        image.position = {
            horizontal: {
                relativeTo: (pos.horizontal.relativeTo || 'column'),
                alignment: pos.horizontal.align,
                posOffset: pos.horizontal.posOffset,
            },
            vertical: {
                relativeTo: (pos.vertical.relativeTo || 'paragraph'),
                alignment: pos.vertical.align,
                posOffset: pos.vertical.posOffset,
            },
        };
    }
    // Round-trip border/outline
    if (attrs.borderWidth && attrs.borderWidth > 0) {
        const cssToOoxmlStyle = {
            solid: 'solid',
            dotted: 'dot',
            dashed: 'dash',
            double: 'solid',
            groove: 'solid',
            ridge: 'solid',
            inset: 'solid',
            outset: 'solid',
        };
        image.outline = {
            width: pixelsToEmu(attrs.borderWidth),
            color: attrs.borderColor ? { rgb: attrs.borderColor.replace('#', '') } : undefined,
            style: attrs.borderStyle
                ? cssToOoxmlStyle[attrs.borderStyle] || 'solid'
                : 'solid',
        };
    }
    // Round-trip image hyperlink
    if (attrs.hlinkHref) {
        image.hlinkHref = attrs.hlinkHref;
    }
    // Round-trip wp:srcRect crop fractions
    if (attrs.cropTop !== undefined ||
        attrs.cropRight !== undefined ||
        attrs.cropBottom !== undefined ||
        attrs.cropLeft !== undefined) {
        const crop = {};
        if (attrs.cropTop !== undefined && attrs.cropTop !== null)
            crop.top = attrs.cropTop;
        if (attrs.cropRight !== undefined && attrs.cropRight !== null)
            crop.right = attrs.cropRight;
        if (attrs.cropBottom !== undefined && attrs.cropBottom !== null)
            crop.bottom = attrs.cropBottom;
        if (attrs.cropLeft !== undefined && attrs.cropLeft !== null)
            crop.left = attrs.cropLeft;
        if (Object.keys(crop).length > 0)
            image.crop = crop;
    }
    // Round-trip a:alphaModFix opacity
    if (attrs.opacity !== undefined && attrs.opacity !== null && attrs.opacity < 1) {
        image.opacity = attrs.opacity;
    }
    // Round-trip wp:anchor layoutInCell / allowOverlap (tri-state)
    if (attrs.layoutInCell !== undefined && attrs.layoutInCell !== null) {
        image.layoutInCell = attrs.layoutInCell;
    }
    if (attrs.allowOverlap !== undefined && attrs.allowOverlap !== null) {
        image.allowOverlap = attrs.allowOverlap;
    }
    // Round-trip wp:effectExtent padding (px → EMU)
    if (attrs.effectExtentTop ||
        attrs.effectExtentBottom ||
        attrs.effectExtentLeft ||
        attrs.effectExtentRight) {
        const padding = {};
        if (attrs.effectExtentTop)
            padding.top = pixelsToEmu(attrs.effectExtentTop);
        if (attrs.effectExtentBottom)
            padding.bottom = pixelsToEmu(attrs.effectExtentBottom);
        if (attrs.effectExtentLeft)
            padding.left = pixelsToEmu(attrs.effectExtentLeft);
        if (attrs.effectExtentRight)
            padding.right = pixelsToEmu(attrs.effectExtentRight);
        if (Object.keys(padding).length > 0)
            image.padding = padding;
    }
    const drawingContent = {
        type: 'drawing',
        image,
    };
    return {
        type: 'run',
        content: [drawingContent],
    };
}
/**
 * Create a Run from a ProseMirror shape node
 */
function createShapeRun(node) {
    const attrs = node.attrs;
    const shape = {
        type: 'shape',
        shapeType: (attrs.shapeType || 'rect'),
        id: attrs.shapeId || undefined,
        size: {
            width: attrs.width ? pixelsToEmu(attrs.width) : 0,
            height: attrs.height ? pixelsToEmu(attrs.height) : 0,
        },
    };
    // Fill
    if (attrs.fillType === 'gradient' && attrs.gradientStops) {
        // Round-trip gradient fill
        try {
            const parsed = JSON.parse(attrs.gradientStops);
            shape.fill = {
                type: 'gradient',
                gradient: {
                    type: (attrs.gradientType || 'linear'),
                    angle: attrs.gradientAngle || undefined,
                    stops: parsed.map((s) => ({
                        position: s.position,
                        color: { rgb: s.color.replace('#', '') },
                    })),
                },
            };
        }
        catch (_a) {
            shape.fill = {
                type: 'solid',
                color: { rgb: (attrs.fillColor || '000000').replace('#', '') },
            };
        }
    }
    else if (attrs.fillColor) {
        shape.fill = {
            type: (attrs.fillType || 'solid'),
            color: { rgb: attrs.fillColor.replace('#', '') },
        };
    }
    else if (attrs.fillType === 'none') {
        shape.fill = { type: 'none' };
    }
    // Outline
    if (attrs.outlineWidth && attrs.outlineWidth > 0) {
        const cssToOoxml = {
            solid: 'solid',
            dotted: 'dot',
            dashed: 'dash',
        };
        shape.outline = {
            width: pixelsToEmu(attrs.outlineWidth),
            color: attrs.outlineColor ? { rgb: attrs.outlineColor.replace('#', '') } : undefined,
            style: attrs.outlineStyle
                ? cssToOoxml[attrs.outlineStyle] ||
                    'solid'
                : 'solid',
        };
    }
    // Restore the original OOXML envelope so the serializer re-emits the drawing
    // verbatim (the rawXml invariant: when set, model-based emission is skipped).
    // This is what makes drawings survive a from-PM rebuild — structural edit,
    // collab peer, or server snapshot — instead of being dropped.
    if (attrs.rawXml)
        shape.rawXml = attrs.rawXml;
    if (attrs.envelopeKey)
        shape.envelopeKey = attrs.envelopeKey;
    const shapeContent = { type: 'shape', shape };
    return {
        type: 'run',
        content: [shapeContent],
    };
}
/**
 * Convert ProseMirror marks to TextFormatting
 */
function marksToTextFormatting(marks) {
    const formatting = {};
    for (const mark of marks) {
        switch (mark.type.name) {
            case 'bold':
                formatting.bold = true;
                formatting.boldCs = true;
                break;
            case 'italic':
                formatting.italic = true;
                formatting.italicCs = true;
                break;
            case 'underline': {
                const attrs = mark.attrs;
                formatting.underline = {
                    style: attrs.style || 'single',
                    color: attrs.color,
                };
                break;
            }
            case 'strike':
                if (mark.attrs.double) {
                    formatting.doubleStrike = true;
                }
                else {
                    formatting.strike = true;
                }
                break;
            case 'textColor': {
                const attrs = mark.attrs;
                formatting.color = {
                    rgb: attrs.rgb,
                    themeColor: attrs.themeColor,
                    themeTint: attrs.themeTint,
                    themeShade: attrs.themeShade,
                    auto: attrs.auto || undefined,
                };
                break;
            }
            case 'highlight':
                formatting.highlight = mark.attrs.color;
                break;
            case 'runShading': {
                const attrs = mark.attrs;
                if (attrs.shading) {
                    formatting.shading = attrs.shading;
                }
                break;
            }
            case 'fontSize':
                formatting.fontSize = mark.attrs.size;
                formatting.fontSizeCs = mark.attrs.size;
                break;
            case 'fontFamily': {
                const attrs = mark.attrs;
                formatting.fontFamily = {
                    ascii: attrs.ascii,
                    hAnsi: attrs.hAnsi,
                    eastAsia: attrs.eastAsia || undefined,
                    // Use stored cs value, falling back to ascii for Complex Script compatibility
                    cs: attrs.cs || attrs.ascii || undefined,
                    // asciiTheme needs to be cast to the proper type or undefined
                    asciiTheme: attrs.asciiTheme,
                    hAnsiTheme: attrs.hAnsiTheme || undefined,
                    eastAsiaTheme: attrs.eastAsiaTheme || undefined,
                    csTheme: attrs.csTheme || undefined,
                };
                break;
            }
            case 'superscript':
                formatting.vertAlign = 'superscript';
                break;
            case 'subscript':
                formatting.vertAlign = 'subscript';
                break;
            case 'allCaps':
                formatting.allCaps = true;
                break;
            case 'smallCaps':
                formatting.smallCaps = true;
                break;
            case 'characterSpacing': {
                if (mark.attrs.spacing != null)
                    formatting.spacing = mark.attrs.spacing;
                if (mark.attrs.position != null)
                    formatting.position = mark.attrs.position;
                if (mark.attrs.scale != null)
                    formatting.scale = mark.attrs.scale;
                if (mark.attrs.kerning != null)
                    formatting.kerning = mark.attrs.kerning;
                break;
            }
            case 'emboss':
                formatting.emboss = true;
                break;
            case 'imprint':
                formatting.imprint = true;
                break;
            case 'textShadow':
                formatting.shadow = true;
                break;
            case 'emphasisMark':
                formatting.emphasisMark = mark.attrs.type || 'dot';
                break;
            case 'textOutline':
                formatting.outline = true;
                break;
            case 'hidden':
                formatting.hidden = true;
                break;
            case 'rtl':
                formatting.rtl = true;
                break;
            case 'textEffect':
                formatting.effect = mark.attrs.effect || 'blinkBackground';
                break;
            // hyperlink is handled separately
        }
    }
    return formatting;
}
// ============================================================================
// TABLE CONVERSION
// ============================================================================
/**
 * Convert a ProseMirror table node to our Table type
 */
function inferTableBorders(rows) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    for (const row of rows) {
        for (const cell of row.cells) {
            const borders = (_a = cell.formatting) === null || _a === void 0 ? void 0 : _a.borders;
            if (borders) {
                const base = borders.top ||
                    borders.left ||
                    borders.right ||
                    borders.bottom ||
                    borders.insideH ||
                    borders.insideV;
                if (!base)
                    return undefined;
                return {
                    top: (_b = borders.top) !== null && _b !== void 0 ? _b : base,
                    bottom: (_c = borders.bottom) !== null && _c !== void 0 ? _c : base,
                    left: (_d = borders.left) !== null && _d !== void 0 ? _d : base,
                    right: (_e = borders.right) !== null && _e !== void 0 ? _e : base,
                    insideH: (_g = (_f = borders.insideH) !== null && _f !== void 0 ? _f : borders.bottom) !== null && _g !== void 0 ? _g : base,
                    insideV: (_j = (_h = borders.insideV) !== null && _h !== void 0 ? _h : borders.right) !== null && _j !== void 0 ? _j : base,
                };
            }
        }
    }
    return undefined;
}
function collectPMTableAnchors(node, documentCounts) {
    const occupied = [];
    const anchors = [];
    let totalCols = 0;
    for (let rowIndex = 0; rowIndex < node.childCount; rowIndex++) {
        const rowNode = node.child(rowIndex);
        let colIndex = 0;
        rowNode.forEach((cellNode) => {
            var _a, _b;
            if (cellNode.type.name !== 'tableCell' && cellNode.type.name !== 'tableHeader')
                return;
            while ((_a = occupied[rowIndex]) === null || _a === void 0 ? void 0 : _a[colIndex])
                colIndex++;
            const rowspan = cellNode.attrs.rowspan || 1;
            const colspan = cellNode.attrs.colspan || 1;
            anchors.push({
                row: rowIndex,
                col: colIndex,
                rowspan,
                colspan,
                cell: convertPMTableCell(cellNode, documentCounts),
            });
            for (let r = rowIndex; r < rowIndex + rowspan; r++) {
                const rowSlots = (_b = occupied[r]) !== null && _b !== void 0 ? _b : [];
                occupied[r] = rowSlots;
                for (let c = colIndex; c < colIndex + colspan; c++) {
                    rowSlots[c] = true;
                }
            }
            colIndex += colspan;
            totalCols = Math.max(totalCols, colIndex);
        });
    }
    return { anchors, totalCols };
}
function convertPMTable(node, documentCounts) {
    var _a, _b;
    const attrs = node.attrs;
    const { anchors, totalCols } = collectPMTableAnchors(node, documentCounts);
    const anchorByStart = new Map();
    const anchorByCoveredSlot = new Map();
    for (const anchor of anchors) {
        anchorByStart.set(`${anchor.row}-${anchor.col}`, anchor);
        for (let row = anchor.row; row < anchor.row + anchor.rowspan; row++) {
            for (let col = anchor.col; col < anchor.col + anchor.colspan; col++) {
                anchorByCoveredSlot.set(`${row}-${col}`, anchor);
            }
        }
    }
    const rows = [];
    for (let rowIndex = 0; rowIndex < node.childCount; rowIndex++) {
        const rowNode = node.child(rowIndex);
        const cells = [];
        for (let colIndex = 0; colIndex < totalCols;) {
            const anchor = anchorByStart.get(`${rowIndex}-${colIndex}`);
            if (anchor) {
                const formatting = Object.assign({}, ((_a = anchor.cell.formatting) !== null && _a !== void 0 ? _a : {}));
                if (anchor.colspan > 1) {
                    formatting.gridSpan = anchor.colspan;
                }
                else {
                    delete formatting.gridSpan;
                }
                if (anchor.rowspan > 1) {
                    formatting.vMerge = 'restart';
                }
                else {
                    delete formatting.vMerge;
                }
                cells.push(Object.assign(Object.assign({}, anchor.cell), { formatting: Object.keys(formatting).length ? formatting : undefined }));
                colIndex += anchor.colspan;
                continue;
            }
            const coveringAnchor = anchorByCoveredSlot.get(`${rowIndex}-${colIndex}`);
            if (!coveringAnchor) {
                colIndex++;
                continue;
            }
            const formatting = Object.assign({}, ((_b = coveringAnchor.cell.formatting) !== null && _b !== void 0 ? _b : {}));
            if (coveringAnchor.colspan > 1) {
                formatting.gridSpan = coveringAnchor.colspan;
            }
            else {
                delete formatting.gridSpan;
            }
            formatting.vMerge = 'continue';
            cells.push(Object.assign(Object.assign({}, coveringAnchor.cell), { content: [], formatting }));
            colIndex += coveringAnchor.colspan;
        }
        rows.push({
            type: 'tableRow',
            formatting: tableRowAttrsToFormatting(rowNode.attrs),
            cells,
        });
    }
    const formatting = tableAttrsToFormatting(attrs) || undefined;
    if (!(formatting === null || formatting === void 0 ? void 0 : formatting.borders)) {
        const inferredBorders = inferTableBorders(rows);
        if (inferredBorders) {
            if (formatting) {
                formatting.borders = inferredBorders;
            }
            else {
                // No other formatting — create a minimal formatting object with borders
                // so borders persist on round-trip.
                return {
                    type: 'table',
                    columnWidths: attrs.columnWidths || undefined,
                    formatting: { borders: inferredBorders },
                    rows,
                };
            }
        }
    }
    return {
        type: 'table',
        columnWidths: attrs.columnWidths || undefined,
        formatting,
        rows,
    };
}
/**
 * Convert ProseMirror table attrs to TableFormatting
 */
function tableAttrsToFormatting(attrs) {
    var _a, _b, _c, _d;
    // If we have the original formatting from the DOCX, use it as a base
    // for lossless round-trip. This preserves properties like cellSpacing,
    // indent, layout, bidi, overlap, shading that aren't tracked as PM attrs.
    if (attrs._originalFormatting) {
        const orig = attrs._originalFormatting;
        const result = Object.assign({}, orig);
        // Override properties that user may have changed via editor commands
        if (attrs.styleId !== (orig.styleId || undefined)) {
            result.styleId = attrs.styleId || undefined;
        }
        if (attrs.justification !== (orig.justification || undefined)) {
            result.justification = attrs.justification || undefined;
        }
        if (attrs.floating !== (orig.floating || undefined)) {
            result.floating = attrs.floating || undefined;
        }
        if (attrs.look !== (orig.look || undefined)) {
            result.look = attrs.look || undefined;
        }
        // Width: check if changed
        const origWidthVal = (_a = orig.width) === null || _a === void 0 ? void 0 : _a.value;
        const origWidthType = (_b = orig.width) === null || _b === void 0 ? void 0 : _b.type;
        if (attrs.width !== origWidthVal || attrs.widthType !== origWidthType) {
            if (attrs.width != null || attrs.widthType) {
                result.width = {
                    value: (_c = attrs.width) !== null && _c !== void 0 ? _c : 0,
                    type: attrs.widthType || 'dxa',
                };
            }
            else {
                result.width = undefined;
            }
        }
        // CellMargins: override if changed
        if (attrs.cellMargins) {
            result.cellMargins = {
                top: attrs.cellMargins.top != null
                    ? { value: attrs.cellMargins.top, type: 'dxa' }
                    : undefined,
                bottom: attrs.cellMargins.bottom != null
                    ? { value: attrs.cellMargins.bottom, type: 'dxa' }
                    : undefined,
                left: attrs.cellMargins.left != null
                    ? { value: attrs.cellMargins.left, type: 'dxa' }
                    : undefined,
                right: attrs.cellMargins.right != null
                    ? { value: attrs.cellMargins.right, type: 'dxa' }
                    : undefined,
            };
        }
        return result;
    }
    // Fallback: reconstruct formatting from individual attrs (e.g. for
    // newly created tables that don't have _originalFormatting)
    const hasFormatting = attrs.styleId ||
        attrs.width != null ||
        attrs.widthType ||
        attrs.justification ||
        attrs.floating ||
        attrs.cellMargins ||
        attrs.look;
    if (!hasFormatting) {
        return undefined;
    }
    // Convert cellMargins back to CellMargins format (twips → TableMeasurement)
    const cellMargins = attrs.cellMargins
        ? {
            top: attrs.cellMargins.top != null
                ? { value: attrs.cellMargins.top, type: 'dxa' }
                : undefined,
            bottom: attrs.cellMargins.bottom != null
                ? { value: attrs.cellMargins.bottom, type: 'dxa' }
                : undefined,
            left: attrs.cellMargins.left != null
                ? { value: attrs.cellMargins.left, type: 'dxa' }
                : undefined,
            right: attrs.cellMargins.right != null
                ? { value: attrs.cellMargins.right, type: 'dxa' }
                : undefined,
        }
        : undefined;
    // Restore width — handle width=0 with type="auto" (common OOXML pattern)
    let width;
    if (attrs.width != null || attrs.widthType) {
        width = {
            value: (_d = attrs.width) !== null && _d !== void 0 ? _d : 0,
            type: attrs.widthType || 'dxa',
        };
    }
    return {
        styleId: attrs.styleId || undefined,
        width,
        justification: attrs.justification || undefined,
        floating: attrs.floating || undefined,
        cellMargins,
        look: attrs.look || undefined,
    };
}
/**
 * Convert ProseMirror table row attrs to TableRowFormatting
 */
function tableRowAttrsToFormatting(attrs) {
    var _a;
    // If we have the original formatting from the DOCX, use it as a base
    // for lossless round-trip. This preserves properties like cantSplit,
    // justification, hidden, conditionalFormat that aren't tracked as PM attrs.
    if (attrs._originalFormatting) {
        const orig = attrs._originalFormatting;
        const result = Object.assign({}, orig);
        // Override properties that user may have changed via editor commands
        if (attrs.height !== (((_a = orig.height) === null || _a === void 0 ? void 0 : _a.value) || undefined)) {
            result.height = attrs.height ? { value: attrs.height, type: 'dxa' } : undefined;
        }
        if (attrs.heightRule !== (orig.heightRule || undefined)) {
            result.heightRule = attrs.heightRule || undefined;
        }
        if (attrs.isHeader !== (orig.header || undefined)) {
            result.header = attrs.isHeader || undefined;
        }
        return result;
    }
    // Fallback: reconstruct formatting from individual attrs
    const hasFormatting = attrs.height || attrs.isHeader;
    if (!hasFormatting) {
        return undefined;
    }
    return {
        height: attrs.height
            ? {
                value: attrs.height,
                type: 'dxa',
            }
            : undefined,
        heightRule: attrs.heightRule || undefined,
        header: attrs.isHeader || undefined,
    };
}
/**
 * Convert a ProseMirror table cell node to our TableCell type
 */
function convertPMTableCell(node, documentCounts) {
    const attrs = node.attrs;
    const content = [];
    // Extract cell content (paragraphs and nested tables)
    node.forEach((contentNode) => {
        if (contentNode.type.name === 'paragraph') {
            content.push(convertPMParagraph(contentNode, documentCounts));
        }
        else if (contentNode.type.name === 'table') {
            content.push(convertPMTable(contentNode, documentCounts));
        }
    });
    return {
        type: 'tableCell',
        formatting: tableCellAttrsToFormatting(attrs),
        content,
    };
}
/**
 * Convert ProseMirror table cell attrs to TableCellFormatting
 * Borders are stored as full BorderSpec objects — no conversion needed.
 */
function tableCellAttrsToFormatting(attrs) {
    // If we have the original formatting from the DOCX, use it as a base
    // for lossless round-trip. This preserves properties like vMerge, fitText,
    // hideMark, conditionalFormat that aren't tracked as PM attrs.
    if (attrs._originalFormatting) {
        const orig = attrs._originalFormatting;
        const result = Object.assign({}, orig);
        // Override properties that user may have changed via editor commands
        if (attrs.colspan > 1) {
            result.gridSpan = attrs.colspan;
        }
        // Width: use != null to handle width=0 correctly
        if (attrs.width != null) {
            result.width = {
                value: attrs.width,
                type: attrs.widthType || 'dxa',
            };
        }
        if (attrs.verticalAlign !== (orig.verticalAlign || undefined)) {
            result.verticalAlign = attrs.verticalAlign || undefined;
        }
        if (attrs.backgroundColor) {
            // Preserve themeFill/tint/shade when the user hasn't changed the fill:
            // _originalResolvedFill is set at parse time to the resolved hex of the
            // original shading, so matching backgroundColor means nothing changed.
            if (attrs._originalResolvedFill === attrs.backgroundColor && orig.shading) {
                result.shading = orig.shading;
            }
            else {
                result.shading = { fill: { rgb: attrs.backgroundColor } };
            }
        }
        else if (orig.shading) {
            // User cleared the background color
            result.shading = undefined;
        }
        if (attrs.borders) {
            result.borders = attrs.borders;
        }
        if (attrs.margins) {
            const m = attrs.margins;
            const margins = {};
            if (m.top != null)
                margins.top = { value: m.top, type: 'dxa' };
            if (m.bottom != null)
                margins.bottom = { value: m.bottom, type: 'dxa' };
            if (m.left != null)
                margins.left = { value: m.left, type: 'dxa' };
            if (m.right != null)
                margins.right = { value: m.right, type: 'dxa' };
            result.margins = margins;
        }
        if (attrs.textDirection !== (orig.textDirection || undefined)) {
            result.textDirection =
                attrs.textDirection || undefined;
        }
        return result;
    }
    // Fallback: reconstruct formatting from individual attrs
    const hasFormatting = attrs.colspan > 1 ||
        attrs.rowspan > 1 ||
        attrs.width != null ||
        attrs.verticalAlign ||
        attrs.backgroundColor ||
        attrs.borders ||
        attrs.margins ||
        attrs.textDirection;
    if (!hasFormatting) {
        return undefined;
    }
    // Convert margins (twips values) back to TableMeasurement objects
    let margins;
    if (attrs.margins) {
        const m = attrs.margins;
        margins = {};
        if (m.top != null)
            margins.top = { value: m.top, type: 'dxa' };
        if (m.bottom != null)
            margins.bottom = { value: m.bottom, type: 'dxa' };
        if (m.left != null)
            margins.left = { value: m.left, type: 'dxa' };
        if (m.right != null)
            margins.right = { value: m.right, type: 'dxa' };
    }
    return {
        gridSpan: attrs.colspan > 1 ? attrs.colspan : undefined,
        width: attrs.width != null
            ? {
                value: attrs.width,
                type: attrs.widthType || 'dxa',
            }
            : undefined,
        verticalAlign: attrs.verticalAlign || undefined,
        textDirection: attrs.textDirection || undefined,
        shading: attrs.backgroundColor
            ? {
                fill: { rgb: attrs.backgroundColor },
            }
            : undefined,
        borders: attrs.borders,
        margins,
    };
}
// ============================================================================
// TEXT BOX CONVERSION
// ============================================================================
/**
 * Convert a ProseMirror textBox node back to a Paragraph wrapping a ShapeContent run.
 * The text box content becomes a Shape with textBody.
 */
function convertPMTextBox(node) {
    var _a, _b;
    const attrs = node.attrs;
    // Extract child paragraphs from the text box content
    const childParagraphs = [];
    node.forEach((child) => {
        if (child.type.name === 'paragraph') {
            childParagraphs.push(convertPMParagraph(child));
        }
        // Tables inside text boxes are currently not round-tripped
    });
    // Build shape with text body
    const shape = {
        type: 'shape',
        shapeType: 'rect',
        id: attrs.textBoxId || undefined,
        size: {
            width: attrs.width ? pixelsToEmu(attrs.width) : 0,
            height: attrs.height ? pixelsToEmu(attrs.height) : 0,
        },
        textBody: {
            content: childParagraphs.length > 0 ? childParagraphs : [{ type: 'paragraph', content: [] }],
            margins: {
                top: attrs.marginTop != null ? pixelsToEmu(attrs.marginTop) : undefined,
                bottom: attrs.marginBottom != null ? pixelsToEmu(attrs.marginBottom) : undefined,
                left: attrs.marginLeft != null ? pixelsToEmu(attrs.marginLeft) : undefined,
                right: attrs.marginRight != null ? pixelsToEmu(attrs.marginRight) : undefined,
            },
        },
    };
    // Restore the original OOXML envelope so the serializer re-emits this drawing
    // verbatim (rawXml invariant) — the core of surviving a from-PM rebuild from a
    // structural edit / collab peer / server snapshot.
    if (attrs.rawXml)
        shape.rawXml = attrs.rawXml;
    if (attrs.envelopeKey)
        shape.envelopeKey = attrs.envelopeKey;
    // Convert fill color back
    if (attrs.fillColor) {
        shape.fill = {
            type: 'solid',
            color: { rgb: attrs.fillColor.replace('#', '') },
        };
    }
    // Round-trip anchor position so a save-then-reload preserves the
    // shape's posOffset / relativeFrom / alignment. These are honored at
    // layout time (`layoutAnchoredTextBox`) AND must survive editing —
    // otherwise every save would degrade anchored shapes to inline-flow,
    // even if the user never touched them. The Format-panel Position X/Y
    // control writes margin-relative offsets through this same path.
    if (attrs.posOffsetH != null ||
        attrs.posOffsetV != null ||
        attrs.posAlignH ||
        attrs.posAlignV ||
        attrs.posRelFromH ||
        attrs.posRelFromV) {
        shape.position = {
            horizontal: Object.assign(Object.assign({ relativeTo: (_a = attrs.posRelFromH) !== null && _a !== void 0 ? _a : 'column' }, (attrs.posOffsetH != null ? { posOffset: pixelsToEmu(attrs.posOffsetH) } : {})), (attrs.posAlignH
                ? {
                    alignment: attrs.posAlignH,
                }
                : {})),
            vertical: Object.assign(Object.assign({ relativeTo: (_b = attrs.posRelFromV) !== null && _b !== void 0 ? _b : 'paragraph' }, (attrs.posOffsetV != null ? { posOffset: pixelsToEmu(attrs.posOffsetV) } : {})), (attrs.posAlignV
                ? {
                    alignment: attrs.posAlignV,
                }
                : {})),
        };
    }
    // Convert outline back
    if (attrs.outlineWidth && attrs.outlineWidth > 0) {
        const cssToOoxmlOutline = {
            solid: 'solid',
            dotted: 'dot',
            dashed: 'dash',
        };
        shape.outline = {
            width: pixelsToEmu(attrs.outlineWidth),
            color: attrs.outlineColor ? { rgb: attrs.outlineColor.replace('#', '') } : undefined,
            style: attrs.outlineStyle
                ? cssToOoxmlOutline[attrs.outlineStyle] || 'solid'
                : 'solid',
        };
    }
    // Wrap the shape in a paragraph with a run containing ShapeContent
    const shapeContent = { type: 'shape', shape };
    const run = { type: 'run', content: [shapeContent] };
    return {
        type: 'paragraph',
        content: [run],
    };
}
/**
 * Update a Document with content from a ProseMirror document
 * Preserves all non-content parts of the original document
 */
export function updateDocumentContent(originalDocument, pmDoc) {
    return fromProseDoc(pmDoc, originalDocument);
}
/**
 * Convert a ProseMirror document back to an array of Paragraph/Table blocks.
 * Used for converting edited header/footer PM content back to the document model.
 */
export function proseDocToBlocks(pmDoc) {
    return extractBlocks(pmDoc);
}
//# sourceMappingURL=fromProseDoc.js.map