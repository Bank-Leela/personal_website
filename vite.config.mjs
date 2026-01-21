import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-globe.gl', 'three'],
  },
  build: {
    commonjsOptions: {
      include: [/react-globe.gl/, /node_modules/],
    },
  },
})