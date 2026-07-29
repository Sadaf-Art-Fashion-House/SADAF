'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Crown,
    MapPin,
    Coins,
    CheckCircle,
    UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/shared/types';
import { useWSFounderDashboardData } from '@/features/dashboard/hooks/useDashboardData';

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
    const [founderTab, setFounderTab] = useState<'analytics' | 'revenue' | 'team'>('analytics');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ── WebSocket real-time data ──
    const { data: apiData, wsState } = useWSFounderDashboardData(true);
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
        setSuccessMsg(`Artisan credentials registered for ${inviteName}.`);
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
                                EXECUTIVE SUMMIT PLANE &bull; ديوان الإدارة العامة
                            </span>
                            <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight">
                                Chief Executive: {user.fullName || 'Directress Yasmine'}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-xl">
                                Ultimate accounting books, artisan personnel dispatch, and real-time AI creation metrics.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 bg-black/40 hover:bg-white text-[10px] font-mono uppercase tracking-widest font-bold text-gray-300 hover:text-[#0A0F2C] border border-white/10 transition rounded-xl cursor-pointer"
                            >
                                Dashboard Home
                            </Link>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 bg-black/40 hover:bg-white text-[10px] font-mono uppercase tracking-widest font-bold text-gray-300 hover:text-[#0A0F2C] border border-[#C9A84C]/20 transition rounded-xl cursor-pointer"
                            >
                                Logout Summit
                            </button>
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex gap-2 mt-8 bg-[#090D2A]/80 p-1.5 border border-white/5 rounded-xl w-fit">
                        {[
                            { id: 'analytics', label: 'Analytics' },
                            { id: 'revenue', label: 'Revenue' },
                            { id: 'team', label: 'Team' },
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="p-5 bg-[#1B2A6B]/20 border border-[#C9A84C]/25 rounded-2xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">CASH FLOW LIQUIDITY</span>
                            <div className="flex gap-2 items-center">
                                <Coins size={16} className="text-[#C9A84C]" />
                                <span className="text-lg font-mono font-bold text-white">$148,500.00</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                94% of liquid capital securely locked in sovereign Alexandria vault ledgers.
                            </p>
                        </div>
                    </div>

                    {/* Main panel */}
                    <div className="lg:col-span-9 bg-[#05081A]/95 border border-white/5 rounded-3xl p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            {/* Analytics Tab */}
                            {founderTab === 'analytics' && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">Enterprise Visual Metrics</h2>
                                        <p className="text-xs text-slate-400 mt-1">Cairo catalog sales, algorithmic patterns, and collections expansion.</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {kpis.map((k) => (
                                            <div key={k.label} className="p-4 bg-black/45 border border-white/5 rounded-xl">
                                                <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block mb-1">{k.label}</span>
                                                <h4 className="text-lg font-bold font-mono text-white leading-tight">{k.val}</h4>
                                                <span className={`text-[9px] font-mono ${k.color} mt-1 block uppercase font-bold`}>{k.pct}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SVG Chart */}
                                    <div className="bg-[#0A0F2C]/60 border border-white/5 rounded-2xl p-5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[9px] font-mono uppercase text-[#C9A84C] font-bold tracking-wider">
                                                Q4 HISTORICAL COLLECTOR ESCROW CURVE
                                            </span>
                                        </div>
                                        <div className="w-full h-40 bg-black/50 rounded-xl relative overflow-hidden">
                                            <svg className="w-full h-full p-2" viewBox="0 0 500 150" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.2" />
                                                        <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <path d="M0,130 C100,120 150,50 250,80 C350,110 400,20 500,10 L500,150 L0,150 Z" fill="url(#curveGrad)" />
                                                <path d="M0,130 C100,120 150,50 250,80 C350,110 400,20 500,10" fill="none" stroke="#C9A84C" strokeWidth="2.5" />
                                                <circle cx="250" cy="80" r="4.5" fill="#4FC3F7" className="animate-pulse" />
                                                <circle cx="500" cy="10" r="4.5" fill="#C9A84C" />
                                            </svg>
                                            <div className="absolute inset-x-2 bottom-2 flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                                                <span>October</span>
                                                <span>November</span>
                                                <span>December</span>
                                                <span>Current</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Revenue Tab */}
                            {founderTab === 'revenue' && (
                                <motion.div
                                    key="revenue"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">Executive Ledger Transactions</h2>
                                        <p className="text-xs text-slate-400 mt-1">Roster of audited premium payments processed inside SADAF.</p>
                                    </div>

                                    <div className="space-y-3.5">
                                        {transactions.map((t) => (
                                            <div
                                                key={t.ref}
                                                className="p-4 bg-black/35 border border-white/5 rounded-xl flex justify-between items-center gap-4 hover:border-white/10 transition"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono font-bold text-white uppercase">{t.client}</span>
                                                        <span className="text-[8px] font-mono text-slate-500">[{t.ref}]</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400">
                                                        {t.type} &mdash; <strong className="text-[9px] font-mono text-[#C9A84C] font-bold">{t.details}</strong>
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-xs md:text-sm font-mono font-bold text-[#C9A84C]">{t.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Team Tab */}
                            {founderTab === 'team' && (
                                <motion.div
                                    key="team"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">Artisan & Dev Team Dispatch</h2>
                                        <p className="text-xs text-slate-400 mt-1">Coordinate your master weavers, painters, and tech directors.</p>
                                    </div>

                                    {successMsg && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-3 bg-green-950/40 border border-green-500/35 text-green-200 text-xs rounded-xl flex items-center gap-2"
                                        >
                                            <CheckCircle size={14} className="text-green-400" />
                                            <span>{successMsg}</span>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {team.map((t) => (
                                            <div
                                                key={t.id}
                                                className="p-4 bg-black/35 border border-white/5 rounded-2xl flex justify-between items-center gap-4"
                                            >
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider">{t.name}</h4>
                                                    <p className="text-[10px] text-[#C9A84C] font-mono">
                                                        {t.role} &mdash; <span className="text-slate-500 italic">{t.specialty}</span>
                                                    </p>
                                                    <span className="inline-block text-[8px] font-mono tracking-widest text-slate-400 uppercase font-bold flex items-center gap-1">
                                                        <MapPin size={8} /> {t.location}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 border text-[8px] font-bold font-mono rounded uppercase shrink-0 ${
                                                        t.status === 'In-Atelier'
                                                            ? 'text-green-400 bg-green-950/20 border-green-500/20'
                                                            : 'text-blue-400 bg-blue-950/20 border-blue-500/10'
                                                    }`}
                                                >
                                                    {t.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Invite form */}
                                    <div className="p-5 bg-[#0A0F2C]/65 border border-[#C9A84C]/20 rounded-2xl">
                                        <h3 className="font-serif text-[#C9A84C] text-sm uppercase font-semibold flex items-center gap-2 mb-4">
                                            <UserPlus size={14} /> Register New Apprentice Artisan
                                        </h3>
                                        <form onSubmit={handleInviteTeam} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                required
                                                value={inviteName}
                                                onChange={(e) => setInviteName(e.target.value)}
                                                placeholder="Nabil Mansour"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#C9A84C]"
                                            />
                                            <input
                                                type="text"
                                                required
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                                placeholder="Master Weaver"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#C9A84C]"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full py-2.5 bg-[#C9A84C] text-[#0A0F2C] hover:bg-white text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition cursor-pointer"
                                            >
                                                Dispatch Credentials
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </div>
    );
}
