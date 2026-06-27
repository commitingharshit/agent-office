/**
 * Shape Parser - Parse shapes and drawings from wps:wsp elements
 *
 * DOCX shapes are contained in drawings with wps:wsp (Word Processing Shape) elements.
 * Shapes can be standalone or inside groups (wpg:wgp).
 *
 * OOXML Structure:
 * w:drawing
 *   └── wp:inline or wp:anchor
 *       └── a:graphic
 *           └── a:graphicData
 *               └── wps:wsp (shape)
 *                   ├── wps:cNvSpPr (non-visual properties)
 *                   ├── wps:spPr (shape properties)
 *                   │   ├── a:xfrm (transform: position, size, rotation)
 *                   │   ├── a:prstGeom (preset geometry/shape type)
 *                   │   ├── a:solidFill / a:noFill / a:gradFill (fill)
 *                   │   └── a:ln (line/outline properties)
 *                   ├── wps:style (style reference)
 *                   ├── wps:txbx (text box container)
 *                   │   └── w:txbxContent (text content)
 *                   └── wps:bodyPr (body/text properties)
 *
 * EMU (English Metric Units): 914400 EMU = 1 inch
 */
import { getChildElements, getAttribute, parseNumericAttribute, findByFullName, findChildrenByLocalName, } from './xmlParser';
import { parseColorElement, parseFill as parseSpPrFill, parseAnchorPosition, parseAnchorWrap, resolveColorValueToHex, } from './drawingUtils';
import { emuToPixels } from '../utils/units';
// Re-export emuToPixels for backwards compatibility
export { emuToPixels } from '../utils/units';
/**
 * Convert rotation value (1/60000 of a degree) to degrees
 */
function rotToDegrees(rot) {
    if (!rot)
        return undefined;
    const val = parseInt(rot, 10);
    if (isNaN(val))
        return undefined;
    return val / 60000;
}
// ============================================================================
// FILL PARSING
// ============================================================================
/**
 * Parse shape fill from spPr element, with style reference fallback.
 *
 * Extends the shared parseFill (which handles spPr-level fills) with
 * style reference lookup (a:fillRef) when no fill is found on spPr directly,
 * plus gradient stop details, pattern fills, and picture fills.
 */
function parseFill(spPr, style) {
    // First try the shared fill parser for spPr-level fills
    const spPrResult = parseSpPrFill(spPr);
    if (spPrResult) {
        // The shared parser returns a simple { type: 'gradient' } without stops,
        // so re-parse gradients locally for full fidelity
        if (spPrResult.type === 'gradient' && spPr) {
            const children = getChildElements(spPr);
            const gradFill = children.find((el) => el.name === 'a:gradFill');
            if (gradFill) {
                return parseGradientFill(gradFill);
            }
        }
        return spPrResult;
    }
    // Check for pattern fill and blip fill (not covered by shared parser)
    if (spPr) {
        const children = getChildElements(spPr);
        const pattFill = children.find((el) => el.name === 'a:pattFill');
        if (pattFill) {
            return { type: 'pattern' };
        }
        const blipFill = children.find((el) => el.name === 'a:blipFill');
        if (blipFill) {
            return { type: 'picture' };
        }
    }
    // Check style reference for fill
    if (style) {
        const fillRef = findByFullName(style, 'a:fillRef');
        if (fillRef) {
            const idx = getAttribute(fillRef, null, 'idx');
            if (idx === '0') {
                // idx=0 means no fill
                return { type: 'none' };
            }
            // Check for color in the fillRef
            const color = parseColorElement(fillRef);
            if (color) {
                return { type: 'solid', color };
            }
        }
    }
    return undefined;
}
/**
 * Parse gradient fill
 */
function parseGradientFill(gradFill) {
    const children = getChildElements(gradFill);
    // Determine gradient type
    let gradientType = 'linear';
    let angle;
    // Check for linear gradient
    const lin = children.find((el) => el.name === 'a:lin');
    if (lin) {
        gradientType = 'linear';
        const ang = getAttribute(lin, null, 'ang');
        if (ang) {
            // Angle is in 60000ths of a degree
            angle = parseInt(ang, 10) / 60000;
        }
    }
    // Check for path gradient (radial)
    const path = children.find((el) => el.name === 'a:path');
    if (path) {
        const pathType = getAttribute(path, null, 'path');
        if (pathType === 'circle') {
            gradientType = 'radial';
        }
        else if (pathType === 'rect') {
            gradientType = 'rectangular';
        }
        else {
            gradientType = 'path';
        }
    }
    // Parse gradient stops
    const gsLst = children.find((el) => el.name === 'a:gsLst');
    const stops = [];
    if (gsLst) {
        const gsElements = findChildrenByLocalName(gsLst, 'gs');
        for (const gs of gsElements) {
            const pos = getAttribute(gs, null, 'pos');
            const position = pos ? parseInt(pos, 10) : 0;
            const color = parseColorElement(gs);
            if (color) {
                stops.push({ position, color });
            }
        }
    }
    return {
        type: 'gradient',
        gradient: {
            type: gradientType,
            angle,
            stops,
        },
    };
}
// ============================================================================
// OUTLINE PARSING
// ============================================================================
/**
 * Parse shape outline/stroke from a:ln element, with style reference fallback.
 *
 * Extends the shared parseOutline with style reference lookup (a:lnRef),
 * cap/join parsing, and arrow head/tail support.
 */
function parseOutline(spPr, style) {
    const ln = spPr ? findByFullName(spPr, 'a:ln') : null;
    if (!ln) {
        // Check style reference for outline
        if (style) {
            const lnRef = findByFullName(style, 'a:lnRef');
            if (lnRef) {
                const idx = getAttribute(lnRef, null, 'idx');
                if (idx === '0') {
                    // idx=0 means no line
                    return undefined;
                }
                const color = parseColorElement(lnRef);
                if (color) {
                    return { color, width: 9525 }; // Default 0.75pt = 9525 EMU
                }
            }
        }
        return undefined;
    }
    const children = getChildElements(ln);
    // Check for no line
    const noFill = children.find((el) => el.name === 'a:noFill');
    if (noFill) {
        return undefined;
    }
    const outline = {};
    // Width in EMUs
    const w = getAttribute(ln, null, 'w');
    if (w) {
        outline.width = parseInt(w, 10);
    }
    // Cap style
    const cap = getAttribute(ln, null, 'cap');
    if (cap === 'flat' || cap === 'rnd' || cap === 'sq') {
        outline.cap = cap === 'rnd' ? 'round' : cap === 'sq' ? 'square' : 'flat';
    }
    // Join style
    const bevel = children.find((el) => el.name === 'a:bevel');
    const miter = children.find((el) => el.name === 'a:miter');
    const round = children.find((el) => el.name === 'a:round');
    if (bevel) {
        outline.join = 'bevel';
    }
    else if (round) {
        outline.join = 'round';
    }
    else if (miter) {
        outline.join = 'miter';
    }
    // Line color
    const solidFill = children.find((el) => el.name === 'a:solidFill');
    if (solidFill) {
        outline.color = parseColorElement(solidFill);
    }
    // Line dash style
    const prstDash = children.find((el) => el.name === 'a:prstDash');
    if (prstDash) {
        const val = getAttribute(prstDash, null, 'val');
        if (val) {
            outline.style = val;
        }
    }
    // Head end (arrow)
    const headEnd = children.find((el) => el.name === 'a:headEnd');
    if (headEnd) {
        outline.headEnd = parseLineEnd(headEnd);
    }
    // Tail end (arrow)
    const tailEnd = children.find((el) => el.name === 'a:tailEnd');
    if (tailEnd) {
        outline.tailEnd = parseLineEnd(tailEnd);
    }
    return outline;
}
/**
 * Parse line end (arrow head/tail)
 */
function parseLineEnd(element) {
    var _a, _b;
    const type = (_a = getAttribute(element, null, 'type')) !== null && _a !== void 0 ? _a : 'none';
    const w = getAttribute(element, null, 'w');
    const len = getAttribute(element, null, 'len');
    const typeMap = {
        none: 'none',
        triangle: 'triangle',
        stealth: 'stealth',
        diamond: 'diamond',
        oval: 'oval',
        arrow: 'arrow',
    };
    return {
        type: (_b = typeMap[type]) !== null && _b !== void 0 ? _b : 'none',
        width: w,
        length: len,
    };
}
// ============================================================================
// TRANSFORM PARSING
// ============================================================================
/**
 * Parse transform from a:xfrm element
 */
function parseTransform(xfrm) {
    var _a, _b, _c, _d;
    if (!xfrm) {
        return { size: { width: 0, height: 0 } };
    }
    // Get extent (size)
    const ext = findByFullName(xfrm, 'a:ext');
    const cx = (_a = parseNumericAttribute(ext, null, 'cx')) !== null && _a !== void 0 ? _a : 0;
    const cy = (_b = parseNumericAttribute(ext, null, 'cy')) !== null && _b !== void 0 ? _b : 0;
    const size = { width: cx, height: cy };
    // Get offset
    const off = findByFullName(xfrm, 'a:off');
    let offset;
    if (off) {
        const x = (_c = parseNumericAttribute(off, null, 'x')) !== null && _c !== void 0 ? _c : 0;
        const y = (_d = parseNumericAttribute(off, null, 'y')) !== null && _d !== void 0 ? _d : 0;
        offset = { x, y };
    }
    // Get transform properties
    const rot = getAttribute(xfrm, null, 'rot');
    const flipH = getAttribute(xfrm, null, 'flipH') === '1';
    const flipV = getAttribute(xfrm, null, 'flipV') === '1';
    const rotation = rotToDegrees(rot);
    let transform;
    if (rotation !== undefined || flipH || flipV) {
        transform = {};
        if (rotation !== undefined)
            transform.rotation = rotation;
        if (flipH)
            transform.flipH = true;
        if (flipV)
            transform.flipV = true;
    }
    return { size, transform, offset };
}
// ============================================================================
// SHAPE TYPE PARSING
// ============================================================================
/**
 * Parse preset geometry to get shape type
 */
function parseShapeType(spPr) {
    if (!spPr) {
        return 'rect';
    }
    // Check for preset geometry
    const prstGeom = findByFullName(spPr, 'a:prstGeom');
    if (prstGeom) {
        const prst = getAttribute(prstGeom, null, 'prst');
        if (prst) {
            return prst;
        }
    }
    // Check for custom geometry (return 'rect' as fallback for custom shapes)
    const custGeom = findByFullName(spPr, 'a:custGeom');
    if (custGeom) {
        return 'rect'; // Custom geometry gets rendered differently
    }
    return 'rect';
}
// ============================================================================
// TEXT BOX PARSING
// ============================================================================
/**
 * Parse text body properties from wps:bodyPr
 */
function parseBodyProperties(bodyPr) {
    if (!bodyPr) {
        return {};
    }
    const result = {};
    // Vertical text
    const vert = getAttribute(bodyPr, null, 'vert');
    if (vert === 'vert' || vert === 'vert270' || vert === 'wordArtVert') {
        result.vertical = true;
    }
    // Rotation
    const rot = getAttribute(bodyPr, null, 'rot');
    if (rot) {
        result.rotation = rotToDegrees(rot);
    }
    // Anchor (vertical alignment)
    const anchor = getAttribute(bodyPr, null, 'anchor');
    if (anchor) {
        const anchorMap = {
            t: 'top',
            ctr: 'middle',
            b: 'bottom',
            dist: 'distributed',
            just: 'justified',
        };
        result.anchor = anchorMap[anchor];
    }
    // Anchor center
    if (getAttribute(bodyPr, null, 'anchorCtr') === '1') {
        result.anchorCenter = true;
    }
    // Auto fit
    const noAutofit = findByFullName(bodyPr, 'a:noAutofit');
    const normAutofit = findByFullName(bodyPr, 'a:normAutofit');
    const spAutofit = findByFullName(bodyPr, 'a:spAutoFit');
    if (noAutofit) {
        result.autoFit = 'none';
    }
    else if (normAutofit) {
        result.autoFit = 'normal';
    }
    else if (spAutofit) {
        result.autoFit = 'shape';
    }
    // Margins (insets) in EMUs
    const lIns = parseNumericAttribute(bodyPr, null, 'lIns');
    const rIns = parseNumericAttribute(bodyPr, null, 'rIns');
    const tIns = parseNumericAttribute(bodyPr, null, 'tIns');
    const bIns = parseNumericAttribute(bodyPr, null, 'bIns');
    if (lIns !== undefined || rIns !== undefined || tIns !== undefined || bIns !== undefined) {
        result.margins = {
            left: lIns,
            right: rIns,
            top: tIns,
            bottom: bIns,
        };
    }
    return result;
}
/**
 * Parse text box content (w:txbxContent)
 * This returns placeholder paragraphs - actual parsing happens in paragraphParser
 * to avoid circular dependencies
 */
function parseTextBoxContent(txbxContent) {
    if (!txbxContent) {
        return [];
    }
    // Return placeholder - actual parsing requires paragraph parser
    // which creates a circular dependency. The document parser should
    // handle this by parsing text box content separately.
    const paragraphs = [];
    const pElements = findChildrenByLocalName(txbxContent, 'p');
    for (const _p of pElements) {
        // Create placeholder paragraph - will be filled by document parser
        paragraphs.push({
            type: 'paragraph',
            formatting: {},
            content: [],
        });
    }
    return paragraphs;
}
// ============================================================================
// MAIN SHAPE PARSING
// ============================================================================
/**
 * Parse a wps:wsp (Word Processing Shape) element
 *
 * @param node - The wps:wsp XML element
 * @returns Parsed Shape object
 */
export function parseShape(node) {
    var _a, _b;
    const children = getChildElements(node);
    // Get non-visual properties
    const cNvPr = children.find((el) => el.name === 'wps:cNvPr');
    // Get shape properties
    const spPr = children.find((el) => el.name === 'wps:spPr');
    // Get style reference
    const style = children.find((el) => el.name === 'wps:style');
    // Get text box
    const txbx = children.find((el) => el.name === 'wps:txbx');
    const txbxContent = txbx ? findByFullName(txbx, 'w:txbxContent') : null;
    // Get body properties
    const bodyPr = children.find((el) => el.name === 'wps:bodyPr');
    // Parse shape type
    const shapeType = parseShapeType(spPr !== null && spPr !== void 0 ? spPr : null);
    // Parse transform (includes size)
    const xfrm = spPr ? findByFullName(spPr, 'a:xfrm') : null;
    const { size, transform } = parseTransform(xfrm);
    // Parse fill
    const fill = parseFill(spPr !== null && spPr !== void 0 ? spPr : null, style !== null && style !== void 0 ? style : null);
    // Parse outline
    const outline = parseOutline(spPr !== null && spPr !== void 0 ? spPr : null, style !== null && style !== void 0 ? style : null);
    // Parse document properties for ID and name
    let id;
    let name;
    if (cNvPr) {
        id = (_a = getAttribute(cNvPr, null, 'id')) !== null && _a !== void 0 ? _a : undefined;
        name = (_b = getAttribute(cNvPr, null, 'name')) !== null && _b !== void 0 ? _b : undefined;
    }
    // Build shape object
    const shape = {
        type: 'shape',
        shapeType,
        size,
    };
    // Add optional properties
    if (id)
        shape.id = id;
    if (name)
        shape.name = name;
    if (fill)
        shape.fill = fill;
    if (outline)
        shape.outline = outline;
    if (transform)
        shape.transform = transform;
    // Parse text body if present
    if (txbxContent || bodyPr) {
        const bodyProps = parseBodyProperties(bodyPr !== null && bodyPr !== void 0 ? bodyPr : null);
        const content = parseTextBoxContent(txbxContent);
        if (content.length > 0 || Object.keys(bodyProps).length > 0) {
            shape.textBody = Object.assign(Object.assign({}, bodyProps), { content });
        }
    }
    return shape;
}
/**
 * Parse shape from a w:drawing element that contains a shape (not an image)
 *
 * @param drawingEl - The w:drawing element
 * @returns Parsed Shape object or null if not a shape
 */
export function parseShapeFromDrawing(drawingEl) {
    var _a, _b;
    const children = getChildElements(drawingEl);
    // Find wp:inline or wp:anchor
    const container = children.find((el) => el.name === 'wp:inline' || el.name === 'wp:anchor');
    if (!container) {
        return null;
    }
    const isAnchor = container.name === 'wp:anchor';
    // Navigate to graphic data
    const graphic = findByFullName(container, 'a:graphic');
    if (!graphic)
        return null;
    const graphicData = findByFullName(graphic, 'a:graphicData');
    if (!graphicData)
        return null;
    // Check for wps:wsp (shape)
    const wsp = findByFullName(graphicData, 'wps:wsp');
    if (!wsp)
        return null;
    // Parse the shape
    const shape = parseShape(wsp);
    // Get extent from container (overrides spPr size)
    const extent = findByFullName(container, 'wp:extent');
    if (extent) {
        const cx = (_a = parseNumericAttribute(extent, null, 'cx')) !== null && _a !== void 0 ? _a : 0;
        const cy = (_b = parseNumericAttribute(extent, null, 'cy')) !== null && _b !== void 0 ? _b : 0;
        shape.size = { width: cx, height: cy };
    }
    // Parse position for anchored shapes
    if (isAnchor) {
        const position = parseAnchorPosition(container);
        if (position) {
            shape.position = position;
        }
        const wrap = parseAnchorWrap(container);
        if (wrap) {
            shape.wrap = wrap;
        }
    }
    // Get document properties from container
    const docPr = findByFullName(container, 'wp:docPr');
    if (docPr) {
        const id = getAttribute(docPr, null, 'id');
        const name = getAttribute(docPr, null, 'name');
        if (id)
            shape.id = id;
        if (name)
            shape.name = name;
    }
    return shape;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Check if a drawing element contains a shape (not an image)
 */
export function isShapeDrawing(drawingEl) {
    const children = getChildElements(drawingEl);
    const container = children.find((el) => el.name === 'wp:inline' || el.name === 'wp:anchor');
    if (!container)
        return false;
    const graphic = findByFullName(container, 'a:graphic');
    if (!graphic)
        return false;
    const graphicData = findByFullName(graphic, 'a:graphicData');
    if (!graphicData)
        return false;
    // Check for wps:wsp (shape)
    const wsp = findByFullName(graphicData, 'wps:wsp');
    return wsp !== null;
}
/**
 * Check if a shape is a line (connector)
 */
export function isLineShape(shape) {
    const lineTypes = [
        'line',
        'straightConnector1',
        'bentConnector2',
        'bentConnector3',
        'bentConnector4',
        'bentConnector5',
        'curvedConnector2',
        'curvedConnector3',
        'curvedConnector4',
        'curvedConnector5',
    ];
    return lineTypes.includes(shape.shapeType);
}
/**
 * Check if a shape is a text box
 */
export function isTextBoxShape(shape) {
    return (shape.shapeType === 'textBox' ||
        (shape.textBody !== undefined && shape.textBody.content.length > 0));
}
/**
 * Check if a shape has text content
 */
export function hasTextContent(shape) {
    return shape.textBody !== undefined && shape.textBody.content.length > 0;
}
/**
 * Get shape width in pixels
 */
export function getShapeWidthPx(shape) {
    return emuToPixels(shape.size.width);
}
/**
 * Get shape height in pixels
 */
export function getShapeHeightPx(shape) {
    return emuToPixels(shape.size.height);
}
/**
 * Get shape dimensions in pixels
 */
export function getShapeDimensionsPx(shape) {
    return {
        width: emuToPixels(shape.size.width),
        height: emuToPixels(shape.size.height),
    };
}
/**
 * Check if shape is floating (anchored)
 */
export function isFloatingShape(shape) {
    return shape.position !== undefined || shape.wrap !== undefined;
}
/**
 * Check if shape has fill
 */
export function hasFill(shape) {
    return shape.fill !== undefined && shape.fill.type !== 'none';
}
/**
 * Check if shape has outline
 */
export function hasOutline(shape) {
    return shape.outline !== undefined;
}
/**
 * Get outline width in pixels
 */
export function getOutlineWidthPx(shape) {
    var _a;
    if (!((_a = shape.outline) === null || _a === void 0 ? void 0 : _a.width))
        return 0;
    return emuToPixels(shape.outline.width);
}
/**
 * Resolve fill color to CSS color string
 */
export function resolveFillColor(shape) {
    if (!shape.fill || shape.fill.type !== 'solid')
        return undefined;
    return resolveColorValueToHex(shape.fill.color);
}
/**
 * Resolve outline color to CSS color string
 */
export function resolveOutlineColor(shape) {
    var _a;
    if (!((_a = shape.outline) === null || _a === void 0 ? void 0 : _a.color))
        return undefined;
    return resolveColorValueToHex(shape.outline.color);
}
//# sourceMappingURL=shapeParser.js.map