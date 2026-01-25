/**
 * Soko Africa: High-Fidelity Nairobi Market Data Hydration
 * 
 * This module generates 2,000+ realistic products tailored for the Nairobi luxury market.
 * Categories: Luxury Furniture (Sofas, Beds), Women's Fashion (Dresses, Shoes), Accessories.
 * Pricing: Realistic KES values based on current Nairobi market trends.
 */

export const WHATSAPP_BUSINESS_NUMBER = "254756185209";

const CATEGORIES = [
  { id: 1, name: "Luxury Furniture", sub: ["Chesterfield Sofas", "Velvet Beds", "Marble Coffee Tables", "Dining Sets"] },
  { id: 2, name: "Women's Fashion", sub: ["Evening Gowns", "Office Wear", "Summer Dresses", "Designer Wraps"] },
  { id: 3, name: "Premium Footwear", sub: ["Stiletto Heels", "Designer Sneakers", "Leather Boots", "Casual Flats"] },
  { id: 4, name: "Home Decor", sub: ["Persian Rugs", "Abstract Wall Art", "Crystal Chandeliers", "Luxury Vases"] }
];

// Curated high-quality Unsplash collections for realistic luxury feel
const IMAGE_COLLECTIONS = {
  furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
    "https://images.unsplash.com/photo-1550226844-27ceaa53967c",
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6",
    "https://images.unsplash.com/photo-1503602642458-232111445657",
    "https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9"
  ],
  fashion: [
    "https://images.unsplash.com/photo-1539008835270-217376fc4462",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8",
    "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae",
    "https://images.unsplash.com/photo-1591084728795-1149f32d9866",
    "https://images.unsplash.com/photo-1612336307429-8a88e8d08dbb",
    "https://images.unsplash.com/photo-1609707228014-94ef992067db",
    "https://images.unsplash.com/photo-1581044777550-4cfa60707c03"
  ],
  shoes: [
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    "https://images.unsplash.com/photo-1512374382149-4332c6c02151",
    "https://images.unsplash.com/photo-1515347619252-60a4bdad8886",
    "https://images.unsplash.com/photo-1519415943484-9fa1873496d4"
  ],
  decor: [
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38",
    "https://images.unsplash.com/photo-1534349762230-e0cadf78f5db",
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38",
    "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f",
    "https://images.unsplash.com/photo-1518733057094-95b53143d2a7"
  ]
};

const PRICE_RANGES = {
  1: [45000, 250000], // Furniture
  2: [3500, 25000],   // Fashion
  3: [2500, 15000],   // Shoes
  4: [5000, 45000]    // Decor
};

export function generateNairobiMarketData(count: number = 2000) {
  const products = [];
  
  for (let i = 1; i <= count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const subCategory = category.sub[Math.floor(Math.random() * category.sub.length)];
    
    let imgPool;
    switch(category.id) {
      case 1: imgPool = IMAGE_COLLECTIONS.furniture; break;
      case 2: imgPool = IMAGE_COLLECTIONS.fashion; break;
      case 3: imgPool = IMAGE_COLLECTIONS.shoes; break;
      default: imgPool = IMAGE_COLLECTIONS.decor;
    }
    
    const baseImg = imgPool[Math.floor(Math.random() * imgPool.length)];
    const imageUrl = `${baseImg}?w=1200&h=1200&fit=crop&q=90&sig=${i}`;
    
    const minPrice = PRICE_RANGES[category.id as keyof typeof PRICE_RANGES][0];
    const maxPrice = PRICE_RANGES[category.id as keyof typeof PRICE_RANGES][1];
    const priceVal = Math.floor(Math.random() * (maxPrice - minPrice + 1) + minPrice);
    
    products.push({
      id: i,
      name: `${subCategory} - Premium Edition ${i}`,
      description: `Exquisite ${subCategory.toLowerCase()} sourced for the discerning Nairobi client. High-quality materials, impeccable finish, and timeless design. Available for immediate delivery.`,
      price: priceVal.toLocaleString(),
      imageUrl: imageUrl,
      stock: Math.floor(Math.random() * 10) + 1,
      categoryId: category.id,
      categoryName: category.name,
      sellerPhone: WHATSAPP_BUSINESS_NUMBER,
      sellerId: 1,
      source: "nairobi_luxury_import",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return products;
}
