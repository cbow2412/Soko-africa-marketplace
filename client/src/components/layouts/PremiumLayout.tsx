import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Bell, Menu, X, Sparkles, TrendingUp, Home as HomeIcon } from "lucide-react";
import { useLocation } from "wouter";
import clsx from "clsx";

interface PremiumLayoutProps {
  children: ReactNode;
}

export default function PremiumLayout({ children }: PremiumLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";
  const isProductDetail = location.startsWith("/product/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      {/* Premium Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-2xl"
            : "bg-black/40 backdrop-blur-md border-b border-white/10"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all">
                <span className="text-white font-black text-lg">S</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <h1 className="font-black text-lg tracking-tighter leading-none">SOKO</h1>
                <p className="text-[9px] text-amber-400 font-black tracking-[0.2em] uppercase">Africa</p>
              </div>
            </motion.div>

            {/* Desktop Search Bar */}
            <motion.div
              className="hidden md:flex flex-1 max-w-2xl mx-8"
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className={clsx(
                  "w-full flex items-center gap-3 rounded-2xl px-5 py-3 transition-all duration-300",
                  searchActive
                    ? "bg-white/15 border border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-white/5 border border-white/10 hover:bg-white/8"
                )}
              >
                <Search size={18} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Discover luxury finds in Nairobi..."
                  onFocus={() => setSearchActive(true)}
                  onBlur={() => setSearchActive(false)}
                  className="bg-transparent outline-none flex-1 text-sm placeholder-slate-600 font-medium"
                />
                <motion.div
                  animate={{ rotate: searchActive ? 0 : 0 }}
                  className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black text-slate-500"
                >
                  <Sparkles size={12} className="text-amber-500" /> AI
                </motion.div>
              </div>
            </motion.div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
              >
                <TrendingUp size={14} className="text-amber-500" /> Trending
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/seller/onboarding")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                <Plus size={16} /> Ingest
              </motion.button>

              <div className="h-8 w-[1px] bg-white/10"></div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 hover:bg-white/5 rounded-xl transition-colors relative group"
              >
                <Bell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full"
                ></motion.span>
              </motion.button>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 hover:bg-white/5 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-white" />
              ) : (
                <Menu size={24} className="text-white" />
              )}
            </motion.button>
          </div>

          {/* Mobile Search */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pb-4"
              >
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <Search size={18} className="text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent outline-none flex-1 text-sm placeholder-slate-600"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isHome && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-black/95 backdrop-blur-xl border-t border-white/10"
        >
          <div className="flex items-center justify-around px-4 py-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1 text-amber-500"
            >
              <HomeIcon size={24} />
              <span className="text-[8px] font-black uppercase tracking-widest">Discover</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/seller/onboarding")}
              className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/40 border-4 border-black transform -mt-8"
            >
              <Plus size={28} className="text-white" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors"
            >
              <TrendingUp size={24} />
              <span className="text-[8px] font-black uppercase tracking-widest">Trending</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
