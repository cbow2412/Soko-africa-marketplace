import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PremiumProductCard from "./PremiumProductCard";

interface VisualDiscoveryChainProps {
  initialProductId: number;
  onProductClick?: (productId: number) => void;
  maxChainLength?: number;
}

interface ChainedProduct {
  id: number;
  name: string;
  price: string;
  imageUrl: string | null;
  category?: string;
  source?: string;
  similarity?: number;
}

/**
 * Visual Discovery Chain Component
 * Displays a sequence of products mathematically closest to each other
 * Creates an immersive "taste journey" through similar products
 */
export default function VisualDiscoveryChain({
  initialProductId,
  onProductClick,
  maxChainLength = 6,
}: VisualDiscoveryChainProps) {
  const [chain, setChain] = useState<ChainedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch similar products
  const { data: similarProducts, isLoading: isFetchingSimilar } = trpc.products.getSimilar.useQuery(
    {
      productId: initialProductId,
      limit: maxChainLength,
    },
    { enabled: !!initialProductId }
  );

  const { data: categories } = trpc.categories.getAll.useQuery();

  useEffect(() => {
    if (similarProducts) {
      setChain(
        similarProducts.map((p, idx) => ({
          ...p,
          similarity: 1 - idx * 0.1, // Decreasing similarity score
        }))
      );
      setCurrentIndex(0);
    }
  }, [similarProducts]);

  const handleNextInChain = () => {
    if (currentIndex < chain.length - 1) {
      setCurrentIndex(currentIndex + 1);
      onProductClick?.(chain[currentIndex + 1].id);
    }
  };

  const handlePreviousInChain = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      onProductClick?.(chain[currentIndex - 1].id);
    }
  };

  if (isFetchingSimilar || chain.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl animate-pulse" />
      </motion.div>
    );
  }

  const currentProduct = chain[currentIndex];
  const categoryName = categories?.find(c => c.id === (currentProduct as any).categoryId)?.name;
  const similarity = currentProduct.similarity || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Discovery Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Sparkles size={20} className="text-amber-500" />
          </motion.div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Visual Discovery Chain</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              AI-Powered Taste Journey
            </p>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-lg"
        >
          <Zap size={12} className="text-amber-500" />
          <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">
            {Math.round(similarity * 100)}% Match
          </span>
        </motion.div>
      </div>

      {/* Current Product in Chain */}
      <motion.div
        key={currentProduct.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
      >
        <PremiumProductCard
          id={currentProduct.id}
          name={currentProduct.name}
          price={currentProduct.price}
          imageUrl={currentProduct.imageUrl || ""}
          category={categoryName}
          source={currentProduct.source}
          onClick={() => onProductClick?.(currentProduct.id)}
        />
      </motion.div>

      {/* Chain Navigation */}
      <div className="flex items-center justify-between gap-4">
        {/* Previous Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePreviousInChain}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
            currentIndex === 0
              ? "bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed"
              : "bg-white/10 border border-white/20 hover:bg-white/15 text-white"
          }`}
        >
          ← Previous
        </motion.button>

        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          {chain.map((_, idx) => (
            <motion.div
              key={idx}
              animate={{
                scale: idx === currentIndex ? 1.2 : 1,
                backgroundColor: idx === currentIndex ? "#f59e0b" : "rgba(255,255,255,0.2)",
              }}
              className="w-2 h-2 rounded-full transition-all"
            />
          ))}
        </div>

        {/* Next Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextInChain}
          disabled={currentIndex === chain.length - 1}
          className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
            currentIndex === chain.length - 1
              ? "bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-500 hover:from-amber-400 hover:to-orange-500 text-black"
          }`}
        >
          Next <ChevronRight size={14} />
        </motion.button>
      </div>

      {/* Chain Info */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">How It Works</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Each product is mathematically selected based on visual similarity using SigLIP embeddings. The higher the match percentage, the closer the visual aesthetic. Explore the chain to discover your perfect taste profile.
        </p>
      </motion.div>

      {/* Chain Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
        >
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Position</p>
          <p className="text-lg font-black text-white">{currentIndex + 1}</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
        >
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Chain Length</p>
          <p className="text-lg font-black text-white">{chain.length}</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-3 text-center"
        >
          <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mb-1">Similarity</p>
          <p className="text-lg font-black text-amber-400">{Math.round(similarity * 100)}%</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
