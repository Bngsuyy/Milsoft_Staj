import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 500 kB üzerindeki tek paketler yalnızca dışa aktarma sırasında dinamik
    // yüklenen exceljs/pdfmake paketleridir; ilk yükleme yolunda yer almazlar.
    // Sınır, eager paketlerde bir gerileme olursa yine uyarı verecek seviyede.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Nadiren değişen kütüphaneler ayrı paketlere alınır; hem tek bir dev
        // chunk oluşmaz hem de uygulama kodu değiştiğinde önbellek korunur.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
            return 'vendor-react'
          }
          if (id.includes('axios')) return 'vendor-axios'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
