import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sparkles, Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Watchlist() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  
  const { data: recommendedData, isLoading } = trpc.products_recommended.getRecommended.useQuery({
    limit: 20,
    offset: 0
  });

  useEffect(() => {
    if (recommendedData) {
      setProducts(recommendedData);
    }
  }, [recommendedData]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setLocation("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            Your Watchlist <Sparkles className="text-amber-500 w-5 h-5" />
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI-Curated for your style</p>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="text-zinc-500 text-xs font-black tracking-widest uppercase">Curating your feed...</div>
          </div>
        ) : products.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="break-inside-avoid bg-zinc-900 border-zinc-800 overflow-hidden group cursor-pointer hover:border-amber-500/50 transition-all"
                onClick={() => setLocation(`/product/${product.id}`)}
              >
                <div className="relative aspect-[3/4]">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <Button 
                      size="sm" 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Added to cart!");
                      }}
                    >
                      <ShoppingBag size={14} className="mr-1" /> Buy Now
                    </Button>
                  </div>
                  <button className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold truncate text-zinc-200">{product.name}</h3>
                  <p className="text-amber-500 font-black text-sm mt-1">{product.price}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No items in your watchlist yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
