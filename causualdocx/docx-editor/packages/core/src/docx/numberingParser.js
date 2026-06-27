/**
 * Numbering/List Parser for DOCX
 *
 * Parses numbering.xml to extract:
 * - Abstract numbering definitions (templates with levels)
 * - Numbering instances (concrete references with optional overrides)
 *
 * OOXML Structure:
 * - w:abstractNum - Template definitions with 9 levels (0-8)
 * - w:num - Instances that reference abstractNum and can override levels
 * - w:lvl - Level definition with start, format, text pattern, etc.
 */
import { parseXmlDocument, findChild, findChildren, getAttribute, parseBooleanElement, parseNumericAttribute, } from './xmlParser';
/**
 * Parse numbering.xml into NumberingDefinitions
 *
 * @param numberingXml - Raw XML string from word/numbering.xml (or null if not present)
 * @returns NumberingMap with definitions and helper functions
 */
export function parseNumbering(numberingXml) {
    const definitions = {
        abstractNums: [],
        nums: [],
    };
    if (!numberingXml) {
        return createNumberingMap(definitions);
    }
    const root = parseXmlDocument(numberingXml);
    if (!root) {
        return createNumberingMap(definitions);
    }
    // Parse abstract numbering definitions
    const abstractNumElements = findChildren(root, 'w', 'abstractNum');
    for (const abstractNum of abstractNumElements) {
        const parsed = parseAbstractNumbering(abstractNum);
        if (parsed) {
            definitions.abstractNums.push(parsed);
        }
    }
    // Parse numbering instances
    const numElements = findChildren(root, 'w', 'num');
    for (const num of numElements) {
        const parsed = parseNumberingInstance(num);
        if (parsed) {
            definitions.nums.push(parsed);
        }
    }
    return createNumberingMap(definitions);
}
/**
 * Parse a single w:abstractNum element
 */
function parseAbstractNumbering(element) {
    var _a, _b, _c;
    const abstractNumIdStr = getAttribute(element, 'w', 'abstractNumId');
    if (abstractNumIdStr === null)
        return null;
    const abstractNumId = parseInt(abstractNumIdStr, 10);
    if (isNaN(abstractNumId))
        return null;
    const abstractNum = {
        abstractNumId,
        levels: [],
    };
    // Parse optional attributes/children
    const multiLevelTypeEl = findChild(element, 'w', 'multiLevelType');
    if (multiLevelTypeEl) {
        const mlType = getAttribute(multiLevelTypeEl, 'w', 'val');
        if (mlType === 'hybridMultilevel' || mlType === 'multilevel' || mlType === 'singleLevel') {
            abstractNum.multiLevelType = mlType;
        }
    }
    // Parse name
    const nameEl = findChild(element, 'w', 'name');
    if (nameEl) {
        abstractNum.name = (_a = getAttribute(nameEl, 'w', 'val')) !== null && _a !== void 0 ? _a : undefined;
    }
    // Parse style links
    const numStyleLinkEl = findChild(element, 'w', 'numStyleLink');
    if (numStyleLinkEl) {
        abstractNum.numStyleLink = (_b = getAttribute(numStyleLinkEl, 'w', 'val')) !== null && _b !== void 0 ? _b : undefined;
    }
    const styleLinkEl = findChild(element, 'w', 'styleLink');
    if (styleLinkEl) {
        abstractNum.styleLink = (_c = getAttribute(styleLinkEl, 'w', 'val')) !== null && _c !== void 0 ? _c : undefined;
    }
    // Parse levels (w:lvl)
    const levelElements = findChildren(element, 'w', 'lvl');
    for (const lvlEl of levelElements) {
        const level = parseListLevel(lvlEl);
        if (level) {
            abstractNum.levels.push(level);
        }
    }
    // Sort levels by ilvl
    abstractNum.levels.sort((a, b) => a.ilvl - b.ilvl);
    return abstractNum;
}
/**
 * Parse a single w:num element (numbering instance)
 */
function parseNumberingInstance(element) {
    var _a;
    const numIdStr = getAttribute(element, 'w', 'numId');
    if (numIdStr === null)
        return null;
    const numId = parseInt(numIdStr, 10);
    if (isNaN(numId))
        return null;
    // Get abstract numbering reference
    const abstractNumIdEl = findChild(element, 'w', 'abstractNumId');
    if (!abstractNumIdEl)
        return null;
    const abstractNumIdStr = getAttribute(abstractNumIdEl, 'w', 'val');
    if (abstractNumIdStr === null)
        return null;
    const abstractNumId = parseInt(abstractNumIdStr, 10);
    if (isNaN(abstractNumId))
        return null;
    const instance = {
        numId,
        abstractNumId,
    };
    // Parse level overrides (w:lvlOverride)
    const overrideElements = findChildren(element, 'w', 'lvlOverride');
    if (overrideElements.length > 0) {
        instance.levelOverrides = [];
        for (const overrideEl of overrideElements) {
            const ilvlStr = getAttribute(overrideEl, 'w', 'ilvl');
            if (ilvlStr === null)
                continue;
            const ilvl = parseInt(ilvlStr, 10);
            if (isNaN(ilvl))
                continue;
            const override = { ilvl };
            // Check for start override
            const startOverrideEl = findChild(overrideEl, 'w', 'startOverride');
            if (startOverrideEl) {
                const startVal = getAttribute(startOverrideEl, 'w', 'val');
                if (startVal !== null) {
                    const startNum = parseInt(startVal, 10);
                    if (!isNaN(startNum)) {
                        override.startOverride = startNum;
                    }
                }
            }
            // Check for full level redefinition
            const lvlEl = findChild(overrideEl, 'w', 'lvl');
            if (lvlEl) {
                override.lvl = (_a = parseListLevel(lvlEl)) !== null && _a !== void 0 ? _a : undefined;
            }
            instance.levelOverrides.push(override);
        }
    }
    return instance;
}
/**
 * Parse a single w:lvl element (list level definition)
 */
function parseListLevel(element) {
    var _a;
    const ilvlStr = getAttribute(element, 'w', 'ilvl');
    if (ilvlStr === null)
        return null;
    const ilvl = parseInt(ilvlStr, 10);
    if (isNaN(ilvl) || ilvl < 0 || ilvl > 8)
        return null;
    const level = {
        ilvl,
        numFmt: 'decimal', // Default
        lvlText: '',
    };
    // Parse start value
    const startEl = findChild(element, 'w', 'start');
    if (startEl) {
        const startVal = getAttribute(startEl, 'w', 'val');
        if (startVal !== null) {
            const startNum = parseInt(startVal, 10);
            if (!isNaN(startNum)) {
                level.start = startNum;
            }
        }
    }
    // Parse number format
    const numFmtEl = findChild(element, 'w', 'numFmt');
    if (numFmtEl) {
        const fmtVal = getAttribute(numFmtEl, 'w', 'val');
        if (fmtVal) {
            level.numFmt = parseNumberFormat(fmtVal);
        }
    }
    // Parse level text (the pattern like "%1." or "•")
    const lvlTextEl = findChild(element, 'w', 'lvlText');
    if (lvlTextEl) {
        level.lvlText = (_a = getAttribute(lvlTextEl, 'w', 'val')) !== null && _a !== void 0 ? _a : '';
    }
    // Parse justification
    const lvlJcEl = findChild(element, 'w', 'lvlJc');
    if (lvlJcEl) {
        const jcVal = getAttribute(lvlJcEl, 'w', 'val');
        if (jcVal === 'left' || jcVal === 'center' || jcVal === 'right') {
            level.lvlJc = jcVal;
        }
    }
    // Parse suffix
    const suffEl = findChild(element, 'w', 'suff');
    if (suffEl) {
        const suffVal = getAttribute(suffEl, 'w', 'val');
        if (suffVal === 'tab' || suffVal === 'space' || suffVal === 'nothing') {
            level.suffix = suffVal;
        }
    }
    // Parse isLgl (legal numbering)
    const isLglEl = findChild(element, 'w', 'isLgl');
    if (isLglEl) {
        level.isLgl = parseBooleanElement(isLglEl);
    }
    // Parse lvlRestart (restart numbering from a higher level)
    const lvlRestartEl = findChild(element, 'w', 'lvlRestart');
    if (lvlRestartEl) {
        const restartVal = getAttribute(lvlRestartEl, 'w', 'val');
        if (restartVal !== null) {
            const restartNum = parseInt(restartVal, 10);
            if (!isNaN(restartNum)) {
                level.lvlRestart = restartNum;
            }
        }
    }
    // Parse legacy settings
    const legacyEl = findChild(element, 'w', 'legacy');
    if (legacyEl) {
        level.legacy = {
            legacy: parseBooleanElement(legacyEl),
            legacySpace: parseNumericAttribute(legacyEl, 'w', 'legacySpace'),
            legacyIndent: parseNumericAttribute(legacyEl, 'w', 'legacyIndent'),
        };
    }
    // Parse paragraph properties (w:pPr)
    const pPrEl = findChild(element, 'w', 'pPr');
    if (pPrEl) {
        level.pPr = parseLevelParagraphProps(pPrEl);
    }
    // Parse run properties (w:rPr)
    const rPrEl = findChild(element, 'w', 'rPr');
    if (rPrEl) {
        level.rPr = parseLevelRunProps(rPrEl);
    }
    return level;
}
/**
 * Parse number format string to NumberFormat type
 */
function parseNumberFormat(format) {
    var _a;
    // Map of known formats
    const formatMap = {
        decimal: 'decimal',
        upperRoman: 'upperRoman',
        lowerRoman: 'lowerRoman',
        upperLetter: 'upperLetter',
        lowerLetter: 'lowerLetter',
        ordinal: 'ordinal',
        cardinalText: 'cardinalText',
        ordinalText: 'ordinalText',
        hex: 'hex',
        chicago: 'chicago',
        bullet: 'bullet',
        none: 'none',
        decimalZero: 'decimalZero',
        ganada: 'ganada',
        chosung: 'chosung',
        // CJK formats
        ideographDigital: 'ideographDigital',
        japaneseCounting: 'japaneseCounting',
        aiueo: 'aiueo',
        iroha: 'iroha',
        decimalFullWidth: 'decimalFullWidth',
        decimalHalfWidth: 'decimalHalfWidth',
        japaneseLegal: 'japaneseLegal',
        japaneseDigitalTenThousand: 'japaneseDigitalTenThousand',
        decimalEnclosedCircle: 'decimalEnclosedCircle',
        decimalFullWidth2: 'decimalFullWidth2',
        aiueoFullWidth: 'aiueoFullWidth',
        irohaFullWidth: 'irohaFullWidth',
        decimalEnclosedFullstop: 'decimalEnclosedFullstop',
        decimalEnclosedParen: 'decimalEnclosedParen',
        decimalEnclosedCircleChinese: 'decimalEnclosedCircleChinese',
        ideographEnclosedCircle: 'ideographEnclosedCircle',
        ideographTraditional: 'ideographTraditional',
        ideographZodiac: 'ideographZodiac',
        ideographZodiacTraditional: 'ideographZodiacTraditional',
        taiwaneseCounting: 'taiwaneseCounting',
        ideographLegalTraditional: 'ideographLegalTraditional',
        taiwaneseCountingThousand: 'taiwaneseCountingThousand',
        taiwaneseDigital: 'taiwaneseDigital',
        chineseCounting: 'chineseCounting',
        chineseLegalSimplified: 'chineseLegalSimplified',
        chineseCountingThousand: 'chineseCountingThousand',
        koreanDigital: 'koreanDigital',
        koreanCounting: 'koreanCounting',
        koreanLegal: 'koreanLegal',
        koreanDigital2: 'koreanDigital2',
        vietnameseCounting: 'vietnameseCounting',
        russianLower: 'russianLower',
        russianUpper: 'russianUpper',
        numberInDash: 'numberInDash',
        hebrew1: 'hebrew1',
        hebrew2: 'hebrew2',
        arabicAlpha: 'arabicAlpha',
        arabicAbjad: 'arabicAbjad',
        hindiVowels: 'hindiVowels',
        hindiConsonants: 'hindiConsonants',
        hindiNumbers: 'hindiNumbers',
        hindiCounting: 'hindiCounting',
        thaiLetters: 'thaiLetters',
        thaiNumbers: 'thaiNumbers',
        thaiCounting: 'thaiCounting',
    };
    return (_a = formatMap[format]) !== null && _a !== void 0 ? _a : 'decimal';
}
/**
 * Parse paragraph properties for a list level (subset of full pPr)
 * Main concern: indentation and tabs
 */
function parseLevelParagraphProps(pPr) {
    const formatting = {};
    // Parse indentation (w:ind). Per ECMA-376 §17.3.1.17, w:start/w:end are the
    // bidi-aware equivalents of w:left/w:right; some writers emit only the modern
    // form and the older form is silently ignored if both are absent.
    const indEl = findChild(pPr, 'w', 'ind');
    if (indEl) {
        const left = parseNumericAttribute(indEl, 'w', 'left');
        const right = parseNumericAttribute(indEl, 'w', 'right');
        const start = parseNumericAttribute(indEl, 'w', 'start');
        const end = parseNumericAttribute(indEl, 'w', 'end');
        const firstLine = parseNumericAttribute(indEl, 'w', 'firstLine');
        const hanging = parseNumericAttribute(indEl, 'w', 'hanging');
        const resolvedLeft = left !== null && left !== void 0 ? left : start;
        const resolvedRight = right !== null && right !== void 0 ? right : end;
        if (resolvedLeft !== undefined)
            formatting.indentLeft = resolvedLeft;
        if (resolvedRight !== undefined)
            formatting.indentRight = resolvedRight;
        if (hanging !== undefined) {
            formatting.indentFirstLine = -hanging;
            formatting.hangingIndent = true;
        }
        else if (firstLine !== undefined) {
            formatting.indentFirstLine = firstLine;
        }
    }
    // Parse tabs (w:tabs)
    const tabsEl = findChild(pPr, 'w', 'tabs');
    if (tabsEl) {
        formatting.tabs = [];
        const tabElements = findChildren(tabsEl, 'w', 'tab');
        for (const tabEl of tabElements) {
            const pos = parseNumericAttribute(tabEl, 'w', 'pos');
            const val = getAttribute(tabEl, 'w', 'val');
            const leader = getAttribute(tabEl, 'w', 'leader');
            if (pos !== undefined && val) {
                formatting.tabs.push({
                    position: pos,
                    alignment: parseTabAlignment(val),
                    leader: parseTabLeader(leader),
                });
            }
        }
    }
    return formatting;
}
/**
 * Parse tab alignment value
 */
function parseTabAlignment(val) {
    switch (val) {
        case 'left':
            return 'left';
        case 'center':
            return 'center';
        case 'right':
            return 'right';
        case 'decimal':
            return 'decimal';
        case 'bar':
            return 'bar';
        case 'clear':
            return 'clear';
        case 'num':
            return 'num';
        default:
            return 'left';
    }
}
/**
 * Parse tab leader value
 */
function parseTabLeader(val) {
    if (!val)
        return undefined;
    switch (val) {
        case 'none':
            return 'none';
        case 'dot':
            return 'dot';
        case 'hyphen':
            return 'hyphen';
        case 'underscore':
            return 'underscore';
        case 'heavy':
            return 'heavy';
        case 'middleDot':
            return 'middleDot';
        default:
            return undefined;
    }
}
/**
 * Parse run properties for a list level (subset of full rPr)
 * Main concern: fonts for bullet characters
 */
function parseLevelRunProps(rPr) {
    var _a, _b, _c, _d, _e, _f;
    const formatting = {};
    // Parse fonts (w:rFonts) - important for bullet characters
    const rFontsEl = findChild(rPr, 'w', 'rFonts');
    if (rFontsEl) {
        formatting.fontFamily = {
            ascii: (_a = getAttribute(rFontsEl, 'w', 'ascii')) !== null && _a !== void 0 ? _a : undefined,
            hAnsi: (_b = getAttribute(rFontsEl, 'w', 'hAnsi')) !== null && _b !== void 0 ? _b : undefined,
            eastAsia: (_c = getAttribute(rFontsEl, 'w', 'eastAsia')) !== null && _c !== void 0 ? _c : undefined,
            cs: (_d = getAttribute(rFontsEl, 'w', 'cs')) !== null && _d !== void 0 ? _d : undefined,
        };
    }
    // Parse font size (w:sz)
    const szEl = findChild(rPr, 'w', 'sz');
    if (szEl) {
        const size = parseNumericAttribute(szEl, 'w', 'val');
        if (size !== undefined) {
            formatting.fontSize = size; // In half-points
        }
    }
    // Parse color (w:color)
    const colorEl = findChild(rPr, 'w', 'color');
    if (colorEl) {
        const val = getAttribute(colorEl, 'w', 'val');
        const themeColor = getAttribute(colorEl, 'w', 'themeColor');
        if (val === 'auto') {
            formatting.color = { auto: true };
        }
        else if (themeColor) {
            formatting.color = {
                themeColor: themeColor,
                themeTint: (_e = getAttribute(colorEl, 'w', 'themeTint')) !== null && _e !== void 0 ? _e : undefined,
                themeShade: (_f = getAttribute(colorEl, 'w', 'themeShade')) !== null && _f !== void 0 ? _f : undefined,
            };
        }
        else if (val) {
            formatting.color = { rgb: val };
        }
    }
    // Parse bold (w:b)
    const bEl = findChild(rPr, 'w', 'b');
    if (bEl) {
        formatting.bold = parseBooleanElement(bEl);
    }
    // Parse italic (w:i)
    const iEl = findChild(rPr, 'w', 'i');
    if (iEl) {
        formatting.italic = parseBooleanElement(iEl);
    }
    // Parse vanish / hidden (w:vanish) — hides the list indicator
    const vanishEl = findChild(rPr, 'w', 'vanish');
    if (vanishEl) {
        formatting.hidden = parseBooleanElement(vanishEl);
    }
    return formatting;
}
/**
 * Create a NumberingMap with helper functions
 */
function createNumberingMap(definitions) {
    // Build lookup maps for efficient access
    const abstractMap = new Map();
    for (const abs of definitions.abstractNums) {
        abstractMap.set(abs.abstractNumId, abs);
    }
    const numMap = new Map();
    for (const num of definitions.nums) {
        numMap.set(num.numId, num);
    }
    return {
        definitions,
        getLevel(numId, ilvl) {
            var _a;
            const num = numMap.get(numId);
            if (!num)
                return null;
            // Check for level override first
            if (num.levelOverrides) {
                const override = num.levelOverrides.find((o) => o.ilvl === ilvl);
                if (override) {
                    if (override.lvl) {
                        // Full level redefinition
                        return override.lvl;
                    }
                    // Start override - need to get base level and modify
                    const abstractNum = abstractMap.get(num.abstractNumId);
                    if (abstractNum) {
                        const baseLevel = abstractNum.levels.find((l) => l.ilvl === ilvl);
                        if (baseLevel && override.startOverride !== undefined) {
                            return Object.assign(Object.assign({}, baseLevel), { start: override.startOverride });
                        }
                    }
                }
            }
            // Get from abstract numbering
            let abstractNum = abstractMap.get(num.abstractNumId);
            if (!abstractNum)
                return null;
            // Follow numStyleLink: when an abstractNum has numStyleLink instead of
            // defining levels directly, find the abstractNum that owns that style
            // (has matching styleLink) and use its levels. Per ECMA-376 §17.9.21/22.
            if (abstractNum.numStyleLink && abstractNum.levels.length === 0) {
                for (const candidate of abstractMap.values()) {
                    if (candidate.styleLink === abstractNum.numStyleLink && candidate.levels.length > 0) {
                        abstractNum = candidate;
                        break;
                    }
                }
            }
            return (_a = abstractNum.levels.find((l) => l.ilvl === ilvl)) !== null && _a !== void 0 ? _a : null;
        },
        getAbstract(abstractNumId) {
            var _a;
            return (_a = abstractMap.get(abstractNumId)) !== null && _a !== void 0 ? _a : null;
        },
        getInstance(numId) {
            var _a;
            return (_a = numMap.get(numId)) !== null && _a !== void 0 ? _a : null;
        },
        hasNumbering(numId) {
            return numMap.has(numId);
        },
    };
}
/**
 * Format a number according to the specified format
 *
 * @param num - The number to format
 * @param format - The number format
 * @returns Formatted string
 */
export function formatNumber(num, format) {
    switch (format) {
        case 'decimal':
        case 'decimalZero':
            return num.toString();
        case 'upperRoman':
            return toRoman(num).toUpperCase();
        case 'lowerRoman':
            return toRoman(num).toLowerCase();
        case 'upperLetter':
            return toLetter(num).toUpperCase();
        case 'lowerLetter':
            return toLetter(num).toLowerCase();
        case 'ordinal':
            return toOrdinal(num);
        case 'bullet':
            return '•'; // Default bullet
        case 'none':
            return '';
        case 'decimalEnclosedParen':
            return `(${num})`;
        case 'numberInDash':
            return `-${num}-`;
        default:
            // For CJK and other special formats, fall back to decimal
            return num.toString();
    }
}
/**
 * Convert number to Roman numerals
 */
function toRoman(num) {
    if (num <= 0 || num > 3999)
        return num.toString();
    const romanNumerals = [
        [1000, 'm'],
        [900, 'cm'],
        [500, 'd'],
        [400, 'cd'],
        [100, 'c'],
        [90, 'xc'],
        [50, 'l'],
        [40, 'xl'],
        [10, 'x'],
        [9, 'ix'],
        [5, 'v'],
        [4, 'iv'],
        [1, 'i'],
    ];
    let result = '';
    let remaining = num;
    for (const [value, numeral] of romanNumerals) {
        while (remaining >= value) {
            result += numeral;
            remaining -= value;
        }
    }
    return result;
}
/**
 * Convert number to letter (a, b, c, ... z, aa, ab, ...)
 */
function toLetter(num) {
    if (num <= 0)
        return '';
    let result = '';
    let remaining = num;
    while (remaining > 0) {
        remaining--;
        result = String.fromCharCode(97 + (remaining % 26)) + result;
        remaining = Math.floor(remaining / 26);
    }
    return result;
}
/**
 * Convert number to ordinal (1st, 2nd, 3rd, ...)
 */
function toOrdinal(num) {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
/**
 * Render list marker text by replacing placeholders with formatted numbers
 *
 * @param lvlText - The level text pattern (e.g., "%1.", "%1.%2")
 * @param counters - Array of counter values for each level (index 0 = level 0, etc.)
 * @param formats - Array of number formats for each level
 * @returns Rendered marker text
 */
export function renderListMarker(lvlText, counters, formats) {
    var _a, _b;
    let result = lvlText;
    // Replace %1 through %9 with formatted counter values
    for (let i = 1; i <= 9; i++) {
        const placeholder = `%${i}`;
        if (result.includes(placeholder)) {
            const counterIndex = i - 1;
            const counter = (_a = counters[counterIndex]) !== null && _a !== void 0 ? _a : 1;
            const format = (_b = formats[counterIndex]) !== null && _b !== void 0 ? _b : 'decimal';
            const formatted = formatNumber(counter, format);
            result = result.replace(placeholder, formatted);
        }
    }
    return result;
}
/**
 * Get the bullet character for a bullet list level
 *
 * @param level - The list level definition
 * @returns The bullet character to display
 */
export function getBulletCharacter(level) {
    var _a, _b, _c, _d;
    // If lvlText is set and not empty, use it
    if (level.lvlText) {
        return level.lvlText;
    }
    // Check font for common bullet font mappings
    const fontFamily = ((_b = (_a = level.rPr) === null || _a === void 0 ? void 0 : _a.fontFamily) === null || _b === void 0 ? void 0 : _b.ascii) || ((_d = (_c = level.rPr) === null || _c === void 0 ? void 0 : _c.fontFamily) === null || _d === void 0 ? void 0 : _d.hAnsi);
    if (fontFamily) {
        const fontLower = fontFamily.toLowerCase();
        // Symbol font common bullets
        if (fontLower === 'symbol') {
            return '•'; // Standard bullet
        }
        // Wingdings common bullets
        if (fontLower.includes('wingding')) {
            return '❑'; // Square bullet
        }
    }
    // Default bullet
    return '•';
}
/**
 * Check if a list level is a bullet (not numbered)
 */
export function isBulletLevel(level) {
    return level.numFmt === 'bullet' || level.numFmt === 'none';
}
//# sourceMappingURL=numberingParser.js.map