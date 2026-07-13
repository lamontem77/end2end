import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo at https://<owner>.github.io/end2end/,
  // so asset URLs need the repo name as a base path. Local dev is
  // unaffected — `vite` (no `build`) still serves from `/`.
  base: process.env.GITHUB_PAGES ? '/end2end/' : '/',
})
