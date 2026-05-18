/**
 * SuperDoc public facade: types entry.
 *
 * SD-3184 under SD-3178 (Phase 3 of SD-3175). Last large supported-surface
 * facade entry. Mirrors the 116-name surface today reachable via the
 * `superdoc/types` subpath — schema attributes, command maps, ProseMirror
 * JSON shapes, augmentation infrastructure, and theme types.
 *
 * Classification per SD-3147: 37 public + 79 legacy/public-compat. All
 * 116 re-exported through the facade — tier distinction is documentation
 * posture, not facade inclusion.
 *
 * `superdoc/types` is a **type-only** subpath. The runtime artifact
 * (`dist/types.es.js`) is effectively empty. Five names that have value
 * origins upstream are deliberately exported as TYPE-ONLY here, matching
 * today's contract:
 *
 *   - `defineNode`, `defineMark` (factory functions upstream)
 *   - `isNodeType`, `assertNodeType`, `isMarkType` (type-guard functions upstream)
 *
 * Consumers who want the runtime helpers reach them from `superdoc` itself,
 * which already exports them. Promoting them to runtime exports here would
 * change the subpath contract.
 *
 * Strategy: re-export through the narrow `@superdoc/super-editor/types`
 * subpath rather than the broad root.
 *
 * Rules for this file:
 *   - AIDEV-NOTE: Type-only via `export type { ... }`. Do NOT add `export { ... }`
 *     for any of the 5 value-origin names. That would change `superdoc/types`
 *     from a type-only contract to one that ships runtime helpers.
 *   - AIDEV-NOTE: Adding or removing an export here updates `expectedNames`
 *     for the `types` entry in `FACADE_ENTRIES` inside
 *     `packages/superdoc/scripts/verify-public-facade-emit.cjs` in the
 *     same PR. The verifier postbuild fails on drift.
 *   - This entry has a real `public/types.d.cts` shim (unlike SD-3180/SD-3182/SD-3183
 *     entries) because the existing `./types` package.json#exports entry
 *     uses split `types.import` / `types.require` declarations.
 *   - This entry does not re-export `Editor` or `EditorCommands`, so the
 *     verifier skips the command-signature probe.
 */
export type {
  BlockNodeAttributes,
  BoldAttrs,
  BookmarkEndAttrs,
  BookmarkStartAttrs,
  BorderSpec,
  CanCommand,
  CanObject,
  CellMargins,
  ChainableCommandObject,
  ChainedCommand,
  Command,
  CommandProps,
  CommentMarkAttrs,
  CommentRangeEndAttrs,
  CommentRangeStartAttrs,
  CommentReferenceAttrs,
  ContentBlockAttrs,
  ContentBlockMarginOffset,
  ContentBlockSize,
  CoreCommandMap,
  CoreCommands,
  DocumentAttrs,
  DocumentPartObjectAttrs,
  DocumentSectionAttrs,
  EditorCommands,
  ExtensionCommandMap,
  ExtensionCommands,
  FieldAnnotationAttrs,
  FieldAnnotationSize,
  HardBreakAttrs,
  HighlightAttrs,
  HighlightColor,
  ImageAttrs,
  ImagePadding,
  ImageSize,
  ImageTransformData,
  ImageWrap,
  IndentationProperties,
  InlineNodeAttributes,
  ItalicAttrs,
  LineBreakAttrs,
  LinkAttrs,
  ListRendering,
  MarkAttributesMap,
  MarkAttrs,
  MarkConfig,
  MarkName,
  MentionAttrs,
  NodeAttributesMap,
  NodeAttrs,
  NodeConfig,
  NodeName,
  NumberingProperties,
  OxmlNodeAttributes,
  OxmlNodeConfig,
  PageNumberAttrs,
  PageReferenceAttrs,
  ParagraphAttrs,
  ParagraphProperties,
  PassthroughBlockAttrs,
  PassthroughInlineAttrs,
  PermEndAttrs,
  PermStartAttrs,
  ProseMirrorJSON,
  ProseMirrorJSONMark,
  ProseMirrorJSONNode,
  RunAttrs,
  RunProperties,
  SectionMargins,
  ShadingProperties,
  ShapeContainerAttrs,
  ShapeGroupAttrs,
  ShapeGroupMarginOffset,
  ShapeGroupPadding,
  ShapeGroupSize,
  ShapeNodeAttributes,
  ShapeTextboxAttrs,
  SpacingProperties,
  StrikeAttrs,
  StructuredContentAttrs,
  StructuredContentBlockAttrs,
  TabAttrs,
  TableAttrs,
  TableBorders,
  TableCellAttrs,
  TableCellProperties,
  TableGrid,
  TableHeaderAttrs,
  TableLook,
  TableMeasurement,
  TableNodeAttributes,
  TableOfContentsAttrs,
  TableProperties,
  TableRowAttrs,
  TableRowProperties,
  TargetFrameOption,
  TextAttrs,
  TextContainerAttributes,
  TextStyleAttrs,
  ThemeColor,
  TotalPageCountAttrs,
  TrackDeleteAttrs,
  TrackFormatAttrs,
  TrackFormatEntry,
  TrackInsertAttrs,
  TypedMark,
  TypedNode,
  UnderlineAttrs,
  UnderlineStyle,
  VectorShapeAttrs,
  VectorShapeTextInsets,
  assertNodeType,
  defineMark,
  defineNode,
  isMarkType,
  isNodeType,
} from '@superdoc/super-editor/types';
