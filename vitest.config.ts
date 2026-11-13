import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Test delle funzioni pure (per ora quelle dell'assistente vocale, src/lib/voce).
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
