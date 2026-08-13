'use client';

/**
 * SADAF | Reviews — Live Community Ratings Hook
 *
 * Subscribes to the `reviews:global` WebSocket channel and collects reviews
 * that land in real time (community reviews pushed by ws-server.mjs,
 * mirroring the `leaderboard:global` pattern). Consumers merge these live
 * reviews into their aggregated rating (useAggregatedRatings / the PDP
 * client), so the average, the count and the latest-reviews list all move
 * live without a refresh.
 *
 * WS-primary with no REST fallback: when the socket is down the ratings
 * simply stay on the local (mock + user) aggregation — the same graceful
 * degradation as the notifications bell. All socket access lives in the
 * mount effect (hydration-safe).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Review } from '../types';

export interface LiveRatingsState {
    /** Reviews that landed over WS during this session (newest first). */
    liveReviews: Review[];
    /** True while the reviews:global socket is connected. */
    wsLive: boolean;
    /** The most recent live review + when it landed — lets views pulse. */
    lastLive: { review: Review; at: number } | null;
}

export function useLiveRatings(): LiveRatingsState {
    const [liveReviews, setLiveReviews] = useState<Review[]>([]);
    const [wsLive, setWsLive] = useState(false);
    const [lastLive, setLastLive] = useState<{ review: Review; at: number } | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const connectedRef = useRef(false);

    const connect = useCallback(() => {
        if (connectedRef.current) return;

        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                connectedRef.current = true;
                setWsLive(true);
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    endpoints: ['reviews:global'],
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'reviews:global' || !msg.review) return;
                    const review = msg.review as Review;
                    setLiveReviews((prev) =>
                        [review, ...prev.filter((r) => r.id !== review.id)].slice(0, 50),
                    );
                    setLastLive({ review, at: Date.now() });
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onclose = () => {
                connectedRef.current = false;
                setWsLive(false);
                reconnectRef.current = setTimeout(connect, 3_000);
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            setWsLive(false);
            reconnectRef.current = setTimeout(connect, 3_000);
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            clearTimeout(reconnectRef.current ?? undefined);
            if (wsRef.current) {
                wsRef.current.onopen = null;
                wsRef.current.onmessage = null;
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.close();
                wsRef.current = null;
            }
            connectedRef.current = false;
            setWsLive(false);
        };
    }, [connect]);

    return { liveReviews, wsLive, lastLive };
}
