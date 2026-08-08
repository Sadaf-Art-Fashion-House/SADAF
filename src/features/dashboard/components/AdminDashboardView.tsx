'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Users,
    Settings,
    LayoutGrid,
    Cpu,
    TrendingUp,
    AlertTriangle,
    Coins,
    Image,
    Shirt,
    Search,
    Trash2,
    ShoppingBag,
    Bookmark,
    CheckCircle,
    Download,
    Hammer,
} from 'lucide-react';
import Link from 'next/link';
import type { FashionProduct, ArtPiece } from '@/shared/types';
import { fashionDatabase, artDatabase, collections } from '@/data';
import { useDesignDraftStore } from '@/features/ai/store/useDesignDraftStore';
import { designPublisher } from '@/features/ai/services/designPublisher';
import { useWSAdminDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { ErrorBanner } from '@/shared/ui/ErrorGuidance';
import AtelierRequestsTab from '@/features/admin/components/AtelierRequestsTab';

// ─── Dynamic icon resolver for API-driven KPIs ────────────────────────────
function DynamicKpiIcon({ name, size, className }: { name: string; size: number; className: string }) {
    const icons: Record<string, React.ReactNode> = {
        TrendingUp: <TrendingUp size={size} className={className} />,
        Cpu: <Cpu size={size} className={className} />,
        LayoutGrid: <LayoutGrid size={size} className={className} />,
        Shirt: <Shirt size={size} className={className} />,
        Users: <Users size={size} className={className} />,
    };
    return <>{icons[name] || <TrendingUp size={size} className={className} />}</>;
}

interface SimulatedOrder {
    id: string;
    customerName: string;
    email: string;
    date: string;
    total: number;
    status: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';
    itemNames: string;
}

interface AdminDashboardViewProps {
    onLogout: () => void;
}

export default function AdminDashboardView({ onLogout }: AdminDashboardViewProps) {
    const [mainTab, setMainTab] = useState<'analytics' | 'products' | 'arts' | 'ai-logs' | 'orders' | 'customers' | 'designs' | 'atelier'>('analytics');

    // Product management
    const [newProdName, setNewProdName] = useState('');
    const [newProdPrice, setNewProdPrice] = useState('');
    const [newProdCategory, setNewProdCategory] = useState<'Women' | 'Men' | 'Kids' | 'Traditional Fusion' | 'Limited Edition'>('Traditional Fusion');
    const [newProdDesc, setNewProdDesc] = useState('');
    const [newFabric, setNewFabric] = useState('Metallic Egyptian Brocade');
    const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80');

    // Art management
    const [newArtTitle, setNewArtTitle] = useState('');
    const [newArtPrice, setNewArtPrice] = useState('');
    const [newArtCategory, setNewArtCategory] = useState<'Handmade' | 'Oil Paintings' | 'Calligraphy' | 'Digital Art' | 'Fashion Sketches'>('Calligraphy');
    const [newArtDesc, setNewArtDesc] = useState('');

    // Products catalog (from data)
    const [products, setProducts] = useState<FashionProduct[]>(fashionDatabase);
    const [productSearch, setProductSearch] = useState('');

    // Orders
    const [allOrders, setAllOrders] = useState<SimulatedOrder[]>([
        { id: 'SDF-2026-9041', customerName: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', date: '2026-06-01', total: 1250, status: 'Tailoring', itemNames: 'Al-Muizz El-Faraeda Abaya (1)' },
        { id: 'SDF-2026-8802', customerName: 'Karim Mansour', email: 'karim@mansour.eg', date: '2026-05-30', total: 580, status: 'Pending', itemNames: 'Diwani Calligraphy Streetwear Coach Jacket (1)' },
        { id: 'SDF-2026-4412', customerName: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', date: '2026-05-15', total: 3400, status: 'Delivered', itemNames: 'The Golden Diwani Diptych Fine Art (1)' },
    ]);

    // Customers
    const [customers, setCustomers] = useState([
        { id: 'cst-1', name: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', level: 'Gold Lineage VVIP', joinDate: '2026-01-14' },
        { id: 'cst-2', name: 'Karim Mansour', email: 'karim@mansour.eg', level: 'Silver Collector member', joinDate: '2026-02-19' },
        { id: 'cst-3', name: 'Sherif El-Bialy', email: 'sherif@bialy-group.com', level: 'Elite Art Patron', joinDate: '2026-03-02' },
        { id: 'cst-4', name: 'Nour El-Sherif', email: 'nour_sherif@outlook.com', level: 'Silver Collector member', joinDate: '2026-04-22' },
    ]);

    const [customerSearch, setCustomerSearch] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);

    // Design drafts
    const { drafts, deleteDraft } = useDesignDraftStore();
    const [collectionMode, setCollectionMode] = useState(false);
    const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
    const [collectionName, setCollectionName] = useState('');
    const [collectionTagline, setCollectionTagline] = useState('');
    const [existingCollectionId, setExistingCollectionId] = useState('');
    const [publishMsg, setPublishMsg] = useState<string | null>(null);
    const [addToExistingMode, setAddToExistingMode] = useState(false);

    // ── WebSocket real-time data ──
    const { data: apiData, wsState, error: dataError } = useWSAdminDashboardData(true);
    const isLive = wsState.status === 'connected';

    // Sync orders/customers from WebSocket when fresh data arrives
    useEffect(() => {
        if (!apiData?.orders) return;
        setAllOrders(apiData.orders as any[]);
    }, [apiData?.orders]);

    useEffect(() => {
        if (!apiData?.customers) return;
        setCustomers(apiData.customers as any[]);
    }, [apiData?.customers]);

    // AI Moderation rules
    const moderationRules = [
        { word: 'inappropriate', action: 'Auto-Block', timesFlagged: 0 },
        { word: 'commercial-recopy', action: 'Flag Review', timesFlagged: 4 },
        { word: 'low-integrity', action: 'Auto-Block', timesFlagged: 2 },
    ];

    // AI Generation logs
    const aiGenerationLogs = [
        { id: 'log-1', prompt: 'Byzantine gold lattices overlaid on velvet abaya hems', stamp: 'Just Now', status: 'Success (Gemini 3.5)' },
        { id: 'log-2', prompt: 'Alexandria seafront shell mother-of-pearl geometric patterns', stamp: '5 mins ago', status: 'Success (Gemini 3.5)' },
        { id: 'log-3', prompt: 'Thuluth calligraphic scripts spelling "Ahlan Wa Sahlan" in thin gold lines', stamp: '24 mins ago', status: 'Success (Gemini 3.5)' },
        { id: 'log-4', prompt: 'Royal Egyptian Blue linen overlays with desert sandstone hems', stamp: '1 hr ago', status: 'Success (Gemini 3.5)' },
    ];

    const handleCreateProduct = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!newProdName || !newProdPrice) return;

        const added: FashionProduct = {
            id: `f-${Date.now()}`,
            name: newProdName,
            category: newProdCategory,
            price: Number(newProdPrice),
            image: newImage,
            hoverImage: '',
            description: newProdDesc || 'Crafted organically in old Cairo ateliers.',
            fabric: newFabric,
            sizes: ['S', 'M', 'L', 'XL'],
            colors: [{ name: 'Sadaf Gold', hex: '#C9A84C' }, { name: 'Sadaf Pearl', hex: '#E8E0D5' }],
            details: ['100% bespoke stitch', 'Gold compounded threads'],
            rating: 4.9,
        };

        setProducts((prev) => [added, ...prev]);
        setFormSuccess(true);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setTimeout(() => setFormSuccess(false), 3000);
    }, [newProdName, newProdPrice, newProdCategory, newProdDesc, newImage, newFabric]);

    const handleDeleteProduct = useCallback((prodId: string) => {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
    }, []);

    const handleCreateArt = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!newArtTitle || !newArtPrice) return;

        const added: ArtPiece = {
            id: `art-${Date.now()}`,
            title: newArtTitle,
            category: newArtCategory,
            price: Number(newArtPrice),
            image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=82',
            description: newArtDesc || 'Finely detailed original heritage piece.',
            dimensions: '90 x 90 cm',
            year: '2026',
            artist: 'Sadaf Master Curator',
            medium: 'Liquid gold inks and cotton canvas',
        };

        artDatabase.push(added);
        setNewArtTitle('');
        setNewArtPrice('');
        setNewArtDesc('');
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 3000);
    }, [newArtTitle, newArtPrice, newArtCategory, newArtDesc]);

    const updateOrderStatus = useCallback((orderId: string, nextStatus: SimulatedOrder['status']) => {
        setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    }, []);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.email.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const mainTabs = [
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'products', label: 'Products', icon: Shirt },
        { id: 'arts', label: 'Arts', icon: Image },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'designs', label: 'Designs', icon: Bookmark },
        { id: 'atelier', label: 'Atelier', icon: Hammer },
        { id: 'ai-logs', label: 'AI Logs', icon: Cpu },
    ] as const;

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Admin Header */}
            <section className="relative pt-20 pb-12 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#4FC3F7] font-bold flex items-center gap-1.5 mb-1">
                                <Settings size={12} />
                                ATELIER CONTROL PORTAL &bull; لوحة الإشراف
                            </span>
                            <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight">
                                Admin Central
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-xl">
                                Manage e-boutique catalog, orders, customers, and AI moderation.
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
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex flex-wrap gap-2 mt-8 bg-[#090D2A]/80 p-1.5 border border-white/5 rounded-xl">
                        {mainTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setMainTab(tab.id as typeof mainTab)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                                    mainTab === tab.id
                                        ? 'bg-[#C9A84C] text-[#0A0F2C]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Real-time data degradation banner */}
                {dataError && (
                    <ErrorBanner tone="yellow" icon={AlertTriangle} message={`Live data is degraded: ${dataError}`} />
                )}

                <AnimatePresence mode="wait">
                    {/* Analytics Tab */}
                    {mainTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* KPI Grid — WebSocket real-time with hardcoded fallback */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-mono uppercase tracking-widest text-gray-600">
                                        ATELIER METRICS
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                                        isLive ? 'text-green-400' : 'text-yellow-500'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            isLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'
                                        }`} />
                                        {isLive ? 'LIVE via WebSocket' : 'Polling 15s'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {(apiData?.kpis?.length ? apiData.kpis : [
                                        { label: 'Bespoke Sales Vol', value: '$48,930', growth: '+18.2%', icon: 'TrendingUp', color: 'text-green-400' },
                                        { label: 'AI Generations', value: '1,294 runs', growth: '+24.8%', icon: 'Cpu', color: 'text-[#4FC3F7]' },
                                        { label: 'Museum Registries', value: '32 pieces', growth: 'Stable', icon: 'LayoutGrid', color: 'text-[#C9A84C]' },
                                        { label: 'VIP Active Collectors', value: '481 profiles', growth: '+9.4%', icon: 'Users', color: 'text-pink-400' },
                                    ]).map((kpi: any) => (
                                        <div
                                            key={kpi.label}
                                            className="p-5 rounded-xl bg-[#0F1435]/80 border border-white/5 shadow flex justify-between items-center"
                                        >
                                            <div>
                                                <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider block">{kpi.label}</span>
                                                <span className="text-2xl font-serif text-white font-bold block mt-1.5">{kpi.value}</span>
                                                <span className="text-[10px] text-green-400 font-mono mt-0.5 inline-block">{kpi.growth} vs prev month</span>
                                            </div>
                                            <div className="p-3 rounded-full bg-white/5 border border-white/10 shrink-0">
                                                <DynamicKpiIcon name={kpi.icon} size={18} className={kpi.color} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Charts + Moderation */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Revenue Chart */}
                                <div className="p-6 rounded-xl bg-[#090D2A]/80 border border-white/5">
                                    <h4 className="font-serif text-white text-base font-semibold mb-1">HAUTE REVENUE DYNAMICS (WEEKLY)</h4>
                                    <span className="text-[10px] text-gray-500 font-mono uppercase">Sales tracking by Atelier lines</span>
                                    <div className="h-44 flex items-end justify-between gap-3 pt-8 pb-2 mt-4">
                                        {[45, 68, 80, 52, 95, 76, 110].map((val, idx) => (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className="w-full bg-[#1B2A6B] hover:bg-[#C9A84C] transition duration-300 rounded-t"
                                                    style={{ height: `${val * 1.2}px` }}
                                                />
                                                <span className="text-[8px] font-mono uppercase text-gray-500">
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Moderation Rules */}
                                <div className="p-6 rounded-xl bg-[#090D2A]/80 border border-white/5">
                                    <h4 className="font-serif text-white text-base font-semibold mb-1 flex items-center gap-1.5">
                                        <AlertTriangle className="text-yellow-500" size={16} /> AI PROMPT AUDIT MODERATION
                                    </h4>
                                    <span className="text-[10px] text-gray-500 font-mono uppercase">Monitored rules in design prompts</span>
                                    <div className="divide-y divide-white/5 mt-6">
                                        {moderationRules.map((rule) => (
                                            <div key={rule.word} className="py-3 flex justify-between items-center text-xs">
                                                <div>
                                                    <code className="text-[#C9A84C] font-mono tracking-wider font-semibold">&bull; {rule.word}</code>
                                                    <span className="text-[9px] text-gray-500 font-mono uppercase block mt-0.5">Flagged keyword</span>
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-[10px] font-semibold text-slate-400 font-mono">{rule.timesFlagged} occurrences</span>
                                                    <span className="bg-red-950 text-red-400 font-semibold px-2 py-0.5 rounded text-[9px] border border-red-900">{rule.action}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Credits */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1B2A6B]/40 to-[#0A0F2C] border border-[#C9A84C]/25 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-[#C9A84C]/10 rounded-full text-[#C9A84C]">
                                        <Coins size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-white font-semibold">GLOBAL ATELIER AI CREDIT MATRIX</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed max-w-lg mt-0.5">
                                            100 free Creative Generation Credits monthly. Pro accounts receive infinite rendering priority.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => alert('AI credit matrices updated.')}
                                    className="px-4 py-2 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-mono uppercase tracking-wider font-semibold rounded cursor-pointer transition shrink-0"
                                >
                                    Sync Credits
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Products Tab */}
                    {mainTab === 'products' && (
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Create Product Form */}
                            <div className="lg:col-span-4 bg-[#090D2A]/80 border border-white/5 rounded-xl p-6">
                                <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                                    <Shirt size={16} className="text-[#C9A84C]" /> Create Public Product
                                </h3>

                                {formSuccess && (
                                    <ErrorBanner tone="green" icon={CheckCircle} message="✔ Product successfully registered!" className="mb-4" showGuidance={false} />
                                )}

                                <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                                    <div>
                                        <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Product Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProdName}
                                            onChange={(e) => setNewProdName(e.target.value)}
                                            placeholder="e.g. Diwani Linen Vest"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Price ($USD)</label>
                                            <input
                                                type="number"
                                                required
                                                value={newProdPrice}
                                                onChange={(e) => setNewProdPrice(e.target.value)}
                                                placeholder="e.g. 850"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Category</label>
                                            <select
                                                value={newProdCategory}
                                                onChange={(e) => setNewProdCategory(e.target.value as any)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-[#C9A84C] cursor-pointer"
                                            >
                                                <option value="Traditional Fusion">Traditional Fusion</option>
                                                <option value="Women">Women</option>
                                                <option value="Men">Men</option>
                                                <option value="Kids">Kids</option>
                                                <option value="Limited Edition">Limited Edition</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Fabric</label>
                                        <input
                                            type="text"
                                            value={newFabric}
                                            onChange={(e) => setNewFabric(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={newImage}
                                            onChange={(e) => setNewImage(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[10px] text-white outline-none focus:border-[#C9A84C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Description</label>
                                        <textarea
                                            value={newProdDesc}
                                            onChange={(e) => setNewProdDesc(e.target.value)}
                                            rows={3}
                                            placeholder="Describe material weight, thread density..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C] resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-mono tracking-widest font-bold uppercase rounded-lg cursor-pointer transition"
                                    >
                                        Deploy Haute Item
                                    </button>
                                </form>
                            </div>

                            {/* Products List */}
                            <div className="lg:col-span-8 bg-[#090D2A]/80 border border-white/5 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-serif text-lg text-white">DEPLOYED APPAREL REGISTRY ({products.length} Items)</h3>
                                    <div className="relative w-44">
                                        <span className="absolute left-2.5 top-2.5 text-slate-500"><Search size={12} /></span>
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            placeholder="Search items..."
                                            className="w-full pl-7 pr-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {filteredProducts.map((prod) => (
                                        <div
                                            key={prod.id}
                                            className="flex items-center justify-between p-3 bg-[#0A0F2C]/60 hover:bg-[#05081A] border border-white/5 rounded-xl transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={prod.image}
                                                    alt={prod.name}
                                                    className="w-12 h-12 object-cover rounded-lg border border-white/10"
                                                />
                                                <div>
                                                    <h4 className="text-xs font-serif text-white font-semibold uppercase leading-tight">{prod.name}</h4>
                                                    <p className="text-[9px] text-[#C9A84C] font-mono mt-0.5">
                                                        ${prod.price.toLocaleString()} &bull; <span className="text-slate-500 font-sans">{prod.fabric}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteProduct(prod.id)}
                                                className="p-2 bg-red-950/20 text-red-400 hover:text-white border border-red-500/20 hover:bg-red-900 rounded-lg transition cursor-pointer"
                                                title="Delete product"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Arts Tab */}
                    {mainTab === 'arts' && (
                        <motion.div
                            key="arts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            <div className="lg:col-span-4 bg-[#090D2A]/80 border border-white/5 rounded-xl p-6">
                                <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                                    <Image size={16} className="text-[#C9A84C]" /> Curate Fine Art Piece
                                </h3>

                                <form onSubmit={handleCreateArt} className="space-y-4 text-xs">
                                    <div>
                                        <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Artwork Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newArtTitle}
                                            onChange={(e) => setNewArtTitle(e.target.value)}
                                            placeholder="e.g. Siwa Gilded Sunset study"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Price ($USD)</label>
                                            <input
                                                type="number"
                                                required
                                                value={newArtPrice}
                                                onChange={(e) => setNewArtPrice(e.target.value)}
                                                placeholder="e.g. 1200"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Category</label>
                                            <select
                                                value={newArtCategory}
                                                onChange={(e) => setNewArtCategory(e.target.value as any)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-[#C9A84C] cursor-pointer"
                                            >
                                                <option value="Calligraphy">Calligraphy</option>
                                                <option value="Handmade">Handmade</option>
                                                <option value="Oil Paintings">Oil Paintings</option>
                                                <option value="Digital Art">Digital Art</option>
                                                <option value="Fashion Sketches">Fashion Sketches</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Description</label>
                                        <textarea
                                            value={newArtDesc}
                                            onChange={(e) => setNewArtDesc(e.target.value)}
                                            rows={3}
                                            placeholder="Describe pigments, gilding, brush, materials..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none focus:border-[#C9A84C] resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-mono tracking-widest font-bold uppercase rounded-lg cursor-pointer transition"
                                    >
                                        Deploy Curated Art
                                    </button>
                                </form>
                            </div>

                            <div className="lg:col-span-8 bg-[#090D2A]/80 border border-white/5 rounded-xl p-6">
                                <h3 className="font-serif text-lg text-white mb-4">MUSEUM ARCHIVES REGISTRY ({artDatabase.length} Items)</h3>
                                <div className="overflow-x-auto text-xs">
                                    <table className="w-full text-left divide-y divide-white/5 text-gray-400">
                                        <thead className="text-[10px] uppercase text-gray-500 font-mono">
                                            <tr>
                                                <th className="py-2.5">Title</th>
                                                <th>Category</th>
                                                <th>Artist</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {artDatabase.map((art) => (
                                                <tr key={art.id} className="h-12 hover:text-white transition">
                                                    <td className="py-2 leading-tight">
                                                        <span className="font-semibold block text-[#E8E0D5]">{art.title}</span>
                                                        <span className="text-[10px] text-gray-600 block">{art.medium}</span>
                                                    </td>
                                                    <td>{art.category}</td>
                                                    <td>{art.artist}</td>
                                                    <td className="font-mono text-[#C9A84C]">${art.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Orders Tab */}
                    {mainTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">Stitch Logistics Orders</h3>
                                    <p className="text-xs text-slate-400 mt-1">Manually transition ongoing atelier sewing stages.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {allOrders.map((ord) => (
                                    <div
                                        key={ord.id}
                                        className="p-5 bg-black/35 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono font-bold text-[#C9A84C]">{ord.id}</span>
                                                <span className="text-xs text-slate-500 font-mono">&bull; {ord.date}</span>
                                            </div>
                                            <h4 className="text-xs font-serif font-bold uppercase text-white">
                                                Customer: {ord.customerName} <span className="text-[10px] text-slate-500 font-mono italic">({ord.email})</span>
                                            </h4>
                                            <p className="text-[10px] font-mono text-slate-400">
                                                Items: <strong className="text-slate-300 font-sans">{ord.itemNames}</strong>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-center">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">Stage:</span>
                                            <select
                                                value={ord.status}
                                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as SimulatedOrder['status'])}
                                                className="px-3 py-1.5 bg-[#05081A] border border-[#C9A84C]/30 text-[10px] text-[#C9A84C] font-mono font-bold rounded-lg cursor-pointer outline-none"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Tailoring">Tailoring</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Customers Tab */}
                    {mainTab === 'customers' && (
                        <motion.div
                            key="customers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">Registered Curator Roster</h3>
                                    <p className="text-xs text-slate-400 mt-1">Explore elite boutique accounts and VIP memberships.</p>
                                </div>
                                <div className="relative w-48">
                                    <span className="absolute left-2.5 top-2.5 text-slate-500"><Search size={12} /></span>
                                    <input
                                        type="text"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        placeholder="Search members..."
                                        className="w-full pl-7 pr-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredCustomers.map((cust) => (
                                    <div
                                        key={cust.id}
                                        className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-serif font-semibold text-white uppercase tracking-wider">{cust.name}</h4>
                                                <span className="px-2 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C] text-[8px] font-mono rounded border border-[#C9A84C]/20 font-extrabold uppercase">VIP</span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-500">{cust.email}</p>
                                            <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest">{cust.level}</span>
                                        </div>
                                        <div className="text-right text-[9px] font-mono text-slate-500 uppercase">
                                            <div>Joined</div>
                                            <div className="text-white font-bold mt-0.5">{cust.joinDate}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Designs Tab — Review & Publish AI Studio drafts */}
                    {mainTab === 'designs' && (
                        <motion.div
                            key="designs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                                        AI Studio Design Drafts
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Review saved AI-generated designs and publish them as products, artworks, or collections.
                                    </p>
                                </div>
                                {drafts.filter(d => d.status === 'draft').length > 1 && (
                                    <button
                                        onClick={() => { setCollectionMode(!collectionMode); setSelectedDraftIds([]); }}
                                        className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                                            collectionMode
                                                ? 'bg-[#C9A84C] text-[#0A0F2C]'
                                                : 'bg-black/40 border border-white/10 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {collectionMode ? 'Cancel Collection' : 'Create Collection'}
                                    </button>
                                )}
                            </div>

                            {publishMsg && (
                                <ErrorBanner tone="green" icon={CheckCircle} message={publishMsg} showGuidance={false} />
                            )}

                            {collectionMode && (
                                <div className="p-4 bg-[#090D2A]/80 border border-[#C9A84C]/30 rounded-xl space-y-3">
                                    <div className="flex gap-2 items-center mb-1">
                                        <button
                                            onClick={() => { setAddToExistingMode(false); setExistingCollectionId(''); }}
                                            className={`px-3 py-1 text-[9px] font-mono rounded transition cursor-pointer ${
                                                !addToExistingMode ? 'bg-[#C9A84C] text-[#0A0F2C]' : 'bg-white/5 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            New Collection
                                        </button>
                                        <button
                                            onClick={() => { setAddToExistingMode(true); setCollectionName(''); }}
                                            className={`px-3 py-1 text-[9px] font-mono rounded transition cursor-pointer ${
                                                addToExistingMode ? 'bg-[#C9A84C] text-[#0A0F2C]' : 'bg-white/5 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Add to Existing
                                        </button>
                                    </div>

                                    {addToExistingMode ? (
                                        <>
                                            <p className="text-[10px] text-slate-400">
                                                Selected {selectedDraftIds.length} draft{selectedDraftIds.length !== 1 ? 's' : ''}.
                                                Choose an existing collection to add them to.
                                            </p>
                                            <select
                                                value={existingCollectionId}
                                                onChange={(e) => setExistingCollectionId(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer"
                                            >
                                                <option value="">— Select a collection —</option>
                                                {collections.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                disabled
                                                className="px-4 py-2 bg-slate-700 text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg cursor-not-allowed opacity-60"
                                            >
                                                🚧 Add to Collection (Coming Soon)
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-[10px] text-slate-400">
                                                Selected {selectedDraftIds.length} draft{selectedDraftIds.length !== 1 ? 's' : ''}.
                                                Select drafts below, then name your collection.
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={collectionName}
                                                    onChange={(e) => setCollectionName(e.target.value)}
                                                    placeholder="Collection name (e.g. Fatimid Digital Capsule)"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={collectionTagline}
                                                    onChange={(e) => setCollectionTagline(e.target.value)}
                                                    placeholder="Tagline (optional)"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (selectedDraftIds.length === 0 || !collectionName) return;
                                                    const selectedDrafts = drafts.filter(d => selectedDraftIds.includes(d.id));
                                                    const result = designPublisher.publishAsCollection(selectedDrafts, collectionName, collectionTagline);
                                                    setPublishMsg(`Collection "${result.entityName}" published successfully! (${selectedDrafts.length} designs)`);
                                                    setCollectionMode(false);
                                                    setSelectedDraftIds([]);
                                                    setCollectionName('');
                                                    setCollectionTagline('');
                                                    setTimeout(() => setPublishMsg(null), 4000);
                                                }}
                                                disabled={selectedDraftIds.length === 0 || !collectionName}
                                                className="px-4 py-2 bg-[#C9A84C] text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition cursor-pointer disabled:opacity-40"
                                            >
                                                Publish Collection
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {drafts.length === 0 ? (
                                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                                        <Bookmark size={28} className="text-[#C9A84C]/30 mx-auto mb-3" />
                                        <p className="text-sm text-[#E8E0D5]/60 mb-1">No saved designs from AI Studio</p>
                                        <p className="text-[10px] text-slate-500">
                                            Go to <Link href="/ai" className="text-[#C9A84C] underline">AI Studio</Link>, generate a design, and hit Save.
                                        </p>
                                    </div>
                                ) : (
                                    drafts.filter(d => d.status === 'draft').map((draft) => (
                                        <div
                                            key={draft.id}
                                            className={`p-4 bg-[#05081A]/80 border rounded-xl transition ${
                                                selectedDraftIds.includes(draft.id) ? 'border-[#C9A84C] bg-[#1B2A6B]/20' : 'border-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {collectionMode && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDraftIds.includes(draft.id)}
                                                            onChange={() => {
                                                                setSelectedDraftIds((prev) =>
                                                                    prev.includes(draft.id)
                                                                        ? prev.filter((id) => id !== draft.id)
                                                                        : [...prev, draft.id]
                                                                );
                                                            }}
                                                            className="cursor-pointer accent-[#C9A84C]"
                                                        />
                                                    )}
                                                    <div
                                                        className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden shrink-0 bg-[#0A0F2C]"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `<svg viewBox="0 0 100 100" width="48" height="48">${draft.design.svgPattern.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`,
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-serif text-white font-semibold truncate">{draft.design.patternName}</h4>
                                                        <p className="text-[9px] font-mono text-slate-500">
                                                            {draft.design.clothingType} • {new Date(draft.savedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={() => {
                                                            const result = designPublisher.publishAsFashion(draft);
                                                            setPublishMsg(`"${result.entityName}" published as Fashion Product!`);
                                                            setTimeout(() => setPublishMsg(null), 3000);
                                                        }}
                                                        className="px-2 py-1.5 bg-[#C9A84C]/10 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider border border-[#C9A84C]/30 rounded-lg hover:bg-[#C9A84C]/20 transition cursor-pointer"
                                                        title="Publish as Fashion Product"
                                                    >
                                                        <Shirt size={10} className="inline mr-0.5" />Fashion
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const result = designPublisher.publishAsArt(draft);
                                                            setPublishMsg(`"${result.entityName}" published as Art Piece!`);
                                                            setTimeout(() => setPublishMsg(null), 3000);
                                                        }}
                                                        className="px-2 py-1.5 bg-[#C9A84C]/10 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider border border-[#C9A84C]/30 rounded-lg hover:bg-[#C9A84C]/20 transition cursor-pointer"
                                                        title="Publish as Art Piece"
                                                    >
                                                        <Image size={10} className="inline mr-0.5" />Art
                                                    </button>
                                                    {/* Export as JSON */}
                                                    <button
                                                        onClick={() => {
                                                            const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${draft.design.patternName.replace(/\s+/g, '_')}.json`;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        }}
                                                        className="px-2 py-1.5 bg-[#1B2A6B]/50 text-[#4FC3F7] border border-[#4FC3F7]/20 rounded-lg text-[8px] font-mono uppercase tracking-wider hover:bg-[#1B2A6B] transition cursor-pointer"
                                                        title="Export design as JSON"
                                                    >
                                                        <Download size={10} className="inline mr-0.5" />Export
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            deleteDraft(draft.id);
                                                        }}
                                                        className="p-1.5 bg-red-950/20 text-red-400 hover:bg-red-900 rounded-lg transition cursor-pointer"
                                                        title="Delete draft"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* AI Logs Tab */}
                    {mainTab === 'ai-logs' && (
                        <motion.div
                            key="ai-logs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <h3 className="font-serif text-xl text-white mb-2 flex items-center gap-1.5">
                                <Cpu className="text-[#C9A84C]" size={20} /> REAL-TIME AI STUDIO TELEMETRY
                            </h3>
                            <div className="divide-y divide-white/5 bg-[#090D2A]/80 rounded-xl border border-white/5 p-6">
                                {aiGenerationLogs.map((log) => (
                                    <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex justify-between gap-6 items-center text-xs">
                                        <div>
                                            <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block mb-1">
                                                {log.stamp} &bull; Prompt telemetry
                                            </span>
                                            <blockquote className="text-white font-mono italic">&ldquo;{log.prompt}&rdquo;</blockquote>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className="text-green-400 bg-green-950 px-2 py-0.5 border border-green-900 rounded font-mono text-[9px] font-semibold tracking-wider">
                                                {log.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Atelier Tab — Designer submissions review queue */}
                    {mainTab === 'atelier' && (
                        <motion.div
                            key="atelier"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <AtelierRequestsTab />
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}