import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return 'INVALID_URL';
    
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve(res.statusCode);
        }).on('error', (e) => {
            resolve(`ERROR: ${e.message}`);
        });
    });
}

async function runCheck() {
    console.log("Fetching images from home_page_categories...");
    const { data: categories } = await supabase.from('home_page_categories').select('name, image_url').limit(5);
    
    if (categories) {
        for (const cat of categories) {
            const status = await checkUrl(cat.image_url);
            console.log(`[Category] ${cat.name} Image: ${cat.image_url} -> HTTP Status: ${status}`);
        }
    }

    console.log("\nFetching images from products (first 5 with images)...");
    const { data: products } = await supabase.from('products').select('name, images, image_urls, image').limit(10);
    
    if (products) {
        let count = 0;
        for (const prod of products) {
            let imgUrl = null;
            if (prod.images && prod.images.length > 0) imgUrl = prod.images[0];
            else if (prod.image_urls && prod.image_urls.length > 0) imgUrl = prod.image_urls[0];
            else if (prod.image) imgUrl = prod.image;

            if (imgUrl) {
                const status = await checkUrl(imgUrl);
                console.log(`[Product] ${prod.name} Image: ${imgUrl.substring(0, 80)}... -> HTTP Status: ${status}`);
                count++;
            }
            if (count >= 5) break;
        }
    }
}

runCheck().catch(console.error);
