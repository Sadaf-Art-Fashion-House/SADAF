'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    DollarSign,
    Cpu,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    FileImage,
    FileText,
    FileSpreadsheet,
    FileBarChart,
    LayoutDashboard,
    AlertTriangle,
    RotateCcw,
    History,
    Trash2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
} from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';
import { useWSAnalyticsData } from '../hooks/useWSAnalyticsData';
import { useExportChart, exportElementsAsPDF } from '../hooks/useExportChart';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { useWatermarkStore, getWatermarkExportPrefix } from '@/features/watermark/store/useWatermarkStore';
import {
    getExportHistory,
    clearExportHistory,
    subscribeExportHistory,
} from '@/shared/utils/exportHistory';
import type { ExportHistoryEntry } from '@/shared/utils/exportHistory';
import { ErrorBanner, ErrorGuidance } from '@/shared/ui/ErrorGuidance';
import { buildToolbarExportUserMessage } from '@/shared/utils/exportErrors';
import type { ToolbarExportKind } from '@/shared/utils/exportErrors';
import LiveEventsFeed from './LiveEventsFeed';
import type { TimeRange, AnalyticsData } from '../types';

interface AnalyticsDashboardProps {
    initialData?: AnalyticsData;
    role?: 'admin' | 'founder';
}

// ─── Chart ID maps per tab ────────────────────────────────────────────────

const TAB_CHART_IDS: Record<string, string[]> = {
    overview: ['chart-revenue-overview', 'chart-revenue-channel', 'chart-acquisition'],
    products: ['chart-category-sales', 'chart-category-breakdown', 'chart-top-products'],
    growth: ['chart-user-growth'],
};

const TAB_LABELS: Record<string, TranslationKey> = {
    overview: 'analytics.tab.overview',
    products: 'analytics.tab.products',
    growth: 'analytics.tab.growth',
};

/**
 * The API/WS payload ships English-only KPI labels as data. Map the known
 * templates to translation keys so the KPI cards render in the active
 * language; unknown labels fall back to their raw text.
 */
const KPI_LABEL_KEYS: Record<string, TranslationKey> = {
    'Total Revenue': 'analytics.kpi.totalRevenue',
    'Orders': 'analytics.kpi.orders',
    'Active Customers': 'analytics.kpi.activeCustomers',
    'Avg Order Value': 'analytics.kpi.avgOrderValue',
    'Conversion Rate': 'analytics.kpi.conversionRate',
    'AI Designs Created': 'analytics.kpi.aiDesigns',
};

const DAY_LABEL_KEYS: Record<string, TranslationKey> = {
    Mon: 'admin.day.mon',
    Tue: 'admin.day.tue',
    Wed: 'admin.day.wed',
    Thu: 'admin.day.thu',
    Fri: 'admin.day.fri',
    Sat: 'admin.day.sat',
    Sun: 'admin.day.sun',
};

/** Accessible labels for the toolbar banner's Retry button, per failed kind. */
const TOOLBAR_RETRY_LABELS: Record<ToolbarExportKind, TranslationKey> = {
    charts: 'analytics.retryCharts',
    report: 'analytics.retryReport',
    all: 'analytics.retryAll',
};

/** Every chart across all tabs (for full-dashboard export) */
const ALL_CHART_IDS = [
    ...TAB_CHART_IDS.overview,
    ...TAB_CHART_IDS.products,
    ...TAB_CHART_IDS.growth,
];

// ─── Tooltip components ───────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
    const { t } = useLanguage();
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-mono text-[#E8E0D5]/60 mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-xs font-mono font-semibold" style={{ color: entry.color }}>
                    {entry.name}: ${entry.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
}

function PieTooltip({ active, payload }: any) {
    const { t } = useLanguage();
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload ?? {};
    const hasRevenue = 'revenue' in d;
    return (
        <div className="bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-mono font-semibold text-white">{d.category || d.label || d.name}</p>
            {hasRevenue ? (
                <><p className="text-[10px] font-mono text-[#E8E0D5]/60">${d.revenue.toLocaleString()} ({d.share.toFixed(1)}%)</p><p className="text-[10px] text-[#E8E0D5]/40">{t('analytics.unitsSold', { count: d.unitsSold })}</p></>
            ) : (
                <p className="text-[10px] font-mono text-[#E8E0D5]/60">{t('analytics.visitors', { count: d.value })}</p>
            )}
        </div>
    );
}

// ─── Export history helpers ───────────────────────────────────────────────

const SOURCE_LABELS: Record<string, TranslationKey> = {
    chart: 'analytics.source.chart',
    kpi: 'analytics.source.kpi',
    report: 'analytics.source.report',
    watermark: 'analytics.source.watermark',
};

function formatRelativeTime(iso: string, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t('analytics.justNow');
    if (minutes < 60) return t('analytics.minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('analytics.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('analytics.daysAgo', { count: days });
}

/**
 * Small local panel showing the last 10 export operations (file, format,
 * success/failure) from localStorage. Updates immediately via a custom
 * window event fired by the shared exportHistory utility, and re-renders
 * every minute so relative timestamps stay honest. Shows a muted empty
 * state before the first export so the panel is discoverable.
 */
function ExportHistoryPanel() {
    const { t } = useLanguage();
    const [history, setHistory] = useState<ExportHistoryEntry[]>(() => getExportHistory());
    // Tick every 60s to refresh the relative-time labels.
    const [, setClock] = useState(0);

    useEffect(() => {
        const unsubscribe = subscribeExportHistory(() => setHistory(getExportHistory()));
        const interval = window.setInterval(() => setClock((c) => c + 1), 60000);
        return () => {
            unsubscribe();
            window.clearInterval(interval);
        };
    }, []);

    const handleClear = useCallback(() => {
        clearExportHistory();
        setHistory([]);
    }, []);

    return (
        <div className="mb-6 p-4 bg-[#05081A]/70 border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]"><History size={12} /></div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">{t('analytics.exportHistory')}</h3>
                    {history.length > 0 && (
                        <span className="text-[9px] font-mono text-[#E8E0D5]/40">{t('analytics.lastHistory', { count: history.length })}</span>
                    )}
                </div>
                {history.length > 0 && (
                    <button onClick={handleClear}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono text-[#E8E0D5]/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                        title={t('analytics.clearHistory')}>
                        <Trash2 size={9} /> {t('analytics.clear')}
                    </button>
                )}
            </div>
            {history.length === 0 ? (
                <p className="text-[9px] font-mono text-[#E8E0D5]/30 italic px-2 py-1.5">
                    {t('analytics.noExports')}
                </p>
            ) : (
                <ul className="space-y-1 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                    {history.map((entry) => (
                        <li key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#0A0F2C]/40 hover:bg-[#0A0F2C]/70 transition-colors">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} title={entry.status} />
                            <span className={`text-[8px] font-mono font-bold w-7 shrink-0 ${entry.format === 'png' ? 'text-[#4FC3F7]' : 'text-[#C9A84C]'}`}>
                                {entry.format === 'png' ? <FileImage size={10} className="inline -mt-0.5 mr-0.5" /> : <FileText size={10} className="inline -mt-0.5 mr-0.5" />}
                                {entry.format.toUpperCase()}
                            </span>
                            <span className="text-[9px] font-mono text-[#E8E0D5]/80 truncate flex-1" title={entry.filename}>{entry.filename}</span>
                            <span className="text-[7px] font-mono uppercase tracking-wider text-[#E8E0D5]/30 shrink-0">{SOURCE_LABELS[entry.source] ? t(SOURCE_LABELS[entry.source]) : entry.source}</span>
                            <span className="text-[7px] font-mono text-[#E8E0D5]/30 shrink-0">{formatRelativeTime(entry.timestamp, t)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Export dropdown (per-chart / per-KPI) ────────────────────────────────

type ExportFn = () => boolean | void | Promise<boolean | void>;

function ExportDropdown({
    onExportPNG,
    onExportPDF,
    isExportingPNG,
    isExportingPDF,
    exportError,
    onErrorDismiss,
    size = 13,
}: {
    onExportPNG: ExportFn;
    onExportPDF: ExportFn;
    isExportingPNG: boolean;
    isExportingPDF: boolean;
    exportError?: string | null;
    onErrorDismiss?: () => void;
    size?: number;
}) {
    const [open, setOpen] = useState(false);
    const isExporting = isExportingPNG || isExportingPDF;

    /**
     * Remembers which export (PNG or PDF) failed last so the inline error's
     * "Try Again" button can transparently re-run exactly that operation
     * instead of asking the user to click the menu item again. Stored as a
     * plain format kind (not a function) so everything is reactive state.
     */
    const { t } = useLanguage();
    const [lastFailedExportFormat, setLastFailedExportFormat] = useState<'png' | 'pdf' | null>(null);

    const retryButtonRef = useRef<HTMLButtonElement>(null);

    // When a failure banner appears (or the menu reopens with one showing),
    // move focus to the Retry button so keyboard/screen-reader users can act
    // immediately without tabbing through the whole menu.
    useEffect(() => {
        if (lastFailedExportFormat && open) {
            retryButtonRef.current?.focus();
        }
    }, [lastFailedExportFormat, open]);

    /**
     * Run an export while keeping the menu open so the per-item spinner and
     * "Exporting…" label stay visible. The menu closes only when the export
     * SUCCEEDS; on failure it stays open so the inline error below is
     * immediately visible to the user (with a smart Try Again button).
     */
    const runExport = useCallback(async (format: 'png' | 'pdf') => {
        const exportFn = format === 'png' ? onExportPNG : onExportPDF;
        const succeeded = await exportFn();
        if (succeeded !== false) {
            setLastFailedExportFormat(null);
            setOpen(false);
        } else {
            setLastFailedExportFormat(format);
        }
    }, [onExportPNG, onExportPDF]);

    /** Re-run the last failed export directly from the error banner. */
    const handleRetry = useCallback(() => {
        if (lastFailedExportFormat) runExport(lastFailedExportFormat);
    }, [lastFailedExportFormat, runExport]);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={isExporting}
                className="p-1.5 rounded-lg text-[#E8E0D5]/30 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
                title={isExporting ? t('analytics.exportInProgress') : t('analytics.export')}
                aria-label={t('analytics.exportAria')}
            >
                {isExporting ? (
                    <span className="block w-3.5 h-3.5 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                ) : (
                    <Download size={size} />
                )}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute end-0 top-full mt-1 z-20 w-56 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-xl shadow-xl shadow-[#C9A84C]/10 backdrop-blur-xl overflow-hidden">
                        <button onClick={() => runExport('png')}
                            disabled={isExporting}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                            {isExportingPNG ? (
                                <span className="block w-3 h-3 rounded-full border-2 border-[#4FC3F7] border-t-transparent animate-spin" />
                            ) : (
                                <FileImage size={12} className="text-[#4FC3F7]" />
                            )}
                            {isExportingPNG ? t('analytics.exporting') : t('analytics.exportPng')}
                        </button>
                        <button onClick={() => runExport('pdf')}
                            disabled={isExporting}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                            {isExportingPDF ? (
                                <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                            ) : (
                                <FileText size={12} className="text-[#C9A84C]" />
                            )}
                            {isExportingPDF ? t('analytics.exporting') : t('analytics.exportPdf')}
                        </button>

                        {/* Inline export error — the menu stays open on failure so this is visible */}
                        {exportError && (
                            <div role="alert" className="flex items-start gap-1.5 px-3 py-2 border-t border-red-500/15 bg-red-950/20">
                                <AlertTriangle size={10} className="text-red-400 shrink-0 mt-0.5" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[9px] font-mono text-red-300/90 leading-tight">{exportError}</span>
                                    <ErrorGuidance className="text-[8px]" />
                                </span>
                                {lastFailedExportFormat && (
                                    <button ref={retryButtonRef} onClick={handleRetry} disabled={isExporting}
                                        aria-label={t('analytics.retryFailed', { format: lastFailedExportFormat.toUpperCase() })}
                                        className="text-[8px] font-mono uppercase tracking-wider text-[#C9A84C] border border-[#C9A84C]/30 rounded px-1.5 py-0.5 hover:bg-[#C9A84C]/10 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait shrink-0 flex items-center gap-1"
                                        title={t('analytics.rerunFailed')}>
                                        <RotateCcw size={8} /> {t('analytics.retry')}
                                    </button>
                                )}
                                <button onClick={() => { setLastFailedExportFormat(null); onErrorDismiss?.(); }}
                                    aria-label={t('analytics.dismiss')}
                                    className="text-[9px] font-mono text-[#E8E0D5]/30 hover:text-white transition-colors cursor-pointer shrink-0"
                                    title={t('analytics.dismiss')}>✕</button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── ChartCard with individual export ──────────────────────────────────────

function ChartCard({
    title,
    icon: Icon,
    chartId,
    filename,
    children,
    className = '',
}: {
    title: string;
    icon: any;
    chartId: string;
    filename: string;
    children: React.ReactNode;
    className?: string;
}) {
    const chartRef = useRef<HTMLDivElement>(null);
    const { exportAsPNG, exportAsPDF, isExportingPNG, isExportingPDF, exportError, clearError } = useExportChart(chartRef, filename, 'chart');

    return (
        <div className={`p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon size={14} className="text-[#C9A84C]" />
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">{title}</h3>
                </div>
                <ExportDropdown onExportPNG={exportAsPNG} onExportPDF={exportAsPDF} isExportingPNG={isExportingPNG} isExportingPDF={isExportingPDF} exportError={exportError} onErrorDismiss={clearError} />
            </div>
            <div ref={chartRef} id={chartId}>
                {children}
            </div>
        </div>
    );
}

// ─── KpiCard with individual export ───────────────────────────────────────

function KpiCard({
    label,
    value,
    change,
    isPositive,
    icon: Icon,
    cardId,
    filename,
}: {
    label: TranslationKey;
    value: string;
    change: string;
    isPositive: boolean;
    icon: any;
    cardId: string;
    filename: string;
}) {
    const { t } = useLanguage();
    const cardRef = useRef<HTMLDivElement>(null);
    const { exportAsPNG, exportAsPDF, isExportingPNG, isExportingPDF, exportError, clearError } = useExportChart(cardRef, filename, 'kpi');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-4 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 rounded-2xl transition-all duration-300"
        >
            {/* Export button — visible on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <ExportDropdown onExportPNG={exportAsPNG} onExportPDF={exportAsPDF} isExportingPNG={isExportingPNG} isExportingPDF={isExportingPDF} exportError={exportError} onErrorDismiss={clearError} size={11} />
            </div>

            <div ref={cardRef} id={cardId}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">{t(label)}</span>
                    <Icon size={13} className="text-[#C9A84C]/50 group-hover:text-[#C9A84C] transition-colors" />
                </div>
                <p className="text-lg font-serif text-white font-bold tracking-tight">{value}</p>
                <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    <span>{change}</span>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Prepend the user's watermark label slug to a base filename.
 * Returns something like "sadaf_brand_revenue_overview" or, when no
 * watermark label is configured, just the base filename.
 */
function labelFilename(base: string): string {
    const prefix = getWatermarkExportPrefix();
    return prefix ? `${prefix}${base}` : base;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function AnalyticsDashboard({ initialData }: AnalyticsDashboardProps) {
    const { t, language } = useLanguage();
    // ── Real-time data — WS → SSE → polling (same transport ladder as dashboards) ──
    const { data: liveData, wsState, error: dataError } = useWSAnalyticsData(true);
    const isLive = wsState.status === 'connected';

    const {
        data,
        timeRange,
        setTimeRange,
        filteredRevenue,
        formatCurrency,
        formatPercent,
        totalRevenue,
        averageOrderValue,
        growthRate,
    } = useAnalytics(initialData, liveData);

    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'growth'>('overview');
    const [isExportingCharts, setIsExportingCharts] = useState(false);
    const [isExportingFull, setIsExportingFull] = useState(false);
    const [isExportingAll, setIsExportingAll] = useState(false);
    const [toolbarExportError, setToolbarExportError] = useState<string | null>(null);

    /**
     * Remembers which toolbar export (Charts / Report / All Dashboard) failed
     * last so the banner's "Try Again" button can re-run exactly that
     * operation. Stored as a plain serializable kind (not a function or ref)
     * so the banner renders purely from reactive state — safe against future
     * code that might mutate a ref without triggering a re-render.
     */
    const [lastFailedToolbarExport, setLastFailedToolbarExport] = useState<ToolbarExportKind | null>(null);

    const toolbarRetryButtonRef = useRef<HTMLButtonElement>(null);

    // Move focus to the banner's Retry button the moment a toolbar export
    // failure appears, so keyboard/screen-reader users can act immediately.
    useEffect(() => {
        if (lastFailedToolbarExport) {
            toolbarRetryButtonRef.current?.focus();
        }
    }, [lastFailedToolbarExport]);

    // Subscribe to watermark settings so filenames reactively include the label
    useWatermarkStore((s) => s.settings);

    const timeRanges: { value: TimeRange; label: string }[] = [
        { value: '7d', label: t('analytics.range.7d') }, { value: '30d', label: t('analytics.range.30d') },
        { value: '90d', label: t('analytics.range.90d') }, { value: '12m', label: t('analytics.range.12m') },
    ];

    const kpiIcons: Record<string, any> = {
        TrendingUp, ShoppingBag, Users, DollarSign, Cpu,
        TrendingDown: ArrowDownRight,
    };

    /**
     * Run one of the three toolbar exports. On failure the failed kind is
     * stored in state so the error banner can offer a smart Try Again that
     * transparently re-runs the same operation.
     */
    const runToolbarExport = useCallback(async (kind: ToolbarExportKind) => {
        setToolbarExportError(null);
        setLastFailedToolbarExport(null);

        const chartIds = TAB_CHART_IDS[activeTab];
        const tabLabel = TAB_LABELS[activeTab];

        if (kind === 'charts') {
            if (!chartIds?.length) return;
            const succeeded = await exportElementsAsPDF(chartIds, labelFilename(`analytics_${tabLabel.toLowerCase()}`), setIsExportingCharts, 'report');
            if (!succeeded) {
                setLastFailedToolbarExport('charts');
                setToolbarExportError(buildToolbarExportUserMessage('charts', tabLabel));
            }
            return;
        }

        if (kind === 'report') {
            const allIds = ['kpi-section', ...(chartIds ?? [])];
            const succeeded = await exportElementsAsPDF(allIds, labelFilename(`full_report_${tabLabel.toLowerCase()}`), setIsExportingFull, 'report');
            if (!succeeded) {
                setLastFailedToolbarExport('report');
                setToolbarExportError(buildToolbarExportUserMessage('report'));
            }
            return;
        }

        const allIds = ['kpi-section', ...ALL_CHART_IDS];
        const succeeded = await exportElementsAsPDF(allIds, labelFilename('complete_dashboard_report'), setIsExportingAll, 'report');
        if (!succeeded) {
            setLastFailedToolbarExport('all');
            setToolbarExportError(buildToolbarExportUserMessage('all'));
        }
    }, [activeTab]);

    const handleExportCharts = useCallback(() => runToolbarExport('charts'), [runToolbarExport]);
    const handleExportFullReport = useCallback(() => runToolbarExport('report'), [runToolbarExport]);
    const handleExportAllDashboard = useCallback(() => runToolbarExport('all'), [runToolbarExport]);

    const handleTabChange = useCallback((tab: typeof activeTab) => {
        setToolbarExportError(null);
        setLastFailedToolbarExport(null);
        setActiveTab(tab);
    }, []);

    if (!data?.kpis?.length) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center">
                    <TrendingUp size={32} className="mx-auto text-[#E8E0D5]/20 mb-3" />
                    <p className="text-sm text-[#E8E0D5]/60">{t('analytics.noData')}</p>
                    <p className="text-[10px] text-[#E8E0D5]/40 mt-1">{t('analytics.noDataHint')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen pb-20">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Real-time data degradation banner — same pattern as Admin/Founder dashboards */}
            {dataError && (
                <ErrorBanner tone="yellow" icon={AlertTriangle} message={t('admin.liveDegraded', { error: dataError })} />
            )}

            {/* KPI Cards — wrapped for full-report capture */}
            <section id="kpi-section" className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {data.kpis.map((kpi) => {
                        const Icon = kpiIcons[kpi.icon] || TrendingUp;
                        return (
                            <KpiCard
                                key={kpi.label}
                                label={(KPI_LABEL_KEYS[kpi.label] ?? kpi.label) as TranslationKey}
                                value={kpi.value}
                                change={kpi.change}
                                isPositive={kpi.isPositive}
                                icon={Icon}
                                cardId={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}
                                filename={labelFilename(`kpi_${kpi.label.toLowerCase().replace(/\s+/g, '_')}`)}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Controls Row: Tabs + Time Range + Export buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-2 bg-[#090D2A]/80 p-1.5 border border-white/5 rounded-xl w-fit">
                    {[
                        { id: 'overview', label: t('analytics.tab.overview'), icon: BarChart3 },
                        { id: 'products', label: t('analytics.tab.products'), icon: PieChart },
                        { id: 'growth', label: t('analytics.tab.growth'), icon: Activity },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id as typeof activeTab)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                                activeTab === tab.id ? 'bg-[#C9A84C] text-[#0A0F2C]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}>
                            <tab.icon size={12} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-[#E8E0D5]/30" />
                    {timeRanges.map((range) => (
                        <button key={range.value} onClick={() => setTimeRange(range.value)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                timeRange === range.value ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30' : 'text-[#E8E0D5]/40 hover:text-white border border-transparent'
                            }`}>
                            {range.label}
                        </button>
                    ))}
                </div>

                {/* Live connection indicator */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                        isLive ? 'text-green-400' : 'text-yellow-500'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            isLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'
                        }`} />
                        {isLive ? t('admin.live') : t('admin.polling15')}
                    </span>
                    <button onClick={handleExportCharts} disabled={isExportingCharts}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait flex items-center gap-1.5"
                        title={t('analytics.exportChartsTitle', { tab: t(TAB_LABELS[activeTab]) })}>
                        {isExportingCharts ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <FileSpreadsheet size={12} />}
                        {isExportingCharts ? t('analytics.exporting') : `${t('analytics.charts')} (${TAB_CHART_IDS[activeTab]?.length ?? 0})`}
                    </button>

                    <button onClick={handleExportFullReport} disabled={isExportingFull}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-gradient-to-r from-[#C9A84C]/20 to-[#4FC3F7]/10 text-white border border-[#C9A84C]/40 hover:border-[#C9A84C]/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait flex items-center gap-1.5"
                        title={t('analytics.exportReportTitle')}>
                        {isExportingFull ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <FileBarChart size={12} />}
                        {isExportingFull ? t('analytics.exporting') : t('analytics.report')}
                    </button>

                    <button onClick={handleExportAllDashboard} disabled={isExportingAll}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-gradient-to-r from-[#C9A84C]/30 to-[#EC4899]/10 text-white border border-[#C9A84C]/50 hover:border-[#EC4899]/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait flex items-center gap-1.5"
                        title={t('analytics.exportAllTitle')}>
                        {isExportingAll ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <LayoutDashboard size={12} />}
                        {isExportingAll ? t('analytics.exporting') : t('analytics.allDashboard')}
                    </button>
                </div>
            </div>

            {/* Inline export error banner — with smart Try Again that re-runs the last failed export */}
            {toolbarExportError && (
                <div role="alert" className="flex items-start gap-2 px-4 py-2.5 mb-4 rounded-xl border border-red-500/20 bg-red-950/25 backdrop-blur-sm">
                    <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="flex-1 min-w-0">
                        <span className="block text-[10px] font-mono text-red-300/90 leading-relaxed">{toolbarExportError}</span>
                        <ErrorGuidance className="text-[9px]" />
                    </span>
                    {lastFailedToolbarExport && (
                        <button ref={toolbarRetryButtonRef}
                            onClick={() => runToolbarExport(lastFailedToolbarExport)}
                            disabled={isExportingCharts || isExportingFull || isExportingAll}
                            aria-label={t(TOOLBAR_RETRY_LABELS[lastFailedToolbarExport])}
                            className="px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase tracking-wider text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait flex items-center gap-1 shrink-0"
                            title={t('analytics.rerunFailed')}>
                            <RotateCcw size={10} /> {t('analytics.retry')}
                        </button>
                    )}
                    <button onClick={() => { setToolbarExportError(null); setLastFailedToolbarExport(null); }}
                        aria-label={t('analytics.dismiss')}
                        className="text-[10px] font-mono text-[#E8E0D5]/30 hover:text-white transition-colors cursor-pointer shrink-0"
                        title={t('analytics.dismiss')}>✕</button>
                </div>
            )}

            {/* Live Events Feed — real-time activity stream */}
            <LiveEventsFeed events={data.liveEvents} isLive={isLive} />

            {/* Local export history panel (last 10 operations) */}
            <ExportHistoryPanel />

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <ChartCard title={t('analytics.chart.revenueOverview')} icon={BarChart3} chartId="chart-revenue-overview" filename={labelFilename('revenue_overview')}>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredRevenue} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} />
                                    <XAxis dataKey="label" tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1B2A6B' }} tickLine={false} tickFormatter={(v: string) => (DAY_LABEL_KEYS[v] ? t(DAY_LABEL_KEYS[v]) : v)} />
                                    <YAxis tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#C9A84C', opacity: 0.08 }} />
                                    {filteredRevenue.some((d) => d.previousValue !== undefined) && (
                                        <Bar dataKey="previousValue" name={t('analytics.legend.previousPeriod')} fill="#1B2A6B" radius={[3, 3, 0, 0]} opacity={0.4} />
                                    )}
                                    <Bar dataKey="value" name={t('analytics.series.revenue')} fill="#C9A84C" radius={[4, 4, 0, 0]} animationDuration={800} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" /><span className="text-[9px] font-mono text-[#E8E0D5]/50">{t('analytics.legend.currentPeriod')}</span></div>
                            {filteredRevenue.some((d) => d.previousValue !== undefined) && (
                                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#1B2A6B]" /><span className="text-[9px] font-mono text-[#E8E0D5]/50">{t('analytics.legend.previousPeriod')}</span></div>
                            )}
                            <div className="text-right"><p className="text-[9px] font-mono text-[#E8E0D5]/40">{t('analytics.total')}</p><p className="text-sm font-serif text-white font-bold">{formatCurrency(totalRevenue)}</p></div>
                        </div>
                    </ChartCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ChartCard title={t('analytics.chart.revenueChannel')} icon={DollarSign} chartId="chart-revenue-channel" filename={labelFilename('revenue_by_channel')}>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.revenueByChannel} layout="vertical" barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#E8E0D5', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <YAxis dataKey="label" type="category" tick={{ fill: '#E8E0D5', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={90} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#C9A84C', opacity: 0.08 }} />
                                        <Bar dataKey="value" name={t('analytics.series.revenue')} fill="#4FC3F7" radius={[0, 4, 4, 0]} animationDuration={800} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        <ChartCard title={t('analytics.chart.acquisition')} icon={Users} chartId="chart-acquisition" filename={labelFilename('customer_acquisition')}>
                            <div className="h-52 flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={data.acquisitionChannels} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="label" animationDuration={800}>
                                            {data.acquisitionChannels.map((_, i) => (<Cell key={i} fill={['#C9A84C', '#4FC3F7', '#10B981', '#F59E0B', '#EC4899'][i % 5]} />))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#E8E0D5' }} />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>
                </motion.div>
            )}

            {/* ═══ PRODUCTS TAB ═══ */}
            {activeTab === 'products' && (
                <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ChartCard title={t('analytics.chart.categorySales')} icon={PieChart} chartId="chart-category-sales" filename={labelFilename('category_sales')}>
                            <div className="h-64 flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={data.categorySales} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="revenue" nameKey="category" animationDuration={800}>
                                            {data.categorySales.map((entry) => (<Cell key={entry.category} fill={entry.color} />))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', color: '#E8E0D5' }} />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        <ChartCard title={t('analytics.chart.categoryBreakdown')} icon={ShoppingBag} chartId="chart-category-breakdown" filename={labelFilename('category_breakdown')}>
                            <div className="space-y-2">
                                {data.categorySales.map((cat) => (
                                    <div key={cat.category} className="flex items-center gap-3 p-2 rounded-lg bg-[#0A0F2C]/40">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-white font-medium truncate">{cat.category}</span>
                                                <span className="text-[10px] font-mono text-[#C9A84C] font-semibold shrink-0 ml-2">{formatCurrency(cat.revenue)}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#0A0F2C]/60 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.share}%`, backgroundColor: cat.color }} />
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/40">{t('analytics.share', { share: cat.share.toFixed(1) })}</span>
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/40">{t('analytics.units', { count: cat.unitsSold })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    <ChartCard title={t('analytics.chart.topProducts')} icon={TrendingUp} chartId="chart-top-products" filename={labelFilename('top_products')}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 border-b border-white/[0.05]">
                                        <th className="py-2 pr-2">{t('analytics.table.product')}</th><th className="py-2 pr-2">{t('analytics.table.category')}</th><th className="py-2 pr-2 text-right">{t('analytics.table.revenue')}</th><th className="py-2 pr-2 text-right">{t('analytics.table.units')}</th><th className="py-2 text-right">{t('analytics.table.growth')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topProducts.map((prod, i) => (
                                        <tr key={prod.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                                            <td className="py-2.5 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-mono text-[#E8E0D5]/30 w-4 shrink-0">{i + 1}</span>
                                                    <img src={prod.image} alt={prod.name} className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0" />
                                                    <span className="text-[10px] text-white font-medium truncate max-w-[140px]">{prod.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 pr-2 text-[9px] text-[#E8E0D5]/50">{prod.category}</td>
                                            <td className="py-2.5 pr-2 text-[10px] font-mono text-[#C9A84C] text-right">{formatCurrency(prod.revenue)}</td>
                                            <td className="py-2.5 pr-2 text-[10px] font-mono text-[#E8E0D5]/60 text-right">{prod.unitsSold}</td>
                                            <td className={`py-2.5 text-[10px] font-mono text-right ${prod.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {prod.growth >= 0 ? '+' : ''}{prod.growth.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </motion.div>
            )}

            {/* ═══ GROWTH TAB ═══ */}
            {activeTab === 'growth' && (
                <motion.div key="growth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <ChartCard title={t('analytics.chart.userGrowth')} icon={Activity} chartId="chart-user-growth" filename={labelFilename('user_growth')}>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} />
                                    <XAxis dataKey="month" tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1B2A6B' }} tickLine={false} />
                                    <YAxis tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (<div className="bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
                                            <p className="text-[10px] font-mono text-[#E8E0D5]/60 mb-1">{label}</p>
                                            {payload.map((entry: any, i: number) => (<p key={i} className="text-[10px] font-mono" style={{ color: entry.color }}>{entry.name}: {entry.value.toLocaleString()}</p>))}
                                        </div>);
                                    }} />
                                    <Line type="monotone" dataKey="total" name={t('analytics.users.total')} stroke="#C9A84C" strokeWidth={2} dot={{ r: 3, fill: '#C9A84C', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#C9A84C', strokeWidth: 2, stroke: '#0A0F2C' }} />
                                    <Line type="monotone" dataKey="activeUsers" name={t('analytics.users.active')} stroke="#4FC3F7" strokeWidth={2} dot={{ r: 2, fill: '#4FC3F7', strokeWidth: 0 }} />
                                    <Line type="monotone" dataKey="newUsers" name={t('analytics.users.new')} stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2, fill: '#10B981', strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.05]">
                            {[
                                { color: '#C9A84C', labelKey: 'analytics.users.total' as TranslationKey },
                                { color: '#4FC3F7', labelKey: 'analytics.users.active' as TranslationKey },
                                { color: '#10B981', labelKey: 'analytics.users.new' as TranslationKey },
                            ].map((item) => (
                                <div key={item.labelKey} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[9px] font-mono text-[#E8E0D5]/50">{t(item.labelKey)}</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: t('analytics.users.total'), value: data.userGrowth[data.userGrowth.length - 1].total.toLocaleString(), change: '+24.5% YoY', icon: Users, color: '#C9A84C' },
                            { label: t('analytics.users.currentMonth'), value: data.userGrowth[data.userGrowth.length - 1].activeUsers.toLocaleString(), change: '+18.2% MoM', icon: Activity, color: '#4FC3F7' },
                            { label: t('analytics.users.averageOrder'), value: formatCurrency(averageOrderValue), change: formatPercent(growthRate), icon: DollarSign, color: '#10B981' },
                        ].map((metric) => (
                            <div key={metric.label} className="p-4 bg-[#0A0F2C]/60 border border-white/[0.05] rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40">{metric.label}</span>
                                    <metric.icon size={14} style={{ color: metric.color }} />
                                </div>
                                <p className="text-xl font-serif text-white font-bold">{metric.value}</p>
                                <p className="text-[10px] font-mono text-emerald-400 mt-0.5">{metric.change}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
