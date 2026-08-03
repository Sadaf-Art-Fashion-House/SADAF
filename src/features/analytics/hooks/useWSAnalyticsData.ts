'use client';

/**
 * SADAF | Analytics — Real-time Data Hook
 *
 * Subscribes to the `analytics:admin` WebSocket endpoint broadcast by
 * ws-server.mjs (which polls /api/analytics every 3s).
 *
 * Transport priority: WebSocket → SSE → REST polling — identical to the
 * dashboard hooks, so the Analytics Dashboard degrades gracefully when the
 * WS server is unavailable.
 */

import { useWebSocketData } from '@/features/dashboard/hooks/useDashboardData';
import type { AnalyticsData } from '../types';

/**
 * Real-time analytics data — WS → SSE → Polling.
 *
 * @example
 * ```tsx
 * const { data, wsState, error } = useWSAnalyticsData();
 * const isLive = wsState.status === 'connected';
 * ```
 */
export function useWSAnalyticsData(enabled = true) {
    return useWebSocketData<AnalyticsData>('analytics:admin', '/api/analytics', enabled);
}
