'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Users,
    UserPlus,
    UserMinus,
    Search,
    X,
    Copy,
    CheckCheck,
    Gift,
    Heart,
    Filter,
    Send,
    Check,
    Clock,
    DollarSign,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type {
    Connection,
    ConnectionRequest,
    NetworkGraph,
    NetworkNode,
    ReferralInfo,
    ConnectionType,
} from '../types';
import { ROUTES } from '@/config/routes';
import RoleBadge from '@/shared/components/RoleBadge';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface CommunityViewProps {
    connections: Connection[];
    pendingRequests: ConnectionRequest[];
    networkGraph: NetworkGraph;
    referralInfo: ReferralInfo;
    stats: {
        totalConnections: number;
        familyCount: number;
        friendCount: number;
        totalSpentByNetwork: number;
        pendingReceived: number;
        sentRequests: number;
    };
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filterType: ConnectionType | 'all';
    setFilterType: (t: ConnectionType | 'all') => void;
    isInviteModalOpen: boolean;
    setIsInviteModalOpen: (v: boolean) => void;
    acceptRequest: (requestId: string) => void;
    declineRequest: (requestId: string) => void;
    removeConnection: (userId: string) => void;
    sendInvite: (email: string, name: string, type: ConnectionType, message?: string) => void;
    copyReferralCode: () => Promise<boolean>;
}

export default function CommunityView({
    connections,
    pendingRequests,
    networkGraph,
    referralInfo,
    stats,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    isInviteModalOpen,
    setIsInviteModalOpen,
    acceptRequest,
    declineRequest,
    removeConnection,
    sendInvite,
    copyReferralCode,
}: CommunityViewProps) {
    const { t, language } = useLanguage();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteType, setInviteType] = useState<ConnectionType>('friend');
    const [inviteMessage, setInviteMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
    const [graphScale, setGraphScale] = useState(1);
    const graphContainerRef = useRef<HTMLDivElement>(null);

    const receivedRequests = pendingRequests.filter((r) => r.direction === 'received');
    const sentRequests = pendingRequests.filter((r) => r.direction === 'sent');

    /** Format a date in the active site language (ar-EG vs en-US). */
    const formatDate = (dateStr: string): string =>
        new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');

    const handleCopyCode = useCallback(async () => {
        const success = await copyReferralCode();
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [copyReferralCode]);

    const handleSendInvite = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!inviteEmail.trim() || !inviteName.trim()) return;
            sendInvite(inviteEmail, inviteName, inviteType, inviteMessage || undefined);
            setInviteEmail('');
            setInviteName('');
            setInviteMessage('');
            setIsInviteModalOpen(false);
        },
        [inviteEmail, inviteName, inviteType, inviteMessage, sendInvite, setIsInviteModalOpen],
    );

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Hero / Header ── */}
            <section className="relative pt-20 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight">
                                        {t('community.title')}
                                    </h1>
                                    <p className="text-xs text-[#E8E0D5]/60 mt-0.5">
                                        {t('community.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <UserPlus size={13} /> {t('community.invite')}
                                </button>
                                <Link
                                    href={ROUTES.DASHBOARD}
                                    className="px-4 py-2 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-mono uppercase tracking-wider rounded-xl hover:bg-[#C9A84C]/10 transition-all duration-300"
                                >
                                    {t('community.backToDashboard')}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats Cards ── */}
            <section className="py-6 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: t('community.stat.connections'), value: String(stats.totalConnections), icon: Users, color: 'text-[#4FC3F7] bg-[#4FC3F7]/10' },
                        { label: t('community.stat.family'), value: String(stats.familyCount), icon: Heart, color: 'text-emerald-400 bg-emerald-500/10' },
                        { label: t('community.stat.friends'), value: String(stats.friendCount), icon: Users, color: 'text-amber-400 bg-amber-500/10' },
                        { label: t('community.stat.pending'), value: String(stats.pendingReceived), icon: Clock, color: 'text-orange-400 bg-orange-500/10' },
                        { label: t('community.stat.networkSpent'), value: `$${stats.totalSpentByNetwork.toLocaleString()}`, icon: DollarSign, color: 'text-[#C9A84C] bg-[#C9A84C]/10' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="group flex flex-col items-center p-4 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 rounded-2xl transition-all duration-300"
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon size={16} />
                            </div>
                            <p className="text-lg font-serif text-white font-bold">{stat.value}</p>
                            <p className="text-[8px] font-mono uppercase tracking-[0.15em] text-[#E8E0D5]/40 font-semibold">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Main Content Grid ── */}
            <section className="px-4 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Left Column: Network Graph ── */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Network Graph Card */}
                        <div className="p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-2">
                                    <RefreshCw size={12} /> {t('community.networkGraph')}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setGraphScale((s) => Math.max(0.5, s - 0.1))}
                                        className="p-1 rounded-md text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all text-xs cursor-pointer"
                                        title={t('community.zoomOut')}
                                    >
                                        −
                                    </button>
                                    <button
                                        onClick={() => setGraphScale((s) => Math.min(2, s + 0.1))}
                                        className="p-1 rounded-md text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all text-xs cursor-pointer"
                                        title={t('community.zoomIn')}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Graph visualization */}
                            <div
                                ref={graphContainerRef}
                                className="relative w-full aspect-square max-h-[350px] bg-[#0A0F2C]/40 border border-white/[0.03] rounded-xl overflow-hidden"
                            >
                                {/* SVG-based network graph */}
                                <svg
                                    viewBox="0 0 400 350"
                                    className="w-full h-full transition-transform duration-300"
                                    style={{ transform: `scale(${graphScale})` }}
                                >
                                    {/* Links (edges) */}
                                    {networkGraph.links.map((link, i) => {
                                        const sourceNode = networkGraph.nodes.find((n) => n.id === link.source);
                                        const targetNode = networkGraph.nodes.find((n) => n.id === link.target);
                                        if (!sourceNode || !targetNode) return null;
                                        const pos = getNodePosition(sourceNode.id, targetNode.id);
                                        return (
                                            <line
                                                key={`link-${i}`}
                                                x1={pos.x1}
                                                y1={pos.y1}
                                                x2={pos.x2}
                                                y2={pos.y2}
                                                stroke={link.type === 'family' ? '#10B981' : '#F59E0B'}
                                                strokeWidth={link.strength * 3}
                                                strokeOpacity={0.3 + link.strength * 0.3}
                                                className="transition-all duration-300"
                                            />
                                        );
                                    })}

                                    {/* Nodes */}
                                    {networkGraph.nodes.map((node) => {
                                        const pos = getNodePositionById(node.id);
                                        const isSelected = selectedNode?.id === node.id;
                                        const isSelf = node.id === 'self';
                                        const radius = isSelf ? 22 : 14 + (node.purchaseCount ?? 0) * 1.5;

                                        return (
                                            <g
                                                key={node.id}
                                                onClick={() => setSelectedNode(isSelected ? null : node)}
                                                className="cursor-pointer"
                                            >
                                                {/* Glow on selected */}
                                                {isSelected && (
                                                    <circle
                                                        cx={pos.x}
                                                        cy={pos.y}
                                                        r={radius + 8}
                                                        fill="none"
                                                        stroke="#C9A84C"
                                                        strokeWidth={2}
                                                        strokeOpacity={0.3}
                                                    />
                                                )}
                                                {/* Node circle */}
                                                <circle
                                                    cx={pos.x}
                                                    cy={pos.y}
                                                    r={radius}
                                                    fill={isSelf ? '#C9A84C' : node.group === 'family' ? '#10B981' : '#F59E0B'}
                                                    fillOpacity={isSelf ? 1 : 0.7}
                                                    stroke={isSelected ? '#C9A84C' : 'none'}
                                                    strokeWidth={isSelected ? 2 : 0}
                                                    className="transition-all duration-300"
                                                />
                                                {/* Node label */}
                                                <text
                                                    x={pos.x}
                                                    y={pos.y + radius + 12}
                                                    textAnchor="middle"
                                                    fill="#E8E0D5"
                                                    fontSize={8}
                                                    fontFamily="monospace"
                                                    opacity={0.7}
                                                >
                                                    {node.name}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Selected node info overlay */}
                                <AnimatePresence>
                                    {selectedNode && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-3 left-3 right-3 p-3 bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-serif text-white font-semibold">
                                                        {selectedNode.id === 'self' ? t('community.you') : selectedNode.name}
                                                    </p>
                                                    <p className="text-[9px] font-mono text-[#E8E0D5]/50 mt-0.5">
                                                        {selectedNode.id === 'self'
                                                            ? t('community.currentUser')
                                                            : t('community.connection', {
                                                                type: selectedNode.group === 'family' ? t('community.family') : t('community.friend'),
                                                            })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedNode(null)}
                                                    className="p-1 rounded-md text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-[#E8E0D5]/60">
                                                <span>{t('community.purchases', { count: selectedNode.purchaseCount ?? 0 })}</span>
                                                <span>{t('community.role', { group: selectedNode.group })}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Legend */}
                                <div className="absolute top-2 right-2 flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[7px] font-mono text-[#E8E0D5]/50">{t('community.family')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-[7px] font-mono text-[#E8E0D5]/50">{t('community.friend')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral Section */}
                        <div className="p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
                            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-2 mb-4">
                                <Gift size={12} /> {t('community.myReferral')}
                            </h3>

                            <div className="space-y-3">
                                {/* Copy referral code */}
                                <div className="p-3 bg-[#0A0F2C]/60 border border-[#C9A84C]/20 rounded-xl">
                                    <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40 mb-1.5">
                                        {t('community.yourReferralCode')}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-[#C9A84C]">
                                            {referralInfo.myCode}
                                        </code>
                                        <button
                                            onClick={handleCopyCode}
                                            className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all cursor-pointer"
                                            title={t('community.copyCode')}
                                        >
                                            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Referral stats */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-xl text-center">
                                        <p className="text-lg font-serif text-white font-bold">{referralInfo.totalReferred}</p>
                                        <p className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            {t('community.peopleReferred')}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-xl text-center">
                                        <p className="text-lg font-serif text-[#C9A84C] font-bold">
                                            ${referralInfo.totalRewardsEarned}
                                        </p>
                                        <p className="text-[8px] font-mono uppercase tracking-wider text-[#E8E0D5]/40">
                                            {t('community.rewardsEarned')}
                                        </p>
                                    </div>
                                </div>

                                {/* Referred users list */}
                                {referralInfo.referredUsers.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40 mb-2">
                                            {t('community.peopleYouReferred')}
                                        </p>
                                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                                            {referralInfo.referredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0A0F2C]/30 border border-white/[0.03]"
                                                >
                                                    <div className="w-7 h-7 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#4FC3F7] to-[#C9A84C] flex items-center justify-center text-[9px] font-bold text-white">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-[#E8E0D5]/80 font-medium truncate">
                                                            {user.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <RoleBadge role={user.role} />
                                                            <span className="text-[9px] font-mono text-[#E8E0D5]/40 truncate">
                                                                {formatDate(user.joinedAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {user.hasFirstPurchase ? (
                                                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-mono">
                                                            {t('community.active')}
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] font-mono">
                                                            {t('community.new')}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column: Connections + Requests ── */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Pending Requests */}
                        {receivedRequests.length > 0 && (
                            <div className="p-5 bg-[#05081A]/90 border border-orange-500/20 rounded-2xl">
                                <h3 className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-2 mb-3">
                                    <Clock size={12} /> {t('community.pendingRequests', { count: receivedRequests.length })}
                                </h3>
                                <div className="space-y-2">
                                    {receivedRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center gap-3 p-3 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-xl transition-all hover:border-orange-500/20"
                                        >
                                            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-[10px] font-bold text-[#0A0F2C]">
                                                {req.avatarUrl ? (
                                                    <img src={req.avatarUrl} alt={req.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    req.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-white font-medium">{req.name}</p>
                                                <p className="text-[9px] font-mono text-[#E8E0D5]/50 truncate">{req.email}</p>
                                                {req.message && (
                                                    <p className="text-[10px] text-[#E8E0D5]/60 mt-0.5 italic">&ldquo;{req.message}&rdquo;</p>
                                                )}
                                                <p className="text-[8px] font-mono text-[#E8E0D5]/30 mt-0.5">
                                                    {formatDate(req.createdAt)} · {req.type === 'family' ? t('community.family') : t('community.friend')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => acceptRequest(req.id)}
                                                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono uppercase tracking-wider rounded-lg hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                                                >
                                                    <Check size={10} /> {t('community.accept')}
                                                </button>
                                                <button
                                                    onClick={() => declineRequest(req.id)}
                                                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-mono uppercase tracking-wider rounded-lg hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                                                >
                                                    <X size={10} /> {t('community.decline')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E8E0D5]/30" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('community.searchPlaceholder')}
                                    className="w-full bg-[#0A0F2C]/60 border border-white/[0.08] text-xs text-white rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#C9A84C]/50 transition placeholder:text-[#E8E0D5]/20"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Filter size={12} className="text-[#E8E0D5]/30 shrink-0" />
                                {(['all', 'family', 'friend'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                            filterType === type
                                                ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                                                : 'text-[#E8E0D5]/40 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        {type === 'all' ? t('community.filter.all') : type === 'family' ? t('community.family') : t('community.friends')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Connections List */}
                        <div className="space-y-1.5">
                            {connections.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users size={32} className="mx-auto text-[#E8E0D5]/20 mb-3" />
                                    <p className="text-sm text-[#E8E0D5]/60">{t('community.noConnections')}</p>
                                    <p className="text-[10px] text-[#E8E0D5]/40 mt-1">
                                        {searchQuery ? t('community.noConnectionsHintSearch') : t('community.noConnectionsHintInvite')}
                                    </p>
                                </div>
                            ) : (
                                connections.map((conn) => (
                                    <motion.div
                                        key={conn.userId}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-3 bg-[#0A0F2C]/40 border border-white/[0.03] hover:border-[#C9A84C]/15 rounded-xl transition-all duration-300 group"
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                                            conn.type === 'family'
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                : 'bg-gradient-to-br from-amber-500 to-orange-600'
                                        }`}>
                                            {conn.avatarUrl ? (
                                                <img src={conn.avatarUrl} alt={conn.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                conn.name.charAt(0)
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-white font-medium truncate">{conn.name}</p>
                                                <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-wider ${
                                                    conn.type === 'family'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {conn.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <RoleBadge role={conn.role} />
                                                <span className="text-[#E8E0D5]/20">·</span>
                                                <span className="text-[9px] text-[#E8E0D5]/40">
                                                    {t('community.purchaseCount', { count: conn.purchaseCount ?? 0 })}
                                                </span>
                                                {conn.totalSpent && (
                                                    <>
                                                        <span className="text-[#E8E0D5]/20">·</span>
                                                        <span className="text-[9px] text-[#C9A84C]/70">
                                                            ${conn.totalSpent.toLocaleString()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[8px] font-mono text-[#E8E0D5]/30 mt-0.5">
                                                {t('community.connected', { date: formatDate(conn.connectedSince) })}
                                                {conn.referredVia ? ` · ${t('community.via', { ref: conn.referredVia })}` : ''}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => removeConnection(conn.userId)}
                                            className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                            title={t('community.removeConnection')}
                                        >
                                            <UserMinus size={13} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Sent requests */}
                        {sentRequests.length > 0 && (
                            <div className="pt-4 border-t border-white/[0.05]">
                                <p className="text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/40 mb-2">
                                    {t('community.sentInvitations', { count: sentRequests.length })}
                                </p>
                                <div className="space-y-1.5">
                                    {sentRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center gap-3 p-2.5 bg-[#0A0F2C]/30 border border-white/[0.03] rounded-xl"
                                        >
                                            <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#4FC3F7] to-[#C9A84C]/60 flex items-center justify-center text-[9px] font-bold text-white">
                                                {req.avatarUrl ? (
                                                    <img src={req.avatarUrl} alt={req.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    req.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-[#E8E0D5]/70">{req.name}</p>
                                                <p className="text-[8px] font-mono text-[#E8E0D5]/40">
                                                    {t('community.sent', { date: formatDate(req.createdAt) })}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[8px] font-mono text-[#E8E0D5]/30 uppercase tracking-wider">
                                                {t('community.pending')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Invite Modal ── */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setIsInviteModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-2xl shadow-xl shadow-[#C9A84C]/10 backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                                        <UserPlus size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-serif text-white font-semibold">{t('community.inviteToNetwork')}</h2>
                                        <p className="text-[10px] text-[#E8E0D5]/50">{t('community.inviteSubtitle')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="p-1.5 rounded-lg text-[#E8E0D5]/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSendInvite} className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('community.fullName')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        placeholder="e.g. Sarah Ahmed"
                                        className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('community.emailAddress')}
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="sarah@example.com"
                                        className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('community.connectionType')}
                                    </label>
                                    <div className="flex gap-2">
                                        {(['family', 'friend'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setInviteType(type)}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                                    inviteType === type
                                                        ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                                                        : 'bg-black/20 text-[#E8E0D5]/40 border border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                {type === 'family' ? `👨‍👩‍👧‍👧 ${t('community.family')}` : `🤝 ${t('community.friend')}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/50 mb-1.5">
                                        {t('community.personalMessage')}
                                    </label>
                                    <textarea
                                        value={inviteMessage}
                                        onChange={(e) => setInviteMessage(e.target.value)}
                                        placeholder="Hi! I'd love for you to join my SADAF family network..."
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition resize-none placeholder:text-slate-600"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Send size={13} /> {t('community.sendInvitation')}
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Helper: node positions for the SVG graph ──────────────────────────────

/** Pre-computed positions for the network graph nodes. */
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
    self: { x: 200, y: 175 },
    'c-101': { x: 120, y: 80 },
    'c-102': { x: 280, y: 60 },
    'c-105': { x: 200, y: 280 },
    'c-103': { x: 60, y: 200 },
    'c-104': { x: 340, y: 180 },
    'c-106': { x: 280, y: 280 },
};

function getNodePositionById(id: string): { x: number; y: number } {
    return NODE_POSITIONS[id] ?? { x: 200, y: 175 };
}

function getNodePosition(
    sourceId: string,
    targetId: string,
): { x1: number; y1: number; x2: number; y2: number } {
    const src = getNodePositionById(sourceId);
    const tgt = getNodePositionById(targetId);
    return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y };
}
