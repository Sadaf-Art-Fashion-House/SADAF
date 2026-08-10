'use client';

/**
 * SADAF | Notifications — Browser Notifications Bridge
 *
 * Mounted once in AppProviders, so it runs on EVERY page (public pages,
 * customer dashboard, admin/founder/designer/sales-partner dashboards).
 *
 * Responsibilities:
 *   1. Request the Notification API permission once for signed-in users who
 *      have browser notifications enabled (the browser prompts at most once
 *      per origin, so this is never repeated after the user answers).
 *   2. When the permission is granted, subscribe to the notification
 *      channels (`notifications:global` + `notifications:user:{id}`) and
 *      raise a browser Notification for each push — regardless of which
 *      page the user is on. The header bell keeps managing the in-app list;
 *      this bridge is the single sink for OS-level notifications, so a push
 *      is never shown twice.
 *
 * Renders nothing.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { usePreferencesStore } from '@/features/settings/store/usePreferencesStore';
import { useBrowserNotificationPermission } from '../hooks/useBrowserNotificationPermission';
import type { Notification } from '../types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const RECONNECT_DELAY_MS = 3_000;

export default function BrowserNotificationsBridge() {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const { language } = useLanguage();
    const { browserNotifications, globalAlerts } = usePreferencesStore((state) => state.preferences);
    const { isSupported, permission, requestPermission } = useBrowserNotificationPermission();

    // Read the latest values inside WS callbacks without reconnecting the
    // socket when a preference or the language changes.
    const globalAlertsRef = useRef(globalAlerts);
    const languageRef = useRef(language);
    useEffect(() => {
        globalAlertsRef.current = globalAlerts;
    }, [globalAlerts]);
    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    // 1) Auto-request the permission once for signed-in users who enabled
    //    browser notifications. The browser only shows the prompt until it
    //    is answered, so this never nags on subsequent visits.
    useEffect(() => {
        if (!isSupported || !userId) return;
        if (!browserNotifications) return;
        if (permission === 'default') {
            requestPermission();
        }
    }, [isSupported, userId, browserNotifications, permission, requestPermission]);

    // 2) While signed in, enabled, and granted: subscribe to the global and
    //    user notification channels and raise OS-level notifications.
    useEffect(() => {
        if (!isSupported || !userId || !browserNotifications || permission !== 'granted') return;

        let ws: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let closed = false;

        const scheduleReconnect = () => {
            reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        };

        const connect = () => {
            try {
                ws = new WebSocket(WS_URL);
            } catch {
                scheduleReconnect();
                return;
            }

            ws.onopen = () => {
                ws?.send(
                    JSON.stringify({
                        action: 'subscribe',
                        endpoints: [`notifications:user:${userId}`, 'notifications:global'],
                    }),
                );
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type !== 'notification' && !msg.type?.startsWith('notifications:')) return;

                    // Global pushes (new order / announcement) respect the
                    // settings mute — dropped silently when muted.
                    const isGlobal = msg.type === 'notifications:global';
                    if (isGlobal && !globalAlertsRef.current) return;

                    const incoming: Notification = msg.data || msg.notification;
                    if (!incoming || !incoming.id) return;

                    // Friend-request pushes are surfaced by the header badge
                    // toast — showing an OS notification too would duplicate.
                    if (incoming.type === 'friend_request') return;

                    const isArabic = languageRef.current === 'ar';
                    const title =
                        isArabic && incoming.titleAr ? incoming.titleAr : incoming.title;
                    const body =
                        isArabic && incoming.messageAr ? incoming.messageAr : incoming.message;

                    new Notification(`SADAF: ${title}`, {
                        body,
                        tag: incoming.id, // Replaces older notifications with the same id.
                        icon: '/favicon.ico',
                    });
                } catch {
                    // Malformed message — ignore.
                }
            };

            ws.onclose = () => {
                if (!closed) scheduleReconnect();
            };

            ws.onerror = () => {
                // onclose fires after onerror.
            };
        };

        connect();

        return () => {
            closed = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            ws?.close();
            ws = null;
        };
    }, [isSupported, userId, browserNotifications, permission]);

    return null;
}
