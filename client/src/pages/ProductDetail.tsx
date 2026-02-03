import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, ArrowLeft, Share2, MessageCircle, Star, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function ProductDetail() {
  const [location, navigate] = useLocation();
  const productId = parseInt(location.split("/").pop() || "0");
  const [isSaved, setIsSaved] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = trpc.products.getById.useQuery({
    id: productId,
  });

  // Fetch similar products using AI Visual Similarity
  const { data: similarProducts, refetch: refetchSimilar } = trpc.products.search.useQuery(
    { query: product?.name || "", limit: 6 },
    { enabled: !!product }
  );

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) {
      refetchSimilar();
    }
  }, [productId, product, refetchSimilar]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Vectorizing details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Product not found</p>
          <Button onClick={() => navigate("/")} className="bg-amber-500 hover:bg-amber-600 text-black">
            Back to Discovery
          </Button>
        </div>
      </div>
    );
  }

  const handleWhatsAppChat = () => {
    if (product) {
      const sellerPhone = "254756185209"; // Primary business number
      const message = encodeURIComponent(
        `Hi! I'm interested in your product on Soko Africa: ${product.name}\n\nPrice: ${product.price}\n\nLink: ${window.location.href}`
      );
      const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this find on Soko Africa: ${product.name} - ${product.price}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Discover
          </Button>
          <h1 className="text-sm font-black uppercase tracking-widest">Product Details</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden rounded-3xl">
              <div className="relative aspect-square overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                    <Sparkles className="w-12 h-12 text-zinc-800" />
                  </div>
                )}
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-2xl transition-all transform active:scale-90 z-10"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isSaved ? "fill-red-500 text-red-500" : "text-white"
                    }`}
                  />
                </button>

                {/* Integrated Buy Button inside Image */}
                <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                  <Button
                    onClick={handleWhatsAppChat}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-7 rounded-2xl shadow-2xl shadow-amber-500/20 transition-all transform active:scale-95 border-none"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Buy on WhatsApp
                  </Button>
                  <button 
                    onClick={handleShare}
                    className="w-14 h-14 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all text-white"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </Card>

            {/* Product Info */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                  {product.source === 'whatsapp_business' ? 'Real-Time Sync' : 'Verified'}
                </span>
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  ID: {product.id}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white mb-4 uppercase">{product.name}</h1>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{product.description}</p>

              {/* Price and Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Price Point</p>
                  <p className="text-4xl font-black text-amber-500 uppercase">{product.price}</p>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                    <ShieldCheck className="w-5 h-5 text-amber-500 mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Authentic</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                    <Zap className="w-5 h-5 text-amber-500 mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Fast Ingest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Similar Discoveries */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-6 flex items-center gap-2">
              <Sparkles size={16} /> Similar Discoveries
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {similarProducts?.filter(p => p.id !== product.id).slice(0, 4).map(p => (
                <div 
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer group relative border border-white/5"
                >
                  <img 
                    src={p.imageUrl || ""} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500 text-black px-2 py-1 rounded">View</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Discovery Engine</p>
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "Our SigLIP AI analyzes visual taste patterns to find products that match your aesthetic, sourced directly from the Kenyan market."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
