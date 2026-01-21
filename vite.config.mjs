import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Force Vite to pre-bundle these dependencies for the build
    include: ['react-globe.gl', 'three'],
  },
  build: {
    commonjsOptions: {
      // Ensures sub-dependencies are handled correctly
      include: [/react-globe.gl/, /node_modules/],
    },
  },
})