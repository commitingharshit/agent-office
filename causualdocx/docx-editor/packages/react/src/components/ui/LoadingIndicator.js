var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Loading Indicator Component
 *
 * Displays loading states for operations with configurable appearance.
 * Features:
 * - Multiple spinner styles (spinner, dots, bar, pulse)
 * - Overlay mode for blocking UI during operations
 * - Inline mode for subtle loading indication
 * - Progress bar variant
 * - Hook for managing loading states
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
// ============================================================================
// CONSTANTS
// ============================================================================
const SIZE_CONFIG = {
    small: { size: 16, strokeWidth: 2, fontSize: 11 },
    medium: { size: 32, strokeWidth: 3, fontSize: 13 },
    large: { size: 48, strokeWidth: 4, fontSize: 14 },
};
const DEFAULT_COLOR = 'var(--doc-primary)';
const MIN_LOADING_DURATION = 300; // Minimum ms to show loading to prevent flash
// ============================================================================
// KEYFRAMES STYLES
// ============================================================================
const spinnerKeyframes = `
@keyframes docx-loading-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes docx-loading-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.95); }
}

@keyframes docx-loading-dots {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@keyframes docx-loading-bar {
  0% { left: -35%; right: 100%; }
  60% { left: 100%; right: -90%; }
  100% { left: 100%; right: -90%; }
}
`;
// ============================================================================
// SPINNER VARIANTS
// ============================================================================
const SpinnerVariant = ({ size, strokeWidth, color, }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    return (_jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: {
            animation: 'docx-loading-spin 1s linear infinite',
        }, children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeDasharray: `${circumference * 0.75} ${circumference}`, opacity: 0.25 }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeDasharray: `${circumference * 0.25} ${circumference}`, transform: `rotate(-90 ${size / 2} ${size / 2})` })] }));
};
const DotsVariant = ({ size, color }) => {
    const dotSize = size / 4;
    const gap = dotSize / 2;
    return (_jsx("div", { style: { display: 'flex', gap: `${gap}px` }, children: [0, 1, 2].map((index) => (_jsx("div", { style: {
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                backgroundColor: color,
                animation: `docx-loading-dots 1.4s ease-in-out ${index * 0.16}s infinite both`,
            } }, index))) }));
};
const BarVariant = ({ size, color }) => {
    return (_jsx("div", { style: {
            width: size * 3,
            height: size / 4,
            backgroundColor: `${color}20`,
            borderRadius: size / 8,
            overflow: 'hidden',
            position: 'relative',
        }, children: _jsx("div", { style: {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: color,
                borderRadius: size / 8,
                animation: 'docx-loading-bar 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
            } }) }));
};
const PulseVariant = ({ size, color }) => {
    return (_jsx("div", { style: {
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            animation: 'docx-loading-pulse 1.5s ease-in-out infinite',
        } }));
};
const ProgressVariant = ({ size, color, progress, showText, fontSize }) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    return (_jsxs("div", { style: {
            width: size * 3,
            height: size / 4,
            backgroundColor: `${color}20`,
            borderRadius: size / 8,
            overflow: 'hidden',
            position: 'relative',
        }, children: [_jsx("div", { style: {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${clampedProgress}%`,
                    backgroundColor: color,
                    borderRadius: size / 8,
                    transition: 'width var(--doc-anim-slow)',
                } }), showText && (_jsxs("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize,
                    fontWeight: 500,
                    color: clampedProgress > 50 ? '#fff' : color,
                }, children: [Math.round(clampedProgress), "%"] }))] }));
};
// ============================================================================
// LOADING INDICATOR COMPONENT
// ============================================================================
export const LoadingIndicator = ({ isLoading, variant = 'spinner', size = 'medium', message, overlay = false, overlayOpacity = 0.5, progress = 0, showProgressText = true, color = DEFAULT_COLOR, className = '', style, }) => {
    const { t } = useTranslation();
    const sizeConfig = SIZE_CONFIG[size];
    // Inject keyframes
    useEffect(() => {
        const styleId = 'docx-loading-keyframes';
        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = spinnerKeyframes;
            document.head.appendChild(styleElement);
        }
    }, []);
    if (!isLoading)
        return null;
    const renderVariant = () => {
        switch (variant) {
            case 'spinner':
                return (_jsx(SpinnerVariant, { size: sizeConfig.size, strokeWidth: sizeConfig.strokeWidth, color: color }));
            case 'dots':
                return _jsx(DotsVariant, { size: sizeConfig.size, color: color });
            case 'bar':
                return _jsx(BarVariant, { size: sizeConfig.size, color: color });
            case 'pulse':
                return _jsx(PulseVariant, { size: sizeConfig.size, color: color });
            case 'progress':
                return (_jsx(ProgressVariant, { size: sizeConfig.size, color: color, progress: progress, showText: showProgressText, fontSize: sizeConfig.fontSize }));
            default:
                return null;
        }
    };
    const content = (_jsxs("div", { className: `docx-loading-content ${className}`, style: Object.assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }, style), children: [renderVariant(), message && (_jsx("div", { style: {
                    fontSize: sizeConfig.fontSize,
                    color: overlay ? 'white' : 'var(--doc-text-muted)',
                    textAlign: 'center',
                }, children: message }))] }));
    if (overlay) {
        return (_jsx("div", { className: `docx-loading-overlay ${className}`, style: Object.assign({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`, zIndex: 10000 }, style), role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": variant === 'progress' ? progress : undefined, "aria-busy": "true", "aria-label": message || t('loading.label'), children: content }));
    }
    return (_jsx("div", { className: `docx-loading-inline ${className}`, style: Object.assign({ display: 'inline-flex', alignItems: 'center' }, style), role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": variant === 'progress' ? progress : undefined, "aria-busy": "true", "aria-label": message || 'Loading', children: content }));
};
// ============================================================================
// USE LOADING HOOK
// ============================================================================
/**
 * Hook to manage loading states
 */
export function useLoading(options = {}) {
    const { initialLoading = false, minDuration = MIN_LOADING_DURATION, onStart, onEnd } = options;
    const [isLoading, setIsLoading] = useState(initialLoading);
    const [message, setMessage] = useState(null);
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef(null);
    const minDurationTimeoutRef = useRef(null);
    /**
     * Start loading
     */
    const startLoading = useCallback((msg) => {
        startTimeRef.current = Date.now();
        setIsLoading(true);
        setMessage(msg || null);
        setProgress(0);
        onStart === null || onStart === void 0 ? void 0 : onStart();
    }, [onStart]);
    /**
     * Stop loading (respects minimum duration)
     */
    const stopLoading = useCallback(() => {
        const startTime = startTimeRef.current;
        const now = Date.now();
        const elapsed = startTime ? now - startTime : 0;
        const remaining = Math.max(0, minDuration - elapsed);
        if (remaining > 0) {
            minDurationTimeoutRef.current = setTimeout(() => {
                setIsLoading(false);
                setMessage(null);
                setProgress(0);
                startTimeRef.current = null;
                onEnd === null || onEnd === void 0 ? void 0 : onEnd();
            }, remaining);
        }
        else {
            setIsLoading(false);
            setMessage(null);
            setProgress(0);
            startTimeRef.current = null;
            onEnd === null || onEnd === void 0 ? void 0 : onEnd();
        }
    }, [minDuration, onEnd]);
    /**
     * Wrap an async operation with loading state
     */
    const withLoading = useCallback((operation, msg) => __awaiter(this, void 0, void 0, function* () {
        startLoading(msg);
        try {
            const result = yield operation();
            stopLoading();
            return result;
        }
        catch (error) {
            stopLoading();
            throw error;
        }
    }), [startLoading, stopLoading]);
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (minDurationTimeoutRef.current) {
                clearTimeout(minDurationTimeoutRef.current);
            }
        };
    }, []);
    return {
        isLoading,
        message,
        progress,
        startLoading,
        stopLoading,
        setProgress,
        setMessage,
        withLoading,
    };
}
// ============================================================================
// MULTIPLE LOADING OPERATIONS HOOK
// ============================================================================
/**
 * Hook to manage multiple concurrent loading operations
 */
export function useLoadingOperations() {
    const [operations, setOperations] = useState(new Map());
    const startOperation = useCallback((id, message) => {
        setOperations((prev) => {
            const next = new Map(prev);
            next.set(id, {
                id,
                message,
                startTime: Date.now(),
            });
            return next;
        });
    }, []);
    const updateOperation = useCallback((id, updates) => {
        setOperations((prev) => {
            const existing = prev.get(id);
            if (!existing)
                return prev;
            const next = new Map(prev);
            next.set(id, Object.assign(Object.assign({}, existing), updates));
            return next;
        });
    }, []);
    const endOperation = useCallback((id) => {
        setOperations((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }, []);
    const isAnyLoading = operations.size > 0;
    const activeOperations = Array.from(operations.values());
    return {
        operations: activeOperations,
        isAnyLoading,
        startOperation,
        updateOperation,
        endOperation,
        getOperation: (id) => operations.get(id),
    };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get loading variant label
 */
export function getLoadingVariantLabel(variant) {
    const labels = {
        spinner: 'Spinner',
        dots: 'Dots',
        bar: 'Bar',
        pulse: 'Pulse',
        progress: 'Progress',
    };
    return labels[variant];
}
/**
 * Get all loading variants
 */
export function getAllLoadingVariants() {
    return ['spinner', 'dots', 'bar', 'pulse', 'progress'];
}
/**
 * Get all loading sizes
 */
export function getAllLoadingSizes() {
    return ['small', 'medium', 'large'];
}
/**
 * Create a delay promise for testing loading states
 */
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// ============================================================================
// EXPORTS
// ============================================================================
export default LoadingIndicator;
//# sourceMappingURL=LoadingIndicator.js.map