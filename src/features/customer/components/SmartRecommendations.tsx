'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Sparkles,
    ArrowRight,
    ShoppingBag,
    Gem,
    Percent,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ProductRecommendation } from '../types';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface SmartRecommendationsProps {
    /** Offers matched to the customer's top spending categories. */
    recommendations: ProductRecommendation[];
}

const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
    'Traditional Fusion': Gem,
    Women: Sparkles,
    Men: ShoppingBag,
    'Art Pieces': Sparkles,
    'Limited Edition': Gem,
};

/**
 * Smart Recommendations — product offers matched to the customer's spending
 * habits. The API ranks the customer's top categories and returns one offer
 * per top category; this renders them as offer cards with discount badges,
 * the "why" behind each pick, and a link into the catalog.
 */
export default function SmartRecommendations({ recommendations }: SmartRecommendationsProps) {
    const { t } = useLanguage();

    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="mb-8 p-5 bg-[#05081A]/90 border border-[#C9A84C]/10 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                        <Percent size={14} />
                    </div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t('rec.title')}
                    </h3>
                </div>
                <span className="text-[9px] font-mono text-[#E8E0D5]/40">
                    {t('rec.basedOn')}
                </span>
            </div>

            {/* Recommendation cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => {
                    const Icon = CATEGORY_ICONS[rec.category] ?? ShoppingBag;
                    return (
                        <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
                            className="group relative p-4 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/25 rounded-2xl transition-all duration-300 flex flex-col"
                        >
                            {/* Discount badge */}
                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-black bg-[#C9A84C]">
                                -{rec.discountPercent}%
                            </div>

                            {/* Category icon + name */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                                    <Icon size={12} />
                                </div>
                                <span className="text-[8px] font-mono uppercase tracking-widest text-[#E8E0D5]/40">
                                    {rec.category}
                                </span>
                            </div>

                            {/* Product */}
                            <h4 className="text-sm font-serif text-white font-bold tracking-tight leading-snug">
                                {rec.title}
                            </h4>
                            <p className="text-[10px] text-[#E8E0D5]/50 leading-relaxed mt-1 mb-3 flex-1">
                                {rec.description}
                            </p>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-base font-mono font-bold text-[#C9A84C]">
                                    {formatCurrency(rec.price)}
                                </span>
                                <span className="text-[9px] font-mono text-[#E8E0D5]/30 line-through">
                                    {formatCurrency(rec.originalPrice)}
                                </span>
                            </div>

                            {/* Reason chip */}
                            <p className="text-[8px] font-mono text-[#E8E0D5]/35 italic mb-3 leading-relaxed">
                                {rec.reason}
                            </p>

                            {/* CTA */}
                            <Link
                                href={rec.href}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-widest font-bold text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C] hover:text-black border border-[#C9A84C]/25 transition-all duration-300 cursor-pointer"
                            >
                                {t('rec.viewOffer')}
                                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
