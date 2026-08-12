'use client';

import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import AnalyticsDashboard from './AnalyticsDashboard';
import Link from 'next/link';

interface AnalyticsPageClientProps {
    role?: 'admin' | 'founder';
}

export default function AnalyticsPageClient({ role = 'admin' }: AnalyticsPageClientProps) {
    const { t } = useLanguage();
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('analytics.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        {t('common.signIn')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <section className="relative pt-20 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight">
                                    {t('analytics.title')}
                                </h1>
                                <p className="text-xs text-[#E8E0D5]/60 mt-0.5">
                                    {role === 'founder'
                                        ? t('analytics.subtitle.founder')
                                        : t('analytics.subtitle.admin')}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={role === 'founder' ? '/dashboard/founder' : '/dashboard/admin'}
                            className="px-4 py-2 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-mono uppercase tracking-wider rounded-xl hover:bg-[#C9A84C]/10 transition-all duration-300"
                        >
                            {t('analytics.backTo', { role: role === 'founder' ? t('admin.sidebar.roleFounder') : t('admin.sidebar.roleAdmin') })}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Analytics Content */}
            <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
                <AnalyticsDashboard role={role} />
            </section>
        </div>
    );
}
