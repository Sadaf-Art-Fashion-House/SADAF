'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
    Package,
    Wifi,
    WifiOff,
    Activity,
    RefreshCw,
} from 'lucide-react';
import type { Order, OrderStatus, OrderStatusEvent } from '../types';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { formatEventTime } from '@/utils/formatEventTime';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface LiveOrderStatusProps {
    /** The customer's orders (statuses may be overridden by live events). */
    orders: Order[];
    /** Latest status per order, overlaid from real-time events. */
    statuses: Record<string, OrderStatus>;
    /** Recent order-status transitions (newest first). */
    events: OrderStatusEvent[];
    /** Whether the WebSocket transport is connected (LIVE badge). */
    isLive: boolean;
    /** True while the first batch of events is still loading. */
    loading?: boolean;
}

const STATUS_FLOW: OrderStatus[] = ['Pending', 'Tailoring', 'Shipped', 'Delivered'];

/**
 * The live transport (WS/API) sends English-only transition messages as data.
 * Map the known templates to translation keys so the feed renders in the
 * active language; unknown messages fall back to their raw text.
 */
const FEED_MESSAGE_KEYS: Readonly<Record<string, TranslationKey>> = {
    'Your piece has entered the atelier — our artisans are sewing it by hand.': 'orders.feed.tailoring',
    'Your order has shipped from the atelier and is on its way.': 'orders.feed.shipped',
    'Delivered! We hope your piece brings you joy.': 'orders.feed.delivered',
    'Your new order has been placed — our artisans will begin tailoring it soon.': 'orders.feed.placed',
};

function localizeEventMessage(message: string, t: (key: TranslationKey) => string): string {
    const key = FEED_MESSAGE_KEYS[message];
    return key ? t(key) : message;
}

const STATUS_STYLES: Record<OrderStatus, { color: string; dot: string; labelKey: TranslationKey }> = {
    Pending: { color: 'text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400', labelKey: 'orders.status.pending' },
    Tailoring: { color: 'text-[#4FC3F7] border-[#4FC3F7]/30', dot: 'bg-[#4FC3F7]', labelKey: 'orders.status.tailoring' },
    Shipped: { color: 'text-purple-400 border-purple-500/30', dot: 'bg-purple-400', labelKey: 'orders.status.shipped' },
    Delivered: { color: 'text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', labelKey: 'orders.status.delivered' },
};

/**
 * Live Order Status — streams the customer's order transitions (Pending →
 * Tailoring → Shipped → Delivered) in real time via the per-user WebSocket
 * channel. Each order renders an animated stepper; incoming events overlay
 * the latest status and animate the progress line. A compact transition
 * feed below lists the most recent updates.
 */
export default function LiveOrderStatus({
    orders,
    statuses,
    events,
    isLive,
    loading = false,
}: LiveOrderStatusProps) {
    const { t, language } = useLanguage();

    // Resolve each order's effective status (live events win over initial data).
    const effectiveOrders = orders.map((order) => ({
        ...order,
        status: statuses[order.id] ?? order.status,
    }));

    // Fresh orders that arrived live (kind: 'placed') and are not yet part of
    // the static order list — rendered as NEW cards below the tracked orders.
    const knownOrderIds = new Set(orders.map((order) => order.id));
    const newOrders = events.filter((event) => event.kind === 'placed' && !knownOrderIds.has(event.orderId));

    return (
        <div className="mb-10 p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                        <Package size={14} />
                    </div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('orders.liveTitle')}
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                        isLive ? 'text-green-400' : 'text-amber-400/80'
                    }`}>
                        {isLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {isLive ? t('orders.live') : t('orders.polling')}
                    </span>
                </div>
                {events.length > 0 && (
                    <span className="text-[9px] font-mono text-[#E8E0D5]/30">
                        {t('orders.updates', { count: events.length })}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Order steppers */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    {effectiveOrders.length === 0 ? (
                        <p className="text-[9px] font-mono text-[#E8E0D5]/30 italic px-2 py-4">
                            {t('orders.noOrdersToTrack')}
                        </p>
                    ) : (
                        effectiveOrders.map((order, index) => {
                            const statusIdx = STATUS_FLOW.indexOf(order.status);
                            const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.Pending;
                            const progress = statusIdx === 0 ? '0%' : `${(statusIdx / (STATUS_FLOW.length - 1)) * 100}%`;
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.08 }}
                                    className="p-4 bg-[#0A0F2C]/60 border border-white/[0.05] rounded-2xl"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-mono font-bold text-[#C9A84C]">{order.id}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono border font-bold ${style.color}`}>
                                            {t(style.labelKey)}
                                        </span>
                                    </div>

                                    {/* Item + fulfilment summary */}
                                    <div className="flex items-center gap-3 mb-4">
                                        {order.items[0]?.image && (
                                            <img
                                                src={order.items[0].image}
                                                alt={order.items[0].name}
                                                className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-serif text-white font-semibold truncate">{order.items[0]?.name ?? t('orders.orderLabel')}</p>
                                            <p className="text-[8px] font-mono text-[#E8E0D5]/40">
                                                {t('orders.total')} ${order.total.toLocaleString()}
                                                {order.estimatedDelivery ? ` · ${t('orders.eta')}: ${order.estimatedDelivery}` : ''}
                                            </p>
                                        </div>
                                        {order.trackingId && (
                                            <span className="text-[8px] font-mono text-[#E8E0D5]/35 shrink-0">{order.trackingId}</span>
                                        )}
                                    </div>

                                    {/* Stepper */}
                                    <div className="relative">
                                        <div className="absolute top-[9px] left-3 right-3 h-[2px] bg-white/5 z-0" />
                                        <motion.div
                                            className="absolute top-[9px] left-3 h-[2px] bg-gradient-to-r from-[#C9A84C] to-[#4FC3F7] z-0"
                                            initial={false}
                                            animate={{ width: progress }}
                                            transition={{ duration: 1.0, ease: 'easeOut' }}
                                        />
                                        <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                                            {STATUS_FLOW.map((step, stepIdx) => {
                                                const isDone = stepIdx <= statusIdx;
                                                return (
                                                    <div key={step} className="flex flex-col items-center gap-1.5">
                                                        <div className={`w-[10px] h-[10px] rounded-full border transition-all duration-500 ${
                                                            isDone ? `${style.dot} border-transparent shadow-lg` : 'bg-[#0A0F2C] border-white/15'
                                                        }`} />
                                                        <span className={`text-[8px] font-mono uppercase tracking-wider ${
                                                            stepIdx === statusIdx ? 'text-white font-bold' : 'text-[#E8E0D5]/35'
                                                        }`}>
                                                            {t(STATUS_STYLES[step].labelKey)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}

                    {/* Live new-order cards */}
                    {newOrders.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-[#0A0F2C]/60 border border-[#C9A84C]/25 rounded-2xl"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono font-bold text-[#C9A84C]">{event.orderId}</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                                    {t('orders.newOrder')}
                                </span>
                            </div>
                            <p className="text-[9px] text-[#E8E0D5]/60 leading-relaxed">{localizeEventMessage(event.message, t)}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Transition feed */}
                <div className="lg:col-span-2 p-4 bg-[#0A0F2C]/40 border border-white/[0.05] rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity size={11} className="text-[#C9A84C]" />
                        <h4 className="text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 font-bold">
                            {t('orders.recentUpdates')}
                        </h4>
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                        {events.length === 0 && loading ? (
                            <p className="text-[9px] font-mono text-[#E8E0D5]/40 italic px-2 py-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                                {t('orders.connecting')}
                            </p>
                        ) : events.length === 0 ? (
                            <p className="text-[9px] font-mono text-[#E8E0D5]/30 italic px-2 py-2">
                                {t('orders.streamHint')}
                            </p>
                        ) : (
                            <AnimatePresence initial={false}>
                                {events.map((event, index) => {
                                    const prevStyle = STATUS_STYLES[event.previousStatus] ?? STATUS_STYLES.Pending;
                                    const nextStyle = STATUS_STYLES[event.status] ?? STATUS_STYLES.Pending;
                                    const isNewest = index === 0;
                                    return (
                                        <motion.div
                                            key={event.id}
                                            layout
                                            initial={isNewest ? { opacity: 0, y: -8, scale: 0.98 } : false}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                            className={`px-3 py-2 rounded-xl ${
                                                isNewest
                                                    ? 'bg-[#C9A84C]/5 border border-[#C9A84C]/15'
                                                    : 'bg-[#05081A]/40 border border-white/[0.03]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-[10px] font-mono text-[#C9A84C] truncate">{event.orderId}</span>
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/35 shrink-0">
                                                    {formatEventTime(event.timestamp, language)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {event.kind === 'placed' ? (
                                                    <span className="text-[8px] font-mono uppercase border px-1.5 py-px rounded border-emerald-500/30 text-emerald-400 font-bold">
                                                        {t('orders.newOrder')}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className={`text-[8px] font-mono uppercase border px-1.5 py-px rounded ${prevStyle.color}`}>
                                                            {t(prevStyle.labelKey)}
                                                        </span>
                                                        <RefreshCw size={8} className="text-[#E8E0D5]/40 shrink-0" />
                                                        <span className={`text-[8px] font-mono uppercase border px-1.5 py-px rounded ${nextStyle.color}`}>
                                                            {t(nextStyle.labelKey)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[8px] text-[#E8E0D5]/50 leading-relaxed">
                                                {localizeEventMessage(event.message, t)}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
