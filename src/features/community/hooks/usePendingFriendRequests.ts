'use client';

/**
 * SADAF | Community — Pending Friend Requests (WebSocket-primary)
 *
 * Drives the header FriendRequestsBadge and feeds the community page:
 * the *received* connection requests waiting for the current user's response.
 *
 * Transport priority (same pattern as useRealtimeNotifications):
 *   1. WebSocket — subscribes to `notifications:user:{userId}` and merges
 *      incoming `friend_request` pushes into the persisted pending list in
 *      real time.
 *   2. REST fallback — polls /api/friend-requests/pending every 15s when
 *      the socket is unavailable.
 *
 * Persisted source of truth mirrors `useCommunity`:
 *   - sessionStorage key `sadaf_community` (written by useCommunity and by
 *     this hook for live arrivals)
 *   - MOCK_PENDING_REQUESTS fallback when nothing is stored yet
 *
 * Live arrivals are appended to the stored pending list, then
 * `sadaf:community-updated` is dispatched so the community page (which
 * listens for it) merges them into its own state and shows them with
 * Accept / Decline. Because the badge counts straight from storage, an
 * accepted / declined request drops off the badge automatically.
 *
 * Updates:
 *   - `storage` event → cross-tab sync
 *   - `sadaf:community-updated` custom event → same-tab sync, dispatched by
 *     useCommunity on accept / decline / invite and by this hook on arrival
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Connection, ConnectionRequest, ConnectionType } from '../types';
import { MOCK_PENDING_REQUESTS } from '../constants/communityData';

/** Storage key used by useCommunity to persist community state. */
const STORAGE_KEY = 'sadaf_community';

/** Custom event name dispatched after pending requests change. */
export const COMMUNITY_UPDATED_EVENT = 'sadaf:community-updated';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const POLL_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 3_000;
/** Upper bound for remembered processed ids — the demo pushes one every 25s. */
const MAX_PROCESSED_IDS = 200;
/** How long to wait for the socket before starting the REST fallback. */
const FALLBACK_START_DELAY_MS = 5_000;

interface StoredCommunity {
    connections?: Connection[];
    pendingRequests?: ConnectionRequest[];
}

/** A live friend-request notification pushed over WS. */
interface LiveFriendRequestNotification {
    id: string;
    type: string;
    relationship?: ConnectionType;
    senderName?: string;
    senderEmail?: string;
    title?: string;
    message?: string;
    createdAt?: string;
}

function readStoredReceived(): { count: number; ids: Set<string> } {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as StoredCommunity;
            if (Array.isArray(parsed.pendingRequests)) {
                const received = parsed.pendingRequests.filter((request) => request.direction === 'received');
                return {
                    count: received.length,
                    ids: new Set(received.map((request) => request.id)),
                };
            }
        }
    } catch {
        // Malformed storage — fall back to mock below
    }
    const received = MOCK_PENDING_REQUESTS.filter((request) => request.direction === 'received');
    return {
        count: received.length,
        ids: new Set(received.map((request) => request.id)),
    };
}

/** Turn a live WS notification into a pending-list entry. */
function toConnectionRequest(notification: LiveFriendRequestNotification): ConnectionRequest {
    const name = notification.senderName || notification.title || 'New member';
    const email = notification.senderEmail || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    return {
        id: notification.id,
        userId: `live-${notification.id}`,
        name,
        email,
        type: notification.relationship === 'family' ? 'family' : 'friend',
        direction: 'received',
        createdAt: notification.createdAt || new Date().toISOString(),
        message: notification.message,
    };
}

type PersistOutcome = 'added' | 'exists' | 'failed';

/**
 * Append a received request to the persisted pending list (deduped by id).
 * The FIRST write seeds the list with MOCK_PENDING_REQUESTS so the stored
 * baseline stays continuous with the badge count (no drop from the mock
 * fallback) and the mock requests stay visible on the community page.
 *
 * Returns:
 *   - 'added'  — the request was appended (or seeded) to storage
 *   - 'exists' — the request was already stored; nothing changed
 *   - 'failed' — storage unavailable (e.g. private mode); the caller
 *                falls back to counting the request in memory
 */
function appendRequestToStorage(request: ConnectionRequest): PersistOutcome {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredCommunity) : null;
        const connections = Array.isArray(parsed?.connections) ? parsed.connections : [];
        // Seed the baseline with the mock list on first creation.
        const pendingRequests = Array.isArray(parsed?.pendingRequests)
            ? parsed.pendingRequests
            : MOCK_PENDING_REQUESTS;
        if (pendingRequests.some((existing) => existing.id === request.id)) return 'exists';
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ connections, pendingRequests: [request, ...pendingRequests] }),
        );
        return 'added';
    } catch {
        return 'failed';
    }
}

/**
 * Build the Connection record created when a pending request is accepted.
 * Shared by the storage-based accept (header toast) and the community page
 * (useCommunity.acceptRequest) so the mapping stays in exactly one place.
 */
export function buildConnectionFromRequest(request: ConnectionRequest): Connection {
    return {
        userId: request.userId,
        name: request.name,
        role: request.type === 'family' ? 'customer_family' : 'customer_friend',
        avatarUrl: request.avatarUrl,
        type: request.type,
        status: 'connected',
        connectedSince: new Date().toISOString(),
    };
}

/**
 * Accept a received request straight from storage — used by the header
 * toast's quick Accept button. Mirrors useCommunity.acceptRequest but
 * operates on sessionStorage (the badge is mounted globally, the community
 * page is not). Dispatches COMMUNITY_UPDATED_EVENT is left to the caller so
 * both the badge count and the community page re-sync once.
 */
export function acceptRequestInStorage(request: ConnectionRequest): void {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredCommunity) : null;
        const connections = Array.isArray(parsed?.connections) ? parsed.connections : [];
        const pendingRequests = Array.isArray(parsed?.pendingRequests) ? parsed.pendingRequests : [];
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                connections: [buildConnectionFromRequest(request), ...connections],
                pendingRequests: pendingRequests.filter((existing) => existing.id !== request.id),
            }),
        );
    } catch {
        // Storage unavailable — best-effort (private mode).
    }
}

/** Decline a received request straight from storage (toast quick action). */
export function declineRequestInStorage(requestId: string): void {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredCommunity) : null;
        const connections = Array.isArray(parsed?.connections) ? parsed.connections : [];
        const pendingRequests = Array.isArray(parsed?.pendingRequests) ? parsed.pendingRequests : [];
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                connections,
                pendingRequests: pendingRequests.filter((existing) => existing.id !== requestId),
            }),
        );
    } catch {
        // Storage unavailable — best-effort (private mode).
    }
}

export function usePendingFriendRequests(userId: string | null) {
    const [count, setCount] = useState(0);
    const [wsLive, setWsLive] = useState(false);
    // Most recent live arrival (a newly persisted request) — consumed by the
    // header toast so the user can Accept / Decline without navigating.
    const [latestArrival, setLatestArrival] = useState<ConnectionRequest | null>(null);

    // Ids already processed (WS + REST) so the same request is never merged
    // twice — e.g. after a reconnect or a REST poll echoing a stored entry.
    const processedIdsRef = useRef<Set<string>>(new Set());
    // Requests that could not be persisted (storage unavailable) — counted on
    // top of the stored total instead.
    const unpersistedIdsRef = useRef<Set<string>>(new Set());
    const storedCountRef = useRef(0);
    const storedIdsRef = useRef<Set<string>>(new Set());

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wsConnectedRef = useRef(false);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /** Recompute the badge total from stored + unpersisted (excluding dupes). */
    const computeCount = useCallback(() => {
        const unpersisted = [...unpersistedIdsRef.current].filter(
            (id) => !storedIdsRef.current.has(id),
        ).length;
        setCount(storedCountRef.current + unpersisted);
    }, []);

    /** Re-read the persisted pending list (sessionStorage or mock). */
    const refresh = useCallback(() => {
        if (!userId) {
            storedCountRef.current = 0;
            storedIdsRef.current = new Set();
            setCount(0);
            return;
        }
        const { count: storedCount, ids } = readStoredReceived();
        storedCountRef.current = storedCount;
        storedIdsRef.current = ids;
        computeCount();
    }, [userId, computeCount]);

    /**
     * Merge an incoming request (live WS notification or REST payload) into
     * the persisted pending list and notify the community page.
     */
    const acceptIncomingRequest = useCallback((request: ConnectionRequest): PersistOutcome => {
        if (processedIdsRef.current.has(request.id)) return 'exists';
        processedIdsRef.current.add(request.id);
        // Cap the processed set so a long-running session can't grow it
        // unboundedly (demo pushes arrive every 25s). Sets preserve insertion
        // order, so dropping from the front drops the oldest ids.
        if (processedIdsRef.current.size > MAX_PROCESSED_IDS) {
            let overflow = processedIdsRef.current.size - MAX_PROCESSED_IDS;
            for (const existing of processedIdsRef.current) {
                if (overflow <= 0) break;
                processedIdsRef.current.delete(existing);
                overflow -= 1;
            }
        }
        const outcome = appendRequestToStorage(request);
        if (outcome === 'failed') {
            unpersistedIdsRef.current.add(request.id);
        }
        if (outcome === 'exists') {
            // Already stored (e.g. a REST poll echoing a persisted entry) —
            // nothing changed, so skip the notify + recompute.
            return outcome;
        }
        // Same-tab sync: the community page (useCommunity) merges the arrival
        // into its pending list so it shows up with Accept / Decline.
        window.dispatchEvent(new Event(COMMUNITY_UPDATED_EVENT));
        computeCount();
        return outcome;
    }, [computeCount]);

    // ─── WebSocket connection ────────────────────────────────────────────────

    const connectWS = useCallback(() => {
        if (!userId || wsConnectedRef.current) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                wsConnectedRef.current = true;
                setWsLive(true);
                // Stop the REST fallback once the socket is live — two sources
                // of truth would merge the same requests twice (deduped, but
                // wasteful).
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                // Subscribe to the user's notification endpoint
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: [`notifications:user:${userId}`],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    // Only user-scoped notification pushes are relevant — the
                    // badge never subscribes to the global channel.
                    const isUserChannel = typeof msg.type === 'string' && msg.type.startsWith('notifications:user:');
                    const incoming = msg.notification || msg.data;
                    if (!isUserChannel || !incoming || incoming.type !== 'friend_request') return;
                    const request = toConnectionRequest(incoming as LiveFriendRequestNotification);
                    const outcome = acceptIncomingRequest(request);
                    // Toast only for genuine live WS arrivals — REST polls echo
                    // stored mock entries, which must not fire a toast.
                    if (outcome === 'added') setLatestArrival(request);
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                wsConnectedRef.current = false;
                setWsLive(false);
                // Auto-reconnect
                reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            // WS unavailable — fall back to polling
            setWsLive(false);
            reconnectTimeoutRef.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
        }
    }, [userId, acceptIncomingRequest]);

    // ─── REST polling fallback ──────────────────────────────────────────────

    const startPolling = useCallback(() => {
        if (!userId) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/friend-requests/pending?userId=${encodeURIComponent(userId)}`);
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data.requests)) {
                    (data.requests as ConnectionRequest[]).forEach((request) => acceptIncomingRequest(request));
                }
            } catch {
                // Silently retry on the next tick
            }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, [userId, acceptIncomingRequest]);

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    useEffect(() => {
        refresh();

        if (!userId) return;

        // Cross-tab sync: community page open in another tab
        window.addEventListener('storage', refresh);
        // Same-tab sync: dispatched by useCommunity on accept/decline/invite
        window.addEventListener(COMMUNITY_UPDATED_EVENT, refresh);

        connectWS();

        // Fallback: start polling after 5s if WS didn't connect
        const fallbackTimer = setTimeout(() => {
            if (!wsConnectedRef.current) {
                console.log('   ⚠️ WS not connected — starting fallback polling for friend requests');
                startPolling();
            }
        }, FALLBACK_START_DELAY_MS);

        return () => {
            clearTimeout(fallbackTimer);
            clearTimeout(reconnectTimeoutRef.current ?? undefined);
            clearInterval(pollIntervalRef.current ?? undefined);
            if (wsRef.current) {
                wsRef.current.onopen = null;
                wsRef.current.onmessage = null;
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.close();
                wsRef.current = null;
            }
            wsConnectedRef.current = false;
            setWsLive(false);
            window.removeEventListener('storage', refresh);
            window.removeEventListener(COMMUNITY_UPDATED_EVENT, refresh);
        };
    }, [userId, refresh, connectWS, startPolling]);

    return { count, wsLive, latestArrival };
}
