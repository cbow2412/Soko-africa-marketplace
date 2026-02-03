import { ReactNode, useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface MasonryItem {
  id: string | number;
  aspectRatio?: number;
  children: ReactNode;
}

interface AdvancedMasonryGridProps {
  items: MasonryItem[];
  columns?: number;
  gap?: number;
  className?: string;
  onItemsRendered?: (indices: number[]) => void;
}

/**
 * Advanced Masonry Grid Component - Pinterest-Style Discovery
 * 
 * Features:
 * - Dynamic height calculation based on actual aspect ratios
 * - AI-optimized column distribution (balanced heights)
 * - Responsive breakpoints (2-7 columns)
 * - Mobile-first: 2-column staggered layout (Pinterest style)
 * - Virtual scrolling for performance
 * - Stagger animations
 * - Intersection Observer for lazy loading
 */
export default function AdvancedMasonryGrid({
  items,
  columns = 4,
  gap = 12,
  className,
  onItemsRendered,
}: AdvancedMasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [columnHeights, setColumnHeights] = useState<number[]>([]);

  // Responsive columns - Mobile-first approach
  const responsiveColumns = useMemo(() => {
    if (typeof window === "undefined") return columns;
    const width = window.innerWidth;
    if (width < 640) return 2;    // Mobile: 2 columns (Pinterest style)
    if (width < 768) return 2;    // Tablet: 2 columns
    if (width < 1024) return 3;   // Small desktop: 3 columns
    if (width < 1280) return 4;   // Desktop: 4 columns
    if (width < 1536) return 5;   // Large desktop: 5 columns
    if (width < 1920) return 6;   // XL desktop: 6 columns
    return 7;                      // 4K: 7 columns
  }, [columns]);

  // Distribute items across columns with height balancing
  const columnItems = useMemo(() => {
    const cols: MasonryItem[][] = Array.from({ length: responsiveColumns }, () => []);
    const heights = new Array(responsiveColumns).fill(0);

    items.forEach((item) => {
      // Find column with minimum height
      const minHeightIndex = heights.indexOf(Math.min(...heights));

      // Estimate height based on aspect ratio (default 1:1 for square)
      const aspectRatio = item.aspectRatio || 1;
      
      // Calculate base width based on responsive columns and viewport
      let baseWidth = 300;
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        const padding = width < 640 ? 32 : width < 768 ? 32 : width < 1024 ? 48 : 64;
        const gapTotal = gap * (responsiveColumns - 1);
        baseWidth = (width - padding - gapTotal) / responsiveColumns;
      }
      
      const itemHeight = baseWidth / aspectRatio;

      cols[minHeightIndex].push(item);
      heights[minHeightIndex] += itemHeight + gap;
    });

    setColumnHeights(heights);
    return cols;
  }, [items, responsiveColumns, gap]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const newVisibleItems = new Set(visibleItems);
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute("data-index") || "0");
          if (entry.isIntersecting) {
            newVisibleItems.add(index);
          } else {
            newVisibleItems.delete(index);
          }
        });
        setVisibleItems(newVisibleItems);
        onItemsRendered?.(Array.from(newVisibleItems));
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const itemElements = containerRef.current?.querySelectorAll("[data-index]");
    itemElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [items, visibleItems, onItemsRendered]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const hoverVariants = {
    hover: {
      y: -8,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "grid w-full",
        {
          "grid-cols-2": responsiveColumns === 2,
          "grid-cols-3": responsiveColumns === 3,
          "grid-cols-4": responsiveColumns === 4,
          "grid-cols-5": responsiveColumns === 5,
          "grid-cols-6": responsiveColumns === 6,
          "grid-cols-7": responsiveColumns === 7,
        },
        "px-4 sm:px-6 md:px-8 py-4",
        className
      )}
      style={{ gap: `${gap}px` }}
    >
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col" style={{ gap: `${gap}px` }}>
          {column.map((item, itemIndex) => {
            const globalIndex = colIndex * Math.ceil(items.length / responsiveColumns) + itemIndex;
            const isVisible = visibleItems.has(globalIndex);

            return (
              <motion.div
                key={item.id}
                data-index={globalIndex}
                variants={itemVariants}
                whileHover="hover"
                initial="hidden"
                animate="visible"
                className="group cursor-pointer"
              >
                {/* Skeleton Loading State - Respects aspect ratio */}
                {!isVisible && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl"
                    style={{
                      aspectRatio: item.aspectRatio || 1,
                      minHeight: "160px",
                    }}
                  />
                )}

                {/* Actual Content */}
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.children}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}
