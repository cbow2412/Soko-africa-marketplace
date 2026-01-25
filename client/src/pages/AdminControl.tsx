import React, { useState } from "react";
import { trpc } from "../utils/trpc";
import { 
  Terminal, 
  Activity, 
  Database, 
  Cpu, 
  Shield, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  PlusCircle
} from "lucide-react";

const AdminControl = () => {
  const [url, setUrl] = useState("");
  const [logs, setLogs] = useState<string[]>(["[System] Admin Command & Control Center Initialized..."]);
  const [ingestedProduct, setIngestedProduct] = useState<any>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const mutation = trpc.ingestion.scoutAndHydrate.useMutation({
    onSuccess: (data) => {
      addLog(`[Success] Hydrated: ${data.product.name}`);
      addLog(`[Vector] SigLIP-768 embeddings generated.`);
      setIngestedProduct(data.product);
    },
    onError: (error) => {
      addLog(`[Error] Ingestion failed: ${error.message}`);
    }
  });

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    addLog(`[Scout] Initiating ingestion for: ${url}`);
    mutation.mutate({ url });
    setUrl("");
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-green-900 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-tighter">SOKO_ADMIN_v1.0.4</h1>
            <p className="text-xs text-green-800 uppercase tracking-widest">Enterprise Command & Control Center</p>
          </div>
        </div>
        <div className="flex gap-6 text-xs uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Milvus: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>TiDB: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>SigLIP: Ready</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Ingestion Terminal */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-zinc-950 border border-green-900 p-6 rounded-lg shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Scout & Hydrate Terminal</h2>
            </div>
            
            <form onSubmit={handleIngest} className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="PASTE WHATSAPP CATALOG URL (e.g. wa.me/c/...)"
                  className="w-full bg-black border border-green-900 p-4 rounded text-green-400 placeholder-green-900 focus:outline-none focus:border-green-500 transition-colors"
                />
                <button 
                  disabled={mutation.isLoading}
                  className="absolute right-2 top-2 bottom-2 bg-green-900 hover:bg-green-700 text-black px-6 rounded font-bold transition-colors disabled:opacity-50"
                >
                  {mutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "INGEST"}
                </button>
              </div>
            </form>

            {ingestedProduct && (
              <div className="mt-8 border-t border-green-900 pt-6 animate-in fade-in slide-in-from-top-4">
                <div className="flex gap-6">
                  <img 
                    src={ingestedProduct.imageUrl} 
                    alt={ingestedProduct.name} 
                    className="w-32 h-32 object-cover rounded border border-green-900"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white">{ingestedProduct.name}</h3>
                      <span className="text-green-400 font-bold">{ingestedProduct.price}</span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2">{ingestedProduct.description}</p>
                    <div className="flex gap-4 pt-2">
                      <div className="flex items-center gap-1 text-[10px] bg-green-900/20 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        <span>HOTLINKED (META CDN)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] bg-blue-900/20 px-2 py-1 rounded text-blue-400">
                        <Cpu className="w-3 h-3" />
                        <span>SIGLIP-768 VECTORIZED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Logs */}
          <div className="bg-zinc-950 border border-green-900 p-6 rounded-lg h-96 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Live Infrastructure Logs</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 text-xs scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className={log.includes("[Error]") ? "text-red-500" : log.includes("[Success]") ? "text-blue-400" : "text-green-700"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: System Vitals */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="bg-zinc-950 border border-green-900 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">System Vitals</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-widest">
                  <span>Inventory Hydration</span>
                  <span>2,050 / 10,000</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[20.5%] shadow-[0_0_10px_#22c55e]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-widest">
                  <span>Vector Store Load</span>
                  <span>42%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[42%] shadow-[0_0_10px_#3b82f6]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-black border border-green-900 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-white">1.2k</div>
                  <div className="text-[10px] uppercase tracking-widest text-green-800">Leads Generated</div>
                </div>
                <div className="bg-black border border-green-900 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-[10px] uppercase tracking-widest text-green-800">Uptime</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-green-900 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <Database className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full bg-green-900/10 border border-green-900 p-3 rounded text-left text-xs hover:bg-green-900/20 transition-colors flex items-center justify-between">
                <span>RE-INDEX VECTOR STORE</span>
                <Zap className="w-3 h-3" />
              </button>
              <button className="w-full bg-green-900/10 border border-green-900 p-3 rounded text-left text-xs hover:bg-green-900/20 transition-colors flex items-center justify-between">
                <span>FLUSH CACHE (REDIS)</span>
                <Database className="w-3 h-3" />
              </button>
              <button className="w-full bg-red-900/10 border border-red-900 p-3 rounded text-left text-xs text-red-500 hover:bg-red-900/20 transition-colors flex items-center justify-between">
                <span>EMERGENCY SYSTEM LOCK</span>
                <Shield className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControl;
