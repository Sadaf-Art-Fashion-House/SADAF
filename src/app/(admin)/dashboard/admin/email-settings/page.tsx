'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Plus, Trash2, Save, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import { ROUTES } from '@/config/routes';
import {
    getEmailSettings,
    saveEmailSettings,
    addRecipient,
    removeRecipient,
} from '@/features/email-settings';
import type { EmailSettings } from '@/features/email-settings';
import { useLanguage } from '@/features/i18n/LanguageProvider';

export default function AdminEmailSettingsPage() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const [settings, setSettings] = useState<EmailSettings>(getEmailSettings());
    const [newEmail, setNewEmail] = useState('');
    const [smtpStatus, setSmtpStatus] = useState<'checking' | 'configured' | 'missing'>('checking');
    const [saved, setSaved] = useState(false);

    const backHref = pathname.startsWith('/dashboard/founder')
        ? ROUTES.DASHBOARD_FOUNDER
        : ROUTES.DASHBOARD_ADMIN;

    useEffect(() => {
        fetch('/api/email/send?check=1')
            .then((res) => res.json())
            .then((data) => setSmtpStatus(data.configured ? 'configured' : 'missing'))
            .catch(() => setSmtpStatus('missing'));
    }, []);

    const handleAddRecipient = () => {
        const email = newEmail.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        const updated = addRecipient(email);
        setSettings(updated);
        setNewEmail('');
    };

    const handleRemoveRecipient = (email: string) => {
        const updated = removeRecipient(email);
        setSettings(updated);
    };

    const handleSave = () => {
        saveEmailSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0A0F2C] p-6 md:p-10">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={backHref}
                        className="text-[10px] text-[#4FC3F7]/50 hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider flex items-center gap-1 mb-3 cursor-pointer"
                    >
                        <DirectionalIcon icon={ArrowLeft} size={11} />
                        {t('emailSettings.backToDashboard')}
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide flex items-center gap-3">
                        <Mail size={22} className="text-[#4FC3F7]" />
                        {t('emailSettings.title')}
                    </h1>
                    <p className="text-xs text-[#E8E0D5]/40 font-mono mt-1">
                        {t('emailSettings.subtitle')}
                    </p>
                </div>

                {/* SMTP Status */}
                <div className="bg-[#05081A]/80 border border-white/5 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {smtpStatus === 'checking' ? (
                                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            ) : smtpStatus === 'configured' ? (
                                <Wifi size={14} className="text-green-400" />
                            ) : (
                                <WifiOff size={14} className="text-amber-400" />
                            )}
                            <span className="text-xs font-mono text-[#E8E0D5]/50">
                                {t('emailSettings.smtpServer')}:{' '}
                                {smtpStatus === 'checking'
                                    ? t('emailSettings.checking')
                                    : smtpStatus === 'configured'
                                      ? t('emailSettings.connected')
                                      : t('emailSettings.notConfigured')}
                            </span>
                        </div>
                        {smtpStatus === 'missing' && (
                            <span className="text-[9px] text-amber-400/60 font-mono">
                                {t('emailSettings.envHint')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Settings Form */}
                <div className="space-y-6">
                    {/* Toggle */}
                    <div className="bg-[#05081A]/80 border border-white/5 rounded-xl p-5">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <h3 className="text-sm font-serif text-white">{t('emailSettings.autoTitle')}</h3>
                                <p className="text-[10px] text-[#E8E0D5]/40 font-mono mt-0.5">
                                    {t('emailSettings.autoHint')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const updated = { ...settings, notifyOnError: !settings.notifyOnError };
                                    setSettings(updated);
                                }}
                                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                                    settings.notifyOnError ? 'bg-[#4FC3F7]' : 'bg-white/10'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                                        settings.notifyOnError ? 'translate-x-5' : ''
                                    }`}
                                />
                            </button>
                        </label>
                    </div>

                    {/* Include Stack Trace */}
                    <div className="bg-[#05081A]/80 border border-white/5 rounded-xl p-5">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <h3 className="text-sm font-serif text-white">{t('emailSettings.stackTitle')}</h3>
                                <p className="text-[10px] text-[#E8E0D5]/40 font-mono mt-0.5">
                                    {t('emailSettings.stackHint')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const updated = { ...settings, includeStackTrace: !settings.includeStackTrace };
                                    setSettings(updated);
                                }}
                                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                                    settings.includeStackTrace ? 'bg-[#4FC3F7]' : 'bg-white/10'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                                        settings.includeStackTrace ? 'translate-x-5' : ''
                                    }`}
                                />
                            </button>
                        </label>
                    </div>

                    {/* Recipients */}
                    <div className="bg-[#05081A]/80 border border-white/5 rounded-xl p-5">
                        <h3 className="text-sm font-serif text-white mb-3">{t('emailSettings.recipients')}</h3>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                                placeholder="email@example.com"
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-[#E8E0D5]/20 focus:outline-none focus:border-[#4FC3F7]/50 transition-all"
                            />
                            <button
                                onClick={handleAddRecipient}
                                disabled={!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())}
                                className="p-2 rounded-lg bg-[#4FC3F7]/10 border border-[#4FC3F7]/20 text-[#4FC3F7]/70 hover:text-[#4FC3F7] hover:bg-[#4FC3F7]/20 transition-all disabled:opacity-30 cursor-pointer"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {settings.recipients.length === 0 ? (
                            <p className="text-[11px] text-[#E8E0D5]/30 font-mono italic">
                                {t('emailSettings.noRecipients')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {settings.recipients.map((email) => (
                                    <div
                                        key={email}
                                        className="flex items-center justify-between bg-black/30 border border-white/5 rounded-lg px-3 py-2"
                                    >
                                        <span className="text-xs text-[#E8E0D5]/70 font-mono">{email}</span>
                                        <button
                                            onClick={() => handleRemoveRecipient(email)}
                                            className="p-1 rounded hover:bg-red-950/20 text-[#E8E0D5]/20 hover:text-red-400 transition-all cursor-pointer"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#4FC3F7] to-[#1B2A6B] text-white hover:scale-[1.02] active:scale-95 transition-all duration-200 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                        {saved ? (
                            <>
                                <Check size={14} className="text-green-300" />
                                {t('emailSettings.saved')}
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                {t('emailSettings.save')}
                            </>
                        )}
                    </button>

                    {smtpStatus === 'missing' && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5 text-[9px] text-amber-400/50 font-mono"
                        >
                            <AlertCircle size={10} />
                            {t('emailSettings.smtpWarning')}
                        </motion.div>
                    )}
                </div>

                {/* Footer info */}
                <div className="mt-10 text-center">
                    <p className="text-[8px] text-[#E8E0D5]/15 font-mono tracking-wider">
                        {t('emailSettings.footer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
