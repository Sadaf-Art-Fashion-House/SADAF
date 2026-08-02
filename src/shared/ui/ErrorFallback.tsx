'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, Bug, ChevronDown, CheckCircle2, Terminal } from 'lucide-react';
import SadafLogo from '@/components/common/SadafLogo';

interface ErrorFallbackProps {
    /** The error that occurred — shown in the collapsible diagnostics panel. */
    error: Error & { digest?: string };
    /** Re-renders the failed subtree ("Try Again"). */
    onReset: () => void;
    /** Small uppercase eyebrow text above the title (e.g. "SOMETHING WENT WRONG"). */
    subtitle?: string;
    /** Main headline (e.g. "THE LOOM STALLED"). */
    title?: string;
    /** Friendly explanation for the end user. */
    description?: string;
    /** Identifier of the section that crashed (shown when provided). */
    label?: string;
    /** Whether to show the green "We've been notified" badge. */
    notified?: boolean;
    /** Appends "· Report sent" to the badge once the report was delivered. */
    reportSent?: boolean;
    /** Extra action buttons next to "Try Again" (e.g. a Home link). */
    actions?: ReactNode;
    /** Extra content below the actions (e.g. quick links). */
    children?: ReactNode;
    /** Footer content pinned to the bottom of full-screen fallbacks. */
    footer?: ReactNode;
    /** 'screen' renders a full-page fallback; 'section' a contained one. */
    size?: 'screen' | 'section';
    /** Renders the SADAF logo above the icon (full-page boundaries only). */
    showLogo?: boolean;
}

/**
 * ErrorFallback — the single branded error screen shared by every boundary in
 * the app: `src/app/error.tsx` (route segments), `src/app/global-error.tsx`
 * (root layout) and the reusable `ErrorBoundary` (arbitrary subtrees).
 *
 * Keeping the fallback in one component guarantees a consistent look across
 * all failure modes while each boundary still owns its own logging/reporting
 * behaviour. Raw error details (message, digest, stack) are hidden behind a
 * toggle by default — end users never see them, only developers/admins who
 * expand the panel do.
 *
 * Decorative elements (glow orbs, geometric SVG) scale with `size` so a
 * contained section fallback stays subtle instead of inheriting the heavy
 * full-page art direction.
 */
export function ErrorFallback({
    error,
    onReset,
    subtitle,
    title = 'THE LOOM STALLED',
    description,
    label,
    notified = true,
    reportSent = false,
    actions,
    children,
    footer,
    size = 'screen',
    showLogo = false,
}: ErrorFallbackProps) {
    const [showDetails, setShowDetails] = useState(false);
    const isScreen = size === 'screen';

    return (
        <div
            className={`relative flex flex-col items-center justify-center bg-[#0A0F2C] overflow-hidden arabic-pattern ${
                isScreen ? 'min-h-screen' : 'min-h-[60vh]'
            }`}
        >
            {/* Ambient glow orbs — scaled for section fallbacks */}
            <div
                className={`absolute top-[10%] left-[5%] rounded-full bg-red-500/5 blur-[140px] pointer-events-none ${
                    isScreen ? 'w-[400px] h-[400px]' : 'w-72 h-72 blur-[120px]'
                }`}
            />
            <div
                className={`absolute bottom-[20%] right-[10%] rounded-full bg-[#4FC3F7]/5 blur-[150px] pointer-events-none ${
                    isScreen ? 'w-[500px] h-[500px]' : 'w-80 h-80 blur-[130px]'
                }`}
            />
            {isScreen && (
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1B2A6B]/10 blur-[200px] pointer-events-none" />
            )}

            {/* Decorative geometric SVG — full-page boundaries only */}
            {isScreen && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10">
                    <svg width="500" height="500" viewBox="0 0 100 100" className="text-red-400/30 animate-[spin_180s_linear_infinite]">
                        <path d="M50,0 Q60,35 100,50 Q60,65 50,100 Q40,65 0,50 Q40,35 50,0 Z" fill="none" stroke="currentColor" strokeWidth="0.3" />
                        <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                        <polygon points="50,20 58,40 80,50 58,60 50,80 42,60 20,50 42,40" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    </svg>
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto w-full">
                {/* Logo (full-page boundaries) */}
                {showLogo && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="mb-6"
                    >
                        <SadafLogo size={45} showText={false} withMarbleBackground={true} />
                    </motion.div>
                )}

                {/* Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, type: 'spring', damping: 12 }}
                    className="mb-4"
                >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-red-400" />
                    </div>
                </motion.div>

                {/* Section label (boundaries with a label) */}
                {label && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#E8E0D5]/30 mb-2"
                    >
                        Section: {label}
                    </motion.p>
                )}

                {/* Subtitle */}
                {subtitle && (
                    <motion.span
                        initial={{ opacity: 0, letterSpacing: '0.1em' }}
                        animate={{ opacity: 1, letterSpacing: '0.4em' }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="text-xs md:text-sm font-semibold text-red-400 uppercase tracking-[0.4em] mb-3"
                    >
                        {subtitle}
                    </motion.span>
                )}

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-2xl md:text-4xl font-serif text-white tracking-wide mb-3"
                >
                    {title}
                </motion.h1>

                {/* Description */}
                {description && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="text-sm md:text-base text-[#E8E0D5]/60 max-w-md leading-relaxed mb-3"
                    >
                        {description}
                    </motion.p>
                )}

                {/* ✅ We've Been Notified badge */}
                {notified && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.85, type: 'spring', damping: 14 }}
                        className="mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: 1.1, type: 'spring', damping: 10 }}
                            >
                                <CheckCircle2 size={14} />
                            </motion.span>
                            <span>We&rsquo;ve been notified</span>
                            {reportSent && (
                                <span className="text-emerald-500/60 text-[10px] font-mono">· Report sent</span>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="flex flex-wrap justify-center gap-3 mb-6"
                >
                    <button
                        onClick={onReset}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:scale-105 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] shadow-lg shadow-[#C9A84C]/20 cursor-pointer"
                    >
                        <RefreshCw size={13} /> Try Again
                    </button>
                    {actions}
                </motion.div>

                {/* Extra content (quick links) */}
                {children}

                {/* ── Developer Error Details (hidden by default) ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                    className="w-full max-w-xl"
                >
                    <button
                        onClick={() => setShowDetails((s) => !s)}
                        className="inline-flex items-center gap-1.5 text-[10px] text-[#E8E0D5]/25 hover:text-[#4FC3F7]/60 transition-all duration-200 font-mono tracking-wider uppercase cursor-pointer mb-3"
                    >
                        <Bug size={10} />
                        Error Details
                        <ChevronDown
                            size={10}
                            className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="text-left bg-black/60 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-3 text-[10px] text-[#4FC3F7]/70 font-mono tracking-wider uppercase border-b border-white/5 pb-2">
                                        <Terminal size={11} />
                                        Error Diagnostics
                                    </div>

                                    {/* Error message */}
                                    <div className="mb-3">
                                        <span className="text-[9px] text-[#E8E0D5]/40 font-mono uppercase tracking-wider block mb-1">
                                            Message
                                        </span>
                                        <div className="bg-red-950/30 border border-red-500/10 rounded-lg p-3">
                                            <code className="text-xs text-red-300 font-mono break-all leading-relaxed">
                                                {error.message || 'Unknown error'}
                                            </code>
                                        </div>
                                    </div>

                                    {/* Error digest */}
                                    {error.digest && (
                                        <div className="mb-3">
                                            <span className="text-[9px] text-[#E8E0D5]/40 font-mono uppercase tracking-wider block mb-1">
                                                Digest ID
                                            </span>
                                            <code className="text-[10px] text-[#4FC3F7]/60 font-mono">
                                                {error.digest}
                                            </code>
                                        </div>
                                    )}

                                    {/* Stack trace */}
                                    {error.stack && (
                                        <div>
                                            <span className="text-[9px] text-[#E8E0D5]/40 font-mono uppercase tracking-wider block mb-1">
                                                Stack Trace
                                            </span>
                                            <div className="bg-black/50 border border-white/5 rounded-lg p-3 max-h-48 overflow-y-auto">
                                                <pre className="text-[9px] text-[#E8E0D5]/40 font-mono leading-relaxed whitespace-pre-wrap">
                                                    {error.stack}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Footer (full-screen boundaries) */}
            {footer && isScreen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.6 }}
                    className="absolute bottom-6 text-center"
                >
                    {footer}
                </motion.div>
            )}
        </div>
    );
}

export default ErrorFallback;
