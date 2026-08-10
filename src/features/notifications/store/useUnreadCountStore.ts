'use client';

/**
 * SADAF | Notifications — shared unread-count store
 *
 * The realtime notifications hook (useRealtimeNotifications) owns the single
 * WebSocket connection per page (header bell). It publishes the live unread
 * count here so other surfaces — e.g. the sidebar user-chip menu — can show
 * the same badge WITHOUT opening a second WS connection.
 */

import { create } from 'zustand';

interface UnreadCountState {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
}

export const useUnreadCountStore = create<UnreadCountState>((set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
}));
