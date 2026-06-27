import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Error Boundary Component
 *
 * Catches render errors and displays fallback UI.
 * Also provides error toast/notification system.
 */
import { Component, createContext, useContext, useState, useCallback, useMemo, useSyncExternalStore, } from 'react';
import { ErrorManager } from '@eigenpal/docx-core';
import { useTranslation } from '../i18n';
// ============================================================================
// CONTEXT
// ============================================================================
const ErrorContext = createContext(null);
/**
 * Hook to use error notifications
 */
export function useErrorNotifications() {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useErrorNotifications must be used within an ErrorProvider');
    }
    return context;
}
// ============================================================================
// ERROR PROVIDER
// ============================================================================
/**
 * Error notification provider
 *
 * Thin React wrapper around the framework-agnostic ErrorManager.
 * Uses useSyncExternalStore to subscribe to ErrorManager state.
 */
export function ErrorProvider({ children }) {
    // Create ErrorManager once
    const manager = useMemo(() => new ErrorManager(), []);
    // Subscribe to manager state
    const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot);
    const showError = useCallback((message, details) => {
        manager.showError(message, details);
    }, [manager]);
    const showWarning = useCallback((message, details) => {
        manager.showWarning(message, details);
    }, [manager]);
    const showInfo = useCallback((message, details) => {
        manager.showInfo(message, details);
    }, [manager]);
    const dismissNotification = useCallback((id) => {
        manager.dismiss(id);
    }, [manager]);
    const clearNotifications = useCallback(() => {
        manager.clearAll();
    }, [manager]);
    const value = useMemo(() => ({
        notifications: snapshot.notifications,
        showError,
        showWarning,
        showInfo,
        dismissNotification,
        clearNotifications,
    }), [
        snapshot.notifications,
        showError,
        showWarning,
        showInfo,
        dismissNotification,
        clearNotifications,
    ]);
    return (_jsxs(ErrorContext.Provider, { value: value, children: [children, _jsx(NotificationContainer, { notifications: snapshot.notifications, onDismiss: dismissNotification })] }));
}
function NotificationContainer({ notifications, onDismiss }) {
    const visibleNotifications = notifications.filter((n) => !n.dismissed);
    if (visibleNotifications.length === 0) {
        return null;
    }
    const containerStyle = {
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '400px',
    };
    return (_jsx("div", { className: "docx-notification-container", style: containerStyle, children: visibleNotifications.map((notification) => (_jsx(NotificationToast, { notification: notification, onDismiss: () => onDismiss(notification.id) }, notification.id))) }));
}
function NotificationToast({ notification, onDismiss }) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const getColors = (severity) => {
        switch (severity) {
            case 'error':
                return {
                    bg: 'var(--doc-error-bg)',
                    border: 'var(--doc-error-border)',
                    text: 'var(--doc-error)',
                    icon: 'var(--doc-error)',
                };
            case 'warning':
                return {
                    bg: 'var(--doc-warning-bg)',
                    border: 'var(--doc-warning-border)',
                    text: 'var(--doc-warning-text)',
                    icon: 'var(--doc-warning)',
                };
            case 'info':
                return {
                    bg: 'var(--doc-info-bg)',
                    border: 'var(--doc-info-border)',
                    text: 'var(--doc-info-text)',
                    icon: 'var(--doc-info)',
                };
        }
    };
    const colors = getColors(notification.severity);
    const toastStyle = {
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        animation: 'slideIn 0.3s ease-out',
    };
    const headerStyle = {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
    };
    const iconStyle = {
        color: colors.icon,
        flexShrink: 0,
    };
    const contentStyle = {
        flex: 1,
        minWidth: 0,
    };
    const messageStyle = {
        color: colors.text,
        fontSize: '14px',
        fontWeight: 500,
        wordBreak: 'break-word',
    };
    const detailsStyle = {
        marginTop: '8px',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: colors.text,
        maxHeight: '200px',
        overflow: 'auto',
    };
    const buttonStyle = {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text,
    };
    const getIcon = (severity) => {
        switch (severity) {
            case 'error':
                return (_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", children: [_jsx("circle", { cx: "10", cy: "10", r: "8", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M10 6v5M10 13v1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
            case 'warning':
                return (_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", children: [_jsx("path", { d: "M10 3L18 17H2L10 3z", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }), _jsx("path", { d: "M10 8v4M10 14v1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
            case 'info':
                return (_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", children: [_jsx("circle", { cx: "10", cy: "10", r: "8", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M10 9v5M10 6v1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
        }
    };
    return (_jsxs("div", { className: `docx-notification-toast docx-notification-${notification.severity}`, style: toastStyle, children: [_jsx("style", { children: `
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        ` }), _jsxs("div", { style: headerStyle, children: [_jsx("span", { style: iconStyle, children: getIcon(notification.severity) }), _jsxs("div", { style: contentStyle, children: [_jsx("div", { style: messageStyle, children: notification.message }), notification.details && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setIsExpanded(!isExpanded), style: Object.assign(Object.assign({}, buttonStyle), { marginTop: '4px', fontSize: '12px', padding: '2px 8px' }), children: isExpanded ? t('errors.hideDetails') : t('errors.showDetails') }), isExpanded && _jsx("div", { style: detailsStyle, children: notification.details })] }))] }), _jsx("button", { type: "button", onClick: onDismiss, style: buttonStyle, title: t('common.dismiss'), children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] })] }));
}
// ============================================================================
// ERROR BOUNDARY
// ============================================================================
/**
 * Error Boundary class component
 *
 * Catches render errors in child components and displays fallback UI.
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.resetError = () => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
            });
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log error
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // Call callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }
    render() {
        if (this.state.hasError) {
            const { fallback, showDetails = true } = this.props;
            const { error, errorInfo } = this.state;
            // Custom fallback
            if (fallback) {
                if (typeof fallback === 'function') {
                    return fallback(error, this.resetError);
                }
                return fallback;
            }
            // Default fallback UI
            return (_jsx(DefaultErrorFallback, { error: error, errorInfo: errorInfo, showDetails: showDetails, onReset: this.resetError }));
        }
        return this.props.children;
    }
}
function DefaultErrorFallback({ error, errorInfo, showDetails, onReset, }) {
    const { t } = useTranslation();
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
        minHeight: '200px',
        background: 'var(--doc-surface, white)',
        borderRadius: '8px',
        border: '1px solid var(--doc-border)',
        margin: '20px',
    };
    const iconStyle = {
        color: 'var(--doc-error)',
        marginBottom: '16px',
    };
    const titleStyle = {
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--doc-text)',
        marginBottom: '8px',
    };
    const messageStyle = {
        fontSize: '14px',
        color: 'var(--doc-text-muted)',
        marginBottom: '16px',
        maxWidth: '400px',
    };
    const detailsStyle = {
        width: '100%',
        maxWidth: '600px',
        marginBottom: '16px',
        padding: '12px',
        background: 'var(--doc-error-bg)',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '200px',
        overflow: 'auto',
    };
    const buttonStyle = {
        padding: '10px 20px',
        background: 'var(--doc-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: 'pointer',
    };
    return (_jsxs("div", { className: "docx-error-fallback", style: containerStyle, children: [_jsx("div", { style: iconStyle, children: _jsxs("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", children: [_jsx("circle", { cx: "24", cy: "24", r: "20", stroke: "currentColor", strokeWidth: "2" }), _jsx("path", { d: "M24 14v12M24 30v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })] }) }), _jsx("h2", { style: titleStyle, children: t('errors.somethingWentWrong') }), _jsx("p", { style: messageStyle, children: t('errors.errorDescription') }), showDetails && (_jsxs("div", { style: detailsStyle, children: [_jsx("strong", { children: t('errors.errorLabel') }), " ", error.message, errorInfo && (_jsxs(_Fragment, { children: ['\n\n', _jsx("strong", { children: t('errors.componentStack') }), errorInfo.componentStack] }))] })), _jsx("button", { type: "button", onClick: onReset, style: buttonStyle, children: t('errors.tryAgain') })] }));
}
/**
 * Parse error display component
 *
 * Shows a helpful message for DOCX parsing errors.
 */
export function ParseErrorDisplay({ message, details, onRetry, className = '', }) {
    const { t } = useTranslation();
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
        background: 'var(--doc-surface, white)',
        borderRadius: '8px',
        border: '1px solid var(--doc-border-light)',
    };
    const iconStyle = {
        color: 'var(--doc-error)',
        marginBottom: '16px',
    };
    const titleStyle = {
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--doc-text)',
        marginBottom: '8px',
    };
    const messageStyle = {
        fontSize: '14px',
        color: 'var(--doc-text-muted)',
        marginBottom: '16px',
        maxWidth: '400px',
    };
    const detailsStyle = {
        marginBottom: '16px',
        padding: '12px',
        background: 'var(--doc-bg)',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '100%',
        overflow: 'auto',
        textAlign: 'left',
    };
    const buttonStyle = {
        padding: '8px 16px',
        background: 'var(--doc-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '13px',
        cursor: 'pointer',
    };
    return (_jsxs("div", { className: `docx-parse-error ${className}`, style: containerStyle, children: [_jsx("div", { style: iconStyle, children: _jsxs("svg", { width: "40", height: "40", viewBox: "0 0 40 40", fill: "none", children: [_jsx("path", { d: "M10 10h20v20H10z", stroke: "currentColor", strokeWidth: "2", strokeLinejoin: "round" }), _jsx("path", { d: "M25 10l-10 20M15 10l10 20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })] }) }), _jsx("h3", { style: titleStyle, children: t('errors.unableToParse') }), _jsx("p", { style: messageStyle, children: message }), details && _jsx("div", { style: detailsStyle, children: details }), onRetry && (_jsx("button", { type: "button", onClick: onRetry, style: buttonStyle, children: t('errors.tryAgain') }))] }));
}
/**
 * Unsupported feature warning component
 *
 * Shows a non-blocking warning for unsupported features.
 */
export function UnsupportedFeatureWarning({ feature, description, className = '', }) {
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--doc-warning-bg)',
        border: '1px solid var(--doc-warning-border)',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--doc-warning-text)',
    };
    const iconStyle = {
        flexShrink: 0,
        color: 'var(--doc-warning)',
    };
    return (_jsxs("div", { className: `docx-unsupported-warning ${className}`, style: containerStyle, children: [_jsx("span", { style: iconStyle, children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [_jsx("path", { d: "M8 2l7 12H1L8 2z", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }), _jsx("path", { d: "M8 6v4M8 12v1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }) }), _jsxs("span", { children: [_jsx("strong", { children: feature }), description && `: ${description}`] })] }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Check if an error is a parse error
 */
export function isParseError(error) {
    return (error.message.includes('parse') ||
        error.message.includes('Parse') ||
        error.message.includes('XML') ||
        error.message.includes('DOCX') ||
        error.message.includes('Invalid'));
}
/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
    }
    if (message.includes('parse') || message.includes('xml') || message.includes('invalid')) {
        return 'The document could not be parsed. It may be corrupted or in an unsupported format.';
    }
    if (message.includes('permission') || message.includes('access')) {
        return 'Access denied. You may not have permission to access this file.';
    }
    if (message.includes('not found') || message.includes('404')) {
        return 'The requested file was not found.';
    }
    if (message.includes('timeout')) {
        return 'The operation timed out. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
}
// ============================================================================
// EXPORTS
// ============================================================================
export default ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map