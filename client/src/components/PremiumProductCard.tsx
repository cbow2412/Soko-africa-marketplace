import { motion, useMousePosition } from "framer-motion";
import { Heart, Plus, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

interface PremiumProductCardProps {
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
  aspectRatio?: number;
}

export default function PremiumProductCard({
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
  aspectRatio = 1,
}: PremiumProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });

  // 3D Perspective Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotationX = ((y - centerY) / centerY) * 5;
    const rotationY = ((centerX - x) / centerX) * 5;

    setRotation({ x: rotationX, y: rotationY });
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Magnetic Button Effect
  useEffect(() => {
    if (!isHovered || !addButtonRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current || !addButtonRef.current) return;

      const cardRect = cardRef.current.getBoundingClientRect();
      const buttonRect = addButtonRef.current.getBoundingClientRect();

      const distance = Math.hypot(
        e.clientX - (buttonRect.left + buttonRect.width / 2),
        e.clientY - (buttonRect.top + buttonRect.height / 2)
      );

      const maxDistance = 100;

      if (distance < maxDistance) {
        const angle = Math.atan2(
          e.clientY - (buttonRect.top + buttonRect.height / 2),
          e.clientX - (buttonRect.left + buttonRect.width / 2)
        );

        const pull = (maxDistance - distance) / maxDistance;
        const x = Math.cos(angle) * pull * 20;
        const y = Math.sin(angle) * pull * 20;

        setMagneticPos({ x, y });
      } else {
        setMagneticPos({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isHovered]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group cursor-pointer"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        animate={isHovered ? rotation : { x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          transformStyle: "preserve-3d",
          rotateX: isHovered ? rotation.x : 0,
          rotateY: isHovered ? rotation.y : 0,
        }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 backdrop-blur-sm">
          {/* Background Glow */}
          <motion.div
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/10 pointer-events-none"
          />

          {/* Image Container */}
          <div className="relative overflow-hidden bg-slate-950" style={{ aspectRatio }}>
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

            {/* Glassmorphic Overlay */}
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={
                isHovered
                  ? { opacity: 1, backdropFilter: "blur(12px)" }
                  : { opacity: 0, backdropFilter: "blur(0px)" }
              }
              transition={{ duration: 0.3 }}
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
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
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
                  animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                  className="text-amber-400 font-black text-lg"
                >
                  {price}
                </motion.div>

                {/* Magnetic Button */}
                <motion.button
                  ref={addButtonRef}
                  animate={magneticPos}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(id);
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-amber-500/40 transition-all"
                >
                  <Plus size={18} className="text-white" />
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Metadata Footer (Always Visible) */}
          <motion.div
            animate={isHovered ? { y: -2 } : { y: 0 }}
            className="p-3 flex items-center justify-between bg-black/50 backdrop-blur-sm border-t border-white/5"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">AI Verified</span>
            </div>
            <motion.div
              animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ShieldCheck size={12} className="text-green-500" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
