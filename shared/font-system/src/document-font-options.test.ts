import { describe, it, expect } from 'vitest';
import {
  buildDocumentFontOptions,
  type FontSupportStatus,
  type FontFaceRequest,
  type FontLoadStatus,
  type FontRegistry,
  type UsedFace,
} from './index';

/** Face-aware fake registry: per-face load status + which faces are registered (hasFace). */
class FaceRegistry {
  readonly faceStatuses = new Map<string, FontLoadStatus>();
  readonly registered = new Set<string>();
  #key(family: string, weight: string, style: string): string {
    return `${family.toLowerCase()}|${weight}|${style}`;
  }
  getStatus(): FontLoadStatus {
    return 'unloaded';
  }
  getFaceStatus(req: FontFaceRequest): FontLoadStatus {
    return this.faceStatuses.get(this.#key(req.family, req.weight, req.style)) ?? 'unloaded';
  }
  hasFace(family: string, weight: '400' | '700', style: 'normal' | 'italic'): boolean {
    return this.registered.has(this.#key(family, weight, style));
  }
  setFace(family: string, weight: '400' | '700', style: 'normal' | 'italic', status: FontLoadStatus): void {
    this.registered.add(this.#key(family, weight, style));
    this.faceStatuses.set(this.#key(family, weight, style), status);
  }
  asRegistry(): FontRegistry {
    return this as unknown as FontRegistry;
  }
}

const regular = (logicalFamily: string): UsedFace => ({ logicalFamily, weight: '400', style: 'normal' });

/** A registry with the bundled clone pack loaded (so substitutes resolve) + one customer/embedded face. */
function loadedRegistry(): FaceRegistry {
  const reg = new FaceRegistry();
  const faces = [
    ['400', 'normal'],
    ['700', 'normal'],
    ['400', 'italic'],
    ['700', 'italic'],
  ] as const;
  for (const clone of ['Carlito', 'Caladea', 'Liberation Sans', 'Liberation Serif', 'Liberation Mono']) {
    for (const [w, s] of faces) reg.setFace(clone, w, s, 'loaded'); // the bundled clones are four-face fonts
  }
  reg.setFace('BrandSans', '400', 'normal', 'loaded'); // a document-embedded / customer-added real face
  return reg;
}

describe('buildDocumentFontOptions (document-specific toolbar fonts + support status)', () => {
  it('classifies each font the document uses by how faithfully SuperDoc renders it', () => {
    const reg = loadedRegistry().asRegistry();
    const options = buildDocumentFontOptions(
      [
        regular('Calibri'), // metric-safe bundled clone (Carlito)
        regular('Cambria'), // bundled clone (Caladea) but qualified (visual_only)
        regular('Calibri Light'), // category fallback (Carlito, non-metric)
        regular('Georgia'), // candidate Gelasio exists but is not bundled yet
        regular('Aptos'), // no open clone - the customer must supply it
        regular('Cambria Math'), // math font - preserve, never substitute
        regular('BrandSans'), // a real face the document embeds / adds
        regular('Wingdings'), // docfonts has no record at all
      ],
      reg,
    );
    const byName = Object.fromEntries(options.map((o) => [o.logicalFamily, o.status])) as Record<
      string,
      FontSupportStatus
    >;
    expect(byName).toEqual({
      Calibri: 'available',
      Cambria: 'fallback',
      'Calibri Light': 'fallback',
      Georgia: 'pending',
      Aptos: 'needs_font',
      'Cambria Math': 'preserve_only',
      BrandSans: 'available',
      Wingdings: 'needs_font',
    });
  });

  it('renders an available font through its bundled clone, and preserves the logical name', () => {
    const reg = loadedRegistry().asRegistry();
    const [calibri] = buildDocumentFontOptions([regular('Calibri')], reg);
    expect(calibri).toMatchObject({ logicalFamily: 'Calibri', previewFamily: 'Carlito', status: 'available' });
  });

  it('dedupes a family used at multiple faces into one option (regular face represents it)', () => {
    const reg = loadedRegistry().asRegistry();
    const options = buildDocumentFontOptions(
      [
        { logicalFamily: 'Calibri', weight: '700', style: 'normal' },
        { logicalFamily: 'Calibri', weight: '400', style: 'normal' },
        { logicalFamily: 'Calibri', weight: '400', style: 'italic' },
      ],
      reg,
    );
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ logicalFamily: 'Calibri', status: 'available' });
  });

  it('reports the WORST status across used faces (available Regular + non-substitutable Bold = fallback)', () => {
    const reg = new FaceRegistry();
    reg.setFace('Carlito', '400', 'normal', 'loaded'); // ONLY Carlito Regular registered - no Bold
    const options = buildDocumentFontOptions(
      [
        { logicalFamily: 'Calibri', weight: '400', style: 'normal' }, // available via Carlito Regular
        { logicalFamily: 'Calibri', weight: '700', style: 'normal' }, // no Carlito Bold -> fallback_face_absent
      ],
      reg.asRegistry(),
    );
    expect(options).toHaveLength(1);
    // Regular alone reads `available`; aggregating the unsubstitutable Bold honestly drops it to `fallback`.
    expect(options[0]).toMatchObject({ logicalFamily: 'Calibri', previewFamily: 'Carlito', status: 'fallback' });
  });
});
