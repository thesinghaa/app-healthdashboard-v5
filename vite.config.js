import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('plotly.js') || id.includes('react-plotly')) {
            return 'plotly';
          }
          if (id.includes('gsap')) {
            return 'gsap';
          }
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-') || id.includes('react-simple-maps') || id.includes('topojson')) {
            return 'charts';
          }
        },
      },
    },
  },
})
