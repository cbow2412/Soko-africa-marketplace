import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useStaticProducts } from "@/hooks/useStaticProducts";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Filter, Search as SearchIcon, TrendingUp } from "lucide-react";
import PremiumLayout from "@/components/layouts/PremiumLayout";
import PremiumProductCard from "@/components/PremiumProductCard";
import AdvancedMasonryGrid from "@/components/AdvancedMasonryGrid";
import toast from "react-hot-toast";

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
}

export default function Home() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = trpc.products_recommended.getRecommended.useQuery(
    { limit: 40, offset },
    { enabled: !selectedCategory && !searchQuery }
  );

  const { data: categoryProducts, isLoading: isLoadingCategory } = trpc.products.getByCategory.useQuery(
    { categoryId: selectedCategory!, limit: 40, offset },
    { enabled: !!selectedCategory }
  );

  const { data: searchResults, isLoading: isLoadingSearch } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 40, offset },
    { enabled: !!searchQuery }
  );

  const { data: categories } = trpc.categories.getAll.useQuery();
  const { products: staticProducts } = useStaticProducts();

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingProducts && !isLoadingCategory && !isLoadingSearch) {
          setOffset((prev) => prev + 40);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoadingProducts, isLoadingCategory, isLoadingSearch]);

  // Update products
  useEffect(() => {
    if (productsData && !selectedCategory && !searchQuery) {
      setProducts((prev) => (offset === 0 ? productsData : [...prev, ...productsData]));
    } else if (!isLoadingProducts && !productsData && staticProducts.length > 0 && !selectedCategory && !searchQuery) {
      const formattedStatic = staticProducts.map((p) => ({
        ...p,
        price: p.price.toLocaleString(),
        source: "nairobi_market",
      })) as any[];
      setProducts((prev) => (offset === 0 ? formattedStatic.slice(0, 40) : [...prev, ...formattedStatic.slice(offset, offset + 40)]));
    }
  }, [productsData, staticProducts, isLoadingProducts, offset, selectedCategory, searchQuery]);

  useEffect(() => {
    if (categoryProducts && selectedCategory) {
      setProducts((prev) => (offset === 0 ? categoryProducts : [...prev, ...categoryProducts]));
    }
  }, [categoryProducts, offset, selectedCategory]);

  useEffect(() => {
    if (searchResults && searchQuery) {
      setProducts((prev) => (offset === 0 ? searchResults : [...prev, ...searchResults]));
    }
  }, [searchResults, offset, searchQuery]);

  useEffect(() => {
    setProducts([]);
    setOffset(0);
  }, [selectedCategory, searchQuery]);

  const isLoadingData = isLoadingProducts || isLoadingCategory || isLoadingSearch;

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        toast.success("Removed from favorites");
      } else {
        newSet.add(productId);
        toast.success("Added to favorites");
      }
      return newSet;
    });
  };

  const masonryItems = products.map((product) => ({
    id: product.id,
    aspectRatio: 1,
    children: (
      <PremiumProductCard
        id={product.id}
        name={product.name}
        price={product.price}
        imageUrl={product.imageUrl || ""}
        category={categories?.find((c) => c.id === product.categoryId)?.name}
        source={product.source}
        isFavorited={favorites.has(product.id)}
        onFavorite={toggleFavorite}
        onClick={() => navigate(`/product/${product.id}`)}
        aspectRatio={1}
      />
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
            {/* Title & Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                >
                  <Sparkles size={24} className="text-amber-500" />
                </motion.div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">Elite Discovery</h2>
              </div>
              <h1 className="text-6xl sm:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent leading-tight">
                Discover Nairobi's Finest
              </h1>
              <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
                Curated luxury finds sourced directly from Kenya's most exclusive businesses. Powered by AI taste profiling and real-time inventory sync.
              </p>
            </motion.div>

            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <Filter size={16} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Filter by Category</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(null)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                    selectedCategory === null
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 border-amber-500 text-black shadow-lg shadow-amber-500/30"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  All Items
                </motion.button>

                {categories?.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                      selectedCategory === cat.id
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 border-amber-500 text-black shadow-lg shadow-amber-500/30"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    {cat.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Products Grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="px-4 sm:px-6 lg:px-8 pb-24 md:pb-12"
        >
          <div className="max-w-7xl mx-auto">
            <AdvancedMasonryGrid items={masonryItems} columns={4} gap={16} />

            {/* Loading Indicator */}
            <motion.div
              ref={observerTarget}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-32 flex flex-col items-center justify-center gap-4 mt-16"
            >
              <AnimatePresence>
                {isLoadingData ? (
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
                    <p className="text-slate-500 text-xs font-black tracking-widest uppercase">Discovering more finds...</p>
                  </motion.div>
                ) : products.length > 0 ? (
                  <p className="text-slate-700 text-[10px] font-black tracking-[0.2em] uppercase">End of Discovery</p>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </PremiumLayout>
  );
}
