import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this project from /the-nine-game/.
  // Keep the local development URL at / for a simpler workflow.
  base: command === 'build' ? '/the-nine-game/' : '/',
}))
