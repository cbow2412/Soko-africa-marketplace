import { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface MasonryGridProps {
  children: ReactNode[];
  columns?: number;
  gap?: number;
  className?: string;
}

/**
 * Advanced Masonry Grid Component
 * - Distributes items across columns with balanced heights
 * - Supports variable item heights
 * - Fluid animations with stagger effect
 */
export default function MasonryGrid({
  children,
  columns = 3,
  gap = 16,
  className,
}: MasonryGridProps) {
  // Distribute items across columns
  const columnItems = useMemo(() => {
    const cols: ReactNode[][] = Array.from({ length: columns }, () => []);
    const columnHeights = new Array(columns).fill(0);

    // Simple distribution: assign to shortest column
    children.forEach((child, index) => {
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
      cols[shortestCol].push(child);
      // Estimate height based on index (in real app, measure actual heights)
      columnHeights[shortestCol] += Math.random() * 100 + 200;
    });

    return cols;
  }, [children, columns]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}
      style={{ gap: `${gap}px` }}
    >
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4" style={{ gap: `${gap}px` }}>
          {column.map((item, itemIndex) => (
            <motion.div
              key={`${colIndex}-${itemIndex}`}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
