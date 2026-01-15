import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Heart, Search, Plus, MessageCircle, User, Home as HomeIcon } from "lucide-react";

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
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-lg">Soko</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-900 rounded-full transition">
            <MessageCircle size={20} />
          </button>
          <button className="p-2 hover:bg-slate-900 rounded-full transition">
            <User size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-black px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 rounded-full px-4 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 text-sm placeholder-slate-400"
          />
        </div>
      </div>

      {/* Category Filter - Horizontal Scroll */}
      <div className="bg-black px-4 py-2.5 border-b border-slate-800 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
              selectedCategory === null
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {categories?.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Pinterest Masonry Grid */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
          {products.map((product, index) => {
            const cardHeight = getCardHeight(product.id);
            const isFavorited = favorites.has(product.id);

            return (
              <div
                key={`${product.id}-${index}`}
                className="break-inside-avoid bg-slate-900 rounded-2xl overflow-hidden cursor-pointer group relative hover:shadow-xl transition-all duration-200"
                style={{ height: `${cardHeight}px` }}
              >
                {/* Product Image */}
                <img
                  src={product.imageUrl || "https://via.placeholder.com/300?text=No+Image"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/300?text=No+Image";
                  }}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                  {/* Heart button */}
                  <div className="flex justify-end">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      className="bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition"
                    >
                      <Heart
                        size={16}
                        className={`transition ${isFavorited ? "fill-red-500 text-red-500" : "text-white"}`}
                      />
                    </button>
                  </div>

                  {/* Product info at bottom */}
                  <div
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="space-y-1 cursor-pointer"
                  >
                    <div className="text-white text-sm font-semibold line-clamp-2">
                      {product.name}
                    </div>
                    <div className="text-amber-400 font-bold text-sm">{product.price}</div>
                  </div>
                </div>

                {/* Click to view details */}
                <div
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="absolute inset-0 opacity-0 group-hover:opacity-0 transition"
                />
              </div>
            );
          })}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
          {isLoadingData && (
            <div className="text-slate-400 text-sm">Loading more products...</div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="bg-black border-t border-slate-800 px-4 py-2 flex justify-around items-center sm:hidden">
        <button className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition">
          <HomeIcon size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition">
          <Search size={24} />
          <span className="text-xs">Search</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition">
          <Plus size={24} />
          <span className="text-xs">Add</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition">
          <MessageCircle size={24} />
          <span className="text-xs">Messages</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition">
          <User size={24} />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
