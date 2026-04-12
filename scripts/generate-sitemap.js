import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import slugify from 'slugify';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env. Skipping sitemap generation.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const SITE_URL = 'https://bylocal.in'; // Replace with actual domain

async function generateSitemap() {
  console.log("Generating sitemap...");
  const urls = [];

  // Home Page
  urls.push({ loc: `${SITE_URL}/`, priority: 1.0, changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/search`, priority: 0.8, changefreq: 'weekly' });
  urls.push({ loc: `${SITE_URL}/trending`, priority: 0.8, changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/stores`, priority: 0.8, changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/categories`, priority: 0.8, changefreq: 'weekly' });

  // Fetch Products
  const { data: products } = await supabase.from('products').select('id, slug, updated_at');
  if (products) {
    products.forEach(p => {
      const productPath = p.slug ? p.slug : p.id;
      urls.push({
        loc: `${SITE_URL}/product/${productPath}`,
        lastmod: new Date(p.updated_at || Date.now()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8
      });
    });
  }

  // Fetch Stores
  const { data: stores } = await supabase.from('stores').select('name, created_at').eq('is_active', true);
  if (stores) {
    stores.forEach(s => {
      urls.push({
        loc: `${SITE_URL}/${encodeURIComponent(s.name)}`,
        lastmod: new Date(s.created_at || Date.now()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.9
      });
    });
  }

  // Generate Categories (distinct categories from products)
  const { data: categoriesData } = await supabase.from('products').select('category');
  if (categoriesData) {
    const categories = [...new Set(categoriesData.map(c => c.category).filter(Boolean))];
    categories.forEach(c => {
      urls.push({
        loc: `${SITE_URL}/category/${encodeURIComponent(c)}`,
        changefreq: 'weekly',
        priority: 0.8
      });
    });
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ''}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ''}${url.priority ? `    <priority>${url.priority}</priority>\n` : ''}  </url>`).join('\n')}
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
  console.log("Sitemap generated at public/sitemap.xml");

  // Generate robots.txt
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /cart
Disallow: /profile
Disallow: /orders
Disallow: /seller/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
  console.log("robots.txt generated at public/robots.txt");
}

generateSitemap().catch(err => {
  console.error("Error generating sitemap:", err);
  process.exit(1);
});
