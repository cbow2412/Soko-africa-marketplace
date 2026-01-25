import { useLocation } from "wouter";
import { ArrowLeft, Bell, Shield, CreditCard, User, Globe, Moon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center gap-4 z-50">
        <button onClick={() => navigate("/profile")} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black tracking-tighter uppercase">Settings</h1>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <section className="mb-8">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Account Preferences</h2>
          <div className="grid gap-3">
            <SettingItem 
              icon={<User size={20} className="text-amber-500" />} 
              title="Personal Information" 
              description="Update your name, email, and phone number"
            />
            <SettingItem 
              icon={<Globe size={20} className="text-blue-500" />} 
              title="Language & Region" 
              description="English (Kenya)"
            />
            <SettingToggle 
              icon={<Moon size={20} className="text-purple-500" />} 
              title="Dark Mode" 
              description="Always on for enterprise focus"
              defaultChecked={true}
              disabled={true}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Security & Privacy</h2>
          <div className="grid gap-3">
            <SettingItem 
              icon={<Shield size={20} className="text-green-500" />} 
              title="Two-Factor Authentication" 
              description="Secure your account with 2FA"
            />
            <SettingToggle 
              icon={<Bell size={20} className="text-orange-500" />} 
              title="Push Notifications" 
              description="Get alerts for price drops and new arrivals"
              defaultChecked={true}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Payments</h2>
          <div className="grid gap-3">
            <SettingItem 
              icon={<CreditCard size={20} className="text-emerald-500" />} 
              title="M-Pesa Integration" 
              description="Manage your linked M-Pesa numbers"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Support</h2>
          <div className="grid gap-3">
            <SettingItem 
              icon={<HelpCircle size={20} className="text-slate-400" />} 
              title="Help Center" 
              description="FAQs and customer support"
            />
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Soko Africa Enterprise v1.0.4</p>
        </div>
      </main>
    </div>
  );
}

function SettingItem({ icon, title, description }: any) {
  return (
    <Card className="bg-white/5 border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <ArrowLeft size={16} className="rotate-180 text-slate-600 group-hover:text-white transition-colors" />
    </Card>
  );
}

function SettingToggle({ icon, title, description, defaultChecked, disabled }: any) {
  return (
    <Card className="bg-white/5 border-white/10 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/5 rounded-xl">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <Switch defaultChecked={defaultChecked} disabled={disabled} />
    </Card>
  );
}
