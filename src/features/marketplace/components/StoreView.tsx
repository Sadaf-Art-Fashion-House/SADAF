"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Heart, Filter, ChevronRight, X, CreditCard, Star } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useLanguage } from "@/features/i18n/LanguageProvider";
import { localizedArtTitle, localizedProductName, localizedFabricName } from "@/features/i18n/productNames";
import type { CartItem, FashionProduct } from "@/shared/types";
import type { RatingsByProduct } from "@/features/reviews/hooks/useAggregatedRatings";
import { useMarketplace } from "../hooks/useMarketplace";

interface StoreViewProps {
    products: FashionProduct[];
    cartItems: CartItem[];
    /** Aggregated mock + user ratings per product (null = no reviews yet). */
    ratingsByProduct?: RatingsByProduct;
    /** True while the reviews:global WebSocket channel is connected. */
    wsLive?: boolean;
    /** Product whose rating just changed over WS — its row pulses. */
    lastLiveProductId?: string | null;
    /** Timestamp of the last live rating change (key for the pulse). */
    lastLiveAt?: number | null;
    isWishlisted: (productId: string) => boolean;
    onAddToCart: (product: FashionProduct, size: string, color: string) => void;
    onRemoveFromCart: (cartLineId: string) => void;
    onToggleWishlist: (product: FashionProduct) => void;
    onCheckout: (total: number, couponCode: string) => void;
}

export default function StoreView({
    products,
    cartItems,
    ratingsByProduct = {},
    wsLive = false,
    lastLiveProductId = null,
    lastLiveAt = null,
    isWishlisted,
    onAddToCart,
    onRemoveFromCart,
    onToggleWishlist,
    onCheckout,
}: StoreViewProps) {
    const { t, tc, language } = useLanguage();

    const {
        categories,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        activeProductDetail,
        setActiveProductDetail,
        openProductDetail,
        selectedSize,
        setSelectedSize,
        selectedColor,
        setSelectedColor,
        showCartDrawer,
        setShowCartDrawer,
        coupon,
        setCoupon,
        couponMessage,
        couponApplied,
        applyCouponCode,
        filteredProducts,
        cartSubtotal,
        discountAmount,
        discountPercent,
        shippingFee,
        cartTotal,
    } = useMarketplace(products, cartItems);

    return (
        <div className="relative w-full overflow-hidden min-h-screen pb-20">
            {/* Store header banner */}
            <section className="relative py-12 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-[#0A0F2C] text-left overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">
                            {t("store.kicker")}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
                            {t("store.title")}
                        </h1>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowCartDrawer(true)}
                            className="relative px-5 py-2.5 rounded bg-[#1B2A6B] hover:bg-[#C9A84C] hover:text-[#0A0F2C] text-xs text-white transition-all duration-300 font-mono font-semibold uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-black/30"
                        >
                            <ShoppingCart size={14} /> {t("store.viewBag")}
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[#C9A84C] text-[#0A0F2C] font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-[#0A0F2C]">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Catalog with Filters Sidebar */}
            <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-3 flex flex-col gap-6 lg:border-r lg:border-[#C9A84C]/10 lg:pr-8 text-left font-sans">
                    <div>
                        <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                            <Filter size={16} className="text-[#C9A84C]" /> {t("store.categoryFilter")}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-2 rounded text-xs text-left font-medium transition-all duration-300 flex justify-between items-center cursor-pointer ${
                                        selectedCategory === cat
                                            ? "bg-[#1B2A6B] text-[#4FC3F7]"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <span>{tc(`store.category.${cat}`, cat)}</span>
                                    <ChevronRight
                                        size={10}
                                        className={selectedCategory === cat ? "text-[#C9A84C]" : "opacity-0"}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-[#C9A84C]/10 pt-6">
                        <h3 className="font-serif text-lg text-white mb-4">{t("store.investmentScale")}</h3>
                        <div className="flex flex-col gap-2">
                            <input
                                type="range"
                                min="200"
                                max="3000"
                                step="100"
                                value={priceRange}
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                                className="w-full accent-[#C9A84C] cursor-pointer bg-slate-800 h-1.5 rounded"
                            />
                            <div className="flex justify-between items-center text-xs text-gray-500 font-mono pt-1">
                                <span>{t("store.priceMin")}: $200</span>
                                <span className="text-[#C9A84C] font-bold">
                                    {t("store.priceMax")}: ${priceRange.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Promotional Coupon Info Box */}
                    <div className="border-t border-[#C9A84C]/10 pt-6 mt-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#12193E] to-[#0A0F2C] border border-[#C9A84C]/10 text-xs">
                            <h4 className="font-serif text-[#C9A84C] font-semibold mb-1 uppercase tracking-wider">
                                {t("store.promo.title")}
                            </h4>
                            <p className="text-slate-400 mb-2 leading-relaxed">
                                {t("store.promo.body", { code: "SADAF2026" })}
                            </p>
                            <button
                                onClick={applyCouponCode}
                                className="mt-2 px-3 py-2 rounded bg-[#1B2A6B] text-white text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                                {t("store.promo.apply")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product Cards listings grid */}
                <div className="lg:col-span-9">
                    {filteredProducts.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 font-serif text-lg">
                            {t("store.empty")}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    className="group relative flex flex-col bg-[#0F1535] border border-white/5 hover:border-[#C9A84C]/35 rounded-xl overflow-hidden shadow-lg transition-all duration-500"
                                >
                                    {/* Image Stage */}
                                    <div
                                        className="relative aspect-[3/4] overflow-hidden bg-black/40 cursor-pointer"
                                        onClick={() => openProductDetail(prod)}
                                    >
                                        <Image
                                            src={prod.image}
                                            alt={prod.name}
                                            fill
                                            className="object-cover transition-all duration-[800ms] group-hover:scale-105"
                                        />

                                        {/* Hover Image */}
                                        {prod.hoverImage && (
                                            <Image
                                                src={prod.hoverImage}
                                                alt={`${prod.name} alternative`}
                                                fill
                                                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                            />
                                        )}

                                        {/* Wishlist Heart overlay */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleWishlist(prod);
                                            }}
                                            className="absolute top-4 right-4 p-2 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white hover:text-red-400 active:scale-95 transition-all duration-300 cursor-pointer"
                                        >
                                            <Heart
                                                size={14}
                                                fill={isWishlisted(prod.id) ? "red" : "none"}
                                                className={isWishlisted(prod.id) ? "text-red-400" : ""}
                                            />
                                        </button>

                                        {/* Gold price label */}
                                        <div className="absolute bottom-4 left-4 bg-[#C9A84C] text-[#0A0F2C] font-mono font-bold text-xs px-2.5 py-1 rounded border border-[#F0D080]/30 shadow">
                                            ${prod.price.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[9px] uppercase font-mono text-gray-500 mb-0.5 block">
                                                {tc(`store.category.${prod.category}`, prod.category)}
                                            </span>
                                            <Link
                                                href={`${ROUTES.STORE}/${prod.id}`}
                                                className="font-serif text-[#E8E0D5] text-base group-hover:text-[#F0D080] transition-colors duration-300 mb-1 leading-tight hover:underline underline-offset-4"
                                            >
                                                {localizedProductName(prod, language)}
                                            </Link>
                                            <p className="text-xs text-[#E8E0D5]/65 line-clamp-2 leading-relaxed mb-3">
                                                {prod.description}
                                            </p>

                                            {/* Aggregated rating (mock + user reviews), falls back to the catalog rating.
                                                Pulses briefly when a live community review lands on this product. */}
                                            <div className="flex items-center gap-1.5 mb-4">
                                                {wsLive && (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-mono uppercase tracking-widest"
                                                        title={t("common.live")}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        {t("common.live")}
                                                    </span>
                                                )}
                                                <Star
                                                    size={11}
                                                    className="text-[#C9A84C]"
                                                    fill="currentColor"
                                                />
                                                <motion.span
                                                    key={
                                                        lastLiveProductId === prod.id && lastLiveAt !== null
                                                            ? `live-${lastLiveAt}`
                                                            : `static-${prod.id}`
                                                    }
                                                    initial={
                                                        lastLiveProductId === prod.id && lastLiveAt !== null
                                                            ? { scale: 1.3, opacity: 0.5 }
                                                            : false
                                                    }
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                                    className="text-[11px] font-mono text-[#E8E0D5]"
                                                >
                                                    {ratingsByProduct[prod.id]
                                                        ? ratingsByProduct[prod.id]!.average.toFixed(1)
                                                        : prod.rating.toFixed(1)}
                                                </motion.span>
                                                {ratingsByProduct[prod.id] && (
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        &middot; {ratingsByProduct[prod.id]!.count} {t("store.reviews")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openProductDetail(prod)}
                                            className="w-full py-2 bg-white/5 border border-white/10 hover:border-[#4FC3F7] text-xs text-white uppercase tracking-wider font-semibold rounded cursor-pointer transition-all duration-300 text-center"
                                        >
                                            {t("store.configureAdd")}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {activeProductDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-4xl bg-[#0A0F2C] border border-[#C9A84C]/25 rounded-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl text-left"
                        >
                            {/* Close out */}
                            <button
                                onClick={() => setActiveProductDetail(null)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all duration-300"
                            >
                                <X size={20} />
                            </button>

                            {/* Left Column Image */}
                            <div className="relative flex-1 rounded-xl overflow-hidden aspect-[4/5] bg-black/20">
                                <Image
                                    src={activeProductDetail.image}
                                    alt={activeProductDetail.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Right Column details */}
                            <div className="flex-1 flex flex-col justify-between font-sans">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#C9A84C] uppercase tracking-widest">
                                        <span>{tc(`store.category.${activeProductDetail.category}`, activeProductDetail.category)} {t("store.label")}</span>
                                        <span>&bull;</span>
                                        <span>{activeProductDetail.fabric}</span>
                                    </div>

                                    <h2 className="font-serif text-2xl md:text-3xl text-white font-bold tracking-tight uppercase leading-none mt-2 mb-3">
                                        {localizedProductName(activeProductDetail, language)}
                                    </h2>
                                    <p className="text-[#C9A84C] font-mono text-lg font-bold mb-4">
                                        ${activeProductDetail.price.toLocaleString()}
                                    </p>

                                    <p className="text-xs text-[#E8E0D5]/80 leading-relaxed mb-6 font-sans">
                                        {activeProductDetail.description}
                                    </p>

                                    {/* Sizing selection */}
                                    <div className="mb-4">
                                        <span className="text-[10px] font-mono uppercase text-gray-400 block mb-2">
                                            {t("store.selectSize")}
                                        </span>
                                        <div className="flex gap-2">
                                            {activeProductDetail.sizes.map((sz) => (
                                                <button
                                                    key={sz}
                                                    onClick={() => setSelectedSize(sz)}
                                                    className={`w-9 h-9 border text-xs font-mono rounded cursor-pointer flex items-center justify-center transition ${
                                                        selectedSize === sz
                                                            ? "bg-[#1B2A6B] text-white border-[#4FC3F7]"
                                                            : "border-white/10 text-slate-400 hover:text-white"
                                                    }`}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color option swatches */}
                                    <div className="mb-6">
                                        <span className="text-[10px] font-mono uppercase text-gray-400 block mb-2">
                                            {t("store.selectDye")}
                                        </span>
                                        <div className="flex gap-3">
                                            {activeProductDetail.colors.map((cl) => (
                                                <button
                                                    key={cl.name}
                                                    onClick={() => setSelectedColor(cl.name)}
                                                    className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                                        selectedColor === cl.name
                                                            ? "border-[#C9A84C] text-[#C9A84C] bg-[#12193E]"
                                                            : "border-white/10 text-gray-400 hover:text-white"
                                                    }`}
                                                >
                                                    <span
                                                        style={{ backgroundColor: cl.hex }}
                                                        className="w-2.5 h-2.5 rounded-full inline-block border border-white/10"
                                                    />
                                                    <span>{cl.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bullet Spec list */}
                                    <div>
                                        <span className="text-[10px] font-mono uppercase text-gray-400 block mb-2">
                                            {t("store.specs")}
                                        </span>
                                        <ul className="text-[11px] text-gray-400 pl-4 list-disc space-y-1">
                                            {activeProductDetail.details.map((dt, i) => (
                                                <li key={i}>{dt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Confirm additions */}
                                <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            onAddToCart(activeProductDetail, selectedSize, selectedColor);
                                            setActiveProductDetail(null);
                                        }}
                                        className="flex-1 py-3 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-semibold uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                                    >
                                        <ShoppingCart size={12} /> {t("store.addToBag")}
                                    </button>
                                    <button
                                        onClick={() => onToggleWishlist(activeProductDetail)}
                                        className="p-3 border border-white/10 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
                                    >
                                        <Heart
                                            size={14}
                                            fill={isWishlisted(activeProductDetail.id) ? "red" : "none"}
                                            className={isWishlisted(activeProductDetail.id) ? "text-red-400" : ""}
                                        />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Shopping Cart Drawer Sidebar */}
            <AnimatePresence>
                {showCartDrawer && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
                        {/* Click overlap close */}
                        <div className="absolute inset-0" onClick={() => setShowCartDrawer(false)} />

                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-[#0A0F2C] border-l border-[#C9A84C]/25 h-full p-6 md:p-8 flex flex-col justify-between shadow-2xl text-left"
                        >
                            {/* Drawer header */}
                            <div className="flex justify-between items-center border-b border-[#C9A84C]/10 pb-4">
                                <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-white">
                                    {t("store.cart.title")}
                                </h3>
                                <button
                                    onClick={() => setShowCartDrawer(false)}
                                    className="p-2 text-slate-400 hover:text-white cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Items list container */}
                            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                                {cartItems.length === 0 ? (
                                    <div className="py-20 text-center text-slate-500 text-xs">
                                        {t("store.cart.empty")}
                                    </div>
                                ) : (
                                    cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 flex gap-4 text-xs hover:border-[#4FC3F7]/20 transition duration-300"
                                        >
                                            {/* item thumbnail */}
                                            <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-black/20">
                                                {item.product && (
                                                    <Image
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                                {item.artPiece && (
                                                    <Image
                                                        src={item.artPiece.image}
                                                        alt={localizedArtTitle(item.artPiece, language)}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                                {item.aiCustomDesign && (
                                                    <div
                                                        className="w-full h-full shrink-0 flex items-center justify-center p-1 bg-[#12193E] text-center"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.aiCustomDesign.svgPattern,
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* item text */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-serif text-white uppercase text-xs tracking-wide leading-tight line-clamp-1 max-w-[190px]">
                                                            {item.product
                                                                ? localizedProductName(item.product, language)
                                                                : item.artPiece?.title ||
                                                                  `${item.aiCustomDesign?.clothingType} Custom`}
                                                        </h4>
                                                        <button
                                                            onClick={() => onRemoveFromCart(item.id)}
                                                            className="text-gray-500 hover:text-red-400 cursor-pointer text-[10px] font-semibold tracking-wider font-mono"
                                                        >
                                                            {t("store.cart.remove")}
                                                        </button>
                                                    </div>

                                                    <div className="text-[10px] text-gray-400 space-y-0.5 mt-1 font-mono">
                                                        <div>
                                                            {t("store.cart.qty")}: {item.quantity} &bull; {t("store.cart.size")}: {item.selectedSize}
                                                        </div>
                                                        {item.selectedColor && <div>{t("store.cart.dye")}: {item.selectedColor}</div>}
                                                        {item.selectedFabric && (
                                                            <div>{t("store.cart.weave")}: {localizedFabricName(item.selectedFabric, language)}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5 font-mono">
                                                    <span className="text-gray-500 font-medium">{t("store.cart.sum")}</span>
                                                    <span className="text-[#C9A84C] font-semibold">
                                                        ${item.totalPrice.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Checkout pricing sum */}
                            {cartItems.length > 0 && (
                                <div className="border-t border-[#C9A84C]/10 pt-6 space-y-4">
                                    {/* Coupon implementation */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder={t("store.cart.couponPlaceholder", { code: "SADAF2026" })}
                                                value={coupon}
                                                onChange={(e) => setCoupon(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white"
                                                disabled={couponApplied}
                                            />
                                            <button
                                                onClick={applyCouponCode}
                                                className="px-4 bg-[#1B2A6B] hover:bg-[#C9A84C] hover:text-[#0A0F2C] text-xs uppercase font-mono tracking-widest font-semibold rounded active:scale-95 transition-all duration-300"
                                                disabled={couponApplied}
                                            >
                                                {couponApplied ? t("store.cart.applied") : t("store.cart.apply")}
                                            </button>
                                        </div>
                                        {couponMessage && (
                                            <p
                                                className={`text-[10px] font-mono ${
                                                    couponApplied ? "text-green-400" : "text-red-400"
                                                }`}
                                            >
                                                {couponMessage}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-xs font-mono text-gray-400 border-b border-white/5 pb-4">
                                        <div className="flex justify-between text-left">
                                            <span>{t("store.cart.subtotal")}</span>
                                            <span className="text-[#E8E0D5]">
                                                ${cartSubtotal.toLocaleString()}
                                            </span>
                                        </div>

                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-left text-green-400">
                                                <span>{t("store.cart.vipDeduction")} (-{discountPercent}%)</span>
                                                <span>-${discountAmount.toLocaleString()}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-left">
                                            <span>{t("store.cart.shipping")}</span>
                                            <span className="text-[#E8E0D5]">
                                                {shippingFee === 0 ? t("store.cart.shippingFree") : `$${shippingFee}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* GRAND TOTAL */}
                                    <div className="flex justify-between items-center text-sm font-mono tracking-tight text-white py-2">
                                        <span className="uppercase font-bold">{t("store.cart.total")}</span>
                                        <span className="text-[#C9A84C] text-xl font-bold">
                                            ${cartTotal.toLocaleString()}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onCheckout(cartTotal, couponApplied ? "SADAF2026" : "");
                                            setShowCartDrawer(false);
                                        }}
                                        className="w-full py-4 rounded bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:text-[#0A0F2C] hover:scale-102 transition duration-300 active:scale-98 font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/40"
                                    >
                                        <CreditCard size={14} /> {t("store.cart.checkout")}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
