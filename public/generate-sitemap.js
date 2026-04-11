

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'https://careasy26.vercel.app';
const API_URL  = 'https://careasy26.alwaysdata.net'; // ← Remplacer par votre URL API

const today = new Date().toISOString().split('T')[0];

// Pages statiques
const staticPages = [
  { loc: '/',            priority: '1.0', changefreq: 'daily'   },
  { loc: '/entreprises', priority: '0.9', changefreq: 'daily'   },
  { loc: '/services',    priority: '0.9', changefreq: 'daily'   },
  { loc: '/partenaires', priority: '0.6', changefreq: 'weekly'  },
  { loc: '/faq',         priority: '0.7', changefreq: 'monthly' },
  { loc: '/login',       priority: '0.3', changefreq: 'yearly'  },
  { loc: '/register',    priority: '0.4', changefreq: 'yearly'  },
];

function urlEntry({ loc, priority, changefreq }) {
  return `
  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function generateSitemap() {
  console.log('⏳ Génération du sitemap...');

  let dynamicUrls = '';

  try {

    const resE = await fetch(`${API_URL}/api/public/entreprises`);
    const entreprises = await resE.json();

    if (Array.isArray(entreprises)) {
      entreprises.forEach(e => {
        if (e.status === 'validated' || !e.status) {
          dynamicUrls += urlEntry({
            loc: `/entreprises/${e.id}`,
            priority: '0.8',
            changefreq: 'weekly',
          });
        }
      });
      console.log(`${entreprises.length} entreprises ajoutées`);
    }

    // Récupérer les services actifs
    const resS = await fetch(`${API_URL}/api/public/services`);
    const services = await resS.json();

    if (Array.isArray(services)) {
      services.forEach(s => {
        dynamicUrls += urlEntry({
          loc: `/service/${s.id}`,
          priority: '0.8',
          changefreq: 'weekly',
        });
      });
      console.log(`${services.length} services ajoutés`);
    }
  } catch (err) {
    console.warn('API inaccessible, sitemap statique uniquement:', err.message);
  }

  const staticUrls = staticPages.map(urlEntry).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${dynamicUrls}
</urlset>`;

  fs.writeFileSync('./sitemap.xml', sitemap.trim());
  console.log(' sitemap.xml généré dans /');
}

generateSitemap();
