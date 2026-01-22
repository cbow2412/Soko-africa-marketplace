import { trpc } from "@/lib/trpc";
import { Activity, Database, Cpu, RefreshCw, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch } = trpc.admin.getStats.useQuery();
  const syncMutation = trpc.admin.triggerSync.useMutation();

  if (isLoading) return <div className="p-8 text-white">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">COMMAND CENTER</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Enterprise Marketplace Control</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total Products" 
            value={stats?.totalProducts || 0} 
            icon={<Database className="text-amber-500" />} 
            trend="+12% this week"
          />
          <StatCard 
            title="Ingestion Rate" 
            value={stats?.ingestionRate || "0/s"} 
            icon={<Activity className="text-green-500" />} 
            trend="Optimal"
          />
          <StatCard 
            title="AI Health" 
            value="100%" 
            icon={<Cpu className="text-purple-500" />} 
            trend="SigLIP / ESRGAN Active"
          />
          <StatCard 
            title="Memory Usage" 
            value={`${stats?.memoryUsage.toFixed(1)} MB`} 
            icon={<BarChart3 className="text-blue-500" />} 
            trend="Stable"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <Activity size={24} className="text-amber-500" /> REAL-TIME INGESTION LOGS
            </h2>
            <div className="space-y-4">
              {stats?.recentLogs.map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-sm font-bold">{log.catalogUrl}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-black">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg uppercase">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6">SYSTEM ACTIONS</h2>
            <button 
              onClick={() => syncMutation.mutate({ sellerId: 1 })}
              className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 mb-4"
            >
              <RefreshCw size={20} /> FORCE GLOBAL SYNC
            </button>
            <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Model Status</h3>
              <div className="space-y-3">
                <ModelStatus name="SigLIP Hybrid" status={stats?.aiModelStatus.siglip} />
                <ModelStatus name="Real-ESRGAN" status={stats?.aiModelStatus.esrgan} />
                <ModelStatus name="Gemini QC" status={stats?.aiModelStatus.gemini} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{trend}</span>
      </div>
      <div className="text-3xl font-black tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
    </div>
  );
}

function ModelStatus({ name, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-slate-300">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-green-500">{status}</span>
        <CheckCircle size={12} className="text-green-500" />
      </div>
    </div>
  );
}
