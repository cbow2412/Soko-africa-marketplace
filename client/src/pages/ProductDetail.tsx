import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, Share2, MessageCircle, Sparkles, ShieldCheck, Zap, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import PremiumLayout from "@/components/layouts/PremiumLayout";
import ProductCard from "@/components/ProductCard";
import { toast } from "react-hot-toast";

export default function ProductDetail() {
  const [location, navigate] = useLocation();
  const productId = parseInt(location.split("/").pop() || "0");
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Fetch product details
  const { data: product, isLoading } = trpc.products.getById.useQuery({
    id: productId,
  });

  // Fetch similar products
  const { data: similarProducts } = trpc.products.search.useQuery(
    { query: product?.name || "", limit: 8 },
    { enabled: !!product }
  );

  // Fetch categories for display
  const { data: categories } = trpc.categories.getAll.useQuery();

  const handleWhatsAppChat = () => {
    if (product) {
      const sellerPhone = "254756185209";
      const message = encodeURIComponent(
        `Hi! I'm interested in this product on Soko Africa:\n\n*${product.name}*\n\nPrice: ${product.price}\n\nLink: ${window.location.href}`
      );
      const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Check out this luxury find on Soko Africa: ${product?.name} - ${product?.price}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <PremiumLayout>
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full"
          />
        </div>
      </PremiumLayout>
    );
  }

  if (!product) {
    return (
      <PremiumLayout>
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 mb-6">Product not found</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-widest rounded-xl"
            >
              Back to Discovery
            </motion.button>
          </div>
        </div>
      </PremiumLayout>
    );
  }

  const categoryName = categories?.find((c) => c.id === product.categoryId)?.name;

  return (
    <PremiumLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-20 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-black uppercase tracking-widest">Back</span>
            </motion.button>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Product Details</h1>
            <div className="w-20"></div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Gallery - Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              {/* Main Image */}
              <div className="relative group rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 mb-6">
                <div className="relative aspect-square overflow-hidden">
                  <motion.img
                    key={imageIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={product.imageUrl || "https://via.placeholder.com/800"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />

                  {/* Image Overlay Actions */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-between p-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setImageIndex((prev) => (prev - 1 + 1) % 1)}
                      className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <ChevronLeft size={24} className="text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setImageIndex((prev) => (prev + 1) % 1)}
                      className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <ChevronRight size={24} className="text-white" />
                    </motion.button>
                  </motion.div>

                  {/* Heart Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setIsSaved(!isSaved)}
                    className="absolute top-6 right-6 p-4 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl transition-all transform hover:scale-110 active:scale-95"
                  >
                    <Heart
                      size={24}
                      className={`transition-all ${
                        isSaved ? "fill-red-500 text-red-500" : "text-white"
                      }`}
                    />
                  </motion.button>

                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-6 left-6 flex items-center gap-2"
                  >
                    <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-tighter shadow-lg shadow-amber-500/30">
                      {product.source === "whatsapp_business" ? "Real-Time Sync" : "Verified"}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Product Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Title & Category */}
                <div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-500">{categoryName}</span>
                  </motion.div>
                  <h1 className="text-5xl font-black tracking-tight mb-4 uppercase leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-lg text-slate-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price & Specs */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-6"
                  >
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Price</p>
                    <p className="text-4xl font-black text-amber-400">{product.price}</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6"
                  >
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Stock</p>
                    <p className="text-4xl font-black text-green-400">{product.stock || "Available"}</p>
                  </motion.div>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <ShieldCheck size={16} className="text-green-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Authentic</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <Zap size={16} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Fast Delivery</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">AI Verified</span>
                  </motion.div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleWhatsAppChat}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/30 transition-all"
                  >
                    <MessageCircle size={20} />
                    Buy on WhatsApp
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
                  >
                    {copied ? <Check size={20} /> : <Share2 size={20} />}
                    {copied ? "Copied" : "Share"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            {/* Sidebar - Right */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Similar Products */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                  <Sparkles size={16} /> Similar Finds
                </h3>
                <div className="space-y-4">
                  {similarProducts
                    ?.filter((p) => p.id !== product.id)
                    .slice(0, 3)
                    .map((p) => (
                      <motion.div
                        key={p.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate(`/product/${p.id}`)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 mb-2">
                          <img
                            src={p.imageUrl || ""}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs font-black uppercase tracking-widest bg-amber-500 text-black px-3 py-1.5 rounded-lg">View</span>
                          </div>
                        </div>
                        <p className="text-xs font-black uppercase tracking-tight text-white line-clamp-1">{p.name}</p>
                        <p className="text-sm font-black text-amber-400">{p.price}</p>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Info Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
              >
                <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-3">Discovery Engine</p>
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  "This product was discovered using our SigLIP AI taste profiling engine. We match visual aesthetics with buyer preferences to surface exactly what you're looking for."
                </p>
              </motion.div>

              {/* Product ID */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Product ID</p>
                <p className="text-xs font-mono text-slate-300 break-all">{product.id}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
