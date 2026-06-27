/**
 * Text Box Renderer
 *
 * Renders text box fragments to DOM. Handles:
 * - Background fill color
 * - Border/outline
 * - Internal padding (margins)
 * - Paragraph content inside the box (using pre-measured data)
 */
import { type TextBoxFragment, type TextBoxBlock, type TextBoxMeasure } from '../layout-engine/types';
import type { RenderContext } from './renderPage';
/**
 * CSS class names for text box elements
 */
export declare const TEXTBOX_CLASS_NAMES: {
    textBox: string;
};
/**
 * Options for rendering a text box fragment
 */
export interface RenderTextBoxFragmentOptions {
    document?: Document;
}
/**
 * Render a text box fragment to DOM
 */
export declare function renderTextBoxFragment(fragment: TextBoxFragment, block: TextBoxBlock, measure: TextBoxMeasure, context: RenderContext, options?: RenderTextBoxFragmentOptions): HTMLElement;
//# sourceMappingURL=renderTextBox.d.ts.map