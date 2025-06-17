import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Отключаем CSP в development режиме
    headers: {
      'Content-Security-Policy': '',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Улучшаем совместимость с CSP
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Настройки для работы с CSP
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
    // Отключаем использование eval в development
    pure: ['console.log'],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx'
      },
      // Отключаем eval для CSP
      define: {
        global: 'globalThis',
      },
    },
    // Принудительно включаем зависимости для пре-бандлинга
    include: ['react', 'react-dom', 'react-router-dom', 'antd', 'dayjs'],
  },
  // Настройки для CSP
  define: {
    global: 'globalThis',
  },
})