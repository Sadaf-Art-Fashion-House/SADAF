'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CreditCard,
    Shield,
    Truck,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Package,
    ShoppingBag,
    Wallet,
    Landmark,
    Sparkles,
    Palette,
    Shirt,
} from 'lucide-react';
import type { CartItem } from '@/shared/types';
import type {
    ShippingAddress,
    PaymentMethod,
    PaymentInfo,
    CheckoutStep,
    OrderPayload,
} from '../types';

interface CheckoutViewProps {
    items: CartItem[];
    subtotal: number;
    onPlaceOrder: (order: OrderPayload) => void;
    onGoBackToCart: () => void;
}

/** Default country if we have no user profile. */
const DEFAULT_COUNTRY = 'Egypt';

/** Payment method details with icons and labels. */
const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'credit-card', label: 'Credit / Debit Card', icon: CreditCard },
    { value: 'paypal', label: 'PayPal', icon: Wallet },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: Landmark },
];

/** Generates a readable order reference. */
function generateOrderId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SADAF-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/** Gets a human-readable item name. */
function getItemName(item: CartItem): string {
    if (item.product) return item.product.name;
    if (item.artPiece) return item.artPiece.title;
    if (item.aiCustomDesign) return `${item.aiCustomDesign.clothingType} — AI Custom`;
    return 'Unknown Item';
}

/** Gets the item type label. */
function getItemType(item: CartItem): string {
    switch (item.itemType) {
        case 'product': return 'Fashion';
        case 'art': return 'Fine Art';
        case 'aiCustomDesign': return 'AI Studio';
    }
}

function ItemTypeIcon({ type }: { type: CartItem['itemType'] }) {
    switch (type) {
        case 'product': return <Shirt size={10} />;
        case 'art': return <Palette size={10} />;
        case 'aiCustomDesign': return <Sparkles size={10} />;
    }
}

export default function CheckoutView({
    items,
    subtotal,
    onPlaceOrder,
    onGoBackToCart,
}: CheckoutViewProps) {
    const [step, setStep] = useState<CheckoutStep>('shipping');
    const [isPlacing, setIsPlacing] = useState(false);

    // Shipping form state
    const [shipping, setShipping] = useState<ShippingAddress>({
        fullName: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: DEFAULT_COUNTRY,
    });

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit-card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Confirmation order
    const [confirmedOrder, setConfirmedOrder] = useState<OrderPayload | null>(null);

    const shippingFee = subtotal >= 500 ? 0 : 35;
    const total = subtotal + shippingFee;
    const isEmpty = items.length === 0;

    /** Validates the shipping form. */
    const validateShipping = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        if (!shipping.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!shipping.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(shipping.email)) newErrors.email = 'Invalid email format';
        if (!shipping.phone.trim()) newErrors.phone = 'Phone is required';
        if (!shipping.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
        if (!shipping.city.trim()) newErrors.city = 'City is required';
        if (!shipping.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [shipping]);

    /** Handles shipping form submission → moves to review. */
    const handleShippingSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (validateShipping()) {
            setStep('review');
        }
    }, [validateShipping]);

    /** Handles order placement. */
    const handlePlaceOrder = useCallback(() => {
        setIsPlacing(true);

        // Simulate order processing
        setTimeout(() => {
            const paymentInfo: PaymentInfo = {
                method: paymentMethod,
                ...(paymentMethod === 'credit-card' && {
                    cardLastFour: cardNumber.slice(-4),
                    cardHolderName: cardHolder,
                    expiryDate,
                }),
                ...(paymentMethod === 'paypal' && {
                    paypalEmail,
                }),
                ...(paymentMethod === 'bank-transfer' && {
                    bankName,
                    bankAccountNumber,
                }),
            };

            const order: OrderPayload = {
                id: generateOrderId(),
                shippingAddress: shipping,
                paymentInfo,
                items: items.map((item) => ({
                    name: getItemName(item),
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    type: getItemType(item),
                })),
                subtotal,
                shippingFee,
                total,
                createdAt: new Date().toISOString(),
                status: 'confirmed',
            };

            setConfirmedOrder(order);
            setStep('confirmation');
            onPlaceOrder(order);
            setIsPlacing(false);
        }, 1500);
    }, [paymentMethod, cardNumber, cardHolder, expiryDate, shipping, items, subtotal, shippingFee, total, onPlaceOrder]);

    /** Formats card number with spaces. */
    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    /** Formats expiry date. */
    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return digits;
    };

    // If cart is empty, show empty state
    if (isEmpty && !confirmedOrder) {
        return (
            <div className="relative w-full min-h-screen pb-20">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
                <section className="relative pt-20 pb-10 px-4 md:px-8 border-b border-[#C9A84C]/10">
                    <div className="max-w-5xl mx-auto">
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">SADAF ATELIER</span>
                        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight flex items-center gap-3">
                            <CreditCard size={28} className="text-[#C9A84C]" /> Checkout
                        </h1>
                    </div>
                </section>
                <section className="py-24 px-4 md:px-8 max-w-5xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex p-6 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 mb-6">
                            <ShoppingBag size={40} className="text-[#C9A84C]/60" />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-3">Nothing to checkout</h2>
                        <p className="text-sm text-[#E8E0D5]/60 max-w-md mx-auto mb-8 leading-relaxed">
                            Your shopping bag is empty. Add some pieces before proceeding to checkout.
                        </p>
                        <Link href="/store" className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105">
                            Browse Store
                        </Link>
                    </motion.div>
                </section>
            </div>
        );
    }

    // Confirmation step
    if (step === 'confirmation' && confirmedOrder) {
        return (
            <div className="relative w-full min-h-screen pb-20">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
                <section className="relative pt-20 pb-10 px-4 md:px-8 border-b border-[#C9A84C]/10">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                            <div className="inline-flex p-4 rounded-full bg-green-500/20 border border-green-500/30 mb-6">
                                <CheckCircle size={48} className="text-green-400" />
                            </div>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl md:text-4xl font-serif text-white mb-2">
                            Order Confirmed!
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[#C9A84C] font-mono text-sm mb-1">
                            {confirmedOrder.id}
                        </motion.p>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-[#E8E0D5]/60 text-sm">
                            A confirmation email will be sent to {shipping.email}
                        </motion.p>
                    </div>
                </section>

                <section className="py-10 px-4 md:px-8 max-w-3xl mx-auto">
                    <div className="p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#C9A84C]/10">
                            <Truck size={16} className="text-[#C9A84C]" />
                            <div>
                                <p className="text-xs text-[#E8E0D5]/70 font-medium">Shipping to</p>
                                <p className="text-sm text-white">{shipping.fullName}</p>
                                <p className="text-[10px] text-[#E8E0D5]/50">{shipping.addressLine1}, {shipping.city}, {shipping.country}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-4 border-b border-[#C9A84C]/10">
                            <CreditCard size={16} className="text-[#C9A84C]" />
                            <div>
                                <p className="text-xs text-[#E8E0D5]/70 font-medium">Payment</p>
                                <p className="text-sm text-white">
                                    {paymentMethod === 'credit-card'
                                        ? `Card •••• ${cardNumber.slice(-4)}`
                                        : paymentMethod === 'paypal'
                                            ? `PayPal (${paypalEmail})`
                                            : `Bank Transfer (${bankName || 'Bank'})`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-4 border-b border-[#C9A84C]/10">
                            <Package size={16} className="text-[#C9A84C]" />
                            <div>
                                <p className="text-xs text-[#E8E0D5]/70 font-medium">Items ({items.length})</p>
                                <p className="text-sm text-white">${subtotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm font-mono">
                            <span className="text-[#E8E0D5]/70">Total Charged</span>
                            <span className="text-[#C9A84C] text-xl font-bold">${total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-4">
                        <Link href="/" className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105">
                            Return to Home
                        </Link>
                        <p className="text-[10px] text-[#E8E0D5]/40 font-mono">
                            You can track your order status in your Dashboard.
                        </p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">
                            SADAF ATELIER BOUTIQUE
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight flex items-center gap-3">
                            <CreditCard size={28} className="text-[#C9A84C]" /> Secure Checkout
                        </h1>
                    </div>

                    {step !== 'confirmation' && (
                        <Link
                            href="/cart"
                            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300"
                        >
                            <ArrowLeft size={12} />
                            Back to Cart
                        </Link>
                    )}
                </div>

                {/* Step indicators */}
                {step !== 'confirmation' && (
                    <div className="max-w-6xl mx-auto mt-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                        <div className={`flex items-center gap-1.5 ${step === 'shipping' ? 'text-[#C9A84C]' : 'text-green-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${step === 'shipping' ? 'bg-[#C9A84C]/20 border border-[#C9A84C]/40' : 'bg-green-500/20 border border-green-500/40'}`}>
                                {step === 'review' ? <CheckCircle size={10} /> : '1'}
                            </div>
                            Shipping
                        </div>
                        <div className="w-8 h-[1px] bg-[#C9A84C]/20" />
                        <div className={`flex items-center gap-1.5 ${step === 'review' ? 'text-[#C9A84C]' : 'text-[#E8E0D5]/40'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${step === 'review' ? 'bg-[#C9A84C]/20 border border-[#C9A84C]/40' : 'bg-white/5 border border-white/10'}`}>
                                2
                            </div>
                            Review & Pay
                        </div>
                    </div>
                )}
            </section>

            {/* Main content: form + summary */}
            <section className="py-8 px-4 md:px-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Shipping Form or Review */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {step === 'shipping' && (
                                <motion.form
                                    key="shipping"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    onSubmit={handleShippingSubmit}
                                    className="space-y-5"
                                >
                                    <div className="p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10">
                                        <h2 className="font-serif text-lg text-white mb-5 flex items-center gap-2">
                                            <Truck size={16} className="text-[#C9A84C]" /> Shipping Information
                                        </h2>

                                        <div className="space-y-4">
                                            {/* Full Name */}
                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                    Full Name <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shipping.fullName}
                                                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                                                    placeholder="e.g. Layla El-Masri"
                                                    className={`w-full bg-black/40 border ${errors.fullName ? 'border-red-500/50' : 'border-[#C9A84C]/20'} focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300`}
                                                />
                                                {errors.fullName && <p className="text-[9px] text-red-400 font-mono mt-1">{errors.fullName}</p>}
                                            </div>

                                            {/* Email + Phone row */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Email <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={shipping.email}
                                                        onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                                                        placeholder="layla@sadaf.com"
                                                        className={`w-full bg-black/40 border ${errors.email ? 'border-red-500/50' : 'border-[#C9A84C]/20'} focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300`}
                                                    />
                                                    {errors.email && <p className="text-[9px] text-red-400 font-mono mt-1">{errors.email}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Phone <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={shipping.phone}
                                                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                                        placeholder="+20 100 000 0000"
                                                        className={`w-full bg-black/40 border ${errors.phone ? 'border-red-500/50' : 'border-[#C9A84C]/20'} focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300`}
                                                    />
                                                    {errors.phone && <p className="text-[9px] text-red-400 font-mono mt-1">{errors.phone}</p>}
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                    Address Line 1 <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shipping.addressLine1}
                                                    onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                                                    placeholder="e.g. 15 Al-Muizz Street, Old Cairo"
                                                    className={`w-full bg-black/40 border ${errors.addressLine1 ? 'border-red-500/50' : 'border-[#C9A84C]/20'} focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300`}
                                                />
                                                {errors.addressLine1 && <p className="text-[9px] text-red-400 font-mono mt-1">{errors.addressLine1}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                    Address Line 2 <span className="text-[#E8E0D5]/30">(optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shipping.addressLine2 || ''}
                                                    onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })}
                                                    placeholder="Apartment, suite, etc."
                                                    className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300"
                                                />
                                            </div>

                                            {/* City + State + Postal Code row */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        City <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={shipping.city}
                                                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                                        placeholder="Cairo"
                                                        className={`w-full bg-black/40 border ${errors.city ? 'border-red-500/50' : 'border-[#C9A84C]/20'} focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300`}
                                                    />
                                                    {errors.city && <p className="text-[9px] text-red-400 font-mono mt-1">{errors.city}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        State <span className="text-[#E8E0D5]/30">(optional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={shipping.state || ''}
                                                        onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                                                        placeholder="Cairo Governorate"
                                                        className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Postal Code <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={shipping.postalCode}
                                                        onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                                                        placeholder="11511"
                                                        className={`w-full bg-black/40 border ${errors.postalCode ? 'border-red-500/50' : 'border-[#C9A84C]/20'} focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300`}
                                                    />
                                                    {errors.postalCode && <p className="text-[9px] text-red-400 font-mono mt-1">{errors.postalCode}</p>}
                                                </div>
                                            </div>

                                            {/* Country */}
                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                    Country <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shipping.country}
                                                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                                                    placeholder="Egypt"
                                                    className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Continue button */}
                                    <button
                                        type="submit"
                                        className="w-full py-3.5 rounded bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-98 cursor-pointer"
                                    >
                                        Continue to Review <ArrowRight size={14} />
                                    </button>
                                </motion.form>
                            )}

                            {step === 'review' && (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-5"
                                >
                                    {/* Shipping summary */}
                                    <div className="p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="font-serif text-lg text-white flex items-center gap-2">
                                                <Truck size={16} className="text-[#C9A84C]" /> Shipping To
                                            </h2>
                                            <button
                                                onClick={() => setStep('shipping')}
                                                className="text-[10px] font-mono uppercase tracking-wider text-[#C9A84C] hover:text-[#4FC3F7] transition-colors duration-300 cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <div className="text-xs text-[#E8E0D5]/80 space-y-1">
                                            <p className="text-white font-medium">{shipping.fullName}</p>
                                            <p>{shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}</p>
                                            <p>{shipping.city}{shipping.state ? `, ${shipping.state}` : ''} {shipping.postalCode}</p>
                                            <p>{shipping.country}</p>
                                            <p className="text-[#E8E0D5]/50 mt-2">{shipping.email} &bull; {shipping.phone}</p>
                                        </div>
                                    </div>

                                    {/* Payment method selection */}
                                    <div className="p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10">
                                        <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                                            <CreditCard size={16} className="text-[#C9A84C]" /> Payment Method
                                        </h2>

                                        <div className="space-y-3">
                                            {PAYMENT_METHODS.map((method) => (
                                                <button
                                                    key={method.value}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(method.value)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer ${
                                                        paymentMethod === method.value
                                                            ? 'border-[#C9A84C]/40 bg-[#C9A84C]/10'
                                                            : 'border-white/5 bg-black/20 hover:border-white/10'
                                                    }`}
                                                >
                                                    <method.icon size={16} className={`${paymentMethod === method.value ? 'text-[#C9A84C]' : 'text-slate-500'}`} />
                                                    <span className={`text-xs font-medium ${paymentMethod === method.value ? 'text-white' : 'text-slate-400'}`}>
                                                        {method.label}
                                                    </span>
                                                    {paymentMethod === method.value && (
                                                        <CheckCircle size={14} className="ml-auto text-[#C9A84C]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Credit card details */}
                                        {paymentMethod === 'credit-card' && (
                                            <div className="mt-4 space-y-3 pt-4 border-t border-[#C9A84C]/10">
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Card Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cardNumber}
                                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                        placeholder="4242 4242 4242 4242"
                                                        maxLength={19}
                                                        className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300 font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Cardholder Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cardHolder}
                                                        onChange={(e) => setCardHolder(e.target.value)}
                                                        placeholder="LAYLA EL-MASRI"
                                                        className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300 font-mono uppercase"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                            Expiry Date
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={expiryDate}
                                                            onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                                                            placeholder="MM/YY"
                                                            maxLength={5}
                                                            className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                            CVV
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={cvv}
                                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                            placeholder="123"
                                                            maxLength={4}
                                                            className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* PayPal details */}
                                        {paymentMethod === 'paypal' && (
                                            <div className="mt-4 space-y-3 pt-4 border-t border-[#C9A84C]/10">
                                                <p className="text-[10px] text-[#4FC3F7]/80 font-mono leading-relaxed bg-[#4FC3F7]/5 border border-[#4FC3F7]/20 rounded-lg p-3">
                                                    You will be redirected to PayPal to complete your payment after placing the order.
                                                </p>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        PayPal Email <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={paypalEmail}
                                                        onChange={(e) => setPaypalEmail(e.target.value)}
                                                        placeholder="your-paypal@sadaf.com"
                                                        className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Bank Transfer details */}
                                        {paymentMethod === 'bank-transfer' && (
                                            <div className="mt-4 space-y-3 pt-4 border-t border-[#C9A84C]/10">
                                                <p className="text-[10px] text-[#F0D080]/80 font-mono leading-relaxed bg-[#F0D080]/5 border border-[#F0D080]/20 rounded-lg p-3">
                                                    Please provide your bank details. Our team will send you the invoice with our bank account information within 24 hours.
                                                </p>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Bank Name <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={bankName}
                                                        onChange={(e) => setBankName(e.target.value)}
                                                        placeholder="e.g. National Bank of Egypt"
                                                        className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 mb-1.5">
                                                        Account Number <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={bankAccountNumber}
                                                        onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
                                                        placeholder="e.g. 1234567890"
                                                        className="w-full bg-black/40 border border-[#C9A84C]/20 focus:border-[#4FC3F7] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300 font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items preview */}
                                    <div className="p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10">
                                        <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                                            <Package size={16} className="text-[#C9A84C]" /> Order Items ({items.length})
                                        </h2>
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-white/5">
                                                    <div className="relative w-10 h-12 rounded overflow-hidden shrink-0 bg-black/30">
                                                        {item.product && <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />}
                                                        {item.artPiece && <Image src={item.artPiece.image} alt={item.artPiece.title} fill className="object-cover" />}
                                                        {item.aiCustomDesign && (
                                                            <div className="w-full h-full flex items-center justify-center p-1 bg-[#12193E]" dangerouslySetInnerHTML={{ __html: item.aiCustomDesign.svgPattern }} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-white truncate">{getItemName(item)}</p>
                                                        <div className="flex items-center gap-2 text-[9px] font-mono text-[#E8E0D5]/50">
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C]">
                                                                <ItemTypeIcon type={item.itemType} />
                                                                {getItemType(item)}
                                                            </span>
                                                            <span>Qty: {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-mono text-[#C9A84C] shrink-0">${item.totalPrice.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Place Order button */}
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isPlacing}
                                        className="w-full py-3.5 rounded bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isPlacing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={14} /> Place Order — ${total.toLocaleString()}
                                            </>
                                        )}
                                    </button>

                                    <p className="text-[9px] text-[#E8E0D5]/30 font-mono text-center">
                                        Your payment is processed securely. No real charges are made in demo mode.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Order Summary (always visible) */}
                    {step !== 'confirmation' && (
                        <div className="lg:col-span-5">
                            <div className="sticky top-28 p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10">
                                <h3 className="font-serif text-base text-white mb-4 pb-4 border-b border-[#C9A84C]/10">
                                    Order Summary
                                </h3>

                                <div className="space-y-3 text-xs font-mono">
                                    <div className="flex justify-between text-[#E8E0D5]/70">
                                        <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                                        <span className="text-white">${subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[#E8E0D5]/70">
                                        <span>Shipping</span>
                                        <span className={shippingFee === 0 ? 'text-green-400' : 'text-white'}>
                                            {shippingFee === 0 ? 'FREE' : `$${shippingFee}`}
                                        </span>
                                    </div>
                                    {shippingFee > 0 && (
                                        <div className="p-2 rounded bg-[#C9A84C]/5 border border-[#C9A84C]/10 text-[9px] text-[#E8E0D5]/50 text-center">
                                            Free shipping on orders over $500
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#C9A84C]/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white text-sm font-bold uppercase">Total</span>
                                        <span className="text-[#C9A84C] text-lg font-bold font-mono">
                                            ${total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Item count badge */}
                                <div className="mt-4 pt-4 border-t border-[#C9A84C]/10">
                                    <div className="flex flex-wrap gap-2">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#C9A84C]/5 border border-[#C9A84C]/10"
                                            >
                                                <div className="relative w-6 h-7 rounded overflow-hidden bg-black/30">
                                                    {item.product && <Image src={item.product.image} alt="" fill className="object-cover" />}
                                                    {item.artPiece && <Image src={item.artPiece.image} alt="" fill className="object-cover" />}
                                                </div>
                                                <span className="text-[8px] font-mono text-[#E8E0D5]/60 truncate max-w-[80px]">
                                                    {getItemName(item)}
                                                </span>
                                                <span className="text-[8px] font-mono text-[#C9A84C]">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Trust badges */}
                                <div className="mt-6 space-y-2">
                                    <div className="flex items-center gap-2 text-[9px] text-[#E8E0D5]/40 font-mono">
                                        <Shield size={10} className="text-green-400" /> Secure SSL encrypted checkout
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-[#E8E0D5]/40 font-mono">
                                        <Truck size={10} className="text-[#4FC3F7]" /> 14–21 day bespoke production
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
