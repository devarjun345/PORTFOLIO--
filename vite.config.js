import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on Vercel, Netlify and GitHub Pages sub-paths alike.
  base: './',
  build: { target: 'es2020' },
});
