'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Mail,
    Lock,
    CheckCircle,
    AlertCircle,
    Chrome,
    ArrowRight,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import SadafLogo from '@/components/common/SadafLogo';
import { ErrorGuidance } from '@/shared/ui/ErrorGuidance';

interface LoginViewProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onGoogleSignIn: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
    success: string | null;
}

export default function LoginView({
    onLogin,
    onGoogleSignIn,
    isLoading,
    error,
    success,
}: LoginViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Quick preset sandbox logins — one per role category
    const sandboxProfiles = [
        { email: 'layla@sadaf.luxury', label: 'Customer (Individual)' },
        { email: 'amir@sadaf.luxury', label: 'Customer (Family)' },
        { email: 'nadia@sadaf.luxury', label: 'Customer (Friend)' },
        { email: 'karim@sadaf.luxury', label: 'Designer' },
        { email: 'nile@sadaf.luxury', label: 'Company' },
        { email: 'saleh@sadaf.luxury', label: 'Sales Partner' },
        { email: 'admin@sadaf.luxury', label: 'Admin (Super)' },
        { email: 'yasmin@sadaf.luxury', label: 'Founder' },
    ];

    const handlePresetLogin = (presetEmail: string) => {
        setEmail(presetEmail);
        setPassword('sadaf123');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        await onLogin(email, password);
    };

    return (
        <div className="w-full min-h-[70vh] flex items-center justify-center py-12 px-4 relative font-sans text-[#E8E0D5]">
            {/* Dynamic Ambient Background Vector Glows */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#C9A84C]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md bg-[#0A0F2C]/90 border border-[#C9A84C]/20 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
                {/* Intricate golden border */}
                <div className="absolute inset-1 border border-[#C9A84C]/10 rounded-2xl pointer-events-none" />

                {/* Brand header */}
                <div className="flex flex-col items-center text-center mb-8 relative z-10">
                    <SadafLogo size={36} withMarbleBackground={false} />
                    <h2 className="text-xl md:text-2xl font-serif text-[#C9A84C] font-semibold mt-4 uppercase tracking-wider">
                        ATELIER ACCOUNT ACCESS
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 font-sans">
                        Enter Cairo&apos;s luxury boutique and virtual museum.
                    </p>
                </div>

                {/* Environment Status Sign */}
                {!isSupabaseConfigured && (
                    <div className="mb-6 p-3.5 bg-yellow-950/30 border border-yellow-500/35 rounded-xl text-[11px] text-yellow-100 flex items-start gap-2 leading-relaxed">
                        <AlertCircle size={14} className="text-[#C9A84C] shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-[#C9A84C]">Sandbox Mode Active</strong> &mdash;{' '}
                            Preset credentials simulate high-fidelity connections. Create database
                            variables in your settings.
                        </div>
                    </div>
                )}

                {/* Feedback alerts */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-5 p-3.5 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl text-xs"
                        role="alert"
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                        <ErrorGuidance className="text-[9px]" />
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-5 p-3.5 bg-green-950/40 border border-green-500/30 text-green-200 rounded-xl text-xs flex items-center gap-2"
                    >
                        <CheckCircle size={14} className="shrink-0 text-green-400" />
                        <span>{success}</span>
                    </motion.div>
                )}

                {/* Form panel */}
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-left">
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
                            Email coordinate
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                <Mail size={14} />
                            </span>
                            <input
                                id="login-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="layla@sadaf.luxury"
                                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60">
                                Lustrous cipher key
                            </label>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock size={14} />
                            </span>
                            <input
                                id="login-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
                            />
                        </div>
                    </div>

                    {/* Quick Sandbox Logins — always visible for development convenience */}
                    <div className="pt-2">
                        <span className="block text-[9px] font-mono uppercase text-[#C9A84C]/80 mb-2 font-bold tracking-wider">
                            ⚡ Quick Sandbox Logins:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                            {sandboxProfiles.map((p) => (
                                <button
                                    key={p.email}
                                    type="button"
                                    onClick={() => handlePresetLogin(p.email)}
                                    className="py-1.5 px-1 bg-[#1B2A6B]/20 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/15 rounded-lg text-[9px] font-mono text-center text-[#E8E0D5]/90 transition cursor-pointer"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 hover:text-[#0A0F2C] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#C9A84C]/15"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-[#0A0F2C] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Connect Atelier ID <ArrowRight size={13} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Divider and Google auth */}
                <div className="mt-6 flex flex-col items-center relative z-10 gap-4">
                    <div className="flex items-center w-full my-1">
                        <div className="flex-1 h-[0.5px] bg-white/10" />
                        <span className="px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            Or Sign-in via Secure Link
                        </span>
                        <div className="flex-1 h-[0.5px] bg-white/10" />
                    </div>

                    <button
                        onClick={onGoogleSignIn}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 bg-white/5 border border-white/15 hover:bg-white/10 text-xs text-[#E8E0D5] font-mono uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Chrome size={13} className="text-[#4FC3F7]" />
                        Sign-In with Google Auth
                    </button>

                    <div className="mt-4 text-center border-t border-white/5 pt-4 w-full text-xs">
                        <span className="text-slate-500">Need an exclusive ID?</span>{' '}
                        <Link
                            href="/auth/signup"
                            className="text-[#C9A84C] hover:text-[#4FC3F7] font-semibold underline"
                        >
                            Sign up for an invitation
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
