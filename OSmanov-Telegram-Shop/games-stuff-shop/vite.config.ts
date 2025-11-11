import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // важно для правильных путей
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Копируем все статические файлы
    assetsInlineLimit: 0 // отключаем инлайнинг для изображений
  },
  server: {
    host: true,
    port: 5173
  }
})