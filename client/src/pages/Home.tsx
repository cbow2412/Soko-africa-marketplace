import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Masonry } from "react-plock";
import { trpc } from "@/lib/trpc";
import { useStaticProducts } from "@/hooks/useStaticProducts";
import { Heart, Search, Plus, User, Home as HomeIcon, Sparkles, TrendingUp, MapPin, Bell, Package } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonLoader } from "@/components/SkeletonLoader";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  stock: number | null;
  sellerId: number;
  categoryId: number;
  source?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Fixed heights for masonry to prevent layout shift
const PREDEFINED_HEIGHTS = [280, 320, 350, 400, 450, 300, 380, 420];
const getCardHeight = (productId: number) => PREDEFINED_HEIGHTS[productId % PREDEFINED_HEIGHTS.length];

export default function Home() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('soko_watchlist');
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites);
        setFavorites(new Set(favoriteIds));
      } catch (e) {
        console.error('Failed to load watchlist:', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('soko_watchlist', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Data fetching
  const { data: productsData, isLoading: isLoadingProducts } = trpc.products_recommended.getRecommended.useQuery(
    { limit: 40, offset },
    { enabled: !selectedCategory && !searchQuery }
  );

  const { data: categoryProducts, isLoading: isLoadingCategory } =
    trpc.products.getByCategory.useQuery(
      { categoryId: selectedCategory!, limit: 40, offset },
      { enabled: !!selectedCategory }
    );

  const { data: searchResults, isLoading: isLoadingSearch } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 40, offset },
    { enabled: !!searchQuery }
  );

  const { data: categories } = trpc.categories.getAll.useQuery();
  const { products: staticProducts, isLoading: isLoadingStatic } = useStaticProducts();

  const isLoadingData = isLoadingProducts || isLoadingCategory || isLoadingSearch || isLoadingStatic;

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !isLoadingData) {
          setOffset(prev => prev + 40);
        }
      },
      { rootMargin: "200px" } // Trigger 200px before bottom
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoadingData]);

  // Sync products state
  useEffect(() => {
    let currentBatch: any[] = [];
    if (!selectedCategory && !searchQuery) {
      currentBatch = productsData || (staticProducts.length > 0 ? staticProducts.slice(offset, offset + 40) : []);
    } else if (selectedCategory) {
      currentBatch = categoryProducts || (staticProducts.length > 0 ? staticProducts.filter(p => p.categoryId === selectedCategory).slice(offset, offset + 40) : []);
    } else if (searchQuery) {
      currentBatch = searchResults || (staticProducts.length > 0 ? staticProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(offset, offset + 40) : []);
    }

    if (currentBatch.length > 0) {
      setProducts(prev => (offset === 0 ? currentBatch : [...prev, ...currentBatch]));
    }
  }, [productsData, categoryProducts, searchResults, staticProducts, offset, selectedCategory, searchQuery]);

  // Reset when filters change
  useEffect(() => {
    setProducts([]);
    setOffset(0);
  }, [selectedCategory, searchQuery]);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const skeletonHeights = useMemo(() => Array.from({ length: 12 }).map((_, i) => PREDEFINED_HEIGHTS[i % PREDEFINED_HEIGHTS.length]), []);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Premium Top Stripe */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#AA8B2E] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 transform hover:rotate-6 transition-transform cursor-pointer">
            <span className="text-black font-black text-xl">S</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tighter leading-none text-white">SOKO LUXE</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-[#D4AF37] font-black tracking-[0.2em] uppercase">Discovery Engine</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <MapPin size={10} /> Nairobi
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-2xl mx-12">
          <div className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 focus-within:bg-white/10 focus-within:border-[#D4AF37]/50 transition-all group">
            <Search size={18} className="text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" />
            <input
              type="text"
              placeholder="Search 2,050+ luxury Nairobi finds..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm placeholder-slate-600 font-medium text-white"
            />
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-500">
              <Sparkles size={12} className="text-[#D4AF37]" /> AI
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all transform active:scale-95">
            <TrendingUp size={14} className="text-[#D4AF37]" /> Trending
          </button>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all transform active:scale-95 shadow-lg shadow-[#D4AF37]/10">
            <Plus size={16} /> Sell
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors relative group">
            <Bell size={20} className="text-slate-400 group-hover:text-white" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#D4AF37] rounded-full border-2 border-black"></span>
          </button>
          <button onClick={() => navigate("/profile")} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors group">
            <User size={20} className="text-slate-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-black">
        {/* Category Filter */}
        <div className="sticky top-0 bg-black/90 backdrop-blur-md z-40 px-6 py-4 overflow-x-auto scrollbar-hide border-b border-white/5">
          <div className="flex gap-3 whitespace-nowrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                selectedCategory === null
                  ? "bg-white border-white text-black shadow-lg shadow-white/10"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              All Items
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                  selectedCategory === cat.id
                    ? "bg-white border-white text-black shadow-lg shadow-white/10"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Luxe-Grid */}
        <div className="px-4 py-6 min-h-screen">
          {products.length === 0 && isLoadingData ? (
            <SkeletonLoader heights={skeletonHeights} />
          ) : (
            <Masonry
              items={products}
              config={{
                columns: [2, 3, 4, 5, 6],
                gap: [16, 16, 16, 16, 16],
                media: [640, 768, 1024, 1280, 1536],
              }}
              render={(product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  height={getCardHeight(product.id)}
                  isFavorited={favorites.has(product.id)}
                  onToggleFavorite={toggleFavorite}
                  index={index % 20} // Reset staggered animation for batches
                />
              )}
            />
          )}

          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="h-40 flex flex-col items-center justify-center gap-4">
            {isLoadingData && products.length > 0 && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
                <div className="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase">Refining Discovery...</div>
              </div>
            )}
            {!isLoadingData && products.length > 0 && products.length >= 2050 && (
              <div className="text-slate-700 text-[10px] font-black tracking-[0.3em] uppercase opacity-50">The Collection is Complete</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-around items-center sm:hidden z-50">
        <button onClick={() => { setSelectedCategory(null); setSearchQuery(""); }} className={`flex flex-col items-center gap-1 ${!selectedCategory && !searchQuery ? 'text-[#D4AF37]' : 'text-slate-500'}`}>
          <HomeIcon size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Luxe</span>
        </button>
        <button onClick={() => navigate("/watchlist")} className="flex flex-col items-center gap-1 text-slate-500">
          <Heart size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Saved</span>
        </button>
        <div className="relative -mt-12">
          <button onClick={() => navigate("/seller/onboarding")} className="w-14 h-14 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-xl shadow-[#D4AF37]/40 border-4 border-black">
            <Plus size={28} className="text-black" />
          </button>
        </div>
        <button onClick={() => navigate("/orders")} className="flex flex-col items-center gap-1 text-slate-500">
          <Package size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Orders</span>
        </button>
        <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-slate-500">
          <User size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}
