import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  UserCheck, 
  Trash2, 
  Plus, 
  Edit3, 
  Search, 
  Briefcase, 
  ChevronRight, 
  TrendingUp, 
  Boxes, 
  Settings, 
  Layers, 
  BadgeCheck, 
  PlusCircle, 
  Layers2, 
  Users 
} from 'lucide-react';
import { UserProfile } from '../lib/supabase';
import { FashionProduct, ArtPiece } from '../types';
import { fashionDatabase, artDatabase } from '../data';

interface AdminDashboardViewProps {
  user: UserProfile;
  products: FashionProduct[];
  onAddProduct: (prod: FashionProduct) => void;
  onDeleteProduct: (prodId: string) => void;
  onLogout: () => void;
}

interface SimulatedOrder {
  id: string;
  customerName: string;
  email: string;
  date: string;
  total: number;
  status: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';
  itemNames: string;
}

export default function AdminDashboardView({
  user,
  products,
  onAddProduct,
  onDeleteProduct,
  onLogout
}: AdminDashboardViewProps) {
  const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'customers'>('products');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Local state for orders to let admins modify order states on the fly
  const [allOrders, setAllOrders] = useState<SimulatedOrder[]>([
    {
      id: 'SDF-2026-9041',
      customerName: 'Layla Al-Khouri',
      email: 'customer@sadaf.luxury',
      date: '2026-06-01',
      total: 1250,
      status: 'Tailoring',
      itemNames: 'Al-Muizz El-Faraeda Abaya (1)'
    },
    {
      id: 'SDF-2026-8802',
      customerName: 'Karim Mansour',
      email: 'karim@mansour.eg',
      date: '2026-05-30',
      total: 580,
      status: 'Pending',
      itemNames: 'Diwani Calligraphy Streetwear Coach Jacket (1)'
    },
    {
      id: 'SDF-2026-4412',
      customerName: 'Layla Al-Khouri',
      email: 'customer@sadaf.luxury',
      date: '2026-05-15',
      total: 3400,
      status: 'Delivered',
      itemNames: 'The Golden Diwani Diptych Fine Art (1)'
    }
  ]);

  // Local customer simulation roster
  const [customers, setCustomers] = useState([
    { id: 'cst-1', name: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', level: 'Gold Lineage VVIP', joinDate: '2026-01-14' },
    { id: 'cst-2', name: 'Karim Mansour', email: 'karim@mansour.eg', level: 'Silver Collector member', joinDate: '2026-02-19' },
    { id: 'cst-3', name: 'Sherif El-Bialy', email: 'sherif@bialy-group.com', level: 'Elite Art Patron', joinDate: '2026-03-02' },
    { id: 'cst-4', name: 'Nour El-Sherif', email: 'nour_sherif@outlook.com', level: 'Silver Collector member', joinDate: '2026-04-22' }
  ]);

  // Add Product form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Women' | 'Men' | 'Kids' | 'Traditional Fusion' | 'Limited Edition'>('Limited Edition');
  const [newPrice, setNewPrice] = useState('650');
  const [newFabric, setNewFabric] = useState('Metallic Egyptian Brocade');
  const [newDescription, setNewDescription] = useState('Exclusive modern cut adorned with gold jacquard detailing');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80');
  const [formSuccess, setFormSuccess] = useState(false);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    const added: FashionProduct = {
      id: `prod-${Date.now()}`,
      name: newName,
      category: newCategory,
      price: Number(newPrice),
      image: newImage,
      hoverImage: newImage,
      description: newDescription,
      fabric: newFabric,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [{ name: 'Cairo Gold lustre', hex: '#C9A84C' }, { name: 'Sadaf Pearl', hex: '#E8E0D5' }],
      details: ['Handmade gold thread accents', '100% fine weave premium canvas', 'Made locally in historic Giza atelier rooms'],
      rating: 4.9
    };

    onAddProduct(added);
    setFormSuccess(true);
    setNewName('');
    setTimeout(() => setFormSuccess(false), 3000);
  };

  const updateOrderStatus = (orderId: string, nextStatus: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered') => {
    setAllOrders(allOrders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10 text-left font-sans text-[#E8E0D5]">
      
      {/* Page Title */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#C9A84C]/15 pb-8">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#4FC3F7] font-bold flex items-center gap-1.5 mb-1.5">
            <Settings className="animate-spin text-[#4FC3F7]" size={12} />
            ATELIER CONTROL PORTAL &bull; لوحة الإشراف والتعديل
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-white tracking-tight uppercase">
            Atelier Controller: {user.fullName || 'Administrator'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Update e-boutique catalog collections, verify secure customer tailoring drapes, and manage registered Cairo credentials.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-black/40 hover:bg-white text-xs font-mono uppercase tracking-widest font-bold text-gray-300 hover:text-[#0A0F2C] border border-white/10 transition rounded-xl cursor-pointer"
        >
          Logout Portal
        </button>
      </div>

      {/* Admin quick metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-tr from-[#1B2A6B]/20 to-[#0A0F2C]/80 border border-white/5 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1">TOTAL PRODUCTS LISTED</span>
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold font-mono text-[#C9A84C]">{products.length} Items</h3>
            <Boxes size={22} className="text-[#C9A84C]/35" />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-tr from-[#1B2A6B]/20 to-[#0A0F2C]/80 border border-white/5 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1">LOGISTICS STITCH PIPELINE</span>
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold font-mono text-[#4FC3F7]">
              {allOrders.filter(o => o.status !== 'Delivered').length} Active
            </h3>
            <ShoppingBag size={22} className="text-[#4FC3F7]/35" />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-tr from-[#1B2A6B]/20 to-[#0A0F2C]/80 border border-white/5 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1">REGISTERED SOULS</span>
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold font-mono text-white">{customers.length} Members</h3>
            <Users size={22} className="text-white/20" />
          </div>
        </div>
      </div>

      {/* Primary tab matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Navigation Rail */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {[
            { id: 'products', label: 'E-Boutique Store Catalog', info: 'Manage fine clothing' },
            { id: 'orders', label: 'Stitch Logistics Orders', info: 'Modify tailoring steps' },
            { id: 'customers', label: 'Registered Curator Roster', info: 'Review customer profiles' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id as any)}
              className={`p-4 rounded-xl border text-left flex flex-col transition duration-300 cursor-pointer ${
                adminTab === item.id
                  ? 'bg-gradient-to-b from-[#111A45] to-[#0A0F2C] border-[#C9A84C] text-[#C9A84C]'
                  : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider">{item.label}</h4>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">{item.info}</span>
            </button>
          ))}
        </div>

        {/* Content switching pane */}
        <div className="lg:col-span-9 bg-[#05081A]/90 border border-white/5 rounded-3xl p-6 md:p-8">
          
          <AnimatePresence mode="wait">
            
            {adminTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {/* Divide into listing and creation */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  
                  {/* Left Side: Create / Add product */}
                  <div className="xl:col-span-5 bg-black/45 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div>
                      <h3 className="font-serif text-[#C9A84C] text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                        <PlusCircle size={14} /> Add Luxury Product SKU
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 mb-2">
                        Register a new seasonal item into Giza atelier database.
                      </p>
                    </div>

                    {formSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1 }}
                        className="p-2.5 bg-green-950/40 border border-green-500/30 text-green-200 text-[10px] rounded-lg text-center font-mono uppercase"
                      >
                        ✔ Product successfully registered!
                      </motion.div>
                    )}

                    <form onSubmit={handleCreateProduct} className="space-y-3 text-left text-xs">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Design Catalog Name</label>
                        <input 
                          type="text" 
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#C9A84C]"
                          placeholder="Al-Saadi Pearl Blouson"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Couture Price (USD)</label>
                          <input 
                            type="number" 
                            required
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#C9A84C]"
                            placeholder="650"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Category</label>
                          <select 
                            value={newCategory}
                            onChange={(e: any) => setNewCategory(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#C9A84C] cursor-pointer"
                          >
                            <option value="Women">Women</option>
                            <option value="Men">Men</option>
                            <option value="Kids">Kids</option>
                            <option value="Traditional Fusion">Traditional Fusion</option>
                            <option value="Limited Edition">Limited Edition</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Textile Fibers Fabric</label>
                        <input 
                          type="text" 
                          required
                          value={newFabric}
                          onChange={(e) => setNewFabric(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#C9A84C]"
                          placeholder="Metallic Brocade Wool"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Image URL coordinate</label>
                        <input 
                          type="text" 
                          required
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#C9A84C]"
                          placeholder="Unsplash image link"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">Detailed Description Study</label>
                        <textarea 
                          rows={2}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#C9A84C] resize-none"
                          placeholder="Describe item drapes..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#C9A84C] text-[#0A0F2C] hover:bg-white text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition mt-2 cursor-pointer"
                      >
                        Publish Couture Item
                      </button>
                    </form>
                  </div>

                  {/* Right Side: Search / manage listed products */}
                  <div className="xl:col-span-7 flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-center gap-4">
                      <h3 className="font-serif text-white text-sm font-semibold uppercase tracking-wider">
                        Active Catalog Records ({products.length})
                      </h3>
                      <div className="relative w-44">
                        <span className="absolute left-2.5 top-2.5 text-slate-500">
                          <Search size={12} />
                        </span>
                        <input 
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search items..."
                          className="w-full pl-7 pr-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 border border-white/5 p-3 rounded-2xl bg-black/20">
                      {filteredProducts.map((p) => (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between p-3 bg-[#0A0F2C]/60 hover:bg-[#05081A] border border-white/5 rounded-xl transition"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-12 h-12 object-cover rounded-lg border border-white/10"
                            />
                            <div>
                              <h4 className="text-xs font-serif text-white font-semibold uppercase leading-tight">{p.name}</h4>
                              <p className="text-[9px] text-[#C9A84C] font-mono mt-0.5">${p.price.toLocaleString()} &bull; <span className="text-slate-500 font-sans">{p.fabric}</span></p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onDeleteProduct(p.id);
                              alert(`Product catalog SKU "${p.name}" has been disabled and purged from layout.`);
                            }}
                            className="p-2 bg-red-950/20 text-red-400 hover:text-white border border-red-500/20 hover:bg-red-900 rounded-lg transition cursor-pointer"
                            title="Purge product SKU"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {adminTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                      Stitch Logistics Orders
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Manually transition ongoing Giza atelier embroidery and sewing stages.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {allOrders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="p-5 bg-black/35 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-[#C9A84C]">{ord.id}</span>
                          <span className="text-xs text-slate-500 font-mono">&bull; {ord.date}</span>
                        </div>
                        <h4 className="text-xs font-serif font-bold uppercase text-white">
                          Customer: {ord.customerName} <span className="text-[10px] text-slate-500 font-mono italic">({ord.email})</span>
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400">
                          Items: <strong className="text-slate-300 font-sans">{ord.itemNames}</strong>
                        </p>
                      </div>

                      {/* Dropdown status update controller */}
                      <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">Active Stage:</span>
                        <select
                          value={ord.status}
                          onChange={(e: any) => updateOrderStatus(ord.id, e.target.value)}
                          className="px-3 py-1.5 bg-[#05081A] border border-[#C9A84C]/30 text-[10px] text-[#C9A84C] font-mono font-bold rounded-lg cursor-pointer outline-none focus:border-[#4FC3F7]"
                        >
                          <option value="Pending">Pending (Payment Recd)</option>
                          <option value="Tailoring">Tailoring (Embroidery Stitch)</option>
                          <option value="Shipped">Shipped (Carriage Sent)</option>
                          <option value="Delivered">Delivered (Completed)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {adminTab === 'customers' && (
              <motion.div
                key="customers"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-serif text-[#C9A84C] text-lg font-semibold uppercase tracking-wider">
                      Registered Curator Roster
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Explore elite boutique accounts and VIP memberships.
                    </p>
                  </div>

                  <div className="relative w-48">
                    <span className="absolute left-2.5 top-2.5 text-slate-500">
                      <Search size={12} />
                    </span>
                    <input 
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search members..."
                      className="w-full pl-7 pr-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCustomers.map((cust) => (
                    <div 
                      key={cust.id}
                      className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-serif font-semibold text-white uppercase tracking-wider">{cust.name}</h4>
                          <span className="px-2 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C] text-[8px] font-mono rounded border border-[#C9A84C]/20 font-extrabold uppercase">
                            VIP
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500">{cust.email}</p>
                        <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest">{cust.level}</span>
                      </div>
                      
                      <div className="text-right text-[9px] font-mono text-slate-500 uppercase">
                        <div>Joined Club</div>
                        <div className="text-white font-bold mt-0.5">{cust.joinDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
