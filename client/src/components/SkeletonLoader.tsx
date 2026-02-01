import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  heights: number[];
}

export const SkeletonLoader = ({ heights }: SkeletonLoaderProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
      {heights.map((height, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-3xl"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};
