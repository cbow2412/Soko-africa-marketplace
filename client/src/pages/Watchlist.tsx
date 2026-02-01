import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Sparkles, Heart, ArrowLeft } from "lucide-react";
import { Masonry } from "react-plock";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonLoader } from "@/components/SkeletonLoader";

const PREDEFINED_HEIGHTS = [280, 320, 350, 400, 450, 300, 380, 420];
const getCardHeight = (productId: number) => PREDEFINED_HEIGHTS[productId % PREDEFINED_HEIGHTS.length];

export default function Watchlist() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  const { data: recommendedData, isLoading } = trpc.products_recommended.getRecommended.useQuery({
    limit: 20,
    offset: 0
  });

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

  useEffect(() => {
    if (recommendedData) {
      setProducts(recommendedData);
    }
  }, [recommendedData]);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      localStorage.setItem('soko_watchlist', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const skeletonHeights = useMemo(() => Array.from({ length: 8 }).map((_, i) => PREDEFINED_HEIGHTS[i % PREDEFINED_HEIGHTS.length]), []);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={() => setLocation("/")} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors border border-white/5">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-white">
            Watchlist <Sparkles className="text-[#D4AF37] w-5 h-5" />
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI-Curated Luxe Selection</p>
        </div>
      </div>

      <div className="px-4 py-6">
        {isLoading ? (
          <SkeletonLoader heights={skeletonHeights} />
        ) : products.length > 0 ? (
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
                index={index % 20}
              />
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 opacity-30">
            <Heart className="w-16 h-16 text-slate-500 mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Your collection is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
