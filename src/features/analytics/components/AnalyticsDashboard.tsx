'use client';

import { useState, useCallback, useRef } from 'react';
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
import { useExportChart, exportElementsAsPDF } from '../hooks/useExportChart';
import { useWatermarkStore, getWatermarkExportPrefix } from '@/features/watermark/store/useWatermarkStore';
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

const TAB_LABELS: Record<string, string> = {
    overview: 'Revenue',
    products: 'Products',
    growth: 'Growth',
};

/** Every chart across all tabs (for full-dashboard export) */
const ALL_CHART_IDS = [
    ...TAB_CHART_IDS.overview,
    ...TAB_CHART_IDS.products,
    ...TAB_CHART_IDS.growth,
];

// ─── Tooltip components ───────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
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
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload ?? {};
    const hasRevenue = 'revenue' in d;
    return (
        <div className="bg-[#0A0F2C]/95 border border-[#C9A84C]/20 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-mono font-semibold text-white">{d.category || d.label || d.name}</p>
            {hasRevenue ? (
                <><p className="text-[10px] font-mono text-[#E8E0D5]/60">${d.revenue.toLocaleString()} ({d.share.toFixed(1)}%)</p><p className="text-[10px] text-[#E8E0D5]/40">{d.unitsSold} units sold</p></>
            ) : (
                <p className="text-[10px] font-mono text-[#E8E0D5]/60">{d.value} visitors</p>
            )}
        </div>
    );
}

// ─── Export dropdown (per-chart / per-KPI) ────────────────────────────────

function ExportDropdown({
    onExportPNG,
    onExportPDF,
    isExporting,
    size = 13,
}: {
    onExportPNG: () => void;
    onExportPDF: () => void;
    isExporting: boolean;
    size?: number;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={isExporting}
                className="p-1.5 rounded-lg text-[#E8E0D5]/30 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all cursor-pointer disabled:opacity-40"
                title="Export"
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
                    <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-xl shadow-xl shadow-[#C9A84C]/10 backdrop-blur-xl overflow-hidden">
                        <button onClick={() => { onExportPNG(); setOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                            <FileImage size={12} className="text-[#4FC3F7]" /> Export as PNG
                        </button>
                        <button onClick={() => { onExportPDF(); setOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                            <FileText size={12} className="text-[#C9A84C]" /> Export as PDF
                        </button>
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
    const { exportAsPNG, exportAsPDF, isExporting } = useExportChart(chartRef, filename);

    return (
        <div className={`p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon size={14} className="text-[#C9A84C]" />
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">{title}</h3>
                </div>
                <ExportDropdown onExportPNG={exportAsPNG} onExportPDF={exportAsPDF} isExporting={isExporting} />
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
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: any;
    cardId: string;
    filename: string;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { exportAsPNG, exportAsPDF, isExporting } = useExportChart(cardRef, filename);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-4 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/20 rounded-2xl transition-all duration-300"
        >
            {/* Export button — visible on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <ExportDropdown onExportPNG={exportAsPNG} onExportPDF={exportAsPDF} isExporting={isExporting} size={11} />
            </div>

            <div ref={cardRef} id={cardId}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[7px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 font-semibold">{label}</span>
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
    } = useAnalytics(initialData);

    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'growth'>('overview');
    const [isExportingCharts, setIsExportingCharts] = useState(false);
    const [isExportingFull, setIsExportingFull] = useState(false);
    const [isExportingAll, setIsExportingAll] = useState(false);

    // Subscribe to watermark settings so filenames reactively include the label
    useWatermarkStore((s) => s.settings);

    const timeRanges: { value: TimeRange; label: string }[] = [
        { value: '7d', label: '7 Days' }, { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' }, { value: '12m', label: '12 Months' },
    ];

    const kpiIcons: Record<string, any> = {
        TrendingUp, ShoppingBag, Users, DollarSign, Cpu,
        TrendingDown: ArrowDownRight,
    };

    const handleExportCharts = useCallback(() => {
        const chartIds = TAB_CHART_IDS[activeTab];
        const tabLabel = TAB_LABELS[activeTab];
        if (!chartIds?.length) return;
        exportElementsAsPDF(chartIds, labelFilename(`analytics_${tabLabel.toLowerCase()}`), setIsExportingCharts);
    }, [activeTab]);

    const handleExportFullReport = useCallback(() => {
        const chartIds = TAB_CHART_IDS[activeTab];
        const tabLabel = TAB_LABELS[activeTab];
        const allIds = ['kpi-section', ...(chartIds ?? [])];
        exportElementsAsPDF(allIds, labelFilename(`full_report_${tabLabel.toLowerCase()}`), setIsExportingFull);
    }, [activeTab]);

    const handleExportAllDashboard = useCallback(() => {
        const allIds = ['kpi-section', ...ALL_CHART_IDS];
        exportElementsAsPDF(allIds, labelFilename('complete_dashboard_report'), setIsExportingAll);
    }, []);

    if (!data?.kpis?.length) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center">
                    <TrendingUp size={32} className="mx-auto text-[#E8E0D5]/20 mb-3" />
                    <p className="text-sm text-[#E8E0D5]/60">No analytics data available yet.</p>
                    <p className="text-[10px] text-[#E8E0D5]/40 mt-1">Data will appear once orders and users are recorded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen pb-20">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* KPI Cards — wrapped for full-report capture */}
            <section id="kpi-section" className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {data.kpis.map((kpi) => {
                        const Icon = kpiIcons[kpi.icon] || TrendingUp;
                        return (
                            <KpiCard
                                key={kpi.label}
                                label={kpi.label}
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
                        { id: 'overview', label: 'Revenue', icon: BarChart3 },
                        { id: 'products', label: 'Products', icon: PieChart },
                        { id: 'growth', label: 'Growth', icon: Activity },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <button onClick={handleExportCharts} disabled={isExportingCharts}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/20 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        title={`Export ${TAB_LABELS[activeTab]} charts as PDF`}>
                        {isExportingCharts ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <FileSpreadsheet size={12} />}
                        Charts ({TAB_CHART_IDS[activeTab]?.length ?? 0})
                    </button>

                    <button onClick={handleExportFullReport} disabled={isExportingFull}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-gradient-to-r from-[#C9A84C]/20 to-[#4FC3F7]/10 text-white border border-[#C9A84C]/40 hover:border-[#C9A84C]/60 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        title="Export current tab report (KPIs + charts)">
                        {isExportingFull ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <FileBarChart size={12} />}
                        Report
                    </button>

                    <button onClick={handleExportAllDashboard} disabled={isExportingAll}
                        className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-gradient-to-r from-[#C9A84C]/30 to-[#EC4899]/10 text-white border border-[#C9A84C]/50 hover:border-[#EC4899]/40 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        title="Export complete dashboard report (all KPIs + all charts)">
                        {isExportingAll ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <LayoutDashboard size={12} />}
                        All Dashboard
                    </button>
                </div>
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <ChartCard title="Revenue Overview" icon={BarChart3} chartId="chart-revenue-overview" filename={labelFilename('revenue_overview')}>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredRevenue} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} />
                                    <XAxis dataKey="label" tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1B2A6B' }} tickLine={false} />
                                    <YAxis tick={{ fill: '#E8E0D5', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#C9A84C', opacity: 0.08 }} />
                                    {filteredRevenue.some((d) => d.previousValue !== undefined) && (
                                        <Bar dataKey="previousValue" name="Previous Period" fill="#1B2A6B" radius={[3, 3, 0, 0]} opacity={0.4} />
                                    )}
                                    <Bar dataKey="value" name="Revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} animationDuration={800} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" /><span className="text-[9px] font-mono text-[#E8E0D5]/50">Current Period</span></div>
                            {filteredRevenue.some((d) => d.previousValue !== undefined) && (
                                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#1B2A6B]" /><span className="text-[9px] font-mono text-[#E8E0D5]/50">Previous Period</span></div>
                            )}
                            <div className="text-right"><p className="text-[9px] font-mono text-[#E8E0D5]/40">Total</p><p className="text-sm font-serif text-white font-bold">{formatCurrency(totalRevenue)}</p></div>
                        </div>
                    </ChartCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ChartCard title="Revenue by Channel" icon={DollarSign} chartId="chart-revenue-channel" filename={labelFilename('revenue_by_channel')}>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.revenueByChannel} layout="vertical" barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1B2A6B" strokeOpacity={0.3} horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#E8E0D5', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <YAxis dataKey="label" type="category" tick={{ fill: '#E8E0D5', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={90} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#C9A84C', opacity: 0.08 }} />
                                        <Bar dataKey="value" name="Revenue" fill="#4FC3F7" radius={[0, 4, 4, 0]} animationDuration={800} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        <ChartCard title="Customer Acquisition" icon={Users} chartId="chart-acquisition" filename={labelFilename('customer_acquisition')}>
                            <div className="h-52 flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={data.acquisitionChannels} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="label" animationDuration={800}>
                                            {data.acquisitionChannels.map((entry, i) => (<Cell key={i} fill={['#C9A84C', '#4FC3F7', '#10B981', '#F59E0B', '#EC4899'][i % 5]} />))}
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
                        <ChartCard title="Sales by Category" icon={PieChart} chartId="chart-category-sales" filename={labelFilename('category_sales')}>
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

                        <ChartCard title="Category Breakdown" icon={ShoppingBag} chartId="chart-category-breakdown" filename={labelFilename('category_breakdown')}>
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
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/40">{cat.share.toFixed(1)}% share</span>
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/40">{cat.unitsSold} units</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    <ChartCard title="Top Selling Products" icon={TrendingUp} chartId="chart-top-products" filename={labelFilename('top_products')}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40 border-b border-white/[0.05]">
                                        <th className="py-2 pr-2">Product</th><th className="py-2 pr-2">Category</th><th className="py-2 pr-2 text-right">Revenue</th><th className="py-2 pr-2 text-right">Units</th><th className="py-2 text-right">Growth</th>
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
                    <ChartCard title="User Growth & Activity" icon={Activity} chartId="chart-user-growth" filename={labelFilename('user_growth')}>
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
                                    <Line type="monotone" dataKey="total" name="Total Users" stroke="#C9A84C" strokeWidth={2} dot={{ r: 3, fill: '#C9A84C', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#C9A84C', strokeWidth: 2, stroke: '#0A0F2C' }} />
                                    <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#4FC3F7" strokeWidth={2} dot={{ r: 2, fill: '#4FC3F7', strokeWidth: 0 }} />
                                    <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2, fill: '#10B981', strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.05]">
                            {[{ color: '#C9A84C', label: 'Total Users' }, { color: '#4FC3F7', label: 'Active Users' }, { color: '#10B981', label: 'New Users' }].map((item) => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[9px] font-mono text-[#E8E0D5]/50">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Users', value: data.userGrowth[data.userGrowth.length - 1].total.toLocaleString(), change: '+24.5% YoY', icon: Users, color: '#C9A84C' },
                            { label: 'Current Month Active', value: data.userGrowth[data.userGrowth.length - 1].activeUsers.toLocaleString(), change: '+18.2% MoM', icon: Activity, color: '#4FC3F7' },
                            { label: 'Average Order Value', value: formatCurrency(averageOrderValue), change: formatPercent(growthRate), icon: DollarSign, color: '#10B981' },
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
