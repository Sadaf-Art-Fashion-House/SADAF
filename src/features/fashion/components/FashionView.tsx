"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Compass, ZoomIn, ArrowRight, Heart, ShoppingCart, X } from "lucide-react";
import type { FashionCategory, FashionProduct, LookbookItem } from "@/shared/types";
import { FASHION_CATEGORIES } from "../constants/fashionCategories";

interface FashionViewProps {
    products: FashionProduct[];
    lookbookItems: LookbookItem[];
    isWishlisted: (productId: string) => boolean;
    /**
     * Called when the user confirms an add-to-cart action from the product
     * detail modal. Size and color are persisted on the cart line
     * (see useCartStore.addFashionToCart).
     */
    onAddToCart: (product: FashionProduct, size: string, color: string) => void;
    /** Called when the user favourites a product (toggles useWishlistStore). */
    onAddToWishlist: (product: FashionProduct) => void;
}

export default function FashionView({
    products,
    lookbookItems,
    isWishlisted,
    onAddToCart,
    onAddToWishlist,
}: FashionViewProps) {
    const [activeCategory, setActiveCategory] = useState<FashionCategory | "All">("All");
    const [activeLookId, setActiveLookId] = useState<string>("lb-1");

    // Product detail modal state — self-contained here (mirrors StoreView's
    // useMarketplace-driven modal) rather than lifted to FashionPageClient,
    // since it's pure presentation state, not a cart/wishlist mutation.
    const [activeProduct, setActiveProduct] = useState<FashionProduct | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [selectedColor, setSelectedColor] = useState<string>("");

    const filteredProducts =
        activeCategory === "All"
            ? products
            : products.filter((product) => product.category === activeCategory);

    const activeLookDetails =
        lookbookItems.find((item) => item.id === activeLookId) ?? lookbookItems[0];

    const openProductDetail = (product: FashionProduct) => {
        setActiveProduct(product);
        setSelectedSize(product.sizes[0] ?? "");
        setSelectedColor(product.colors[0]?.name ?? "");
    };

    return (
        <div className="relative w-full overflow-hidden min-h-screen pb-20">

            {/* Fashion Couture Hero */}
            <section className="relative py-20 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] via-[#1B2A6B]/25 to-[#0A0F2C] text-center overflow-hidden">
                <div className="absolute top-0 left-10 w-[500px] h-[500px] rounded-full bg-[#1B2A6B]/20 blur-[130px] pointer-events-none" />
                <div className="absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/5 blur-[130px] pointer-events-none" />

                <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">
                    SADAF ATELIER LABELS
                </span>
                <h1 className="text-4xl md:text-6xl font-serif text-white uppercase tracking-tight leading-none mb-4">
                    LUXURY <span className="text-gold-gradient font-serif italic">Couture</span>
                </h1>
                <p className="text-sm md:text-base text-[#E8E0D5]/70 max-w-2xl mx-auto font-sans tracking-wide leading-relaxed">
                    Unveil garments tailored with super-140s Egyptian wool, raw coastal silks, and 18k gold
                    embroideries. Browse across traditional fusion lines, elegant outerwear, and limited drops.
                </p>

                {/* Category filter tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-12 max-w-4xl mx-auto px-4">
                    {FASHION_CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category as FashionCategory | "All")}
                            className={`px-5 py-2.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all duration-300 cursor-pointer active:scale-95 ${
                                activeCategory === category
                                    ? "bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] shadow-lg shadow-[#C9A84C]/10 font-semibold"
                                    : "bg-[#0A0F2C]/60 text-[#E8E0D5]/70 hover:text-white border border-[#E8E0D5]/10 hover:border-[#4FC3F7]/40"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </section>

            {/* Seasonal Campaign Banner */}
            <section className="py-12 bg-gradient-to-r from-[#0C1130] to-[#141B44] border-y border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        <span className="text-xs text-[#C9A84C] font-mono tracking-widest uppercase">
                            EXHIBITIONS CONTINUED
                        </span>
                        <h3 className="text-xl md:text-2xl font-serif text-white mt-1">
                            THE SANDS OF AL-MUIZZ COLLECTION
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 font-sans">
                            Strictly limited capsule deliveries. Global priority shipping includes luxury
                            packaging casing.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-xs border border-[#C9A84C]/30 text-[#C9A84C] px-3 py-1.5 rounded uppercase font-mono tracking-widest">
                            Limited to 150 Prints
                        </span>
                    </div>
                </div>
            </section>

            {/* Main Fashion Product Catalog */}
            <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.5 }}
                                className="group relative flex flex-col bg-[#0A0F2C]/90 border border-[#C9A84C]/5 hover:border-[#C9A84C]/30 rounded-xl overflow-hidden shadow-xl hover:shadow-[0_0_20px_rgba(201,168,76,0.1)] transition-all duration-500"
                            >
                                {/* Product Image */}
                                <div
                                    className="relative aspect-[3/4] overflow-hidden bg-black/40 cursor-pointer"
                                    onClick={() => openProductDetail(product)}
                                >
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-all duration-[1000ms] group-hover:scale-105"
                                    />

                                    {/* Hover image overlay */}
                                    {product.hoverImage && (
                                        <Image
                                            src={product.hoverImage}
                                            alt={`${product.name} alternative view`}
                                            fill
                                            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                        />
                                    )}

                                    {/* Wishlist heart overlay */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToWishlist(product);
                                        }}
                                        className="absolute top-4 right-4 p-2 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white hover:text-red-400 active:scale-95 transition-all duration-300 cursor-pointer z-10"
                                    >
                                        <Heart
                                            size={14}
                                            fill={isWishlisted(product.id) ? "red" : "none"}
                                            className={isWishlisted(product.id) ? "text-red-400" : ""}
                                        />
                                    </button>

                                    {/* Gold price tag */}
                                    <div className="absolute top-4 left-4 bg-gradient-to-bl from-[#C9A84C] to-[#99792B] text-[#0A0F2C] font-mono font-bold text-xs px-3 py-1.5 rounded shadow shadow-black/40 border border-[#F0D080]/30">
                                        ${product.price.toLocaleString()}
                                    </div>

                                    {/* Inspect overlay */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#4FC3F7]">
                                            Inspect Details
                                        </span>
                                        <ZoomIn size={14} className="text-[#C9A84C]" />
                                    </div>
                                </div>

                                {/* Product Info & Actions */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3
                                            className="font-serif text-[#E8E0D5] text-lg group-hover:text-[#F0D080] transition-colors duration-300 mb-1.5 cursor-pointer"
                                            onClick={() => openProductDetail(product)}
                                        >
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-[#E8E0D5]/70 line-clamp-2 leading-relaxed mb-4">
                                            {product.description}
                                        </p>

                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {(product.sizes ?? []).map((size) => (
                                                <span
                                                    key={size}
                                                    className="text-[10px] font-mono border border-white/10 px-2 py-0.5 rounded text-gray-400 bg-white/5"
                                                >
                                                    {size}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-[#E8E0D5]/10 pt-4 mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-mono uppercase text-[#C9A84C]">
                                                Fabric:
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-sans truncate max-w-[124px] inline-block">
                                                {product.fabric}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => openProductDetail(product)}
                                            className="px-4 py-2 bg-[#1B2A6B] hover:bg-[#C9A84C] hover:text-[#0A0F2C] text-xs text-white uppercase tracking-wider font-semibold rounded transition-all duration-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            Configure Item <ArrowRight size={11} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </section>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {activeProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-4xl bg-[#0A0F2C] border border-[#C9A84C]/25 rounded-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl text-left"
                        >
                            <button
                                onClick={() => setActiveProduct(null)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all duration-300 z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative flex-1 rounded-xl overflow-hidden aspect-[4/5] bg-black/20">
                                <Image
                                    src={activeProduct.image}
                                    alt={activeProduct.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex-1 flex flex-col justify-between font-sans">
                                <div>
                                    <span className="text-[10px] font-mono text-[#C9A84C] uppercase tracking-widest">
                                        {activeProduct.category}
                                    </span>
                                    <h2 className="font-serif text-2xl md:text-3xl text-white font-bold tracking-tight uppercase leading-none mt-2 mb-3">
                                        {activeProduct.name}
                                    </h2>
                                    <p className="text-[#C9A84C] font-mono text-lg font-bold mb-4">
                                        ${activeProduct.price.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-[#E8E0D5]/80 leading-relaxed mb-6 font-sans">
                                        {activeProduct.description}
                                    </p>

                                    <div className="mb-4">
                                        <span className="text-[10px] font-mono uppercase text-gray-400 block mb-2">
                                            Select Size
                                        </span>
                                        <div className="flex gap-2">
                                            {activeProduct.sizes.map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`w-9 h-9 border text-xs font-mono rounded cursor-pointer flex items-center justify-center transition ${
                                                        selectedSize === size
                                                            ? "bg-[#1B2A6B] text-white border-[#4FC3F7]"
                                                            : "border-white/10 text-slate-400 hover:text-white"
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-[10px] font-mono uppercase text-gray-400 block mb-2">
                                            Select Color
                                        </span>
                                        <div className="flex gap-3">
                                            {activeProduct.colors.map((color) => (
                                                <button
                                                    key={color.name}
                                                    onClick={() => setSelectedColor(color.name)}
                                                    className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                                        selectedColor === color.name
                                                            ? "border-[#C9A84C] text-[#C9A84C] bg-[#12193E]"
                                                            : "border-white/10 text-gray-400 hover:text-white"
                                                    }`}
                                                >
                                                    <span
                                                        style={{ backgroundColor: color.hex }}
                                                        className="w-2.5 h-2.5 rounded-full inline-block border border-white/10"
                                                    />
                                                    <span>{color.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            onAddToCart(activeProduct, selectedSize, selectedColor);
                                            setActiveProduct(null);
                                        }}
                                        className="flex-1 py-3 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-semibold uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                                    >
                                        <ShoppingCart size={12} /> Add to bag
                                    </button>
                                    <button
                                        onClick={() => onAddToWishlist(activeProduct)}
                                        className="p-3 border border-white/10 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
                                    >
                                        <Heart
                                            size={14}
                                            fill={isWishlisted(activeProduct.id) ? "red" : "none"}
                                            className={isWishlisted(activeProduct.id) ? "text-red-400" : ""}
                                        />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lookbook Section */}
            <section className="py-24 bg-gradient-to-b from-[#0A0F2C] via-[#0E153D]/40 to-[#0A0F2C] border-t border-b border-[#E8E0D5]/5">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-3">
                            DIGITAL CINEMATIC LOOKBOOK
                        </span>
                        <h2 className="text-3xl md:text-5xl font-serif text-white">ECHOES OF ELEGANCE</h2>
                        <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mt-4" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#070A20]/80 border border-[#C9A84C]/10 rounded-2xl overflow-hidden p-6 md:p-12 shadow-2xl relative">

                        {/* Lookbook navigator list */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {lookbookItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setActiveLookId(item.id)}
                                    className={`p-6 rounded-xl cursor-pointer transition-all duration-300 border ${
                                        activeLookId === item.id
                                            ? "bg-[#1B2A6B]/50 border-[#C9A84C] text-white"
                                            : "bg-[#0A0F2C]/40 border-white/5 text-slate-400 hover:text-white hover:border-[#4FC3F7]/30"
                                    }`}
                                >
                                    <span className="text-[9px] font-mono tracking-widest text-[#C9A84C] block mb-1">
                                        {item.year} Campaign
                                    </span>
                                    <h3 className="font-serif text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-2">{item.subtitle}</p>
                                </div>
                            ))}
                        </div>

                        {/* Active lookbook spread */}
                        {activeLookDetails && (
                            <div className="lg:col-span-8 flex flex-col md:flex-row gap-8 items-stretch h-full min-h-[400px]">
                                <div className="flex-1 rounded-xl overflow-hidden relative border border-white/10 group shadow-lg">
                                    <Image
                                        src={activeLookDetails.image}
                                        alt={activeLookDetails.title}
                                        fill
                                        className="object-cover filter brightness-[0.75] group-hover:scale-[1.03] transition-transform duration-[1200ms]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                        <span className="text-slate-300 font-serif text-sm block mb-1">
                                            {activeLookDetails.subtitle}
                                        </span>
                                        <h4 className="text-white font-serif text-2xl font-semibold">
                                            {activeLookDetails.title}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center text-left p-4 md:p-8 bg-gradient-to-tr from-[#050A1C] to-[#121E4E] border border-white/10 rounded-xl">
                                    <Compass className="text-[#C9A84C] mb-4" size={28} />
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#4FC3F7] mb-2">
                                        {activeLookDetails.year} Collection Description
                                    </span>
                                    <p className="text-[#E8E0D5]/80 text-xs md:text-sm leading-relaxed mb-6 font-sans">
                                        {activeLookDetails.description}
                                    </p>
                                    <div className="flex items-center gap-3 border-t border-white/10 pt-4 mt-auto">
                                        <div className="text-xs uppercase font-mono text-[#C9A84C]">
                                            Atelier Notes:
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Preserving Fatimid geometric alignments. Crafted with custom
                                            jacquard silk layers.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
