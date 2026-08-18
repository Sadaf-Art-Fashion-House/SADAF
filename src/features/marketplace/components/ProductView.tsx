'use client';

/**
 * SADAF | Marketplace — Product Detail View (pure presentation)
 *
 * Renders a single product: breadcrumb, image gallery (with hover alt
 * image), and a configuration panel (size, color, quantity, add to cart,
 * wishlist) plus related products. All state/handlers come from
 * ProductPageClient via props; related cards link back to their own PDPs.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SmartClamp } from '@/shared/ui/SmartClamp';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronRight,
    Check,
    Heart,
    Minus,
    Plus,
    ShoppingBag,
    Share2,
    Star,
    PenLine,
    CheckCircle2,
    Pencil,
    Trash2,
    AlertTriangle,
    X,
} from 'lucide-react';
import { DirectionalIcon } from '@/shared/ui/DirectionalIcon';
import type { FashionProduct } from '@/shared/types';
import type { Review } from '@/features/reviews/types';
import type { RatingCounts } from './ProductPageClient';
import type { RatingsByProduct } from '@/features/reviews/hooks/useAggregatedRatings';
import ReviewForm from '@/features/reviews/components/ReviewForm';
import { ROUTES } from '@/config/routes';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { pdpReviewCountWord, reviewCountWord } from '@/shared/utils/countWord';
import StarRatingRow from '@/shared/components/StarRatingRow';
import { ShareLinks } from '@/shared/components/ShareLinks';
import { localizedColorLabel, localizedColorName, localizedProductDescription, localizedProductDetails, localizedProductFabric, localizedProductName, localizedReviewComment, localizedReviewerName, localizedReviewTitle } from '@/features/i18n/productNames';

interface ProductViewProps {
    product: FashionProduct;
    relatedProducts: FashionProduct[];
    /** Aggregated mock + user ratings per related product (null = no reviews yet). */
    relatedRatings?: RatingsByProduct;
    /** Combined average from catalog + user reviews — falls back to the
     * catalog's editorial rating when null (no reviews yet). */
    ratingSummary?: { average: number; count: number } | null;
    /** Star-level counts (index 0 = 1★ … index 4 = 5★) for the bars. */
    ratingCounts?: RatingCounts;
    /** All reviews for this product (newest first) — the card shows the
     * latest two and can expand to the full list; the distribution bars
     * filter it by exact star count. */
    reviews?: Review[];
    /** True while the reviews:global WebSocket channel is connected. */
    wsLive?: boolean;
    /** Product whose rating just changed over WS — its summary pulses. */
    lastLiveProductId?: string | null;
    /** Timestamp of the last live rating change (key for the pulse). */
    lastLiveAt?: number | null;
    /** Whether the signed-in user already reviewed this product — hides the form. */
    hasReviewedProduct?: boolean;
    /** The signed-in user's own review for this product — shown under the
     * "You reviewed this piece" state with an edit action. */
    myReview?: Review | null;
    /** Persist a review written from the PDP — same contract as the orders form. */
    onSubmitReview: (rating: number, comment: string) => Promise<{ ok: boolean; error?: string }>;
    /** Update the user's own review (edit mode) — same contract as submit. */
    onUpdateReview: (rating: number, comment: string) => Promise<{ ok: boolean; error?: string }>;
    /** Delete the user's own review — same contract as submit. */
    onDeleteReview: (reviewId: string) => Promise<{ ok: boolean; error?: string }>;
    isWishlisted: boolean;
    onAddToCart: (size: string, color: string) => void;
    onToggleWishlist: () => void;
}

export default function ProductView({
    product,
    relatedProducts,
    relatedRatings = {},
    ratingSummary,
    ratingCounts = [0, 0, 0, 0, 0],
    reviews = [],
    wsLive = false,
    lastLiveProductId = null,
    lastLiveAt = null,
    hasReviewedProduct = false,
    myReview = null,
    onSubmitReview,
    onUpdateReview,
    onDeleteReview,
    isWishlisted,
    onAddToCart,
    onToggleWishlist,
}: ProductViewProps) {
    const { t, language } = useLanguage();

    const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? '');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name ?? '');
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    // Delete flow — confirm card replaces the review body, then a toast
    // confirms (green) or reports the failure (red), same pattern as the
    // cart-clear confirmation.
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteToast, setDeleteToast] = useState<'removed' | 'error' | null>(null);

    // Share popover — the URL is built lazily on open (client-only window
    // access, SSR-safe); the popover closes via a fixed backdrop.
    const [showShare, setShowShare] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    const openShare = () => {
        setShareUrl(`${window.location.origin}${ROUTES.STORE}/${product.id}`);
        setShowShare(true);
    };

    const handleConfirmDelete = async () => {
        if (!myReview) return;
        const result = await onDeleteReview(myReview.id);
        setShowDeleteConfirm(false);
        setDeleteToast(result.ok ? 'removed' : 'error');
        window.setTimeout(() => setDeleteToast(null), 3_000);
    };

    // Interactive distribution: clicking a bar filters the reviews to exactly
    // that star count; pressing it again clears (same pattern as /reviews).
    const [exactStarFilter, setExactStarFilter] = useState<number | null>(null);
    // Expanded state — "Latest reviews" shows two by default, all when open.
    const [showAllReviews, setShowAllReviews] = useState(false);

    const filteredReviews =
        exactStarFilter === null
            ? reviews
            : reviews.filter((r) => r.rating === exactStarFilter);
    const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 2);

    const handleAdd = () => {
        onAddToCart(selectedSize, selectedColor);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2_500);
    };

    return (
        <div className="min-h-screen bg-[#0A0F2C] pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                {/* Breadcrumb */}
                <nav aria-label={t('pdp.breadcrumbAria')} className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-8">
                    <Link href={ROUTES.STORE} className="hover:text-[#C9A84C] transition-colors">
                        {t('pdp.breadcrumb')}
                    </Link>
                    <DirectionalIcon icon={ChevronRight} size={11} />
                    <span className="text-[#E8E0D5]/60">{product.category}</span>
                    <DirectionalIcon icon={ChevronRight} size={11} />
                    <span className="text-[#C9A84C]">{localizedProductName(product, language)}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Gallery */}
                    <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                        <Image
                            src={product.image}
                            alt={localizedProductName(product, language)}
                            fill
                            priority
                            className="object-cover transition-all duration-[800ms] group-hover:scale-105"
                        />
                        {product.hoverImage && (
                            <Image
                                src={product.hoverImage}
                                alt={t('pdp.altView', { name: localizedProductName(product, language) })}
                                fill
                                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                            />
                        )}
                    </div>

                    {/* Configuration */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <span className="text-[9px] uppercase font-mono text-[#4FC3F7] tracking-[0.25em]">
                                {product.category} {t('pdp.label')}
                            </span>
                            <h1 className="font-serif text-2xl md:text-3xl text-white uppercase tracking-tight mt-2 leading-tight">
                                {localizedProductName(product, language)}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                {wsLive && (
                                    <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-mono uppercase tracking-widest"
                                        title={t('common.live')}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {t('common.live')}
                                    </span>
                                )}
                                <motion.span
                                    key={
                                        lastLiveProductId === product.id && lastLiveAt !== null
                                            ? `live-${lastLiveAt}`
                                            : `static-${product.id}`
                                    }
                                    initial={
                                        lastLiveProductId === product.id && lastLiveAt !== null
                                            ? { scale: 1.3, opacity: 0.5 }
                                            : false
                                    }
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className="text-[10px] font-mono text-[#F0D080]"
                                >
                                    ★ {ratingSummary ? ratingSummary.average.toFixed(1) : product.rating}
                                </motion.span>
                                <span className="text-[9px] font-mono text-slate-500">
                                    {ratingSummary
                                        ? `${ratingSummary.count} ${pdpReviewCountWord(t, ratingSummary.count)} ${t('pdp.reviewFromCustomers')}`
                                        : t('pdp.editorRating')}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                    {localizedProductFabric(product, language)}
                                </span>
                            </div>
                        </div>

                        <p className="text-3xl font-serif text-[#C9A84C] font-bold">
                            ${product.price.toLocaleString()}
                        </p>

                        <p className="text-sm text-[#E8E0D5]/70 leading-relaxed">
                            {localizedProductDescription(product, language)}
                        </p>

                        {/* Rating breakdown: star distribution + latest reviews, under the description */}
                        {ratingSummary && ratingSummary.count > 0 && (
                            <div className="p-5 rounded-2xl bg-[#0F1535] border border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-serif text-3xl text-white leading-none">
                                        {ratingSummary.average.toFixed(1)}
                                    </span>
                                    <div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={12}
                                                    fill={star <= Math.round(ratingSummary.average) ? '#C9A84C' : 'none'}
                                                    className={
                                                        star <= Math.round(ratingSummary.average)
                                                            ? 'text-[#C9A84C]'
                                                            : 'text-slate-600'
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {ratingSummary.count} {pdpReviewCountWord(t, ratingSummary.count)} {t('pdp.reviewFromCustomers')}
                                        </span>
                                    </div>
                                    <Link
                                        href={ROUTES.REVIEWS}
                                        className="ml-auto inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#4FC3F7] hover:text-[#C9A84C] transition-colors"
                                    >
                                        {t('pdp.viewAll')} <DirectionalIcon icon={ChevronRight} size={10} />
                                    </Link>
                                </div>

                                {/* Star distribution bars — each bar is a button
                                    that filters the reviews to exactly that star
                                    count; press again to clear (same as /reviews). */}
                                <div className="flex flex-col gap-1 mb-4">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = ratingCounts[star - 1];
                                        const pct = ratingSummary.count > 0 ? (count / ratingSummary.count) * 100 : 0;
                                        const active = exactStarFilter === star;
                                        return (
                                            <button
                                                key={star}
                                                onClick={() =>
                                                    setExactStarFilter((prev) => (prev === star ? null : star))
                                                }
                                                aria-pressed={active}
                                                title={active ? t('pdp.filterClear') : t('pdp.filterShow', { star })}
                                                className={`flex items-center gap-3 text-xs w-full rounded-lg px-1.5 py-0.5 transition-all duration-300 cursor-pointer ${
                                                    active ? 'bg-[#C9A84C]/10 ring-1 ring-[#C9A84C]/40' : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <span
                                                    className={`w-9 text-right font-mono transition-colors ${
                                                        active ? 'text-[#C9A84C] font-bold' : 'text-slate-400'
                                                    }`}
                                                >
                                                    {star} ★
                                                </span>
                                                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
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
                                                    className={`w-6 text-left font-mono transition-colors ${
                                                        active ? 'text-[#C9A84C] font-bold' : count > 0 ? 'text-slate-500' : 'text-slate-600'
                                                    }`}
                                                >
                                                    {count > 0 ? count : '—'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Latest reviews */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A84C]/80 font-bold">
                                        {t('pdp.latestReviews')}
                                    </span>
                                    {hasReviewedProduct ? (
                                        <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                                            <CheckCircle2 size={11} />
                                            {t('pdp.youReviewed')}
                                        </span>
                                    ) : !showReviewForm ? (
                                        <button
                                            onClick={() => setShowReviewForm(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-[9px] font-mono uppercase tracking-wider hover:bg-[#C9A84C]/20 transition-all duration-300 cursor-pointer"
                                        >
                                            <PenLine size={10} />
                                            {t('pdp.writeReview')}
                                        </button>
                                    ) : null}
                                </div>

                                {/* Active exact-star filter + expand/collapse toggle */}
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    {exactStarFilter !== null ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/40 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider">
                                            {exactStarFilter}★ only ({filteredReviews.length})
                                            <button
                                                onClick={() => setExactStarFilter(null)}
                                                aria-label={t('pdp.clearStarFilter')}
                                                className="hover:text-white transition-colors cursor-pointer"
                                            >
                                                <X size={9} />
                                            </button>
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    {reviews.length > 2 && (
                                        <button
                                            onClick={() => setShowAllReviews((v) => !v)}
                                            className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#4FC3F7] hover:text-[#C9A84C] transition-colors cursor-pointer"
                                        >
                                            {showAllReviews
                                                ? t('pdp.showFewer')
                                                : t('pdp.showAllReviews', { count: reviews.length })}
                                            <DirectionalIcon
                                                icon={ChevronRight}
                                                size={10}
                                                className={`transition-transform duration-300 ${showAllReviews ? 'rotate-90' : ''}`}
                                            />
                                        </button>
                                    )}
                                </div>

                                {/* Your review — shown under the "You reviewed this piece" state,
                                    with an edit action that re-opens the form pre-filled. */}
                                {hasReviewedProduct && myReview && !showEditForm && (
                                    <div className="pt-3 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                                                {t('pdp.yourReview')}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setShowEditForm(true)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-wider text-slate-300 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all duration-300 cursor-pointer"
                                                >
                                                    <Pencil size={9} />
                                                    {t('pdp.edit')}
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/5 border border-red-500/20 text-[9px] font-mono uppercase tracking-wider text-red-400/80 hover:text-red-400 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                                                >
                                                    <Trash2 size={9} />
                                                    {t('pdp.delete')}
                                                </button>
                                            </div>
                                        </div>
                                        {showDeleteConfirm ? (
                                            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                                                <p className="text-[11px] font-medium text-red-300 mb-2">
                                                    {t('pdp.deleteConfirm')}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleConfirmDelete}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[9px] font-mono uppercase tracking-wider hover:bg-red-500/25 transition-all duration-300 cursor-pointer"
                                                    >
                                                        <Trash2 size={10} />
                                                        {t('pdp.removeReview')}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(false)}
                                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-wider text-slate-300 hover:text-white hover:border-white/25 transition-all duration-300 cursor-pointer"
                                                    >
                                                        {t('pdp.cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={10}
                                                                fill={star <= myReview.rating ? '#C9A84C' : 'none'}
                                                                className={
                                                                    star <= myReview.rating ? 'text-[#C9A84C]' : 'text-slate-600'
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[8px] font-mono text-slate-500">
                                                        {new Date(myReview.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                        {myReview.editedAt && (
                                                            <span className="text-[#C9A84C]/70">{t('pdp.edited')}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                {myReview.title && (
                                                    <p className="text-[11px] font-medium text-white/90 mb-0.5">
                                                        {localizedReviewTitle(myReview, language)}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-slate-400 leading-relaxed">{myReview.comment}</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {showEditForm && myReview && (
                                    <ReviewForm
                                        productName={localizedProductName(product, language)}
                                        initialRating={myReview.rating}
                                        initialComment={myReview.comment}
                                        title={t('pdp.editReviewTitle', { name: localizedProductName(product, language) })}
                                        submitLabel={t('pdp.updateReview')}
                                        onSubmit={async (rating, comment) => {
                                            const result = await onUpdateReview(rating, comment);
                                            if (result.ok) {
                                                setShowEditForm(false);
                                            }
                                            return result;
                                        }}
                                        onCancel={() => setShowEditForm(false)}
                                    />
                                )}

                                {showReviewForm && !hasReviewedProduct && (
                                    <ReviewForm
                                        productName={localizedProductName(product, language)}
                                        onSubmit={async (rating, comment) => {
                                            const result = await onSubmitReview(rating, comment);
                                            if (result.ok) {
                                                setShowReviewForm(false);
                                            }
                                            return result;
                                        }}
                                        onCancel={() => setShowReviewForm(false)}
                                    />
                                )}

                                <div className="flex flex-col gap-3">
                                    {filteredReviews.length === 0 ? (
                                        <p className="pt-3 border-t border-white/5 text-[11px] text-slate-500">
                                            {t('pdp.noStarReviews', { star: exactStarFilter ?? 0 })}
                                        </p>
                                    ) : (
                                        displayedReviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="pt-3 border-t border-white/5 first:border-t-0 first:pt-0"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={10}
                                                                fill={star <= review.rating ? '#C9A84C' : 'none'}
                                                                className={
                                                                    star <= review.rating ? 'text-[#C9A84C]' : 'text-slate-600'
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                    {review.isLive && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[7px] font-mono uppercase tracking-widest">
                                                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                                            {t('common.live')}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[9px] text-slate-600 font-mono">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <h4 className="font-serif text-white text-xs font-semibold mb-1">
                                                {localizedReviewTitle(review, language)}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                                                {localizedReviewComment(review, language)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#4FC3F7] flex items-center justify-center text-[8px] font-bold text-white overflow-hidden shrink-0">
                                                    {review.userAvatar ? (
                                                        // Same avatar pattern as the /reviews cards
                                                        <img src={review.userAvatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        localizedReviewerName(review, language).charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-300 font-medium">
                                                    {localizedReviewerName(review, language)}
                                                </span>
                                                {review.verified && (
                                                    <span className="px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider">
                                                        {t('pdp.verified')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Details */}
                        <ul className="flex flex-col gap-2">
                            {localizedProductDetails(product, language).map((detail) => (
                                <li key={detail} className="flex items-start gap-2 text-xs text-[#E8E0D5]/60">
                                    <Check size={13} className="text-[#C9A84C] shrink-0 mt-0.5" />
                                    {detail}
                                </li>
                            ))}
                        </ul>

                        {/* Size selector */}
                        <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-2">
                                {t('pdp.selectSize')}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        aria-pressed={selectedSize === size}
                                        className={`w-11 h-11 rounded-lg border text-xs font-mono transition-all duration-200 cursor-pointer ${
                                            selectedSize === size
                                                ? 'bg-[#C9A84C] text-[#0A0F2C] border-[#C9A84C] font-bold'
                                                : 'bg-white/5 text-[#E8E0D5]/70 border-white/10 hover:border-[#C9A84C]/40 hover:text-white'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color selector */}
                        <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-2">
                                {t('pdp.color')} <span className="text-[#E8E0D5]/80">{localizedColorLabel(selectedColor, language)}</span>
                            </span>
                            <div className="flex gap-2">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        aria-pressed={selectedColor === color.name}
                                        aria-label={localizedColorName(color, language)}
                                        title={localizedColorName(color, language)}
                                        style={{ backgroundColor: color.hex }}
                                        className={`w-9 h-9 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                                            selectedColor === color.name
                                                ? 'border-[#C9A84C] scale-110'
                                                : 'border-white/15 hover:border-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Quantity + actions */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <div className="flex items-center gap-1 border border-white/10 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="p-2.5 text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                    aria-label={t('pdp.decreaseQty')}
                                >
                                    <Minus size={13} />
                                </button>
                                <span className="w-10 text-center text-sm font-mono text-white">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                                    className="p-2.5 text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                    aria-label={t('pdp.increaseQty')}
                                >
                                    <Plus size={13} />
                                </button>
                            </div>

                            <button
                                onClick={handleAdd}
                                className="flex-1 min-w-[200px] py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#C9A84C]/10"
                            >
                                <ShoppingBag size={14} />
                                {t('pdp.addToCart', { price: `$${(product.price * quantity).toLocaleString()}` })}
                            </button>

                            <button
                                onClick={onToggleWishlist}
                                aria-pressed={isWishlisted}
                                title={isWishlisted ? t('pdp.removeWishlist') : t('pdp.addWishlist')}
                                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                                    isWishlisted
                                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                        : 'bg-white/5 border-white/10 text-[#E8E0D5]/70 hover:border-red-500/40 hover:text-red-400'
                                }`}
                            >
                                <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                            </button>

                            {/* Share — opens the network share popover */}
                            <div className="relative">
                                <button
                                    onClick={openShare}
                                    aria-pressed={showShare}
                                    title={t('share.product')}
                                    className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                                        showShare
                                            ? 'bg-[#4FC3F7]/10 border-[#4FC3F7]/40 text-[#4FC3F7]'
                                            : 'bg-white/5 border-white/10 text-[#E8E0D5]/70 hover:border-[#4FC3F7]/40 hover:text-[#4FC3F7]'
                                    }`}
                                >
                                    <Share2 size={15} />
                                </button>

                                <AnimatePresence>
                                    {showShare && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowShare(false)}
                                                aria-hidden="true"
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                                className="absolute bottom-full right-0 mb-3 z-50 w-64 rounded-xl border border-white/10 bg-[#0F1535]/95 backdrop-blur-md shadow-2xl shadow-black/50 p-4"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[9px] uppercase tracking-widest font-mono text-[#C9A84C] font-bold">
                                                        {t('share.via')}
                                                    </span>
                                                    <button
                                                        onClick={() => setShowShare(false)}
                                                        aria-label={t('pdp.cancel')}
                                                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <ShareLinks
                                                    url={shareUrl}
                                                    text={t('share.productTitle', { name: localizedProductName(product, language) })}
                                                    ariaLabel={t('share.via')}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Add-to-cart feedback */}
                        {addedToCart && (
                            <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                                <Check size={14} className="shrink-0" />
                                {t('pdp.addedToCart')}{' '}
                                <Link href={ROUTES.CART} className="underline underline-offset-2 hover:text-white transition-colors">
                                    {t('pdp.viewCart')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold mb-5">
                            {t('pdp.youMayAlsoLike')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedProducts.map((related) => (
                                <Link
                                    key={related.id}
                                    href={`${ROUTES.STORE}/${related.id}`}
                                    className="group relative flex flex-col bg-[#0F1535] border border-white/5 hover:border-[#C9A84C]/35 rounded-xl overflow-hidden shadow-lg transition-all duration-500"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                                        <Image
                                            src={related.image}
                                            alt={localizedProductName(related, language)}
                                            fill
                                            className="object-cover transition-all duration-[800ms] group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-3 left-3 bg-[#C9A84C] text-[#0A0F2C] font-mono font-bold text-xs px-2.5 py-1 rounded">
                                            ${related.price.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[9px] uppercase font-mono text-gray-500 block mb-0.5">
                                                {related.category}
                                            </span>
                                            <SmartClamp
                                                as="h3"
                                                maxLines={1}
                                                className="font-serif text-[#E8E0D5] text-sm group-hover:text-[#F0D080] transition-colors duration-300 leading-tight"
                                                text={localizedProductName(related, language)}
                                            />
                                            {related.rating && (
                                                <div className="flex items-center gap-1 text-[9px] text-[#F0D080] font-mono mt-1">
                                                    <StarRatingRow
                                                        rating={
                                                            relatedRatings[related.id]
                                                                ? relatedRatings[related.id]!.average
                                                                : related.rating
                                                        }
                                                        size={9}
                                                    />
                                                    <span>
                                                        {relatedRatings[related.id]
                                                            ? relatedRatings[related.id]!.average.toFixed(1)
                                                            : related.rating.toFixed(1)}
                                                    </span>
                                                    {relatedRatings[related.id] && (
                                                        <span className="text-gray-500">
                                                            &middot; {relatedRatings[related.id]!.count} {reviewCountWord(t, relatedRatings[related.id]!.count)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-mono text-[#4FC3F7] uppercase tracking-wider mt-2">
                                            {t('pdp.viewDetails')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Delete-review confirmation toast */}
            <AnimatePresence>
                {deleteToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        role="status"
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-xs shadow-2xl shadow-black/50 backdrop-blur-md border ${
                            deleteToast === 'removed'
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : 'bg-red-950/40 border-red-500/40 text-red-300'
                        }`}
                    >
                        {deleteToast === 'removed' ? (
                            <CheckCircle2 size={15} className="shrink-0" />
                        ) : (
                            <AlertTriangle size={15} className="shrink-0" />
                        )}
                        {deleteToast === 'removed'
                            ? t('pdp.reviewRemoved')
                            : t('pdp.reviewRemovalFailed')}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
