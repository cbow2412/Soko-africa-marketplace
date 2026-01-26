import fs from 'fs';
import path from 'path';

const categories = [
  { id: 1, name: "Luxury Furniture", slug: "luxury-furniture" },
  { id: 2, name: "Women's Fashion", slug: "womens-fashion" },
  { id: 3, name: "Premium Footwear", slug: "premium-footwear" },
  { id: 4, name: "Home Decor", slug: "home-decor" }
];

const generateProducts = (count) => {
  const products = [];
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    products.push({
      id: i,
      name: `Nairobi Luxury Item ${i}`,
      description: `Premium quality item from the heart of Nairobi. Hand-selected for the Soko Africa Marketplace.`,
      price: Math.floor(Math.random() * 50000) + 5000,
      currency: "KES",
      categoryId: category.id,
      categoryName: category.name,
      imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=800&q=80`,
      sellerId: 1,
      sellerName: "Nairobi Premium Seller",
      whatsappNumber: "+254756185209",
      createdAt: new Date().toISOString()
    });
  }
  return products;
};

const main = () => {
  console.log("🚀 Generating 2050 static products...");
  const products = generateProducts(2050);
  const dataDir = path.join(process.cwd(), 'public', 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
  console.log(`✅ Successfully generated products.json in ${dataDir}`);
};

main();
