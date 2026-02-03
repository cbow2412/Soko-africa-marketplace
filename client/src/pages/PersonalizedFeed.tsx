import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Heart, Zap, Brain } from "lucide-react";
import PremiumLayout from "@/components/layouts/PremiumLayout";
import PremiumProductCard from "@/components/PremiumProductCard";
import AdvancedMasonryGrid from "@/components/AdvancedMasonryGrid";
import { useTasteProfile } from "@/hooks/useTasteProfile";
import { useRecommendationFeed } from "@/hooks/useRecommendationFeed";
import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";

/**
 * PersonalizedFeed Page
 * AI-powered recommendation engine that outdoes Jumia
 * Shows products tailored to user's visual taste profile
 */
export default function PersonalizedFeed() {
  const [, navigate] = useLocation();
  const { profile, recordClick, recordFavorite, getProfileStrength, reset } = useTasteProfile();
  const { feed, isLoading, generateFeed, loadMore, refresh } = useRecommendationFeed();
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load favorites
  useEffect(() => {
    const savedFavorites = localStorage.getItem("soko_watchlist");
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.error("Failed to load watchlist:", e);
      }
    }
  }, []);

  // Save favorites
  useEffect(() => {
    localStorage.setItem("soko_watchlist", JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Generate initial feed
  useEffect(() => {
    generateFeed({ tasteProfile: profile, limit: 20, includeReasons: true });
  }, []);

  // Refresh feed when profile changes
  useEffect(() => {
    if (profile.interactionCount > 0) {
      refresh({ tasteProfile: profile, limit: 20, includeReasons: true });
    }
  }, [profile.interactionCount]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && feed.length > 0) {
          loadMore({ tasteProfile: profile, limit: 20 });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, feed.length, profile, loadMore]);

  const handleProductClick = (productId: number) => {
    recordClick(productId);
    navigate(`/product/${productId}`);
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        toast.success("Removed from favorites");
      } else {
        newSet.add(productId);
        recordFavorite(productId);
        toast.success("Added to favorites");
      }
      return newSet;
    });
  };

  const profileStrength = getProfileStrength();
  const { data: categories } = trpc.categories.getAll.useQuery();

  const masonryItems = feed.map((product) => ({
    id: product.id,
    aspectRatio: 1,
    children: (
      <div>
        <PremiumProductCard
          id={product.id}
          name={product.name}
          price={product.price}
          imageUrl={product.imageUrl || ""}
          category={categories?.find((c) => c.id === product.categoryId)?.name}
          source={product.source}
          isFavorited={favorites.has(product.id)}
          onFavorite={toggleFavorite}
          onClick={() => handleProductClick(product.id)}
        />
        {/* Recommendation Reason Badge */}
        {product.reason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-lg flex items-center gap-1.5"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">
              {product.reason}
            </span>
          </motion.div>
        )}
      </div>
    ),
  }));

  return (
    <PremiumLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-12"
        >
          <div className="max-w-7xl mx-auto">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                >
                  <Brain size={24} className="text-amber-500" />
                </motion.div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">
                  AI-Powered Discovery
                </h2>
              </div>
              <h1 className="text-6xl sm:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent leading-tight">
                Your Taste, Perfected
              </h1>
              <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
                Every click teaches us your style. Discover products tailored to your unique aesthetic using advanced AI taste profiling.
              </p>
            </motion.div>

            {/* Profile Strength Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 flex items-center gap-4"
            >
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Profile Strength
                  </span>
                  <span className="text-sm font-black text-amber-400">{Math.round(profileStrength * 100)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    animate={{ width: `${profileStrength * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-600"
                  />
                </div>
              </div>

              {profileStrength < 0.3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    👉 Click products to personalize
                  </p>
                </motion.div>
              )}

              {profileStrength > 0.7 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    reset();
                    toast.success("Profile reset. Start fresh!");
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
                >
                  Reset Profile
                </motion.button>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-4 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4"
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Interactions
                </p>
                <p className="text-3xl font-black text-white">{profile.interactionCount}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4"
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Favorites
                </p>
                <p className="text-3xl font-black text-white">{profile.favoritedProducts.length}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-4"
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mb-2">
                  Categories
                </p>
                <p className="text-3xl font-black text-amber-400">{profile.viewedCategories.length}</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Recommendations Grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="px-4 sm:px-6 lg:px-8 pb-24 md:pb-12"
        >
          <div className="max-w-7xl mx-auto">
            {feed.length > 0 ? (
              <>
                <AdvancedMasonryGrid items={masonryItems} columns={4} gap={16} />

                {/* Loading Indicator */}
                <motion.div
                  ref={observerTarget}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-32 flex flex-col items-center justify-center gap-4 mt-16"
                >
                  <AnimatePresence>
                    {isLoading ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full"
                        />
                        <p className="text-slate-500 text-xs font-black tracking-widest uppercase">
                          Personalizing feed...
                        </p>
                      </motion.div>
                    ) : (
                      <p className="text-slate-700 text-[10px] font-black tracking-[0.2em] uppercase">
                        End of Feed
                      </p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <Brain size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 mb-4">No recommendations yet</p>
                <p className="text-slate-500 text-sm mb-6">
                  Start exploring products to build your taste profile
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-widest rounded-xl"
                >
                  Explore Now
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.section>
      </div>
    </PremiumLayout>
  );
}
