'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Settings, ArrowLeft } from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import { ROUTES } from '@/config/routes';
import SettingsView from '@/features/settings/components/SettingsView';
import { useLanguage } from '@/features/i18n/LanguageProvider';

export default function SettingsPageClient() {
    const { t } = useLanguage();

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Page header */}
            <section className="relative pt-20 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link
                            href={ROUTES.DASHBOARD}
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 hover:text-[#C9A84C] transition-colors mb-4"
                        >
                            <DirectionalIcon icon={ArrowLeft} size={12} />
                            {t('common.back')}
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#4FC3F7]/10 border border-[#C9A84C]/20">
                                <Settings size={20} className="text-[#C9A84C]" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-serif text-white font-bold tracking-tight">
                                    {t('settings.title')}
                                </h1>
                                <p className="text-sm text-[#E8E0D5]/60 mt-0.5">
                                    {t('settings.subtitle')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <section className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <SettingsView />
                </motion.div>
            </section>
        </div>
    );
}
