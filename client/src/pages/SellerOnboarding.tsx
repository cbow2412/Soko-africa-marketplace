import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Store, MessageSquare } from "lucide-react";

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
        setSellerId(1); // Mock ID
        toast.success("Registration successful! Starting catalog sync...");
      } else {
        toast.error("Registration failed");
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred");
      setIsSubmitting(false);
    },
  });

  const { data: statusData, refetch: refetchStatus } = trpc.admin.getStats.useQuery(undefined, {
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
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-amber-500 w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Registration Complete!</CardTitle>
            <CardDescription className="text-zinc-400">
              Your store <strong>{formData.businessName}</strong> is being set up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-black/50 rounded-xl p-4 border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sync Status</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  syncStatus?.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500 animate-pulse'
                }`}>
                  {syncStatus?.status || 'Processing'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Products Found</span>
                  <span className="font-bold">{syncStatus?.productsScraped || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">AI Approved</span>
                  <span className="font-bold text-green-500">{syncStatus?.productsApproved || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Flagged/Rejected</span>
                  <span className="font-bold text-red-500">{syncStatus?.productsRejected || 0}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-zinc-500">
              Our Gemini AI is currently analyzing your catalog for quality and authenticity.
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest py-6 rounded-xl"
            >
              Go to Marketplace <ArrowRight className="ml-2 w-4 h-4" />
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
            <Store className="text-black w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Seller Onboarding</h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Join the Soko Africa Network</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Store Details</CardTitle>
                  <CardDescription className="text-zinc-400">Tell us about your business and provide your WhatsApp catalog.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-xs font-black uppercase tracking-widest text-zinc-500">Business Name</Label>
                      <Input 
                        id="businessName" 
                        placeholder="e.g. Gikomba Rare Finds" 
                        className="bg-black border-zinc-800 focus:border-amber-500 transition-colors h-12"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber" className="text-xs font-black uppercase tracking-widest text-zinc-500">WhatsApp Number</Label>
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
                    <Label htmlFor="catalogUrl" className="text-xs font-black uppercase tracking-widest text-zinc-500">WhatsApp Catalog URL</Label>
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
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Paste your WhatsApp Business catalog link here.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Primary Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(val) => setFormData({...formData, category: val})}
                      >
                        <SelectTrigger className="bg-black border-zinc-800 h-12">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Shoes">Shoes</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-black uppercase tracking-widest text-zinc-500">City/Location</Label>
                      <Input 
                        id="city" 
                        placeholder="Nairobi" 
                        className="bg-black border-zinc-800 focus:border-amber-500 transition-colors h-12"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-zinc-500">Store Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Tell buyers what makes your store special..." 
                      className="bg-black border-zinc-800 focus:border-amber-500 transition-colors min-h-[100px]"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                      </>
                    ) : (
                      "Register & Start Sync"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">Register your store with your WhatsApp catalog link.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">Our AI scraper visits your catalog and extracts all products.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">Gemini AI performs quality control and approves your items.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">4</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">Your products go live on the Soko Africa Pinterest grid!</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-500 w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Requirements</h3>
              </div>
              <ul className="text-[10px] text-zinc-400 space-y-2 font-bold uppercase tracking-tight">
                <li>• Active WhatsApp Business Account</li>
                <li>• Public Catalog enabled</li>
                <li>• Clear product images</li>
                <li>• Accurate pricing in KES</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
