import { describe, expect, it } from 'vitest';
import { Doc as YDoc, XmlElement, XmlText } from 'yjs';
import { normalizeYjsFragmentEventsForSchema, normalizeYjsFragmentForSchema } from './normalize-yjs-fragment.js';

describe('normalizeYjsFragmentForSchema', () => {
  it('ignores non-Yjs fragment test doubles', () => {
    expect(normalizeYjsFragmentForSchema({ fragment: true })).toBe(false);
  });

  it('normalizes changed event target subtrees without walking the fallback fragment', () => {
    const ydoc = new YDoc();
    const root = ydoc.getXmlFragment('supereditor');
    const crossReference = new XmlElement('crossReference');
    crossReference.insert(0, [new XmlElement('run')]);
    root.insert(0, [crossReference]);
    const fallbackFragment = {
      toArray() {
        throw new Error('Expected event-scoped normalization to avoid full fragment traversal.');
      },
    };

    try {
      expect(normalizeYjsFragmentEventsForSchema([{ target: crossReference }], fallbackFragment)).toBe(true);
      expect(crossReference.length).toBe(0);
    } finally {
      ydoc.destroy();
    }
  });

  it('normalizes an ancestor crossReference when the changed event target is nested text', () => {
    const ydoc = new YDoc();
    const root = ydoc.getXmlFragment('supereditor');
    const crossReference = new XmlElement('crossReference');
    const run = new XmlElement('run');
    const text = new XmlText();
    text.insert(0, '1');
    run.insert(0, [text]);
    crossReference.insert(0, [run]);
    root.insert(0, [crossReference]);

    try {
      expect(normalizeYjsFragmentEventsForSchema([{ target: text }], root)).toBe(true);
      expect(crossReference.length).toBe(0);
    } finally {
      ydoc.destroy();
    }
  });

  it('normalizes an ancestor citation when the changed event target is nested text', () => {
    const ydoc = new YDoc();
    const root = ydoc.getXmlFragment('supereditor');
    const citation = new XmlElement('citation');
    const run = new XmlElement('run');
    const text = new XmlText();
    text.insert(0, '(Smith, 2024)');
    run.insert(0, [text]);
    citation.insert(0, [run]);
    root.insert(0, [citation]);

    try {
      expect(normalizeYjsFragmentEventsForSchema([{ target: text }], root)).toBe(true);
      expect(citation.length).toBe(0);
    } finally {
      ydoc.destroy();
    }
  });
});
