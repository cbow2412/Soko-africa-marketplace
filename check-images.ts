import { db } from "./server/db.ts";
import { products } from "./drizzle/schema.ts";

async function main() {
  try {
    const p = await db.select().from(products).limit(10);
    console.log("Found products:", p.length);
    p.forEach(product => {
      console.log(`ID: ${product.id}, Name: ${product.name}, Image: ${product.imageUrl}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }
}

main();
