import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Heart, Search, ShoppingBag, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch categories
  const { data: categories = [] } = trpc.categories.getAll.useQuery();

  // Fetch all products
  const { data: allProductsData, isLoading: isLoadingAll } = trpc.products.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch products by category
  const { data: categoryProductsData, isLoading: isLoadingCategory } = trpc.products.getByCategory.useQuery(
    { categoryId: selectedCategory || 0, limit: 20, offset },
    { enabled: selectedCategory !== null }
  );

  // Fetch search results
  const { data: searchProductsData, isLoading: isLoadingSearch } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 20, offset },
    { enabled: searchQuery.length > 0 }
  );

  // Determine which data to display
  useEffect(() => {
    let data: any[] = [];
    
    if (searchQuery && searchProductsData) {
      data = searchProductsData;
    } else if (selectedCategory && categoryProductsData) {
      data = categoryProductsData;
    } else if (allProductsData) {
      data = allProductsData;
    }

    if (offset === 0) {
      setAllProducts(data);
    } else {
      setAllProducts(prev => [...prev, ...data]);
    }
    setIsLoadingMore(false);
  }, [allProductsData, categoryProductsData, searchProductsData, offset]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          const isLoading = searchQuery ? isLoadingSearch : selectedCategory ? isLoadingCategory : isLoadingAll;
          if (!isLoading) {
            setIsLoadingMore(true);
            setOffset(prev => prev + 20);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoadingMore, isLoadingAll, isLoadingCategory, isLoadingSearch, searchQuery, selectedCategory]);

  // Reset offset when category or search changes
  useEffect(() => {
    setOffset(0);
    setAllProducts([]);
  }, [selectedCategory, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const isLoading = searchQuery ? isLoadingSearch : selectedCategory ? isLoadingCategory : isLoadingAll;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-white">Soko Africa</h1>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-300">{user?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-slate-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryClick(null)}
            className={selectedCategory === null ? "bg-amber-600 hover:bg-amber-700" : "border-slate-700 text-slate-300"}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(cat.id)}
              className={selectedCategory === cat.id ? "bg-amber-600 hover:bg-amber-700" : "border-slate-700 text-slate-300"}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && allProducts.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading products...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {allProducts.map(product => (
                <div
                  key={product.id}
                  className="break-inside-avoid"
                >
                  <Card
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-slate-800 border-slate-700 overflow-hidden hover:border-amber-500 transition-colors group cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative bg-slate-900 aspect-square overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <ShoppingBag className="w-12 h-12" />
                        </div>
                      )}
                      <button className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-full transition-colors">
                        <Heart className="w-4 h-4 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {product.description}
                      </p>

                      {/* Price and Stock */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-amber-500">
                          KES {product.price}
                        </span>
                        <span className="text-xs text-slate-400">
                          Stock: {product.stock}
                        </span>
                      </div>

                      {/* Seller Info */}
                      <div className="text-xs text-slate-400 mb-3 pb-3 border-t border-slate-700">
                        <p className="mt-2">Seller: {product.sellerId}</p>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="py-8 flex justify-center">
              {isLoadingMore && (
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-400 text-sm">Loading more products...</p>
                </div>
              )}
            </div>

            {allProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-slate-400">No products found</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
