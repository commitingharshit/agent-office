/**
 * Variable Detector Utility
 *
 * Scans a DOCX document for template variables in the format {variable_name}
 * (standard docxtemplater syntax).
 * Returns a unique, sorted list of variable names found in the document.
 */
// ============================================================================
// MAIN FUNCTIONS
// ============================================================================
/**
 * Detect all template variables in a document
 *
 * @param doc - The parsed document
 * @returns Array of unique variable names sorted alphabetically
 */
export function detectVariables(doc) {
    const result = detectVariablesDetailed(doc);
    return result.variables;
}
/**
 * Detect variables with detailed information
 *
 * @param doc - The parsed document
 * @returns Detailed detection result
 */
export function detectVariablesDetailed(doc) {
    var _a, _b, _c, _d, _e;
    const occurrences = [];
    const byLocation = {
        body: [],
        headers: [],
        footers: [],
        footnotes: [],
        endnotes: [],
        textBoxes: [],
    };
    // Scan main body
    if ((_a = doc.package) === null || _a === void 0 ? void 0 : _a.document) {
        const bodyVars = detectVariablesInBody(doc.package.document);
        bodyVars.forEach((v) => {
            occurrences.push({ name: v, location: 'body' });
        });
        byLocation.body = Array.from(new Set(bodyVars)).sort();
    }
    // Scan headers and footers
    if ((_c = (_b = doc.package) === null || _b === void 0 ? void 0 : _b.document) === null || _c === void 0 ? void 0 : _c.sections) {
        doc.package.document.sections.forEach((section, _sectionIndex) => {
            // Headers
            if (section.properties.headerReferences) {
                section.properties.headerReferences.forEach((_headerRef) => {
                    // If we have actual header content, scan it
                    // Note: Headers are stored separately in the package
                });
            }
        });
    }
    // Scan footers from package
    // (Actual footer content would be accessed from pkg.headers/pkg.footers if available)
    // Scan footnotes
    if ((_d = doc.package) === null || _d === void 0 ? void 0 : _d.footnotes) {
        const footnoteVars = detectVariablesInNotes(doc.package.footnotes);
        footnoteVars.forEach((v) => {
            occurrences.push({ name: v, location: 'footnote' });
        });
        byLocation.footnotes = Array.from(new Set(footnoteVars)).sort();
    }
    // Scan endnotes
    if ((_e = doc.package) === null || _e === void 0 ? void 0 : _e.endnotes) {
        const endnoteVars = detectVariablesInNotes(doc.package.endnotes);
        endnoteVars.forEach((v) => {
            occurrences.push({ name: v, location: 'endnote' });
        });
        byLocation.endnotes = Array.from(new Set(endnoteVars)).sort();
    }
    // Also check templateVariables from document if already detected
    if (doc.templateVariables) {
        doc.templateVariables.forEach((v) => {
            if (!occurrences.some((o) => o.name === v)) {
                occurrences.push({ name: v, location: 'body' });
            }
        });
    }
    // Collect all unique variables
    const allVariables = new Set();
    occurrences.forEach((o) => allVariables.add(o.name));
    return {
        variables: Array.from(allVariables).sort(),
        totalOccurrences: occurrences.length,
        byLocation,
        occurrences,
    };
}
/**
 * Detect variables in document body
 */
export function detectVariablesInBody(body) {
    const variables = [];
    // Scan content array
    if (body.content) {
        variables.push(...detectVariablesInBlockContent(body.content));
    }
    // Scan sections
    if (body.sections) {
        for (const section of body.sections) {
            if (section.content) {
                variables.push(...detectVariablesInBlockContent(section.content));
            }
        }
    }
    return variables;
}
/**
 * Detect variables in block content (paragraphs and tables)
 */
export function detectVariablesInBlockContent(content) {
    const variables = [];
    for (const block of content) {
        if (block.type === 'paragraph') {
            variables.push(...detectVariablesInParagraph(block));
        }
        else if (block.type === 'table') {
            variables.push(...detectVariablesInTable(block));
        }
    }
    return variables;
}
/**
 * Detect variables in a paragraph
 */
export function detectVariablesInParagraph(paragraph) {
    const variables = [];
    if (!paragraph.content)
        return variables;
    for (const item of paragraph.content) {
        if (item.type === 'run') {
            variables.push(...detectVariablesInRun(item));
        }
        else if (item.type === 'hyperlink') {
            variables.push(...detectVariablesInHyperlink(item));
        }
        else if (item.type === 'simpleField') {
            variables.push(...detectVariablesInSimpleField(item));
        }
        else if (item.type === 'complexField') {
            variables.push(...detectVariablesInComplexField(item));
        }
    }
    return variables;
}
/**
 * Detect variables in a text run
 */
export function detectVariablesInRun(run) {
    const variables = [];
    if (!run.content)
        return variables;
    for (const item of run.content) {
        if (item.type === 'text' && item.text) {
            variables.push(...extractVariablesFromText(item.text));
        }
    }
    return variables;
}
/**
 * Detect variables in a hyperlink
 */
export function detectVariablesInHyperlink(hyperlink) {
    const variables = [];
    if (!hyperlink.children)
        return variables;
    for (const child of hyperlink.children) {
        if (child.type === 'run') {
            variables.push(...detectVariablesInRun(child));
        }
    }
    return variables;
}
/**
 * Detect variables in a simple field
 */
export function detectVariablesInSimpleField(field) {
    const variables = [];
    // Check field instruction
    if (field.instruction) {
        variables.push(...extractVariablesFromText(field.instruction));
    }
    // Check field content runs
    if (field.content) {
        for (const run of field.content) {
            if (run.type === 'run') {
                variables.push(...detectVariablesInRun(run));
            }
        }
    }
    return variables;
}
/**
 * Detect variables in a complex field
 */
export function detectVariablesInComplexField(field) {
    const variables = [];
    // Check field code runs
    if (field.fieldCode) {
        for (const run of field.fieldCode) {
            if (run.type === 'run') {
                variables.push(...detectVariablesInRun(run));
            }
        }
    }
    // Check field result runs
    if (field.fieldResult) {
        for (const run of field.fieldResult) {
            if (run.type === 'run') {
                variables.push(...detectVariablesInRun(run));
            }
        }
    }
    return variables;
}
/**
 * Detect variables in a table
 */
export function detectVariablesInTable(table) {
    const variables = [];
    if (!table.rows)
        return variables;
    for (const row of table.rows) {
        if (!row.cells)
            continue;
        for (const cell of row.cells) {
            variables.push(...detectVariablesInCell(cell));
        }
    }
    return variables;
}
/**
 * Detect variables in a table cell
 */
export function detectVariablesInCell(cell) {
    const variables = [];
    if (!cell.content)
        return variables;
    for (const block of cell.content) {
        if (block.type === 'paragraph') {
            variables.push(...detectVariablesInParagraph(block));
        }
        else if (block.type === 'table') {
            // Nested tables
            variables.push(...detectVariablesInTable(block));
        }
    }
    return variables;
}
/**
 * Detect variables in footnotes/endnotes
 */
export function detectVariablesInNotes(notes) {
    const variables = [];
    for (const note of notes) {
        if (!note.content)
            continue;
        for (const block of note.content) {
            // Footnote/endnote content can now hold tables too; the variable
            // detector currently only walks paragraph runs (mustache template
            // strings live inside text runs). Skip non-paragraph blocks until
            // a separate pass is added for tables.
            if (block.type !== 'paragraph')
                continue;
            variables.push(...detectVariablesInParagraph(block));
        }
    }
    return variables;
}
/**
 * Detect variables in headers/footers
 */
export function detectVariablesInHeaderFooter(hf) {
    const variables = [];
    if (!hf.content)
        return variables;
    for (const block of hf.content) {
        if (block.type === 'paragraph') {
            variables.push(...detectVariablesInParagraph(block));
        }
        else if (block.type === 'table') {
            variables.push(...detectVariablesInTable(block));
        }
    }
    return variables;
}
/**
 * Detect variables in a text box
 */
export function detectVariablesInTextBox(textBox) {
    const variables = [];
    if (!textBox.content)
        return variables;
    // TextBox.content is Paragraph[]
    for (const paragraph of textBox.content) {
        variables.push(...detectVariablesInParagraph(paragraph));
    }
    return variables;
}
// ============================================================================
// TEXT EXTRACTION
// ============================================================================
/**
 * Regular expression for matching template variables
 * Matches {variable_name} (standard docxtemplater syntax) where variable_name can contain:
 * - Letters (a-z, A-Z)
 * - Numbers (0-9)
 * - Underscores (_)
 * - Hyphens (-)
 * - Dots (.)
 */
const VARIABLE_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_\-\.]*)\}/g;
/**
 * Alternative pattern allowing any content between braces
 */
const VARIABLE_PATTERN_RELAXED = /\{(.+?)\}/g;
/**
 * Extract variable names from text
 *
 * @param text - The text to search
 * @returns Array of variable names (without braces)
 */
export function extractVariablesFromText(text) {
    if (!text)
        return [];
    const variables = [];
    const pattern = new RegExp(VARIABLE_PATTERN);
    let match;
    while ((match = pattern.exec(text)) !== null) {
        variables.push(match[1]);
    }
    return variables;
}
/**
 * Extract all variables from text (relaxed matching)
 * Allows any content between { and }
 */
export function extractVariablesFromTextRelaxed(text) {
    if (!text)
        return [];
    const variables = [];
    const pattern = new RegExp(VARIABLE_PATTERN_RELAXED);
    let match;
    while ((match = pattern.exec(text)) !== null) {
        const varName = match[1].trim();
        if (varName) {
            variables.push(varName);
        }
    }
    return variables;
}
/**
 * Check if text contains template variables
 */
export function hasTemplateVariables(text) {
    return VARIABLE_PATTERN.test(text);
}
/**
 * Count template variables in text
 */
export function countVariables(text) {
    const matches = text.match(VARIABLE_PATTERN);
    return matches ? matches.length : 0;
}
/**
 * Get unique variable names from text
 */
export function getUniqueVariables(text) {
    const variables = extractVariablesFromText(text);
    return Array.from(new Set(variables)).sort();
}
// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Check if a variable name is valid
 */
export function isValidVariableName(name) {
    if (!name || typeof name !== 'string')
        return false;
    if (name.length === 0 || name.length > 100)
        return false;
    // Must start with letter or underscore
    if (!/^[a-zA-Z_]/.test(name))
        return false;
    // Can contain letters, numbers, underscores, hyphens, dots
    if (!/^[a-zA-Z_][a-zA-Z0-9_\-\.]*$/.test(name))
        return false;
    return true;
}
/**
 * Sanitize a variable name
 */
export function sanitizeVariableName(name) {
    if (!name)
        return '';
    // Replace spaces with underscores
    let sanitized = name.replace(/\s+/g, '_');
    // Remove invalid characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    // Ensure starts with letter or underscore
    if (sanitized && !/^[a-zA-Z_]/.test(sanitized)) {
        sanitized = '_' + sanitized;
    }
    // Limit length
    return sanitized.substring(0, 100);
}
/**
 * Format a variable name with braces (standard docxtemplater syntax)
 */
export function formatVariable(name) {
    return `{${name}}`;
}
/**
 * Parse a variable string to get the name
 */
export function parseVariable(variable) {
    const match = variable.match(/^\{(.+?)\}$/);
    return match ? match[1] : null;
}
// ============================================================================
// REPLACEMENT
// ============================================================================
/**
 * Replace variables in text with values
 *
 * @param text - The text containing variables
 * @param values - Map of variable name to replacement value
 * @returns Text with variables replaced
 */
export function replaceVariables(text, values) {
    if (!text)
        return text;
    return text.replace(VARIABLE_PATTERN_RELAXED, (match, varName) => {
        const name = varName.trim();
        if (name in values) {
            return values[name];
        }
        return match; // Keep original if not in values
    });
}
/**
 * Replace all variables in text with a placeholder
 *
 * @param text - The text containing variables
 * @param placeholder - Placeholder to use (default: empty string)
 * @returns Text with variables replaced
 */
export function removeVariables(text, placeholder = '') {
    if (!text)
        return text;
    return text.replace(VARIABLE_PATTERN_RELAXED, placeholder);
}
/**
 * Highlight variables in text for display
 *
 * @param text - The text containing variables
 * @param wrapper - Function to wrap variable text
 * @returns Array of text segments
 */
export function highlightVariables(text, wrapper = (v) => `[${v}]`) {
    if (!text)
        return text;
    return text.replace(VARIABLE_PATTERN_RELAXED, (_match, varName) => {
        return wrapper(varName.trim());
    });
}
// ============================================================================
// DOCUMENT-LEVEL HELPERS
// ============================================================================
/**
 * Get total variable count in document (including duplicates)
 */
export function getVariableCount(doc) {
    const result = detectVariablesDetailed(doc);
    return result.totalOccurrences;
}
/**
 * Get unique variable count in document
 */
export function getUniqueVariableCount(doc) {
    return detectVariables(doc).length;
}
/**
 * Check if document has any template variables
 */
export function documentHasVariables(doc) {
    return detectVariables(doc).length > 0;
}
/**
 * Get variables grouped by first letter for large lists
 */
export function groupVariablesByLetter(variables) {
    const groups = {};
    for (const variable of variables) {
        const letter = variable.charAt(0).toUpperCase();
        if (!groups[letter]) {
            groups[letter] = [];
        }
        groups[letter].push(variable);
    }
    return groups;
}
export default detectVariables;
//# sourceMappingURL=variableDetector.js.map