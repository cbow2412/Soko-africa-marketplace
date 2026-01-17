import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const CATEGORIES = [
  { name: "Shoes", description: "Footwear and sneakers" },
  { name: "Fashion", description: "Clothing and apparel" },
  { name: "Furniture", description: "Home furniture and decor" },
  { name: "Electronics", description: "Electronic devices" },
  { name: "Accessories", description: "Fashion accessories" },
  { name: "Home Decor", description: "Home decoration items" },
  { name: "Jewelry", description: "Jewelry and watches" },
  { name: "Watches", description: "Timepieces" },
];

const SELLERS = [
  { storeName: "Nairobi Streetwear Hub", description: "Premium streetwear and sneakers", whatsappPhone: "254712345678", rating: "4.50" },
  { storeName: "Westlands Fashion Co", description: "Trendy fashion and accessories", whatsappPhone: "254723456789", rating: "4.20" },
  { storeName: "Gikomba Rare Finds", description: "Vintage and rare items", whatsappPhone: "254734567890", rating: "4.80" },
  { storeName: "Kilimani Tech & Home", description: "Electronics and home items", whatsappPhone: "254745678901", rating: "4.00" },
  { storeName: "Mombasa Road Furniture", description: "Quality furniture for homes", whatsappPhone: "254756789012", rating: "4.30" },
];

// Generate 1184 products
const PRODUCTS_DATA = [];
const categoryNames = CATEGORIES.map(c => c.name);

for (let i = 0; i < 1184; i++) {
  const category = categoryNames[i % categoryNames.length];
  PRODUCTS_DATA.push({
    name: `${category} Item ${i + 1}`,
    description: `High-quality ${category} from authentic Kenyan markets. Perfect for your needs.`,
    price: String(1000 + (i % 50) * 100),
    category: category,
    image: `https://images.unsplash.com/photo-${1500000000000 + (i * 1000)}?w=500&h=500&fit=crop`,
    stock: 5 + (i % 20),
  });
}

async function seedDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log("✅ Connected to database");

    // Seed categories
    console.log("Seeding categories...");
    for (const cat of CATEGORIES) {
      await connection.execute(
        "INSERT IGNORE INTO categories (name, description) VALUES (?, ?)",
        [cat.name, cat.description]
      );
    }

    // Seed sellers
    console.log("Seeding sellers...");
    for (const seller of SELLERS) {
      await connection.execute(
        "INSERT IGNORE INTO sellers (userId, storeName, description, whatsappPhone, rating, totalSales) VALUES (?, ?, ?, ?, ?, ?)",
        [1, seller.storeName, seller.description, seller.whatsappPhone, seller.rating, 0]
      );
    }

    // Get categories
    const [categories] = await connection.execute("SELECT id, name FROM categories");
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    console.log("Seeding 1184 products...");
    let count = 0;
    for (const product of PRODUCTS_DATA) {
      const categoryId = categoryMap[product.category];
      await connection.execute(
        "INSERT INTO products (sellerId, categoryId, name, description, price, imageUrl, stock, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          (count % 5) + 1,
          categoryId,
          product.name,
          product.description,
          product.price,
          product.image,
          product.stock,
          "nairobi_market"
        ]
      );
      count++;
      if (count % 200 === 0) {
        console.log(`  Seeded ${count} products...`);
      }
    }
    console.log(`✅ Database seeded successfully with ${count} products!`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seedDatabase();
