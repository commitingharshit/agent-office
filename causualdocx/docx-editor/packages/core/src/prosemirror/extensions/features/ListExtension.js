/**
 * List Extension — list commands + keymaps
 *
 * No schema contribution — lists use paragraph attrs (numPr).
 * Provides: toggle bullet/number, indent/outdent, enter/backspace handling.
 */
import { createExtension } from '../create';
import { Priority } from '../types';
// ============================================================================
// CHAIN COMMANDS HELPER
// ============================================================================
function chainCommands(...commands) {
    return (state, dispatch, view) => {
        for (const cmd of commands) {
            if (cmd(state, dispatch, view)) {
                return true;
            }
        }
        return false;
    };
}
// ============================================================================
// LIST COMMANDS
// ============================================================================
function toggleList(numId) {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;
        const paragraph = $from.parent;
        if (paragraph.type.name !== 'paragraph')
            return false;
        const currentNumPr = paragraph.attrs.numPr;
        const isInSameList = (currentNumPr === null || currentNumPr === void 0 ? void 0 : currentNumPr.numId) === numId;
        if (!dispatch)
            return true;
        let tr = state.tr;
        const seen = new Set();
        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            var _a;
            if (node.type.name === 'paragraph' && !seen.has(pos)) {
                seen.add(pos);
                if (isInSameList) {
                    tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { numPr: null, listIsBullet: null, listNumFmt: null, listMarker: null }));
                }
                else {
                    const isBullet = numId === 1;
                    tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { numPr: { numId, ilvl: ((_a = node.attrs.numPr) === null || _a === void 0 ? void 0 : _a.ilvl) || 0 }, listIsBullet: isBullet, listNumFmt: isBullet ? null : 'decimal', listMarker: null }));
                }
            }
        });
        dispatch(tr.scrollIntoView());
        return true;
    };
}
const toggleBulletList = (state, dispatch) => {
    return toggleList(1)(state, dispatch);
};
const toggleNumberedList = (state, dispatch) => {
    return toggleList(2)(state, dispatch);
};
// Both indent/outdent commands walk the selection so that multi-paragraph
// selections affect every list item, not just the one under the cursor —
// matches Word's Tab / Shift+Tab behavior. The keymap-bound
// `increaseListIndent` / `decreaseListIndent` further down already do
// this; the toolbar entry points used to act only on `$from.parent` and
// silently no-op'd every other selected item.
const increaseListLevel = (state, dispatch) => {
    const { $from, $to } = state.selection;
    const targets = [];
    const seen = new Set();
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name !== 'paragraph' || !node.attrs.numPr || seen.has(pos))
            return;
        seen.add(pos);
        const currentLevel = node.attrs.numPr.ilvl || 0;
        if (currentLevel >= 8)
            return;
        targets.push({ pos, attrs: node.attrs, newLevel: currentLevel + 1 });
    });
    if (targets.length === 0)
        return false;
    if (!dispatch)
        return true;
    let tr = state.tr;
    for (const { pos, attrs, newLevel } of targets) {
        tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), { numPr: Object.assign(Object.assign({}, attrs.numPr), { ilvl: newLevel }), 
            // Clear explicit indentation so the layout engine recomputes from
            // the new level — otherwise the item keeps its old visual indent.
            indentLeft: null, indentFirstLine: null, hangingIndent: null }));
    }
    dispatch(tr.scrollIntoView());
    return true;
};
const decreaseListLevel = (state, dispatch) => {
    const { $from, $to } = state.selection;
    const targets = [];
    const seen = new Set();
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name !== 'paragraph' || !node.attrs.numPr || seen.has(pos))
            return;
        seen.add(pos);
        const currentLevel = node.attrs.numPr.ilvl || 0;
        targets.push({
            pos,
            attrs: node.attrs,
            removeList: currentLevel <= 0,
            newLevel: currentLevel - 1,
        });
    });
    if (targets.length === 0)
        return false;
    if (!dispatch)
        return true;
    let tr = state.tr;
    for (const { pos, attrs, removeList, newLevel } of targets) {
        if (removeList) {
            tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), { numPr: null, listIsBullet: null, listNumFmt: null, listMarker: null, indentLeft: null, indentFirstLine: null, hangingIndent: null }));
        }
        else {
            tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), { numPr: Object.assign(Object.assign({}, attrs.numPr), { ilvl: newLevel }), indentLeft: null, indentFirstLine: null, hangingIndent: null }));
        }
    }
    dispatch(tr.scrollIntoView());
    return true;
};
const removeList = (state, dispatch) => {
    const { $from, $to } = state.selection;
    if (!dispatch)
        return true;
    let tr = state.tr;
    const seen = new Set();
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === 'paragraph' && node.attrs.numPr && !seen.has(pos)) {
            seen.add(pos);
            tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, node.attrs), { numPr: null, listIsBullet: null, listNumFmt: null, listMarker: null }));
        }
    });
    dispatch(tr.scrollIntoView());
    return true;
};
// ============================================================================
// LIST QUERY HELPERS (exported for toolbar)
// ============================================================================
export function isInList(state) {
    var _a;
    const { $from } = state.selection;
    const paragraph = $from.parent;
    if (paragraph.type.name !== 'paragraph')
        return false;
    return !!((_a = paragraph.attrs.numPr) === null || _a === void 0 ? void 0 : _a.numId);
}
export function getListInfo(state) {
    var _a;
    const { $from } = state.selection;
    const paragraph = $from.parent;
    if (paragraph.type.name !== 'paragraph')
        return null;
    if (!((_a = paragraph.attrs.numPr) === null || _a === void 0 ? void 0 : _a.numId))
        return null;
    return {
        numId: paragraph.attrs.numPr.numId,
        ilvl: paragraph.attrs.numPr.ilvl || 0,
    };
}
// ============================================================================
// KEYMAP COMMANDS
// ============================================================================
function exitListOnEmptyEnter() {
    return (state, dispatch) => {
        const { $from, empty } = state.selection;
        if (!empty)
            return false;
        const paragraph = $from.parent;
        if (paragraph.type.name !== 'paragraph')
            return false;
        const numPr = paragraph.attrs.numPr;
        if (!numPr)
            return false;
        if (paragraph.textContent.length > 0)
            return false;
        if (dispatch) {
            const tr = state.tr.setNodeMarkup($from.before(), undefined, Object.assign(Object.assign({}, paragraph.attrs), { numPr: null, listIsBullet: null, listNumFmt: null, listMarker: null }));
            dispatch(tr);
        }
        return true;
    };
}
function splitListItem() {
    return (state, dispatch) => {
        const { $from, empty } = state.selection;
        if (!empty)
            return false;
        const paragraph = $from.parent;
        if (paragraph.type.name !== 'paragraph')
            return false;
        const numPr = paragraph.attrs.numPr;
        if (!numPr)
            return false;
        if (dispatch) {
            const { tr } = state;
            const pos = $from.pos;
            tr.split(pos, 1, [{ type: state.schema.nodes.paragraph, attrs: Object.assign({}, paragraph.attrs) }]);
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}
function backspaceExitList() {
    return (state, dispatch) => {
        const { $from, empty } = state.selection;
        if (!empty)
            return false;
        if ($from.parentOffset !== 0)
            return false;
        const paragraph = $from.parent;
        if (paragraph.type.name !== 'paragraph')
            return false;
        const numPr = paragraph.attrs.numPr;
        if (!numPr)
            return false;
        if (dispatch) {
            const tr = state.tr.setNodeMarkup($from.before(), undefined, Object.assign(Object.assign({}, paragraph.attrs), { numPr: null, listIsBullet: null, listNumFmt: null, listMarker: null }));
            dispatch(tr);
        }
        return true;
    };
}
function increaseListIndent() {
    return (state, dispatch) => {
        var _a;
        const { $from, $to } = state.selection;
        // Collect all list paragraphs in the selection range
        const positions = [];
        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            var _a;
            if (node.type.name === 'paragraph' && node.attrs.numPr) {
                const currentLevel = (_a = node.attrs.numPr.ilvl) !== null && _a !== void 0 ? _a : 0;
                if (currentLevel < 8) {
                    positions.push({ pos, attrs: node.attrs });
                }
            }
        });
        if (positions.length === 0)
            return false;
        if (dispatch) {
            let tr = state.tr;
            for (const { pos, attrs } of positions) {
                const numPr = attrs.numPr;
                tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), { numPr: Object.assign(Object.assign({}, numPr), { ilvl: ((_a = numPr.ilvl) !== null && _a !== void 0 ? _a : 0) + 1 }), indentLeft: null, indentFirstLine: null, hangingIndent: null }));
            }
            dispatch(tr);
        }
        return true;
    };
}
function decreaseListIndent() {
    return (state, dispatch) => {
        var _a;
        const { $from, $to } = state.selection;
        // Collect all list paragraphs in the selection range
        const positions = [];
        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type.name === 'paragraph' && node.attrs.numPr) {
                positions.push({ pos, attrs: node.attrs });
            }
        });
        if (positions.length === 0)
            return false;
        if (dispatch) {
            let tr = state.tr;
            for (const { pos, attrs } of positions) {
                const numPr = attrs.numPr;
                const currentLevel = (_a = numPr.ilvl) !== null && _a !== void 0 ? _a : 0;
                if (currentLevel <= 0) {
                    tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), { numPr: null, listIsBullet: null, listNumFmt: null, listMarker: null, indentLeft: null, indentFirstLine: null, hangingIndent: null }));
                }
                else {
                    tr = tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, attrs), { numPr: Object.assign(Object.assign({}, numPr), { ilvl: currentLevel - 1 }), indentLeft: null, indentFirstLine: null, hangingIndent: null }));
                }
            }
            dispatch(tr);
        }
        return true;
    };
}
function insertTab() {
    return (state, dispatch) => {
        const { schema } = state;
        const tabType = schema.nodes.tab;
        if (!tabType) {
            return false;
        }
        if (dispatch) {
            const tr = state.tr.replaceSelectionWith(tabType.create());
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}
// Import goToNextCell/goToPrevCell from table extension for chaining
import { goToNextCell, goToPrevCell } from '../nodes/TableExtension';
// ============================================================================
// EXTENSION
// ============================================================================
export const ListExtension = createExtension({
    name: 'list',
    priority: Priority.High, // Must be before base keymap
    onSchemaReady() {
        return {
            commands: {
                toggleBulletList: () => toggleBulletList,
                toggleNumberedList: () => toggleNumberedList,
                increaseListLevel: () => increaseListLevel,
                decreaseListLevel: () => decreaseListLevel,
                removeList: () => removeList,
            },
            keyboardShortcuts: {
                Tab: chainCommands(goToNextCell(), increaseListIndent(), insertTab()),
                'Shift-Tab': chainCommands(goToPrevCell(), decreaseListIndent()),
                'Shift-Enter': () => false, // Let base keymap handle this
                Enter: chainCommands(exitListOnEmptyEnter(), splitListItem()),
                Backspace: backspaceExitList(),
                // Google Docs list shortcuts
                'Mod-Shift-7': toggleNumberedList,
                'Mod-Shift-8': toggleBulletList,
                // Indent / outdent for paragraphs (works inside or outside lists —
                // increaseListLevel handles both via the existing list-aware path).
                'Mod-]': increaseListLevel,
                'Mod-[': decreaseListLevel,
            },
        };
    },
});
//# sourceMappingURL=ListExtension.js.map