import { generateNairobiMarketData } from "./server/db-nairobi-data";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Generating static product data...");
  const products = generateNairobiMarketData(2050);
  
  const publicDir = path.join(process.cwd(), "public");
  const dataDir = path.join(publicDir, "data");
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const outputPath = path.join(dataDir, "products.json");
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
  
  console.log(`✅ Successfully generated ${products.length} products to ${outputPath}`);
}

main().catch(console.error);
