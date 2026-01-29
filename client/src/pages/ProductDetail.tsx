// import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, ArrowLeft, Share2, MessageCircle, Star, ChevronRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function ProductDetail() {
  const [location, navigate] = useLocation();
  const productId = parseInt(location.split("/").pop() || "0");
  // const { user, isAuthenticated } = useAuth();
  const user = null;
  const isAuthenticated = false;
  const [isSaved, setIsSaved] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = trpc.products.getById.useQuery({
    id: productId,
  });

  // Fetch seller details
  const { data: seller } = trpc.admin.getStats.useQuery(undefined, { enabled: !!product }) as any;

  // Fetch comments
  const comments: any[] = [];

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Product not found</p>
          <Button onClick={() => navigate("/")} className="bg-amber-600 hover:bg-amber-700">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const handleWhatsAppChat = () => {
    if (product) {
      // Hard-wired to the primary business number
      const sellerPhone = "254756185209";
      const message = encodeURIComponent(
        `Hi! I'm interested in your product: ${product.name}\n\nPrice: KES ${product.price}\n\nIs this available for delivery?`
      );
      const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this product: ${product.name} - KES ${product.price}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-xl font-bold text-white">Product Details</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="relative bg-slate-900 aspect-square overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-lg flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                      <p>No image available</p>
                    </div>
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
                    Buy Now
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
              <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
              <p className="text-slate-300 text-lg mb-6">{product.description}</p>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <p className="text-slate-400 text-sm mb-2">Price</p>
                  <p className="text-3xl font-bold text-amber-500">KES {product.price}</p>
                </Card>
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <p className="text-slate-400 text-sm mb-2">Stock Available</p>
                  <p className="text-3xl font-bold text-green-500">{product.stock} units</p>
                </Card>
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authentic</span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Rated</span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Verified</span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                  <Zap className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Seller Card */}
            {seller && (
              <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Seller Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Store Name</p>
                    <p className="text-white font-semibold">{seller.storeName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Description</p>
                    <p className="text-slate-300 text-sm">{seller.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(parseFloat(seller.rating || "0"))
                              ? "fill-amber-500 text-amber-500"
                              : "text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-amber-500 font-semibold">
                      {seller.rating || "0"}
                    </span>
                  </div>
                  <Button
                    onClick={handleWhatsAppChat}
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Seller
                  </Button>
                </div>
              </Card>
            )}

            {/* Product Specs */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Product Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white">Product</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condition</span>
                  <span className="text-white">New</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Source</span>
                  <span className="text-white">Nairobi Market</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SKU</span>
                  <span className="text-white font-mono text-sm">#{product.id}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span>Visual Similarity Search</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">SigLIP AI</span>
            </h2>
            <div className="columns-2 sm:columns-3 lg:columns-5 gap-4 space-y-4">
              {similarProducts.map((similar: any, index: number) => {
                // Generate a pseudo-random height for masonry effect
                const heights = [200, 250, 300, 220, 280];
                const cardHeight = heights[index % heights.length];
                
                return (
                  <div
                    key={similar.id}
                    onClick={() => navigate(`/product/${similar.id}`)}
                    className="break-inside-avoid bg-white/5 rounded-3xl overflow-hidden cursor-pointer group relative hover:ring-2 hover:ring-amber-500/50 transition-all duration-300"
                  >
                    <div style={{ height: `${cardHeight}px` }} className="relative overflow-hidden">
                      <img
                        src={similar.imageUrl || "https://via.placeholder.com/300?text=No+Image"}
                        alt={similar.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="text-white text-xs font-black leading-tight line-clamp-2 mb-1">
                          {similar.name}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-amber-400 font-black text-sm">{similar.price}</div>
                          <div className="bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                            {(similar.similarity * 100).toFixed(0)}% Match
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Reviews & Comments</h2>
          {comments.length > 0 ? (
            <div className="grid gap-4">
              {comments.map(comment => (
                <Card key={comment.id} className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">Anonymous User</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {comment.rating !== null && (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (comment.rating || 0)
                                ? "fill-amber-500 text-amber-500"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-300">{comment.text}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <p className="text-slate-400">No reviews yet. Be the first to review!</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
