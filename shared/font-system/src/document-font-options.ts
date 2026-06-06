/**
 * Document-scoped font support for the toolbar: classify each font a loaded document actually uses by
 * how faithfully SuperDoc can render it RIGHT NOW. Distinct from the static {@link ./font-offerings}
 * (the bundled DEFAULTS): this is runtime + document-scoped (it needs the document's registry +
 * resolver) and covers fonts beyond the defaults - embedded/customer fonts the document supplies,
 * un-bundled candidates (Georgia), customer-supplied (Aptos), and preserve-only (math/symbol).
 *
 * The {@link FontSupportStatus} is a USER-FACING summary ("will SuperDoc render this faithfully,
 * approximate it, or do I need to supply it?"), deliberately NOT the docfonts `FallbackDecision`: the
 * toolbar must not expose evidence internals. It is derived by combining the runtime FACE report (does
 * the document render this with a real / embedded / clone face?) with the docfonts evidence decision
 * (for fonts with no runtime render: is a candidate pending an asset, customer-supplied, or preserve-
 * only?). The evidence package is consulted by VALUE only, so this module's public types stay local and
 * the published facade carries no `@docfonts/fallbacks` reference.
 */
import { getFallbackDecision } from '@docfonts/fallbacks';
import { buildFaceReport, type FontResolutionRecord, type UsedFace } from './report';
import type { FontRegistry } from './registry';
import type { FontResolver } from './resolver';
import { BUNDLED_MANIFEST } from './bundled-manifest';

/**
 * The user-facing answer to "how well can SuperDoc render this font?". Five tiers, no docfonts
 * internals: a document font is shown in the toolbar with one of these so it never reads as a clean
 * default when it is not.
 */
export type FontSupportStatus =
  | 'available' // renderable now: the document's own embedded/customer face, a metric-safe clone, or an explicit mapping
  | 'fallback' // an approved substitute renders, but not a faithful match (reflows / wrong weight)
  | 'pending' // an open candidate exists, but SuperDoc does not bundle its asset yet (Georgia -> Gelasio)
  | 'needs_font' // no open substitute: the real font must come from the customer / system (Aptos)
  | 'preserve_only'; // math / symbol font: keep the name, never substitute (Cambria Math)

/**
 * One document font for the toolbar: the logical name (the dropdown label + the value stored and
 * exported), the family to preview it in, and the support status.
 */
export interface DocumentFontOption {
  /** The Word-facing logical family: the dropdown label and the value stored + exported (e.g. "Aptos"). */
  logicalFamily: string;
  /**
   * The physical family to render the dropdown PREVIEW in (Calibri previews as Carlito; a document-
   * provided font previews as itself). The REGULAR face's representative ONLY - NOT what every face of
   * the family renders as, since {@link DocumentFontOption.status} is the worst across all used faces.
   */
  previewFamily: string;
  status: FontSupportStatus;
}

const BUNDLED_FAMILIES: ReadonlySet<string> = new Set(BUNDLED_MANIFEST.map((f) => f.family));
/** A docfonts candidate activates only if SuperDoc ships its physical clone (matches the resolver gate). */
const canRenderFamily = (family: string): boolean => BUNDLED_FAMILIES.has(family);

/** Normalize a family for dedupe: trim, strip surrounding quotes, lowercase (matches the resolver key). */
function normalizeKey(family: string): string {
  return family
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase();
}

/** Derive the user-facing status for one family from its representative face record + the evidence. */
function statusFor(rec: FontResolutionRecord): FontSupportStatus {
  switch (rec.reason) {
    case 'registered_face': // the document embeds it, or a customer `fonts.add` provides the real face
    case 'custom_mapping': // an explicit `fonts.map` to a loadable family
      // Available through a provider the app/customer supplied. "Available" means renderable, NOT
      // necessarily a faithful match: a custom mapping's fidelity is unknown unless docfonts covers it.
      return 'available';
    case 'category_fallback': // non-metric family fallback (Calibri Light -> Carlito)
    case 'fallback_face_absent': // a substitute exists, but not for this face
      return 'fallback';
    case 'bundled_substitute': {
      // A bundled clone renders it. Faithful (metric_safe / near_metric, loaded) is `available`; a
      // qualified substitute (visual_only / cell_width_only, e.g. Cambria) reads honestly as `fallback`.
      const decision = getFallbackDecision(rec.logicalFamily, { canRenderFamily });
      return decision.kind === 'fallback' && decision.fallback.lineBreakSafe && !rec.missing ? 'available' : 'fallback';
    }
    case 'as_requested':
    default: {
      // No runtime render - the evidence classifies why.
      const decision = getFallbackDecision(rec.logicalFamily, { canRenderFamily });
      switch (decision.kind) {
        case 'asset_missing': // candidate exists, SuperDoc has not bundled it yet
          return 'pending';
        case 'face_missing': // a substitute exists but lacks the requested face - partial, not faithful
          return 'fallback';
        case 'preserve_only': // math / symbol - never a normal Latin fallback
          return 'preserve_only';
        case 'fallback': // evidence says renderable but the clone has not loaded; report the honest tier
          return decision.fallback.lineBreakSafe ? 'available' : 'fallback';
        case 'customer_supplied': // no open clone; the real font must come from the customer (Aptos)
        case 'no_recommended_fallback': // a row exists but no recommended open family (Verdana, Tahoma)
        case 'unknown': // docfonts has no record - a system/unknown font the user must supply
        default:
          return 'needs_font';
      }
    }
  }
}

/**
 * Best-to-worst severity for aggregating a family's used faces. The toolbar shows the MOST concerning
 * status across the faces the document renders, so a family with a faithful Regular but an
 * unsubstitutable Bold does not read as fully available.
 */
const STATUS_SEVERITY: Record<FontSupportStatus, number> = {
  available: 0,
  fallback: 1,
  pending: 2,
  needs_font: 3,
  preserve_only: 4,
};

/**
 * The document-specific font options for the toolbar: one per LOGICAL family the document renders,
 * deduped, each with the family that actually paints and a user-facing {@link FontSupportStatus}.
 * Resolved FACE-aware (via {@link buildFaceReport}) so an embedded / customer font the document supplies
 * is detected (`registered_face` -> `available`) even when no bundled clone exists. The regular
 * (400/normal) face is the family's representative; per-face weight/style nuance is a later pass.
 */
export function buildDocumentFontOptions(
  usedFaces: Iterable<UsedFace>,
  registry: FontRegistry,
  resolver?: FontResolver,
): DocumentFontOption[] {
  const faceRecords = buildFaceReport(usedFaces, registry, resolver);
  // Aggregate the per-face rows by logical family: the status is the WORST across every used face (so a
  // family whose Bold lacks a substitute is not advertised as available on the strength of its Regular),
  // while the regular (400/normal) face is the render representative for the dropdown preview.
  const agg = new Map<string, { rep: FontResolutionRecord; worst: FontSupportStatus }>();
  for (const rec of faceRecords) {
    const key = normalizeKey(rec.logicalFamily);
    const status = statusFor(rec);
    const isRegular = rec.face?.weight === '400' && rec.face?.style === 'normal';
    const existing = agg.get(key);
    if (!existing) {
      agg.set(key, { rep: rec, worst: status });
      continue;
    }
    if (STATUS_SEVERITY[status] > STATUS_SEVERITY[existing.worst]) existing.worst = status;
    // Prefer the regular face as the render representative; otherwise keep the first seen.
    const existingIsRegular = existing.rep.face?.weight === '400' && existing.rep.face?.style === 'normal';
    if (isRegular && !existingIsRegular) existing.rep = rec;
  }
  const options: DocumentFontOption[] = [];
  for (const { rep, worst } of agg.values()) {
    options.push({ logicalFamily: rep.logicalFamily, previewFamily: rep.physicalFamily, status: worst });
  }
  return options;
}

/**
 * The short inline status text for the toolbar dropdown - "" for `available`, so faithful fonts read as
 * plain names. Kept here so the Vue and headless toolbars word the status identically.
 */
export function fontSupportStatusText(status: FontSupportStatus): string {
  switch (status) {
    case 'available':
      return '';
    case 'fallback':
      return 'Fallback';
    case 'pending':
      return 'Pending font';
    case 'needs_font':
      return 'Needs font';
    case 'preserve_only':
      return 'Preserve only';
  }
}
