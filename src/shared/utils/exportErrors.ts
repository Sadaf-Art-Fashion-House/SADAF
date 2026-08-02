/**
 * Shared export-error message builders.
 *
 * Single source of truth for every export-failure message in the app — used
 * by BOTH the Error Logs entry (logExportError) and the user-facing banner
 * text (setExportError / setToolbarExportError). Wording can be adjusted in
 * exactly one place and every surface stays consistent.
 */

/** File-based export formats (charts, KPIs, watermark samples). */
export type ExportFileFormat = 'png' | 'pdf';

/** Toolbar-level export kinds (current-tab charts / full report / all). */
export type ToolbarExportKind = 'charts' | 'report' | 'all';

/**
 * Build the core export-failure message for a file export:
 * `Failed to export PNG (revenue_overview.png).`
 * or, with a detail:
 * `Failed to export PNG (revenue_overview.png): could not render the preview.`
 */
export function buildExportErrorMessage(
    format: ExportFileFormat,
    filename: string,
    detail?: string,
): string {
    const base = `Failed to export ${format.toUpperCase()} (${filename}.${format})`;
    return detail ? `${base}: ${detail}.` : `${base}.`;
}

/** User-facing variant of the file-export failure message. */
export function buildExportUserMessage(
    format: ExportFileFormat,
    filename: string,
    detail?: string,
): string {
    return `${buildExportErrorMessage(format, filename, detail)} Please try again.`;
}

/** User-facing message for the toolbar-level exports (charts / report / all). */
export function buildToolbarExportUserMessage(
    kind: ToolbarExportKind,
    tabLabel?: string,
): string {
    switch (kind) {
        case 'charts':
            return `Failed to export ${tabLabel ?? 'current tab'} charts. Please try again.`;
        case 'report':
            return 'Failed to export the full report. Please try again.';
        case 'all':
            return 'Failed to export the complete dashboard report. Please try again.';
    }
}

/** Shown when the watermark preview could not be rendered for export. */
export const EXPORT_PREVIEW_RENDER_ERROR = 'Could not render the preview for export. Tap Retry to try again.';

/** Generic export-failure message with a retry hint. */
export const EXPORT_GENERIC_ERROR = 'Export failed. Tap Retry to try again.';

/** Detail reason used when no captureable DOM elements were found. */
export const EXPORT_NO_ELEMENTS_DETAIL = 'no exportable elements found';

/** Detail reason used when the watermark preview renderer failed. */
export const EXPORT_PREVIEW_RENDER_DETAIL = 'could not render the watermark preview';
