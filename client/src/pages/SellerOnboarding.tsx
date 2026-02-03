import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowRight, MessageSquare, Zap, ShieldCheck, Globe } from "lucide-react";

export default function SellerOnboarding() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    whatsappNumber: "",
    catalogUrl: "",
    category: "Fashion",
    city: "Nairobi",
    description: "",
  });

  const registerMutation = trpc.admin.triggerSync.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSellerId(1); // Mock ID for the session
        toast.success("Ingestion started! Vectorizing your catalog...");
      } else {
        toast.error("Ingestion failed to initialize");
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred");
      setIsSubmitting(false);
    },
  });

  const { data: statusData } = trpc.admin.getStats.useQuery(undefined, {
    enabled: !!sellerId,
    refetchInterval: 3000
  }) as any;

  useEffect(() => {
    if (statusData) {
      setSyncStatus(statusData);
    }
  }, [statusData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    registerMutation.mutate(formData);
  };

  if (sellerId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-amber-500 w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Vector Sync Active</CardTitle>
            <CardDescription className="text-zinc-400">
              Globalizing <strong>{formData.businessName}</strong> on Soko Africa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-black/50 rounded-xl p-4 border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sync Engine Status</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  syncStatus?.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500 animate-pulse'
                }`}>
                  {syncStatus?.status || 'Vectorizing'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Meta CDN Links Scraped</span>
                  <span className="font-bold">{syncStatus?.productsScraped || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">SigLIP Vectors Generated</span>
                  <span className="font-bold text-amber-500">{syncStatus?.productsApproved || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Milvus Indexing</span>
                  <span className="font-bold text-green-500">Active</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Zero-Copy Architecture: No images are stored. Directly leveraging Meta Infrastructure.
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest py-6 rounded-xl transition-all"
            >
              Enter Discovery Hub <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="text-black w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">WhatsApp Ingestor</h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Globalize your business in seconds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Enterprise Ingestion</CardTitle>
                  <CardDescription className="text-zinc-400">Paste your WhatsApp Business catalog to bridge taste with the Kenyan market.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-xs font-black uppercase tracking-widest text-zinc-500">Business Name</Label>
                      <Input 
                        id="businessName" 
                        placeholder="e.g. Nairobi Elite Collections" 
                        className="bg-black border-zinc-800 focus:border-amber-500 transition-colors h-12"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber" className="text-xs font-black uppercase tracking-widest text-zinc-500">Business WhatsApp</Label>
                      <Input 
                        id="whatsappNumber" 
                        placeholder="+254..." 
                        className="bg-black border-zinc-800 focus:border-amber-500 transition-colors h-12"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="catalogUrl" className="text-xs font-black uppercase tracking-widest text-zinc-500">WhatsApp Catalog Link</Label>
                    <div className="relative">
                      <Input 
                        id="catalogUrl" 
                        placeholder="https://wa.me/c/..." 
                        className="bg-black border-zinc-800 focus:border-amber-500 transition-colors h-12 pl-10"
                        value={formData.catalogUrl}
                        onChange={(e) => setFormData({...formData, catalogUrl: e.target.value})}
                        required
                      />
                      <MessageSquare className="absolute left-3 top-3.5 text-zinc-600 w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Primary Inventory Type</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(val) => setFormData({...formData, category: val})}
                      >
                        <SelectTrigger className="bg-black border-zinc-800 h-12">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Shoes">Shoes</SelectItem>
                          <SelectItem value="Dresses">Dresses</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Jewelry">Jewelry</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-black uppercase tracking-widest text-zinc-500">Hub Location</Label>
                      <Input 
                        id="city" 
                        placeholder="Nairobi" 
                        className="bg-black border-zinc-800 focus:border-amber-500 transition-colors h-12"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Vectorizing Catalog...
                      </>
                    ) : (
                      "Globalize Inventory"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-4">Enterprise Engine</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Zap size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter">Real-Time Sync</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Directly bridges your WhatsApp inventory to our global discovery hub.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter">SigLIP Vectorization</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Advanced AI analyzes your products to match with buyer taste profiles.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter">Zero-Copy Architecture</p>
                    <p className="text-[10px] text-zinc-500 mt-1">We never store your images. We use Meta's global CDN for maximum speed.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
