'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag,
    UserPlus,
    Cpu,
    MessageSquare,
    Tag,
    Activity,
    Wifi,
    WifiOff,
    Trash2,
    ArrowDown,
} from 'lucide-react';
import type { LiveEvent } from '../types';
import { formatEventTime } from '@/utils/formatEventTime';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';

interface LiveEventsFeedProps {
    /** Latest events from the analytics payload (most recent first). */
    events: LiveEvent[];
    /** Whether the WebSocket transport is connected (LIVE badge). */
    isLive: boolean;
}

const EVENT_STYLES: Record<LiveEvent['type'], { icon: typeof ShoppingBag; color: string; labelKey: TranslationKey }> = {
    order: { icon: ShoppingBag, color: 'text-[#4FC3F7] bg-[#4FC3F7]/10', labelKey: 'analytics.feed.type.order' },
    signup: { icon: UserPlus, color: 'text-emerald-400 bg-emerald-400/10', labelKey: 'analytics.feed.type.signup' },
    ai: { icon: Cpu, color: 'text-[#C9A84C] bg-[#C9A84C]/10', labelKey: 'analytics.feed.type.ai' },
    review: { icon: MessageSquare, color: 'text-purple-400 bg-purple-400/10', labelKey: 'analytics.feed.type.review' },
    promotion: { icon: Tag, color: 'text-pink-400 bg-pink-400/10', labelKey: 'analytics.feed.type.promotion' },
};

/** Cap on how many events stay in the feed list. */
const MAX_FEED_EVENTS = 30;

/**
 * Live Events Feed — streams real-time activity (orders, signups, AI
 * generations, reviews, promotions) from the analytics payload.
 *
 * The payload already arrives every ~3s via WS → SSE → polling (the same
 * transport as the charts). This component only manages the client-side
 * list: it dedupes by id, prepends fresh entries, caps the list, and
 * animates each new row so the feed feels live.
 */
export default function LiveEventsFeed({ events, isLive }: LiveEventsFeedProps) {
    const { t, language } = useLanguage();
    const [feed, setFeed] = useState<LiveEvent[]>(() => events.slice(0, MAX_FEED_EVENTS));
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);

    // Seed seen-ids once from the initial events so they don't re-animate.
    useEffect(() => {
        events.forEach((event) => seenIdsRef.current.add(event.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Append fresh events (deduped by id), newest first.
    useEffect(() => {
        setFeed((prev) => {
            const fresh = events.filter((event) => !seenIdsRef.current.has(event.id));
            if (fresh.length === 0) return prev;
            fresh.forEach((event) => seenIdsRef.current.add(event.id));
            const merged = [...fresh, ...prev];
            return merged.slice(0, MAX_FEED_EVENTS);
        });
    }, [events]);

    // Auto-scroll to the newest (top) entry unless the user scrolled down.
    useEffect(() => {
        if (isAutoScroll && listRef.current) {
            listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [feed.length, isAutoScroll]);

    const handleClear = useCallback(() => {
        setFeed([]);
        seenIdsRef.current.clear();
    }, []);

    return (
        <div className="mb-6 p-4 bg-[#05081A]/70 border border-white/5 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]"><Activity size={12} /></div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('analytics.feed.title')}
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                        isLive ? 'text-green-400' : 'text-amber-400/80'
                    }`}>
                        {isLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {isLive ? t('analytics.feed.live') : t('analytics.feed.polling')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {feed.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono text-[#E8E0D5]/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                            title={t('analytics.feed.clearTitle')}
                        >
                            <Trash2 size={9} /> {t('analytics.feed.clear')}
                        </button>
                    )}
                    <span className="text-[9px] font-mono text-[#E8E0D5]/30">{t('analytics.feed.events', { count: feed.length })}</span>
                </div>
            </div>

            {/* Auto-scroll toggle — sticky within the panel */}
            {feed.length > 8 && (
                <button
                    onClick={() => setIsAutoScroll((prev) => !prev)}
                    className={`flex items-center gap-1 mb-2 text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                        isAutoScroll ? 'text-[#4FC3F7]/70 hover:text-[#4FC3F7]' : 'text-[#E8E0D5]/40 hover:text-white'
                    }`}
                    title={isAutoScroll ? t('analytics.feed.autoscrollOnTitle') : t('analytics.feed.autoscrollOffTitle')}
                >
                    <ArrowDown size={9} className={isAutoScroll ? 'animate-bounce' : ''} />
                    {isAutoScroll ? t('analytics.feed.autoscrollOn') : t('analytics.feed.autoscrollOff')}
                </button>
            )}

            {/* Event list */}
            <div
                ref={listRef}
                className="max-h-72 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1.5"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    // If the user scrolls away from the top, pause auto-scroll.
                    setIsAutoScroll(el.scrollTop < 8);
                }}
            >
                {feed.length === 0 ? (
                    <p className="text-[9px] font-mono text-[#E8E0D5]/30 italic px-2 py-1.5">
                        {t('analytics.feed.empty')}
                    </p>
                ) : (
                    <AnimatePresence initial={false}>
                        {feed.map((event, index) => {
                            const style = EVENT_STYLES[event.type] ?? EVENT_STYLES.order;
                            const Icon = style.icon;
                            const isNewest = index === 0;
                            return (
                                <motion.div
                                    key={event.id}
                                    layout
                                    initial={isNewest ? { opacity: 0, y: -10, scale: 0.97 } : false}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className={`flex items-start gap-3 px-3 py-2 rounded-lg transition-colors ${
                                        isNewest ? 'bg-[#C9A84C]/5 border border-[#C9A84C]/15' : 'bg-[#0A0F2C]/40 hover:bg-[#0A0F2C]/70'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg shrink-0 ${style.color}`}>
                                        <Icon size={11} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-semibold text-white truncate">
                                                {event.title}
                                            </span>
                                            <span className="text-[8px] font-mono text-[#E8E0D5]/40 shrink-0 whitespace-nowrap">
                                                {formatEventTime(event.timestamp, language)}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-[#E8E0D5]/50 leading-relaxed truncate">
                                            {event.message}
                                        </p>
                                    </div>
                                    <span className="text-[7px] font-mono uppercase tracking-wider text-[#E8E0D5]/25 shrink-0 mt-0.5">
                                        {t(style.labelKey)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
