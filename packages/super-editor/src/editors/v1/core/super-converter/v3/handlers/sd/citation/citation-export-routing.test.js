import { describe, expect, it } from 'vitest';
import { exportSchemaToJson } from '../../../../exporter.js';
import { translator as runTranslator } from '../../w/r/r-translator.js';

const CITATION_INSTRUCTION = 'CITATION source-123';

function buildCitationNode(overrides = {}) {
  return {
    type: 'citation',
    attrs: {
      instruction: CITATION_INSTRUCTION,
      sourceIds: ['source-123'],
      marksAsAttrs: [],
      ...overrides.attrs,
    },
    content: overrides.content ?? [],
  };
}

function hasFieldCharType(node, fieldType) {
  return (
    node?.name === 'w:r' &&
    node?.elements?.some(
      (element) => element?.name === 'w:fldChar' && element?.attributes?.['w:fldCharType'] === fieldType,
    )
  );
}

function getRunText(node) {
  return (node?.elements ?? [])
    .filter((element) => element?.name === 'w:t')
    .flatMap((element) => element?.elements ?? [])
    .map((child) => child?.text ?? '')
    .join('');
}

describe('citation export routing', () => {
  it('exports citation nodes as Word field-code runs', () => {
    const exported = exportSchemaToJson({
      node: buildCitationNode(),
    });

    expect(Array.isArray(exported)).toBe(true);
    expect(exported.some((node) => hasFieldCharType(node, 'begin'))).toBe(true);
    expect(exported.some((node) => hasFieldCharType(node, 'separate'))).toBe(true);
    expect(exported.some((node) => hasFieldCharType(node, 'end'))).toBe(true);

    const instructionRun = exported.find(
      (node) => node?.name === 'w:r' && node?.elements?.some((element) => element?.name === 'w:instrText'),
    );
    const instructionElement = instructionRun?.elements?.find((element) => element?.name === 'w:instrText');

    expect(instructionElement?.elements?.[0]?.text).toBe(CITATION_INSTRUCTION);
  });

  it('expands run-wrapped citation nodes into field-code runs', () => {
    const decoded = runTranslator.decode({
      node: {
        type: 'run',
        attrs: {},
        content: [buildCitationNode()],
      },
      editor: { extensionService: { extensions: [] } },
    });

    const exportedRuns = Array.isArray(decoded) ? decoded : [decoded];

    expect(exportedRuns.some((node) => hasFieldCharType(node, 'begin'))).toBe(true);
    expect(exportedRuns.some((node) => hasFieldCharType(node, 'separate'))).toBe(true);
    expect(exportedRuns.some((node) => hasFieldCharType(node, 'end'))).toBe(true);
  });

  it('exports resolvedText when collaborative hydration stripped cached content', () => {
    const exported = exportSchemaToJson({
      node: buildCitationNode({
        attrs: { resolvedText: '(Smith, 2024)' },
      }),
    });

    expect(exported.map(getRunText).join('')).toBe('(Smith, 2024)');
  });
});
