'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ThumbsUp, MessageSquare, Quote, ChevronDown, Filter, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Review, ReviewSortOption, ReviewRatingFilter } from '../types';
import { RATING_FILTER_MIN } from '../types';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { localizedReviewComment, localizedReviewerName, localizedReviewTitle } from '@/features/i18n/productNames';
import { pdpReviewCountWord } from '@/shared/utils/countWord';

interface ReviewsViewProps {
    reviews: Review[];
}

export default function ReviewsView({ reviews }: ReviewsViewProps) {
    const { t } = useLanguage();
    const [sortBy, setSortBy] = useState<ReviewSortOption>('newest');
    const [filterVerified, setFilterVerified] = useState(false);
    const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>('all');
    // Exact-star filter driven by the interactive distribution bars — each
    // bar shows exactly that star count; pressing the active bar again
    // clears it. Clicking a bar resets the range chips to 'all' so the two
    // controls can never fight (a range + an exact star is always redundant
    // or empty).
    const [exactStarFilter, setExactStarFilter] = useState<number | null>(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const toggleExactStar = (star: number) => {
        setExactStarFilter((prev) => (prev === star ? null : star));
        setRatingFilter('all');
    };

    const sortedAndFiltered = useMemo(() => {
        const minRating = RATING_FILTER_MIN[ratingFilter];
        let result = reviews.filter((r) => r.rating >= minRating);
        if (exactStarFilter !== null) {
            result = result.filter((r) => r.rating === exactStarFilter);
        }
        if (filterVerified) {
            result = result.filter((r) => r.verified);
        }

        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'highest':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                result.sort((a, b) => a.rating - b.rating);
                break;
        }

        return result;
    }, [reviews, sortBy, filterVerified, ratingFilter, exactStarFilter]);

    // Aggregate stats
    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }, [reviews]);

    const ratingCounts = useMemo(() => {
        const counts = [0, 0, 0, 0, 0]; // index 0 = 1-star, index 4 = 5-star
        reviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) {
                counts[r.rating - 1]++;
            }
        });
        return counts;
    }, [reviews]);

    const sortLabels: Record<ReviewSortOption, string> = {
        newest: t('reviews.sort.newest'),
        highest: t('reviews.sort.highest'),
        lowest: t('reviews.sort.lowest'),
    };

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Hero Header */}
            <section className="relative py-16 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] via-[#1B2A6B]/15 to-[#0A0F2C] text-center overflow-hidden">
                <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#4FC3F7]/5 blur-[120px] pointer-events-none" />

                <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">
                    {t('reviews.page.kicker')}
                </span>
                <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight leading-none mb-4">
                    {t('reviews.page.titleBefore')} <span className="text-gold-gradient italic font-serif">{t('reviews.page.titleAccent')}</span>
                </h1>
                <p className="text-sm md:text-base text-[#E8E0D5]/70 max-w-2xl mx-auto font-sans tracking-wide leading-relaxed">
                    {t('reviews.page.subtitle')}
                </p>
            </section>

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Stats + Rating Summary */}
                <section className="py-10 grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-[#C9A84C]/5">
                    {/* Overall Rating */}
                    <div className="md:col-span-4 flex flex-col items-center md:items-start justify-center text-center md:text-left p-6 rounded-xl bg-gradient-to-br from-[#0A0F2C] to-[#1B2A6B]/30 border border-[#C9A84C]/10">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">{t('reviews.overallRating')}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-5xl font-serif text-white font-bold">
                                {reviews.length === 0 ? '—' : averageRating.toFixed(1)}
                            </span>
                            <div className="flex flex-col items-start gap-0.5">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            fill={star <= Math.round(averageRating) ? '#C9A84C' : 'none'}
                                            className={star <= Math.round(averageRating) ? 'text-[#C9A84C]' : 'text-slate-600'}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {reviews.length === 0 ? t('reviews.noReviewsYet') : `${reviews.length} ${pdpReviewCountWord(t, reviews.length)}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution Bars — each bar is a button that
                        filters to exactly that star count; press again to clear. */}
                    <div className="md:col-span-5 flex flex-col gap-1.5 justify-center">
                        {reviews.length === 0 ? (
                            <div className="flex flex-col items-center text-center gap-2 py-6">
                                <MessageSquare size={20} className="text-slate-500" />
                                <p className="text-xs text-slate-400">No reviews yet — be the first to share your experience.</p>
                            </div>
                        ) : (
                        [5, 4, 3, 2, 1].map((star) => {
                            const count = ratingCounts[star - 1];
                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            const active = exactStarFilter === star;
                            return (
                                <button
                                    key={star}
                                    onClick={() => toggleExactStar(star)}
                                    aria-pressed={active}
                                    title={active ? t('pdp.filterClear') : t('pdp.filterShow', { star })}
                                    className={`flex items-center gap-3 text-xs w-full rounded-lg px-2 py-1 transition-all duration-300 cursor-pointer ${
                                        active
                                            ? 'bg-[#C9A84C]/10 ring-1 ring-[#C9A84C]/40'
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <span
                                        className={`w-12 text-right font-mono transition-colors ${
                                            active ? 'text-[#C9A84C] font-bold' : 'text-slate-400'
                                        }`}
                                    >
                                        {star} ★
                                    </span>
                                    <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className={`h-full rounded-full transition-colors duration-300 ${
                                                active
                                                    ? 'bg-gradient-to-r from-[#C9A84C] to-[#F0D080]'
                                                    : 'bg-gradient-to-r from-[#C9A84C]/60 to-[#F0D080]/60'
                                            }`}
                                        />
                                    </div>
                                    <span
                                        className={`w-8 text-left font-mono transition-colors ${
                                            active ? 'text-[#C9A84C] font-bold' : count > 0 ? 'text-slate-500' : 'text-slate-600'
                                        }`}
                                    >
                                        {count > 0 ? count : '—'}
                                    </span>
                                </button>
                            );
                        })
                    )}
                    </div>

                    {/* Quick Quote */}
                    <div className="md:col-span-3 flex flex-col items-center md:items-start justify-center p-6 rounded-xl bg-[#0A0F2C]/80 border border-white/5">
                        <Quote size={20} className="text-[#C9A84C]/40 mb-2" />
                        <p className="text-xs text-slate-400 italic leading-relaxed">
                            &ldquo;{t('reviews.quote')}&rdquo;
                        </p>
                    </div>
                </section>

                {/* Filters Bar */}
                <section className="py-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#C9A84C]/5">
                    <div className="flex items-center gap-4">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:border-[#4FC3F7]/40 transition-all cursor-pointer"
                            >
                                <Filter size={12} />
                                <span className="font-mono uppercase tracking-wider">{sortLabels[sortBy]}</span>
                                <ChevronDown size={10} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showSortDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full start-0 mt-2 w-48 bg-[#0A0F2C] border border-[#C9A84C]/15 rounded-xl shadow-2xl z-20 overflow-hidden"
                                    >
                                        {(Object.keys(sortLabels) as ReviewSortOption[]).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setSortBy(key);
                                                    setShowSortDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                                                    sortBy === key
                                                        ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                {sortLabels[key]}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Rating Filter (All / 4★+ / 3★+) */}
                        <div className="flex items-center gap-1.5">
                            {(
                                [
                                    { value: 'all', label: t('reviews.rating.all') },
                                    { value: 'fourPlus', label: t('reviews.rating.fourPlus') },
                                    { value: 'threePlus', label: t('reviews.rating.threePlus') },
                                ] as { value: ReviewRatingFilter; label: string }[]
                            ).map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setRatingFilter(option.value)}
                                    className={`px-3 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${ 
                                        ratingFilter === option.value
                                            ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30'
                                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Verified Filter */}
                        <button
                            onClick={() => setFilterVerified(!filterVerified)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                filterVerified
                                    ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30'
                                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                            }`}
                        >
                            <CheckCircle size={12} />
                            {t('reviews.verifiedOnly')}
                        </button>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                        {t('reviews.showing', { shown: sortedAndFiltered.length, total: reviews.length, word: pdpReviewCountWord(t, reviews.length) })}
                    </span>
                </section>

                {/* Reviews List */}
                <section className="py-8">
                    <AnimatePresence mode="wait">
                        {sortedAndFiltered.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-16 text-center"
                            >
                                <MessageSquare size={24} className="mx-auto text-slate-500 mb-4" />
                                <p className="text-sm text-slate-400">
                                    {filterVerified
                                        ? t('reviews.empty.verified')
                                        : exactStarFilter !== null
                                            ? t('reviews.empty.star', { star: exactStarFilter })
                                            : t('reviews.empty.all')}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                                {sortedAndFiltered.map((review) => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
}

// ─── Review Card Component ────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
    const { t, language } = useLanguage();
    const [liked, setLiked] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-5 p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/5 hover:border-[#C9A84C]/20 transition-all duration-300"
        >
            {/* Product Thumbnail */}
            <Link
                href={review.productHref}
                className="relative w-full sm:w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/5 group"
            >
                <Image
                    src={review.productImage}
                    alt={review.productName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </Link>

            <div className="flex-1 min-w-0">
                {/* Header: Product + Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <Link href={review.productHref} className="text-xs font-mono text-[#4FC3F7] hover:text-[#C9A84C] transition-colors uppercase tracking-wider truncate">
                        {review.productName}
                    </Link>
                    <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={12}
                                fill={star <= review.rating ? '#C9A84C' : 'none'}
                                className={star <= review.rating ? 'text-[#C9A84C]' : 'text-slate-600'}
                            />
                        ))}
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-serif text-white text-sm font-semibold mb-1">{localizedReviewTitle(review, language)}</h3>

                {/* Comment */}
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{localizedReviewComment(review, language)}</p>

                {/* Footer: User + Date + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#4FC3F7] flex items-center justify-center text-[8px] font-bold text-white overflow-hidden shrink-0">
                            {review.userAvatar ? (
                                <img src={review.userAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                localizedReviewerName(review, language).charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-300 font-medium">{localizedReviewerName(review, language)}</span>
                            {review.isMine && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-[#A78BFA]/20 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider border border-[#A78BFA]/40 font-bold">
                                    {t('reviews.you')}
                                </span>
                            )}
                            {review.verified && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider">
                                    {t('reviews.verified')}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] text-slate-600 font-mono">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                            {review.editedAt && (
                                <span className="text-[#C9A84C]/70"> · {t('reviews.edited')}</span>
                            )}
                        </span>
                    </div>

                    <button
                        onClick={() => setLiked(!liked)}
                        className={`flex items-center gap-1 text-[10px] font-mono transition-all cursor-pointer ${
                            liked ? 'text-[#C9A84C]' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <ThumbsUp size={11} fill={liked ? '#C9A84C' : 'none'} />
                        <span>{liked ? t('reviews.helpful') : t('reviews.markHelpful')}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
