'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
    ShoppingBag,
    Calendar,
    Package,
    Truck,
    CheckCircle,
    ArrowLeft,
    Clock,
    MapPin,
    Heart,
    Star,
} from 'lucide-react';
import type { Order, OrderStatus, OrderStatusEvent } from '@/features/orders/types';
import type { RatingsByProduct } from '@/features/reviews/hooks/useAggregatedRatings';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { ROUTES } from '@/config/routes';
import LiveOrderStatus from './LiveOrderStatus';
import ReviewForm from '@/features/reviews/components/ReviewForm';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { localizedOrderItemName } from '@/features/i18n/productNames';

interface OrdersViewProps {
    orders: Order[];
    /** Latest status per order, overlaid from real-time events. */
    liveStatuses: Record<string, OrderStatus>;
    /** Recent order-status transitions (newest first). */
    liveEvents: OrderStatusEvent[];
    /** Whether the WebSocket transport is connected (LIVE badge). */
    isLive: boolean;
    /** True while the first batch of live events is loading. */
    liveLoading: boolean;
    /** Degradation message from the live transport, if any. */
    liveError: string | null;
    /** Order ids that already have a review written from the orders page. */
    reviewedOrderIds: string[];
    /** Aggregated mock + user ratings per product name, shown on order items. */
    ratingsByProduct?: RatingsByProduct;
    /** Persist a review for a delivered order; resolves ok on success. */
    onReviewSubmit: (order: Order, rating: number, comment: string) => Promise<{ ok: boolean; error?: string }>;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
    'Pending': 'text-yellow-400 bg-yellow-950/40 border-yellow-500/20',
    'Tailoring': 'text-blue-400 bg-blue-950/40 border-[#4FC3F7]/20',
    'Shipped': 'text-purple-400 bg-purple-950/40 border-purple-500/20',
    'Delivered': 'text-green-400 bg-green-950/40 border-green-500/20',
};

const STATUS_ICONS: Record<OrderStatus, typeof Package> = {
    'Pending': Clock,
    'Tailoring': Package,
    'Shipped': Truck,
    'Delivered': CheckCircle,
};

const STEP_LABEL_KEYS: TranslationKey[] = ['orders.step.ordered', 'orders.step.sewing', 'orders.step.shipped', 'orders.step.received'];
const STEP_STATUSES: OrderStatus[] = ['Pending', 'Tailoring', 'Shipped', 'Delivered'];

const STATUS_LABEL_KEYS: Record<OrderStatus, TranslationKey> = {
    Pending: 'orders.status.pending',
    Tailoring: 'orders.status.tailoring',
    Shipped: 'orders.status.shipped',
    Delivered: 'orders.status.delivered',
};

export default function OrdersView({
    orders,
    liveStatuses,
    liveEvents,
    isLive,
    liveLoading,
    liveError,
    reviewedOrderIds,
    ratingsByProduct = {},
    onReviewSubmit,
}: OrdersViewProps) {
    const { t, language } = useLanguage();

    // Which order's review form is currently expanded (presentation state).
    const [openReviewOrderId, setOpenReviewOrderId] = useState<string | null>(null);

    // Live statuses win over the initial snapshot for the order cards below.
    const effectiveOrders = orders.map((order) => ({
        ...order,
        status: liveStatuses[order.id] ?? order.status,
    }));

    const handleReviewSubmit = async (order: Order, rating: number, comment: string) => {
        const result = await onReviewSubmit(order, rating, comment);
        if (result.ok) setOpenReviewOrderId(null);
        return result;
    };

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-10 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">
                            {t('orders.kicker')}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight flex items-center gap-3">
                            <ShoppingBag size={28} className="text-[#4FC3F7]" />
                            {t('orders.title')}
                        </h1>
                        {effectiveOrders.length > 0 && (
                            <p className="text-xs text-[#E8E0D5]/50 font-mono mt-1">
                                {t('orders.count', { count: effectiveOrders.length })}
                            </p>
                        )}
                    </div>

                    <Link
                        href={ROUTES.DASHBOARD_PROFILE}
                        className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300"
                    >
                        <ArrowLeft size={12} className="rtl:rotate-180" />
                        {t('orders.backToProfile')}
                    </Link>
                </div>
            </section>

            {effectiveOrders.length === 0 ? (
                /* Empty state */
                <section className="relative py-24 px-4 md:px-8 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex p-6 rounded-full bg-[#4FC3F7]/10 border border-[#4FC3F7]/20 mb-6">
                            <ShoppingBag size={40} className="text-[#4FC3F7]/60" />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-3">{t('orders.emptyTitle')}</h2>
                        <p className="text-sm text-[#E8E0D5]/60 max-w-md mx-auto mb-8 leading-relaxed">
                            {t('orders.emptyHint')}
                        </p>
                        <Link
                            href={ROUTES.STORE}
                            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 inline-block"
                        >
                            {t('orders.browseStore')}
                        </Link>
                    </motion.div>
                </section>
            ) : (
                /* Orders list */
                <section className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
                    {/* Live order status panel — receives raw orders + live statuses,
                        computes its own effective overlay (single source of truth). */}
                    <LiveOrderStatus
                        orders={orders}
                        statuses={liveStatuses}
                        events={liveEvents}
                        isLive={isLive}
                        loading={liveLoading}
                    />

                    {/* Live transport degradation notice */}
                    {liveError && !isLive && (
                        <div className="mb-6 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-mono text-amber-400/80 bg-amber-500/5 border border-amber-500/15">
                            <span>
                                {t('orders.degraded', { error: liveError ?? '' })}
                            </span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <AnimatePresence>
                            {effectiveOrders.map((ord, index) => {
                                const StatusIcon = STATUS_ICONS[ord.status];
                                const statusIdx = STEP_STATUSES.indexOf(ord.status);

                                return (
                                    <motion.div
                                        key={ord.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="bg-[#0F1535] border border-white/5 hover:border-[#C9A84C]/20 rounded-2xl p-6 transition-all duration-300"
                                    >
                                        {/* Order header */}
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-slate-400 uppercase">{t('orders.orderLabel')}</span>
                                                <span className="text-sm font-bold text-[#C9A84C] font-mono">{ord.id}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-mono">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={12} /> <span>{ord.date}</span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-mono border font-bold flex items-center gap-1 ${STATUS_COLORS[ord.status]}`}>
                                                    <StatusIcon size={10} /> {t(STATUS_LABEL_KEYS[ord.status])}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order items */}
                                        {ord.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 items-center py-2">
                                                <img src={item.image} alt={localizedOrderItemName(item, language)}
                                                    className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs md:text-sm font-serif text-white font-semibold truncate">{localizedOrderItemName(item, language)}</h4>
                                                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                                        {t('orders.sizeQty', { size: item.size, qty: item.quantity })}
                                                    </p>
                                                    {/* Aggregated product rating (mock + user reviews) */}
                                                    {ratingsByProduct[item.name] && (
                                                        <p className="flex items-center gap-1 mt-1 text-[10px]">
                                                            <Star
                                                                size={10}
                                                                className="text-[#C9A84C]"
                                                                fill="currentColor"
                                                            />
                                                            <span className="font-mono text-[#E8E0D5]">
                                                                {ratingsByProduct[item.name]!.average.toFixed(1)}
                                                            </span>
                                                            <span className="font-mono text-slate-500">
                                                                &middot; {t('orders.reviewCount', { count: ratingsByProduct[item.name]!.count })}
                                                            </span>
                                                        </p>
                                                    )}
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
                                                style={{ width: statusIdx === 0 ? '0%' : statusIdx === 1 ? '33%' : statusIdx === 2 ? '66%' : '100%' }}
                                            />
                                            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                                                {STEP_LABEL_KEYS.map((labelKey, stepIdx) => {
                                                    const isDone = stepIdx <= statusIdx;
                                                    return (
                                                        <div key={labelKey} className="flex flex-col items-center gap-1.5">
                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border font-mono text-[8px] font-bold transition-all duration-500 ${
                                                                isDone
                                                                    ? 'bg-[#C9A84C] text-[#0A0F2C] border-[#C9A84C] shadow-lg shadow-[#C9A84C]/25'
                                                                    : 'bg-[#0A0F2C] border-white/10 text-slate-500'
                                                            }`}>
                                                                {isDone && '✓'}
                                                            </div>
                                                            <span className={`text-[9px] font-serif font-bold uppercase tracking-wider ${
                                                                stepIdx === statusIdx ? 'text-[#C9A84C]' : 'text-slate-500'
                                                            }`}>
                                                                {t(labelKey)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Order footer */}
                                        <div className="mt-6 border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 font-mono gap-2 uppercase">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={10} />
                                                <strong>{t('orders.address')}</strong> {ord.shippingAddress}
                                            </div>
                                            <div className="whitespace-nowrap text-white font-bold">
                                                {t('orders.total')} <span className="text-[#C9A84C] font-extrabold text-sm">${ord.total.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Review — delivered orders only */}
                                        {ord.status === 'Delivered' && (
                                            <div className="mt-4 border-t border-white/5 pt-4">
                                                {reviewedOrderIds.includes(ord.id) ? (
                                                    <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                                                        <CheckCircle size={12} />
                                                        {t('orders.reviewSubmitted')}
                                                    </div>
                                                ) : openReviewOrderId === ord.id ? (
                                                    <ReviewForm
                                                        productName={ord.items[0]?.name ?? 'your piece'}
                                                        onSubmit={(rating, comment) => handleReviewSubmit(ord, rating, comment)}
                                                        onCancel={() => setOpenReviewOrderId(null)}
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setOpenReviewOrderId(ord.id)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-mono uppercase tracking-wider hover:bg-[#C9A84C]/20 transition-all duration-300 cursor-pointer"
                                                    >
                                                        <Star size={12} />
                                                        {t('orders.writeReview')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </section>
            )}

            {/* Bottom navigation */}
            {effectiveOrders.length > 0 && (
                <section className="py-8 px-4 md:px-8 max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                        <Link
                            href={ROUTES.DASHBOARD_PROFILE}
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <ArrowLeft size={11} className="rtl:rotate-180" />
                            {t('orders.backToProfile')}
                        </Link>
                        <span className="text-[#C9A84C]/30">&bull;</span>
                        <Link
                            href={ROUTES.STORE}
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <ShoppingBag size={11} />
                            {t('orders.continueShopping')}
                        </Link>
                        <span className="text-[#C9A84C]/30">&bull;</span>
                        <Link
                            href={ROUTES.WISHLIST}
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <Heart size={11} />
                            {t('orders.viewWishlist')}
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}
