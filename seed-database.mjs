import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

const categories_data = [
  { name: "Shoes", description: "Footwear and sneakers" },
  { name: "Fashion", description: "Clothing and apparel" },
  { name: "Furniture", description: "Home furniture and decor" },
  { name: "Electronics", description: "Electronic devices" },
  { name: "Accessories", description: "Fashion accessories" },
  { name: "Home Decor", description: "Home decoration items" },
  { name: "Jewelry", description: "Jewelry and watches" },
  { name: "Watches", description: "Timepieces" },
];

const sellers_data = [
  { userId: 1, storeName: "Nairobi Streetwear Hub", description: "Premium streetwear and sneakers", whatsappPhone: "254712345678", rating: "4.50", totalSales: 150 },
  { userId: 1, storeName: "Westlands Fashion Co", description: "Trendy fashion and accessories", whatsappPhone: "254723456789", rating: "4.20", totalSales: 120 },
  { userId: 1, storeName: "Gikomba Rare Finds", description: "Vintage and rare items", whatsappPhone: "254734567890", rating: "4.80", totalSales: 200 },
  { userId: 1, storeName: "Kilimani Tech & Home", description: "Electronics and home items", whatsappPhone: "254745678901", rating: "4.00", totalSales: 100 },
  { userId: 1, storeName: "Mombasa Road Furniture", description: "Quality furniture for homes", whatsappPhone: "254756789012", rating: "4.30", totalSales: 80 },
];

const product_templates = {
  "Shoes": [
    { name: "Nike Air Force 1 High Red", price: "3500" },
    { name: "Nike Air Force 1 Mid Navy", price: "3500" },
    { name: "Adidas Samba Classic White", price: "2800" },
    { name: "Adidas Samba OG Black", price: "2800" },
    { name: "Nike Blazer Mid Vintage", price: "3200" },
    { name: "Converse Chuck Taylor All Star", price: "2200" },
    { name: "Vans Old Skool Classic", price: "2400" },
    { name: "Puma Suede Classic", price: "2500" },
    { name: "New Balance 574", price: "2700" },
    { name: "Reebok Classic Leather", price: "2300" },
  ],
  "Fashion": [
    { name: "Vintage NBA Jersey Bulls", price: "2500" },
    { name: "Harambee Stars Football Jersey", price: "1800" },
    { name: "Vintage Band Tee Nirvana", price: "1500" },
    { name: "Oversized Blazer Burgundy", price: "2200" },
    { name: "Vintage Denim Jacket Blue", price: "2800" },
    { name: "Gikomba Vintage Dress Floral", price: "1800" },
    { name: "Graphic Tee Vintage Print", price: "1200" },
    { name: "Vintage Polo Shirt Ralph Lauren", price: "1900" },
    { name: "Oversized Shirt White", price: "1500" },
  ],
  "Furniture": [
    { name: "Modern Wooden Stool", price: "3500" },
    { name: "Coffee Table Walnut", price: "8500" },
    { name: "Bed Frame Queen Size", price: "15000" },
    { name: "Bookshelf 5-Tier", price: "4200" },
    { name: "Dining Chair Set", price: "12000" },
    { name: "Side Table Oak", price: "2800" },
    { name: "TV Stand Modern", price: "5500" },
  ],
  "Electronics": [
    { name: "Wireless Earbuds", price: "2500" },
    { name: "Power Bank 20000mAh", price: "1800" },
    { name: "Bluetooth Speaker", price: "3200" },
    { name: "USB-C Hub", price: "1200" },
    { name: "Phone Stand", price: "800" },
  ],
  "Accessories": [
    { name: "Leather Wallet", price: "1500" },
    { name: "Canvas Backpack", price: "2200" },
    { name: "Sunglasses UV Protection", price: "1800" },
    { name: "Beanie Winter", price: "800" },
    { name: "Scarf Wool", price: "1200" },
  ],
  "Home Decor": [
    { name: "Wall Art Canvas", price: "2500" },
    { name: "Throw Pillow Set", price: "1800" },
    { name: "Table Lamp", price: "2200" },
    { name: "Area Rug", price: "5500" },
    { name: "Plant Pot Ceramic", price: "1200" },
  ],
  "Jewelry": [
    { name: "Gold Bracelet", price: "4500" },
    { name: "Silver Necklace", price: "3200" },
    { name: "Ring Set", price: "2800" },
    { name: "Earrings Pearl", price: "2200" },
    { name: "Anklet Beaded", price: "1500" },
  ],
  "Watches": [
    { name: "Digital Sports Watch", price: "3500" },
    { name: "Analog Dress Watch", price: "4200" },
    { name: "Smartwatch", price: "6500" },
    { name: "Vintage Mechanical Watch", price: "5800" },
  ],
};

async function seedDatabase() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    
    console.log("Seeding categories...");
    for (const cat of categories_data) {
      await connection.execute(
        "INSERT INTO categories (name, description) VALUES (?, ?)",
        [cat.name, cat.description]
      );
    }

    console.log("Seeding sellers...");
    for (const seller of sellers_data) {
      await connection.execute(
        "INSERT INTO sellers (userId, storeName, description, whatsappPhone, rating, totalSales) VALUES (?, ?, ?, ?, ?, ?)",
        [seller.userId, seller.storeName, seller.description, seller.whatsappPhone, seller.rating, seller.totalSales]
      );
    }

    console.log("Seeding products...");
    let productCount = 0;

    for (const [categoryName, productList] of Object.entries(product_templates)) {
      const category = categories_data.find(c => c.name === categoryName);
      if (!category) continue;

      const categoryId = categories_data.indexOf(category) + 1;

      for (let i = 0; i < 100; i++) {
        const template = productList[i % productList.length];
        const product = {
          sellerId: (i % 5) + 1,
          categoryId,
          name: `${template.name} - Variant ${Math.floor(i / productList.length) + 1}`,
          description: `Authentic Kenyan ${categoryName.toLowerCase()} product. High quality, carefully selected from Nairobi markets.`,
          price: template.price,
          stock: Math.floor(Math.random() * 100) + 5,
          source: "nairobi_market",
        };
        
        await connection.execute(
          "INSERT INTO products (sellerId, categoryId, name, description, price, stock, source) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [product.sellerId, product.categoryId, product.name, product.description, product.price, product.stock, product.source]
        );
        
        productCount++;
        if (productCount % 100 === 0) {
          console.log(`Seeded ${productCount} products...`);
        }
      }
    }

    console.log(`Database seeded successfully with ${productCount} products!`);
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
