import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/football-league-simulator/', // Ändra till ditt repository-namn
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});