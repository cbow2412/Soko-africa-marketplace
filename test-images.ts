import axios from "axios";

const images = [
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&h=1200&fit=crop&q=90",
  "https://images.unsplash.com/photo-1595777707802-221658b62e55?w=1200&h=1200&fit=crop&q=90",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=1200&fit=crop&q=90"
];

async function test() {
  for (const url of images) {
    try {
      const res = await axios.head(url);
      console.log(`URL: ${url} - Status: ${res.status}`);
    } catch (e: any) {
      console.log(`URL: ${url} - Error: ${e.message}`);
    }
  }
}

test();
