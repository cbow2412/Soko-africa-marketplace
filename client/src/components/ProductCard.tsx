import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  source?: string | null;
}

interface ProductCardProps {
  product: Product;
  height: number;
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
  index: number;
}

const vendorTiers = ["Bronze", "Gold", "Platinum"];
const getVendorTier = (id: number) => vendorTiers[id % 3];

export const ProductCard = ({ product, height, isFavorited, onToggleFavorite, index }: ProductCardProps) => {
  const [, navigate] = useLocation();
  const vendorTier = getVendorTier(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="group relative bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-xl"
      style={{ height: `${height}px` }}
    >
      <img
        src={product.imageUrl || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80"}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80";
        }}
      />

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="bg-[#D4AF37] text-black text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-lg">
              {product.source === 'nairobi_market' ? 'Authentic' : 'Verified'}
            </span>
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="bg-black/60 backdrop-blur-md border border-[#D4AF37]/30 text-[#D4AF37] text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
            >
              {vendorTier} Tier
            </motion.span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 transition-all transform hover:scale-110"
          >
            <Heart
              size={18}
              className={`transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-white"}`}
            />
          </button>
        </div>

        <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <div className="text-white text-sm font-black leading-tight line-clamp-2 drop-shadow-md">
            {product.name}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[#D4AF37] font-black text-lg drop-shadow-md">
              {typeof product.price === 'number' ? `KES ${product.price.toLocaleString()}` : product.price}
            </div>
            <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors">
              <Plus size={16} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
