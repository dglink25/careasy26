import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from 'vite-plugin-prerender'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    prerender({
      // Pages statiques à pré-rendre
      staticDir: path.join(__dirname, 'dist'),
      routes: [
        '/',
        '/entreprises',
        '/services',
        '/faq',
        '/partenaires',
        '/login',
        '/register',
      ],
      // Options de rendu
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        renderAfterTime: 2000, // attendre 2s que React charge
      },
    }),
  ],
})