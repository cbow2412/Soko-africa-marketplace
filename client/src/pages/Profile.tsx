import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Heart, Settings, LogOut, Edit2, Save, X, Mail, MapPin, Phone, Store, TrendingUp, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UserProfile {
  id: string;
  userId: string;
  storeName?: string;
  storeDescription?: string;
  city?: string;
  country?: string;
  totalSales: number;
  totalRating: number;
  totalReviews: number;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profileImage?: string;
    role: string;
  };
}

export default function Profile() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    storeName: "",
    storeDescription: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditData({
          storeName: data.storeName || "",
          storeDescription: data.storeDescription || "",
          city: data.city || "",
          country: data.country || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Profile not found</p>
          <Button onClick={() => navigate("/")} className="bg-amber-600 hover:bg-amber-700">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">Profile</h1>
          <div className="flex gap-3">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-700/50 text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-4xl">👤</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {profile.user.firstName} {profile.user.lastName}
                </h2>
                <div className="flex items-center gap-2 text-amber-500 font-bold mb-3">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {profile.totalRating.toFixed(1)} ({profile.totalReviews} reviews)
                </div>
                <p className="text-slate-400 text-sm">{profile.user.role === "seller" ? "Seller Account" : "Buyer Account"}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-amber-500 mb-1">{profile.totalSales}</div>
              <p className="text-slate-400 text-sm">Total Sales</p>
            </div>
          </div>
        </Card>

        {/* Edit Mode */}
        {isEditing && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Store Name</label>
                <input
                  type="text"
                  value={editData.storeName}
                  onChange={(e) => setEditData({ ...editData, storeName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="Your store name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Store Description</label>
                <textarea
                  value={editData.storeDescription}
                  onChange={(e) => setEditData({ ...editData, storeDescription: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="Tell customers about your store"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    value={editData.city}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={editData.country}
                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveProfile} className="flex-1 bg-amber-600 hover:bg-amber-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-500" />
              Email
            </h3>
            <p className="text-slate-300">{profile.user.email}</p>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-500" />
              Phone
            </h3>
            <p className="text-slate-300">{profile.user.phoneNumber || "Not provided"}</p>
          </Card>

          {profile.storeName && (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                Store Name
              </h3>
              <p className="text-slate-300">{profile.storeName}</p>
            </Card>
          )}

          {profile.city && (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Location
              </h3>
              <p className="text-slate-300">
                {profile.city}
                {profile.country && `, ${profile.country}`}
              </p>
            </Card>
          )}
        </div>

        {/* Store Description */}
        {profile.storeDescription && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">About Store</h3>
            <p className="text-slate-300 leading-relaxed">{profile.storeDescription}</p>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6 cursor-pointer hover:border-amber-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">My Listings</p>
                <p className="text-2xl font-black text-white">0</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6 cursor-pointer hover:border-amber-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Watchlist</p>
                <p className="text-2xl font-black text-white">0</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6 cursor-pointer hover:border-amber-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Sales</p>
                <p className="text-2xl font-black text-white">{profile.totalSales}</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
