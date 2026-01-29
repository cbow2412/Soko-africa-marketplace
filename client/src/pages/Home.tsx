import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useStaticProducts } from "@/hooks/useStaticProducts";
import { Heart, Search, Plus, MessageCircle, User, Home as HomeIcon, Sparkles, TrendingUp, MapPin, Bell, Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  stock: number | null;
  sellerId: number;
  categoryId: number;
  source?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generate random height for Pinterest-style masonry
function getRandomHeight(): number {
  const heights = [280, 320, 350, 400, 450, 300, 380, 420];
  return heights[Math.floor(Math.random() * heights.length)];
}

// Store heights in map to keep them consistent
const heightMap = new Map<number, number>();

function getCardHeight(productId: number): number {
  if (!heightMap.has(productId)) {
    heightMap.set(productId, getRandomHeight());
  }
  return heightMap.get(productId)!;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load favorites from localStorage on mount
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

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('soko_watchlist', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Fetch products (using the new recommendation endpoint for the "All Items" view)
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

  // Handle infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !isLoading && !isLoadingProducts && !isLoadingCategory && !isLoadingSearch) {
          setOffset(prev => prev + 40);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, isLoadingProducts, isLoadingCategory, isLoadingSearch]);

  // Update products when data changes
  useEffect(() => {
    if (productsData && !selectedCategory && !searchQuery) {
      setProducts(prev => (offset === 0 ? productsData : [...prev, ...productsData]));
    } else if (!isLoadingProducts && !productsData && staticProducts.length > 0 && !selectedCategory && !searchQuery) {
      // Fallback to static products if tRPC fails or returns nothing
      const formattedStatic = staticProducts.map(p => ({
        ...p,
        price: p.price.toLocaleString(),
        source: 'nairobi_market'
      })) as any[];
      setProducts(prev => (offset === 0 ? formattedStatic.slice(0, 40) : [...prev, ...formattedStatic.slice(offset, offset + 40)]));
    }
  }, [productsData, staticProducts, isLoadingProducts, offset, selectedCategory, searchQuery]);

  useEffect(() => {
    if (categoryProducts && selectedCategory) {
      setProducts(prev => (offset === 0 ? categoryProducts : [...prev, ...categoryProducts]));
    } else if (!isLoadingCategory && !categoryProducts && staticProducts.length > 0 && selectedCategory) {
      const filtered = staticProducts.filter(p => p.categoryId === selectedCategory);
      const formattedStatic = filtered.map(p => ({
        ...p,
        price: p.price.toLocaleString(),
        source: 'nairobi_market'
      })) as any[];
      setProducts(prev => (offset === 0 ? formattedStatic.slice(0, 40) : [...prev, ...formattedStatic.slice(offset, offset + 40)]));
    }
  }, [categoryProducts, staticProducts, isLoadingCategory, offset, selectedCategory]);

  useEffect(() => {
    if (searchResults && searchQuery) {
      setProducts(prev => (offset === 0 ? searchResults : [...prev, ...searchResults]));
    } else if (!isLoadingSearch && !searchResults && staticProducts.length > 0 && searchQuery) {
      const filtered = staticProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const formattedStatic = filtered.map(p => ({
        ...p,
        price: p.price.toLocaleString(),
        source: 'nairobi_market'
      })) as any[];
      setProducts(prev => (offset === 0 ? formattedStatic.slice(0, 40) : [...prev, ...formattedStatic.slice(offset, offset + 40)]));
    }
  }, [searchResults, staticProducts, isLoadingSearch, offset, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setProducts([]);
    setOffset(0);
  }, [selectedCategory, searchQuery]);

  const isLoadingData = isLoadingProducts || isLoadingCategory || isLoadingSearch;

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Premium Top Stripe */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 transform hover:rotate-6 transition-transform cursor-pointer">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tighter leading-none">SOKO AFRICA</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-amber-500 font-black tracking-[0.2em] uppercase">Marketplace</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <MapPin size={10} /> Nairobi
              </span>
            </div>
          </div>
        </div>

        {/* Integrated Search in Header */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-12">
          <div className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 focus-within:bg-white/10 focus-within:border-amber-500/50 transition-all group">
            <Search size={18} className="text-slate-500 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Search 2,050+ luxury Nairobi finds..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm placeholder-slate-600 font-medium"
            />
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-500">
              <Sparkles size={12} className="text-amber-500" /> AI
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Trending Button - Correctly Placed in Header */}
          <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all transform active:scale-95">
            <TrendingUp size={14} className="text-amber-500" /> Trending
          </button>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all transform active:scale-95 shadow-lg shadow-amber-500/10">
            <Plus size={16} /> Sell
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors relative group">
            <Bell size={20} className="text-slate-400 group-hover:text-white" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-black"></span>
          </button>
          <button 
            onClick={() => navigate("/profile")}
            className="p-2.5 hover:bg-white/5 rounded-xl transition-colors group"
          >
            <User size={20} className="text-slate-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Category Filter - Sticky below header */}
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

        {/* Mobile Search Bar */}
        <div className="md:hidden px-6 py-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <Search size={18} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm placeholder-slate-600"
            />
          </div>
        </div>

        {/* Pinterest Masonry Grid - Refined Spacing and Arrangement */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* We use a multi-column flex layout for better Pinterest-like masonry on web */}
            {Array.from({ length: 6 }).map((_, colIndex) => (
              <div key={colIndex} className={`flex flex-col gap-4 ${
                colIndex >= 2 ? 'hidden sm:flex' : ''
              } ${
                colIndex >= 3 ? 'hidden md:flex' : ''
              } ${
                colIndex >= 4 ? 'hidden lg:flex' : ''
              } ${
                colIndex >= 5 ? 'hidden xl:flex' : ''
              }`}>
                {products
                  .filter((_, i) => i % (
                    window.innerWidth >= 1280 ? 6 : 
                    window.innerWidth >= 1024 ? 5 : 
                    window.innerWidth >= 768 ? 4 : 
                    window.innerWidth >= 640 ? 3 : 2
                  ) === colIndex)
                  .map((product, index) => {
                    const cardHeight = getCardHeight(product.id);
                    const isFavorited = favorites.has(product.id);

                    return (
                      <div
                        key={`${product.id}-${index}`}
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="bg-white/5 rounded-3xl overflow-hidden cursor-pointer group relative hover:ring-2 hover:ring-amber-500/50 transition-all duration-300"
                        style={{ height: `${cardHeight}px` }}
                      >
                        <img
                          src={product.imageUrl || "https://via.placeholder.com/300?text=No+Image"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          loading="lazy"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80";
                          }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                          <div className="flex justify-between items-start">
                            <span className="bg-amber-500 text-black text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
                              {product.source === 'nairobi_market' ? 'Authentic' : 'Verified'}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                toggleFavorite(product.id);
                              }}
                              className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-2.5 transition-all transform hover:scale-110"
                            >
                              <Heart
                                size={18}
                                className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-white"}`}
                              />
                            </button>
                          </div>

                          <div
                            onClick={() => navigate(`/product/${product.id}`)}
                            className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                          >
                            <div className="text-white text-sm font-black leading-tight line-clamp-2">
                              {product.name}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-amber-400 font-black text-base">{product.price}</div>
                              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors">
                                <Plus size={16} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="h-32 flex flex-col items-center justify-center gap-4 mt-8">
            {isLoadingData ? (
              <>
                <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="text-slate-500 text-xs font-black tracking-widest uppercase">Loading more finds...</div>
              </>
            ) : (
              <div className="text-slate-700 text-[10px] font-black tracking-[0.2em] uppercase">End of Marketplace</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-4 flex justify-around items-center sm:hidden z-50">
        <button 
          onClick={() => {
            setSelectedCategory(null);
            setSearchQuery("");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 transition-all ${!selectedCategory && !searchQuery ? 'text-amber-500' : 'text-slate-500 hover:text-white'}`}
        >
          <HomeIcon size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => navigate("/watchlist")}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all"
        >
          <Heart size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Watchlist</span>
        </button>
        <div className="relative -mt-12">
          <button 
            onClick={() => navigate("/seller/onboarding")}
            className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/40 border-4 border-black transform active:scale-90 transition-transform"
          >
            <Plus size={28} className="text-white" />
          </button>
        </div>
        <button 
          onClick={() => navigate("/orders")}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all"
        >
          <Package size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Orders</span>
        </button>
        <button 
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all"
        >
          <User size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}
