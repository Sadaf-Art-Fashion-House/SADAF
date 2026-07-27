/**
 * SADAF | API Route — Server-side Error Logging
 *
 * POST /api/error-logs       — Submit a new error entry
 * GET  /api/error-logs       — Retrieve all stored errors (admin)
 * PATCH /api/error-logs      — Mark error(s) as read
 * DELETE /api/error-logs?id=xxx — Delete a single entry
 * DELETE /api/error-logs     — Clear all entries
 *
 * Uses a simple in-memory store. In production, replace with a database.
 */

import { NextResponse } from 'next/server';

// ─── In-memory store (lost on server restart) ───────────────────────────────
// TODO: Replace with a database (e.g. Prisma + SQLite/Postgres) for persistence
interface ServerErrorEntry {
    id: string;
    timestamp: string;
    message: string;
    stack?: string;
    digest?: string;
    url: string;
    read: boolean;
}

let errorStore: ServerErrorEntry[] = [];
const MAX_SERVER_LOGS = 500;

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── POST — Submit a new error ──────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body || !body.message) {
            return NextResponse.json(
                { error: 'Missing required field: message' },
                { status: 400 }
            );
        }

        // Trim oldest entries if we exceed maximum
        if (errorStore.length >= MAX_SERVER_LOGS) {
            errorStore = errorStore.slice(errorStore.length - MAX_SERVER_LOGS + 1);
        }

        const entry: ServerErrorEntry = {
            id: body.id || generateId(),
            timestamp: body.timestamp || new Date().toISOString(),
            message: body.message,
            stack: body.stack || undefined,
            digest: body.digest || undefined,
            url: body.url || '',
            read: false,
        };

        errorStore.push(entry);

        console.error(`[Server Error Log] ${entry.message} — ${entry.url}`);

        return NextResponse.json({ ok: true, id: entry.id });
    } catch (error) {
        console.error('Error logging endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to process error log' },
            { status: 500 }
        );
    }
}

// ─── GET — Retrieve all stored errors ───────────────────────────────────────

export async function GET() {
    try {
        // Return in reverse chronological order (newest first)
        const logs = [...errorStore].reverse();
        const unreadCount = errorStore.filter((e) => !e.read).length;

        return NextResponse.json({
            logs,
            total: errorStore.length,
            unreadCount,
        });
    } catch (error) {
        console.error('Error logs retrieval error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve error logs' },
            { status: 500 }
        );
    }
}

// ─── PATCH — Mark error(s) as read ──────────────────────────────────────────

export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        if (body.markAll) {
            // Mark all as read
            errorStore = errorStore.map((e) => ({ ...e, read: true }));
            return NextResponse.json({ ok: true, markedAll: true });
        }

        if (body.id) {
            // Mark single entry as read
            errorStore = errorStore.map((e) =>
                e.id === body.id ? { ...e, read: true } : e
            );
            return NextResponse.json({ ok: true, id: body.id });
        }

        return NextResponse.json(
            { error: 'Missing id or markAll flag' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error logs update error:', error);
        return NextResponse.json(
            { error: 'Failed to update error logs' },
            { status: 500 }
        );
    }
}

// ─── DELETE — Remove error entry(ies) ───────────────────────────────────────

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Delete a single entry
            errorStore = errorStore.filter((e) => e.id !== id);
            return NextResponse.json({ ok: true, deleted: id });
        }

        // Clear all entries
        errorStore = [];
        return NextResponse.json({ ok: true, clearedAll: true });
    } catch (error) {
        console.error('Error logs deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete error logs' },
            { status: 500 }
        );
    }
}
