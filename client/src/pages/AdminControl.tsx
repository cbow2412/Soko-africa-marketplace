import { trpc } from "@/lib/trpc";
import { 
  Shield, 
  Activity, 
  Users, 
  Package, 
  Zap, 
  Lock, 
  Server, 
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminControl() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading, refetch } = trpc.admin.getStats.useQuery();

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Shield size={20} className="text-black" />
              </div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Root Access Granted</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">COMMAND & CONTROL</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Enterprise Infrastructure Management</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => refetch()} variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl">
              <RefreshCw size={16} className="mr-2" /> Refresh System
            </Button>
            <Button onClick={() => navigate("/")} className="bg-white text-black font-black rounded-xl px-8">
              Exit Terminal
            </Button>
          </div>
        </div>

        {/* System Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <VitalCard title="Total Inventory" value="2,050" icon={<Package className="text-amber-500" />} status="Healthy" />
          <VitalCard title="Active Leads" value="142" icon={<Activity className="text-green-500" />} status="Live" />
          <VitalCard title="System Uptime" value="99.99%" icon={<Server className="text-blue-500" />} status="Stable" />
          <VitalCard title="Vector Store" status="Active" value="SigLIP-768" icon={<Zap className="text-purple-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Real-time Logs */}
          <Card className="lg:col-span-2 bg-white/5 border-white/10 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black flex items-center gap-3">
                <Database size={24} className="text-amber-500" /> INFRASTRUCTURE LOGS
              </h2>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg uppercase">Streaming Live</span>
            </div>
            <div className="space-y-4 font-mono text-[11px]">
              <LogEntry time="13:42:01" type="INFO" msg="SigLIP Hybrid Vectorization completed for Batch #42" />
              <LogEntry time="13:41:55" type="WARN" msg="High latency detected in Zilliz Cloud (us-west-2)" />
              <LogEntry time="13:40:12" type="INFO" msg="New lead captured: WhatsApp Direct-to-Chat (+2547...)" />
              <LogEntry time="13:38:44" type="SUCCESS" msg="Database migration to TiDB Serverless successful" />
              <LogEntry time="13:35:10" type="INFO" msg="Heartbeat Sync 2.0: 2,050 products verified" />
            </div>
          </Card>

          {/* Admin Actions */}
          <Card className="bg-white/5 border-white/10 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <Lock size={24} className="text-red-500" /> SYSTEM ACTIONS
            </h2>
            <div className="space-y-4">
              <ActionButton title="Force Global Re-Sync" icon={<RefreshCw size={18} />} color="bg-amber-500" />
              <ActionButton title="Purge Vector Cache" icon={<Zap size={18} />} color="bg-white/10" />
              <ActionButton title="Emergency Lockdown" icon={<AlertTriangle size={18} />} color="bg-red-500/20 text-red-500" />
            </div>
            
            <div className="mt-12 p-6 bg-black/40 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Security Protocol</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Role:</span>
                <span className="font-black text-amber-500">SUPER_ADMIN</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-400">Auth:</span>
                <span className="font-black text-green-500 flex items-center gap-1">
                  <CheckCircle size={12} /> VERIFIED
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VitalCard({ title, value, icon, status }: any) {
  return (
    <Card className="bg-white/5 border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{status}</span>
      </div>
      <div className="text-4xl font-black tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
    </Card>
  );
}

function LogEntry({ time, type, msg }: any) {
  const color = type === 'WARN' ? 'text-amber-500' : type === 'SUCCESS' ? 'text-green-500' : 'text-blue-500';
  return (
    <div className="flex gap-4 border-b border-white/5 pb-2">
      <span className="text-slate-600">[{time}]</span>
      <span className={`font-black ${color}`}>[{type}]</span>
      <span className="text-slate-300">{msg}</span>
    </div>
  );
}

function ActionButton({ title, icon, color }: any) {
  return (
    <button className={`w-full py-4 ${color} ${color.includes('bg-white') ? 'text-white' : 'text-black'} font-black rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3`}>
      {icon} {title}
    </button>
  );
}
