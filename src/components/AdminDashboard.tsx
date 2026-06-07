import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, Settings, Plus, LayoutGrid, Cpu, TrendingUp, AlertTriangle, Coins, Image, Shirt } from 'lucide-react';
import { FashionProduct, ArtPiece, Collection } from '../types';

interface AdminDashboardProps {
  products: FashionProduct[];
  artworks: ArtPiece[];
  collections: Collection[];
  onAddProduct: (prod: FashionProduct) => void;
  onAddArtPiece: (art: ArtPiece) => void;
}

export default function AdminDashboard({
  products,
  artworks,
  collections,
  onAddProduct,
  onAddArtPiece
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'Analytics' | 'Products' | 'Arts' | 'AI Logs' | 'Settings'>('Analytics');

  // New item form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'Women' | 'Men' | 'Kids' | 'Traditional Fusion' | 'Limited Edition'>('Traditional Fusion');
  const [newProdDesc, setNewProdDesc] = useState('');

  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtPrice, setNewArtPrice] = useState('');
  const [newArtCategory, setNewArtCategory] = useState<'Handmade' | 'Oil Paintings' | 'Calligraphy' | 'Digital Art' | 'Fashion Sketches'>('Calligraphy');
  const [newArtDesc, setNewArtDesc] = useState('');

  // AI Moderation prompt list mockup
  const moderationRules = [
    { word: "inappropriate", action: "Auto-Block", timesFlagged: 0 },
    { word: "commercial-recopy", action: "Flag Review", timesFlagged: 4 },
    { word: "low-integrity", action: "Auto-Block", timesFlagged: 2 }
  ];

  // AI Generation logs telemetry mock
  const aiGenerationLogs = [
    { id: "log-1", prompt: "Byzantine gold lattices overlaid on velvet abaya hems", stamp: "Just Now", status: "Success (Gemini 3.5)" },
    { id: "log-2", prompt: "Alexandria seafront shell mother-of-pearl geometric patterns", stamp: "5 mins ago", status: "Success (Gemini 3.5)" },
    { id: "log-3", prompt: "Thuluth calligraphic scripts spelling 'Ahlan Wa Sahlan' in thin gold lines", stamp: "24 mins ago", status: "Success (Gemini 3.5)" },
    { id: "log-4", prompt: "Royal Egyptian Blue linen overlays with desert sandstone hems", stamp: "1 hr ago", status: "Success (Gemini 3.5)" }
  ];

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    const added: FashionProduct = {
      id: `f-${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      price: Number(newProdPrice),
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=82",
      hoverImage: "",
      description: newProdDesc || "Crafted organically in old Cairo ateliers.",
      fabric: "Premium Raw Silk",
      sizes: ["S", "M", "L", "XL"],
      colors: [{ name: 'Sadaf Gold', hex: '#C9A84C' }],
      details: ["100% bespoke stitch", "Gold compounded threads"],
      rating: 4.9
    };

    onAddProduct(added);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    alert("New Haute Product successfully deployed to the public boutique store.");
  };

  const handleCreateArtPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle || !newArtPrice) return;

    const added: ArtPiece = {
      id: `art-${Date.now()}`,
      title: newArtTitle,
      category: newArtCategory,
      price: Number(newArtPrice),
      image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=82",
      description: newArtDesc || "Finely detailed original heritage piece.",
      dimensions: "90 x 90 cm",
      year: "2026",
      artist: "Sadaf Master Curator",
      medium: "Liquid gold inks and cotton canvas"
    };

    onAddArtPiece(added);
    setNewArtTitle('');
    setNewArtPrice('');
    setNewArtDesc('');
    alert("New Curated Fine Artwork successfully listed in the digital museum archives.");
  };

  return (
    <div className="relative w-full overflow-hidden min-h-screen pb-20">
      
      {/* Dashboard Sub Header */}
      <section className="relative py-12 px-4 md:px-8 border-b border-[#C9A84C]/10 bg-[#0A0F2C] text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.35em] uppercase block mb-1">ENTERPRISE SYSTEM EXECUTIVE</span>
            <h1 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-tight">ADMIN CENTRAL</h1>
          </div>

          {/* Tab switches */}
          <div className="flex gap-2 bg-[#090D2A] p-1 border border-white/5 rounded-lg font-mono">
            {['Analytics', 'Products', 'Arts', 'AI Logs'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-semibold tracking-wider transition cursor-pointer ${
                  activeTab === t ? 'bg-[#C9A84C] text-[#0A0F2C]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto text-left">
        
        {/* Analytics screen */}
        {activeTab === 'Analytics' && (
          <div className="space-y-8 font-sans">
            {/* KPI grid row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Bespoke Sales Vol", value: "$48,930", growth: "+18.2%", icon: <TrendingUp className="text-green-400" size={18} /> },
                { label: "AI Generations", value: "1,294 runs", growth: "+24.8%", icon: <Cpu className="text-[#4FC3F7]" size={18} /> },
                { label: "Museum Registries", value: "32 pieces", growth: "Stable", icon: <LayoutGrid className="text-[#C9A84C]" size={18} /> },
                { label: "VIP Active Collectors", value: "481 profiles", growth: "+9.4%", icon: <Users className="text-pink-400" size={18} /> }
              ].map((kpi, i) => (
                <div key={i} className="p-5 rounded-xl bg-[#0F1435] border border-white/5 shadow flex justify-between items-center bg-gradient-to-br from-[#0F1435] to-[#12183E]">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider block">{kpi.label}</span>
                    <span className="text-2xl font-serif text-white font-bold block mt-1.5">{kpi.value}</span>
                    <span className="text-[10px] text-green-400 font-mono mt-0.5 inline-block">{kpi.growth} vs prev month</span>
                  </div>
                  <div className="p-3 rounded-full bg-white/5 border border-white/10 shrink-0">
                    {kpi.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart mock 1 */}
              <div className="p-6 rounded-xl bg-[#090D2A] border border-white/5 text-left flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-white text-base font-semibold mb-1">HAUTE REVENUE DYNAMICS (WEEKLY OUTCOME)</h4>
                  <span className="text-[10px] text-gray-500 font-mono uppercase">Sales tracking by Atelier manufacture lines</span>
                </div>
                
                {/* Visual bar chart using pure HTML tailwind */}
                <div className="h-44 flex items-end justify-between gap-3 pt-8 pb-2">
                  {[45, 68, 80, 52, 95, 76, 110].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-[#1B2A6B] hover:bg-[#C9A84C] transition duration-300 rounded-t" style={{ height: `${val * 1.2}px` }} />
                      <span className="text-[8px] font-mono uppercase text-gray-500">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation Rules overview */}
              <div className="p-6 rounded-xl bg-[#090D2A] border border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-white text-base font-semibold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="text-yellow-500" size={16} /> AI PROMPT AUDIT MODERATION RULES
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono uppercase">Monitored rules in custom design text prompt</span>
                </div>

                <div className="divide-y divide-white/5 mt-6">
                  {moderationRules.map((rule) => (
                    <div key={rule.word} className="py-3 flex justify-between h-14 items-center text-xs">
                      <div>
                        <code className="text-[#C9A84C] font-mono tracking-wider font-semibold">&bull; {rule.word}</code>
                        <span className="text-[9px] text-gray-500 font-mono uppercase block mt-0.5">Flagged keyword</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">{rule.timesFlagged} occurrences</span>
                        <span className="bg-red-950 text-red-400 font-semibold px-2 py-0.5 rounded text-[9px] border border-red-900">{rule.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Credits allocations */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1B2A6B]/40 to-[#0A0F2C] border border-[#C9A84C]/25 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#C9A84C]/10 rounded-full text-[#C9A84C]">
                  <Coins size={22} />
                </div>
                <div>
                  <h4 className="font-serif text-white font-semibold">GLOBAL ATELIER AI CREDIT MATRIX</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-lg mt-0.5">We allocate 100 free Creative Generation Credits monthly to client profiles. Pro accounts receive infinite rendering priority.</p>
                </div>
              </div>
              <button 
                onClick={() => alert("AI credit matrices updated. Infinite credits configured across all profiles for preview purposes.")}
                className="px-4 py-2 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-mono uppercase tracking-wider font-semibold rounded cursor-pointer transition"
              >
                Sync Credits
              </button>
            </div>
          </div>
        )}

        {/* Product Management form */}
        {activeTab === 'Products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
            <div className="lg:col-span-4 bg-[#090D2A] border border-white/5 rounded-xl p-6">
              <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                <Shirt size={16} className="text-[#C9A84C]" /> Create Public Product
              </h3>
              
              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Diwani Linen Vest"
                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Price ($USD)</label>
                    <input
                      type="number"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="e.g. 850"
                      className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e: any) => setNewProdCategory(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white outline-none"
                    >
                      <option value="Traditional Fusion">Traditional Fusion</option>
                      <option value="Women">Women</option>
                      <option value="Men">Men</option>
                      <option value="Kids">Kids</option>
                      <option value="Limited Edition">Limited Edition</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Description</label>
                  <textarea
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe material weight, thread density, origin..."
                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-mono tracking-widest font-bold uppercase rounded cursor-pointer transition"
                >
                  Deploy Haute Item
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-[#090D2A] border border-white/5 rounded-xl p-6">
              <h3 className="font-serif text-lg text-white mb-4">DEPLOYED APPAREL REGISTRY ({products.length} Items)</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left divide-y divide-white/5 text-gray-400">
                  <thead className="text-[10px] uppercase text-gray-500 font-mono">
                    <tr>
                      <th className="py-2.5">Silhouette</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((prod) => (
                      <tr key={prod.id} className="h-12 hover:text-white transition">
                        <td className="py-2 leading-tight">
                          <span className="font-semibold block text-[#E8E0D5]">{prod.name}</span>
                          <span className="text-[10px] text-gray-600 block">{prod.fabric}</span>
                        </td>
                        <td>{prod.category}</td>
                        <td className="font-mono text-[#C9A84C]">${prod.price}</td>
                        <td>{prod.rating} &bull; Active</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Fine Arts curation list */}
        {activeTab === 'Arts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
            <div className="lg:col-span-4 bg-[#090D2A] border border-white/5 rounded-xl p-6">
              <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                <Image className="text-[#C9A84C]" size={16} /> Curate Fine Art Piece
              </h3>

              <form onSubmit={handleCreateArtPiece} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Artwork Title</label>
                  <input
                    type="text"
                    required
                    value={newArtTitle}
                    onChange={(e) => setNewArtTitle(e.target.value)}
                    placeholder="e.g. Siwa Gilded Sunset study"
                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Price ($USD)</label>
                    <input
                      type="number"
                      required
                      value={newArtPrice}
                      onChange={(e) => setNewArtPrice(e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Category</label>
                    <select
                      value={newArtCategory}
                      onChange={(e: any) => setNewArtCategory(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white outline-none"
                    >
                      <option value="Calligraphy">Calligraphy</option>
                      <option value="Handmade">Handmade</option>
                      <option value="Oil Paintings">Oil Paintings</option>
                      <option value="Digital Art">Digital Art</option>
                      <option value="Fashion Sketches">Fashion Sketches</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Description</label>
                  <textarea
                    value={newArtDesc}
                    onChange={(e) => setNewArtDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe pigments, gilding, brush, materials..."
                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#C9A84C] hover:bg-white text-[#0A0F2C] text-xs font-mono tracking-widest font-bold uppercase rounded cursor-pointer transition"
                >
                  Deploy Curated Art
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-[#090D2A] border border-white/5 rounded-xl p-6">
              <h3 className="font-serif text-lg text-white mb-4 font-bold">MUSEUM ARCHIVES REGISTRY ({artworks.length} Items)</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left divide-y divide-white/5 text-gray-400">
                  <thead className="text-[10px] uppercase text-gray-500 font-mono">
                    <tr>
                      <th className="py-2.5">Title</th>
                      <th>Category</th>
                      <th>Artist</th>
                      <th>Curational Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {artworks.map((art) => (
                      <tr key={art.id} className="h-12 hover:text-white transition">
                        <td className="py-2 leading-tight">
                          <span className="font-semibold block text-[#E8E0D5]">{art.title}</span>
                          <span className="text-[10px] text-gray-600 block">{art.medium}</span>
                        </td>
                        <td>{art.category}</td>
                        <td>{art.artist}</td>
                        <td className="font-mono text-[#C9A84C]">${art.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AI Logs screen */}
        {activeTab === 'AI Logs' && (
          <div className="space-y-6 font-sans">
            <h3 className="font-serif text-xl text-white mb-2 flex items-center gap-1.5"><Cpu className="text-[#C9A84C]" size={20} /> REAL-TIME AI STUDIO TELEMETRY MONITORING</h3>
            <div className="divide-y divide-white/5 bg-[#090D2A] rounded-xl border border-white/5 p-6 space-y-4">
              {aiGenerationLogs.map((log) => (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex justify-between gap-6 items-center text-xs">
                  <div>
                    <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block mb-1">{log.stamp} &bull; Prompt telemetry</span>
                    <blockquote className="text-white font-mono italic">"{log.prompt}"</blockquote>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-green-400 bg-green-950 px-2 py-0.5 border border-green-900 rounded font-mono text-[9px] font-semibold tracking-wider">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
