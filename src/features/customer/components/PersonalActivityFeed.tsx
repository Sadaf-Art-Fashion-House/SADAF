'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag,
    Palette,
    Heart,
    Tag,
    Activity,
    Wifi,
    WifiOff,
    Trash2,
    ArrowDown,
    BellRing,
    BellOff,
    Volume2,
    VolumeX,
} from 'lucide-react';
import type { PersonalActivityEvent } from '../types';
import { formatEventTime } from '@/utils/formatEventTime';
import { useActivityAlerts } from '../hooks/useActivityAlerts';

interface PersonalActivityFeedProps {
    /** Personal activity events for the logged-in user (most recent first). */
    events: PersonalActivityEvent[];
    /** Whether the WebSocket transport is connected (LIVE badge). */
    isLive: boolean;
    /** True while the first batch of events is still loading. */
    loading?: boolean;
}

const EVENT_STYLES: Record<PersonalActivityEvent['type'], { icon: typeof ShoppingBag; color: string; label: string }> = {
    order: { icon: ShoppingBag, color: 'text-[#C9A84C] bg-[#C9A84C]/10', label: 'Order' },
    design: { icon: Palette, color: 'text-[#4FC3F7] bg-[#4FC3F7]/10', label: 'Design' },
    wishlist: { icon: Heart, color: 'text-pink-400 bg-pink-400/10', label: 'Wishlist' },
    promotion: { icon: Tag, color: 'text-emerald-400 bg-emerald-400/10', label: 'Offer' },
};

/** Cap on how many events stay in the feed list. */
const MAX_FEED_EVENTS = 30;

/**
 * Personal Activity Feed — streams the logged-in customer's real-time
 * activity (orders placed, designs saved, wishlist updates, offers).
 *
 * Events arrive via WebSocket (`personal:user:{userId}`) or REST polling.
 * This component only manages the client-side list: it dedupes by id,
 * prepends fresh entries, caps the list, and animates each new row.
 *
 * Two optional alert toggles sit in the header (browser Notification +
 * soft chime), mirroring the NotificationBell pattern — opt-in, persisted
 * in localStorage by useActivityAlerts.
 */
export default function PersonalActivityFeed({ events, isLive, loading = false }: PersonalActivityFeedProps) {
    const [feed, setFeed] = useState<PersonalActivityEvent[]>(() => events.slice(0, MAX_FEED_EVENTS));
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);

    const {
        preferences: alerts,
        isSupported: areNotificationsSupported,
        permissionDenied,
        toggleBrowserAlerts,
        toggleSoundAlerts,
    } = useActivityAlerts(events);

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
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]"><Activity size={12} /></div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        My Activity
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest ${
                        isLive ? 'text-green-400' : 'text-amber-400/80'
                    }`}>
                        {isLive ? <Wifi size={9} /> : <WifiOff size={9} />}
                        {isLive ? 'Live' : 'Polling'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Browser notification toggle */}
                    {areNotificationsSupported && (
                        <button
                            onClick={toggleBrowserAlerts}
                            title={
                                permissionDenied
                                    ? 'Notifications are blocked in this browser — allow them in site settings to re-enable'
                                    : alerts.browser
                                        ? 'Browser alerts ON — click to mute'
                                        : 'Browser alerts OFF — click to enable'
                            }
                            aria-label={
                                alerts.browser ? 'Disable browser alerts for new activity' : 'Enable browser alerts for new activity'
                            }
                            aria-pressed={alerts.browser}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                                alerts.browser
                                    ? 'text-[#4FC3F7] border-[#4FC3F7]/30 hover:border-[#4FC3F7]/60 bg-[#4FC3F7]/10'
                                    : 'text-[#E8E0D5]/40 border-white/10 hover:text-[#4FC3F7]/80 hover:border-[#4FC3F7]/30'
                            }`}
                        >
                            {alerts.browser ? <BellRing size={9} /> : <BellOff size={9} />}
                            {alerts.browser ? 'Notify' : 'Silent'}
                        </button>
                    )}

                    {/* Sound alert toggle */}
                    <button
                        onClick={toggleSoundAlerts}
                        title={
                            alerts.sound
                                ? 'Sound alerts ON — click to mute'
                                : 'Sound alerts OFF — click to enable (plays a soft chime)'
                        }
                        aria-label={
                            alerts.sound ? 'Disable sound alert for new activity' : 'Enable sound alert for new activity'
                        }
                        aria-pressed={alerts.sound}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                            alerts.sound
                                ? 'text-emerald-400 border-emerald-400/30 hover:border-emerald-400/60 bg-emerald-400/10'
                                : 'text-[#E8E0D5]/40 border-white/10 hover:text-emerald-400/80 hover:border-emerald-400/30'
                        }`}
                    >
                        {alerts.sound ? <Volume2 size={9} /> : <VolumeX size={9} />}
                        {alerts.sound ? 'Sound' : 'Muted'}
                    </button>

                    {feed.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono text-[#E8E0D5]/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                            title="Clear activity feed"
                        >
                            <Trash2 size={9} /> Clear
                        </button>
                    )}
                    <span className="text-[9px] font-mono text-[#E8E0D5]/30">{feed.length} events</span>
                </div>
            </div>

            {/* Auto-scroll toggle — sticky within the panel */}
            {feed.length > 8 && (
                <button
                    onClick={() => setIsAutoScroll((prev) => !prev)}
                    className={`flex items-center gap-1 mb-2 text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                        isAutoScroll ? 'text-[#4FC3F7]/70 hover:text-[#4FC3F7]' : 'text-[#E8E0D5]/40 hover:text-white'
                    }`}
                    title={isAutoScroll ? 'Auto-scroll to newest events is ON' : 'Auto-scroll is OFF'}
                >
                    <ArrowDown size={9} className={isAutoScroll ? 'animate-bounce' : ''} />
                    {isAutoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
                </button>
            )}

            {/* Event list */}
            <div
                ref={listRef}
                className="max-h-72 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1.5"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    setIsAutoScroll(el.scrollTop < 8);
                }}
            >
                {feed.length === 0 && loading ? (
                    <p className="text-[9px] font-mono text-[#E8E0D5]/40 italic px-2 py-1.5 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
                        Connecting to your live activity…
                    </p>
                ) : feed.length === 0 ? (
                    <p className="text-[9px] font-mono text-[#E8E0D5]/30 italic px-2 py-1.5">
                        No activity yet — your orders, saved designs, and offers will stream here in real time.
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
                                                {formatEventTime(event.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-[#E8E0D5]/50 leading-relaxed truncate">
                                            {event.message}
                                        </p>
                                    </div>
                                    <span className="text-[7px] font-mono uppercase tracking-wider text-[#E8E0D5]/25 shrink-0 mt-0.5">
                                        {style.label}
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
