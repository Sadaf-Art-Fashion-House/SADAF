'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Sparkles, Star } from 'lucide-react';
import type { FashionProduct } from '@/shared/types';
import type { RatingsByProduct } from '@/features/reviews/hooks/useAggregatedRatings';
import { ROUTES } from '@/config/routes';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { localizedProductFabric, localizedProductName } from '@/features/i18n/productNames';

interface WishlistViewProps {
    items: FashionProduct[];
    /** Aggregated mock + user ratings per product (null = no reviews yet). */
    ratingsByProduct?: RatingsByProduct;
    isInCart: (productId: string) => boolean;
    onToggleWishlist: (product: FashionProduct) => void;
    onAddToCart: (product: FashionProduct) => void;
}

export default function WishlistView({
    items,
    ratingsByProduct = {},
    isInCart,
    onToggleWishlist,
    onAddToCart,
}: WishlistViewProps) {
    const { language, t, tc } = useLanguage();
    const isEmpty = items.length === 0;

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-10 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">
                            SADAF ATELIER COLLECTION
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight flex items-center gap-3">
                            <Heart
                                size={28}
                                className="text-red-400"
                                fill="currentColor"
                            />
                            {t('wishlist.title')}
                        </h1>
                        {!isEmpty && (
                            <p className="text-xs text-[#E8E0D5]/50 font-mono mt-1">
                                {items.length} {items.length === 1 ? t('wishlist.savedOne') : t('wishlist.savedMany')}
                            </p>
                        )}
                    </div>

                    <Link
                        href="/store"
                        className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300"
                    >
                        <ArrowLeft size={12} />
                        {t('store.cart.browseStore')}
                    </Link>
                </div>
            </section>

            {isEmpty ? (
                /* Empty state */
                <section className="relative py-24 px-4 md:px-8 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex p-6 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                            <Heart size={40} className="text-red-400/60" />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-3">{t('wishlist.emptyTitle')}</h2>
                        <p className="text-sm text-[#E8E0D5]/60 max-w-md mx-auto mb-8 leading-relaxed">
                            {t('wishlist.emptyBody')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/store"
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105"
                            >
                                {t('store.cart.browseStore')}
                            </Link>
                            <Link
                                href="/fashion"
                                className="px-6 py-3 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#C9A84C]/10"
                            >
                                {t('wishlist.fashionCollection')}
                            </Link>
                        </div>
                    </motion.div>
                </section>
            ) : (
                /* Wishlist grid */
                <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {items.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group relative flex flex-col bg-[#0F1535] border border-white/5 hover:border-[#C9A84C]/35 rounded-xl overflow-hidden shadow-lg transition-all duration-500"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                                        <Image
                                            src={product.image}
                                            alt={localizedProductName(product, language)}
                                            fill
                                            className="object-cover transition-all duration-[800ms] group-hover:scale-105"
                                        />

                                        {/* Hover image */}
                                        {product.hoverImage && (
                                            <Image
                                                src={product.hoverImage}
                                                alt={`${localizedProductName(product, language)} alternative`}
                                                fill
                                                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                            />
                                        )}

                                        {/* Remove from wishlist button */}
                                        <button
                                            onClick={() => onToggleWishlist(product)}
                                            className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-red-400 hover:bg-red-950/50 active:scale-95 transition-all duration-300 cursor-pointer"
                                            title={t('wishlist.removeTitle')}
                                        >
                                            <Trash2 size={13} />
                                        </button>

                                        {/* Category badge */}
                                        <div className="absolute top-3 left-3 bg-[#E8E0D5]/15 backdrop-blur-md px-2.5 py-1 rounded text-[9px] uppercase font-mono tracking-wider border border-white/10 text-white">
                                            {tc(`store.category.${product.category}`, product.category)}
                                        </div>

                                        {/* Price */}
                                        <div className="absolute bottom-3 left-3 bg-[#C9A84C] text-[#0A0F2C] font-mono font-bold text-xs px-2.5 py-1 rounded border border-[#F0D080]/30 shadow">
                                            ${product.price.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <Link
                                                href={`${ROUTES.STORE}/${product.id}`}
                                                className="font-serif text-[#E8E0D5] text-sm group-hover:text-[#F0D080] transition-colors duration-300 mb-1 leading-tight truncate hover:underline underline-offset-4"
                                            >
                                                {localizedProductName(product, language)}
                                            </Link>
                                            <p className="text-[10px] text-[#E8E0D5]/60 line-clamp-2 leading-relaxed mb-1">
                                                {localizedProductFabric(product, language)}
                                            </p>
                                            {/* Aggregated rating (mock + user reviews), falls back to the catalog rating */}
                                            {product.rating && (
                                                <div className="flex items-center gap-1 text-[9px] text-[#F0D080] font-mono">
                                                    <Star size={9} className="text-[#C9A84C]" fill="currentColor" />
                                                    <span>
                                                        {ratingsByProduct[product.id]
                                                            ? ratingsByProduct[product.id]!.average.toFixed(1)
                                                            : product.rating.toFixed(1)}
                                                    </span>
                                                    {ratingsByProduct[product.id] && (
                                                        <span className="text-gray-500">
                                                            &middot; {ratingsByProduct[product.id]!.count} {t('store.reviews')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Add to cart button */}
                                        <button
                                            onClick={() => onAddToCart(product)}
                                            disabled={isInCart(product.id)}
                                            className={`w-full py-2.5 mt-3 rounded text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                                                isInCart(product.id)
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                                                    : 'bg-white/5 border border-white/10 hover:border-[#4FC3F7] text-white hover:text-[#4FC3F7]'
                                            }`}
                                        >
                                            <ShoppingBag size={12} />
                                            {isInCart(product.id) ? t('wishlist.inBag') : t('wishlist.addToBag')}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            )}

            {/* Bottom navigation */}
            {!isEmpty && (
                <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                        <Link
                            href="/store"
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <ArrowLeft size={11} />
                            {t('orders.continueShopping')}
                        </Link>
                        <span className="text-[#C9A84C]/30">&bull;</span>
                        <Link
                            href="/cart"
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <ShoppingBag size={11} />
                            {t('store.cart.viewBag')}
                        </Link>
                        <span className="text-[#C9A84C]/30">&bull;</span>
                        <Link
                            href="/ai"
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <Sparkles size={11} />
                            AI Studio
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}
