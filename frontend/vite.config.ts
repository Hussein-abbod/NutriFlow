/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // An update waits until the user taps "Reload" in the update toast (UpdateToast).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png', 'sw-notifications.js'],
      manifest: {
        id: '/',
        name: 'NutriFlow',
        short_name: 'NutriFlow',
        description: 'Smart nutrition tracking with an AI coach',
        lang: 'en',
        categories: ['health', 'food', 'lifestyle'],
        // --brand-on-primary-container / --color-background (tokens.css)
        theme_color: '#005E2D',
        background_color: '#F8F9FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          ...[48, 72, 96, 128, 144, 152, 192, 256, 384, 512].map((size) => ({
            src: `/icons/icon-${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'any',
          })),
          ...[192, 512].map((size) => ({
            src: `/icons/icon-maskable-${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'maskable',
          })),
        ],
        shortcuts: [
          {
            name: 'Food Log',
            url: '/food-log',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Coach AI',
            url: '/coach',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // Offline app shell only: API responses are never cached by the service worker.
        globPatterns: ['**/*.{js,css,html,woff2}', 'assets/*.{png,svg}', 'favicon.png'],
        // Latin only: other Inter subsets load on demand (and fall back offline).
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: '/index.html',
        importScripts: ['sw-notifications.js'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change less often than the app: separate chunks stay cached after updates.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          data: ['@tanstack/react-query', 'zustand'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx'],
    },
  },
});
