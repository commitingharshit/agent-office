/**
 * Consumer typecheck: Editor.converter, Editor.extensionService, and
 * getActiveFormatting are typed surfaces, not `any` (SD-3240, SD-3245).
 *
 * Before this change:
 *   - `editor.converter`         resolved to `SuperConverter` with a
 *     `[key: string]: any` catchall.
 *   - `editor.extensionService`  resolved to `ExtensionService` with a
 *     `[key: string]: any` catchall.
 *   - `getActiveFormatting`      was typed `(editor: any): any`.
 *
 * 18 supported-root allowlist entries (16 + 2) flowed from those three
 * `any` shapes. After SD-3240, the Editor field types are public
 * surface interfaces with `unknown` extras; after SD-3245, the helper
 * has a real signature. The allowlist drains to 0; this fixture locks
 * the contract so a regression breaks the build, not just a JSON file.
 */

import { Editor, getActiveFormatting } from 'superdoc/super-editor';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// --- editor.converter is not any -----------------------------------------

type EditorConverterT = Editor['converter'];
// If `converter` were `any`, `Equal<EditorConverterT, any>` would be `true`.
// Asserting `false` proves it's a real interface.
const _converterIsNotAny: Equal<EditorConverterT, any> = false;
void _converterIsNotAny;

// --- editor.extensionService is not any ----------------------------------

type EditorExtensionServiceT = Editor['extensionService'];
const _extServiceIsNotAny: Equal<EditorExtensionServiceT, any> = false;
void _extServiceIsNotAny;

// --- getActiveFormatting input is not any --------------------------------

type GetActiveFormattingParam = Parameters<typeof getActiveFormatting>[0];
const _paramIsNotAny: Equal<GetActiveFormattingParam, any> = false;
void _paramIsNotAny;

// --- getActiveFormatting return is not any (and element is not any) ------

type GetActiveFormattingReturn = ReturnType<typeof getActiveFormatting>;
const _returnIsNotAny: Equal<GetActiveFormattingReturn, any> = false;
void _returnIsNotAny;

// An `any[]` would compare-equal to `unknown[]` here; using a fresh
// `any` element check disambiguates: if the element type drifted to
// `any`, this becomes `true`.
type GetActiveFormattingElement = GetActiveFormattingReturn extends Array<infer E> ? E : never;
const _elementIsNotAny: Equal<GetActiveFormattingElement, any> = false;
void _elementIsNotAny;

// --- Reach through editor.converter — a known surface member stays typed -

// `documentGuid` is declared on the public surface as `string | null`.
// If the field type regresses to `any`, this exact-type check breaks.
declare const editor: Editor;
const guid: string | null = editor.converter.documentGuid;
void guid;
const _guidIsExact: Equal<typeof editor.converter.documentGuid, string | null> = true;
void _guidIsExact;
