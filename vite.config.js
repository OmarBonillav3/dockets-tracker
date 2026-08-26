import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the built app works from any subpath — e.g. GitHub
  // Pages project sites serve from https://user.github.io/repo-name/, not
  // the domain root, and an absolute "/" base would 404 every asset there.
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  },
});
