"use client";

/**
 * SADAF | Lookbook — Seasonal Editorial View (pure presentation)
 *
 * A cinematic editorial page: hero, a selectable campaign rail, an active
 * look spread with atelier notes, a gallery of every look, and shop CTAs.
 * All strings go through t(); look data is bilingual via the
 * localizedLookbook* helpers (falls back to English fields).
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Compass, Sparkles, Camera } from "lucide-react";
import { SmartClamp } from "@/shared/ui/SmartClamp";
import { DirectionalIcon } from "@/shared/ui/DirectionalIcon";
import type { LookbookItem } from "@/shared/types";
import { ROUTES } from "@/config/routes";
import { useLanguage } from "@/features/i18n/LanguageProvider";
import {
    localizedLookbookDescription,
    localizedLookbookSubtitle,
    localizedLookbookTitle,
} from "@/features/i18n/productNames";

interface LookbookViewProps {
    lookbookItems: LookbookItem[];
}

export default function LookbookView({ lookbookItems }: LookbookViewProps) {
    const { t, language } = useLanguage();
    const [activeLookId, setActiveLookId] = useState<string>(
        lookbookItems[0]?.id ?? "",
    );

    const activeIndex = useMemo(
        () => lookbookItems.findIndex((item) => item.id === activeLookId),
        [lookbookItems, activeLookId],
    );
    const activeLook = lookbookItems[activeIndex] ?? lookbookItems[0];

    const goTo = (direction: 1 | -1) => {
        if (lookbookItems.length === 0) return;
        const next = (activeIndex + direction + lookbookItems.length) % lookbookItems.length;
        setActiveLookId(lookbookItems[next].id);
    };

    if (!activeLook) {
        return (
            <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center text-slate-400 text-sm">
                {t("lookbook.subtitle")}
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden min-h-screen pb-20 bg-[#0A0F2C]">
            {/* Decorative glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#1B2A6B]/20 blur-[130px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

            {/* ── Hero ── */}
            <section className="relative pt-20 pb-14 px-4 md:px-8 border-b border-[#C9A84C]/10 text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">
                        {t("lookbook.kicker")}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif text-white uppercase tracking-tight leading-none mb-4">
                        {t("lookbook.title")}{" "}
                        <span className="text-gold-gradient font-serif italic">
                            {t("lookbook.titleAccent")}
                        </span>
                    </h1>
                    <p className="text-sm md:text-base text-[#E8E0D5]/70 max-w-2xl mx-auto font-sans tracking-wide leading-relaxed">
                        {t("lookbook.subtitle")}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-[10px] font-mono uppercase tracking-widest">
                            <Camera size={11} />
                            {t("lookbook.looks", { count: lookbookItems.length })}
                        </span>
                    </div>
                </motion.div>
            </section>

            {/* ── Campaign rail ── */}
            <section className="relative py-12 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                        {t("lookbook.campaigns")}
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500">
                        {String(activeIndex + 1).padStart(2, "0")} /{" "}
                        {String(lookbookItems.length).padStart(2, "0")}
                    </span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {lookbookItems.map((item) => {
                        const isActive = item.id === activeLook.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveLookId(item.id)}
                                aria-pressed={isActive}
                                className={`group relative w-40 md:w-52 shrink-0 snap-start text-left rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                                    isActive
                                        ? "border-[#C9A84C] ring-1 ring-[#C9A84C]/50 shadow-lg shadow-[#C9A84C]/10"
                                        : "border-white/10 hover:border-[#C9A84C]/40"
                                }`}
                            >
                                <div className="relative aspect-[3/4] bg-black/40">
                                    <Image
                                        src={item.image}
                                        alt={localizedLookbookTitle(item, language)}
                                        fill
                                        sizes="(max-width: 768px) 160px, 208px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                    <div className="absolute bottom-0 inset-x-0 p-3">
                                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#C9A84C] block mb-0.5">
                                            {t("fashion.campaignYear", { year: item.year })}
                                        </span>
                                        <SmartClamp
                                            as="span"
                                            maxLines={2}
                                            className="text-[11px] font-serif text-white leading-tight"
                                            text={localizedLookbookTitle(item, language)}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Active look spread ── */}
            <section className="relative py-8 px-4 md:px-8 max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeLook.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#070A20]/80 border border-[#C9A84C]/10 rounded-2xl overflow-hidden p-6 md:p-10 shadow-2xl"
                    >
                        {/* Large image */}
                        <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-white/10 group min-h-[380px] md:min-h-[460px]">
                            <Image
                                src={activeLook.image}
                                alt={localizedLookbookTitle(activeLook, language)}
                                fill
                                sizes="(min-width: 1024px) 58vw, 100vw"
                                className="object-cover brightness-[0.8] group-hover:scale-[1.02] transition-transform duration-[1200ms]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                            <div className="absolute top-4 left-4 bg-[#C9A84C] text-[#0A0F2C] font-mono font-bold text-xs px-2.5 py-1 rounded border border-[#F0D080]/30">
                                {t("fashion.campaignYear", { year: activeLook.year })}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-6">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#4FC3F7] block mb-1">
                                    {localizedLookbookSubtitle(activeLook, language)}
                                </span>
                                <h3 className="text-white font-serif text-2xl md:text-3xl font-semibold">
                                    {localizedLookbookTitle(activeLook, language)}
                                </h3>
                            </div>
                        </div>

                        {/* Details panel */}
                        <div className="lg:col-span-5 flex flex-col justify-center text-left p-2 md:p-4">
                            <Compass className="text-[#C9A84C] mb-4" size={26} />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] mb-2">
                                {t("fashion.collectionDesc", { year: activeLook.year })}
                            </span>
                            <p className="text-[#E8E0D5]/80 text-xs md:text-sm leading-relaxed mb-6 font-sans">
                                {localizedLookbookDescription(activeLook, language)}
                            </p>

                            <div className="flex items-start gap-3 border-t border-white/10 pt-4 mb-6">
                                <Sparkles size={13} className="text-[#C9A84C] shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs uppercase font-mono text-[#C9A84C]">
                                        {t("fashion.atelierNotes")}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {t("fashion.atelierNotes.body")}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-auto">
                                <Link
                                    href={ROUTES.FASHION}
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-[#C9A84C]/10"
                                >
                                    {t("lookbook.shopTheLook")}
                                    <DirectionalIcon icon={ArrowRight} size={12} />
                                </Link>
                                <div className="flex items-center gap-2 ms-auto">
                                    <button
                                        onClick={() => goTo(-1)}
                                        aria-label={t("lookbook.prevLook")}
                                        className="p-2.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-[#C9A84C]/40 transition-all duration-300 cursor-pointer"
                                    >
                                        <DirectionalIcon icon={ArrowLeft} size={13} />
                                    </button>
                                    <button
                                        onClick={() => goTo(1)}
                                        aria-label={t("lookbook.nextLook")}
                                        className="p-2.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-[#C9A84C]/40 transition-all duration-300 cursor-pointer"
                                    >
                                        <DirectionalIcon icon={ArrowRight} size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* ── Gallery of every look ── */}
            <section className="relative py-14 px-4 md:px-8 max-w-7xl mx-auto">
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold mb-6">
                    {t("lookbook.campaigns")} — {String(lookbookItems.length).padStart(2, "0")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lookbookItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            onClick={() => setActiveLookId(item.id)}
                            className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5 hover:border-[#C9A84C]/40 transition-all duration-500 cursor-pointer text-left"
                        >
                            <Image
                                src={item.image}
                                alt={localizedLookbookTitle(item, language)}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-cover brightness-[0.75] group-hover:brightness-100 group-hover:scale-105 transition-all duration-[900ms]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md border border-white/10 text-[#C9A84C] font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-widest">
                                {t("fashion.campaignYear", { year: item.year })}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-5">
                                <h3 className="font-serif text-white text-lg group-hover:text-[#F0D080] transition-colors duration-300">
                                    {localizedLookbookTitle(item, language)}
                                </h3>
                                <SmartClamp
                                    as="p"
                                    maxLines={1}
                                    className="text-[10px] text-[#E8E0D5]/60 mt-1 font-sans"
                                    text={localizedLookbookSubtitle(item, language)}
                                />
                            </div>
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* ── Shop CTA band ── */}
            <section className="relative py-16 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="rounded-2xl border border-[#C9A84C]/15 bg-gradient-to-r from-[#0C1130] via-[#141B44] to-[#0C1130] px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">
                            {t("lookbook.shopCollection")}
                        </h3>
                        <p className="text-sm text-slate-400 font-sans max-w-md">
                            {t("lookbook.subtitle")}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Link
                            href={ROUTES.STORE}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C9A84C] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-lg shadow-[#C9A84C]/10"
                        >
                            {t("lookbook.exploreStore")}
                            <DirectionalIcon icon={ArrowRight} size={12} />
                        </Link>
                        <Link
                            href={ROUTES.FASHION}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#C9A84C]/10 transition-all duration-300"
                        >
                            {t("lookbook.viewFashion")}
                            <DirectionalIcon icon={ArrowRight} size={12} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
