"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Eye,
    ArrowLeft,
    ArrowRight,
    Maximize2,
    Compass,
    Volume2,
    VolumeX,
    ShoppingCart,
    Award,
    Mic,
    Play,
    AlertTriangle,
} from 'lucide-react';
import type { ArtPiece } from '@/shared/types';
import type { ExhibitionRoom } from '../types';
import { useTextToSpeech, type TtsLang } from '../hooks/useTextToSpeech';

interface ExhibitionViewProps {
    artworks: ArtPiece[];
    onAddToCart: (art: ArtPiece) => void;
    onSelectArtPiece: (art: ArtPiece) => void;
}

const ROOMS: ExhibitionRoom[] = [
    {
        id: 'room-1',
        name: 'Court of Fatimid Geometry',
        arabicName: 'فناء الهندسة الفاطمية',
        tagline: "Cairo's golden history, structural stone carvings, and symmetric star alignments",
        description: 'Explore pieces designed on traditional symmetric star grids. Witness the interplay of raw red copper, dense desert sandstone, and 18k golden wire meshes representing cosmic order.',
        ambiance: 'Warm sandstone lights, desert dusk echoes, slow spatial glow',
        materials: 'Hand-hammered Red Copper, Saltwater Mother-of-Pearl & Fine Silver',
        accentColor: '#C9A84C',
        backgroundColor: 'from-[#0E0B16] via-[#1A1126] to-[#0A0512]',
        artworkIds: ['art-2', 'art-5', 'art-6'],
    },
    {
        id: 'room-2',
        name: 'Alexandrian Calligraphy Pavilion',
        arabicName: 'جناح الخط السكندري',
        tagline: 'Rhythmic ink scripts, liquid gold leaf parchment, and coastal sea wind drafts',
        description: 'Step into the coastal sanctuary celebrating Diwani and Thuluth calligraphy lineages. Here, fluid calligraphic sweeps represent respiratory breathing loops and marine drapes.',
        ambiance: 'Royal Indigo shadows, maritime gold reflections, coastal breeze drafts',
        materials: '24k Gold Leaf, Calligraphy Reed-Pen inks, Indigo Parchment Paper',
        accentColor: '#4FC3F7',
        backgroundColor: 'from-[#0A0F2C] via-[#111A45] to-[#05081E]',
        artworkIds: ['art-1', 'art-4', 'art-3'],
    },
];

const CURATORIAL_STORIES: Record<string, string> = {
    'art-1': "Behold the glorious 'Golden Diwani Diptych' by Master Ahmed El-Saeed. Woven on indigo dyed linen sheets, this script utilizes medieval formula inks made from 24K pure liquid gold leaf. The cursive overlaps symbolize cosmic waves flowing on Cairo's evening dunes.",
    'art-2': "Notice the intense geometric alignments inside this 'Fatimid Octagram Inlay Platter'. Handcrafted over 50 intense work hours in Al-Saad atelier in Old Cairo, each mother-of-pearl segment is placed with microscopic precision into heated red copper plates, mirroring ancient astronomic calendars.",
    'art-3': "Look closely at the heavy impasto layering of 'Nile Reflections inside Royal Orchid'. Farida Hammad utilizes dense oil textures layered with fine coastal sands, recreating the warm, humid air hanging over the historic Gayer-Anderson palaces.",
    'art-4': "This digital masterwork 'Fluid Arabesque Flow' represents a non-Euclidean future. Tariq Al-Faisal models standard Islamic tessellations, then runs automated algorithmic fluid simulations to show how cultural boundaries adapt to contemporary spaces.",
    'art-5': "Observe the structural drapes in this 'Gilded Abaya Drapery study'. Woven raw cotton panels showcase a master watercolor layout of Siwa Oasis movements, reflecting the nomadic posture and wind resistance designed in SADAF's signature outerwear blueprints.",
    'art-6': "This post-modern painting 'Cairo Deco Facade' merges sands with oil textures. Karim Abdel-Malik captures how Cairo's 1920s Art Deco apartment grids intersect with the continuous desert winds.",
};

/** Arabic curatorial stories. */
const CURATORIAL_STORIES_AR: Record<string, string> = {
    'art-1': 'تأمل روعة "اللوحة المزدوجة الديوانية الذهبية" للفنان أحمد السعيد. منسوجة على أقمشة الكتان المصبوغة بالنيلي، يستخدم هذا الخط أحباراً من العصور الوسطى مصنوعة من الذهب الخالص عيار ٢٤ قيراطاً. ترمز التداخلات الخطية إلى الأمواج الكونية المتدفقة على كثبان القاهرة المسائية.',
    'art-2': 'لاحظ التناسقات الهندسية المذهلة داخل "طبق الفاطمي الثماني المطعم بالصدف". صُنع يدوياً على مدار ٥٠ ساعة عمل مكثفة في أتيليه السعد في القاهرة القديمة، حيث تم وضع كل قطعة من الصدف بدقة متناهية على ألواح النحاس الأحمر الساخن، لتعكس التقاويم الفلكية القديمة.',
    'art-3': 'تأمل عن قرب الطبقات السميكة من "انعكاسات النيل داخل السحلية الملكية". تستخدم فريدة حماد كثافات زيتية ثقيلة ممزوجة برمال ساحلية ناعمة، لإعادة خلق الأجواء الدافئة الرطبة التي تعلو قصور جاير أندرسون التاريخية.',
    'art-4': 'تمثل التحفة الرقمية "التدفق الأرابيسكي السائل" مستقبلاً غير إقليدي. يصمم طارق الفيصل الزخارف الإسلامية التقليدية، ثم يجري محاكاة سائلة خوارزمية آلية ليُظهر كيف تتكيف الحدود الثقافية مع المساحات المعاصرة.',
    'art-5': 'لاحظ اللفات الهيكلية في "دراسة العباءة المذهبة". تُظهر ألواح القطن الخام المنسوجة تصميماً مائياً رائعاً يعكس حركات واحة سيوة، مما يعكس الوضعية البدوية ومقاومة الرياح المصممة في تصاميم سدف الخارجية.',
    'art-6': 'هذه اللوحة ما بعد الحداثة "واجهة القاهرة الديكورية" تمزج الرمال مع القوام الزيتي. يصور كريم عبد الملك كيفية تقاطع شبكات شقق القاهرة ذات الطراز الأرت ديكو من عشرينيات القرن الماضي مع الرياح الصحراوية المستمرة.',
};

/** French curatorial stories. */
const CURATORIAL_STORIES_FR: Record<string, string> = {
    'art-1': 'Contemplez le magnifique "Diptyque Diwani Doré" du maître Ahmed El-Saeed. Tissé sur des draps de lin teints à l\'indigo, ce script utilise des encres de formule médiévale fabriquées à partir de feuille d\'or pur 24 carats. Les chevauchements cursifs symbolisent les vagues cosmiques coulant sur les dunes du Caire au soir.',
    'art-2': 'Remarquez les alignements géométriques intenses à l\'intérieur de ce "Plateau incrusté octogonal fatimide". Fabriqué à la main pendant plus de 50 heures de travail intenses dans l\'atelier Al-Saad au Vieux Caire, chaque segment de nacre est placé avec une précision microscopique dans des plaques de cuivre rouge chauffées, reflétant les anciens calendriers astronomiques.',
    'art-3': 'Regardez de près les épaisses couches d\'empâtement de "Réflexions du Nil dans l\'Orchidée Royale". Farida Hammad utilise des textures d\'huile denses mélangées à des sables côtiers fins, recréant l\'air chaud et humide planant au-dessus des palais historiques Gayer-Anderson.',
    'art-4': 'Ce chef-d\'œuvre numérique "Flux Arabesque Fluide" représente un futur non-euclidien. Tariq Al-Faisal modélise les tessellations islamiques standard, puis exécute des simulations fluides algorithmiques automatisées pour montrer comment les frontières culturelles s\'adaptent aux espaces contemporains.',
    'art-5': 'Observez les drapés structurels de cette "Étude de drapé d\'Abaya Dorée". Des panneaux de coton brut tissé présentent une mise en page aquarelle magistrale des mouvements de l\'oasis de Siwa, reflétant la posture nomade et la résistance au vent conçues dans les plans de vêtements d\'extérieur signature de SADAF.',
    'art-6': 'Cette peinture post-moderne "Façade Art Déco du Caire" fusionne les sables avec des textures d\'huile. Karim Abdel-Malik capture comment les grilles d\'appartements Art Déco des années 1920 du Caire intersectent les vents désertiques continus.',
};

/** German curatorial stories. */
const CURATORIAL_STORIES_DE: Record<string, string> = {
    'art-1': 'Betrachten Sie das herrliche "Goldene Diwani-Diptychon" von Meister Ahmed El-Saeed. Dieses auf indigogefärbten Leinentüchern gewebte Skript verwendet mittelalterliche Formeltinten aus 24-karätigem reinem Blattgold. Die kursiven Überlappungen symbolisieren kosmische Wellen, die über die abendlichen Dünen Kairos fließen.',
    'art-2': 'Beachten Sie die intensiven geometrischen Ausrichtungen in dieser "Fatimidischen Oktagramm-Einlegeplatte". Handgefertigt über 50 intensive Arbeitsstunden in der Al-Saad-Werkstatt in Alt-Kairo, wird jedes Perlmuttsegment mit mikroskopischer Präzision in erhitzte Rotkupferplatten gesetzt, die alte astronomische Kalender widerspiegeln.',
    'art-3': 'Betrachten Sie aus der Nähe die dicken Impasto-Schichten von "Nilreflexionen in der Königlichen Orchidee". Farida Hammad verwendet dichte Öltexturen, die mit feinem Küstensand geschichtet sind, und erschafft die warme, feuchte Luft, die über den historischen Gayer-Anderson-Palästen hängt.',
    'art-4': 'Dieses digitale Meisterwerk "Fließender Arabeskenfluss" repräsentiert eine nicht-euklidische Zukunft. Tariq Al-Faisal modelliert standardmäßige islamische Tessellationen und führt dann automatisierte algorithmische Flüssigkeitssimulationen durch, um zu zeigen, wie sich kulturelle Grenzen an zeitgenössische Räume anpassen.',
    'art-5': 'Beobachten Sie die strukturellen Faltenwürfe in dieser "Vergoldeten Abaya-Drapierungsstudie". Ge webte Rohbaumwollpaneele zeigen ein meisterhaftes Aquarell-Layout der Bewegungen der Siwa-Oase, das die nomadische Haltung und den Windwiderstand widerspiegelt, die in SADAFs charakteristischen Oberbekleidungsentwürfen entwickelt wurden.',
    'art-6': 'Dieses postmoderne Gemälde "Kairoer Art-Deco-Fassade" vereint Sand mit Öltexturen. Karim Abdel-Malik fängt ein, wie die Art-Deco-Wohnungsgitter Kairos aus den 1920er Jahren mit den kontinuierlichen Wüstenwinden kreuzen.',
};

/** Story map keyed by language code. */
const STORY_MAP: Record<TtsLang, Record<string, string>> = {
    en: CURATORIAL_STORIES,
    ar: CURATORIAL_STORIES_AR,
    fr: CURATORIAL_STORIES_FR,
    de: CURATORIAL_STORIES_DE,
};

const WALL_LABELS = ['left', 'center', 'right'] as const;
type WallView = (typeof WALL_LABELS)[number];

const MAP_COORDINATES: Record<string, Record<WallView, { x: number; y: number }>> = {
    'room-1': { left: { x: 30, y: 70 }, center: { x: 50, y: 40 }, right: { x: 70, y: 70 } },
    'room-2': { left: { x: 30, y: 72 }, center: { x: 50, y: 45 }, right: { x: 70, y: 72 } },
};

// ─────────────────────── Language UI config ───────────────────────

interface LangEntry {
    code: TtsLang;
    label: string;
    flag: string;
    dir: 'ltr' | 'rtl';
    hasVoices: (tts: ReturnType<typeof useTextToSpeech>) => boolean;
}

const LANGUAGES: LangEntry[] = [
    { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr', hasVoices: () => true },
    { code: 'ar', label: 'عربي', flag: '🇸🇦', dir: 'rtl', hasVoices: (tts) => tts.hasArabicVoices },
    { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr', hasVoices: (tts) => tts.hasFrenchVoices },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr', hasVoices: (tts) => tts.hasGermanVoices },
];

const LANGUAGE_LABEL: Record<TtsLang, { name: string; tooltip: string }> = {
    en: { name: 'English', tooltip: 'The curatorial story will play in English. Select a voice below.' },
    ar: { name: 'عربي', tooltip: 'سيتم تشغيل القصة باللغة العربية. اختر صوتاً عربياً من القائمة أدناه.' },
    fr: { name: 'Français', tooltip: 'L\'histoire sera jouée en français. Sélectionnez une voix dans la liste ci-dessous.' },
    de: { name: 'Deutsch', tooltip: 'Die Geschichte wird auf Deutsch abgespielt. Wählen Sie unten eine Stimme aus.' },
};

// ─────────────────────── Component ───────────────────────

export default function ExhibitionView({ artworks, onAddToCart, onSelectArtPiece }: ExhibitionViewProps) {
    const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
    const activeRoom = ROOMS[activeRoomIndex];
    const [activeWall, setActiveWall] = useState<WallView>('center');
    const [zoomedArt, setZoomedArt] = useState<ArtPiece | null>(null);
    const tts = useTextToSpeech();
    const [isAudioGuideActive, setIsAudioGuideActive] = useState<boolean>(false);

    const activeRoomArtworks = activeRoom.artworkIds
        .map((id) => artworks.find((art) => art.id === id))
        .filter((art): art is ArtPiece => !!art);

    const wallArtMap: Record<WallView, ArtPiece | null> = {
        left: activeRoomArtworks[0] || null,
        center: activeRoomArtworks[1] || null,
        right: activeRoomArtworks[2] || null,
    };

    const currentWallArt = wallArtMap[activeWall];
    const currentCoords = MAP_COORDINATES[activeRoom.id]?.[activeWall] || { x: 50, y: 50 };

    const currentLangCode = tts.options.lang;

    const handleStartNarration = useCallback(() => {
        if (!zoomedArt) return;
        const stories = STORY_MAP[currentLangCode];
        const fullText = stories[zoomedArt.id] ||
            STORY_MAP.en[zoomedArt.id] ||
            "This luxury heritage masterpiece is preserved inside SADAF's Cairo archives.";
        tts.speak(fullText);
        setIsAudioGuideActive(true);
    }, [zoomedArt, tts, currentLangCode]);

    const handleStopNarration = useCallback(() => {
        tts.stop();
        setIsAudioGuideActive(false);
    }, [tts]);

    // Sync isAudioGuideActive with TTS state
    useEffect(() => {
        if (!tts.isSpeaking && isAudioGuideActive) {
            setIsAudioGuideActive(false);
        }
    }, [tts.isSpeaking, isAudioGuideActive]);

    const handleRoomSwitch = (index: number) => {
        setActiveRoomIndex(index);
        setActiveWall('center');
        setZoomedArt(null);
        handleStopNarration();
    };

    const handleWallSwitch = (wall: WallView) => {
        setActiveWall(wall);
        setZoomedArt(null);
        handleStopNarration();
    };

    const activeLang = LANGUAGES.find((l) => l.code === currentLangCode)!;

    // ──────── SpeechSynthesis fallback ────────
    if (!tts.isSpeechSupported) {
        return (
            <div className="w-full min-h-[400px] bg-gradient-to-b from-[#0E0B16] via-[#1A1126] to-[#0A0512] rounded-3xl border border-[#C9A84C]/25 p-8 shadow-2xl flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
                    <h3 className="text-xl font-serif text-white font-bold mb-2">Speech Not Supported</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Your browser does not support the Web Speech API, which is required for
                        the audio guide. Please try using Chrome, Edge, Firefox, or Safari.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`w-full min-h-[550px] bg-gradient-to-b ${activeRoom.backgroundColor} rounded-3xl border border-[#C9A84C]/25 p-3 sm:p-4 md:p-8 shadow-2xl overflow-hidden transition-all duration-[1000ms] text-left relative font-sans`}
        >
            {/* Ambient lights */}
            <div className="absolute top-0 left-10 w-[400px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[140px] pointer-events-none max-md:hidden" />
            <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-[#4FC3F7]/5 rounded-full blur-[140px] pointer-events-none max-md:hidden" />

            {/* Decorative frames */}
            <div className="absolute inset-2 border border-[#C9A84C]/10 pointer-events-none rounded-2xl" />
            <div className="absolute inset-3 border border-[#C9A84C]/5 pointer-events-none rounded-2xl" />

            {/* Museum Top Navigation */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 border-b border-white/10 pb-4 md:pb-5 mb-6 md:mb-8">
                <div className="w-full md:w-auto">
                    <span className="text-[8px] sm:text-[10px] uppercase font-mono tracking-widest text-[#C9A84C] font-bold flex items-center gap-1.5">
                        <Compass size={12} className="animate-pulse shrink-0" />
                        <span className="hidden sm:inline">SADAF METAVERSE ATELIER &bull; المعرض التفاعلي ثلاثي الأبعاد</span>
                        <span className="sm:hidden">SADAF EXHIBITION</span>
                    </span>
                    <div className="flex flex-col sm:flex-row sm:gap-3 sm:items-baseline mt-1.5">
                        <h2 className="text-lg sm:text-xl md:text-3xl font-serif text-white font-semibold leading-tight tracking-tight">
                            {activeRoom.name}
                        </h2>
                        <span className="text-[10px] sm:text-xs font-serif text-[#C9A84C] font-bold italic tracking-wider block">
                            {activeRoom.arabicName}
                        </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1 max-w-xl font-sans line-clamp-2 sm:line-clamp-none">{activeRoom.tagline}</p>
                </div>

                {/* Room tabs */}
                <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner self-start md:self-auto">
                    {ROOMS.map((rm, idx) => (
                        <button
                            key={rm.id}
                            onClick={() => handleRoomSwitch(idx)}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-mono uppercase tracking-wider font-bold transition-all duration-350 cursor-pointer ${
                                activeRoomIndex === idx
                                    ? 'bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] font-extrabold shadow-md'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Room {idx + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-stretch relative z-10">
                {/* 3D Museum Area (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
                    {/* Main Stage */}
                    <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-[#05060F]/90 border border-white/5 rounded-2xl shadow-inner overflow-hidden flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 min-h-[280px] sm:min-h-[380px]">
                        {/* Spotlights */}
                        <div
                            className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 sm:w-80 h-28 sm:h-44 bg-gradient-to-b from-[#C9A84C]/15 to-transparent blur-2xl pointer-events-none transition-all duration-700 ${
                                activeWall === 'left' ? '-rotate-12 -translate-x-[150px]' : activeWall === 'right' ? 'rotate-12 translate-x-[150px]' : 'rotate-0'
                            }`}
                        />

                        {/* Architecture pillars — hide on small screens */}
                        <div className="absolute inset-0 opacity-[0.12] mix-blend-screen pointer-events-none hidden sm:flex justify-between px-16 h-full items-start">
                            <div className="w-10 h-full bg-gradient-to-r from-white to-transparent border-r border-[#C9A84C]/40" />
                            <div className="w-44 h-1/2 border-b border-x border-[#C9A84C]/40 rounded-b-full self-start" />
                            <div className="w-10 h-full bg-gradient-to-l from-white to-transparent border-l border-[#C9A84C]/40" />
                        </div>

                        {/* Wall navigation */}
                        <div className="w-full flex justify-between items-center text-[9px] sm:text-xs text-gray-500 font-mono tracking-widest uppercase mb-3 sm:mb-4">
                            {WALL_LABELS.map((wall) => (
                                <button
                                    key={wall}
                                    onClick={() => handleWallSwitch(wall)}
                                    className={`py-1 px-2 sm:px-3.5 rounded border transition-all duration-300 cursor-pointer ${
                                        activeWall === wall
                                            ? 'text-[#C9A84C] border-[#C9A84C]/35 bg-[#C9A84C]/10 font-bold'
                                            : 'border-transparent text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {wall === 'left' && '‹ Left'}
                                    {wall === 'center' && 'Center'}
                                    {wall === 'right' && 'Right ›'}
                                </button>
                            ))}
                        </div>

                        {/* Artwork display */}
                        <div className="flex-1 w-full flex items-center justify-center relative py-3 sm:py-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${activeRoom.id}-${activeWall}`}
                                    initial={{
                                        opacity: 0,
                                        rotateY: activeWall === 'left' ? 30 : activeWall === 'right' ? -30 : 0,
                                        scale: 0.9,
                                    }}
                                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                    exit={{
                                        opacity: 0,
                                        rotateY: activeWall === 'left' ? -30 : activeWall === 'right' ? 30 : 0,
                                        scale: 0.9,
                                    }}
                                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                                    className="w-full max-w-[220px] sm:max-w-sm flex flex-col items-center"
                                >
                                    {currentWallArt ? (
                                        <div className="relative group/art">
                                            {/* Ornamental frame */}
                                            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-b from-[#C9A84C] via-[#99792B] to-[#F0D080]/90 rounded-xl p-[2px] sm:p-[2.5px] shadow-[0_15px_35px_rgba(0,0,0,0.8)] border border-[#F0D080]/50 pointer-events-none" />
                                            <div className="absolute -inset-1 sm:-inset-2 bg-[#0F0C1B] rounded-lg border border-black pointer-events-none" />

                                            <div
                                                onClick={() => currentWallArt && setZoomedArt(currentWallArt)}
                                                className="relative rounded-md overflow-hidden aspect-[4/5] h-40 sm:h-56 md:h-64 bg-black/80 flex items-center justify-center cursor-zoom-in group shadow-2xl z-10"
                                            >
                                                <img
                                                    src={currentWallArt.image}
                                                    alt={currentWallArt.title}
                                                    className="w-full h-full object-cover transition-all duration-[1500ms] group-hover/art:scale-105 group-hover/art:brightness-[1.1]"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-2">
                                                    <span className="p-1.5 sm:p-2 rounded-full bg-[#C9A84C] text-[#0A0F2C]">
                                                        <Maximize2 size={14} />
                                                    </span>
                                                    <span className="text-[8px] sm:text-[10px] font-mono tracking-widest text-[#E8E0D5] uppercase font-bold">Click to Inspect</span>
                                                </div>
                                            </div>

                                            {/* Wall label */}
                                            <div className="mt-5 sm:mt-8 text-center max-w-xs mx-auto z-15 relative">
                                                <span className="text-[7px] sm:text-[9px] font-mono tracking-widest text-[#C9A84C] uppercase bg-black/40 border border-white/5 py-0.5 px-2 rounded-full">
                                                    {currentWallArt.category} Label
                                                </span>
                                                <h4 className="font-serif text-[#E8E0D5] text-sm sm:text-base group-hover/art:text-[#C9A84C] transition duration-300 mt-1.5 leading-tight">
                                                    {currentWallArt.title}
                                                </h4>
                                                <div className="text-[9px] sm:text-[10px] text-gray-400 mt-1 font-mono">
                                                    {currentWallArt.artist} &bull; {currentWallArt.year}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-500 font-serif text-xs sm:text-sm">
                                            Exhibition curation undergoing alignment swap. Change wall.
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Floor controls */}
                        <div className="w-full flex flex-wrap justify-between items-center mt-3 sm:mt-4 gap-2">
                            <div className="flex gap-1 items-center bg-black/40 border border-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-mono text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                                <span className="truncate max-w-[120px] sm:max-w-none">Ambient Audio: {activeRoom.ambiance}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const idx = (activeRoomIndex - 1 + ROOMS.length) % ROOMS.length;
                                        handleRoomSwitch(idx);
                                    }}
                                    className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                    title="Previous Room"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                                <span className="text-[9px] sm:text-[10px] font-mono text-white tracking-widest uppercase font-bold">
                                    ROOM {activeRoomIndex + 1}/{ROOMS.length}
                                </span>
                                <button
                                    onClick={() => {
                                        const idx = (activeRoomIndex + 1) % ROOMS.length;
                                        handleRoomSwitch(idx);
                                    }}
                                    className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                    title="Next Room"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Curatorial commentary */}
                    <div className="bg-[#05091C]/80 border border-white/5 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                        <div className="shrink-0 p-2 sm:p-3 bg-[#C9A84C]/10 rounded-full text-[#C9A84C] border border-[#C9A84C]/20">
                            <Award size={20} />
                        </div>
                        <div>
                            <span className="text-[8px] sm:text-[9px] font-mono text-[#C9A84C] uppercase tracking-widest block font-bold">
                                Museum Curatorial Commentary
                            </span>
                            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed font-sans">{activeRoom.description}</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                                <div>
                                    <strong className="text-white">Active Materials:</strong> {activeRoom.materials}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6 justify-between">
                    {/* Floor plan minimap */}
                    <div className="bg-[#05081A]/95 border border-white/5 rounded-2xl p-4 sm:p-5 text-left flex flex-col justify-between">
                        <div>
                            <span className="text-[8px] sm:text-[9px] tracking-widest font-mono text-[#C9A84C] block font-bold uppercase">
                                Metaverse Floor Plan &bull; خريطة المعرض
                            </span>
                            <h3 className="font-serif text-white text-sm sm:text-base font-semibold mt-0.5 mb-3 uppercase">Gallery Map Position</h3>
                        </div>
                        <div className="w-full h-28 sm:h-36 bg-[#040612] rounded-xl border border-white/10 relative p-3 flex flex-col justify-between overflow-hidden">
                            {ROOMS.map((rm, idx) => (
                                <div
                                    key={rm.id}
                                    onClick={() => handleRoomSwitch(idx)}
                                    className={`w-5/12 h-[60px] sm:h-[75px] border rounded p-1.5 sm:p-2 text-[7px] sm:text-[8px] font-mono flex flex-col justify-between cursor-pointer transition ${
                                        idx === 0 ? '' : 'absolute right-3 top-3'
                                    } ${
                                        activeRoomIndex === idx
                                            ? `bg-[#1A1126]/40 border-[${rm.accentColor}] text-[${rm.accentColor}]`
                                            : 'bg-black/40 border-white/15 text-slate-400 hover:border-white/30'
                                    }`}
                                >
                                    <span>ROOM {idx + 1}</span>
                                    <span className="truncate">{idx === 0 ? 'Fatimid Geometry' : 'Calligraphy Pavilion'}</span>
                                </div>
                            ))}
                            <div
                                style={{ left: `${currentCoords.x}%`, top: `${currentCoords.y}%` }}
                                className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border border-white transition-all duration-750 flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2 shadow-red-500/50"
                            >
                                <span className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75" />
                            </div>
                            <div className="w-full text-center border-t border-white/5 pt-1.5 text-[7px] sm:text-[8px] font-mono text-gray-500 flex justify-between uppercase mt-auto">
                                <span>
                                    Coordinates: {currentCoords.x}&deg;N, {currentCoords.y}&deg;E
                                </span>
                                <span className="text-red-400 tracking-wider">Dynamic Stance</span>
                            </div>
                        </div>
                    </div>

                    {/* Inspect sidebar */}
                    <div className="bg-[#05081A]/95 border border-[#C9A84C]/25 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-between relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {zoomedArt ? (
                                <motion.div
                                    key={zoomedArt.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col justify-between h-full text-left"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-[#C9A84C] text-[#0A0F2C] px-2 py-0.5 rounded font-bold tracking-wider">
                                                Inspected Piece
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setZoomedArt(null);
                                                    handleStopNarration();
                                                }}
                                                className="text-[10px] sm:text-xs text-slate-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer font-bold"
                                            >
                                                [ Zoom Out ]
                                            </button>
                                        </div>
                                        <h4 className="font-serif text-white text-base sm:text-lg font-bold leading-tight uppercase mb-1">{zoomedArt.title}</h4>
                                        <p className="text-xs text-[#C9A84C] font-mono italic mb-4">Artist: {zoomedArt.artist}</p>
                                        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-4 font-sans">{zoomedArt.description}</p>
                                        <div className="space-y-1.5 text-[9px] sm:text-[10px] font-mono text-gray-400 border-t border-b border-white/10 py-3 mb-4">
                                            <div className="flex justify-between">
                                                <span>Heritage Age</span>
                                                <span className="text-white">{zoomedArt.year}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Original Medium</span>
                                                <span className="text-white">{zoomedArt.medium}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Dimensions Scale</span>
                                                <span className="text-[#C9A84C]">{zoomedArt.dimensions}</span>
                                            </div>
                                        </div>

                                        {/* ─── Audio guide ─── */}
                                        <div className="mb-4">
                                            <button
                                                onClick={() => {
                                                    if (isAudioGuideActive) {
                                                        handleStopNarration();
                                                    } else {
                                                        handleStartNarration();
                                                    }
                                                }}
                                                className={`w-full py-2.5 rounded text-[10px] sm:text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                                                    isAudioGuideActive
                                                        ? 'bg-red-950 text-red-200 border border-red-500/30'
                                                        : 'bg-[#1B2A6B]/50 hover:bg-[#1B2A6B] text-white border border-white/10'
                                                }`}
                                            >
                                                {isAudioGuideActive ? (
                                                    <><VolumeX size={13} /> Stop Narration</>
                                                ) : (
                                                    <><Volume2 size={13} /> {LANGUAGE_LABEL[currentLangCode].name === 'عربي' ? 'استمع للجولة' : LANGUAGE_LABEL[currentLangCode].name === 'Français' ? 'Écouter la visite' : LANGUAGE_LABEL[currentLangCode].name === 'Deutsch' ? 'Tour anhören' : 'Listen to Curatorial Tour'}</>
                                                )}
                                            </button>

                                            {isAudioGuideActive && (() => {
                                                const stories = STORY_MAP[currentLangCode];
                                                const fallback = STORY_MAP.en;
                                                const fullText = zoomedArt ? (stories[zoomedArt.id] || fallback[zoomedArt.id] || '') : '';
                                                const words = fullText.split(/\s+/);
                                                const revealedCount = Math.min(tts.currentWordIndex, words.length);
                                                const progress = words.length > 0 ? Math.round((revealedCount / words.length) * 100) : 0;
                                                const isAr = tts.isArabicText;
                                                return (
                                                    <div
                                                        className={`p-3 bg-black/50 border border-white/5 rounded-lg mt-2 text-[11px] leading-relaxed h-28 overflow-y-auto ${
                                                            isAr ? 'text-right' : 'text-left'
                                                        }`}
                                                        dir={isAr ? 'rtl' : 'ltr'}
                                                    >
                                                        <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest mb-1">
                                                            <Volume2 size={10} className="text-green-400 animate-pulse shrink-0" />
                                                            <span className="text-[#C9A84C]">
                                                                {isAr ? 'التعليق الصوتي نشط' : currentLangCode === 'fr' ? 'Narration vocale active' : currentLangCode === 'de' ? 'Sprachführung aktiv' : 'Voice Narration Active'}
                                                            </span>
                                                            <span className="text-green-400/60 font-mono ml-auto shrink-0">
                                                                🔉 {progress}%
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`font-serif ${isAr ? 'text-[13px] leading-[1.8]' : 'italic text-[11px]'}`}
                                                            style={{ color: isAr ? '#E8E0D5' : '#d1d5db' }}
                                                        >
                                                            {isAr ? '«' : '\u201C'}
                                                            {words.slice(0, revealedCount).join(' ')}
                                                            {revealedCount < words.length && (
                                                                <span className="w-1.5 h-3.5 bg-[#C9A84C] inline-block animate-pulse ml-0.5 align-middle" />
                                                            )}
                                                            {revealedCount >= words.length && (isAr ? '»' : '\u201D')}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* ─── Voice Tuning Panel ─── */}
                                            <div className="mt-3 p-3 bg-[#090D2A]/70 border border-white/5 rounded-lg">
                                                <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase text-[#C9A84C] tracking-widest mb-2">
                                                    <Mic size={10} /> Voice Tuning — {LANGUAGE_LABEL[currentLangCode].name}
                                                </div>

                                                {/* Language Toggle — All 4 Languages */}
                                                <div className="mb-3 p-2 bg-black/30 border border-white/5 rounded-lg">
                                                    <label className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">
                                                        {currentLangCode === 'ar' ? 'اللغة' : 'Language'}
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {LANGUAGES.map((lang) => (
                                                            <button
                                                                key={lang.code}
                                                                onClick={() => tts.setLanguage(lang.code)}
                                                                className={`flex items-center gap-1.5 py-1.5 px-2 rounded text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                                                                    currentLangCode === lang.code
                                                                        ? 'bg-[#C9A84C] text-[#0A0F2C] shadow-sm'
                                                                        : lang.hasVoices(tts)
                                                                            ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                                            : 'bg-white/[0.03] text-slate-600 cursor-not-allowed'
                                                                }`}
                                                                title={
                                                                    lang.hasVoices(tts)
                                                                        ? `Switch to ${LANGUAGE_LABEL[lang.code].name}`
                                                                        : `No ${LANGUAGE_LABEL[lang.code].name} voice available on this system`
                                                                }
                                                                disabled={!lang.hasVoices(tts)}
                                                            >
                                                                <span className="shrink-0">{lang.flag}</span>
                                                                <span className="truncate">{lang.label}</span>
                                                                {!lang.hasVoices(tts) && (
                                                                    <AlertTriangle size={9} className="text-amber-500/60 shrink-0" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[7px] font-mono text-slate-600 mt-1.5 leading-relaxed">
                                                        {LANGUAGE_LABEL[currentLangCode].tooltip}
                                                    </p>
                                                    {currentLangCode === 'ar' && !tts.hasArabicVoices && (
                                                        <p className="text-[7px] font-mono text-amber-500/80 mt-1.5 leading-relaxed">
                                                            💡 No Arabic voice detected on your system. To add one:
                                                            Windows Settings → Time &amp; Language → Speech → Install Arabic.
                                                        </p>
                                                    )}
                                                </div>

                                                {/* ─── Voice Selector (ALL voices always shown) + Preview ─── */}
                                                <div className="mb-2">
                                                    <label className="text-[8px] font-mono text-slate-500 uppercase block mb-1">
                                                        Voice {tts.options.lang === 'ar' ? '— الصوت' : ''}
                                                    </label>
                                                    <div className="flex gap-1.5 items-center">
                                                        <select
                                                            value={tts.selectedVoice?.voiceURI || ''}
                                                            onChange={(e) => tts.setVoice(e.target.value)}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none cursor-pointer min-w-0"
                                                            dir={activeLang?.dir || 'ltr'}
                                                        >
                                                            <option value="">
                                                                {tts.voices.length === 0
                                                                    ? '⏳ Loading voices…'
                                                                    : currentLangCode === 'ar'
                                                                        ? '🎤 الصوت الافتراضي'
                                                                        : '🎤 Auto (default voice)'}
                                                            </option>
                                                            {tts.voices.map((v) => (
                                                                <option key={v.voiceURI} value={v.voiceURI}>
                                                                    {v.name} ({v.lang})
                                                                    {v.lang.startsWith(currentLangCode) ? ' ★' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {tts.selectedVoice && (
                                                            <button
                                                                onClick={() => tts.previewVoice(tts.selectedVoice!.voiceURI)}
                                                                className="shrink-0 p-1.5 rounded-lg bg-[#1B2A6B]/50 hover:bg-[#1B2A6B] text-white border border-white/10 transition cursor-pointer"
                                                                title="Preview this voice"
                                                            >
                                                                <Play size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between text-[7px] font-mono text-slate-600 mt-1">
                                                        <span>
                                                            {tts.voices.length} voice{tts.voices.length !== 1 ? 's' : ''} available
                                                            {tts.hasArabicVoices ? ' · 🇸🇦 AR' : ''}
                                                            {tts.hasFrenchVoices ? ' · 🇫🇷 FR' : ''}
                                                            {tts.hasGermanVoices ? ' · 🇩🇪 DE' : ''}
                                                        </span>
                                                        {tts.selectedVoice && (
                                                            <span className="text-[#C9A84C]">
                                                                {tts.selectedVoice.lang.startsWith('ar') ? '🇸🇦' : tts.selectedVoice.lang.startsWith('fr') ? '🇫🇷' : tts.selectedVoice.lang.startsWith('de') ? '🇩🇪' : '🇬🇧'} {tts.selectedVoice.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Speed Slider */}
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase mb-1">
                                                        <span>Speed</span>
                                                        <span className="text-[#C9A84C]">{tts.options.rate.toFixed(1)}x</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.3"
                                                        max="2.0"
                                                        step="0.1"
                                                        value={tts.options.rate}
                                                        onChange={(e) => tts.setRate(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C9A84C]"
                                                    />
                                                    <div className="flex justify-between text-[7px] font-mono text-slate-600 mt-0.5">
                                                        <span>Slow</span>
                                                        <span>Fast</span>
                                                    </div>
                                                </div>

                                                {/* Pitch Slider */}
                                                <div>
                                                    <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase mb-1">
                                                        <span>Pitch</span>
                                                        <span className="text-[#C9A84C]">{tts.options.pitch.toFixed(1)}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.3"
                                                        max="2.0"
                                                        step="0.1"
                                                        value={tts.options.pitch}
                                                        onChange={(e) => tts.setPitch(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C9A84C]"
                                                    />
                                                    <div className="flex justify-between text-[7px] font-mono text-slate-600 mt-0.5">
                                                        <span>Low</span>
                                                        <span>High</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 mt-auto flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono mb-2">
                                            <span className="text-gray-500">Curatorial Valuation:</span>
                                            <span className="text-white font-extrabold text-sm sm:text-base">${zoomedArt.price.toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={() => onAddToCart(zoomedArt)}
                                            className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 hover:text-[#0A0F2C] text-[#0A0F2C] text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded transition-all duration-350 cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <ShoppingCart size={13} /> Purchase Curation Piece
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-inspect"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-10"
                                >
                                    <button
                                        onClick={() => currentWallArt && setZoomedArt(currentWallArt)}
                                        className="flex flex-col items-center gap-1 group cursor-pointer"
                                        title="Click to inspect the current artwork"
                                    >
                                        <Eye className="text-[#C9A84C] mb-1 animate-pulse group-hover:scale-110 transition-transform" size={24} />
                                        <span className="text-[9px] sm:text-[10px] font-mono text-[#C9A84C] underline group-hover:text-white transition-colors">
                                            Click to Inspect
                                        </span>
                                    </button>
                                    <h4 className="font-serif text-[#E8E0D5] text-xs sm:text-sm uppercase font-semibold mb-1 mt-3">Interactive Wall Inspect</h4>
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 leading-relaxed max-w-[170px] sm:max-w-[190px]">
                                        Click the artwork above or tap the <strong>eye icon</strong> to zoom, play live voice narratives, and acquire pieces.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
