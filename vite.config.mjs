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
})
