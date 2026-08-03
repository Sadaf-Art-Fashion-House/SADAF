/**
 * SADAF | API Route — Server-Sent Events (SSE) Fallback
 *
 * GET /api/dashboard/sse?type=admin
 *
 * Streams dashboard data via SSE as a fallback when WebSocket is unavailable.
 * Query params:
 *   type — 'admin' | 'founder' | 'customer' | 'analytics' (default: 'admin')
 *
 * The client uses EventSource to connect.
 * Falls back to polling if SSE also fails.
 */

import { NextRequest } from 'next/server';

const ENDPOINT_MAP: Record<string, string> = {
    admin: '/api/dashboard/admin',
    founder: '/api/dashboard/founder',
    customer: '/api/dashboard/customer',
    analytics: '/api/analytics',
};

const SSE_INTERVAL_MS = 5_000; // 5s push via SSE

export async function GET(request: NextRequest) {
    const type = request.nextUrl.searchParams.get('type') || 'admin';
    const endpoint = ENDPOINT_MAP[type];

    if (!endpoint) {
        return new Response(
            `data: ${JSON.stringify({ error: `Invalid type: "${type}". Use: admin, founder, customer, analytics` })}\n\n`,
            {
                status: 400,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            }
        );
    }

    const encoder = new TextEncoder();
    let isConnected = true;

    const stream = new ReadableStream({
        start(controller) {
            // Push initial connection event
            controller.enqueue(
                encoder.encode(`event: connected\ndata: ${JSON.stringify({ type, status: 'sse-connected' })}\n\n`)
            );

            // Poll and push data every 5s
            const interval = setInterval(async () => {
                if (!isConnected) {
                    clearInterval(interval);
                    return;
                }

                try {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                    const res = await fetch(`${baseUrl}${endpoint}`, {
                        signal: AbortSignal.timeout(4_000),
                    });

                    if (!res.ok) {
                        controller.enqueue(
                            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: `API HTTP ${res.status}` })}\n\n`)
                        );
                        return;
                    }

                    const data = await res.json();
                    controller.enqueue(
                        encoder.encode(
                            `event: dashboard\ndata: ${JSON.stringify({ type: `dashboard:${type}`, data })}\n\n`
                        )
                    );
                } catch {
                    // Silently retry on next interval
                }
            }, SSE_INTERVAL_MS);

            // Keep-alive ping every 20s
            const keepAlive = setInterval(() => {
                if (!isConnected) {
                    clearInterval(keepAlive);
                    return;
                }
                controller.enqueue(encoder.encode(': keepalive\n\n'));
            }, 20_000);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                isConnected = false;
                clearInterval(interval);
                clearInterval(keepAlive);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
