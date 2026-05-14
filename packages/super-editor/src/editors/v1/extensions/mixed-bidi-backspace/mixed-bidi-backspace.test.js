import { describe, expect, it, vi } from 'vitest';
import { __TEST_ONLY__, handleMixedBidiBackspace } from './mixed-bidi-backspace.js';

const makeRect = (left, top = 10, width = 8, height = 12) => ({
  left,
  top,
  width,
  height,
});

const setupEditor = ({ text, charLefts, caretRect, selectionFrom, pmBase = 10 }) => {
  const doc = document.implementation.createHTMLDocument('mixed-bidi-backspace');
  Object.defineProperty(doc, 'defaultView', {
    value: { NodeFilter: { SHOW_TEXT: 4 } },
    configurable: true,
  });
  const lineEl = doc.createElement('div');
  lineEl.className = 'superdoc-line';
  const textNode = doc.createTextNode(text);
  lineEl.appendChild(textNode);
  doc.body.appendChild(lineEl);

  doc.elementsFromPoint = vi.fn(() => [lineEl]);

  doc.createRange = vi.fn(() => {
    const range = {
      _node: null,
      _start: 0,
      _end: 0,
      setStart(node, offset) {
        this._node = node;
        this._start = offset;
      },
      setEnd(node, offset) {
        this._node = node;
        this._end = offset;
      },
      getBoundingClientRect() {
        if (this._node !== textNode) return makeRect(0, 0, 0, 0);
        const chIndex = this._start;
        const left = charLefts[chIndex];
        if (typeof left !== 'number') return makeRect(0, 0, 0, 0);
        return makeRect(left);
      },
    };
    return range;
  });

  const nativeRange = {
    collapsed: true,
    getBoundingClientRect: () => caretRect,
    startContainer: textNode,
  };

  doc.getSelection = vi.fn(() => ({
    rangeCount: 1,
    getRangeAt: () => nativeRange,
  }));

  const dispatch = vi.fn();
  const tr = {
    delete: vi.fn(() => tr),
    scrollIntoView: vi.fn(() => tr),
  };
  const view = {
    dom: { ownerDocument: doc },
    dispatch,
    posAtDOM: vi.fn((node, offset) => {
      if (node !== textNode) throw new Error('unexpected node');
      return pmBase + offset;
    }),
  };
  const editor = {
    state: {
      selection: { empty: true, from: selectionFrom },
      tr,
    },
    view,
  };

  return { editor, tr, dispatch };
};

describe('mixed-bidi-backspace', () => {
  it('deletes visual-left char on mixed-direction boundary', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'אA',
      charLefts: [10, 20],
      caretRect: makeRect(20, 10, 1, 12),
      selectionFrom: 11,
      pmBase: 10,
    });

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(true);
    expect(tr.delete).toHaveBeenCalledWith(10, 11);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('fails open on non-mixed boundary (pure LTR)', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'AB',
      charLefts: [10, 20],
      caretRect: makeRect(20, 10, 1, 12),
      selectionFrom: 11,
      pmBase: 10,
    });

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(false);
    expect(tr.delete).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(editor.view.posAtDOM).not.toHaveBeenCalled();
  });

  it('deletes visual-left char on inverse mixed boundary (LTR + RTL)', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'Aא',
      charLefts: [10, 20],
      caretRect: makeRect(20, 10, 1, 12),
      selectionFrom: 11,
      pmBase: 10,
    });

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(true);
    expect(tr.delete).toHaveBeenCalledWith(10, 11);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('fails open when selectionFrom does not match boundary PM position', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'אA',
      charLefts: [10, 20],
      caretRect: makeRect(20, 10, 1, 12),
      selectionFrom: 999,
      pmBase: 10,
    });

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(false);
    expect(tr.delete).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('fails open for punctuation bridge between RTL and LTR', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'א.A',
      charLefts: [10, 20, 30],
      caretRect: makeRect(30, 10, 1, 12),
      selectionFrom: 12,
      pmBase: 10,
    });

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(false);
    expect(tr.delete).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('fails open when caret is at visual start (no left char)', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'אA',
      charLefts: [10, 20],
      caretRect: makeRect(5, 10, 1, 12),
      selectionFrom: 10,
      pmBase: 10,
    });

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(false);
    expect(tr.delete).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('fails open for non-collapsed selection', () => {
    const { editor, tr, dispatch } = setupEditor({
      text: 'אA',
      charLefts: [10, 20],
      caretRect: makeRect(20, 10, 1, 12),
      selectionFrom: 11,
      pmBase: 10,
    });
    editor.state.selection.empty = false;

    const handled = handleMixedBidiBackspace(editor);
    expect(handled).toBe(false);
    expect(tr.delete).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('resolveCaretPoint returns null for zero-size rect', () => {
    const doc = document.implementation.createHTMLDocument('caret-rect');
    const result = __TEST_ONLY__.resolveCaretPoint(doc, {
      getBoundingClientRect: () => makeRect(0, 0, 0, 0),
      startContainer: doc.body,
    });
    expect(result).toBeNull();
  });
});
