'use client';

/**
 * SADAF | Settings — shared preferences store
 *
 * The single source of truth for site-wide user preferences (language,
 * theme, accessibility, UX), persisted to localStorage and kept in sync
 * across tabs via the shared localStorage sync utility — the same pattern
 * as the cart / wishlist / watermark stores.
 *
 * All window/localStorage access goes through the sync utility (SSR-safe,
 * failures never throw).
 */

import { create } from 'zustand';
import { createLocalStorageSync } from '@/shared/utils/localStorageSync';

export type SiteLanguage = 'en' | 'ar';
export type SiteTheme = 'dark' | 'light' | 'auto';
export type Density = 'comfortable' | 'compact';

export interface SitePreferences {
    language: SiteLanguage;
    theme: SiteTheme;
    fontScale: number; // 0.85 → 1.25 step 0.05, 1 = default
    reducedMotion: boolean;
    highContrast: boolean;
    compactDensity: boolean;
    autosaveEnabled: boolean;
    // ── Notifications ──
    globalAlerts: boolean;
    alertSound: boolean;
    browserNotifications: boolean;
}

export const DEFAULT_PREFERENCES: SitePreferences = {
    language: 'en',
    theme: 'dark',
    fontScale: 1,
    reducedMotion: false,
    highContrast: false,
    compactDensity: false,
    autosaveEnabled: true,
    globalAlerts: true,
    alertSound: true,
    browserNotifications: true,
};

export const PREFERENCES_STORAGE_KEY = 'sadaf_preferences';
export const PREFERENCES_CHANGED_EVENT = 'sadaf:preferences-changed';

/**
 * Legacy key used by the notification bell before the preferences store
 * existed. Kept so the bell's mute state and the settings page agree — the
 * preferences store is the single source of truth, and the legacy key is
 * mirrored for any older persisted value / external reader.
 */
export const LEGACY_GLOBAL_MUTE_KEY = 'sadaf_global_notifications_muted';

const preferencesSync = createLocalStorageSync<SitePreferences>(PREFERENCES_STORAGE_KEY, PREFERENCES_CHANGED_EVENT);

/**
 * Read the global-alerts muted state. The preferences store is the source
 * of truth; the legacy bell key is honored as a fallback for users who
 * muted before the settings hub existed.
 */
export function isGlobalAlertsMuted(): boolean {
    const prefs = preferencesSync.load();
    if (prefs && typeof prefs.globalAlerts === 'boolean') {
        return !prefs.globalAlerts;
    }
    try {
        return window.localStorage.getItem(LEGACY_GLOBAL_MUTE_KEY) === 'true';
    } catch {
        return false;
    }
}

/** Mirror the preferences' global-alerts state into the legacy bell key. */
export function syncLegacyGlobalMute(muted: boolean): void {
    try {
        window.localStorage.setItem(LEGACY_GLOBAL_MUTE_KEY, String(muted));
    } catch {
        // Storage unavailable — the preferences store still holds the truth.
    }
}

function loadStored(): SitePreferences {
    const stored = preferencesSync.load();
    if (!stored) return DEFAULT_PREFERENCES;
    // Merge so newly added fields keep their defaults for existing users.
    return { ...DEFAULT_PREFERENCES, ...stored };
}

interface PreferencesState {
    preferences: SitePreferences;
    setPreference: <K extends keyof SitePreferences>(key: K, value: SitePreferences[K]) => void;
    resetPreferences: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => {
    /** Set state + persist in one place so every mutation stays in sync. */
    const commit = (next: SitePreferences) => {
        set({ preferences: next });
        preferencesSync.save(next);
    };

    return {
        preferences: loadStored(),

        setPreference: (key, value) =>
            set((state) => {
                const next = { ...state.preferences, [key]: value };
                commit(next);
                return { preferences: next };
            }),

        resetPreferences: () => commit(DEFAULT_PREFERENCES),
    };
});
