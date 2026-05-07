import { describe, expect, it } from 'vitest';
import { normalizeYjsFragmentForSchema } from './normalize-yjs-fragment.js';

describe('normalizeYjsFragmentForSchema', () => {
  it('ignores non-Yjs fragment test doubles', () => {
    expect(normalizeYjsFragmentForSchema({ fragment: true })).toBe(false);
  });
});
