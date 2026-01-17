import sqlite3
import time
import os

CATEGORIES = [
    ("Shoes", "Footwear and sneakers"),
    ("Fashion", "Clothing and apparel"),
    ("Furniture", "Home furniture and decor"),
    ("Electronics", "Electronic devices"),
    ("Accessories", "Fashion accessories"),
    ("Home Decor", "Home decoration items"),
    ("Jewelry", "Jewelry and watches"),
    ("Watches", "Timepieces"),
]

SELLERS = [
    (1, "Nairobi Streetwear Hub", "Premium streetwear and sneakers", "254712345678", 4.5, 0),
    (1, "Westlands Fashion Co", "Trendy fashion and accessories", "254723456789", 4.2, 0),
    (1, "Gikomba Rare Finds", "Vintage and rare items", "254734567890", 4.8, 0),
    (1, "Kilimani Tech & Home", "Electronics and home items", "254745678901", 4.0, 0),
    (1, "Mombasa Road Furniture", "Quality furniture for homes", "254756789012", 4.3, 0),
]

def seed():
    db_path = os.path.join(os.getcwd(), "local.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print(f"✅ Connected to local SQLite database at {db_path}")

    # Ensure tables exist
    cursor.execute("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, createdAt INTEGER)")
    cursor.execute("CREATE TABLE IF NOT EXISTS sellers (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, storeName TEXT NOT NULL, description TEXT, whatsappPhone TEXT, rating REAL DEFAULT 0, totalSales INTEGER DEFAULT 0, createdAt INTEGER, updatedAt INTEGER)")
    cursor.execute("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, sellerId INTEGER NOT NULL, categoryId INTEGER NOT NULL, name TEXT NOT NULL, description TEXT, price TEXT NOT NULL, imageUrl TEXT, stock INTEGER DEFAULT 0, source TEXT DEFAULT 'nairobi_market', createdAt INTEGER, updatedAt INTEGER)")

    now = int(time.time() * 1000)

    # Seed categories
    print("Seeding categories...")
    for name, desc in CATEGORIES:
        cursor.execute("INSERT OR IGNORE INTO categories (name, description, createdAt) VALUES (?, ?, ?)", (name, desc, now))

    # Seed sellers
    print("Seeding sellers...")
    for user_id, store, desc, phone, rating, sales in SELLERS:
        cursor.execute("INSERT OR IGNORE INTO sellers (userId, storeName, description, whatsappPhone, rating, totalSales, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
                       (user_id, store, desc, phone, rating, sales, now, now))

    # Get category IDs
    cursor.execute("SELECT id, name FROM categories")
    category_map = {name: id for id, name in cursor.fetchall()}

    # Seed 1184 products
    print("Seeding 1184 products...")
    category_names = [c[0] for c in CATEGORIES]
    
    products = []
    for i in range(1184):
        cat_name = category_names[i % len(category_names)]
        cat_id = category_map[cat_name]
        seller_id = (i % len(SELLERS)) + 1
        
        products.append((
            seller_id,
            cat_id,
            f"{cat_name} Item {i + 1}",
            f"High-quality {cat_name} from authentic Kenyan markets. Perfect for your needs.",
            str(1000 + (i % 50) * 100),
            f"https://images.unsplash.com/photo-{1500000000000 + (i * 1000000)}?w=500&h=500&fit=crop",
            5 + (i % 20),
            "nairobi_market",
            now,
            now
        ))

    cursor.executemany("INSERT INTO products (sellerId, categoryId, name, description, price, imageUrl, stock, source, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", products)
    
    conn.commit()
    print(f"✅ Database seeded successfully with {len(products)} products!")
    conn.close()

if __name__ == "__main__":
    seed()
