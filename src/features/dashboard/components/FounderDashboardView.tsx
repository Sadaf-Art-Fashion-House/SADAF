'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Crown,
    MapPin,
    Coins,
    CheckCircle,
    UserPlus,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/shared/types';
import { useWSFounderDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { ErrorBanner } from '@/shared/ui/ErrorGuidance';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    specialty: string;
    status: 'Online' | 'Offline' | 'In-Atelier';
    location: string;
}

interface FounderDashboardViewProps {
    user: UserProfile;
    onLogout: () => void;
}

export default function FounderDashboardView({ user, onLogout }: FounderDashboardViewProps) {
    const { t } = useLanguage();
    const [founderTab, setFounderTab] = useState<'analytics' | 'revenue' | 'team'>('analytics');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ── WebSocket real-time data ──
    const { data: apiData, wsState, error: dataError } = useWSFounderDashboardData(true);
    const isLive = wsState.status === 'connected';

    // Team state
    const [team, setTeam] = useState<TeamMember[]>([
        { id: 'tm-1', name: 'Yasmine Sadaf', role: 'Founder & Art Director', specialty: 'Haute Imperial Couture', status: 'In-Atelier', location: 'Zamalik Quarters, Cairo' },
        { id: 'tm-2', name: 'Master Ahmed El-Saeed', role: 'Senior Calligrapher', specialty: 'Liquid Golden Diwani', status: 'In-Atelier', location: 'El-Hussein Workshop' },
        { id: 'tm-3', name: 'Dr. Farida Hammad', role: 'Auteur Painter', specialty: 'Sacred Nile Oils', status: 'Online', location: 'Alexandria Seafront' },
        { id: 'tm-4', name: 'Amir El-Farid', role: 'Lead Atelier Administrator', specialty: 'Logistics & Weaving Pact', status: 'In-Atelier', location: 'Giza Central Studio' },
        { id: 'tm-5', name: 'SADAF AI Core Dev', role: 'Generative Tech Director', specialty: 'Gemini Embroidery Prototyping', status: 'Online', location: 'Global Silicon Sandbox' },
    ]);

    // Invite state
    const [inviteName, setInviteName] = useState('');
    // Localized labels for founder data (values stay canonical English).
    const txTypeLabel: Record<string, string> = {
        'Haute Abaya Purchase': t('founder.tx.hauteAbaya'),
        'Golden Diwani Fine Artwork': t('founder.tx.goldenDiwani'),
        'Calligraphy Streetcoach Jacket': t('founder.tx.calligraphyJacket'),
        'Nile Oil Reflections Fine Art': t('founder.tx.nileOils'),
    };
    const teamRoleLabel: Record<string, string> = {
        'Apprentice Weaver': t('founder.role.apprenticeWeaver'),
        'Master Calligrapher': t('founder.role.masterCalligrapher'),
        'Auteur Painter': t('founder.role.auteurPainter'),
        'AI Tech Director': t('founder.role.aiTechDirector'),
        'Atelier Administrator': t('founder.role.atelierAdministrator'),
    };
    const specialtyLabel: Record<string, string> = {
        'Haute Imperial Couture': t('founder.specialty.imperial'),
        'Liquid Golden Diwani': t('founder.specialty.diwani'),
        'Sacred Nile Oils': t('founder.specialty.nile'),
        'Logistics & Weaving Pact': t('founder.specialty.logistics'),
        'Gemini Embroidery Prototyping': t('founder.specialty.gemini'),
    };
    const locationLabel: Record<string, string> = {
        'Zamalik Quarters, Cairo': t('founder.location.zamalik'),
        'El-Hussein Workshop': t('founder.location.hussein'),
        'Alexandria Seafront': t('founder.location.alexandria'),
        'Giza Central Studio': t('founder.location.giza'),
        'Global Silicon Sandbox': t('founder.location.global'),
    };
    const statusLabel: Record<string, string> = {
        'Online': t('founder.status.online'),
        'In-Atelier': t('founder.status.inAtelier'),
    };

    const [inviteRole, setInviteRole] = useState('Apprentice Weaver');
    const [transactions, setTransactions] = useState([
        { ref: 'TXN-9021-X', client: 'Layla Al-Khouri', value: '$1,250', type: 'Haute Abaya Purchase', details: 'Cairo central credit card auth' },
        { ref: 'TXN-4512-B', client: 'Layla Al-Khouri', value: '$3,400', type: 'Golden Diwani Fine Artwork', details: 'Escrow Alexandria verified' },
        { ref: 'TXN-8812-C', client: 'Karim Mansour', value: '$580', type: 'Calligraphy Streetcoach Jacket', details: 'Stripe transaction verified' },
        { ref: 'TXN-1104-Y', client: 'Dr. Farida Hammad', value: '$6,800', type: 'Nile Oil Reflections Fine Art', details: 'Collector private wire bank' },
    ]);

    const handleInviteTeam = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteName) return;

        const newMember: TeamMember = {
            id: `tm-${Date.now()}`,
            name: inviteName,
            role: inviteRole,
            specialty: 'Fatimid Octagram Sewing',
            status: 'Online',
            location: 'Cairo Atelier Room 4',
        };

        setTeam((prev) => [...prev, newMember]);
        setSuccessMsg(t('founder.team.added', { name: inviteName }));
        setInviteName('');
        setTimeout(() => setSuccessMsg(null), 3500);
    }, [inviteName, inviteRole]);

    // KPIs from WebSocket (with hardcoded fallback)
    const kpis = apiData?.kpis?.length ? apiData.kpis : [
        { label: 'GROSS COUTURE REVENUE', val: '$124,400', pct: '+14% MoM', color: 'text-green-400' },
        { label: 'FINE ART SALES', val: '$24,100', pct: '+32% MoM', color: 'text-[#C9A84C]' },
        { label: 'AI CREATED SHAPES', val: '1,492', pct: 'Active stencils', color: 'text-[#4FC3F7]' },
        { label: 'CURATOR RETENTION', val: '98.4%', pct: 'Gold VIP members', color: 'text-purple-400' },
    ];

    // Sync transactions + team from WebSocket
    useEffect(() => {
        if (!apiData?.transactions?.length) return;
        setTransactions(apiData.transactions as any[]);
    }, [apiData?.transactions]);

    useEffect(() => {
        if (!apiData?.team?.length) return;
        setTeam(apiData.team as any[]);
    }, [apiData?.team]);

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Founder Header */}
            <section className="relative pt-20 pb-12 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-1.5 mb-1 animate-pulse">
                                <Crown size={14} />
                                {t('founder.header.kicker')}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight">
                                {t('founder.header.title', { name: user.fullName || t('founder.header.defaultName') })}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-xl">
                                {t('founder.header.subtitle')}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 bg-black/40 hover:bg-white text-[10px] font-mono uppercase tracking-widest font-bold text-gray-300 hover:text-[#0A0F2C] border border-white/10 transition rounded-xl cursor-pointer"
                            >
                                {t('admin.sidebar.dashboardHome')}
                            </Link>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 bg-black/40 hover:bg-white text-[10px] font-mono uppercase tracking-widest font-bold text-gray-300 hover:text-[#0A0F2C] border border-[#C9A84C]/20 transition rounded-xl cursor-pointer"
                            >
                                {t('founder.header.logout')}
                            </button>
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex gap-2 mt-8 bg-[#090D2A]/80 p-1.5 border border-white/5 rounded-xl w-fit">
                        {[
                            { id: 'analytics', label: t('founder.tabs.analytics') },
                            { id: 'revenue', label: t('founder.tabs.revenue') },
                            { id: 'team', label: t('founder.tabs.team') },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFounderTab(tab.id as typeof founderTab)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-semibold tracking-wider transition cursor-pointer ${
                                    founderTab === tab.id
                                        ? 'bg-[#C9A84C] text-[#0A0F2C]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main content */}
            <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Real-time data degradation banner */}
                {dataError && (
                    <ErrorBanner tone="yellow" icon={AlertTriangle} message={t('admin.liveDegraded', { error: dataError })} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="p-5 bg-[#1B2A6B]/20 border border-[#C9A84C]/25 rounded-2xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">{t('founder.cashFlow')}</span>
                            <div className="flex gap-2 items-center">
                                <Coins size={16} className="text-[#C9A84C]" />
                                <span className="text-lg font-mono font-bold text-white">$148,500.00</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                {t('founder.cashFlow.hint')}
                            </p>
                        </div>

                        <div className="p-5 bg-[#0A0F2C]/80 border border-white/5 rounded-2xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">{t('founder.trust')}</span>
                            <span className="text-2xl font-serif text-white block font-bold">98.4%</span>
                            <p className="text-[10px] text-slate-400 mt-1">{t('founder.trust.hint')}</p>
                        </div>

                        <div className="p-5 bg-[#0A0F2C]/80 border border-white/5 rounded-2xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">{t('founder.occupancy')}</span>
                            <span className="text-2xl font-serif text-white block font-bold">12/14</span>
                            <p className="text-[10px] text-slate-400 mt-1">{t('founder.occupancy.hint')}</p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-8">
                        {/* Success message */}
                        {successMsg && (
                            <ErrorBanner tone="green" icon={CheckCircle} message={successMsg} showGuidance={false} />
                        )}

                        <AnimatePresence mode="wait">
                            {/* Analytics Tab */}
                            {founderTab === 'analytics' && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <ErrorBoundary label="founder:analytics">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-mono uppercase tracking-widest text-gray-600">
                                            {t('founder.metrics')}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                                            isLive ? 'text-green-400' : 'text-yellow-500'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                isLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'
                                            }`} />
                                            {isLive ? t('admin.live') : t('admin.polling15')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {kpis.map((kpi: any) => (
                                            <div
                                                key={kpi.label}
                                                className="p-5 rounded-xl bg-[#0F1435]/80 border border-white/5 shadow flex flex-col"
                                            >
                                                <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">{kpi.label}</span>
                                                <span className="text-2xl font-serif text-white font-bold block mt-2">{kpi.val}</span>
                                                <span className={`text-[10px] font-mono mt-0.5 ${kpi.color}`}>{kpi.pct}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Artisan pulse */}
                                    <div className="p-6 rounded-xl bg-[#090D2A]/80 border border-white/5">
                                        <h4 className="font-serif text-white text-base font-semibold mb-3">{t('founder.pulse')}</h4>
                                        <div className="h-36 flex items-end justify-between gap-3 pt-6">
                                            {[72, 50, 88, 65, 95, 78, 100].map((val, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                                    <div
                                                        className="w-full bg-gradient-to-t from-[#C9A84C] to-[#C9A84C]/40 rounded-t"
                                                        style={{ height: `${val * 0.8}px` }}
                                                    />
                                                    <span className="text-[8px] font-mono uppercase text-gray-500">
                                                        {t(['admin.day.mon', 'admin.day.tue', 'admin.day.wed', 'admin.day.thu', 'admin.day.fri', 'admin.day.sat', 'admin.day.sun'][idx] as TranslationKey)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    </ErrorBoundary>
                                </motion.div>
                            )}

                            {/* Revenue Tab */}
                            {founderTab === 'revenue' && (
                                <motion.div
                                    key="revenue"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <ErrorBoundary label="founder:revenue">
                                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                                        {t('founder.revenue.title')}
                                    </h3>
                                    <div className="bg-[#090D2A]/80 border border-white/5 rounded-xl p-4 overflow-x-auto">
                                        <table className="w-full text-left text-xs divide-y divide-white/5">
                                            <thead className="text-[10px] uppercase text-gray-500 font-mono">
                                                <tr>
                                                    <th className="py-2.5">{t('founder.table.ref')}</th>
                                                    <th>{t('founder.table.client')}</th>
                                                    <th>{t('founder.table.value')}</th>
                                                    <th>{t('founder.table.type')}</th>
                                                    <th>{t('founder.table.details')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-gray-300">
                                                {transactions.map((tx) => (
                                                    <tr key={tx.ref} className="hover:text-white transition">
                                                        <td className="py-2.5 font-mono text-[#C9A84C] text-[10px] font-bold">{tx.ref}</td>
                                                        <td>{tx.client}</td>
                                                        <td className="font-mono font-bold">{tx.value}</td>
                                                        <td className="text-xs">{txTypeLabel[tx.type] ?? tx.type}</td>
                                                        <td className="text-[10px] text-gray-500">{tx.details}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </ErrorBoundary>
                                </motion.div>
                            )}

                            {/* Team Tab */}
                            {founderTab === 'team' && (
                                <motion.div
                                    key="team"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <ErrorBoundary label="founder:team">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                                            {t('founder.team.title')}
                                        </h3>
                                        <span className="text-[10px] font-mono text-slate-500">{t('founder.team.members', { count: team.length })}</span>
                                    </div>

                                    <div className="space-y-3">
                                        {team.map((member) => (
                                            <div
                                                key={member.id}
                                                className="p-4 bg-[#0A0F2C]/60 border border-white/5 rounded-2xl flex items-center gap-4"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-serif font-bold text-white uppercase">{member.name}</h4>
                                                        <span className={`block w-1.5 h-1.5 rounded-full ${
                                                            member.status === 'Online' ? 'bg-green-400' : member.status === 'In-Atelier' ? 'bg-yellow-400' : 'bg-gray-500'
                                                        }`} />
                                                    </div>
                                                    <p className="text-[10px] font-mono text-[#C9A84C]">{teamRoleLabel[member.role] ?? member.role}</p>
                                                    <p className="text-[9px] text-slate-500 font-mono">{specialtyLabel[member.specialty] ?? member.specialty}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                                                        <MapPin size={8} className="text-[#C9A84C]" /> {locationLabel[member.location] ?? member.location}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-slate-500 uppercase">{statusLabel[member.status] ?? member.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Invite form */}
                                    <div className="p-6 bg-[#090D2A]/80 border border-[#C9A84C]/25 rounded-xl">
                                        <h4 className="font-serif text-white text-base mb-3 flex items-center gap-2">
                                            <UserPlus size={16} className="text-[#C9A84C]" />
                                            {t('founder.team.invite')}
                                        </h4>
                                        <form onSubmit={handleInviteTeam} className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="text"
                                                required
                                                value={inviteName}
                                                onChange={(e) => setInviteName(e.target.value)}
                                                placeholder={t('founder.team.invitePlaceholder')}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder-slate-600 outline-none focus:border-[#C9A84C] transition"
                                            />
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white outline-none cursor-pointer"
                                            >
                                                <option value="Apprentice Weaver">{teamRoleLabel['Apprentice Weaver']}</option>
                                                <option value="Master Calligrapher">{teamRoleLabel['Master Calligrapher']}</option>
                                                <option value="Auteur Painter">{teamRoleLabel['Auteur Painter']}</option>
                                                <option value="AI Tech Director">{teamRoleLabel['AI Tech Director']}</option>
                                                <option value="Atelier Administrator">{teamRoleLabel['Atelier Administrator']}</option>
                                            </select>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition cursor-pointer shrink-0"
                                            >
                                                {t('founder.team.add')}
                                            </button>
                                        </form>
                                    </div>
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </div>
    );
}