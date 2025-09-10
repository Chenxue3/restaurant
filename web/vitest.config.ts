/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      include: ['src/**/*'],
      exclude: [
        'src/hooks/**',
        'src/lib/**',
        'src/services/**',
        'src/components/ui/**',
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/types.ts',
        'src/**/constants.ts',
        'src/app/layout.tsx',
        'src/app/posts/create/**'
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}) 