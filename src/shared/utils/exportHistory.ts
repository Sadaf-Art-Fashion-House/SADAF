/**
 * Export History — a lightweight local record of recent export operations
 * (PNG/PDF from charts, KPIs, reports, and the watermark preview) so the
 * dashboard can show the user what was exported, when, and whether it
 * succeeded — without any server dependency.
 *
 * Storage: localStorage, capped at MAX_ENTRIES (10). Every write dispatches
 * a custom window event so open panels refresh immediately, and listens for
 * the browser's `storage` event so other tabs stay in sync too.
 */

export type ExportStatus = 'success' | 'failure';
export type ExportFormat = 'png' | 'pdf';
export type ExportSource = 'chart' | 'kpi' | 'report' | 'watermark';

export interface ExportHistoryEntry {
    id: string;
    timestamp: string;
    filename: string;
    format: ExportFormat;
    status: ExportStatus;
    source: ExportSource;
}

const STORAGE_KEY = 'sadaf_export_history';
const MAX_ENTRIES = 10;
const CHANGE_EVENT = 'sadaf:export-history-changed';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Read the stored export history (newest first, max 10). */
export function getExportHistory(): ExportHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as ExportHistoryEntry[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Append an export operation to the history (newest first) and notify any
 * open panels via a custom window event. Never throws and never breaks the
 * export flow — storage failures are silently ignored.
 */
export function recordExport(entry: Omit<ExportHistoryEntry, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return;
    const history = getExportHistory();
    const fullEntry: ExportHistoryEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([fullEntry, ...history].slice(0, MAX_ENTRIES)));
    } catch {
        return; // storage full or unavailable — non-blocking
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Clear the entire export history and notify open panels. */
export function clearExportHistory(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        return;
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * Subscribe to export-history changes (in-tab custom event + cross-tab
 * `storage` event). Returns an unsubscribe function.
 */
export function subscribeExportHistory(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) listener();
    };
    window.addEventListener(CHANGE_EVENT, listener);
    window.addEventListener('storage', handleStorage);
    return () => {
        window.removeEventListener(CHANGE_EVENT, listener);
        window.removeEventListener('storage', handleStorage);
    };
}
