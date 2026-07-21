'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag,
    Heart,
    User,
    MapPin,
    Calendar,
    Compass,
    CheckCircle,
    Trash2,
    Plus,
    Gift,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { UserProfile, FashionProduct } from '@/shared/types';
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore';
import { useCartStore } from '@/features/cart/store/useCartStore';

interface SimulatedOrder {
    id: string;
    date: string;
    total: number;
    status: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';
    items: { name: string; quantity: number; size: string; price: number; image: string }[];
    shippingAddress: string;
}

interface UserDashboardViewProps {
    user: UserProfile;
    onLogout: () => void;
}

export default function UserDashboardView({ user, onLogout }: UserDashboardViewProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
    const { items: wishlist, toggleWishlist } = useWishlistStore();
    const { addFashionToCart } = useCartStore();

    // Profile state
    const [fullName, setFullName] = useState(user.fullName || '');
    const [email] = useState(user.email || '');
    const [shippingAddress, setShippingAddress] = useState('Villa 14, Al-Yasmine District, New Cairo, Egypt');
    const [bio, setBio] = useState('Passionate about authentic Cairo heritage calligraphies and fine jacquard abayas.');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Orders
    const [orders] = useState<SimulatedOrder[]>([
        {
            id: 'SDF-2026-9041', date: '2026-05-28', total: 1250, status: 'Tailoring',
            shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
            items: [{ name: 'Al-Muizz El-Faraeda Abaya', quantity: 1, size: 'M', price: 1250, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80' }],
        },
        {
            id: 'SDF-2026-4412', date: '2026-04-12', total: 3400, status: 'Delivered',
            shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
            items: [{ name: 'The Golden Diwani Diptych Fine Art', quantity: 1, size: 'Original Framing', price: 3400, image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=300&q=80' }],
        },
    ]);

    const handleUpdateProfile = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg('Your boutique credentials have been securely locked and saved.');
        setTimeout(() => setSuccessMsg(null), 3000);
    }, []);

    const handleAddToCart = useCallback((product: FashionProduct) => {
        addFashionToCart(product, product.sizes[0] || 'M', product.colors[0]?.name || 'Gold');
    }, [addFashionToCart]);

    const statusColors = {
        'Pending': 'text-yellow-400 bg-yellow-950/40 border-yellow-500/20',
        'Tailoring': 'text-blue-400 bg-blue-950/40 border-[#4FC3F7]/20',
        'Shipped': 'text-purple-400 bg-purple-950/40 border-purple-500/20',
        'Delivered': 'text-green-400 bg-green-950/40 border-green-500/20',
    };

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-12 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold flex items-center gap-1.5 mb-1">
                                <Compass size={12} />
                                SADAF COLLECTOR CLUB &bull; لوحة تحكم العميل
                            </span>
                            <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight">
                                Salaam, {fullName || 'Member'}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-xl">
                                Review sewing status, explore your curation bag, and secure billing coordinates.
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
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Tab nav */}
                    <div className="flex gap-2 mt-8 bg-[#090D2A]/80 p-1.5 border border-white/5 rounded-xl w-fit">
                        {[
                            { id: 'profile', label: 'Profile', icon: User },
                            { id: 'orders', label: 'Orders', icon: ShoppingBag },
                            { id: 'wishlist', label: 'Wishlist', icon: Heart },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === tab.id
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="p-5 bg-gradient-to-b from-[#111A45]/80 to-[#05081A]/95 border border-[#C9A84C]/20 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 rounded-full blur-xl pointer-events-none" />
                            <span className="text-[8px] font-mono tracking-widest text-[#C9A84C] block uppercase font-bold mb-2">
                                Heritage VIP Membership
                            </span>
                            <div className="flex items-center gap-2 mb-3">
                                <Gift size={20} className="text-[#C9A84C]" />
                                <h4 className="font-serif text-white font-semibold text-sm">GOLD LINEAGE BADGE</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                As an authentic collector, you receive complimentary bespoke tailoring fittings and expedited shipping.
                            </p>
                        </div>
                    </div>

                    {/* Main panel */}
                    <div className="lg:col-span-9 bg-[#05081A]/90 border border-white/5 rounded-3xl p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">Curation Credentials</h2>
                                        <p className="text-xs text-slate-400 mt-1">Manage security keys and certified physical receipt addresses.</p>
                                    </div>

                                    {successMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3.5 bg-green-950/40 border border-green-500/30 text-green-200 text-xs rounded-xl flex items-center gap-2"
                                        >
                                            <CheckCircle size={14} className="text-green-400" />
                                            <span>{successMsg}</span>
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Full Member Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Registered Email</label>
                                                <input
                                                    type="email"
                                                    disabled
                                                    value={email}
                                                    className="w-full bg-black/10 border border-white/5 text-xs text-slate-500 rounded-xl p-3 outline-none cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Personal Heritage Bio</label>
                                            <textarea
                                                rows={3}
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Shipping Address</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-3.5 text-[#C9A84C]"><MapPin size={14} /></span>
                                                <input
                                                    type="text"
                                                    required
                                                    value={shippingAddress}
                                                    onChange={(e) => setShippingAddress(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#C9A84C] transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex justify-end">
                                            <button
                                                type="submit"
                                                className="px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition cursor-pointer hover:scale-105"
                                            >
                                                Lock In Curation Details
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">Active Order Linage</h2>
                                        <p className="text-xs text-slate-400 mt-1">Trace the current tailoring stage of your handmade heritage items.</p>
                                    </div>

                                    {orders.map((ord) => (
                                        <div key={ord.id} className="bg-black/30 border border-white/5 rounded-2xl p-5 md:p-6">
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-slate-400 uppercase">Order</span>
                                                    <span className="text-sm font-bold text-[#C9A84C] font-mono">{ord.id}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-mono">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Calendar size={13} />
                                                        <span>{ord.date}</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono border font-bold ${statusColors[ord.status]}`}>
                                                        {ord.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {ord.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 items-center py-2">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs md:text-sm font-serif text-white font-semibold truncate">{item.name}</h4>
                                                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                                            Size: {item.size} &bull; Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xs font-semibold text-[#C9A84C] font-mono">${item.price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Progress Stepper */}
                                            <div className="mt-6 border-t border-white/5 pt-5 relative">
                                                <div className="absolute top-[29px] left-8 right-8 h-[2px] bg-white/5 z-0" />
                                                <div
                                                    className="absolute top-[29px] left-8 h-[2px] bg-gradient-to-r from-[#C9A84C] to-[#4FC3F7] z-0 transition-all duration-[1000ms]"
                                                    style={{
                                                        width: ord.status === 'Pending' ? '0%' : ord.status === 'Tailoring' ? '33%' : ord.status === 'Shipped' ? '66%' : '100%',
                                                    }}
                                                />
                                                <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                                                    {[
                                                        { s: 'Pending', label: 'Ordered' },
                                                        { s: 'Tailoring', label: 'Sewing' },
                                                        { s: 'Shipped', label: 'Shipped' },
                                                        { s: 'Delivered', label: 'Received' },
                                                    ].map((step, stepIdx) => {
                                                        const statuses = ['Pending', 'Tailoring', 'Shipped', 'Delivered'];
                                                        const curIdx = statuses.indexOf(ord.status);
                                                        const isDone = stepIdx <= curIdx;
                                                        return (
                                                            <div key={step.s} className="flex flex-col items-center gap-1.5">
                                                                <div
                                                                    className={`w-4 h-4 rounded-full flex items-center justify-center border font-mono text-[8px] font-bold transition-all duration-500 ${
                                                                        isDone
                                                                            ? 'bg-[#C9A84C] text-[#0A0F2C] border-[#C9A84C] shadow-lg shadow-[#C9A84C]/25'
                                                                            : 'bg-[#0A0F2C] border-white/10 text-slate-500'
                                                                    }`}
                                                                >
                                                                    {isDone && '✓'}
                                                                </div>
                                                                <span
                                                                    className={`text-[9px] font-serif font-bold uppercase tracking-wider ${
                                                                        stepIdx === curIdx ? 'text-[#C9A84C]' : 'text-slate-500'
                                                                    }`}
                                                                >
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-6 border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 font-mono gap-2 uppercase">
                                                <div>
                                                    <strong>Address:</strong> {ord.shippingAddress}
                                                </div>
                                                <div className="whitespace-nowrap text-white font-bold">
                                                    Total: <span className="text-[#C9A84C] font-extrabold text-sm">${ord.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Wishlist Tab */}
                            {activeTab === 'wishlist' && (
                                <motion.div
                                    key="wishlist"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">My Luxury Wishlist</h2>
                                        <p className="text-xs text-slate-400 mt-1">Bespoke capsule pieces flagged for later tailoring.</p>
                                    </div>

                                    {wishlist.length === 0 ? (
                                        <div className="text-center py-16 border border-dashed border-white/15 rounded-3xl">
                                            <Sparkles size={32} className="text-[#C9A84C]/30 mx-auto mb-3" />
                                            <h4 className="font-serif text-[#E8E0D5] text-sm uppercase font-semibold mb-1">No pinned fabrics yet</h4>
                                            <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                                                Explore the exclusive couture collections inside the boutique to save luxury pieces.
                                            </p>
                                            <Link
                                                href="/store"
                                                className="inline-block mt-4 px-5 py-2 bg-[#C9A84C] text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg transition hover:scale-105"
                                            >
                                                Browse Store
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {wishlist.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="bg-black/30 border border-white/5 rounded-2xl p-4 flex gap-4 items-center justify-between"
                                                >
                                                    <div className="flex gap-3 items-center min-w-0">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <h4 className="font-serif text-white text-sm font-semibold truncate uppercase">{item.name}</h4>
                                                            <p className="text-[10px] text-[#C9A84C] font-mono mt-0.5">${item.price.toLocaleString()}</p>
                                                            <span className="inline-block text-[9px] font-mono text-slate-500 bg-white/5 py-0.5 px-2 rounded-full mt-1 uppercase">
                                                                {item.fabric}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleAddToCart(item)}
                                                            className="p-2.5 bg-[#C9A84C] rounded-xl text-[#0A0F2C] hover:bg-white transition cursor-pointer"
                                                            title="Add to Cart"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleWishlist(item)}
                                                            className="p-2.5 bg-red-950/40 text-red-400 hover:text-white border border-red-500/20 hover:bg-red-900 rounded-xl transition cursor-pointer"
                                                            title="Remove"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </div>
    );
}
