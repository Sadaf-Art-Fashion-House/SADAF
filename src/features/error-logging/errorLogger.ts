/**
 * Error Logger — stores runtime errors so they appear
 * in the admin dashboard automatically.
 *
 * Strategy:
 * 1. Try to POST to the server API (/api/error-logs)
 * 2. If the server call fails (e.g. network offline, server down),
 *    fall back to localStorage so errors are never lost.
 *
 * The admin dashboard reads from both sources and merges them.
 */

import { buildExportErrorMessage } from '@/shared/utils/exportErrors';

const STORAGE_KEY = 'sadaf_error_logs';
const MAX_LOGS = 200;
const API_ENDPOINT = '/api/error-logs';

export interface ErrorLogEntry {
    id: string;
    timestamp: string;
    message: string;
    stack?: string;
    digest?: string;
    url: string;
    read: boolean;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── localStorage helpers (fallback / offline) ──────────────────────────────

function getLocalLogs(): ErrorLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ErrorLogEntry[]) : [];
    } catch {
        return [];
    }
}

function saveLocalLogs(logs: ErrorLogEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
        // localStorage full — silently ignore
    }
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function sendToServer(entry: ErrorLogEntry): Promise<boolean> {
    try {
        const res = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/** Fetch all errors from the server (newest first). */
export async function fetchServerLogs(): Promise<{
    logs: ErrorLogEntry[];
    total: number;
    unreadCount: number;
}> {
    try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) return { logs: [], total: 0, unreadCount: 0 };
        return await res.json();
    } catch {
        return { logs: [], total: 0, unreadCount: 0 };
    }
}

async function markReadOnServer(id: string): Promise<boolean> {
    try {
        const res = await fetch(API_ENDPOINT, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function markAllReadOnServer(): Promise<boolean> {
    try {
        const res = await fetch(API_ENDPOINT, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAll: true }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function deleteOnServer(id: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_ENDPOINT}?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function clearServerLogs(): Promise<boolean> {
    try {
        const res = await fetch(API_ENDPOINT, { method: 'DELETE' });
        return res.ok;
    } catch {
        return false;
    }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Log an error that occurred at runtime.
 * Tries the server first; falls back to localStorage if the server is unreachable.
 */
export async function logError(error: Error & { digest?: string }): Promise<void> {
    const entry: ErrorLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        message: error.message || 'Unknown error',
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : '',
        read: false,
    };

    // Try server first
    const sent = await sendToServer(entry);

    // If server is unreachable, save locally
    if (!sent) {
        const logs = getLocalLogs();
        const trimmed = logs.length >= MAX_LOGS
            ? logs.slice(logs.length - MAX_LOGS + 1)
            : logs;
        trimmed.push(entry);
        saveLocalLogs(trimmed);
    }
}

/**
 * Log an export failure (PNG/PDF) through the shared error-logging system so
 * it appears in the Admin/Founder Error Logs dashboard with a clear digest
 * (e.g. `export:png:revenue-chart`) plus timestamp and URL context.
 *
 * The message is built here (via the shared exportErrors helper) from the
 * format + filename (+ optional detail), so callers never construct it
 * themselves. `detail` accepts:
 * - a string — appended as the failure reason (`Failed to export PNG (file.png): <detail>.`)
 * - an `Error` — treated as the cause (its stack is preserved) and the
 *   message stays the generic one, so catch-blocks stay one clean call:
 *   `logExportError('png', filename, err)`
 * - `unknown`/`undefined` — the generic message is used
 *
 * Fire-and-forget by design — never throws and never breaks the export flow.
 */
export function logExportError(
    format: 'png' | 'pdf',
    filename: string,
    detail?: unknown,
    cause?: unknown,
): void {
    // Narrow `unknown` internally so call sites can pass a catch-block `err`
    // directly (typed `unknown`) without any cast, while still supporting a
    // descriptive string detail or a cause in the 4th position.
    const resolvedDetail = typeof detail === 'string' ? detail : undefined;
    const resolvedCause = detail instanceof Error ? detail : cause;

    const message = buildExportErrorMessage(format, filename, resolvedDetail);

    const taggedError = Object.assign(new Error(message), {
        digest: `export:${format}:${filename}`,
        stack: resolvedCause instanceof Error ? resolvedCause.stack : undefined,
    });
    logError(taggedError).catch(() => {
        // Logging must never break the export flow.
    });
}

/**
 * Retrieve all logged errors — merges server logs + localStorage logs.
 */
export async function getErrorLogs(): Promise<ErrorLogEntry[]> {
    const serverResult = await fetchServerLogs();
    const localLogs = getLocalLogs();

    // Merge: server logs first (newest), then any local-only logs
    const merged = [...serverResult.logs];

    // Add local logs that aren't already on the server
    for (const local of localLogs) {
        const exists = merged.some((m) => m.id === local.id);
        if (!exists) merged.push(local);
    }

    // Sort by timestamp descending (newest first)
    return merged.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

/** Get total unread count from server + localStorage. */
export async function getUnreadErrorCount(): Promise<number> {
    const serverResult = await fetchServerLogs();
    const localLogs = getLocalLogs();
    const serverUnread = serverResult.unreadCount;
    const localUnread = localLogs.filter((l) => !l.read).length;
    return serverUnread + localUnread;
}

/** Mark a single error entry as read (tries server + localStorage). */
export async function markErrorAsRead(id: string): Promise<void> {
    const serverOk = await markReadOnServer(id);
    if (!serverOk) {
        const logs = getLocalLogs();
        saveLocalLogs(logs.map((l) => (l.id === id ? { ...l, read: true } : l)));
    }
}

/** Mark all error entries as read. */
export async function markAllErrorsAsRead(): Promise<void> {
    await markAllReadOnServer();
    // Also clear the localStorage read status
    const logs = getLocalLogs();
    saveLocalLogs(logs.map((l) => ({ ...l, read: true })));
}

/** Delete a single error entry. */
export async function deleteErrorLog(id: string): Promise<void> {
    await deleteOnServer(id);
    const logs = getLocalLogs();
    saveLocalLogs(logs.filter((l) => l.id !== id));
}

/** Clear all error logs (server + localStorage). */
export async function clearErrorLogs(): Promise<void> {
    await clearServerLogs();
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // silently ignore
        }
    }
}
