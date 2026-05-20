export class SuperConverter {
  constructor(params?: {
    debug?: boolean;
    mockWindow?: unknown;
    mockDocument?: unknown;
    docx?: readonly { readonly name: string; readonly content: string }[];
    media?: Record<string, unknown>;
    fonts?: Record<string, unknown>;
    trackedChangesOptions?: { replacements?: 'paired' | 'independent' } | null;
  });

  static getStoredSuperdocVersion(docx: readonly { readonly name: string; readonly content: string }[]): string | null;
  // The setter consumes `docx` as a mutable map keyed by package path
  // (typically the converter's `convertedXml`), not the array-of-entries
  // shape used by the getter / extractDocumentGuid. The underlying
  // `setStoredCustomProperty` does `docx[customLocation] = ...`.
  static setStoredSuperdocVersion(docx: { [path: string]: unknown }, version?: string): string | null;
  static extractDocumentGuid(docx: readonly { readonly name: string; readonly content: string }[]): string | null;
}

export function hasBodyNumberingReferences(
  documentXml: { name?: string; elements?: readonly unknown[] } | null | undefined,
): boolean;
