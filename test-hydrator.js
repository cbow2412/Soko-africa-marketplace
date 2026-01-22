const axios = require('axios');
const cheerio = require('cheerio');

const PRODUCTS = [
  { id: '26197136026601508', seller: '254797629855' },
  { id: '8389180211105723', seller: '254797629855' },
  { id: '7642461339185889', seller: '254797629855' },
  { id: '7840886532632620', seller: '254797629855' },
];

async function hydrateProduct(productId, sellerPhone) {
  const url = `https://wa.me/p/${productId}/${sellerPhone}`;
  
  try {
    console.log(`\n📦 Hydrating: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    
    console.log(`   ✓ Title: ${ogTitle || 'N/A'}`);
    console.log(`   ✓ Description: ${ogDescription ? ogDescription.substring(0, 50) + '...' : 'N/A'}`);
    console.log(`   ✓ Image: ${ogImage ? 'YES' : 'NO'}`);
    
    return {
      productId,
      sellerPhone,
      title: ogTitle,
      description: ogDescription,
      imageUrl: ogImage,
      whatsappLink: url
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing Hydrator on Real WhatsApp Products\n');
  
  const results = [];
  for (const product of PRODUCTS) {
    const result = await hydrateProduct(product.id, product.seller);
    if (result) results.push(result);
  }
  
  console.log(`\n✅ Hydration Complete: ${results.length}/${PRODUCTS.length} products`);
  console.log('\n' + JSON.stringify(results, null, 2));
}

main();
