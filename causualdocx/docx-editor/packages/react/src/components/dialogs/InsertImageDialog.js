import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Insert Image Dialog Component
 *
 * Modal dialog for inserting images into the document.
 * Supports file upload with preview and basic sizing options.
 *
 * Features:
 * - File input for image selection
 * - Drag and drop support
 * - Image preview
 * - Width/height controls with aspect ratio lock
 * - Alt text input
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
// ============================================================================
// STYLES
// ============================================================================
const DIALOG_OVERLAY_STYLE = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
};
const DIALOG_CONTENT_STYLE = {
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    minWidth: '450px',
    maxWidth: '600px',
    width: '100%',
    margin: 'clamp(8px, 2.5vw, 20px)',
    maxHeight: '90vh',
    overflow: 'auto',
};
const DIALOG_HEADER_STYLE = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--doc-border)',
};
const DIALOG_TITLE_STYLE = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--doc-text)',
};
const CLOSE_BUTTON_STYLE = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    padding: '4px 8px',
    lineHeight: 1,
};
const DIALOG_BODY_STYLE = {
    padding: '20px',
};
const DROP_ZONE_STYLE = {
    border: '2px dashed var(--doc-border-input)',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color var(--doc-anim-slow), background-color var(--doc-anim-slow)',
    marginBottom: '16px',
};
const DROP_ZONE_ACTIVE_STYLE = Object.assign(Object.assign({}, DROP_ZONE_STYLE), { borderColor: 'var(--doc-primary)', backgroundColor: 'var(--doc-primary-light)' });
const DROP_ZONE_WITH_IMAGE_STYLE = Object.assign(Object.assign({}, DROP_ZONE_STYLE), { padding: '20px', borderStyle: 'solid', borderColor: 'var(--doc-primary)' });
const PREVIEW_CONTAINER_STYLE = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '250px',
    overflow: 'hidden',
};
const PREVIEW_IMAGE_STYLE = {
    maxWidth: '100%',
    maxHeight: '250px',
    objectFit: 'contain',
    borderRadius: '4px',
};
const DROP_ZONE_ICON_STYLE = {
    fontSize: '48px',
    color: 'var(--doc-text-placeholder)',
    marginBottom: '12px',
};
const DROP_ZONE_TEXT_STYLE = {
    fontSize: '14px',
    color: 'var(--doc-text-muted)',
    marginBottom: '8px',
};
const DROP_ZONE_SUBTEXT_STYLE = {
    fontSize: '12px',
    color: 'var(--doc-text-placeholder)',
};
const FORM_GROUP_STYLE = {
    marginBottom: '16px',
};
const LABEL_STYLE = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--doc-text)',
};
const INPUT_STYLE = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--doc-border-input)',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
};
const SIZE_ROW_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
};
const SIZE_INPUT_STYLE = {
    width: '100px',
    padding: '8px 12px',
    border: '1px solid var(--doc-border-input)',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
};
const LOCK_BUTTON_STYLE = {
    padding: '6px 10px',
    border: '1px solid var(--doc-border-input)',
    borderRadius: '4px',
    backgroundColor: 'var(--doc-surface, white)',
    cursor: 'pointer',
    fontSize: '16px',
};
const LOCK_BUTTON_ACTIVE_STYLE = Object.assign(Object.assign({}, LOCK_BUTTON_STYLE), { backgroundColor: 'var(--doc-primary)', borderColor: 'var(--doc-primary)', color: 'white' });
const FILE_INFO_STYLE = {
    fontSize: '12px',
    color: 'var(--doc-text-muted)',
    marginTop: '8px',
    textAlign: 'center',
};
const DIALOG_FOOTER_STYLE = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid var(--doc-border)',
};
const BUTTON_BASE_STYLE = {
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
};
const PRIMARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-primary)', color: 'white' });
const SECONDARY_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-bg-subtle)', color: 'var(--doc-text)', border: '1px solid var(--doc-border-input)' });
const DISABLED_BUTTON_STYLE = Object.assign(Object.assign({}, BUTTON_BASE_STYLE), { backgroundColor: 'var(--doc-border-input)', color: 'var(--doc-text-muted)', cursor: 'not-allowed' });
// ============================================================================
// ICONS
// ============================================================================
/**
 * Image Icon
 */
function ImageIcon() {
    return (_jsxs("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "6", y: "10", width: "36", height: "28", rx: "2", stroke: "var(--doc-text-placeholder)", strokeWidth: "2", fill: "none" }), _jsx("circle", { cx: "16", cy: "20", r: "4", stroke: "var(--doc-text-placeholder)", strokeWidth: "2", fill: "none" }), _jsx("path", { d: "M6 32L16 24L26 34L36 22L42 28", stroke: "var(--doc-text-placeholder)", strokeWidth: "2", fill: "none" })] }));
}
/**
 * Lock Icon
 */
function LockIcon({ locked }) {
    if (locked) {
        return (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M12 6V4a4 4 0 0 0-8 0v2H3v8h10V6h-1zm-6-2a2 2 0 0 1 4 0v2H6V4zm6 8H4V8h8v4z" }) }));
    }
    return (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M10 6V4a2 2 0 0 0-4 0v2H4v8h8V6h-2zM6 4a2 2 0 0 1 4 0v2h-2V4H6v2H4v2H6V4zm4 8H6V8h4v4z" }) }));
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * InsertImageDialog - Modal for inserting images with preview and sizing
 */
export function InsertImageDialog({ isOpen, onClose, onInsert, maxWidth = 800, maxHeight = 600, accept = 'image/*', className, style, }) {
    const { t } = useTranslation();
    // State
    const [imageData, setImageData] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [altText, setAltText] = useState('');
    const [aspectLocked, setAspectLocked] = useState(true);
    const [originalAspectRatio, setOriginalAspectRatio] = useState(1);
    const [error, setError] = useState(null);
    // Refs
    const fileInputRef = useRef(null);
    const dialogRef = useRef(null);
    // Reset state when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setImageData(null);
            setIsDragging(false);
            setWidth(0);
            setHeight(0);
            setAltText('');
            setAspectLocked(true);
            setOriginalAspectRatio(1);
            setError(null);
        }
    }, [isOpen]);
    /**
     * Process a file and load image data
     */
    const processFile = useCallback((file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError(t('dialogs.insertImage.invalidFile'));
            return;
        }
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError(t('dialogs.insertImage.fileTooLarge'));
            return;
        }
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            const src = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            // Load image to get dimensions
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                // Scale down if exceeds max dimensions
                if (w > maxWidth || h > maxHeight) {
                    const scaleW = maxWidth / w;
                    const scaleH = maxHeight / h;
                    const scale = Math.min(scaleW, scaleH);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }
                setWidth(w);
                setHeight(h);
                setOriginalAspectRatio(img.width / img.height);
                setImageData({
                    src,
                    width: w,
                    height: h,
                    fileName: file.name,
                    mimeType: file.type,
                });
            };
            img.src = src;
        };
        reader.onerror = () => {
            setError('Failed to read image file');
        };
        reader.readAsDataURL(file);
    }, [maxWidth, maxHeight]);
    /**
     * Handle file input change
     */
    const handleFileChange = useCallback((e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);
    /**
     * Handle drop zone click
     */
    const handleDropZoneClick = useCallback(() => {
        var _a;
        (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    }, []);
    /**
     * Handle drag over
     */
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    /**
     * Handle drag leave
     */
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    /**
     * Handle drop
     */
    const handleDrop = useCallback((e) => {
        var _a;
        e.preventDefault();
        setIsDragging(false);
        const file = (_a = e.dataTransfer.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);
    /**
     * Handle width change
     */
    const handleWidthChange = useCallback((e) => {
        const newWidth = parseInt(e.target.value, 10) || 0;
        setWidth(newWidth);
        if (aspectLocked && originalAspectRatio) {
            setHeight(Math.round(newWidth / originalAspectRatio));
        }
    }, [aspectLocked, originalAspectRatio]);
    /**
     * Handle height change
     */
    const handleHeightChange = useCallback((e) => {
        const newHeight = parseInt(e.target.value, 10) || 0;
        setHeight(newHeight);
        if (aspectLocked && originalAspectRatio) {
            setWidth(Math.round(newHeight * originalAspectRatio));
        }
    }, [aspectLocked, originalAspectRatio]);
    /**
     * Handle insert
     */
    const handleInsert = useCallback(() => {
        if (imageData) {
            onInsert(Object.assign(Object.assign({}, imageData), { width,
                height, alt: altText || undefined }));
        }
    }, [imageData, width, height, altText, onInsert]);
    /**
     * Handle keyboard events
     */
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        else if (e.key === 'Enter' && imageData && !e.shiftKey) {
            e.preventDefault();
            handleInsert();
        }
    }, [onClose, imageData, handleInsert]);
    /**
     * Handle overlay click
     */
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);
    /**
     * Clear current image
     */
    const handleClear = useCallback(() => {
        setImageData(null);
        setWidth(0);
        setHeight(0);
        setAltText('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    // Don't render if not open
    if (!isOpen) {
        return null;
    }
    const canInsert = imageData !== null && width > 0 && height > 0;
    // Get drop zone style
    const getDropZoneStyle = () => {
        if (imageData)
            return DROP_ZONE_WITH_IMAGE_STYLE;
        if (isDragging)
            return DROP_ZONE_ACTIVE_STYLE;
        return DROP_ZONE_STYLE;
    };
    return (_jsx(FocusTrap, { children: _jsx("div", { className: `docx-insert-image-dialog-overlay ${className || ''}`, style: Object.assign(Object.assign({}, DIALOG_OVERLAY_STYLE), style), onClick: handleOverlayClick, onKeyDown: handleKeyDown, role: "dialog", "aria-modal": "true", "aria-labelledby": "insert-image-dialog-title", children: _jsxs("div", { ref: dialogRef, className: "docx-insert-image-dialog", style: DIALOG_CONTENT_STYLE, tabIndex: -1, children: [_jsxs("div", { className: "docx-insert-image-dialog-header", style: DIALOG_HEADER_STYLE, children: [_jsx("h2", { id: "insert-image-dialog-title", style: DIALOG_TITLE_STYLE, children: t('dialogs.insertImage.title') }), _jsx("button", { type: "button", className: "docx-insert-image-dialog-close", style: CLOSE_BUTTON_STYLE, onClick: onClose, "aria-label": t('common.closeDialog'), children: "\u00D7" })] }), _jsxs("div", { className: "docx-insert-image-dialog-body", style: DIALOG_BODY_STYLE, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: accept, onChange: handleFileChange, style: { display: 'none' } }), _jsx("div", { className: "docx-insert-image-dropzone", style: getDropZoneStyle(), onClick: handleDropZoneClick, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, role: "button", tabIndex: 0, "aria-label": t('dialogs.insertImage.uploadAriaLabel'), children: imageData ? (_jsx("div", { style: PREVIEW_CONTAINER_STYLE, children: _jsx("img", { src: imageData.src, alt: altText || 'Preview', style: PREVIEW_IMAGE_STYLE }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: DROP_ZONE_ICON_STYLE, children: _jsx(ImageIcon, {}) }), _jsx("div", { style: DROP_ZONE_TEXT_STYLE, children: t('dialogs.insertImage.uploadText') }), _jsx("div", { style: DROP_ZONE_SUBTEXT_STYLE, children: t('dialogs.insertImage.uploadSubtext') })] })) }), (imageData === null || imageData === void 0 ? void 0 : imageData.fileName) && (_jsxs("div", { style: FILE_INFO_STYLE, children: [imageData.fileName, _jsx("button", { type: "button", onClick: (e) => {
                                            e.stopPropagation();
                                            handleClear();
                                        }, style: {
                                            marginLeft: '8px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--doc-primary)',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                        }, children: t('common.change') })] })), error && (_jsx("div", { style: {
                                    color: 'var(--doc-error)',
                                    fontSize: '14px',
                                    marginBottom: '16px',
                                    textAlign: 'center',
                                }, children: error })), imageData && (_jsxs(_Fragment, { children: [_jsxs("div", { style: FORM_GROUP_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: t('dialogs.insertImage.dimensions') }), _jsxs("div", { style: SIZE_ROW_STYLE, children: [_jsx("span", { style: { fontSize: '14px', color: 'var(--doc-text-muted)' }, children: t('dialogs.insertImage.widthLabel') }), _jsx("input", { type: "number", value: width, onChange: handleWidthChange, min: 1, max: maxWidth, style: SIZE_INPUT_STYLE }), _jsx("span", { style: { fontSize: '14px', color: 'var(--doc-text-muted)' }, children: t('common.px') }), _jsx("button", { type: "button", onClick: () => setAspectLocked(!aspectLocked), style: aspectLocked ? LOCK_BUTTON_ACTIVE_STYLE : LOCK_BUTTON_STYLE, title: aspectLocked
                                                            ? t('dialogs.insertImage.aspectRatioLocked')
                                                            : t('dialogs.insertImage.aspectRatioUnlocked'), children: _jsx(LockIcon, { locked: aspectLocked }) }), _jsx("span", { style: { fontSize: '14px', color: 'var(--doc-text-muted)' }, children: t('dialogs.insertImage.heightLabel') }), _jsx("input", { type: "number", value: height, onChange: handleHeightChange, min: 1, max: maxHeight, style: SIZE_INPUT_STYLE }), _jsx("span", { style: { fontSize: '14px', color: 'var(--doc-text-muted)' }, children: t('common.px') })] })] }), _jsxs("div", { style: FORM_GROUP_STYLE, children: [_jsx("label", { htmlFor: "insert-image-alt", style: LABEL_STYLE, children: t('dialogs.insertImage.altTextLabel') }), _jsx("input", { id: "insert-image-alt", type: "text", value: altText, onChange: (e) => setAltText(e.target.value), placeholder: t('dialogs.insertImage.altTextPlaceholder'), style: INPUT_STYLE })] })] }))] }), _jsxs("div", { className: "docx-insert-image-dialog-footer", style: DIALOG_FOOTER_STYLE, children: [_jsx("button", { type: "button", className: "docx-insert-image-dialog-cancel", style: SECONDARY_BUTTON_STYLE, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", className: "docx-insert-image-dialog-insert", style: canInsert ? PRIMARY_BUTTON_STYLE : DISABLED_BUTTON_STYLE, onClick: handleInsert, disabled: !canInsert, children: t('dialogs.insertImage.insertButton') })] })] }) }) }));
}
// ============================================================================
// HOOK
// ============================================================================
/**
 * Hook for managing Insert Image dialog state
 */
export function useInsertImageDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
    return { isOpen, open, close, toggle };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Check if a file is a valid image
 */
export function isValidImageFile(file) {
    return file.type.startsWith('image/');
}
/**
 * Get supported image extensions
 */
export function getSupportedImageExtensions() {
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
}
/**
 * Get accept string for file input
 */
export function getImageAcceptString() {
    return 'image/png,image/jpeg,image/gif,image/webp,image/bmp,image/svg+xml';
}
/**
 * Calculate scaled dimensions to fit within bounds
 */
export function calculateFitDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
        return { width: originalWidth, height: originalHeight };
    }
    const scaleX = maxWidth / originalWidth;
    const scaleY = maxHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    return {
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale),
    };
}
/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl) {
    var _a;
    const parts = dataUrl.split(',');
    const mime = ((_a = parts[0].match(/:(.*?);/)) === null || _a === void 0 ? void 0 : _a[1]) || 'image/png';
    const binaryString = atob(parts[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
}
/**
 * Get image dimensions from a data URL
 */
export function getImageDimensions(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}
/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
// ============================================================================
// EXPORTS
// ============================================================================
export default InsertImageDialog;
//# sourceMappingURL=InsertImageDialog.js.map