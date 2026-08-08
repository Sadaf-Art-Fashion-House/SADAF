import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, Star, Compass, Sparkles, Feather } from 'lucide-react';
import type { Collection, ArtPiece, FashionProduct } from '@/shared/types';
import SadafLogo from '@/components/common/SadafLogo';

interface HomeViewProps {
    featuredProducts: FashionProduct[];
    featuredArtwork: ArtPiece[];
    collections: Collection[];
}

export default function HomeView({ featuredProducts, featuredArtwork, collections }: HomeViewProps) {
    return (
        <div className="relative w-full overflow-hidden">
            <section className="relative min-h-[92vh] flex flex-col justify-center items-center text-center px-4 md:px-8 border-b border-[#C9A84C]/10 bg-[#0A0F2C] overflow-hidden arabic-pattern">
                <div className="absolute top-[10%] left-[5%] w-80 h-80 rounded-full bg-[#1B2A6B]/30 blur-[130px]" />
                <div className="absolute bottom-[13%] right-[5%] w-96 h-96 rounded-full bg-[#4FC3F7]/10 blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/5 blur-[160px]" />

                <div className="absolute inset-0 opacity-15 select-none pointer-events-none flex items-center justify-center">
                    <svg width="400" height="400" viewBox="0 0 100 100" className="text-[#C9A84C] animate-[spin_120s_linear_infinite]">
                        <path d="M50,0 Q60,35 100,50 Q60,65 50,100 Q40,65 0,50 Q40,35 50,0 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <polygon points="50,25 57,43 75,50 57,57 50,75 43,57 25,50 43,43" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="mb-6">
                        <SadafLogo size={80} showText={false} withMarbleBackground={true} />
                    </motion.div>

                    <motion.span initial={{ opacity: 0, letterSpacing: '0.1em' }} animate={{ opacity: 1, letterSpacing: '0.4em' }} transition={{ duration: 1.5, delay: 0.2 }} className="text-xs md:text-sm font-semibold text-[#C9A84C] uppercase tracking-[0.4em] mb-4 text-center">
                        SADAF ATELIER &bull; AL-QAHIRA
                    </motion.span>

                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.4 }} className="text-4xl md:text-7xl lg:text-8xl font-serif text-white uppercase tracking-tight leading-none mb-6">
                        THE COUTURE <br />
                        <span className="text-gold-gradient font-serif italic text-3xl md:text-6xl lg:text-7xl block mt-2">of Culture</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.7 }} className="text-sm md:text-lg text-[#E8E0D5]/80 max-w-2xl font-sans tracking-wide leading-relaxed mb-10 [text-wrap:balance]">
                        Where authentic Egyptian mother-of-pearl heritage drapes onto haute couture. Powered by deep AI studio pipelines, hand-crafted calligraphic jacquards, and bespoke tailoring.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.9 }} className="flex flex-col sm:flex-row items-center gap-5">
                        <Link href="/ai" className="group relative px-8 py-4 overflow-hidden rounded-full border border-[#C9A84C] bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:text-white font-medium text-sm tracking-[0.14em] uppercase transition-all duration-300 shadow-xl shadow-[#C9A84C]/10 active:scale-95 cursor-pointer">
                            <div className="absolute inset-0 w-3 bg-white/20 transition-all duration-[600s] ease-out group-hover:w-full" />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Launch AI Studio <Sparkles size={16} className="text-[#0A0F2C] group-hover:text-white" />
                            </span>
                        </Link>

                        <Link href="/fashion" className="px-8 py-4 rounded-full border border-[#E8E0D5]/20 bg-transparent hover:bg-white/5 text-white hover:border-[#4FC3F7] font-medium text-sm tracking-[0.14em] uppercase transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-2">
                            Couture Collection <Compass size={16} className="text-[#C9A84C]" />
                        </Link>
                    </motion.div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-[#C9A84C] uppercase tracking-[0.3em] flex flex-col items-center gap-2 select-none animate-pulse">
                    <span>Scroll downstream</span>
                    <span className="w-[1px] h-10 bg-gradient-to-b from-[#C9A84C] to-transparent" />
                </div>
            </section>

            <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.35em] uppercase block mb-3">&bull; Seasonal Chapters &bull;</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-white">THE HOUSES OF COUTURE</h2>
                    <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mt-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {collections.map((col, index) => (
                        <motion.div key={col.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: index * 0.2 }} className="group relative h-[450px] rounded-xl overflow-hidden border border-[#E8E0D5]/5 bg-[#0A0F2C] shadow-2xl transition-all duration-500 hover:border-[#C9A84C]/30">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-out group-hover:scale-110 filter brightness-[0.7] group-hover:brightness-[0.55]" style={{ backgroundImage: `url(${col.image})` }} />
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0A0F2C]/95 via-[#0A0F2C]/80 to-transparent flex flex-col justify-end min-h-[50%]">
                                <span className="text-xs text-[#C9A84C] tracking-[0.2em] font-medium font-mono uppercase mb-1">{col.year} Collection</span>
                                <h3 className="text-xl font-serif text-white tracking-wide group-hover:text-[#4FC3F7] transition-all duration-300 md:text-2xl mb-2">{col.name}</h3>
                                <p className="text-xs text-[#E8E0D5]/70 line-clamp-2 leading-relaxed mb-4">{col.description}</p>
                                <Link href="/fashion" className="flex items-center gap-1.5 text-xs text-[#E8E0D5] hover:text-[#C9A84C] transition-colors duration-300 font-medium tracking-[0.1em] uppercase mt-1 text-left w-fit cursor-pointer">
                                    View Lookbook <ArrowRight size={12} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="py-20 bg-gradient-to-b from-[#0A0F2C] via-[#1B2A6B]/20 to-[#0A0F2C] border-y border-[#E8E0D5]/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 flex flex-col items-start text-left">
                        <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.35em] uppercase mb-3">DIWANI & KUFIC MYSTICISM</span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white leading-tight mb-6">THE ALCHEMY OF HANDMADE ART</h2>
                        <p className="text-[#E8E0D5]/80 text-sm md:text-base mb-8 leading-relaxed">
                            Every curve in our script is hand-drawn, carrying a lineage of masters. In Cairo and Alexandria, we forge raw copper plates, custom-carved saltwater mother-of-pearl (Sadaf), and delicate silver embroidery that transforms fabrics into fine gallery compositions.
                        </p>
                        <Link href="/artworks" className="px-6 py-3 rounded-md border border-[#C9A84C] hover:bg-[#C9A84C] text-white hover:text-[#0A0F2C] text-xs tracking-[0.15em] uppercase transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-2 group">
                            Browse Fine Arts <Feather size={14} className="text-[#C9A84C] group-hover:text-[#0A0F2C]" />
                        </Link>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                        {featuredArtwork.slice(0, 2).map((art) => (
                            <motion.div key={art.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} className="relative overflow-hidden rounded-lg border border-[#C9A84C]/10 bg-[#0A0F2C]/60 p-4">
                                <div className="relative aspect-[4/5] overflow-hidden rounded mb-4">
                                    <Image src={art.image} alt={art.title} fill className="object-cover filter brightness-90 hover:brightness-100 transition-all duration-500" />
                                </div>
                                <h4 className="font-serif text-[#E8E0D5] text-sm md:text-base truncate">{art.title}</h4>
                                <p className="text-xs text-[#C9A84C] font-mono mt-1">${art.price.toLocaleString()}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden glass-panel-gold p-8 md:p-16 border border-[#C9A84C]/30 text-center flex flex-col items-center">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#4FC3F7]/5 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 8, ease: 'easeInOut' }} className="mb-6 inline-flex p-3 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30">
                        <Sparkles className="text-[#C9A84C]" size={28} />
                    </motion.div>

                    <span className="text-[#C9A84C] text-[10px] tracking-[0.4em] font-medium uppercase mb-2">NEO-COUTURE DESIGN GENERATOR</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-white mb-6 tracking-tight">AI STUDIO: COUTURE OF THE INFINITE</h2>
                    <p className="text-[#E8E0D5]/80 text-sm md:text-base max-w-2xl mb-10 leading-relaxed">
                        Unleash our Stable Diffusion + Flux hybrid models trained on premium Islamic calligraphy databases and luxury textures. Instantly convert handwritten concepts, patterns, or image drapes into tailored hoodies, abayas, or jackets.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full mb-10">
                        {['Abaya Prints', 'Gold Calligraphy Hoodies', 'Sadaf Inlaid Jackets', 'Arabesque T-Shirts'].map((item, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-[#0A0F2C]/80 border border-[#E8E0D5]/10 hover:border-[#4FC3F7]/50 hover:bg-[#1B2A6B]/30 group transition-all duration-300 text-center">
                                <div className="font-serif text-[#C9A84C] group-hover:text-white transition-colors duration-300 text-sm md:text-base">{item}</div>
                                <div className="text-[10px] text-gray-500 font-mono mt-1">Ready to render</div>
                            </div>
                        ))}
                    </div>

                    <Link href="/ai" className="px-8 py-4 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:scale-105 active:scale-95 transition-all duration-300 font-medium text-xs tracking-[0.15em] uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-black/40">
                        Enter Creative Laboratory <ArrowRight size={14} />
                    </Link>
                </div>
            </section>

            <section className="py-16 bg-[#0E153D]/30 border-t border-[#E8E0D5]/5">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
                        <div>
                            <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.3em] uppercase block mb-2">THE NEW DROPS</span>
                            <h2 className="text-2xl md:text-4xl font-serif text-white">THE SIGNATURE HAUTE COLLECTION</h2>
                        </div>
                        <Link href="/store" className="text-xs text-[#ebd083] hover:text-[#4FC3F7] transition-all duration-300 tracking-[0.1em] uppercase font-semibold flex items-center gap-1.5 mt-4 md:mt-0 cursor-pointer">
                            Shop All Capsule Products <ArrowRight size={12} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.slice(0, 3).map((product) => (
                            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="group relative flex flex-col bg-[#0A0F2C] border border-[#E8E0D5]/10 rounded-xl overflow-hidden shadow-xl">
                                <Link href="/store" className="relative aspect-[3/4] overflow-hidden bg-[#0A0F2C] cursor-pointer block">
                                    <Image src={product.image} alt={product.name} fill className="object-cover transition-all duration-500 group-hover:scale-105" />
                                    <div className="absolute top-3 left-3 bg-[#E8E0D5]/15 backdrop-blur-md px-3 py-1 rounded text-[10px] uppercase font-mono tracking-wider border border-white/10 text-white">{product.category}</div>
                                    <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-[#F0D080] flex items-center gap-1">
                                        <Star size={8} fill="#F0D080" /> {product.rating}
                                    </div>
                                </Link>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <Link href="/store">
                                            <h3 className="font-serif text-white hover:text-[#C9A84C] transition-colors duration-300 text-lg mb-1.5 cursor-pointer">{product.name}</h3>
                                        </Link>
                                        <p className="text-xs text-[#E8E0D5]/70 line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-[#E8E0D5]/10 pt-4 mt-auto">
                                        <span className="font-mono text-sm text-[#C9A84C] font-semibold">${product.price.toLocaleString()}</span>
                                        <Link href="/store" className="text-xs text-[#4FC3F7] group-hover:text-[#F0D080] font-mono tracking-wider font-medium flex items-center gap-1 cursor-pointer transition-all duration-300">
                                            Configure &bull; Buy <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 text-center bg-[#070A20] border-t border-[#E2D8CE]/5">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { tag: 'Tailored in old cairo', title: 'HERITAGE ATELIER' },
                        { tag: 'Sea-harvested Sadaf', title: 'GENUINE MATERIALS' },
                        { tag: 'Interactive AI customization', title: 'INNOVATIVE LUXURY' },
                        { tag: 'Global expressive shipping', title: 'INTERNATIONAL DELIVERY' },
                    ].map((itm, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-[10px] text-[#C9A84C] font-mono tracking-widest uppercase mb-1.5">{itm.tag}</span>
                            <h4 className="font-serif text-white text-xs md:text-sm tracking-widest uppercase">{itm.title}</h4>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}