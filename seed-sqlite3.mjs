import sqlite3 from "sqlite3";
import path from "path";

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
  { storeName: "Nairobi Streetwear Hub", description: "Premium streetwear and sneakers", whatsappPhone: "254712345678", rating: 4.5 },
  { storeName: "Westlands Fashion Co", description: "Trendy fashion and accessories", whatsappPhone: "254723456789", rating: 4.2 },
  { storeName: "Gikomba Rare Finds", description: "Vintage and rare items", whatsappPhone: "254734567890", rating: 4.8 },
  { storeName: "Kilimani Tech & Home", description: "Electronics and home items", whatsappPhone: "254745678901", rating: 4.0 },
  { storeName: "Mombasa Road Furniture", description: "Quality furniture for homes", whatsappPhone: "254756789012", rating: 4.3 },
];

async function seed() {
  const dbPath = path.join(process.cwd(), "local.db");
  const db = new sqlite3.Database(dbPath);
  console.log("✅ Connected to local SQLite database at", dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Ensure tables exist
      db.run(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, createdAt INTEGER)`);
      db.run(`CREATE TABLE IF NOT EXISTS sellers (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, storeName TEXT NOT NULL, description TEXT, whatsappPhone TEXT, rating REAL DEFAULT 0, totalSales INTEGER DEFAULT 0, createdAt INTEGER, updatedAt INTEGER)`);
      db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, sellerId INTEGER NOT NULL, categoryId INTEGER NOT NULL, name TEXT NOT NULL, description TEXT, price TEXT NOT NULL, imageUrl TEXT, stock INTEGER DEFAULT 0, source TEXT DEFAULT 'nairobi_market', createdAt INTEGER, updatedAt INTEGER)`);

      // Seed categories
      console.log("Seeding categories...");
      const stmtCat = db.prepare("INSERT OR IGNORE INTO categories (name, description, createdAt) VALUES (?, ?, ?)");
      for (const cat of CATEGORIES) {
        stmtCat.run(cat.name, cat.description, Date.now());
      }
      stmtCat.finalize();

      // Seed sellers
      console.log("Seeding sellers...");
      const stmtSeller = db.prepare("INSERT OR IGNORE INTO sellers (userId, storeName, description, whatsappPhone, rating, totalSales, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (const seller of SELLERS) {
        stmtSeller.run(1, seller.storeName, seller.description, seller.whatsappPhone, seller.rating, 0, Date.now(), Date.now());
      }
      stmtSeller.finalize();

      // Get category IDs and seed products
      db.all("SELECT id, name FROM categories", (err, rows) => {
        if (err) return reject(err);
        const categoryMap = {};
        rows.forEach(r => categoryMap[r.name] = r.id);

        console.log("Seeding 1184 products...");
        const stmtProd = db.prepare("INSERT INTO products (sellerId, categoryId, name, description, price, imageUrl, stock, source, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        const categoryNames = CATEGORIES.map(c => c.name);
        const now = Date.now();

        db.run("BEGIN TRANSACTION");
        for (let i = 0; i < 1184; i++) {
          const categoryName = categoryNames[i % categoryNames.length];
          const categoryId = categoryMap[categoryName];
          const sellerId = (i % SELLERS.length) + 1;
          
          stmtProd.run(
            sellerId,
            categoryId,
            `${categoryName} Item ${i + 1}`,
            `High-quality ${categoryName} from authentic Kenyan markets. Perfect for your needs.`,
            String(1000 + (i % 50) * 100),
            `https://images.unsplash.com/photo-${1500000000000 + (i * 1000000)}?w=500&h=500&fit=crop`,
            5 + (i % 20),
            "nairobi_market",
            now,
            now
          );
          
          if ((i + 1) % 200 === 0) console.log(`  Seeded ${i + 1} products...`);
        }
        db.run("COMMIT", (err) => {
          if (err) reject(err);
          else {
            console.log("✅ Database seeded successfully with 1184 products!");
            stmtProd.finalize();
            db.close();
            resolve(true);
          }
        });
      });
    });
  });
}

seed().catch(console.error);
