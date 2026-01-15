import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

const PRODUCTS_DATA = [
  // Air Force Shoes (100 products)
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Nike Air Force 1 ${['High', 'Mid', 'Low'][i % 3]} ${['White', 'Black', 'Red', 'Blue', 'Green'][i % 5]}`,
    description: "Iconic Nike Air Force 1 sneaker. Premium quality authentic shoe from Nairobi markets.",
    price: String(3200 + (i % 10) * 100),
    category: "Shoes",
    image: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop`,
    stock: 5 + (i % 50),
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Nike Air Force 1 Custom ${['Painted', 'Vintage', 'Rare'][i % 3]} ${i + 1}`,
    description: "Custom modified Nike Air Force 1. Unique piece from Gikomba vintage market.",
    price: String(4500 + (i % 20) * 200),
    category: "Shoes",
    image: `https://images.unsplash.com/photo-1595777712802-fde2084deae7?w=500&h=500&fit=crop`,
    stock: 2 + (i % 15),
  })),

  // Adidas Sambas (100 products)
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Adidas Samba ${['OG', 'Classic', 'Vintage'][i % 3]} ${['White', 'Black', 'Green', 'Blue'][i % 4]}`,
    description: "Classic Adidas Samba sneaker. Authentic footwear from Kenya's top sellers.",
    price: String(2800 + (i % 10) * 100),
    category: "Shoes",
    image: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop`,
    stock: 8 + (i % 40),
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Adidas Samba Limited ${['Edition', 'Collab', 'Rare'][i % 3]} ${i + 1}`,
    description: "Limited edition Adidas Samba. Collector's item from Nairobi streetwear hub.",
    price: String(3800 + (i % 15) * 150),
    category: "Shoes",
    image: `https://images.unsplash.com/photo-1595777712802-fde2084deae7?w=500&h=500&fit=crop`,
    stock: 3 + (i % 20),
  })),

  // Louis Vuitton (100 products)
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Louis Vuitton ${['Monogram', 'Damier', 'Epi'][i % 3]} ${['Bag', 'Wallet', 'Belt', 'Shoes'][i % 4]}`,
    description: "Luxury Louis Vuitton item. Premium authenticated piece from Westlands.",
    price: String(15000 + (i % 30) * 500),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop`,
    stock: 2 + (i % 8),
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Louis Vuitton Vintage ${['Speedy', 'Neverfull', 'Pochette'][i % 3]} ${i + 1}`,
    description: "Vintage Louis Vuitton collector's piece. Rare find from Gikomba market.",
    price: String(12000 + (i % 25) * 400),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop`,
    stock: 1 + (i % 5),
  })),

  // Furniture (200 products)
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Modern Wooden ${['Stool', 'Table', 'Shelf', 'Bench'][i % 4]} ${['Oak', 'Walnut', 'Mahogany'][i % 3]}`,
    description: "Handcrafted wooden furniture. Beautiful piece from Mombasa Road furniture market.",
    price: String(3500 + (i % 15) * 300),
    category: "Furniture",
    image: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop`,
    stock: 3 + (i % 10),
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Vintage ${['Dining', 'Coffee', 'Side'][i % 3]} Table ${i + 1}`,
    description: "Vintage furniture piece. Authentic antique from Nairobi estates.",
    price: String(8500 + (i % 20) * 400),
    category: "Furniture",
    image: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop`,
    stock: 1 + (i % 5),
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Contemporary ${['Bed', 'Sofa', 'Cabinet'][i % 3]} Frame ${i + 1}`,
    description: "Modern furniture design. Quality piece from Kilimani showrooms.",
    price: String(12000 + (i % 25) * 500),
    category: "Furniture",
    image: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop`,
    stock: 2 + (i % 8),
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    name: `Decorative ${['Shelf', 'Stand', 'Rack', 'Unit'][i % 4]} ${i + 1}`,
    description: "Decorative furniture piece. Perfect for home styling from Westlands.",
    price: String(4200 + (i % 12) * 250),
    category: "Furniture",
    image: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop`,
    stock: 4 + (i % 15),
  })),

  // Fashion (150 products)
  ...Array.from({ length: 30 }, (_, i) => ({
    name: `Vintage NBA Jersey ${['Bulls', 'Lakers', 'Celtics', 'Warriors'][i % 4]} ${i + 1}`,
    description: "Authentic vintage NBA jersey. Collector's item from Gikomba market.",
    price: String(2500 + (i % 10) * 150),
    category: "Fashion",
    image: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop`,
    stock: 2 + (i % 8),
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    name: `Vintage Band Tee ${['Nirvana', 'Beatles', 'Pink Floyd', 'Led Zeppelin'][i % 4]} ${i + 1}`,
    description: "Rare vintage band t-shirt. Authentic piece from estate sales.",
    price: String(1500 + (i % 8) * 100),
    category: "Fashion",
    image: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop`,
    stock: 1 + (i % 5),
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    name: `Oversized ${['Blazer', 'Shirt', 'Jacket'][i % 3]} ${['Burgundy', 'Navy', 'Black', 'Cream'][i % 4]}`,
    description: "Trendy oversized piece. Fashion-forward item from Westlands Fashion Co.",
    price: String(2200 + (i % 8) * 150),
    category: "Fashion",
    image: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop`,
    stock: 3 + (i % 12),
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    name: `Gikomba Vintage Dress ${['Floral', 'Striped', 'Solid'][i % 3]} ${i + 1}`,
    description: "Beautiful vintage dress from Gikomba market. Unique style piece.",
    price: String(1800 + (i % 6) * 100),
    category: "Fashion",
    image: `https://images.unsplash.com/photo-1595777712802-fde2084deae7?w=500&h=500&fit=crop`,
    stock: 2 + (i % 10),
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    name: `Graphic Tee ${['Vintage Print', 'Retro Logo', 'Rare Design'][i % 3]} ${i + 1}`,
    description: "Stylish graphic t-shirt. Authentic vintage from Nairobi markets.",
    price: String(1200 + (i % 5) * 100),
    category: "Fashion",
    image: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop`,
    stock: 5 + (i % 20),
  })),

  // Electronics (100 products)
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Wireless Earbuds ${['Pro', 'Max', 'Plus'][i % 3]} ${i + 1}`,
    description: "High-quality wireless earbuds. Latest technology from Kilimani Tech.",
    price: String(2500 + (i % 8) * 200),
    category: "Electronics",
    image: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop`,
    stock: 5 + (i % 20),
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Power Bank ${['20000', '30000', '50000'][i % 3]}mAh ${i + 1}`,
    description: "Reliable power bank. Essential tech accessory from Nairobi markets.",
    price: String(1800 + (i % 6) * 150),
    category: "Electronics",
    image: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop`,
    stock: 8 + (i % 25),
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Bluetooth Speaker ${['Mini', 'Pro', 'Max'][i % 3]} ${i + 1}`,
    description: "Portable Bluetooth speaker. Great sound quality from tech stores.",
    price: String(3200 + (i % 10) * 200),
    category: "Electronics",
    image: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop`,
    stock: 4 + (i % 15),
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `USB-C Hub ${['7-in-1', '9-in-1', '11-in-1'][i % 3]} ${i + 1}`,
    description: "Multi-port USB hub. Essential for modern devices from tech hub.",
    price: String(1200 + (i % 4) * 100),
    category: "Electronics",
    image: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop`,
    stock: 10 + (i % 30),
  })),

  // Accessories (100 products)
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Leather Wallet ${['Bifold', 'Trifold', 'Cardholder'][i % 3]} ${i + 1}`,
    description: "Premium leather wallet. Durable and stylish from Nairobi markets.",
    price: String(1500 + (i % 6) * 100),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop`,
    stock: 5 + (i % 15),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Canvas Backpack ${['Vintage', 'Modern', 'Hiking'][i % 3]} ${i + 1}`,
    description: "Durable canvas backpack. Perfect for travel and daily use.",
    price: String(2200 + (i % 8) * 150),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop`,
    stock: 3 + (i % 12),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Sunglasses ${['UV Protection', 'Polarized', 'Vintage'][i % 3]} ${i + 1}`,
    description: "Stylish sunglasses with UV protection. Fashion accessory from stores.",
    price: String(1800 + (i % 7) * 120),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop`,
    stock: 6 + (i % 20),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Beanie Winter ${['Wool', 'Acrylic', 'Blend'][i % 3]} ${i + 1}`,
    description: "Warm winter beanie. Perfect for cold weather from fashion stores.",
    price: String(800 + (i % 4) * 100),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop`,
    stock: 8 + (i % 25),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Scarf Wool ${['Plaid', 'Solid', 'Patterned'][i % 3]} ${i + 1}`,
    description: "Luxurious wool scarf. Elegant accessory from premium stores.",
    price: String(1200 + (i % 5) * 100),
    category: "Accessories",
    image: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop`,
    stock: 4 + (i % 12),
  })),

  // Home Decor (100 products)
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Wall Art Canvas ${['Abstract', 'Nature', 'Modern'][i % 3]} ${i + 1}`,
    description: "Beautiful wall art canvas. Perfect for home decoration.",
    price: String(2500 + (i % 8) * 150),
    category: "Home Decor",
    image: `https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop`,
    stock: 3 + (i % 10),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Throw Pillow Set ${['Velvet', 'Cotton', 'Linen'][i % 3]} ${i + 1}`,
    description: "Comfortable throw pillow set. Adds style to any room.",
    price: String(1800 + (i % 6) * 120),
    category: "Home Decor",
    image: `https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop`,
    stock: 5 + (i % 15),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Table Lamp ${['Modern', 'Vintage', 'Industrial'][i % 3]} ${i + 1}`,
    description: "Stylish table lamp. Functional and decorative lighting solution.",
    price: String(2200 + (i % 7) * 150),
    category: "Home Decor",
    image: `https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop`,
    stock: 2 + (i % 8),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Area Rug ${['Persian', 'Modern', 'Vintage'][i % 3]} ${i + 1}`,
    description: "Beautiful area rug. Adds warmth and style to living spaces.",
    price: String(5500 + (i % 12) * 300),
    category: "Home Decor",
    image: `https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop`,
    stock: 1 + (i % 5),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Plant Pot Ceramic ${['Terracotta', 'White', 'Patterned'][i % 3]} ${i + 1}`,
    description: "Decorative ceramic plant pot. Perfect for indoor plants.",
    price: String(1200 + (i % 5) * 100),
    category: "Home Decor",
    image: `https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop`,
    stock: 6 + (i % 20),
  })),

  // Jewelry (100 products)
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Gold Bracelet ${['Solid', 'Link', 'Bangle'][i % 3]} ${i + 1}`,
    description: "Elegant gold bracelet. Premium jewelry piece from Nairobi stores.",
    price: String(4500 + (i % 10) * 200),
    category: "Jewelry",
    image: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop`,
    stock: 2 + (i % 8),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Silver Necklace ${['Chain', 'Pendant', 'Locket'][i % 3]} ${i + 1}`,
    description: "Beautiful silver necklace. Timeless jewelry piece.",
    price: String(3200 + (i % 8) * 150),
    category: "Jewelry",
    image: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop`,
    stock: 3 + (i % 10),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Ring Set ${['Gemstone', 'Plain', 'Vintage'][i % 3]} ${i + 1}`,
    description: "Stylish ring set. Perfect for any occasion from jewelry stores.",
    price: String(2800 + (i % 7) * 120),
    category: "Jewelry",
    image: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop`,
    stock: 4 + (i % 12),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Earrings Pearl ${['Stud', 'Drop', 'Hoop'][i % 3]} ${i + 1}`,
    description: "Elegant pearl earrings. Classic jewelry piece.",
    price: String(2200 + (i % 6) * 100),
    category: "Jewelry",
    image: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop`,
    stock: 5 + (i % 15),
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    name: `Anklet Beaded ${['Gold', 'Silver', 'Mixed'][i % 3]} ${i + 1}`,
    description: "Decorative beaded anklet. Trendy jewelry accessory.",
    price: String(1500 + (i % 5) * 100),
    category: "Jewelry",
    image: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop`,
    stock: 6 + (i % 18),
  })),

  // Watches (100 products)
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Digital Sports Watch ${['Black', 'Blue', 'Red'][i % 3]} ${i + 1}`,
    description: "Durable digital sports watch. Perfect for active lifestyle.",
    price: String(3500 + (i % 8) * 150),
    category: "Watches",
    image: `https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop`,
    stock: 4 + (i % 15),
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Analog Dress Watch ${['Silver', 'Gold', 'Rose Gold'][i % 3]} ${i + 1}`,
    description: "Elegant analog dress watch. Perfect for formal occasions.",
    price: String(4200 + (i % 10) * 200),
    category: "Watches",
    image: `https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop`,
    stock: 2 + (i % 8),
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Smartwatch ${['Pro', 'Max', 'Plus'][i % 3]} ${i + 1}`,
    description: "Advanced smartwatch with fitness tracking. Latest technology.",
    price: String(6500 + (i % 12) * 300),
    category: "Watches",
    image: `https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop`,
    stock: 3 + (i % 10),
  })),
  ...Array.from({ length: 25 }, (_, i) => ({
    name: `Vintage Mechanical Watch ${['Swiss', 'Japanese', 'Rare'][i % 3]} ${i + 1}`,
    description: "Rare vintage mechanical watch. Collector's item.",
    price: String(5800 + (i % 15) * 250),
    category: "Watches",
    image: `https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop`,
    stock: 1 + (i % 5),
  })),
];

async function seedDatabase() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log("Connected to database");

    // Get categories
    const [categories] = await connection.execute("SELECT id, name FROM categories");
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    console.log("Seeding 1000+ products...");
    let count = 0;

    for (const product of PRODUCTS_DATA) {
      const categoryId = categoryMap[product.category];
      if (!categoryId) {
        console.log(`Skipping product - category not found: ${product.category}`);
        continue;
      }

      await connection.execute(
        "INSERT INTO products (sellerId, categoryId, name, description, price, imageUrl, stock, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          (count % 5) + 1, // Distribute among 5 sellers
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
      if (count % 100 === 0) {
        console.log(`Seeded ${count} products...`);
      }
    }

    console.log(`✅ Database seeded successfully with ${count} products!`);
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
