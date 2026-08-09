'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag,
    Trash2,
    Minus,
    Plus,
    ArrowLeft,
    CreditCard,
    Sparkles,
    Palette,
    Shirt,
    CheckCircle2,
} from 'lucide-react';
import type { CartItem } from '@/shared/types';

interface CartViewProps {
    items: CartItem[];
    onUpdateQuantity: (cartLineId: string, quantity: number) => void;
    onRemoveFromCart: (cartLineId: string) => void;
    onClearCart: () => void;
}

/** Renders a single line-item thumbnail — handles fashion, art, and AI custom designs. */
function CartItemThumbnail({ item }: { item: CartItem }) {
    if (item.product) {
        return (
            <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
            />
        );
    }
    if (item.artPiece) {
        return (
            <Image
                src={item.artPiece.image}
                alt={item.artPiece.title}
                fill
                className="object-cover"
            />
        );
    }
    if (item.aiCustomDesign) {
        return (
            <div
                className="w-full h-full flex items-center justify-center p-1 bg-[#12193E]"
                dangerouslySetInnerHTML={{
                    __html: item.aiCustomDesign.svgPattern,
                }}
            />
        );
    }
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#0A0F2C]">
            <ShoppingBag size={20} className="text-[#C9A84C]/40" />
        </div>
    );
}

/** Returns a human-readable item name regardless of item type. */
function getItemName(item: CartItem): string {
    if (item.product) return item.product.name;
    if (item.artPiece) return item.artPiece.title;
    if (item.aiCustomDesign) return `${item.aiCustomDesign.clothingType} — AI Custom`;
    return 'Unknown Item';
}

/** Returns a human-readable category label. */
function getItemCategory(item: CartItem): string {
    switch (item.itemType) {
        case 'product':
            return 'Fashion';
        case 'art':
            return 'Fine Art';
        case 'aiCustomDesign':
            return 'AI Studio Design';
    }
}

/** Icon for each item type badge. */
function ItemTypeIcon({ type }: { type: CartItem['itemType'] }) {
    switch (type) {
        case 'product':
            return <Shirt size={10} />;
        case 'art':
            return <Palette size={10} />;
        case 'aiCustomDesign':
            return <Sparkles size={10} />;
    }
}

export default function CartView({
    items,
    onUpdateQuantity,
    onRemoveFromCart,
    onClearCart,
}: CartViewProps) {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const isEmpty = items.length === 0;

    // Clear-bag confirmation + cleared toast (presentation state).
    const [confirmClear, setConfirmClear] = useState(false);
    const [showClearedToast, setShowClearedToast] = useState(false);

    const handleClear = () => {
        onClearCart();
        setConfirmClear(false);
        setShowClearedToast(true);
        window.setTimeout(() => setShowClearedToast(false), 3_000);
    };

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-10 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">
                            SADAF ATELIER BOUTIQUE
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight flex items-center gap-3">
                            <ShoppingBag size={28} className="text-[#C9A84C]" />
                            Your Shopping Bag
                        </h1>
                        {!isEmpty && (
                            <p className="text-xs text-[#E8E0D5]/50 font-mono mt-1">
                                {items.length} {items.length === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>

                    <Link
                        href="/store"
                        className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300"
                    >
                        <ArrowLeft size={12} />
                        Continue Shopping
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
                        <div className="inline-flex p-6 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 mb-6">
                            <ShoppingBag size={40} className="text-[#C9A84C]/60" />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-3">Your bag is empty</h2>
                        <p className="text-sm text-[#E8E0D5]/60 max-w-md mx-auto mb-8 leading-relaxed">
                            Explore our boutique store for ready-to-wear luxury pieces, browse fine
                            artworks, or design your own bespoke creation in the AI Studio.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/store"
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105"
                            >
                                Browse Store
                            </Link>
                            <Link
                                href="/ai"
                                className="px-6 py-3 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#C9A84C]/10"
                            >
                                AI Studio
                            </Link>
                        </div>
                    </motion.div>
                </section>
            ) : (
                /* Cart items + summary grid */
                <section className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Items list */}
                        <div className="lg:col-span-8 space-y-4">
                            <AnimatePresence>
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="p-4 md:p-5 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10 hover:border-[#C9A84C]/25 transition-all duration-300"
                                    >
                                        <div className="flex gap-4 md:gap-5">
                                            {/* Thumbnail */}
                                            <div className="relative w-20 h-24 md:w-24 md:h-28 rounded-lg overflow-hidden shrink-0 bg-black/30">
                                                <CartItemThumbnail item={item} />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0">
                                                            <h3 className="font-serif text-sm md:text-base text-white truncate">
                                                                {getItemName(item)}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-wider bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
                                                                    <ItemTypeIcon type={item.itemType} />
                                                                    {getItemCategory(item)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveFromCart(item.id)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-300 shrink-0 cursor-pointer"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Attributes */}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-[#E8E0D5]/50">
                                                        <span>Size: {item.selectedSize}</span>
                                                        {item.selectedColor && (
                                                            <span>Color: {item.selectedColor}</span>
                                                        )}
                                                        {item.selectedFabric && (
                                                            <span>Fabric: {item.selectedFabric}</span>
                                                        )}
                                                        {item.selectedPrinting && (
                                                            <span>Print: {item.selectedPrinting}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#C9A84C]/10">
                                                    {/* Quantity controls */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono uppercase text-[#E8E0D5]/40 mr-1">
                                                            Qty
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                onUpdateQuantity(item.id, item.quantity - 1)
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            className="p-1 rounded border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="w-6 text-center text-xs font-mono text-white">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                onUpdateQuantity(item.id, item.quantity + 1)
                                                            }
                                                            className="p-1 rounded border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all duration-300 cursor-pointer"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-right">
                                                        <span className="text-xs text-[#E8E0D5]/40 font-mono block">
                                                            Total
                                                        </span>
                                                        <span className="text-sm font-mono text-[#C9A84C] font-bold">
                                                            ${item.totalPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Summary sidebar */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-28 p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10">
                                <h3 className="font-serif text-lg text-white mb-4 pb-4 border-b border-[#C9A84C]/10">
                                    Order Summary
                                </h3>

                                <div className="space-y-3 text-xs font-mono">
                                    <div className="flex justify-between text-[#E8E0D5]/70">
                                        <span>Subtotal</span>
                                        <span className="text-white">${subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[#E8E0D5]/70">
                                        <span>Shipping</span>
                                        <span className="text-[#C9A84C]">
                                            {subtotal >= 500 ? 'FREE' : 'Calculated at checkout'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#C9A84C]/10">
                                    <div className="flex justify-between items-center text-sm font-mono">
                                        <span className="text-white font-bold uppercase">Total</span>
                                        <span className="text-[#C9A84C] text-lg font-bold">
                                            ${subtotal.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    {/* TODO: Wire up real checkout flow once Checkout feature is migrated */}
                                    <Link
                                        href="/checkout"
                                        className="w-full py-3 rounded bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-98"
                                    >
                                        <CreditCard size={14} />
                                        Proceed to Checkout
                                    </Link>

                                    {confirmClear ? (
                                        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30">
                                            <p className="text-[10px] text-red-300 font-mono text-center mb-3">
                                                Remove all {items.length} item{items.length === 1 ? '' : 's'} from your bag?
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleClear}
                                                    className="flex-1 py-2 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono uppercase tracking-wider hover:bg-red-500/30 transition-all duration-300 cursor-pointer"
                                                >
                                                    Yes, Clear Bag
                                                </button>
                                                <button
                                                    onClick={() => setConfirmClear(false)}
                                                    className="flex-1 py-2 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono uppercase tracking-wider hover:text-white transition-all duration-300 cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmClear(true)}
                                            className="w-full py-2.5 rounded border border-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-wider hover:bg-red-950/30 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <Trash2 size={12} />
                                            Clear Bag
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6 p-3 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/10">
                                    <p className="text-[9px] text-[#E8E0D5]/50 font-mono leading-relaxed">
                                        Free international shipping on orders over $500.
                                        All pieces are bespoke-made and ship within 14–21 business days.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Continue browsing links */}
            {!isEmpty && (
                <section className="py-8 px-4 md:px-8 max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                        <Link
                            href="/store"
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <ArrowLeft size={11} />
                            Continue Shopping
                        </Link>
                        <span className="text-[#C9A84C]/30">&bull;</span>
                        <Link
                            href="/artworks"
                            className="text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 flex items-center gap-1.5"
                        >
                            <Palette size={11} />
                            Browse Fine Art
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

            {/* Cleared-bag confirmation toast */}
            <AnimatePresence>
                {showClearedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        role="status"
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl shadow-black/50 backdrop-blur-md"
                    >
                        <CheckCircle2 size={15} className="shrink-0" />
                        Your bag has been cleared.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
