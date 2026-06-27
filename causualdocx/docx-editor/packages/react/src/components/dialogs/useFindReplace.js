/**
 * useFindReplace Hook
 *
 * React hook for managing find/replace dialog state.
 * Extracted from FindReplaceDialog.tsx.
 */
import { useState, useCallback } from 'react';
import { createDefaultFindOptions } from './findReplaceUtils';
// ============================================================================
// HOOK
// ============================================================================
/**
 * Hook for managing find/replace dialog state
 */
export function useFindReplace(hookOptions) {
    var _a;
    const [state, setState] = useState({
        isOpen: false,
        searchText: '',
        replaceText: '',
        options: createDefaultFindOptions(),
        matches: [],
        currentIndex: 0,
        replaceMode: (_a = hookOptions === null || hookOptions === void 0 ? void 0 : hookOptions.initialReplaceMode) !== null && _a !== void 0 ? _a : false,
    });
    const openFind = useCallback((selectedText) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: true, replaceMode: false, searchText: selectedText || prev.searchText, matches: [], currentIndex: 0 })));
    }, []);
    const openReplace = useCallback((selectedText) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: true, replaceMode: true, searchText: selectedText || prev.searchText, matches: [], currentIndex: 0 })));
    }, []);
    const close = useCallback(() => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: false })));
    }, []);
    const toggle = useCallback(() => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { isOpen: !prev.isOpen })));
    }, []);
    const setSearchText = useCallback((text) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { searchText: text })));
    }, []);
    const setReplaceText = useCallback((text) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { replaceText: text })));
    }, []);
    const setOptions = useCallback((options) => {
        setState((prev) => (Object.assign(Object.assign({}, prev), { options: Object.assign(Object.assign({}, prev.options), options) })));
    }, []);
    const setMatches = useCallback((matches, currentIndex = 0) => {
        var _a, _b, _c;
        const newIndex = Math.max(0, Math.min(currentIndex, matches.length - 1));
        setState((prev) => (Object.assign(Object.assign({}, prev), { matches, currentIndex: matches.length > 0 ? newIndex : 0 })));
        (_a = hookOptions === null || hookOptions === void 0 ? void 0 : hookOptions.onMatchesChange) === null || _a === void 0 ? void 0 : _a.call(hookOptions, matches);
        if (matches.length > 0) {
            (_b = hookOptions === null || hookOptions === void 0 ? void 0 : hookOptions.onCurrentMatchChange) === null || _b === void 0 ? void 0 : _b.call(hookOptions, matches[newIndex], newIndex);
        }
        else {
            (_c = hookOptions === null || hookOptions === void 0 ? void 0 : hookOptions.onCurrentMatchChange) === null || _c === void 0 ? void 0 : _c.call(hookOptions, null, -1);
        }
    }, [hookOptions]);
    const goToNextMatch = useCallback(() => {
        let newIndex = 0;
        setState((prev) => {
            if (prev.matches.length === 0)
                return prev;
            newIndex = (prev.currentIndex + 1) % prev.matches.length;
            return Object.assign(Object.assign({}, prev), { currentIndex: newIndex });
        });
        return newIndex;
    }, []);
    const goToPreviousMatch = useCallback(() => {
        let newIndex = 0;
        setState((prev) => {
            if (prev.matches.length === 0)
                return prev;
            newIndex = prev.currentIndex === 0 ? prev.matches.length - 1 : prev.currentIndex - 1;
            return Object.assign(Object.assign({}, prev), { currentIndex: newIndex });
        });
        return newIndex;
    }, []);
    const goToMatch = useCallback((index) => {
        setState((prev) => {
            if (prev.matches.length === 0 || index < 0 || index >= prev.matches.length) {
                return prev;
            }
            return Object.assign(Object.assign({}, prev), { currentIndex: index });
        });
    }, []);
    const getCurrentMatch = useCallback(() => {
        if (state.matches.length === 0)
            return null;
        return state.matches[state.currentIndex] || null;
    }, [state.matches, state.currentIndex]);
    const hasMatches = useCallback(() => state.matches.length > 0, [state.matches.length]);
    return {
        state,
        openFind,
        openReplace,
        close,
        toggle,
        setSearchText,
        setReplaceText,
        setOptions,
        setMatches,
        goToNextMatch,
        goToPreviousMatch,
        goToMatch,
        getCurrentMatch,
        hasMatches,
    };
}
//# sourceMappingURL=useFindReplace.js.map