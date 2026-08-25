import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-globe.gl', 'three'],
  },
  build: {
    // Don't eagerly preload the heavy three.js chunk; it loads only when the
    // globe is gated into view via IntersectionObserver.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !dep.includes("three-")),
    },
    commonjsOptions: {
      include: [/react-globe.gl/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'three-globe', 'react-globe.gl'],
        },
      },
    },
  },
})
