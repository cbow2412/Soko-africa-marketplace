import { useLocation } from "wouter";
import { ArrowLeft, User, Settings, Shield, Bell, CreditCard, LogOut, Package, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Profile() {
  const [, navigate] = useLocation();

  const menuItems = [
    { icon: <Package size={20} />, label: "My Orders", path: "/orders" },
    { icon: <Heart size={20} />, label: "Watchlist", path: "/watchlist" },
    { icon: <Bell size={20} />, label: "Notifications", path: "#" },
    { icon: <CreditCard size={20} />, label: "Payments", path: "#" },
    { icon: <Shield size={20} />, label: "Privacy & Security", path: "#" },
    { icon: <Settings size={20} />, label: "Settings", path: "#" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center gap-4 z-50">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black tracking-tighter">PROFILE</h1>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Info */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 mb-4">
            <User size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Soko User</h2>
          <p className="text-slate-500 text-sm font-medium">Nairobi, Kenya</p>
          <Button className="mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-8">
            Edit Profile
          </Button>
        </div>

        {/* Menu Items */}
        <div className="grid gap-3">
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className="bg-white/5 border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="text-amber-500 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              <div className="text-slate-600 group-hover:text-white transition-colors">
                <ArrowLeft size={16} className="rotate-180" />
              </div>
            </Card>
          ))}
          
          <Card className="bg-red-500/5 border-red-500/10 p-4 flex items-center justify-between hover:bg-red-500/10 transition-all cursor-pointer group mt-4">
            <div className="flex items-center gap-4">
              <div className="text-red-500">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-sm tracking-tight text-red-500">Log Out</span>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
