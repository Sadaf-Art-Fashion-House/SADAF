'use client';

/**
 * SADAF | i18n — Language Switcher (header)
 *
 * Compact globe dropdown to switch the site language. Reads the preference
 * from the shared store (persisted + cross-tab synced); the LanguageProvider
 * applies `lang`/`dir` to the document, so picking Arabic flips the whole
 * layout to RTL instantly.
 */

import { useEffect, useRef, useState } from 'react';
import { Globe, Check, Languages } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import type { SiteLanguage } from '@/features/settings/store/usePreferencesStore';

const OPTIONS: { value: SiteLanguage; label: string; native: string }[] = [
    { value: 'en', label: 'English', native: 'English' },
    { value: 'ar', label: 'العربية', native: 'العربية' },
];

interface LanguageSwitcherProps {
    /** Mobile drawer variant — inline EN/AR pills instead of a dropdown. */
    variant?: 'dropdown' | 'mobile';
}

export default function LanguageSwitcher({ variant = 'dropdown' }: LanguageSwitcherProps) {
    const { language, setLanguage, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape (same pattern as NotificationBell).
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const current = OPTIONS.find((option) => option.value === language) ?? OPTIONS[0];

    // Mobile drawer variant — always-visible EN / عربي pills.
    if (variant === 'mobile') {
        return (
            <div className="w-full mt-1">
                <p className="flex items-center gap-1.5 px-3 py-1 text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                    <Languages size={10} className="text-[#C9A84C]/60" />
                    {t('langSwitcher.label')}
                </p>
                <div className="flex gap-2 px-3 pb-2">
                    {OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setLanguage(option.value)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-mono transition-all cursor-pointer ${
                                language === option.value
                                    ? 'bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C]'
                                    : 'border-white/10 text-[#E8E0D5]/50 hover:border-white/25 hover:text-white'
                            }`}
                        >
                            {option.native}
                            {language === option.value && <Check size={9} />}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="p-2 text-slate-300 hover:text-[#C9A84C] relative transition-colors duration-300 cursor-pointer flex items-center gap-1.5"
                title={t('langSwitcher.label')}
                aria-label={`${t('langSwitcher.label')}: ${current.native}`}
                aria-expanded={open}
            >
                <Globe size={16} />
                <span className="hidden lg:inline text-[9px] font-mono uppercase tracking-wider">
                    {language === 'ar' ? 'ع' : 'EN'}
                </span>
            </button>

            {open && (
                <div className="absolute top-full end-0 mt-2 w-44 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden py-1 z-50">
                    <p className="px-3 pt-2 pb-1 text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                        {t('langSwitcher.label')}
                    </p>
                    {OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                setLanguage(option.value);
                                setOpen(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                        >
                            <span>{option.native}</span>
                            {language === option.value && (
                                <Check size={12} className="text-[#C9A84C]" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
