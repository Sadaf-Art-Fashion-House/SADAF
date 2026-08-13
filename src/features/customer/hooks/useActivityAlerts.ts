'use client';

/**
 * SADAF | Customer — My Activity Alert Hook
 *
 * Optional browser Notification + soft chime when a NEW personal activity
 * event (order, saved design, wishlist, offer) streams into the feed.
 *
 * - Both alerts are opt-in and persisted in localStorage
 *   (key: `sadaf_activity_alerts`).
 * - Browser notifications request permission only when the user enables
 *   them (a user gesture), following Notification best practice.
 * - The chime is synthesized with the Web Audio API (no asset file), so it
 *   works offline and never needs a network round-trip.
 * - Alerts fire only for events the feed has NOT seen yet (deduped by id);
 *   the initial batch is treated as historical and stays silent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PersonalActivityEvent } from '../types';
import { playSoftChime } from '@/shared/utils/playSoftChime';
import { isBrowserNotificationSupported } from '@/features/notifications/hooks/useBrowserNotificationPermission';
import { createLocalStorageSync } from '@/shared/utils/localStorageSync';

// ─── Config ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sadaf_activity_alerts';
const CHANGED_EVENT = 'sadaf:activity-alerts-changed';

interface AlertPreferences {
    /** Show a browser Notification per new event. */
    browser: boolean;
    /** Play a soft chime per new event. */
    sound: boolean;
}

const DEFAULT_PREFERENCES: AlertPreferences = { browser: false, sound: false };

/**
 * Persistence + cross-tab sync (custom window event + native storage event)
 * so the My Activity alert toggles stay in sync across tabs.
 */
const alertsSync = createLocalStorageSync<AlertPreferences>(STORAGE_KEY, CHANGED_EVENT);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStoredPreferences(): AlertPreferences {
    const stored = alertsSync.load();
    if (!stored) return DEFAULT_PREFERENCES;
    return {
        browser: typeof stored.browser === 'boolean' ? stored.browser : DEFAULT_PREFERENCES.browser,
        sound: typeof stored.sound === 'boolean' ? stored.sound : DEFAULT_PREFERENCES.sound,
    };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useActivityAlerts(events: PersonalActivityEvent[]) {
    // Stable identity by CONTENT, not reference. The caller may pass an
    // inline array (fresh reference every render); keying the new-event
    // effect below on the reference alone would re-run it every render and
    // re-check every event. The serialized signature only changes when the
    // actual events change.
    const eventsKey = events.map((event) => event.id).join('\u0001');
    const stableEvents = useMemo(
        () => events,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- content signature, see above
        [eventsKey],
    );

    const [preferences, setPreferences] = useState<AlertPreferences>(DEFAULT_PREFERENCES);
    const [isSupported, setIsSupported] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Kept in a ref so the event effect always reads the latest prefs without
    // re-subscribing to the feed on every toggle change.
    const preferencesRef = useRef<AlertPreferences>(DEFAULT_PREFERENCES);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const seededRef = useRef(false);

    // Load persisted prefs + feature detection after mount (client-only,
    // avoids SSR hydration mismatch).
    useEffect(() => {
        setIsSupported(isBrowserNotificationSupported());
        setPreferences(readStoredPreferences());
    }, []);

    // Keep the ref in sync and persist every change.
    useEffect(() => {
        preferencesRef.current = preferences;
        alertsSync.save(preferences);
    }, [preferences]);

    // ─── Soft chime (shared Web Audio util — no asset needed) ───────────────

    // ─── Browser notification ───────────────────────────────────────────────

    const notifyBrowser = useCallback((event: PersonalActivityEvent) => {
        try {
            if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') return;
            const notification = new Notification('SADAF — My Activity', {
                body: `${event.title} — ${event.message}`,
                tag: event.id, // Replaces any older notification with the same id.
                icon: '/favicon.ico',
            });
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch {
            // Notifications are best-effort.
        }
    }, []);

    // ─── New-event detection ─────────────────────────────────────────────────

    useEffect(() => {
        // The first batch is historical — seed the seen set and stay silent.
        if (!seededRef.current) {
            stableEvents.forEach((event) => seenIdsRef.current.add(event.id));
            seededRef.current = true;
            return;
        }

        const fresh = stableEvents.filter((event) => event && !seenIdsRef.current.has(event.id));
        if (fresh.length === 0) return;
        fresh.forEach((event) => seenIdsRef.current.add(event.id));

        const { browser, sound } = preferencesRef.current;
        fresh.forEach((event) => {
            if (sound) playSoftChime();
            if (browser) notifyBrowser(event);
        });
    }, [stableEvents, notifyBrowser]);

    // ─── Toggle actions ─────────────────────────────────────────────────────

    const toggleBrowserAlerts = useCallback(async () => {
        if (!isSupported) return;
        const currentlyOn = preferencesRef.current.browser;

        if (currentlyOn) {
            setPreferences((prev) => ({ ...prev, browser: false }));
            return;
        }

        // Enabling: request permission first (must be a user gesture).
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }
        setPermissionDenied(permission === 'denied');
        setPreferences((prev) => ({ ...prev, browser: permission === 'granted' }));
    }, [isSupported]);

    const toggleSoundAlerts = useCallback(() => {
        const turningOn = !preferencesRef.current.sound;
        setPreferences((prev) => ({ ...prev, sound: turningOn }));
        // Play a confirmation chime when enabling — this also primes the
        // AudioContext inside the click gesture so the first real alert
        // has no autoplay delay.
        if (turningOn) playSoftChime();
    }, []);

    return {
        preferences,
        isSupported,
        permissionDenied,
        toggleBrowserAlerts,
        toggleSoundAlerts,
    };
}
