/**
 * ProseMirror to FlowBlock Converter
 *
 * Converts a ProseMirror document into FlowBlock[] for the layout engine.
 * Tracks pmStart/pmEnd positions for click-to-position mapping.
 */
import { DEFAULT_TEXTBOX_MARGINS, DEFAULT_TEXTBOX_WIDTH } from '../layout-engine/types';
import { resolveColor, resolveColorToHex, resolveHighlightToCss } from '../utils/colorResolver';
import { pointsToPixels, halfPointsToPixels, halfPointsToPoints } from '../utils/units';
import { convertBulletToUnicode } from '../docx/documentParser';
import { ommlToMathml } from '../docx/ommlToMathml';
const DEFAULT_FONT = 'Calibri';
/**
 * Constrain image dimensions to fit within the page content area.
 *
 * Scales proportionally (preserves aspect ratio) when height exceeds
 * `pageContentHeight`. Only applied to **non-floating** images —
 * floating images (any DrawingML wrap type: square, tight, through,
 * topAndBottom, behind, inFront) are anchored to a position and must
 * keep their declared size; Word lets them extend past the page
 * boundary rather than scale them down.
 *
 * The save path reads the PM node's original `attrs.width` /
 * `attrs.height` (not the constrained values), so this is a
 * layout-only adjustment — the .docx on disk keeps the original size
 * regardless.
 */
function constrainImageToPage(width, height, pageContentHeight, isFloating = false) {
    if (isFloating)
        return { width, height };
    if (!pageContentHeight || height <= pageContentHeight) {
        return { width, height };
    }
    const scale = pageContentHeight / height;
    return { width: Math.round(width * scale), height: pageContentHeight };
}
const DEFAULT_SIZE = 11; // points (Word 2007+ default)
/**
 * Convert twips to pixels (1 twip = 1/1440 inch, 1 inch = 96 CSS px).
 * No rounding — precision prevents cumulative layout drift across paragraphs.
 */
function twipsToPixels(twips) {
    return (twips / 1440) * 96;
}
/**
 * Generate a unique block ID.
 */
let blockIdCounter = 0;
function nextBlockId() {
    return `block-${++blockIdCounter}`;
}
function formatNumberedMarker(counters, level) {
    var _a;
    const parts = [];
    for (let i = 0; i <= level; i += 1) {
        const value = (_a = counters[i]) !== null && _a !== void 0 ? _a : 0;
        if (value <= 0)
            break;
        parts.push(value);
    }
    if (parts.length === 0)
        return '1.';
    return `${parts.join('.')}.`;
}
const ROMAN_PAIRS = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
];
function toRoman(n, upper) {
    if (n <= 0)
        return '';
    let value = n;
    let out = '';
    for (const [num, sym] of ROMAN_PAIRS) {
        while (value >= num) {
            out += sym;
            value -= num;
        }
    }
    return upper ? out : out.toLowerCase();
}
// Spreadsheet-style: 1→A, 26→Z, 27→AA, 28→AB, ...
function toLetter(n, upper) {
    if (n <= 0)
        return '';
    let value = n;
    let out = '';
    while (value > 0) {
        const rem = (value - 1) % 26;
        out = String.fromCharCode(65 + rem) + out;
        value = Math.floor((value - 1) / 26);
    }
    return upper ? out : out.toLowerCase();
}
// English ordinal suffix (1st, 2nd, 3rd, 4th, ...).
function ordinalSuffix(n) {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13)
        return 'th';
    switch (n % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
const CARDINAL_ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
];
const CARDINAL_TENS = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
];
const ORDINAL_ONES = [
    '',
    'First',
    'Second',
    'Third',
    'Fourth',
    'Fifth',
    'Sixth',
    'Seventh',
    'Eighth',
    'Ninth',
    'Tenth',
    'Eleventh',
    'Twelfth',
    'Thirteenth',
    'Fourteenth',
    'Fifteenth',
    'Sixteenth',
    'Seventeenth',
    'Eighteenth',
    'Nineteenth',
];
const ORDINAL_TENS = [
    '',
    '',
    'Twentieth',
    'Thirtieth',
    'Fortieth',
    'Fiftieth',
    'Sixtieth',
    'Seventieth',
    'Eightieth',
    'Ninetieth',
];
// Word forms cover 1..99 — beyond that fall back to "<cardinal-99>+<rest>"
// or decimal. Real docs rarely cardinal-text past two digits, so the cost
// of a bigger lookup table isn't justified for this fallback path.
function toCardinalText(n) {
    if (n <= 0 || n >= 100)
        return String(n);
    if (n < 20)
        return CARDINAL_ONES[n];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    if (ones === 0)
        return CARDINAL_TENS[tens];
    return `${CARDINAL_TENS[tens]}-${CARDINAL_ONES[ones].toLowerCase()}`;
}
function toOrdinalText(n) {
    if (n <= 0 || n >= 100)
        return String(n) + ordinalSuffix(n);
    if (n < 20)
        return ORDINAL_ONES[n];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    if (ones === 0)
        return ORDINAL_TENS[tens];
    return `${CARDINAL_TENS[tens]}-${ORDINAL_ONES[ones].toLowerCase()}`;
}
// Chicago Manual footnote sequence: * † ‡ § ‖ # then doubled (** †† …).
const CHICAGO_GLYPHS = ['*', '†', '‡', '§', '‖', '#'];
function toChicago(n) {
    if (n <= 0)
        return '';
    const idx = (n - 1) % CHICAGO_GLYPHS.length;
    const repeat = Math.floor((n - 1) / CHICAGO_GLYPHS.length) + 1;
    return CHICAGO_GLYPHS[idx].repeat(repeat);
}
// Unicode circled digits ① ② ③ … ⑳ at U+2460..U+2473, then ㉑..㊿ at
// U+3251..U+325F + U+32B1..U+32BF. Past 50 fall back to "(N)".
function toDecimalEnclosedCircle(n) {
    if (n <= 0)
        return '';
    if (n <= 20)
        return String.fromCodePoint(0x2460 + n - 1);
    if (n <= 35)
        return String.fromCodePoint(0x3251 + n - 21);
    if (n <= 50)
        return String.fromCodePoint(0x32b1 + n - 36);
    return `(${n})`;
}
// ⑴ ⑵ ⑶ at U+2474..U+2487 (1..20). Past 20 fall back to "(N)".
function toDecimalEnclosedParen(n) {
    if (n <= 0)
        return '';
    if (n <= 20)
        return String.fromCodePoint(0x2474 + n - 1);
    return `(${n})`;
}
function formatCounter(value, fmt) {
    if (value <= 0)
        return '';
    switch (fmt) {
        case 'upperRoman':
            return toRoman(value, true);
        case 'lowerRoman':
            return toRoman(value, false);
        case 'upperLetter':
            return toLetter(value, true);
        case 'lowerLetter':
            return toLetter(value, false);
        case 'decimalZero':
            return value < 10 ? `0${value}` : String(value);
        case 'ordinal':
            return `${value}${ordinalSuffix(value)}`;
        case 'cardinalText':
            return toCardinalText(value);
        case 'ordinalText':
            return toOrdinalText(value);
        case 'hex':
            return value.toString(16).toUpperCase();
        case 'numberInDash':
            return `- ${value} -`;
        case 'chicago':
            return toChicago(value);
        case 'decimalEnclosedCircle':
            return toDecimalEnclosedCircle(value);
        case 'decimalEnclosedParen':
            return toDecimalEnclosedParen(value);
        case 'none':
            return '';
        default:
            // CJK / Hebrew / Arabic / Thai / Korean script-specific formats
            // (japaneseCounting, koreanDigital, hebrew1, arabicAlpha,
            // thaiNumbers, ideographDigital, …) still fall through to
            // decimal — they require sizable lookup tables and don't show
            // up in any of our 39 fixtures.
            return String(value);
    }
}
/**
 * Resolve an OOXML lvlText template like "%1.%2." against the counter stack
 * and per-level numFmt list (ECMA-376 §17.9.11).
 *
 * When a referenced counter has no value yet (e.g. "%2" referenced from a
 * level-0 paragraph), the placeholder AND the punctuation immediately
 * following it are dropped — matches Word's behavior so "%1.%2." renders
 * "1." rather than "1..".
 *
 * Exported for unit testing.
 */
export function resolveListTemplate(template, counters, levelNumFmts) {
    return template.replace(/%(\d)([.):\]])?/g, (_, digit, punct = '') => {
        var _a, _b;
        const idx = parseInt(digit, 10) - 1;
        if (idx < 0)
            return '';
        const value = (_a = counters[idx]) !== null && _a !== void 0 ? _a : 0;
        const fmt = (_b = levelNumFmts === null || levelNumFmts === void 0 ? void 0 : levelNumFmts[idx]) !== null && _b !== void 0 ? _b : 'decimal';
        const formatted = formatCounter(value, fmt);
        return formatted ? formatted + punct : '';
    });
}
/**
 * Reset the block ID counter (useful for testing).
 */
export function resetBlockIdCounter() {
    blockIdCounter = 0;
}
/**
 * Extract run formatting from ProseMirror marks.
 */
function extractRunFormatting(marks, theme) {
    const formatting = {};
    for (const mark of marks) {
        switch (mark.type.name) {
            case 'bold':
                formatting.bold = true;
                break;
            case 'italic':
                formatting.italic = true;
                break;
            case 'underline': {
                const attrs = mark.attrs;
                if (attrs.style || attrs.color) {
                    const underlineColor = attrs.color ? resolveColor(attrs.color, theme) : undefined;
                    formatting.underline = {
                        style: attrs.style,
                        color: underlineColor,
                    };
                }
                else {
                    formatting.underline = true;
                }
                break;
            }
            case 'strike':
                formatting.strike = true;
                break;
            case 'textColor': {
                const attrs = mark.attrs;
                if (attrs.themeColor || attrs.rgb) {
                    formatting.color = resolveColor({
                        rgb: attrs.rgb,
                        themeColor: attrs.themeColor,
                        themeTint: attrs.themeTint,
                        themeShade: attrs.themeShade,
                    }, theme);
                }
                break;
            }
            case 'highlight':
                formatting.highlight = resolveHighlightToCss(mark.attrs.color);
                break;
            case 'fontSize': {
                const attrs = mark.attrs;
                // Convert half-points to points
                formatting.fontSize = attrs.size / 2;
                break;
            }
            case 'fontFamily': {
                const attrs = mark.attrs;
                formatting.fontFamily = attrs.ascii || attrs.hAnsi;
                break;
            }
            case 'characterSpacing': {
                // The PM `characterSpacing` mark is a multi-attribute container for
                // four OOXML run-level properties: w:spacing (letter-spacing,
                // §17.3.2.35), w:position (baseline shift, §17.3.2.24), w:w
                // (horizontal text scale, §17.3.2.43), and w:kern (kerning
                // threshold, §17.3.2.18). All four are parsed into the PM mark and
                // rendered correctly in the hidden ProseMirror toDOM, but the
                // layout-bridge dropped every attribute except the one we explicitly
                // case'd, so painted runs lost the values.
                const attrs = mark.attrs;
                if (attrs.spacing != null && attrs.spacing !== 0) {
                    formatting.letterSpacing = twipsToPixels(attrs.spacing);
                }
                if (attrs.position != null && attrs.position !== 0) {
                    // w:position is half-points; positive raises (CSS vertical-align
                    // positive raises too).
                    formatting.positionPx = halfPointsToPixels(attrs.position);
                }
                if (attrs.scale != null && attrs.scale !== 100) {
                    formatting.horizontalScale = attrs.scale;
                }
                if (attrs.kerning != null && attrs.kerning > 0) {
                    // w:kern is in half-points; convert to points so the painter can
                    // gate `font-kerning` by comparing against the run's font size.
                    formatting.kerningMinPt = halfPointsToPoints(attrs.kerning);
                }
                break;
            }
            case 'allCaps':
                formatting.allCaps = true;
                break;
            case 'smallCaps':
                formatting.smallCaps = true;
                break;
            case 'emboss':
                formatting.emboss = true;
                break;
            case 'imprint':
                formatting.imprint = true;
                break;
            case 'textShadow':
                formatting.textShadow = true;
                break;
            case 'textOutline':
                formatting.textOutline = true;
                break;
            case 'hidden':
                formatting.hidden = true;
                break;
            case 'rtl':
                formatting.rtl = true;
                break;
            case 'textEffect': {
                const effect = mark.attrs.effect;
                if (effect === 'blinkBackground' ||
                    effect === 'lights' ||
                    effect === 'antsBlack' ||
                    effect === 'antsRed' ||
                    effect === 'shimmer' ||
                    effect === 'sparkle') {
                    formatting.textEffect = effect;
                }
                break;
            }
            case 'emphasisMark': {
                // CJK emphasis marks (§17.3.2.12). The PM mark stores the variant
                // type as `attrs.type`; pass it through so the painter can look up
                // the matching CSS text-emphasis style.
                const t = mark.attrs.type;
                if (t === 'dot' || t === 'comma' || t === 'circle' || t === 'underDot') {
                    formatting.emphasisMark = t;
                }
                else {
                    // Unknown variant — fall back to dot (Word's default).
                    formatting.emphasisMark = 'dot';
                }
                break;
            }
            case 'superscript':
                formatting.superscript = true;
                break;
            case 'subscript':
                formatting.subscript = true;
                break;
            case 'hyperlink': {
                const attrs = mark.attrs;
                formatting.hyperlink = {
                    href: attrs.href,
                    tooltip: attrs.tooltip,
                };
                break;
            }
            case 'footnoteRef': {
                const attrs = mark.attrs;
                const id = typeof attrs.id === 'string' ? parseInt(attrs.id, 10) : attrs.id;
                if (attrs.noteType === 'endnote') {
                    formatting.endnoteRefId = id;
                }
                else {
                    formatting.footnoteRefId = id;
                }
                break;
            }
            case 'comment': {
                const commentId = mark.attrs.commentId;
                if (commentId) {
                    if (!formatting.commentIds)
                        formatting.commentIds = [];
                    formatting.commentIds.push(commentId);
                }
                break;
            }
            case 'insertion':
                formatting.isInsertion = true;
                formatting.changeAuthor = mark.attrs.author;
                formatting.changeDate = mark.attrs.date;
                formatting.changeRevisionId = mark.attrs.revisionId;
                break;
            case 'deletion':
                formatting.isDeletion = true;
                formatting.changeAuthor = mark.attrs.author;
                formatting.changeDate = mark.attrs.date;
                formatting.changeRevisionId = mark.attrs.revisionId;
                break;
        }
    }
    return formatting;
}
/**
 * Resolve the paragraph's style-cascaded run defaults into a `RunFormatting`
 * baseline that individual runs can inherit. Per ECMA-376 §17.3.2.27 a run
 * with a partial `w:rFonts` (e.g. only `w:eastAsia`) inherits the missing
 * sides from the paragraph style → basedOn chain → docDefaults; without
 * this, runs whose own mark omits `ascii`/`hAnsi` lose the style's font and
 * fall back to the painter's hardcoded Calibri stack (#392).
 */
function paragraphRunDefaults(pmAttrs) {
    const dtf = pmAttrs.defaultTextFormatting;
    if (!dtf)
        return {};
    const result = {};
    if (dtf.fontFamily) {
        const family = dtf.fontFamily.ascii || dtf.fontFamily.hAnsi;
        if (family)
            result.fontFamily = family;
    }
    if (dtf.fontSize != null) {
        // TextFormatting.fontSize is in half-points; RunFormatting.fontSize is points.
        result.fontSize = dtf.fontSize / 2;
    }
    return result;
}
/**
 * Convert a paragraph node to runs.
 */
function paragraphToRuns(node, startPos, _options) {
    const runs = [];
    const offset = startPos + 1; // +1 for opening tag
    const theme = _options.theme;
    const paraDefaults = paragraphRunDefaults(node.attrs);
    node.forEach((child, childOffset) => {
        var _a;
        const childPos = offset + childOffset;
        if (child.isText && child.text) {
            // Text node — create text run. Run-level marks override paragraph
            // defaults; the spread order below ensures `formatting`'s explicit
            // values win over the inherited fallback.
            const formatting = extractRunFormatting(child.marks, theme);
            const run = Object.assign(Object.assign(Object.assign({ kind: 'text', text: child.text }, paraDefaults), formatting), { pmStart: childPos, pmEnd: childPos + child.nodeSize });
            runs.push(run);
        }
        else if (child.type.name === 'hardBreak') {
            // Line break
            const run = {
                kind: 'lineBreak',
                pmStart: childPos,
                pmEnd: childPos + child.nodeSize,
            };
            runs.push(run);
        }
        else if (child.type.name === 'tab') {
            // Tab character — inherits paragraph defaults the same way text runs do.
            const formatting = extractRunFormatting(child.marks, theme);
            const run = Object.assign(Object.assign(Object.assign({ kind: 'tab' }, paraDefaults), formatting), { pmStart: childPos, pmEnd: childPos + child.nodeSize });
            runs.push(run);
        }
        else if (child.type.name === 'image') {
            // Image within paragraph
            const attrs = child.attrs;
            const constrained = constrainImageToPage(attrs.width || 100, attrs.height || 100, _options.pageContentHeight, !!attrs.wrapType // any wrap type = floating; don't scale to page
            );
            const run = {
                kind: 'image',
                src: attrs.src,
                width: constrained.width,
                height: constrained.height,
                alt: attrs.alt,
                transform: attrs.transform,
                borderWidth: attrs.borderWidth,
                borderColor: attrs.borderColor,
                borderStyle: attrs.borderStyle,
                // Preserve wrap attributes for proper rendering
                wrapType: attrs.wrapType,
                displayMode: attrs.displayMode,
                cssFloat: attrs.cssFloat,
                distTop: attrs.distTop,
                distBottom: attrs.distBottom,
                distLeft: attrs.distLeft,
                distRight: attrs.distRight,
                // Preserve position for page-level floating image positioning
                position: attrs.position,
                cropTop: attrs.cropTop,
                cropRight: attrs.cropRight,
                cropBottom: attrs.cropBottom,
                cropLeft: attrs.cropLeft,
                opacity: attrs.opacity,
                // a:hlinkClick on the picture — clicked image should open the URL
                // in a new tab, same as a text hyperlink.
                hlinkHref: attrs.hlinkHref,
                pmStart: childPos,
                pmEnd: childPos + child.nodeSize,
            };
            runs.push(run);
        }
        else if (child.type.name === 'field') {
            // Field node — convert to FieldRun for render-time substitution
            const ft = child.attrs.fieldType;
            const mappedType = ft === 'PAGE'
                ? 'PAGE'
                : ft === 'NUMPAGES'
                    ? 'NUMPAGES'
                    : ft === 'DATE'
                        ? 'DATE'
                        : ft === 'TIME'
                            ? 'TIME'
                            : 'OTHER';
            const run = {
                kind: 'field',
                fieldType: mappedType,
                fallback: child.attrs.displayText || '',
                pmStart: childPos,
                pmEnd: childPos + child.nodeSize,
            };
            runs.push(run);
        }
        else if (child.type.name === 'math') {
            // Math node — convert the stored OMML to MathML so the painter can
            // render real math; `text` stays the plain-text fallback (and is
            // what the engine measures, so line layout is unchanged).
            const text = child.attrs.plainText || '[equation]';
            const ommlXml = child.attrs.ommlXml || '';
            const display = child.attrs.display === 'block' ? 'block' : 'inline';
            // Authored equations carry MathML directly; Word-imported ones derive
            // it from the preserved OMML.
            const authoredMathml = child.attrs.mathml || '';
            const mathml = authoredMathml || (ommlXml ? ((_a = ommlToMathml(ommlXml, { display })) !== null && _a !== void 0 ? _a : undefined) : undefined);
            const run = {
                kind: 'text',
                text,
                mathml,
                italic: true,
                fontFamily: 'Cambria Math',
                pmStart: childPos,
                pmEnd: childPos + child.nodeSize,
            };
            runs.push(run);
        }
        else if (child.type.name === 'sdt') {
            // SDT (Structured Document Tag / content control) — inline wrapper node.
            // Descend into its children to extract the actual text runs.
            const sdtInnerOffset = childPos + 1; // +1 for opening tag
            child.forEach((sdtChild, sdtChildOffset) => {
                const sdtChildPos = sdtInnerOffset + sdtChildOffset;
                if (sdtChild.isText && sdtChild.text) {
                    const formatting = extractRunFormatting(sdtChild.marks, theme);
                    const run = Object.assign(Object.assign({ kind: 'text', text: sdtChild.text }, formatting), { pmStart: sdtChildPos, pmEnd: sdtChildPos + sdtChild.nodeSize });
                    runs.push(run);
                }
                else if (sdtChild.type.name === 'hardBreak') {
                    const run = {
                        kind: 'lineBreak',
                        pmStart: sdtChildPos,
                        pmEnd: sdtChildPos + sdtChild.nodeSize,
                    };
                    runs.push(run);
                }
                else if (sdtChild.type.name === 'tab') {
                    const formatting = extractRunFormatting(sdtChild.marks, theme);
                    const run = Object.assign(Object.assign({ kind: 'tab' }, formatting), { pmStart: sdtChildPos, pmEnd: sdtChildPos + sdtChild.nodeSize });
                    runs.push(run);
                }
                else if (sdtChild.type.name === 'image') {
                    const attrs = sdtChild.attrs;
                    const sdtConstrained = constrainImageToPage(attrs.width || 100, attrs.height || 100, _options.pageContentHeight, !!attrs.wrapType // any wrap type = floating; don't scale to page
                    );
                    const run = {
                        kind: 'image',
                        src: attrs.src,
                        width: sdtConstrained.width,
                        height: sdtConstrained.height,
                        alt: attrs.alt,
                        transform: attrs.transform,
                        borderWidth: attrs.borderWidth,
                        borderColor: attrs.borderColor,
                        borderStyle: attrs.borderStyle,
                        wrapType: attrs.wrapType,
                        displayMode: attrs.displayMode,
                        cssFloat: attrs.cssFloat,
                        distTop: attrs.distTop,
                        distBottom: attrs.distBottom,
                        distLeft: attrs.distLeft,
                        distRight: attrs.distRight,
                        position: attrs.position,
                        cropTop: attrs.cropTop,
                        cropRight: attrs.cropRight,
                        cropBottom: attrs.cropBottom,
                        cropLeft: attrs.cropLeft,
                        opacity: attrs.opacity,
                        pmStart: sdtChildPos,
                        pmEnd: sdtChildPos + sdtChild.nodeSize,
                    };
                    runs.push(run);
                }
            });
        }
    });
    return runs;
}
/**
 * Advance the counter stack for a list paragraph and return the rendered
 * marker. Mutates `counters` in place. Returns null when no marker should
 * be drawn (numId is missing or 0 — "no numbering" per ECMA-376).
 */
function computeListMarker(pmAttrs, listCounters, seenNumIds) {
    var _a, _b, _c, _d, _e;
    const numPr = pmAttrs.numPr;
    if (!numPr)
        return null;
    const numId = numPr.numId;
    if (numId == null || numId === 0)
        return null;
    // Bullets don't consume a numbering slot — they share a numId with numbered
    // levels in some templates, and incrementing here would skip numbers.
    // Run the Symbol-font glyph mapper here too so bullets in table cells and
    // text boxes get the same Unicode conversion that body bullets get from
    // the parser-side resolveBulletMarker (idempotent for already-Unicode chars).
    if (pmAttrs.listIsBullet) {
        return convertBulletToUnicode(pmAttrs.listMarker || '');
    }
    const level = (_a = numPr.ilvl) !== null && _a !== void 0 ? _a : 0;
    const counterKey = (_b = pmAttrs.listAbstractNumId) !== null && _b !== void 0 ? _b : numId;
    const counters = (_c = listCounters.get(counterKey)) !== null && _c !== void 0 ? _c : new Array(9).fill(0);
    const seenKey = `${numId}:${level}`;
    if (!seenNumIds.has(seenKey)) {
        seenNumIds.add(seenKey);
        if (pmAttrs.listStartOverride != null) {
            // Set to (start - 1) so the increment below produces `start` itself.
            counters[level] = pmAttrs.listStartOverride - 1;
        }
    }
    counters[level] = ((_d = counters[level]) !== null && _d !== void 0 ? _d : 0) + 1;
    for (let i = level + 1; i < counters.length; i += 1) {
        counters[i] = 0;
    }
    listCounters.set(counterKey, counters);
    // Parsed lvlText template (e.g. "%1." or "%1.%2.") resolves against the
    // counter stack. Editor-created lists with no template fall back to the
    // generic decimal formatter.
    if (pmAttrs.listMarker && pmAttrs.listMarker.includes('%')) {
        return resolveListTemplate(pmAttrs.listMarker, counters, (_e = pmAttrs.listLevelNumFmts) !== null && _e !== void 0 ? _e : undefined);
    }
    if (pmAttrs.listMarker) {
        return pmAttrs.listMarker;
    }
    return formatNumberedMarker(counters, level);
}
/**
 * Convert PM paragraph attrs to layout engine paragraph attrs.
 */
function convertParagraphAttrs(pmAttrs, theme, listCounters, listSeenNumIds) {
    var _a, _b, _c;
    const attrs = {};
    // Alignment - map DOCX values to CSS-compatible values
    // DOCX uses 'both' for justify, 'distribute' for distributed justify
    if (pmAttrs.alignment) {
        const align = pmAttrs.alignment;
        if (align === 'both' || align === 'distribute') {
            attrs.alignment = 'justify';
        }
        else if (align === 'left') {
            attrs.alignment = 'left';
        }
        else if (align === 'center') {
            attrs.alignment = 'center';
        }
        else if (align === 'right') {
            attrs.alignment = 'right';
        }
        // Other DOCX alignments (mediumKashida, highKashida, lowKashida, thaiDistribute, justify)
        // default to no alignment set (inherits from style or defaults to left)
    }
    // Spacing
    if (pmAttrs.spaceBefore != null || pmAttrs.spaceAfter != null || pmAttrs.lineSpacing != null) {
        attrs.spacing = {};
        if (pmAttrs.spaceBefore != null) {
            attrs.spacing.before = twipsToPixels(pmAttrs.spaceBefore);
        }
        if (pmAttrs.spaceAfter != null) {
            attrs.spacing.after = twipsToPixels(pmAttrs.spaceAfter);
        }
        if (pmAttrs.lineSpacing != null) {
            // Line spacing in twips - convert to multiplier or exact
            if (pmAttrs.lineSpacingRule === 'exact' || pmAttrs.lineSpacingRule === 'atLeast') {
                attrs.spacing.line = twipsToPixels(pmAttrs.lineSpacing);
                attrs.spacing.lineUnit = 'px';
                attrs.spacing.lineRule = pmAttrs.lineSpacingRule;
            }
            else {
                // Auto - line spacing is in 240ths of a line
                attrs.spacing.line = pmAttrs.lineSpacing / 240;
                attrs.spacing.lineUnit = 'multiplier';
                attrs.spacing.lineRule = 'auto';
            }
        }
    }
    if (pmAttrs.spacingExplicit) {
        attrs.spacingExplicit = pmAttrs.spacingExplicit;
    }
    // Indentation - handle list item fallback calculation
    // For list items without explicit indentation, calculate based on level
    let indentLeft = pmAttrs.indentLeft;
    let indentFirstLine = pmAttrs.indentFirstLine;
    let hangingIndent = pmAttrs.hangingIndent;
    if (((_a = pmAttrs.numPr) === null || _a === void 0 ? void 0 : _a.numId) && indentLeft == null) {
        // Fallback: calculate indentation based on level
        // Each level indents 0.5 inch (720 twips) more
        const level = (_b = pmAttrs.numPr.ilvl) !== null && _b !== void 0 ? _b : 0;
        // Base indentation: 0.5 inch (720 twips) per level
        // Level 0 = 720 twips, Level 1 = 1440 twips, etc.
        indentLeft = (level + 1) * 720;
        // Default hanging indent of 360 twips for the list marker
        if (indentFirstLine == null) {
            indentFirstLine = -360;
            hangingIndent = true;
        }
    }
    if (indentLeft != null || pmAttrs.indentRight != null || indentFirstLine != null) {
        attrs.indent = {};
        if (indentLeft != null) {
            attrs.indent.left = twipsToPixels(indentLeft);
        }
        if (pmAttrs.indentRight != null) {
            attrs.indent.right = twipsToPixels(pmAttrs.indentRight);
        }
        if (indentFirstLine != null) {
            if (hangingIndent) {
                // Hanging indent: indentFirstLine is stored as negative, convert to positive for rendering
                attrs.indent.hanging = Math.abs(twipsToPixels(indentFirstLine));
            }
            else {
                attrs.indent.firstLine = twipsToPixels(indentFirstLine);
            }
        }
    }
    // Style ID
    if (pmAttrs.styleId) {
        attrs.styleId = pmAttrs.styleId;
    }
    // Borders
    if (pmAttrs.borders) {
        const borders = pmAttrs.borders;
        attrs.borders = {};
        const convertBorder = (border) => border ? convertBorderSpecToLayout(border, theme) : undefined;
        if (borders.top)
            attrs.borders.top = convertBorder(borders.top);
        if (borders.bottom)
            attrs.borders.bottom = convertBorder(borders.bottom);
        if (borders.left)
            attrs.borders.left = convertBorder(borders.left);
        if (borders.right)
            attrs.borders.right = convertBorder(borders.right);
        if (borders.between)
            attrs.borders.between = convertBorder(borders.between);
        if (borders.bar)
            attrs.borders.bar = convertBorder(borders.bar);
        // Only include if at least one border is set
        if (!attrs.borders.top &&
            !attrs.borders.bottom &&
            !attrs.borders.left &&
            !attrs.borders.right &&
            !attrs.borders.between &&
            !attrs.borders.bar) {
            delete attrs.borders;
        }
    }
    const shadingHex = resolveColorToHex((_c = pmAttrs.shading) === null || _c === void 0 ? void 0 : _c.fill, theme);
    if (shadingHex)
        attrs.shading = `#${shadingHex}`;
    // Tab stops
    if (pmAttrs.tabs && pmAttrs.tabs.length > 0) {
        attrs.tabs = pmAttrs.tabs.map((tab) => ({
            val: mapTabAlignment(tab.alignment),
            pos: tab.position,
            leader: tab.leader,
        }));
    }
    // Page break control. `renderedPageBreakBefore` (Word's
    // `<w:lastRenderedPageBreak/>` marker) is informational — it records where
    // Word last broke the page. ECMA-376 §17.4.16 does NOT specify it as a
    // forced break, and Word does not honor it as one on reflow. Preserve the
    // attr through round-trip so the marker is re-emitted on save, but do not
    // act on it during layout.
    if (pmAttrs.pageBreakBefore) {
        attrs.pageBreakBefore = true;
    }
    if (pmAttrs.keepNext) {
        attrs.keepNext = true;
    }
    if (pmAttrs.keepLines) {
        attrs.keepLines = true;
    }
    if (pmAttrs.contextualSpacing) {
        attrs.contextualSpacing = true;
    }
    if (pmAttrs.bidi) {
        attrs.bidi = true;
    }
    if (pmAttrs.styleId) {
        attrs.styleId = pmAttrs.styleId;
    }
    // List properties
    if (pmAttrs.numPr) {
        attrs.numPr = {
            numId: pmAttrs.numPr.numId,
            ilvl: pmAttrs.numPr.ilvl,
        };
    }
    // Resolve the OOXML lvlText template (e.g. "%1.") into the rendered marker
    // ("1.", "II.", "1.1.", etc.). Single source of truth — covers body, table,
    // and text-box paragraphs since they all share this attr conversion.
    const resolvedMarker = listCounters && listSeenNumIds
        ? computeListMarker(pmAttrs, listCounters, listSeenNumIds)
        : null;
    if (resolvedMarker != null) {
        attrs.listMarker = resolvedMarker;
    }
    else if (pmAttrs.listMarker) {
        attrs.listMarker = pmAttrs.listMarker;
    }
    if (pmAttrs.listIsBullet != null) {
        attrs.listIsBullet = pmAttrs.listIsBullet;
    }
    if (pmAttrs.listMarkerHidden) {
        attrs.listMarkerHidden = true;
    }
    if (pmAttrs.listMarkerFontFamily) {
        attrs.listMarkerFontFamily = pmAttrs.listMarkerFontFamily;
    }
    if (pmAttrs.listMarkerFontSize) {
        attrs.listMarkerFontSize = pmAttrs.listMarkerFontSize;
    }
    // Default font for empty paragraph measurement (from style's rPr / pPr/rPr)
    const dtf = pmAttrs.defaultTextFormatting;
    if (dtf) {
        if (dtf.fontSize != null) {
            // fontSize in TextFormatting is in half-points, convert to points
            attrs.defaultFontSize = dtf.fontSize / 2;
        }
        if (dtf.fontFamily) {
            attrs.defaultFontFamily = (dtf.fontFamily.ascii || dtf.fontFamily.hAnsi);
        }
    }
    return attrs;
}
/**
 * Map document TabStopAlignment to layout engine TabAlignment
 */
function mapTabAlignment(align) {
    switch (align) {
        case 'left':
            return 'start';
        case 'right':
            return 'end';
        case 'center':
            return 'center';
        case 'decimal':
            return 'decimal';
        case 'bar':
            return 'bar';
        case 'clear':
            return 'clear';
        case 'num':
            return 'start'; // Number tab treated as left-aligned
        default:
            return 'start';
    }
}
/**
 * Convert a paragraph node to a ParagraphBlock.
 */
function convertParagraph(node, startPos, options) {
    const pmAttrs = node.attrs;
    const runs = paragraphToRuns(node, startPos, options);
    const attrs = convertParagraphAttrs(pmAttrs, options.theme, options.listCounters, options.listSeenNumIds);
    return {
        kind: 'paragraph',
        id: nextBlockId(),
        runs,
        attrs,
        pmStart: startPos,
        pmEnd: startPos + node.nodeSize,
    };
}
/**
 * Convert border width from eighths of a point to pixels.
 * OOXML stores border widths in eighths of a point.
 */
function borderWidthToPixels(eighthsOfPoint) {
    // 1 point = 1.333 pixels at 96 DPI
    // eighths of a point: divide by 8 first
    return Math.max(1, Math.round((eighthsOfPoint / 8) * 1.333));
}
// OOXML border style → CSS border-style mapping
const OOXML_TO_CSS_BORDER = {
    single: 'solid',
    double: 'double',
    dotted: 'dotted',
    dashed: 'dashed',
    thick: 'solid',
    dashSmallGap: 'dashed',
    dotDash: 'dashed',
    dotDotDash: 'dotted',
    triple: 'double',
    wave: 'solid',
    doubleWave: 'double',
    threeDEmboss: 'ridge',
    threeDEngrave: 'groove',
    outset: 'outset',
    inset: 'inset',
};
/**
 * Convert an OOXML BorderSpec to a layout-engine BorderStyle.
 * Shared by paragraph borders, cell borders, and header/footer borders.
 */
export function convertBorderSpecToLayout(border, theme) {
    var _a;
    if (!border || !border.style || border.style === 'none' || border.style === 'nil') {
        return undefined;
    }
    const result = {
        style: OOXML_TO_CSS_BORDER[border.style] || 'solid',
        width: borderWidthToPixels((_a = border.size) !== null && _a !== void 0 ? _a : 0),
        color: border.color
            ? resolveColor(border.color, theme)
            : '#000000',
    };
    if (border.space !== undefined) {
        result.space = pointsToPixels(border.space);
    }
    return result;
}
/**
 * Extract cell borders from ProseMirror attributes.
 * Borders are full BorderSpec objects with style/size/color.
 */
function extractCellBorders(attrs, theme) {
    const borders = attrs.borders;
    if (!borders) {
        return undefined;
    }
    const result = {};
    const sides = ['top', 'bottom', 'left', 'right'];
    for (const side of sides) {
        const border = borders[side];
        const converted = border ? convertBorderSpecToLayout(border, theme) : undefined;
        result[side] = converted !== null && converted !== void 0 ? converted : { width: 0, style: 'none' };
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
/**
 * Convert a table cell node.
 */
function convertTableCell(node, startPos, options, tableCellMargins) {
    const blocks = [];
    let offset = startPos + 1; // +1 for opening tag
    node.forEach((child) => {
        if (child.type.name === 'paragraph') {
            blocks.push(convertParagraph(child, offset, options));
        }
        else if (child.type.name === 'table') {
            blocks.push(convertTable(child, offset, options));
        }
        offset += child.nodeSize;
    });
    const attrs = node.attrs;
    const widthValue = attrs.width;
    const widthType = attrs.widthType;
    const width = widthValue && (!widthType || widthType === 'dxa' || widthType === 'auto')
        ? twipsToPixels(widthValue)
        : undefined;
    // Resolve cell padding via the OOXML cascade (§17.4.41 + §17.4.79):
    //   1. cell w:tcMar (per-side, only when value > 0 — Word treats an
    //      explicit zero as "fall through, not literal zero")
    //   2. table-level w:tblCellMar / resolved table style's tblPr.cellMargins
    //
    // Tier 2 is fully resolved upstream by toProseDoc.convertTable, which
    // walks the inline tblCellMar → table-style → basedOn chain → default
    // table style cascade. We just consume the flattened result here. There
    // is no hardcoded "TableNormal default" fallback any more — any document
    // with a styles.xml will have its default table style's cellMargins
    // already in tableCellMargins; a document genuinely missing every tier
    // renders with 0 padding (the spec literal), which is correct for that
    // edge case.
    const margins = attrs.margins;
    const resolveSide = (cellTwips, tableTwips) => {
        if (cellTwips != null) {
            const px = twipsToPixels(cellTwips);
            if (px > 0)
                return px;
        }
        if (tableTwips != null) {
            const px = twipsToPixels(tableTwips);
            if (px >= 0)
                return px;
        }
        return 0;
    };
    const padding = {
        top: resolveSide(margins === null || margins === void 0 ? void 0 : margins.top, tableCellMargins === null || tableCellMargins === void 0 ? void 0 : tableCellMargins.top),
        right: resolveSide(margins === null || margins === void 0 ? void 0 : margins.right, tableCellMargins === null || tableCellMargins === void 0 ? void 0 : tableCellMargins.right),
        bottom: resolveSide(margins === null || margins === void 0 ? void 0 : margins.bottom, tableCellMargins === null || tableCellMargins === void 0 ? void 0 : tableCellMargins.bottom),
        left: resolveSide(margins === null || margins === void 0 ? void 0 : margins.left, tableCellMargins === null || tableCellMargins === void 0 ? void 0 : tableCellMargins.left),
    };
    return {
        id: nextBlockId(),
        blocks,
        colSpan: attrs.colspan,
        rowSpan: attrs.rowspan,
        width,
        widthValue,
        widthType,
        verticalAlign: attrs.verticalAlign,
        background: attrs.backgroundColor ? `#${attrs.backgroundColor}` : undefined,
        borders: extractCellBorders(attrs, options.theme),
        padding,
        noWrap: attrs.noWrap || undefined,
    };
}
/**
 * Convert a table row node.
 */
function convertTableRow(node, startPos, options, tableCellMargins) {
    var _a;
    const cells = [];
    let offset = startPos + 1; // +1 for opening tag
    node.forEach((child) => {
        if (child.type.name === 'tableCell' || child.type.name === 'tableHeader') {
            cells.push(convertTableCell(child, offset, options, tableCellMargins));
        }
        offset += child.nodeSize;
    });
    const attrs = node.attrs;
    return {
        id: nextBlockId(),
        cells,
        height: attrs.height ? twipsToPixels(attrs.height) : undefined,
        heightRule: (_a = attrs.heightRule) !== null && _a !== void 0 ? _a : undefined,
        isHeader: attrs.isHeader,
    };
}
/**
 * Convert a table node to a TableBlock.
 */
function convertTable(node, startPos, options) {
    var _a, _b, _c;
    const rows = [];
    let offset = startPos + 1; // +1 for opening tag
    // Read the table-level <w:tblCellMar> default cell margins (twips). Cells
    // cascade to this when their own w:tcMar is absent or explicit-zero.
    //
    // Prefer `resolvedCellMargins` — the per-side cascade result (inline →
    // table style → default table style). The bare `cellMargins` attr mirrors
    // the verbatim inline tblCellMar for round-trip and may omit sides the
    // source left to inheritance (e.g. a top/bottom-only tblCellMar); using it
    // directly would zero the unspecified left/right and let cell text run to
    // the cell edge. `resolvedCellMargins` carries the inherited sides.
    const tableCellMargins = ((_a = node.attrs.resolvedCellMargins) !== null && _a !== void 0 ? _a : node.attrs.cellMargins);
    node.forEach((child) => {
        if (child.type.name === 'tableRow') {
            rows.push(convertTableRow(child, offset, options, tableCellMargins));
        }
        offset += child.nodeSize;
    });
    // Extract columnWidths from node attributes and convert from twips to pixels
    const columnWidthsTwips = node.attrs.columnWidths;
    let columnWidths = columnWidthsTwips === null || columnWidthsTwips === void 0 ? void 0 : columnWidthsTwips.map(twipsToPixels);
    const width = node.attrs.width;
    const widthType = node.attrs.widthType;
    // Fallback: compute column widths from first row cell widths if table attr is missing
    if (!columnWidths && rows.length > 0) {
        const firstRow = rows[0];
        const cellWidths = firstRow.cells.map((cell) => cell.width);
        // Only use if all cells have widths defined
        if (cellWidths.every((w) => w !== undefined && w > 0)) {
            columnWidths = cellWidths;
        }
    }
    // Extract justification
    const justification = node.attrs.justification;
    // Extract table indent from _originalFormatting (w:tblInd).
    //
    // Word renders `tblInd` as the distance from the page margin to the
    // first cell's *content* area, not to the first cell's outer edge
    // (ECMA-376 §17.4.8 + Word's de-facto behavior). To match, subtract
    // the table-level left cell margin from the pixel offset so the
    // first cell's content lines up at `tblInd` exactly. Without this
    // compensation, tables sit ~7 px (Word's default 108-twip cell
    // margin) further right than they do in Word.
    //
    // When `tblInd` is absent, Word defaults to the negative left cell
    // margin so the cell content still sits at the page margin —
    // mirrored here.
    const DEFAULT_LEFT_CELL_MARGIN_TWIPS = 108;
    const originalFormatting = node.attrs._originalFormatting;
    const leftCellMarginTwips = (_b = tableCellMargins === null || tableCellMargins === void 0 ? void 0 : tableCellMargins.left) !== null && _b !== void 0 ? _b : DEFAULT_LEFT_CELL_MARGIN_TWIPS;
    const indentPx = ((_c = originalFormatting === null || originalFormatting === void 0 ? void 0 : originalFormatting.indent) === null || _c === void 0 ? void 0 : _c.value) !== undefined && originalFormatting.indent.type === 'dxa'
        ? twipsToPixels(originalFormatting.indent.value - leftCellMarginTwips)
        : -twipsToPixels(leftCellMarginTwips);
    const floating = node.attrs.floating;
    const floatingPx = floating
        ? {
            horzAnchor: floating.horzAnchor,
            vertAnchor: floating.vertAnchor,
            tblpX: floating.tblpX !== undefined ? twipsToPixels(floating.tblpX) : undefined,
            tblpXSpec: floating.tblpXSpec,
            tblpY: floating.tblpY !== undefined ? twipsToPixels(floating.tblpY) : undefined,
            tblpYSpec: floating.tblpYSpec,
            topFromText: floating.topFromText !== undefined ? twipsToPixels(floating.topFromText) : undefined,
            bottomFromText: floating.bottomFromText !== undefined
                ? twipsToPixels(floating.bottomFromText)
                : undefined,
            leftFromText: floating.leftFromText !== undefined ? twipsToPixels(floating.leftFromText) : undefined,
            rightFromText: floating.rightFromText !== undefined ? twipsToPixels(floating.rightFromText) : undefined,
        }
        : undefined;
    return {
        kind: 'table',
        id: nextBlockId(),
        rows,
        columnWidths,
        width,
        widthType,
        justification,
        indent: indentPx,
        floating: floatingPx,
        pmStart: startPos,
        pmEnd: startPos + node.nodeSize,
    };
}
/**
 * Convert an image node to an ImageBlock.
 */
function convertImage(node, startPos, pageContentHeight) {
    const attrs = node.attrs;
    const wrapType = attrs.wrapType;
    // Only anchor images with 'behind' or 'inFront' wrap types
    // Other wrap types (square, tight, through, topAndBottom) need text wrapping
    // which we don't support yet, so treat them as block-level images
    const shouldAnchor = wrapType === 'behind' || wrapType === 'inFront';
    const constrained = constrainImageToPage(attrs.width || 100, attrs.height || 100, pageContentHeight, !!wrapType // any wrap type = floating; don't scale to page
    );
    return {
        kind: 'image',
        id: nextBlockId(),
        src: attrs.src,
        width: constrained.width,
        height: constrained.height,
        alt: attrs.alt,
        transform: attrs.transform,
        borderWidth: attrs.borderWidth,
        borderColor: attrs.borderColor,
        borderStyle: attrs.borderStyle,
        anchor: shouldAnchor
            ? {
                isAnchored: true,
                offsetH: attrs.distLeft,
                offsetV: attrs.distTop,
                behindDoc: wrapType === 'behind',
            }
            : undefined,
        hlinkHref: attrs.hlinkHref,
        pmStart: startPos,
        pmEnd: startPos + node.nodeSize,
    };
}
/**
 * Convert a textBox PM node to a TextBoxBlock.
 */
function convertTextBoxNode(node, startPos, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const attrs = node.attrs;
    const contentBlocks = [];
    // Convert child paragraphs inside the text box
    node.forEach((child, offset) => {
        if (child.type.name === 'paragraph') {
            const block = convertParagraph(child, startPos + 1 + offset, opts);
            contentBlocks.push(block);
        }
    });
    // Anchor data — round-tripped through PM via TextBoxExtension's
    // posOffsetH/V/posRelFromH/V/posAlignH/V attrs. Wrapping into a
    // single `anchor` object is purely a layout-time grouping; the
    // PM-side attrs stay flat for backwards compatibility. Only emit
    // the anchor when at least one position attr is present, so
    // non-anchored boxes don't pay any render-time cost.
    const hasAnchor = attrs.posOffsetH != null ||
        attrs.posOffsetV != null ||
        attrs.posRelFromH != null ||
        attrs.posRelFromV != null ||
        attrs.posAlignH != null ||
        attrs.posAlignV != null;
    // `behindDoc` (VML z-index<0 → wrapType 'behind') drives both the paint
    // order (z-index −1) and the flow space-reservation for paragraph-anchored
    // groups (the SDS hazard box). Carried on the anchor only.
    const behindDoc = attrs.wrapType === 'behind';
    const anchor = hasAnchor
        ? {
            offsetH: (_a = attrs.posOffsetH) !== null && _a !== void 0 ? _a : undefined,
            offsetV: (_b = attrs.posOffsetV) !== null && _b !== void 0 ? _b : undefined,
            relFromH: (_c = attrs.posRelFromH) !== null && _c !== void 0 ? _c : undefined,
            relFromV: (_d = attrs.posRelFromV) !== null && _d !== void 0 ? _d : undefined,
            alignH: (_e = attrs.posAlignH) !== null && _e !== void 0 ? _e : undefined,
            alignV: (_f = attrs.posAlignV) !== null && _f !== void 0 ? _f : undefined,
            behindDoc: behindDoc || undefined,
        }
        : undefined;
    return {
        kind: 'textBox',
        id: nextBlockId(),
        width: (_g = attrs.width) !== null && _g !== void 0 ? _g : DEFAULT_TEXTBOX_WIDTH,
        height: (_h = attrs.height) !== null && _h !== void 0 ? _h : undefined,
        fillColor: attrs.fillColor,
        outlineWidth: attrs.outlineWidth,
        outlineColor: attrs.outlineColor,
        outlineStyle: attrs.outlineStyle,
        margins: {
            top: (_j = attrs.marginTop) !== null && _j !== void 0 ? _j : DEFAULT_TEXTBOX_MARGINS.top,
            bottom: (_k = attrs.marginBottom) !== null && _k !== void 0 ? _k : DEFAULT_TEXTBOX_MARGINS.bottom,
            left: (_l = attrs.marginLeft) !== null && _l !== void 0 ? _l : DEFAULT_TEXTBOX_MARGINS.left,
            right: (_m = attrs.marginRight) !== null && _m !== void 0 ? _m : DEFAULT_TEXTBOX_MARGINS.right,
        },
        content: contentBlocks,
        autoFit: (_o = attrs.autoFit) !== null && _o !== void 0 ? _o : undefined,
        anchor,
        pmStart: startPos,
        pmEnd: startPos + node.nodeSize,
    };
}
/**
 * Convert a ProseMirror document to FlowBlock array.
 *
 * Walks the document tree, converting each node to the appropriate block type.
 * Tracks pmStart/pmEnd positions for each block for click-to-position mapping.
 */
export function toFlowBlocks(doc, options = {}) {
    var _a, _b;
    const opts = Object.assign(Object.assign({}, options), { defaultFont: (_a = options.defaultFont) !== null && _a !== void 0 ? _a : DEFAULT_FONT, defaultSize: (_b = options.defaultSize) !== null && _b !== void 0 ? _b : DEFAULT_SIZE });
    const blocks = [];
    const offset = 0; // Start at document beginning
    let lastSectionMarginsTwips = {
        top: 1440,
        bottom: 1440,
        left: 1440,
        right: 1440,
    };
    // Shared counter map: paragraphs in tables and text boxes update it too,
    // so list numbering stays continuous across containers.
    if (!opts.listCounters) {
        opts.listCounters = new Map();
    }
    if (!opts.listSeenNumIds) {
        opts.listSeenNumIds = new Set();
    }
    doc.forEach((node, nodeOffset) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const pos = offset + nodeOffset;
        switch (node.type.name) {
            case 'paragraph':
                {
                    const block = convertParagraph(node, pos, opts);
                    const pmAttrs = node.attrs;
                    blocks.push(block);
                    // Emit section break block if this paragraph ends a section
                    const secProps = pmAttrs._sectionProperties;
                    if (secProps || pmAttrs.sectionBreakType) {
                        const sectionBreak = {
                            kind: 'sectionBreak',
                            id: nextBlockId(),
                            type: ((_a = secProps === null || secProps === void 0 ? void 0 : secProps.sectionStart) !== null && _a !== void 0 ? _a : pmAttrs.sectionBreakType),
                        };
                        if (secProps) {
                            // Populate page size when at least one dimension is overridden.
                            if (secProps.pageWidth !== undefined || secProps.pageHeight !== undefined) {
                                sectionBreak.pageSize = {
                                    w: twipsToPixels((_b = secProps.pageWidth) !== null && _b !== void 0 ? _b : 12240),
                                    h: twipsToPixels((_c = secProps.pageHeight) !== null && _c !== void 0 ? _c : 15840),
                                };
                            }
                            // Section overrides any margin → emit a full margins record;
                            // unset sides inherit from the prior section (tracked above)
                            // instead of resetting to the OOXML 1440 default.
                            if (secProps.marginTop !== undefined ||
                                secProps.marginBottom !== undefined ||
                                secProps.marginLeft !== undefined ||
                                secProps.marginRight !== undefined) {
                                const mergedTwips = {
                                    top: (_d = secProps.marginTop) !== null && _d !== void 0 ? _d : lastSectionMarginsTwips.top,
                                    bottom: (_e = secProps.marginBottom) !== null && _e !== void 0 ? _e : lastSectionMarginsTwips.bottom,
                                    left: (_f = secProps.marginLeft) !== null && _f !== void 0 ? _f : lastSectionMarginsTwips.left,
                                    right: (_g = secProps.marginRight) !== null && _g !== void 0 ? _g : lastSectionMarginsTwips.right,
                                };
                                sectionBreak.margins = {
                                    top: twipsToPixels(mergedTwips.top),
                                    bottom: twipsToPixels(mergedTwips.bottom),
                                    left: twipsToPixels(mergedTwips.left),
                                    right: twipsToPixels(mergedTwips.right),
                                };
                                lastSectionMarginsTwips = mergedTwips;
                            }
                            // Populate columns
                            const colCount = (_h = secProps.columnCount) !== null && _h !== void 0 ? _h : 1;
                            if (colCount > 1) {
                                const cols = {
                                    count: colCount,
                                    gap: twipsToPixels((_j = secProps.columnSpace) !== null && _j !== void 0 ? _j : 720),
                                    equalWidth: (_k = secProps.equalWidth) !== null && _k !== void 0 ? _k : true,
                                    separator: secProps.separator,
                                };
                                // Unequal columns (`w:equalWidth="0"`): carry the explicit
                                // per-column `w:col` widths/spaces so the value column gets its
                                // true (wider) width instead of an even split — even columns
                                // over-narrow the wide column, over-wrapping its text and
                                // inflating the region (and document) height.
                                if (secProps.equalWidth === false &&
                                    secProps.columns &&
                                    secProps.columns.length === colCount &&
                                    secProps.columns.every((c) => typeof c.width === 'number' && c.width > 0)) {
                                    cols.columnWidths = secProps.columns.map((c) => {
                                        var _a;
                                        return ({
                                            width: twipsToPixels(c.width),
                                            space: twipsToPixels((_a = c.space) !== null && _a !== void 0 ? _a : 0),
                                        });
                                    });
                                }
                                sectionBreak.columns = cols;
                            }
                        }
                        blocks.push(sectionBreak);
                    }
                }
                break;
            case 'table':
                blocks.push(convertTable(node, pos, opts));
                break;
            case 'image':
                // Standalone image block (if not inline)
                blocks.push(convertImage(node, pos, opts.pageContentHeight));
                break;
            case 'textBox':
                blocks.push(convertTextBoxNode(node, pos, opts));
                break;
            case 'horizontalRule':
            case 'pageBreak': {
                // A `pageBreak` node carries a `breakType` attr: 'page' (the default,
                // forced page break) or 'column' (§17.3.3.1 `<w:br w:type="column"/>`).
                // Route a column break to a `columnBreak` FlowBlock so the paginator
                // advances the column rather than forcing a whole new page — in a
                // single-column section that advance is a no-op, matching Word, instead
                // of spilling each column break onto its own page. `horizontalRule`
                // has no attrs and falls through as a page break.
                if (node.type.name === 'pageBreak' && node.attrs.breakType === 'column') {
                    const cb = {
                        kind: 'columnBreak',
                        id: nextBlockId(),
                        pmStart: pos,
                        pmEnd: pos + node.nodeSize,
                    };
                    blocks.push(cb);
                    break;
                }
                const pb = {
                    kind: 'pageBreak',
                    id: nextBlockId(),
                    pmStart: pos,
                    pmEnd: pos + node.nodeSize,
                };
                blocks.push(pb);
                break;
            }
        }
    });
    return blocks;
}
//# sourceMappingURL=toFlowBlocks.js.map