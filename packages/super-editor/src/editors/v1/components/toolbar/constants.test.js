import { describe, it, expect } from 'vitest';
import { TOOLBAR_FONTS, composeToolbarFontOptions } from './constants';

describe('TOOLBAR_FONTS (built-in font dropdown, derived from the font-offering registry)', () => {
  it('advertises only the metric-safe bundled defaults, in alphabetical order', () => {
    expect(TOOLBAR_FONTS.map((f) => f.label)).toEqual([
      'Arial',
      'Calibri',
      'Courier New',
      'Helvetica',
      'Times New Roman',
    ]);
  });

  it('does not leak non-bundled or qualified fonts into the default dropdown', () => {
    const labels = new Set(TOOLBAR_FONTS.map((f) => f.label));
    for (const name of ['Georgia', 'Aptos', 'Cambria', 'Calibri Light']) {
      expect(labels.has(name)).toBe(false);
    }
  });

  it('builds a FontConfig: logical label + logical key + physical-clone preview', () => {
    const calibri = TOOLBAR_FONTS.find((f) => f.label === 'Calibri');
    expect(calibri).toMatchObject({
      label: 'Calibri', // applied to the selection + active-state match (Word-facing name)
      key: 'Calibri, sans-serif', // logical CSS stack (option identity)
      fontWeight: 400,
      props: {
        style: { fontFamily: 'Carlito, sans-serif' }, // preview renders in the bundled clone that paints
        'data-item': 'btn-fontFamily-option',
      },
    });
  });

  it('honors the FontConfig contract: label equals the first family in key', () => {
    for (const f of TOOLBAR_FONTS) {
      expect(f.key.split(',')[0].trim()).toBe(f.label);
    }
  });
});

describe('composeToolbarFontOptions (document fonts unioned with the bundled defaults)', () => {
  const doc = (logicalFamily, status, previewFamily) => ({
    logicalFamily,
    status,
    previewFamily: previewFamily ?? logicalFamily,
  });

  it('returns a consumer-provided fonts list unchanged (custom toolbars own their list)', () => {
    const custom = [{ label: 'My Font', key: 'My Font' }];
    expect(composeToolbarFontOptions([doc('Aptos', 'needs_font')], custom)).toBe(custom);
  });

  it('returns undefined with no document fonts, so the caller keeps the bundled defaults', () => {
    expect(composeToolbarFontOptions([], undefined)).toBeUndefined();
    expect(composeToolbarFontOptions(undefined, undefined)).toBeUndefined();
  });

  it('combines defaults and document fonts alphabetically, deduping one already in the defaults', () => {
    const options = composeToolbarFontOptions(
      [
        doc('Calibri', 'available', 'Carlito'),
        doc('Bangla MN', 'needs_font'),
        doc('Aptos', 'needs_font'),
        doc('Apple Chancery', 'needs_font'),
      ],
      undefined,
    );
    expect(options.map((o) => o.label)).toEqual([
      'Apple Chancery',
      'Aptos',
      'Arial',
      'Bangla MN',
      'Calibri',
      'Courier New',
      'Helvetica',
      'Times New Roman',
    ]);
    expect(options.filter((o) => o.label === 'Calibri')).toHaveLength(1);
  });

  it('maps a document font as a plain logical picker row, with no visible status text', () => {
    const options = composeToolbarFontOptions([doc('Aptos', 'needs_font', 'Aptos')], undefined);
    const aptos = options.find((option) => option.label === 'Aptos');
    expect(aptos).toMatchObject({
      label: 'Aptos', // pure logical name (active-state match + the stored/exported value)
      key: 'Aptos',
      props: { style: { fontFamily: 'Aptos' }, 'data-item': 'btn-fontFamily-option' },
    });
    expect(aptos.secondaryLabel).toBeUndefined();
  });

  it('does not expose status text for any document font status', () => {
    for (const status of ['available', 'fallback', 'pending', 'needs_font', 'preserve_only']) {
      const options = composeToolbarFontOptions([doc(`BrandSans-${status}`, status, 'BrandSans')], undefined);
      expect(options.at(-1).secondaryLabel).toBeUndefined();
    }
  });

  it('keeps an available document font as a plain name', () => {
    const options = composeToolbarFontOptions([doc('BrandSans', 'available', 'BrandSans')], undefined);
    const brandSans = options.find((option) => option.label === 'BrandSans');
    expect(brandSans.label).toBe('BrandSans');
    expect(brandSans.secondaryLabel).toBeUndefined();
  });
});
