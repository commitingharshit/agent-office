import { createContext, useContext } from 'react';
/**
 * Context value shared between EditorToolbar sub-components.
 */
export const EditorToolbarContext = createContext(null);
/**
 * Hook to consume the EditorToolbar context.
 * Must be used within an EditorToolbar compound component.
 */
export function useEditorToolbar() {
    const ctx = useContext(EditorToolbarContext);
    if (!ctx) {
        throw new Error('useEditorToolbar must be used within an <EditorToolbar> component');
    }
    return ctx;
}
//# sourceMappingURL=EditorToolbarContext.js.map