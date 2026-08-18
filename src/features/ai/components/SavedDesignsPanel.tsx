'use client';

import { motion } from 'motion/react';
import { X, Trash2, Eye, Bookmark, Sparkles, ShoppingBag, Edit3, Ruler } from 'lucide-react';
import { SmartClamp } from '@/shared/ui/SmartClamp';
import Link from 'next/link';
import { useDesignDraftStore } from '@/features/ai/store/useDesignDraftStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isAdminRole } from '@/shared/types';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { localizedDesignName } from '@/features/i18n/productNames';

interface SavedDesignsPanelProps {
    onClose: () => void;
}

export default function SavedDesignsPanel({ onClose }: SavedDesignsPanelProps) {
    const { t, language } = useLanguage();
    const { drafts, deleteDraft } = useDesignDraftStore();
    const { user } = useAuth();
    const isAdmin = user ? isAdminRole(user.role) : false;

    const savedDrafts = drafts.filter((d) => d.status === 'draft');
    const publishedDrafts = drafts.filter((d) => d.status === 'published');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 pb-10 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-[#0A0F2C] border border-[#C9A84C]/20 rounded-3xl p-6 md:p-8 w-full max-w-4xl mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-serif text-white flex items-center gap-2">
                            <Bookmark size={18} className="text-[#C9A84C]" />
                            {t('ai.saved.header')}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                            {t('ai.saved.summary', { drafts: savedDrafts.length, s: savedDrafts.length !== 1 ? 's' : '', published: publishedDrafts.length })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                {drafts.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                        <Sparkles size={32} className="text-[#C9A84C]/30 mx-auto mb-3" />
                        <p className="text-sm text-[#E8E0D5]/60 mb-1">{t('ai.saved.empty')}</p>
                        <p className="text-[10px] text-slate-500">{t('ai.saved.emptyHint')}</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="p-4 bg-[#05081A]/80 border border-white/5 rounded-xl flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Mini preview — real AI image when available, procedural SVG otherwise */}
                                    {draft.design.generatedImageUrl ? (
                                        <img
                                            src={draft.design.generatedImageUrl}
                                            alt={localizedDesignName(draft.design, language)}
                                            className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden shrink-0 bg-[#0A0F2C] object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden shrink-0 bg-[#0A0F2C]"
                                            dangerouslySetInnerHTML={{
                                                __html: `<svg viewBox="0 0 100 100" width="48" height="48">${draft.design.svgPattern.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`,
                                            }}
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <SmartClamp
                                            as="h4"
                                            maxLines={1}
                                            className="text-xs font-serif text-white font-semibold"
                                            text={localizedDesignName(draft.design, language)}
                                        />
                                        <p className="text-[9px] font-mono text-slate-500">
                                            {draft.design.clothingType} • {new Date(draft.savedAt).toLocaleDateString()}
                                        </p>
                                        <span
                                            className={`inline-block mt-0.5 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase ${
                                                draft.status === 'draft'
                                                    ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20'
                                                    : 'bg-green-950/40 text-green-400 border border-green-500/20'
                                            }`}
                                        >
                                            {draft.status === 'draft' ? t('ai.saved.statusDraft') : t('ai.saved.statusPublished')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    {/* Edit — for all users */}
                                    {/* TODO: Full edit flow — Open AI Studio with pre-filled design values so the user can modify and regenerate */}
                                    <span
                                        className="px-2 py-1.5 opacity-60 bg-[#1B2A6B]/50 text-[#4FC3F7] border border-[#4FC3F7]/20 rounded-lg text-[8px] font-mono uppercase tracking-wider cursor-not-allowed inline-flex items-center gap-1"
                                        title={t('ai.saved.editTitle')}
                                    >
                                        <Edit3 size={10} /> {t('ai.saved.edit')}
                                    </span>

                                    {/* Order (Add to Cart) — for all users */}
                                    {/* TODO: Add the design to the cart via useCartStore.addCustomDesignToCart() */}
                                    <span
                                        className="px-2 py-1.5 opacity-60 bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 rounded-lg text-[8px] font-mono uppercase tracking-wider cursor-not-allowed inline-flex items-center gap-1"
                                        title={t('ai.saved.orderTitle')}
                                    >
                                        <ShoppingBag size={10} /> {t('ai.saved.order')}
                                    </span>

                                    {/* Fitting room — for all users */}
                                    {/* TODO: Navigate to AI Studio Step 3 (Maqasaq) with the saved design measurements */}
                                    <span
                                        className="px-2 py-1.5 opacity-60 bg-[#1B2A6B]/50 text-[#4FC3F7] border border-[#4FC3F7]/20 rounded-lg text-[8px] font-mono uppercase tracking-wider cursor-not-allowed inline-flex items-center gap-1"
                                        title={t('ai.saved.fitTitle')}
                                    >
                                        <Ruler size={10} /> {t('ai.saved.fit')}
                                    </span>

                                    {/* Review & Publish — ADMIN ONLY */}
                                    {isAdmin && draft.status === 'draft' && (
                                        <Link
                                            href="/dashboard/admin"
                                            className="px-2 py-1.5 bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 rounded-lg text-[8px] font-mono uppercase tracking-wider hover:bg-[#C9A84C]/20 transition cursor-pointer flex items-center gap-0.5"
                                        >
                                            <Eye size={10} /> {t('ai.saved.review')}
                                        </Link>
                                    )}

                                    {/* Delete — for all users */}
                                    <button
                                        onClick={() => deleteDraft(draft.id)}
                                        className="p-1.5 bg-red-950/20 text-red-400 hover:bg-red-900 rounded-lg transition cursor-pointer"
                                        title={t('ai.saved.deleteTitle')}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isAdmin && savedDrafts.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/5 text-center">
                        <Link
                            href="/dashboard/admin"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition"
                        >
                            {t('ai.saved.adminPanel')}
                        </Link>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
