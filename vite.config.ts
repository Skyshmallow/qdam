import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    }) as PluginOption
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@store': path.resolve(__dirname, './src/store'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@ui': path.resolve(__dirname, './src/ui'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Mapbox - самая большая библиотека (отдельно)
          if (id.includes('node_modules/mapbox-gl')) {
            return 'mapbox';
          }
          
          // React ecosystem (включая react, react-dom, lucide-react и другие React-зависимости)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          
          // Three.js для 3D эффектов
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          
          // Turf.js - геометрические операции
          if (id.includes('node_modules/@turf')) {
            return 'turf';
          }
          
          // Supabase backend
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          
          // Остальные node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Увеличить лимит для больших чанков (mapbox)
    chunkSizeWarningLimit: 1000,
    
    // Минификация
    minify: 'esbuild'
  },
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') {
                atRule.remove();
              }
            }
          }
        },
      ]
    }
  }
})