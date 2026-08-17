'use client';

/**
 * SADAF | Settings — View
 *
 * Pure presentation: renders the settings hub (language / appearance /
 * accessibility / notifications / privacy / data) bound to the shared
 * preferences store. All strings come from the i18n `t()` hook, so the
 * whole page flips language instantly — including RTL when Arabic is picked.
 *
 * The success toast uses the shared SuccessToast (My Activity pattern).
 */

import { useState } from 'react';
import {
    Globe,
    Palette,
    Accessibility,
    Bell,
    ShieldCheck,
    Database,
    Download,
    Trash2,
    RotateCcw,
    Stamp,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import SuccessToast from '@/shared/components/SuccessToast';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import {
    usePreferencesStore,
    type SiteTheme,
    type SiteLanguage,
} from '@/features/settings/store/usePreferencesStore';
import { useBrowserNotificationPermission } from '@/features/notifications/hooks/useBrowserNotificationPermission';

// ─── Small building blocks ──────────────────────────────────────────────────

function Toggle({
    checked,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="w-full flex items-center justify-between gap-4 py-3 text-left cursor-pointer group"
        >
            <span className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#E8E0D5]">{label}</span>
                {hint && <span className="block text-[9px] text-[#E8E0D5]/45 mt-0.5">{hint}</span>}
            </span>
            <span
                className={`shrink-0 w-9 h-5 rounded-full transition-colors duration-200 relative ${
                    checked ? 'bg-[#4FC3F7]' : 'bg-white/10'
                }`}
            >
                <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                        checked ? 'left-[18px]' : 'left-0.5'
                    }`}
                />
            </span>
        </button>
    );
}

function SectionCard({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-[#05081A]/90 border border-white/5 rounded-3xl p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="p-2 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#4FC3F7]/10 border border-[#C9A84C]/20 text-[#C9A84C] shrink-0">
                    {icon}
                </span>
                <div>
                    <h2 className="font-serif text-white text-base font-bold">{title}</h2>
                    <p className="text-[10px] text-[#E8E0D5]/50 mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className="divide-y divide-white/5">{children}</div>
        </section>
    );
}

function ChipButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                active
                    ? 'bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C]'
                    : 'border-white/10 text-[#E8E0D5]/60 hover:border-white/25 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

// ─── Main view ──────────────────────────────────────────────────────────────

export default function SettingsView() {
    const { t, language, setLanguage } = useLanguage();
    const { preferences, setPreference, resetPreferences } = usePreferencesStore();
    const { isSupported: browserNotificationsSupported, permission: browserPermission, requestPermission } =
        useBrowserNotificationPermission();

    const [showSavedToast, setShowSavedToast] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [exported, setExported] = useState(false);

    const confirmReset = () => {
        resetPreferences();
        setShowResetConfirm(false);
        setShowSavedToast(true);
    };

    const handleExport = () => {
        // Sandbox export: download a JSON copy of the stored preferences.
        try {
            const blob = new Blob([JSON.stringify(preferences, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sadaf-preferences.json';
            a.click();
            URL.revokeObjectURL(url);
            setExported(true);
            setTimeout(() => setExported(false), 3000);
        } catch {
            // Download unavailable — silently keep the toast off.
        }
    };

    const handleClearLocalData = () => {
        const keys = ['sadaf_preferences', 'sadaf_cart', 'sadaf_wishlist', 'sadaf_notifications'];
        for (const key of keys) {
            try {
                localStorage.removeItem(key);
            } catch {
                // Ignore individual failures — best effort.
            }
        }
        setShowSavedToast(true);
    };

    const themeOptions: { value: SiteTheme; label: string }[] = [
        { value: 'dark', label: t('appearance.theme.dark') },
        { value: 'light', label: t('appearance.theme.light') },
        { value: 'auto', label: t('appearance.theme.auto') },
    ];

    const languageOptions: { value: SiteLanguage; label: string }[] = [
        { value: 'en', label: t('language.english') },
        { value: 'ar', label: t('language.arabic') },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* ── Language & Region ── */}
            <SectionCard
                icon={<Globe size={16} />}
                title={t('language.title')}
                subtitle={t('language.subtitle')}
            >
                <div className="py-3 flex flex-wrap items-center gap-2">
                    {languageOptions.map((option) => (
                        <ChipButton
                            key={option.value}
                            active={language === option.value}
                            onClick={() => {
                                setLanguage(option.value);
                                setShowSavedToast(true);
                            }}
                        >
                            {option.label}
                        </ChipButton>
                    ))}
                </div>
                <p className="pb-2 text-[9px] text-[#E8E0D5]/40">
                    {t('language.current')}:{' '}
                    <span className="text-[#C9A84C]">
                        {language === 'ar' ? t('language.arabic') : t('language.english')}
                    </span>
                </p>
            </SectionCard>

            {/* ── Appearance ── */}
            <SectionCard
                icon={<Palette size={16} />}
                title={t('appearance.title')}
                subtitle={t('appearance.subtitle')}
            >
                <div className="py-3">
                    <p className="text-[11px] font-semibold text-[#E8E0D5] mb-2">{t('appearance.theme')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {themeOptions.map((option) => (
                            <ChipButton
                                key={option.value}
                                active={preferences.theme === option.value}
                                onClick={() => {
                                    setPreference('theme', option.value);
                                    setShowSavedToast(true);
                                }}
                            >
                                {option.label}
                            </ChipButton>
                        ))}
                    </div>
                    <p className="text-[9px] text-[#E8E0D5]/40 mt-1.5">{t('appearance.theme.hint')}</p>
                </div>

                <div className="py-3">
                    <p className="text-[11px] font-semibold text-[#E8E0D5] mb-2">
                        {t('appearance.fontScale')}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] text-[#E8E0D5]/50 shrink-0">85%</span>
                        <input
                            type="range"
                            min={0.85}
                            max={1.25}
                            step={0.05}
                            value={preferences.fontScale}
                            onChange={(event) => setPreference('fontScale', Number(event.target.value))}
                            className="flex-1 accent-[#C9A84C] cursor-pointer"
                            aria-label={t('appearance.fontScale')}
                        />
                        <span className="text-[9px] text-[#E8E0D5]/50 shrink-0">125%</span>
                        <span className="text-[10px] font-mono text-[#C9A84C] w-10 text-center shrink-0">
                            {Math.round(preferences.fontScale * 100)}%
                        </span>
                    </div>
                    <p className="text-[9px] text-[#E8E0D5]/40 mt-1.5">{t('appearance.fontScale.hint')}</p>
                </div>

                <div className="py-3">
                    <p className="text-[11px] font-semibold text-[#E8E0D5] mb-2">{t('appearance.density')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <ChipButton
                            active={!preferences.compactDensity}
                            onClick={() => {
                                setPreference('compactDensity', false);
                                setShowSavedToast(true);
                            }}
                        >
                            {t('appearance.density.comfortable')}
                        </ChipButton>
                        <ChipButton
                            active={preferences.compactDensity}
                            onClick={() => {
                                setPreference('compactDensity', true);
                                setShowSavedToast(true);
                            }}
                        >
                            {t('appearance.density.compact')}
                        </ChipButton>
                    </div>
                    <p className="text-[9px] text-[#E8E0D5]/40 mt-1.5">{t('appearance.density.hint')}</p>
                </div>
            </SectionCard>

            {/* ── Accessibility ── */}
            <SectionCard
                icon={<Accessibility size={16} />}
                title={t('accessibility.title')}
                subtitle={t('accessibility.subtitle')}
            >
                <Toggle
                    checked={preferences.reducedMotion}
                    onChange={(next) => {
                        setPreference('reducedMotion', next);
                        setShowSavedToast(true);
                    }}
                    label={t('accessibility.reducedMotion')}
                    hint={t('accessibility.reducedMotion.hint')}
                />
                <Toggle
                    checked={preferences.highContrast}
                    onChange={(next) => {
                        setPreference('highContrast', next);
                        setShowSavedToast(true);
                    }}
                    label={t('accessibility.highContrast')}
                    hint={t('accessibility.highContrast.hint')}
                />
            </SectionCard>

            {/* ── Notifications ── */}
            <SectionCard
                icon={<Bell size={16} />}
                title={t('notifications.title')}
                subtitle={t('notifications.subtitle')}
            >
                <Toggle
                    checked={preferences.globalAlerts}
                    onChange={(next) => {
                        setPreference('globalAlerts', next);
                        setShowSavedToast(true);
                    }}
                    label={t('notifications.globalAlerts')}
                    hint={t('notifications.globalAlerts.hint')}
                />
                <Toggle
                    checked={preferences.alertSound}
                    onChange={(next) => {
                        setPreference('alertSound', next);
                        setShowSavedToast(true);
                    }}
                    label={t('notifications.sound')}
                    hint={t('notifications.sound.hint')}
                />
                <Toggle
                    checked={preferences.browserNotifications}
                    onChange={async (next) => {
                        setPreference('browserNotifications', next);
                        setShowSavedToast(true);
                        // Enabling requests the Notification API permission
                        // right here (user gesture) — the toggle is bound to
                        // the real permission, not just a stored flag.
                        if (next && browserNotificationsSupported) {
                            await requestPermission();
                        }
                    }}
                    label={t('notifications.browser')}
                    hint={t('notifications.browser.hint')}
                />
                {/* Live permission state — the toggle reflects what the
                    browser actually allows, not just the stored preference. */}
                {!browserNotificationsSupported ? (
                    <p className="text-[9px] text-[#E8E0D5]/40 mt-1">
                        {t('notifications.browser.unsupported')}
                    </p>
                ) : browserPermission === 'denied' ? (
                    <p className="text-[9px] text-red-400/90 mt-1 flex items-center gap-1.5">
                        <AlertTriangle size={11} className="shrink-0" />
                        {t('notifications.browser.blocked')}
                    </p>
                ) : preferences.browserNotifications && browserPermission === 'granted' ? (
                    <p className="text-[9px] text-green-400/90 mt-1 flex items-center gap-1.5">
                        <CheckCircle2 size={11} className="shrink-0" />
                        {t('notifications.browser.granted')}
                    </p>
                ) : preferences.browserNotifications && browserPermission === 'default' ? (
                    <p className="text-[9px] text-[#4FC3F7]/80 mt-1">
                        {t('notifications.browser.ask')}
                    </p>
                ) : null}
            </SectionCard>

            {/* ── Privacy ── */}
            <SectionCard
                icon={<ShieldCheck size={16} />}
                title={t('privacy.title')}
                subtitle={t('privacy.subtitle')}
            >
                <div className="py-3 flex items-center justify-between gap-4">
                    <span className="min-w-0">
                        <span className="block text-[11px] font-semibold text-[#E8E0D5]">
                            {t('privacy.visibility')}
                        </span>
                        <span className="block text-[9px] text-[#E8E0D5]/45 mt-0.5">
                            {t('privacy.visibility.hint')}
                        </span>
                    </span>
                    <div className="flex gap-2 shrink-0">
                        <ChipButton active onClick={() => undefined}>
                            {t('privacy.visibility.public')}
                        </ChipButton>
                        <ChipButton active={false} onClick={() => undefined}>
                            {t('privacy.visibility.private')}
                        </ChipButton>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClearLocalData}
                    className="w-full flex items-center gap-2 py-3 text-[10px] font-mono text-red-400/70 hover:text-red-400 hover:bg-red-950/20 rounded-lg px-2 -mx-2 transition-all cursor-pointer"
                >
                    <Trash2 size={12} />
                    {t('privacy.clearData')}
                    <span className="text-[8px] text-[#E8E0D5]/40 font-normal normal-case">
                        {t('privacy.clearData.hint')}
                    </span>
                </button>
            </SectionCard>

            {/* ── Data & Autosave ── */}
            <SectionCard
                icon={<Database size={16} />}
                title={t('data.title')}
                subtitle={t('data.subtitle')}
            >
                <Toggle
                    checked={preferences.autosaveEnabled}
                    onChange={(next) => {
                        setPreference('autosaveEnabled', next);
                        setShowSavedToast(true);
                    }}
                    label={t('data.autosave')}
                    hint={t('data.autosave.hint')}
                />
                <button
                    type="button"
                    onClick={handleExport}
                    className="w-full flex items-center gap-2 py-3 text-[10px] font-mono text-[#4FC3F7]/80 hover:text-[#4FC3F7] hover:bg-[#4FC3F7]/5 rounded-lg px-2 -mx-2 transition-all cursor-pointer"
                >
                    <Download size={12} />
                    {t('data.export')}
                    <span className="text-[8px] text-[#E8E0D5]/40 font-normal normal-case">
                        {t('data.export.hint')}
                    </span>
                    {exported && (
                        <span className="ml-auto text-[8px] text-emerald-400 font-bold">
                            {t('data.exported')}
                        </span>
                    )}
                </button>
            </SectionCard>

            {/* ── Watermark & export preferences ── */}
            <section className="bg-[#05081A]/90 border border-white/5 rounded-3xl p-5 md:p-6">
                <Link
                    href={ROUTES.DASHBOARD_WATERMARK_SETTINGS}
                    className="flex items-center gap-3 group"
                >
                    <span className="p-2 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#4FC3F7]/10 border border-[#C9A84C]/20 text-[#C9A84C] shrink-0">
                        <Stamp size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block font-serif text-white text-base font-bold">
                            {t('settings.watermark.title')}
                        </span>
                        <span className="block text-[10px] text-[#E8E0D5]/50 mt-0.5">
                            {t('settings.watermark.subtitle')}
                        </span>
                    </span>
                    <DirectionalIcon icon={ArrowRight} size={14} className="text-[#C9A84C] group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </section>

            {/* ── Reset ── */}
            <div className="flex items-center justify-between gap-4 bg-[#05081A]/60 border border-white/5 rounded-2xl px-4 py-3">
                <span className="text-[10px] text-[#E8E0D5]/50">
                    {showResetConfirm ? t('settings.resetConfirm') : t('settings.reset.hint')}
                </span>
                {showResetConfirm ? (
                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={confirmReset}
                            className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 text-[9px] font-mono uppercase tracking-wider hover:bg-red-500/25 transition-all cursor-pointer"
                        >
                            {t('common.reset')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowResetConfirm(false)}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-[#E8E0D5]/60 text-[9px] font-mono uppercase tracking-wider hover:border-white/25 transition-all cursor-pointer"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[#E8E0D5]/60 text-[9px] font-mono uppercase tracking-wider hover:border-white/25 hover:text-white transition-all cursor-pointer shrink-0"
                    >
                        <RotateCcw size={10} />
                        {t('common.reset')}
                    </button>
                )}
            </div>

            {/* Saved confirmation toast — shared SuccessToast shell. */}
            <SuccessToast
                visible={showSavedToast}
                title={t('settings.saved')}
                message={t('settings.saved.message')}
                onDismiss={() => setShowSavedToast(false)}
            />
        </div>
    );
}
