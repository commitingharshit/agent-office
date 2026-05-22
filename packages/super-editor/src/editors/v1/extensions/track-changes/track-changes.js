import { Extension } from '@core/Extension.js';
import { Slice } from 'prosemirror-model';
import { Mapping, ReplaceStep, AddMarkStep, RemoveMarkStep } from 'prosemirror-transform';
import { TrackDeleteMarkName, TrackInsertMarkName, TrackFormatMarkName } from './constants.js';
import { TrackChangesBasePlugin, TrackChangesBasePluginKey } from './plugins/index.js';
import { getTrackChanges } from './trackChangesHelpers/getTrackChanges.js';
import { collectTrackedChanges, isTrackedChangeActionAllowed } from './permission-helpers.js';
import { CommentsPluginKey, createOrUpdateTrackedChangeComment } from '../comment/comments-plugin.js';
import { findMarkInRangeBySnapshot } from './trackChangesHelpers/markSnapshotHelpers.js';
import { hasExpandedSelection } from '@utils/selectionUtils.js';
import { compileTrackedEdit } from './review-model/overlap-compiler.js';
import {
  makeTextInsertIntent,
  makeTextDeleteIntent,
  makeTextReplaceIntent,
  sliceFromText,
} from './review-model/edit-intent.js';
import { decideTrackedChanges, buildDecisionBubbleEvents } from './review-model/decision-engine.js';

/**
 * Reads the `replacements` mode from editor.options.trackedChanges.
 * Defaults to `'paired'` when unset; anything other than the exact
 * `'independent'` string is treated as paired to be defensive.
 */
const readReplacementsMode = (editor) =>
  editor?.options?.trackedChanges?.replacements === 'independent' ? 'independent' : 'paired';

/**
 * Runs the atomic decision engine, dispatches the resulting transaction, and
 * emits bubble lifecycle events from the decision receipt.
 */
const dispatchReviewDecision = ({ editor, state, dispatch, decision, target }) => {
  if (editor?.storage?.trackChanges) {
    editor.storage.trackChanges.lastDecisionFailure = null;
  }
  const result = decideTrackedChanges({
    state,
    editor,
    decision,
    target,
    replacements: readReplacementsMode(editor),
  });
  if (!result.ok) {
    // Fail closed (do NOT mutate) for hard errors. NO_OP and
    // CAPABILITY_UNAVAILABLE return `false` so toolbar wrappers can decide
    // how to surface the result.
    if (editor?.storage?.trackChanges) {
      editor.storage.trackChanges.lastDecisionFailure = {
        code: result.code,
        message: result.message,
        details: result.details,
      };
    }
    return { applied: false, failure: result };
  }
  if (dispatch) {
    dispatch(result.tr);
    const events = buildDecisionBubbleEvents({ result, editor });
    if (editor?.emit && events.length) {
      for (const event of events) editor.emit('commentsUpdate', event);
    }
  }
  return { applied: true, result };
};

export const TrackChanges = Extension.create({
  name: 'trackChanges',

  addStorage() {
    return {
      lastCompilerFailure: null,
      lastDecisionFailure: null,
    };
  },

  addCommands() {
    return {
      acceptTrackedChangesBetween:
        (from, to) =>
        ({ state, dispatch, editor }) => {
          const reviewDecision = dispatchReviewDecision({
            editor,
            state,
            dispatch,
            decision: 'accept',
            target: { kind: 'range', from, to },
          });
          if (reviewDecision) return reviewDecision.applied;

          const trackedChanges = collectTrackedChanges({ state, from, to });
          if (!isTrackedChangeActionAllowed({ editor, action: 'accept', trackedChanges })) return false;

          let { tr, doc } = state;

          // if (from === to) {
          //   to += 1;
          // }

          // tr.setMeta('acceptReject', true);
          tr.setMeta('inputType', 'acceptReject');
          const touchedChangeIds = new Set();
          const map = new Mapping();

          doc.nodesBetween(from, to, (node, pos) => {
            const trackedMark = getTrackedMark(node);
            if (!trackedMark) return;

            const mappedFrom = map.map(Math.max(pos, from));
            const mappedTo = map.map(Math.min(pos + node.nodeSize, to));
            if (mappedFrom >= mappedTo) return;

            if (trackedMark.attrs?.id) touchedChangeIds.add(trackedMark.attrs.id);

            if (trackedMark.type.name === TrackDeleteMarkName) {
              const deletionStep = new ReplaceStep(mappedFrom, mappedTo, Slice.empty);
              tr.step(deletionStep);
              map.appendMap(deletionStep.getMap());
              return;
            }

            tr.step(new RemoveMarkStep(mappedFrom, mappedTo, trackedMark));
          });

          return dispatchTrackedChangeResolution({
            state,
            tr,
            dispatch,
            editor,
            touchedChangeIds,
          });
        },

      rejectTrackedChangesBetween:
        (from, to) =>
        ({ state, dispatch, editor }) => {
          const reviewDecision = dispatchReviewDecision({
            editor,
            state,
            dispatch,
            decision: 'reject',
            target: { kind: 'range', from, to },
          });
          if (reviewDecision) return reviewDecision.applied;

          const trackedChanges = collectTrackedChanges({ state, from, to });
          if (!isTrackedChangeActionAllowed({ editor, action: 'reject', trackedChanges })) return false;

          const { tr, doc } = state;
          const touchedChangeIds = new Set();
          tr.setMeta('inputType', 'acceptReject');

          const map = new Mapping();

          doc.nodesBetween(from, to, (node, pos) => {
            const trackedMark = getTrackedMark(node);
            if (!trackedMark) return;

            const mappedFrom = map.map(Math.max(pos, from));
            const mappedTo = map.map(Math.min(pos + node.nodeSize, to));
            if (mappedFrom >= mappedTo) return;

            if (trackedMark.attrs?.id) touchedChangeIds.add(trackedMark.attrs.id);

            if (trackedMark.type.name === TrackDeleteMarkName) {
              tr.step(new RemoveMarkStep(mappedFrom, mappedTo, trackedMark));
              return;
            }

            if (trackedMark.type.name === TrackInsertMarkName) {
              const deletionStep = new ReplaceStep(mappedFrom, mappedTo, Slice.empty);
              tr.step(deletionStep);
              map.appendMap(deletionStep.getMap());
              return;
            }

            trackedMark.attrs.after.forEach((newMark) => {
              const liveMark = findMarkInRangeBySnapshot({
                doc: tr.doc,
                from: mappedFrom,
                to: mappedTo,
                snapshot: newMark,
              });

              if (!liveMark) {
                return;
              }

              tr.step(new RemoveMarkStep(mappedFrom, mappedTo, liveMark));
            });

            // Remove suggested "after" marks first, then restore "before" marks.
            // This avoids overlap matching removing a just-restored attribute-only mark (e.g. textStyle).
            trackedMark.attrs.before.forEach((oldMark) => {
              tr.step(new AddMarkStep(mappedFrom, mappedTo, state.schema.marks[oldMark.type].create(oldMark.attrs)));
            });

            tr.step(new RemoveMarkStep(mappedFrom, mappedTo, trackedMark));
          });

          return dispatchTrackedChangeResolution({
            state,
            tr,
            dispatch,
            editor,
            touchedChangeIds,
          });
        },

      acceptTrackedChange:
        ({ trackedChange }) =>
        ({ commands }) => {
          const { start: from, end: to } = trackedChange;
          return commands.acceptTrackedChangesBetween(from, to);
        },

      acceptTrackedChangeBySelection:
        () =>
        ({ state, commands }) => {
          const { from, to } = state.selection;
          return commands.acceptTrackedChangesBetween(from, to);
        },

      acceptTrackedChangeFromToolbar:
        () =>
        ({ state, commands, editor }) => {
          return resolveTrackedChangeAction({
            action: 'accept',
            state,
            commands,
            editor,
            ...getTrackedChangeResolutionContext({
              state,
              trackedChangeId: CommentsPluginKey.getState(state)?.activeThreadId,
            }),
          });
        },

      acceptTrackedChangeFromContextMenu:
        ({ from, to, trackedChangeId = null } = {}) =>
        ({ state, commands, editor }) => {
          return resolveTrackedChangeAction({
            action: 'accept',
            state,
            commands,
            editor,
            selection:
              Number.isFinite(from) && Number.isFinite(to)
                ? {
                    from,
                    to,
                  }
                : null,
            ...getTrackedChangeResolutionContext({ state, trackedChangeId }),
          });
        },

      acceptTrackedChangeById:
        (id) =>
        ({ state, tr, dispatch, editor, commands }) => {
          const reviewDecision = dispatchReviewDecision({
            editor,
            state,
            dispatch,
            decision: 'accept',
            target: { kind: 'id', id },
          });
          if (reviewDecision) return reviewDecision.applied;

          const toResolve = getChangesByIdToResolve(state, id) || [];

          return toResolve
            .map(({ from, to }) => {
              let mappedFrom = tr.mapping.map(from);
              let mappedTo = tr.mapping.map(to);
              return commands.acceptTrackedChangesBetween(mappedFrom, mappedTo);
            })
            .every((result) => result);
        },

      acceptAllTrackedChanges:
        () =>
        ({ state, dispatch, editor, commands }) => {
          const reviewDecision = dispatchReviewDecision({
            editor,
            state,
            dispatch,
            decision: 'accept',
            target: { kind: 'all' },
          });
          if (reviewDecision) return reviewDecision.applied;

          const from = 0,
            to = state.doc.content.size;
          return commands.acceptTrackedChangesBetween(from, to);
        },

      rejectTrackedChangeById:
        (id) =>
        ({ state, tr, dispatch, editor, commands }) => {
          const reviewDecision = dispatchReviewDecision({
            editor,
            state,
            dispatch,
            decision: 'reject',
            target: { kind: 'id', id },
          });
          if (reviewDecision) return reviewDecision.applied;

          const toReject = getChangesByIdToResolve(state, id) || [];

          return toReject
            .map(({ from, to }) => {
              let mappedFrom = tr.mapping.map(from);
              let mappedTo = tr.mapping.map(to);
              return commands.rejectTrackedChangesBetween(mappedFrom, mappedTo);
            })
            .every((result) => result);
        },

      rejectTrackedChange:
        ({ trackedChange }) =>
        ({ commands }) => {
          const { start: from, end: to } = trackedChange;
          return commands.rejectTrackedChangesBetween(from, to);
        },

      rejectTrackedChangeOnSelection:
        () =>
        ({ state, commands }) => {
          const { from, to } = state.selection;
          return commands.rejectTrackedChangesBetween(from, to);
        },

      rejectTrackedChangeFromToolbar:
        () =>
        ({ state, commands, editor }) => {
          return resolveTrackedChangeAction({
            action: 'reject',
            state,
            commands,
            editor,
            ...getTrackedChangeResolutionContext({
              state,
              trackedChangeId: CommentsPluginKey.getState(state)?.activeThreadId,
            }),
          });
        },

      rejectTrackedChangeFromContextMenu:
        ({ from, to, trackedChangeId = null } = {}) =>
        ({ state, commands, editor }) => {
          return resolveTrackedChangeAction({
            action: 'reject',
            state,
            commands,
            editor,
            selection:
              Number.isFinite(from) && Number.isFinite(to)
                ? {
                    from,
                    to,
                  }
                : null,
            ...getTrackedChangeResolutionContext({ state, trackedChangeId }),
          });
        },

      rejectAllTrackedChanges:
        () =>
        ({ state, dispatch, editor, commands }) => {
          const reviewDecision = dispatchReviewDecision({
            editor,
            state,
            dispatch,
            decision: 'reject',
            target: { kind: 'all' },
          });
          if (reviewDecision) return reviewDecision.applied;

          const from = 0,
            to = state.doc.content.size;
          return commands.rejectTrackedChangesBetween(from, to);
        },

      insertTrackedChange:
        (options = {}) =>
        ({ state, dispatch, editor }) => {
          const {
            from = state.selection.from,
            to = state.selection.to,
            text = '',
            id,
            user,
            comment,
            addToHistory = true,
            emitCommentEvent = true,
          } = options;

          // Validate bounds to prevent RangeError
          const docSize = state.doc.content.size;
          if (from < 0 || to > docSize || from > to) {
            console.warn('insertTrackedChange: invalid range', { from, to, docSize });
            return false;
          }

          // Check if there's actually a change to make
          const originalText = state.doc.textBetween(from, to, '', '');
          if (originalText === text) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          const resolvedUser = user ?? editor?.options?.user ?? {};

          // Warn if user info is missing - marks will have undefined author
          if (!resolvedUser.name && !resolvedUser.email) {
            console.warn('insertTrackedChange: no user name/email provided, track change will have undefined author');
          }
          const date = new Date().toISOString();

          return dispatchCompiledInsertTrackedChange({
            editor,
            state,
            dispatch,
            from,
            to,
            text,
            resolvedUser,
            date,
            providedId: id,
            comment,
            addToHistory,
            emitCommentEvent,
          });
        },

      toggleTrackChanges:
        () =>
        ({ state }) => {
          const trackChangeState = TrackChangesBasePluginKey.getState(state);
          if (trackChangeState === undefined) return false;
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'TRACK_CHANGES_ENABLE',
            value: !trackChangeState.isTrackChangesActive,
          });
          return true;
        },

      enableTrackChanges:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'TRACK_CHANGES_ENABLE',
            value: true,
          });
          return true;
        },

      disableTrackChanges:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'TRACK_CHANGES_ENABLE',
            value: false,
          });
          return true;
        },

      toggleTrackChangesShowOriginal:
        () =>
        ({ state }) => {
          const trackChangeState = TrackChangesBasePluginKey.getState(state);
          if (trackChangeState === undefined) return false;
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_ORIGINAL',
            value: !trackChangeState.onlyOriginalShown,
          });
          return true;
        },

      enableTrackChangesShowOriginal:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_ORIGINAL',
            value: true,
          });
          return true;
        },

      disableTrackChangesShowOriginal:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_ORIGINAL',
            value: false,
          });
          return true;
        },

      toggleTrackChangesShowFinal:
        () =>
        ({ state }) => {
          const trackChangeState = TrackChangesBasePluginKey.getState(state);
          if (trackChangeState === undefined) return false;
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_MODIFIED',
            value: !trackChangeState.onlyModifiedShown,
          });
          return true;
        },

      enableTrackChangesShowFinal:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_MODIFIED',
            value: true,
          });
          return true;
        },
    };
  },

  addPmPlugins() {
    return [TrackChangesBasePlugin()];
  },
});

const TRACKED_CHANGE_MARKS = [TrackDeleteMarkName, TrackInsertMarkName, TrackFormatMarkName];

const getTrackedMark = (node) => node?.marks?.find((mark) => TRACKED_CHANGE_MARKS.includes(mark.type.name)) ?? null;

const getTrackedChangeActionSelection = ({ state, editor }) => {
  const currentSelection = state?.selection;
  if (hasExpandedSelection(currentSelection)) {
    return currentSelection;
  }

  const preservedSelection = editor?.options?.preservedSelection ?? editor?.options?.lastSelection;
  if (hasExpandedSelection(preservedSelection)) {
    return preservedSelection;
  }

  return currentSelection;
};

const getTrackedChangeResolutionContext = ({ state, trackedChangeId = null }) => {
  const commentsPluginState = CommentsPluginKey.getState(state);
  const resolvedTrackedChangeId = trackedChangeId ?? commentsPluginState?.activeThreadId ?? null;
  const hasTrackedChangeInCache = Boolean(
    resolvedTrackedChangeId && commentsPluginState?.trackedChanges?.[resolvedTrackedChangeId],
  );
  const hasTrackedChangeInDocument = Boolean(
    resolvedTrackedChangeId && getChangesByIdToResolve(state, resolvedTrackedChangeId)?.length,
  );

  return {
    trackedChangeId: resolvedTrackedChangeId,
    hasKnownTrackedChangeId: hasTrackedChangeInCache || hasTrackedChangeInDocument,
  };
};

const selectionTouchesTrackedChange = ({ state, trackedChangeId, selection = state?.selection }) => {
  if (!selection) {
    return false;
  }

  if (!trackedChangeId) {
    return (
      collectTrackedChanges({
        state,
        from: selection.from,
        to: selection.to,
      }).length > 0
    );
  }

  return collectTrackedChanges({
    state,
    from: selection.from,
    to: selection.to,
  }).some((change) => change.id === trackedChangeId);
};

const resolveTrackedChangeAction = ({
  action,
  state,
  commands,
  editor,
  trackedChangeId = null,
  hasKnownTrackedChangeId = false,
  selection = null,
}) => {
  const targetSelection = selection ?? getTrackedChangeActionSelection({ state, editor });
  const betweenCommand =
    action === 'accept' ? commands.acceptTrackedChangesBetween : commands.rejectTrackedChangesBetween;
  const byIdCommand = action === 'accept' ? commands.acceptTrackedChangeById : commands.rejectTrackedChangeById;
  const selectionCommand =
    action === 'accept' ? commands.acceptTrackedChangeBySelection : commands.rejectTrackedChangeOnSelection;
  const shouldUseSelection =
    hasExpandedSelection(targetSelection) &&
    selectionTouchesTrackedChange({
      state,
      trackedChangeId,
      selection: targetSelection,
    });

  // An explicit text selection takes precedence over the active bubble/thread
  // so partial accept/reject resolves exactly what the user highlighted.
  if (shouldUseSelection) {
    return betweenCommand(targetSelection.from, targetSelection.to);
  }

  if (trackedChangeId && hasKnownTrackedChangeId) {
    return byIdCommand(trackedChangeId);
  }

  return hasExpandedSelection(targetSelection)
    ? betweenCommand(targetSelection.from, targetSelection.to)
    : selectionCommand();
};

const collectRemainingMarksByType = (trackedChanges = []) => ({
  insertedMark: trackedChanges.find(({ mark }) => mark.type.name === TrackInsertMarkName)?.mark ?? null,
  deletionMark: trackedChanges.find(({ mark }) => mark.type.name === TrackDeleteMarkName)?.mark ?? null,
  formatMark: trackedChanges.find(({ mark }) => mark.type.name === TrackFormatMarkName)?.mark ?? null,
});

const emitTrackedChangeCommentLifecycle = ({ editor, nextState, touchedChangeIds }) => {
  if (!editor?.emit || !touchedChangeIds?.size) {
    return;
  }

  const resolvedByEmail = editor.options?.user?.email;
  const resolvedByName = editor.options?.user?.name;

  touchedChangeIds.forEach((changeId) => {
    const remainingTrackedChanges = getTrackChanges(nextState, changeId);

    // Partial resolution keeps the tracked-change thread alive with updated text;
    // full resolution emits the normal resolve event so the bubble can disappear.
    if (!remainingTrackedChanges.length) {
      editor.emit('commentsUpdate', {
        type: 'trackedChange',
        event: 'resolve',
        changeId,
        resolvedByEmail,
        resolvedByName,
      });
      return;
    }

    const marks = collectRemainingMarksByType(remainingTrackedChanges);
    const updatePayload = createOrUpdateTrackedChangeComment({
      event: 'update',
      marks,
      deletionNodes: [],
      nodes: [],
      newEditorState: nextState,
      documentId: editor.options?.documentId,
      trackedChangesForId: remainingTrackedChanges,
    });

    if (updatePayload) {
      editor.emit('commentsUpdate', updatePayload);
    }
  });
};

const dispatchTrackedChangeResolution = ({ state, tr, dispatch, editor, touchedChangeIds }) => {
  if (!tr.steps.length) {
    return true;
  }

  // Apply tr locally to get nextState for comment lifecycle; dispatch(tr) updates the editor afterward.
  const nextState = state.apply(tr);

  if (dispatch) {
    dispatch(tr);
  }

  if (dispatch && touchedChangeIds?.size) {
    emitTrackedChangeCommentLifecycle({
      editor,
      nextState,
      touchedChangeIds,
    });
  }

  return true;
};

const getChangesByIdToResolve = (state, id) => {
  const trackedChanges = getTrackChanges(state);
  const changeIndex = trackedChanges.findIndex(({ mark }) => mark.attrs.id === id);
  if (changeIndex === -1) return;

  const matchingChange = trackedChanges[changeIndex];
  const matchingId = matchingChange.mark.attrs.id;

  // The neighbor walk collects every adjacent segment that shares the same id.
  // This catches:
  //   - A single logical mark split across multiple segments (e.g. because
  //     surrounding text marks differ) — always correct to resolve together.
  //   - The paired opposite-type mark when replacements='paired' (shared id).
  // In 'independent' mode, the ins/del halves have distinct ids so the walk
  // stops at the revision boundary naturally — no special casing needed here.

  const linkedBefore = [];
  const linkedAfter = [];

  const collectDirection = (direction, collection) => {
    let currentIndex = changeIndex;
    let currentChange = matchingChange;

    while (true) {
      const neighborIndex = currentIndex + direction;
      const neighbor = trackedChanges[neighborIndex];

      if (!neighbor) {
        break;
      }

      const sharesId = neighbor.mark.attrs.id === matchingId;
      if (!sharesId) {
        break;
      }

      collection.push(neighbor);

      currentIndex = neighborIndex;
      currentChange = neighbor;
    }
  };

  collectDirection(-1, linkedBefore);
  collectDirection(1, linkedAfter);

  return [matchingChange, ...linkedAfter, ...linkedBefore];
};

/**
 * Routes the document-api tracked text mutation through the shared overlap
 * compiler so native and document-api semantics agree.
 *
 * @param {{
 *   editor: import('../../core/Editor.ts').Editor,
 *   state: import('prosemirror-state').EditorState,
 *   dispatch: (tr: import('prosemirror-state').Transaction) => void,
 *   from: number,
 *   to: number,
 *   text: string,
 *   resolvedUser: object,
 *   date: string,
 *   providedId?: string,
 *   comment?: string,
 *   addToHistory: boolean,
 *   emitCommentEvent: boolean,
 * }} options
 */
const dispatchCompiledInsertTrackedChange = ({
  editor,
  state,
  dispatch,
  from,
  to,
  text,
  resolvedUser,
  date,
  providedId,
  comment,
  addToHistory,
  emitCommentEvent,
}) => {
  const replacements = readReplacementsMode(editor);
  const tr = state.tr;
  const schema = state.schema;
  if (editor?.storage?.trackChanges) {
    editor.storage.trackChanges.lastCompilerFailure = null;
  }
  const activeMarks = state.storedMarks ?? state.doc.resolve(from).marks();
  let intent;
  try {
    if (from === to && text) {
      intent = makeTextInsertIntent({
        at: from,
        content: sliceFromText(schema, text, activeMarks),
        user: resolvedUser,
        date,
        source: 'document-api',
        replacementGroupHint: providedId,
      });
    } else if (from !== to && !text) {
      intent = makeTextDeleteIntent({
        from,
        to,
        user: resolvedUser,
        date,
        source: 'document-api',
        replacementGroupHint: providedId,
      });
    } else if (from !== to && text) {
      intent = makeTextReplaceIntent({
        from,
        to,
        content: sliceFromText(schema, text, activeMarks),
        replacements,
        user: resolvedUser,
        date,
        source: 'document-api',
        replacementGroupHint: providedId,
      });
    } else {
      return false;
    }
  } catch (error) {
    console.warn('insertTrackedChange: could not build intent', error);
    return false;
  }

  const result = compileTrackedEdit({
    state,
    tr,
    intent,
    replacements,
  });

  if (!result.ok) {
    if (editor?.storage?.trackChanges) {
      editor.storage.trackChanges.lastCompilerFailure = {
        code: result.code,
        message: result.message,
        details: result.details,
      };
    }
    return false;
  }
  if (!dispatch) {
    return true;
  }

  const meta = {
    insertedMark: result.insertedMark || null,
    deletionMark: result.deletionMarks?.[0] || null,
    deletionNodes: [],
    step: result.insertedMark ? { slice: { content: { content: [] } } } : null,
    emitCommentEvent,
  };
  tr.setMeta(TrackChangesBasePluginKey, meta);
  tr.setMeta(CommentsPluginKey, { type: 'force' });
  tr.setMeta('skipTrackChanges', true);
  if (!addToHistory) {
    tr.setMeta('addToHistory', false);
  }

  dispatch(tr);

  // Compute a public-facing change id for the comment thread: prefer the
  // explicit id the caller provided; otherwise the first created/updated
  // change id from the compiler receipt.
  const changeId = providedId || result.createdChangeIds?.[0] || result.updatedChangeIds?.[0] || null;
  if (comment?.trim() && changeId && editor.commands?.addCommentReply) {
    editor.commands.addCommentReply({
      parentId: changeId,
      content: comment,
      author: resolvedUser.name,
      authorEmail: resolvedUser.email,
      authorImage: resolvedUser.image,
    });
  }

  return true;
};
