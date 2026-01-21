import { useLocation } from "wouter";
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Orders() {
  const [, setLocation] = useLocation();

  // Mock orders for demonstration
  const orders = [
    { id: 1, name: "Nairobi Streetwear Hoodie", price: "KSh 2,500", status: "Delivered", date: "2 hours ago", image: "https://picsum.photos/seed/hoodie/200/200" },
    { id: 2, name: "Vintage Leather Boots", price: "KSh 4,800", status: "In Transit", date: "Yesterday", image: "https://picsum.photos/seed/boots/200/200" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setLocation("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Your Orders</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Track your purchases</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardContent className="p-4 flex gap-4">
              <img src={order.image} className="w-20 h-20 rounded-lg object-cover" alt={order.name} />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-zinc-200">{order.name}</h3>
                  <span className="text-amber-500 font-black text-sm">{order.price}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {order.status === "Delivered" ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Clock size={14} className="text-amber-500" />
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === "Delivered" ? "text-green-500" : "text-amber-500"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">{order.date}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
