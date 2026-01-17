import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Heart, Search, Plus, MessageCircle, User, Home as HomeIcon, Sparkles, TrendingUp, MapPin } from "lucide-react";

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
  const heights = [250, 280, 300, 320, 350, 380, 400, 280, 320, 350];
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

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = trpc.products.getAll.useQuery(
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
    if (productsData) {
      setProducts(prev => (offset === 0 ? productsData : [...prev, ...productsData]));
    }
  }, [productsData, offset]);

  useEffect(() => {
    if (categoryProducts) {
      setProducts(prev => (offset === 0 ? categoryProducts : [...prev, ...categoryProducts]));
    }
  }, [categoryProducts, offset]);

  useEffect(() => {
    if (searchResults) {
      setProducts(prev => (offset === 0 ? searchResults : [...prev, ...searchResults]));
    }
  }, [searchResults, offset]);

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
      {/* Top Navigation Bar */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-xl tracking-tighter">SOKO AFRICA</h1>
            <p className="text-[10px] text-amber-500 font-bold tracking-widest uppercase">The MVP Marketplace</p>
          </div>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:bg-white/10 focus-within:border-amber-500/50 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search for unique Kenyan finds..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-white/5 rounded-full transition-colors relative group">
            <MessageCircle size={22} className="text-slate-300 group-hover:text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-black"></span>
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-full transition-colors group">
            <User size={22} className="text-slate-300 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Hero Section / Interesting Top Area */}
        <div className="px-4 pt-6 pb-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900/40 to-black border border-white/5 p-8 sm:p-12">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black tracking-widest uppercase border border-amber-500/30">
                  Featured Collection
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <MapPin size={12} /> Nairobi, Kenya
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 leading-tight">
                Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Authentic</span> Spirit of Africa.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed max-w-lg">
                Explore over 1,000+ hand-picked items from local Kenyan markets. From Gikomba rare finds to Kilimani tech, Soko brings the marketplace to your fingertips.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-white text-black font-black rounded-xl hover:bg-amber-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">
                  Shop Now
                </button>
                <button className="px-6 py-3 bg-white/5 border border-white/10 text-white font-black rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                  <TrendingUp size={18} /> Trending
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 py-2">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm placeholder-slate-500"
            />
          </div>
        </div>

        {/* Category Filter - Horizontal Scroll */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md z-40 px-4 py-4 overflow-x-auto scrollbar-hide border-b border-white/5">
          <div className="flex gap-3 whitespace-nowrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${
                selectedCategory === null
                  ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              All Items
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pinterest Masonry Grid */}
        <div className="px-4 py-6">
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {products.map((product, index) => {
              const cardHeight = getCardHeight(product.id);
              const isFavorited = favorites.has(product.id);

              return (
                <div
                  key={`${product.id}-${index}`}
                  className="break-inside-avoid bg-white/5 rounded-3xl overflow-hidden cursor-pointer group relative hover:ring-2 hover:ring-amber-500/50 transition-all duration-300"
                  style={{ height: `${cardHeight}px` }}
                >
                  {/* Product Image */}
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/300?text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300?text=No+Image";
                    }}
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                    {/* Top actions */}
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

                    {/* Product info at bottom */}
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
      <div className="bg-black/80 backdrop-blur-md border-t border-white/10 px-6 py-4 flex justify-around items-center sm:hidden z-50">
        <button className="flex flex-col items-center gap-1 text-amber-500 transition-all">
          <HomeIcon size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all">
          <Sparkles size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Explore</span>
        </button>
        <div className="relative -mt-12">
          <button className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/40 border-4 border-black transform active:scale-90 transition-transform">
            <Plus size={28} className="text-white" />
          </button>
        </div>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all">
          <MessageCircle size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Inbox</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all">
          <User size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}
