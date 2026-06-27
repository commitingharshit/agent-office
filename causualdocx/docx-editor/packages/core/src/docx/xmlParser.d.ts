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
import { type Element as XmlElement } from 'xml-js';
export type { Element as XmlElement } from 'xml-js';
/**
 * Common OOXML namespace URIs
 */
export declare const NAMESPACES: {
    readonly w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    readonly a: "http://schemas.openxmlformats.org/drawingml/2006/main";
    readonly r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    readonly wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
    readonly wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing";
    readonly wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape";
    readonly wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas";
    readonly wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup";
    readonly pic: "http://schemas.openxmlformats.org/drawingml/2006/picture";
    readonly m: "http://schemas.openxmlformats.org/officeDocument/2006/math";
    readonly mc: "http://schemas.openxmlformats.org/markup-compatibility/2006";
    readonly v: "urn:schemas-microsoft-com:vml";
    readonly o: "urn:schemas-microsoft-com:office:office";
    readonly w14: "http://schemas.microsoft.com/office/word/2010/wordml";
    readonly w15: "http://schemas.microsoft.com/office/word/2012/wordml";
    readonly ct: "http://schemas.openxmlformats.org/package/2006/content-types";
    readonly pr: "http://schemas.openxmlformats.org/package/2006/relationships";
};
/**
 * Parse XML string into element tree
 *
 * @param xml - XML string to parse
 * @returns Parsed element tree
 */
export declare function parseXml(xml: string): XmlElement;
/**
 * Serialize an XmlElement back to an XML string
 */
export declare function elementToXml(element: XmlElement): string;
/**
 * Parse XML string to a more convenient format
 */
export declare function parseXmlDocument(xml: string): XmlElement | null;
/**
 * Get local name from a prefixed element name
 * e.g., "w:p" -> "p", "a:graphic" -> "graphic"
 */
export declare function getLocalName(name: string): string;
/**
 * Get namespace prefix from an element name
 * e.g., "w:p" -> "w", "a:graphic" -> "a"
 */
export declare function getNamespacePrefix(name: string): string | null;
/**
 * Check if an element matches a given namespaced name
 *
 * @param element - Element to check
 * @param namespace - Namespace prefix (e.g., "w", "a")
 * @param localName - Local element name (e.g., "p", "r")
 */
export declare function matchesName(element: XmlElement, namespace: string, localName: string): boolean;
/**
 * Find first child element matching the given namespaced name
 *
 * @param parent - Parent element
 * @param namespace - Namespace prefix (e.g., "w")
 * @param localName - Local element name (e.g., "p")
 * @returns First matching child or null
 */
export declare function findChild(parent: XmlElement | null | undefined, namespace: string, localName: string): XmlElement | null;
/**
 * Find all child elements matching the given namespaced name
 *
 * @param parent - Parent element
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns Array of matching children
 */
export declare function findChildren(parent: XmlElement | null | undefined, namespace: string, localName: string): XmlElement[];
/**
 * Find first child element by local name only (ignoring namespace)
 *
 * @param parent - Parent element
 * @param localName - Local element name
 * @returns First matching child or null
 */
export declare function findChildByLocalName(parent: XmlElement | null | undefined, localName: string): XmlElement | null;
/**
 * Find all child elements by local name only
 *
 * @param parent - Parent element
 * @param localName - Local element name
 * @returns Array of matching children
 */
export declare function findChildrenByLocalName(parent: XmlElement | null | undefined, localName: string): XmlElement[];
/**
 * Find first child element by full name (including namespace prefix)
 *
 * @param parent - Parent element
 * @param fullName - Full element name with namespace prefix (e.g., 'wp:extent')
 * @returns First matching child or null
 */
export declare function findByFullName(parent: XmlElement | null | undefined, fullName: string): XmlElement | null;
/**
 * Get all child elements (excludes text nodes, etc.)
 *
 * @param parent - Parent element
 * @returns Array of child elements
 */
export declare function getChildElements(parent: XmlElement | null | undefined): XmlElement[];
/**
 * Get an attribute value from an element
 *
 * @param element - Element to get attribute from
 * @param namespace - Namespace prefix for the attribute (or null for no namespace)
 * @param name - Attribute name
 * @returns Attribute value or null if not found
 */
export declare function getAttribute(element: XmlElement | null | undefined, namespace: string | null, name: string): string | null;
/**
 * Get an attribute value, trying multiple possible names
 *
 * @param element - Element to get attribute from
 * @param names - Array of possible attribute names (with or without namespace)
 * @returns First found attribute value or null
 */
export declare function getAttributeAny(element: XmlElement | null | undefined, names: string[]): string | null;
/**
 * Get all attributes from an element
 *
 * @param element - Element to get attributes from
 * @returns Record of attribute name -> value
 */
export declare function getAttributes(element: XmlElement | null | undefined): Record<string, string>;
/**
 * Get the text content of an element (concatenates all text nodes)
 *
 * @param element - Element to get text from
 * @returns Text content or empty string
 */
export declare function getTextContent(element: XmlElement | null | undefined): string;
/**
 * Check if an element has a specific attribute with value "true" or "1"
 *
 * @param element - Element to check
 * @param namespace - Attribute namespace
 * @param name - Attribute name
 * @returns true if attribute exists and is truthy
 */
export declare function hasFlag(element: XmlElement | null | undefined, namespace: string | null, name: string): boolean;
/**
 * Check if a child element exists (used for boolean flags in OOXML)
 *
 * @param parent - Parent element
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns true if child element exists
 */
export declare function hasChild(parent: XmlElement | null | undefined, namespace: string, localName: string): boolean;
/**
 * Parse an OOXML color value
 *
 * @param element - Color element (e.g., w:color)
 * @returns Object with val, themeColor, themeTint, themeShade
 */
export declare function parseColorElement(element: XmlElement | null | undefined): {
    val?: string;
    themeColor?: string;
    themeTint?: string;
    themeShade?: string;
} | null;
/**
 * Parse a numeric value from an attribute, with optional scale
 *
 * @param element - Element containing the attribute
 * @param namespace - Attribute namespace
 * @param name - Attribute name
 * @param scale - Optional scale factor (e.g., 20 for twips to points)
 * @returns Parsed number or undefined
 */
export declare function parseNumericAttribute(element: XmlElement | null | undefined, namespace: string | null, name: string, scale?: number): number | undefined;
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
export declare function parseBooleanElement(element: XmlElement | null | undefined, namespace?: string): boolean;
/**
 * Deep find - search recursively for an element
 *
 * @param root - Root element to search from
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns First matching element found or null
 */
export declare function findDeep(root: XmlElement | null | undefined, namespace: string, localName: string): XmlElement | null;
/**
 * Find all elements matching name, searching recursively
 *
 * @param root - Root element to search from
 * @param namespace - Namespace prefix
 * @param localName - Local element name
 * @returns Array of all matching elements
 */
export declare function findAllDeep(root: XmlElement | null | undefined, namespace: string, localName: string): XmlElement[];
//# sourceMappingURL=xmlParser.d.ts.map