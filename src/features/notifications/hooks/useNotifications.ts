'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Notification } from '../types';

const STORAGE_KEY = 'sadaf_notifications';

/**
 * Hook managing notification state — mark read, filter by type, persist.
 * Notifications are fetched server-side and passed in; this hook only
 * manages UI state (read/unread, filtering, local persistence).
 *
 * For real-time updates, wrap this with useRealtimeNotifications
 * which pushes new notifications from the WebSocket server.
 */
export function useNotifications(initialNotifications: Notification[] = []) {
    // Stable identity by CONTENT, not reference. Callers can hand us inline
    // arrays (a fresh reference every render); keying the effect below on the
    // reference alone would re-run it every render, and since it calls
    // setNotifications that would loop — the same "Maximum update depth
    // exceeded" seen on /store. The serialized signature only changes when
    // the actual data changes.
    const initialKey = JSON.stringify(initialNotifications);
    const stableInitialNotifications = useMemo(
        () => initialNotifications,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- content signature, see above
        [initialKey],
    );

    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [filterType, setFilterType] = useState<string>('all');

    // Load persisted read status from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const readIds: string[] = JSON.parse(stored);
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: readIds.includes(n.id) || n.read })),
                );
            }
        } catch {
            // ignore
        }
    }, []);

    // Update notifications when initial prop changes. The default `[]` is a
    // fresh reference on every render, so without this check the effect would
    // re-run constantly and wipe notifications added at runtime via
    // addNotification (WebSocket pushes). The content-signature above keeps
    // the dependency stable unless the actual data changes, and the empty
    // guard only merges when the caller passes meaningful initial data.
    useEffect(() => {
        if (stableInitialNotifications.length === 0) return;

        setNotifications((prev) => {
            // Merge: keep read status from state, use new data
            const stateMap = new Map(prev.map((n) => [n.id, n]));
            return stableInitialNotifications.map(
                (n) => stateMap.get(n.id) ?? n,
            );
        });
    }, [stableInitialNotifications]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications],
    );

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) => {
            const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
            const readIds = updated.filter((n) => n.read).map((n) => n.id);
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
            } catch {
                // ignore
            }
            return updated;
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => {
            const updated = prev.map((n) => ({ ...n, read: true }));
            const readIds = updated.map((n) => n.id);
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
            } catch {
                // ignore
            }
            return updated;
        });
    }, []);

    const addNotification = useCallback((notification: Notification) => {
        setNotifications((prev) => {
            // Don't add duplicates
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
        });
    }, []);

    const filteredNotifications = useMemo(() => {
        if (filterType === 'all') return notifications;
        return notifications.filter((n) => n.type === filterType);
    }, [notifications, filterType]);

    return {
        notifications: filteredNotifications,
        allNotifications: notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        filterType,
        setFilterType,
    };
}
