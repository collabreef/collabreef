import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react-swc'


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve('src'),
    },
  },
})
