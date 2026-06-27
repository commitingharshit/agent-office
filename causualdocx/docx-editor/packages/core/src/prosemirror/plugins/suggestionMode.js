/**
 * Suggestion Mode Plugin
 *
 * When active, intercepts all text insertions and deletions,
 * wrapping them in tracked change marks (insertion/deletion)
 * instead of modifying the document directly.
 *
 * - Typed text is marked as insertion (green underline)
 * - Deleted text is NOT removed — it's marked as deletion (red strikethrough)
 * - Text already marked as insertion by the current author is deleted normally
 *   (retracting your own suggestion)
 */
import { Plugin, PluginKey, TextSelection, } from 'prosemirror-state';
export const suggestionModeKey = new PluginKey('suggestionMode');
const SUGGESTION_META = 'suggestionModeApplied';
let nextRevisionId = Date.now();
function makeMarkAttrs(pluginState) {
    return {
        revisionId: nextRevisionId++,
        author: pluginState.author,
        date: new Date().toISOString(),
    };
}
/**
 * Find an adjacent mark of the same type by the same author.
 * Reuses its revisionId so consecutive edits group into one change.
 */
function findAdjacentRevision(doc, pos, markTypeName, author) {
    try {
        const $pos = doc.resolve(pos);
        for (const node of [$pos.nodeBefore, $pos.nodeAfter]) {
            if (node === null || node === void 0 ? void 0 : node.isText) {
                const mark = node.marks.find((m) => m.type.name === markTypeName && m.attrs.author === author);
                if (mark)
                    return mark.attrs;
            }
        }
    }
    catch (_a) {
        /* position out of range */
    }
    return null;
}
/**
 * Find an adjacent revision at either edge of a range.
 * This keeps consecutive backspaces grouped even though the cursor moves left.
 */
function findAdjacentRevisionForRange(doc, from, to, markTypeName, author) {
    var _a;
    return ((_a = findAdjacentRevision(doc, from, markTypeName, author)) !== null && _a !== void 0 ? _a : findAdjacentRevision(doc, to, markTypeName, author));
}
/**
 * Walk a text range and either mark as deletion or retract own insertions.
 * Processes in reverse order to maintain position validity.
 */
function markRangeAsDeleted(tr, doc, from, to, insertionType, deletionType, pluginState) {
    const ranges = [];
    doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText)
            return;
        const start = Math.max(pos, from);
        const end = Math.min(pos + node.nodeSize, to);
        if (start >= end)
            return;
        const isOwnInsert = node.marks.some((m) => m.type === insertionType && m.attrs.author === pluginState.author);
        ranges.push({ from: start, to: end, isOwnInsert });
    });
    if (ranges.length === 0)
        return;
    const delAttrs = findAdjacentRevisionForRange(doc, from, to, 'deletion', pluginState.author) ||
        makeMarkAttrs(pluginState);
    for (let i = ranges.length - 1; i >= 0; i--) {
        const range = ranges[i];
        if (range.isOwnInsert) {
            tr.delete(range.from, range.to);
        }
        else {
            tr.addMark(range.from, range.to, deletionType.create(delAttrs));
        }
    }
}
/**
 * Insert text as a tracked insertion, optionally marking replaced selection as deletion.
 */
function applySuggestionInsert(view, from, to, text, pluginState) {
    const insertionType = view.state.schema.marks.insertion;
    if (!insertionType)
        return false;
    const tr = view.state.tr;
    tr.setMeta(SUGGESTION_META, true);
    const insertAttrs = findAdjacentRevision(view.state.doc, from, 'insertion', pluginState.author) ||
        makeMarkAttrs(pluginState);
    if (from !== to) {
        const deletionType = view.state.schema.marks.deletion;
        if (deletionType) {
            markRangeAsDeleted(tr, view.state.doc, from, to, insertionType, deletionType, pluginState);
        }
    }
    const insertAt = tr.mapping.map(to);
    tr.insertText(text, insertAt, insertAt);
    // Strip inherited deletion marks — new text must never be marked as deleted.
    const deletionType = view.state.schema.marks.deletion;
    if (deletionType) {
        tr.removeMark(insertAt, insertAt + text.length, deletionType);
    }
    // Apply the correct insertion mark. If the cursor was inside an existing
    // insertion by the same author, insertText already inherited that mark and
    // insertAttrs will match — addMark is effectively a no-op that preserves
    // the continuous mark span. We intentionally do NOT removeMark(insertionType)
    // first, because that fragments the mark span and creates a nested change.
    tr.addMark(insertAt, insertAt + text.length, insertionType.create(insertAttrs));
    view.dispatch(tr.scrollIntoView());
    return true;
}
/**
 * Handle delete (forward or backward) in suggestion mode.
 */
function handleSuggestionDelete(state, dispatch, direction) {
    const pluginState = suggestionModeKey.getState(state);
    if (!(pluginState === null || pluginState === void 0 ? void 0 : pluginState.active))
        return false;
    const { $from, $to, empty } = state.selection;
    const insertionType = state.schema.marks.insertion;
    const deletionType = state.schema.marks.deletion;
    if (!insertionType || !deletionType)
        return false;
    if (!dispatch)
        return true;
    const tr = state.tr;
    tr.setMeta(SUGGESTION_META, true);
    // --- Selection delete ---
    if (!empty) {
        markRangeAsDeleted(tr, state.doc, $from.pos, $to.pos, insertionType, deletionType, pluginState);
        // Collapse cursor to after the marked/retracted content
        const cursorPos = tr.mapping.map($to.pos);
        tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos)));
        dispatch(tr.scrollIntoView());
        return true;
    }
    // --- Single character delete ---
    const isBackward = direction === 'backward';
    const deletePos = isBackward ? $from.pos - 1 : $from.pos;
    const deleteEnd = isBackward ? $from.pos : $from.pos + 1;
    if (deletePos < 0 || deleteEnd > state.doc.content.size)
        return true;
    const $deletePos = state.doc.resolve(deletePos);
    const nodeAfter = $deletePos.nodeAfter;
    // At block boundary — let default behavior handle (e.g. join paragraphs)
    if (!(nodeAfter === null || nodeAfter === void 0 ? void 0 : nodeAfter.isText))
        return false;
    const hasOwnInsertion = nodeAfter.marks.some((m) => m.type === insertionType && m.attrs.author === pluginState.author);
    const hasDeletion = nodeAfter.marks.some((m) => m.type === deletionType);
    if (hasDeletion) {
        // Already deleted — skip cursor past it
        const newPos = isBackward ? deletePos : deleteEnd;
        tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
    }
    else if (hasOwnInsertion) {
        // Retract own insertion — actually delete the character
        tr.delete(deletePos, deleteEnd);
    }
    else {
        // Mark as deletion instead of removing
        const delAttrs = findAdjacentRevisionForRange(state.doc, deletePos, deleteEnd, 'deletion', pluginState.author) || makeMarkAttrs(pluginState);
        tr.addMark(deletePos, deleteEnd, deletionType.create(delAttrs));
        // Move cursor past the deletion mark
        const newPos = isBackward ? deletePos : deleteEnd;
        tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
    }
    dispatch(tr.scrollIntoView());
    return true;
}
/**
 * Create the suggestion mode plugin.
 * When active, text edits become tracked changes.
 */
export function createSuggestionModePlugin(initialActive = false, author = 'User') {
    return new Plugin({
        key: suggestionModeKey,
        state: {
            init() {
                return { active: initialActive, author };
            },
            apply(tr, state) {
                const meta = tr.getMeta(suggestionModeKey);
                if (meta) {
                    return Object.assign(Object.assign({}, state), meta);
                }
                return state;
            },
        },
        props: {
            handleDOMEvents: {
                // Intercept text input at the DOM level. ProseMirror's handleTextInput
                // is NOT reliably called when the hidden PM has complex mark structures
                // (it requires the change to span exactly one text node). By handling
                // beforeinput directly, we ensure suggestion mode always processes input.
                beforeinput(view, event) {
                    const pluginState = suggestionModeKey.getState(view.state);
                    if (!(pluginState === null || pluginState === void 0 ? void 0 : pluginState.active))
                        return false;
                    if (event.inputType === 'insertText' && event.data) {
                        event.preventDefault();
                        const { from, to } = view.state.selection;
                        return applySuggestionInsert(view, from, to, event.data, pluginState);
                    }
                    return false;
                },
            },
            // Intercept Backspace and Delete to mark as deletion
            handleKeyDown(view, event) {
                const pluginState = suggestionModeKey.getState(view.state);
                if (!(pluginState === null || pluginState === void 0 ? void 0 : pluginState.active))
                    return false;
                if (event.key === 'Backspace') {
                    return handleSuggestionDelete(view.state, view.dispatch, 'backward');
                }
                if (event.key === 'Delete') {
                    return handleSuggestionDelete(view.state, view.dispatch, 'forward');
                }
                return false;
            },
            // Backup: also handle via PM's handleTextInput for simple cases
            handleTextInput(view, from, to, text) {
                const pluginState = suggestionModeKey.getState(view.state);
                if (!(pluginState === null || pluginState === void 0 ? void 0 : pluginState.active))
                    return false;
                return applySuggestionInsert(view, from, to, text, pluginState);
            },
        },
        // Catch-all: mark any unhandled new content (e.g. paste) as insertion
        appendTransaction(transactions, _oldState, newState) {
            const pluginState = suggestionModeKey.getState(newState);
            if (!(pluginState === null || pluginState === void 0 ? void 0 : pluginState.active))
                return null;
            const userTr = transactions.find((tr) => tr.docChanged && !tr.getMeta(SUGGESTION_META));
            if (!userTr)
                return null;
            const insertionType = newState.schema.marks.insertion;
            if (!insertionType)
                return null;
            const markAttrs = makeMarkAttrs(pluginState);
            const tr = newState.tr;
            tr.setMeta(SUGGESTION_META, true);
            const deletionType = newState.schema.marks.deletion;
            userTr.steps.forEach((step) => {
                const stepMap = step.getMap();
                stepMap.forEach((_oldFrom, _oldTo, newFrom, newTo) => {
                    if (newTo > newFrom) {
                        // Only mark text nodes that don't already have tracked change marks.
                        // Marking the entire range would overwrite existing marks from other authors.
                        newState.doc.nodesBetween(newFrom, newTo, (node, pos) => {
                            if (!node.isText)
                                return;
                            const hasTrackedMark = node.marks.some((m) => m.type === insertionType || (deletionType && m.type === deletionType));
                            if (!hasTrackedMark) {
                                const nodeStart = Math.max(pos, newFrom);
                                const nodeEnd = Math.min(pos + node.nodeSize, newTo);
                                tr.addMark(nodeStart, nodeEnd, insertionType.create(markAttrs));
                            }
                        });
                    }
                });
            });
            return tr.steps.length > 0 ? tr : null;
        },
    });
}
/**
 * Toggle suggestion mode on/off.
 */
export function toggleSuggestionMode(state, dispatch) {
    const current = suggestionModeKey.getState(state);
    if (!current)
        return false;
    if (dispatch) {
        const tr = state.tr.setMeta(suggestionModeKey, {
            active: !current.active,
        });
        dispatch(tr);
    }
    return true;
}
/**
 * Set suggestion mode active state and author.
 */
export function setSuggestionMode(active, state, dispatch, author) {
    if (dispatch) {
        const meta = { active };
        if (author !== undefined)
            meta.author = author;
        const tr = state.tr.setMeta(suggestionModeKey, meta);
        dispatch(tr);
    }
    return true;
}
/**
 * Check if suggestion mode is currently active.
 */
export function isSuggestionModeActive(state) {
    var _a, _b;
    return (_b = (_a = suggestionModeKey.getState(state)) === null || _a === void 0 ? void 0 : _a.active) !== null && _b !== void 0 ? _b : false;
}
//# sourceMappingURL=suggestionMode.js.map