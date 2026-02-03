import { motion } from "framer-motion";
import { Heart, Plus, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  category?: string;
  source?: string;
  onFavorite?: (id: number) => void;
  onAddToCart?: (id: number) => void;
  onClick?: () => void;
  isFavorited?: boolean;
}

export default function ProductCard({
  id,
  name,
  price,
  imageUrl,
  category,
  source,
  onFavorite,
  onAddToCart,
  onClick,
  isFavorited = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -12, transition: { duration: 0.3 } },
  };

  const overlayVariants = {
    hidden: { opacity: 0, backdropFilter: "blur(0px)" },
    visible: {
      opacity: 1,
      backdropFilter: "blur(12px)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-slate-950">
          {/* Skeleton Loading */}
          {!imageLoaded && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
            />
          )}

          {/* Image */}
          <motion.img
            src={imageUrl || "https://via.placeholder.com/500"}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
          />

          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-4 flex items-center gap-2"
          >
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-tighter shadow-lg shadow-amber-500/30">
              {source === "whatsapp_business" ? "Real-Time" : "Verified"}
            </span>
          </motion.div>

          {/* Heart Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(id);
            }}
            className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl transition-all transform hover:scale-110 active:scale-95"
          >
            <Heart
              size={20}
              className={clsx(
                "transition-all",
                isFavorited ? "fill-red-500 text-red-500" : "text-white"
              )}
            />
          </motion.button>

          {/* Bottom Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="absolute bottom-0 left-0 right-0 p-4 space-y-3"
          >
            {/* Product Name */}
            <div className="space-y-1">
              <h3 className="text-white font-black text-sm leading-tight line-clamp-2 uppercase tracking-tight">
                {name}
              </h3>
              {category && (
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  {category}
                </p>
              )}
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <motion.div
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                className="text-amber-400 font-black text-lg"
              >
                {price}
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(id);
                }}
                className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <Plus size={18} className="text-white" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Metadata Footer (Always Visible) */}
        <div className="p-3 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">AI Verified</span>
          </div>
          <ShieldCheck size={12} className="text-green-500" />
        </div>
      </div>
    </motion.div>
  );
}
