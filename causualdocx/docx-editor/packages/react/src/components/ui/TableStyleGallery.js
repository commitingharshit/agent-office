import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Table Style Gallery
 *
 * Visual gallery of predefined table styles. Each style shows a small
 * preview grid with the styling applied. Clicking a style applies it
 * to the current table via applyTableStyle command.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { useTranslation } from '../../i18n';
const border1 = (rgb) => ({ style: 'single', size: 4, color: { rgb } });
/**
 * Built-in table style presets (matching common Word styles)
 */
const BUILTIN_STYLES = [
    {
        id: 'TableNormal',
        name: 'Normal Table',
        look: { firstRow: false, lastRow: false, noHBand: true, noVBand: true },
    },
    {
        id: 'TableGrid',
        name: 'Table Grid',
        tableBorders: {
            top: border1('000000'),
            bottom: border1('000000'),
            left: border1('000000'),
            right: border1('000000'),
            insideH: border1('000000'),
            insideV: border1('000000'),
        },
        look: { firstRow: false, lastRow: false, noHBand: true, noVBand: true },
    },
    {
        id: 'TableGridLight',
        name: 'Grid Table Light',
        tableBorders: {
            top: border1('BFBFBF'),
            bottom: border1('BFBFBF'),
            left: border1('BFBFBF'),
            right: border1('BFBFBF'),
            insideH: border1('BFBFBF'),
            insideV: border1('BFBFBF'),
        },
        look: { firstRow: true, lastRow: false, noHBand: true, noVBand: true },
        conditionals: {
            firstRow: { bold: true, borders: { bottom: border1('000000') } },
        },
    },
    {
        id: 'PlainTable1',
        name: 'Plain Table 1',
        tableBorders: {
            top: border1('BFBFBF'),
            bottom: border1('BFBFBF'),
            insideH: border1('BFBFBF'),
        },
        look: { firstRow: true, lastRow: false, noHBand: true, noVBand: true },
        conditionals: {
            firstRow: { bold: true },
        },
    },
    {
        id: 'PlainTable2',
        name: 'Plain Table 2',
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, borders: { bottom: border1('7F7F7F') } },
            band1Horz: { backgroundColor: '#F2F2F2' },
        },
    },
    {
        id: 'PlainTable3',
        name: 'Plain Table 3',
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#A5A5A5' },
            band1Horz: { backgroundColor: '#E7E7E7' },
        },
    },
    {
        id: 'PlainTable4',
        name: 'Plain Table 4',
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#000000' },
            band1Horz: { backgroundColor: '#F2F2F2' },
        },
    },
    {
        id: 'GridTable1Light-Accent1',
        name: 'Grid Table 1 Light',
        tableBorders: {
            top: border1('B4C6E7'),
            bottom: border1('B4C6E7'),
            left: border1('B4C6E7'),
            right: border1('B4C6E7'),
            insideH: border1('B4C6E7'),
            insideV: border1('B4C6E7'),
        },
        look: { firstRow: true, lastRow: false, noHBand: true, noVBand: true },
        conditionals: {
            firstRow: { bold: true, borders: { bottom: border1('4472C4') } },
        },
    },
    {
        id: 'GridTable4-Accent1',
        name: 'Grid Table 4 Accent 1',
        tableBorders: {
            top: border1('4472C4'),
            bottom: border1('4472C4'),
            left: border1('4472C4'),
            right: border1('4472C4'),
            insideH: border1('4472C4'),
            insideV: border1('4472C4'),
        },
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#4472C4' },
            band1Horz: { backgroundColor: '#D6E4F0' },
        },
    },
    {
        id: 'GridTable5Dark-Accent1',
        name: 'Grid Table 5 Dark',
        tableBorders: {
            top: border1('FFFFFF'),
            bottom: border1('FFFFFF'),
            left: border1('FFFFFF'),
            right: border1('FFFFFF'),
            insideH: border1('FFFFFF'),
            insideV: border1('FFFFFF'),
        },
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#4472C4' },
            band1Horz: { backgroundColor: '#D6E4F0' },
            band2Horz: { backgroundColor: '#B4C6E7' },
        },
    },
    {
        id: 'ListTable3-Accent2',
        name: 'List Table 3 Accent 2',
        tableBorders: {
            top: border1('ED7D31'),
            bottom: border1('ED7D31'),
        },
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#ED7D31' },
            band1Horz: { backgroundColor: '#FBE4D5' },
        },
    },
    {
        id: 'ListTable4-Accent3',
        name: 'List Table 4 Accent 3',
        tableBorders: {
            top: border1('A5A5A5'),
            bottom: border1('A5A5A5'),
            insideH: border1('A5A5A5'),
        },
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#A5A5A5' },
            band1Horz: { backgroundColor: '#EDEDED' },
        },
    },
    {
        id: 'GridTable4-Accent5',
        name: 'Grid Table 4 Accent 5',
        tableBorders: {
            top: border1('5B9BD5'),
            bottom: border1('5B9BD5'),
            left: border1('5B9BD5'),
            right: border1('5B9BD5'),
            insideH: border1('5B9BD5'),
            insideV: border1('5B9BD5'),
        },
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#5B9BD5' },
            band1Horz: { backgroundColor: '#DEEAF6' },
        },
    },
    {
        id: 'GridTable4-Accent6',
        name: 'Grid Table 4 Accent 6',
        tableBorders: {
            top: border1('70AD47'),
            bottom: border1('70AD47'),
            left: border1('70AD47'),
            right: border1('70AD47'),
            insideH: border1('70AD47'),
            insideV: border1('70AD47'),
        },
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
        conditionals: {
            firstRow: { bold: true, color: '#FFFFFF', backgroundColor: '#70AD47' },
            band1Horz: { backgroundColor: '#E2EFDA' },
        },
    },
];
// ============================================================================
// STYLE PREVIEW COMPONENT
// ============================================================================
const PREVIEW_ROWS = 4;
const PREVIEW_COLS = 3;
function borderToCSS(border) {
    var _a;
    if (!border || border.style === 'none')
        return 'none';
    const width = border.size ? Math.max(1, Math.round(border.size / 8)) : 1;
    const color = ((_a = border.color) === null || _a === void 0 ? void 0 : _a.rgb) ? `#${border.color.rgb}` : '#000';
    return `${width}px solid ${color}`;
}
function StylePreview({ preset, isSelected, onClick, }) {
    var _a, _b, _c, _d, _e;
    const look = (_a = preset.look) !== null && _a !== void 0 ? _a : {};
    const conditionals = (_b = preset.conditionals) !== null && _b !== void 0 ? _b : {};
    const tb = preset.tableBorders;
    const cells = [];
    let dataRowIdx = 0;
    for (let r = 0; r < PREVIEW_ROWS; r++) {
        const isFirstRow = r === 0 && !!look.firstRow;
        const isLastRow = r === PREVIEW_ROWS - 1 && !!look.lastRow;
        const bandingEnabled = look.noHBand !== true;
        let condType;
        if (isFirstRow) {
            condType = 'firstRow';
        }
        else if (isLastRow) {
            condType = 'lastRow';
        }
        else if (bandingEnabled) {
            condType = dataRowIdx % 2 === 0 ? 'band1Horz' : 'band2Horz';
            dataRowIdx++;
        }
        else {
            dataRowIdx++;
        }
        for (let c = 0; c < PREVIEW_COLS; c++) {
            let cellCond = condType;
            const isFirstCol = c === 0 && !!look.firstCol;
            const isLastCol = c === PREVIEW_COLS - 1 && !!look.lastCol;
            if (isFirstRow && isFirstCol && conditionals['nwCell'])
                cellCond = 'nwCell';
            else if (isFirstRow && isLastCol && conditionals['neCell'])
                cellCond = 'neCell';
            else if (isLastRow && isFirstCol && conditionals['swCell'])
                cellCond = 'swCell';
            else if (isLastRow && isLastCol && conditionals['seCell'])
                cellCond = 'seCell';
            else if (isFirstCol)
                cellCond = 'firstCol';
            else if (isLastCol)
                cellCond = 'lastCol';
            const cond = cellCond ? conditionals[cellCond] : undefined;
            const style = {
                width: 20,
                height: 10,
                backgroundColor: (_c = cond === null || cond === void 0 ? void 0 : cond.backgroundColor) !== null && _c !== void 0 ? _c : 'transparent',
            };
            // Apply borders
            const sides = ['top', 'bottom', 'left', 'right'];
            const cssSides = ['borderTop', 'borderBottom', 'borderLeft', 'borderRight'];
            for (let i = 0; i < 4; i++) {
                const side = sides[i];
                if ((cond === null || cond === void 0 ? void 0 : cond.borders) && cond.borders[side] !== undefined) {
                    style[cssSides[i]] = borderToCSS(cond.borders[side]);
                }
                else if (tb) {
                    if ((side === 'top' && r > 0) || (side === 'bottom' && r < PREVIEW_ROWS - 1)) {
                        style[cssSides[i]] = borderToCSS((_d = tb.insideH) !== null && _d !== void 0 ? _d : tb[side]);
                    }
                    else if ((side === 'left' && c > 0) || (side === 'right' && c < PREVIEW_COLS - 1)) {
                        style[cssSides[i]] = borderToCSS((_e = tb.insideV) !== null && _e !== void 0 ? _e : tb[side]);
                    }
                    else {
                        style[cssSides[i]] = borderToCSS(tb[side]);
                    }
                }
            }
            cells.push(_jsx("div", { style: style }, `${r}-${c}`));
        }
    }
    return (_jsx("button", { type: "button", onClick: onClick, title: preset.name, style: {
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${PREVIEW_COLS}, 20px)`,
            gridTemplateRows: `repeat(${PREVIEW_ROWS}, 10px)`,
            gap: 0,
            padding: 3,
            border: isSelected ? '2px solid var(--doc-primary)' : '2px solid transparent',
            borderRadius: 3,
            cursor: 'pointer',
            background: 'var(--doc-surface)',
        }, children: cells }));
}
/** Map from built-in style ID to en.json key */
const STYLE_NAME_KEYS = {
    TableNormal: 'table.styles.normalTable',
    TableGrid: 'table.styles.tableGrid',
    TableGridLight: 'table.styles.gridTableLight',
    PlainTable1: 'table.styles.plainTable1',
    PlainTable2: 'table.styles.plainTable2',
    PlainTable3: 'table.styles.plainTable3',
    PlainTable4: 'table.styles.plainTable4',
    'GridTable1Light-Accent1': 'table.styles.gridTable1Light',
    'GridTable4-Accent1': 'table.styles.gridTable4Accent1',
    'GridTable5Dark-Accent1': 'table.styles.gridTable5Dark',
    'ListTable3-Accent2': 'table.styles.listTable3Accent2',
    'ListTable4-Accent3': 'table.styles.listTable4Accent3',
    'GridTable4-Accent5': 'table.styles.gridTable4Accent5',
    'GridTable4-Accent6': 'table.styles.gridTable4Accent6',
};
export function TableStyleGallery({ currentStyleId, documentStyles, onAction, }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredBtn, setHoveredBtn] = useState(false);
    const containerRef = useRef(null);
    // Close on outside click
    useEffect(() => {
        if (!isOpen)
            return;
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    const handleApply = useCallback((styleId) => {
        onAction({ type: 'applyTableStyle', styleId });
        setIsOpen(false);
    }, [onAction]);
    // Merge built-in styles with document styles (document styles override built-in by ID)
    const allPresets = [...BUILTIN_STYLES];
    if (documentStyles) {
        for (const ds of documentStyles) {
            if (ds.type !== 'table')
                continue;
            const existing = allPresets.findIndex((p) => p.id === ds.styleId);
            if (existing === -1) {
                // Convert document style to preset format
                allPresets.push(documentStyleToPreset(ds));
            }
        }
    }
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block' }, children: [_jsxs("button", { type: "button", onClick: () => setIsOpen(!isOpen), onMouseEnter: () => setHoveredBtn(true), onMouseLeave: () => setHoveredBtn(false), title: t('table.styles.title'), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    border: '1px solid var(--doc-border)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    backgroundColor: hoveredBtn ? 'var(--doc-bg-hover)' : 'var(--doc-surface)',
                    fontSize: 12,
                    color: 'var(--doc-text)',
                }, children: [_jsx(MaterialSymbol, { name: "format_paint", size: 16 }), _jsx("span", { children: t('table.styles.label') }), _jsx(MaterialSymbol, { name: "expand_more", size: 14 })] }), isOpen && (_jsx("div", { style: {
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 1000,
                    backgroundColor: 'var(--doc-surface)',
                    border: '1px solid var(--doc-border)',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    maxWidth: 340,
                    maxHeight: 300,
                    overflowY: 'auto',
                }, children: allPresets.map((preset) => {
                    const nameKey = STYLE_NAME_KEYS[preset.id];
                    const translatedPreset = nameKey ? Object.assign(Object.assign({}, preset), { name: t(nameKey) }) : preset;
                    return (_jsx(StylePreview, { preset: translatedPreset, isSelected: currentStyleId === preset.id, onClick: () => handleApply(preset.id) }, preset.id));
                }) }))] }));
}
// ============================================================================
// HELPERS
// ============================================================================
/**
 * Convert a document Style (from styles.xml) to a TableStylePreset
 */
function documentStyleToPreset(style) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const preset = {
        id: style.styleId,
        name: (_a = style.name) !== null && _a !== void 0 ? _a : style.styleId,
        look: { firstRow: true, lastRow: false, noHBand: false, noVBand: true },
    };
    // Convert table borders from style
    if ((_b = style.tblPr) === null || _b === void 0 ? void 0 : _b.borders) {
        const b = style.tblPr.borders;
        preset.tableBorders = {};
        for (const side of ['top', 'bottom', 'left', 'right', 'insideH', 'insideV']) {
            const bs = b[side];
            if (bs) {
                preset.tableBorders[side] = {
                    style: bs.style,
                    size: bs.size,
                    color: ((_c = bs.color) === null || _c === void 0 ? void 0 : _c.rgb) ? { rgb: bs.color.rgb } : undefined,
                };
            }
        }
    }
    // Convert conditional styles
    if (style.tblStylePr) {
        preset.conditionals = {};
        for (const cond of style.tblStylePr) {
            const entry = {};
            if ((_e = (_d = cond.tcPr) === null || _d === void 0 ? void 0 : _d.shading) === null || _e === void 0 ? void 0 : _e.fill) {
                entry.backgroundColor = `#${cond.tcPr.shading.fill}`;
            }
            if ((_f = cond.tcPr) === null || _f === void 0 ? void 0 : _f.borders) {
                entry.borders = {};
                for (const side of ['top', 'bottom', 'left', 'right']) {
                    const bs = cond.tcPr.borders[side];
                    if (bs) {
                        entry.borders[side] = {
                            style: bs.style,
                            size: bs.size,
                            color: ((_g = bs.color) === null || _g === void 0 ? void 0 : _g.rgb) ? { rgb: bs.color.rgb } : undefined,
                        };
                    }
                }
            }
            if ((_h = cond.rPr) === null || _h === void 0 ? void 0 : _h.bold)
                entry.bold = true;
            if ((_k = (_j = cond.rPr) === null || _j === void 0 ? void 0 : _j.color) === null || _k === void 0 ? void 0 : _k.rgb)
                entry.color = `#${cond.rPr.color.rgb}`;
            preset.conditionals[cond.type] = entry;
        }
    }
    return preset;
}
/**
 * Get a built-in style preset by ID (for resolving in DocxEditor)
 */
export function getBuiltinTableStyle(styleId) {
    return BUILTIN_STYLES.find((s) => s.id === styleId);
}
/**
 * Get all built-in presets
 */
export function getBuiltinTableStyles() {
    return BUILTIN_STYLES;
}
//# sourceMappingURL=TableStyleGallery.js.map