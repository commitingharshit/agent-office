// @ts-nocheck
import { Extension } from '@core/Extension.js';

const STRONG_RTL_CHAR_RE = /[\u0590-\u08FF]/;
const STRONG_LTR_CHAR_RE = /[A-Za-z\u00C0-\u024F]/;

const isStrongRtl = (char) => STRONG_RTL_CHAR_RE.test(char);
const isStrongLtr = (char) => STRONG_LTR_CHAR_RE.test(char);

const hasMixedDirectionBoundary = (leftChar, rightChar) =>
  (isStrongRtl(leftChar) && isStrongLtr(rightChar)) || (isStrongLtr(leftChar) && isStrongRtl(rightChar));

const resolveCaretPoint = (doc, range) => {
  const rect = range.getBoundingClientRect();
  if (rect && Number.isFinite(rect.left) && Number.isFinite(rect.top)) {
    // Collapsed ranges may transiently report a zero rect during render lag.
    // In that case, fail-open instead of falling back to the parent box,
    // which would produce an imprecise X and potentially a wrong boundary.
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }
    const midY = rect.height > 0 ? rect.top + rect.height / 2 : rect.top;
    return { x: rect.left, y: midY };
  }

  const node =
    range.startContainer?.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
  if (!node || !(node instanceof HTMLElement)) return null;
  const fallbackRect = node.getBoundingClientRect();
  if (!fallbackRect) return null;
  return { x: fallbackRect.left, y: fallbackRect.top + fallbackRect.height / 2 };
};

const resolveLineElement = (doc, point) => {
  const hit = doc.elementsFromPoint(point.x, point.y);
  return hit.find((el) => (el instanceof HTMLElement ? el.classList.contains('superdoc-line') : false));
};

const collectVisualChars = (lineEl, view, targetX = null) => {
  const doc = lineEl.ownerDocument;
  const nodeFilter = doc.defaultView?.NodeFilter;
  if (!nodeFilter) return [];
  const chars = [];
  const walker = doc.createTreeWalker(lineEl, nodeFilter.SHOW_TEXT);
  const RANGE_WINDOW_PX = 96;
  const hasTargetX = Number.isFinite(targetX);
  let node = walker.nextNode();

  while (node) {
    const textNode = /** @type {Text} */ (node);
    const text = textNode.textContent ?? '';

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (!char || /\s/.test(char)) continue;

      let pmStart;
      let pmEnd;
      try {
        pmStart = view.posAtDOM(textNode, i);
        pmEnd = view.posAtDOM(textNode, i + 1);
      } catch {
        continue;
      }
      if (!Number.isFinite(pmStart) || !Number.isFinite(pmEnd) || pmEnd <= pmStart) continue;

      const range = doc.createRange();
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (hasTargetX && rect.right < targetX - RANGE_WINDOW_PX) continue;
      if (hasTargetX && rect.left > targetX + RANGE_WINDOW_PX) continue;

      chars.push({
        char,
        pmStart,
        pmEnd,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      });
    }

    node = walker.nextNode();
  }

  return chars;
};

const resolveBoundaryChars = (chars, caretPoint) => {
  if (chars.length === 0) return null;
  const sameBand = chars.filter((c) => Math.abs(c.centerY - caretPoint.y) <= 8);
  const band = sameBand.length > 0 ? sameBand : chars;
  band.sort((a, b) => a.centerX - b.centerX);

  let left = null;
  let right = null;
  for (const c of band) {
    if (c.centerX < caretPoint.x) {
      left = c;
      continue;
    }
    right = c;
    break;
  }

  if (!left || !right) return null;
  return { left, right };
};

export const handleMixedBidiBackspace = (editor) => {
  const { state, view } = editor;
  const { selection } = state;
  if (!selection?.empty) return false;

  const doc = view.dom.ownerDocument;
  const nativeSelection = doc.getSelection();
  if (!nativeSelection || nativeSelection.rangeCount === 0) return false;

  const range = nativeSelection.getRangeAt(0);
  if (!range.collapsed) return false;

  const caretPoint = resolveCaretPoint(doc, range);
  if (!caretPoint) return false;

  const lineEl = resolveLineElement(doc, caretPoint);
  if (!lineEl) return false;
  const lineText = lineEl.textContent ?? '';
  const hasRtl = STRONG_RTL_CHAR_RE.test(lineText);
  const hasLtr = STRONG_LTR_CHAR_RE.test(lineText);
  if (!hasRtl || !hasLtr) return false;

  let chars = collectVisualChars(lineEl, view, caretPoint.x);
  if (chars.length < 2) {
    // Fallback to a full scan for correctness when the local window is too narrow.
    chars = collectVisualChars(lineEl, view, null);
  }
  const boundary = resolveBoundaryChars(chars, caretPoint);
  if (!boundary) return false;

  if (!hasMixedDirectionBoundary(boundary.left.char, boundary.right.char)) return false;
  if (selection.from !== boundary.right.pmStart && selection.from !== boundary.left.pmEnd) return false;

  const tr = state.tr.delete(boundary.left.pmStart, boundary.left.pmEnd).scrollIntoView();
  view.dispatch(tr);
  return true;
};

export const MixedBidiBackspace = Extension.create({
  name: 'mixedBidiBackspace',

  addShortcuts() {
    return {
      Backspace: () => handleMixedBidiBackspace(this.editor),
    };
  },
});

export const __TEST_ONLY__ = {
  resolveCaretPoint,
  hasMixedDirectionBoundary,
};
