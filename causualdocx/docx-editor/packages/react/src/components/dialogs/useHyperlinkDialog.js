/**
 * Hyperlink dialog state hook — lives in its own module so consumers
 * (DocxEditor) can import the hook without pulling the dialog
 * component's chunk back into the main bundle. The dialog itself is
 * lazy-loaded via `React.lazy()`; re-importing through the dialog
 * file forced an eager evaluation that wired up a circular dependency
 * and minified down to `TypeError: n is not a function` at boot.
 *
 * Same pattern as `useFindReplace.ts`.
 */
import { useCallback, useState } from 'react';
export function useHyperlinkDialog() {
    const [state, setState] = useState({
        isOpen: false,
        isEditing: false,
    });
    const openInsert = useCallback((selectedText) => {
        setState({
            isOpen: true,
            selectedText,
            initialData: undefined,
            isEditing: false,
        });
    }, []);
    const openEdit = useCallback((data) => {
        setState({
            isOpen: true,
            initialData: data,
            selectedText: data.displayText,
            isEditing: true,
        });
    }, []);
    const close = useCallback(() => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: false })));
    }, []);
    const toggle = useCallback(() => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: !prev.isOpen })));
    }, []);
    return { state, openInsert, openEdit, close, toggle };
}
//# sourceMappingURL=useHyperlinkDialog.js.map