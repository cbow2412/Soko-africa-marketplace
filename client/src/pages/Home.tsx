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

// Determine card size based on product ID for varied masonry layout
function getCardSize(index: number): "small" | "medium" | "large" {
  const pattern = [
    "small",
    "small",
    "medium",
    "small",
    "large",
    "small",
    "medium",
    "small",
    "small",
    "medium",
  ];
  return (pattern[index % pattern.length] as "small" | "medium" | "large") || "small";
}

// Get grid span classes based on card size
function getSpanClasses(size: "small" | "medium" | "large"): string {
  switch (size) {
    case "large":
      return "col-span-2 row-span-2";
    case "medium":
      return "col-span-2 row-span-1";
    case "small":
    default:
      return "col-span-1 row-span-1";
  }
}

export default function Home() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = trpc.products.getAll.useQuery(
    { limit: 30, offset },
    { enabled: !selectedCategory && !searchQuery }
  );

  const { data: categoryProducts, isLoading: isLoadingCategory } =
    trpc.products.getByCategory.useQuery(
      { categoryId: selectedCategory!, limit: 30, offset },
      { enabled: !!selectedCategory }
    );

  const { data: searchResults, isLoading: isLoadingSearch } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 30, offset },
    { enabled: !!searchQuery }
  );

  const { data: categories } = trpc.categories.getAll.useQuery();

  // Handle infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !isLoading) {
          setOffset(prev => prev + 30);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

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

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Status Bar */}
      <div className="bg-black px-4 py-2 flex justify-between items-center text-xs border-b border-slate-800">
        <span>05:20</span>
        <div className="flex gap-1">
          <span>📶</span>
          <span>📡</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header with Search */}
      <div className="bg-black px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 rounded-full px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 text-sm"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-black px-4 py-3 border-b border-slate-800 overflow-x-auto">
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
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
              className={`px-4 py-1 rounded-full text-sm font-medium transition ${
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

      {/* Masonry Grid */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="grid grid-cols-2 gap-2 auto-rows-max">
          {products.map((product, index) => {
            const size = getCardSize(index);
            const spanClasses = getSpanClasses(size);

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className={`${spanClasses} bg-slate-900 rounded-2xl overflow-hidden cursor-pointer group relative hover:opacity-90 transition`}
              >
                {/* Product Image */}
                <img
                  src={product.imageUrl || "https://via.placeholder.com/300?text=No+Image"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/300?text=No+Image";
                  }}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <div className="text-white text-xs font-semibold truncate">
                    {product.name}
                  </div>
                </div>

                {/* Heart button */}
                <button className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 rounded-full p-1.5 transition">
                  <Heart size={16} className="text-white" />
                </button>

                {/* Price badge */}
                <div className="absolute bottom-2 left-2 bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                  {product.price}
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
          {isLoadingData && <div className="text-slate-400 text-sm">Loading...</div>}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-black border-t border-slate-800 px-4 py-2 flex justify-around items-center">
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
          <HomeIcon size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
          <Search size={24} />
          <span className="text-xs">Search</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
          <Plus size={24} />
          <span className="text-xs">Add</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
          <MessageCircle size={24} />
          <span className="text-xs">Messages</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition">
          <User size={24} />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
