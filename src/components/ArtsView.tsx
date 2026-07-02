import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingCart, Tag, Eye, Layers } from 'lucide-react';
import { ArtPiece, ArtCategory } from '../types';
import { Compass, Grid } from 'lucide-react'; 
import VirtualExhibition from './VirtualExhibition'; 

interface ArtsViewProps {
  artworks: ArtPiece[];
  onAddToCart: (art: ArtPiece) => void;
  onSelectArtPiece: (art: ArtPiece) => void;
}

export default function ArtsView({ artworks, onAddToCart, onSelectArtPiece }: ArtsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<ArtCategory | 'All'>('All');
  const [showVirtualDetails, setShowVirtualDetails] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'metaverse' | 'catalog'>('metaverse');

  const categories: (ArtCategory | 'All')[] = ['All', 'Handmade', 'Oil Paintings', 'Calligraphy', 'Digital Art', 'Fashion Sketches'];

  const filteredArtworks = selectedCategory === 'All'
    ? artworks
    // : artworks.filter(item => item.category === selectedCategory);
    // : artworks.filter(item => item.category === selectedCategory || item.category === `Art - ${selectedCategory}`);
    // : artworks.filter(item =>
    //   item.category === selectedCategory ||
    //   item.category === `Art - ${selectedCategory}` ||
    //   item.category?.replace('Art - ', '') === selectedCategory
    // );

    : artworks.filter(item => {
      const cat = item.category?.replace('Art - ', '') || '';
      return cat === selectedCategory;
    });

  const keyExhibits = [
    {
      id: "ex-1",
      title: "The Fatimid Muqarnas Archway",
      period: "10th Century Fatimid Cairo",
      highlight: "Geometric ceiling plaster molds on velvet drapes.",
      story: "Fatimid geometry relies heavily on symmetric star meshes, representing order and cosmos in divine proportion. Hand-dyed navy panels recreate this."
    },
    {
      id: "ex-2",
      title: "Pearl Inlays of the Alexandrian Coast",
      period: "Ottoman-Alexandrian Fusion",
      highlight: "Finely hand-carved Saltwater Sadaf dorned copper.",
      story: "Alexandrian craftsmen spent generations mastering the delicate inlay of iridescent shellfish shells (Sadaf) inside dense olive wood and red copper plates."
    },
    {
      id: "ex-3",
      title: "The Gilded Thuluth Verse",
      period: "Medieval Calligraphy Lineage",
      highlight: "Pure 24K powdered gold paint and reed pen strokes.",
      story: "Each brush alignment represents breathing loops, connecting physical craftsmanship to standard calligraphic scales. Fluidity meets structural apparel cuts."
    }
  ];

  return (
    <div className="relative w-full overflow-hidden min-h-screen pb-20">
      {/* Arts Hero Section */}
      <section className="relative py-20 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-gradient-to-b from-[#0A0F2C] to-[#12193E] text-center overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[#4FC3F7]/5 blur-[120px] pointer-events-none" />

        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">SADAF ATELIER FINE GALLERY</span>
        <h1 className="text-4xl md:text-6xl font-serif text-white uppercase tracking-tight leading-none mb-4">
          CURATED <span className="text-gold-gradient font-serif italic">Artistry</span>
        </h1>
        <p className="text-sm md:text-base text-[#E8E0D5]/75 max-w-2xl mx-auto font-sans tracking-wide leading-relaxed">
          Step into our high-end exhibit highlighting authentic Egyptian heritage, calligraphy paintings, and delicate copperware. Available for collectors or on custom apparel prints.
        </p>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setViewMode('metaverse')}
            className={`px-5 py-3 rounded-full text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
              viewMode === 'metaverse'
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] shadow-lg shadow-[#C9A84C]/25'
                : 'bg-white/5 text-[#E8E0D5]/60 hover:text-white border border-white/10'
            }`}
          >
            <Compass size={13} className={viewMode === 'metaverse' ? 'animate-spin' : ''} /> 
            3D Metaverse Museum
          </button>
          <button
            onClick={() => setViewMode('catalog')}
            className={`px-5 py-3 rounded-full text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
              viewMode === 'catalog'
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] shadow-lg shadow-[#C9A84C]/25'
                : 'bg-white/5 text-[#E8E0D5]/60 hover:text-white border border-white/10'
            }`}
          >
            <Grid size={13} /> 
            Standard Art Catalog
          </button>
        </div>

        {/* Filter Tabs
        <div className="flex flex-wrap items-center justify-center gap-2 mt-12 max-w-4xl mx-auto px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all duration-300 cursor-pointer active:scale-95 ${selectedCategory === cat
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] shadow-lg shadow-[#C9A84C]/10 font-semibold'
                : 'bg-[#0A0F2C]/60 text-[#E8E0D5]/70 hover:text-white border border-[#E8E0D5]/10 hover:border-[#4FC3F7]/40'
                }`}
            >
              {cat}
            </button>
          ))}
        </div> */}
        {viewMode === 'catalog' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-8 max-w-4xl mx-auto px-4"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all duration-300 cursor-pointer active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] shadow-lg shadow-[#C9A84C]/10 font-semibold'
                    : 'bg-[#0A0F2C]/60 text-[#E8E0D5]/70 hover:text-white border border-[#E8E0D5]/10 hover:border-[#4FC3F7]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}
      </section>
 
      Masonry-Style Responsive Grid
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredArtworks.map((art) => (
              <motion.div
                key={art.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="group relative flex flex-col bg-[#0A0F2C]/90 border border-[#C9A84C]/10 rounded-xl overflow-hidden shadow-xl hover:border-[#4FC3F7]/40 transition-all duration-500"
              >
                {/* Art Stage image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                  />

                  {/* Glass Overlap Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F2C] via-[#0A0F2C]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <span className="text-[#C9A84C] text-[10px] font-mono tracking-widest uppercase mb-1">{art.category}</span>
                    <h3 className="text-xl font-serif text-white mb-2">{art.title}</h3>
                    <p className="text-xs text-[#E8E0D5]/80 mb-4 line-clamp-3">{art.description}</p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => onSelectArtPiece(art)}
                        className="flex-1 px-4 py-2 rounded bg-white/10 hover:bg-[#4FC3F7] hover:text-[#0A0F2C] text-xs text-white uppercase tracking-wider font-semibold transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} /> Inspect Detail
                      </button>
                    </div>
                  </div>
                </div>

                {/* Always-on Info */}
                <div className="p-5 flex-1 flex flex-col justify-between border-t border-[#E8E0D5]/5">
                  <div>
                    <div className="flex justify-between items-start mb-1 h-12">
                      <h4 className="font-serif text-[#E8E0D5] text-base group-hover:text-[#F0D080] transition-colors duration-300 leading-tight">
                        {art.title}
                      </h4>
                      <span className="text-[10px] uppercase font-mono bg-[#1B2A6B]/50 text-[#4FC3F7] px-2 py-0.5 rounded border border-[#4FC3F7]/10 whitespace-nowrap">
                        {art.year}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 italic mb-3">By {art.artist}</p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-[#E8E0D5]/5 pt-3 text-gray-400">
                      <div><strong className="text-[#E8E0D5]/50">Medium:</strong> {art.medium}</div>
                      <div><strong className="text-[#E8E0D5]/50">Dimensions:</strong> {art.dimensions}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-[#E8E0D5]/10 pt-4 mt-5">
                    <span className="font-mono text-sm text-[#C9A84C] font-semibold">${art.price.toLocaleString()}</span>

                    <button
                      onClick={() => onAddToCart(art)}
                      className="px-4 py-2 border border-[#C9A84C]/40 hover:border-[#C9A84C] bg-transparent hover:bg-[#C9A84C]/10 text-xs text-[#C9A84C] hover:text-[#F0D080] uppercase tracking-wider font-semibold rounded transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart size={11} /> Collect Piece
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section> 

      {/* Virtual Gallery Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl bg-[#E8E0D5] text-[#0A0F2C] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C9A84C]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
            <span className="text-[#C9A84C] font-mono uppercase tracking-[0.3em] text-xs mb-3 font-semibold">Virtual Walkthrough &bull; المعرض الإفتراضي</span>
            <h2 className="text-3xl md:text-5xl font-serif text-[#0A0F2C]">SADAF MUSEUM EXHIBITIONS</h2>
            <div className="w-16 h-[2px] bg-[#C9A84C] my-4" />
            <p className="text-[#0A0F2C]/80 text-sm md:text-base leading-relaxed mb-12">
              Our bespoke digital museum brings Old Cairo and Alexandrian coastal craftsmanship directly to fine fabrics. Click on active exhibitions below to reveal historic design stories.
            </p>

            {/* Active Exhibits Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
              {keyExhibits.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => setShowVirtualDetails(showVirtualDetails === ex.id ? null : ex.id)}
                  className={`p-6 rounded-xl transition-all duration-300 cursor-pointer border ${showVirtualDetails === ex.id
                    ? 'bg-[#0A0F2C] text-white border-[#C9A84C] shadow-lg scale-102'
                    : 'bg-white/80 text-[#0A0F2C] hover:bg-white border-[#0A0F2C]/5 shadow-sm hover:shadow'
                    }`}
                >
                  <span className={`text-[9px] font-mono uppercase block mb-1 ${showVirtualDetails === ex.id ? 'text-[#C9A84C]' : 'text-gray-500'}`}>{ex.period}</span>
                  <h3 className="font-serif text-lg font-semibold mb-1">{ex.title}</h3>
                  <p className={`text-xs ${showVirtualDetails === ex.id ? 'text-gray-400' : 'text-gray-500'} font-medium`}>{ex.highlight}</p>

                  {showVirtualDetails === ex.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-slate-300 mt-4 leading-relaxed pt-3 border-t border-white/10"
                    >
                      {ex.story}
                    </motion.p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
