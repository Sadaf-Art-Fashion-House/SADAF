'use client';

/**
 * SADAF | Customer — Leaderboard Overtake Alert Hook
 *
 * Preferences for the "someone overtook you on the leaderboard" alert
 * (toast + row flash + optional soft chime), mirroring the My Activity
 * alert pattern (useActivityAlerts):
 *
 * - Persisted in localStorage (`sadaf_overtake_alerts`).
 * - The toast + row flash are on by default — that is the requested
 *   feature; the sound chime is the opt-in part (plays a confirmation
 *   chime when enabled, which also primes the AudioContext inside the
 *   click gesture so the first real alert has no autoplay delay).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { playSoftChime } from '@/shared/utils/playSoftChime';
import { usePreferencesStore } from '@/features/settings/store/usePreferencesStore';
import { createLocalStorageSync } from '@/shared/utils/localStorageSync';

// ─── Config ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sadaf_overtake_alerts';
const CHANGED_EVENT = 'sadaf:overtake-alerts-changed';

interface OvertakeAlertPreferences {
    /** Show the toast + flash on your row when someone passes you. */
    enabled: boolean;
    /** Play the soft chime alongside the toast. */
    sound: boolean;
}

const DEFAULT_PREFERENCES: OvertakeAlertPreferences = { enabled: true, sound: false };

/**
 * Persistence + cross-tab sync (custom window event + native storage event)
 * so the leaderboard alert toggles stay in sync across tabs.
 */
const overtakeSync = createLocalStorageSync<OvertakeAlertPreferences>(STORAGE_KEY, CHANGED_EVENT);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStoredPreferences(): OvertakeAlertPreferences {
    const stored = overtakeSync.load();
    if (!stored) return DEFAULT_PREFERENCES;
    return {
        enabled: typeof stored.enabled === 'boolean' ? stored.enabled : DEFAULT_PREFERENCES.enabled,
        sound: typeof stored.sound === 'boolean' ? stored.sound : DEFAULT_PREFERENCES.sound,
    };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOvertakeAlerts() {
    // The settings-hub "Alert sound" preference is the single source of
    // truth for the chime: the leaderboard's own sound toggle mirrors into
    // it, and the hub toggle disables the chime everywhere (leaderboard,
    // referral toasts, etc.).
    const alertSoundPref = usePreferencesStore((state) => state.preferences.alertSound);
    const setPreference = usePreferencesStore((state) => state.setPreference);

    const [preferences, setPreferences] = useState<OvertakeAlertPreferences>(DEFAULT_PREFERENCES);
    const preferencesRef = useRef<OvertakeAlertPreferences>(DEFAULT_PREFERENCES);
    const preferencesLoadedRef = useRef(false);

    // Load persisted prefs after mount (client-only, avoids SSR mismatch).
    useEffect(() => {
        setPreferences(readStoredPreferences());
        preferencesLoadedRef.current = true;
    }, []);

    // Keep the ref in sync and persist every change — skip the first run so
    // the stored prefs (loaded above) are never clobbered by the defaults in
    // the same mount commit (same guard as useRealtimeNotifications).
    useEffect(() => {
        if (!preferencesLoadedRef.current) return;
        preferencesRef.current = preferences;
        overtakeSync.save(preferences);
    }, [preferences]);

    // Mirror the settings-hub master toggle into the local preference so the
    // leaderboard ALERTS/SOUND buttons reflect the hub state (and vice versa
    // happens in toggleSound below).
    useEffect(() => {
        setPreferences((prev) => (prev.sound === alertSoundPref ? prev : { ...prev, sound: alertSoundPref }));
        preferencesRef.current = { ...preferencesRef.current, sound: alertSoundPref };
    }, [alertSoundPref]);

    const toggleEnabled = useCallback(() => {
        setPreferences((prev) => ({ ...prev, enabled: !prev.enabled }));
    }, []);

    const toggleSound = useCallback(() => {
        const turningOn = !preferencesRef.current.sound;
        // Mirror into the settings-hub master preference (single source of
        // truth). The confirmation chime only plays when the hub toggle is on.
        setPreference('alertSound', turningOn);
        setPreferences((prev) => ({ ...prev, sound: turningOn }));
        if (turningOn) playSoftChime();
    }, [setPreference]);

    return {
        preferences,
        toggleEnabled,
        toggleSound,
    };
}
