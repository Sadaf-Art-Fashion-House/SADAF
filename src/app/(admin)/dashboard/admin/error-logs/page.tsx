'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
    AlertTriangle,
    CheckCheck,
    Trash2,
    RefreshCw,
    ChevronDown,
    ArrowLeft,
    Clock,
    Globe,
    FileWarning,
    Server,
    Wifi,
    WifiOff,
    Download,
    Mail,
    Settings,
    Search,
    Send,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import {
    getErrorLogs,
    markErrorAsRead,
    markAllErrorsAsRead,
    deleteErrorLog,
    clearErrorLogs,
} from '@/features/error-logging';
import { getEmailSettings, sendErrorReportByEmail } from '@/features/email-settings';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { ErrorLogEntry } from '@/features/error-logging';

/** Lightweight health-check endpoint that only the server indicator uses. */
async function checkServerHealth(): Promise<boolean> {
    try {
        const res = await fetch('/api/error-logs', {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/** Trigger a browser download of the given data as a JSON file. */
function downloadJson(data: ErrorLogEntry[], filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

export default function AdminErrorLogsPage() {
    const { t, language } = useLanguage();
    const pathname = usePathname();
    const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [serverConnected, setServerConnected] = useState(false);

    // Email sending state
    const [emailSending, setEmailSending] = useState(false);
    const [emailResult, setEmailResult] = useState<{ ok: boolean; error?: string } | null>(null);

    // JSON export state — the download itself is instant, but the button
    // shows a brief "Preparing…" spinner so the click gives visible feedback
    // (same pattern as the PNG/PDF export buttons).
    const [isExportingJson, setIsExportingJson] = useState(false);

    // Dashboard filters + search
    const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic back link: founder → founder dashboard, admin → admin dashboard
    const backHref = pathname.startsWith('/dashboard/founder')
        ? ROUTES.DASHBOARD_FOUNDER
        : ROUTES.DASHBOARD_ADMIN;

    const refreshLogs = useCallback(async (background = false) => {
        if (background) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const health = await checkServerHealth();
            setServerConnected(health);

            const fetchedLogs = await getErrorLogs();
            setLogs(fetchedLogs);
        } catch {
            setServerConnected(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        refreshLogs();
    }, [refreshLogs]);

    // Auto-refresh so newly logged errors appear without a manual reload.
    useEffect(() => {
        const interval = window.setInterval(() => refreshLogs(true), 30_000);
        return () => window.clearInterval(interval);
    }, [refreshLogs]);

    const unreadCount = logs.filter((l) => !l.read).length;

    // ── Dashboard KPIs ──
    const errorsToday = logs.filter(
        (l) => Date.now() - new Date(l.timestamp).getTime() < 24 * 3_600_000,
    ).length;

    // Source = first segment of the digest (e.g. "boundary", "export", "ws"),
    // with a safe fallback for legacy entries that predate digests.
    const sourceFor = (log: ErrorLogEntry): string => log.digest?.split(':')[0] || 'general';

    const sourceCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const log of logs) {
            const source = sourceFor(log);
            counts.set(source, (counts.get(source) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [logs]);
    const topSource = sourceCounts[0]?.[0] ?? '—';

    // ── Filtered list ──
    const filteredLogs = logs.filter((log) => {
        if (statusFilter === 'unread' && log.read) return false;
        if (statusFilter === 'read' && !log.read) return false;
        if (sourceFilter !== 'all' && sourceFor(log) !== sourceFilter) return false;
        const query = searchQuery.trim().toLowerCase();
        if (query && !log.message.toLowerCase().includes(query)) return false;
        return true;
    });

    const handleMarkRead = async (id: string) => {
        await markErrorAsRead(id);
        refreshLogs(true);
    };

    const handleMarkAllRead = async () => {
        await markAllErrorsAsRead();
        refreshLogs(true);
    };

    const handleDelete = async (id: string) => {
        await deleteErrorLog(id);
        refreshLogs(true);
    };

    const handleClearAll = async () => {
        if (logs.length === 0) return;
        await clearErrorLogs();
        refreshLogs(true);
    };

    const handleExportJson = async () => {
        if (isExportingJson || logs.length === 0) return;

        setIsExportingJson(true);
        try {
            // Yield one frame so the spinner paints before the (instant)
            // download is triggered — otherwise the state flip would be
            // invisible to the user.
            await new Promise((resolve) => setTimeout(resolve, 350));
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            downloadJson(logs, `sadaf-error-logs-${timestamp}.json`);
        } finally {
            setIsExportingJson(false);
        }
    };

    const handleSendEmail = async () => {
        setEmailSending(true);
        setEmailResult(null);

        const settings = getEmailSettings();
        if (settings.recipients.length === 0) {
            setEmailResult({ ok: false, error: t('errorLogs.noRecipients') });
            setEmailSending(false);
            return;
        }

        const result = await sendErrorReportByEmail(logs, settings);
        setEmailResult(result);
        setEmailSending(false);
    };

    // ── Small filter chip (matches LeaderboardView's FilterChip style) ──
    const FilterChip = ({
        label,
        active,
        onClick,
    }: {
        label: string;
        active: boolean;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                active
                    ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                    : 'text-[#E8E0D5]/40 hover:text-white border border-transparent hover:border-white/10'
            }`}
        >
            {label}
        </button>
    );

    const formatTimestamp = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return t('errorLogs.justNow');
        if (minutes < 60) return t('errorLogs.minutesAgo', { count: minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('errorLogs.hoursAgo', { count: hours });
        const days = Math.floor(hours / 24);
        return t('errorLogs.daysAgo', { count: days });
    };

    return (
        <div className="min-h-screen bg-[#0A0F2C] p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Link
                                href={backHref}
                                className="text-[10px] text-[#4FC3F7]/50 hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                                <ArrowLeft size={11} />
                                {t('errorLogs.backToDashboard')}
                            </Link>

                            {!isLoading && (
                                <span
                                    className={`flex items-center gap-1 text-[8px] font-mono tracking-wider uppercase ${
                                        serverConnected
                                            ? 'text-[#4FC3F7]/40'
                                            : 'text-amber-500/40'
                                    }`}
                                    title={
                                        serverConnected
                                            ? t('errorLogs.serverActive')
                                            : t('errorLogs.serverUnreachable')
                                    }
                                >
                                    {serverConnected ? (
                                        <>
                                            <Server size={9} />
                                            <Wifi size={9} />
                                        </>
                                    ) : (
                                        <>
                                            <Server size={9} />
                                            <WifiOff size={9} />
                                        </>
                                    )}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide flex items-center gap-3">
                            <FileWarning size={22} className="text-red-400" />
                            {t('errorLogs.title')}
                        </h1>
                        <p className="text-xs text-[#E8E0D5]/40 font-mono mt-1">
                            {t('errorLogs.recorded', { count: logs.length })}
                            {unreadCount > 0 && (
                                <span className="text-red-400 ml-2">
                                    &middot; {t('errorLogs.unreadCount', { count: unreadCount })}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Send via Email */}
                        {logs.length > 0 && (
                            <button
                                onClick={handleSendEmail}
                                disabled={emailSending}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200 text-[10px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-30 ${
                                    emailResult?.ok
                                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                        : 'border-[#4FC3F7]/15 hover:bg-[#4FC3F7]/10 text-[#4FC3F7]/60 hover:text-[#4FC3F7]'
                                }`}
                                title={t('errorLogs.sendReportTitle')}
                            >
                                {emailSending ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-[#4FC3F7]/30 border-t-[#4FC3F7] rounded-full animate-spin" />
                                        {t('errorLogs.sending')}
                                    </>
                                ) : emailResult?.ok ? (
                                    <>
                                        <Send size={12} className="text-green-400" />
                                        {t('errorLogs.sent')}
                                    </>
                                ) : (
                                    <>
                                        <Mail size={12} />
                                        {t('errorLogs.emailReport')}
                                    </>
                                )}
                            </button>
                        )}

                        {/* Email Settings link */}
                        <Link
                            href={ROUTES.DASHBOARD_EMAIL_SETTINGS}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-[#E8E0D5]/30 hover:text-[#4FC3F7] transition-all duration-200"
                            title={t('errorLogs.emailSettingsTitle')}
                        >
                            <Settings size={14} />
                        </Link>

                        {/* Export JSON */}
                        {logs.length > 0 && (
                            <button
                                onClick={handleExportJson}
                                disabled={isExportingJson}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4FC3F7]/15 hover:bg-[#4FC3F7]/10 text-[#4FC3F7]/60 hover:text-[#4FC3F7] transition-all duration-200 text-[10px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-wait"
                                title={isExportingJson ? t('errorLogs.preparingExport') : t('errorLogs.exportJsonTitle')}
                            >
                                {isExportingJson ? (
                                    <span className="block w-3 h-3 rounded-full border-2 border-[#4FC3F7]/40 border-t-[#4FC3F7] animate-spin" />
                                ) : (
                                    <Download size={12} />
                                )}
                                {isExportingJson ? t('errorLogs.preparing') : t('errorLogs.exportJson')}
                            </button>
                        )}

                        <button
                            onClick={() => refreshLogs(true)}
                            disabled={isRefreshing || isLoading}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-[#E8E0D5]/40 hover:text-[#4FC3F7] transition-all duration-200 cursor-pointer disabled:opacity-30"
                            title={t('errorLogs.refresh')}
                        >
                            <RefreshCw
                                size={14}
                                className={isRefreshing ? 'animate-spin' : ''}
                            />
                        </button>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={isRefreshing}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4FC3F7]/20 hover:bg-[#4FC3F7]/10 text-[#4FC3F7]/70 hover:text-[#4FC3F7] transition-all duration-200 text-[10px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-30"
                            >
                                <CheckCheck size={12} />
                                {t('errorLogs.markAllRead')}
                            </button>
                        )}

                        {logs.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                disabled={isRefreshing}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/10 hover:bg-red-950/20 text-red-400/50 hover:text-red-400 transition-all duration-200 text-[10px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-30"
                            >
                                <Trash2 size={12} />
                                {t('errorLogs.clearAll')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Email result feedback */}
                <AnimatePresence>
                    {emailResult && !emailResult.ok && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2"
                        >
                            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Mail size={12} className="text-amber-400" />
                            </div>
                            <p className="text-[10px] text-amber-400/70 font-mono">
                                {emailResult.error || t('errorLogs.failedToSend')}
                                {' '}
                                <Link
                                    href={ROUTES.DASHBOARD_EMAIL_SETTINGS}
                                    className="text-[#4FC3F7]/70 hover:text-[#4FC3F7] underline underline-offset-2"
                                >
                                    {t('errorLogs.configureEmail')} →
                                </Link>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── KPI summary cards ── */}
                {!isLoading && logs.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="p-4 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 transition-colors">
                            <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">{t('errorLogs.kpi.total')}</span>
                            <p className="text-lg font-serif text-white font-bold tracking-tight mt-1">{logs.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-red-500/20 transition-colors">
                            <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">{t('errorLogs.kpi.unread')}</span>
                            <p className={`text-lg font-serif font-bold tracking-tight mt-1 ${unreadCount > 0 ? 'text-red-400' : 'text-white'}`}>{unreadCount}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#4FC3F7]/20 transition-colors">
                            <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">{t('errorLogs.kpi.last24h')}</span>
                            <p className="text-lg font-serif text-white font-bold tracking-tight mt-1">{errorsToday}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 transition-colors">
                            <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">{t('errorLogs.kpi.topSource')}</span>
                            <p className="text-lg font-mono text-[#C9A84C] font-bold tracking-tight mt-1 truncate">{topSource}</p>
                        </div>
                    </div>
                )}

                {/* ── Filters + search ── */}
                {!isLoading && logs.length > 0 && (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E8E0D5]/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('errorLogs.searchPlaceholder')}
                                className="w-full bg-[#0A0F2C]/60 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white placeholder-slate-600 outline-none focus:border-[#4FC3F7]/40 transition"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {(['all', 'unread', 'read'] as const).map((status) => (
                                <FilterChip
                                    key={status}
                                    label={
                                        status === 'all'
                                            ? `${t('errorLogs.filter.all')} · ${logs.length}`
                                            : status === 'unread'
                                                ? `${t('errorLogs.filter.unread')} · ${unreadCount}`
                                                : `${t('errorLogs.filter.read')} · ${logs.length - unreadCount}`
                                    }
                                    active={statusFilter === status}
                                    onClick={() => setStatusFilter(status)}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            <FilterChip
                                label={t('errorLogs.filter.general')}
                                active={sourceFilter === 'general'}
                                onClick={() => setSourceFilter(sourceFilter === 'general' ? 'all' : 'general')}
                            />
                            {sourceCounts
                                .filter(([source]) => source !== 'general')
                                .map(([source, count]) => (
                                    <FilterChip
                                        key={source}
                                        label={`${source} · ${count}`}
                                        active={sourceFilter === source}
                                        onClick={() => setSourceFilter(sourceFilter === source ? 'all' : source)}
                                    />
                                ))}
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[#4FC3F7]/30 border-t-[#4FC3F7] rounded-full animate-spin" />
                            <span className="text-[10px] text-[#E8E0D5]/30 font-mono tracking-wider uppercase">
                                {t('errorLogs.loading')}
                            </span>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#4FC3F7]/5 border border-[#4FC3F7]/10 flex items-center justify-center mb-4">
                            <CheckCheck size={28} className="text-[#4FC3F7]/40" />
                        </div>
                        <h2 className="text-lg font-serif text-white mb-2">{t('errorLogs.emptyTitle')}</h2>
                        <p className="text-xs text-[#E8E0D5]/40 font-mono max-w-md">
                            {t('errorLogs.emptyHint')}
                        </p>
                    </div>
                )}

                {/* Logs list */}
                {!isLoading && logs.length > 0 && (
                    <div className="space-y-3">
                        {/* No logs match the current filters */}
                        {filteredLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-12 h-12 rounded-full bg-[#4FC3F7]/5 border border-[#4FC3F7]/10 flex items-center justify-center mb-3">
                                    <Search size={20} className="text-[#4FC3F7]/40" />
                                </div>
                                <h3 className="text-sm font-serif text-white mb-1">{t('errorLogs.noMatchTitle')}</h3>
                                <p className="text-[10px] text-[#E8E0D5]/40 font-mono max-w-sm">
                                    {t('errorLogs.noMatchHint')}
                                </p>
                                <button
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setSourceFilter('all');
                                        setSearchQuery('');
                                    }}
                                    className="mt-4 px-3 py-1.5 rounded-lg border border-[#4FC3F7]/20 hover:bg-[#4FC3F7]/10 text-[#4FC3F7]/70 hover:text-[#4FC3F7] transition-all duration-200 text-[9px] font-mono uppercase tracking-wider cursor-pointer"
                                >
                                    {t('errorLogs.clearFilters')}
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {filteredLogs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                                        !log.read
                                            ? 'bg-red-950/10 border-red-500/20'
                                            : 'bg-[#05081A]/60 border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    {/* Log entry header */}
                                    <div className="flex items-start gap-3 p-4">
                                        <div className="pt-0.5">
                                            {!log.read ? (
                                                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse mt-1" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-transparent mt-1" />
                                            )}
                                        </div>

                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                !log.read
                                                    ? 'bg-red-500/15 border border-red-500/20'
                                                    : 'bg-white/5 border border-white/5'
                                            }`}
                                        >
                                            <AlertTriangle
                                                size={14}
                                                className={!log.read ? 'text-red-400' : 'text-[#E8E0D5]/30'}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p
                                                        className={`text-xs font-mono truncate max-w-xl ${
                                                            !log.read
                                                                ? 'text-red-300 font-semibold'
                                                                : 'text-[#E8E0D5]/60'
                                                        }`}
                                                    >
                                                        {log.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="flex items-center gap-1 text-[9px] text-[#E8E0D5]/25 font-mono">
                                                            <Clock size={9} />
                                                            {timeAgo(log.timestamp)}
                                                        </span>
                                                        <span className="text-[9px] text-[#E8E0D5]/20 font-mono">
                                                            {formatTimestamp(log.timestamp)}
                                                        </span>
                                                        {log.url && (
                                                            <span className="flex items-center gap-1 text-[9px] text-[#E8E0D5]/20 font-mono truncate max-w-[200px]">
                                                                <Globe size={9} />
                                                                {log.url}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!log.read && (
                                                        <button
                                                            onClick={() => handleMarkRead(log.id)}
                                                            disabled={isRefreshing}
                                                            className="p-1.5 rounded-md hover:bg-[#4FC3F7]/10 text-[#E8E0D5]/20 hover:text-[#4FC3F7] transition-all duration-200 cursor-pointer disabled:opacity-30"
                                                            title={t('errorLogs.markAsRead')}
                                                        >
                                                            <CheckCheck size={12} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            setExpandedId(expandedId === log.id ? null : log.id)
                                                        }
                                                        className={`p-1.5 rounded-md hover:bg-white/5 text-[#E8E0D5]/20 hover:text-[#E8E0D5]/60 transition-all duration-200 cursor-pointer ${
                                                            expandedId === log.id ? 'rotate-180' : ''
                                                        }`}
                                                        title={t('errorLogs.toggleDetails')}
                                                    >
                                                        <ChevronDown size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(log.id)}
                                                        disabled={isRefreshing}
                                                        className="p-1.5 rounded-md hover:bg-red-950/20 text-[#E8E0D5]/20 hover:text-red-400 transition-all duration-200 cursor-pointer disabled:opacity-30"
                                                        title={t('errorLogs.deleteEntry')}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded details */}
                                    <AnimatePresence>
                                        {expandedId === log.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-0 border-t border-white/5 mx-4">
                                                    <div className="mt-3 space-y-3">
                                                        <div>
                                                            <span className="text-[9px] text-[#E8E0D5]/30 font-mono uppercase tracking-wider block mb-1">
                                                                {t('errorLogs.fullMessage')}
                                                            </span>
                                                            <div className="bg-black/50 border border-white/5 rounded-lg p-3">
                                                                <code className="text-[11px] text-red-300/80 font-mono break-all leading-relaxed">
                                                                    {log.message}
                                                                </code>
                                                            </div>
                                                        </div>

                                                        {log.digest && (
                                                            <div>
                                                                <span className="text-[9px] text-[#E8E0D5]/30 font-mono uppercase tracking-wider block mb-1">
                                                                    {t('errorLogs.digestId')}
                                                                </span>
                                                                <code className="text-[10px] text-[#4FC3F7]/50 font-mono">
                                                                    {log.digest}
                                                                </code>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <span className="text-[9px] text-[#E8E0D5]/30 font-mono uppercase tracking-wider block mb-1">
                                                                {t('errorLogs.urlAtError')}
                                                            </span>
                                                            <code className="text-[10px] text-[#E8E0D5]/40 font-mono break-all">
                                                                {log.url}
                                                            </code>
                                                        </div>

                                                        {log.stack && (
                                                            <div>
                                                                <span className="text-[9px] text-[#E8E0D5]/30 font-mono uppercase tracking-wider block mb-1">
                                                                    {t('errorLogs.stackTrace')}
                                                                </span>
                                                                <div className="bg-black/50 border border-white/5 rounded-lg p-3 max-h-64 overflow-y-auto">
                                                                    <pre className="text-[9px] text-[#E8E0D5]/30 font-mono leading-relaxed whitespace-pre-wrap">
                                                                        {log.stack}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Footer info */}
                {logs.length > 0 && (
                    <div className="mt-6 text-center">
                        <p className="text-[8px] text-[#E8E0D5]/15 font-mono tracking-wider">
                            {t('errorLogs.serverHint')}
                            {!serverConnected && t('errorLogs.localFallback')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
