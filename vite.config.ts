import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    proxy: {
      '/api/horizons': {
        target: 'https://ssd.jpl.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/horizons', '/api/horizons.api'),
      },
    },
  },
})
