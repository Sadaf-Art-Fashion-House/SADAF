"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn,
  Camera,
  Compass,
  X,
  Calendar,
  Globe,
  Copy,
  Check,
  Layers,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";
import type { GalleryItem } from "../types";
import { useLanguage } from "@/features/i18n/LanguageProvider";

interface GalleryViewProps {
  galleryItems: GalleryItem[];
  onCopyTokens: () => void;
  copied: boolean;
}

export default function GalleryView({
  galleryItems,
  onCopyTokens,
  copied,
}: GalleryViewProps) {
  const { t, tc } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>("All");

  // Category labels translate; the internal filter value stays the raw
  // English category so the data-driven comparison keeps working.
  const galleryCategories = [
    { value: "All", label: t("gallery.cat.all") },
    { value: "Couture Campaigns", label: t("gallery.cat.couture") },
    { value: "Artisan Studies", label: t("gallery.cat.artisan") },
    { value: "Architecture Shadows", label: t("gallery.cat.architecture") },
    { value: "Figma UX Mockups", label: t("gallery.cat.figma") },
  ];

  const filteredItems =
    filter === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  return (
    <div className="relative w-full overflow-hidden min-h-screen pb-20">
      {/* Gallery Header */}
      <section className="relative py-16 px-4 md:px-8 bg-[#0A0F2C] border-b border-[#C9A84C]/10 text-center overflow-hidden">
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-[#1B2A6B]/20 blur-[120px] pointer-events-none" />

        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-2 block">
          {t("gallery.kicker")}
        </span>
        <h1 className="text-4xl md:text-5xl font-serif text-white uppercase tracking-tight leading-none mb-3">
          {t("gallery.title")}{" "}
          <span className="text-gold-gradient italic font-serif">
            {t("gallery.titleAccent")}
          </span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
          {t("gallery.subtitle")}
        </p>

        {/* Gallery category tab row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10 max-w-3xl mx-auto px-4">
          {galleryCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                filter === cat.value
                  ? "text-[#C9A84C] border-b-2 border-[#C9A84C] font-semibold"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Masonry-Style Layout Gallery */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                onClick={() => setSelectedImage(item)}
                className="break-inside-avoid relative rounded-xl overflow-hidden border border-white/5 bg-[#0F1430] group cursor-pointer shadow-lg hover:border-[#4FC3F7]/30 transition-all duration-300"
              >
                {/* Image item asset.
                    Kept as a plain <img> (not next/image) on purpose: this is
                    a masonry layout where each photo's natural aspect ratio
                    drives the column height, and none of these dimensions are
                    stored ahead of time. next/image requires either a fixed
                    width/height (which would distort these varied photos) or
                    `fill` inside a fixed-aspect-ratio container (which would
                    defeat the masonry effect). */}
                <div className="relative w-full h-auto">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-auto object-cover transition-transform duration-[800ms] group-hover:scale-102 filter brightness-[0.82] group-hover:brightness-95"
                  />
                </div>

                {/* Iridescent blue hover overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-left font-sans">
                  <span className="text-[#C9A84C] font-mono text-[9px] uppercase tracking-widest">
                    {tc(`gallery.cat.${item.category}`, item.category)}
                  </span>
                  <h3 className="font-serif text-white text-base mt-2 mb-1">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 border-t border-white/10 pt-2 font-mono">
                    <span>{t("gallery.by")} {item.photographer}</span>
                    <ZoomIn size={12} className="text-[#4FC3F7]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Fullscreen Interactive Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            {/* click close background */}
            <div
              className="absolute inset-0"
              onClick={() => setSelectedImage(null)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full flex flex-col md:flex-row gap-8 bg-[#0A0F2C] border border-[#C9A84C]/20 p-5 rounded-2xl overflow-hidden shadow-2xl z-10 text-left font-sans"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition z-10"
              >
                <X size={20} />
              </button>

              {/* Main asset view */}
              <div className="flex-1 max-h-[70vh] rounded-lg overflow-hidden bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>

              {/* metadata and camera stats sidebar */}
              <div className="w-full md:w-80 flex flex-col justify-between py-2">
                {selectedImage.category === "Figma UX Mockups" ? (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#C9A84C] font-mono tracking-widest mb-1 font-bold">
                        <LayoutGrid size={12} className="animate-pulse" />
                        <span>{selectedImage.campaign}</span>
                      </div>

                      <h3 className="font-serif text-white text-xl font-semibold leading-tight mb-4 uppercase">
                        {selectedImage.title}
                      </h3>

                      <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                        {t("gallery.tokens.kicker")}
                      </p>

                      {/* Design Tokens list */}
                      <div className="space-y-3 font-mono text-[10px] text-gray-400 border-t border-b border-white/10 py-4 mb-4">
                        <div className="flex justify-between items-center text-slate-500 uppercase font-bold">
                          <span>{t("gallery.tokens.colors")}</span>
                          <span className="text-white text-[8px] border border-white/10 px-1 rounded">
                            {t("gallery.tokens.hex")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />{" "}
                            {t("gallery.tokens.gold")}
                          </span>
                          <span className="text-[#C9A84C] font-bold">
                            #C9A84C
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0A0F2C]" />{" "}
                            {t("gallery.tokens.velvet")}
                          </span>
                          <span className="text-white">#0A0F2C</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4FC3F7]" />{" "}
                            {t("gallery.tokens.blue")}
                          </span>
                          <span className="text-[#4FC3F7]">#4FC3F7</span>
                        </div>

                        <div className="border-t border-white/5 pt-3 flex justify-between">
                          <span className="text-slate-500 uppercase">
                            {t("gallery.tokens.grid")}
                          </span>
                          <span className="text-white text-right">
                            {t("gallery.tokens.gridValue")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase">
                            {t("gallery.tokens.fonts")}
                          </span>
                          <span className="text-white text-right">
                            {t("gallery.tokens.fontsValue")}
                          </span>
                        </div>
                      </div>

                      {/* Action trigger to copy CSS tokens */}
                      <button
                        onClick={onCopyTokens}
                        className={`w-full py-2.5 px-4 rounded text-[10px] font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300 border cursor-pointer ${
                          copied
                            ? "bg-green-950/40 text-green-400 border-green-500/30"
                            : "bg-[#C9A84C]/10 text-[#C9A84C] label-gold hover:bg-[#C9A84C] hover:text-[#0A0F2C] border-[#C9A84C]/25"
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check size={12} /> {t("gallery.copied")}
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> {t("gallery.copyTokens")}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2 text-[10px] text-gray-500 font-mono mt-6 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1">
                        <Layers size={10} /> <span>{t("gallery.tokens.vector")}</span>
                      </div>
                      <span>&bull;</span>
                      <div className="flex items-center gap-1">
                        <Globe size={10} /> <span>{t("gallery.tokens.lab")}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#C9A84C] uppercase font-mono tracking-widest mb-1">
                        <Camera size={12} />
                        <span>{selectedImage.campaign}</span>
                      </div>

                      <h3 className="font-serif text-white text-xl font-semibold leading-tight mb-4 uppercase">
                        {selectedImage.title}
                      </h3>

                      <div className="space-y-3 font-mono text-[11px] text-gray-400 border-t border-b border-white/10 py-4 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">
                            {t("gallery.auteur")}
                          </span>
                          <span className="text-white">
                            {selectedImage.photographer}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">
                            {t("gallery.scene")}
                          </span>
                          <span className="text-white">
                            {selectedImage.location}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">
                            {t("gallery.chapter")}
                          </span>
                          <span className="text-white font-serif italic text-xs text-[#ebd083]">
                            {tc(`gallery.cat.${selectedImage.category}`, selectedImage.category)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-300 leading-relaxed font-sans flex items-start gap-2">
                        <Compass
                          size={14}
                          className="text-[#4FC3F7] shrink-0 mt-0.5"
                        />
                        <span>
                          {t("gallery.caption")}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[10px] text-gray-500 font-mono mt-8 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} /> <span>{t("gallery.captured")} 2026</span>
                      </div>
                      <span>&bull;</span>
                      <div className="flex items-center gap-1">
                        <Globe size={10} /> <span>{t("gallery.preserved")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}