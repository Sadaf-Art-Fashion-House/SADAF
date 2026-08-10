'use client';

/**
 * SADAF | Notifications — Browser Notification Permission
 *
 * Single source of truth for the browser Notification API permission.
 * Used by the Settings hub (toggle + live state) and the global
 * BrowserNotificationsBridge (auto-request for signed-in users) so the
 * permission is requested, reflected, and kept in sync on every page —
 * not just where the header bell happens to mount.
 *
 * Hydration-safe: all Notification API access happens in effects/callbacks,
 * never during render.
 */

import { useCallback, useEffect, useState } from 'react';

export type BrowserNotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

/** True when the Notification API exists in this browser (SSR-safe). */
export function isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

export function useBrowserNotificationPermission() {
    const [permission, setPermission] = useState<BrowserNotificationPermission>(() =>
        isBrowserNotificationSupported() ? Notification.permission : 'unsupported',
    );

    // Keep the state in sync with the real permission — the user can change
    // it in the browser's site settings while the app is open. Chrome/Edge
    // expose a PermissionStatus `change` event; Firefox fires
    // `notification.onpermissionchange`.
    useEffect(() => {
        if (!isBrowserNotificationSupported()) return;

        const sync = () => setPermission(Notification.permission);

        let permissionStatus: PermissionStatus | null = null;
        if (navigator.permissions?.query) {
            navigator.permissions
                .query({ name: 'notifications' } as PermissionDescriptor)
                .then((status) => {
                    permissionStatus = status;
                    status.onchange = sync;
                })
                .catch(() => {
                    // Older browsers without permissions.query — fall through.
                });
        }

        const notif = Notification as unknown as { onpermissionchange?: () => void };
        notif.onpermissionchange = sync;

        return () => {
            if (permissionStatus) permissionStatus.onchange = null;
            notif.onpermissionchange = undefined;
        };
    }, []);

    /** Request the permission — must be called from a user gesture. */
    const requestPermission = useCallback(async (): Promise<BrowserNotificationPermission> => {
        if (!isBrowserNotificationSupported()) return 'unsupported';
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch {
            return 'denied';
        }
    }, []);

    return {
        /** Whether the Notification API exists on this device/browser. */
        isSupported: isBrowserNotificationSupported(),
        /** Live permission state, synced with the browser. */
        permission,
        requestPermission,
    };
}
