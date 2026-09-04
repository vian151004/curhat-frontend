import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Izinkan akses dari jaringan eksternal
    allowedHosts: [
      '.loca.lt' // Izinkan semua domain dari localtunnel
    ]
  }
})
