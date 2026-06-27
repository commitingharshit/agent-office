/**
 * XML Parser Utilities for OOXML
 *
 * Provides helper functions for parsing Office Open XML (OOXML) content
 * with proper namespace handling.
 *
 * OOXML uses many namespaces:
 * - w:  WordprocessingML (main document content)
 * - a:  DrawingML (graphics)
 * - r:  Relationships
 * - wp: Word Drawing positioning
 * - wps: Word Drawing shapes
 * - wpc: Word Drawing canvas
 * - wpg: Word Drawing group
 * - m:  Math
 * - mc: Markup Compatibility
 * - v:  VML (legacy vector graphics)
 * - o:  Office (extensions)
 * - pic: Pictures
 */
import { xml2js, js2xml } from 'xml-js';
/**
 * Common OOXML namespace URIs
 */
export const NAMESPACES = {
    // Main namespaces
    w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
    r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    // Drawing namespaces
    wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    wp14: 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing',
    wps: 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
    wpc: 'http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas',
    wpg: 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup',
    // Picture namespace
    pic: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    // Math namespace
    m: 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    // Markup Compatibility
    mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    // Legacy VML
    v: 'urn:schemas-microsoft-com:vml',
    o: 'urn:schemas-microsoft-com:office:office',
    // Other
    w14: 'http://schemas.microsoft.com/office/word/2010/wordml',
    w15: 'http://schemas.microsoft.com/office/word/2012/wordml',
    // Content Types
    ct: 'http://schemas.openxmlformats.org/package/2006/content-types',
    // Relationships
    pr: 'http://schemas.openxmlformats.org/package/2006/relationships',
};
/**
 * Parse XML string into element tree
 *
 * @param xml - XML string to parse
 * @returns Parsed element tree
 */
export function parseXml(xml) {
    const result = xml2js(xml, {
        compact: false,
        ignoreComment: true,
        ignoreInstruction: true,
        ignoreDoctype: true,
        alwaysArray: false,
        // IMPORTANT: Do NOT trim whitespace - it strips significant spaces
        // around hyperlinks and other inline elements. DOCX uses xml:space="preserve"
        // to indicate significant whitespace, but we need to preserve all text as-is.
        trim: false,
        // IMPORTANT: Without this, xml-js silently drops whitespace-only text nodes
        // (e.g. <w:t xml:space="preserve"> </w:t> loses the space).
        captureSpacesBetweenElements: true,
        attributesKey: 'attributes',
        textKey: 'text',
    });
    return result;
}
/**
 * Serialize an XmlElement back to an XML string
 */
export function elementToXml(element) {
    return js2xml({ elements: [element] }, { compact: false, spaces: 0 });
}
/**
 * Parse XML string to a more convenient format
 */
export function parseXmlDocument(xml) {
    var _a;
    try {
        const parsed = parseXml(xml);
        // The root is typically the declaration + elements array
        if (parsed.elements && parsed.elements.length > 0) {
            // Return the first real element (skip declarations)
            return (_a = parsed.elements.find((e) => e.type === 'element')) !== null && _a !== void 0 ? _a : null;
        }
        return parsed;
    }
    catch (error) {
        console.warn('Failed to parse XML:', error);
        return null;
    }
}
/**
 * Get local name from a prefixed element name
 * e.g., "w:p" -> "p", "a:graphic" -> "graphic"
 */
export function getLocalName(name) {
    const colonIndex = name.indexOf(':');
    return colonIndex >= 0 ? name.substring(colonIndex + 1) : name;
}
/**
 * Get namespace prefix from an element name
 * e.g., "w:p" -> "w", "a:graphic" -> "a"
 */
export function getNamespacePrefix(name) {
    const colonIndex = name.indexOf(':');
    return colonIndex >= 0 ? name.substring(0, colonIndex) : null;
}
/**
 * Check if an element matches a given namespaced name
 *
 * @param element - Element to check
 * @param namespace - Namespace prefix (e.g., "w", "a")
 * @param localName - Local element name (e.g., "p", "r")
 */
export function matchesName(element, namespace, localName) {
    if (!element.name)
        return false;
    const fullName = `${namespace}:${localName}`;
    if (element.name === fullName)
        return true;
    // Also check just the local name if no namespace prefix in element
    if (getLocalName(element.name) === localName)
        return true;
    return false;
}
/**
 * Find first child element matching the given namespaced name
 *
 * @param parent - Parent element
 * @param namespace - Namespace prefix (e.g., "w")
 * @param localName - Local element name (e.g., "p")
 * @returns First matching child or null
 */
export function findChild(parent, namespace, localName) {
    if (!parent || !parent.elements)
        return null;
    const fullName = `${namespace}:${localName}`;
    for (const child of parent.elements) {
        if (child.type !== 'element')
            continue;
        if (child.name === fullName) {
            return child;
        }
        // Check local name match
        if (getLocalName(child.name || '') === localName) {
            return child;
        }
    }
    return null;
}
/**
 * Find all child elements matching the given namespaced name
 *
 * @param parent - Parent element
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns Array of matching children
 */
export function findChildren(parent, namespace, localName) {
    if (!parent || !parent.elements)
        return [];
    const fullName = `${namespace}:${localName}`;
    const results = [];
    for (const child of parent.elements) {
        if (child.type !== 'element')
            continue;
        if (child.name === fullName || getLocalName(child.name || '') === localName) {
            results.push(child);
        }
    }
    return results;
}
/**
 * Find first child element by local name only (ignoring namespace)
 *
 * @param parent - Parent element
 * @param localName - Local element name
 * @returns First matching child or null
 */
export function findChildByLocalName(parent, localName) {
    if (!parent || !parent.elements)
        return null;
    for (const child of parent.elements) {
        if (child.type !== 'element')
            continue;
        if (getLocalName(child.name || '') === localName) {
            return child;
        }
    }
    return null;
}
/**
 * Find all child elements by local name only
 *
 * @param parent - Parent element
 * @param localName - Local element name
 * @returns Array of matching children
 */
export function findChildrenByLocalName(parent, localName) {
    if (!parent || !parent.elements)
        return [];
    return parent.elements.filter((child) => child.type === 'element' && getLocalName(child.name || '') === localName);
}
/**
 * Find first child element by full name (including namespace prefix)
 *
 * @param parent - Parent element
 * @param fullName - Full element name with namespace prefix (e.g., 'wp:extent')
 * @returns First matching child or null
 */
export function findByFullName(parent, fullName) {
    if (!parent || !parent.elements)
        return null;
    for (const child of parent.elements) {
        if (child.type !== 'element')
            continue;
        if (child.name === fullName)
            return child;
    }
    return null;
}
/**
 * Get all child elements (excludes text nodes, etc.)
 *
 * @param parent - Parent element
 * @returns Array of child elements
 */
export function getChildElements(parent) {
    if (!parent || !parent.elements)
        return [];
    return parent.elements.filter((child) => child.type === 'element');
}
/**
 * Get an attribute value from an element
 *
 * @param element - Element to get attribute from
 * @param namespace - Namespace prefix for the attribute (or null for no namespace)
 * @param name - Attribute name
 * @returns Attribute value or null if not found
 */
export function getAttribute(element, namespace, name) {
    if (!element || !element.attributes)
        return null;
    const attrs = element.attributes;
    // Try with namespace prefix first
    if (namespace) {
        const prefixedName = `${namespace}:${name}`;
        if (prefixedName in attrs) {
            return attrs[prefixedName];
        }
    }
    // Try without namespace
    if (name in attrs) {
        return attrs[name];
    }
    return null;
}
/**
 * Get an attribute value, trying multiple possible names
 *
 * @param element - Element to get attribute from
 * @param names - Array of possible attribute names (with or without namespace)
 * @returns First found attribute value or null
 */
export function getAttributeAny(element, names) {
    if (!element || !element.attributes)
        return null;
    const attrs = element.attributes;
    for (const name of names) {
        if (name in attrs) {
            return attrs[name];
        }
    }
    return null;
}
/**
 * Get all attributes from an element
 *
 * @param element - Element to get attributes from
 * @returns Record of attribute name -> value
 */
export function getAttributes(element) {
    if (!element || !element.attributes)
        return {};
    return element.attributes;
}
/**
 * Get the text content of an element (concatenates all text nodes)
 *
 * @param element - Element to get text from
 * @returns Text content or empty string
 */
export function getTextContent(element) {
    var _a;
    if (!element)
        return '';
    // Check for direct text property
    if ('text' in element && typeof element.text === 'string') {
        return element.text;
    }
    // Check elements array for text nodes
    if (!element.elements)
        return '';
    let text = '';
    for (const child of element.elements) {
        if (child.type === 'text' && 'text' in child) {
            text += (_a = child.text) !== null && _a !== void 0 ? _a : '';
        }
        else if (child.type === 'element') {
            // Recurse into child elements
            text += getTextContent(child);
        }
    }
    return text;
}
/**
 * Check if an element has a specific attribute with value "true" or "1"
 *
 * @param element - Element to check
 * @param namespace - Attribute namespace
 * @param name - Attribute name
 * @returns true if attribute exists and is truthy
 */
export function hasFlag(element, namespace, name) {
    const value = getAttribute(element, namespace, name);
    // In OOXML, presence of element often means true, absence means false
    // If value is null, check if the element itself exists
    if (value === null) {
        return false;
    }
    // Explicitly false
    if (value === '0' || value === 'false' || value === 'off') {
        return false;
    }
    // Any other value (including "1", "true", "on", or empty string) means true
    return true;
}
/**
 * Check if a child element exists (used for boolean flags in OOXML)
 *
 * @param parent - Parent element
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns true if child element exists
 */
export function hasChild(parent, namespace, localName) {
    return findChild(parent, namespace, localName) !== null;
}
/**
 * Parse an OOXML color value
 *
 * @param element - Color element (e.g., w:color)
 * @returns Object with val, themeColor, themeTint, themeShade
 */
export function parseColorElement(element) {
    var _a, _b, _c, _d;
    if (!element)
        return null;
    return {
        val: (_a = getAttribute(element, 'w', 'val')) !== null && _a !== void 0 ? _a : undefined,
        themeColor: (_b = getAttribute(element, 'w', 'themeColor')) !== null && _b !== void 0 ? _b : undefined,
        themeTint: (_c = getAttribute(element, 'w', 'themeTint')) !== null && _c !== void 0 ? _c : undefined,
        themeShade: (_d = getAttribute(element, 'w', 'themeShade')) !== null && _d !== void 0 ? _d : undefined,
    };
}
/**
 * Parse a numeric value from an attribute, with optional scale
 *
 * @param element - Element containing the attribute
 * @param namespace - Attribute namespace
 * @param name - Attribute name
 * @param scale - Optional scale factor (e.g., 20 for twips to points)
 * @returns Parsed number or undefined
 */
export function parseNumericAttribute(element, namespace, name, scale = 1) {
    const value = getAttribute(element, namespace, name);
    if (value === null)
        return undefined;
    const num = parseInt(value, 10);
    if (isNaN(num))
        return undefined;
    return num * scale;
}
/**
 * Parse a boolean value from an attribute or element presence
 *
 * OOXML boolean conventions:
 * - Element presence with no val attribute = true
 * - w:val="true" or w:val="1" = true
 * - w:val="false" or w:val="0" = false
 *
 * @param element - Element to check
 * @param namespace - Namespace for val attribute
 * @returns boolean value
 */
export function parseBooleanElement(element, namespace = 'w') {
    if (!element)
        return false;
    const val = getAttribute(element, namespace, 'val');
    // No val attribute = true (element presence implies true)
    if (val === null)
        return true;
    // Explicit false values
    if (val === '0' || val === 'false' || val === 'off') {
        return false;
    }
    return true;
}
/**
 * Deep find - search recursively for an element
 *
 * @param root - Root element to search from
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns First matching element found or null
 */
export function findDeep(root, namespace, localName) {
    if (!root)
        return null;
    // Check if this element matches
    if (matchesName(root, namespace, localName)) {
        return root;
    }
    // Search children
    if (root.elements) {
        for (const child of root.elements) {
            if (child.type !== 'element')
                continue;
            const found = findDeep(child, namespace, localName);
            if (found)
                return found;
        }
    }
    return null;
}
/**
 * Find all elements matching name, searching recursively
 *
 * @param root - Root element to search from
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns Array of all matching elements
 */
export function findAllDeep(root, namespace, localName) {
    const results = [];
    function search(element) {
        if (!element)
            return;
        if (matchesName(element, namespace, localName)) {
            results.push(element);
        }
        if (element.elements) {
            for (const child of element.elements) {
                if (child.type === 'element') {
                    search(child);
                }
            }
        }
    }
    search(root);
    return results;
}
//# sourceMappingURL=xmlParser.js.map