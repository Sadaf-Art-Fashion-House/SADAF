'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, ShoppingBag, Feather, Home } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import SadafLogo from '@/components/common/SadafLogo';

export default function NotFound() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0A0F2C] overflow-hidden arabic-pattern">
            {/* Ambient glow orbs */}
            <div className="absolute top-[15%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#C9A84C]/8 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#4FC3F7]/5 blur-[150px] pointer-events-none" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1B2A6B]/10 blur-[200px] pointer-events-none" />

            {/* Decorative geometric SVG */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10">
                <svg width="500" height="500" viewBox="0 0 100 100" className="text-[#C9A84C] animate-[spin_180s_linear_infinite]">
                    <path d="M50,0 Q60,35 100,50 Q60,65 50,100 Q40,65 0,50 Q40,35 50,0 Z" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    <polygon points="50,20 58,40 80,50 58,60 50,80 42,60 20,50 42,40" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    <polygon points="50,30 55,42 68,50 55,58 50,70 45,58 32,50 45,42" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.6" />
                    <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.15" opacity="0.3" />
                    <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="0.15" opacity="0.3" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <SadafLogo size={50} showText={false} withMarbleBackground={true} />
                </motion.div>

                {/* Subtitle */}
                <motion.span
                    initial={{ opacity: 0, letterSpacing: '0.1em' }}
                    animate={{ opacity: 1, letterSpacing: '0.4em' }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-xs md:text-sm font-semibold text-[#C9A84C] uppercase tracking-[0.4em] mb-4"
                >
                    SADAF ATELIER · AL-QAHIRA
                </motion.span>

                {/* 404 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, type: 'spring', damping: 15 }}
                    className="mb-2"
                >
                    <h1 className="text-[120px] md:text-[180px] font-serif font-bold leading-none tracking-tight text-gold-gradient select-none">
                        404
                    </h1>
                </motion.div>

                {/* Error message */}
                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-lg md:text-2xl font-serif text-white tracking-wide mb-3"
                >
                    BEYOND THE COLLECTION
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-sm md:text-base text-[#E8E0D5]/60 max-w-md leading-relaxed mb-10"
                >
                    This page appears to have wandered off into the medina. It doesn&apos;t exist here — perhaps it was never woven.
                </motion.p>

                {/* Quick navigation links */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="flex flex-wrap justify-center gap-3 max-w-lg"
                >
                    <Link
                        href={ROUTES.HOME}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:scale-105 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] shadow-lg shadow-[#C9A84C]/20 cursor-pointer"
                    >
                        <Home size={13} /> Home
                    </Link>

                    <Link
                        href={ROUTES.AI_STUDIO}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A84C]/30 bg-transparent hover:bg-[#C9A84C]/10 text-[#C9A84C] hover:text-white hover:border-[#C9A84C]/60 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
                    >
                        <Sparkles size={13} /> AI Studio
                    </Link>

                    <Link
                        href={ROUTES.STORE}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E8E0D5]/15 bg-transparent hover:bg-white/5 text-[#E8E0D5]/70 hover:text-white hover:border-[#4FC3F7]/50 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
                    >
                        <ShoppingBag size={13} /> Store
                    </Link>

                    <Link
                        href={ROUTES.FASHION}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E8E0D5]/15 bg-transparent hover:bg-white/5 text-[#E8E0D5]/70 hover:text-white hover:border-[#4FC3F7]/50 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
                    >
                        <Feather size={13} /> Fashion
                    </Link>
                </motion.div>

                {/* Back to Home subtle link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                    className="mt-10"
                >
                    <Link
                        href={ROUTES.HOME}
                        className="inline-flex items-center gap-1.5 text-[10px] text-[#E8E0D5]/40 hover:text-[#C9A84C] transition-all duration-300 tracking-[0.15em] uppercase font-mono cursor-pointer group"
                    >
                        <ArrowLeft size={11} className="transition-transform group-hover:-translate-x-1" />
                        Return to the Atrium
                    </Link>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                className="absolute bottom-6 text-center"
            >
                <span className="text-[8px] text-[#E8E0D5]/30 font-mono tracking-[0.3em] uppercase">
                    &copy; 2026 SADAF ART FASHION HOUSE
                </span>
            </motion.div>
        </div>
    );
}
