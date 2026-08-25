import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // This project sits on a Windows drive under WSL, where inotify events are
    // never delivered across the mount. Without polling, Vite never sees a save
    // and the browser keeps serving the previous version of every module.
    watch: { usePolling: true, interval: 300 },
  },
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
