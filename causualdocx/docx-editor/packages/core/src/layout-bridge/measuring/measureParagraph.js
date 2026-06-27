/**
 * Paragraph measurement module
 *
 * Measures paragraph blocks and computes line breaking.
 * Converts runs into measured lines with typography metrics.
 */
import { measureTextWidth, measureRun, getFontMetrics, ptToPx, twipsToPx, } from './measureContainer';
import { DEFAULT_SINGLE_LINE_RATIO } from '../../utils/fontResolver';
// Default values - match OOXML spec defaults
const DEFAULT_FONT_SIZE = 11; // 11pt (Word 2007+ default)
const DEFAULT_FONT_FAMILY = 'Calibri';
const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.0; // OOXML spec default: single spacing (line=240)
// Floating-point tolerance for line breaking (0.5px)
// Prevents premature line breaks due to measurement rounding
const WIDTH_TOLERANCE = 0.5;
/**
 * Compute the width a tab character should advance to reach the next tab stop.
 *
 * For `center` and `end` (= right) tab stops, the tab width must account for
 * the width of the text up to the next tab or end of paragraph: a center stop
 * sits the text's midpoint at `stop.pos`, and a right stop sits the text's
 * right edge at `stop.pos`. Otherwise the cursor over-advances during
 * measurement and the next text overflows the line width, causing a spurious
 * line break (e.g. a 3-section `Left[tab]Center[tab]Right` header where Right
 * would wrap to a second line). The painter's `calculateTabWidth` in
 * `prosemirror/utils/tabCalculator.ts` already does this; measurement now
 * matches.
 */
function computeTabWidth(currentPos, tabStops, followingTextWidth = 0) {
    if (tabStops && tabStops.length > 0) {
        for (const stop of tabStops) {
            const stopPx = twipsToPx(stop.pos);
            if (stopPx > currentPos + 0.5) {
                let width = stopPx - currentPos;
                if (stop.val === 'center') {
                    width -= followingTextWidth / 2;
                }
                else if (stop.val === 'end') {
                    width -= followingTextWidth;
                }
                // When center/right alignment subtracts text wider than the
                // gap, `width` goes <= 0 ("text is too long to fit at this
                // stop"). The renderer (tabCalculator.ts:232-241) falls back
                // to the next default tab interval in this case — NOT to 1px.
                // Returning 1px here while the painter draws ~48px makes
                // measurement under-report line width, causing the layout to
                // accept a line that subsequently overflows when painted.
                // Mirror the renderer's fallback to keep measurement honest.
                if (width < 1) {
                    const remainder = currentPos % DEFAULT_TAB_WIDTH;
                    const fallback = remainder < 0.5 ? DEFAULT_TAB_WIDTH : DEFAULT_TAB_WIDTH - remainder;
                    return fallback;
                }
                return width;
            }
        }
    }
    // No matching stop — advance to next default interval
    const remainder = currentPos % DEFAULT_TAB_WIDTH;
    return Math.max(1, remainder < 0.5 ? DEFAULT_TAB_WIDTH : DEFAULT_TAB_WIDTH - remainder);
}
/**
 * Sum the widths of contiguous text runs following `tabIndex` up to (but
 * excluding) the next tab run or end of the paragraph. Used to size
 * center/right tabs during line measurement so the cursor lands where the
 * painter will draw it.
 */
function followingTextWidthFor(runs, tabIndex) {
    let width = 0;
    for (let i = tabIndex + 1; i < runs.length; i++) {
        const run = runs[i];
        if (isTabRun(run))
            break;
        if (isTextRun(run)) {
            width += measureTextWidth(run.text, runToFontStyle(run));
        }
        // Non-tab, non-text runs (images, fields, line breaks) end the
        // "following text" span — the alignment computation should only
        // account for the literal text between the tab and the next break.
        if (!isTextRun(run) && !isTabRun(run))
            break;
    }
    return width;
}
/**
 * Find the longest prefix of `text` that fits within `maxWidth` pixels.
 * Returns the number of characters that fit (at least 1 if `forceMin` is true).
 */
function findMaxFittingLength(text, style, maxWidth, forceMin = false) {
    let lo = 1;
    let hi = text.length;
    let best = 0;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (measureTextWidth(text.slice(0, mid), style) <= maxWidth) {
            best = mid;
            lo = mid + 1;
        }
        else {
            hi = mid - 1;
        }
    }
    return forceMin && best === 0 ? 1 : best;
}
/**
 * Extract FontStyle from a text run for measurement
 */
function runToFontStyle(run) {
    var _a, _b;
    return {
        fontFamily: (_a = run.fontFamily) !== null && _a !== void 0 ? _a : DEFAULT_FONT_FAMILY,
        fontSize: (_b = run.fontSize) !== null && _b !== void 0 ? _b : DEFAULT_FONT_SIZE,
        bold: run.bold,
        italic: run.italic,
        letterSpacing: run.letterSpacing,
    };
}
/**
 * Calculate typography metrics from font size and spacing settings
 *
 * @param fontSize - Font size in points
 * @param spacing - Paragraph spacing settings
 * @param metrics - Pre-calculated font metrics (in pixels)
 */
function calculateTypographyMetrics(fontSize, spacing, metrics) {
    var _a, _b, _c;
    // Use provided metrics or calculate from font size
    // When calculating from fontSize (points), convert to pixels first
    const fontSizePx = ptToPx(fontSize);
    const ascent = (_a = metrics === null || metrics === void 0 ? void 0 : metrics.ascent) !== null && _a !== void 0 ? _a : fontSizePx * 0.8;
    const descent = (_b = metrics === null || metrics === void 0 ? void 0 : metrics.descent) !== null && _b !== void 0 ? _b : fontSizePx * 0.2;
    // Apply line spacing rules
    //
    // OOXML lineRule="auto" multipliers (w:line in 240ths):
    //   line=240 → 1.0x (single), line=276 → 1.15x (Word default), line=480 → 2.0x
    //
    // The multiplier base is the font's "single line" height per OOXML spec (§17.3.1.33):
    //   singleLine = (usWinAscent + usWinDescent) / unitsPerEm × fontSizePx
    // This ratio is font-specific (1.07–1.27 for common fonts). We use a hardcoded
    // lookup table of OS/2 metrics since Canvas fontBoundingBox is unreliable
    // cross-platform (Mac uses hhea, not usWin) and Google Font substitutes
    // report different metrics than the original fonts.
    const ratio = (_c = metrics === null || metrics === void 0 ? void 0 : metrics.singleLineRatio) !== null && _c !== void 0 ? _c : DEFAULT_SINGLE_LINE_RATIO;
    const singleLineBase = fontSizePx * ratio;
    let lineHeight;
    if ((spacing === null || spacing === void 0 ? void 0 : spacing.lineRule) === 'exact' && spacing.line !== undefined) {
        // Exact: use specified height exactly
        lineHeight = spacing.line;
    }
    else if ((spacing === null || spacing === void 0 ? void 0 : spacing.lineRule) === 'atLeast' && spacing.line !== undefined) {
        // At least: use specified height or natural height, whichever is larger
        const defaultHeight = singleLineBase * DEFAULT_LINE_HEIGHT_MULTIPLIER;
        lineHeight = Math.max(spacing.line, defaultHeight);
    }
    else if ((spacing === null || spacing === void 0 ? void 0 : spacing.line) !== undefined && (spacing === null || spacing === void 0 ? void 0 : spacing.lineUnit) === 'multiplier') {
        // Multiplier applied to font's single-line height
        lineHeight = singleLineBase * spacing.line;
    }
    else if ((spacing === null || spacing === void 0 ? void 0 : spacing.line) !== undefined && (spacing === null || spacing === void 0 ? void 0 : spacing.lineUnit) === 'px') {
        // Pixel value
        lineHeight = spacing.line;
    }
    else {
        // No explicit spacing — OOXML spec default is line=240 (1.0x = single spacing).
        // Documents wanting 1.15x set w:line=276 explicitly in styles, which flows
        // through the multiplier branch above. This fallback is for paragraphs with
        // no style and no direct formatting.
        lineHeight = singleLineBase * DEFAULT_LINE_HEIGHT_MULTIPLIER;
    }
    return { ascent, descent, lineHeight };
}
/**
 * Calculate metrics for an empty paragraph
 */
function calculateEmptyParagraphMetrics(fontSize, spacing, fontFamily) {
    var _a, _b;
    const metrics = getFontMetrics({ fontSize, fontFamily: fontFamily !== null && fontFamily !== void 0 ? fontFamily : DEFAULT_FONT_FAMILY });
    const result = calculateTypographyMetrics(fontSize, spacing, metrics);
    // Empty paragraphs render at the font's natural single-line height even when
    // the doc writes a smaller `line` value (e.g. an exact/atLeast value below the
    // single line). The floor is the SAME single-line ratio used for non-empty
    // lines (font-specific OS/2 metric, not a hardcoded constant) so an empty
    // paragraph and a one-line paragraph in the same font measure identically and
    // both match LibreOffice. A flat 1.15 floor over-inflated empty paragraphs in
    // narrow-ratio serif fonts (Times New Roman / Liberation Serif ≈ 1.107),
    // which dense form documents stack dozens of — accumulating visible downward
    // drift vs the reference renderer.
    const lineRule = (_a = spacing === null || spacing === void 0 ? void 0 : spacing.lineRule) !== null && _a !== void 0 ? _a : 'auto';
    if (lineRule === 'auto' || lineRule === 'atLeast') {
        const fontSizePx = ptToPx(fontSize);
        const ratio = (_b = metrics === null || metrics === void 0 ? void 0 : metrics.singleLineRatio) !== null && _b !== void 0 ? _b : DEFAULT_SINGLE_LINE_RATIO;
        const floored = Math.max(result.lineHeight, fontSizePx * ratio);
        if (floored !== result.lineHeight) {
            return Object.assign(Object.assign({}, result), { lineHeight: floored });
        }
    }
    return result;
}
/**
 * Check if a run is a text run
 */
function isTextRun(run) {
    return run.kind === 'text';
}
/**
 * Check if a run is a tab run
 */
function isTabRun(run) {
    return run.kind === 'tab';
}
/**
 * Check if a run is an image run
 */
function isImageRun(run) {
    return run.kind === 'image';
}
/**
 * Check if a run is a line break run
 */
function isLineBreakRun(run) {
    return run.kind === 'lineBreak';
}
/**
 * Check if a run is a field run
 */
function isFieldRun(run) {
    return run.kind === 'field';
}
/**
 * Check if text run is empty (only whitespace or no text)
 */
function isEmptyTextRun(run) {
    return !run.text || run.text.replace(/\u00a0/g, ' ').trim().length === 0;
}
/**
 * Find word break points in text
 * Returns array of indices where words end (after space/punctuation)
 */
function findWordBreaks(text) {
    const breaks = [];
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        // Break after space or certain punctuation
        if (char === ' ' || char === '-' || char === '\t') {
            breaks.push(i + 1);
        }
    }
    return breaks;
}
/**
 * Default tab width in pixels (0.5 inch at 96 DPI)
 */
const DEFAULT_TAB_WIDTH = 48;
/**
 * Calculate width reduction for a line based on floating image zones.
 * Returns the left and right margins that need to be applied.
 */
function getFloatingMargins(lineY, lineHeight, zones, paragraphYOffset) {
    if (!zones || zones.length === 0) {
        return { leftMargin: 0, rightMargin: 0 };
    }
    let leftMargin = 0;
    let rightMargin = 0;
    // Line position relative to exclusion zones
    const absoluteLineTop = paragraphYOffset + lineY;
    const absoluteLineBottom = absoluteLineTop + lineHeight;
    for (const zone of zones) {
        // Check if this line overlaps vertically with the exclusion zone
        if (absoluteLineBottom > zone.topY && absoluteLineTop < zone.bottomY) {
            leftMargin = Math.max(leftMargin, zone.leftMargin);
            rightMargin = Math.max(rightMargin, zone.rightMargin);
        }
    }
    return { leftMargin, rightMargin };
}
/**
 * Measure a paragraph block and compute line breaks
 *
 * @param block - The paragraph block to measure
 * @param maxWidth - Maximum available width for the paragraph
 * @param options - Optional measurement options (floating zones, Y offset)
 * @returns ParagraphMeasure with lines and total height
 */
export function measureParagraph(block, maxWidth, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const runs = block.runs;
    const attrs = block.attrs;
    const spacing = attrs === null || attrs === void 0 ? void 0 : attrs.spacing;
    // Floating image support
    const floatingZones = options === null || options === void 0 ? void 0 : options.floatingZones;
    const paragraphYOffset = (_a = options === null || options === void 0 ? void 0 : options.paragraphYOffset) !== null && _a !== void 0 ? _a : 0;
    // Handle indentation
    const indent = attrs === null || attrs === void 0 ? void 0 : attrs.indent;
    const indentLeft = (_b = indent === null || indent === void 0 ? void 0 : indent.left) !== null && _b !== void 0 ? _b : 0;
    const indentRight = (_c = indent === null || indent === void 0 ? void 0 : indent.right) !== null && _c !== void 0 ? _c : 0;
    const firstLineOffset = ((_d = indent === null || indent === void 0 ? void 0 : indent.firstLine) !== null && _d !== void 0 ? _d : 0) - ((_e = indent === null || indent === void 0 ? void 0 : indent.hanging) !== null && _e !== void 0 ? _e : 0);
    // Calculate base available widths (before floating image adjustment)
    const bodyContentWidth = Math.max(1, maxWidth - indentLeft - indentRight);
    // First line offset: positive = first-line indent (less space), negative = hanging (more space)
    // Subtracting gives correct width in both cases
    const baseFirstLineWidth = Math.max(1, bodyContentWidth - firstLineOffset);
    // Track cumulative height for floating zone calculations
    let cumulativeHeight = 0;
    // Calculate first line width with floating zone adjustment
    // Estimate first line height for floating margin calculation
    const estimatedFirstLineHeight = ptToPx(DEFAULT_FONT_SIZE) * DEFAULT_LINE_HEIGHT_MULTIPLIER;
    const firstLineFloatingMargins = getFloatingMargins(0, estimatedFirstLineHeight, floatingZones, paragraphYOffset);
    const firstLineWidth = Math.max(1, baseFirstLineWidth - firstLineFloatingMargins.leftMargin - firstLineFloatingMargins.rightMargin);
    const lines = [];
    // Handle empty paragraph
    if (runs.length === 0) {
        // OOXML's "trailing empty paragraph after a table" pattern (canonical
        // for HF and body) renders as a zero-height anchor in Word. When the
        // caller flags `suppressEmptyParagraphHeight`, return a zero-height
        // measure so the block exists for click-to-position but doesn't
        // inflate container height (#381).
        if (attrs === null || attrs === void 0 ? void 0 : attrs.suppressEmptyParagraphHeight) {
            lines.push({
                fromRun: 0,
                fromChar: 0,
                toRun: 0,
                toChar: 0,
                width: 0,
                ascent: 0,
                descent: 0,
                lineHeight: 0,
            });
            return {
                kind: 'paragraph',
                lines,
                totalHeight: 0,
            };
        }
        const emptyFontSize = (_f = attrs === null || attrs === void 0 ? void 0 : attrs.defaultFontSize) !== null && _f !== void 0 ? _f : DEFAULT_FONT_SIZE;
        const emptyFontFamily = (_g = attrs === null || attrs === void 0 ? void 0 : attrs.defaultFontFamily) !== null && _g !== void 0 ? _g : DEFAULT_FONT_FAMILY;
        const emptyMetrics = calculateEmptyParagraphMetrics(emptyFontSize, spacing, emptyFontFamily);
        lines.push(Object.assign({ fromRun: 0, fromChar: 0, toRun: 0, toChar: 0, width: 0 }, emptyMetrics));
        // Word renders spacing.before / spacing.after for empty paragraphs the
        // same as non-empty (§17.3.1.33). The non-empty branch below adds them
        // to totalHeight; do the same here so empty paragraphs don't collapse
        // their authored spacing (e.g. an HF horizontal-rule paragraph with
        // <w:spacing w:before="120">).
        let emptyTotal = emptyMetrics.lineHeight;
        if (spacing === null || spacing === void 0 ? void 0 : spacing.before)
            emptyTotal += spacing.before;
        if (spacing === null || spacing === void 0 ? void 0 : spacing.after)
            emptyTotal += spacing.after;
        return {
            kind: 'paragraph',
            lines,
            totalHeight: emptyTotal,
        };
    }
    // Check for empty text run only
    if (runs.length === 1 && isTextRun(runs[0]) && isEmptyTextRun(runs[0])) {
        const run = runs[0];
        const fontSize = (_j = (_h = run.fontSize) !== null && _h !== void 0 ? _h : attrs === null || attrs === void 0 ? void 0 : attrs.defaultFontSize) !== null && _j !== void 0 ? _j : DEFAULT_FONT_SIZE;
        const fontFamily = (_l = (_k = run.fontFamily) !== null && _k !== void 0 ? _k : attrs === null || attrs === void 0 ? void 0 : attrs.defaultFontFamily) !== null && _l !== void 0 ? _l : DEFAULT_FONT_FAMILY;
        const emptyMetrics = calculateEmptyParagraphMetrics(fontSize, spacing, fontFamily);
        lines.push(Object.assign({ fromRun: 0, fromChar: 0, toRun: 0, toChar: 0, width: 0 }, emptyMetrics));
        let emptyTotal = emptyMetrics.lineHeight;
        if (spacing === null || spacing === void 0 ? void 0 : spacing.before)
            emptyTotal += spacing.before;
        if (spacing === null || spacing === void 0 ? void 0 : spacing.after)
            emptyTotal += spacing.after;
        return {
            kind: 'paragraph',
            lines,
            totalHeight: emptyTotal,
        };
    }
    // Initialize line state
    let currentLine = {
        fromRun: 0,
        fromChar: 0,
        toRun: 0,
        toChar: 0,
        width: 0,
        maxFontSize: DEFAULT_FONT_SIZE,
        maxFontMetrics: null,
        maxImageHeightPx: 0,
        availableWidth: firstLineWidth,
        leftOffset: firstLineFloatingMargins.leftMargin,
        rightOffset: firstLineFloatingMargins.rightMargin,
    };
    /**
     * Finalize and push the current line to the lines array
     */
    const finalizeLine = () => {
        const typography = calculateTypographyMetrics(currentLine.maxFontSize, spacing, currentLine.maxFontMetrics);
        // If an inline image is taller than the text-based line height, the line
        // grows to fit the image PLUS the parent paragraph's natural line leading.
        // Word treats an inline image as a tall glyph sitting on the text baseline:
        // the image extends above the baseline (full ascent), and the line still
        // reserves the parent font's normal descent + leading below. Without the
        // extra leading the image renders flush with its containing cell borders
        // (no visual breathing room when the image is alone in a table cell).
        const finalTypography = Object.assign({}, typography);
        if (currentLine.maxImageHeightPx > finalTypography.lineHeight) {
            // Image-only line: line grows to image height plus the parent font's
            // descent on BOTH sides so the row has visible breathing room above
            // and below the image (Word's render gives a few px of cell padding
            // even with tcMar=0). Sibling text cells share the row height, so
            // their descenders also stay clear of overflow:hidden.
            const imageH = currentLine.maxImageHeightPx;
            const buffer = finalTypography.descent;
            finalTypography.lineHeight = imageH + buffer * 2;
            finalTypography.ascent = imageH + buffer;
            // descent stays as text metrics
        }
        const line = Object.assign({ fromRun: currentLine.fromRun, fromChar: currentLine.fromChar, toRun: currentLine.toRun, toChar: currentLine.toChar, width: currentLine.width }, finalTypography);
        // Only add offsets if they're non-zero (for floating images)
        if (currentLine.leftOffset > 0) {
            line.leftOffset = currentLine.leftOffset;
        }
        if (currentLine.rightOffset > 0) {
            line.rightOffset = currentLine.rightOffset;
        }
        lines.push(line);
        // Update cumulative height for next line's floating zone calculation
        cumulativeHeight += typography.lineHeight;
    };
    /**
     * Start a new line after the current one
     */
    const startNewLine = (runIndex, charIndex) => {
        finalizeLine();
        // Calculate available width for new line based on floating zones
        // Estimate the new line's height for overlap calculation
        const estimatedLineHeight = ptToPx(DEFAULT_FONT_SIZE) * DEFAULT_LINE_HEIGHT_MULTIPLIER;
        const floatingMargins = getFloatingMargins(cumulativeHeight, estimatedLineHeight, floatingZones, paragraphYOffset);
        // Body content width minus floating image margins
        const adjustedWidth = Math.max(1, bodyContentWidth - floatingMargins.leftMargin - floatingMargins.rightMargin);
        currentLine = {
            fromRun: runIndex,
            fromChar: charIndex,
            toRun: runIndex,
            toChar: charIndex,
            width: 0,
            maxFontSize: DEFAULT_FONT_SIZE,
            maxFontMetrics: null,
            maxImageHeightPx: 0,
            availableWidth: adjustedWidth,
            leftOffset: floatingMargins.leftMargin,
            rightOffset: floatingMargins.rightMargin,
        };
    };
    /**
     * Update max font tracking for the current line
     */
    const updateMaxFont = (style) => {
        var _a;
        const fontSize = (_a = style.fontSize) !== null && _a !== void 0 ? _a : DEFAULT_FONT_SIZE;
        // Update when this is the first run on the line (maxFontMetrics not yet set)
        // or when we find a larger font size. Without the !maxFontMetrics check,
        // lines with only <11pt text would use the 11pt default, inflating line height.
        if (!currentLine.maxFontMetrics || fontSize > currentLine.maxFontSize) {
            currentLine.maxFontSize = fontSize;
            currentLine.maxFontMetrics = getFontMetrics(style);
        }
    };
    // Process each run
    for (let runIndex = 0; runIndex < runs.length; runIndex++) {
        const run = runs[runIndex];
        if (isLineBreakRun(run)) {
            // Force line break
            currentLine.toRun = runIndex;
            currentLine.toChar = 0;
            startNewLine(runIndex + 1, 0);
            continue;
        }
        if (isTabRun(run)) {
            // Handle tab run — compute width from paragraph tab stops
            const style = runToFontStyle(run);
            updateMaxFont(style);
            // Compute tab width: advance to the next tab stop position.
            // For center / right tab stops we need the width of the following
            // text up to the next tab so the cursor lands where the painter
            // will draw it (see `computeTabWidth`).
            const tabStops = attrs === null || attrs === void 0 ? void 0 : attrs.tabs;
            const currentPos = currentLine.width + ((_m = currentLine.leftOffset) !== null && _m !== void 0 ? _m : 0);
            const followingWidth = followingTextWidthFor(runs, runIndex);
            const tabWidth = computeTabWidth(currentPos, tabStops, followingWidth);
            if (currentLine.width + tabWidth > currentLine.availableWidth + WIDTH_TOLERANCE) {
                // Tab doesn't fit, start new line
                startNewLine(runIndex, 0);
                updateMaxFont(style);
            }
            currentLine.width += tabWidth;
            currentLine.toRun = runIndex;
            currentLine.toChar = 1;
            continue;
        }
        if (isImageRun(run)) {
            const wrapType = run.wrapType;
            const isFloating = run.displayMode === 'float' ||
                (wrapType && ['square', 'tight', 'through'].includes(wrapType));
            // Skip truly floating images - they don't contribute to line height
            // (they are positioned absolutely and text wraps around them)
            if (run.position && isFloating) {
                currentLine.toRun = runIndex;
                currentLine.toChar = 1;
                continue;
            }
            // Handle topAndBottom (block) images - they get their own line
            if (wrapType === 'topAndBottom' || run.displayMode === 'block') {
                // If current line has content, finish it first
                if (currentLine.width > 0) {
                    startNewLine(runIndex, 0);
                }
                // The image gets its own line with full image height
                const imageHeight = run.height;
                const distTop = (_o = run.distTop) !== null && _o !== void 0 ? _o : 6;
                const distBottom = (_p = run.distBottom) !== null && _p !== void 0 ? _p : 6;
                // Update line to contain just this image
                currentLine.toRun = runIndex;
                currentLine.toChar = 1;
                // Use image height plus margins as line height (already in pixels)
                currentLine.maxImageHeightPx = imageHeight + distTop + distBottom;
                // Start a new line after the image for subsequent content
                startNewLine(runIndex + 1, 0);
                continue;
            }
            // Handle inline image
            const imageWidth = run.width;
            const imageHeight = run.height;
            // Track image height separately (already in pixels, not points)
            if (imageHeight > currentLine.maxImageHeightPx) {
                currentLine.maxImageHeightPx = imageHeight;
            }
            if (currentLine.width + imageWidth > currentLine.availableWidth + WIDTH_TOLERANCE) {
                // Image doesn't fit, start new line
                startNewLine(runIndex, 0);
            }
            currentLine.width += imageWidth;
            currentLine.toRun = runIndex;
            currentLine.toChar = 1;
            continue;
        }
        if (isFieldRun(run)) {
            // Measure field using fallback text (actual value substituted at render time)
            const fallback = run.fallback || '1';
            const style = {
                fontFamily: (_q = run.fontFamily) !== null && _q !== void 0 ? _q : DEFAULT_FONT_FAMILY,
                fontSize: (_r = run.fontSize) !== null && _r !== void 0 ? _r : DEFAULT_FONT_SIZE,
                bold: run.bold,
                italic: run.italic,
            };
            updateMaxFont(style);
            const fieldWidth = measureTextWidth(fallback, style);
            if (currentLine.width > 0 &&
                currentLine.width + fieldWidth > currentLine.availableWidth + WIDTH_TOLERANCE) {
                startNewLine(runIndex, 0);
                updateMaxFont(style);
            }
            currentLine.width += fieldWidth;
            currentLine.toRun = runIndex;
            currentLine.toChar = 1;
            continue;
        }
        if (isTextRun(run)) {
            const textRun = run;
            const text = textRun.text;
            const style = runToFontStyle(textRun);
            updateMaxFont(style);
            if (!text || text.length === 0) {
                // Empty text run, just update position
                currentLine.toRun = runIndex;
                currentLine.toChar = 0;
                continue;
            }
            // Find word break points for wrapping
            const wordBreaks = findWordBreaks(text);
            // Process text word by word
            let charIndex = 0;
            while (charIndex < text.length) {
                // Find next word boundary
                let nextBreak = text.length;
                for (const breakPoint of wordBreaks) {
                    if (breakPoint > charIndex) {
                        nextBreak = breakPoint;
                        break;
                    }
                }
                // Extract word (includes trailing space if present)
                const word = text.slice(charIndex, nextBreak);
                const wordWidth = measureTextWidth(word, style);
                // If the word itself is longer than a line, hard-break by characters.
                // Use substring measurement (not char-by-char accumulation) to preserve
                // kerning accuracy. Char-by-char accumulation overestimates width by
                // ~1-2px per line due to lost kerning, causing extra wraps in narrow cells.
                if (wordWidth > currentLine.availableWidth + WIDTH_TOLERANCE) {
                    // Long word that needs hard-breaking. DON'T start a new line first —
                    // fill the remaining space on the current line with as many characters
                    // as possible. This prevents wasting a full line when a small run
                    // (like "{" at 10pt) precedes a long word (like a variable at 5.5pt).
                    let chunkStart = 0;
                    while (chunkStart < word.length) {
                        const spaceLeft = currentLine.availableWidth - currentLine.width + WIDTH_TOLERANCE;
                        const remaining = word.slice(chunkStart);
                        let bestEnd = findMaxFittingLength(remaining, style, spaceLeft);
                        // Nothing fits → start a new line and retry (or force 1 char on empty line)
                        if (bestEnd === 0) {
                            if (currentLine.width > 0) {
                                startNewLine(runIndex, charIndex + chunkStart);
                                updateMaxFont(style);
                                continue;
                            }
                            bestEnd = 1;
                        }
                        const chunkEnd = chunkStart + bestEnd;
                        const chunk = word.slice(chunkStart, chunkEnd);
                        const chunkWidth = measureTextWidth(chunk, style);
                        currentLine.width += chunkWidth;
                        currentLine.toRun = runIndex;
                        currentLine.toChar = charIndex + chunkEnd;
                        chunkStart = chunkEnd;
                        if (chunkStart < word.length) {
                            startNewLine(runIndex, charIndex + chunkStart);
                            updateMaxFont(style);
                        }
                    }
                    charIndex = nextBreak;
                    continue;
                }
                // Check if word fits on current line
                if (currentLine.width > 0 &&
                    currentLine.width + wordWidth > currentLine.availableWidth + WIDTH_TOLERANCE) {
                    // Word doesn't fit, start new line
                    startNewLine(runIndex, charIndex);
                    // Re-apply font metrics to the new line (startNewLine resets maxFontSize)
                    updateMaxFont(style);
                }
                // Add word to current line
                currentLine.width += wordWidth;
                currentLine.toRun = runIndex;
                currentLine.toChar = nextBreak;
                charIndex = nextBreak;
            }
        }
    }
    // Finalize the last line
    finalizeLine();
    // Calculate total height
    let totalHeight = lines.reduce((sum, line) => sum + line.lineHeight, 0);
    // The renderer wraps a list marker in its own line element when there is no
    // hanging indent reserved for it (matching Word's <w:suff w:val="tab"/>
    // wrap, see renderParagraph.ts). Account for that extra row here so the
    // paragraph reports the correct height to its container.
    const hasOwnLineMarker = !!(attrs === null || attrs === void 0 ? void 0 : attrs.listMarker) && !(attrs === null || attrs === void 0 ? void 0 : attrs.listMarkerHidden) && ((_s = indent === null || indent === void 0 ? void 0 : indent.hanging) !== null && _s !== void 0 ? _s : 0) === 0;
    if (hasOwnLineMarker && lines.length > 0) {
        totalHeight += lines[0].lineHeight;
    }
    // Add spacing before/after
    let totalWithSpacing = totalHeight;
    if (spacing === null || spacing === void 0 ? void 0 : spacing.before) {
        totalWithSpacing += spacing.before;
    }
    if (spacing === null || spacing === void 0 ? void 0 : spacing.after) {
        totalWithSpacing += spacing.after;
    }
    return {
        kind: 'paragraph',
        lines,
        totalHeight: totalWithSpacing,
    };
}
/**
 * Measure multiple paragraph blocks
 *
 * @param blocks - Array of paragraph blocks to measure
 * @param maxWidth - Maximum available width
 * @returns Array of ParagraphMeasure results
 */
export function measureParagraphs(blocks, maxWidth) {
    return blocks.map((block) => measureParagraph(block, maxWidth));
}
/**
 * Get per-character widths for a text run (for click positioning)
 *
 * @param run - The text run to measure
 * @returns Array of character widths
 */
export function getRunCharWidths(run) {
    const style = runToFontStyle(run);
    const result = measureRun(run.text, style);
    return result.charWidths;
}
//# sourceMappingURL=measureParagraph.js.map