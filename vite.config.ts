import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Zoo Smiles — Animal Dentist',
        short_name: 'Zoo Smiles',
        description: 'Fix animal teeth at the zoo dental clinic!',
        theme_color: '#37b5e8',
        background_color: '#37b5e8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // include the connector-art (svg animals/tools + webp teeth/effects/
        // backgrounds/props) so the whole game boots offline once installed.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
  // Keep every art asset as a separate hashed file (don't base64-inline small
  // ones into the JS bundle): leaner main bundle + each asset precached once.
  build: { assetsInlineLimit: 0 },
  server: { host: true },
});
