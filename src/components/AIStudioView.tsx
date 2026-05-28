import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Upload, Ruler, RefreshCw, Layers, Check, ShoppingBag, Eye, Info } from 'lucide-react';
import { AIClothingDesign, MaqasaqRecommendation } from '../types';
import { fabricsList, printingMethods } from '../data';

interface AIStudioViewProps {
  onAddCustomToCart: (customDesign: AIClothingDesign, size: string) => void;
}

export default function AIStudioView({ onAddCustomToCart }: AIStudioViewProps) {
  // Navigation Flow State: 1. Pattern Generation | 2. Customization Studio | 3. Maqasaq AI Try-on & Size
  const [activeStep, setActiveStep] = useState<number>(1);

  // 1. Generation Parameters State
  const [prompt, setPrompt] = useState<string>('Fatimid octagonal stars intersecting with luxurious gold calligraphic brushstrokes');
  const [clothingType, setClothingType] = useState<'Hoodie' | 'T-Shirt' | 'Abaya' | 'Jacket' | 'Streetwear'>('Abaya');
  const [flavorPreset, setFlavorPreset] = useState<string>('Islamic Geometry');
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [isGeneratingPattern, setIsGeneratingPattern] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Bespoke Design State
  const [activeDesign, setActiveDesign] = useState<AIClothingDesign>({
    prompt: "Fatimid octagonal stars intersecting with luxurious gold calligraphic brushstrokes",
    clothingType: "Abaya",
    primaryColor: "#0A0F2C",
    svgPattern: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0A0F2C"/>
      <circle cx="50" cy="50" r="40" stroke="#C9A84C" stroke-width="0.75" stroke-dasharray="2,2"/>
      <polygon points="50,14 61,39 86,50 61,61 50,86 39,61 14,50 39,39" stroke="#4FC3F7" stroke-width="1" fill="none"/>
      <circle cx="50" cy="50" r="10" stroke="#C9A84C" stroke-width="0.5"/>
      <path d="M 50,32 C 55,40 55,60 50,68 C 45,60 45,40 50,32 Z" fill="#F0D080" opacity="0.8"/>
    </svg>`,
    accentColor: "#C9A84C",
    patternName: "Fatimid Imperial Geometry",
    description: "Intricately detailed Fatimid geometries merged with modern flowing drapes.",
    story: "Woven under Alexandria’s golden sea dusk, this design traces Fatimid architectural star patterns. It represents geometric perfection aligned with calligraphy rhythms.",
    fabrics: ["Premium Mulberry Silk", "Luxury Italian Velvet"],
    printingOption: "Embroidery (Gold Thread)"
  });

  // 2. Customization Detail parameters
  const [selectedFabric, setSelectedFabric] = useState<string>(fabricsList[0].name);
  const [selectedPrinting, setSelectedPrinting] = useState<string>(printingMethods[0].name);
  const [baseColor, setBaseColor] = useState<string>('#0A0F2C');
  const [mockupAngle, setMockupAngle] = useState<'front' | 'back'>('front');

  // 3. Maqasaq Sizing State
  const [height, setHeight] = useState<string>('178');
  const [weight, setWeight] = useState<string>('72');
  const [gender, setGender] = useState<string>('Women');
  const [posture, setPosture] = useState<string>('Fluid Grace fit');
  const [isCalculatingSize, setIsCalculatingSize] = useState<boolean>(false);
  const [sizeRecommendation, setSizeRecommendation] = useState<MaqasaqRecommendation>({
    size: "M",
    confidence: 97.4,
    measurements: {
      chest: 96,
      shoulder: 41,
      length: 135,
      waist: 78
    },
    comment: "Maqasaq tailors recommend size M. Ideal drape alignment calculated across shoulders. Fabric maps perfectly to mulberry silk fluidity."
  });

  // Sample Presets
  const presets = [
    { name: 'Islamic Geometry', text: 'Classic Byzantine octagrams, intricate symmetric star grids, thin golden lines, interlocking medallions' },
    { name: 'Cairo Art Deco', text: 'Gilded Egyptian Art Deco vertical grids, sandy ivory blocks, overlapping copper structures and stylized lilies' },
    { name: 'Gilded Calligraphy', text: 'Sweeping Diwani calligraphic verses in 18k liquid gold ink brush strokes, flowing randomly on deep velvet' },
    { name: 'Alexandrian Inlay', text: 'Geometric mother-of-pearl (Sadaf) mosaic triangles, saltwater shell textures, crystal blue iridescent lines' }
  ];

  // Simulated drag and drop handle
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedBase64(reader.result as string);
        setPrompt(`Fusing uploaded textile photo with premium gold drapes on standard ${clothingType}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setFlavorPreset(preset.name);
    setPrompt(preset.text);
  };

  // call server-side `/api/gemini/generate-pattern` 
  const handleGenerateDesign = async () => {
    setIsGeneratingPattern(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/gemini/generate-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          clothingType: clothingType,
          styleModifier: flavorPreset
        })
      });

      if (!response.ok) {
        throw new Error("Server responded with error status");
      }

      const data = await response.json();

      setActiveDesign({
        prompt: prompt,
        clothingType: clothingType,
        primaryColor: data.primaryColor || "#0A0F2C",
        svgPattern: data.customSvg,
        accentColor: data.accentColor || "#C9A84C",
        patternName: data.patternName || "Imperial Symmetrical Geometry",
        description: data.description || "Sophisticated high-contrast textile pattern.",
        story: data.story || "A tale of cultural resonance woven on modern silhouettes.",
        fabrics: data.matchingFabrics || ["Luxury Italian Velvet"],
        printingOption: data.printingOption || "Embroidery (Gold Thread)"
      });

      // Update base color to generate brand's favorite matching tone
      setBaseColor(data.primaryColor || '#0A0F2C');
      setActiveStep(2); // Jump to next customization step

    } catch (err: any) {
      console.error(err);
      setGenerationError("Failed to reach Gemini creative pipeline. Running high-integrity backup loop.");
    } finally {
      setIsGeneratingPattern(false);
    }
  };

  // call server-side `/api/maqasaq/size-advisor`
  const handleCalculateSize = async () => {
    setIsCalculatingSize(true);
    try {
      const response = await fetch('/api/maqasaq/size-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height,
          weight,
          gender,
          posture
        })
      });

      if (!response.ok) throw new Error("Advisor unreachable");
      const data = await response.json();
      setSizeRecommendation({
        size: data.size,
        confidence: data.confidence,
        measurements: data.measurements,
        comment: data.comment
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingSize(false);
    }
  };

  const dispatchToCoutureAtelier = () => {
    const finalPersonalizedDesign: AIClothingDesign = {
      ...activeDesign,
      primaryColor: baseColor,
      printingOption: selectedPrinting as any,
      fabrics: [selectedFabric, ...activeDesign.fabrics]
    };
    onAddCustomToCart(finalPersonalizedDesign, sizeRecommendation.size);
    // Modal-like response
    alert(`Bespoke Customized ${clothingType} added to your Couture Bag. Manufacturing will commence in Cairo Atelier according to recommended sizing.`);
  };

  return (
    <div className="relative w-full overflow-hidden min-h-screen pb-20">
      {/* AI Hero Banner */}
      <section className="relative py-16 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-[#0A0F2C] text-center overflow-hidden">
        <div className="absolute top-0 right-1/2 w-80 h-80 rounded-full bg-[#1B2A6B]/20 blur-[125px] pointer-events-none" />

        <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">SADAF COUTURE LABORATORY &bull; المعمل الرقمي</span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white uppercase tracking-tight mb-2">
          AI STUDIO: <span className="text-gold-gradient italic font-serif">Curation of the Infinite</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
          Blend ancient Arabic art, complex Islamic geometry, and digital patterns using high-fidelity generative models. Tailor a piece, configure fit variables on Maqasaq AI, and add to your collection.
        </p>

        {/* Steps navigation dots */}
        <div className="flex items-center justify-center gap-4 mt-10 max-w-lg mx-auto">
          {[
            { num: 1, label: '1. Pattern Studio' },
            { num: 2, label: '2. Atelier Customizer' },
            { num: 3, label: '3. Maqasaq AI Fit' }
          ].map(st => (
            <button
              key={st.num}
              onClick={() => setActiveStep(st.num)}
              className={`flex-1 py-2 border-b-2 text-xs font-mono uppercase tracking-wider text-center transition-all duration-300 cursor-pointer ${
                activeStep === st.num 
                  ? 'border-[#C9A84C] text-[#C9A84C]' 
                  : 'border-white/10 text-gray-500 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Studio Arena */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Controls Panel (Steps 1, 2, or 3 interactive state) */}
        <div className="lg:col-span-6 flex flex-col justify-start">
          <AnimatePresence mode="wait">
            {activeStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="bg-[#0A0F2C]/80 border border-white/5 p-6 rounded-2xl flex flex-col gap-6"
              >
                <div>
                  <h3 className="font-serif text-xl text-white flex items-center gap-2">
                    <Sparkles className="text-[#C9A84C]" size={20} /> Base Silhouette Type
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {['Abaya', 'Hoodie', 'T-Shirt', 'Jacket', 'Streetwear'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setClothingType(t as any)}
                        className={`py-3 rounded text-xs font-medium uppercase tracking-wider transition-all duration-350 cursor-pointer ${
                          clothingType === t
                            ? 'bg-[#1B2A6B] text-white border border-[#4FC3F7]/50'
                            : 'bg-[#0A0F2C] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aesthetic Theme presets */}
                <div>
                  <h4 className="text-xs uppercase text-[#C9A84C] tracking-widest font-mono mb-2">Select Creative Filter Preset</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((pr) => (
                      <button
                        key={pr.name}
                        onClick={() => applyPreset(pr)}
                        className={`text-left p-3 rounded border text-xs leading-tight transition-all duration-300 cursor-pointer ${
                          flavorPreset === pr.name
                            ? 'bg-[#12193E] border-[#C9A84C] text-white'
                            : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <strong className="block text-[#C9A84C] font-serif mb-1">{pr.name}</strong>
                        <span className="text-[10px] text-gray-500 line-clamp-1">{pr.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt input */}
                <div>
                  <h4 className="text-xs uppercase text-[#C9A84C] tracking-widest font-mono mb-2">Dynamic Prompt Guidance</h4>
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-[#C9A84C]/30 focus:border-[#4FC3F7] focus:ring-1 focus:ring-[#4FC3F7] rounded-lg p-3 text-xs md:text-sm text-white placeholder-slate-600 outline-none transition-all duration-300"
                      placeholder="e.g. Damascus geometric floral meshes in Gilded wire embroidery..."
                    />
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 text-[9px] font-mono text-gray-500">
                      <span>Enhance prompt powered by Gemini</span>
                    </div>
                  </div>
                </div>

                {/* Drag Drop Image area */}
                <div>
                  <h4 className="text-xs uppercase text-[#C9A84C] tracking-widest font-mono mb-2">Optional Fabric Structure Upload</h4>
                  <label className="flex flex-col items-center justify-center h-28 bg-[#E8E0D5]/5 border border-dashed border-[#C9A84C]/20 rounded-xl hover:bg-[#E8E0D5]/10 hover:border-[#C9A84C]/45 transition-all duration-300 cursor-pointer">
                    <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                    {uploadedBase64 ? (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#C9A84C]" />
                        <span className="text-xs text-[#E8E0D5] font-semibold">Image Loaded successfully</span>
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center">
                        <Upload size={20} className="text-[#C9A84C] mb-2" />
                        <span className="text-[10px] text-slate-400 tracking-wider">Drag & drop canvas photo or browse folder</span>
                        <span className="text-[9px] text-[#C9A84C] mt-0.5 uppercase tracking-widest">Maqasaq AI Fitting Scan enabled</span>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  onClick={handleGenerateDesign}
                  disabled={isGeneratingPattern || !prompt}
                  className="w-full py-4 mt-2 rounded bg-gradient-to-r from-[#C9A84C] via-[#E8E0D5]/90 to-[#4FC3F7]/50 text-[#0A0F2C] text-sm tracking-[0.15em] uppercase font-bold hover:scale-101 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0A0F2C]/60"
                >
                  {isGeneratingPattern ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Tailor Generation in Progress...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate Bespoke Print Pattern
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="bg-[#0A0F2C]/80 border border-white/5 p-6 rounded-2xl flex flex-col gap-6 font-sans text-left"
              >
                <div>
                  <span className="text-[10px] font-mono text-[#C9A84C] uppercase tracking-wider block">Generated pattern designation</span>
                  <h3 className="font-serif text-2xl text-white mt-1 uppercase tracking-wide">{activeDesign.patternName}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{activeDesign.description}</p>
                </div>

                {/* Cultural Narrative Box */}
                <div className="p-4 rounded bg-[#12183E] border border-[#C9A84C]/20 text-xs">
                  <h4 className="font-serif text-[#C9A84C] mb-1.5 flex items-center gap-1.5 ">🏺 CULTURAL NARRATIVE &bull; سرد ثقافي</h4>
                  <p className="text-gray-300 leading-relaxed italic pr-2 font-serif">{activeDesign.story}</p>
                </div>

                {/* Customize garment colors */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#C9A84C] tracking-wider mb-2">Configured Garment Fabric Tone</h4>
                  <div className="flex gap-2">
                    {['#0A0F2C', '#1B2A6B', '#E8E0D5', '#0F1532', '#070A18'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBaseColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-9 h-9 rounded-full border-2 transition-all duration-350 cursor-pointer ${
                          baseColor === c ? 'border-[#C9A84C] scale-110' : 'border-white/10 hover:border-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Selected Luxury Weave Fabric */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#C9A84C] tracking-wider mb-2">Luxury Weave Selection</h4>
                  <div className="flex flex-col gap-2">
                    {fabricsList.map((fb) => (
                      <div
                        key={fb.name}
                        onClick={() => setSelectedFabric(fb.name)}
                        className={`p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer flex justify-between items-center ${
                          selectedFabric === fb.name
                            ? 'bg-[#1B2A6B]/50 border-[#C9A84C] text-white'
                            : 'bg-[#0A0F2C] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-semibold block">{fb.name}</span>
                          <span className="text-[10px] text-gray-500">{fb.description}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#C9A84C] font-semibold">
                          +${fb.priceOffset}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Printing structure */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#C9A84C] tracking-wider mb-2">Crafting Mechanism</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {printingMethods.map((pr) => (
                      <button
                        key={pr.name}
                        onClick={() => setSelectedPrinting(pr.name)}
                        className={`text-left p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                          selectedPrinting === pr.name
                            ? 'bg-[#1B2A6B]/50 border-[#C9A84C] text-white'
                            : 'bg-[#0A0F2C] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{pr.name}</span>
                        <span className="text-[9px] text-[#C9A84C] mt-1 font-mono">+${pr.priceOffset}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="flex-1 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white uppercase tracking-wider font-semibold rounded transition"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs uppercase tracking-wider font-bold rounded hover:scale-102 transition shadow-lg shadow-black/35 cursor-pointer"
                  >
                    Enter Fitting Room
                  </button>
                </div>
              </motion.div>
            )}

            {activeStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="bg-[#0A0F2C]/80 border border-white/5 p-6 rounded-2xl flex flex-col gap-6 text-left"
              >
                <div>
                  <div className="flex gap-1 items-center">
                    <Ruler size={16} className="text-[#C9A84C]" />
                    <span className="text-[10px] font-mono text-[#4FC3F7] uppercase tracking-wider block">Maqasaq Fit Advisor &bull; مقاسك</span>
                  </div>
                  <h3 className="font-serif text-2xl text-white mt-1">THE PERFECT ANTHROPOMETRIC DRAPE</h3>
                  <p className="text-xs text-slate-400 mt-1">Maqasaq estimates custom fabric stretch and coordinates shoulders instantly using standard physics metrics.</p>
                </div>

                {/* Sizing inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 block mb-1">Your Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 block mb-1">Your Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 block mb-1">Gender Silhouette</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#0A0F2C] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="Women">Women Lines</option>
                      <option value="Men">Men Lines</option>
                      <option value="Unisex">Unisex Silhouette</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 block mb-1">Fit Preference</label>
                    <select
                      value={posture}
                      onChange={(e) => setPosture(e.target.value)}
                      className="w-full bg-[#0A0F2C] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="Oversized Slouch">Oversized / Slouch Drape</option>
                      <option value="Regular Tailored">Regular Tailored Fit</option>
                      <option value="Slim Custom">Slim Silhouette Fit</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculateSize}
                  className="py-3 bg-[#1B2A6B] text-white hover:bg-[#4FC3F7] hover:text-[#0A0F2C] text-xs font-mono uppercase tracking-widest rounded transition-all duration-350 cursor-pointer"
                >
                  {isCalculatingSize ? "Measuring skeletal metrics..." : "Calculate Perfect Maqasaq Fit"}
                </button>

                {/* Size outcome block */}
                {sizeRecommendation && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-mono text-[#C9A84C] block uppercase">Recommended Sizing</span>
                        <span className="text-3xl font-serif text-white font-bold">{sizeRecommendation.size}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-[#4FC3F7] block uppercase">Advisor Confidence</span>
                        <span className="text-xl font-mono text-[#4FC3F7] font-semibold">{sizeRecommendation.confidence}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono bg-black/30 p-2.5 rounded border border-white/5 text-gray-400">
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px]">Chest Circum</span>
                        <strong className="text-white">{sizeRecommendation.measurements.chest} cm</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px]">Shoulder span</span>
                        <strong className="text-white">{sizeRecommendation.measurements.shoulder} cm</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px]">Garment len</span>
                        <strong className="text-white">{sizeRecommendation.measurements.length} cm</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px]">Waist contour</span>
                        <strong className="text-white">{sizeRecommendation.measurements.waist} cm</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#E8E0D5]/80 leading-relaxed font-sans">{sizeRecommendation.comment}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-xs text-white uppercase tracking-wider font-semibold rounded"
                  >
                    Garment Styling
                  </button>
                  <button
                    onClick={dispatchToCoutureAtelier}
                    className="flex-1 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-xs uppercase tracking-wider font-bold rounded hover:scale-102 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[#C9A84C]/10"
                  >
                    <ShoppingBag size={12} /> Bag Bespoke Piece
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Hand: 3D-Style Simulated Clothing Preview Mockup */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center h-full min-h-[500px]">
          <div className="w-full h-full p-8 rounded-2xl bg-gradient-to-b from-[#090D2B] via-[#0E153E] to-[#05081E] border border-white/5 flex flex-col items-center justify-between text-center relative shadow-2xl">
            
            {/* Perspective options */}
            <div className="absolute top-4 left-4 flex gap-2">
              <button
                onClick={() => setMockupAngle('front')}
                className={`px-3 py-1 rounded text-[10px] uppercase font-mono tracking-widest cursor-pointer ${
                  mockupAngle === 'front' ? 'bg-[#C9A84C] text-[#0A0F2C]' : 'bg-white/5 text-gray-400'
                }`}
              >
                Front View
              </button>
              <button
                onClick={() => setMockupAngle('back')}
                className={`px-3 py-1 rounded text-[10px] uppercase font-mono tracking-widest cursor-pointer ${
                  mockupAngle === 'back' ? 'bg-[#C9A84C] text-[#0A0F2C]' : 'bg-white/5 text-gray-400'
                }`}
              >
                Back View
              </button>
            </div>

            <div className="absolute top-4 right-4 bg-white/5 text-[9px] text-[#C9A84C] px-2 py-1 rounded border border-white/5 font-mono tracking-wider">
              {clothingType.toUpperCase()} MOCKUP
            </div>

            {/* Simulated 3D Garment Canvas */}
            <div className="w-full flex-1 flex items-center justify-center py-12 relative min-h-[380px]">
              
              {/* Garment silhouette layer */}
              <div 
                style={{ backgroundColor: baseColor }}
                className="w-72 h-[340px] relative transition-all duration-500 rounded-3xl overflow-hidden flex flex-col items-center justify-center border border-white/10 shadow-inner"
              >
                {/* Front Abaya specifics */}
                {clothingType === 'Abaya' && (
                  <div className="absolute inset-0 flex flex-col items-center">
                    {/* Drape lines */}
                    <div className="absolute left-1/3 top-0 w-[1px] h-full bg-white/5" />
                    <div className="absolute right-1/3 top-0 w-[1px] h-full bg-white/5" />
                    {/* Lapel border lines in gold */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-8 h-full border-x border-[#C9A84C]/30 bg-[#0C1130]/35 flex flex-col items-center py-4 text-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] my-6" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] my-6" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] my-6" />
                    </div>
                  </div>
                )}

                {/* Front Hoodie / Sweatshirt specifics */}
                {clothingType === 'Hoodie' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none p-4">
                    {/* Hood drawstring and pocket outline */}
                    <div className="w-24 h-16 border-b border-x border-[#C9A84C]/25 rounded-b-xl -mt-2 bg-[#0A0F2C]/30" />
                    <div className="w-48 h-20 border-t border-x border-white/10 rounded-t-2xl bg-black/10 flex items-center justify-center" />
                  </div>
                )}

                {/* Jacket specific styling */}
                {clothingType === 'Jacket' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-4 pointer-events-none">
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-black/40" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-[30%] w-44 h-[1px] bg-white/10" />
                  </div>
                )}

                {/* Interactive Projecting dynamic vector map */}
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-screen overflow-hidden flex items-center justify-center pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: activeDesign.svgPattern }}
                />

                {/* Full-width calligraphic branding ribbon at footer hem */}
                <div className="absolute bottom-2 inset-x-0 mx-4 py-1 border-t border-b border-[#C9A84C]/30 bg-black/40 text-center select-none">
                  <span className="text-[7px] text-[#F0D080]/90 uppercase tracking-[0.35em] font-mono">
                    SADAF ATELIER BESPOKE HAUTE SELECTIONS
                  </span>
                </div>
              </div>

            </div>

            {/* Mockup parameters */}
            <div className="w-full flex justify-between items-center text-[10px] font-mono text-gray-400 border-t border-white/5 pt-4">
              <div>
                <span className="block text-slate-500 uppercase text-[8px] text-left">Selected Weave</span>
                <span className="text-[#E8E0D5] font-semibold">{selectedFabric}</span>
              </div>
              <div>
                <span className="block text-slate-500 uppercase text-[8px] text-right">Selected Printing</span>
                <span className="text-[#C9A84C] font-semibold">{selectedPrinting}</span>
              </div>
            </div>

          </div>
        </div>

      </section>
    </div>
  );
}
