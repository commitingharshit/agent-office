/**
 * Image Parser - Parse embedded images from w:drawing elements
 *
 * DOCX images are contained in <w:drawing> elements with either:
 * - wp:inline - Inline images that flow with text
 * - wp:anchor - Floating/anchored images with text wrapping
 *
 * OOXML Structure:
 * w:drawing
 *   ├── wp:inline or wp:anchor
 *   │   ├── wp:extent (size: cx, cy in EMUs)
 *   │   ├── wp:effectExtent (effect margins)
 *   │   ├── wp:docPr (document properties: id, name, descr, title)
 *   │   ├── wp:positionH / wp:positionV (for anchor only)
 *   │   ├── wp:wrap* (wrapping mode for anchor: wrapNone, wrapSquare, etc.)
 *   │   └── a:graphic
 *   │       └── a:graphicData
 *   │           └── pic:pic
 *   │               ├── pic:nvPicPr (non-visual properties)
 *   │               ├── pic:blipFill
 *   │               │   └── a:blip (r:embed = rId)
 *   │               └── pic:spPr
 *   │                   └── a:xfrm (transform: rotation, flip)
 *
 * EMU (English Metric Units): 914400 EMU = 1 inch
 * Conversion: pixels = (emu * 96) / 914400
 */
import { findChild, getChildElements, getAttribute, parseNumericAttribute, findByFullName, } from './xmlParser';
import { resolveTarget } from './relsParser';
import { isTextBoxDrawing } from './textBoxParser';
import { emuToPixels } from '../utils/units';
import { parsePositionH, parsePositionV, WRAP_ELEMENT_NAMES as WRAP_ELEMENTS, parseWrapElement, } from './drawingUtils';
// Re-export for backwards compatibility
export { emuToPixels, pixelsToEmu } from '../utils/units';
// ============================================================================
// ROTATION CONVERSION
// ============================================================================
/**
 * Convert rotation value (1/60000 of a degree) to degrees
 *
 * @param rot - Rotation in 60000ths of a degree
 * @returns Rotation in degrees
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
// ELEMENT FINDERS
// ============================================================================
/**
 * Find any of the specified elements
 */
function findAnyOf(parent, names) {
    const children = getChildElements(parent);
    for (const child of children) {
        if (names.includes(child.name || '')) {
            return child;
        }
    }
    return null;
}
// ============================================================================
// SIZE PARSING
// ============================================================================
/**
 * Parse extent element for image size
 *
 * @param extent - wp:extent element
 * @returns ImageSize in EMUs
 */
function parseExtent(extent) {
    var _a, _b;
    if (!extent) {
        return { width: 0, height: 0 };
    }
    const cx = (_a = parseNumericAttribute(extent, null, 'cx')) !== null && _a !== void 0 ? _a : 0;
    const cy = (_b = parseNumericAttribute(extent, null, 'cy')) !== null && _b !== void 0 ? _b : 0;
    return { width: cx, height: cy };
}
/**
 * Parse effect extent for shadow/effect margins
 *
 * @param effectExtent - wp:effectExtent element
 * @returns Padding for effects
 */
function parseEffectExtent(effectExtent) {
    var _a, _b, _c, _d;
    if (!effectExtent)
        return undefined;
    const l = (_a = parseNumericAttribute(effectExtent, null, 'l')) !== null && _a !== void 0 ? _a : 0;
    const t = (_b = parseNumericAttribute(effectExtent, null, 't')) !== null && _b !== void 0 ? _b : 0;
    const r = (_c = parseNumericAttribute(effectExtent, null, 'r')) !== null && _c !== void 0 ? _c : 0;
    const b = (_d = parseNumericAttribute(effectExtent, null, 'b')) !== null && _d !== void 0 ? _d : 0;
    if (l === 0 && t === 0 && r === 0 && b === 0) {
        return undefined;
    }
    return {
        left: l,
        top: t,
        right: r,
        bottom: b,
    };
}
// ============================================================================
// DOCUMENT PROPERTIES PARSING
// ============================================================================
/**
 * Parse document properties (wp:docPr)
 *
 * @param docPr - wp:docPr element
 * @returns Object with id, name, description, title
 */
function parseDocProps(docPr) {
    var _a, _b, _c, _d, _e;
    if (!docPr)
        return {};
    const id = (_a = getAttribute(docPr, null, 'id')) !== null && _a !== void 0 ? _a : undefined;
    const name = (_b = getAttribute(docPr, null, 'name')) !== null && _b !== void 0 ? _b : undefined;
    const descr = (_c = getAttribute(docPr, null, 'descr')) !== null && _c !== void 0 ? _c : undefined;
    const title = (_d = getAttribute(docPr, null, 'title')) !== null && _d !== void 0 ? _d : undefined;
    // Check for decorative flag (accessibility)
    // In newer OOXML, this is indicated by a:decorative element or attribute
    const decorative = getAttribute(docPr, null, 'decorative') === '1';
    // Check for hyperlink (a:hlinkClick) — clickable image
    const hlinkClickEl = findChild(docPr, 'a', 'hlinkClick');
    const hlinkRId = hlinkClickEl ? ((_e = getAttribute(hlinkClickEl, 'r', 'id')) !== null && _e !== void 0 ? _e : undefined) : undefined;
    return {
        id,
        name,
        alt: descr,
        title,
        decorative: decorative || undefined,
        hlinkRId,
    };
}
// ============================================================================
// TRANSFORM PARSING
// ============================================================================
/**
 * Parse transform properties from a:xfrm
 */
function parseTransform(xfrm) {
    if (!xfrm)
        return undefined;
    const rot = getAttribute(xfrm, null, 'rot');
    const flipH = getAttribute(xfrm, null, 'flipH') === '1';
    const flipV = getAttribute(xfrm, null, 'flipV') === '1';
    const rotation = rotToDegrees(rot);
    if (rotation === undefined && !flipH && !flipV) {
        return undefined;
    }
    const transform = {};
    if (rotation !== undefined)
        transform.rotation = rotation;
    if (flipH)
        transform.flipH = true;
    if (flipV)
        transform.flipV = true;
    return transform;
}
// ============================================================================
// BLIP EXTRACTION (image relationship ID)
// ============================================================================
/**
 * Walk the DrawingML chain `a:graphic > a:graphicData > pic:pic` once and
 * return both the `pic:blipFill` (carries `a:srcRect`) and the `a:blip`
 * (carries `r:embed` and `a:alphaModFix`). Cheaper than two separate walks
 * for parsers that need both.
 */
function findBlipChain(container) {
    const graphic = findByFullName(container, 'a:graphic');
    if (!graphic)
        return { blipFill: null, blip: null };
    const graphicData = findByFullName(graphic, 'a:graphicData');
    if (!graphicData)
        return { blipFill: null, blip: null };
    const pic = findByFullName(graphicData, 'pic:pic');
    if (!pic)
        return { blipFill: null, blip: null };
    const blipFill = findByFullName(pic, 'pic:blipFill');
    if (!blipFill)
        return { blipFill: null, blip: null };
    return { blipFill, blip: findByFullName(blipFill, 'a:blip') };
}
/**
 * Parse `<a:srcRect l="..." t="..." r="..." b="..."/>` inside `pic:blipFill`.
 * The values are in 1/100000 of the source image dimension; convert to
 * fractions in [0, 1] so the renderer can apply them as CSS clip-path
 * percentages.
 */
function parseImageCrop(blipFill) {
    if (!blipFill)
        return undefined;
    const srcRect = findByFullName(blipFill, 'a:srcRect');
    if (!srcRect)
        return undefined;
    const toFraction = (attr) => {
        const raw = parseNumericAttribute(srcRect, null, attr);
        if (raw === undefined || raw === 0)
            return undefined;
        return raw / 100000;
    };
    const left = toFraction('l');
    const top = toFraction('t');
    const right = toFraction('r');
    const bottom = toFraction('b');
    if (left === undefined && top === undefined && right === undefined && bottom === undefined) {
        return undefined;
    }
    const crop = {};
    if (left !== undefined)
        crop.left = left;
    if (top !== undefined)
        crop.top = top;
    if (right !== undefined)
        crop.right = right;
    if (bottom !== undefined)
        crop.bottom = bottom;
    return crop;
}
/**
 * Parse `<a:alphaModFix amt="..."/>` inside the `a:blip` element. The
 * `amt` value is in 1/100000; convert to a fraction in [0, 1] for CSS
 * `opacity`. Returns undefined when no alpha modifier is present (the
 * image is fully opaque).
 */
function parseImageOpacity(blip) {
    if (!blip)
        return undefined;
    const alpha = findByFullName(blip, 'a:alphaModFix');
    if (!alpha)
        return undefined;
    const amt = parseNumericAttribute(alpha, null, 'amt');
    if (amt === undefined || amt >= 100000)
        return undefined;
    return Math.max(0, Math.min(1, amt / 100000));
}
/**
 * Extract rId from a:blip element
 */
function extractBlipRId(blip) {
    if (!blip)
        return '';
    // The rId is in r:embed attribute
    const rEmbed = getAttribute(blip, 'r', 'embed');
    if (rEmbed)
        return rEmbed;
    // Sometimes it's just "embed" without namespace
    const embed = getAttribute(blip, null, 'embed');
    if (embed)
        return embed;
    // Check r:link for linked (not embedded) images
    const rLink = getAttribute(blip, 'r', 'link');
    if (rLink)
        return rLink;
    return '';
}
/**
 * Find transform (a:xfrm) from picture shape properties
 *
 * Path: a:graphic > a:graphicData > pic:pic > pic:spPr > a:xfrm
 */
function findPictureTransform(container) {
    const graphic = findByFullName(container, 'a:graphic');
    if (!graphic)
        return null;
    const graphicData = findByFullName(graphic, 'a:graphicData');
    if (!graphicData)
        return null;
    const pic = findByFullName(graphicData, 'pic:pic');
    if (!pic)
        return null;
    const spPr = findByFullName(pic, 'pic:spPr');
    if (!spPr)
        return null;
    const xfrm = findByFullName(spPr, 'a:xfrm');
    return xfrm;
}
// ============================================================================
// MEDIA RESOLUTION
// ============================================================================
/**
 * Normalize a target path to the standard word/media/... format
 */
function normalizeMediaPath(targetPath) {
    if (!targetPath)
        return targetPath;
    // Remove leading slashes
    let normalized = targetPath.replace(/^\/+/, '');
    // Ensure word/ prefix for media files
    if (normalized.startsWith('media/')) {
        normalized = `word/${normalized}`;
    }
    else if (!normalized.startsWith('word/')) {
        normalized = `word/${normalized}`;
    }
    return normalized;
}
/**
 * Get MIME type from file extension
 */
function getMimeType(path) {
    var _a, _b, _c;
    const ext = (_b = (_a = path.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    const mimeTypes = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        bmp: 'image/bmp',
        tiff: 'image/tiff',
        tif: 'image/tiff',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        emf: 'image/x-emf',
        wmf: 'image/x-wmf',
    };
    return (_c = mimeTypes[ext]) !== null && _c !== void 0 ? _c : 'application/octet-stream';
}
/**
 * Resolve image data from relationships and media map
 *
 * @param rId - Relationship ID (e.g., "rId1")
 * @param rels - Relationship map
 * @param media - Media files map
 * @returns Object with src (data URL or blob), mimeType, and filename
 */
export function resolveImageData(rId, rels, media) {
    if (!rId || !rels) {
        return {};
    }
    const rel = rels.get(rId);
    if (!rel) {
        return {};
    }
    // Get the target path
    const targetPath = rel.target;
    if (!targetPath) {
        return {};
    }
    // Normalize the path
    const normalizedPath = normalizeMediaPath(targetPath);
    const filename = targetPath.split('/').pop();
    // Case-insensitive lookup helper for media map
    const findMediaCaseInsensitive = (map, searchPath) => {
        const lowerPath = searchPath.toLowerCase();
        for (const [key, value] of map.entries()) {
            if (key.toLowerCase() === lowerPath) {
                return value;
            }
        }
        return undefined;
    };
    // Try to find the media file (case-insensitive)
    if (media) {
        // Try normalized path first
        const mediaFile = findMediaCaseInsensitive(media, normalizedPath);
        if (mediaFile) {
            return {
                src: mediaFile.dataUrl || mediaFile.base64, // Use data URL or base64
                mimeType: mediaFile.mimeType,
                filename,
            };
        }
        // Try without word/ prefix
        const altPath = targetPath.replace(/^\/+/, '');
        const altMediaFile = findMediaCaseInsensitive(media, altPath);
        if (altMediaFile) {
            return {
                src: altMediaFile.dataUrl || altMediaFile.base64,
                mimeType: altMediaFile.mimeType,
                filename,
            };
        }
        // Try with word/ prefix added
        const withWordPrefix = `word/${altPath}`;
        const prefixedMediaFile = findMediaCaseInsensitive(media, withWordPrefix);
        if (prefixedMediaFile) {
            return {
                src: prefixedMediaFile.dataUrl || prefixedMediaFile.base64,
                mimeType: prefixedMediaFile.mimeType,
                filename,
            };
        }
    }
    // Return at least the MIME type based on extension
    return {
        mimeType: getMimeType(targetPath),
        filename,
    };
}
// ============================================================================
// MAIN PARSING FUNCTIONS
// ============================================================================
/**
 * Parse a wp:inline element (inline image)
 *
 * @param inlineEl - The wp:inline element
 * @param rels - Relationship map for resolving rId
 * @param media - Media files map
 * @returns Parsed Image object
 */
function parseInline(inlineEl, rels, media) {
    var _a, _b, _c, _d;
    // Parse extent (size)
    const extent = findByFullName(inlineEl, 'wp:extent');
    const size = parseExtent(extent);
    // Parse effect extent
    const effectExtent = findByFullName(inlineEl, 'wp:effectExtent');
    const padding = parseEffectExtent(effectExtent);
    // Parse document properties
    const docPr = findByFullName(inlineEl, 'wp:docPr');
    const props = parseDocProps(docPr);
    // Find blip and extract rId
    const { blip, blipFill } = findBlipChain(inlineEl);
    const rId = extractBlipRId(blip);
    const crop = parseImageCrop(blipFill);
    const opacity = parseImageOpacity(blip);
    // Resolve image data
    const imageData = resolveImageData(rId, rels, media);
    // Find transform
    const xfrm = findPictureTransform(inlineEl);
    const transform = parseTransform(xfrm);
    // Read distance attributes from wp:inline (OOXML spec: distT, distB, distL, distR)
    const distT = (_a = parseNumericAttribute(inlineEl, null, 'distT')) !== null && _a !== void 0 ? _a : undefined;
    const distB = (_b = parseNumericAttribute(inlineEl, null, 'distB')) !== null && _b !== void 0 ? _b : undefined;
    const distL = (_c = parseNumericAttribute(inlineEl, null, 'distL')) !== null && _c !== void 0 ? _c : undefined;
    const distR = (_d = parseNumericAttribute(inlineEl, null, 'distR')) !== null && _d !== void 0 ? _d : undefined;
    const wrap = { type: 'inline' };
    if (distT !== undefined)
        wrap.distT = distT;
    if (distB !== undefined)
        wrap.distB = distB;
    if (distL !== undefined)
        wrap.distL = distL;
    if (distR !== undefined)
        wrap.distR = distR;
    const image = {
        type: 'image',
        rId,
        size,
        wrap,
    };
    // Add optional properties
    if (props.id)
        image.id = props.id;
    if (props.alt)
        image.alt = props.alt;
    if (props.title)
        image.title = props.title;
    if (props.decorative)
        image.decorative = true;
    if (imageData.src)
        image.src = imageData.src;
    if (imageData.mimeType)
        image.mimeType = imageData.mimeType;
    if (imageData.filename)
        image.filename = imageData.filename;
    if (padding)
        image.padding = padding;
    if (transform)
        image.transform = transform;
    if (crop)
        image.crop = crop;
    if (opacity !== undefined)
        image.opacity = opacity;
    // Resolve image hyperlink (a:hlinkClick). Keep the original rId on
    // the model so the serializer can emit the same reference back
    // verbatim (round-trip preserves the existing rels.xml entry rather
    // than allocating a new one).
    if (props.hlinkRId) {
        image.hlinkRId = props.hlinkRId;
        if (rels) {
            const href = resolveTarget(rels, props.hlinkRId);
            if (href)
                image.hlinkHref = href;
        }
    }
    return image;
}
/**
 * Parse a wp:anchor element (floating/anchored image)
 *
 * @param anchorEl - The wp:anchor element
 * @param rels - Relationship map for resolving rId
 * @param media - Media files map
 * @returns Parsed Image object
 */
function parseAnchor(anchorEl, rels, media) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // Parse extent (size)
    const extent = findByFullName(anchorEl, 'wp:extent');
    const size = parseExtent(extent);
    // Parse effect extent
    const effectExtent = findByFullName(anchorEl, 'wp:effectExtent');
    const padding = parseEffectExtent(effectExtent);
    // Parse document properties
    const docPr = findByFullName(anchorEl, 'wp:docPr');
    const props = parseDocProps(docPr);
    // Check behindDoc attribute
    const behindDoc = getAttribute(anchorEl, null, 'behindDoc') === '1';
    // OOXML defaults to "1" (true) when these attributes are absent. We only
    // record the value when the spec deviates from the default, so round-trip
    // serialization can keep the document terse.
    const layoutInCellAttr = getAttribute(anchorEl, null, 'layoutInCell');
    const layoutInCell = layoutInCellAttr === null ? undefined : layoutInCellAttr === '1';
    const allowOverlapAttr = getAttribute(anchorEl, null, 'allowOverlap');
    const allowOverlap = allowOverlapAttr === null ? undefined : allowOverlapAttr === '1';
    // Read distance attributes from the wp:anchor element itself (fallback values)
    const anchorDistances = {
        distT: (_a = parseNumericAttribute(anchorEl, null, 'distT')) !== null && _a !== void 0 ? _a : undefined,
        distB: (_b = parseNumericAttribute(anchorEl, null, 'distB')) !== null && _b !== void 0 ? _b : undefined,
        distL: (_c = parseNumericAttribute(anchorEl, null, 'distL')) !== null && _c !== void 0 ? _c : undefined,
        distR: (_d = parseNumericAttribute(anchorEl, null, 'distR')) !== null && _d !== void 0 ? _d : undefined,
    };
    // Parse wrap element (wrap child values take priority over anchor-level values)
    const wrapEl = findAnyOf(anchorEl, WRAP_ELEMENTS);
    const wrap = parseWrapElement(wrapEl, behindDoc, anchorDistances);
    // Parse position
    const posH = findByFullName(anchorEl, 'wp:positionH');
    const posV = findByFullName(anchorEl, 'wp:positionV');
    const horizontal = parsePositionH(posH);
    const vertical = parsePositionV(posV);
    let position;
    if (horizontal || vertical) {
        position = {
            horizontal: horizontal !== null && horizontal !== void 0 ? horizontal : { relativeTo: 'column' },
            vertical: vertical !== null && vertical !== void 0 ? vertical : { relativeTo: 'paragraph' },
        };
    }
    // Find blip and extract rId
    const { blip, blipFill } = findBlipChain(anchorEl);
    const rId = extractBlipRId(blip);
    const crop = parseImageCrop(blipFill);
    const opacity = parseImageOpacity(blip);
    // Resolve image data
    const imageData = resolveImageData(rId, rels, media);
    // Find transform
    const xfrm = findPictureTransform(anchorEl);
    const transform = parseTransform(xfrm);
    const image = {
        type: 'image',
        rId,
        size,
        wrap,
    };
    // Add optional properties
    if (props.id)
        image.id = props.id;
    if (props.alt)
        image.alt = props.alt;
    if (props.title)
        image.title = props.title;
    if (props.decorative)
        image.decorative = true;
    if (imageData.src)
        image.src = imageData.src;
    if (imageData.mimeType)
        image.mimeType = imageData.mimeType;
    if (imageData.filename)
        image.filename = imageData.filename;
    if (position)
        image.position = position;
    if (padding)
        image.padding = padding;
    if (transform)
        image.transform = transform;
    if (crop)
        image.crop = crop;
    if (opacity !== undefined)
        image.opacity = opacity;
    if (layoutInCell !== undefined)
        image.layoutInCell = layoutInCell;
    if (allowOverlap !== undefined)
        image.allowOverlap = allowOverlap;
    // wp14:sizeRelH / wp14:sizeRelV — Word 2010+ percent-of-anchor sizing
    // hints. We don't drive layout from them, but round-trip is required so
    // saving doesn't drop the elements Word always emits.
    const sizeRelH = findByFullName(anchorEl, 'wp14:sizeRelH');
    const sizeRelV = findByFullName(anchorEl, 'wp14:sizeRelV');
    if (sizeRelH || sizeRelV) {
        const rel = {};
        if (sizeRelH) {
            const relativeFrom = (_e = getAttribute(sizeRelH, null, 'relativeFrom')) !== null && _e !== void 0 ? _e : 'margin';
            const pctEl = findByFullName(sizeRelH, 'wp14:pctWidth');
            const pctText = (_g = (_f = pctEl === null || pctEl === void 0 ? void 0 : pctEl.elements) === null || _f === void 0 ? void 0 : _f.find((e) => e.type === 'text')) === null || _g === void 0 ? void 0 : _g.text;
            const pct = pctText !== undefined ? Number(pctText) : undefined;
            rel.horizontal = Object.assign({ relativeFrom }, (Number.isFinite(pct) ? { pct } : {}));
        }
        if (sizeRelV) {
            const relativeFrom = (_h = getAttribute(sizeRelV, null, 'relativeFrom')) !== null && _h !== void 0 ? _h : 'margin';
            const pctEl = findByFullName(sizeRelV, 'wp14:pctHeight');
            const pctText = (_k = (_j = pctEl === null || pctEl === void 0 ? void 0 : pctEl.elements) === null || _j === void 0 ? void 0 : _j.find((e) => e.type === 'text')) === null || _k === void 0 ? void 0 : _k.text;
            const pct = pctText !== undefined ? Number(pctText) : undefined;
            rel.vertical = Object.assign({ relativeFrom }, (Number.isFinite(pct) ? { pct } : {}));
        }
        image.relativeSize = rel;
    }
    // Resolve image hyperlink (a:hlinkClick). Keep the original rId on
    // the model so the serializer can emit the same reference back
    // verbatim (round-trip preserves the existing rels.xml entry rather
    // than allocating a new one).
    if (props.hlinkRId) {
        image.hlinkRId = props.hlinkRId;
        if (rels) {
            const href = resolveTarget(rels, props.hlinkRId);
            if (href)
                image.hlinkHref = href;
        }
    }
    return image;
}
/**
 * Parse a w:drawing element
 *
 * The drawing element contains either wp:inline or wp:anchor.
 *
 * @param drawingEl - The w:drawing element
 * @param rels - Relationship map for resolving rId
 * @param media - Media files map
 * @returns Parsed Image object or null if not an image
 */
export function parseDrawing(drawingEl, rels, media) {
    // Skip text box shapes — they are handled by textBoxParser, not as images
    if (isTextBoxDrawing(drawingEl))
        return null;
    const children = getChildElements(drawingEl);
    for (const child of children) {
        const name = child.name || '';
        if (name === 'wp:inline' || name === 'wp:anchor') {
            return name === 'wp:inline'
                ? parseInline(child, rels, media)
                : parseAnchor(child, rels, media);
        }
    }
    return null;
}
/**
 * Parse an image from a w:drawing element
 *
 * This is the main entry point for image parsing.
 *
 * @param node - The w:drawing XML element
 * @param rels - Relationship map for resolving rId
 * @param media - Media files map
 * @returns Parsed Image object or null if parsing fails
 */
export function parseImage(node, rels, media) {
    return parseDrawing(node, rels, media);
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Check if an image is inline (not floating)
 */
export function isInlineImage(image) {
    return image.wrap.type === 'inline';
}
/**
 * Check if an image is floating (anchored)
 */
export function isFloatingImage(image) {
    return image.wrap.type !== 'inline';
}
/**
 * Check if an image is behind text
 */
export function isBehindText(image) {
    return image.wrap.type === 'behind';
}
/**
 * Check if an image is in front of text
 */
export function isInFrontOfText(image) {
    return image.wrap.type === 'inFront';
}
/**
 * Get image width in pixels
 */
export function getImageWidthPx(image) {
    return emuToPixels(image.size.width);
}
/**
 * Get image height in pixels
 */
export function getImageHeightPx(image) {
    return emuToPixels(image.size.height);
}
/**
 * Get image dimensions in pixels
 */
export function getImageDimensionsPx(image) {
    return {
        width: emuToPixels(image.size.width),
        height: emuToPixels(image.size.height),
    };
}
/**
 * Check if image has alt text (for accessibility)
 */
export function hasAltText(image) {
    return !!image.alt && image.alt.trim().length > 0;
}
/**
 * Check if image is decorative (should be ignored by screen readers)
 */
export function isDecorativeImage(image) {
    return image.decorative === true;
}
/**
 * Get wrap distances in pixels
 */
export function getWrapDistancesPx(image) {
    return {
        top: emuToPixels(image.wrap.distT),
        bottom: emuToPixels(image.wrap.distB),
        left: emuToPixels(image.wrap.distL),
        right: emuToPixels(image.wrap.distR),
    };
}
/**
 * Check if image needs text wrapping
 */
export function needsTextWrapping(image) {
    const wrapTypes = ['square', 'tight', 'through', 'topAndBottom'];
    return wrapTypes.includes(image.wrap.type);
}
//# sourceMappingURL=imageParser.js.map