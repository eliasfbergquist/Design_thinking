import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Project site: https://eliasfbergquist.github.io/Design_thinking/
  // The dev server stays at the root, so localhost:5173/ is unchanged.
  base: command === 'build' ? '/Design_thinking/' : '/',
  server: { host: true, port: 5173 },
}))
