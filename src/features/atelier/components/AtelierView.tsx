'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Sparkles, Feather, Palette, Scissors, ArrowRight, Star, Shirt, Brush, Gem, Compass } from 'lucide-react';
import { fabricsList, printingMethods } from '@/data';
import { useLanguage } from '@/features/i18n/LanguageProvider';

export default function AtelierView() {
    const { t } = useLanguage();
    return (
        <div className="relative w-full overflow-hidden">
            {/* Hero */}
            <section className="relative min-h-[80vh] flex flex-col justify-center items-center text-center px-4 md:px-8 border-b border-[#C9A84C]/10 bg-[#0A0F2C] overflow-hidden">
                <div className="absolute top-[5%] left-[10%] w-72 h-72 rounded-full bg-[#4FC3F7]/10 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[5%] w-80 h-80 rounded-full bg-[#C9A84C]/10 blur-[140px]" />

                <div className="absolute inset-0 opacity-10 select-none pointer-events-none flex items-center justify-center">
                    <svg width="300" height="300" viewBox="0 0 100 100" className="text-[#C9A84C] animate-[spin_90s_linear_infinite]">
                        <path d="M50,5 Q60,35 95,50 Q60,65 50,95 Q40,65 5,50 Q40,35 50,5 Z" fill="none" stroke="currentColor" strokeWidth="0.4" />
                        <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.4" />
                        <polygon points="50,20 58,40 78,50 58,60 50,80 42,60 22,50 42,40" fill="none" stroke="currentColor" strokeWidth="0.4" />
                    </svg>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
                >
                    <motion.span
                        initial={{ opacity: 0, letterSpacing: '0.1em' }}
                        animate={{ opacity: 1, letterSpacing: '0.4em' }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                        className="text-xs md:text-sm font-semibold text-[#4FC3F7] uppercase tracking-[0.4em] mb-4"
                    >
                        {t('atelier.kicker')}
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="text-4xl md:text-7xl lg:text-8xl font-serif text-white uppercase tracking-tight leading-none mb-6"
                    >
                        {t('atelier.title1')}<br />
                        <span className="text-gold-gradient font-serif italic text-3xl md:text-6xl lg:text-7xl block mt-2">{t('atelier.title2')}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="text-sm md:text-lg text-[#E8E0D5]/80 max-w-2xl font-sans tracking-wide leading-relaxed mb-10 [text-wrap:balance]"
                    >
                        {t('atelier.heroBody')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center gap-5"
                    >
                        <Link
                            href="/ai"
                            className="group relative px-8 py-4 overflow-hidden rounded-full border border-[#C9A84C] bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:text-white font-medium text-sm tracking-[0.14em] uppercase transition-all duration-300 shadow-xl shadow-[#C9A84C]/10 active:scale-95"
                        >
                            <div className="absolute inset-0 w-3 bg-white/20 transition-all duration-[600ms] ease-out group-hover:w-full" />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {t('atelier.designWithAi')} <Sparkles size={16} className="text-[#0A0F2C] group-hover:text-white" />
                            </span>
                        </Link>

                        <Link
                            href="/store"
                            className="px-8 py-4 rounded-full border border-[#E8E0D5]/20 bg-transparent hover:bg-white/5 text-white hover:border-[#4FC3F7] font-medium text-sm tracking-[0.14em] uppercase transition-all duration-300 active:scale-95 flex items-center gap-2"
                        >
                            {t('atelier.browseCollection')} <Compass size={16} className="text-[#C9A84C]" />
                        </Link>
                    </motion.div>
                </motion.div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-[#4FC3F7] uppercase tracking-[0.3em] flex flex-col items-center gap-2 select-none animate-pulse">
                    <span>{t('atelier.explore')}</span>
                    <span className="w-[1px] h-10 bg-gradient-to-b from-[#4FC3F7] to-transparent" />
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.35em] uppercase block mb-3">{t('atelier.flow.kicker')}</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-white">{t('atelier.flow.title')}</h2>
                    <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mt-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { step: '01', icon: Sparkles, title: t('atelier.step1.title'), desc: t('atelier.step1.desc'), color: '#4FC3F7' },
                        { step: '02', icon: Shirt, title: t('atelier.step2.title'), desc: t('atelier.step2.desc'), color: '#C9A84C' },
                        { step: '03', icon: Brush, title: t('atelier.step3.title'), desc: t('atelier.step3.desc'), color: '#4FC3F7' },
                        { step: '04', icon: Gem, title: t('atelier.step4.title'), desc: t('atelier.step4.desc'), color: '#C9A84C' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.15 }}
                            className="group relative p-6 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10 hover:border-[#4FC3F7]/40 transition-all duration-500"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-mono font-bold text-[#C9A84C]">{item.step}</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#C9A84C]/30 to-transparent" />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#4FC3F7]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ borderColor: item.color }}>
                                <item.icon size={20} style={{ color: item.color }} />
                            </div>
                            <h3 className="font-serif text-white text-lg mb-2">{item.title}</h3>
                            <p className="text-xs text-[#E8E0D5]/70 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Fabrics Catalog */}
            <section className="py-20 bg-gradient-to-b from-[#0A0F2C] via-[#1B2A6B]/15 to-[#0A0F2C] border-y border-[#E8E0D5]/5">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-14">
                        <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.35em] uppercase block mb-3">{t('atelier.materials.kicker')}</span>
                        <h2 className="text-3xl md:text-5xl font-serif text-white">{t('atelier.materials.title')}</h2>
                        <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mt-4" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {fabricsList.map((fabric, idx) => (
                            <motion.div
                                key={fabric.name}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-5 rounded-xl bg-[#0A0F2C]/60 border border-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-all duration-300 group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <Feather size={16} className="text-[#C9A84C]" />
                                    <span className="text-[10px] font-mono text-[#4FC3F7] font-bold">+${fabric.priceOffset}</span>
                                </div>
                                <h4 className="font-serif text-white text-sm mb-1.5 group-hover:text-[#C9A84C] transition-colors">{fabric.name}</h4>
                                <p className="text-[10px] text-[#E8E0D5]/60 leading-relaxed">{fabric.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Printing Methods */}
            <section className="py-20 max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-14">
                    <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.35em] uppercase block mb-3">{t('atelier.methods.kicker')}</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-white">{t('atelier.methods.title')}</h2>
                    <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mt-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {printingMethods.map((method, idx) => (
                        <motion.div
                            key={method.name}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="p-5 rounded-xl bg-[#0A0F2C]/60 border border-[#4FC3F7]/10 hover:border-[#4FC3F7]/40 transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Palette size={16} className="text-[#4FC3F7]" />
                                <span className="text-[10px] font-mono text-[#C9A84C] font-bold">+${method.priceOffset}</span>
                            </div>
                            <h4 className="font-serif text-white text-sm mb-1.5 group-hover:text-[#4FC3F7] transition-colors">{method.name}</h4>
                            <p className="text-[10px] text-[#E8E0D5]/60 leading-relaxed">{method.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Atelier Heritage */}
            <section className="py-24 bg-gradient-to-b from-[#0A0F2C] via-[#0A0F2C] to-[#0E153D]/60 border-t border-[#C9A84C]/10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 flex flex-col items-start text-left">
                        <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.35em] uppercase mb-3">{t('atelier.heritage.kicker')}</span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white leading-tight mb-6">{t('atelier.heritage.title')}</h2>
                        <p className="text-[#E8E0D5]/80 text-sm md:text-base mb-8 leading-relaxed">
                            {t('atelier.heritage.body')}
                        </p>
                        <div className="flex flex-wrap gap-6 mb-8">
                            {[
                                { label: t('atelier.stat.years'), value: '120+' },
                                { label: t('atelier.stat.artisans'), value: '24' },
                                { label: t('atelier.stat.collections'), value: '48' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-2xl font-serif text-[#C9A84C] font-bold">{stat.value}</p>
                                    <p className="text-[9px] font-mono text-[#E8E0D5]/50 uppercase tracking-wider mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/exhibition"
                            className="px-6 py-3 rounded-md border border-[#C9A84C] hover:bg-[#C9A84C] text-white hover:text-[#0A0F2C] text-xs tracking-[0.15em] uppercase transition-all duration-300 active:scale-95 flex items-center gap-2 group"
                        >
                            {t('atelier.visitExhibition')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                        {[
                            { title: t('atelier.craft1.title'), desc: t('atelier.craft1.desc'), icon: Brush },
                            { title: t('atelier.craft2.title'), desc: t('atelier.craft2.desc'), icon: Gem },
                            { title: t('atelier.craft3.title'), desc: t('atelier.craft3.desc'), icon: Shirt },
                            { title: t('atelier.craft4.title'), desc: t('atelier.craft4.desc'), icon: Feather },
                        ].map((craft) => (
                            <motion.div
                                key={craft.title}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                                className="relative overflow-hidden rounded-lg border border-[#C9A84C]/10 bg-[#0A0F2C]/60 p-5 group cursor-default"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#4FC3F7]/20 flex items-center justify-center">
                                        <craft.icon size={15} className="text-[#C9A84C]" />
                                    </div>
                                    <h4 className="font-serif text-white text-sm group-hover:text-[#C9A84C] transition-colors">{craft.title}</h4>
                                </div>
                                <p className="text-[10px] text-[#E8E0D5]/60 leading-relaxed">{craft.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden glass-panel-gold p-8 md:p-16 border border-[#C9A84C]/30 text-center flex flex-col items-center">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#4FC3F7]/5 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 8, ease: 'easeInOut' }}
                        className="mb-6 inline-flex p-3 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30"
                    >
                        <Scissors className="text-[#C9A84C]" size={28} />
                    </motion.div>

                    <span className="text-[#C9A84C] text-[10px] tracking-[0.4em] font-medium uppercase mb-2">{t('atelier.cta.kicker')}</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-white mb-6 tracking-tight">{t('atelier.cta.title')}</h2>
                    <p className="text-[#E8E0D5]/80 text-sm md:text-base max-w-2xl mb-10 leading-relaxed">
                        {t('atelier.cta.body')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/ai"
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:scale-105 active:scale-95 transition-all duration-300 font-medium text-xs tracking-[0.15em] uppercase flex items-center gap-2 shadow-lg shadow-black/40"
                        >
                            {t('atelier.startDesigning')} <Sparkles size={14} />
                        </Link>
                        <Link
                            href="/store"
                            className="px-8 py-4 rounded-full border border-[#E8E0D5]/20 bg-transparent hover:bg-white/5 text-white hover:border-[#4FC3F7] font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 active:scale-95 flex items-center gap-2"
                        >
                            {t('atelier.shopReadyToWear')} <Star size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer stats */}
            <section className="py-16 text-center bg-[#070A20] border-t border-[#E8E0D5]/5">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { tag: t('atelier.footer.workshop'), title: t('atelier.footer.est') },
                        { tag: t('atelier.footer.inlay'), title: t('atelier.footer.materials') },
                        { tag: t('atelier.footer.ai'), title: t('atelier.footer.process') },
                        { tag: t('atelier.footer.shipping'), title: t('atelier.footer.delivery') },
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
