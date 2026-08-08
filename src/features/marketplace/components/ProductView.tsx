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
import { ChevronRight, Check, Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { FashionProduct } from '@/shared/types';
import { ROUTES } from '@/config/routes';

interface ProductViewProps {
    product: FashionProduct;
    relatedProducts: FashionProduct[];
    /** Combined average from catalog + user reviews — falls back to the
     * catalog's editorial rating when null (no reviews yet). */
    ratingSummary?: { average: number; count: number } | null;
    isWishlisted: boolean;
    onAddToCart: (size: string, color: string) => void;
    onToggleWishlist: () => void;
}

export default function ProductView({
    product,
    relatedProducts,
    ratingSummary,
    isWishlisted,
    onAddToCart,
    onToggleWishlist,
}: ProductViewProps) {
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? '');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name ?? '');
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    const handleAdd = () => {
        onAddToCart(selectedSize, selectedColor);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2_500);
    };

    return (
        <div className="min-h-screen bg-[#0A0F2C] pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-8">
                    <Link href={ROUTES.STORE} className="hover:text-[#C9A84C] transition-colors">
                        Store
                    </Link>
                    <ChevronRight size={11} />
                    <span className="text-[#E8E0D5]/60">{product.category}</span>
                    <ChevronRight size={11} />
                    <span className="text-[#C9A84C]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Gallery */}
                    <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            priority
                            className="object-cover transition-all duration-[800ms] group-hover:scale-105"
                        />
                        {product.hoverImage && (
                            <Image
                                src={product.hoverImage}
                                alt={`${product.name} alternative view`}
                                fill
                                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                            />
                        )}
                    </div>

                    {/* Configuration */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <span className="text-[9px] uppercase font-mono text-[#4FC3F7] tracking-[0.25em]">
                                {product.category} Label
                            </span>
                            <h1 className="font-serif text-2xl md:text-3xl text-white uppercase tracking-tight mt-2 leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-mono text-[#F0D080]">
                                    ★ {ratingSummary ? ratingSummary.average.toFixed(1) : product.rating}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                    {ratingSummary
                                        ? `${ratingSummary.count} review${ratingSummary.count === 1 ? '' : 's'} · from customers`
                                        : 'Editor\'s rating'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                    {product.fabric}
                                </span>
                            </div>
                        </div>

                        <p className="text-3xl font-serif text-[#C9A84C] font-bold">
                            ${product.price.toLocaleString()}
                        </p>

                        <p className="text-sm text-[#E8E0D5]/70 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Details */}
                        <ul className="flex flex-col gap-2">
                            {product.details.map((detail) => (
                                <li key={detail} className="flex items-start gap-2 text-xs text-[#E8E0D5]/60">
                                    <Check size={13} className="text-[#C9A84C] shrink-0 mt-0.5" />
                                    {detail}
                                </li>
                            ))}
                        </ul>

                        {/* Size selector */}
                        <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-2">
                                Select Size
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
                                Color — <span className="text-[#E8E0D5]/80">{selectedColor}</span>
                            </span>
                            <div className="flex gap-2">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        aria-pressed={selectedColor === color.name}
                                        aria-label={color.name}
                                        title={color.name}
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
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={13} />
                                </button>
                                <span className="w-10 text-center text-sm font-mono text-white">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                                    className="p-2.5 text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>

                            <button
                                onClick={handleAdd}
                                className="flex-1 min-w-[200px] py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#C9A84C]/10"
                            >
                                <ShoppingBag size={14} />
                                Add to Cart — ${(product.price * quantity).toLocaleString()}
                            </button>

                            <button
                                onClick={onToggleWishlist}
                                aria-pressed={isWishlisted}
                                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                                    isWishlisted
                                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                        : 'bg-white/5 border-white/10 text-[#E8E0D5]/70 hover:border-red-500/40 hover:text-red-400'
                                }`}
                            >
                                <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Add-to-cart feedback */}
                        {addedToCart && (
                            <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                                <Check size={14} className="shrink-0" />
                                Added to cart —{' '}
                                <Link href={ROUTES.CART} className="underline underline-offset-2 hover:text-white transition-colors">
                                    View cart
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold mb-5">
                            You May Also Like
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
                                            alt={related.name}
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
                                            <h3 className="font-serif text-[#E8E0D5] text-sm group-hover:text-[#F0D080] transition-colors duration-300 leading-tight truncate">
                                                {related.name}
                                            </h3>
                                        </div>
                                        <span className="text-[9px] font-mono text-[#4FC3F7] uppercase tracking-wider mt-2">
                                            View Details
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
