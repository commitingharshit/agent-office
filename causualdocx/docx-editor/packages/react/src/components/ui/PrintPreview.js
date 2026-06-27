import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from '../../i18n';
// ============================================================================
// DEFAULT VALUES
// ============================================================================
const DEFAULT_PRINT_OPTIONS = {
    includeHeaders: true,
    includeFooters: true,
    includePageNumbers: true,
    pageRange: null,
    scale: 1.0,
    printBackground: true,
    margins: 'default',
};
// ============================================================================
// PRINT BUTTON COMPONENT
// ============================================================================
/**
 * PrintButton - Standalone print button for toolbar
 */
export function PrintButton({ onPrint, disabled = false, label: labelProp, className = '', style, showIcon = true, compact = false, }) {
    const { t } = useTranslation();
    const label = labelProp !== null && labelProp !== void 0 ? labelProp : t('print.label');
    const buttonStyle = Object.assign({ display: 'flex', alignItems: 'center', gap: compact ? '4px' : '6px', padding: compact ? '4px 8px' : '6px 12px', fontSize: compact ? '13px' : '14px', backgroundColor: 'var(--doc-surface, white)', border: '1px solid var(--doc-border)', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? 'var(--doc-text-muted)' : 'var(--doc-text)', opacity: disabled ? 0.6 : 1, transition: 'background-color var(--doc-anim-base), border-color var(--doc-anim-base)' }, style);
    return (_jsxs("button", { className: `docx-print-button ${className}`.trim(), style: buttonStyle, onClick: onPrint, disabled: disabled, "aria-label": label, title: label, children: [showIcon && _jsx(PrintIcon, { size: compact ? 14 : 16 }), !compact && _jsx("span", { children: label })] }));
}
// ============================================================================
// PRINT STYLES COMPONENT
// ============================================================================
/**
 * PrintStyles - Injects print-specific CSS
 */
export function PrintStyles() {
    return (_jsx("style", { children: `
        @media print {
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }

          .docx-print-pages,
          .docx-print-pages * {
            visibility: visible;
          }

          .docx-print-pages {
            position: absolute;
            left: 0;
            top: 0;
          }

          /* Remove shadows and margins in print */
          .docx-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
            page-break-inside: avoid;
          }

          /* Ensure images print */
          img {
            max-width: 100%;
            page-break-inside: avoid;
          }

          /* Ensure tables don't break badly */
          table {
            page-break-inside: avoid;
          }

          tr {
            page-break-inside: avoid;
          }

          /* Keep headings with content */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }

          /* Avoid orphan lines */
          p {
            orphans: 3;
            widows: 3;
          }
        }

        @page {
          margin: 0;
          size: auto;
        }
      ` }));
}
function PrintIcon({ size = 18 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "6 9 6 2 18 2 18 9" }), _jsx("path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }), _jsx("rect", { x: "6", y: "14", width: "12", height: "8" })] }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Trigger browser print dialog for the current document
 */
export function triggerPrint() {
    window.print();
}
/**
 * Create print-optimized document view in a new window
 */
export function openPrintWindow(title = 'Document', content) {
    const printWindow = window.open('', '_blank');
    if (!printWindow)
        return null;
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `);
    printWindow.document.close();
    return printWindow;
}
/**
 * Get default print options
 */
export function getDefaultPrintOptions() {
    return Object.assign({}, DEFAULT_PRINT_OPTIONS);
}
/**
 * Create page range from string (e.g., "1-5", "3", "1,3,5")
 */
export function parsePageRange(input, maxPages) {
    if (!input || !input.trim())
        return null;
    const trimmed = input.trim();
    // Single page
    if (/^\d+$/.test(trimmed)) {
        const page = parseInt(trimmed, 10);
        if (page >= 1 && page <= maxPages) {
            return { start: page, end: page };
        }
        return null;
    }
    // Range (e.g., "1-5")
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (start >= 1 && end <= maxPages && start <= end) {
            return { start, end };
        }
        return null;
    }
    return null;
}
/**
 * Format page range for display
 */
export function formatPageRange(range, totalPages) {
    if (!range)
        return `All (${totalPages} pages)`;
    if (range.start === range.end)
        return `Page ${range.start}`;
    return `Pages ${range.start}-${range.end}`;
}
/**
 * Check if browser supports good print functionality
 */
export function isPrintSupported() {
    return typeof window !== 'undefined' && typeof window.print === 'function';
}
//# sourceMappingURL=PrintPreview.js.map