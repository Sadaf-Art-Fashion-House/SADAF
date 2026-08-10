'use client';

/**
 * SADAF | i18n — Language Provider
 *
 * Reads the language from the shared preferences store, applies the
 * document `lang` + `dir` attributes (Arabic flips the whole layout to RTL),
 * and exposes a `t(key)` translation function through context.
 *
 * The preference lives in the preferences store (persisted, cross-tab
 * synced) — the provider only reacts to it. Hydration-safe: the document
 * attributes are applied in an effect, never during render.
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
    usePreferencesStore,
    type SiteLanguage,
    PREFERENCES_CHANGED_EVENT,
} from '@/features/settings/store/usePreferencesStore';
import { dictionaries, en } from './dictionaries';
import type { TranslationKey } from './dictionaries';

interface LanguageContextValue {
    language: SiteLanguage;
    /** Translate a key — falls back to English when the key is missing. */
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    /**
     * Translate a dynamic value (e.g. catalog category names). Tries the
     * given dictionary key; when the value has no translation entry it
     * returns the original value untouched (safe for data-driven strings).
     */
    tc: (key: string, fallback: string) => string;
    setLanguage: (language: SiteLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Substitute {var} placeholders, e.g. t('settings.updated.language', { lang: 'العربية' }). */
function interpolate(template: string, vars?: Record<string, string | number>): string {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match,
    );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { preferences, setPreference } = usePreferencesStore();
    const { language, theme, fontScale, reducedMotion, highContrast } = preferences;

    useEffect(() => {
        const root = document.documentElement;
        root.lang = language;
        root.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    // Apply the theme preference: `pref-light-theme` on <html> flips the
    // whole app to the light palette (globals.css override layer). 'auto'
    // follows the OS color-scheme and reacts to live changes.
    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = () => {
            const isLight =
                theme === 'light' ||
                (theme === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
            root.classList.toggle('pref-light-theme', isLight);
        };
        applyTheme();
        if (theme === 'auto') {
            const mq = window.matchMedia('(prefers-color-scheme: light)');
            mq.addEventListener('change', applyTheme);
            return () => mq.removeEventListener('change', applyTheme);
        }
    }, [theme]);

    // Apply the UX preferences at the document level: root font size (scales
    // every rem-based Tailwind size) + reduced-motion / high-contrast classes
    // (styled in globals.css). Re-applied on same-tab preference changes via
    // the custom event so the settings page and the rest of the app agree.
    useEffect(() => {
        const root = document.documentElement;
        const apply = () => {
            root.style.fontSize = `${Math.round(fontScale * 16)}px`;
            root.classList.toggle('pref-reduced-motion', reducedMotion);
            root.classList.toggle('pref-high-contrast', highContrast);
        };
        apply();
        window.addEventListener(PREFERENCES_CHANGED_EVENT, apply);
        return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, apply);
    }, [fontScale, reducedMotion, highContrast]);

    const value = useMemo<LanguageContextValue>(() => {
        const dict = dictionaries[language] ?? en;
        return {
            language,
            t: (key, vars) => interpolate(dict[key] ?? en[key] ?? key, vars),
            tc: (key, fallback) => (dict[key as TranslationKey] ?? en[key as TranslationKey]) || fallback,
            setLanguage: (next) => setPreference('language', next),
        };
    }, [language, setPreference]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useLanguage must be used within a <LanguageProvider>.');
    }
    return ctx;
}
