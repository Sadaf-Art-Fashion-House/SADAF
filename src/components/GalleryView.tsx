import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, Camera, Compass, X, Calendar, Globe, Copy, Check, Layers, LayoutGrid } from 'lucide-react';

interface GalleryItem {
  id: string;
  src: string;
  category: string;
  title: string;
  photographer: string;
  location: string;
  campaign: string;
}

export default function GalleryView() {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [copied, setCopied] = useState<boolean>(false);

  const copyDesignTokens = () => {
    const tokens = `
/** SADAF Design System Variable Tokens **/
--color-gold-lustrous: #C9A84C;
--color-prussian-velvet: #0A0F2C;
--color-royal-indigo: #111A45;
--color-coastal-blue: #4FC3F7;
--color-champagne-dust: #E8E0D5;

/** Typography Setting **/
--font-serif: "Space Grotesk", "Outfit", serif;
--font-sans: "Inter", sans-serif;
--font-mono: "JetBrains Mono", monospace;
    `;
    navigator.clipboard.writeText(tokens.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const galleryCategories = ['All', 'Couture Campaigns', 'Artisan Studies', 'Architecture Shadows', 'Figma UX Mockups'];

  const galleryItems: GalleryItem[] = [
    {
      id: "gal-1",
      src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=82",
      category: "Couture Campaigns",
      title: "Al-Muizz Shadows in Dusk Velvet",
      photographer: "Youssef Nabil",
      location: "Gayer-Anderson Palace, Cairo",
      campaign: "Al-Muizz Couture 2026"
    },
    {
      id: "gal-2",
      src: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=82",
      category: "Couture Campaigns",
      title: "Iridescent Seaside Drapery",
      photographer: "Karin Al-Fayed",
      location: "Alexandria Royal Terraces",
      campaign: "Sadaf Mother of Pearl 2026"
    },
    {
      id: "gal-3",
      src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=82",
      category: "Artisan Studies",
      title: "Charcoal Drapery and Ink Outlines",
      photographer: "Sadaf Atelier Curator",
      location: "Sadaf Lab Atelier, old Cairo",
      campaign: "The Diwani Script studies"
    },
    {
      id: "gal-4",
      src: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=82",
      category: "Artisan Studies",
      title: "Gold Foil Calligraphy Stroke Study",
      photographer: "Nour Hammad",
      location: "Fouad Atelier, Alexandria",
      campaign: "Gilded Calligraphy"
    },
    {
      id: "gal-5",
      src: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=82",
      category: "Architecture Shadows",
      title: "Intersecting Fatimid Geometries in Sandstone",
      photographer: "Tariq Al-Hussein",
      location: "Al-Hakim Mosque, Cairo",
      campaign: "Islamic Star Constellations"
    },
    {
      id: "gal-6",
      src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=82",
      category: "Couture Campaigns",
      title: "Bedouin Gilded Cape study in Motion",
      photographer: "Youssef Nabil",
      location: "Siwa Oasis Sands",
      campaign: "Al-Muizz Couture 2026"
    },
    {
      id: "figma-1",
      src: "/src/assets/images/cairo_geometry_room_figma_1779934153159.png",
      category: "Figma UX Mockups",
      title: "3D Virtual Museum Stage Blueprint",
      photographer: "SADAF Lead UI Designer",
      location: "Cairo Geometry Room UX Layout",
      campaign: "Figma Design System"
    },
    {
      id: "figma-2",
      src: "/src/assets/images/ai_studio_design_figma_1779934171967.png",
      category: "Figma UX Mockups",
      title: "SADAF AI Creative Atelier Panel",
      photographer: "SADAF Creative Tech Director",
      location: "Generative Clothing Studio Canvas",
      campaign: "Figma Design System"
    },
    {
      id: "figma-3",
      src: "/src/assets/images/store_figma_mockup_1779938205187.png",
      category: "Figma UX Mockups",
      title: "SADAF Boutique E-Commerce Grid",
      photographer: "SADAF Lead UI Designer",
      location: "SADAF Boutique Store Layout",
      campaign: "Figma Design System"
    },
    {
      id: "figma-4",
      src: "/src/assets/images/lookbook_figma_mockup_1779938224411.png",
      category: "Figma UX Mockups",
      title: "Aesthetic Editorial Lookbook Capsule",
      photographer: "SADAF Art Director",
      location: "SADAF Cinematic Lookbook Grid",
      campaign: "Figma Design System"
    }
  ];

  const filteredItems = filter === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === filter);

  return (
    <div className="relative w-full overflow-hidden min-h-screen pb-20">
      
      {/* Gallery Header */}
      <section className="relative py-16 px-4 md:px-8 bg-[#0A0F2C] border-b border-[#C9A84C]/10 text-center overflow-hidden">
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-[#1B2A6B]/20 blur-[120px] pointer-events-none" />

        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-2 block">SADAF VISUAL ARCHIVE</span>
        <h1 className="text-4xl md:text-5xl font-serif text-white uppercase tracking-tight leading-none mb-3">
          MUSEUM <span className="text-gold-gradient italic font-serif">Aesthetics</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
          Stroll across our cinematic campaign lookbooks, architecture studies, and calligraphy captures, immortalized through the eye of high-end Egyptian curators.
        </p>

        {/* Gallery category tab row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10 max-w-3xl mx-auto px-4">
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                filter === cat
                  ? 'text-[#C9A84C] border-b-2 border-[#C9A84C] font-semibold'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {cat}
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
                {/* Image item asset */}
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-auto object-cover transition-transform duration-[800ms] group-hover:scale-102 filter brightness-[0.82] group-hover:brightness-95"
                />

                {/* Iridescent blue hover overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-left font-sans">
                  <span className="text-[#C9A84C] font-mono text-[9px] uppercase tracking-widest">{item.category}</span>
                  <h3 className="font-serif text-white text-base mt-2 mb-1">{item.title}</h3>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 border-t border-white/10 pt-2 font-mono">
                    <span>By {item.photographer}</span>
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
            <div className="absolute inset-0" onClick={() => setSelectedImage(null)} />

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
              <div className="flex-1 max-h-[70vh] rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-full object-contain"
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
                        Authentic CAD scale specs of SADAF's digital screens. These screens are built directly using high-fidelity vector layouts before tailoring front-end interfaces.
                      </p>

                      {/* Design Tokens list */}
                      <div className="space-y-3 font-mono text-[10px] text-gray-400 border-t border-b border-white/10 py-4 mb-4">
                        <div className="flex justify-between items-center text-slate-500 uppercase font-bold">
                          <span>SADAF Colors</span>
                          <span className="text-white text-[8px] border border-white/10 px-1 rounded">HEX Code</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" /> Lustrous Gold</span>
                          <span className="text-[#C9A84C] font-bold">#C9A84C</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0A0F2C]" /> Prussian Velvet</span>
                          <span className="text-white">#0A0F2C</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4FC3F7]" /> Coastal Blue</span>
                          <span className="text-[#4FC3F7]">#4FC3F7</span>
                        </div>
                        
                        <div className="border-t border-white/5 pt-3 flex justify-between">
                          <span className="text-slate-500 uppercase">Grid Layout</span>
                          <span className="text-white text-right">12-Col Desktop Dynamic</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 uppercase">Fonts Setup</span>
                          <span className="text-white text-right">Inter &amp; Space Grotesk</span>
                        </div>
                      </div>

                      {/* Action trigger to copy CSS tokens */}
                      <button
                        onClick={copyDesignTokens}
                        className={`w-full py-2.5 px-4 rounded text-[10px] font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-300 border cursor-pointer ${
                          copied
                            ? "bg-green-950/40 text-green-400 border-green-500/30"
                            : "bg-[#C9A84C]/10 text-[#C9A84C] label-gold hover:bg-[#C9A84C] hover:text-[#0A0F2C] border-[#C9A84C]/25"
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check size={12} /> Copied Design Variables
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy Design Tokens
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2 text-[10px] text-gray-500 font-mono mt-6 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1">
                        <Layers size={10} /> <span>Vector Native Assets</span>
                      </div>
                      <span>&bull;</span>
                      <div className="flex items-center gap-1">
                        <Globe size={10} /> <span>SADAF Design Lab</span>
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
                          <span className="text-gray-500 uppercase">Auteur Photographer</span>
                          <span className="text-white">{selectedImage.photographer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">Heritage Scene</span>
                          <span className="text-white">{selectedImage.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">Visual Chapter</span>
                          <span className="text-white font-serif italic text-xs text-[#ebd083]">{selectedImage.category}</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-300 leading-relaxed font-sans flex items-start gap-2">
                        <Compass size={14} className="text-[#4FC3F7] shrink-0 mt-0.5" />
                        <span>This photographic exposure captures our design narrative directly in historic Egypt places. These visual shadows inspired the tailored cuts inside the active collections.</span>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[10px] text-gray-500 font-mono mt-8 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} /> <span>Captured 2026</span>
                      </div>
                      <span>&bull;</span>
                      <div className="flex items-center gap-1">
                        <Globe size={10} /> <span>Heritage Preserved</span>
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
