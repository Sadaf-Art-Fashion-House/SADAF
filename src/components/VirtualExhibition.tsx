import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Eye, 
  ArrowLeft, 
  ArrowRight, 
  Maximize2, 
  Compass, 
  Volume2, 
  VolumeX, 
  ShoppingCart, 
  Layers, 
  ChevronRight, 
  HelpCircle,
  MapPin,
  Flame,
  User,
  Activity,
  Award
} from 'lucide-react';
import { ArtPiece } from '../types';

interface VirtualExhibitionProps {
  artworks: ArtPiece[];
  onAddToCart: (art: ArtPiece) => void;
  onSelectArtPiece: (art: ArtPiece) => void;
}

interface Room {
  id: string;
  name: string;
  arabicName: string;
  tagline: string;
  description: string;
  ambiance: string;
  materials: string;
  accentColor: string;
  backgroundColor: string;
  artworkIds: string[];
}

export default function VirtualExhibition({ artworks, onAddToCart, onSelectArtPiece }: VirtualExhibitionProps) {
  // Rooms Definitions
  const rooms: Room[] = [
    {
      id: 'room-1',
      name: 'Court of Fatimid Geometry',
      arabicName: 'فناء الهندسة الفاطمية',
      tagline: 'Cairo’s golden history, structural stone carvings, and symmetric star alignments',
      description: 'Explore pieces designed on traditional symmetric star grids. Witness the interplay of raw red copper, dense desert sandstone, and 18k golden wire meshes representing cosmic order.',
      ambiance: 'Warm sandstone lights, desert dusk echoes, slow spatial glow',
      materials: 'Hand-hammered Red Copper, Saltwater Mother-of-Pearl & Fine Silver',
      accentColor: '#C9A84C',
      backgroundColor: 'from-[#0E0B16] via-[#1A1126] to-[#0A0512]',
      artworkIds: ['art-2', 'art-5', 'art-6']
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
      artworkIds: ['art-1', 'art-4', 'art-3']
    }
  ];

  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
  const activeRoom = rooms[activeRoomIndex];

  // Active Wall View inside the current room: 'left' | 'center' | 'right'
  const [activeWall, setActiveWall] = useState<'left' | 'center' | 'right'>('center');
  
  // Detailed Inspect Artwork state (null if zoomed out)
  const [zoomedArt, setZoomedArt] = useState<ArtPiece | null>(null);
  
  // Interactive Curatorial Audio Guide Tour Simulator
  const [isAudioGuideActive, setIsAudioGuideActive] = useState<boolean>(false);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [transcriptCharacterIndex, setTranscriptCharacterIndex] = useState<number>(0);

  // Filter artworks for this room which exist in the database
  const activeRoomArtworks = activeRoom.artworkIds
    .map(id => artworks.find(art => art.id === id))
    .filter((art): art is ArtPiece => !!art);

  // Divide active room artworks to Left, Center, and Right walls
  // For a room of 3 pieces: item 0 on Left, item 1 on Center, item 2 on Right
  const wallArtMap = {
    left: activeRoomArtworks[0] || null,
    center: activeRoomArtworks[1] || null,
    right: activeRoomArtworks[2] || null
  };

  const currentWallArt = wallArtMap[activeWall];

  // Map Navigation coordinates helper
  const mapCoordinates = {
    'room-1': { 'left': { x: 30, y: 70 }, 'center': { x: 50, y: 40 }, 'right': { x: 70, y: 70 } },
    'room-2': { 'left': { x: 30, y: 72 }, 'center': { x: 50, y: 45 }, 'right': { x: 70, y: 72 } }
  };

  const currentCoords = mapCoordinates[activeRoom.id as 'room-1' | 'room-2']?.[activeWall] || { x: 50, y: 50 };

  // Generate curatorial narrative on the fly whenever a piece is inspected or audio guide is activated
  const curatorialStories: Record<string, string> = {
    'art-1': "Behold the glorious 'Golden Diwani Diptych' by Master Ahmed El-Saeed. Woven on indigo dyed linen sheets, this script utilizes medieval formula inks made from 24K pure liquid gold leaf. The cursive overlaps symbolize cosmic waves flowing on Cairo’s evening dunes.",
    'art-2': "Notice the intense geometric alignments inside this 'Fatimid Octagram Inlay Platter'. Handcrafted over 50 intense work hours in Al-Saad atelier in Old Cairo, each mother-of-pearl segment is placed with microscopic precision into heated red copper plates, mirroring ancient astronomic calendars.",
    'art-3': "Look closely at the heavy impasto layering of 'Nile Reflections inside Royal Orchid'. Farida Hammad utilizes dense oil textures layered with fine coastal sands, recreating the warm, humid air hanging over the historic Gayer-Anderson palaces.",
    'art-4': "This digital masterwork 'Fluid Arabesque Flow' represents a non-Euclidean future. Tariq Al-Faisal models standard Islamic tessellations, then runs automated algorithmic fluid simulations to show how cultural boundaries adapt to contemporary spaces.",
    'art-5': "Observe the structural drapes in this 'Gilded Abaya Drapery study'. Woven raw cotton panels showcase a master watercolor layout of Siwa Oasis movements, reflecting the nomadic posture and wind resistance designed in SADAF's signature outerwear blueprints.",
    'art-6': "This post-modern painting 'Cairo Deco Facade' merges sands with oil textures. Karim Abdel-Malik captures how Cairo's 1920s Art Deco apartment grids intersect with the continuous desert winds."
  };

  useEffect(() => {
    if (isAudioGuideActive && zoomedArt) {
      const fullText = curatorialStories[zoomedArt.id] || "This luxury heritage masterpiece is preserved inside SADAF's Cairo archives, representing authentic historical lineages and master craftsmanship.";
      setAudioTranscript('');
      setTranscriptCharacterIndex(0);
    } else {
      setAudioTranscript('');
      setIsAudioGuideActive(false);
    }
  }, [isAudioGuideActive, zoomedArt]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAudioGuideActive && zoomedArt) {
      const fullText = curatorialStories[zoomedArt.id] || "This luxury heritage masterpiece is preserved inside SADAF's Cairo archives.";
      if (transcriptCharacterIndex < fullText.length) {
        timer = setTimeout(() => {
          setAudioTranscript(prev => prev + fullText[transcriptCharacterIndex]);
          setTranscriptCharacterIndex(prev => prev + 1);
        }, 35);
      }
    }
    return () => clearTimeout(timer);
  }, [transcriptCharacterIndex, isAudioGuideActive, zoomedArt]);

  // Handle switching rooms
  const handleRoomSwitch = (index: number) => {
    setActiveRoomIndex(index);
    setActiveWall('center');
    setZoomedArt(null);
    setIsAudioGuideActive(false);
  };

  // Switch wall direction smoothly
  const handleWallSwitch = (wall: 'left' | 'center' | 'right') => {
    setActiveWall(wall);
    setZoomedArt(null);
    setIsAudioGuideActive(false);
  };

  return (
    <div className={`w-full min-h-[550px] bg-gradient-to-b ${activeRoom.backgroundColor} rounded-3xl border border-[#C9A84C]/25 p-4 md:p-8 shadow-2xl overflow-hidden transition-all duration-[1000ms] text-left relative font-sans`}>
      
      {/* Absolute ambient lights casting shadows */}
      <div className="absolute top-0 left-10 w-[400px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-[#4FC3F7]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Decorative Traditional Border framing */}
      <div className="absolute inset-2 border border-[#C9A84C]/10 pointer-events-none rounded-2xl" />
      <div className="absolute inset-3 border border-[#C9A84C]/5 pointer-events-none rounded-2xl" />

      {/* Museum Top Navigation Bar */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5 mb-8">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C9A84C] font-bold flex items-center gap-1.5">
            <Compass size={12} className="animate-pulse" />
            SADAF METAVERSE ATELIER &bull; المعرض التفاعلي ثلاثي الأبعاد
          </span>
          <div className="flex gap-3 items-baseline mt-1.5">
            <h2 className="text-2xl md:text-3xl font-serif text-white font-semibold leading-tight tracking-tight">
              {activeRoom.name}
            </h2>
            <span className="text-xs font-serif text-[#C9A84C] font-bold italic tracking-wider block">
              {activeRoom.arabicName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl font-sans">{activeRoom.tagline}</p>
        </div>

        {/* Room selection block */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
          {rooms.map((rm, idx) => (
            <button
              key={rm.id}
              onClick={() => handleRoomSwitch(idx)}
              className={`px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all duration-350 cursor-pointer ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">

        {/* 3D Museum Perspective Area (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main 3D Stage Projection */}
          <div className="relative aspect-[16/10] w-full bg-[#05060F]/90 border border-white/5 rounded-2xl shadow-inner overflow-hidden flex flex-col items-center justify-between p-6 perspective-[1000px] group-hover:border-[#4FC3F7]/35 transition-all duration-500 min-h-[380px]">
            
            {/* Spotlight projecting lights on the active wall */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-b from-[#C9A84C]/15 to-transparent blur-2xl pointer-events-none transition-all duration-700 ${
              activeWall === 'left' ? '-rotate-12 translate-x-[-150px]' : activeWall === 'right' ? 'rotate-12 translate-x-[150px]' : 'rotate-0'
            }`} />

            {/* Simulated Architecture Pillars / Arches in background */}
            <div className="absolute inset-0 opacity-[0.12] mix-blend-screen pointer-events-none flex justify-between px-16 h-full items-start">
              <div className="w-10 h-full bg-gradient-to-r from-white to-transparent border-r border-[#C9A84C]/40" />
              <div className="w-44 h-1/2 border-b border-x border-[#C9A84C]/40 rounded-b-full self-start" />
              <div className="w-10 h-full bg-gradient-to-l from-white to-transparent border-l border-[#C9A84C]/40" />
            </div>

            {/* Direction Navigation wall indicators */}
            <div className="w-full flex justify-between items-center text-xs text-gray-500 font-mono tracking-widest uppercase mb-4">
              <button 
                onClick={() => handleWallSwitch('left')}
                className={`py-1 px-3.5 rounded border transition-all duration-300 cursor-pointer ${
                  activeWall === 'left' ? 'text-[#C9A84C] border-[#C9A84C]/35 bg-[#C9A84C]/10 font-bold' : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                &lsaquo; Left Wall View
              </button>
              <button 
                onClick={() => handleWallSwitch('center')}
                className={`py-1 px-3.5 rounded border transition-all duration-300 cursor-pointer ${
                  activeWall === 'center' ? 'text-[#C9A84C] border-[#C9A84C]/35 bg-[#C9A84C]/10 font-bold' : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                Center Facade
              </button>
              <button 
                onClick={() => handleWallSwitch('right')}
                className={`py-1 px-3.5 rounded border transition-all duration-300 cursor-pointer ${
                  activeWall === 'right' ? 'text-[#C9A84C] border-[#C9A84C]/35 bg-[#C9A84C]/10 font-bold' : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                Right Wall View &rsaquo;
              </button>
            </div>

            {/* ARTWORK WALL STAGE WITH 3D TRANSFORMS */}
            <div className="flex-1 w-full flex items-center justify-center relative py-6">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeRoom.id}-${activeWall}`}
                  initial={{ 
                    opacity: 0, 
                    rotateY: activeWall === 'left' ? 30 : activeWall === 'right' ? -30 : 0,
                    scale: 0.9,
                    z: -50
                  }}
                  animate={{ 
                    opacity: 1, 
                    rotateY: 0,
                    scale: 1,
                    z: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    rotateY: activeWall === 'left' ? -30 : activeWall === 'right' ? 30 : 0,
                    scale: 0.9,
                    z: -50
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="w-full max-w-sm flex flex-col items-center"
                >
                  {currentWallArt ? (
                    <div className="relative group/art">
                      {/* Heavy Golden Ornamental Museum Frame */}
                      <div className="absolute -inset-4 bg-gradient-to-b from-[#C9A84C] via-[#99792B] to-[#F0D080]/90 rounded-xl p-[2.5px] shadow-[0_15px_35px_rgba(0,0,0,0.8)] border border-[#F0D080]/50 pointer-events-none" />
                      
                      {/* Inner fabric dark velvet matting */}
                      <div className="absolute -inset-2 bg-[#0F0C1B] rounded-lg border border-black pointer-events-none" />
                      
                      {/* Artwork Canvas wrapper */}
                      <div 
                        onClick={() => setZoomedArt(currentWallArt)}
                        className="relative rounded-md overflow-hidden aspect-[4/5] h-56 md:h-64 bg-black/80 flex items-center justify-center cursor-zoom-in group shadow-2xl z-10"
                      >
                        <img 
                          src={currentWallArt.image} 
                          alt={currentWallArt.title} 
                          className="w-full h-full object-cover transition-all duration-[1500ms] group-hover/art:scale-105 group-hover/art:brightness-[1.1]"
                          referrerPolicy="no-referrer"
                        />

                        {/* Interactive Zoom overlay sign */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-2">
                          <span className="p-2 rounded-full bg-[#C9A84C] text-[#0A0F2C]">
                            <Maximize2 size={16} />
                          </span>
                          <span className="text-[10px] font-mono tracking-widest text-[#E8E0D5] uppercase font-bold">Zoom Masterpiece</span>
                        </div>
                      </div>

                      {/* Wall label plate under artwork frame */}
                      <div className="mt-8 text-center max-w-xs mx-auto z-15 relative">
                        <span className="text-[9px] font-mono tracking-widest text-[#C9A84C] uppercase bg-black/40 border border-white/5 py-0.5 px-2 rounded-full">
                          {currentWallArt.category} Label
                        </span>
                        <h4 className="font-serif text-[#E8E0D5] text-base group-hover/art:text-[#C9A84C] transition duration-300 mt-1.5 leading-tight">
                          {currentWallArt.title}
                        </h4>
                        <div className="text-[10px] text-gray-400 mt-1 font-mono">{currentWallArt.artist} &bull; {currentWallArt.year}</div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center text-slate-500 font-serif text-sm">
                      Exhibition curation undergoing alignment swap. Change wall.
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

            </div>

            {/* Interactive directional floor arrows */}
            <div className="w-full flex justify-between items-center mt-4">
              <div className="flex gap-1 items-center bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-mono text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Ambient Audio: {activeRoom.ambiance}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const idx = (activeRoomIndex - 1 + rooms.length) % rooms.length;
                    handleRoomSwitch(idx);
                  }}
                  className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Previous Room"
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="text-[10px] font-mono text-white tracking-widest uppercase font-bold">ROOM {activeRoomIndex + 1}/{rooms.length}</span>
                <button
                  onClick={() => {
                    const idx = (activeRoomIndex + 1) % rooms.length;
                    handleRoomSwitch(idx);
                  }}
                  className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Next Room"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Exhibition descriptive walkthrough notes under viewport */}
          <div className="bg-[#05091C]/80 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="shrink-0 p-3 bg-[#C9A84C]/10 rounded-full text-[#C9A84C] border border-[#C9A84C]/20">
              <Award size={24} />
            </div>
            <div>
              <span className="text-[9px] font-mono text-[#C9A84C] uppercase tracking-widest block font-bold">Museum Curatorial Commentary</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">{activeRoom.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-gray-400 font-mono">
                <div><strong className="text-white">Active Materials:</strong> {activeRoom.materials}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Hand: Minimap & Curatorial Siderail (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
          
          {/* Interactive Exhibition Floor Plan Minimap */}
          <div className="bg-[#05081A]/95 border border-white/5 rounded-2xl p-5 text-left flex flex-col justify-between">
            <div>
              <span className="text-[9px] tracking-widest font-mono text-[#C9A84C] block font-bold uppercase">Metaverse Floor Plan &bull; خريطة المعرض</span>
              <h3 className="font-serif text-white text-base font-semibold mt-0.5 mb-3 uppercase">Gallery Map Position</h3>
            </div>

            {/* Vector Minimap */}
            <div className="w-full h-36 bg-[#040612] rounded-xl border border-white/10 relative p-3 flex flex-col justify-between overflow-hidden">
              
              {/* Room 1 Layout Block */}
              <div 
                onClick={() => handleRoomSwitch(0)}
                className={`w-1/2 h-[75px] border rounded p-2 text-[8px] font-mono flex flex-col justify-between cursor-pointer transition ${
                  activeRoomIndex === 0 
                  ? 'bg-[#1A1126]/40 border-[#C9A84C] text-[#C9A84C]' 
                  : 'bg-black/40 border-white/15 text-slate-400 hover:border-white/30'
                }`}
              >
                <span>ROOM 1</span>
                <span className="truncate">Fatimid Geometry</span>
              </div>

              {/* Room 2 Layout Block */}
              <div 
                onClick={() => handleRoomSwitch(1)}
                className={`absolute right-3 top-3 w-5/12 h-[75px] border rounded p-2 text-[8px] font-mono flex flex-col justify-between cursor-pointer transition ${
                  activeRoomIndex === 1 
                  ? 'bg-[#111A45]/40 border-[#4FC3F7] text-[#4FC3F7]' 
                  : 'bg-black/40 border-white/15 text-slate-400 hover:border-white/30'
                }`}
              >
                <span>ROOM 2</span>
                <span className="truncate">Calligraphy Pavilion</span>
              </div>

              {/* Current wall dynamic dot locator coordinates */}
              <div 
                style={{ left: `${currentCoords.x}%`, top: `${currentCoords.y}%` }}
                className="absolute w-2.5 h-2.5 bg-red-500 rounded-full border border-white transition-all duration-750 flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2 shadow-red-500/50"
              >
                {/* Ping ray */}
                <span className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75" />
              </div>

              <div className="w-full text-center border-t border-white/5 pt-1.5 text-[8px] font-mono text-gray-500 flex justify-between uppercase">
                <span>Coordinates: {currentCoords.x}°N, {currentCoords.y}°E</span>
                <span className="text-red-400 tracking-wider">Dynamic Stance</span>
              </div>
            </div>
          </div>

          {/* Curatorial Inspect Detailed sidebar */}
          <div className="bg-[#05081A]/95 border border-[#C9A84C]/25 rounded-2xl p-5 flex-1 flex flex-col justify-between relative overflow-hidden">
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
                      <span className="text-[10px] font-mono uppercase bg-[#C9A84C] text-[#0A0F2C] px-2 py-0.5 rounded font-bold tracking-wider">
                        Inspected Piece
                      </span>
                      <button 
                        onClick={() => {
                          setZoomedArt(null);
                          setIsAudioGuideActive(false);
                        }}
                        className="text-xs text-slate-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer font-bold"
                      >
                        [ Zoom Out ]
                      </button>
                    </div>

                    <h4 className="font-serif text-white text-lg font-bold leading-tight uppercase mb-1">
                      {zoomedArt.title}
                    </h4>
                    <p className="text-xs text-[#C9A84C] font-mono italic mb-4">Artist: {zoomedArt.artist}</p>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4 leading-normal font-sans">
                      {zoomedArt.description}
                    </p>

                    <div className="space-y-1.5 text-[10px] font-mono text-gray-400 border-t border-b border-white/10 py-3 mb-4">
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

                    {/* Guided audio simulator section */}
                    <div className="mb-4">
                      <button
                        onClick={() => setIsAudioGuideActive(!isAudioGuideActive)}
                        className={`w-full py-2.5 rounded text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          isAudioGuideActive 
                          ? 'bg-red-950 text-red-200 border border-red-500/30'
                          : 'bg-[#1B2A6B]/50 hover:bg-[#1B2A6B] text-white border border-white/10'
                        }`}
                      >
                        {isAudioGuideActive ? (
                          <>
                            <VolumeX size={13} /> Stop Virtual Narration
                          </>
                        ) : (
                          <>
                            <Volume2 size={13} /> Listen to Curatorial Tour
                          </>
                        )}
                      </button>

                      {isAudioGuideActive && (
                        <div className="p-3 bg-black/50 border border-white/5 rounded-lg mt-2 text-[11px] text-gray-300 leading-relaxed h-24 overflow-y-auto">
                          <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase text-[#C9A84C] tracking-widest mb-1">
                            <Activity size={10} className="animate-bounce" /> Live Audio guide play
                          </div>
                          <span className="font-serif italic">"{audioTranscript}"</span>
                          {transcriptCharacterIndex < (curatorialStories[zoomedArt.id]?.length || 0) && (
                            <span className="w-1.5 h-3.5 bg-[#C9A84C] inline-block animate-pulse ml-0.5" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-auto flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-mono mb-2">
                      <span className="text-gray-500">Curatorial Valuation:</span>
                      <span className="text-white font-extrabold text-base">${zoomedArt.price.toLocaleString()}</span>
                    </div>
                    
                    <button
                      onClick={() => onAddToCart(zoomedArt)}
                      className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 hover:text-[#0A0F2C] text-[#0A0F2C] text-xs font-bold uppercase tracking-widest rounded transition-all duration-350 cursor-pointer flex items-center justify-center gap-1.5"
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
                  className="flex flex-col items-center justify-center h-full text-center py-10"
                >
                  <Eye className="text-[#C9A84C] mb-3 animate-pulse" size={28} />
                  <h4 className="font-serif text-[#E8E0D5] text-sm uppercase font-semibold mb-1">Interactive Wall Inspect</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed max-w-[190px]">
                    Click on any floating gold artwork frame inside the viewport canvas to zoom, play live voice narratives, and purchase authentic Arabic crafts.
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
