import { WhatsAppScraperV2 } from "./server/services/whatsapp-scraper-v2";

async function test() {
  const catalogLink = "https://wa.me/p/8747580032010063/254708781349";
  console.log(`Testing scraper with link: ${catalogLink}`);
  
  try {
    const products = await WhatsAppScraperV2.scrapeCatalog("254708781349", catalogLink);
    console.log("Scrape Results:");
    console.log(JSON.stringify(products, null, 2));
    
    if (products.length > 0 && !products[0].name.includes("Mock")) {
      console.log("SUCCESS: Real products found!");
    } else {
      console.log("INFO: No real products found, returned mock data.");
    }
  } catch (error) {
    console.error("Scraper Test Failed:", error);
  } finally {
    await WhatsAppScraperV2.closeBrowser();
  }
}

test();
