import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ändrat från '/football-league-simulator/' till '/' för Vercel
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});