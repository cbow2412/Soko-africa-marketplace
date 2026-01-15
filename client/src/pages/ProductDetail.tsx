import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, ArrowLeft, Share2, MessageCircle, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function ProductDetail() {
  const [location, navigate] = useLocation();
  const productId = parseInt(location.split("/").pop() || "0");
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = trpc.products.getById.useQuery({
    id: productId,
  });

  // Fetch seller details
  const { data: seller } = trpc.sellers.getById.useQuery(
    { id: product?.sellerId || 0 },
    { enabled: !!product }
  );

  // Fetch comments
  const { data: comments = [] } = trpc.comments.getByProduct.useQuery(
    { productId },
    { enabled: !!product }
  );

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
    if (seller?.whatsappPhone && product) {
      const message = encodeURIComponent(
        `Hi! I'm interested in your product: ${product.name}\n\nPrice: KES ${product.price}\n\nCan you provide more details?`
      );
      const whatsappPhone = seller.whatsappPhone || "";
      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${message}`;
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
                  className="absolute top-4 right-4 p-3 bg-slate-900/80 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isSaved ? "fill-red-500 text-red-500" : "text-slate-400"
                    }`}
                  />
                </button>
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleWhatsAppChat}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Seller
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:text-white text-lg py-6"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
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
