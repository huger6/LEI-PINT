import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './src/config', ['VITE_', 'SUPABASE_', 'API_']);
  const apiUrl = env.API_URL || 'http://localhost:3000';

  return {
    envDir: './src/config',
    envPrefix: ['VITE_', 'SUPABASE_', 'API_'],
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: apiUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
