'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Search,
    X,
    Clock,
    TrendingUp,
    ChevronRight,
    Sparkles,
    Grid,
    List,
    SlidersHorizontal,
    Star,
} from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { SEARCH_CATEGORIES } from '../constants/searchCategories';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { RatingsByProduct } from '@/features/reviews/hooks/useAggregatedRatings';
import type { SearchResult, SearchCategory } from '../types';

interface SearchViewProps {
    allResults: SearchResult[];
    /** Aggregated mock + user ratings per product id (null = no reviews yet). */
    ratingsByProduct?: RatingsByProduct;
}

export default function SearchView({ allResults, ratingsByProduct = {} }: SearchViewProps) {
    const { t, tc } = useLanguage();
    const {
        query,
        setQuery,
        category,
        setCategory,
        isSearching,
        recentSearches,
        clearRecentSearches,
        filteredResults,
        handleSearch,
    } = useSearch(allResults);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        }
    };

    const hasResults = filteredResults.length > 0;
    const showNoResults = !isSearching && query.trim().length > 0 && !hasResults;

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Hero / Search Bar Section */}
            <section className="relative py-16 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] via-[#1B2A6B]/20 to-[#0A0F2C] text-center overflow-hidden">
                <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#4FC3F7]/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

                <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">
                    {t('search.kicker')}
                </span>
                <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight leading-none mb-4">
                    {t('search.title')} <span className="text-gold-gradient font-serif italic">{t('search.titleAccent')}</span>
                </h1>
                <p className="text-sm md:text-base text-[#E8E0D5]/70 max-w-2xl mx-auto font-sans tracking-wide leading-relaxed mb-10">
                    {t('search.subtitle')}
                </p>

                {/* Search Input */}
                <div className="max-w-2xl mx-auto relative">
                    <div className="relative flex items-center bg-[#0A0F2C] border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 rounded-2xl overflow-hidden shadow-lg shadow-black/30 transition-all duration-300">
                        <Search size={18} className="absolute left-5 text-[#C9A84C]/60 pointer-events-none shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('search.placeholder')}
                            className="w-full bg-transparent text-white placeholder:text-[#E8E0D5]/30 text-sm md:text-base py-5 pl-14 pr-14 outline-none font-sans tracking-wide"
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-5 p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Search hint */}
                    {!query && (
                        <p className="text-[10px] text-slate-500 font-mono mt-3 tracking-wider">
                            {t('search.hint', { key: 'Enter' })}
                        </p>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-10 max-w-3xl mx-auto px-4">
                    {SEARCH_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat as SearchCategory)}
                            className={`px-5 py-2.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all duration-300 cursor-pointer active:scale-95 ${
                                category === cat
                                    ? 'bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] shadow-lg shadow-[#C9A84C]/10 font-semibold'
                                    : 'bg-[#0A0F2C]/60 text-[#E8E0D5]/70 hover:text-white border border-[#E8E0D5]/10 hover:border-[#4FC3F7]/40'
                            }`}
                        >
                            {tc(`search.cat.${cat}`, cat)}
                        </button>
                    ))}
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Recent Searches */}
                {!query && recentSearches.length > 0 && (
                    <section className="py-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400 font-mono tracking-wider">
                                <Clock size={14} className="text-[#C9A84C]" />
                                <span className="uppercase text-[10px]">{t('search.recent')}</span>
                            </div>
                            <button
                                onClick={clearRecentSearches}
                                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer font-mono uppercase tracking-wider"
                            >
                                {t('search.clear')}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((term) => (
                                <button
                                    key={term}
                                    onClick={() => handleSearch(term)}
                                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:border-[#C9A84C]/40 transition-all duration-300 cursor-pointer"
                                >
                                    <TrendingUp size={10} className="inline mr-1.5 text-[#C9A84C]" />
                                    {term}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* View Toggle + Results Count */}
                {query && (
                    <section className="py-6 flex items-center justify-between border-b border-[#C9A84C]/10">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-mono">
                                {isSearching ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 border border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                                        {t('search.searching')}
                                    </span>
                                ) : (
                                    <span>
                                        <strong className="text-white">{filteredResults.length}</strong> {t('search.resultsFor')}{' '}
                                        <span className="text-[#C9A84C]">&ldquo;{query}&rdquo;</span>
                                    </span>
                                )}
                            </span>
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="ml-4 p-1.5 rounded border border-white/10 hover:border-[#4FC3F7] text-slate-400 hover:text-white transition-all cursor-pointer"
                                title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                            >
                                {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
                            </button>
                        </div>

                        {hasResults && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                <SlidersHorizontal size={12} />
                                <span>{t('search.category')}: {tc(`search.cat.${category}`, category)}</span>
                            </div>
                        )}
                    </section>
                )}

                {/* Loading State */}
                {isSearching && query && (
                    <section className="py-16 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-4" />
                        <p className="text-sm text-slate-400 font-mono">{t('search.loading')}</p>
                    </section>
                )}

                {/* No Results */}
                {showNoResults && (
                    <section className="py-16 text-center">
                        <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                            <Search size={24} className="text-slate-500" />
                        </div>
                        <h3 className="text-lg font-serif text-white mb-2">{t('search.noResults')}</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                            {t('search.noResultsBody', { query, category: tc(`search.cat.${category}`, category) })}
                        </p>
                        <button
                            onClick={() => setQuery('')}
                            className="px-5 py-2 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] text-xs uppercase tracking-wider font-semibold hover:bg-[#C9A84C] hover:text-[#0A0F2C] transition-all duration-300 cursor-pointer"
                        >
                            {t('search.clearSearch')}
                        </button>
                    </section>
                )}

                {/* Results Grid / List */}
                {hasResults && (
                    <section className="py-8">
                        <AnimatePresence mode="wait">
                            {viewMode === 'grid' ? (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                >
                                    {filteredResults.map((result) => (
                                        <SearchCard
                                            key={result.id}
                                            result={result}
                                            rating={ratingsByProduct[result.id]}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col gap-4"
                                >
                                    {filteredResults.map((result) => (
                                        <SearchListItem
                                            key={result.id}
                                            result={result}
                                            rating={ratingsByProduct[result.id]}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                )}

                {/* Empty State (no query) */}
                {!query && (
                    <section className="py-16 text-center">
                        <div className="inline-flex p-4 rounded-full bg-[#C9A84C]/5 border border-[#C9A84C]/10 mb-4">
                            <Sparkles size={24} className="text-[#C9A84C]/60" />
                        </div>
                        <h3 className="text-lg font-serif text-white mb-2">{t('search.discover')}</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                            {t('search.discoverBody')}
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function SearchCard({ result, rating }: { result: SearchResult; rating?: RatingsByProduct[string] }) {
    const { t } = useLanguage();
    return (
        <Link
            href={result.href}
            className="group relative flex flex-col bg-[#0A0F2C]/90 border border-[#C9A84C]/5 hover:border-[#C9A84C]/30 rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(201,168,76,0.08)] transition-all duration-500"
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
                <Image
                    src={result.image}
                    alt={result.title}
                    fill
                    className="object-cover transition-transform duration-[800ms] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F2C] via-transparent to-transparent" />

                {/* Type Badge */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A0F2C]/80 backdrop-blur-sm border border-white/10 text-[9px] font-mono uppercase tracking-wider text-[#4FC3F7]">
                    {result.type}
                </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-serif text-[#E8E0D5] text-sm group-hover:text-[#F0D080] transition-colors duration-300 mb-1 leading-tight line-clamp-2">
                        {result.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans line-clamp-1 mb-2">{result.subtitle}</p>

                    {/* Aggregated rating on product cards (mock + user reviews) */}
                    {result.type === 'product' && (
                        <div className="flex items-center gap-1.5">
                            <Star size={10} className="text-[#C9A84C]" fill="currentColor" />
                            <span className="text-[10px] font-mono text-[#E8E0D5]">
                                {rating ? rating.average.toFixed(1) : t('search.new')}
                            </span>
                            {rating && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                    &middot; {rating.count} {t('store.reviews')}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#E8E0D5]/10">
                    <span className="text-xs font-mono text-[#C9A84C] font-semibold">
                        ${result.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-[#4FC3F7]/70 flex items-center gap-1 group-hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider">
                        {t('search.view')} <ChevronRight size={10} />
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ─── List Item ────────────────────────────────────────────────────────────────

function SearchListItem({ result, rating }: { result: SearchResult; rating?: RatingsByProduct[string] }) {
    const { t } = useLanguage();
    return (
        <Link
            href={result.href}
            className="group flex items-center gap-5 p-4 bg-[#0A0F2C]/90 border border-[#C9A84C]/5 hover:border-[#C9A84C]/20 rounded-xl transition-all duration-300 hover:bg-[#0A0F2C]"
        >
            <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-black/40">
                <Image
                    src={result.image}
                    alt={result.title}
                    fill
                    className="object-cover"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-full border border-white/10 text-[8px] font-mono uppercase text-[#4FC3F7]">
                        {result.type}
                    </span>
                    <span className="text-[9px] text-slate-500">{result.category}</span>
                </div>
                <h3 className="font-serif text-white text-sm group-hover:text-[#F0D080] transition-colors truncate">
                    {result.title}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">{result.subtitle}</p>

                {/* Aggregated rating on product cards (mock + user reviews) */}
                {result.type === 'product' && (
                    <div className="flex items-center gap-1.5 mt-1">
                        <Star size={10} className="text-[#C9A84C]" fill="currentColor" />
                        <span className="text-[10px] font-mono text-[#E8E0D5]">
                            {rating ? rating.average.toFixed(1) : t('search.new')}
                        </span>
                        {rating && (
                            <span className="text-[9px] text-slate-500 font-mono">
                                &middot; {rating.count} {t('store.reviews')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="text-right shrink-0">
                <p className="font-mono text-sm text-[#C9A84C] font-semibold">
                    ${result.price.toLocaleString()}
                </p>
                <span className="text-[9px] text-[#4FC3F7]/60 flex items-center gap-1 justify-end mt-1 group-hover:text-[#4FC3F7] transition-colors font-mono uppercase tracking-wider">
                    {t('search.view')} <ChevronRight size={10} />
                </span>
            </div>
        </Link>
    );
}
