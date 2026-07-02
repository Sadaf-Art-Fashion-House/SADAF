// import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, ShieldCheck, Mail, ShieldAlert, Sparkles, AlertCircle, Compass, Home, BookOpen, User, Grid, Cpu, ArrowUpRight } from 'lucide-react';
import { ArtPiece, FashionProduct, CartItem, Collection, AIClothingDesign } from './types';
import { artDatabase, fashionDatabase, collections, lookbookItems } from './data';

// Feature-based view entrypoints
import SadafLogo from './components/SadafLogo';
import HomeView from './features/home/components/HomeView';
import ArtsView from './features/arts/components/ArtsView';
import FashionView from './features/fashion/components/FashionView';
import AIStudioView from './features/ai/components/AIStudioView';
import StoreView from './features/marketplace/components/StoreView';
import GalleryView from './components/GalleryView';
import AdminDashboard from './components/AdminDashboard';

// Supabase client and auth functions
// Supabase client and auth functions
import { supabase, isSupabaseConfigured, getFashionProducts, getArtworks, UserProfile, mockAuth } from './lib/supabase';
import LoginView from './components/LoginView';
import SignUpView from './components/SignUpView';
import UserDashboardView from './components/UserDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import FounderDashboardView from './components/FounderDashboardView';
import { APP_TABS } from './shared/constants';
import { useAppNavigation } from './shared/hooks/useAppNavigation';
import { AppProviders } from './shared/providers/AppProviders';
import { AppLayout } from './shared/layouts/AppLayout';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('Home');
  const { isActive } = useAppNavigation(currentTab);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<FashionProduct[]>([]);
  const [products, setProducts] = useState<FashionProduct[]>(fashionDatabase);
  const [artworks, setArtworks] = useState<ArtPiece[]>(artDatabase);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(mockAuth.getCurrentUser());
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');



  useEffect(() => {
    getFashionProducts().then(data => {
      if (data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          ...p,
          image: p.image_url,
          hoverImage: p.hover_image,
        }))
        setProducts(mapped as FashionProduct[])
      } else setProducts(fashionDatabase)
    })
    getArtworks().then(data => {
      if (data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          ...p,
          image: p.image_url,
          title: p.name,
        }))
        setArtworks(mapped as ArtPiece[])
      } else setArtworks(artDatabase)
    })
  }, [])


  // Newsletter Subscription state
  const [subscriberEmail, setSubscriberEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Global Cart Manipulation
  const handleAddToCart = (product: FashionProduct, size: string, color: string) => {
    const existingIndex = cart.findIndex(
      item => item.product?.id === product.id && item.selectedSize === size && item.selectedColor === color
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice += product.price;
      setCart(updated);
    } else {
      const added: CartItem = {
        id: `cart-${Date.now()}`,
        product,
        quantity: 1,
        selectedSize: size,
        selectedColor: color,
        totalPrice: product.price
      };
      setCart([...cart, added]);
    }
  };

  const handleAddArtToCart = (art: ArtPiece) => {
    // Collect fine arts piece directly
    const existingIndex = cart.findIndex(item => item.artPiece?.id === art.id);
    if (existingIndex > -1) {
      alert("This exclusive fine artworks piece is already in your curation bag.");
      return;
    }
    const added: CartItem = {
      id: `cart-${Date.now()}`,
      artPiece: art,
      quantity: 1,
      selectedSize: 'Original Framing',
      totalPrice: art.price
    };
    setCart([...cart, added]);
    alert(`"${art.title}" added to your curation bag. Delivery coordinates will verify upon checkout.`);
  };

  const handleAddCustomToCart = (customDesign: AIClothingDesign, size: string) => {
    const defaultCustomPrice = 680; // Standard base custom design price offset
    const added: CartItem = {
      id: `cart-${Date.now()}`,
      aiCustomDesign: customDesign,
      quantity: 1,
      selectedSize: size,
      selectedColor: 'Custom Layer Gradient',
      selectedFabric: customDesign.fabrics[0],
      selectedPrinting: customDesign.printingOption,
      totalPrice: defaultCustomPrice
    };
    setCart([...cart, added]);
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  const handleToggleWishlist = (product: FashionProduct) => {
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim()) return;
    setNewsletterSubscribed(true);
    setSubscriberEmail('');
  };

  const handleSecureCheckout = (totalSum: number, couponCode: string) => {
    alert(`Secure checkout completed for sum of $${totalSum.toLocaleString()}. Thank you for supporting authentic Arabic craftsmanship.`);
    setCart([]);
  };

  return (
    <AppProviders>
      <AppLayout>

        {/* Absolute Header Overlay */}
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-[#C9A84C]/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">

            {/* Sadaf logotype */}
            <div className="cursor-pointer" onClick={() => setCurrentTab('Home')}>
              <SadafLogo size={38} withMarbleBackground={false} />
            </div>

            {/* Navigation Bar tabs */}
            <nav className="hidden lg:flex items-center gap-7">
              {APP_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 relative py-1 cursor-pointer ${isActive(tab.id)
                    ? 'text-[#C9A84C] font-semibold'
                    : 'text-[#E8E0D5]/70 hover:text-white'
                    }`}
                >
                  {tab.label}
                  {isActive(tab.id) && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#C9A84C]"
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Utility Quick Navs (Cart sum / Wishlist) */}
            <div className="flex items-center gap-4">
              {/* Wishlist quick link */}
              <button
                onClick={() => setCurrentTab('Store')}
                className="p-2 text-slate-300 hover:text-red-400 relative transition-colors duration-300 cursor-pointer"
                title="View Wishlist"
              >
                <Heart size={16} fill={wishlist.length > 0 ? "red" : "none"} className={wishlist.length > 0 ? "text-red-400" : ""} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
                )}
              </button>

              {/* Shopping cart quick link */}
              <button
                onClick={() => setCurrentTab('Store')}
                className="p-2 text-slate-300 hover:text-[#C9A84C] relative transition-colors duration-300 cursor-pointer"
                title="View Shopping Bag"
              >
                <ShoppingCart size={16} />
                {cart.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#C9A84C] text-[#0A0F2C] font-mono text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0A0F2C]">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Admin entry badge quick shortcut */}
              <button
                onClick={() => setCurrentTab('Dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B2A6B]/30 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/25 text-[9px] uppercase font-mono tracking-wider font-semibold text-[#C9A84C] rounded-full transition cursor-pointer"
              >
                System Exec
              </button>
            </div>

          </div>
        </header>

        {/* Main Switchboard Canvas with Animated transitions */}
        <main className="flex-1 w-full bg-[#0A0F2C] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full"
            >
              {currentTab === 'Home' && (
                <HomeView
                  onNavigate={setCurrentTab}
                  featuredProducts={products}
                  featuredArtwork={artworks}
                  collections={collections}
                />
              )}

              {currentTab === 'Arts' && (
                <ArtsView
                  artworks={artworks}
                  onSelectArtPiece={(art) => {
                    alert(`Inspecting fine art piece: "${art.title}" (${art.medium}). High-end collectors can add to bag directly.`);
                  }}
                  onAddToCart={handleAddArtToCart}
                />
              )}

              {currentTab === 'Fashion' && (
                <FashionView
                  products={products}
                  lookbookItems={lookbookItems}
                  onSelectProduct={(prod) => {
                    setCurrentTab('Store');
                  }}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleToggleWishlist}
                />
              )}

              {currentTab === 'AI Studio' && (
                <AIStudioView
                  onAddCustomToCart={handleAddCustomToCart}
                />
              )}

              {currentTab === 'Store' && (
                <StoreView
                  products={products}
                  cart={cart}
                  wishlist={wishlist}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onToggleWishlist={handleToggleWishlist}
                  onCheckout={handleSecureCheckout}
                />
              )}

              {currentTab === 'Gallery' && (
                <GalleryView />
              )}

              {currentTab === 'Dashboard' && (
                !currentUser ? (
                  authScreen === 'login' ? (
                    <LoginView
                      onLoginSuccess={(usr) => setCurrentUser(usr)}
                      onNavigateToSignUp={() => setAuthScreen('signup')}
                    />
                  ) : (
                    <SignUpView
                      onSignUpSuccess={() => setAuthScreen('login')}
                      onNavigateToLogin={() => setAuthScreen('login')}
                    />
                  )
                ) : (
                  currentUser.role === 'customer' ? (
                    <UserDashboardView
                      user={currentUser}
                      wishlist={wishlist}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={handleAddToCart}
                      onLogout={() => {
                        mockAuth.setCurrentUser(null as any);
                        setCurrentUser(null);
                      }}
                    />
                  ) : currentUser.role === 'admin' ? (
                    <AdminDashboardView
                      user={currentUser}
                      products={products}
                      onAddProduct={(addedProd) => setProducts([addedProd, ...products])}
                      onDeleteProduct={(prodId) => setProducts(products.filter(p => p.id !== prodId))}
                      onLogout={() => {
                        mockAuth.setCurrentUser(null as any);
                        setCurrentUser(null);
                      }}
                    />
                  ) : (
                    <FounderDashboardView
                      user={currentUser}
                      onLogout={() => {
                        mockAuth.setCurrentUser(null as any);
                        setCurrentUser(null);
                      }}
                    />
                  )
                )
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Luxury Footer with gold highlights */}
        <footer className="bg-[#05081A] border-t border-[#C9A84C]/10 py-16 px-4 md:px-8 select-none text-left">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Brand Col */}
            <div className="md:col-span-4 flex flex-col gap-4">
              <SadafLogo size={42} showText={true} />
              <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm mt-3">
                An immersive digital empire blending centuries of Cairo and Alexandrian fine heritage with state-of-the-art AI design technologies. Wear your lineage, curated by hand.
              </p>
              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px] uppercase tracking-wider mt-5">
                <ShieldCheck size={12} className="text-green-400" />
                <span>Tailored Secure Delivery Certified 2026</span>
              </div>
            </div>

            {/* Directory Links Col */}
            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-serif text-[#C9A84C] text-[11px] tracking-widest font-semibold uppercase mb-4">THE DIRECTORY</h4>
                <ul className="space-y-2 text-xs font-sans text-gray-400">
                  {['Home', 'Arts', 'Fashion', 'AI Studio'].map(item => (
                    <li key={item}>
                      <button onClick={() => setCurrentTab(item)} className="hover:text-white transition cursor-pointer">
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-serif text-[#C9A84C] text-[11px] tracking-widest font-semibold uppercase mb-4">COLLECTIONS</h4>
                <ul className="space-y-2 text-xs font-sans text-gray-400">
                  {['Store', 'Gallery', 'Dashboard'].map(item => (
                    <li key={item}>
                      <button onClick={() => setCurrentTab(item)} className="hover:text-white transition cursor-pointer">
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter subscription form */}
            <div className="md:col-span-4 flex flex-col gap-4 font-sans text-xs">
              <h4 className="font-serif text-[#C9A84C] text-[11px] tracking-widest font-semibold uppercase mb-2">SUBSCRIBE TO ATELIER PRESS</h4>
              <p className="text-slate-400 leading-relaxed">
                Receive notifications for seasonal fabric drops, limited-edition calligraphy capsules, and local Egyptian masterclass galleries.
              </p>

              {newsletterSubscribed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3.5 rounded bg-[#1B2A6B]/30 border border-[#C9A84C]/30 text-[#C9A84C] font-mono text-[10px] uppercase tracking-wider text-center"
                >
                  Thank you. You are added to our elite roster.
                </motion.div>
              ) : (
                <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter email coordinate"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    className="flex-1 bg-black/40 border border-[#C9A84C]/30 focus:border-[#4FC3F7] rounded px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-[#C9A84C] text-[#0A0F2C] hover:bg-white text-xs uppercase font-semibold font-mono tracking-widest rounded transition cursor-pointer active:scale-95"
                  >
                    Join
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Global Signature Footer Copyright text */}
          <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 font-mono gap-4 uppercase select-none">
            <span>&copy; 2026 SADAF | Art & Fashion House. All licensing rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">Authentic Weaving Pact</a>
              <span>&bull;</span>
              <a href="#" className="hover:text-white transition">Maqasaq AI Legal Terms</a>
            </div>
          </div>
        </footer>

      </AppLayout>
    </AppProviders>
  );
}
