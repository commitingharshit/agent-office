/**
 * DOCX I/O
 *
 * Parsing DOCX archives into the `Document` model and re-zipping a
 * model back into a DOCX file. Use `./docx/serializer` for the lower-level
 * Document → XML transforms.
 *
 * The named exports below are the public API contract. Adding a parser
 * helper to a source module does not automatically make it public — it
 * must be added to this barrel to be reachable from
 * `@eigenpal/docx-core/docx`.
 */
export { parseDocx } from './parser';
export { repackDocx, createDocx, updateMultipleFiles } from './rezip';
export { attemptSelectiveSave } from './selectiveSave';
export { buildPatchedDocumentXml, validatePatchSafety } from './selectiveXmlPatch';
export { emuToPixels, pixelsToEmu, parseDrawing, parseImage, isInlineImage, isFloatingImage, isBehindText, isInFrontOfText, getImageWidthPx, getImageHeightPx, getWrapDistancesPx, isDecorativeImage, } from './imageParser';
export { parseFootnotes, parseEndnotes, parseFootnoteProperties, parseEndnoteProperties, getFootnoteText, getEndnoteText, isSeparatorFootnote, isSeparatorEndnote, } from './footnoteParser';
export type { FootnoteMap, EndnoteMap } from './footnoteParser';
export { setFootnotePlainText, setEndnotePlainText } from './serializer/footnoteSerializer';
export { KNOWN_FIELD_TYPES, parseFieldType, isKnownFieldType, parseFieldInstruction, getFormatSwitch, hasMergeFormat, parseSimpleField, createComplexFieldContext, isPageNumberField, isTotalPagesField, isDateTimeField, isDocPropertyField, isReferenceField, isMergeField, isTocField, getFieldDisplayValue, } from './fieldParser';
export type { ParsedFieldInstruction, FieldSwitch, ComplexFieldState, ComplexFieldContext, } from './fieldParser';
export { parseHyperlink, getHyperlinkText, isExternalLink, isInternalLink, getHyperlinkUrl, hasContent, getHyperlinkRuns, resolveHyperlinkUrl, } from './hyperlinkParser';
export { parseNumbering, formatNumber, renderListMarker, getBulletCharacter, isBulletLevel, } from './numberingParser';
export type { NumberingMap } from './numberingParser';
export { parseShape, parseShapeFromDrawing, isShapeDrawing, isLineShape, isTextBoxShape, hasTextContent, getShapeWidthPx, isFloatingShape, hasFill, hasOutline, getOutlineWidthPx, resolveFillColor, resolveOutlineColor, getShapeHeightPx, getShapeDimensionsPx, } from './shapeParser';
export { DEFAULT_TAB_INTERVAL_TWIPS, DEFAULT_TAB_ALIGNMENT, DEFAULT_TAB_LEADER, parseTabStop, parseTabStops, parseTabStopsFromParagraphProperties, mergeTabStops, getNextTabStop, calculateTabWidth, calculateTabWidthWithAlignment, getLeaderCharacter, hasVisibleLeader, } from './tabParser';
export { parseTableMeasurement, parseBorderSpec, parseTableBorders, parseCellMargins, parseShading, parseTableLook, parseFloatingTableProperties, parseTableProperties, getTableColumnCount, getTableRowCount, isCellMergeContinuation, isCellMergeStart, hasHeaderRow, } from './tableParser';
export { extractTextBoxContentElements, parseTextBoxContent, isTextBoxDrawing, isShapeTextBox, parseTextBox, getTextBoxContentElement, parseTextBoxFromShape, getTextBoxWidthPx, getTextBoxHeightPx, getTextBoxDimensionsPx, getTextBoxMarginsPx, isFloatingTextBox, hasTextBoxFill, hasTextBoxOutline, hasTextBoxContent, getTextBoxText, resolveTextBoxFillColor, resolveTextBoxOutlineColor, getTextBoxOutlineWidthPx, } from './textBoxParser';
export type { ParagraphParserFn, TableParserFn } from './textBoxParser';
//# sourceMappingURL=index.d.ts.map