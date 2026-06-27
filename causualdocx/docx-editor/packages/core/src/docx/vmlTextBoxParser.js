/**
 * VML Text Box Parser
 *
 * Legacy Vector Markup Language (VML) shape format used by older Word
 * versions (and some current Word saves) for text frames:
 *
 *   <w:r>
 *     <w:pict>
 *       <v:group>?           [optional grouping element]
 *         <v:shape type="#_x0000_t202" ...>
 *           <v:textbox inset="...">
 *             <w:txbxContent>
 *               <w:p>...</w:p>
 *             </w:txbxContent>
 *           </v:textbox>
 *         </v:shape>
 *       </v:group>?
 *     </w:pict>
 *   </w:r>
 *
 * The shape type `#_x0000_t202` is Microsoft's well-known shape id for
 * text frames. Decorative VML shapes (lines, ovals, paths) carry other
 * type ids or no type at all and are not treated as text frames.
 *
 * The modern DrawingML equivalent (`<wps:wsp>` / `<wps:txbx>`) is parsed
 * by `textBoxParser.ts`. This module exists separately so the legacy
 * code path can be skipped quickly when only DrawingML is present.
 */
import { findDeep, findChild, getChildElements, getLocalName, getAttribute, } from './xmlParser';
const VML_TEXTBOX_SHAPE_TYPE = '#_x0000_t202';
/**
 * Does this `<w:pict>` element contain a VML text frame we can parse?
 * Walks direct children + one level of grouping (`<v:group>`).
 */
export function isVmlTextBoxPict(pictEl) {
    return findVmlTextBoxShape(pictEl) !== null;
}
/**
 * Locate the `<v:shape type="#_x0000_t202">` inside a `<w:pict>`.
 * Returns null if no text-frame shape is present.
 */
function findVmlTextBoxShape(pictEl) {
    var _a;
    const children = getChildElements(pictEl);
    for (const child of children) {
        const local = getLocalName((_a = child.name) !== null && _a !== void 0 ? _a : '');
        if (local === 'shape' && isTextBoxShape(child))
            return child;
        if (local === 'group') {
            const inGroup = findInGroup(child);
            if (inGroup)
                return inGroup;
        }
    }
    return null;
}
function findInGroup(groupEl) {
    var _a;
    for (const child of getChildElements(groupEl)) {
        if (getLocalName((_a = child.name) !== null && _a !== void 0 ? _a : '') === 'shape' && isTextBoxShape(child))
            return child;
    }
    return null;
}
function isTextBoxShape(shapeEl) {
    const type = getAttribute(shapeEl, null, 'type');
    return type === VML_TEXTBOX_SHAPE_TYPE;
}
/**
 * Parse a `<w:pict>` element to a TextBox structure.
 * Size is derived best-effort from the `<v:shape>`'s `style` attribute
 * (CSS-like declarations using `pt`, `px`, or unit-less twips).
 * Returns null if no text-frame shape or `<w:txbxContent>` is found.
 */
export function parseVmlTextBox(pictEl, parseParagraph) {
    const shape = findVmlTextBoxShape(pictEl);
    if (!shape)
        return null;
    return textBoxShapeToTextBox(shape, parseParagraph, undefined);
}
/**
 * Extract width/height from the VML shape's `style` attribute. Defaults
 * to a reasonable rendering size when unparseable so the user still sees
 * the content rather than a zero-area box.
 */
function parseVmlShapeSize(shapeEl) {
    var _a, _b, _c;
    const DEFAULT_WIDTH_EMU = 2200000;
    const DEFAULT_HEIGHT_EMU = 500000;
    const style = (_a = getAttribute(shapeEl, null, 'style')) !== null && _a !== void 0 ? _a : '';
    const decls = new Map();
    for (const part of style.split(';')) {
        const [k, v] = part.split(':');
        if (k && v)
            decls.set(k.trim().toLowerCase(), v.trim());
    }
    const widthEmu = (_b = lengthDeclToEmu(decls.get('width'))) !== null && _b !== void 0 ? _b : DEFAULT_WIDTH_EMU;
    const heightEmu = (_c = lengthDeclToEmu(decls.get('height'))) !== null && _c !== void 0 ? _c : DEFAULT_HEIGHT_EMU;
    return { width: widthEmu, height: heightEmu };
}
/**
 * Convert a VML length declaration to EMUs. VML accepts `Npt`, `Npx`,
 * or a bare number (interpreted as twips per Word's VML convention).
 */
function lengthDeclToEmu(value) {
    if (!value)
        return null;
    const trimmed = value.trim();
    const num = parseFloat(trimmed);
    if (!Number.isFinite(num))
        return null;
    if (trimmed.endsWith('pt')) {
        // 1 pt = 12700 EMU
        return Math.round(num * 12700);
    }
    if (trimmed.endsWith('px')) {
        // 1 px ≈ 0.75 pt at 96dpi → 9525 EMU
        return Math.round(num * 9525);
    }
    // Bare number → twips
    // 1 twip = 635 EMU
    return Math.round(num * 635);
}
// ============================================================================
// VML DECORATIVE SHAPES (non-textbox)
// ============================================================================
/**
 * Decorative VML shapes — `<v:rect>`, `<v:oval>`, `<v:line>` — that do
 * NOT carry an inner `<v:textbox>`. Common in older Word docs as page
 * dividers, banner bars, signature lines, etc.
 *
 * We emit them as a `TextBox` whose `content` is a single empty
 * paragraph (the PM textBox schema requires `(paragraph | table)+`).
 * The renderer in `renderTextBox.ts` paints the fill + outline based on
 * the TextBox's `fill`/`outline` fields regardless of whether the inner
 * content has any text, so the box appears as a styled rectangle.
 *
 * Per OOXML §9.4.2 (legacy VML), the wire format is CSS-like style
 * declarations on a single attribute — same shape this module already
 * parses for VML text frames. The supported tags here are limited to
 * shapes whose visual is a single filled rectangle:
 *
 *   <v:rect ... fillcolor="#000" stroked="false">
 *     <v:fill type="solid"/>
 *   </v:rect>
 *
 * `<v:oval>` is rendered as a rectangle too — close enough for most
 * decorative-banner use cases, and round-trips faithfully on save
 * because we keep no shape-type-specific data here.
 */
const VML_DECORATIVE_TAGS = new Set(['rect', 'oval', 'line']);
function parseVmlStyle(styleAttr) {
    const decls = new Map();
    for (const part of styleAttr.split(';')) {
        const [k, v] = part.split(':');
        if (k && v)
            decls.set(k.trim().toLowerCase(), v.trim());
    }
    return decls;
}
function buildEmptyParagraph() {
    return { type: 'paragraph', content: [] };
}
function parseFillForShape(shapeEl) {
    // `filled="false"` means no fill regardless of fillcolor.
    const filled = getAttribute(shapeEl, null, 'filled');
    if (filled === 'false' || filled === 'f')
        return { type: 'none' };
    const fillcolor = getAttribute(shapeEl, null, 'fillcolor');
    if (!fillcolor)
        return undefined;
    const rgb = normalizeHex(fillcolor);
    if (!rgb)
        return undefined;
    return { type: 'solid', color: { rgb } };
}
function parseOutlineForShape(shapeEl) {
    const stroked = getAttribute(shapeEl, null, 'stroked');
    if (stroked === 'false' || stroked === 'f')
        return undefined;
    const strokecolor = getAttribute(shapeEl, null, 'strokecolor');
    const strokeweight = getAttribute(shapeEl, null, 'strokeweight');
    if (!strokecolor && !strokeweight)
        return undefined;
    const outline = {};
    if (strokecolor) {
        const rgb = normalizeHex(strokecolor);
        if (rgb)
            outline.color = { rgb };
    }
    if (strokeweight) {
        const emu = lengthDeclToEmu(strokeweight);
        if (emu)
            outline.width = emu;
    }
    return outline;
}
function normalizeHex(value) {
    const trimmed = value.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(trimmed))
        return trimmed.toUpperCase();
    if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
        return trimmed
            .toUpperCase()
            .split('')
            .map((c) => c + c)
            .join('');
    }
    // Some VML uses CSS-style names like "white", "black" — skip for now
    // (the SDS fixture's shapes all use #RRGGBB).
    return null;
}
/** VML `mso-position-horizontal-relative` → OOXML ST_RelFromH. */
const VML_H_REL = {
    page: 'page',
    margin: 'margin',
    text: 'column',
    char: 'character',
    'left-margin-area': 'leftMargin',
    'right-margin-area': 'rightMargin',
    'inner-margin-area': 'insideMargin',
    'outer-margin-area': 'outsideMargin',
};
/** VML `mso-position-vertical-relative` → OOXML ST_RelFromV. */
const VML_V_REL = {
    page: 'page',
    margin: 'margin',
    text: 'paragraph',
    line: 'line',
    'top-margin-area': 'topMargin',
    'bottom-margin-area': 'bottomMargin',
    'inner-margin-area': 'insideMargin',
    'outer-margin-area': 'outsideMargin',
};
const VML_H_ALIGN = {
    left: 'left',
    center: 'center',
    right: 'right',
    inside: 'inside',
    outside: 'outside',
};
const VML_V_ALIGN = {
    top: 'top',
    center: 'center',
    bottom: 'bottom',
    inside: 'inside',
    outside: 'outside',
};
/**
 * A negative VML `z-index` means the shape paints BEHIND the body text
 * (Word's "Behind Text" wrap). Word authors the SDS hazard box this way
 * (`z-index:-15728128`). The sign is what matters; the magnitude is just a
 * stacking order among other behind-doc shapes. Returns the `behind` wrap so
 * downstream layout can both paint it behind and reserve its band in the flow.
 */
function parseVmlBehindWrap(decls) {
    const z = decls.get('z-index');
    if (z === undefined)
        return undefined;
    const n = parseFloat(z);
    if (Number.isFinite(n) && n < 0)
        return { type: 'behind' };
    return undefined;
}
function parseVmlShapePosition(_shapeEl, decls) {
    var _a, _b, _c, _d;
    const isAbsolute = decls.get('position') === 'absolute';
    if (!isAbsolute)
        return undefined;
    const left = lengthDeclToEmu(decls.get('margin-left'));
    const top = lengthDeclToEmu(decls.get('margin-top'));
    // `mso-position-*-relative` binds the offset frame (page / margin / column /
    // …); `mso-position-*` carries a symbolic alignment (left/center/right or
    // `absolute` = use the offset). Defaults mirror Word: margin for H, paragraph
    // for V.
    const hRel = (_b = VML_H_REL[(_a = decls.get('mso-position-horizontal-relative')) !== null && _a !== void 0 ? _a : '']) !== null && _b !== void 0 ? _b : 'margin';
    const vRel = (_d = VML_V_REL[(_c = decls.get('mso-position-vertical-relative')) !== null && _c !== void 0 ? _c : '']) !== null && _d !== void 0 ? _d : 'paragraph';
    const hPos = decls.get('mso-position-horizontal');
    const vPos = decls.get('mso-position-vertical');
    const hAlign = hPos && hPos !== 'absolute' ? VML_H_ALIGN[hPos] : undefined;
    const vAlign = vPos && vPos !== 'absolute' ? VML_V_ALIGN[vPos] : undefined;
    if (left === null && top === null && !hAlign && !vAlign)
        return undefined;
    return {
        horizontal: hAlign
            ? { relativeTo: hRel, alignment: hAlign }
            : { relativeTo: hRel, posOffset: left !== null && left !== void 0 ? left : 0 },
        vertical: vAlign
            ? { relativeTo: vRel, alignment: vAlign }
            : { relativeTo: vRel, posOffset: top !== null && top !== void 0 ? top : 0 },
    };
}
/** Does this `<w:pict>` contain a decorative VML shape we can render? */
export function isVmlDecorativeShapePict(pictEl) {
    return findVmlDecorativeShape(pictEl) !== null;
}
function findVmlDecorativeShape(pictEl) {
    var _a, _b;
    for (const child of getChildElements(pictEl)) {
        const local = getLocalName((_a = child.name) !== null && _a !== void 0 ? _a : '');
        if (VML_DECORATIVE_TAGS.has(local))
            return child;
        if (local === 'group') {
            for (const inner of getChildElements(child)) {
                if (VML_DECORATIVE_TAGS.has(getLocalName((_b = inner.name) !== null && _b !== void 0 ? _b : '')))
                    return inner;
            }
        }
    }
    return null;
}
/**
 * Parse a `<w:pict>` element containing one VML decorative shape to a
 * `TextBox`-shaped record. Returns `null` if no decorative shape was
 * found. The caller decides whether to wrap it back into a `Shape` /
 * `ShapeContent` for injection into the document tree (same as the
 * text-frame path).
 */
export function parseVmlDecorativeShape(pictEl) {
    const shape = findVmlDecorativeShape(pictEl);
    if (!shape)
        return null;
    // Only meaningful for a direct (ungrouped) decorative shape; grouped
    // shapes go through `parseVmlShapes` so the group transform applies.
    return decorativeShapeToTextBox(shape);
}
function decorativeShapeToTextBox(shape, transform) {
    var _a, _b;
    const style = (_a = getAttribute(shape, null, 'style')) !== null && _a !== void 0 ? _a : '';
    const decls = parseVmlStyle(style);
    const size = transform ? transformChildSize(decls, transform) : parseVmlShapeSize(shape);
    const position = transform
        ? transformChildPosition(decls, transform)
        : parseVmlShapePosition(shape, decls);
    const fill = parseFillForShape(shape);
    const outline = parseOutlineForShape(shape);
    const wrap = transform ? transform.wrap : parseVmlBehindWrap(decls);
    const id = (_b = getAttribute(shape, null, 'id')) !== null && _b !== void 0 ? _b : undefined;
    return {
        type: 'textBox',
        id,
        size,
        position,
        wrap,
        fill,
        outline,
        // Decorative shapes (box-border rects, dividers) are pure fill with no text
        // inset — zero margins so a ~0.6px hairline rect isn't floored to its 8px
        // default vertical padding under box-sizing:border-box (#18).
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        // Schema requires (paragraph | table)+ — emit one empty paragraph
        // so the textBox node is valid; the renderer paints fill + outline
        // regardless of inner content.
        content: [buildEmptyParagraph()],
    };
}
function parseCoordPair(value) {
    if (!value)
        return null;
    const parts = value.split(',');
    if (parts.length !== 2)
        return null;
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return null;
    return [a, b];
}
function buildGroupTransform(groupEl) {
    var _a, _b;
    const style = (_a = getAttribute(groupEl, null, 'style')) !== null && _a !== void 0 ? _a : '';
    const decls = parseVmlStyle(style);
    const groupWidthEmu = lengthDeclToEmu(decls.get('width'));
    const groupHeightEmu = lengthDeclToEmu(decls.get('height'));
    const origin = (_b = parseCoordPair(getAttribute(groupEl, null, 'coordorigin'))) !== null && _b !== void 0 ? _b : [0, 0];
    const coordSize = parseCoordPair(getAttribute(groupEl, null, 'coordsize'));
    // Scale = page-EMU span / coordinate-unit span. Falls back to 1 (identity)
    // when either side is missing so children at least land at the origin.
    const scaleX = coordSize && coordSize[0] !== 0 && groupWidthEmu !== null ? groupWidthEmu / coordSize[0] : 1;
    const scaleY = coordSize && coordSize[1] !== 0 && groupHeightEmu !== null ? groupHeightEmu / coordSize[1] : 1;
    return {
        leftEmu: lengthDeclToEmu(decls.get('margin-left')),
        topEmu: lengthDeclToEmu(decls.get('margin-top')),
        position: parseVmlShapePosition(groupEl, decls),
        wrap: parseVmlBehindWrap(decls),
        originX: origin[0],
        originY: origin[1],
        scaleX,
        scaleY,
    };
}
/**
 * A child of a `<v:group>` carries its geometry as bare numbers in the
 * group's coordinate space (NOT twips), e.g. `left:0;top:0;width:9131`.
 * Read them as plain floats — the transform converts to page EMU.
 */
function childCoordValue(value) {
    if (!value)
        return null;
    const num = parseFloat(value.trim());
    return Number.isFinite(num) ? num : null;
}
function transformChildSize(decls, t) {
    const cw = childCoordValue(decls.get('width'));
    const ch = childCoordValue(decls.get('height'));
    return {
        width: cw !== null ? Math.max(1, Math.round(cw * t.scaleX)) : 0,
        height: ch !== null ? Math.max(1, Math.round(ch * t.scaleY)) : 0,
    };
}
function transformChildPosition(decls, t) {
    var _a, _b, _c, _d, _e, _f;
    // No anchoring frame from the group → nothing meaningful to offset against.
    if (!t.position)
        return undefined;
    const cx = (_a = childCoordValue(decls.get('left'))) !== null && _a !== void 0 ? _a : 0;
    const cy = (_b = childCoordValue(decls.get('top'))) !== null && _b !== void 0 ? _b : 0;
    const childLeftEmu = Math.round((cx - t.originX) * t.scaleX);
    const childTopEmu = Math.round((cy - t.originY) * t.scaleY);
    const horizontal = Object.assign({}, t.position.horizontal);
    const vertical = Object.assign({}, t.position.vertical);
    // Add the child's in-group offset to the group's page offset. Only adjust
    // posOffset-style anchoring; alignment-anchored groups keep their alignment.
    if (horizontal.alignment === undefined) {
        horizontal.posOffset = ((_d = (_c = t.leftEmu) !== null && _c !== void 0 ? _c : horizontal.posOffset) !== null && _d !== void 0 ? _d : 0) + childLeftEmu;
    }
    if (vertical.alignment === undefined) {
        vertical.posOffset = ((_f = (_e = t.topEmu) !== null && _e !== void 0 ? _e : vertical.posOffset) !== null && _f !== void 0 ? _f : 0) + childTopEmu;
    }
    return { horizontal, vertical };
}
/**
 * Parse a `<w:pict>` into ALL the VML shapes it carries, expanding any
 * `<v:group>` into its individual children with the group's coordinate
 * transform applied. Text-frame shapes (`#_x0000_t202`) get their inner
 * `<w:txbxContent>` parsed; decorative `<v:rect>` / `<v:oval>` / `<v:line>`
 * become styled rectangles.
 *
 * This is the multi-shape entry point the enricher uses; the older
 * single-shape `parseVmlTextBox` / `parseVmlDecorativeShape` remain for
 * callers that only need the first shape (and the `isVml*Pict` probes).
 */
export function parseVmlShapes(pictEl, parseParagraph) {
    var _a;
    const out = [];
    for (const child of getChildElements(pictEl)) {
        const local = getLocalName((_a = child.name) !== null && _a !== void 0 ? _a : '');
        if (local === 'group') {
            collectGroupShapes(child, buildGroupTransform(child), parseParagraph, out);
            continue;
        }
        if (local === 'shape' && isTextBoxShape(child)) {
            const tb = textBoxShapeToTextBox(child, parseParagraph, undefined);
            if (tb)
                out.push(tb);
            continue;
        }
        if (VML_DECORATIVE_TAGS.has(local)) {
            out.push(decorativeShapeToTextBox(child, undefined));
        }
    }
    return out;
}
function collectGroupShapes(groupEl, transform, parseParagraph, out) {
    var _a;
    for (const child of getChildElements(groupEl)) {
        const local = getLocalName((_a = child.name) !== null && _a !== void 0 ? _a : '');
        if (local === 'group') {
            // Nested group — compose transforms by chaining the outer onto a
            // fresh inner transform. Simplest faithful approach: recurse with the
            // inner group's own transform; the inner group's page offset already
            // derives from its style. (Deep nesting is rare in real docs.)
            collectGroupShapes(child, buildGroupTransform(child), parseParagraph, out);
            continue;
        }
        if (local === 'shape' && isTextBoxShape(child)) {
            const tb = textBoxShapeToTextBox(child, parseParagraph, transform);
            if (tb)
                out.push(tb);
            continue;
        }
        if (VML_DECORATIVE_TAGS.has(local)) {
            out.push(decorativeShapeToTextBox(child, transform));
        }
    }
}
/**
 * Convert a single `<v:shape type="#_x0000_t202">` text-frame element to a
 * TextBox, optionally applying a group transform to its size/position.
 */
function textBoxShapeToTextBox(shape, parseParagraph, transform) {
    var _a, _b, _c;
    const textBoxEl = findChild(shape, 'v', 'textbox');
    if (!textBoxEl)
        return null;
    const txbxContent = findDeep(textBoxEl, 'w', 'txbxContent');
    if (!txbxContent)
        return null;
    const content = [];
    for (const child of getChildElements(txbxContent)) {
        if (getLocalName((_a = child.name) !== null && _a !== void 0 ? _a : '') === 'p') {
            content.push(parseParagraph(child, null, null, null, null));
        }
    }
    const style = (_b = getAttribute(shape, null, 'style')) !== null && _b !== void 0 ? _b : '';
    const decls = parseVmlStyle(style);
    const size = transform ? transformChildSize(decls, transform) : parseVmlShapeSize(shape);
    const position = transform
        ? transformChildPosition(decls, transform)
        : parseVmlShapePosition(shape, decls);
    // Behind-text wrap: a grouped child inherits the group's z-index<0; an
    // ungrouped shape carries its own.
    const wrap = transform ? transform.wrap : parseVmlBehindWrap(decls);
    const id = (_c = getAttribute(shape, null, 'id')) !== null && _c !== void 0 ? _c : undefined;
    return {
        type: 'textBox',
        id,
        size,
        position,
        wrap,
        content,
    };
}
//# sourceMappingURL=vmlTextBoxParser.js.map