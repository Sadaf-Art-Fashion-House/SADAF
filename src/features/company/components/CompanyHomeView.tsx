'use client';

/**
 * SADAF | Company — Home View
 *
 * Pure presentation for the company workspace landing hub. All copy is
 * localized through `useLanguage` (t()), reusing the shared `connections.*`
 * keys where the copy overlaps the Connections hub. No state, no data
 * fetching — that stays in the page / page client layers.
 */

import Link from 'next/link';
import { Handshake, Building2, ArrowRight } from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { ROUTES } from '@/config/routes';

export default function CompanyHomeView() {
    const { t } = useLanguage();

    return (
        <>
            <section className="px-6 md:px-10 py-10 border-b border-rose-500/10 bg-gradient-to-b from-[#0A0F2C] to-[#2A1020]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-rose-400">
                        {t('company.home.kicker')}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-tight">
                    {t('company.home.title')}{' '}
                    <span className="text-rose-400 italic">{t('company.home.titleAccent')}</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
                    {t('company.home.subtitle')}
                </p>
            </section>

            <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto flex flex-col gap-6">
                <Link
                    href={ROUTES.DASHBOARD_COMPANY_CONNECTIONS}
                    className="group rounded-2xl bg-[#0A0F2C]/80 border border-rose-500/15 hover:border-rose-500/40 transition-all duration-300 p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                        <Handshake size={22} />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-serif text-white text-lg">{t('connections.kicker')}</h2>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {t('company.home.connectionsBody')}
                        </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-rose-400 group-hover:gap-3 transition-all duration-300">
                        {t('company.home.openHub')} <DirectionalIcon icon={ArrowRight} size={12} />
                    </span>
                </Link>

                <div className="rounded-2xl bg-[#0A0F2C]/40 border border-dashed border-white/10 p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/5 text-[#E8E0D5]/50 shrink-0">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <h2 className="font-serif text-white text-lg">{t('company.home.b2bTitle')}</h2>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {t('company.home.b2bBody')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
