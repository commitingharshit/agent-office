/**
 * Fragment Renderer
 *
 * Renders individual fragments (paragraphs, tables, images) to DOM.
 * Each fragment is positioned within a page's content area.
 */
import type { Fragment } from '../layout-engine/types';
import type { RenderContext } from './renderPage';
/**
 * CSS class names for fragment elements
 */
export declare const FRAGMENT_CLASS_NAMES: {
    fragment: string;
    paragraph: string;
    table: string;
    image: string;
    line: string;
    run: string;
};
/**
 * Options for rendering fragments
 */
export interface RenderFragmentOptions {
    /** Document to create elements in */
    document?: Document;
}
/**
 * Render a fragment to DOM
 *
 * @param fragment - The fragment to render
 * @param context - Rendering context
 * @param options - Rendering options
 * @returns The fragment DOM element
 */
export declare function renderFragment(fragment: Fragment, context: RenderContext, options?: RenderFragmentOptions): HTMLElement;
//# sourceMappingURL=renderFragment.d.ts.map